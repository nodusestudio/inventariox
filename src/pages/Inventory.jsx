import { useState, useEffect } from 'react';
import { FileCheck, Printer, Save, AlertTriangle } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { addInventoryLog, getTodayInventoryLog } from '../services/firebaseService';
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
        diferencia: 0
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

  // ============ GENERAR PDF CON JSPDF ============
  const generatePDF = (data) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Encabezado
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORME DE INVENTARIO', pageWidth / 2, 20, { align: 'center' });
    
    // Información general
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const now = new Date();
    const fecha = now.toLocaleDateString('es-CL');
    const hora = now.toLocaleTimeString('es-CL');
    
    doc.text(`Fecha: ${fecha} ${hora}`, 14, 35);
    doc.text(`Proveedor: ${selectedProvider}`, 14, 42);
    doc.text(`Responsable: ${selectedResponsible}`, 14, 49);
    doc.text(`Sede: ${selectedSede}`, 14, 56);
    
    // Separador
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 60, pageWidth - 14, 60);
    
    // Tabla de productos
    const tableData = data.map(item => [
      item.nombre,
      item.unidad,
      item.stockTeorico.toString(),
      item.stockFisico.toString(),
      item.diferencia.toString(),
      item.diferencia !== 0 ? '⚠️' : '✓'
    ]);
    
    doc.autoTable({
      startY: 65,
      head: [['Producto', 'Unidad', 'Stock Teórico', 'Stock Físico', 'Diferencia', 'Estado']],
      body: tableData,
      theme: 'grid',
      headStyles: { 
        fillColor: [32, 109, 218],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: { 
        fontSize: 8,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 28, halign: 'center' },
        3: { cellWidth: 28, halign: 'center' },
        4: { cellWidth: 25, halign: 'center' },
        5: { cellWidth: 20, halign: 'center' }
      },
      didParseCell: function(data) {
        // Resaltar diferencias
        if (data.section === 'body' && data.column.index === 4) {
          const diff = parseFloat(data.cell.text[0]);
          if (diff !== 0) {
            data.cell.styles.textColor = diff > 0 ? [34, 139, 34] : [220, 53, 69];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });
    
    // Resumen de descuadres
    const finalY = doc.lastAutoTable.finalY + 10;
    const descuadres = data.filter(item => item.diferencia !== 0);
    
    if (descuadres.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 53, 69);
      doc.text(`⚠️ DESCUADRES DETECTADOS: ${descuadres.length}`, 14, finalY);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      let yPos = finalY + 8;
      descuadres.forEach((item, idx) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        const signo = item.diferencia > 0 ? '+' : '';
        doc.text(`• ${item.nombre}: ${signo}${item.diferencia} ${item.unidad}`, 14, yPos);
        yPos += 6;
      });
    } else {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(34, 139, 34);
      doc.text('✓ SIN DESCUADRES - INVENTARIO CORRECTO', 14, finalY);
    }
    
    // Pie de página
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Generado automáticamente por InventarioX - Página ${i} de ${totalPages}`,
        pageWidth / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
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

    setIsProcessing(true);
    
    try {
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
          diferencia: item.diferencia
        })),
        descuadres: inventoryData.filter(item => item.diferencia !== 0).length,
        totalProductos: inventoryData.length
      };

      // Guardar en Firebase
      await addInventoryLog(userId, logData);

      // Generar y descargar PDF
      const doc = generatePDF(inventoryData);
      const fileName = `Inventario_${selectedProvider}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      // Limpiar formulario
      setSelectedProvider('');
      setSelectedResponsible('');
      setSelectedSede('');
      setFilteredProducts([]);
      setInventoryData([]);
      setHasUnsavedChanges(false);
      setShowConfirmClose(false);

      alert(language === 'es'
        ? '✓ Inventario cerrado correctamente. PDF descargado.'
        : '✓ Inventory closed successfully. PDF downloaded.');

    } catch (error) {
      console.error('Error al cerrar inventario:', error);
      alert(language === 'es'
        ? '❌ Error al guardar el inventario'
        : '❌ Error saving inventory');
    } finally {
      setIsProcessing(false);
    }
  };

  // ============ CONTAR DESCUADRES ============
  const descuadresCount = inventoryData.filter(item => item.diferencia !== 0).length;
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
                    {language === 'es' ? 'Descuadres:' : 'Discrepancies:'}
                  </span>
                  <span className={`font-bold ml-2 ${descuadresCount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {descuadresCount}
                  </span>
                </div>
              </div>
              
              <button
                onClick={() => setShowConfirmClose(true)}
                disabled={!canClose || isProcessing}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-all ${
                  canClose && !isProcessing
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                <FileCheck className="w-5 h-5" />
                {language === 'es' ? 'Cerrar Inventario' : 'Close Inventory'}
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
                    {language === 'es' ? 'Diferencia' : 'Difference'}
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
                        {item.diferencia > 0 ? '+' : ''}{item.diferencia}
                      </span>
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

      {/* Modal de confirmación */}
      <ConfirmationModal
        isOpen={showConfirmClose}
        title={language === 'es' ? '¿Cerrar inventario?' : 'Close inventory?'}
        message={language === 'es' 
          ? `Estás a punto de cerrar el inventario con ${descuadresCount} descuadre${descuadresCount !== 1 ? 's' : ''}. Esta acción generará un registro permanente y no podrá editarse.` 
          : `You are about to close the inventory with ${descuadresCount} discrepanc${descuadresCount !== 1 ? 'ies' : 'y'}. This action will create a permanent record and cannot be edited.`}
        onConfirm={handleCloseInventory}
        onCancel={() => setShowConfirmClose(false)}
        confirmText={language === 'es' ? 'Cerrar y Generar PDF' : 'Close and Generate PDF'}
        cancelText={language === 'es' ? 'Cancelar' : 'Cancel'}
        isDangerous={false}
      />
    </div>
  );
}
