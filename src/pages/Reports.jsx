import { useState, useMemo, useEffect } from 'react';
import { FileDown, Calendar, DollarSign, Users, Package, Trophy, AlertTriangle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getMermas } from '../services/firebaseService';

// CLP formatter without decimals
const formatCLP = (value) => new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(value || 0);

export default function Reports({ ordersData = [], providersData = [], productsData = [], companyData = { nombreEmpresa: 'ROAL BURGER' }, language = 'es', user }) {
  const today = new Date();
  const [month, setMonth] = useState(String(today.getMonth() + 1).padStart(2, '0'));
  const [year, setYear] = useState(String(today.getFullYear()));
  const [mermasData, setMermasData] = useState([]);

  // Load mermas from Firebase
  useEffect(() => {
    if (!user) return;
    const loadMermas = async () => {
      try {
        const data = await getMermas(user.uid);
        setMermasData(data || []);
      } catch (error) {
        console.error('Error loading mermas:', error);
      }
    };
    loadMermas();
  }, [user]);

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

  // Suggested savings: units not ordered thanks to stockActual
  // Approximation: savings per item = min(stockEnMano, stockObjetivo) * costo
  const suggestedSavings = useMemo(() => {
    return filteredOrders.reduce((sum, o) => {
      const items = o.items || [];
      const orderSavings = items.reduce((acc, i) => {
        const stockActual = (i.stockEnMano ?? 0);
        const objetivo = (i.stockObjetivo ?? 0);
        const costo = (i.costo ?? 0);
        const savedUnits = Math.max(0, Math.min(stockActual, objetivo));
        return acc + (savedUnits * costo);
      }, 0);
      return sum + orderSavings;
    }, 0);
  }, [filteredOrders]);

  // Ahorro Realizado: diferencia positiva entre Stock Actual y Stock Objetivo multiplicada por costo unitario
  // Fórmula por item: max(stockEnMano - stockObjetivo, 0) * costo
  const ahorroRealizado = useMemo(() => {
    return filteredOrders.reduce((sum, o) => {
      const items = o.items || [];
      const orderReal = items.reduce((acc, i) => {
        const stockActual = (i.stockEnMano ?? 0);
        const objetivo = (i.stockObjetivo ?? 0);
        const costo = (i.costo ?? 0);
        const diff = Math.max(0, stockActual - objetivo);
        return acc + (diff * costo);
      }, 0);
      return sum + orderReal;
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

  const topProvider = byProvider.length > 0 ? byProvider[0] : null;

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

  // Filter mermas by month/year
  const filteredMermas = useMemo(() => {
    return (mermasData || []).filter(m => {
      if (!m || !m.fecha) return false;
      const d = new Date(m.fecha + 'T00:00:00');
      return (String(d.getFullYear()) === year && String(d.getMonth() + 1).padStart(2, '0') === month);
    });
  }, [mermasData, month, year]);

  // Total value of mermas
  const totalMermas = useMemo(() => {
    return filteredMermas.reduce((sum, m) => sum + (m.valorTotal || 0), 0);
  }, [filteredMermas]);

  // PDF generation
  const handleDownloadPDF = async () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const genDate = new Date();
    const companyName = companyData?.nombre || companyData?.nombreEmpresa || 'ROAL BURGER';
    const title = `REPORTE MENSUAL DE INVENTARIO - ${companyName}`;
    const period = `Periodo: ${month}/${year}`;
    const genText = `Generado: ${genDate.toLocaleDateString('es-CL')} ${genDate.toLocaleTimeString('es-CL')}`;

    // Header
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(title, pageWidth / 2, 16, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(period, 12, 26);
    doc.text(genText, 12, 32);

    // Optional logo
    if (companyData?.logo) {
      try {
        const resp = await fetch(companyData.logo);
        const blob = await resp.blob();
        const reader = new FileReader();
        const dataUrl = await new Promise((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        // Try PNG first; jsPDF auto-detects type from dataURL
        doc.addImage(dataUrl, 'PNG', 12, 10, 20, 20);
      } catch (e) {
        console.warn('Logo no disponible para PDF:', e);
      }
    }

    // Summary
    doc.setFontSize(12);
    doc.text(`Total Global: $${formatCLP(globalTotal)}`, 12, 42);
    doc.text(`Ahorro Sugerido: $${formatCLP(suggestedSavings)}`, 12, 48);
    doc.text(`Mermas del Mes: $${formatCLP(totalMermas)}`, 12, 54);
    if (topProvider) {
      doc.text(`Proveedor Top: ${topProvider.nombre} ($${formatCLP(topProvider.valor)})`, 12, 60);
    }

    // Styled tables with jspdf-autotable
    let y = 68;
    autoTable(doc, {
      startY: y,
      head: [["Resumen", "Monto"]],
      body: [
        ["Total Global", `$${formatCLP(globalTotal)}`],
        ["Ahorro Sugerido", `$${formatCLP(suggestedSavings)}`],
        ["Ahorro Realizado", `$${formatCLP(ahorroRealizado)}`],
        ["Mermas del Mes", `$${formatCLP(totalMermas)}`],
        ["Proveedor Top", topProvider ? `${topProvider.nombre} ($${formatCLP(topProvider.valor)})` : '—']
      ],
      theme: 'grid',
      styles: { fillColor: [17,24,39], textColor: 255, lineColor: [55,65,81], lineWidth: 0.1 },
      headStyles: { fillColor: [32,109,218], textColor: 255 },
      alternateRowStyles: { fillColor: [31,41,55] },
    });
    y = doc.lastAutoTable.finalY + 8;

    // Gastos por Proveedor table
    autoTable(doc, {
      startY: y,
      head: [["Proveedor", "Gasto"]],
      body: byProvider.map(p => [p.nombre, `$${formatCLP(p.valor)}`]),
      theme: 'grid',
      styles: { fillColor: [17,24,39], textColor: 255, lineColor: [55,65,81], lineWidth: 0.1 },
      headStyles: { fillColor: [32,109,218], textColor: 255 },
      alternateRowStyles: { fillColor: [31,41,55] },
    });
    y = doc.lastAutoTable.finalY + 8;

    // Top 5 Productos de Mayor Inversión
    const top5 = productRanking.slice(0, 5);
    autoTable(doc, {
      startY: y,
      head: [["#", "Producto", "Inversión"]],
      body: top5.map((r, idx) => [String(idx + 1), r.nombre, `$${formatCLP(r.valor)}`]),
      theme: 'grid',
      styles: { fillColor: [17,24,39], textColor: 255, lineColor: [55,65,81], lineWidth: 0.1 },
      headStyles: { fillColor: [32,109,218], textColor: 255 },
      alternateRowStyles: { fillColor: [31,41,55] },
    });
    y = doc.lastAutoTable.finalY + 8;

    // Mermas del Mes table
    if (filteredMermas.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [["Producto", "Cantidad", "Motivo", "Valor"]],
        body: filteredMermas.map(m => [
          m.productoNombre || 'SIN NOMBRE',
          String(m.cantidad || 0),
          m.motivo || '—',
          `$${formatCLP(m.valorTotal || 0)}`
        ]),
        theme: 'grid',
        styles: { fillColor: [17,24,39], textColor: 255, lineColor: [55,65,81], lineWidth: 0.1 },
        headStyles: { fillColor: [32,109,218], textColor: 255 },
        alternateRowStyles: { fillColor: [31,41,55] },
      });
    }

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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-[#111827] border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-300">
            <DollarSign className="w-5 h-5 text-blue-400" />
            <span className="text-sm">Gasto Total Mensual</span>
          </div>
          <p className="mt-2 text-2xl font-black text-yellow-300">${formatCLP(globalTotal)}</p>
        </div>
        <div className="bg-[#111827] border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-300">
            <Trophy className="w-5 h-5 text-green-400" />
            <span className="text-sm">Ahorro Generado</span>
          </div>
          <p className="mt-2 text-2xl font-black text-green-300">${formatCLP(suggestedSavings)}</p>
        </div>
        <div className="bg-[#111827] border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-300">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-sm">Mermas del Mes</span>
          </div>
          <p className="mt-2 text-2xl font-black text-red-300">${formatCLP(totalMermas)}</p>
        </div>
        <div className="bg-[#111827] border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-300">
            <Users className="w-5 h-5 text-purple-400" />
            <span className="text-sm">Proveedor con más gasto</span>
          </div>
          <p className="mt-2 text-lg font-bold text-white">{topProvider ? topProvider.nombre : 'Sin datos'}</p>
          <p className="text-sm text-gray-400">{topProvider ? `$${formatCLP(topProvider.valor)}` : ''}</p>
        </div>
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
