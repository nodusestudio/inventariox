import { useState, useEffect } from 'react';
import { FileCheck, Printer, Save, AlertTriangle } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { addInventoryLog, getTodayInventoryLog, updateProduct } from '../services/firebaseService';
import ConfirmationModal from '../components/ConfirmationModal';


export default function Inventory({ 
  productsData = [], 
  providers = [], 
  language = 'es',
  userId 
}) {
  // ============ ESTADO PRINCIPAL ============
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedResponsible, setSelectedResponsible] = useState('');
  const [selectedSede, setSelectedSede] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [inventoryData, setInventoryData] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [todayLog, setTodayLog] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

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

  // ============ CALCULAR DIFERENCIA AUTOMÁTICAMENTE ============
  const handleStockFisicoChange = (productId, value) => {
    const numValue = value === '' ? '' : parseFloat(value) || 0;
    
    setInventoryData(prev => prev.map(item => {
      if (item.id === productId) {
        const teorico = item.stockTeorico;
        const fisico = numValue === '' ? 0 : numValue;
        const diff = fisico - teorico;
        
        return {
          ...item,
          stockFisico: value,
          diferencia: diff
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

  // ============ GENERAR PDF CON JSPDF ============
  const generatePDF = (data) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Logo y Encabezado de Empresa
    doc.setFillColor(220, 53, 69); // Rojo corporativo
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('ROAL BURGER', pageWidth / 2, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('REPORTE DE MOVIMIENTO DIARIO', pageWidth / 2, 25, { align: 'center' });
    
    // Información general
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    const now = new Date();
    const fecha = now.toLocaleDateString('es-CL');
    const hora = now.toLocaleTimeString('es-CL');
    
    doc.text(`Fecha: ${fecha} ${hora}`, 14, 45);
    doc.text(`Proveedor: ${selectedProvider}`, 14, 52);
    doc.text(`Responsable: ${selectedResponsible}`, 14, 59);
    doc.text(`Sede: ${selectedSede}`, 14, 66);
    
    // Estadísticas a la derecha
    const totalSalidas = data.reduce((sum, item) => {
      return sum + (item.diferencia < 0 ? Math.abs(item.diferencia) : 0);
    }, 0);
    const productosSalidas = data.filter(item => item.diferencia < 0).length;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Total Productos: ${data.length}`, pageWidth - 14, 52, { align: 'right' });
    doc.text(`Productos con Salidas: ${productosSalidas}`, pageWidth - 14, 59, { align: 'right' });
    doc.setTextColor(totalSalidas > 0 ? [220, 53, 69] : [34, 139, 34]);
    doc.text(`Total Unidades Salientes: ${totalSalidas}`, pageWidth - 14, 66, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    
    // Separador
    doc.setDrawColor(220, 53, 69);
    doc.setLineWidth(0.5);
    doc.line(14, 70, pageWidth - 14, 70);
    
    // Tabla de productos
    const tableData = data.map(item => [
      item.nombre,
      item.unidad,
      item.stockTeorico.toString(),
      item.stockFisico.toString(),
      item.diferencia.toString(),
      item.observaciones || '-'
    ]);
    
    doc.autoTable({
      startY: 75,
      head: [['Producto', 'Unidad', 'Stock Teórico', 'Stock Físico', 'Salidas/Ventas', 'Observaciones']],
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
        // Resaltar diferencias (Salidas en rojo, Entradas en verde)
        if (data.section === 'body' && data.column.index === 4) {
          const diff = parseFloat(data.cell.text[0]);
          if (diff !== 0) {
            data.cell.styles.textColor = diff > 0 ? [34, 139, 34] : [220, 53, 69];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });
    
    // Resumen de salidas/ventas
    const finalY = doc.lastAutoTable.finalY + 10;
    const salidas = data.filter(item => item.diferencia < 0);
    const totalUnidadesSalientes = salidas.reduce((sum, item) => sum + Math.abs(item.diferencia), 0);
    
    if (salidas.length > 0) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(`TOTAL UNIDADES SALIENTES (VENTAS/MERMAS): ${totalUnidadesSalientes}`, 14, finalY);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 53, 69);
      doc.text(`📊 DETALLE DE PRODUCTOS CON SALIDAS`, 14, finalY + 10);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      let yPos = finalY + 18;
      salidas.forEach((item, idx) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(`• ${item.nombre}: ${Math.abs(item.diferencia)} ${item.unidad}`, 14, yPos);
        if (item.observaciones) {
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          doc.text(`  Obs: ${item.observaciones}`, 14, yPos + 4);
          doc.setFontSize(9);
          doc.setTextColor(0, 0, 0);
          yPos += 4;
        }
        yPos += 6;
      });
    } else {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(34, 139, 34);
      doc.text('TOTAL UNIDADES SALIENTES (VENTAS/MERMAS): 0', 14, finalY);
      doc.text('✓ SIN SALIDAS - STOCK COMPLETO', 14, finalY + 8);
    }
    
    // Sección de firmas
    const firmasY = Math.min(finalY + (salidas.length > 0 ? salidas.length * 6 + 30 : 20), 250);
    
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

  // ============ CERRAR INVENTARIO Y GUARDAR ============
  const handleCloseInventory = async () => {
    if (!selectedProvider || !selectedResponsible || !selectedSede) {
      alert(language === 'es' 
        ? 'Debes seleccionar Proveedor, Responsable y Sede' 
        : 'You must select Provider, Responsible and Location');
      return;
    }

    // Validar que todos los productos tengan stock físico ingresado
    const incomplete = inventoryData.some(item => item.stockFisico === '');
    if (incomplete) {
      alert(language === 'es'
        ? 'Debes ingresar el stock físico de todos los productos'
        : 'You must enter the physical stock for all products');
      return;
    }

    // Generar PDF y mostrar vista previa
    const doc = generatePDF(inventoryData);
    setPreviewDoc(doc);
    setShowPreview(true);
    setShowConfirmClose(false);
  };

  // ============ CONFIRMAR Y GUARDAR DESPUÉS DE VISTA PREVIA ============
  const handleConfirmAndSave = async () => {
    setIsProcessing(true);
    
    try {
      // Validación de campos críticos
      if (!selectedResponsible || selectedResponsible.trim() === '') {
        throw new Error('CAMPO_RESPONSABLE');
      }
      
      if (!selectedSede || selectedSede.trim() === '') {
        throw new Error('CAMPO_SEDE');
      }
      
      if (!selectedProvider || selectedProvider.trim() === '') {
        throw new Error('CAMPO_PROVEEDOR');
      }

      // Preparar datos para Firebase
      const logData = {
        proveedor: selectedProvider,
        responsable: selectedResponsible,
        sede: selectedSede,
        productos: inventoryData.map(item => ({
          id: item.id,
          nombre: item.nombre,
          unidad: item.unidad,
          stockTeorico: item.stockTeorico,
          stockFisico: parseFloat(item.stockFisico),
          diferencia: item.diferencia,
          observaciones: item.observaciones || ''
        })),
        salidas: inventoryData.filter(item => item.diferencia < 0).length,
        totalUnidadesSalientes: inventoryData.reduce((sum, item) => 
          sum + (item.diferencia < 0 ? Math.abs(item.diferencia) : 0), 0
        ),
        totalProductos: inventoryData.length
      };

      // PASO 1: Guardar en Firebase primero
      try {
        await addInventoryLog(userId, logData);
      } catch (firebaseError) {
        console.error('Error Firebase:', firebaseError);
        throw new Error('CONEXION_FIREBASE');
      }

      // PASO 2: Actualizar stock maestro de productos
      try {
        const updatePromises = inventoryData.map(item => {
          return updateProduct(item.id, {
            stockActual: parseFloat(item.stockFisico)
          });
        });
        await Promise.all(updatePromises);
      } catch (updateError) {
        console.error('Error actualizando stock:', updateError);
        // Continuar aunque falle la actualización del stock
        alert(language === 'es'
          ? '⚠️ Registro guardado pero hubo un error al actualizar el stock maestro'
          : '⚠️ Record saved but there was an error updating master stock');
      }

      // PASO 3: Solo después de guardar exitosamente, descargar el PDF
      if (previewDoc) {
        const fileName = `Inventario_ROAL_BURGER_${selectedProvider}_${new Date().toISOString().split('T')[0]}.pdf`;
        previewDoc.save(fileName);
      }

      // Limpiar formulario
      setSelectedProvider('');
      setSelectedResponsible('');
      setSelectedSede('');
      setFilteredProducts([]);
      setInventoryData([]);
      setHasUnsavedChanges(false);
      setShowPreview(false);
      setPreviewDoc(null);

      alert(language === 'es'
        ? '✓ Inventario cerrado correctamente.\n✓ Stock actualizado.\n✓ PDF descargado.'
        : '✓ Inventory closed successfully.\n✓ Stock updated.\n✓ PDF downloaded.');

    } catch (error) {
      console.error('Error al cerrar inventario:', error);
      
      // Mensajes de error específicos
      let errorMsg = '';
      
      if (error.message === 'CAMPO_RESPONSABLE') {
        errorMsg = language === 'es'
          ? '❌ ERROR: El campo RESPONSABLE está vacío o es inválido.\nPor favor, ingresa el nombre del responsable.'
          : '❌ ERROR: The RESPONSIBLE field is empty or invalid.\nPlease enter the responsible name.';
      } else if (error.message === 'CAMPO_SEDE') {
        errorMsg = language === 'es'
          ? '❌ ERROR: El campo SEDE está vacío o es inválido.\nPor favor, ingresa el nombre de la sede.'
          : '❌ ERROR: The LOCATION field is empty or invalid.\nPlease enter the location name.';
      } else if (error.message === 'CAMPO_PROVEEDOR') {
        errorMsg = language === 'es'
          ? '❌ ERROR: El campo PROVEEDOR está vacío o es inválido.\nPor favor, selecciona un proveedor.'
          : '❌ ERROR: The PROVIDER field is empty or invalid.\nPlease select a provider.';
      } else if (error.message === 'CONEXION_FIREBASE') {
        errorMsg = language === 'es'
          ? '❌ ERROR DE CONEXIÓN: No se pudo conectar con la base de datos.\nVerifica tu conexión a internet e inténtalo nuevamente.'
          : '❌ CONNECTION ERROR: Could not connect to database.\nCheck your internet connection and try again.';
      } else {
        errorMsg = language === 'es'
          ? `❌ Error inesperado al guardar el inventario.\nDetalles: ${error.message}\n\nContacta al administrador si el problema persiste.`
          : `❌ Unexpected error saving inventory.\nDetails: ${error.message}\n\nContact administrator if the problem persists.`;
      }
      
      alert(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  // ============ CONTAR SALIDAS ============
  const salidasCount = inventoryData.filter(item => item.diferencia < 0).length;
  const totalUnidadesSalientes = inventoryData.reduce((sum, item) => 
    sum + (item.diferencia < 0 ? Math.abs(item.diferencia) : 0), 0
  );
  const canClose = selectedProvider && selectedResponsible && selectedSede && 
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Proveedor */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 light-mode:text-gray-700 mb-2">
              {language === 'es' ? 'Proveedor' : 'Provider'} <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
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
              onChange={(e) => setSelectedResponsible(e.target.value)}
              placeholder={language === 'es' ? 'Nombre del responsable' : 'Responsible name'}
              className="w-full px-4 py-2 bg-gray-700 light-mode:bg-gray-100 border border-gray-600 light-mode:border-gray-300 rounded-lg text-white light-mode:text-gray-900 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Sede */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 light-mode:text-gray-700 mb-2">
              {language === 'es' ? 'Sede' : 'Location'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={selectedSede}
              onChange={(e) => setSelectedSede(e.target.value)}
              placeholder={language === 'es' ? 'Nombre de la sede' : 'Location name'}
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
                    {language === 'es' ? 'Salidas/Ventas:' : 'Sales/Exits:'}
                  </span>
                  <span className={`font-bold ml-2 ${salidasCount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {salidasCount}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 light-mode:text-gray-600 text-sm">
                    {language === 'es' ? 'Total Unidades Salientes:' : 'Total Exit Units:'}
                  </span>
                  <span className={`font-bold ml-2 ${totalUnidadesSalientes > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {totalUnidadesSalientes}
                  </span>
                </div>
              </div>
              
              <button
                onClick={() => setShowConfirmClose(true)}
                disabled={!canClose || isProcessing}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-all ${
                  canClose && !isProcessing
                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                <FileCheck className="w-5 h-5" />
                {isProcessing 
                  ? (language === 'es' ? 'Procesando...' : 'Processing...') 
                  : (language === 'es' ? 'Finalizar y Generar Reporte' : 'Finalize and Generate Report')
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
                    {language === 'es' ? 'Salidas/Ventas' : 'Sales/Exits'}
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
                          ? 'text-green-400 light-mode:text-green-600' 
                          : item.diferencia < 0 
                            ? 'text-red-400 light-mode:text-red-600' 
                            : 'text-gray-400 light-mode:text-gray-600'
                      }`}>
                        {item.diferencia < 0 ? Math.abs(item.diferencia) : '-'}
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

      {/* Modal de confirmación para generar vista previa */}
      <ConfirmationModal
        isOpen={showConfirmClose}
        title={language === 'es' ? '📋 Generar Vista Previa' : '📋 Generate Preview'}
        message={language === 'es' 
          ? `Se generará una vista previa del reporte con los siguientes datos:\n\n📍 Sede: ${selectedSede}\n👤 Responsable: ${selectedResponsible}\n📦 Proveedor: ${selectedProvider}\n\n📊 Salidas/Ventas: ${salidasCount} productos\n📉 Total Unidades Salientes: ${totalUnidadesSalientes}\n\nPodrás validar la información antes de confirmar el cierre definitivo.` 
          : `A preview of the report will be generated with the following data:\n\n📍 Location: ${selectedSede}\n👤 Responsible: ${selectedResponsible}\n📦 Provider: ${selectedProvider}\n\n📊 Sales/Exits: ${salidasCount} products\n📉 Total Exit Units: ${totalUnidadesSalientes}\n\nYou can validate the information before confirming the final closure.`}
        onConfirm={handleCloseInventory}
        onCancel={() => setShowConfirmClose(false)}
        confirmText={language === 'es' ? '✓ Generar Vista Previa' : '✓ Generate Preview'}
        cancelText={language === 'es' ? 'Cancelar' : 'Cancel'}
        isDangerous={false}
      />

      {/* Modal de Vista Previa del PDF */}
      {showPreview && previewDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 light-mode:bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Header de la vista previa */}
            <div className="bg-red-600 p-6 text-white">
              <h2 className="text-2xl font-bold mb-2">📄 VISTA PREVIA DEL REPORTE</h2>
              <p className="text-sm opacity-90">Valida la información antes de confirmar el cierre definitivo</p>
            </div>

            {/* Información del reporte */}
            <div className="p-6 bg-gray-750 light-mode:bg-gray-100 border-b border-gray-700 light-mode:border-gray-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-gray-400 light-mode:text-gray-600 text-sm">Sede</p>
                  <p className="text-white light-mode:text-gray-900 font-bold text-lg">{selectedSede}</p>
                </div>
                <div>
                  <p className="text-gray-400 light-mode:text-gray-600 text-sm">Responsable</p>
                  <p className="text-white light-mode:text-gray-900 font-bold text-lg">{selectedResponsible}</p>
                </div>
                <div>
                  <p className="text-gray-400 light-mode:text-gray-600 text-sm">Proveedor</p>
                  <p className="text-white light-mode:text-gray-900 font-bold text-lg">{selectedProvider}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-800 light-mode:bg-white p-4 rounded-lg">
                <div className="text-center">
                  <p className="text-gray-400 light-mode:text-gray-600 text-sm">Total Productos</p>
                  <p className="text-blue-400 light-mode:text-blue-600 font-bold text-2xl">{inventoryData.length}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 light-mode:text-gray-600 text-sm">Productos con Salidas</p>
                  <p className="text-red-400 light-mode:text-red-600 font-bold text-2xl">{salidasCount}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 light-mode:text-gray-600 text-sm">Total Unidades Salientes</p>
                  <p className="text-red-400 light-mode:text-red-600 font-bold text-2xl">{totalUnidadesSalientes}</p>
                </div>
              </div>
            </div>

            {/* Mensaje de advertencia */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="text-yellow-200 font-semibold mb-1">
                      {language === 'es' ? '⚠️ Última verificación antes del cierre' : '⚠️ Final verification before closing'}
                    </p>
                    <p className="text-yellow-300 text-sm">
                      {language === 'es' 
                        ? 'Al confirmar, se ejecutarán las siguientes acciones IRREVERSIBLES:'
                        : 'Upon confirmation, the following IRREVERSIBLE actions will be executed:'}
                    </p>
                    <ul className="text-yellow-300 text-sm mt-2 space-y-1 ml-4">
                      <li>✓ {language === 'es' ? 'Registro permanente en base de datos' : 'Permanent database record'}</li>
                      <li>✓ {language === 'es' ? `Actualización del stock de ${inventoryData.length} productos` : `Stock update for ${inventoryData.length} products`}</li>
                      <li>✓ {language === 'es' ? 'Descarga automática del PDF' : 'Automatic PDF download'}</li>
                    </ul>
                  </div>
                </div>
              </div>

              <p className="text-gray-300 light-mode:text-gray-700 text-center text-sm">
                {language === 'es' 
                  ? '¿Los datos de Sede y Responsable son correctos?' 
                  : 'Are the Location and Responsible data correct?'}
              </p>
            </div>

            {/* Botones de acción */}
            <div className="p-6 border-t border-gray-700 light-mode:border-gray-300 flex gap-3 justify-end bg-gray-750 light-mode:bg-gray-100">
              <button
                onClick={() => {
                  setShowPreview(false);
                  setPreviewDoc(null);
                }}
                disabled={isProcessing}
                className="px-6 py-3 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors font-semibold"
              >
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
              <button
                onClick={handleConfirmAndSave}
                disabled={isProcessing}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  isProcessing
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-lg'
                }`}
              >
                {isProcessing 
                  ? (language === 'es' ? '⏳ Procesando...' : '⏳ Processing...') 
                  : (language === 'es' ? '✓ Confirmar y Descargar PDF' : '✓ Confirm and Download PDF')
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
