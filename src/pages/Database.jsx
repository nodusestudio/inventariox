import { useState } from 'react';
import { Download, Upload, Database, HardDrive, Trash2, AlertTriangle, Cloud, Clock, Package, Users, FileJson, ChevronDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { t } from '../utils/translations';
import { deleteAllUserData, getAllHistorialPedidos, getAllInventoryHistory } from '../services/firebaseService';
import * as XLSX from 'xlsx';

// ============================================================================
// FUNCIONES DE IMPORTACIÓN
// ============================================================================

const importProvidersFromCSV = (csvContent) => {
  try {
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error('CSV vacío o sin encabezados');

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const providers = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      
      const provider = {
        id: parseInt(values[headers.indexOf('id')]) || Date.now() + i,
        nombre: values[headers.indexOf('nombre')] || '',
        contacto: values[headers.indexOf('contacto')] || '',
        email: values[headers.indexOf('email')] || '',
        whatsapp: values[headers.indexOf('whatsapp')] || '',
      };

      if (provider.nombre) providers.push(provider);
    }

    return providers;
  } catch (error) {
    throw new Error(`Error parsing CSV: ${error.message}`);
  }
};

const importProductsFromCSV = (csvContent) => {
  try {
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error('CSV vacío o sin encabezados');

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const products = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      
      const product = {
        id: parseInt(values[headers.indexOf('id')]) || Date.now() + i,
        nombre: values[headers.indexOf('nombre')] || '',
        proveedor: values[headers.indexOf('proveedor')] || '',
        proveedorId: parseInt(values[headers.indexOf('proveedorid')]) || 0,
        unidad: values[headers.indexOf('unidad')] || 'UNIDADES',
        contenidoEmpaque: values[headers.indexOf('contenidoempaque')] || '',
        costo: parseFloat(values[headers.indexOf('costo')]) || 0,
        merma: parseFloat(values[headers.indexOf('merma')]) || 0,
      };

      if (product.nombre) products.push(product);
    }

    return products;
  } catch (error) {
    throw new Error(`Error parsing CSV: ${error.message}`);
  }
};

const importProvidersFromJSON = (jsonContent) => {
  try {
    const data = JSON.parse(jsonContent);
    const providers = Array.isArray(data) ? data : data.providers || data.data?.providers || [];
    
    if (!Array.isArray(providers)) throw new Error('Formato inválido');
    
    return providers.map(p => ({
      id: p.id || Date.now(),
      nombre: p.nombre || '',
      contacto: p.contacto || '',
      email: p.email || '',
      whatsapp: p.whatsapp || '',
    })).filter(p => p.nombre);
  } catch (error) {
    throw new Error(`Error parsing JSON: ${error.message}`);
  }
};

const importProductsFromJSON = (jsonContent) => {
  try {
    const data = JSON.parse(jsonContent);
    const products = Array.isArray(data) ? data : data.products || data.data?.products || [];
    
    if (!Array.isArray(products)) throw new Error('Formato inválido');
    
    return products.map(p => ({
      id: p.id || Date.now(),
      nombre: p.nombre || '',
      proveedor: p.proveedor || '',
      proveedorId: p.proveedorId || 0,
      unidad: p.unidad || 'UNIDADES',
      contenidoEmpaque: p.contenidoEmpaque || '',
      costo: p.costo || 0,
      merma: p.merma || 0,
    })).filter(p => p.nombre);
  } catch (error) {
    throw new Error(`Error parsing JSON: ${error.message}`);
  }
};

