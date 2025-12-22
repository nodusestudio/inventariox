import { useState } from 'react';
import { Download, Upload, Database, HardDrive, Trash2, AlertTriangle, Cloud, Clock, Package, Users, FileJson } from 'lucide-react';
import { t } from '../utils/translations';

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
}) {
  const [importing, setImporting] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(0);
  const [showResetModal, setShowResetModal] = useState(false);

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

  const handleExportBackup = () => {
    exportToJSON({
      company: companyData,
      providers: providersData,
      products: productsData,
      stock: stockData,
      orders: ordersData,
    });
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
  const handleReset = () => {
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
        // Limpiar todo el localStorage
        localStorage.clear();

        // Resetear estados
        setCompanyData({
          nombreEmpresa: 'MI EMPRESA',
          nitRut: '12.345.678-9',
          direccion: 'Calle Principal 123, Ciudad',
        });
        setProvidersData([]);
        setProductsData([]);
        setStockData([]);
        setOrdersData([]);

        alert('✅ Sistema restablecido completamente. Recargando...');
        setTimeout(() => window.location.reload(), 1500);
      } catch (error) {
        console.error('Reset error:', error);
        alert('❌ Error al restablecer el sistema');
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
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
      </div>

      {/* Dos Grandes Acciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Acción 1: Descargar Respaldo */}
        <div className="bg-[#1f2937] light-mode:bg-white border border-gray-700 light-mode:border-gray-300 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Descargar Respaldo</h2>
              <p className="text-sm text-gray-400 light-mode:text-gray-600">
                Copia segura de todos tus datos
              </p>
            </div>
            <Cloud className="w-12 h-12 text-blue-400 opacity-20" />
          </div>
          
          <button
            onClick={handleExportBackup}
            className="w-full px-6 py-4 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3 text-lg shadow-md"
          >
            <Download className="w-6 h-6" />
            Descargar Respaldo JSON
          </button>
          
          <p className="text-xs text-gray-500 light-mode:text-gray-500 text-center mt-4">
            Contiene: Proveedores, Productos, Inventario, Pedidos
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
