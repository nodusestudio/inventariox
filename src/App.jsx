import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Stock from './pages/Stock';
import Providers from './pages/Providers';
import Orders from './pages/Orders';
import Settings from './pages/Settings';

// Datos iniciales por defecto
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

const DEFAULT_STOCK = [
  { id: 1, productoId: 1, stockActual: 5, stockMinimo: 2, stockCompra: 10 },
  { id: 2, productoId: 2, stockActual: 8, stockMinimo: 3, stockCompra: 15 },
  { id: 3, productoId: 3, stockActual: 12, stockMinimo: 5, stockCompra: 20 },
  { id: 4, productoId: 4, stockActual: 3, stockMinimo: 1, stockCompra: 8 },
  { id: 5, productoId: 5, stockActual: 20, stockMinimo: 10, stockCompra: 30 },
  { id: 6, productoId: 6, stockActual: 6, stockMinimo: 2, stockCompra: 10 },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('Panel');
  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState('es');
  const [companyData, setCompanyData] = useState(() => {
    const saved = localStorage.getItem('companyData');
    return saved ? JSON.parse(saved) : {
      nombreEmpresa: 'Mi Empresa',
      nitRut: '12.345.678-9',
      direccion: 'Calle Principal 123, Ciudad',
    };
  });

  // Datos de proveedores
  const [providersData, setProvidersData] = useState([
    { id: 1, nombre: 'DISTRIBUIDORA ABC', contacto: 'JUAN PÉREZ', email: 'JUAN@ABC.COM', whatsapp: '56912345678' },
    { id: 2, nombre: 'IMPORTACIONES GLOBAL', contacto: 'MARÍA GARCÍA', email: 'MARIA@GLOBAL.COM', whatsapp: '56987654321' },
    { id: 3, nombre: 'LOGÍSTICA DEL SUR', contacto: 'CARLOS LÓPEZ', email: 'CARLOS@SUR.COM', whatsapp: '56955555555' },
  ]);

  // Aplicar tema al elemento raíz del documento
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }, [theme]);

  // Estado de productos con localStorage
  const [productsData, setProductsDataState] = useState(() => {
    const saved = localStorage.getItem('inventariox_products');
    return saved ? JSON.parse(saved) : DEFAULT_PRODUCTS;
  });

  // Estado de stock con localStorage
  const [stockData, setStockDataState] = useState(() => {
    const saved = localStorage.getItem('inventariox_stock');
    return saved ? JSON.parse(saved) : DEFAULT_STOCK;
  });

  // Funciones setter que guardan en localStorage
  const setProductsData = (data) => {
    setProductsDataState(data);
    localStorage.setItem('inventariox_products', JSON.stringify(data));
  };

  const setStockData = (data) => {
    setStockDataState(data);
    localStorage.setItem('inventariox_stock', JSON.stringify(data));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Panel':
        return <Dashboard inventoryData={productsData} language={language} />;
      case 'Productos':
        return <Inventory productsData={productsData} setProductsData={setProductsData} language={language} providers={providersData} />;
      case 'Inventario':
        return <Stock productsData={productsData} stockData={stockData} setStockData={setStockData} language={language} providers={providersData} />;
      case 'Proveedores':
        return <Providers language={language} providersData={providersData} setProvidersData={setProvidersData} />;
      case 'Pedidos':
        return <Orders language={language} productsData={productsData} providers={providersData} stockData={stockData} companyName={companyData.nombreEmpresa} />;
      case 'Configuración':
        return <Settings theme={theme} setTheme={setTheme} language={language} setLanguage={setLanguage} />;
      default:
        return <Dashboard inventoryData={productsData} language={language} />;
    }
  };

  return (
    <div className={`${theme === 'light' ? 'light-mode bg-gray-50 text-gray-900' : 'dark-mode bg-dark-bg text-white'} min-h-screen w-full transition-colors duration-300`}>
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} language={language} />
      {renderContent()}
    </div>
  );
}
