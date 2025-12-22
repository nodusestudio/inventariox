import { useState } from 'react';
import { Mail, Lock, LogIn, UserPlus } from 'lucide-react';
import { auth } from '../config/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

export default function AuthScreen({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Iniciar sesión
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        onAuthSuccess(userCredential.user);
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
        onAuthSuccess(userCredential.user);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1f2937] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white mb-2">InventarioX</h1>
          <p className="text-gray-400">Gestión de Inventario Profesional</p>
        </div>

        {/* Card */}
        <div className="bg-[#1f2937] light-mode:bg-white border border-gray-700 light-mode:border-gray-200 rounded-2xl p-8 shadow-2xl">
          {/* Título */}
          <h2 className="text-2xl font-bold text-white light-mode:text-gray-900 mb-6 text-center">
            {isLogin ? '🔐 Inicia Sesión' : '✨ Regístrate'}
          </h2>

          {/* Errores */}
          {error && (
            <div className="mb-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleAuth} className="space-y-4">
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
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-[#111827] light-mode:bg-gray-50 border border-gray-600 light-mode:border-gray-300 rounded-lg text-white light-mode:text-gray-900 placeholder-gray-500 focus:outline-none focus:border-[#206DDA] transition-colors"
                />
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
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-[#111827] light-mode:bg-gray-50 border border-gray-600 light-mode:border-gray-300 rounded-lg text-white light-mode:text-gray-900 placeholder-gray-500 focus:outline-none focus:border-[#206DDA] transition-colors"
                  />
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
