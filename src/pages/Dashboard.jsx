import { Package, TrendingUp, AlertCircle, AlertTriangle, CheckCircle, DollarSign, AlertOctagon, Boxes, ClipboardCheck, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import MetricCard from '../components/MetricCard';
import TableContainer from '../components/TableContainer';
import { t } from '../utils/translations';
import { subscribeToAuditLogs, subscribeToInventoryLogs, subscribeToProducts } from '../services/firebaseService';

// Formato moneda local sin decimales
const formatCLP = (value) => new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(value || 0);

export default function Dashboard({ inventoryData, productsData = [], stockData = [], language = 'es', isLoading = false, user }) {
  const [alertProducts, setAlertProducts] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [auditLogs, setAuditLogs] = useState([]);
  const [inventoryLogs, setInventoryLogs] = useState([]);
  const [lastAuditDays, setLastAuditDays] = useState(null);
  const [lastInventoryDays, setLastInventoryDays] = useState(null);
  const [productsWithFrequency, setProductsWithFrequency] = useState([]);
  const [pendingInventoryAlerts, setPendingInventoryAlerts] = useState([]);

  // 🔥 Suscribirse a inventory_logs para mostrar última fecha de inventario
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToInventoryLogs(user.uid, (logs) => {
      setInventoryLogs(logs);
      
      if (logs.length > 0) {
        // Obtener el inventario más reciente
        const sortedLogs = [...logs].sort((a, b) => {
          const dateA = a.fecha_hora?.toDate ? a.fecha_hora.toDate() : new Date(a.createdAt?.toDate() || 0);
          const dateB = b.fecha_hora?.toDate ? b.fecha_hora.toDate() : new Date(b.createdAt?.toDate() || 0);
          return dateB - dateA;
        });
        
        const lastInventory = sortedLogs[0];
        const lastInventoryDate = lastInventory.fecha_hora?.toDate 
          ? lastInventory.fecha_hora.toDate() 
          : new Date(lastInventory.createdAt?.toDate());
        const today = new Date();
        const diffTime = Math.abs(today - lastInventoryDate);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        setLastInventoryDays(diffDays);
      } else {
        setLastInventoryDays(null);
      }
    });

    return () => {
      console.log('📤 Desuscribiéndose de inventory_logs (Dashboard)');
      unsubscribe();
    };
  }, [user]);

  // 🔥 Suscribirse a productos para verificar frecuencias de inventario
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToProducts(user.uid, (products) => {
      const productsWithFreq = products.filter(p => p.frecuenciaInventario && p.frecuenciaInventario !== 'ninguna');
      setProductsWithFrequency(productsWithFreq);
      
      // Verificar alertas de inventario pendiente
      const alerts = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Agrupar por proveedor
      const byProvider = productsWithFreq.reduce((acc, prod) => {
        if (!acc[prod.proveedor]) {
          acc[prod.proveedor] = {
            proveedor: prod.proveedor,
            productos: [],
            frecuencia: prod.frecuenciaInventario
          };
        }
        acc[prod.proveedor].productos.push(prod.nombre);
        return acc;
      }, {});
      
      // Verificar si hay inventario de hoy
      const hasInventoryToday = inventoryLogs.some(log => {
        const logDate = log.fecha_hora?.toDate 
          ? log.fecha_hora.toDate() 
          : new Date(log.createdAt?.toDate());
        logDate.setHours(0, 0, 0, 0);
        return logDate.getTime() === today.getTime();
      });
      
      // Si no hay inventario hoy y hay productos con frecuencia diaria, alertar
      if (!hasInventoryToday) {
        Object.values(byProvider).forEach(item => {
          if (item.frecuencia === 'diaria') {
            alerts.push({
              proveedor: item.proveedor,
              productos: item.productos,
              frecuencia: 'diaria',
              mensaje: `No se ha registrado el inventario diario de ${item.proveedor}`
            });
          }
        });
      }
      
      // Verificar inventario semanal (si no hay inventario en los últimos 7 días)
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const hasInventoryThisWeek = inventoryLogs.some(log => {
        const logDate = log.fecha_hora?.toDate 
          ? log.fecha_hora.toDate() 
          : new Date(log.createdAt?.toDate());
        return logDate >= weekAgo;
      });
      
      if (!hasInventoryThisWeek) {
        Object.values(byProvider).forEach(item => {
          if (item.frecuencia === 'semanal') {
            alerts.push({
              proveedor: item.proveedor,
              productos: item.productos,
              frecuencia: 'semanal',
              mensaje: `No se ha registrado el inventario semanal de ${item.proveedor}`
            });
          }
        });
      }
      
      setPendingInventoryAlerts(alerts);
    });

    return () => {
      console.log('📤 Desuscribiéndose de productos (Dashboard)');
      unsubscribe();
    };
  }, [user, inventoryLogs]);

  // Función para calcular productos en estado crítico
  const calculateAlerts = () => {
    const baseData = inventoryData && inventoryData.length ? inventoryData : productsData || [];
    const data = selectedProvider
      ? baseData.filter(item => item && item.proveedor === selectedProvider)
      : baseData;

    if (!Array.isArray(data) || data.length === 0) {
      setAlertProducts([]);
      return;
    }

    const critical = data
      .filter(item => item && (item.stockActual || 0) < (item.stockMinimo || 0))
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
  }, [inventoryData, productsData, selectedProvider]);

  // Calcular métricas mejoradas
  const baseProducts = (inventoryData && inventoryData.length ? inventoryData : productsData) || [];
  const safeProducts = baseProducts.filter(item => item);
  const providers = Array.from(new Set(safeProducts.map(p => p.proveedor).filter(Boolean)));
  const filteredProducts = selectedProvider
    ? safeProducts.filter(p => p.proveedor === selectedProvider)
    : safeProducts;

  // Calcular valor total: Suma de (Costo Unitario * Stock Actual) filtrado por proveedor
  const totalValue = filteredProducts.reduce((sum, item) => {
    const costo = item.costo || 0;
    const stock = item.stockActual || 0;
    return sum + (costo * stock);
  }, 0);
  
  // Productos críticos: cantidad de productos por debajo del stock mínimo
  const criticalProducts = filteredProducts.filter(item => (item.stockActual || 0) < (item.stockMinimo || 0)).length;
  
  // Total referencias: cantidad total de productos distintos
  const totalReferences = filteredProducts.length;

  // Valor por proveedor (usando productos filtrados actuales)
  const valueByProvider = filteredProducts.reduce((acc, item) => {
    const key = item.proveedor || 'SIN PROVEEDOR';
    const value = (item.costo || 0) * (item.stockActual || 0);
    acc[key] = (acc[key] || 0) + value;
    return acc;
  }, {});

  const valueByProviderList = Object.entries(valueByProvider)
    .map(([nombre, valor]) => ({ nombre, valor }))
    .sort((a, b) => b.valor - a.valor);

  // Ranking top 5 por inversión (Costo * Stock)
  const productRanking = [...filteredProducts]
    .map(p => ({
      nombre: p.nombre || 'Sin nombre',
      proveedor: p.proveedor || 'N/A',
      valor: (p.costo || 0) * (p.stockActual || 0),
    }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5);

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
        {/* Encabezado + filtro por proveedor */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold mb-1 sm:mb-2 text-white light-mode:text-gray-900">{t(language, 'panel')}</h1>
            <p className="text-sm sm:text-base text-gray-400 light-mode:text-gray-600">{t(language, 'resumenGeneral')}</p>
          </div>
          <div className="w-full sm:w-64">
            <label className="block text-xs font-semibold text-gray-400 light-mode:text-gray-600 mb-1">Filtrar por proveedor</label>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 light-mode:bg-white border border-gray-600 light-mode:border-gray-300 rounded text-sm text-white light-mode:text-gray-900 focus:border-[#206DDA] focus:outline-none"
            >
              <option value="">Todos</option>
              {providers.map((prov) => (
                <option key={prov} value={prov}>{prov}</option>
              ))}
            </select>
          </div>
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

        {/* 🔥 DASHBOARD: Indicador de última auditoría */}
        {lastAuditDays !== null && (
          <div className={`mb-6 sm:mb-8 rounded-lg p-4 sm:p-6 border transition-all duration-300 ${
            lastAuditDays <= 7 
              ? 'bg-green-900/20 border-green-700/40' 
              : lastAuditDays <= 30 
                ? 'bg-yellow-900/20 border-yellow-700/40'
                : 'bg-red-900/20 border-red-700/40'
          }`}>
            <div className="flex items-center gap-3">
              <ClipboardCheck className={`w-6 h-6 flex-shrink-0 ${
                lastAuditDays <= 7 
                  ? 'text-green-500' 
                  : lastAuditDays <= 30 
                    ? 'text-yellow-500'
                    : 'text-red-500'
              }`} />
              <div>
                <h3 className={`text-lg font-bold ${
                  lastAuditDays <= 7 
                    ? 'text-green-500' 
                    : lastAuditDays <= 30 
                      ? 'text-yellow-500'
                      : 'text-red-500'
                }`}>
                  Último inventario realizado hace {lastAuditDays} {lastAuditDays === 1 ? 'día' : 'días'}
                </h3>
                <p className="text-sm text-gray-400 light-mode:text-gray-600 mt-1">
                  {lastAuditDays <= 7 
                    ? '✅ Inventario actualizado recientemente' 
                    : lastAuditDays <= 30 
                      ? '⚠️ Considera realizar una nueva auditoría pronto'
                      : '🚨 Se recomienda realizar una auditoría urgente'}
                </p>
              </div>
            </div>
          </div>
        )}

        {!lastAuditDays && lastAuditDays !== 0 && (
          <div className="mb-6 sm:mb-8 rounded-lg p-4 sm:p-6 border bg-blue-900/20 border-blue-700/40">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="w-6 h-6 text-blue-500 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-blue-500">
                  No hay auditorías registradas
                </h3>
                <p className="text-sm text-gray-400 light-mode:text-gray-600 mt-1">
                  💡 Realiza tu primera auditoría para llevar un control profesional del inventario
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 🔔 ALERTA: Inventario pendiente por frecuencia configurada */}
        {pendingInventoryAlerts.length > 0 && (
          <div className="mb-6 sm:mb-8 rounded-lg p-4 sm:p-6 border bg-orange-900/20 border-orange-700/40">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-6 h-6 text-orange-500 flex-shrink-0 animate-pulse" />
              <div>
                <h3 className="text-lg font-bold text-orange-500">
                  ⚠️ Inventario Pendiente
                </h3>
                <p className="text-sm text-gray-400 light-mode:text-gray-600 mt-1">
                  Los siguientes proveedores tienen frecuencia de inventario configurada
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              {pendingInventoryAlerts.map((alert, index) => (
                <div
                  key={index}
                  className="bg-orange-950/30 border border-orange-700/30 rounded p-3 sm:p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-orange-400 text-sm sm:text-base">
                        {alert.proveedor}
                      </p>
                      <p className="text-xs sm:text-sm text-orange-300/70 mt-1">
                        {alert.mensaje}
                      </p>
                      <p className="text-xs text-orange-300/50 mt-2">
                        Frecuencia: {alert.frecuencia === 'diaria' ? 'Diaria' : 'Semanal'}
                      </p>
                      <p className="text-xs text-orange-300/50">
                        Productos afectados: {alert.productos.join(', ')}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        alert.frecuencia === 'diaria'
                          ? 'bg-red-900/50 text-red-400'
                          : 'bg-yellow-900/50 text-yellow-400'
                      }`}>
                        {alert.frecuencia === 'diaria' ? '📅 Diaria' : '📆 Semanal'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <p className="text-xs sm:text-sm text-orange-300/60 mt-3 italic">
                💡 Ve a la sección <strong>Inventario</strong> para registrar el conteo del día
              </p>
            </div>
          </div>
        )}

        {/* Tarjetas de Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <MetricCard
            title={language === 'es' ? 'Valor Total Inventario' : 'Total Inventory Value'}
            value={`$${formatCLP(totalValue)}`}
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

        {/* Valor por proveedor */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold mb-3 text-white light-mode:text-gray-900">Valor por Proveedor</h2>
          {valueByProviderList.length > 0 ? (
            <div className="bg-gray-900/40 light-mode:bg-white border border-gray-700/40 light-mode:border-gray-300 rounded-lg p-4 divide-y divide-gray-800 light-mode:divide-gray-200">
              {valueByProviderList.map((prov) => (
                <div key={prov.nombre} className="py-2 flex items-center justify-between text-sm sm:text-base">
                  <span className="text-gray-300 light-mode:text-gray-800 font-semibold">{prov.nombre}</span>
                  <span className="text-white light-mode:text-gray-900 font-bold">${formatCLP(prov.valor)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 light-mode:text-gray-600 text-sm">Sin datos para mostrar.</p>
          )}
        </div>

        {/* Ranking top 5 productos por inversión */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold mb-3 text-white light-mode:text-gray-900">Top 5 Productos por Inversión</h2>
          {productRanking.length > 0 ? (
            <div className="bg-gray-900/40 light-mode:bg-white border border-gray-700/40 light-mode:border-gray-300 rounded-lg p-4 space-y-2">
              {productRanking.map((p, idx) => (
                <div key={`${p.nombre}-${idx}`} className="flex items-center justify-between text-sm sm:text-base">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 light-mode:text-gray-600 text-xs sm:text-sm">#{idx + 1}</span>
                    <span className="text-white light-mode:text-gray-900 font-semibold">{p.nombre}</span>
                    <span className="text-gray-400 light-mode:text-gray-600 text-xs">{p.proveedor}</span>
                  </div>
                  <span className="text-yellow-300 light-mode:text-yellow-700 font-bold">${formatCLP(p.valor)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 light-mode:text-gray-600 text-sm">No hay productos para mostrar.</p>
          )}
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
