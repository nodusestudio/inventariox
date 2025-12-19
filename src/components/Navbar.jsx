import { Settings as SettingsIcon } from 'lucide-react';
import Logo from './Logo';
import { t } from '../utils/translations';

export default function Navbar({ activeTab, onTabChange, language = 'es' }) {
  const tabNames = {
    Panel: t(language, 'panel'),
    Proveedores: t(language, 'proveedores'),
    Productos: language === 'es' ? 'Productos' : 'Products',
    Inventario: language === 'es' ? 'Inventario' : 'Inventory',
    Pedidos: t(language, 'pedidos'),
    Configuración: t(language, 'configuracion'),
  };

  const tabs = ['Panel', 'Proveedores', 'Productos', 'Inventario', 'Pedidos', 'Configuración'];

  return (
    <nav className="sticky top-0 bg-gray-900 border-b border-gray-700 shadow-lg z-50 dark-mode light-mode:bg-white light-mode:border-gray-300">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo Component */}
          <Logo size="md" />

          {/* Tabs de navegación */}
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => onTabChange(tab)}
                className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                  activeTab === tab
                    ? 'tab-active'
                    : 'tab-inactive light-mode:text-gray-600 light-mode:hover:text-gray-900'
                }`}
              >
                {tab === 'Configuración' && <SettingsIcon className="w-4 h-4" />}
                {tabNames[tab]}
              </button>
            ))}
          </div>

          {/* Perfil placeholder */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center font-bold shadow-md light-mode:text-white">
            U
          </div>
        </div>
      </div>
    </nav>
  );
}
