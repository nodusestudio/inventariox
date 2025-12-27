import { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, Calendar, Package, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { getMovements } from '../services/firebaseService';
import { toast } from 'react-hot-toast';

export default function Movements({ language = 'es', user }) {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState(''); // '', 'Entrada', 'Salida', 'Merma', 'Ajuste'
  const [filterMonth, setFilterMonth] = useState('todos'); // 'todos', 'este-mes', 'mes-pasado'

  // Cargar movimientos desde Firestore
  useEffect(() => {
    if (!user) return;
    loadMovements();
  }, [user]);

  const loadMovements = async () => {
    try {
      setLoading(true);
      const movementsData = await getMovements(user.uid);
      setMovements(movementsData);
    } catch (error) {
      console.error('Error loading movements:', error);
      toast.error('❌ Error al cargar movimientos');
    } finally {
      setLoading(false);
    }
  };

  // Formatear moneda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Formatear fecha y hora
  const formatDateTime = (timestamp) => {
    if (!timestamp) return { fecha: '-', hora: '-' };
    
    // Convertir Firestore Timestamp a Date
    let date;
    if (timestamp?.toDate) {
      date = timestamp.toDate();
    } else if (timestamp?.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    
    return {
      fecha: date.toLocaleDateString('es-CL'),
      hora: date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
    };
  };

  // Obtener rango de fechas según filtro
  const getDateRange = () => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    if (filterMonth === 'este-mes') {
      return { start: thisMonthStart, end: now };
    } else if (filterMonth === 'mes-pasado') {
      return { start: lastMonthStart, end: lastMonthEnd };
    }
    return null;
  };

  // Filtrar movimientos
  const filteredMovements = movements.filter(m => {
    // Filtro por tipo
    if (filterType !== '' && m.tipo !== filterType) return false;
    
    // Filtro por fecha
    if (filterMonth !== 'todos') {
      const dateRange = getDateRange();
      if (!dateRange) return true;
      
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
        movementDate = new Date(m.fecha || m.createdAt);
      }
      
      return movementDate >= dateRange.start && movementDate <= dateRange.end;
    }
    
    return true;
  }).sort((a, b) => {
    const dateA = a.fecha?.seconds || a.createdAt?.seconds || 0;
    const dateB = b.fecha?.seconds || b.createdAt?.seconds || 0;
    return dateB - dateA;
  });

  // Calcular resumen del mes actual
  const calculateMonthSummary = () => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const thisMonthMovements = movements.filter(m => {
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
      return movementDate >= thisMonthStart;
    });

    const entradas = thisMonthMovements
      .filter(m => m.tipo === 'Entrada')
      .reduce((sum, m) => sum + (m.total || 0), 0);
    
    const mermas = thisMonthMovements
      .filter(m => m.tipo === 'Merma')
      .reduce((sum, m) => sum + (m.total || 0), 0);
    
    const salidas = thisMonthMovements
      .filter(m => m.tipo === 'Salida')
      .reduce((sum, m) => sum + (m.total || 0), 0);

    return { entradas, mermas, salidas };
  };

  const summary = calculateMonthSummary();

  // Obtener color según tipo
  const getTypeColor = (tipo) => {
    switch(tipo) {
      case 'Entrada':
        return 'text-green-400 bg-green-900/30';
      case 'Merma':
        return 'text-red-400 bg-red-900/30';
      case 'Salida':
        return 'text-orange-400 bg-orange-900/30';
      case 'Ajuste':
        return 'text-blue-400 bg-blue-900/30';
      default:
        return 'text-gray-400 bg-gray-900/30';
    }
  };

  return (
    <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 bg-[#111827] light-mode:bg-gray-50 min-h-screen">
      {/* Título */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-white light-mode:text-gray-900 font-black text-xl sm:text-2xl md:text-3xl bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent mb-1 sm:mb-2">
          {language === 'es' ? 'Movimientos' : 'Movements'}
        </h1>
        <p className="text-gray-400 light-mode:text-gray-600 text-xs sm:text-sm md:text-base">
          {language === 'es' ? 'Historial principal del sistema' : 'Main system history'}
        </p>
      </div>

      {/* Resumen del mes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-900/20 to-green-800/10 border border-green-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-400 text-xs font-semibold mb-1">
                {language === 'es' ? 'Total Entradas Este Mes' : 'Total Entries This Month'}
              </p>
              <p className="text-white font-bold text-xl">
                ${formatCurrency(summary.entradas)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-400 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-900/20 to-red-800/10 border border-red-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-400 text-xs font-semibold mb-1">
                {language === 'es' ? 'Total Mermas Este Mes' : 'Total Waste This Month'}
              </p>
              <p className="text-white font-bold text-xl">
                ${formatCurrency(summary.mermas)}
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-400 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border border-blue-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-400 text-xs font-semibold mb-1">
                {language === 'es' ? 'Total Salidas Este Mes' : 'Total Exits This Month'}
              </p>
              <p className="text-white font-bold text-xl">
                ${formatCurrency(summary.salidas)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-400 opacity-50" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        {/* Filtros de tipo */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterType('')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
              filterType === ''
                ? 'bg-[#206DDA] text-white'
                : 'bg-gray-700 light-mode:bg-gray-200 text-gray-300 light-mode:text-gray-700 hover:bg-gray-600 light-mode:hover:bg-gray-300'
            }`}
          >
            {language === 'es' ? 'Todos' : 'All'}
          </button>
          <button
            onClick={() => setFilterType('Entrada')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 text-sm ${
              filterType === 'Entrada'
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 light-mode:bg-gray-200 text-gray-300 light-mode:text-gray-700 hover:bg-gray-600 light-mode:hover:bg-gray-300'
            }`}
          >
            <ArrowUp className="w-4 h-4" />
            {language === 'es' ? 'Entradas' : 'Entries'}
          </button>
          <button
            onClick={() => setFilterType('Merma')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 text-sm ${
              filterType === 'Merma'
                ? 'bg-red-600 text-white'
                : 'bg-gray-700 light-mode:bg-gray-200 text-gray-300 light-mode:text-gray-700 hover:bg-gray-600 light-mode:hover:bg-gray-300'
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            {language === 'es' ? 'Mermas' : 'Waste'}
          </button>
          <button
            onClick={() => setFilterType('Ajuste')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
              filterType === 'Ajuste'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 light-mode:bg-gray-200 text-gray-300 light-mode:text-gray-700 hover:bg-gray-600 light-mode:hover:bg-gray-300'
            }`}
          >
            {language === 'es' ? 'Ajustes' : 'Adjustments'}
          </button>
        </div>

        {/* Filtros de fecha */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterMonth('todos')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
              filterMonth === 'todos'
                ? 'bg-[#206DDA] text-white'
                : 'bg-gray-700 light-mode:bg-gray-200 text-gray-300 light-mode:text-gray-700 hover:bg-gray-600 light-mode:hover:bg-gray-300'
            }`}
          >
            <Calendar className="w-4 h-4 inline mr-1" />
            {language === 'es' ? 'Todo el tiempo' : 'All time'}
          </button>
          <button
            onClick={() => setFilterMonth('este-mes')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
              filterMonth === 'este-mes'
                ? 'bg-[#206DDA] text-white'
                : 'bg-gray-700 light-mode:bg-gray-200 text-gray-300 light-mode:text-gray-700 hover:bg-gray-600 light-mode:hover:bg-gray-300'
            }`}
          >
            {language === 'es' ? 'Este mes' : 'This month'}
          </button>
          <button
            onClick={() => setFilterMonth('mes-pasado')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
              filterMonth === 'mes-pasado'
                ? 'bg-[#206DDA] text-white'
                : 'bg-gray-700 light-mode:bg-gray-200 text-gray-300 light-mode:text-gray-700 hover:bg-gray-600 light-mode:hover:bg-gray-300'
            }`}
          >
            {language === 'es' ? 'Mes pasado' : 'Last month'}
          </button>
        </div>
      </div>

      {/* Tabla de movimientos */}
      {loading ? (
        <div className="bg-gray-800 light-mode:bg-gray-100 rounded-lg p-12 text-center">
          <p className="text-gray-400 light-mode:text-gray-600 text-lg">
            {language === 'es' ? 'Cargando movimientos...' : 'Loading movements...'}
          </p>
        </div>
      ) : filteredMovements.length > 0 ? (
        <div className="bg-[#1f2937] light-mode:bg-white rounded-lg border border-gray-700 light-mode:border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-800 light-mode:bg-gray-100 border-b border-gray-700 light-mode:border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-300 light-mode:text-gray-700 font-semibold">
                    {language === 'es' ? 'Fecha/Hora' : 'Date/Time'}
                  </th>
                  <th className="px-4 py-3 text-left text-gray-300 light-mode:text-gray-700 font-semibold">
                    {language === 'es' ? 'Producto' : 'Product'}
                  </th>
                  <th className="px-4 py-3 text-left text-gray-300 light-mode:text-gray-700 font-semibold">
                    {language === 'es' ? 'Tipo' : 'Type'}
                  </th>
                  <th className="px-4 py-3 text-right text-gray-300 light-mode:text-gray-700 font-semibold">
                    {language === 'es' ? 'Cantidad' : 'Quantity'}
                  </th>
                  <th className="px-4 py-3 text-right text-gray-300 light-mode:text-gray-700 font-semibold">
                    {language === 'es' ? 'Costo Unit.' : 'Unit Cost'}
                  </th>
                  <th className="px-4 py-3 text-right text-gray-300 light-mode:text-gray-700 font-semibold">
                    {language === 'es' ? 'Total' : 'Total'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredMovements.map((movement) => {
                  const { fecha, hora } = formatDateTime(movement.fecha || movement.createdAt);

                  return (
                    <tr
                      key={movement.id}
                      className="border-b border-gray-700 light-mode:border-gray-200 hover:bg-gray-800/50 light-mode:hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-300 light-mode:text-gray-900">
                        <div className="text-xs">
                          <p className="font-semibold">{fecha}</p>
                          <p className="text-gray-500 light-mode:text-gray-600">{hora}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-300 light-mode:text-gray-900 font-semibold">
                        {movement.productoNombre || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getTypeColor(movement.tipo)}`}>
                          {movement.tipo || 'Desconocido'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold">
                        <span className={
                          movement.tipo === 'Entrada' ? 'text-green-400' :
                          movement.tipo === 'Merma' ? 'text-red-400' :
                          movement.tipo === 'Salida' ? 'text-orange-400' :
                          'text-blue-400'
                        }>
                          {movement.tipo === 'Entrada' ? '+' : '-'}{movement.cantidad || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-300 light-mode:text-gray-900">
                        ${formatCurrency(movement.costoUnitario || 0)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-white light-mode:text-gray-900">
                        ${formatCurrency(movement.total || 0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-gray-800 light-mode:bg-gray-100 rounded-lg p-12 text-center">
          <Package className="w-12 h-12 text-gray-600 light-mode:text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400 light-mode:text-gray-600 text-lg">
            {language === 'es' ? 'No hay movimientos registrados' : 'No movements recorded'}
          </p>
        </div>
      )}
    </div>
  );
}
              <tbody>
                {filteredMovements.map((movement) => {
                  const { fecha, hora } = formatDateTime(movement.fechaHora);
                  const isEntrada = movement.tipo === 'entrada';

                  return (
                    <tr
                      key={movement.id}
                      className="border-b border-gray-700 light-mode:border-gray-200 hover:bg-gray-800/50 light-mode:hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-300 light-mode:text-gray-900">
                        <div className="text-xs md:text-sm">
                          <p className="font-semibold">{fecha}</p>
                          <p className="text-gray-500 light-mode:text-gray-600">{hora}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-300 light-mode:text-gray-900 font-semibold">{movement.productName}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isEntrada ? (
                            <>
                              <ArrowUp className="w-4 h-4 text-green-500" />
                              <span className="px-2 py-1 bg-green-900/30 text-green-400 rounded text-xs font-semibold">
                                {language === 'es' ? 'Entrada' : 'Entry'}
                              </span>
                            </>
                          ) : (
                            <>
                              <ArrowDown className="w-4 h-4 text-red-500" />
                              <span className="px-2 py-1 bg-red-900/30 text-red-400 rounded text-xs font-semibold">
                                {language === 'es' ? 'Salida' : 'Exit'}
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className={`px-4 py-3 text-right font-bold text-base ${
                        isEntrada ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {isEntrada ? '+' : '-'}{movement.cantidad}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-300 light-mode:text-gray-900">
                        ${formatCurrency(movement.costoUnitario || 0)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-green-400 light-mode:text-green-600">
                        ${formatCurrency(movement.total || 0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-gray-800 light-mode:bg-gray-100 rounded-lg p-12 text-center">
          <Package className="w-12 h-12 text-gray-600 light-mode:text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400 light-mode:text-gray-600 text-lg">
            {language === 'es' ? 'No hay movimientos registrados' : 'No movements recorded'}
          </p>
        </div>
      )}
    </div>
  );
}
