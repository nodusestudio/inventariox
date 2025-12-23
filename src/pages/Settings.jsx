import { useState, useEffect } from 'react';
import { Edit2, X, Save, Moon, Sun, Globe, Lock, Trash2, LogOut } from 'lucide-react';
import { auth } from '../config/firebase';
import { updatePassword, deleteUser, signOut } from 'firebase/auth';
import Swal from 'sweetalert2';
import Toast from '../components/Toast';
import { deleteAllUserData } from '../services/firebaseService';

export default function Settings({
  language = 'es',
  setLanguage = () => {},
  theme = 'dark',
  setTheme = () => {},
  companyData,
  setCompanyData,
  onLogout = () => {}
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
  const [toast, setToast] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

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

  // Cambiar contraseña
  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setToast({ message: '❌ La contraseña debe tener al menos 6 caracteres', type: 'error' });
      return;
    }

    setPasswordLoading(true);
    try {
      await updatePassword(auth.currentUser, newPassword);
      setToast({ message: '✓ Contraseña cambiada exitosamente', type: 'success' });
      setNewPassword('');
      setShowChangePassword(false);
    } catch (err) {
      console.error('Error changing password:', err);
      
      if (err.code === 'auth/requires-recent-login') {
        setToast({ 
          message: '⚠️ Sesión expirada. Cierra sesión e inicia de nuevo para cambiar tu contraseña.', 
          type: 'error' 
        });
      } else if (err.code === 'auth/weak-password') {
        setToast({ message: '❌ La contraseña es muy débil', type: 'error' });
      } else {
        setToast({ message: `❌ Error: ${err.message}`, type: 'error' });
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  // Eliminar cuenta
  const handleDeleteAccount = async () => {
    const result = await Swal.fire({
      title: '⚠️ Eliminar Cuenta Permanentemente',
      html: `<p style="font-size: 14px; line-height: 1.6; color: #d1d5db;">
               <strong>Esta acción es IRREVERSIBLE.</strong><br><br>
               Se eliminarán:
               <ul style="text-align: left; margin: 10px 0; color: #f87171;">
                 <li>Tu cuenta de usuario</li>
                 <li>Todos tus productos</li>
                 <li>Todos tus pedidos</li>
                 <li>Todos tus proveedores</li>
                 <li>Todos tus movimientos de inventario</li>
               </ul>
             </p>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar mi cuenta',
      cancelButtonText: 'Cancelar',
      backdrop: 'rgba(15, 23, 42, 0.8)',
      customClass: {
        popup: 'swal-dark-popup'
      }
    });

    if (result.isConfirmed) {
      // Pedir confirmación final
      const finalConfirm = await Swal.fire({
        title: 'Confirmación Final',
        html: '<p style="font-size: 14px; color: #d1d5db;">¿Estás completamente seguro? Esta acción no se puede deshacer.</p>',
        icon: 'error',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sí, eliminar definitivamente',
        cancelButtonText: 'Cancelar',
        backdrop: 'rgba(15, 23, 42, 0.8)',
        customClass: {
          popup: 'swal-dark-popup'
        }
      });

      if (finalConfirm.isConfirmed) {
        try {
          // Eliminar datos en Firestore
          await deleteAllUserData(auth.currentUser.uid);

          // Eliminar usuario de Firebase Auth
          await deleteUser(auth.currentUser);

          // Logout y redirigir
          setToast({ message: '✓ Cuenta eliminada correctamente', type: 'success' });
          setTimeout(() => {
            onLogout?.();
          }, 1000);
        } catch (err) {
          console.error('Error deleting account:', err);
          
          if (err.code === 'auth/requires-recent-login') {
            setToast({ 
              message: '⚠️ Sesión expirada. Cierra sesión e inicia de nuevo para eliminar tu cuenta.', 
              type: 'error' 
            });
          } else {
            setToast({ message: `❌ Error: ${err.message}`, type: 'error' });
          }
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#111827] light-mode:bg-gray-50 p-4 sm:p-6 lg:p-8 transition-colors duration-300">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

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

            {/* Tarjeta de Seguridad */}
            <div className="bg-[#1f2937] light-mode:bg-white rounded-lg border border-gray-700 light-mode:border-gray-200 p-6">
              <h3 className="text-xl font-bold text-white light-mode:text-gray-900 mb-6">
                🔒 Seguridad
              </h3>

              <div className="space-y-5">
                {/* Cambiar Contraseña */}
                {!showChangePassword ? (
                  <button
                    onClick={() => setShowChangePassword(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#206DDA] hover:bg-blue-600 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl"
                  >
                    <Lock className="w-5 h-5" />
                    Cambiar Contraseña
                  </button>
                ) : (
                  <div className="space-y-3 p-4 bg-[#111827] light-mode:bg-gray-50 rounded-lg border border-gray-600 light-mode:border-gray-300">
                    <label className="block text-sm font-bold text-gray-300 light-mode:text-gray-700 uppercase tracking-wide">
                      Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full px-4 py-2.5 bg-[#111827] light-mode:bg-white border-2 border-gray-600 light-mode:border-gray-300 rounded-lg text-white light-mode:text-gray-900 placeholder-gray-500 focus:border-[#206DDA] focus:outline-none transition-all"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleChangePassword}
                        disabled={passwordLoading}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold rounded-lg transition-all"
                      >
                        {passwordLoading ? 'Actualizando...' : 'Guardar'}
                      </button>
                      <button
                        onClick={() => {
                          setShowChangePassword(false);
                          setNewPassword('');
                        }}
                        className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-all"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* Separador */}
                <div className="border-t border-gray-600 light-mode:border-gray-300"></div>

                {/* Eliminar Cuenta */}
                <button
                  onClick={handleDeleteAccount}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl"
                >
                  <Trash2 className="w-5 h-5" />
                  Eliminar Mi Cuenta
                </button>

                {/* Advertencia */}
                <div className="p-3 bg-red-900/20 light-mode:bg-red-100 border border-red-500/50 light-mode:border-red-400 rounded-lg">
                  <p className="text-xs text-red-400 light-mode:text-red-700 font-semibold">
                    ⚠️ Las acciones de seguridad requieren autenticación reciente. Si encuentras problemas, cierra sesión e inicia de nuevo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
