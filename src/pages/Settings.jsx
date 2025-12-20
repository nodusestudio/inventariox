import { useState, useEffect } from 'react';
import { Moon, Sun, Globe, Edit2, X } from 'lucide-react';
import { t } from '../utils/translations';

export default function Settings({
  theme,
  setTheme,
  language,
  setLanguage,
  companyData,
  setCompanyData,
}) {
  const [savedData, setSavedData] = useState(companyData || {
    nombreEmpresa: 'Mi Empresa',
    nitRut: '12.345.678-9',
    direccion: 'Calle Principal 123, Ciudad',
  });

  const [formData, setFormData] = useState(companyData || {
    nombreEmpresa: 'Mi Empresa',
    nitRut: '12.345.678-9',
    direccion: 'Calle Principal 123, Ciudad',
  });

  const [saveMessage, setSaveMessage] = useState('');
  const [isEditingCompany, setIsEditingCompany] = useState(false);
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
    // Convertir datos a mayúsculas
    const dataToUpperCase = {
      nombreEmpresa: formData.nombreEmpresa.toUpperCase(),
      nitRut: formData.nitRut.toUpperCase(),
      direccion: formData.direccion.toUpperCase()
    };

    // Guardar los datos de la empresa
    setSavedData(dataToUpperCase);
    setCompanyData(dataToUpperCase);
    
    // Aplicar y guardar tema e idioma
    setTheme(tempTheme);
    setLanguage(tempLanguage);
    
    // Mostrar mensaje de éxito
    setSaveMessage('✓ Cambios guardados exitosamente');
    
    // Guardar en localStorage
    localStorage.setItem('fodexa_settings', JSON.stringify(dataToUpperCase));
    localStorage.setItem('theme', tempTheme);
    localStorage.setItem('language', tempLanguage);
    
    // Cerrar el formulario inmediatamente
    setIsEditingCompany(false);
    
    // Limpiar mensaje después de 3 segundos
    setTimeout(() => setSaveMessage(''), 3000);
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
    <div className="min-h-screen bg-[#111827] light-mode:bg-gray-50 p-4 sm:p-6 lg:p-8 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        {/* Encabezado */}
        <div className="mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-white light-mode:text-gray-900">{t(language, 'configuracionAplicacion')}</h1>
          <p className="text-sm sm:text-base text-gray-400 light-mode:text-gray-600 leading-relaxed">{t(language, 'administraInformacion')}</p>
        </div>

        {/* Mensaje de éxito */}
        {saveMessage && (
          <div className="mb-8 bg-green-900/30 light-mode:bg-green-100 border-2 border-green-500/50 light-mode:border-green-400 text-green-300 light-mode:text-green-800 px-6 py-4 rounded-lg animate-pulse transition-all duration-300 font-semibold shadow-lg">
            ✓ {t(language, 'cambiosGuardados')}
          </div>
        )}

        {/* Container principal con grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Columna izquierda - Datos de la Empresa */}
          <div className="lg:col-span-2">
            {/* Tarjeta Datos de la Empresa - VISTA DE LECTURA */}
            {!isEditingCompany && (
              <div className="card mb-6">
                <div className="card-header">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-3 text-white light-mode:text-gray-900">
                      <div className="w-10 h-10 rounded-lg bg-[#206DDA]/20 flex items-center justify-center">
                        <span className="text-2xl">📋</span>
                      </div>
                      {t(language, 'datosEmpresa')}
                    </h2>
                    <button
                      onClick={handleEditClick}
                      className="flex items-center gap-2 px-5 py-2 bg-[#206DDA] hover:bg-blue-600 text-white rounded-lg font-semibold transition-all duration-200 transform hover:scale-105"
                    >
                      <Edit2 className="w-4 h-4" />
                      {t(language, 'editar')}
                    </button>
                  </div>
                </div>

                <div className="card-body">
                  <div className="space-y-4">
                    <div className="p-5 bg-[#1f2937] light-mode:bg-gray-100 rounded-lg border border-[#374151] light-mode:border-gray-300 transition-all duration-300 hover:border-[#475569] light-mode:hover:border-gray-400">
                      <p className="text-xs text-gray-400 light-mode:text-gray-600 font-bold mb-2 uppercase tracking-wide">{t(language, 'nombreEmpresa')}</p>
                      <p className="text-xl font-bold text-[#206DDA] light-mode:text-gray-900">{savedData.nombreEmpresa}</p>
                    </div>

                    <div className="p-5 bg-[#1f2937] light-mode:bg-gray-100 rounded-lg border border-[#374151] light-mode:border-gray-300 transition-all duration-300 hover:border-[#475569] light-mode:hover:border-gray-400">
                      <p className="text-xs text-gray-400 light-mode:text-gray-600 font-bold mb-2 uppercase tracking-wide">{t(language, 'nitRut')}</p>
                      <p className="text-lg font-semibold text-white light-mode:text-gray-900 font-mono">{savedData.nitRut}</p>
                    </div>

                    <div className="p-5 bg-[#1f2937] light-mode:bg-gray-100 rounded-lg border border-[#374151] light-mode:border-gray-300 transition-all duration-300 hover:border-[#475569] light-mode:hover:border-gray-400">
                      <p className="text-xs text-gray-400 light-mode:text-gray-600 font-bold mb-2 uppercase tracking-wide">{t(language, 'direccion')}</p>
                      <p className="text-white light-mode:text-gray-900 leading-relaxed whitespace-pre-wrap">{savedData.direccion}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tarjeta Datos de la Empresa - FORMULARIO DE EDICIÓN */}
            {isEditingCompany && (
              <div className="card mb-6 animate-in fade-in duration-300">
                <div className="card-header">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-3 text-white light-mode:text-gray-900">
                      <div className="w-10 h-10 rounded-lg bg-[#206DDA]/20 flex items-center justify-center">
                        <span className="text-2xl">✏️</span>
                      </div>
                      {t(language, 'editarDatos')}
                    </h2>
                    <button
                      onClick={handleCancel}
                      className="p-2 hover:bg-gray-700 light-mode:hover:bg-gray-300 rounded-lg transition-all duration-200"
                    >
                      <X className="w-5 h-5 text-gray-400 light-mode:text-gray-600" />
                    </button>
                  </div>
                </div>

                <div className="card-body">
                  <div className="space-y-5">
                    {/* Nombre de la Empresa */}
                    <div>
                      <label className="block text-sm font-bold text-gray-300 light-mode:text-gray-700 mb-3 uppercase tracking-wide">
                        {t(language, 'nombreEmpresa')}
                      </label>
                      <input
                        type="text"
                        name="nombreEmpresa"
                        value={formData.nombreEmpresa}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-[#111827] light-mode:bg-gray-50 border-2 border-[#374151] light-mode:border-gray-300 rounded-lg text-white light-mode:text-gray-900 placeholder-gray-500 light-mode:placeholder-gray-400 focus:border-[#206DDA] focus:outline-none focus:ring-2 focus:ring-[#206DDA]/30 transition-all duration-200"
                        placeholder={t(language, 'ingresaNombreEmpresa')}
                      />
                    </div>

                    {/* NIT/RUT */}
                    <div>
                      <label className="block text-sm font-bold text-gray-300 light-mode:text-gray-700 mb-3 uppercase tracking-wide">
                        {t(language, 'nitRut')}
                      </label>
                      <input
                        type="text"
                        name="nitRut"
                        value={formData.nitRut}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-[#111827] light-mode:bg-gray-50 border-2 border-[#374151] light-mode:border-gray-300 rounded-lg text-white light-mode:text-gray-900 placeholder-gray-500 light-mode:placeholder-gray-400 focus:border-[#206DDA] focus:outline-none focus:ring-2 focus:ring-[#206DDA]/30 transition-all duration-200 font-mono"
                        placeholder="12.345.678-9"
                      />
                    </div>

                    {/* Dirección */}
                    <div>
                      <label className="block text-sm font-bold text-gray-300 light-mode:text-gray-700 mb-3 uppercase tracking-wide">
                        {t(language, 'direccion')}
                      </label>
                      <textarea
                        name="direccion"
                        value={formData.direccion}
                        onChange={handleInputChange}
                        rows="4"
                        className="w-full px-4 py-3 bg-[#111827] light-mode:bg-gray-50 border-2 border-[#374151] light-mode:border-gray-300 rounded-lg text-white light-mode:text-gray-900 placeholder-gray-500 light-mode:placeholder-gray-400 focus:border-[#206DDA] focus:outline-none focus:ring-2 focus:ring-[#206DDA]/30 transition-all duration-200 resize-none"
                        placeholder={t(language, 'ingresaDireccion')}
                      />
                    </div>

                    {/* Botones de acción */}
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handleSave}
                        className="flex-1 px-6 py-3 bg-[#206DDA] hover:bg-blue-600 text-white font-bold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        {t(language, 'guardar')}
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex-1 px-6 py-3 bg-[#374151] light-mode:bg-gray-300 hover:bg-[#475569] light-mode:hover:bg-gray-400 text-white light-mode:text-gray-900 font-bold rounded-lg transition-all duration-200"
                      >
                        {t(language, 'cancelar')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tarjeta Preferencias de Interfaz */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-bold flex items-center gap-3 text-white light-mode:text-gray-900">
                  <div className="w-10 h-10 rounded-lg bg-[#206DDA]/20 flex items-center justify-center">
                    <span className="text-2xl">🎨</span>
                  </div>
                  {t(language, 'preferenciaInterfaz')}
                </h2>
              </div>

              <div className="card-body">
                <div className="space-y-5">
                  {/* Toggle Modo Oscuro/Claro */}
                  <div className="flex items-center justify-between p-5 bg-[#1f2937] light-mode:bg-gray-100 rounded-lg border border-[#374151] light-mode:border-gray-300 transition-all duration-300 hover:border-[#475569] light-mode:hover:border-gray-400">
                    <div className="flex items-center gap-3">
                      {tempTheme === 'dark' ? (
                        <Moon className="w-6 h-6 text-yellow-400 light-mode:text-gray-600" />
                      ) : (
                        <Sun className="w-6 h-6 text-yellow-300 light-mode:text-yellow-500" />
                      )}
                      <div>
                        <p className="font-bold text-white light-mode:text-gray-900">{t(language, 'modoTema')}</p>
                        <p className="text-sm text-gray-400 light-mode:text-gray-600">
                          {tempTheme === 'dark' ? t(language, 'modoOscuro') : t(language, 'modoClaro')}
                        </p>
                      </div>
                    </div>
                    
                    {/* Toggle Switch */}
                    <button
                      onClick={toggleTheme}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 ${
                        tempTheme === 'dark' ? 'bg-[#206DDA]' : 'bg-gray-600 light-mode:bg-gray-400'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                          tempTheme === 'dark' ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Dropdown Idioma */}
                  <div className="p-5 bg-[#1f2937] light-mode:bg-gray-100 rounded-lg border border-[#374151] light-mode:border-gray-300 transition-all duration-300 hover:border-[#475569] light-mode:hover:border-gray-400">
                    <div className="flex items-center gap-3 mb-4">
                      <Globe className="w-6 h-6 text-[#206DDA] light-mode:text-blue-600" />
                      <div>
                        <p className="font-bold text-white light-mode:text-gray-900">{t(language, 'idioma')}</p>
                        <p className="text-sm text-gray-400 light-mode:text-gray-600">{t(language, 'seleccionaIdioma')}</p>
                      </div>
                    </div>
                    
                    <select
                      value={tempLanguage}
                      onChange={(e) => setTempLanguage(e.target.value)}
                      className="w-full px-4 py-3 bg-[#111827] light-mode:bg-white border-2 border-[#374151] light-mode:border-gray-300 rounded-lg text-white light-mode:text-gray-900 font-semibold focus:border-[#206DDA] focus:outline-none focus:ring-2 focus:ring-[#206DDA]/30 transition-all duration-200"
                    >
                      <option value="es">{t(language, 'espanol')}</option>
                      <option value="en">{t(language, 'ingles')}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Columna derecha - Resumen y acciones */}
          <div>
            {/* Tarjeta Resumen */}
            <div className="card h-full flex flex-col justify-between">
              <div className="card-header">
                <h2 className="text-xl font-bold flex items-center gap-3 text-white light-mode:text-gray-900">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <span className="text-2xl">✓</span>
                  </div>
                  {t(language, 'resumen')}
                </h2>
              </div>

              <div className="card-body flex-1">
                <div className="space-y-4">
                  {/* Estado de sincronización */}
                  <div className="p-4 bg-green-900/20 light-mode:bg-green-100 border-2 border-green-500/50 light-mode:border-green-400 rounded-lg transition-all duration-300">
                    <p className="text-sm font-bold text-green-400 light-mode:text-green-700 mb-1 uppercase tracking-wide">{t(language, 'estado')}</p>
                    <p className="text-sm text-green-300 light-mode:text-green-600 font-semibold">
                      ✓ {t(language, 'sincronizado')}
                    </p>
                  </div>

                  {/* Información actual */}
                  <div className="p-4 bg-[#1f2937] light-mode:bg-gray-100 rounded-lg border border-[#374151] light-mode:border-gray-300 transition-all duration-300">
                    <p className="text-xs text-gray-400 light-mode:text-gray-600 font-bold mb-3 uppercase tracking-wide">{t(language, 'empresaActual')}</p>
                    <p className="text-base font-bold text-[#206DDA] light-mode:text-gray-900 mb-2">{savedData.nombreEmpresa}</p>
                    <p className="text-xs text-gray-500 light-mode:text-gray-600 font-mono">{savedData.nitRut}</p>
                  </div>

                  {/* Tema actual */}
                  <div className="p-4 bg-[#1f2937] light-mode:bg-gray-100 rounded-lg border border-[#374151] light-mode:border-gray-300 transition-all duration-300">
                    <p className="text-xs text-gray-400 light-mode:text-gray-600 font-bold mb-2 uppercase tracking-wide">{t(language, 'temaActual')}</p>
                    <p className="text-base font-bold text-white light-mode:text-gray-900 flex items-center gap-2">
                      {tempTheme === 'dark' ? (
                        <>
                          <Moon className="w-4 h-4 text-yellow-400" />
                          {t(language, 'modoOscuro')}
                        </>
                      ) : (
                        <>
                          <Sun className="w-4 h-4 text-yellow-300" />
                          {t(language, 'modoClaro')}
                        </>
                      )}
                    </p>
                  </div>

                  {/* Idioma actual */}
                  <div className="p-4 bg-[#1f2937] light-mode:bg-gray-100 rounded-lg border border-[#374151] light-mode:border-gray-300 transition-all duration-300">
                    <p className="text-xs text-gray-400 light-mode:text-gray-600 font-bold mb-2 uppercase tracking-wide">{t(language, 'idiomaActual')}</p>
                    <p className="text-base font-bold text-white light-mode:text-gray-900 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-[#206DDA]" />
                      {tempLanguage === 'es' ? t(language, 'espanol') : t(language, 'ingles')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card-footer">
                <button
                  onClick={handleSave}
                  className="w-full px-6 py-4 bg-[#206DDA] hover:bg-blue-600 text-white font-bold text-lg rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  {t(language, 'guardarCambios')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
