import { useState, useMemo } from 'react';
import { FileDown, Calendar, DollarSign, Users, Package } from 'lucide-react';
import { jsPDF } from 'jspdf';

// CLP formatter without decimals
const formatCLP = (value) => new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(value || 0);

export default function Reports({ ordersData = [], providersData = [], productsData = [], companyData = { nombreEmpresa: 'ROAL BURGER' }, language = 'es' }) {
  const today = new Date();
  const [month, setMonth] = useState(String(today.getMonth() + 1).padStart(2, '0'));
  const [year, setYear] = useState(String(today.getFullYear()));

  // Filter orders by month/year and estado Recibido
  const filteredOrders = useMemo(() => {
    return (ordersData || []).filter(o => {
      if (!o || o.estado !== 'Recibido') return false;
      const fechaStr = o.fecha || o.fechaEntrega; // fallback if needed
      if (!fechaStr) return false;
      const d = new Date(fechaStr + 'T00:00:00');
      return (String(d.getFullYear()) === year && String(d.getMonth() + 1).padStart(2, '0') === month);
    });
  }, [ordersData, month, year]);

  // Global total
  const globalTotal = useMemo(() => {
    return filteredOrders.reduce((sum, o) => {
      if (typeof o.total === 'number') return sum + o.total;
      const itemsTotal = (o.items || []).reduce((s, i) => s + ((i.costo || 0) * (i.cantidadPedir || 0)), 0);
      return sum + itemsTotal;
    }, 0);
  }, [filteredOrders]);

  // Total by provider
  const byProvider = useMemo(() => {
    const acc = {};
    filteredOrders.forEach(o => {
      const key = o.proveedor || 'SIN PROVEEDOR';
      const value = typeof o.total === 'number'
        ? o.total
        : (o.items || []).reduce((s, i) => s + ((i.costo || 0) * (i.cantidadPedir || 0)), 0);
      acc[key] = (acc[key] || 0) + value;
    });
    return Object.entries(acc)
      .map(([nombre, valor]) => ({ nombre, valor }))
      .sort((a, b) => b.valor - a.valor);
  }, [filteredOrders]);

  // Ranking by product (investment)
  const productRanking = useMemo(() => {
    const acc = {};
    filteredOrders.forEach(o => {
      (o.items || []).forEach(i => {
        const key = i.nombre || i.id || 'SIN NOMBRE';
        const valor = (i.costo || 0) * (i.cantidadPedir || 0);
        acc[key] = (acc[key] || 0) + valor;
      });
    });
    return Object.entries(acc)
      .map(([nombre, valor]) => ({ nombre, valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10);
  }, [filteredOrders]);

  // PDF generation
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const genDate = new Date();
    const title = `${companyData?.nombreEmpresa || 'ROAL BURGER'} - Reporte de Gastos`;
    const period = `Periodo: ${month}/${year}`;
    const genText = `Generado: ${genDate.toLocaleDateString('es-CL')} ${genDate.toLocaleTimeString('es-CL')}`;

    // Header
    doc.setFontSize(16);
    doc.text(title, 14, 20);
    doc.setFontSize(11);
    doc.text(period, 14, 28);
    doc.text(genText, 14, 34);

    // Global total
    doc.setFontSize(12);
    doc.text(`Total Global: $${formatCLP(globalTotal)}`, 14, 44);

    // By provider
    let y = 54;
    doc.setFontSize(12);
    doc.text('Por Proveedor:', 14, y);
    y += 6;
    doc.setFontSize(10);
    byProvider.forEach(p => {
      doc.text(`${p.nombre}: $${formatCLP(p.valor)}`, 18, y);
      y += 5;
    });

    // Product ranking
    y += 4;
    doc.setFontSize(12);
    doc.text('Top Productos por Inversión:', 14, y);
    y += 6;
    doc.setFontSize(10);
    productRanking.forEach((r, idx) => {
      doc.text(`#${idx + 1} ${r.nombre}: $${formatCLP(r.valor)}`, 18, y);
      y += 5;
    });

    doc.save(`reporte_${year}_${month}.pdf`);
  };

  const months = [
    { value: '01', label: 'Enero' },
    { value: '02', label: 'Febrero' },
    { value: '03', label: 'Marzo' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Mayo' },
    { value: '06', label: 'Junio' },
    { value: '07', label: 'Julio' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ];

  const years = Array.from({ length: 6 }).map((_, i) => String(today.getFullYear() - i));

  return (
    <div className="min-h-screen bg-[#0f172a] light-mode:bg-gray-50 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold text-white light-mode:text-gray-900">Reportes</h1>
          <p className="text-sm sm:text-base text-gray-400 light-mode:text-gray-600">Desglose de gastos y exportación</p>
        </div>
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 px-4 py-2 bg-[#206DDA] hover:bg-blue-600 text-white rounded-lg font-semibold transition-all"
        >
          <FileDown className="w-5 h-5" />
          Descargar PDF
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div>
          <label className="block text-xs font-semibold text-gray-400 light-mode:text-gray-600 mb-1">Mes</label>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full px-3 py-2 bg-[#111827] light-mode:bg-white border border-gray-700 light-mode:border-gray-300 rounded text-sm text-white light-mode:text-gray-900 focus:border-[#206DDA] focus:outline-none"
          >
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-400 light-mode:text-gray-600 mb-1">Año</label>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="w-full px-3 py-2 bg-[#111827] light-mode:bg-white border border-gray-700 light-mode:border-gray-300 rounded text-sm text-white light-mode:text-gray-900 focus:border-[#206DDA] focus:outline-none"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <div className="w-full px-4 py-2 bg-[#1f2937] rounded border border-gray-700 text-white">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-yellow-300" />
              <span className="text-sm">Total del periodo:</span>
              <span className="ml-auto font-bold text-yellow-300">${formatCLP(globalTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* By Provider */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-bold mb-3 text-white light-mode:text-gray-900 flex items-center gap-2"><Users className="w-5 h-5" /> Por Proveedor</h2>
        {byProvider.length > 0 ? (
          <div className="bg-[#111827] light-mode:bg-white border border-gray-700 light-mode:border-gray-300 rounded-lg p-4 divide-y divide-gray-800 light-mode:divide-gray-200">
            {byProvider.map(p => (
              <div key={p.nombre} className="py-2 flex items-center justify-between text-sm sm:text-base">
                <span className="text-gray-300 light-mode:text-gray-800 font-semibold">{p.nombre}</span>
                <span className="text-white light-mode:text-gray-900 font-bold">${formatCLP(p.valor)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 light-mode:text-gray-600 text-sm">Sin datos en el periodo seleccionado.</p>
        )}
      </div>

      {/* Product Ranking */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold mb-3 text-white light-mode:text-gray-900 flex items-center gap-2"><Package className="w-5 h-5" /> Top Productos por Inversión</h2>
        {productRanking.length > 0 ? (
          <div className="bg-[#111827] light-mode:bg-white border border-gray-700 light-mode:border-gray-300 rounded-lg p-4 space-y-2">
            {productRanking.map((r, idx) => (
              <div key={`${r.nombre}-${idx}`} className="flex items-center justify-between text-sm sm:text-base">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 light-mode:text-gray-600 text-xs sm:text-sm">#{idx + 1}</span>
                  <span className="text-white light-mode:text-gray-900 font-semibold">{r.nombre}</span>
                </div>
                <span className="text-yellow-300 light-mode:text-yellow-700 font-bold">${formatCLP(r.valor)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 light-mode:text-gray-600 text-sm">No hay productos para mostrar.</p>
        )}
      </div>
    </div>
  );
}
