import { useState, useEffect } from 'react';
import { ClipboardCheck, Save, AlertCircle, CheckCircle, TrendingDown, DollarSign } from 'lucide-react';
import { subscribeToProducts, addAuditLog, updateProduct, addMerma, addMovement } from '../services/firebaseService';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '../components/ConfirmationModal';

export default function Audit({ language = 'es', user }) {
  const [products, setProducts] = useState([]);
  const [auditData, setAuditData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employeeName, setEmployeeName] = useState('');
  const [auditType, setAuditType] = useState('diario'); // 'diario', 'semanal', 'mensual'
  const [confirmClose, setConfirmClose] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // 🔥 REACTIVIDAD: Cargar productos en tiempo real
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToProducts(user.uid, (productsData) => {
      console.log('🔄 Productos cargados para auditoría:', productsData.length);
      setProducts(productsData);
      
      // Inicializar auditData con stock actual
      const initialAuditData = productsData.map(p => ({
        id: p.id,
        nombre: p.nombre,
        stockSistema: p.stockActual || 0,
        stockFisico: p.stockActual || 0, // Inicialmente igual al sistema
        costo: p.costo || 0,
        unidad: p.unidad || 'UNIDADES'
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

  // Actualizar stock físico
  const handleStockChange = (productId, newStockFisico) => {
    setAuditData(prev => prev.map(item => 
      item.id === productId 
        ? { ...item, stockFisico: Number(newStockFisico) || 0 }
        : item
    ));
  };

  // 🔥 LÓGICA DE CUADRE: Calcular diferencia y valor monetario
  const calculateDifference = (item) => {
    const diferencia = item.stockFisico - item.stockSistema;
    const valorMonetario = diferencia * item.costo;
    
    return {
      diferencia,
      valorMonetario,
      tipo: diferencia === 0 ? 'correcto' : diferencia > 0 ? 'sobrante' : 'faltante'
    };
  };

  // Calcular totales
  const calculateTotals = () => {
    let totalFaltantes = 0;
    let totalSobrantes = 0;
    let valorFaltantes = 0;
    let valorSobrantes = 0;

    auditData.forEach(item => {
      const { diferencia, valorMonetario } = calculateDifference(item);
      
      if (diferencia < 0) {
        totalFaltantes += Math.abs(diferencia);
        valorFaltantes += Math.abs(valorMonetario);
      } else if (diferencia > 0) {
        totalSobrantes += diferencia;
        valorSobrantes += valorMonetario;
      }
    });

    return { totalFaltantes, totalSobrantes, valorFaltantes, valorSobrantes };
  };

  // 🔥 CIERRE DE INVENTARIO: handleCloseAudit
  const handleCloseAudit = async () => {
    if (!employeeName.trim()) {
      toast.error('❌ Debes ingresar el nombre del empleado');
      return;
    }

    setIsClosing(true);
    try {
      const totals = calculateTotals();
      const now = new Date();

      // 1️⃣ Registrar fecha, hora exacta y nombre del empleado en audit_logs
      const auditLogData = {
        employeeName: employeeName.trim(),
        auditType: auditType,
        fecha: now.toISOString().split('T')[0],
        hora: now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        timestamp: now.toISOString(),
        items: auditData.map(item => ({
          ...item,
          ...calculateDifference(item)
        })),
        totals: {
          totalFaltantes: totals.totalFaltantes,
          totalSobrantes: totals.totalSobrantes,
          valorFaltantes: totals.valorFaltantes,
          valorSobrantes: totals.valorSobrantes
        }
      };

      const auditLogId = await addAuditLog(user.uid, auditLogData);
      console.log('✅ Audit log creado:', auditLogId);

      // 2️⃣ Actualizar stock en products y generar movimientos/mermas
      const updatePromises = auditData.map(async (item) => {
        const { diferencia, tipo } = calculateDifference(item);

        if (diferencia !== 0) {
          // Actualizar stock en products para que coincida con conteo físico
          await updateProduct(item.id, { 
            stockActual: item.stockFisico,
            nombre: item.nombre,
            proveedor: products.find(p => p.id === item.id)?.proveedor || '',
            unidad: item.unidad,
            costo: item.costo,
            stockMinimo: products.find(p => p.id === item.id)?.stockMinimo || 0,
            stockCompra: products.find(p => p.id === item.id)?.stockCompra || 0
          });

          // 3️⃣ Si hubo faltantes, registrar en mermas
          if (tipo === 'faltante') {
            await addMerma(user.uid, {
              productoId: item.id,
              productoNombre: item.nombre,
              cantidad: Math.abs(diferencia),
              motivo: 'Ajuste por auditoría',
              observaciones: `Auditoría ${auditType} realizada por ${employeeName}. Diferencia detectada: ${diferencia}`,
              costo: item.costo,
              valorTotal: Math.abs(diferencia * item.costo),
              fecha: now.toISOString().split('T')[0]
            });
          }

          // Registrar movimiento de ajuste
          await addMovement(user.uid, {
            tipo: 'Ajuste',
            productoId: item.id,
            productoNombre: item.nombre,
            cantidad: Math.abs(diferencia),
            stockAnterior: item.stockSistema,
            stockNuevo: item.stockFisico,
            motivo: tipo === 'faltante' ? 'Ajuste negativo por auditoría' : 'Ajuste positivo por auditoría',
            empleado: employeeName,
            auditLogId: auditLogId
          });
        }
      });

      await Promise.all(updatePromises);

      toast.success('✅ Auditoría cerrada exitosamente');
      setConfirmClose(false);
      setEmployeeName('');
      
    } catch (error) {
      console.error('Error closing audit:', error);
      toast.error('❌ Error al cerrar la auditoría: ' + (error.message || 'Error desconocido'));
    } finally {
      setIsClosing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#206DDA]"></div>
      </div>
    );
  }

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-[#111827] light-mode:bg-gray-50 p-4 sm:p-6 lg:p-8 transition-colors duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="w-8 h-8 text-[#206DDA]" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white light-mode:text-gray-900">
              Auditoría de Inventario
            </h1>
            <p className="text-sm text-gray-400 light-mode:text-gray-600">
              Conteo físico y cuadre de stock
            </p>
          </div>
        </div>
      </div>

      {/* Configuración de auditoría */}
      <div className="bg-[#1f2937] light-mode:bg-white rounded-lg p-6 mb-6 shadow-lg border border-gray-700 light-mode:border-gray-200">
        <h2 className="text-lg font-bold text-white light-mode:text-gray-900 mb-4">
          Configuración
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 light-mode:text-gray-700 mb-2">
              Tipo de Auditoría
            </label>
            <select
              value={auditType}
              onChange={(e) => setAuditType(e.target.value)}
              className="w-full bg-[#111827] light-mode:bg-gray-50 text-white light-mode:text-gray-900 border border-gray-600 light-mode:border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#206DDA]"
            >
              <option value="diario">Diario</option>
              <option value="semanal">Semanal</option>
              <option value="mensual">Mensual</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 light-mode:text-gray-700 mb-2">
              Nombre del Empleado *
            </label>
            <input
              type="text"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              placeholder="Ej: Juan Pérez"
              className="w-full bg-[#111827] light-mode:bg-gray-50 text-white light-mode:text-gray-900 border border-gray-600 light-mode:border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#206DDA]"
            />
          </div>
        </div>
      </div>

      {/* Resumen de diferencias */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-red-400" />
            <p className="text-sm font-medium text-red-400">Faltantes</p>
          </div>
          <p className="text-2xl font-bold text-red-300">{totals.totalFaltantes}</p>
          <p className="text-xs text-red-400 mt-1">${formatCurrency(totals.valorFaltantes)}</p>
        </div>

        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <p className="text-sm font-medium text-green-400">Sobrantes</p>
          </div>
          <p className="text-2xl font-bold text-green-300">{totals.totalSobrantes}</p>
          <p className="text-xs text-green-400 mt-1">${formatCurrency(totals.valorSobrantes)}</p>
        </div>

        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-blue-400" />
            <p className="text-sm font-medium text-blue-400">Diferencia Neta</p>
          </div>
          <p className={`text-2xl font-bold ${totals.valorSobrantes - totals.valorFaltantes >= 0 ? 'text-green-300' : 'text-red-300'}`}>
            ${formatCurrency(totals.valorSobrantes - totals.valorFaltantes)}
          </p>
        </div>

        <div className="bg-[#1f2937] light-mode:bg-white border border-gray-700 light-mode:border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            <p className="text-sm font-medium text-gray-300 light-mode:text-gray-700">Productos con Diferencia</p>
          </div>
          <p className="text-2xl font-bold text-white light-mode:text-gray-900">
            {auditData.filter(item => calculateDifference(item).diferencia !== 0).length}
          </p>
        </div>
      </div>

      {/* Tabla de auditoría */}
      <div className="bg-[#1f2937] light-mode:bg-white rounded-lg shadow-lg border border-gray-700 light-mode:border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#111827] light-mode:bg-gray-100 border-b border-gray-700 light-mode:border-gray-300">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-300 light-mode:text-gray-700 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-300 light-mode:text-gray-700 uppercase tracking-wider">
                  Stock Sistema
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-300 light-mode:text-gray-700 uppercase tracking-wider">
                  Stock Físico
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-300 light-mode:text-gray-700 uppercase tracking-wider">
                  Diferencia
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-300 light-mode:text-gray-700 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-300 light-mode:text-gray-700 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700 light-mode:divide-gray-200">
              {auditData.map((item) => {
                const { diferencia, valorMonetario, tipo } = calculateDifference(item);
                
                return (
                  <tr key={item.id} className="hover:bg-[#111827] light-mode:hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-white light-mode:text-gray-900 font-medium">
                      {item.nombre}
                      <br />
                      <span className="text-xs text-gray-400 light-mode:text-gray-600">
                        ${formatCurrency(item.costo)} / {item.unidad.toLowerCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-gray-300 light-mode:text-gray-700">
                      {item.stockSistema}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <input
                        type="number"
                        inputMode="numeric"
                        value={item.stockFisico}
                        onChange={(e) => handleStockChange(item.id, e.target.value)}
                        className="w-20 bg-[#111827] light-mode:bg-gray-50 text-white light-mode:text-gray-900 border border-gray-600 light-mode:border-gray-300 rounded px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-[#206DDA]"
                      />
                    </td>
                    <td className={`px-4 py-3 text-sm text-center font-bold ${
                      diferencia === 0 ? 'text-gray-400' : diferencia > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {diferencia > 0 ? '+' : ''}{diferencia}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right font-bold ${
                      valorMonetario === 0 ? 'text-gray-400' : valorMonetario > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {valorMonetario > 0 ? '+' : ''}${formatCurrency(valorMonetario)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {tipo === 'correcto' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-900/30 text-green-400 text-xs font-medium rounded">
                          <CheckCircle className="w-3 h-3" />
                          OK
                        </span>
                      )}
                      {tipo === 'faltante' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-900/30 text-red-400 text-xs font-medium rounded">
                          <TrendingDown className="w-3 h-3" />
                          Faltante
                        </span>
                      )}
                      {tipo === 'sobrante' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-900/30 text-green-400 text-xs font-medium rounded">
                          ↑ Sobrante
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Botón de cierre */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={() => setConfirmClose(true)}
          disabled={!employeeName.trim() || isClosing}
          className="flex items-center gap-2 bg-[#206DDA] hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-bold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />
          {isClosing ? 'Cerrando...' : 'Cerrar Auditoría'}
        </button>
      </div>

      {/* Modal de confirmación */}
      <ConfirmationModal
        isOpen={confirmClose}
        title="¿Cerrar auditoría?"
        message={`Se actualizará el stock de ${auditData.filter(item => calculateDifference(item).diferencia !== 0).length} productos y se registrarán ${totals.totalFaltantes > 0 ? 'las mermas detectadas' : 'los ajustes'}. Esta acción no se puede deshacer.`}
        onConfirm={handleCloseAudit}
        onCancel={() => setConfirmClose(false)}
        confirmText="Cerrar Auditoría"
        cancelText="Cancelar"
        isDangerous={false}
      />
    </div>
  );
}
