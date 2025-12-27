import { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, Calendar, Package, TrendingUp, TrendingDown, DollarSign, FileText, Download, History } from 'lucide-react';
import { getMovements, subscribeToMovements, subscribeToInventoryHistory } from '../services/firebaseService';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function Movements({ language = 'es', user }) {
  const [movements, setMovements] = useState([]);
  const [inventoryHistory, setInventoryHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [filterType, setFilterType] = useState(''); // '', 'Entrada', 'Salida', 'Merma', 'Ajuste'
  const [filterMonth, setFilterMonth] = useState('todos'); // 'todos', 'este-mes', 'mes-pasado'
  const [activeTab, setActiveTab] = useState('movimientos'); // 'movimientos' | 'inventarios'

  // 🔥 REACTIVIDAD: Cargar movimientos con suscripción en tiempo real
  useEffect(() => {
    if (!user) return;

    setLoading(true);

    // 🔥 Suscripción en tiempo real a movimientos
    const unsubscribe = subscribeToMovements(user.uid, (movementsData) => {
      console.log('🔄 Movimientos actualizados en tiempo real:', movementsData.length);
      setMovements(movementsData);
      setLoading(false);
    });

    // Cleanup: Desuscribirse al desmontar
    return () => {
      console.log('📤 Desuscribiéndose de movimientos');
      unsubscribe();
    };
  }, [user]);

  // 🔥 NUEVO: Cargar historial de inventarios en tiempo real
  useEffect(() => {
    if (!user) return;

    setLoadingHistory(true);

    const unsubscribe = subscribeToInventoryHistory(user.uid, (historyData) => {
      console.log('📊 Historial de inventarios actualizado:', historyData.length);
      setInventoryHistory(historyData);
      setLoadingHistory(false);
    });

    return () => {
      console.log('📤 Desuscribiéndose de historial');
      unsubscribe();
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

  // Calcular resumen del mes actual o del periodo seleccionado
  const calculateMonthSummary = () => {
    const dateRange = filterMonth !== 'todos' ? getDateRange() : null;
    
    const filteredByDate = dateRange ? movements.filter(m => {
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
      return movementDate >= dateRange.start && movementDate <= dateRange.end;
    }) : movements;

    const entradas = filteredByDate
      .filter(m => m.tipo === 'Entrada')
      .reduce((sum, m) => sum + (m.total || 0), 0);
    
    const mermas = filteredByDate
      .filter(m => m.tipo === 'Merma')
      .reduce((sum, m) => sum + (m.total || 0), 0);
    
    const salidas = filteredByDate
      .filter(m => m.tipo === 'Salida')
      .reduce((sum, m) => sum + (m.total || 0), 0);

    // Auditoría: Valor total comprado vs valor total mermado
    const valorTotalComprado = entradas;
    const valorTotalMermado = mermas;

    return { entradas, mermas, salidas, valorTotalComprado, valorTotalMermado };
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

  // 📄 REGENERAR PDF desde historial
  const regeneratePDF = (historyItem) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      
      // Encabezado Corporativo - ROAL BURGER
      doc.setFillColor(220, 53, 69);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('ROAL BURGER', pageWidth / 2, 15, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('REPORTE DE INVENTARIO', pageWidth / 2, 25, { align: 'center' });
      
      // Fecha y Hora del registro
      const { fecha, hora } = formatDateTime(historyItem.fecha);
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text(`${fecha} - ${hora}`, pageWidth / 2, 34, { align: 'center' });
      
      // Información del cierre
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(`Responsable: ${historyItem.responsable}`, 14, 50);
      doc.text(`Proveedor: ${historyItem.proveedor}`, 14, 57);
      
      // Separador
      doc.setDrawColor(220, 53, 69);
      doc.setLineWidth(0.5);
      doc.line(14, 65, pageWidth - 14, 65);
      
      // Tabla con datos del historial
      const tableData = (historyItem.productos || []).map(item => {
        const costoSalida = (item.cantidadSalida || 0) * (item.costoUnitario || 0);
        return [
          item.nombre || item.productoNombre,
          item.unidad,
          (item.stockInicial || item.stockTeorico || 0).toString(),
          (item.stockFinal || item.stockFisico || 0).toString(),
          (item.cantidadSalida || item.consumo || 0).toString(),
          `$${costoSalida.toFixed(2)}`,
          item.observaciones || '-'
        ];
      });
      
      doc.autoTable({
        startY: 70,
        head: [['Producto', 'Unidad', 'Stock Teórico', 'Conteo Físico', 'Consumo', 'Costo Salida', 'Observaciones']],
        body: tableData,
        theme: 'striped',
        headStyles: { 
          fillColor: [220, 53, 69],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'center'
        },
        bodyStyles: { 
          fontSize: 7,
          cellPadding: 2
        },
        columnStyles: {
          0: { cellWidth: 45 },
          1: { cellWidth: 18, halign: 'center' },
          2: { cellWidth: 22, halign: 'center' },
          3: { cellWidth: 22, halign: 'center' },
          4: { cellWidth: 20, halign: 'center' },
          5: { cellWidth: 25, halign: 'right' },
          6: { cellWidth: 33 }
        }
      });
      
      // Sumatoria total
      let finalY = doc.lastAutoTable.finalY + 12;
      doc.setFillColor(240, 240, 240);
      doc.roundedRect(14, finalY - 3, pageWidth - 28, 32, 2, 2, 'F');
      
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 53, 69);
      doc.text('SUMATORIA TOTAL DE CONSUMO', 20, finalY + 5);
      
      doc.setFontSize(18);
      doc.text(`${historyItem.total_unidades_salientes || 0} UNIDADES`, pageWidth - 20, finalY + 14, { align: 'right' });
      
      doc.setFontSize(12);
      doc.setTextColor(0, 128, 0);
      doc.text(`COSTO: $${(historyItem.totalCostoSalidas || 0).toFixed(2)}`, pageWidth - 20, finalY + 23, { align: 'right' });
      
      // Línea de firma
      finalY += 48;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text('Firma del Responsable:', 14, finalY);
      doc.setLineWidth(0.5);
      doc.setDrawColor(0, 0, 0);
      doc.line(55, finalY, 130, finalY);
      
      // Descargar PDF
      const fileName = `Inventario_${historyItem.proveedor}_${fecha.replace(/\//g, '-')}.pdf`;
      doc.save(fileName);
      
      toast.success('PDF generado correctamente');
    } catch (error) {
      console.error('Error generando PDF:', error);
      toast.error('Error al generar el PDF');
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

      {/* TABS: Movimientos vs Historial de Inventarios */}
      <div className="mb-6">
        <div className="flex gap-2 border-b border-gray-700 light-mode:border-gray-300">
          <button
            onClick={() => setActiveTab('movimientos')}
            className={`px-6 py-3 font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'movimientos'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 light-mode:text-gray-600 hover:text-gray-300'
            }`}
          >
            <Package className="w-5 h-5" />
            {language === 'es' ? 'Movimientos' : 'Movements'}
          </button>
          <button
            onClick={() => setActiveTab('inventarios')}
            className={`px-6 py-3 font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'inventarios'
                ? 'text-green-400 border-b-2 border-green-400'
                : 'text-gray-400 light-mode:text-gray-600 hover:text-gray-300'
            }`}
          >
            <History className="w-5 h-5" />
            {language === 'es' ? 'Historial de Inventarios' : 'Inventory History'}
          </button>
        </div>
      </div>

      {/* CONTENIDO CONDICIONAL POR TAB */}
      {activeTab === 'movimientos' ? (
        <>
      {/* Resumen del mes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-900/20 to-green-800/10 border border-green-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-400 text-xs font-semibold mb-1">
                {language === 'es' ? 'Total Entradas' : 'Total Entries'}
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
                {language === 'es' ? 'Total Mermas' : 'Total Waste'}
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
                {language === 'es' ? 'Total Salidas' : 'Total Exits'}
              </p>
              <p className="text-white font-bold text-xl">
                ${formatCurrency(summary.salidas)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-400 opacity-50" />
          </div>
        </div>
      </div>

      {/* Dashboard de Auditoría */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-cyan-900/20 to-cyan-800/10 border border-cyan-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cyan-400 text-xs font-semibold mb-1">
                {language === 'es' ? '💰 Valor Total Comprado' : '💰 Total Purchase Value'}
              </p>
              <p className="text-white font-bold text-2xl">
                ${formatCurrency(summary.valorTotalComprado)}
              </p>
              <p className="text-cyan-500/70 text-xs mt-1">
                {language === 'es' ? 'Inversión en mercancía' : 'Merchandise investment'}
              </p>
            </div>
            <ArrowUp className="w-10 h-10 text-cyan-400 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-900/20 to-orange-800/10 border border-orange-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-400 text-xs font-semibold mb-1">
                {language === 'es' ? '⚠️ Valor Total Mermado' : '⚠️ Total Waste Value'}
              </p>
              <p className="text-white font-bold text-2xl">
                ${formatCurrency(summary.valorTotalMermado)}
              </p>
              <p className="text-orange-500/70 text-xs mt-1">
                {language === 'es' 
                  ? `${summary.valorTotalComprado > 0 ? ((summary.valorTotalMermado / summary.valorTotalComprado) * 100).toFixed(1) : 0}% del total comprado`
                  : `${summary.valorTotalComprado > 0 ? ((summary.valorTotalMermado / summary.valorTotalComprado) * 100).toFixed(1) : 0}% of total purchased`
                }
              </p>
            </div>
            <ArrowDown className="w-10 h-10 text-orange-400 opacity-50" />
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
      </>
      ) : (
        /* TAB DE HISTORIAL DE INVENTARIOS */
        <div>
          {loadingHistory ? (
            <div className="bg-gray-800 light-mode:bg-white rounded-lg p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
              <p className="text-gray-400 light-mode:text-gray-600 mt-4">
                {language === 'es' ? 'Cargando historial...' : 'Loading history...'}
              </p>
            </div>
          ) : inventoryHistory.length === 0 ? (
            <div className="bg-gray-800 light-mode:bg-white rounded-lg p-12 text-center">
              <History className="w-16 h-16 text-gray-600 light-mode:text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 light-mode:text-gray-600 text-lg font-semibold">
                {language === 'es' ? 'No hay inventarios registrados aún' : 'No inventories registered yet'}
              </p>
              <p className="text-gray-500 light-mode:text-gray-500 text-sm mt-2">
                {language === 'es' 
                  ? 'Los inventarios finalizados aparecerán aquí para su consulta' 
                  : 'Completed inventories will appear here for review'}
              </p>
            </div>
          ) : (
            <div className="bg-gray-800 light-mode:bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-750 light-mode:bg-gray-100 border-b border-gray-700 light-mode:border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-gray-300 light-mode:text-gray-700 font-semibold">
                        {language === 'es' ? 'Fecha' : 'Date'}
                      </th>
                      <th className="px-4 py-3 text-left text-gray-300 light-mode:text-gray-700 font-semibold">
                        {language === 'es' ? 'Proveedor' : 'Provider'}
                      </th>
                      <th className="px-4 py-3 text-left text-gray-300 light-mode:text-gray-700 font-semibold">
                        {language === 'es' ? 'Responsable' : 'Responsible'}
                      </th>
                      <th className="px-4 py-3 text-center text-gray-300 light-mode:text-gray-700 font-semibold">
                        {language === 'es' ? 'Unidades Salientes' : 'Outgoing Units'}
                      </th>
                      <th className="px-4 py-3 text-right text-gray-300 light-mode:text-gray-700 font-semibold">
                        {language === 'es' ? 'Costo Total' : 'Total Cost'}
                      </th>
                      <th className="px-4 py-3 text-center text-gray-300 light-mode:text-gray-700 font-semibold">
                        {language === 'es' ? 'Acciones' : 'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryHistory.map((item) => {
                      const { fecha, hora } = formatDateTime(item.fecha);
                      
                      return (
                        <tr
                          key={item.id}
                          className="border-b border-gray-700 light-mode:border-gray-200 hover:bg-gray-750 light-mode:hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3 text-gray-300 light-mode:text-gray-900">
                            <div className="text-xs">
                              <p className="font-semibold">{fecha}</p>
                              <p className="text-gray-500 light-mode:text-gray-600">{hora}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-300 light-mode:text-gray-900 font-semibold">
                            {item.proveedor}
                          </td>
                          <td className="px-4 py-3 text-gray-300 light-mode:text-gray-900">
                            {item.responsable}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-3 py-1 bg-red-900/30 text-red-400 rounded-full text-xs font-bold">
                              {item.total_unidades_salientes || 0}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-green-400 font-bold">
                            ${formatCurrency(item.totalCostoSalidas || 0)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => regeneratePDF(item)}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors mx-auto text-xs"
                              title={language === 'es' ? 'Descargar PDF' : 'Download PDF'}
                            >
                              <Download className="w-4 h-4" />
                              {language === 'es' ? 'PDF' : 'PDF'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
