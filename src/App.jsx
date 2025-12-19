import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Stock from './pages/Stock';
import Providers from './pages/Providers';
import Orders from './pages/Orders';
import Settings from './pages/Settings';
import DatabasePage from './pages/Database';

// ============================================================================
// DATOS POR DEFECTO
// ============================================================================

const DEFAULT_COMPANY = {
  nombreEmpresa: 'MI EMPRESA',
  nitRut: '12.345.678-9',
  direccion: 'Calle Principal 123, Ciudad',
};

const DEFAULT_PRODUCTS = [
  {
    id: 1,
    nombre: 'LAPTOP DELL XPS',
    proveedor: 'DISTRIBUIDORA ABC',
    proveedorId: 1,
    unidad: 'UNIDADES',
    contenidoEmpaque: '1 UNIDAD',
    merma: 2.5,
    costo: 800000,
  },
  {
    id: 2,
    nombre: 'MONITOR LG 27"',
    proveedor: 'IMPORTACIONES GLOBAL',
    proveedorId: 2,
    unidad: 'UNIDADES',
    contenidoEmpaque: '1 UNIDAD',
    merma: 1.0,
    costo: 250000,
  },
  {
    id: 3,
    nombre: 'TECLADO MECÁNICO RGB',
    proveedor: 'LOGÍSTICA DEL SUR',
    proveedorId: 3,
    unidad: 'UNIDADES',
    contenidoEmpaque: '1 UNIDAD',
    merma: 0.5,
    costo: 85000,
  },
  {
    id: 4,
    nombre: 'MOUSE INALÁMBRICO',
    proveedor: 'DISTRIBUIDORA ABC',
    proveedorId: 1,
    unidad: 'UNIDADES',
    contenidoEmpaque: '1 UNIDAD',
    merma: 1.5,
    costo: 35000,
  },
  {
    id: 5,
    nombre: 'CABLE HDMI 2.1',
    proveedor: 'IMPORTACIONES GLOBAL',
    proveedorId: 2,
    unidad: 'METROS',
    contenidoEmpaque: '1 METRO',
    merma: 0.1,
    costo: 12000,
  },
  {
    id: 6,
    nombre: 'PASTA TÉRMICA PREMIUM',
    proveedor: 'LOGÍSTICA DEL SUR',
    proveedorId: 3,
    unidad: 'TUBOS',
    contenidoEmpaque: '1 TUBO',
    merma: 2.0,
    costo: 15000,
  },
];

const DEFAULT_PROVIDERS = [
  { id: 1, nombre: 'DISTRIBUIDORA ABC', contacto: 'JUAN PÉREZ', email: 'JUAN@ABC.COM', whatsapp: '56912345678' },
  { id: 2, nombre: 'IMPORTACIONES GLOBAL', contacto: 'MARÍA GARCÍA', email: 'MARIA@GLOBAL.COM', whatsapp: '56987654321' },
  { id: 3, nombre: 'LOGÍSTICA DEL SUR', contacto: 'CARLOS LÓPEZ', email: 'CARLOS@SUR.COM', whatsapp: '56955555555' },
];

const DEFAULT_STOCK = [
  { id: 1, productoId: 1, stockActual: 5, stockMinimo: 2, stockCompra: 10 },
  { id: 2, productoId: 2, stockActual: 8, stockMinimo: 3, stockCompra: 15 },
  { id: 3, productoId: 3, stockActual: 12, stockMinimo: 5, stockCompra: 20 },
  { id: 4, productoId: 4, stockActual: 3, stockMinimo: 1, stockCompra: 8 },
  { id: 5, productoId: 5, stockActual: 20, stockMinimo: 10, stockCompra: 30 },
  { id: 6, productoId: 6, stockActual: 6, stockMinimo: 2, stockCompra: 10 },
];

// ============================================================================
// FUNCIONES DE INICIALIZACIÓN BLINDADAS CON TRY-CATCH
// ============================================================================

/**
 * Intenta cargar datos desde localStorage de forma segura
 * Si falla o está vacío, retorna un valor por defecto
 */
