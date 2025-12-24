import { Search, Plus, Edit2, Trash2, X } from 'lucide-react';
import TableContainer from '../components/TableContainer';
import ConfirmationModal from '../components/ConfirmationModal';
import { useState, useEffect } from 'react';
import { t } from '../utils/translations';
import { cleanPhoneNumber } from '../utils/helpers';
import { addProvider, getProviders, updateProvider, deleteProvider } from '../services/firebaseService';

export default function Providers({ language = 'es', providersData = [], setProvidersData, user }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [providers, setProviders] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    contacto: '',
    email: '',
    whatsapp: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  // Cargar proveedores desde Firestore
  useEffect(() => {
    const loadProviders = async () => {
      if (!user) return;
      try {
        const data = await getProviders(user.uid);
        setProviders(data);
        if (setProvidersData) setProvidersData(data);
      } catch (error) {
        console.error('Error al cargar proveedores:', error);
      }
    };

    loadProviders();
  }, [user, setProvidersData]);

  const filteredProviders = providers.filter(p =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.contacto.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Abrir modal para nuevo proveedor
  const handleAddProvider = () => {
    setFormData({ nombre: '', contacto: '', email: '', whatsapp: '' });
    setIsEditing(false);
    setEditingId(null);
    setShowModal(true);
  };

  // Abrir modal para editar proveedor
  const handleEditProvider = (provider) => {
    setFormData(provider);
    setIsEditing(true);
    setEditingId(provider.id);
    setShowModal(true);
  };

  // Guardar proveedor (nuevo o editado)
  const handleSaveProvider = async (e) => {
    if (e) e.preventDefault();
    if (!user || !user.uid) {
      alert(language === 'es' ? 'Debes iniciar sesión para guardar proveedores' : 'You must be logged in to save providers');
      return;
    }
    if (isSaving) return;
    if (!formData.nombre || !formData.whatsapp) {
      alert(language === 'es' ? 'Por favor completa los campos obligatorios (Nombre y WhatsApp)' : 'Please fill required fields (Name and WhatsApp)');
      return;
    }

    // Limpiar número de WhatsApp y convertir datos a mayúsculas
    const providerData = {
      nombre: formData.nombre.toUpperCase(),
      contacto: formData.contacto.toUpperCase(),
      email: formData.email.toUpperCase(),
      whatsapp: cleanPhoneNumber(formData.whatsapp)
    };

    setIsSaving(true);
    try {
      if (isEditing) {
        await updateProvider(editingId, providerData);
        const updatedProviders = providers.map(p =>
          p.id === editingId ? { ...providerData, id: p.id } : p
        );
        setProviders(updatedProviders);
        if (setProvidersData) setProvidersData(updatedProviders);
      } else {
        const newId = await addProvider(user.uid, providerData);
        const newProvider = { ...providerData, id: newId, userId: user.uid };
        const updatedProviders = [...providers, newProvider];
        setProviders(updatedProviders);
        if (setProvidersData) setProvidersData(updatedProviders);
      }
      setShowModal(false);
      setFormData({ nombre: '', contacto: '', email: '', whatsapp: '' });
    } catch (error) {
      console.error('Error guardando proveedor:', error);
      alert(language === 'es' ? 'Error guardando proveedor' : 'Error saving provider');
    } finally {
      setIsSaving(false);
    }
  };

  // Confirmar y eliminar proveedor
  const handleDeleteProvider = async (id) => {
    const confirmed = window.confirm('¿Eliminar este proveedor? Esta acción no se puede deshacer.');
    if (!confirmed) return;
    try {
      await deleteProvider(id);
      const updatedProviders = providers.filter(p => p.id !== id);
      setProviders(updatedProviders);
      if (setProvidersData) setProvidersData(updatedProviders);
    } catch (error) {
      console.error('Error eliminando proveedor:', error);
      alert(language === 'es' ? 'Error eliminando proveedor' : 'Error deleting provider');
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const columns = [
    { key: 'nombre', label: t(language, 'nombreEmpresa') },
    { key: 'contacto', label: t(language, 'contacto') },
    { key: 'email', label: 'Email' },
    { key: 'whatsapp', label: 'WhatsApp' },
    {
      key: 'acciones',
      label: t(language, 'accion'),
      render: (_, row) => (
        <div className="flex gap-2">
          <button 
            onClick={() => handleEditProvider(row)}
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
    <div className="min-h-screen bg-dark-bg light-mode:bg-gray-50 p-4 sm:p-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Encabezado */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold mb-1 sm:mb-2 text-white light-mode:text-gray-900">{t(language, 'proveedores')}</h1>
          <p className="text-gray-400 light-mode:text-gray-600">{t(language, 'gestionProveedores')}</p>
        </div>

        {/* Barra de búsqueda y acciones */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-500 light-mode:text-gray-400" />
            <input
              type="text"
              placeholder={language === 'es' ? 'Buscar proveedor...' : 'Search provider...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 light-mode:bg-white border border-gray-700 light-mode:border-gray-300 rounded-lg text-white light-mode:text-gray-900 placeholder-gray-500 light-mode:placeholder-gray-400 focus:border-primary focus:outline-none transition-colors duration-300"
            />
          </div>
          <button 
            onClick={handleAddProvider}
            className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            {t(language, 'agregarProveedor')}
          </button>
        </div>

        {/* Tabla de Proveedores */}
        <TableContainer
          columns={columns}
          data={filteredProviders}
          onRowClick={(row) => console.log('Proveedor seleccionado:', row)}
        />

        {/* Modal - Agregar/Editar Proveedor */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 light-mode:bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white light-mode:text-gray-900">
                  {isEditing ? t(language, 'editar') : t(language, 'agregarProveedor')}
                </h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-1 hover:bg-gray-700 light-mode:hover:bg-gray-200 rounded"
                >
                  <X className="w-6 h-6 text-gray-400 light-mode:text-gray-600" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 light-mode:text-gray-700 mb-2">
                    {t(language, 'nombreEmpresa')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-700 light-mode:bg-gray-100 border border-gray-600 light-mode:border-gray-300 rounded-lg text-white light-mode:text-gray-900 placeholder-gray-500 light-mode:placeholder-gray-400 focus:border-primary focus:outline-none transition-colors duration-300"
                    placeholder={language === 'es' ? 'Ej: Distribuidora ABC' : 'E.g.: ABC Distributor'}
                  />
                </div>

                {/* Contacto */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 light-mode:text-gray-700 mb-2">
                    {t(language, 'contacto')} <span className="text-gray-500 text-xs">{language === 'es' ? '(Opcional)' : '(Optional)'}</span>
                  </label>
                  <input
                    type="text"
                    name="contacto"
                    value={formData.contacto}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-700 light-mode:bg-gray-100 border border-gray-600 light-mode:border-gray-300 rounded-lg text-white light-mode:text-gray-900 placeholder-gray-500 light-mode:placeholder-gray-400 focus:border-primary focus:outline-none transition-colors duration-300"
                    placeholder={language === 'es' ? 'Ej: Juan Pérez' : 'E.g.: John Doe'}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 light-mode:text-gray-700 mb-2">
                    Email <span className="text-gray-500 text-xs">{language === 'es' ? '(Opcional)' : '(Optional)'}</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-700 light-mode:bg-gray-100 border border-gray-600 light-mode:border-gray-300 rounded-lg text-white light-mode:text-gray-900 placeholder-gray-500 light-mode:placeholder-gray-400 focus:border-primary focus:outline-none transition-colors duration-300"
                    placeholder={language === 'es' ? 'Ej: juan@empresa.com' : 'E.g.: john@company.com'}
                  />
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 light-mode:text-gray-700 mb-2">
                    WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-gray-700 light-mode:bg-gray-100 border border-gray-600 light-mode:border-gray-300 rounded-lg text-white light-mode:text-gray-900 placeholder-gray-500 light-mode:placeholder-gray-400 focus:border-primary focus:outline-none transition-colors duration-300"
                    placeholder={language === 'es' ? 'Ej: 56 9 1234 5678 o 3001234567' : 'E.g.: +1 234 567 8900 or 3001234567'}
                  />
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveProvider}
                  disabled={isSaving}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors text-white ${isSaving ? 'bg-blue-300 cursor-not-allowed' : 'bg-primary hover:bg-blue-600'}`}
                >
                  {isSaving ? (language === 'es' ? 'Guardando...' : 'Saving...') : (language === 'es' ? 'Guardar' : 'Save')}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 light-mode:bg-gray-300 hover:bg-gray-600 light-mode:hover:bg-gray-400 text-white light-mode:text-gray-900 font-semibold rounded-lg transition-colors"
                >
                  {language === 'es' ? 'Cancelar' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal - Confirmar Eliminación */}
        <ConfirmationModal
          isOpen={confirmDelete !== null}
          title={language === 'es' ? '¿Eliminar proveedor?' : 'Delete provider?'}
          message={language === 'es' 
            ? '¿Estás seguro de eliminar este registro? Esta acción no se puede deshacer.'
            : 'Are you sure you want to delete this record? This action cannot be undone.'}
          onConfirm={() => handleDeleteProvider(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
          confirmText={language === 'es' ? 'Eliminar' : 'Delete'}
          cancelText={language === 'es' ? 'Cancelar' : 'Cancel'}
          isDangerous={true}
        />
      </div>
    </div>
  );
}
