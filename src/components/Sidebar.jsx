import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Boxes, 
  Users, 
  ShoppingCart, 
  Database, 
  Settings as SettingsIcon,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  FileText,
  LogOut,
  AlertTriangle
} from 'lucide-react';
import Logo from './Logo';
import { t } from '../utils/translations';

export default function Sidebar({ currentPage, setCurrentPage, user, onLogout, language = 'es' }) {
  const [sidebarOpen, setSidebarOpen] = useState(true); // Abierto por defecto en desktop
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Detectar cambios de tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile && !sidebarOpen) {
        setSidebarOpen(true); // Abrir en desktop
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  // Configuración de pestañas con iconos
  const tabs = [
    { name: 'dashboard', icon: LayoutDashboard, label: 'Panel' },
    { name: 'providers', icon: Users, label: 'Proveedores' },
    { name: 'stock', icon: Boxes, label: 'Inventario' },
    { name: 'movements', icon: TrendingUp, label: 'Movimientos' },
    { name: 'orders', icon: ShoppingCart, label: 'Pedidos' },
    { name: 'mermas', icon: AlertTriangle, label: 'Mermas' },
    { name: 'reports', icon: FileText, label: 'Reportes' },
    { name: 'database', icon: Database, label: 'Base de Datos' },
    { name: 'settings', icon: SettingsIcon, label: 'Configuración' },
  ];

  const handleTabChange = (tabName) => {
    setCurrentPage(tabName);
    if (isMobile) {
      setSidebarOpen(false); // Cerrar en mobile después de seleccionar
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <>
      {/* Botón Hamburguesa/Toggle - Mobile y Desktop */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 md:hidden z-50 p-2 hover:bg-gray-700 rounded-lg transition-colors bg-[#1f2937] text-white"
      >
        {sidebarOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* Overlay - Mobile */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static top-0 left-0 h-screen transition-all duration-300 ease-in-out z-40 flex flex-col overflow-y-auto bg-[#1f2937] border-r border-[#374151] ${
          sidebarOpen ? 'w-64 md:w-64' : 'w-20 md:w-20'
        } ${
          isMobile && !sidebarOpen ? '-translate-x-full md:translate-x-0' : 'translate-x-0'
        }`}
      >
        {/* Header del Sidebar */}
        <div className="p-4 md:p-6 border-b border-[#374151] flex items-center justify-between">
          {sidebarOpen && (
            <Logo size="sm" />
          )}
          {/* Botón toggle - Desktop */}
          <button
            onClick={toggleSidebar}
            className="hidden md:flex p-1 hover:bg-gray-700 rounded transition-colors ml-auto"
          >
            {sidebarOpen ? (
              <ChevronLeft className="w-5 h-5 text-white" />
            ) : (
              <ChevronRight className="w-5 h-5 text-white" />
            )}
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 p-3 md:p-4 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentPage === tab.name;

            return (
              <button
                key={tab.name}
                onClick={() => handleTabChange(tab.name)}
                className={`w-full flex items-center gap-3 px-3 md:px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#206DDA] text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
                title={!sidebarOpen ? tab.label : ''}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <span className="truncate text-sm md:text-base">{tab.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer del Sidebar con usuario y logout */}
        <div className="p-3 md:p-4 border-t border-[#374151] space-y-3">
          {/* Info del usuario */}
          <div className={`flex items-center gap-3 px-3 md:px-4 py-3 rounded-lg bg-gray-700 bg-opacity-50 ${
            !sidebarOpen ? 'justify-center' : ''
          }`}>
            <div className="w-8 md:w-10 h-8 md:h-10 rounded-full bg-gradient-to-r from-[#206DDA] to-blue-500 flex items-center justify-center font-bold text-white text-sm md:text-base flex-shrink-0">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            {sidebarOpen && (
              <div className="text-left hidden sm:block truncate">
                <p className="text-xs md:text-sm font-medium text-white truncate">{user?.displayName || 'Usuario'}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
            )}
          </div>

          {/* Botón de Logout */}
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 md:px-4 py-3 rounded-lg font-medium transition-all duration-200 text-red-400 hover:bg-red-900/30 hover:text-red-300"
            title={!sidebarOpen ? 'Cerrar sesión' : ''}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && (
              <span className="truncate text-sm md:text-base">Cerrar Sesión</span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