const loadFromLocalStorage = (key, defaultValue) => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return defaultValue;
    
    const parsed = JSON.parse(stored);
    
    // Validar que sea un array si se espera un array
    if (Array.isArray(defaultValue)) {
      return Array.isArray(parsed) ? parsed : defaultValue;
    }
    
    // Validar que sea un objeto si se espera un objeto
    if (typeof defaultValue === 'object' && defaultValue !== null) {
      return typeof parsed === 'object' && parsed !== null ? parsed : defaultValue;
    }
    
    return parsed;
  } catch (error) {
    console.error(`Error al cargar ${key} desde localStorage:`, error);
    return defaultValue;
  }
};

/**
 * Guarda datos en localStorage de forma segura
 * Si falla, no rompe la aplicación
 */
const saveToLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error al guardar ${key} en localStorage:`, error);
  }
};

// ============================================================================
// COMPONENTE APP
// ============================================================================

export default function App() {
  // Estados de navegación y tema
  const [activeTab, setActiveTab] = useState('Panel');
  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState('es');

  // ========================================================================
  // ESTADO: CONFIGURACIÓN DE EMPRESA
  // ========================================================================
  const [companyData, setCompanyDataState] = useState(() => {
    return loadFromLocalStorage('fodexa_settings', DEFAULT_COMPANY);
  });

  const setCompanyData = (data) => {
    if (!data) return;
    try {
      setCompanyDataState(data);
      saveToLocalStorage('fodexa_settings', data);
    } catch (error) {
      console.error('Error al actualizar companyData:', error);
    }
  };

  // ========================================================================
  // ESTADO: PROVEEDORES
  // ========================================================================
  const [providersData, setProvidersDataState] = useState(() => {
    return loadFromLocalStorage('inventariox_providers', DEFAULT_PROVIDERS);
  });

  const setProvidersData = (data) => {
    if (!Array.isArray(data)) {
      console.error('setProvidersData: data no es un array', data);
      return;
    }
    try {
      setProvidersDataState(data);
      saveToLocalStorage('inventariox_providers', data);
    } catch (error) {
      console.error('Error al actualizar providersData:', error);
    }
  };

  // ========================================================================
  // ESTADO: PRODUCTOS
  // ========================================================================
  const [productsData, setProductsDataState] = useState(() => {
    return loadFromLocalStorage('inventariox_products', DEFAULT_PRODUCTS);
  });

  const setProductsData = (data) => {
    if (!Array.isArray(data)) {
      console.error('setProductsData: data no es un array', data);
      return;
    }
    try {
      setProductsDataState(data);
      saveToLocalStorage('inventariox_products', data);
    } catch (error) {
      console.error('Error al actualizar productsData:', error);
    }
  };

  // ========================================================================
  // ESTADO: STOCK
  // ========================================================================
  const [stockData, setStockDataState] = useState(() => {
    return loadFromLocalStorage('inventariox_stock', DEFAULT_STOCK);
  });

  const setStockData = (data) => {
    if (!Array.isArray(data)) {
      console.error('setStockData: data no es un array', data);
      return;
    }
    try {
      setStockDataState(data);
      saveToLocalStorage('inventariox_stock', data);
    } catch (error) {
      console.error('Error al actualizar stockData:', error);
    }
  };

  // ========================================================================
  // ESTADO: PEDIDOS
  // ========================================================================
  const [ordersData, setOrdersDataState] = useState(() => {
    return loadFromLocalStorage('inventariox_orders', []);
  });

  const setOrdersData = (data) => {
    if (!Array.isArray(data)) {
      console.error('setOrdersData: data no es un array', data);
      return;
    }
    try {
      setOrdersDataState(data);
      saveToLocalStorage('inventariox_orders', data);
    } catch (error) {
      console.error('Error al actualizar ordersData:', error);
    }
  };

  // ========================================================================
  // EFECTOS: GUARDADO INMEDIATO EN LOCALSTORAGE
  // ========================================================================

  // Guardar companyData inmediatamente si cambia
  useEffect(() => {
    try {
      saveToLocalStorage('fodexa_settings', companyData);
    } catch (error) {
      console.error('Error guardando companyData:', error);
    }
  }, [companyData]);

  // Guardar providersData inmediatamente si cambia
  useEffect(() => {
    try {
      if (Array.isArray(providersData)) {
        saveToLocalStorage('inventariox_providers', providersData);
      }
    } catch (error) {
      console.error('Error guardando providersData:', error);
    }
  }, [providersData]);

  // Guardar productsData inmediatamente si cambia
  useEffect(() => {
    try {
      if (Array.isArray(productsData)) {
        saveToLocalStorage('inventariox_products', productsData);
      }
    } catch (error) {
      console.error('Error guardando productsData:', error);
    }
  }, [productsData]);

  // Guardar stockData inmediatamente si cambia
  useEffect(() => {
    try {
      if (Array.isArray(stockData)) {
        saveToLocalStorage('inventariox_stock', stockData);
      }
    } catch (error) {
      console.error('Error guardando stockData:', error);
    }
  }, [stockData]);

  // Guardar ordersData inmediatamente si cambia
  useEffect(() => {
    try {
      if (Array.isArray(ordersData)) {
        saveToLocalStorage('inventariox_orders', ordersData);
      }
    } catch (error) {
      console.error('Error guardando ordersData:', error);
    }
  }, [ordersData]);

  // ========================================================================
  // EFECTOS: TEMA Y UTILIDADES
  // ========================================================================

  // Aplicar tema al elemento raíz del documento
  useEffect(() => {
    try {
      if (theme === 'light') {
        document.documentElement.classList.add('light-mode');
      } else {
        document.documentElement.classList.remove('light-mode');
      }
    } catch (error) {
      console.error('Error al aplicar tema:', error);
    }
  }, [theme]);

  // Prevenir zoom no deseado en inputs de mobile
  useEffect(() => {
    try {
      const inputs = document.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        input.style.fontSize = '16px';
      });
    } catch (error) {
      console.error('Error al aplicar estilos a inputs:', error);
    }
  }, []);

  // ========================================================================
  // RENDERIZADO CONDICIONAL DEL CONTENIDO
  // ========================================================================

  const renderContent = () => {
    try {
      switch (activeTab) {
        case 'Panel':
          return <Dashboard inventoryData={productsData || []} language={language} />;
        case 'Productos':
          return (
            <Inventory
              productsData={productsData || []}
              setProductsData={setProductsData}
              language={language}
              providers={providersData || []}
            />
          );
        case 'Inventario':
          return (
            <Stock
              productsData={productsData || []}
              stockData={stockData || []}
              setStockData={setStockData}
              language={language}
              providers={providersData || []}
            />
          );
        case 'Proveedores':
          return (
            <Providers
              language={language}
              providersData={providersData || []}
              setProvidersData={setProvidersData}
            />
          );
        case 'Pedidos':
          return (
            <Orders
              language={language}
              productsData={productsData || []}
              providers={providersData || []}
              stockData={stockData || []}
              companyData={companyData || DEFAULT_COMPANY}
              ordersData={ordersData || []}
              setOrdersData={setOrdersData}
            />
          );
        case 'Base de Datos':
          return (
            <DatabasePage
              providersData={providersData || []}
              productsData={productsData || []}
              stockData={stockData || []}
              ordersData={ordersData || []}
              companyData={companyData || DEFAULT_COMPANY}
              setProvidersData={setProvidersData}
              setProductsData={setProductsData}
              setStockData={setStockData}
              setOrdersData={setOrdersData}
              setCompanyData={setCompanyData}
            />
          );
        case 'Configuración':
          return (
            <Settings
              theme={theme}
              setTheme={setTheme}
              language={language}
              setLanguage={setLanguage}
              companyData={companyData || DEFAULT_COMPANY}
              setCompanyData={setCompanyData}
              providersData={providersData || []}
              productsData={productsData || []}
              stockData={stockData || []}
              ordersData={ordersData || []}
            />
          );
        default:
          return <Dashboard inventoryData={productsData || []} language={language} />;
      }
    } catch (error) {
      console.error('Error al renderizar contenido:', error);
      return (
        <div className="p-4">
          <h2 className="text-red-500 font-bold">Error al cargar la página</h2>
          <p>{error.message}</p>
        </div>
      );
    }
  };

  // ========================================================================
  // RENDER PRINCIPAL
  // ========================================================================

  return (
    <div
      className={`${
        theme === 'light'
          ? 'light-mode bg-gray-50 text-gray-900'
          : 'dark-mode bg-[#111827] text-white'
      } min-h-screen w-full transition-colors duration-300`}
    >
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} language={language} />
      <div className="w-full max-w-7xl mx-auto px-0">{renderContent()}</div>
    </div>
  );
}
