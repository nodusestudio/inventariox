import { useState } from 'react';
import { Mail, Lock, LogIn, UserPlus, Eye, EyeOff, CheckCircle, Send, LogOut } from 'lucide-react';
import { auth } from '../config/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendEmailVerification } from 'firebase/auth';
import Toast from './Toast';
import Swal from 'sweetalert2';

export default function AuthScreen({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [registroExitoso, setRegistroExitoso] = useState(false);
  const [unverifiedUser, setUnverifiedUser] = useState(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Iniciar sesión
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Verificar si el email está verificado
        if (!user.emailVerified) {
          // Mostrar pantalla de verificación pendiente
          setUnverifiedUser(user);
          setLoading(false);
          return;
        }

        // Mostrar bienvenida (primera vez o cada login)
        setToast({ message: `🎉 ¡Bienvenido, ${user.email}!`, type: 'success' });
        
        setTimeout(() => {
          onAuthSuccess(user);
        }, 500);
      } else {
        // Registro
        if (password !== confirmPassword) {
          setError('Las contraseñas no coinciden');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres');
          setLoading(false);
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Enviar email de verificación
        await sendEmailVerification(user);
        
        setRegistroExitoso(true);
        setError('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setToast({ message: '✓ Cuenta creada. Revisa tu email para verificar tu cuenta.', type: 'success' });
        
        setTimeout(() => {
          setRegistroExitoso(false);
          setIsLogin(true);
        }, 3000);
      }
    } catch (err) {
      console.error('Auth error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('El correo ya está registrado');
      } else if (err.code === 'auth/invalid-email') {
        setError('Correo electrónico inválido');
      } else if (err.code === 'auth/wrong-password') {
        setError('Contraseña incorrecta');
      } else if (err.code === 'auth/user-not-found') {
        setError('Usuario no encontrado');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Reenviar email de verificación
  const handleResendVerification = async () => {
    if (!unverifiedUser) return;
    
    setResendLoading(true);
    try {
      await sendEmailVerification(unverifiedUser);
      setToast({ message: '✓ Email de verificación enviado nuevamente. Revisa tu bandeja de entrada.', type: 'success' });
      
      // Iniciar cooldown de 60 segundos
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Error resending verification:', err);
      setToast({ message: '❌ Error al reenviar el email. Intenta más tarde.', type: 'error' });
    } finally {
      setResendLoading(false);
    }
  };

  // Cerrar sesión desde la pantalla de verificación
  const handleLogoutFromUnverified = async () => {
    try {
      await signOut(auth);
      setUnverifiedUser(null);
      setEmail('');
      setPassword('');
      setToast({ message: '✓ Sesión cerrada correctamente', type: 'success' });
    } catch (err) {
      console.error('Error logging out:', err);
      setToast({ message: '❌ Error al cerrar sesión', type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1f2937] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Toast */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white mb-2">InventarioX</h1>
          <p className="text-gray-400">Gestión de Inventario Profesional</p>
        </div>

        {/* Card */}
        <div className="bg-[#1f2937] light-mode:bg-white border border-gray-700 light-mode:border-gray-200 rounded-2xl p-8 shadow-2xl">
          {/* Pantalla de Verificación Pendiente */}
          {unverifiedUser ? (
            <div className="space-y-6">
              {/* Ícono */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center">
                    <Mail className="w-10 h-10 text-amber-400" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                </div>
              </div>

              {/* Título */}
              <h2 className="text-2xl font-bold text-white light-mode:text-gray-900 text-center">
                📧 Correo No Verificado
              </h2>

              {/* Descripción */}
              <div className="space-y-3 text-center">
                <p className="text-gray-300 light-mode:text-gray-700">
                  Tu cuenta no está verificada. Necesitas confirmar tu correo electrónico para continuar.
                </p>
                <p className="text-sm text-gray-400 light-mode:text-gray-600">
                  <strong>Email:</strong> {unverifiedUser.email}
                </p>
                <p className="text-xs text-gray-500 light-mode:text-gray-500 italic">
                  Revisa también la carpeta de spam o correo no deseado.
                </p>
              </div>

              {/* Alerta informativa */}
              <div className="p-4 bg-blue-900/20 border border-blue-500/50 rounded-lg text-blue-300 text-sm">
                <p className="font-semibold mb-1">💡 ¿No recibes el email?</p>
                <p>Haz clic en "Reenviar enlace" para que te enviemos otro correo de verificación.</p>
              </div>

              {/* Botón de Reenvío */}
              <button
                onClick={handleResendVerification}
                disabled={resendLoading || resendCooldown > 0}
                className="w-full py-3 bg-gradient-to-r from-[#206DDA] to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                {resendLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Enviando...
                  </>
                ) : resendCooldown > 0 ? (
                  <>
                    <Send className="w-5 h-5" />
                    Reenviar en {resendCooldown}s
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Reenviar Enlace de Verificación
                  </>
                )}
              </button>

              {/* Botón de Cerrar Sesión */}
              <button
                onClick={handleLogoutFromUnverified}
                className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                Cerrar Sesión
              </button>

              {/* Hint adicional */}
              <p className="text-xs text-gray-500 light-mode:text-gray-500 text-center">
                Si cambias de cuenta, puedes cerrar sesión e iniciar con otra.
              </p>
            </div>
          ) : (
            <>
              {/* Título */}
              <h2 className="text-2xl font-bold text-white light-mode:text-gray-900 mb-6 text-center">
                {registroExitoso ? '✨ ¡Registro Exitoso!' : (isLogin ? '🔐 Inicia Sesión' : '✨ Regístrate')}
              </h2>

              {/* Mensaje de registro exitoso */}
              {registroExitoso && (
                <div className="mb-6 p-4 bg-green-900/20 border border-green-500/50 rounded-lg text-green-400 text-sm flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Tu cuenta ha sido creada</p>
                    <p className="text-xs mt-1 opacity-90">Hemos enviado un email de verificación. Por favor, verifica tu correo antes de iniciar sesión.</p>
                  </div>
                </div>
              )}

              {/* Errores */}
              {error && (
                <div className="mb-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Formulario */}
              <form onSubmit={handleAuth} className="space-y-4">
                {registroExitoso ? (
                  <div className="text-center space-y-4">
                    <div className="flex justify-center">
                      <div className="animate-bounce">
                        <CheckCircle className="w-16 h-16 text-green-500" />
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm">
                      En pocos segundos serás redirigido al formulario de inicio de sesión...
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Email */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 light-mode:text-gray-700 mb-2">
                        Correo Electrónico
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="tu@email.com"
                          required
                          className="w-full pl-10 pr-4 py-2.5 bg-[#111827] light-mode:bg-gray-50 border border-gray-600 light-mode:border-gray-300 rounded-lg text-white light-mode:text-gray-900 placeholder-gray-500 focus:outline-none focus:border-[#206DDA] transition-colors"
                        />
                      </div>
                    </div>

                    {/* Contraseña */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 light-mode:text-gray-700 mb-2">
                        Contraseña
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="w-full pl-10 pr-12 py-2.5 bg-[#111827] light-mode:bg-gray-50 border border-gray-600 light-mode:border-gray-300 rounded-lg text-white light-mode:text-gray-900 placeholder-gray-500 focus:outline-none focus:border-[#206DDA] transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3.5 text-gray-500 hover:text-[#206DDA] transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirmar Contraseña (solo registro) */}
                    {!isLogin && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 light-mode:text-gray-700 mb-2">
                          Confirmar Contraseña
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="w-full pl-10 pr-12 py-2.5 bg-[#111827] light-mode:bg-gray-50 border border-gray-600 light-mode:border-gray-300 rounded-lg text-white light-mode:text-gray-900 placeholder-gray-500 focus:outline-none focus:border-[#206DDA] transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-3.5 text-gray-500 hover:text-[#206DDA] transition-colors"
                          >
                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Botón Principal */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 mt-6 bg-gradient-to-r from-[#206DDA] to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Cargando...
                        </>
                      ) : (
                        <>
                          {isLogin ? (
                            <>
                              <LogIn className="w-5 h-5" />
                              Iniciar Sesión
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-5 h-5" />
                              Registrarse
                            </>
                          )}
                        </>
                      )}
                    </button>
                  </>
                )}
              </form>

              {/* Toggle */}
              <p className="text-center text-gray-400 text-sm mt-6">
                {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                  }}
                  className="ml-2 text-[#206DDA] hover:text-blue-400 font-semibold transition-colors"
                >
                  {isLogin ? 'Regístrate' : 'Inicia sesión'}
                </button>
              </p>
            </>
          )}
        </div>

        {/* Demostración */}
        <div className="mt-8 p-4 bg-blue-900/20 border border-blue-500/50 rounded-lg text-blue-300 text-sm text-center">
          <p className="font-semibold mb-2">📝 Para Pruebas:</p>
          <p>Email: demo@test.com</p>
          <p>Pass: demo123456</p>
        </div>
      </div>
    </div>
  );
}
