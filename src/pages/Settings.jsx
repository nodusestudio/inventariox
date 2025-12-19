import { useState } from 'react';
import { Moon, Sun, Globe, Edit2, X } from 'lucide-react';
import { t } from '../utils/translations';

export default function Settings({ theme, setTheme, language, setLanguage }) {
  const [savedData, setSavedData] = useState({
    nombreEmpresa: 'Mi Empresa',
    nitRut: '12.345.678-9',
    direccion: 'Calle Principal 123, Ciudad',
  });

  const [formData, setFormData] = useState({
    nombreEmpresa: 'Mi Empresa',
    nitRut: '12.345.678-9',
    direccion: 'Calle Principal 123, Ciudad',
  });

  const [saveMessage, setSaveMessage] = useState('');
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [tempTheme, setTempTheme] = useState(theme);
  const [tempLanguage, setTempLanguage] = useState(language);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    // Convertir datos a mayúsculas
    const dataToUpperCase = {
      nombreEmpresa: formData.nombreEmpresa.toUpperCase(),
      nitRut: formData.nitRut.toUpperCase(),
      direccion: formData.direccion.toUpperCase()
    };

    // Guardar los datos de la empresa
    setSavedData(dataToUpperCase);
    
    // Aplicar y guardar tema e idioma
    setTheme(tempTheme);
    setLanguage(tempLanguage);
    
    setSaveMessage('✓ Cambios guardados exitosamente');
    setTimeout(() => setSaveMessage(''), 3000);
    
    // Cerrar el formulario
    setIsEditingCompany(false);
    
    // Guardar en localStorage
    localStorage.setItem('companyData', JSON.stringify(dataToUpperCase));
    localStorage.setItem('theme', tempTheme);
    localStorage.setItem('language', tempLanguage);
  };

  const handleCancel = () => {
    setFormData(savedData);
    setIsEditingCompany(false);
  };

  const handleEditClick = () => {
    setFormData(savedData);
    setIsEditingCompany(true);
  };

  const toggleTheme = () => {
    setTempTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="min-h-screen bg-dark-bg light-mode:bg-gray-50 p-4 sm:p-6 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        {/* Encabezado */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold mb-1 sm:mb-2 text-white light-mode:text-gray-900">{t(language, 'configuracionAplicacion')}</h1>
          <p className="text-sm sm:text-base text-gray-400 light-mode:text-gray-600">{t(language, 'administraInformacion')}</p>
        </div>

        {/* Mensaje de éxito */}
        {saveMessage && (
          <div className="mb-6 bg-green-900/30 light-mode:bg-green-100 border border-green-500/50 light-mode:border-green-400 text-green-300 light-mode:text-green-800 px-4 py-3 rounded-lg animate-pulse transition-colors duration-300">
            {t(language, 'cambiosGuardados')}
          </div>
        )}

        {/* Container principal con grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Columna izquierda - Datos de la Empresa */}
          <div className="lg:col-span-2">
            {/* Tarjeta Datos de la Empresa - VISTA DE LECTURA */}
            {!isEditingCompany ? (
              <div className="metric-card mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-white light-mode:text-gray-900">
                    <div className="w-8 h-8 rounded-lg bg-blue-900/30 light-mode:bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-400 light-mode:text-blue-600 font-bold">📋</span>
                    </div>
                    {t(language, 'datosEmpresa')}
                  </h2>
                  <button
                    onClick={handleEditClick}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                    {t(language, 'editar')}
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-700/50 light-mode:bg-gray-200 rounded-lg transition-colors duration-300">
                    <p className="text-xs text-gray-400 light-mode:text-gray-600 font-semibold mb-1">{t(language, 'nombreEmpresa').toUpperCase()}</p>
                    <p className="text-lg font-semibold text-white light-mode:text-gray-900">{savedData.nombreEmpresa}</p>
                  </div>

                  <div className="p-4 bg-gray-700/50 light-mode:bg-gray-200 rounded-lg transition-colors duration-300">
                    <p className="text-xs text-gray-400 light-mode:text-gray-600 font-semibold mb-1">{t(language, 'nitRut')}</p>
                    <p className="text-lg font-semibold text-white light-mode:text-gray-900">{savedData.nitRut}</p>
                  </div>

                  <div className="p-4 bg-gray-700/50 light-mode:bg-gray-200 rounded-lg transition-colors duration-300">
                    <p className="text-xs text-gray-400 light-mode:text-gray-600 font-semibold mb-1">{t(language, 'direccion').toUpperCase()}</p>
                    <p className="text-white light-mode:text-gray-900 whitespace-pre-wrap">{savedData.direccion}</p>
                  </div>
                </div>
              </div>
            ) : (
              /* Tarjeta Datos de la Empresa - FORMULARIO DE EDICIÓN */
              <div className="metric-card mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold flex items-center gap-2 text-white light-mode:text-gray-900">
                    <div className="w-8 h-8 rounded-lg bg-blue-900/30 light-mode:bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-400 light-mode:text-blue-600 font-bold">📋</span>
                    </div>
                    {t(language, 'editarDatos')}
                  </h2>
                  <button
                    onClick={handleCancel}
                    className="p-2 hover:bg-gray-700 light-mode:hover:bg-gray-300 rounded-lg transition-all"
                  >
                    <X className="w-5 h-5 text-gray-400 light-mode:text-gray-600" />
                  </button>
                </div>

                <div className="space-y-5">
                  {/* Nombre de la Empresa */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 light-mode:text-gray-700 mb-2">
                      {t(language, 'nombreEmpresa')}
                    </label>
                    <input
                      type="text"
                      name="nombreEmpresa"
                      value={formData.nombreEmpresa}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-700 light-mode:bg-gray-100 border border-gray-600 light-mode:border-gray-300 rounded-lg text-white light-mode:text-gray-900 placeholder-gray-500 light-mode:placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                      placeholder={t(language, 'ingresaNombreEmpresa')}
                    />
                  </div>

                  {/* NIT/RUT */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 light-mode:text-gray-700 mb-2">
                      {t(language, 'nitRut')}
                    </label>
                    <input
                      type="text"
                      name="nitRut"
                      value={formData.nitRut}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-700 light-mode:bg-gray-100 border border-gray-600 light-mode:border-gray-300 rounded-lg text-white light-mode:text-gray-900 placeholder-gray-500 light-mode:placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                      placeholder="12.345.678-9"
                    />
                  </div>

                  {/* Dirección */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 light-mode:text-gray-700 mb-2">
                      {t(language, 'direccion')}
                    </label>
                    <textarea
                      name="direccion"
                      value={formData.direccion}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-4 py-3 bg-gray-700 light-mode:bg-gray-100 border border-gray-600 light-mode:border-gray-300 rounded-lg text-white light-mode:text-gray-900 placeholder-gray-500 light-mode:placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-none"
                      placeholder={t(language, 'ingresaDireccion')}
                    />
                  </div>

                  {/* Botones de acción */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSave}
                      className="flex-1 px-6 py-3 bg-primary hover:bg-blue-600 text-white font-semibold rounded-lg transition-all shadow-lg"
                    >
                      {t(language, 'guardar')}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex-1 px-6 py-3 bg-gray-700 light-mode:bg-gray-300 hover:bg-gray-600 light-mode:hover:bg-gray-400 text-white light-mode:text-gray-900 font-semibold rounded-lg transition-all"
                    >
                      {t(language, 'cancelar')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tarjeta Preferencias de Interfaz */}
            <div className="metric-card">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white light-mode:text-gray-900">
                <div className="w-8 h-8 rounded-lg bg-blue-900/30 light-mode:bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-400 light-mode:text-blue-600 font-bold">🎨</span>
                </div>
                {t(language, 'preferenciaInterfaz')}
              </h2>

              <div className="space-y-5">
                {/* Toggle Modo Oscuro/Claro */}
                <div className="flex items-center justify-between p-4 bg-gray-700/50 light-mode:bg-gray-200 rounded-lg transition-colors duration-300">
                  <div className="flex items-center gap-3">
                    {tempTheme === 'dark' ? (
                      <Moon className="w-5 h-5 text-yellow-400 light-mode:text-gray-600" />
                    ) : (
                      <Sun className="w-5 h-5 text-yellow-300 light-mode:text-yellow-500" />
                    )}
                    <div>
                      <p className="font-semibold text-white light-mode:text-gray-900">{t(language, 'modoTema')}</p>
                      <p className="text-sm text-gray-400 light-mode:text-gray-600">
                        {tempTheme === 'dark' ? t(language, 'modoOscuro') : t(language, 'modoClaro')}
                      </p>
                    </div>
                  </div>
                  
                  {/* Toggle Switch */}
                  <button
                    onClick={toggleTheme}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                      tempTheme === 'dark' ? 'bg-primary' : 'bg-gray-600 light-mode:bg-gray-400'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
                        tempTheme === 'dark' ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Dropdown Idioma */}
                <div className="p-4 bg-gray-700/50 light-mode:bg-gray-200 rounded-lg transition-colors duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <Globe className="w-5 h-5 text-blue-400 light-mode:text-blue-600" />
                    <div>
                      <p className="font-semibold text-white light-mode:text-gray-900">{t(language, 'idioma')}</p>
                      <p className="text-sm text-gray-400 light-mode:text-gray-600">{t(language, 'seleccionaIdioma')}</p>
                    </div>
                  </div>
                  
                  <select
                    value={tempLanguage}
                    onChange={(e) => setTempLanguage(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 light-mode:bg-white border border-gray-600 light-mode:border-gray-300 rounded-lg text-white light-mode:text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                  >
                    <option value="es">{t(language, 'espanol')}</option>
                    <option value="en">{t(language, 'ingles')}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Columna derecha - Resumen y acciones */}
          <div>
            {/* Tarjeta Resumen */}
            <div className="metric-card h-full flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white light-mode:text-gray-900">
                  <div className="w-8 h-8 rounded-lg bg-green-900/30 light-mode:bg-green-100 flex items-center justify-center">
                    <span className="text-green-400 light-mode:text-green-600 font-bold">✓</span>
                  </div>
                  {t(language, 'resumen')}
                </h2>

                <div className="space-y-4">
                  {/* Estado de sincronización */}
                  <div className="p-3 bg-green-900/20 light-mode:bg-green-100 border border-green-500/30 light-mode:border-green-400 rounded-lg transition-colors duration-300">
                    <p className="text-sm font-semibold text-green-400 light-mode:text-green-700 mb-1">{t(language, 'estado')}</p>
                    <p className="text-xs text-green-300 light-mode:text-green-600">
                      {t(language, 'sincronizado')}
                    </p>
                  </div>

                  {/* Información actual */}
                  <div className="p-3 bg-gray-700/50 light-mode:bg-gray-200 rounded-lg transition-colors duration-300">
                    <p className="text-xs text-gray-400 light-mode:text-gray-600 font-semibold mb-2">{t(language, 'empresaActual')}</p>
                    <p className="text-sm font-semibold text-white light-mode:text-gray-900 mb-1">{formData.nombreEmpresa}</p>
                    <p className="text-xs text-gray-400 light-mode:text-gray-600">{formData.nitRut}</p>
                  </div>

                  {/* Tema actual */}
                  <div className="p-3 bg-gray-700/50 light-mode:bg-gray-200 rounded-lg transition-colors duration-300">
                    <p className="text-xs text-gray-400 light-mode:text-gray-600 font-semibold mb-2">{t(language, 'temaActual')}</p>
                    <p className="text-sm font-semibold text-white light-mode:text-gray-900">
                      {tempTheme === 'dark' ? t(language, 'modoOscuro') : t(language, 'modoClaro')}
                    </p>
                  </div>

                  {/* Idioma actual */}
                  <div className="p-3 bg-gray-700/50 light-mode:bg-gray-200 rounded-lg transition-colors duration-300">
                    <p className="text-xs text-gray-400 light-mode:text-gray-600 font-semibold mb-2">{t(language, 'idiomaActual')}</p>
                    <p className="text-sm font-semibold text-white light-mode:text-gray-900">
                      {tempLanguage === 'es' ? t(language, 'espanol') : t(language, 'ingles')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Botón Guardar */}
              <button
                onClick={handleSave}
                className="w-full mt-6 px-6 py-3 bg-primary hover:bg-blue-600 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {t(language, 'guardarCambios')}
              </button>
            </div>
          </div>
        </div>

        {/* Sección adicional - Información de la aplicación */}
        <div className="mt-8 metric-card">
          <h3 className="text-lg font-bold mb-4 text-gray-300 light-mode:text-gray-700">{t(language, 'informacionAplicacion')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-gray-700/50 light-mode:bg-gray-200 rounded-lg transition-colors duration-300">
              <p className="text-xs text-gray-400 light-mode:text-gray-600 font-semibold">{t(language, 'version')}</p>
              <p className="text-sm font-semibold text-white light-mode:text-gray-900 mt-1">1.0.0</p>
            </div>
            <div className="p-3 bg-gray-700/50 light-mode:bg-gray-200 rounded-lg transition-colors duration-300">
              <p className="text-xs text-gray-400 light-mode:text-gray-600 font-semibold">{t(language, 'ultimaActualizacion')}</p>
              <p className="text-sm font-semibold text-white light-mode:text-gray-900 mt-1">18/12/2025</p>
            </div>
            <div className="p-3 bg-gray-700/50 light-mode:bg-gray-200 rounded-lg transition-colors duration-300">
              <p className="text-xs text-gray-400 light-mode:text-gray-600 font-semibold">{t(language, 'estado')}</p>
              <p className="text-sm font-semibold text-green-400 light-mode:text-green-600 mt-1">{t(language, 'activo')}</p>
            </div>
            <div className="p-3 bg-gray-700/50 light-mode:bg-gray-200 rounded-lg transition-colors duration-300">
              <p className="text-xs text-gray-400 light-mode:text-gray-600 font-semibold">{t(language, 'licencia')}</p>
              <p className="text-sm font-semibold text-white light-mode:text-gray-900 mt-1">{t(language, 'privada')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