const exportToCSV = (data, filename) => {
  try {
    if (!data || data.length === 0) {
      alert(t('es', 'noData') || 'No hay datos para exportar');
      return;
    }

    const headers = Object.keys(data[0]);
    const headerNames = {
      id: 'ID',
      nombre: 'Nombre',
      proveedor: 'Proveedor',
      contacto: 'Contacto',
      email: 'Email',
      whatsapp: 'WhatsApp',
      unidad: 'Unidad',
      contenidoEmpaque: 'Contenido/Empaque',
      costo: 'Costo Unitario',
      merma: 'Merma %',
      productoId: 'Producto ID',
      stockActual: 'Stock Actual',
      stockMinimo: 'Stock Mínimo',
      stockCompra: 'Stock Compra',
      proveedorId: 'Proveedor ID',
      fecha: 'Fecha',
      cantidad: 'Cantidad',
      precioUnitario: 'Precio Unitario',
      total: 'Total',
      estado: 'Estado',
      observaciones: 'Observaciones',
    };

    const csvHeaders = headers.map(h => headerNames[h] || h).join(',');
    const csvRows = data.map(row => {
      return headers.map(header => {
        let value = row[header];
        if (value === null || value === undefined) value = '';
        if (typeof value === 'string') {
          value = value.replace(/"/g, '""');
          if (value.includes(',') || value.includes('\n')) {
            value = `"${value}"`;
          }
        }
        return value;
      }).join(',');
    });

    // UTF-8 con BOM para Excel
    const BOM = '\uFEFF';
    const csv = BOM + [csvHeaders, ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('CSV export error:', error);
    alert('Error exportando datos');
  }
};

const exportToJSON = (allData) => {
  try {
    const backup = {
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      data: {
        company: allData.company || {},
        providers: allData.providers || [],
        products: allData.products || [],
        stock: allData.stock || [],
        orders: allData.orders || [],
      },
    };

    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `respaldo-total-${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('JSON export error:', error);
    alert('Error creando respaldo');
  }
};

// ============================================================================
// COMPONENTE DATABASE PAGE
// ============================================================================

export default function DatabasePage({
  providersData,
  productsData,
  stockData,
  ordersData,
  companyData,
  setProvidersData,
  setProductsData,
  setStockData,
  setOrdersData,
  setCompanyData,
  user,
}) {
  const [importing, setImporting] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(0);
  const [showResetModal, setShowResetModal] = useState(false);
  const [downloadOption, setDownloadOption] = useState('completo');

  // Handlers de Exportación
  const handleExportProviders = () => {
    const data = (providersData || []).map(p => ({
      id: p.id,
      nombre: p.nombre,
      contacto: p.contacto || '',
      email: p.email || '',
      whatsapp: p.whatsapp || '',
    }));
    exportToCSV(data, 'Proveedores');
  };

  const handleExportProducts = () => {
    const data = (productsData || []).map(p => ({
      id: p.id,
      nombre: p.nombre,
      proveedor: p.proveedor,
      unidad: p.unidad,
      contenidoEmpaque: p.contenidoEmpaque || '',
      costo: p.costo || 0,
      merma: p.merma || 0,
    }));
    exportToCSV(data, 'Productos');
  };

  const handleExportInventory = () => {
    const data = (stockData || []).map(s => {
      const product = (productsData || []).find(p => p.id === s.productoId);
      return {
        id: s.id,
        nombre: product?.nombre || 'Desconocido',
        stockActual: s.stockActual,
        stockMinimo: s.stockMinimo,
        stockCompra: s.stockCompra || 0,
      };
    });
    exportToCSV(data, 'Inventario');
  };

  const handleExportOrders = () => {
    const data = (ordersData || []).map(o => ({
      id: o.id,
      proveedor: o.proveedor,
      fecha: o.fecha,
      observaciones: o.observaciones || '',
    }));
    exportToCSV(data, 'Pedidos');
  };

  // ============================================================================
  // FUNCIONES DE EXPORTACIÓN A EXCEL (XLSX)
  // ============================================================================

  /**
   * Exportar Historial de Pedidos a Excel con formato profesional
   */
  const exportHistorialPedidosToExcel = async () => {
    try {
      const loadingToast = toast.loading('Generando reporte de pedidos...');
      
      // Obtener todos los datos
      const historial = await getAllHistorialPedidos(user.uid);
      
      if (historial.length === 0) {
        toast.dismiss(loadingToast);
        toast.error('No hay datos de pedidos para exportar');
        return;
      }

      // Preparar datos para Excel
      const excelData = [];
      
      historial.forEach((pedido) => {
        const fecha = pedido.fecha_accion?.toDate 
          ? pedido.fecha_accion.toDate() 
          : (pedido.fecha_recepcion?.toDate ? pedido.fecha_recepcion.toDate() : new Date());
        
        const fechaFormateada = fecha.toLocaleDateString('es-CL', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        
        const horaFormateada = pedido.horaAccion || pedido.horaRecepcion || fecha.toLocaleTimeString('es-CL', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });

        const accion = pedido.accion || 'Recibido';
        const responsable = pedido.responsable || 'N/A';
        const montoTotal = pedido.montoTotal || 0;

        // Agregar fila principal del pedido
        if (pedido.items && pedido.items.length > 0) {
          pedido.items.forEach((item, idx) => {
            excelData.push({
              'Fecha': idx === 0 ? fechaFormateada : '',
              'Hora': idx === 0 ? horaFormateada : '',
              'Acción': idx === 0 ? accion : '',
              'Proveedor': idx === 0 ? pedido.proveedor : '',
              'Responsable': idx === 0 ? responsable : '',
              'Producto': item.nombre || item.productName || 'Desconocido',
              'Cantidad': item.cantidadPedir || 0,
              'Precio Unitario': item.costo || 0,
              'Subtotal': (item.cantidadPedir || 0) * (item.costo || 0),
              'Monto Total': idx === 0 ? montoTotal : ''
            });
          });
        } else {
          excelData.push({
            'Fecha': fechaFormateada,
            'Hora': horaFormateada,
            'Acción': accion,
            'Proveedor': pedido.proveedor,
            'Responsable': responsable,
            'Producto': 'Sin productos',
            'Cantidad': 0,
            'Precio Unitario': 0,
            'Subtotal': 0,
            'Monto Total': montoTotal
          });
        }
      });

      // Crear workbook y worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Configurar anchos de columnas
      ws['!cols'] = [
        { wch: 12 },  // Fecha
        { wch: 12 },  // Hora
        { wch: 12 },  // Acción
        { wch: 20 },  // Proveedor
        { wch: 20 },  // Responsable
        { wch: 30 },  // Producto
        { wch: 10 },  // Cantidad
        { wch: 15 },  // Precio Unitario
        { wch: 15 },  // Subtotal
        { wch: 15 }   // Monto Total
      ];

      // Aplicar formato a columnas de dinero
      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        // Precio Unitario (columna H)
        const cellH = XLSX.utils.encode_cell({ r: R, c: 7 });
        if (ws[cellH]) {
          ws[cellH].z = '$#,##0.00';
        }
        
        // Subtotal (columna I)
        const cellI = XLSX.utils.encode_cell({ r: R, c: 8 });
        if (ws[cellI]) {
          ws[cellI].z = '$#,##0.00';
        }
        
        // Monto Total (columna J)
        const cellJ = XLSX.utils.encode_cell({ r: R, c: 9 });
        if (ws[cellJ]) {
          ws[cellJ].z = '$#,##0.00';
        }
      }

      // Activar auto-filtros
      ws['!autofilter'] = { ref: XLSX.utils.encode_range(range) };

      // Agregar worksheet al workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Historial de Pedidos');

      // Descargar archivo
      const fecha = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `Historial_Pedidos_${fecha}.xlsx`);

      toast.dismiss(loadingToast);
      toast.success(`✓ Reporte de pedidos descargado (${historial.length} registros)`);
    } catch (error) {
      console.error('Error exportando historial de pedidos:', error);
      toast.error('❌ Error al generar el reporte');
    }
  };

  /**
   * Exportar Historial de Inventarios a Excel con formato profesional
   */
  const exportHistorialInventariosToExcel = async () => {
    try {
      const loadingToast = toast.loading('Generando reporte de inventarios...');
      
      // Obtener todos los datos
      const historial = await getAllInventoryHistory(user.uid);
      
      if (historial.length === 0) {
        toast.dismiss(loadingToast);
        toast.error('No hay datos de inventarios para exportar');
        return;
      }

      // Preparar datos para Excel
      const excelData = [];
      
      historial.forEach((inventario) => {
        const fecha = inventario.fechaCierre?.toDate 
          ? inventario.fechaCierre.toDate() 
          : new Date();
        
        const fechaFormateada = fecha.toLocaleDateString('es-CL', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        
        const horaFormateada = fecha.toLocaleTimeString('es-CL', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });

        // Agregar productos del inventario
        if (inventario.productos && inventario.productos.length > 0) {
          inventario.productos.forEach((prod, idx) => {
            excelData.push({
              'Fecha': idx === 0 ? fechaFormateada : '',
              'Hora': idx === 0 ? horaFormateada : '',
              'Producto': prod.nombre || 'Desconocido',
              'Conteo Físico': prod.conteoFisico || 0,
              'Stock Anterior': prod.stockAnterior || 0,
              'Diferencia': (prod.conteoFisico || 0) - (prod.stockAnterior || 0),
              'Costo Unitario': prod.costo || 0,
              'Valor Total': (prod.conteoFisico || 0) * (prod.costo || 0)
            });
          });
        } else {
          excelData.push({
            'Fecha': fechaFormateada,
            'Hora': horaFormateada,
            'Producto': 'Sin productos',
            'Conteo Físico': 0,
            'Stock Anterior': 0,
            'Diferencia': 0,
            'Costo Unitario': 0,
            'Valor Total': 0
          });
        }
      });

      // Crear workbook y worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Configurar anchos de columnas
      ws['!cols'] = [
        { wch: 12 },  // Fecha
        { wch: 12 },  // Hora
        { wch: 30 },  // Producto
        { wch: 15 },  // Conteo Físico
        { wch: 15 },  // Stock Anterior
        { wch: 12 },  // Diferencia
        { wch: 15 },  // Costo Unitario
        { wch: 15 }   // Valor Total
      ];

      // Aplicar formato a columnas de dinero
      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        // Costo Unitario (columna G)
        const cellG = XLSX.utils.encode_cell({ r: R, c: 6 });
        if (ws[cellG]) {
          ws[cellG].z = '$#,##0.00';
        }
        
        // Valor Total (columna H)
        const cellH = XLSX.utils.encode_cell({ r: R, c: 7 });
        if (ws[cellH]) {
          ws[cellH].z = '$#,##0.00';
        }
      }

      // Activar auto-filtros
      ws['!autofilter'] = { ref: XLSX.utils.encode_range(range) };

      // Agregar worksheet al workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Historial de Inventarios');

      // Descargar archivo
      const fecha = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `Historial_Inventarios_${fecha}.xlsx`);

      toast.dismiss(loadingToast);
      toast.success(`✓ Reporte de inventarios descargado (${historial.length} registros)`);
    } catch (error) {
      console.error('Error exportando historial de inventarios:', error);
      toast.error('❌ Error al generar el reporte');
    }
  };

  const handleExportBackup = () => {
    if (downloadOption === 'completo') {
      // Descarga completa
      exportToJSON({
        company: companyData,
        providers: providersData,
        products: productsData,
        stock: stockData,
        orders: ordersData,
      });
      toast.success('✓ Backup completo descargado exitosamente');
    } else if (downloadOption === 'inventario') {
      // Solo Inventario
      exportToJSON({
        company: companyData,
        providers: [],
        products: productsData || [],
        stock: stockData || [],
        orders: [],
      });
      toast.success('✓ Inventario descargado exitosamente');
    } else if (downloadOption === 'proveedores') {
      // Solo Proveedores
      exportToJSON({
        company: {},
        providers: providersData || [],
        products: [],
        stock: [],
        orders: [],
      });
      toast.success('✓ Proveedores descargados exitosamente');
    } else if (downloadOption === 'historial-pedidos') {
      // Historial de Pedidos en Excel
      exportHistorialPedidosToExcel();
    } else if (downloadOption === 'historial-inventarios') {
      // Historial de Inventarios en Excel
      exportHistorialInventariosToExcel();
    }
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result;
        if (!content) throw new Error('Archivo vacío');

        const backup = JSON.parse(content);

        if (backup.data) {
          if (backup.data.company) setCompanyData(backup.data.company);
          if (backup.data.providers) {
            setProvidersData(backup.data.providers);
            localStorage.setItem('inventariox_providers', JSON.stringify(backup.data.providers));
          }
          if (backup.data.products) {
            setProductsData(backup.data.products);
            localStorage.setItem('inventariox_products', JSON.stringify(backup.data.products));
          }
          if (backup.data.stock) {
            setStockData(backup.data.stock);
            localStorage.setItem('inventariox_stock', JSON.stringify(backup.data.stock));
          }
          if (backup.data.orders) {
            setOrdersData(backup.data.orders);
            localStorage.setItem('inventariox_orders', JSON.stringify(backup.data.orders));
          }

          alert('✅ Datos importados correctamente. Recargando página...');
          toast.success('✓ Respaldo restaurado exitosamente');
          setTimeout(() => window.location.reload(), 1500);
        } else {
          throw new Error('Formato de archivo inválido');
        }
      } catch (error) {
        console.error('Import error:', error);
        alert(`❌ Error importando: ${error.message}`);
      } finally {
        setImporting(false);
      }
    };

    reader.readAsText(file);
  };

  // Handler para importar Proveedores y Productos masivamente
  const handleImportMassive = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result;
        if (!content) throw new Error('Archivo vacío');

        const isJSON = file.name.endsWith('.json');
        const isCSV = file.name.endsWith('.csv');

        if (!isJSON && !isCSV) {
          throw new Error('Solo se aceptan archivos .json o .csv');
        }

        const fileName = file.name.toLowerCase();
        let importedProviders = [];
        let importedProducts = [];

        if (isJSON) {
          if (fileName.includes('proveedor')) {
            importedProviders = importProvidersFromJSON(content);
          } else if (fileName.includes('producto')) {
            importedProducts = importProductsFromJSON(content);
          } else {
            throw new Error('El nombre del archivo debe contener "proveedor" o "producto"');
          }
        } else if (isCSV) {
          if (fileName.includes('proveedor')) {
            importedProviders = importProvidersFromCSV(content);
          } else if (fileName.includes('producto')) {
            importedProducts = importProductsFromCSV(content);
          } else {
            throw new Error('El nombre del archivo debe contener "proveedor" o "producto"');
          }
        }

        if (importedProviders.length > 0) {
          const updated = [...(providersData || []), ...importedProviders];
          setProvidersData(updated);
          localStorage.setItem('inventariox_providers', JSON.stringify(updated));
          alert(`✅ ${importedProviders.length} proveedores importados`);
        } else if (importedProducts.length > 0) {
          const updated = [...(productsData || []), ...importedProducts];
          setProductsData(updated);
          localStorage.setItem('inventariox_products', JSON.stringify(updated));
          alert(`✅ ${importedProducts.length} productos importados`);
        } else {
          throw new Error('No se encontraron datos válidos en el archivo');
        }

        window.location.reload();
      } catch (error) {
        console.error('Massive import error:', error);
        alert(`❌ Error: ${error.message}`);
      } finally {
        setImporting(false);
      }
    };

    reader.readAsText(file);
  };

  // Handler para Respaldo Rápido
  const handleQuickBackup = () => {
    const backup = {
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      data: {
        company: companyData || {},
        providers: providersData || [],
        products: productsData || [],
        stock: stockData || [],
        orders: ordersData || [],
      },
    };

    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `respaldo-rapido-${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handler para resetear sistema
  const handleReset = async () => {
    if (resetConfirm === 0) {
      setResetConfirm(1);
      return;
    }

    if (resetConfirm === 1) {
      setResetConfirm(2);
      return;
    }

    if (resetConfirm === 2) {
      try {
        // Mostrar notificación de progreso
        toast.loading('Limpiando base de datos...');

        // Eliminar datos en Firestore si el usuario existe
        if (user?.uid) {
          await deleteAllUserData(user.uid);
          console.log('✅ Datos de Firestore eliminados para usuario:', user.uid);
        }

        // Limpiar localStorage
        localStorage.clear();
        console.log('✅ LocalStorage limpiado');

        // Resetear estados de la aplicación
        setCompanyData({
          nombreEmpresa: 'MI EMPRESA',
          nitRut: '12.345.678-9',
          direccion: 'Calle Principal 123, Ciudad',
        });
        setProvidersData([]);
        setProductsData([]);
        setStockData([]);
        setOrdersData([]);
        setResetConfirm(0);

        console.log('✅ Estado local restablecido');

        // Mostrar confirmación
        toast.success('✅ Sistema restablecido completamente - Sin recarga');

      } catch (error) {
        console.error('❌ Error al restablecer el sistema:', error);
        toast.error('❌ Error al limpiar la base de datos: ' + error.message);
        setResetConfirm(0);
      }
    }
  };

  const resetButtonText = 
    resetConfirm === 0 ? '🗑️ Restablecer Sistema' :
    resetConfirm === 1 ? '⚠️ ¿Confirmas?' :
    '🔴 ÚLTIMO AVISO - Click para confirmar';;

  const recordCount = {
    providers: (providersData || []).length,
    products: (productsData || []).length,
    stock: (stockData || []).length,
    orders: (ordersData || []).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Database className="w-8 h-8 text-blue-500" />
        <h1 className="text-3xl font-bold">Base de Datos</h1>
      </div>

      {/* Salud del Sistema - Minimalista */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#1f2937]/50 light-mode:bg-blue-50 border border-gray-700/50 light-mode:border-blue-200 rounded-lg p-5">
          <p className="text-xs text-gray-400 light-mode:text-blue-600 font-semibold uppercase tracking-wider mb-1">
            Registros Totales
          </p>
          <p className="text-3xl font-bold text-[#206DDA]">
            {recordCount.providers + recordCount.products + recordCount.stock + recordCount.orders}
          </p>
        </div>
        <div className="bg-[#1f2937]/50 light-mode:bg-purple-50 border border-gray-700/50 light-mode:border-purple-200 rounded-lg p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 light-mode:text-purple-600 font-semibold uppercase tracking-wider mb-1">
                Última Sincronización
              </p>
              <p className="text-sm text-gray-300 light-mode:text-gray-600">
                {new Date().toLocaleDateString('es-ES', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <Clock className="w-5 h-5 text-purple-500" />
          </div>
        </div>
        <div className="bg-[#1f2937]/50 light-mode:bg-green-50 border border-gray-700/50 light-mode:border-green-200 rounded-lg p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 light-mode:text-green-600 font-semibold uppercase tracking-wider mb-1">
                Sistema Local
              </p>
              <p className="text-sm text-green-400 light-mode:text-green-700 font-bold">
                ● Activo
              </p>
            </div>
            <div className="w-3 h-3 rounded-full bg-green-500 light-mode:bg-green-600 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Dos Grandes Acciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Acción 1: Descargar Respaldo */}
        <div className="bg-[#1f2937] light-mode:bg-white border border-gray-700 light-mode:border-gray-300 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Descargar Datos</h2>
              <p className="text-sm text-gray-400 light-mode:text-gray-600">
                Elige qué información descargar
              </p>
            </div>
            <Cloud className="w-12 h-12 text-blue-400 opacity-20" />
          </div>
          
          {/* Selector de descarga elegante */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-300 light-mode:text-gray-700 uppercase tracking-wide mb-3">
              ¿Qué descargar?
            </label>
            
            <div className="relative">
              <select
                value={downloadOption}
                onChange={(e) => setDownloadOption(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-600 light-mode:border-gray-300 bg-[#111827] light-mode:bg-white text-white light-mode:text-gray-900 font-semibold appearance-none cursor-pointer transition-all hover:border-[#206DDA]/50 focus:outline-none focus:border-[#206DDA]"
              >
                <option value="inventario">📦 Descargar Inventario (.json)</option>
                <option value="proveedores">👥 Descargar Proveedores (.json)</option>
                <option value="completo">💾 Backup Completo</option>
                <option value="historial-pedidos">📊 Historial de Pedidos Recibidos (.xlsx)</option>
                <option value="historial-inventarios">📊 Historial de Inventarios (.xlsx)</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
          
          <button
            onClick={handleExportBackup}
            className="w-full px-6 py-4 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3 text-lg shadow-md"
          >
            <Download className="w-6 h-6" />
            Descargar Ahora
          </button>
          
          <p className="text-xs text-gray-500 light-mode:text-gray-500 text-center mt-4">
            Archivo JSON portátil y seguro
          </p>
        </div>

        {/* Acción 2: Subir Respaldo */}
        <div className="bg-[#1f2937] light-mode:bg-white border border-gray-700 light-mode:border-gray-300 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Subir Respaldo</h2>
              <p className="text-sm text-gray-400 light-mode:text-gray-600">
                Restaura tus datos desde un archivo
              </p>
            </div>
            <Cloud className="w-12 h-12 text-green-400 opacity-20" />
          </div>

          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              disabled={importing}
              className="hidden"
              id="file-input-simple"
            />
            <label
              htmlFor="file-input-simple"
              className={`block w-full px-6 py-8 rounded-lg border-2 border-dashed border-green-500/50 hover:border-green-500 transition-colors cursor-pointer text-center ${
                importing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <div className="flex flex-col items-center gap-3">
                <Upload className="w-8 h-8 text-green-500" />
                <div>
                  <p className="font-medium text-white light-mode:text-gray-900">
                    {importing ? 'Importando...' : 'Arrastra tu archivo aquí'}
                  </p>
                  <p className="text-xs text-gray-400 light-mode:text-gray-600 mt-1">
                    o haz clic para seleccionar
                  </p>
                </div>
              </div>
            </label>
          </div>

          <p className="text-xs text-gray-500 light-mode:text-gray-500 text-center mt-4">
            Solo archivos JSON (.json)
          </p>
        </div>
      </div>

      {/* Grid de Secciones - OCULTO */}
      <div style={{ display: 'none' }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECCIÓN 1: EXPORTAR DATOS */}
        <div className="bg-[#1f2937] light-mode:bg-white border border-gray-700 light-mode:border-gray-300 rounded-lg p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Download className="w-5 h-5 text-green-500" />
            <h2 className="text-xl font-semibold">Copia de Seguridad</h2>
          </div>

          <p className="text-gray-400 light-mode:text-gray-600 text-sm mb-4">
            Exporta tus datos en formato CSV o JSON
          </p>

          <div className="space-y-3">
            {/* Botones CSV */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-300 light-mode:text-gray-700 uppercase tracking-wider">
                Descargas CSV
              </h3>
              <button
                onClick={handleExportProviders}
                className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Proveedores (.csv)
              </button>

              <button
                onClick={handleExportProducts}
                className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Productos (.csv)
              </button>

              <button
                onClick={handleExportInventory}
                className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Inventario (.csv)
              </button>

              <button
                onClick={handleExportOrders}
                className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Pedidos (.csv)
              </button>
            </div>

            {/* Separator */}
            <div className="py-2 border-t border-gray-700 light-mode:border-gray-300" />

            {/* Respaldo Total */}
            <button
              onClick={handleExportBackup}
              className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-lg"
            >
              <HardDrive className="w-5 h-5" />
              Respaldo Total (.json)
            </button>

            <p className="text-xs text-gray-500 light-mode:text-gray-600 text-center mt-2">
              Descarga toda tu información en un solo archivo
            </p>
          </div>
        </div>

        {/* SECCIÓN 2: IMPORTAR DATOS */}
        <div className="bg-[#1f2937] light-mode:bg-white border border-gray-700 light-mode:border-gray-300 rounded-lg p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Upload className="w-5 h-5 text-orange-500" />
            <h2 className="text-xl font-semibold">Restaurar Datos</h2>
          </div>

          <p className="text-gray-400 light-mode:text-gray-600 text-sm mb-4">
            Carga un archivo JSON para restaurar todos tus datos
          </p>

          <div className="space-y-4">
            {/* File Input */}
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                disabled={importing}
                className="hidden"
                id="file-input"
              />
              <label
                htmlFor="file-input"
                className={`block w-full px-4 py-6 rounded-lg border-2 border-dashed border-orange-500/50 hover:border-orange-500 transition-colors cursor-pointer text-center ${
                  importing ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-orange-500" />
                  <div>
                    <p className="font-medium text-white light-mode:text-gray-900">
                      {importing ? 'Importando...' : 'Selecciona un archivo JSON'}
                    </p>
                    <p className="text-xs text-gray-400 light-mode:text-gray-600 mt-1">
                      O arrastra el archivo aquí
                    </p>
                  </div>
                </div>
              </label>
            </div>

            {/* Info Box */}
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
              <p className="text-xs text-gray-400 light-mode:text-gray-600 space-y-1">
                <span className="block">✓ Solo archivos .json</span>
                <span className="block">✓ Restaura: Proveedores, Productos, Inventario, Pedidos</span>
                <span className="block">✓ Los datos existentes serán reemplazados</span>
              </p>
            </div>

            {/* Advertencia */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-xs text-red-400 font-medium">
                ⚠️ Copia tus datos actuales antes de importar
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de Ayuda */}
      <div className="bg-[#1f2937] light-mode:bg-white border border-gray-700 light-mode:border-gray-300 rounded-lg p-6 shadow-md">
        <h3 className="font-semibold mb-4 flex items-center gap-2 text-[#206DDA]">
          <span className="text-lg">💡</span> Recomendaciones
        </h3>
        <ul className="text-sm text-gray-400 light-mode:text-gray-600 space-y-2">
          <li>✓ Descarga un respaldo total regularmente para proteger tus datos</li>
          <li>✓ Los archivos CSV se abren fácilmente en Excel o Google Sheets</li>
          <li>✓ El formato JSON es portable y funciona en cualquier dispositivo</li>
          <li>✓ Si cambias de dispositivo, solo necesitas cargar el archivo JSON</li>
        </ul>
      </div>

      {/* SECCIÓN 3: HERRAMIENTAS AVANZADAS */}
      <div style={{ display: 'none' }} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Importar Masivamente */}
        <div className="bg-gray-900 dark:bg-gray-900 light-mode:bg-white border border-gray-700 light-mode:border-gray-300 rounded-lg p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Upload className="w-5 h-5" style={{ color: '#206DDA' }} />
            <h2 className="text-xl font-semibold">Importar Masivamente</h2>
          </div>

          <p className="text-gray-400 light-mode:text-gray-600 text-sm mb-4">
            Carga múltiples proveedores o productos desde CSV o JSON
          </p>

          <div className="relative">
            <input
              type="file"
              accept=".json,.csv"
              onChange={handleImportMassive}
              disabled={importing}
              className="hidden"
              id="massive-import-input"
            />
            <label
              htmlFor="massive-import-input"
              className={`block w-full px-4 py-6 rounded-lg border-2 border-dashed transition-colors cursor-pointer text-center ${
                importing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              style={{
                borderColor: '#206DDA',
                backgroundColor: 'rgba(32, 109, 218, 0.05)',
              }}
            >
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8" style={{ color: '#206DDA' }} />
                <div>
                  <p className="font-medium text-white light-mode:text-gray-900">
                    {importing ? 'Importando...' : 'Selecciona archivo'}
                  </p>
                  <p className="text-xs text-gray-400 light-mode:text-gray-600 mt-1">
                    CSV o JSON (nombra como "proveedores_..." o "productos_...")
                  </p>
                </div>
              </div>
            </label>
          </div>

          <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: 'rgba(32, 109, 218, 0.1)' }}>
            <p className="text-xs text-gray-400 light-mode:text-gray-600">
              <span className="block">📋 Formatos soportados:</span>
              <span className="block mt-1">• CSV: id, nombre, proveedor, contacto, email, whatsapp</span>
              <span className="block">• JSON: Array de objetos con los mismos campos</span>
            </p>
          </div>
        </div>

        {/* Respaldo Rápido */}
        <div className="bg-gray-900 dark:bg-gray-900 light-mode:bg-white border border-gray-700 light-mode:border-gray-300 rounded-lg p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <HardDrive className="w-5 h-5" style={{ color: '#206DDA' }} />
            <h2 className="text-xl font-semibold">Respaldo Rápido</h2>
          </div>

          <p className="text-gray-400 light-mode:text-gray-600 text-sm mb-4">
            Descarga un backup completo con un solo click
          </p>

          <button
            onClick={handleQuickBackup}
            className="w-full px-4 py-4 rounded-lg text-white font-bold transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 text-lg"
            style={{
              background: 'linear-gradient(135deg, #206DDA 0%, #0e4ba9 100%)',
            }}
            onMouseEnter={(e) => (e.target.style.opacity = '0.9')}
            onMouseLeave={(e) => (e.target.style.opacity = '1')}
          >
            <HardDrive className="w-5 h-5" />
            Descargar Respaldo Ahora
          </button>

          <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: 'rgba(32, 109, 218, 0.1)' }}>
            <p className="text-xs text-gray-400 light-mode:text-gray-600">
              <span className="block">✓ Incluye: Proveedores, Productos, Inventario, Pedidos</span>
              <span className="block mt-1">✓ Formato JSON portátil</span>
              <span className="block">✓ Recomendado diariamente</span>
            </p>
          </div>
        </div>
      </div>

      {/* SECCIÓN 4: LIMPIAR BASE DE DATOS - Al Final, Minimalista */}
      <div className="mt-12 pt-8 border-t border-gray-700 light-mode:border-gray-300">
        <p className="text-xs text-gray-500 light-mode:text-gray-500 mb-4 text-center">
          ⚠️ Zona de Peligro
        </p>

        <div className="max-w-sm mx-auto">
          <button
            onClick={handleReset}
            className="w-full px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
            style={{
              background: resetConfirm === 0 
                ? 'rgba(220, 38, 38, 0.1)' 
                : resetConfirm === 1 
                ? 'rgba(220, 38, 38, 0.2)' 
                : 'rgba(220, 38, 38, 0.3)',
              color: '#ef4444',
              border: '1px solid rgba(220, 38, 38, 0.3)',
            }}
            onMouseEnter={(e) => (e.target.style.background = 'rgba(220, 38, 38, 0.2)')}
            onMouseLeave={(e) => {
              e.target.style.background = resetConfirm === 0 
                ? 'rgba(220, 38, 38, 0.1)' 
                : resetConfirm === 1 
                ? 'rgba(220, 38, 38, 0.2)' 
                : 'rgba(220, 38, 38, 0.3)';
            }}
          >
            <Trash2 className="w-4 h-4" />
            {resetButtonText}
          </button>

          {resetConfirm > 0 && (
            <p className="text-xs text-red-400 mt-2 text-center font-semibold">
              Confirmación: {resetConfirm}/2
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
