import { Package, TrendingUp, AlertCircle } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import TableContainer from '../components/TableContainer';
import { t } from '../utils/translations';

export default function Dashboard({ inventoryData, language = 'es' }) {
  // Calcular métricas
  const totalProducts = inventoryData.length;
  const lowStock = inventoryData.filter(item => item.stockActual < item.stockMinimo).length;
  const pendingOrders = 5; // Placeholder

  const columns = [
    { key: 'nombre', label: t(language, 'nombre') },
    { key: 'proveedor', label: t(language, 'proveedor') },
    { key: 'stockActual', label: t(language, 'stockActual') },
    { key: 'stockMinimo', label: t(language, 'stockMinimo') },
  ];

  return (
    <div className="min-h-screen bg-dark-bg light-mode:bg-gray-50 p-4 sm:p-6 transition-colors duration-300">
      <div>
        {/* Encabezado */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold mb-1 sm:mb-2 text-white light-mode:text-gray-900">{t(language, 'panel')}</h1>
          <p className="text-sm sm:text-base text-gray-400 light-mode:text-gray-600">{t(language, 'resumenGeneral')}</p>
        </div>

        {/* Tarjetas de Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <MetricCard
            title={t(language, 'totalProductos')}
            value={totalProducts}
            icon={Package}
            color="primary"
            trend={{ value: '+12%', positive: true }}
          />
          <MetricCard
            title={t(language, 'productosBajoStock')}
            value={lowStock}
            icon={AlertCircle}
            color="warning"
            trend={{ value: '2 ' + t(language, 'criticos'), positive: false }}
          />
          <MetricCard
            title={t(language, 'gestionPedidos')}
            value={pendingOrders}
            icon={TrendingUp}
            color="secondary"
            trend={{ value: '+5%', positive: true }}
          />
        </div>

        {/* Tabla de Últimos Productos */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold mb-4 text-white light-mode:text-gray-900">{t(language, 'movimientosRecientes')}</h2>
          <TableContainer
            columns={columns}
            data={inventoryData.slice(0, 5)}
            onRowClick={(row) => console.log('Producto seleccionado:', row)}
          />
        </div>
      </div>
    </div>
  );
}
