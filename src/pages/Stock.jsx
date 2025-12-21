import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, X, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react';
import TableContainer from '../components/TableContainer';
import ConfirmationModal from '../components/ConfirmationModal';
import { t } from '../utils/translations';

// Función para formatear números como moneda
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function Stock({ 
  productsData: initialProducts = [], 
  stockData = [], 
  setStockData = () => {}, 
  language = 'es', 
  providers = [],
  setProductsData = () => {}
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProviderFilter, setSelectedProviderFilter] = useState('');
  const [localProducts, setLocalProducts] = useState(initialProducts);
  const [localStockData, setLocalStockData] = useState(stockData);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmAdjust, setConfirmAdjust] = useState(null);
  const [adjustType, setAdjustType] = useState(''); // 'entrada' o 'salida'

  // Formulario para nuevo producto
  const [formData, setFormData] = useState({
    nombre: '',
    proveedor: '',
    unidad: 'UNIDADES',
    costo: '',
    stockActual: '0',
    stockMinimo: '1',
    stockCompra: '10'
  });

  // Filtrar datos por proveedor y búsqueda
  const filteredProducts = localProducts.filter(product => {
    const matchProvider = selectedProviderFilter === '' || product.proveedor === selectedProviderFilter;
    const matchSearch = product.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    return matchProvider && matchSearch;
  });

  // Obtener información de stock de un producto
  const getStockInfo = (productId) => {
    return localStockData.find(s => s.productoId === productId);
  };

  // Abrir modal para nuevo producto
  const handleAddProduct = () => {
    setFormData({
      nombre: '',
      proveedor: '',
      unidad: 'UNIDADES',
      costo: '',
      stockActual: '0',
      stockMinimo: '1',
      stockCompra: '10'
    });
    setIsEditing(false);
    setEditingId(null);
    setShowModal(true);
  };

  // Editar producto
  const handleEditProduct = (product) => {
    const stockInfo = getStockInfo(product.id);
    setFormData({
      nombre: product.nombre,
      proveedor: product.proveedor,
      unidad: product.unidad,
      costo: product.costo,
      stockActual: stockInfo?.stockActual || '0',
      stockMinimo: stockInfo?.stockMinimo || '1',
      stockCompra: stockInfo?.stockCompra || '10'
    });
    setIsEditing(true);
    setEditingId(product.id);
    setShowModal(true);
  };

  // Validar y guardar producto
  const handleSaveProduct = () => {
    if (!formData.nombre || !formData.proveedor || !formData.unidad || formData.costo === '') {
      alert(language === 'es' ? 'Por favor completa todos los campos requeridos' : 'Please fill all required fields');
      return;
    }

    const productData = {
      nombre: formData.nombre.toUpperCase(),
      proveedor: formData.proveedor.toUpperCase(),
      unidad: formData.unidad.toUpperCase(),
      costo: Math.round(parseFloat(formData.costo) || 0),
    };

    let updatedProducts;
    let newProductId;

    if (isEditing) {
      updatedProducts = localProducts.map(p =>
        p.id === editingId ? { ...productData, id: p.id } : p
      );
      newProductId = editingId;
    } else {
      newProductId = Math.max(...localProducts.map(p => p.id), 0) + 1;
      updatedProducts = [...localProducts, { ...productData, id: newProductId }];
    }

    // Actualizar stock
    const stockActual = parseInt(formData.stockActual) || 0;
    const stockMinimo = parseInt(formData.stockMinimo) || 1;
    const stockCompra = parseInt(formData.stockCompra) || 10;

    let updatedStock;
    const existingStock = localStockData.find(s => s.productoId === newProductId);

    if (existingStock) {
      updatedStock = localStockData.map(s =>
        s.productoId === newProductId 
          ? { ...s, stockActual, stockMinimo, stockCompra }
          : s
      );
    } else {
      updatedStock = [...localStockData, {
        id: Math.max(...localStockData.map(s => s.id), 0) + 1,
        productoId: newProductId,
        stockActual,
        stockMinimo,
        stockCompra
      }];
    }

    setLocalProducts(updatedProducts);
    setLocalStockData(updatedStock);
    setProductsData(updatedProducts);
    setStockData(updatedStock);
    localStorage.setItem('inventariox_products', JSON.stringify(updatedProducts));
    localStorage.setItem('inventariox_stock', JSON.stringify(updatedStock));

    setShowModal(false);
  };

  // Eliminar producto
  const handleDeleteProduct = (id) => {
    const updated = localProducts.filter(p => p.id !== id);
    const updatedStock = localStockData.filter(s => s.productoId !== id);
    
    setLocalProducts(updated);
    setLocalStockData(updatedStock);
    setProductsData(updated);
    setStockData(updatedStock);
    localStorage.setItem('inventariox_products', JSON.stringify(updated));
    localStorage.setItem('inventariox_stock', JSON.stringify(updatedStock));
    setConfirmDelete(null);
  };

  // Registrar movimiento
  const registerMovement = (productName, type, quantity) => {
    const movements = JSON.parse(localStorage.getItem('inventariox_movements') || '[]');
    movements.push({
      id: Date.now(),
      fechaHora: new Date().toISOString(),
      productName: productName,
      tipo: type, // 'entrada' o 'salida'
      cantidad: quantity
    });
    localStorage.setItem('inventariox_movements', JSON.stringify(movements));
  };

  // Ajustar stock rápidamente
  const handleQuickAdjust = (productId, type) => {
    setConfirmAdjust(productId);
    setAdjustType(type);
  };

  // Procesar ajuste de stock
  const handleProcessAdjust = (quantity) => {
    const stockItem = localStockData.find(s => s.productoId === confirmAdjust);
    if (!stockItem) return;

    const newStock = adjustType === 'entrada'
      ? stockItem.stockActual + quantity
      : Math.max(0, stockItem.stockActual - quantity);

    const updatedStock = localStockData.map(s =>
      s.productoId === confirmAdjust
        ? { ...s, stockActual: newStock }
        : s
    );

    setLocalStockData(updatedStock);
    setStockData(updatedStock);
    localStorage.setItem('inventariox_stock', JSON.stringify(updatedStock));

    // Registrar movimiento
    const product = localProducts.find(p => p.id === confirmAdjust);
    if (product) {
      registerMovement(product.nombre, adjustType, quantity);
    }

    setConfirmAdjust(null);
    setAdjustType('');
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
        const stock = getStockInfo(row.id);
        const stockActual = stock?.stockActual || 0;
        const stockMinimo = stock?.stockMinimo || 0;

        if (stockActual <= stockMinimo) {
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
      render: (_, row) => {
        const stock = getStockInfo(row.id);
        return stock?.stockMinimo || 0;
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
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="w-full md:w-64 relative">
          <select
            value={selectedProviderFilter}
            onChange={(e) => setSelectedProviderFilter(e.target.value)}
            className="w-full px-4 py-3 md:py-2 bg-gray-700 light-mode:bg-gray-100 border border-gray-600 light-mode:border-gray-300 rounded-lg text-base md:text-sm text-white light-mode:text-gray-900 placeholder-gray-400 focus:border-[#206DDA] focus:outline-none transition-colors appearance-none cursor-pointer"
          >
            <option value="">{language === 'es' ? 'Todos los proveedores' : 'All providers'}</option>
            {providers.map(provider => (
              <option key={provider.id} value={provider.nombre}>
                {provider.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={language === 'es' ? 'Buscar producto...' : 'Search product...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 md:py-2 bg-gray-700 light-mode:bg-gray-100 border border-gray-600 light-mode:border-gray-300 rounded-lg text-base md:text-sm text-white light-mode:text-gray-900 placeholder-gray-400 focus:border-[#206DDA] focus:outline-none transition-colors"
          />
        </div>

        <button
          onClick={handleAddProduct}
          className="flex items-center justify-center md:justify-start gap-2 w-full md:w-auto px-4 md:px-6 py-3 md:py-2 bg-[#206DDA] hover:bg-[#1a5ab8] text-white rounded-lg font-semibold transition-colors text-base md:text-sm"
        >
          <Plus className="w-5 h-5" />
          {language === 'es' ? 'Nuevo Producto' : 'New Product'}
        </button>
      </div>

      {/* Tabla */}
      {filteredProducts.length > 0 ? (
        <TableContainer columns={columns} data={filteredProducts} language={language} />
      ) : (
        <div className="bg-gray-800 light-mode:bg-gray-100 rounded-lg p-12 text-center">
          <p className="text-gray-400 light-mode:text-gray-600 text-lg">
            {language === 'es' ? 'No hay productos registrados' : 'No products registered'}
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
                    className="w-full px-4 py-2 bg-gray-700 light-mode:bg-gray-100 border border-gray-600 light-mode:border-gray-300 rounded-lg text-white light-mode:text-gray-900 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">{language === 'es' ? 'Seleccionar proveedor' : 'Select provider'}</option>
                    {providers.map(provider => (
                      <option key={provider.id} value={provider.nombre}>
                        {provider.nombre}
                      </option>
                    ))}
                  </select>
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
                    name="stockCompra"
                    value={formData.stockCompra}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-700 light-mode:bg-gray-100 border border-gray-600 light-mode:border-gray-300 rounded-lg text-white light-mode:text-gray-900 focus:border-blue-500 focus:outline-none"
                    min="0"
                  />
                </div>
              </div>
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
                className="w-full md:w-auto px-4 py-2 bg-[#206DDA] hover:bg-[#1a5ab8] text-white rounded-lg font-semibold transition-colors"
              >
                {language === 'es' ? 'Guardar' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

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
      onConfirm(qty);
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
