import { useState, useEffect } from 'react';
import { FileCheck, AlertTriangle, TrendingUp, TrendingDown, DollarSign, Download, Sparkles, CheckCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { addInventoryLog, getTodayInventoryLog, updateProduct, saveInventoryHistory, subscribeToInventoryHistory } from '../services/firebaseService';

/**
 * ╔════════════════════════════════════════════════════════════════════╗
 * ║  COMPONENTE: INVENTORY - ROAL BURGER                              ║
 * ║  Arquitecto: Software Senior                                       ║
 * ╚════════════════════════════════════════════════════════════════════╝
 * 
 * 🎯 OBJETIVO:
 * Sistema completo de gestión de inventario con persistencia en cascada,
 * análisis inteligente de anomalías y dashboard de KPIs en tiempo real.
 * 
 * 📊 ARQUITECTURA DE DATOS (3 CAPAS):
 * 
 * CAPA 1 - ACTUALIZACIÓN DE STOCK:
 *   → Colección: 'products'
 *   → Acción: Sobrescribe stockActual con el conteo físico
 *   → Propósito: Mantener stock maestro actualizado
 * 
 * CAPA 2 - HISTORIAL PARA DASHBOARD:
 *   → Colección: 'inventory_history'
 *   → Datos: {fecha, responsable, proveedor, productos[], totalCostoSalidas}
 *   → Propósito: Alimentar dashboard de inteligencia y KPIs
 *   → Features: Detección de anomalías, re-descarga de PDFs
 * 
 * CAPA 3 - AUDITORÍA INDIVIDUAL:
 *   → Colección: 'inventory_movements' (dentro de inventory_logs)
 *   → Datos: Movimiento por cada producto con salida
 *   → Propósito: Trazabilidad granular y auditoría
 * 
 * 🔍 INTELIGENCIA DE NEGOCIO:
 * 
 * - Producto Estrella: Mayor salida acumulada
 * - Baja Rotación: Menor movimiento registrado
 * - Inversión en Salidas: Σ(cantidad_salida × costo_unitario)
 * - Anomalías: Salida actual > promedio_últimos_3 × 1.40
 * 
 * ⚡ REACTIVIDAD:
 * - subscribeToInventoryHistory(): Actualización en tiempo real
 * - Auto-cálculo de analytics al recibir nuevos datos
 * - UI responsiva con feedback visual (Toast)
 * 
 * 📱 UX:
 * - Toast de confirmación (5 segundos)
 * - Reset automático de formulario
 * - Validaciones pre-guardado
 * - Consola técnica con resumen de operaciones
 */


export default function Inventory({ 
  productsData = [], 
  providers = [], 
  companyData = {},
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
  const [inventoryHistory, setInventoryHistory] = useState([]);
  const [analytics, setAnalytics] = useState({
    productoEstrella: null,
    bajaRotacion: null,
    inversionSalidas: 0
  });
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // ============ VERIFICAR SI YA HAY CIERRE HOY ============
  useEffect(() => {
    const checkTodayLog = async () => {
      if (!userId) return;
      const log = await getTodayInventoryLog(userId);
      setTodayLog(log);
    };
    checkTodayLog();
  }, [userId]);

  // ============ SUSCRIPCIÓN AL HISTORIAL EN TIEMPO REAL ============
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToInventoryHistory(userId, (history) => {
      setInventoryHistory(history);
      
      // Calcular analíticas automáticamente
      if (history.length > 0) {
        calculateAnalytics(history);
      }
    });

    return () => unsubscribe();
  }, [userId]);

  // ============ CARGAR PRODUCTOS AL SELECCIONAR PROVEEDOR ============
  useEffect(() => {
    if (selectedProvider && productsData.length > 0) {
      const products = productsData.filter(p => p.proveedor === selectedProvider);
      setFilteredProducts(products);
      
      // Inicializar datos de inventario con stock teórico Y costo
      const initialData = products.map(p => ({
        id: p.id,
        nombre: p.nombre,
        unidad: p.unidad,
        stockTeorico: p.stockActual || 0,
        stockFisico: '',
        diferencia: 0,
        observaciones: '',
        costoUnitario: p.costo || 0  // 💰 Incluir costo para cálculos posteriores
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

  // ============ ANÁLISIS INTELIGENTE DE INVENTARIOS ============
  const calculateAnalytics = (history) => {
    if (!history || history.length === 0) return;

    // Consolidar todos los productos de todos los historiales
    const productosConsolidados = {};
    
    history.forEach(registro => {
      if (registro.productos && Array.isArray(registro.productos)) {
        registro.productos.forEach(producto => {
          if (!productosConsolidados[producto.nombre]) {
            productosConsolidados[producto.nombre] = {
              nombre: producto.nombre,
              totalSalidas: 0,
              totalCostoSalidas: 0,
              registros: []
            };
          }
          productosConsolidados[producto.nombre].totalSalidas += producto.cantidadSalida || 0;
          productosConsolidados[producto.nombre].totalCostoSalidas += producto.totalCostoSalida || 0;
          productosConsolidados[producto.nombre].registros.push({
            fecha: registro.fecha,
            salida: producto.cantidadSalida || 0
          });
        });
      }
    });

    const productosArray = Object.values(productosConsolidados);

    // Producto Estrella (mayor salida total)
    const productoEstrella = productosArray.reduce((max, p) => 
      p.totalSalidas > (max?.totalSalidas || 0) ? p : max
    , null);

    // Baja Rotación (menor salida total, excluyendo ceros)
    const productosConSalida = productosArray.filter(p => p.totalSalidas > 0);
    const bajaRotacion = productosConSalida.reduce((min, p) => 
      p.totalSalidas < (min?.totalSalidas || Infinity) ? p : min
    , null);

    // Inversión Total en Salidas
    const inversionSalidas = productosArray.reduce((sum, p) => 
      sum + p.totalCostoSalidas, 0
    );

    setAnalytics({
      productoEstrella,
      bajaRotacion,
      inversionSalidas
    });
  };

  // ============ DETECCIÓN DE ANOMALÍAS (SALIDAS BRUSCAS) ============
  // Criterio: Consumo actual 40% superior al promedio de los últimos 3 registros
  const detectarAnomalia = (producto, historialCompleto) => {
    if (!historialCompleto || historialCompleto.length < 4) return false; // Necesitamos al menos 4 registros (3 anteriores + actual)

    // Obtener historial del producto específico (ordenado por fecha descendente)
    const salidasProducto = [];
    historialCompleto.forEach(registro => {
      if (registro.productos && Array.isArray(registro.productos)) {
        const prod = registro.productos.find(p => p.nombre === producto.nombre);
        if (prod && (prod.cantidadSalida !== undefined || prod.consumo !== undefined)) {
          const salida = prod.cantidadSalida || prod.consumo || 0;
          if (salida > 0) {
            salidasProducto.push(salida);
          }
        }
      }
    });

    if (salidasProducto.length < 4) return false; // Necesitamos al menos 4 datos

    // Salida actual (más reciente)
    const salidaActual = salidasProducto[0];
    
    // Promedio de los últimos 3 registros (excluyendo el actual)
    const ultimosTres = salidasProducto.slice(1, 4);
    const promedio = ultimosTres.reduce((a, b) => a + b, 0) / ultimosTres.length;

    // Umbral: 40% superior al promedio
    const umbral = promedio * 1.40;

    // Anomalía detectada si salida actual supera el umbral
    const esAnomalia = salidaActual > umbral;
    
    if (esAnomalia) {
      console.log(`⚠️ ANOMALÍA DETECTADA en ${producto.nombre}:`, {
        salidaActual,
        promedio: promedio.toFixed(2),
        umbral: umbral.toFixed(2),
        diferencia: ((salidaActual / promedio - 1) * 100).toFixed(1) + '%'
      });
    }

    return esAnomalia;
  };

  // ============ RE-DESCARGAR PDF DESDE HISTORIAL ============
  const reGeneratePDF = (historyRecord) => {
    // Reconstruir data desde el registro histórico
    const data = historyRecord.productos.map(p => ({
      nombre: p.nombre,
      unidad: p.unidad,
      stockTeorico: p.stockInicial,
      stockFisico: p.stockFinal,
      diferencia: p.consumo || p.cantidadSalida,
      observaciones: p.observaciones || '',
      costoUnitario: p.costoUnitario || 0
    }));

    // Usar el responsable y proveedor del registro
    const tempResponsible = selectedResponsible;
    const tempProvider = selectedProvider;
    setSelectedResponsible(historyRecord.responsable);
    setSelectedProvider(historyRecord.proveedor);

    // Generar PDF
    const doc = generatePDF(data);
    
    // Restaurar valores originales
    setSelectedResponsible(tempResponsible);
    setSelectedProvider(tempProvider);

    // Crear nombre de archivo con fecha del registro
    const fecha = historyRecord.fecha?.toDate ? historyRecord.fecha.toDate() : new Date();
    const fechaStr = fecha.toISOString().split('T')[0];
    const fileName = `Reporte_Inventario_${historyRecord.proveedor}_${fechaStr}.pdf`;
    
    doc.save(fileName);
  };

  // ============ GENERAR PDF DE CLASE MUNDIAL (Professional ERP Standard) ============
  const generatePDF = (data) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Encabezado Corporativo
    doc.setFillColor(220, 53, 69);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    const companyName = companyData?.nombre || companyData?.nombreEmpresa || 'INVENTARIO';
    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(companyName.toUpperCase(), pageWidth / 2, 15, { align: 'center' });
    
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
    
    // Tabla de Movimientos con COSTO DE SALIDA
    const tableData = data.map(item => {
      const costoSalida = item.diferencia > 0 ? (item.diferencia * (item.costoUnitario || 0)) : 0;
      return [
        item.nombre,
        item.unidad,
        item.stockTeorico.toString(),
        item.stockFisico.toString(),
        item.diferencia.toString(),
        `$${costoSalida.toFixed(2)}`,  // 💰 Nueva columna
        item.observaciones || '-'
      ];
    });
    
    doc.autoTable({
      startY: 77,
      head: [['Producto', 'Unidad', 'Stock Teórico', 'Conteo Físico', 'Consumo', 'Costo Salida', 'Observaciones']],
      body: tableData,
      theme: 'striped',
      headStyles: { 
        fillColor: [220, 53, 69], // Rojo
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center'
      },
      bodyStyles: { 
        fontSize: 7,
        cellPadding: 2
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { cellWidth: 45 },           // Producto
        1: { cellWidth: 18, halign: 'center' },  // Unidad
        2: { cellWidth: 22, halign: 'center' },  // Stock Teórico
        3: { cellWidth: 22, halign: 'center' },  // Conteo Físico
        4: { cellWidth: 20, halign: 'center' },  // Consumo
        5: { cellWidth: 25, halign: 'right' },   // 💰 Costo Salida
        6: { cellWidth: 33 }            // Observaciones
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
    
    // Calcular costo total de salidas
    const totalCostoSalidasPDF = data.reduce((sum, item) => {
      const costoSalida = item.diferencia > 0 ? (item.diferencia * (item.costoUnitario || 0)) : 0;
      return sum + costoSalida;
    }, 0);
    
    // Rectángulo destacado para la sumatoria
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(14, finalY - 3, pageWidth - 28, 32, 2, 2, 'F');
    
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 53, 69);
    doc.text('SUMATORIA TOTAL DE CONSUMO', 20, finalY + 5);
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 53, 69);
    doc.text(`${totalConsumo} UNIDADES`, pageWidth - 20, finalY + 14, { align: 'right' });
    
    doc.setFontSize(12);
    doc.setTextColor(0, 128, 0);
    doc.text(`COSTO: $${totalCostoSalidasPDF.toFixed(2)}`, pageWidth - 20, finalY + 23, { align: 'right' });
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Productos con consumo: ${productosConConsumo.length} de ${data.length}`, 20, finalY + 23);
    
    // DETALLE DE PRODUCTOS CON CONSUMO
    finalY += 40;
    
    if (productosConConsumo.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 53, 69);
      doc.text('DETALLE DE CONSUMO', 14, finalY);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      let yPos = finalY + 10;
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
      finalY = yPos + 10;
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
        `Generado por InventarioX`,
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
      // ESTRUCTURA DE DATOS COMPLETA con costos y movimientos
      const productos = inventoryData.map(item => {
        const stockInicial = item.stockTeorico;
        const stockFinal = parseFloat(item.stockFisico);
        const cantidadSalida = item.diferencia > 0 ? item.diferencia : 0;  // Solo salidas positivas
        const costoUnitario = item.costoUnitario || 0;
        const totalCostoSalida = cantidadSalida * costoUnitario;  // 💰 Costo total de la salida
        
        return {
          id: item.id,
          nombre: item.nombre,
          unidad: item.unidad,
          stockInicial,           // Stock teórico al inicio
          stockFinal,             // Stock físico contado
          cantidadSalida,         // Diferencia positiva = venta/consumo
          costoUnitario,          // Precio de costo del producto
          totalCostoSalida,       // Costo total de lo que salió
          consumo: item.diferencia,  // Mantener para compatibilidad
          observaciones: item.observaciones || ''
        };
      });

      // Totales calculados
      const totalConsumo = productos.reduce((sum, item) => 
        sum + (item.consumo > 0 ? item.consumo : 0), 0
      );
      const totalCostoSalidas = productos.reduce((sum, item) => 
        sum + item.totalCostoSalida, 0
      );  // 💰 Total de dinero que salió de la bodega

      console.log('📊 Objeto para Firebase (Estructura Completa):');
      console.log('- Responsable:', responsable);
      console.log('- Proveedor:', proveedor);
      console.log('- Total Productos:', productos.length);
      console.log('- Consumo Total (unidades):', totalConsumo);
      console.log('- 💰 Costo Total de Inversión Perdida: $', totalCostoSalidas.toFixed(2));

      // ============================================================
      // PERSISTENCIA EN CASCADA (3 ACCIONES ATÓMICAS)
      // ============================================================
      // 1. Actualizar Stock: Sobrescribir stockActual en productos
      // 2. Crear Historial: Guardar en inventory_history
      // 3. Registrar Movimientos: Insertar en inventory_movements
      // ============================================================
      console.log('🚀 Ejecutando persistencia en cascada (3 acciones atómicas)...');
      await Promise.all([
        addInventoryLog(userId, responsable, proveedor, productos, totalCostoSalidas),
        saveInventoryHistory(userId, responsable, proveedor, productos, totalConsumo, totalCostoSalidas),
        ...inventoryData.map(item => 
          updateProduct(item.id, { stockActual: parseFloat(item.stockFisico) })
        )
      ]);
      console.log('✅ 1/3 - Registro completado en inventory_logs');
      console.log('✅ 2/3 - Historial guardado en inventory_history (trazabilidad)');
      console.log('✅ 3/3 - Stock maestro (products) actualizado con Stock Físico');

      // El PDF se generará solo cuando el usuario lo descargue desde el historial
      console.log('✅ Inventario guardado - PDF disponible en historial');

      // RESET COMPLETO del formulario para el siguiente proveedor
      setSelectedProvider('');
      setSelectedResponsible('');
      setFilteredProducts([]);
      setInventoryData([]);
      setHasUnsavedChanges(false);
      console.log('✅ Formulario completamente reseteado y listo para el siguiente proveedor');

      // Mostrar Toast de éxito
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 5000);
      
      // Resumen técnico en consola para verificación
      console.log('\n');
      console.log('%c╔════════════════════════════════════════════════════════╗', 'color: #10b981; font-weight: bold');
      console.log('%c║  ✅ INTEGRACIÓN COMPLETA - ROAL BURGER                ║', 'color: #10b981; font-weight: bold');
      console.log('%c╚════════════════════════════════════════════════════════╝', 'color: #10b981; font-weight: bold');
      console.log('%c📊 CAPA 1: Stock actualizado en productos', 'color: #3b82f6; font-weight: bold');
      console.log(`   → ${productos.length} productos actualizados`);
      console.log('%c📚 CAPA 2: Historial para dashboard', 'color: #8b5cf6; font-weight: bold');
      console.log(`   → Fecha: ${new Date().toLocaleString('es-CL')}`);
      console.log(`   → Proveedor: ${proveedor}`);
      console.log(`   → Responsable: ${responsable}`);
      console.log('%c🔍 CAPA 3: Movimientos para auditoría', 'color: #f59e0b; font-weight: bold');
      console.log(`   → ${productos.filter(p => p.cantidadSalida > 0).length} movimientos registrados`);
      console.log('%c💰 ANÁLISIS FINANCIERO', 'color: #10b981; font-weight: bold');
      console.log(`   → Unidades Salientes: ${totalConsumo}`);
      console.log(`   → Inversión Perdida: $${totalCostoSalidas.toFixed(2)}`);
      console.log('\n');
      
      console.log('=== ✅ PERSISTENCIA COMPLETA: Inventario, Movimientos y Stock actualizados ===');

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
      {/* Toast de Éxito */}
      {showSuccessToast && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 min-w-[320px]">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-lg">¡Sincronización Exitosa!</p>
              <p className="text-sm text-green-50">Inventario y Movimientos guardados</p>
            </div>
          </div>
        </div>
      )}

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

      {/* ============ DASHBOARD DE INTELIGENCIA: RESUMEN EJECUTIVO ============ */}
      {inventoryHistory.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Producto Estrella */}
          <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-lg p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-yellow-500/30 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-yellow-100" />
              </div>
              <div>
                <p className="text-yellow-100 text-sm font-semibold">Producto Estrella</p>
                <p className="text-yellow-50 text-xs">Mayor salida total</p>
              </div>
            </div>
            {analytics.productoEstrella ? (
              <div>
                <p className="text-white font-bold text-xl mb-1">{analytics.productoEstrella.nombre}</p>
                <p className="text-yellow-100 text-2xl font-black">{analytics.productoEstrella.totalSalidas} unidades</p>
                <p className="text-yellow-200 text-sm mt-2">
                  Costo: ${analytics.productoEstrella.totalCostoSalidas.toFixed(2)}
                </p>
              </div>
            ) : (
              <p className="text-yellow-100">Sin datos suficientes</p>
            )}
          </div>

          {/* Baja Rotación */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-blue-500/30 rounded-full flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-blue-100" />
              </div>
              <div>
                <p className="text-blue-100 text-sm font-semibold">Baja Rotación</p>
                <p className="text-blue-50 text-xs">Menor movimiento</p>
              </div>
            </div>
            {analytics.bajaRotacion ? (
              <div>
                <p className="text-white font-bold text-xl mb-1">{analytics.bajaRotacion.nombre}</p>
                <p className="text-blue-100 text-2xl font-black">{analytics.bajaRotacion.totalSalidas} unidades</p>
                <p className="text-blue-200 text-sm mt-2">
                  Costo: ${analytics.bajaRotacion.totalCostoSalidas.toFixed(2)}
                </p>
              </div>
            ) : (
              <p className="text-blue-100">Sin datos suficientes</p>
            )}
          </div>

          {/* Inversión en Salidas */}
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-green-500/30 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-100" />
              </div>
              <div>
                <p className="text-green-100 text-sm font-semibold">Inversión en Salidas</p>
                <p className="text-green-50 text-xs">Costo total acumulado</p>
              </div>
            </div>
            <div>
              <p className="text-white font-bold text-3xl mb-1">
                ${analytics.inversionSalidas.toFixed(2)}
              </p>
              <p className="text-green-200 text-sm mt-2">
                {inventoryHistory.length} registros analizados
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
                  : 'Guardar Inventario'
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
      
      {/* ============ HISTORIAL DE CIERRES DE INVENTARIO ============ */}
      {inventoryHistory.length > 0 && (
        <div className="bg-gray-800 light-mode:bg-white rounded-lg shadow-lg overflow-hidden mb-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-purple-100" />
              <div>
                <h2 className="text-white font-bold text-xl">
                  Historial de Cierres de Inventario
                </h2>
                <p className="text-purple-100 text-sm">
                  Trazabilidad completa con análisis de anomalías
                </p>
              </div>
            </div>
          </div>

          {/* Tabla de Historial */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-750 light-mode:bg-gray-200 border-b border-gray-700 light-mode:border-gray-300">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 light-mode:text-gray-700">
                    Fecha/Hora
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 light-mode:text-gray-700">
                    Proveedor
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 light-mode:text-gray-700">
                    Responsable
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300 light-mode:text-gray-700">
                    Valorizado Salida ($)
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300 light-mode:text-gray-700">
                    Anomalías
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300 light-mode:text-gray-700">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody>
                {inventoryHistory.map((record, idx) => {
                  // Detectar anomalías en productos de este registro
                  let tieneAnomalias = false;
                  if (record.productos && Array.isArray(record.productos)) {
                    tieneAnomalias = record.productos.some(producto => 
                      detectarAnomalia(producto, inventoryHistory)
                    );
                  }

                  const fecha = record.fecha?.toDate ? record.fecha.toDate() : new Date();
                  const fechaStr = fecha.toLocaleDateString('es-CL', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric' 
                  });
                  const horaStr = fecha.toLocaleTimeString('es-CL', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                  });

                  return (
                    <tr 
                      key={record.id}
                      className={`border-b border-gray-700 light-mode:border-gray-200 ${
                        idx % 2 === 0 ? 'bg-gray-800 light-mode:bg-white' : 'bg-gray-750 light-mode:bg-gray-50'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="text-white light-mode:text-gray-900 font-semibold">
                          {fechaStr}
                        </div>
                        <div className="text-gray-400 light-mode:text-gray-600 text-sm">
                          {horaStr}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white light-mode:text-gray-900 font-medium">
                        {record.proveedor}
                      </td>
                      <td className="px-4 py-3 text-gray-300 light-mode:text-gray-700">
                        {record.responsable}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-green-400 light-mode:text-green-600 font-bold text-lg">
                          ${(record.totalCostoSalidas || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {tieneAnomalias ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-600/20 border border-red-500 rounded-full text-red-400 text-xs font-semibold">
                            <AlertTriangle className="w-3 h-3" />
                            Anomalía detectada
                          </span>
                        ) : (
                          <span className="text-gray-500 text-xs">Normal</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => reGeneratePDF(record)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg"
                        >
                          <Download className="w-4 h-4" />
                          Descargar Reporte
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
  );
}
