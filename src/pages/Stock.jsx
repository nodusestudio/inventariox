import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, X, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react';
import TableContainer from '../components/TableContainer';
import ConfirmationModal from '../components/ConfirmationModal';
import ExitReasonModal from '../components/ExitReasonModal';
import { toast } from 'react-hot-toast';
import { t } from '../utils/translations';
import {
  getProducts,
  subscribeToProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  addMovement,
  getProviders
} from '../services/firebaseService';

// Función para formatear números como moneda
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function Stock({ 
  user,
  language = 'es', 
  onGoToCreateProviders = () => {}
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProviderFilter, setSelectedProviderFilter] = useState('');
  const [products, setProducts] = useState([]);
  const [listaProveedores, setListaProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmAdjust, setConfirmAdjust] = useState(null);
  const [adjustType, setAdjustType] = useState('');
  const [showExitReason, setShowExitReason] = useState(false);
  const [pendingProductId, setPendingProductId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadProvidersAndProducts = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [productsData, providersData] = await Promise.all([
        getProducts(user.uid),
        getProviders(user.uid)
      ]);
      setProducts(productsData);
      setListaProveedores(providersData);
      console.log('Proveedores cargados:', providersData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('❌ Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  // 🔥 REACTIVIDAD: Cargar productos con suscripción en tiempo real
  useEffect(() => {
    if (!user) return;

    let unsubscribeProducts;

    const setupRealtimeListeners = async () => {
      try {
        setLoading(true);
        
        // Cargar proveedores (una sola vez)
        const providersData = await getProviders(user.uid);
        setListaProveedores(providersData);

        // 🔥 Suscripción en tiempo real a productos
        unsubscribeProducts = subscribeToProducts(user.uid, (productsData) => {
          console.log('🔄 Productos actualizados en tiempo real:', productsData.length);
          setProducts(productsData);
          setLoading(false);
        });
      } catch (error) {
        console.error('Error setting up listeners:', error);
        toast.error('❌ Error al cargar los datos');
        setLoading(false);
      }
    };

    setupRealtimeListeners();

    // Cleanup: Desuscribirse al desmontar
    return () => {
      if (unsubscribeProducts) {
        console.log('📤 Desuscribiéndose de productos');
        unsubscribeProducts();
      }
    };
  }, [user]);

  // Refrescar proveedores al abrir modal
  useEffect(() => {
    const loadProviders = async () => {
      if (showModal && user) {
        const providersData = await getProviders(user.uid);
        setListaProveedores(providersData);
      }
    };
    loadProviders();
  }, [showModal, user]);

  // Formulario para nuevo producto
  const [formData, setFormData] = useState({
    nombre: '',
    proveedor: '',
    unidad: 'UNIDADES',
    costo: '',
    stockActual: '0',
    stockMinimo: '1',
    stockCompra: '10',
    frecuenciaInventario: 'ninguna'
  });

  // Filtrar datos por proveedor y búsqueda
  const filteredProducts = products.filter(product => {
    const matchProvider = selectedProviderFilter === '' || product.proveedor === selectedProviderFilter;
    const matchSearch = product.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    return matchProvider && matchSearch;
  });

  // Abrir modal para nuevo producto
  const handleAddProduct = () => {
    setFormData({
      nombre: '',
      proveedor: '',
      unidad: 'UNIDADES',
      costo: '',
      stockActual: '0',
      stockMinimo: '1',
      stockCompra: '10',
      frecuenciaInventario: 'ninguna'
    });
    setIsEditing(false);
    setEditingId(null);
    setShowModal(true);
  };

  // Editar producto
  const handleEditProduct = (product) => {
    setFormData({
      nombre: product.nombre,
      proveedor: product.proveedor,
      unidad: product.unidad,
      costo: product.costo,
      stockActual: product.stockActual?.toString() || '0',
      stockMinimo: product.stockMinimo?.toString() || '1',
      stockCompra: product.stockCompra?.toString() || '10',
      frecuenciaInventario: product.frecuenciaInventario || 'ninguna'
    });
    setIsEditing(true);
    setEditingId(product.id);
    setShowModal(true);
  };

  // Validar y guardar producto
  const handleSaveProduct = async () => {
    // Anti-duplicado: no permitir múltiples clics
    if (isSaving) return;
    
    // Validación con toast.error
    if (!formData.nombre || !formData.nombre.trim()) {
      toast.error('❌ El nombre del producto es obligatorio');
      return;
    }

    if (!formData.proveedor || !formData.proveedor.trim()) {
      toast.error('❌ El proveedor es obligatorio');
      return;
    }

    if (!formData.unidad || !formData.unidad.trim()) {
      toast.error('❌ La unidad es obligatoria');
      return;
    }

    if (formData.costo === '' || formData.costo === null || formData.costo === undefined) {
      toast.error('❌ El costo es obligatorio');
      return;
    }

    // Validar cantidades negativas
    const stockActualVal = Number(formData.stockActual) || 0;
    const stockMinimoVal = Number(formData.stockMinimo) || 1;
    const stockCompraVal = Number(formData.stockCompra) || 10;

    if (stockActualVal < 0 || stockMinimoVal < 0 || stockCompraVal < 0) {
      toast.error('❌ Las cantidades no pueden ser negativas');
      return;
    }

    if (stockActualVal < stockMinimoVal) {
      const continuar = window.confirm(
        language === 'es' 
          ? `⚠️ El stock actual (${stockActualVal}) es menor al stock mínimo (${stockMinimoVal}). ¿Deseas continuar?`
          : `⚠️ Current stock (${stockActualVal}) is less than minimum stock (${stockMinimoVal}). Continue?`
      );
      if (!continuar) return;
    }

    // 🔥 VALORES POR DEFECTO: Asegurar que campos numéricos nunca sean undefined
    const productData = {
      nombre: (formData.nombre || '').trim().toUpperCase(),
      proveedor: (formData.proveedor || '').trim().toUpperCase(),
      unidad: (formData.unidad || 'UNIDADES').trim().toUpperCase(),
      costo: Number(formData.costo) || 0,
      stockActual: Number(formData.stockActual) || 0,
      frecuenciaInventario: formData.frecuenciaInventario || 'ninguna',
      stockMinimo: Number(formData.stockMinimo) || 0,
      stockCompra: Number(formData.stockCompra) || 0
    };

    // Verificar que no haya campos undefined antes de enviar
    const hasUndefined = Object.values(productData).some(val => val === undefined);
    if (hasUndefined) {
      toast.error('❌ Error: Algunos campos tienen valores indefinidos');
      console.error('productData con undefined:', productData);
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing) {
        // Verificar que editingId sea válido antes de actualizar
        if (!editingId || editingId === undefined) {
          throw new Error('ID del producto no válido');
        }

        await updateProduct(editingId, productData);
        // Actualizar lista local
        setProducts(products.map(p => 
          p.id === editingId ? { ...p, ...productData } : p
        ));
        toast.success('✓ Producto actualizado exitosamente');
      } else {
        const newId = await addProduct(user.uid, productData);
        // Agregar al estado local
        setProducts([...products, { id: newId, ...productData }]);
        toast.success('✓ Producto creado exitosamente');
      }
      setShowModal(false);
    } catch (error) {
      console.error('Error saving product:', error);
      
      // Manejo de errores con mensajes específicos de Firebase
      if (error.message?.includes('obligatorios')) {
        toast.error('❌ ' + error.message);
      } else if (error.message?.includes('inválido') || error.message?.includes('invalid')) {
        toast.error('❌ Datos inválidos: Revisa que todos los campos estén correctos');
      } else if (error.message?.includes('undefined')) {
        toast.error('❌ Error: Algunos campos tienen valores indefinidos');
      } else if (error.message?.includes('ID del producto')) {
        toast.error('❌ ' + error.message);
      } else if (error.code === 'permission-denied') {
        toast.error('❌ No tienes permiso para realizar esta acción');
      } else if (error.code === 'not-found') {
        toast.error('❌ Producto no encontrado');
      } else {
        toast.error('❌ Error al guardar: ' + (error.message || 'Error desconocido'));
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Eliminar producto
  const handleDeleteProduct = async (id) => {
    const confirmed = window.confirm('¿Eliminar este producto? Esta acción no se puede deshacer.');
    if (!confirmed) return;
    try {
      await deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
      setConfirmDelete(null);
      toast.success('✓ Producto eliminado');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('❌ Error al eliminar el producto');
    }
  };

  // Registrar movimiento
  const registerMovement = async (productName, type, quantity, reason = '') => {
    try {
      await addMovement(user.uid, {
        productName,
        tipo: type,
        cantidad: quantity,
        motivo: type === 'salida' ? reason : ''
      });
    } catch (error) {
      console.error('Error registering movement:', error);
    }
  };

  // Ajustar stock rápidamente
  const handleQuickAdjust = (productId, type) => {
    if (type === 'salida') {
      // Mostrar modal para seleccionar motivo de salida
      setPendingProductId(productId);
      setAdjustType(type);
      setShowExitReason(true);
    } else {
      // Para entrada, ir directo al modal de cantidad
      setConfirmAdjust(productId);
      setAdjustType(type);
    }
  };

  // Procesar ajuste de stock
  const handleProcessAdjust = async (quantity, reason = '') => {
    const productToAdjust = products.find(p => p.id === confirmAdjust);
    if (!productToAdjust) return;

    const newStock = adjustType === 'entrada'
      ? productToAdjust.stockActual + quantity
      : Math.max(0, productToAdjust.stockActual - quantity);

    const updatedProduct = { ...productToAdjust, stockActual: newStock };

    try {
      // Verificar que el ID sea válido
      if (!confirmAdjust || confirmAdjust === undefined) {
        toast.error('❌ ID del producto no válido');
        return;
      }
      
      // Asegurar que newStock sea un número válido
      const stockValue = Number(newStock) || 0;
      await updateProduct(confirmAdjust, { stockActual: stockValue });
      setProducts(products.map(p => p.id === confirmAdjust ? updatedProduct : p));

      // Registrar movimiento
      await registerMovement(productToAdjust.nombre, adjustType, quantity, reason);

      setConfirmAdjust(null);
      setAdjustType('');
      toast.success(`✓ Stock ${adjustType === 'entrada' ? 'ingresado' : 'reducido'} exitosamente`);
    } catch (error) {
      console.error('Error adjusting stock:', error);
      toast.error('❌ Error al ajustar el stock');
    }
  };

  // Manejar selección de motivo de salida
  const handleExitReasonSelect = (reason) => {
    setShowExitReason(false);
    setConfirmAdjust(pendingProductId);
    setPendingProductId(null);
    // Guardar el motivo para usar en handleProcessAdjust
    setAdjustType('salida');
    // Guardar el motivo en sessionStorage temporalmente
    sessionStorage.setItem('exitReason', reason);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Columnas de la tabla
  const columns = [
    {
      key: 'nombre',
      label: language === 'es' ? 'Producto' : 'Product',
      render: (_, row) => row.nombre
    },
    {
      key: 'proveedor',
      label: language === 'es' ? 'Proveedor' : 'Provider',
      render: (_, row) => row.proveedor
    },
    {
      key: 'unidad',
      label: language === 'es' ? 'Unidad' : 'Unit',
      render: (_, row) => row.unidad
    },
    {
      key: 'costo',
      label: language === 'es' ? 'Costo Unitario' : 'Unit Cost',
      render: (value) => `$${formatCurrency(value)}`
    },
    {
      key: 'stockActual',
      label: language === 'es' ? 'Stock Actual' : 'Current Stock',
      render: (_, row) => {
        const stockActual = row.stockActual || 0;
        const stockMinimo = row.stockMinimo || 0;

        if (stockActual < stockMinimo) {
          return <span className="text-red-500 font-bold">{stockActual}</span>;
        }
        if (stockActual <= stockMinimo * 1.2) {
          return <span className="text-yellow-500 font-semibold">{stockActual}</span>;
        }
        return <span className="text-green-500 font-semibold">{stockActual}</span>;
      }
    },
    {
      key: 'stockMinimo',
      label: language === 'es' ? 'Stock Mínimo' : 'Min Stock',
      render: (_, row) => row.stockMinimo || 0
    },
    {
      key: 'valorStock',
      label: language === 'es' ? 'Valor Stock' : 'Stock Value',
      render: (_, row) => {
        const stockActual = row.stockActual || 0;
        const costo = row.costo || 0;
        const valorTotal = stockActual * costo;
        return `$${formatCurrency(valorTotal)}`;
      }
    },
    {
      key: 'acciones-rapidas',
      label: language === 'es' ? 'Acciones Rápidas' : 'Quick Actions',
      render: (_, row) => (
        <div className="flex gap-1">
          <button
            onClick={() => handleQuickAdjust(row.id, 'entrada')}
            className="p-1.5 bg-green-600 hover:bg-green-700 text-white rounded transition-colors flex items-center justify-center"
            title={language === 'es' ? 'Añadir stock' : 'Add stock'}
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleQuickAdjust(row.id, 'salida')}
            className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded transition-colors flex items-center justify-center"
            title={language === 'es' ? 'Restar stock' : 'Remove stock'}
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )
    },
    {
      key: 'acciones',
      label: language === 'es' ? 'Acciones' : 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEditProduct(row)}
            className="p-1 hover:bg-gray-700 light-mode:hover:bg-gray-200 rounded transition-colors"
          >
            <Edit2 className="w-4 h-4 text-blue-400 light-mode:text-blue-600" />
          </button>
          <button
            onClick={() => setConfirmDelete(row.id)}
            className="p-1 hover:bg-gray-700 light-mode:hover:bg-gray-200 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-400 light-mode:text-red-600" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 bg-[#111827] light-mode:bg-gray-50 min-h-screen">
      {/* Mostrar loading */}
      {loading && (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#206DDA]"></div>
        </div>
      )}

      {!loading && (
        <>
      {/* Título */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-white light-mode:text-gray-900 font-black text-xl sm:text-2xl md:text-3xl bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent mb-1 sm:mb-2">
          {language === 'es' ? 'Inventario' : 'Inventory'}
        </h1>
        <p className="text-gray-400 light-mode:text-gray-600 text-xs sm:text-sm md:text-base">
          {language === 'es' ? 'Gestiona productos y stock con acciones rápidas' : 'Manage products and stock with quick actions'}
        </p>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#206DDA] w-5 h-5 transition-all group-focus-within:text-[#1a5ab8]" />
          <input
            type="text"
            placeholder={language === 'es' ? 'Buscar producto por nombre...' : 'Search product by name...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 md:py-2.5 bg-gray-700 light-mode:bg-white border-2 border-gray-600 light-mode:border-gray-200 rounded-lg text-base md:text-sm text-white light-mode:text-gray-900 placeholder-gray-500 light-mode:placeholder-gray-400 focus:border-[#206DDA] light-mode:focus:border-[#206DDA] focus:outline-none transition-all font-medium shadow-sm group-focus-within:shadow-lg group-focus-within:shadow-blue-500/20"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200 light-mode:text-gray-500 light-mode:hover:text-gray-700 transition-colors"
              title={language === 'es' ? 'Limpiar búsqueda' : 'Clear search'}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="w-full md:w-56 relative">
          <select
            value={selectedProviderFilter}
            onChange={(e) => setSelectedProviderFilter(e.target.value)}
            className="w-full px-4 py-3 md:py-2.5 bg-gray-700 light-mode:bg-white border-2 border-gray-600 light-mode:border-gray-200 rounded-lg text-base md:text-sm text-white light-mode:text-gray-900 placeholder-gray-400 focus:border-[#206DDA] focus:outline-none transition-all appearance-none cursor-pointer shadow-sm hover:shadow-md font-medium"
          >
            <option value="">{language === 'es' ? 'Todos los proveedores' : 'All providers'}</option>
            {listaProveedores.map(provider => (
              <option key={provider.id} value={provider.nombre}>
                {provider.nombre}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleAddProduct}
          className="flex items-center justify-center md:justify-start gap-2 w-full md:w-auto px-4 md:px-6 py-3 md:py-2.5 bg-[#206DDA] hover:bg-[#1a5ab8] text-white rounded-lg font-semibold transition-all text-base md:text-sm shadow-md hover:shadow-lg hover:shadow-blue-500/30"
        >
          <Plus className="w-5 h-5" />
          {language === 'es' ? 'Nuevo Producto' : 'New Product'}
        </button>
      </div>

      {/* Indicador de resultados */}
      {(searchTerm || selectedProviderFilter) && (
        <div className="mb-4 flex items-center gap-2 text-gray-400 light-mode:text-gray-600">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">
            {language === 'es' 
              ? `${filteredProducts.length} producto${filteredProducts.length !== 1 ? 's' : ''} encontrado${filteredProducts.length !== 1 ? 's' : ''}`
              : `${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''} found`
            }
          </span>
        </div>
      )}

      {/* Tabla */}
      {filteredProducts.length > 0 ? (
        <TableContainer columns={columns} data={filteredProducts} language={language} />
      ) : (
        <div className="bg-gray-800 light-mode:bg-gray-100 rounded-lg p-12 text-center">
          <p className="text-gray-400 light-mode:text-gray-600 text-lg">
            {language === 'es' 
              ? (searchTerm || selectedProviderFilter ? 'No se encontraron productos' : 'No hay productos registrados')
              : (searchTerm || selectedProviderFilter ? 'No products found' : 'No products registered')
            }
          </p>
        </div>
      )}

      {/* Modal para agregar/editar producto */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] light-mode:bg-white rounded-lg w-full max-h-[90vh] overflow-y-auto max-w-2xl shadow-xl">
            <div className="flex justify-between items-center p-6 sticky top-0 bg-[#111827] light-mode:bg-white border-b border-gray-700 light-mode:border-gray-200">
              <h2 className="text-white light-mode:text-gray-900 font-bold text-xl">
                {isEditing 
                  ? (language === 'es' ? 'Editar Producto' : 'Edit Product')
                  : (language === 'es' ? 'Nuevo Producto' : 'New Product')
                }
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 light-mode:text-gray-700 mb-2">
                    {language === 'es' ? 'Nombre' : 'Name'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-700 light-mode:bg-gray-100 border border-gray-600 light-mode:border-gray-300 rounded-lg text-white light-mode:text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                    placeholder={language === 'es' ? 'Ej: Laptop' : 'E.g.: Laptop'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 light-mode:text-gray-700 mb-2">
                    {language === 'es' ? 'Proveedor' : 'Provider'} <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="proveedor"
                    value={formData.proveedor}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-gray-700 light-mode:bg-gray-100 border border-gray-600 light-mode:border-gray-300 rounded-lg text-white light-mode:text-gray-900 focus:border-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {loading 
                        ? (language === 'es' ? '⏳ Cargando proveedores...' : '⏳ Loading providers...') 
                        : (language === 'es' ? 'Seleccionar proveedor' : 'Select provider')}
                    </option>
                    {listaProveedores.length > 0 ? (
                      listaProveedores.map(provider => (
                        <option key={provider.id} value={provider.nombre}>
                          {provider.nombre}
                        </option>
                      ))
                    ) : (
                      !loading && <option value="" disabled>{language === 'es' ? 'No hay proveedores registrados' : 'No providers registered'}</option>
                    )}
                  </select>
                  {listaProveedores.length === 0 && (
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => onGoToCreateProviders()}
                        className="px-3 py-2 text-xs bg-[#206DDA] hover:bg-[#1a5ab8] text-white rounded-lg"
                      >
                        {language === 'es' ? 'Crear proveedor' : 'Create provider'}
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 light-mode:text-gray-700 mb-2">
                    {language === 'es' ? 'Unidad' : 'Unit'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="unidad"
                    value={formData.unidad}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-700 light-mode:bg-gray-100 border border-gray-600 light-mode:border-gray-300 rounded-lg text-white light-mode:text-gray-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 light-mode:text-gray-700 mb-2">
                    {language === 'es' ? 'Costo Unitario' : 'Unit Cost'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    name="costo"
                    value={formData.costo}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-700 light-mode:bg-gray-100 border border-gray-600 light-mode:border-gray-300 rounded-lg text-white light-mode:text-gray-900 focus:border-blue-500 focus:outline-none"
                    step="1000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 light-mode:text-gray-700 mb-2">
                    {language === 'es' ? 'Stock Actual' : 'Current Stock'}
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    name="stockActual"
                    value={formData.stockActual}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-700 light-mode:bg-gray-100 border border-gray-600 light-mode:border-gray-300 rounded-lg text-white light-mode:text-gray-900 focus:border-blue-500 focus:outline-none"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 light-mode:text-gray-700 mb-2">
                    {language === 'es' ? 'Stock Mínimo' : 'Min Stock'}
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    name="stockMinimo"
                    value={formData.stockMinimo}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-700 light-mode:bg-gray-100 border border-gray-600 light-mode:border-gray-300 rounded-lg text-white light-mode:text-gray-900 focus:border-blue-500 focus:outline-none"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 light-mode:text-gray-700 mb-2">
                    {language === 'es' ? 'Stock Objetivo' : 'Target Stock'}
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    name="stockCompra"
                    value={formData.stockCompra}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-700 light-mode:bg-gray-100 border border-gray-600 light-mode:border-gray-300 rounded-lg text-white light-mode:text-gray-900 focus:border-blue-500 focus:outline-none"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 light-mode:text-gray-700 mb-2">
                    {language === 'es' ? 'Frecuencia de Inventario' : 'Inventory Frequency'}
                  </label>
                  <select
                    name="frecuenciaInventario"
                    value={formData.frecuenciaInventario}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-700 light-mode:bg-gray-100 border border-gray-600 light-mode:border-gray-300 rounded-lg text-white light-mode:text-gray-900 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="ninguna">{language === 'es' ? 'Ninguna' : 'None'}</option>
                    <option value="diaria">{language === 'es' ? 'Diaria' : 'Daily'}</option>
                    <option value="semanal">{language === 'es' ? 'Semanal' : 'Weekly'}</option>
                  </select>
                  <p className="text-xs text-gray-400 light-mode:text-gray-500 mt-1">
                    {language === 'es' 
                      ? 'Alerta en el Dashboard si no se hace inventario según la frecuencia'
                      : 'Alert on Dashboard if inventory is not done according to frequency'}
                  </p>
                </div>              </div>
            </div>

            <div className="p-6 border-t border-gray-700 light-mode:border-gray-200 flex flex-col md:flex-row gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="w-full md:w-auto px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors font-semibold"
              >
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveProduct}
                disabled={isSaving}
                className="w-full md:w-auto px-4 py-2 bg-[#206DDA] hover:bg-[#1a5ab8] disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
              >
                {isSaving ? '⏳ Guardando...' : (language === 'es' ? 'Guardar' : 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para seleccionar motivo de salida */}
      <ExitReasonModal
        isOpen={showExitReason}
        onClose={() => {
          setShowExitReason(false);
          setPendingProductId(null);
        }}
        onConfirm={handleExitReasonSelect}
        language={language}
      />

      {/* Modal para ajuste rápido */}
      {confirmAdjust !== null && (
        <QuickAdjustModal
          isOpen={confirmAdjust !== null}
          type={adjustType}
          language={language}
          onConfirm={handleProcessAdjust}
          onCancel={() => setConfirmAdjust(null)}
        />
      )}

      {/* Modal de confirmación de eliminación */}
      <ConfirmationModal
        isOpen={confirmDelete !== null}
        title={language === 'es' ? '¿Eliminar producto?' : 'Delete product?'}
        message={language === 'es' ? '¿Estás seguro de eliminar este registro? Esta acción no se puede deshacer.' : 'Are you sure you want to delete this record? This action cannot be undone.'}
        onConfirm={() => handleDeleteProduct(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
        confirmText={language === 'es' ? 'Eliminar' : 'Delete'}
        cancelText={language === 'es' ? 'Cancelar' : 'Cancel'}
        isDangerous={true}
      />
        </>
      )}
    </div>
  );
}

// Componente modal para ajuste rápido
function QuickAdjustModal({ isOpen, type, language, onConfirm, onCancel }) {
  const [quantity, setQuantity] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    const qty = parseInt(quantity) || 0;
    if (qty > 0) {
      const reason = sessionStorage.getItem('exitReason') || '';
      sessionStorage.removeItem('exitReason');
      onConfirm(qty, reason);
      setQuantity('');
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onCancel} />
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm mx-4">
        <div className="bg-[#1f2937] light-mode:bg-white rounded-lg shadow-xl border border-gray-700 light-mode:border-gray-200 p-6">
          <h2 className="text-white light-mode:text-gray-900 font-bold text-lg mb-4">
            {type === 'entrada'
              ? (language === 'es' ? '¿Cuántas unidades ingresaron?' : 'How many units entered?')
              : (language === 'es' ? '¿Cuántas unidades salieron?' : 'How many units exited?')
            }
          </h2>

          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="1"
            className="w-full px-4 py-3 bg-gray-700 light-mode:bg-gray-100 border border-gray-600 light-mode:border-gray-300 rounded-lg text-white light-mode:text-gray-900 text-center text-2xl font-bold mb-6 focus:border-blue-500 focus:outline-none"
            placeholder="0"
            autoFocus
          />

          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-700 light-mode:bg-gray-200 hover:bg-gray-600 light-mode:hover:bg-gray-300 text-white light-mode:text-gray-900 rounded-lg font-medium transition-colors"
            >
              {language === 'es' ? 'Cancelar' : 'Cancel'}
            </button>
            <button
              onClick={handleSubmit}
              className={`px-4 py-2 rounded-lg font-medium transition-colors text-white ${
                type === 'entrada'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {language === 'es' ? 'Confirmar' : 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
