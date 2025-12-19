import { useState } from 'react';
import { Settings as SettingsIcon, Menu, X } from 'lucide-react';
import Logo from './Logo';
import { t } from '../utils/translations';

export default function Navbar({ activeTab, onTabChange, language = 'es' }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const tabNames = {
    Panel: t(language, 'panel'),
    Proveedores: t(language, 'proveedores'),
    Productos: language === 'es' ? 'Productos' : 'Products',
    Inventario: language === 'es' ? 'Inventario' : 'Inventory',
    Pedidos: t(language, 'pedidos'),
    Configuración: t(language, 'configuracion'),
  };

  const tabs = ['Panel', 'Proveedores', 'Productos', 'Inventario', 'Pedidos', 'Configuración'];

  const handleTabChange = (tab) => {
    onTabChange(tab);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 bg-gray-900 border-b border-gray-700 shadow-lg z-50 dark-mode light-mode:bg-white light-mode:border-gray-300">
      <div className="w-full px-4 sm:px-6 md:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo Component */}
          <Logo size="md" />

          {/* Tabs de navegación - Desktop */}
          <div className="hidden md:flex gap-2">
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

          <div className="flex items-center gap-4">
            {/* Perfil placeholder */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center font-bold shadow-md light-mode:text-white flex-shrink-0">
              U
            </div>

            {/* Menú Hamburguesa - Mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-700 light-mode:hover:bg-gray-200 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-white light-mode:text-gray-900" />
              ) : (
                <Menu className="w-6 h-6 text-white light-mode:text-gray-900" />
              )}
            </button>
          </div>
        </div>

        {/* Menú Mobile Expandido */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-700 light-mode:border-gray-300">
            <div className="flex flex-col gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 text-left text-base ${
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
          </div>
        )}
      </div>
    </nav>
  );
}
