import { useState } from 'react';
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
  ChevronLeft
} from 'lucide-react';
import Logo from './Logo';
import { t } from '../utils/translations';

export default function Sidebar({ activeTab, onTabChange, language = 'es' }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Configuración de pestañas con iconos
  const tabs = [
    { name: 'Panel', icon: LayoutDashboard, label: t(language, 'panel') },
    { name: 'Proveedores', icon: Users, label: t(language, 'proveedores') },
    { name: 'Productos', icon: Package, label: language === 'es' ? 'Productos' : 'Products' },
    { name: 'Inventario', icon: Boxes, label: language === 'es' ? 'Inventario' : 'Inventory' },
    { name: 'Pedidos', icon: ShoppingCart, label: t(language, 'pedidos') },
    { name: 'Base de Datos', icon: Database, label: language === 'es' ? 'Base de Datos' : 'Database' },
    { name: 'Configuración', icon: SettingsIcon, label: t(language, 'configuracion') },
  ];

  const handleTabChange = (tab) => {
    onTabChange(tab);
    setSidebarOpen(false);
  };

  return (
    <>
      {/* Botón Hamburguesa - Mobile */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 md:hidden z-50 p-2 hover:bg-gray-700 rounded-lg transition-colors bg-[#1f2937] text-white"
      >
        {sidebarOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* Overlay - Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static top-0 left-0 h-screen w-64 bg-[#1f2937] border-r border-[#374151] transition-transform duration-300 ease-in-out z-40 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } flex flex-col overflow-y-auto`}
      >
        {/* Header del Sidebar */}
        <div className="p-6 border-b border-[#374151]">
          <div className="flex items-center justify-between">
            <Logo size="sm" />
            {/* Botón cerrar - Mobile */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1 hover:bg-gray-700 rounded transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 p-4 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.name;

            return (
              <button
                key={tab.name}
                onClick={() => handleTabChange(tab.name)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#206DDA] text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer del Sidebar */}
        <div className="p-4 border-t border-[#374151]">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-700 bg-opacity-50">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#206DDA] to-blue-500 flex items-center justify-center font-bold text-white flex-shrink-0">
              U
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-white">Usuario</p>
              <p className="text-xs text-gray-400">Admin</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
