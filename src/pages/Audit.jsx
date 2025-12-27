import { useState, useEffect } from 'react';
import { ClipboardCheck, Lock, AlertTriangle, Check } from 'lucide-react';
import { subscribeToProducts, addInventoryLog, updateProduct, addMerma, getTodayInventoryLog } from '../services/firebaseService';
import { toast } from 'react-hot-toast';
import { Timestamp } from 'firebase/firestore';
import { useSettings } from '../hooks/useSettings';

export default function Audit({ language = 'es', user }) {
  const [products, setProducts] = useState([]);
  const [auditData, setAuditData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [responsable, setResponsable] = useState('');
  const [sede, setSede] = useState('direccion1'); // 'direccion1' o 'direccion2'
  const [todayInventory, setTodayInventory] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const { settings } = useSettings(user?.uid);
  const companyData = settings || {};

  // 🔥 Verificar si ya existe un cierre de hoy
  useEffect(() => {
    const checkTodayInventory = async () => {
      if (!user) return;
      
      const todayLog = await getTodayInventoryLog(user.uid);
      if (todayLog) {
        setTodayInventory(todayLog);
        setIsBlocked(true);
        toast.success('✅ Ya existe un inventario registrado para hoy');
      }
    };

    checkTodayInventory();
  }, [user]);

  // 🔥 REACTIVIDAD: Cargar productos en tiempo real
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToProducts(user.uid, (productsData) => {
      console.log('🔄 Productos cargados para inventario:', productsData.length);
      setProducts(productsData);
      
      // Inicializar auditData con stock actual
      const initialAuditData = productsData.map(p => ({
        id: p.id,
        nombre: p.nombre,
        stockSistema: p.stockActual || 0,
        conteoReal: p.stockActual || 0, // Inicialmente igual al sistema
        costo: p.costo || 0,
        unidad: p.unidad || 'UNIDADES',
        proveedor: p.proveedor || '',
        stockMinimo: p.stockMinimo || 0,
        stockCompra: p.stockCompra || 0
      }));
      setAuditData(initialAuditData);
      setLoading(false);
    });

    return () => {
      console.log('📤 Desuscribiéndose de productos (Audit)');
      unsubscribe();
    };
  }, [user]);

  // Formatear moneda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleCountChange = (productId, newCount) => {
    setAuditData(prev =>
      prev.map(item =>
        item.id === productId
          ? { ...item, conteoReal: Number(newCount) || 0 }
          : item
      )
    );
  };

  const handleFinalizarInventario = async () => {
    // Validaciones
    if (!responsable.trim()) {
      toast.error('❌ Debe ingresar el nombre del responsable');
      return;
    }
    if (!sede) {
      toast.error('❌ Debe seleccionar una sede');
      return;
    }

    try {
      setSaving(true);

      // Calcular detalle con diferencias
      const detalle = auditData.map(item => ({
        producto: item.nombre,
        stockSistema: item.stockSistema,
        conteoReal: item.conteoReal,
        diferencia: item.conteoReal - item.stockSistema,
        valorDiferencia: (item.conteoReal - item.stockSistema) * item.costo,
        unidad: item.unidad,
        costo: item.costo
      }));

      // Crear registro de inventario diario
      const sedeNombre = sede === 'direccion1' ? (companyData?.direccion || 'Sede 1') : (companyData?.direccion2 || 'Sede 2');
      
      const inventoryLog = {
        fecha_hora: Timestamp.now(),
        responsable: responsable.trim(),
        sede: sedeNombre,
        totalProductos: auditData.length,
        totalDiferencias: detalle.reduce((sum, d) => sum + Math.abs(d.diferencia), 0),
        valorTotalDiferencias: detalle.reduce((sum, d) => sum + Math.abs(d.valorDiferencia), 0),
        detalle,
        usuario: user.email
      };

      await addInventoryLog(user.uid, inventoryLog);

      // ✅ Actualizar todos los productos con el conteo real
      const updatePromises = auditData.map(item =>
        updateProduct(user.uid, item.id, {
          stockActual: item.conteoReal
        })
      );
      await Promise.all(updatePromises);

      // Crear mermas para faltantes
      const mermasPromises = detalle
        .filter(d => d.diferencia < 0)
        .map(d => {
          const mermaData = {
            producto: d.producto,
            cantidad: Math.abs(d.diferencia),
            unidad: d.unidad,
            valorPerdida: Math.abs(d.valorDiferencia),
            razon: 'Inventario Diario de Cierre',
            detalles: `Faltante detectado por ${responsable} en ${sedeNombre} (Stock Sistema: ${d.stockSistema}, Conteo Real: ${d.conteoReal})`,
            tipo: 'INVENTARIO_CIERRE',
            fecha: Timestamp.now(),
            usuario: user.email
          };
          return addMerma(user.uid, mermaData);
        });
      await Promise.all(mermasPromises);

      toast.success(`✅ Inventario de cierre registrado correctamente por ${responsable}`);
      
      // Bloquear para evitar doble registro
      setIsBlocked(true);
      setTodayInventory(inventoryLog);
      
    } catch (error) {
      console.error('Error al finalizar inventario:', error);
      toast.error('❌ Error al registrar el inventario');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#206DDA]"></div>
      </div>
    );
  }

  // Si ya está bloqueado, mostrar mensaje
  if (isBlocked && todayInventory) {
    return (
      <div className="min-h-screen bg-[#111827] light-mode:bg-gray-50 p-4 sm:p-6 lg:p-8 transition-colors duration-300">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#1f2937] light-mode:bg-white rounded-lg p-8 shadow-lg border border-gray-700 light-mode:border-gray-200 text-center">
            <Lock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white light-mode:text-gray-900 mb-2">
              Inventario de Cierre Ya Registrado
            </h2>
            <p className="text-gray-400 light-mode:text-gray-600 mb-4">
              Ya se ha realizado el inventario de cierre para el día de hoy.
            </p>
            <div className="bg-[#374151] light-mode:bg-gray-100 rounded-lg p-4 mt-4">
              <p className="text-sm text-gray-300 light-mode:text-gray-700">
                <strong>Responsable:</strong> {todayInventory.responsable}
              </p>
              <p className="text-sm text-gray-300 light-mode:text-gray-700">
                <strong>Sede:</strong> {todayInventory.sede}
              </p>
              <p className="text-sm text-gray-300 light-mode:text-gray-700">
                <strong>Hora:</strong> {todayInventory.fecha_hora?.toDate().toLocaleString('es-CL')}
              </p>
              <p className="text-sm text-gray-300 light-mode:text-gray-700">
                <strong>Total Productos:</strong> {todayInventory.totalProductos}
              </p>
            </div>
            <p className="text-xs text-gray-500 light-mode:text-gray-500 mt-4">
              El inventario de cierre puede realizarse una vez por día.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Calcular totales para mostrar en la tabla
  const calculateTotals = () => {
    let totalFaltantes = 0;
    let totalSobrantes = 0;
    let valorFaltantes = 0;
    let valorSobrantes = 0;

    auditData.forEach(item => {
      const diferencia = item.conteoReal - item.stockSistema;
      const valorDiferencia = diferencia * item.costo;
      
      if (diferencia < 0) {
        totalFaltantes += Math.abs(diferencia);
        valorFaltantes += Math.abs(valorDiferencia);
      } else if (diferencia > 0) {
        totalSobrantes += diferencia;
        valorSobrantes += valorDiferencia;
      }
    });

    return { totalFaltantes, totalSobrantes, valorFaltantes, valorSobrantes };
  };

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-[#111827] light-mode:bg-gray-50 p-4 sm:p-6 lg:p-8 transition-colors duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="w-8 h-8 text-[#206DDA]" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white light-mode:text-gray-900">
              Inventario Diario de Cierre
            </h1>
            <p className="text-sm text-gray-400 light-mode:text-gray-600">
              Conteo físico diario y cuadre de stock
            </p>
          </div>
        </div>
      </div>

      {/* Encabezado: Responsable y Sede */}
      <div className="bg-[#1f2937] light-mode:bg-white rounded-lg p-6 mb-6 shadow-lg border border-gray-700 light-mode:border-gray-200">
        <h2 className="text-lg font-bold text-white light-mode:text-gray-900 mb-4">
          📋 Datos del Inventario
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 light-mode:text-gray-700 mb-2">
              Responsable *
            </label>
            <input
              type="text"
              value={responsable}
              onChange={(e) => setResponsable(e.target.value)}
              placeholder="Nombre completo del responsable"
              className="w-full px-4 py-2 bg-[#374151] light-mode:bg-gray-50 text-white light-mode:text-gray-900 rounded-lg border border-gray-600 light-mode:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#206DDA]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 light-mode:text-gray-700 mb-2">
              Sede *
            </label>
            <select
              value={sede}
              onChange={(e) => setSede(e.target.value)}
              className="w-full px-4 py-2 bg-[#374151] light-mode:bg-gray-50 text-white light-mode:text-gray-900 rounded-lg border border-gray-600 light-mode:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#206DDA]"
            >
              <option value="direccion1">{companyData?.direccion || 'Sede 1'}</option>
              {companyData?.direccion2 && (
                <option value="direccion2">{companyData.direccion2}</option>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Resumen de Diferencias */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#1f2937] light-mode:bg-white rounded-lg p-4 shadow-lg border border-gray-700 light-mode:border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-gray-400 light-mode:text-gray-600">Faltantes</p>
          </div>
          <p className="text-2xl font-bold text-white light-mode:text-gray-900">
            {totals.totalFaltantes.toFixed(1)}
          </p>
          <p className="text-xs text-red-400 light-mode:text-red-600">
            ${formatCurrency(totals.valorFaltantes)}
          </p>
        </div>

        <div className="bg-[#1f2937] light-mode:bg-white rounded-lg p-4 shadow-lg border border-gray-700 light-mode:border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Check className="w-5 h-5 text-green-500" />
            <p className="text-sm text-gray-400 light-mode:text-gray-600">Sobrantes</p>
          </div>
          <p className="text-2xl font-bold text-white light-mode:text-gray-900">
            {totals.totalSobrantes.toFixed(1)}
          </p>
          <p className="text-xs text-green-400 light-mode:text-green-600">
            ${formatCurrency(totals.valorSobrantes)}
          </p>
        </div>

        <div className="bg-[#1f2937] light-mode:bg-white rounded-lg p-4 shadow-lg border border-gray-700 light-mode:border-gray-200">
          <p className="text-sm text-gray-400 light-mode:text-gray-600 mb-2">Total Productos</p>
          <p className="text-2xl font-bold text-white light-mode:text-gray-900">
            {auditData.length}
          </p>
        </div>

        <div className="bg-[#1f2937] light-mode:bg-white rounded-lg p-4 shadow-lg border border-gray-700 light-mode:border-gray-200">
          <p className="text-sm text-gray-400 light-mode:text-gray-600 mb-2">Diferencia Neta</p>
          <p className={`text-2xl font-bold ${
            totals.valorSobrantes - totals.valorFaltantes >= 0 
              ? 'text-green-400 light-mode:text-green-600' 
              : 'text-red-400 light-mode:text-red-600'
          }`}>
            ${formatCurrency(totals.valorSobrantes - totals.valorFaltantes)}
          </p>
        </div>
      </div>

      {/* Tabla de Inventario */}
      <div className="bg-[#1f2937] light-mode:bg-white rounded-lg shadow-lg border border-gray-700 light-mode:border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#374151] light-mode:bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 light-mode:text-gray-700 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 light-mode:text-gray-700 uppercase tracking-wider">
                  Stock Sistema
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 light-mode:text-gray-700 uppercase tracking-wider">
                  Conteo Real
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 light-mode:text-gray-700 uppercase tracking-wider">
                  Diferencia
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 light-mode:text-gray-700 uppercase tracking-wider">
                  Valor Diferencia
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700 light-mode:divide-gray-200">
              {auditData.map((item) => {
                const diferencia = item.conteoReal - item.stockSistema;
                const valorDiferencia = diferencia * item.costo;
                
                return (
                  <tr key={item.id} className="hover:bg-[#374151] light-mode:hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-white light-mode:text-gray-900">
                      <div>
                        <p className="font-medium">{item.nombre}</p>
                        <p className="text-xs text-gray-400 light-mode:text-gray-500">
                          {item.unidad}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-300 light-mode:text-gray-700">
                      {item.stockSistema.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        step="0.1"
                        value={item.conteoReal}
                        onChange={(e) => handleCountChange(item.id, e.target.value)}
                        className="w-24 px-2 py-1 bg-[#374151] light-mode:bg-gray-50 text-white light-mode:text-gray-900 rounded border border-gray-600 light-mode:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#206DDA] text-center"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        diferencia === 0 
                          ? 'bg-gray-600 light-mode:bg-gray-200 text-gray-300 light-mode:text-gray-700'
                          : diferencia > 0
                          ? 'bg-green-900/50 light-mode:bg-green-100 text-green-400 light-mode:text-green-700'
                          : 'bg-red-900/50 light-mode:bg-red-100 text-red-400 light-mode:text-red-700'
                      }`}>
                        {diferencia > 0 ? '+' : ''}{diferencia.toFixed(1)}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-right text-sm font-medium ${
                      valorDiferencia === 0 
                        ? 'text-gray-400 light-mode:text-gray-600'
                        : valorDiferencia > 0
                        ? 'text-green-400 light-mode:text-green-600'
                        : 'text-red-400 light-mode:text-red-600'
                    }`}>
                      ${formatCurrency(Math.abs(valorDiferencia))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Botón de Finalizar */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleFinalizarInventario}
          disabled={saving || !responsable.trim()}
          className={`px-8 py-3 rounded-lg font-semibold text-white transition-all ${
            saving || !responsable.trim()
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-[#206DDA] hover:bg-[#1557b0] shadow-lg hover:shadow-xl'
          }`}
        >
          {saving ? 'Registrando...' : '✅ Finalizar y Registrar Cierre'}
        </button>
      </div>

      <p className="text-xs text-gray-500 light-mode:text-gray-500 text-center mt-4">
        * Todos los campos son obligatorios. El inventario se registrará una sola vez por día.
      </p>
    </div>
  );
}
