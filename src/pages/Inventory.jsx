import { useState } from 'react';
import { Search, Plus, Edit2, Trash2, X } from 'lucide-react';
import TableContainer from '../components/TableContainer';
import { t } from '../utils/translations';

// Función para formatear números como moneda (sin decimales, separador de miles)
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export default function Inventory({ productsData: initialData = [], setProductsData, language = 'es', providers = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProviderFilter, setSelectedProviderFilter] = useState('');
  const [productsData, setLocalProductsData] = useState(initialData || []);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    proveedor: '',
    unidad: '',
    contenidoEmpaque: '',
    costo: '',
    merma: ''
  });

  // Fórmula para calcular Costo Real: Costo / (1 - %Merma)
  const calculateCostReal = (costo, mermaPercentage) => {
    const mermaDecimal = mermaPercentage / 100;
    if (mermaDecimal >= 1) return 0;
    return (costo / (1 - mermaDecimal)).toFixed(2);
  };

  // Filtrar datos por proveedor y búsqueda
  const filteredData = productsData.filter(item => {
    // Filtro por proveedor
    const matchProvider = selectedProviderFilter === '' || item.proveedor === selectedProviderFilter;
    // Filtro por búsqueda de texto (dentro de los resultados del proveedor)
    const matchSearch = item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.proveedor.toLowerCase().includes(searchTerm.toLowerCase());
    return matchProvider && matchSearch;
  });

  // Abrir modal para nuevo producto
  const handleAddProduct = () => {
    setFormData({
      nombre: '',
      proveedor: '',
      unidad: '',
      contenidoEmpaque: '',
      costo: '',
      merma: ''
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
      contenidoEmpaque: product.contenidoEmpaque,
      costo: product.costo,
      merma: product.merma
    });
    setIsEditing(true);
    setEditingId(product.id);
    setShowModal(true);
  };

  // Validar y guardar producto
  const handleSaveProduct = () => {
    if (!formData.nombre || !formData.proveedor || !formData.unidad || !formData.contenidoEmpaque || !formData.costo || formData.merma === '') {
      alert(language === 'es' ? 'Por favor completa todos los campos requeridos' : 'Please fill all required fields');
      return;
    }

    // Convertir datos a mayúsculas
    const productData = {
      nombre: formData.nombre.toUpperCase(),
      proveedor: formData.proveedor.toUpperCase(),
      unidad: formData.unidad.toUpperCase(),
      contenidoEmpaque: formData.contenidoEmpaque.toUpperCase(),
      costo: Math.round(parseFloat(formData.costo) || 0),
      merma: parseFloat(formData.merma) || 0
    };

    let updated;
    if (isEditing) {
      // Editar producto existente
      updated = productsData.map(p =>
        p.id === editingId ? { ...productData, id: p.id } : p
      );
    } else {
      // Agregar nuevo producto
      const newProduct = {
        ...productData,
        id: Math.max(...productsData.map(p => p.id), 0) + 1
      };
      updated = [...productsData, newProduct];
    }
    
    setLocalProductsData(updated);
    if (setProductsData) setProductsData(updated);

    setShowModal(false);
    setFormData({
      nombre: '',
      proveedor: '',
      unidad: '',
      contenidoEmpaque: '',
      costo: '',
      merma: ''
    });
  };

  // Confirmar y eliminar producto
  const handleDeleteProduct = (id) => {
    const updated = productsData.filter(p => p.id !== id);
    setLocalProductsData(updated);
    if (setProductsData) setProductsData(updated);
    setConfirmDelete(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const columns = [
    { key: 'nombre', label: language === 'es' ? 'Producto' : 'Product' },
    { key: 'proveedor', label: language === 'es' ? 'Proveedor' : 'Provider' },
    { key: 'unidad', label: language === 'es' ? 'Unidad' : 'Unit' },
    { key: 'contenidoEmpaque', label: language === 'es' ? 'Contenido/Empaque' : 'Content/Package' },
    {
      key: 'costo',
      label: language === 'es' ? 'Costo Unitario' : 'Unit Cost',
      render: (value) => `$${formatCurrency(value)}`
    },
    {
      key: 'merma',
      label: language === 'es' ? 'Merma (%)' : 'Loss (%)',
      render: (value) => `${parseFloat(value).toFixed(2)}%`
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
          {language === 'es' ? 'Productos' : 'Products'}
        </h1>
        <p className="text-gray-400 light-mode:text-gray-600 text-xs sm:text-sm md:text-base">
          {language === 'es' ? 'Crea y administra la base de datos de productos' : 'Create and manage the product database'}
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

        {/* Botón Agregar Producto */}
        <button
          onClick={handleAddProduct}
          className="flex items-center justify-center md:justify-start gap-2 w-full md:w-auto px-4 md:px-6 py-3 md:py-2 bg-[#206DDA] hover:bg-[#1a5ab8] text-white rounded-lg font-semibold transition-colors duration-300 text-base md:text-sm"
        >
          <Plus className="w-5 h-5" />
          {language === 'es' ? 'Agregar Producto' : 'Add Product'}
        </button>
      </div>

      {/* Tabla o mensaje de vacío */}
      {filteredData.length > 0 ? (
        <TableContainer columns={columns} data={filteredData} language={language} />
      ) : (
        <div className="bg-gray-800 light-mode:bg-gray-100 rounded-lg p-12 text-center">
          <p className="text-gray-400 light-mode:text-gray-600 text-lg">
            {language === 'es' 
              ? selectedProviderFilter 
                ? `No hay productos para el proveedor "${selectedProviderFilter}"`
                : 'No hay productos registrados'
              : selectedProviderFilter
                ? `No products found for provider "${selectedProviderFilter}"`
                : 'No products registered'
            }
          </p>
        </div>
      )}

      {/* Modal para agregar/editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] light-mode:bg-white rounded-lg w-full max-h-[90vh] overflow-y-auto max-w-2xl shadow-xl md:rounded-lg">
            <div className="flex justify-between items-center p-6 sticky top-0 bg-[#111827] light-mode:bg-white border-b border-gray-700 light-mode:border-gray-200">
              <h2 className="text-white light-mode:text-gray-900 font-bold text-xl">
                {isEditing 
                  ? (language === 'es' ? 'Editar Producto' : 'Edit Product')
                  : (language === 'es' ? 'Agregar Producto' : 'Add Product')
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
              {/* Primera fila - Nombre y Proveedor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-base md:text-sm font-semibold text-gray-300 light-mode:text-gray-700 mb-2">
                    {language === 'es' ? 'Nombre del Producto' : 'Product Name'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 md:py-2 bg-gray-700 light-mode:bg-gray-100 border border-gray-600 light-mode:border-gray-300 rounded-lg text-base md:text-sm text-white light-mode:text-gray-900 placeholder-gray-500 light-mode:placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors duration-300"
                    placeholder={language === 'es' ? 'Ej: Aceite de Oliva' : 'E.g.: Olive Oil'}
                  />
                </div>

                <div>
                  <label className="block text-base md:text-sm font-semibold text-gray-300 light-mode:text-gray-700 mb-2">
                    {language === 'es' ? 'Proveedor' : 'Provider'} <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="proveedor"
                    value={formData.proveedor}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 md:py-2 bg-gray-700 light-mode:bg-gray-100 border border-gray-600 light-mode:border-gray-300 rounded-lg text-base md:text-sm text-white light-mode:text-gray-900 placeholder-gray-500 light-mode:placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors duration-300"
                  >
                    <option value="">{language === 'es' ? 'Seleccionar proveedor' : 'Select provider'}</option>
                    {providers && providers.length > 0 ? (
                      providers.map(provider => (
                        <option key={provider.id} value={provider.nombre}>
                          {provider.nombre}
                        </option>
                      ))
                    ) : (
                      <option disabled>{language === 'es' ? 'No hay proveedores' : 'No providers'}</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Segunda fila - Unidad y Contenido/Empaque */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-base md:text-sm font-semibold text-gray-300 light-mode:text-gray-700 mb-2">
                    {language === 'es' ? 'Unidad de Medida' : 'Unit of Measure'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="unidad"
                    value={formData.unidad}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 md:py-2 bg-gray-700 light-mode:bg-gray-100 border border-gray-600 light-mode:border-gray-300 rounded-lg text-base md:text-sm text-white light-mode:text-gray-900 placeholder-gray-500 light-mode:placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors duration-300"
                    placeholder={language === 'es' ? 'Ej: Litros, Gramos, Unidades' : 'E.g.: Liters, Grams, Units'}
                  />
                </div>

                <div>
                  <label className="block text-base md:text-sm font-semibold text-gray-300 light-mode:text-gray-700 mb-2">
                    {language === 'es' ? 'Contenido por Empaque' : 'Content per Package'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="contenidoEmpaque"
                    value={formData.contenidoEmpaque}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 md:py-2 bg-gray-700 light-mode:bg-gray-100 border border-gray-600 light-mode:border-gray-300 rounded-lg text-base md:text-sm text-white light-mode:text-gray-900 placeholder-gray-500 light-mode:placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors duration-300"
                    placeholder={language === 'es' ? 'Ej: 1000g, 500ml' : 'E.g.: 1000g, 500ml'}
                  />
                </div>
              </div>

              {/* Tercera fila - Costo Unitario y Merma */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-base md:text-sm font-semibold text-gray-300 light-mode:text-gray-700 mb-2">
                    {language === 'es' ? 'Costo Unitario' : 'Unit Cost'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="costo"
                    value={formData.costo}
                    onChange={handleInputChange}
                    step="1000"
                    className="w-full px-4 py-3 md:py-2 bg-gray-700 light-mode:bg-gray-100 border border-gray-600 light-mode:border-gray-300 rounded-lg text-base md:text-sm text-white light-mode:text-gray-900 placeholder-gray-500 light-mode:placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors duration-300"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-base md:text-sm font-semibold text-gray-300 light-mode:text-gray-700 mb-2">
                    {language === 'es' ? 'Merma (%)' : 'Loss (%)'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="merma"
                    value={formData.merma}
                    onChange={handleInputChange}
                    step="0.1"
                    min="0"
                    max="99.9"
                    className="w-full px-4 py-3 md:py-2 bg-gray-700 light-mode:bg-gray-100 border border-gray-600 light-mode:border-gray-300 rounded-lg text-base md:text-sm text-white light-mode:text-gray-900 placeholder-gray-500 light-mode:placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors duration-300"
                    placeholder="0.0"
                  />
                </div>
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
                onClick={handleSaveProduct}
                className="w-full md:w-auto px-4 py-3 md:py-2 bg-[#206DDA] hover:bg-[#1a5ab8] text-white rounded-lg font-semibold transition-colors duration-300 text-base md:text-sm"
              >
                {language === 'es' ? 'Guardar' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#111827] light-mode:bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-white light-mode:text-gray-900 font-bold text-lg mb-4">
              {language === 'es' ? '¿Eliminar producto?' : 'Delete product?'}
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
                onClick={() => handleDeleteProduct(confirmDelete)}
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
