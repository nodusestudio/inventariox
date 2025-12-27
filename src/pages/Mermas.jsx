import { useState, useEffect } from 'react';
import { Plus, X, Trash2, AlertCircle, TrendingDown } from 'lucide-react';
import { getMermas, addMerma, deleteMerma, getProducts, updateProduct } from '../services/firebaseService';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '../components/ConfirmationModal';

export default function Mermas({ language = 'es', user }) {
  const [mermas, setMermas] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [formData, setFormData] = useState({
    productoId: '',
    productoNombre: '',
    cantidad: 1,
    motivo: '',
    observaciones: '',
    costo: 0
  });

  const motivos = [
    'Vencimiento',
    'Daño físico',
    'Error de preparación',
    'Contaminación',
    'Robo',
    'Otro'
  ];

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [mermasData, productsData] = await Promise.all([
        getMermas(user.uid),
        getProducts(user.uid)
      ]);
      setMermas(mermasData);
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('❌ Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleProductChange = (e) => {
    const productId = e.target.value;
    const product = products.find(p => p.id === productId);
    if (product) {
      setFormData({
        ...formData,
        productoId: productId,
        productoNombre: product.nombre,
        costo: product.costo || 0
      });
    }
  };

  const handleAddMerma = async () => {
    if (!formData.productoId || !formData.cantidad || !formData.motivo) {
      toast.error('❌ Completa todos los campos');
      return;
    }

    // Validar que si el motivo es 'Otro', se haya ingresado observaciones
    if (formData.motivo === 'Otro' && !formData.observaciones.trim()) {
      toast.error('❌ Debes especificar las observaciones para motivo "Otro"');
      return;
    }

    const product = products.find(p => p.id === formData.productoId);
    if (!product) {
      toast.error('❌ Producto no encontrado');
      return;
    }

    if (formData.cantidad > product.stockActual) {
      toast.error('❌ La cantidad de merma excede el stock actual');
      return;
    }

    try {
      // Crear merma
      const newMerma = {
        productoId: formData.productoId,
        productoNombre: formData.productoNombre,
        cantidad: parseInt(formData.cantidad),
        motivo: formData.motivo,
        observaciones: formData.observaciones || '',
        costo: formData.costo,
        valorTotal: formData.costo * parseInt(formData.cantidad),
        fecha: new Date().toISOString().split('T')[0]
      };
      const mermaId = await addMerma(user.uid, newMerma);

      // Actualizar stock del producto (restar)
      const newStock = product.stockActual - parseInt(formData.cantidad);
      await updateProduct(formData.productoId, { stockActual: newStock });

      // Actualizar UI
      setMermas([{ id: mermaId, ...newMerma }, ...mermas]);
      setProducts(products.map(p => 
        p.id === formData.productoId 
          ? { ...p, stockActual: newStock }
          : p
      ));

      setFormData({
        productoId: '',
        productoNombre: '',
        cantidad: 1,
        motivo: '',
        observaciones: '',
        costo: 0
      });
      setIsAdding(false);
      toast.success('✓ Merma registrada y stock actualizado');
    } catch (error) {
      console.error('Error adding merma:', error);
      toast.error('❌ Error al registrar merma');
    }
  };

  const handleDeleteMerma = async (mermaId) => {
    try {
      await deleteMerma(mermaId);
      setMermas(mermas.filter(m => m.id !== mermaId));
      toast.success('✓ Merma eliminada');
    } catch (error) {
      console.error('Error deleting merma:', error);
      toast.error('❌ Error al eliminar merma');
    } finally {
      setConfirmDelete(null);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-CL', { 
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const totalPerdidas = mermas.reduce((sum, m) => sum + (m.valorTotal || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#206DDA]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111827] light-mode:bg-gray-50 p-4 sm:p-6 lg:p-8 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        {/* Encabezado */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-white light-mode:text-gray-900 mb-2">
            Mermas (Pérdidas)
          </h1>
          <p className="text-gray-400 light-mode:text-gray-600">
            Registro de productos dañados o vencidos
          </p>
        </div>

        {/* Resumen */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#1f2937] light-mode:bg-white rounded-lg border border-gray-700 light-mode:border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingDown className="w-6 h-6 text-red-400" />
              <p className="text-sm text-gray-400 light-mode:text-gray-600 font-bold uppercase">Total Mermas</p>
            </div>
            <p className="text-3xl font-black text-white light-mode:text-gray-900">{mermas.length}</p>
          </div>
          <div className="bg-[#1f2937] light-mode:bg-white rounded-lg border border-gray-700 light-mode:border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-6 h-6 text-yellow-400" />
              <p className="text-sm text-gray-400 light-mode:text-gray-600 font-bold uppercase">Valor Perdido</p>
            </div>
            <p className="text-3xl font-black text-red-400">${formatCurrency(totalPerdidas)}</p>
          </div>
          <div className="flex items-center justify-center">
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 px-6 py-3 bg-[#206DDA] hover:bg-blue-600 text-white rounded-lg font-semibold transition-all shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Registrar Merma
            </button>
          </div>
        </div>

        {/* Formulario Agregar Merma */}
        {isAdding && (
          <div className="mb-8 bg-[#1f2937] light-mode:bg-white rounded-lg border border-gray-700 light-mode:border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white light-mode:text-gray-900">Registrar Nueva Merma</h2>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setFormData({ productoId: '', productoNombre: '', cantidad: 1, motivo: '', observaciones: '', costo: 0 });
                }}
                className="p-2 hover:bg-gray-700 light-mode:hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400 light-mode:text-gray-600" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Producto */}
              <div>
                <label className="block text-sm font-bold text-gray-300 light-mode:text-gray-700 mb-3 uppercase tracking-wide">
                  Producto
                </label>
                <select
                  value={formData.productoId}
                  onChange={handleProductChange}
                  className="w-full px-4 py-3 bg-[#111827] light-mode:bg-gray-50 border-2 border-gray-600 light-mode:border-gray-300 rounded-lg text-white light-mode:text-gray-900 font-semibold focus:border-[#206DDA] focus:outline-none"
                >
                  <option value="">-- Selecciona un producto --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} (Stock: {p.stockActual || 0})
                    </option>
                  ))}
                </select>
              </div>

              {/* Cantidad */}
              <div>
                <label className="block text-sm font-bold text-gray-300 light-mode:text-gray-700 mb-3 uppercase tracking-wide">
                  Cantidad
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  value={formData.cantidad}
                  onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                  className="w-full px-4 py-3 bg-[#111827] light-mode:bg-gray-50 border-2 border-gray-600 light-mode:border-gray-300 rounded-lg text-white light-mode:text-gray-900 font-semibold focus:border-[#206DDA] focus:outline-none"
                  placeholder="Ej: 5"
                />
              </div>

              {/* Motivo */}
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-300 light-mode:text-gray-700 mb-3 uppercase tracking-wide">
                  Motivo de la Pérdida
                </label>
                <select
                  value={formData.motivo}
                  onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                  className="w-full px-4 py-3 bg-[#111827] light-mode:bg-gray-50 border-2 border-gray-600 light-mode:border-gray-300 rounded-lg text-white light-mode:text-gray-900 font-semibold focus:border-[#206DDA] focus:outline-none"
                >
                  <option value="">-- Selecciona el motivo --</option>
                  {motivos.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Observaciones (solo si motivo es 'Otro') */}
              {formData.motivo === 'Otro' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-300 light-mode:text-gray-700 mb-3 uppercase tracking-wide">
                    Observaciones *
                  </label>
                  <textarea
                    value={formData.observaciones}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    rows="3"
                    className="w-full px-4 py-3 bg-[#111827] light-mode:bg-gray-50 border-2 border-gray-600 light-mode:border-gray-300 rounded-lg text-white light-mode:text-gray-900 font-semibold focus:border-[#206DDA] focus:outline-none resize-none"
                    placeholder="Describe detalladamente qué sucedió con el producto..."
                  />
                  <p className="text-xs text-gray-400 light-mode:text-gray-600 mt-2">
                    Esta información se guardará en los registros y aparecerá en los reportes
                  </p>
                </div>
              )}

              {/* Botones */}
              <div className="md:col-span-2 flex gap-4">
                <button
                  onClick={handleAddMerma}
                  className="flex-1 px-6 py-3 bg-[#206DDA] hover:bg-blue-600 text-white font-bold rounded-lg transition-all shadow-lg"
                >
                  Registrar Merma
                </button>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setFormData({ productoId: '', productoNombre: '', cantidad: 1, motivo: '', costo: 0 });
                  }}
                  className="flex-1 px-6 py-3 bg-gray-700 light-mode:bg-gray-300 hover:bg-gray-600 light-mode:hover:bg-gray-400 text-white light-mode:text-gray-900 font-bold rounded-lg transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Listado de Mermas */}
        {mermas.length > 0 ? (
          <div className="bg-[#1f2937] light-mode:bg-white rounded-lg border border-gray-700 light-mode:border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#111827] light-mode:bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 light-mode:text-gray-600 uppercase tracking-wide">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 light-mode:text-gray-600 uppercase tracking-wide">
                      Producto
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 light-mode:text-gray-600 uppercase tracking-wide">
                      Cantidad
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 light-mode:text-gray-600 uppercase tracking-wide">
                      Motivo
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-400 light-mode:text-gray-600 uppercase tracking-wide">
                      Valor
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 light-mode:text-gray-600 uppercase tracking-wide">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700 light-mode:divide-gray-200">
                  {mermas.map(merma => (
                    <tr key={merma.id} className="hover:bg-[#111827] light-mode:hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-300 light-mode:text-gray-700">
                        {formatDate(merma.fecha)}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-white light-mode:text-gray-900">
                        {merma.productoNombre}
                      </td>
                      <td className="px-4 py-3 text-sm text-center font-bold text-red-400">
                        {merma.cantidad}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300 light-mode:text-gray-700">
                        <span className="px-2 py-1 bg-orange-900/30 text-orange-400 border border-orange-500/50 rounded text-xs font-semibold">
                          {merma.motivo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-red-400">
                        ${formatCurrency(merma.valorTotal)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setConfirmDelete(merma.id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Eliminar merma"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-[#1f2937] light-mode:bg-white rounded-lg border-2 border-dashed border-gray-700 light-mode:border-gray-300">
            <TrendingDown className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 light-mode:text-gray-600 text-lg">
              No hay mermas registradas
            </p>
          </div>
        )}

        {/* Modal de confirmación */}
        <ConfirmationModal
          isOpen={confirmDelete !== null}
          title="¿Eliminar esta merma?"
          message="Esta acción no se puede deshacer. El stock del producto no se restaurará."
          onConfirm={() => handleDeleteMerma(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
          confirmText="Eliminar"
          cancelText="Cancelar"
          isDangerous={true}
        />
      </div>
    </div>
  );
}
