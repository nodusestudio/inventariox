import { TrendingUp, AlertCircle, Package } from 'lucide-react';

export default function MetricCard({ title, value, icon: Icon, trend, color = 'primary' }) {
  return (
    <div className="metric-card">
      <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3 sm:gap-0">
        <div className="flex-1 min-w-0">
          <p className="text-gray-400 light-mode:text-gray-600 text-xs sm:text-sm font-medium">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold mt-2 text-white light-mode:text-gray-900">{value}</p>
          {trend && (
            <p className={`text-xs sm:text-sm mt-2 ${trend.positive ? 'text-green-400 light-mode:text-green-600' : 'text-red-400 light-mode:text-red-600'}`}>
              {trend.positive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        <div className={`p-2 sm:p-3 rounded-lg flex-shrink-0 ${color === 'primary' ? 'bg-blue-900/30 light-mode:bg-blue-100' : color === 'secondary' ? 'bg-green-900/30 light-mode:bg-green-100' : 'bg-red-900/30 light-mode:bg-red-100'}`}>
          <Icon className={`w-5 sm:w-6 h-5 sm:h-6 ${color === 'primary' ? 'text-blue-400 light-mode:text-blue-600' : color === 'secondary' ? 'text-green-400 light-mode:text-green-600' : 'text-red-400 light-mode:text-red-600'}`} />
        </div>
      </div>
    </div>
  );
}
