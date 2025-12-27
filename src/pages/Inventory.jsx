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
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('ROAL BURGER - REPORTE DE INVENTARIO', pageWidth / 2, 20, { align: 'center' });
    
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
    
    // Estadísticas a la derecha
    const totalSalidas = data.reduce((sum, item) => {
      return sum + (item.diferencia < 0 ? Math.abs(item.diferencia) : 0);
    }, 0);
    const productosSalidas = data.filter(item => item.diferencia < 0).length;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Total Productos: ${data.length}`, pageWidth - 14, 52, { align: 'right' });
    doc.text(`Productos con Salidas: ${productosSalidas}`, pageWidth - 14, 59, { align: 'right' });
    
    // Separador
    doc.setDrawColor(220, 53, 69);
    doc.setLineWidth(0.5);
    doc.line(14, 65, pageWidth - 14, 65);
    
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
      startY: 70,
      head: [['Producto', 'Unidad', 'Stock Teórico', 'Stock Físico', 'Salidas (Ventas)', 'Observaciones']],
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
    
    // Resumen de Salidas
    const finalY = doc.lastAutoTable.finalY + 10;
    const salidas = data.filter(item => item.diferencia < 0);
    const totalUnidadesSalientes = salidas.reduce((sum, item) => sum + Math.abs(item.diferencia), 0);
    
    if (salidas.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 53, 69);
      doc.text('RESUMEN DE SALIDAS', 14, finalY);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(`Total Unidades Salientes (Ventas/Consumo): ${totalUnidadesSalientes}`, 14, finalY + 8);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Detalle de productos:', 14, finalY + 16);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      let yPos = finalY + 22;
      salidas.forEach((item, idx) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(`• ${item.nombre}: ${Math.abs(item.diferencia)} ${item.unidad}`, 18, yPos);
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
      doc.text('RESUMEN DE SALIDAS', 14, finalY);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(34, 139, 34);
      doc.text('Total Unidades Salientes (Ventas/Consumo): 0', 14, finalY + 8);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Sin salidas registradas - Stock completo', 14, finalY + 16);
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

  // ============ CERRAR INVENTARIO Y GUARDAR DIRECTAMENTE ============
  const handleCloseInventory = async () => {
    // Validación 1: Campos obligatorios
    if (!selectedProvider || !selectedResponsible) {
      alert('Debes seleccionar Proveedor e ingresar el nombre del Responsable');
      return;
    }

    // Validación 2: Verificar que hay productos cargados
    if (!inventoryData || inventoryData.length === 0) {
      alert('No hay productos cargados para generar el reporte');
      return;
    }

    // Validación 3: Stock físico completo
    const incomplete = inventoryData.some(item => 
      item.stockFisico === '' || item.stockFisico === null || item.stockFisico === undefined
    );
    if (incomplete) {
      alert('Debes ingresar el stock físico de todos los productos');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Preparar datos para Firebase
      const logData = {
        proveedor: selectedProvider,
        responsable: selectedResponsible,
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

      // PASO 1: Guardar en Firebase
      await addInventoryLog(userId, logData);

      // PASO 2: Actualizar stock maestro
      const updatePromises = inventoryData.map(item => {
        return updateProduct(item.id, {
          stockActual: parseFloat(item.stockFisico)
        });
      });
      await Promise.all(updatePromises);

      // PASO 3: Generar y descargar PDF
      const doc = generatePDF(inventoryData);
      const fileName = `Inventario_ROAL_BURGER_${selectedProvider}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      // Limpiar formulario
      setSelectedProvider('');
      setSelectedResponsible('');
      setFilteredProducts([]);
      setInventoryData([]);
      setHasUnsavedChanges(false);

      // Mensaje de éxito simple
      alert('Información guardada con éxito');

    } catch (error) {
      console.error('Error al guardar inventario:', error);
      alert('Error al guardar. Verifica tu conexión e intenta nuevamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ============ CONTAR SALIDAS ============
  const salidasCount = inventoryData.filter(item => item.diferencia < 0).length;
  const totalUnidadesSalientes = inventoryData.reduce((sum, item) => 
    sum + (item.diferencia < 0 ? Math.abs(item.diferencia) : 0), 0
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
                onClick={handleCloseInventory}
                disabled={!canClose || isProcessing}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-all ${
                  canClose && !isProcessing
                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg'
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
                    {language === 'es' ? 'Salidas (Ventas)' : 'Sales (Exits)'}
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
    </div>
  );
}
