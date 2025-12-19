import { useState } from 'react';
import { Search, Plus, Edit2, Trash2, X, AlertCircle, Clipboard } from 'lucide-react';
import TableContainer from '../components/TableContainer';
import InventoryHistory from '../components/InventoryHistory';
import { t } from '../utils/translations';

// Función para formatear números como moneda
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Función para formatear merma (1 decimal)
const formatMerma = (value) => {
  return parseFloat(value).toFixed(1);
};

export default function Stock({ productsData = [], stockData = [], setStockData = () => {}, language = 'es', providers = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProviderFilter, setSelectedProviderFilter] = useState('');
  const [localStockData, setLocalStockData] = useState(stockData);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [formData, setFormData] = useState({
    productoId: '',
    stockActual: '',
    stockMinimo: '',
    stockCompra: ''
  });

  // Estado para modal de toma de inventario
  const [inventoryForm, setInventoryForm] = useState({
    responsible: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    provider: '',
    items: []
  });

  // Obtener productos por proveedor para toma de inventario
  const getProductsByProvider = (providerName) => {
    return productsData.filter(p => p.proveedor === providerName);
  };

  // Manejar cambio de proveedor en toma de inventario
  const handleInventoryProviderChange = (providerName) => {
    const products = getProductsByProvider(providerName);
    setInventoryForm({
      ...inventoryForm,
      provider: providerName,
      items: products.map(p => ({
        productId: p.id,
        productName: p.nombre,
        quantity: ''
      }))
    });
  };

  // Actualizar cantidad en item de inventario
  const handleInventoryItemChange = (productId, quantity) => {
    const updatedItems = inventoryForm.items.map(item =>
      item.productId === productId ? { ...item, quantity: parseInt(quantity) || 0 } : item
    );
    setInventoryForm({
      ...inventoryForm,
      items: updatedItems
    });
  };

  // Guardar toma de inventario
  const handleSaveInventory = () => {
    if (!inventoryForm.responsible || !inventoryForm.provider || inventoryForm.items.some(i => i.quantity === '')) {
      alert(language === 'es' ? 'Por favor completa todos los campos' : 'Please fill all fields');
      return;
    }

    // Actualizar stock actual en localStockData
    const updatedStock = localStockData.map(item => {
      const inventoryItem = inventoryForm.items.find(i => i.productId === item.productoId);
      if (inventoryItem) {
        return {
          ...item,
          stockActual: inventoryItem.quantity
        };
      }
      return item;
    });

    setLocalStockData(updatedStock);
    setStockData(updatedStock);

    // Guardar en historial
    const history = JSON.parse(localStorage.getItem('inventoryHistory') || '[]');
    const newRecord = {
      id: Date.now(),
      dateTime: `${inventoryForm.date}T${inventoryForm.time}`,
      responsible: inventoryForm.responsible,
      provider: inventoryForm.provider,
      items: inventoryForm.items.map(i => ({
        productName: i.productName,
        quantity: i.quantity
      }))
    };
    history.push(newRecord);
    localStorage.setItem('inventoryHistory', JSON.stringify(history));

    // Cerrar modal y resetear
    setShowInventoryModal(false);
    setInventoryForm({
      responsible: '',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      provider: '',
      items: []
    });

    alert(language === 'es' ? 'Inventario guardado correctamente' : 'Inventory saved successfully');
  };

  // Filtrar datos por proveedor y búsqueda
  const filteredData = localStockData.filter(item => {
    const product = productsData.find(p => p.id === item.productoId);
    // Filtro por proveedor
    const matchProvider = selectedProviderFilter === '' || product?.proveedor === selectedProviderFilter;
    // Filtro por búsqueda de texto (dentro de los resultados del proveedor)
    const matchSearch = product?.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    return matchProvider && matchSearch;
  });

  // Calcular sugerencia de compra y alertas - FÓRMULA CORRECTA: Sugerencia = Stock Objetivo - Stock Actual
  const getStockInfo = (item) => {
    const stockActual = parseInt(item.stockActual) || 0;
    const stockMinimo = parseInt(item.stockMinimo) || 0;
    const stockCompra = parseInt(item.stockCompra) || 0;
    // FÓRMULA CORRECTA: Sugerencia = Stock Objetivo - Stock Actual
    const sugerencia = Math.max(0, stockCompra - stockActual);
    // Alerta: Stock Actual < Stock Mínimo
    const isAlert = stockActual < stockMinimo;

    return {
      isAlert,
      sugerencia,
      stockActual,
      stockMinimo,
      stockCompra
    };
  };

  // Enriquecer datos con información de alerta
  const dataWithInfo = filteredData.map(item => ({
    ...item,
    ...getStockInfo(item)
  }));

  // Abrir modal para nuevo stock
  const handleAddStock = () => {
    setFormData({
      productoId: '',
      stockActual: '',
      stockMinimo: '',
      stockCompra: ''
    });
    setSelectedProvider('');
    setIsEditing(false);
    setEditingId(null);
    setShowModal(true);
  };

  // Editar stock
  const handleEditStock = (item) => {
    setFormData({
      productoId: item.productoId,
      stockActual: item.stockActual,
      stockMinimo: item.stockMinimo,
      stockCompra: item.stockCompra
    });
    setIsEditing(true);
    setEditingId(item.id);
    setShowModal(true);
  };

  // Validar y guardar stock
  const handleSaveStock = () => {
    if (!formData.productoId || formData.stockActual === '' || formData.stockMinimo === '' || formData.stockCompra === '') {
      alert(language === 'es' ? 'Por favor completa todos los campos' : 'Please fill all fields');
      return;
    }

    const stockInfo = {
      productoId: parseInt(formData.productoId),
      stockActual: parseInt(formData.stockActual) || 0,
      stockMinimo: parseInt(formData.stockMinimo) || 0,
      stockCompra: parseInt(formData.stockCompra) || 0
    };

    let updated;
    if (isEditing) {
      // Editar stock existente
      updated = localStockData.map(s =>
        s.id === editingId ? { ...stockInfo, id: s.id } : s
      );
    } else {
      // Agregar nuevo stock
      const newStock = {
        ...stockInfo,
        id: Math.max(...localStockData.map(s => s.id), 0) + 1
      };
      updated = [...localStockData, newStock];
    }
    
    setLocalStockData(updated);
    setStockData(updated);

    setShowModal(false);
    setFormData({
      productoId: '',
      stockActual: '',
      stockMinimo: '',
      stockCompra: ''
    });
    setSelectedProvider('');
  };

  // Confirmar y eliminar stock
  const handleDeleteStock = (id) => {
    setStockData(stockData.filter(s => s.id !== id));
    setConfirmDelete(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Obtener productos filtrados por proveedor
  const getFilteredProducts = () => {
    if (!selectedProvider) return [];
    return productsData.filter(p => p.proveedor === selectedProvider);
  };

  const columns = [
    {
      key: 'nombre',
      label: language === 'es' ? 'Producto' : 'Product',
      render: (_, row) => productsData.find(p => p.id === row.productoId)?.nombre || 'N/A'
    },
    {
      key: 'merma',
      label: language === 'es' ? 'Merma' : 'Loss %',
      render: (_, row) => {
        const product = productsData.find(p => p.id === row.productoId);
        return <span>{formatMerma(product?.merma || 0)}%</span>;
      }
    },
    {
      key: 'stockActual',
      label: language === 'es' ? 'Stock Actual' : 'Current Stock',
      render: (value, row) => {
        const { isAlert } = getStockInfo(row);
        return (
          <span className={isAlert ? 'text-red-400 font-bold' : 'text-green-400'}>
            {value}
          </span>
        );
      }
    },
    {
      key: 'stockMinimo',
      label: language === 'es' ? 'Stock Mínimo' : 'Min Stock',
      render: (value) => <span>{value}</span>
    },
    {
      key: 'stockCompra',
      label: language === 'es' ? 'Stock Objetivo' : 'Target Stock',
      render: (value) => <span>{value}</span>
    },
    {
      key: 'sugerencia',
      label: language === 'es' ? 'Sugerencia de Compra' : 'Purchase Suggestion',
      render: (_, row) => {
        const { isAlert, sugerencia } = getStockInfo(row);
        return (
          <div className={`flex items-center gap-1 ${isAlert ? 'text-red-400 font-bold' : 'text-green-400'}`}>
            {isAlert && <AlertCircle className="w-4 h-4" />}
            {sugerencia} {language === 'es' ? 'unidades' : 'units'}
          </div>
        );
      }
    },
    {
      key: 'acciones',
      label: language === 'es' ? 'Acciones' : 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <button 
            onClick={() => handleEditStock(row)}
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
      <div className="mb-8">
        <h1 className="text-white light-mode:text-gray-900 font-black text-2xl md:text-3xl bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent mb-2">
          {language === 'es' ? 'Inventario' : 'Inventory'}
        </h1>
        <p className="text-gray-400 light-mode:text-gray-600 text-sm md:text-base">
          {language === 'es' ? 'Gestiona el stock de productos con alertas automáticas' : 'Manage product stock with automatic alerts'}
        </p>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Filtro por Proveedor */}
        <div className="w-full md:w-64 relative">
          <select
            value={selectedProviderFilter}
            onChange={(e) => setSelectedProviderFilter(e.target.value)}
            className="w-full px-4 py-3 md:py-2 bg-gray-700 light-mode:bg-gray-100 border border-gray-600 light-mode:border-gray-300 rounded-lg text-base md:text-sm text-white light-mode:text-gray-900 placeholder-gray-400 focus:border-[#206DDA] focus:outline-none transition-colors duration-300 appearance-none cursor-pointer"
          >
            <option value="">{language === 'es' ? 'Todos los proveedores' : 'All providers'}</option>
            {providers.map(provider => (
              <option key={provider.id} value={provider.nombre}>
                {provider.nombre}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>

        {/* Buscador de texto */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={language === 'es' ? 'Buscar producto...' : 'Search product...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 md:py-2 bg-gray-700 light-mode:bg-gray-100 border border-gray-600 light-mode:border-gray-300 rounded-lg text-base md:text-sm text-white light-mode:text-gray-900 placeholder-gray-400 focus:border-[#206DDA] focus:outline-none transition-colors duration-300"
          />
        </div>
      </div>

      {/* Botones de acción - Responsivos */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        {/* Botón Cargar Stock */}
        <button
          onClick={handleAddStock}
          className="flex items-center justify-center md:justify-start gap-2 w-full md:w-auto px-4 md:px-6 py-3 md:py-2 bg-[#206DDA] hover:bg-[#1a5ab8] text-white rounded-lg font-semibold transition-colors duration-300 text-base md:text-sm"
        >
          <Plus className="w-5 h-5" />
          {language === 'es' ? 'Cargar Stock' : 'Load Stock'}
        </button>

        {/* Botón Realizar Inventario */}
        <button
          onClick={() => setShowInventoryModal(true)}
          className="flex items-center justify-center md:justify-start gap-2 w-full md:w-auto px-4 md:px-6 py-3 md:py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors duration-300 text-base md:text-sm"
        >
          <Clipboard className="w-5 h-5" />
          {language === 'es' ? 'Realizar Inventario' : 'Physical Count'}
        </button>

        {/* Botón Historial */}
        <button
          onClick={() => setShowHistory(true)}
          className="flex items-center justify-center md:justify-start gap-2 w-full md:w-auto px-4 md:px-6 py-3 md:py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors duration-300 text-base md:text-sm"
        >
          <AlertCircle className="w-5 h-5" />
          {language === 'es' ? 'Historial' : 'History'}
        </button>
      </div>

      {/* Tabla o mensaje de vacío */}
      {dataWithInfo.length > 0 ? (
        <TableContainer 
          columns={columns} 
          data={dataWithInfo} 
          language={language}
          isRowAlert={(row) => getStockInfo(row).isAlert}
        />
      ) : (
        <div className="bg-gray-800 light-mode:bg-gray-100 rounded-lg p-12 text-center">
          <p className="text-gray-400 light-mode:text-gray-600 text-lg">
            {language === 'es' 
              ? selectedProviderFilter 
                ? `No hay stock registrado para el proveedor "${selectedProviderFilter}"`
                : 'No hay stock registrado'
              : selectedProviderFilter
                ? `No stock found for provider "${selectedProviderFilter}"`
                : 'No stock registered'
            }
          </p>
        </div>
      )}

      {/* Modal para agregar/editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] light-mode:bg-white rounded-lg w-full max-h-[90vh] overflow-y-auto max-w-md shadow-xl md:rounded-lg">
            <div className="flex justify-between items-center p-6 sticky top-0 bg-[#111827] light-mode:bg-white border-b border-gray-700 light-mode:border-gray-200">
              <h2 className="text-white light-mode:text-gray-900 font-bold text-xl">
                {isEditing 
                  ? (language === 'es' ? 'Editar Stock' : 'Edit Stock')
                  : (language === 'es' ? 'Cargar Stock' : 'Load Stock')
                }
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Formulario */}
            <div className="p-6 space-y-4">
              {/* Proveedor */}
              <div>
                <label className="block text-base md:text-sm font-semibold text-gray-300 light-mode:text-gray-700 mb-2">
                  {language === 'es' ? 'Proveedor' : 'Provider'} <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedProvider}
                  onChange={(e) => {
                    setSelectedProvider(e.target.value);
                    setFormData(prev => ({ ...prev, productoId: '' }));
                  }}
                  className="w-full px-4 py-3 md:py-2 bg-gray-700 light-mode:bg-gray-100 border border-gray-600 light-mode:border-gray-300 rounded-lg text-base md:text-sm text-white light-mode:text-gray-900 focus:border-[#206DDA] focus:outline-none transition-colors duration-300"
                >
                  <option value="">{language === 'es' ? 'Seleccionar proveedor' : 'Select provider'}</option>
                  {providers.map(provider => (
                    <option key={provider.id} value={provider.nombre}>
                      {provider.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Producto */}
              <div>
                <label className="block text-base md:text-sm font-semibold text-gray-300 light-mode:text-gray-700 mb-2">
                  {language === 'es' ? 'Producto' : 'Product'} <span className="text-red-500">*</span>
                </label>
                <select
                  name="productoId"
                  value={formData.productoId}
                  onChange={handleInputChange}
                  disabled={!selectedProvider}
                  className={`w-full px-4 py-3 md:py-2 text-base md:text-sm rounded-lg border transition-colors duration-300 ${
                    selectedProvider
                      ? 'bg-gray-700 light-mode:bg-gray-100 border-gray-600 light-mode:border-gray-300 text-white light-mode:text-gray-900 focus:border-[#206DDA] focus:outline-none'
                      : 'bg-gray-800 light-mode:bg-gray-200 border-gray-700 light-mode:border-gray-400 text-gray-500 light-mode:text-gray-600 cursor-not-allowed opacity-50'
                  }`}
                >
                  <option value="">{language === 'es' ? 'Seleccionar producto' : 'Select product'}</option>
                  {getFilteredProducts().map(product => (
                    <option key={product.id} value={product.id}>
                      {product.nombre}
                    </option>
                  ))}
                </select>
                {!selectedProvider && (
                  <p className="text-xs text-gray-400 mt-1">
                    {language === 'es' ? 'Selecciona un proveedor primero' : 'Select a provider first'}
                  </p>
                )}
              </div>

              {/* Stock Actual */}
              <div>
                <label className="block text-base md:text-sm font-semibold text-gray-300 light-mode:text-gray-700 mb-2">
                  {language === 'es' ? 'Stock Actual' : 'Current Stock'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="stockActual"
                  value={formData.stockActual}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 md:py-2 bg-gray-700 light-mode:bg-gray-100 border border-gray-600 light-mode:border-gray-300 rounded-lg text-base md:text-sm text-white light-mode:text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none transition-colors duration-300"
                  placeholder="Ej: 10"
                />
              </div>

              {/* Stock Mínimo */}
              <div>
                <label className="block text-base md:text-sm font-semibold text-gray-300 light-mode:text-gray-700 mb-2">
                  {language === 'es' ? 'Stock Mínimo' : 'Minimum Stock'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="stockMinimo"
                  value={formData.stockMinimo}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 md:py-2 bg-gray-700 light-mode:bg-gray-100 border border-gray-600 light-mode:border-gray-300 rounded-lg text-base md:text-sm text-white light-mode:text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none transition-colors duration-300"
                  placeholder="Ej: 8"
                />
              </div>

              {/* Stock de Compra (Objetivo) */}
              <div>
                <label className="block text-base md:text-sm font-semibold text-gray-300 light-mode:text-gray-700 mb-2">
                  {language === 'es' ? 'Stock Objetivo (Compra)' : 'Target Stock (Purchase)'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="stockCompra"
                  value={formData.stockCompra}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 md:py-2 bg-gray-700 light-mode:bg-gray-100 border border-gray-600 light-mode:border-gray-300 rounded-lg text-base md:text-sm text-white light-mode:text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none transition-colors duration-300"
                  placeholder="Ej: 10"
                />
              </div>
            </div>

            {/* Botones */}
            <div className="p-6 border-t border-gray-700 light-mode:border-gray-200 flex flex-col md:flex-row gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="w-full md:w-auto px-4 py-3 md:py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors duration-300 text-base md:text-sm font-semibold"
              >
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveStock}
                className="w-full md:w-auto px-4 py-3 md:py-2 bg-[#206DDA] hover:bg-[#1a5ab8] text-white rounded-lg font-semibold transition-colors duration-300 text-base md:text-sm"
              >
                {language === 'es' ? 'Guardar' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Toma de Inventario Físico */}
      {showInventoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] light-mode:bg-white rounded-lg w-full h-screen md:h-auto max-h-[90vh] overflow-y-auto md:max-w-2xl shadow-2xl">
            {/* Encabezado */}
            <div className="sticky top-0 bg-[#111827] light-mode:bg-white border-b border-gray-700 light-mode:border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-white light-mode:text-gray-900 font-bold text-2xl">
                {language === 'es' ? 'Toma de Inventario Físico' : 'Physical Inventory Count'}
              </h2>
              <button
                onClick={() => setShowInventoryModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Datos del Responsable y Fecha */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Nombre del Responsable */}
                <div>
                  <label className="block text-base md:text-sm text-white light-mode:text-gray-900 font-semibold mb-2">
                    {language === 'es' ? 'Responsable' : 'Responsible'}
                  </label>
                  <input
                    type="text"
                    value={inventoryForm.responsible}
                    onChange={(e) => setInventoryForm({ ...inventoryForm, responsible: e.target.value })}
                    placeholder={language === 'es' ? 'Nombre completo' : 'Full name'}
                    className="w-full px-4 py-3 bg-gray-700 light-mode:bg-gray-100 border border-gray-600 light-mode:border-gray-300 rounded-lg text-base md:text-sm text-white light-mode:text-gray-900 placeholder-gray-400 focus:border-[#206DDA] focus:outline-none transition-colors"
                  />
                </div>

                {/* Fecha */}
                <div>
                  <label className="block text-base md:text-sm text-white light-mode:text-gray-900 font-semibold mb-2">
                    {language === 'es' ? 'Fecha' : 'Date'}
                  </label>
                  <input
                    type="date"
                    value={inventoryForm.date}
                    onChange={(e) => setInventoryForm({ ...inventoryForm, date: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 light-mode:bg-gray-100 border border-gray-600 light-mode:border-gray-300 rounded-lg text-base md:text-sm text-white light-mode:text-gray-900 focus:border-[#206DDA] focus:outline-none transition-colors"
                  />
                </div>

                {/* Hora */}
                <div>
                  <label className="block text-base md:text-sm text-white light-mode:text-gray-900 font-semibold mb-2">
                    {language === 'es' ? 'Hora' : 'Time'}
                  </label>
                  <input
                    type="time"
                    value={inventoryForm.time}
                    onChange={(e) => setInventoryForm({ ...inventoryForm, time: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 light-mode:bg-gray-100 border border-gray-600 light-mode:border-gray-300 rounded-lg text-base md:text-sm text-white light-mode:text-gray-900 focus:border-[#206DDA] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Selector de Proveedor */}
              <div>
                <label className="block text-base md:text-sm text-white light-mode:text-gray-900 font-semibold mb-2">
                  {language === 'es' ? 'Proveedor' : 'Provider'}
                </label>
                <select
                  value={inventoryForm.provider}
                  onChange={(e) => handleInventoryProviderChange(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 light-mode:bg-gray-100 border border-gray-600 light-mode:border-gray-300 rounded-lg text-base md:text-sm text-white light-mode:text-gray-900 focus:border-[#206DDA] focus:outline-none transition-colors appearance-none cursor-pointer"
                >
                  <option value="">{language === 'es' ? 'Selecciona un proveedor' : 'Select a provider'}</option>
                  {providers.map(provider => (
                    <option key={provider.id} value={provider.nombre}>
                      {provider.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Productos para contar */}
              {inventoryForm.provider && inventoryForm.items.length > 0 && (
                <div>
                  <h3 className="text-base md:text-lg text-white light-mode:text-gray-900 font-bold mb-4">
                    {language === 'es' ? 'Productos a contar' : 'Products to count'} ({inventoryForm.items.length})
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {inventoryForm.items.map((item) => (
                      <div key={item.productId} className="flex items-center gap-3 p-4 bg-gray-700 light-mode:bg-gray-100 rounded-lg border border-gray-600 light-mode:border-gray-300">
                        <div className="flex-1">
                          <p className="text-white light-mode:text-gray-900 font-semibold text-sm md:text-xs truncate">
                            {item.productName}
                          </p>
                        </div>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleInventoryItemChange(item.productId, e.target.value)}
                          placeholder="0"
                          className="px-4 py-3 md:py-2 bg-gray-600 light-mode:bg-gray-200 border border-gray-500 light-mode:border-gray-400 rounded-lg text-white light-mode:text-gray-900 placeholder-gray-400 focus:border-[#206DDA] focus:outline-none transition-colors text-lg md:text-base font-bold text-center w-20"
                          autoFocus
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mensaje si no hay proveedor seleccionado */}
              {!inventoryForm.provider && (
                <div className="p-4 bg-gray-700 light-mode:bg-gray-100 rounded-lg border border-gray-600 light-mode:border-gray-300 text-center">
                  <p className="text-gray-400 light-mode:text-gray-600 text-sm md:text-base">
                    {language === 'es' ? 'Selecciona un proveedor para comenzar' : 'Select a provider to begin'}
                  </p>
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="sticky bottom-0 bg-[#111827] light-mode:bg-white border-t border-gray-700 light-mode:border-gray-200 p-6 flex flex-col md:flex-row gap-3 justify-end">
              <button
                onClick={() => setShowInventoryModal(false)}
                className="w-full md:w-auto px-6 py-3 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors font-semibold text-base md:text-sm"
              >
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveInventory}
                disabled={!inventoryForm.responsible || !inventoryForm.provider || inventoryForm.items.some(i => i.quantity === '')}
                className="w-full md:w-auto px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors text-base md:text-sm"
              >
                {language === 'es' ? 'Guardar Inventario' : 'Save Inventory'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Componente Historial */}
      <InventoryHistory
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        language={language}
      />

      {/* Modal de confirmación de eliminación */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#111827] light-mode:bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-white light-mode:text-gray-900 font-bold text-lg mb-4">
              {language === 'es' ? '¿Eliminar stock?' : 'Delete stock?'}
            </h3>
            <p className="text-gray-400 light-mode:text-gray-600 mb-6">
              {language === 'es' ? 'Esta acción no se puede deshacer.' : 'This action cannot be undone.'}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
              >
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
              <button
                onClick={() => handleDeleteStock(confirmDelete)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
              >
                {language === 'es' ? 'Eliminar' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
