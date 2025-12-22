import { useState, useEffect } from 'react';
import { Edit2, X, Save, Moon, Sun, Globe } from 'lucide-react';

export default function Settings({
  language = 'es',
  setLanguage = () => {},
  theme = 'dark',
  setTheme = () => {},
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
  const [tempTheme, setTempTheme] = useState(theme);
  const [tempLanguage, setTempLanguage] = useState(language);

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
    setTheme(tempTheme);
    setLanguage(tempLanguage);
    setSaveMessage('✓ Configuración guardada exitosamente');
    localStorage.setItem('inventariox_company', JSON.stringify(formData));
    localStorage.setItem('inventariox_theme', tempTheme);
    localStorage.setItem('inventariox_language', tempLanguage);
    setIsEditing(false);
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleCancel = () => {
    setFormData(savedData);
    setTempTheme(theme);
    setTempLanguage(language);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-[#111827] light-mode:bg-gray-50 p-4 sm:p-6 lg:p-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        {/* Encabezado */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-white light-mode:text-gray-900 mb-2">
            Configuración
          </h1>
          <p className="text-gray-400 light-mode:text-gray-600">
            Gestión del sistema y perfil del establecimiento
          </p>
        </div>

        {/* Mensaje de éxito */}
        {saveMessage && (
          <div className="mb-6 bg-green-900/30 light-mode:bg-green-100 border-2 border-green-500/50 light-mode:border-green-400 text-green-300 light-mode:text-green-800 px-6 py-3 rounded-lg font-semibold">
            {saveMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* COLUMNA IZQUIERDA - Perfil (2 columnas) */}
          <div className="lg:col-span-2">
            {/* Tarjeta de Perfil - VISTA LECTURA */}
            {!isEditing && (
              <div className="bg-[#1f2937] light-mode:bg-white rounded-lg border border-gray-700 light-mode:border-gray-200 p-8">
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

          {/* COLUMNA DERECHA - Preferencias (1 columna) */}
          <div>
            {/* Tarjeta Preferencias */}
            <div className="bg-[#1f2937] light-mode:bg-white rounded-lg border border-gray-700 light-mode:border-gray-200 p-6">
              <h3 className="text-xl font-bold text-white light-mode:text-gray-900 mb-6">
                ⚙️ Preferencias
              </h3>

              <div className="space-y-5">
                {/* Toggle Modo Oscuro/Claro */}
                <div className="p-4 bg-[#111827] light-mode:bg-gray-50 rounded-lg border border-gray-600 light-mode:border-gray-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {tempTheme === 'dark' ? (
                        <Moon className="w-5 h-5 text-yellow-400" />
                      ) : (
                        <Sun className="w-5 h-5 text-yellow-300" />
                      )}
                      <div>
                        <p className="font-bold text-white light-mode:text-gray-900">Tema</p>
                        <p className="text-xs text-gray-400 light-mode:text-gray-600">
                          {tempTheme === 'dark' ? 'Oscuro' : 'Claro'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setTempTheme(tempTheme === 'dark' ? 'light' : 'dark')}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                        tempTheme === 'dark' ? 'bg-[#206DDA]' : 'bg-gray-400'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
                          tempTheme === 'dark' ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Selector Idioma */}
                <div className="p-4 bg-[#111827] light-mode:bg-gray-50 rounded-lg border border-gray-600 light-mode:border-gray-300">
                  <div className="flex items-center gap-3 mb-3">
                    <Globe className="w-5 h-5 text-[#206DDA]" />
                    <p className="font-bold text-white light-mode:text-gray-900">Idioma</p>
                  </div>
                  <select
                    value={tempLanguage}
                    onChange={(e) => setTempLanguage(e.target.value)}
                    className="w-full px-3 py-2 bg-[#111827] light-mode:bg-white border-2 border-gray-600 light-mode:border-gray-300 rounded-lg text-white light-mode:text-gray-900 font-semibold focus:border-[#206DDA] focus:outline-none"
                  >
                    <option value="es">🇪🇸 Español</option>
                    <option value="en">🇺🇸 English</option>
                  </select>
                </div>

                {/* Estado */}
                <div className="p-4 bg-green-900/20 light-mode:bg-green-100 border border-green-500/50 light-mode:border-green-400 rounded-lg">
                  <p className="text-xs text-green-400 light-mode:text-green-700 font-bold mb-1 uppercase">Estado</p>
                  <p className="text-sm text-green-300 light-mode:text-green-800 font-semibold">
                    ✓ Sincronizado
                  </p>
                </div>

                {/* Botón Guardar */}
                {isEditing && (
                  <button
                    onClick={handleSave}
                    className="w-full px-4 py-3 bg-[#206DDA] hover:bg-blue-600 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl"
                  >
                    💾 Guardar Todo
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
