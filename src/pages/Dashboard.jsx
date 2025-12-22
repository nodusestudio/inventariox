import { Package, TrendingUp, AlertCircle, AlertTriangle, CheckCircle, DollarSign, AlertOctagon, Boxes } from 'lucide-react';
import { useState, useEffect } from 'react';
import MetricCard from '../components/MetricCard';
import TableContainer from '../components/TableContainer';
import { t } from '../utils/translations';

export default function Dashboard({ inventoryData, productsData = [], stockData = [], language = 'es', isLoading = false }) {
  const [alertProducts, setAlertProducts] = useState([]);

  // Función para calcular productos en estado crítico
  const calculateAlerts = () => {
    const data = inventoryData || productsData || [];
    if (!Array.isArray(data) || data.length === 0) {
      setAlertProducts([]);
      return;
    }

    const critical = data
      .filter(item => item && item.stockActual <= item.stockMinimo)
      .map(item => ({
        nombre: item.nombre || 'Sin nombre',
        stockActual: item.stockActual || 0,
        stockMinimo: item.stockMinimo || 0,
        faltante: (item.stockMinimo || 0) - (item.stockActual || 0),
      }))
      .sort((a, b) => b.faltante - a.faltante);
    
    setAlertProducts(critical);
  };

  // Actualizar alertas cuando cambia inventoryData o productsData
  useEffect(() => {
    calculateAlerts();
  }, [inventoryData, productsData]);

  // Calcular métricas mejoradas
  const safeData = (inventoryData || productsData || []).filter(item => item);
  const totalProducts = safeData.length;
  const lowStock = safeData.filter(item => (item.stockActual || 0) < (item.stockMinimo || 0)).length;
  
  // Calcular valor total: Suma de (Costo Unitario * Stock Actual)
  const safeStockData = (stockData || []).filter(item => item);
  const safeProducstData = (productsData || []).filter(item => item);
  const totalValue = safeStockData.reduce((sum, stockItem) => {
    const product = safeProducstData.find(p => p.id === stockItem.productoId);
    if (product && product.costo && stockItem.stockActual) {
      return sum + (product.costo * stockItem.stockActual);
    }
    return sum;
  }, 0);
  
  // Productos críticos: cantidad de productos por debajo del stock mínimo
  const criticalProducts = safeStockData.filter(item => (item.stockActual || 0) <= (item.stockMinimo || 0)).length;
  
  // Total referencias: cantidad total de productos distintos
  const totalReferences = safeProducstData.length;

  const columns = [
    { key: 'nombre', label: t(language, 'nombre') },
    { key: 'proveedor', label: t(language, 'proveedor') },
    { key: 'stockActual', label: t(language, 'stockActual') },
    { key: 'stockMinimo', label: t(language, 'stockMinimo') },
  ];

  // Si está cargando, mostrar spinner
  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg light-mode:bg-gray-50 flex items-center justify-center p-4 sm:p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#206DDA] mx-auto mb-4"></div>
          <p className="text-white light-mode:text-gray-900 font-semibold">{language === 'es' ? 'Cargando dashboard...' : 'Loading dashboard...'}</p>
          <p className="text-gray-400 light-mode:text-gray-600 text-sm mt-2">{language === 'es' ? 'Obteniendo datos de Firebase' : 'Fetching data from Firebase'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg light-mode:bg-gray-50 p-4 sm:p-6 transition-colors duration-300">
      <div>
        {/* Encabezado */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold mb-1 sm:mb-2 text-white light-mode:text-gray-900">{t(language, 'panel')}</h1>
          <p className="text-sm sm:text-base text-gray-400 light-mode:text-gray-600">{t(language, 'resumenGeneral')}</p>
        </div>

        {/* ⚠️ ALERTAS DE REABASTECIMIENTO */}
        <div className={`mb-6 sm:mb-8 rounded-lg p-4 sm:p-6 border transition-all duration-300 ${
          alertProducts.length > 0
            ? 'bg-red-900/20 border-red-700/40'
            : 'bg-green-900/20 border-green-700/40'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            {alertProducts.length > 0 ? (
              <>
                <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
                <h2 className="text-lg sm:text-xl font-bold text-red-500">⚠️ Productos en Estado Crítico</h2>
              </>
            ) : (
              <>
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                <h2 className="text-lg sm:text-xl font-bold text-green-500">✅ Todo el stock está al día</h2>
              </>
            )}
          </div>

          {alertProducts.length > 0 ? (
            <div className="space-y-2">
              {alertProducts.map((product, index) => (
                <div
                  key={index}
                  className="bg-red-950/30 border border-red-700/30 rounded p-3 sm:p-4 flex items-center justify-between gap-3"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-red-400 text-sm sm:text-base">{product.nombre}</p>
                    <p className="text-xs sm:text-sm text-red-300/70">
                      Stock actual: <span className="font-semibold">{product.stockActual}</span> | 
                      Mínimo: <span className="font-semibold">{product.stockMinimo}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-red-500 font-bold text-sm sm:text-base">
                      Faltan: {product.faltante}
                    </p>
                  </div>
                </div>
              ))}
              <p className="text-xs sm:text-sm text-red-300/60 mt-3 italic">
                💡 Recomendación: Contacta a tus proveedores para reabastecer estos productos.
              </p>
            </div>
          ) : (
            <p className="text-green-400 text-sm sm:text-base">
              Todos los productos mantienen niveles óptimos de inventario. ¡Excelente trabajo! 🎉
            </p>
          )}
        </div>

        {/* Tarjetas de Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <MetricCard
            title={language === 'es' ? 'Valor Total Inventario' : 'Total Inventory Value'}
            value={`$${new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(totalValue)}`}
            icon={DollarSign}
            color="primary"
          />
          <MetricCard
            title={language === 'es' ? 'Productos Críticos' : 'Critical Products'}
            value={criticalProducts}
            icon={AlertOctagon}
            color="warning"
          />
          <MetricCard
            title={language === 'es' ? 'Total Referencias' : 'Total References'}
            value={totalReferences}
            icon={Boxes}
            color="secondary"
          />
        </div>

        {/* Tabla de Últimos Productos */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold mb-4 text-white light-mode:text-gray-900">{t(language, 'movimientosRecientes')}</h2>
          {(inventoryData || []).length > 0 ? (
            <TableContainer
              columns={columns}
              data={(inventoryData || []).slice(0, 5)}
              onRowClick={(row) => console.log('Producto seleccionado:', row)}
            />
          ) : (
            <div className="bg-gray-900/40 light-mode:bg-gray-100 border border-gray-700/40 light-mode:border-gray-300 rounded-lg p-6 text-center">
              <Package className="w-12 h-12 text-gray-600 light-mode:text-gray-400 mx-auto mb-3 opacity-50" />
              <p className="text-gray-400 light-mode:text-gray-600">{language === 'es' ? 'No hay productos para mostrar. Comienza agregando productos al inventario.' : 'No products to display. Start by adding products to inventory.'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
