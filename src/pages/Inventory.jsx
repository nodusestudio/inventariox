import { useState, useEffect } from 'react';
import { FileCheck, AlertTriangle } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { addInventoryLog, getTodayInventoryLog, updateProduct } from '../services/firebaseService';


export default function Inventory({ 
  productsData = [], 
  providers = [], 
  language = 'es',
  userId 
}) {
  // ============ ESTADO PRINCIPAL ============
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedResponsible, setSelectedResponsible] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [todayLog, setTodayLog] = useState(null);

  // ============ VERIFICAR SI YA HAY CIERRE HOY ============
  useEffect(() => {
    const checkTodayLog = async () => {
      if (!userId) return;
      const log = await getTodayInventoryLog(userId);
      setTodayLog(log);
    };
    checkTodayLog();
  }, [userId]);

  // ============ CARGAR PRODUCTOS AL SELECCIONAR PROVEEDOR ============
  useEffect(() => {
    if (selectedProvider && productsData.length > 0) {
      const products = productsData.filter(p => p.proveedor === selectedProvider);
      setFilteredProducts(products);
      
      // Inicializar datos de inventario con stock teórico
      const initialData = products.map(p => ({
        id: p.id,
        nombre: p.nombre,
        unidad: p.unidad,
        stockTeorico: p.stockActual || 0,
        stockFisico: '',
        diferencia: 0,
        observaciones: ''
      }));
      setInventoryData(initialData);
    } else {
      setFilteredProducts([]);
      setInventoryData([]);
    }
  }, [selectedProvider, productsData]);

  // ============ CALCULAR CONSUMO AUTOMÁTICAMENTE (ERP STANDARD) ============
  const handleStockFisicoChange = (productId, value) => {
    const numValue = value === '' ? '' : parseFloat(value) || 0;
    
    setInventoryData(prev => prev.map(item => {
      if (item.id === productId) {
        const teorico = item.stockTeorico;
        const fisico = numValue === '' ? 0 : numValue;
        // Consumo = Stock Teórico - Stock Físico (positivo = vendido/consumido)
        const consumo = teorico - fisico;
        
        return {
          ...item,
          stockFisico: value,
          diferencia: consumo
        };
      }
      return item;
    }));
    
    setHasUnsavedChanges(true);
  };

  // ============ MANEJAR OBSERVACIONES ============
  const handleObservacionesChange = (productId, value) => {
    setInventoryData(prev => prev.map(item => 
      item.id === productId ? { ...item, observaciones: value } : item
    ));
  };

  // ============ GENERAR PDF DE CLASE MUNDIAL (Professional ERP Standard) ============
  const generatePDF = (data) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Encabezado Corporativo - ROAL BURGER en GRANDE
    doc.setFillColor(220, 53, 69);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('ROAL BURGER', pageWidth / 2, 15, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('REPORTE DE INVENTARIO', pageWidth / 2, 25, { align: 'center' });
    
    // Fecha y Hora DESTACADA
    const now = new Date();
    const fecha = now.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const hora = now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: true });
    
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(`${fecha} - ${hora}`, pageWidth / 2, 34, { align: 'center' });
    
    // Información del Cierre
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    
    doc.text(`Fecha: ${fecha}`, 14, 45);
    doc.text(`Hora: ${hora}`, 14, 52);
    doc.text(`Responsable: ${selectedResponsible}`, 14, 59);
    doc.text(`Proveedor: ${selectedProvider}`, 14, 66);
    
    // Métricas de Consumo
    const totalConsumo = data.reduce((sum, item) => 
      sum + (item.diferencia > 0 ? item.diferencia : 0), 0
    );
    const productosConsumo = data.filter(item => item.diferencia > 0).length;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Total Productos: ${data.length}`, pageWidth - 14, 52, { align: 'right' });
    doc.text(`Con Consumo: ${productosConsumo}`, pageWidth - 14, 59, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(`Consumo Total: ${totalConsumo} unidades`, pageWidth - 14, 66, { align: 'right' });
    
    // Separador
    doc.setDrawColor(220, 53, 69);
    doc.setLineWidth(0.5);
    doc.line(14, 72, pageWidth - 14, 72);
    
    // Tabla de Movimientos
    const tableData = data.map(item => [
      item.nombre,
      item.unidad,
      item.stockTeorico.toString(),
      item.stockFisico.toString(),
      item.diferencia.toString(),
      item.observaciones || '-'
    ]);
    
    doc.autoTable({
      startY: 77,
      head: [['Producto', 'Unidad', 'Stock Teórico', 'Conteo Físico', 'Consumo', 'Observaciones']],
      body: tableData,
      theme: 'striped',
      headStyles: { 
        fillColor: [220, 53, 69], // Rojo ROAL BURGER
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center'
      },
      bodyStyles: { 
        fontSize: 8,
        cellPadding: 3
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 25, halign: 'center' },
        5: { cellWidth: 40 }
      },
      didParseCell: function(data) {
        // Resaltar Consumo (positivo = vendido/consumido, negativo = excedente)
        if (data.section === 'body' && data.column.index === 4) {
          const consumo = parseFloat(data.cell.text[0]);
          if (consumo > 0) {
            data.cell.styles.textColor = [220, 53, 69]; // Rojo para consumo
            data.cell.styles.fontStyle = 'bold';
          } else if (consumo < 0) {
            data.cell.styles.textColor = [34, 139, 34]; // Verde para excedente
          }
        }
      }
    });
    
    // Resumen de Consumo con SUMATORIA TOTAL
    let finalY = doc.lastAutoTable.finalY + 12;
    const productosConConsumo = data.filter(item => item.diferencia > 0);
    
    // Rectángulo destacado para la sumatoria
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(14, finalY - 3, pageWidth - 28, 28, 2, 2, 'F');
    
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 53, 69);
    doc.text('SUMATORIA TOTAL DE CONSUMO', 20, finalY + 5);
    
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 53, 69);
    doc.text(`${totalConsumo} UNIDADES`, pageWidth - 20, finalY + 18, { align: 'right' });
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Productos con consumo: ${productosConConsumo.length} de ${data.length}`, 20, finalY + 18);
    
    // LÍNEA DE FIRMA DEL RESPONSABLE
    finalY += 45;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('Firma del Responsable:', 14, finalY);
    
    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 0, 0);
    doc.line(55, finalY, 130, finalY);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      let yPos = finalY + 22;
      productosConConsumo.forEach((item, idx) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(`• ${item.nombre}: ${item.diferencia} ${item.unidad}`, 18, yPos);
        if (item.observaciones) {
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          doc.text(`  Obs: ${item.observaciones}`, 18, yPos + 4);
          doc.setFontSize(9);
          doc.setTextColor(0, 0, 0);
          yPos += 4;
        }
        yPos += 6;
      });
    } else {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(34, 139, 34);
      doc.text('CONSUMO TOTAL', 14, finalY);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(34, 139, 34);
      doc.text('Total de Unidades: 0', 14, finalY + 8);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Sin consumo registrado - Stock completo', 14, finalY + 16);
    }
    
    // Sección de firmas
    const firmasY = Math.min(finalY + (productosConConsumo.length > 0 ? productosConConsumo.length * 6 + 30 : 20), 250);
    
    if (firmasY < 260) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('FIRMAS Y VALIDACIÓN', 14, firmasY);
      
      doc.setDrawColor(0, 0, 0);
      const firmasBaseY = firmasY + 15;
      
      // Firma del Responsable
      doc.line(14, firmasBaseY, 80, firmasBaseY);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Responsable: ${selectedResponsible}`, 14, firmasBaseY + 5);
      doc.text('Firma', 14, firmasBaseY + 10);
      
      // Firma del Supervisor
      doc.line(115, firmasBaseY, 180, firmasBaseY);
      doc.text('Supervisor / Gerencia', 115, firmasBaseY + 5);
      doc.text('Firma y Sello', 115, firmasBaseY + 10);
    }
    
    // Pie de página
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      
      // Línea superior del pie
      doc.setDrawColor(220, 53, 69);
      doc.setLineWidth(0.3);
      doc.line(14, doc.internal.pageSize.height - 15, pageWidth - 14, doc.internal.pageSize.height - 15);
      
      // Texto del pie
      doc.text(
        `Generado por InventarioX - ROAL BURGER`,
        14,
        doc.internal.pageSize.height - 10
      );
      doc.text(
        `Página ${i} de ${totalPages}`,
        pageWidth - 14,
        doc.internal.pageSize.height - 10,
        { align: 'right' }
      );
    }
    
    return doc;
  };

  // ============ GUARDADO DIRECTO - LIMPIEZA PROFUNDA ============
  const handleCloseInventory = async () => {
    console.log('=== INICIO VALIDACIÓN ===');
    
    // CAPTURA FORZADA: Obtener valores directamente del estado
    const responsable = (selectedResponsible || '').trim();
    const proveedor = (selectedProvider || '').trim();
    
    console.log('Responsable capturado:', responsable);
    console.log('Proveedor capturado:', proveedor);
    console.log('Productos cargados:', inventoryData.length);

    // VALIDACIÓN 1: Responsable (solo texto, sin sede)
    if (!responsable) {
      console.log('❌ Falta el nombre del responsable');
      alert('Falta el nombre del responsable');
      return;
    }

    // VALIDACIÓN 2: Proveedor (solo texto, sin sede)
    if (!proveedor) {
      console.log('❌ Falta seleccionar el proveedor');
      alert('Falta seleccionar el proveedor');
      return;
    }

    // VALIDACIÓN 3: Productos cargados
    if (!inventoryData || inventoryData.length === 0) {
      console.log('❌ No hay productos');
      alert('No hay productos cargados para generar el reporte');
      return;
    }

    // VALIDACIÓN 4: Stock físico completo
    const incomplete = inventoryData.some(item => 
      item.stockFisico === '' || item.stockFisico === null || item.stockFisico === undefined
    );
    if (incomplete) {
      console.log('❌ Stock físico incompleto');
      alert('Debes ingresar el stock físico de todos los productos');
      return;
    }

    console.log('✅ TODAS LAS VALIDACIONES PASARON');
    
    // Mostrar estado de carga
    setIsProcessing(true);
    console.log('Cargando...');
    
    try {
      // FIREBASE CLEAN: Objeto estrictamente limpio sin 'sede'
      const productos = inventoryData.map(item => ({
        id: item.id,
        nombre: item.nombre,
        unidad: item.unidad,
        stockTeorico: item.stockTeorico,
        stockFisico: parseFloat(item.stockFisico),
        consumo: item.diferencia,
        observaciones: item.observaciones || ''
      }));

      const totalConsumo = productos.reduce((sum, item) => 
        sum + (item.consumo > 0 ? item.consumo : 0), 0
      );

      console.log('Objeto para Firebase (SIN sede):');
      console.log('- Responsable:', responsable);
      console.log('- Proveedor:', proveedor);
      console.log('- Total Productos:', productos.length);
      console.log('- Consumo Total:', totalConsumo);

      // FLUJO DIRECTO: Guardar en Firebase EN PARALELO
      console.log('Guardando en Firebase...');
      await Promise.all([
        addInventoryLog(userId, responsable, proveedor, productos),
        ...inventoryData.map(item => 
          updateProduct(item.id, { stockActual: parseFloat(item.stockFisico) })
        )
      ]);
      console.log('✅ Guardado en Firebase completado');

      // Generar y descargar PDF (operación asíncrona)
      console.log('Generando PDF...');
      const doc = generatePDF(inventoryData);
      const fileName = `Reporte_Inventario_${proveedor}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      console.log('✅ PDF generado:', fileName);

      // RESET COMPLETO del formulario para el siguiente proveedor
      setSelectedProvider('');
      setSelectedResponsible('');
      setFilteredProducts([]);
      setInventoryData([]);
      setHasUnsavedChanges(false);
      console.log('✅ Formulario completamente reseteado y listo para el siguiente proveedor');

      // Mensaje de éxito
      alert('¡Inventario registrado con éxito! PDF descargado.');
      console.log('=== PROCESO COMPLETADO CON ÉXITO ===');

    } catch (error) {
      console.error('Error al guardar inventario:', error);
      // Mostrar el mensaje de error específico desde Firebase
      alert(error.message || 'Error al guardar. Verifica tu conexión e intenta nuevamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ============ ESTADÍSTICAS DE CONSUMO ============
  const productosConsumo = inventoryData.filter(item => item.diferencia > 0).length;
  const totalConsumo = inventoryData.reduce((sum, item) => 
    sum + (item.diferencia > 0 ? item.diferencia : 0), 0
  );
  const canClose = selectedProvider && selectedResponsible && 
                   inventoryData.length > 0 && 
                   !inventoryData.some(item => item.stockFisico === '');

  return (
    <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 bg-[#111827] light-mode:bg-gray-50 min-h-screen">
      {/* Título */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-white light-mode:text-gray-900 font-black text-xl sm:text-2xl md:text-3xl bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent mb-1 sm:mb-2">
          {language === 'es' ? 'Control de Inventario' : 'Inventory Control'}
        </h1>
        <p className="text-gray-400 light-mode:text-gray-600 text-xs sm:text-sm md:text-base">
          {language === 'es' 
            ? 'Sistema de conteo físico y control de diferencias' 
            : 'Physical count system and difference control'}
        </p>
      </div>

      {/* Alerta si ya existe un cierre hoy */}
      {todayLog && (
        <div className="mb-6 bg-yellow-900/30 border border-yellow-600 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <div>
              <p className="text-yellow-200 font-semibold">
                {language === 'es' ? 'Ya existe un cierre de inventario hoy' : 'An inventory closing already exists today'}
              </p>
              <p className="text-yellow-300 text-sm">
                {language === 'es' 
                  ? `Proveedor: ${todayLog.proveedor} - Responsable: ${todayLog.responsable}` 
                  : `Provider: ${todayLog.proveedor} - Responsible: ${todayLog.responsable}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filtros Iniciales */}
      <div className="bg-gray-800 light-mode:bg-white rounded-lg p-6 mb-6 shadow-lg">
        <h2 className="text-white light-mode:text-gray-900 font-bold text-lg mb-4">
          {language === 'es' ? 'Configuración de Conteo' : 'Count Configuration'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Proveedor */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 light-mode:text-gray-700 mb-2">
              {language === 'es' ? 'Proveedor' : 'Provider'} <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedProvider}
              onChange={(e) => {
                const value = e.target.value;
                console.log('Proveedor seleccionado:', value);
                setSelectedProvider(value);
              }}
              className="w-full px-4 py-2 bg-gray-700 light-mode:bg-gray-100 border border-gray-600 light-mode:border-gray-300 rounded-lg text-white light-mode:text-gray-900 focus:border-blue-500 focus:outline-none"
            >
              <option value="">{language === 'es' ? 'Seleccionar...' : 'Select...'}</option>
              {providers.map(prov => (
                <option key={prov.id} value={prov.nombre}>{prov.nombre}</option>
              ))}
            </select>
          </div>

          {/* Responsable */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 light-mode:text-gray-700 mb-2">
              {language === 'es' ? 'Responsable' : 'Responsible'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={selectedResponsible}
              onChange={(e) => {
                const value = e.target.value;
                console.log('Responsable ingresado:', value);
                setSelectedResponsible(value);
              }}
              placeholder={language === 'es' ? 'Nombre del responsable' : 'Responsible name'}
              className="w-full px-4 py-2 bg-gray-700 light-mode:bg-gray-100 border border-gray-600 light-mode:border-gray-300 rounded-lg text-white light-mode:text-gray-900 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Tabla de Conteo */}
      {filteredProducts.length > 0 ? (
        <div className="bg-gray-800 light-mode:bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header con estadísticas */}
          <div className="bg-gray-750 light-mode:bg-gray-100 p-4 border-b border-gray-700 light-mode:border-gray-300">
            <div className="flex flex-wrap gap-4 justify-between items-center">
              <div className="flex gap-6">
                <div>
                  <span className="text-gray-400 light-mode:text-gray-600 text-sm">
                    {language === 'es' ? 'Productos:' : 'Products:'}
                  </span>
                  <span className="text-white light-mode:text-gray-900 font-bold ml-2">
                    {inventoryData.length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 light-mode:text-gray-600 text-sm">
                    {language === 'es' ? 'Con Consumo:' : 'With Consumption:'}
                  </span>
                  <span className={`font-bold ml-2 ${productosConsumo > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {productosConsumo}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 light-mode:text-gray-600 text-sm">
                    {language === 'es' ? 'Consumo Total:' : 'Total Consumption:'}
                  </span>
                  <span className={`font-bold ml-2 ${totalConsumo > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {totalConsumo} {language === 'es' ? 'unidades' : 'units'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* PANEL DE RESUMEN DINÁMICO - Feedback inmediato al usuario */}
          <div className="bg-gradient-to-r from-blue-900 to-blue-800 light-mode:from-blue-100 light-mode:to-blue-50 p-4 border-t border-blue-700 light-mode:border-blue-200">
            <div className="flex flex-wrap gap-6 items-center justify-between">
              <div className="flex gap-8">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-blue-600 light-mode:bg-blue-500 rounded-full flex items-center justify-center">
                    <FileCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-300 light-mode:text-blue-600 font-medium">Productos Procesados</p>
                    <p className="text-2xl font-bold text-white light-mode:text-blue-900">{productosConsumo}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-red-600 light-mode:bg-red-500 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-300 light-mode:text-blue-600 font-medium">Unidades Totales Salientes</p>
                    <p className="text-2xl font-bold text-white light-mode:text-red-900">{totalConsumo}</p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleCloseInventory}
                disabled={!canClose || isProcessing}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all shadow-xl ${
                  canClose && !isProcessing
                    ? 'bg-green-600 hover:bg-green-700 text-white hover:shadow-2xl transform hover:scale-105'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                <FileCheck className="w-5 h-5" />
                {isProcessing 
                  ? 'Procesando...' 
                  : 'Finalizar y Generar Reporte'
                }
              </button>
            </div>
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-750 light-mode:bg-gray-200 border-b border-gray-700 light-mode:border-gray-300">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 light-mode:text-gray-700">
                    {language === 'es' ? 'Producto' : 'Product'}
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300 light-mode:text-gray-700">
                    {language === 'es' ? 'Unidad' : 'Unit'}
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300 light-mode:text-gray-700">
                    {language === 'es' ? 'Stock Teórico' : 'Theoretical Stock'}
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300 light-mode:text-gray-700">
                    {language === 'es' ? 'Stock Físico' : 'Physical Stock'}
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300 light-mode:text-gray-700">
                    {language === 'es' ? 'Consumo' : 'Consumption'}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 light-mode:text-gray-700">
                    {language === 'es' ? 'Observaciones' : 'Notes'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {inventoryData.map((item, idx) => (
                  <tr 
                    key={item.id}
                    className={`border-b border-gray-700 light-mode:border-gray-200 ${
                      idx % 2 === 0 ? 'bg-gray-800 light-mode:bg-white' : 'bg-gray-750 light-mode:bg-gray-50'
                    }`}
                  >
                    <td className="px-4 py-3 text-white light-mode:text-gray-900">
                      {item.nombre}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-300 light-mode:text-gray-700">
                      {item.unidad}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        value={item.stockTeorico}
                        disabled
                        className="w-24 px-3 py-2 bg-gray-700 light-mode:bg-gray-200 border border-gray-600 light-mode:border-gray-300 rounded text-center text-gray-400 light-mode:text-gray-600 cursor-not-allowed"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        value={item.stockFisico}
                        onChange={(e) => handleStockFisicoChange(item.id, e.target.value)}
                        placeholder="0"
                        className="w-24 px-3 py-2 bg-gray-700 light-mode:bg-gray-100 border border-gray-600 light-mode:border-gray-300 rounded text-center text-white light-mode:text-gray-900 focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${
                        item.diferencia > 0 
                          ? 'text-red-400 light-mode:text-red-600' 
                          : item.diferencia < 0 
                            ? 'text-green-400 light-mode:text-green-600' 
                            : 'text-gray-400 light-mode:text-gray-600'
                      }`}>
                        {item.diferencia > 0 ? item.diferencia : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={item.observaciones}
                        onChange={(e) => handleObservacionesChange(item.id, e.target.value)}
                        placeholder={language === 'es' ? 'Ej: Merma, daños...' : 'E.g.: Loss, damage...'}
                        className="w-full px-3 py-2 bg-gray-700 light-mode:bg-gray-100 border border-gray-600 light-mode:border-gray-300 rounded text-sm text-white light-mode:text-gray-900 focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-gray-800 light-mode:bg-white rounded-lg p-12 text-center">
          <FileCheck className="w-16 h-16 text-gray-600 light-mode:text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400 light-mode:text-gray-600 text-lg">
            {language === 'es'
              ? 'Selecciona un proveedor para iniciar el conteo'
              : 'Select a provider to start counting'}
          </p>
        </div>
      )}
    </div>
  );
}
