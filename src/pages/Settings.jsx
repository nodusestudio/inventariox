import { useState, useEffect } from 'react';
import { Edit2, X, Save } from 'lucide-react';

export default function Settings({
  language = 'es',
  companyData,
  setCompanyData,
}) {
  const [savedData, setSavedData] = useState(companyData || {
    nombreEstablecimiento: 'Mi Empresa',
    nombreResponsable: 'Responsable',
    ubicacion: 'Ubicación / Sucursal',
  });

  const [formData, setFormData] = useState(companyData || {
    nombreEstablecimiento: 'Mi Empresa',
    nombreResponsable: 'Responsable',
    ubicacion: 'Ubicación / Sucursal',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Sincronizar con companyData cuando cambia desde otra sección
  useEffect(() => {
    if (companyData) {
      setSavedData(companyData);
      setFormData(companyData);
    }
  }, [companyData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    setSavedData(formData);
    setCompanyData(formData);
    setSaveMessage('✓ Perfil guardado exitosamente');
    localStorage.setItem('inventariox_company', JSON.stringify(formData));
    setIsEditing(false);
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleCancel = () => {
    setFormData(savedData);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-[#111827] light-mode:bg-gray-50 p-4 sm:p-6 lg:p-8 transition-colors duration-300">
      <div className="max-w-2xl mx-auto">
        {/* Encabezado */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-white light-mode:text-gray-900 mb-2">
            Configuración
          </h1>
          <p className="text-gray-400 light-mode:text-gray-600">
            Perfil del Establecimiento
          </p>
        </div>

        {/* Mensaje de éxito */}
        {saveMessage && (
          <div className="mb-6 bg-green-900/30 light-mode:bg-green-100 border-2 border-green-500/50 light-mode:border-green-400 text-green-300 light-mode:text-green-800 px-6 py-3 rounded-lg font-semibold">
            {saveMessage}
          </div>
        )}

        {/* Tarjeta de Perfil - VISTA LECTURA */}
        {!isEditing && (
          <div className="bg-[#1f2937] light-mode:bg-white rounded-lg border border-gray-700 light-mode:border-gray-200 p-8 mb-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-white light-mode:text-gray-900">
                Perfil de Empresa
              </h2>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-6 py-2 bg-[#206DDA] hover:bg-blue-600 text-white rounded-lg font-semibold transition-all hover:shadow-lg"
              >
                <Edit2 className="w-4 h-4" />
                Editar
              </button>
            </div>

            <div className="space-y-6">
              {/* Nombre del Establecimiento */}
              <div className="p-5 bg-[#111827] light-mode:bg-gray-50 rounded-lg border border-gray-600 light-mode:border-gray-300">
                <p className="text-xs text-gray-400 light-mode:text-gray-600 font-bold mb-2 uppercase tracking-wide">
                  Nombre del Establecimiento
                </p>
                <p className="text-xl font-bold text-[#206DDA] light-mode:text-gray-900">
                  {savedData.nombreEstablecimiento || 'No definido'}
                </p>
              </div>

              {/* Nombre del Responsable */}
              <div className="p-5 bg-[#111827] light-mode:bg-gray-50 rounded-lg border border-gray-600 light-mode:border-gray-300">
                <p className="text-xs text-gray-400 light-mode:text-gray-600 font-bold mb-2 uppercase tracking-wide">
                  Nombre del Responsable
                </p>
                <p className="text-lg font-semibold text-white light-mode:text-gray-900">
                  {savedData.nombreResponsable || 'No definido'}
                </p>
              </div>

              {/* Ubicación / Sucursal */}
              <div className="p-5 bg-[#111827] light-mode:bg-gray-50 rounded-lg border border-gray-600 light-mode:border-gray-300">
                <p className="text-xs text-gray-400 light-mode:text-gray-600 font-bold mb-2 uppercase tracking-wide">
                  Ubicación / Sucursal
                </p>
                <p className="text-white light-mode:text-gray-900 leading-relaxed">
                  {savedData.ubicacion || 'No definida'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tarjeta de Perfil - FORMULARIO EDICIÓN */}
        {isEditing && (
          <div className="bg-[#1f2937] light-mode:bg-white rounded-lg border border-gray-700 light-mode:border-gray-200 p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-white light-mode:text-gray-900">
                Editar Perfil
              </h2>
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-gray-700 light-mode:hover:bg-gray-300 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400 light-mode:text-gray-600" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Nombre del Establecimiento */}
              <div>
                <label className="block text-sm font-bold text-gray-300 light-mode:text-gray-700 mb-3 uppercase tracking-wide">
                  Nombre del Establecimiento
                </label>
                <input
                  type="text"
                  name="nombreEstablecimiento"
                  value={formData.nombreEstablecimiento}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-[#111827] light-mode:bg-gray-50 border-2 border-gray-600 light-mode:border-gray-300 rounded-lg text-white light-mode:text-gray-900 placeholder-gray-500 focus:border-[#206DDA] focus:outline-none focus:ring-2 focus:ring-[#206DDA]/30 transition-all"
                  placeholder="Ej: Tienda Principal"
                />
              </div>

              {/* Nombre del Responsable */}
              <div>
                <label className="block text-sm font-bold text-gray-300 light-mode:text-gray-700 mb-3 uppercase tracking-wide">
                  Nombre del Responsable
                </label>
                <input
                  type="text"
                  name="nombreResponsable"
                  value={formData.nombreResponsable}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-[#111827] light-mode:bg-gray-50 border-2 border-gray-600 light-mode:border-gray-300 rounded-lg text-white light-mode:text-gray-900 placeholder-gray-500 focus:border-[#206DDA] focus:outline-none focus:ring-2 focus:ring-[#206DDA]/30 transition-all"
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              {/* Ubicación / Sucursal */}
              <div>
                <label className="block text-sm font-bold text-gray-300 light-mode:text-gray-700 mb-3 uppercase tracking-wide">
                  Ubicación / Sucursal
                </label>
                <textarea
                  name="ubicacion"
                  value={formData.ubicacion}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-3 bg-[#111827] light-mode:bg-gray-50 border-2 border-gray-600 light-mode:border-gray-300 rounded-lg text-white light-mode:text-gray-900 placeholder-gray-500 focus:border-[#206DDA] focus:outline-none focus:ring-2 focus:ring-[#206DDA]/30 transition-all resize-none"
                  placeholder="Ej: Calle Principal 123, Ciudad"
                />
              </div>

              {/* Botones de acción */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleSave}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#206DDA] hover:bg-blue-600 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl"
                >
                  <Save className="w-4 h-4" />
                  Guardar
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 px-6 py-3 bg-gray-700 light-mode:bg-gray-300 hover:bg-gray-600 light-mode:hover:bg-gray-400 text-white light-mode:text-gray-900 font-bold rounded-lg transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
