import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, BarChart3, Calendar } from 'lucide-react';
import { getMovements, subscribeToMovements, subscribeToOrders, subscribeToProducts, getOrders, getProducts } from '../services/firebaseService';
import { toast } from 'react-hot-toast';

export default function Analytics({ language = 'es', user }) {
  const [movements, setMovements] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('6months'); // '4weeks', '3months', '6months', '1year'

  // 🔥 REACTIVIDAD: Cargar datos con suscripción en tiempo real
  useEffect(() => {
    if (!user) return;

    let unsubscribeMovements;
    let unsubscribeOrders;
    let unsubscribeProducts;

    const setupRealtimeListeners = () => {
      try {
        setLoading(true);

        // 🔥 Suscripción en tiempo real a movimientos
        unsubscribeMovements = subscribeToMovements(user.uid, (movementsData) => {
          console.log('🔄 Movimientos actualizados (Analytics):', movementsData.length);
          setMovements(movementsData);
        });

        // 🔥 Suscripción en tiempo real a pedidos
        unsubscribeOrders = subscribeToOrders(user.uid, (ordersData) => {
          console.log('🔄 Pedidos actualizados (Analytics):', ordersData.length);
          setOrders(ordersData);
        });

        // 🔥 Suscripción en tiempo real a productos
        unsubscribeProducts = subscribeToProducts(user.uid, (productsData) => {
          console.log('🔄 Productos actualizados (Analytics):', productsData.length);
          setProducts(productsData);
        });

        setLoading(false);
      } catch (error) {
        console.error('Error setting up listeners:', error);
        toast.error('❌ Error al cargar datos de análisis');
        setLoading(false);
      }
    };

    setupRealtimeListeners();

    // Cleanup: Desuscribirse al desmontar
    return () => {
      if (unsubscribeMovements) {
        console.log('📤 Desuscribiéndose de movimientos (Analytics)');
        unsubscribeMovements();
      }
      if (unsubscribeOrders) {
        console.log('📤 Desuscribiéndose de pedidos (Analytics)');
        unsubscribeOrders();
      }
      if (unsubscribeProducts) {
        console.log('📤 Desuscribiéndose de productos (Analytics)');
        unsubscribeProducts();
      }
    };
  }, [user]);

  // Formatear moneda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calcular datos para gráfico de gastos vs ahorro
  const calculateGastosVsAhorro = () => {
    const now = new Date();
    const months = [];
    const monthsToShow = dateRange === '3months' ? 3 : dateRange === '1year' ? 12 : 6;
    
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('es-CL', { month: 'short' });
      const year = date.getFullYear();
      
      // Filtrar pedidos recibidos en este mes
      const monthOrders = orders.filter(o => {
        if (o.estado !== 'Recibido') return false;
        let orderDate;
        if (o.fechaRecepcion?.toDate) {
          orderDate = o.fechaRecepcion.toDate();
        } else if (o.fechaRecepcion?.seconds) {
          orderDate = new Date(o.fechaRecepcion.seconds * 1000);
        } else if (o.createdAt?.toDate) {
          orderDate = o.createdAt.toDate();
        } else if (o.createdAt?.seconds) {
          orderDate = new Date(o.createdAt.seconds * 1000);
        } else {
          return false;
        }
        return orderDate.getMonth() === date.getMonth() && orderDate.getFullYear() === date.getFullYear();
      });

      const totalGastado = monthOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      
      // Calcular ahorro potencial (diferencia entre cantidad sugerida y cantidad real pedida)
      let ahorroEstimado = 0;
      monthOrders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            const cantidadSugerida = item.cantidadSugerida || item.cantidadPedir || 0;
            const cantidadReal = item.cantidadPedir || 0;
            const diferencia = cantidadSugerida - cantidadReal;
            if (diferencia > 0) {
              ahorroEstimado += diferencia * (item.costo || 0);
            }
          });
        }
      });

      months.push({
        mes: `${monthName} ${year}`,
        gastado: totalGastado,
        ahorro: ahorroEstimado
      });
    }
    
    return months;
  };

  // Calcular tendencia de mermas (últimas 4 semanas)
  const calculateTendenciaMermas = () => {
    const now = new Date();
    const weeks = [];
    const weeksToShow = dateRange === '4weeks' ? 4 : dateRange === '3months' ? 12 : 8;
    
    for (let i = weeksToShow - 1; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7 + 6));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      const weekLabel = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
      
      // Filtrar mermas de esta semana
      const weekMermas = movements.filter(m => {
        if (m.tipo !== 'Merma') return false;
        let movementDate;
        if (m.fecha?.toDate) {
          movementDate = m.fecha.toDate();
        } else if (m.fecha?.seconds) {
          movementDate = new Date(m.fecha.seconds * 1000);
        } else if (m.createdAt?.toDate) {
          movementDate = m.createdAt.toDate();
        } else if (m.createdAt?.seconds) {
          movementDate = new Date(m.createdAt.seconds * 1000);
        } else {
          return false;
        }
        return movementDate >= weekStart && movementDate <= weekEnd;
      });

      const totalMermas = weekMermas.reduce((sum, m) => sum + (m.total || 0), 0);
      const cantidad = weekMermas.reduce((sum, m) => sum + (m.cantidad || 0), 0);
      
      weeks.push({
        semana: weekLabel,
        valor: totalMermas,
        cantidad: cantidad
      });
    }
    
    return weeks;
  };

  // Calcular top 5 productos por inversión
  const calculateTop5Inversion = () => {
    const productInvestment = {};
    
    // Calcular inversión total por producto desde movimientos de entrada
    movements.forEach(m => {
      if (m.tipo === 'Entrada') {
        const productName = m.productoNombre || 'Producto Desconocido';
        if (!productInvestment[productName]) {
          productInvestment[productName] = 0;
        }
        productInvestment[productName] += (m.total || 0);
      }
    });

    // Convertir a array y ordenar
    const sortedProducts = Object.entries(productInvestment)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return sortedProducts;
  };

  const gastosVsAhorroData = calculateGastosVsAhorro();
  const tendenciaMermasData = calculateTendenciaMermas();
  const top5InversionData = calculateTop5Inversion();

  // Colores para los gráficos
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  // Calcular KPIs
  const totalGastado = gastosVsAhorroData.reduce((sum, d) => sum + d.gastado, 0);
  const totalAhorro = gastosVsAhorroData.reduce((sum, d) => sum + d.ahorro, 0);
  const totalMermas = tendenciaMermasData.reduce((sum, d) => sum + d.valor, 0);
  const promedioSemanalMermas = tendenciaMermasData.length > 0 ? totalMermas / tendenciaMermasData.length : 0;

  if (loading) {
    return (
      <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 bg-[#111827] light-mode:bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400 light-mode:text-gray-600 text-lg">
            {language === 'es' ? 'Cargando análisis...' : 'Loading analytics...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 bg-[#111827] light-mode:bg-gray-50 min-h-screen">
      {/* Título */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-white light-mode:text-gray-900 font-black text-xl sm:text-2xl md:text-3xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-1 sm:mb-2">
          {language === 'es' ? '📊 Análisis Visual e Inteligencia de Negocios' : '📊 Visual Analytics & Business Intelligence'}
        </h1>
        <p className="text-gray-400 light-mode:text-gray-600 text-xs sm:text-sm md:text-base">
          {language === 'es' ? 'Decisiones basadas en datos reales, no en suposiciones' : 'Data-driven decisions, not assumptions'}
        </p>
      </div>

      {/* Filtro de rango temporal */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setDateRange('4weeks')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
            dateRange === '4weeks'
              ? 'bg-[#206DDA] text-white'
              : 'bg-gray-700 light-mode:bg-gray-200 text-gray-300 light-mode:text-gray-700 hover:bg-gray-600'
          }`}
        >
          <Calendar className="w-4 h-4 inline mr-1" />
          4 Semanas
        </button>
        <button
          onClick={() => setDateRange('3months')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
            dateRange === '3months'
              ? 'bg-[#206DDA] text-white'
              : 'bg-gray-700 light-mode:bg-gray-200 text-gray-300 light-mode:text-gray-700 hover:bg-gray-600'
          }`}
        >
          3 Meses
        </button>
        <button
          onClick={() => setDateRange('6months')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
            dateRange === '6months'
              ? 'bg-[#206DDA] text-white'
              : 'bg-gray-700 light-mode:bg-gray-200 text-gray-300 light-mode:text-gray-700 hover:bg-gray-600'
          }`}
        >
          6 Meses
        </button>
        <button
          onClick={() => setDateRange('1year')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
            dateRange === '1year'
              ? 'bg-[#206DDA] text-white'
              : 'bg-gray-700 light-mode:bg-gray-200 text-gray-300 light-mode:text-gray-700 hover:bg-gray-600'
          }`}
        >
          1 Año
        </button>
      </div>

      {/* KPIs Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-400 text-xs font-semibold mb-1">Total Gastado</p>
              <p className="text-white font-bold text-xl">${formatCurrency(totalGastado)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-400 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-900/20 to-green-800/10 border border-green-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-400 text-xs font-semibold mb-1">Ahorro Potencial</p>
              <p className="text-white font-bold text-xl">${formatCurrency(totalAhorro)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-400 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-900/20 to-red-800/10 border border-red-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-400 text-xs font-semibold mb-1">Total Mermas</p>
              <p className="text-white font-bold text-xl">${formatCurrency(totalMermas)}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-400 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-900/20 to-orange-800/10 border border-orange-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-400 text-xs font-semibold mb-1">Merma Promedio/Sem</p>
              <p className="text-white font-bold text-xl">${formatCurrency(promedioSemanalMermas)}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-400 opacity-50" />
          </div>
        </div>
      </div>

      {/* Gráfico 1: Gastos vs Ahorro */}
      <div className="bg-[#1f2937] light-mode:bg-white rounded-lg border border-gray-700 light-mode:border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-6 h-6 text-blue-400" />
          <h2 className="text-white light-mode:text-gray-900 font-bold text-lg">
            {language === 'es' ? 'Gastos vs Ahorro Potencial' : 'Expenses vs Potential Savings'}
          </h2>
        </div>
        <p className="text-gray-400 light-mode:text-gray-600 text-sm mb-6">
          {language === 'es' 
            ? 'Compara cuánto gastaste en pedidos recibidos vs cuánto pudiste ahorrar siguiendo las sugerencias del sistema'
            : 'Compare how much you spent on received orders vs how much you could save by following system suggestions'}
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={gastosVsAhorroData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="mes" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#fff' }}
              formatter={(value) => `$${formatCurrency(value)}`}
            />
            <Legend />
            <Bar dataKey="gastado" fill="#3B82F6" name="Gastado" radius={[8, 8, 0, 0]} />
            <Bar dataKey="ahorro" fill="#10B981" name="Ahorro Potencial" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Grid de 2 columnas para los otros dos gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 2: Tendencia de Mermas */}
        <div className="bg-[#1f2937] light-mode:bg-white rounded-lg border border-gray-700 light-mode:border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-6 h-6 text-red-400" />
            <h2 className="text-white light-mode:text-gray-900 font-bold text-lg">
              {language === 'es' ? 'Tendencia de Mermas' : 'Waste Trend'}
            </h2>
          </div>
          <p className="text-gray-400 light-mode:text-gray-600 text-sm mb-6">
            {language === 'es' 
              ? 'Evolución de pérdidas de producto para detectar patrones y días críticos'
              : 'Product loss evolution to detect patterns and critical days'}
          </p>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={tendenciaMermasData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="semana" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
                formatter={(value, name) => {
                  if (name === 'valor') return [`$${formatCurrency(value)}`, 'Valor'];
                  if (name === 'cantidad') return [value, 'Cantidad'];
                  return value;
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="valor" stroke="#EF4444" strokeWidth={2} name="Valor ($)" dot={{ r: 4 }} />
              <Line type="monotone" dataKey="cantidad" stroke="#F59E0B" strokeWidth={2} name="Cantidad" dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico 3: Top 5 Productos por Inversión */}
        <div className="bg-[#1f2937] light-mode:bg-white rounded-lg border border-gray-700 light-mode:border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-6 h-6 text-purple-400" />
            <h2 className="text-white light-mode:text-gray-900 font-bold text-lg">
              {language === 'es' ? 'Top 5 Inversión por Producto' : 'Top 5 Investment by Product'}
            </h2>
          </div>
          <p className="text-gray-400 light-mode:text-gray-600 text-sm mb-6">
            {language === 'es' 
              ? 'Productos donde se concentra la mayor parte del presupuesto'
              : 'Products where most of the budget is concentrated'}
          </p>
          {top5InversionData.length > 0 ? (
            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              <ResponsiveContainer width="60%" height={250}>
                <PieChart>
                  <Pie
                    data={top5InversionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {top5InversionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    formatter={(value) => `$${formatCurrency(value)}`}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2">
                {top5InversionData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="text-white light-mode:text-gray-900 text-sm font-medium">
                      {item.name}
                    </span>
                    <span className="text-gray-400 light-mode:text-gray-600 text-sm">
                      ${formatCurrency(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 light-mode:text-gray-600">
              {language === 'es' ? 'No hay datos suficientes' : 'Not enough data'}
            </div>
          )}
        </div>
      </div>

      {/* Insights y Recomendaciones */}
      <div className="mt-6 bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-700/50 rounded-lg p-6">
        <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-400" />
          {language === 'es' ? 'Insights Automáticos' : 'Automatic Insights'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-black/20 rounded-lg p-4">
            <p className="text-purple-400 font-semibold mb-2">💡 Eficiencia de Pedidos</p>
            <p className="text-gray-300 text-sm">
              {totalAhorro > 0 
                ? `Podrías ahorrar $${formatCurrency(totalAhorro)} siguiendo las sugerencias del sistema. Esto representa un ${((totalAhorro / (totalGastado || 1)) * 100).toFixed(1)}% de optimización.`
                : 'Estás siguiendo bien las sugerencias del sistema. ¡Excelente trabajo!'
              }
            </p>
          </div>
          <div className="bg-black/20 rounded-lg p-4">
            <p className="text-orange-400 font-semibold mb-2">⚠️ Control de Mermas</p>
            <p className="text-gray-300 text-sm">
              {promedioSemanalMermas > 0
                ? `Promedio semanal de mermas: $${formatCurrency(promedioSemanalMermas)}. ${promedioSemanalMermas > (totalGastado / gastosVsAhorroData.length) * 0.05 ? 'Considera revisar procesos de almacenamiento.' : 'Nivel de mermas dentro del rango esperado.'}`
                : 'No hay registros de mermas en el periodo seleccionado.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
