import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './config/firebase';
import AuthScreen from './components/AuthScreen';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Stock from './pages/Stock';
import Movements from './pages/Movements';
import Providers from './pages/Providers';
import Orders from './pages/Orders';
import Settings from './pages/Settings';
import DatabasePage from './pages/Database';
import Reports from './pages/Reports';
import Mermas from './pages/Mermas';
import Analytics from './pages/Analytics';
import Audit from './pages/Audit';
import { Toaster, toast } from 'react-hot-toast';
import { getProducts, getStock, getProviders, getOrders, getMovements, getCompanyData } from './services/firebaseService';

// ============================================================================
// COMPONENTE PRINCIPAL CON FIREBASE
// ============================================================================

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [language, setLanguage] = useState('es');

  // Estados de datos - ahora se cargarán desde Firestore
  const [productsData, setProductsData] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [providersData, setProvidersData] = useState([]);
  const [ordersData, setOrdersData] = useState([]);
  const [companyData, setCompanyData] = useState({
    nombreEmpresa: 'MI EMPRESA',
    nitRut: '12.345.678-9',
    direccion: 'Calle Principal 123, Ciudad',
  });

  // Verificar autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Cargar datos desde Firestore cuando el usuario se autentica
  useEffect(() => {
    if (!user) {
      setDataLoading(false);
      return;
    }

    setDataLoading(true);

    const loadData = async () => {
      try {
        const [products, stock, providers, orders, movements, company] = await Promise.all([
          getProducts(user.uid),
          getStock(user.uid),
          getProviders(user.uid),
          getOrders(user.uid),
          getMovements(user.uid),
          getCompanyData(user.uid)
        ]);

        setProductsData(products || []);
        setStockData(stock || []);
        setProvidersData(providers || []);
        setOrdersData(orders || []);
        setCompanyData(company || {
          nombreEmpresa: 'MI EMPRESA',
          nitRut: '12.345.678-9',
          direccion: 'Calle Principal 123, Ciudad',
        });
        setDataLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('❌ Error cargando datos');
        setDataLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Cerrar sesión
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setCurrentPage('dashboard');
      toast.success('✓ Sesión cerrada correctamente');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      toast.error('❌ Error al cerrar sesión');
    }
  };

  // Si está cargando la autenticación
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#206DDA] mx-auto mb-4"></div>
          <p className="text-white text-lg font-semibold">Cargando InventarioX...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario, mostrar pantalla de autenticación
  if (!user) {
    return <AuthScreen onAuthSuccess={setUser} />;
  }

  // Páginas disponibles
  const pages = {
    dashboard: (
      <Dashboard
        language={language}
        productsData={productsData}
        stockData={stockData}
        providersData={providersData}
        ordersData={ordersData}
        companyData={companyData}
        user={user}
        isLoading={dataLoading}
      />
    ),
    stock: (
      <Stock
        user={user}
        language={language}
        onGoToCreateProviders={() => setCurrentPage('providers')}
      />
    ),
    movements: (
      <Movements
        language={language}
        user={user}
      />
    ),
    providers: (
      <Providers
        providersData={providersData}
        setProvidersData={setProvidersData}
        language={language}
        user={user}
      />
    ),
    orders: (
      <Orders
        language={language}
        user={user}
        companyData={companyData}
      />
    ),
    settings: (
      <Settings
        companyData={companyData}
        setCompanyData={setCompanyData}
        language={language}
        setLanguage={setLanguage}
        user={user}
        onLogout={handleLogout}
      />
    ),
    database: (
      <DatabasePage
        providersData={providersData}
        productsData={productsData}
        stockData={stockData}
        ordersData={ordersData}
        companyData={companyData}
        setProvidersData={setProvidersData}
        setProductsData={setProductsData}
        setStockData={setStockData}
        setOrdersData={setOrdersData}
        setCompanyData={setCompanyData}
        user={user}
      />
    ),
    reports: (
      <Reports
        language={language}
        ordersData={ordersData}
        providersData={providersData}
        productsData={productsData}
        companyData={companyData}
        user={user}
      />
    ),
    mermas: (
      <Mermas
        language={language}
        user={user}
      />
    ),
    analytics: (
      <Analytics
        language={language}
        user={user}
      />
    ),
    audit: (
      <Audit
        language={language}
        user={user}
      />
    ),
  };

  return (
    <div className="flex h-screen bg-[#0f172a]">
      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        user={user}
        onLogout={handleLogout}
      />

      {/* Contenido Principal */}
      <main className="flex-1 overflow-auto bg-gradient-to-br from-[#0f172a] to-[#1f2937]">
        <div className="p-6">
          {pages[currentPage] || pages.dashboard}
        </div>
      </main>

      {/* Toaster de react-hot-toast */}
      <Toaster position="top-right" reverseOrder={false} />
    </div>
  );
}
