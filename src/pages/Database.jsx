import { useState } from 'react';
import { Download, Upload, Database, HardDrive } from 'lucide-react';
import { t } from '../utils/translations';

// ============================================================================
// FUNCIONES DE EXPORTACIÓN
// ============================================================================

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

  // Handler de Importación
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

      {/* Info Card */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          📊 {recordCount.providers} proveedores • {recordCount.products} productos • 
          {recordCount.stock} items de inventario • {recordCount.orders} pedidos
        </p>
      </div>

      {/* Grid de Secciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECCIÓN 1: EXPORTAR DATOS */}
        <div className="bg-gray-900 dark:bg-gray-900 light-mode:bg-white border border-gray-700 light-mode:border-gray-300 rounded-lg p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Download className="w-5 h-5 text-green-500" />
            <h2 className="text-xl font-semibold">Exportar Datos</h2>
          </div>

          <p className="text-gray-400 light-mode:text-gray-600 text-sm mb-4">
            Descarga tus datos en formato CSV o JSON
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
        <div className="bg-gray-900 dark:bg-gray-900 light-mode:bg-white border border-gray-700 light-mode:border-gray-300 rounded-lg p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Upload className="w-5 h-5 text-orange-500" />
            <h2 className="text-xl font-semibold">Importar Datos</h2>
          </div>

          <p className="text-gray-400 light-mode:text-gray-600 text-sm mb-4">
            Carga un respaldo JSON para restaurar todos tus datos
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
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <span className="text-lg">💡</span> Tips
        </h3>
        <ul className="text-sm text-gray-400 light-mode:text-gray-600 space-y-2">
          <li>✓ Usa "Respaldo Total" regularmente para proteger tus datos</li>
          <li>✓ Los archivos CSV abiertos en Excel reconocen caracteres especiales (UTF-8)</li>
          <li>✓ El archivo JSON contiene toda tu información en un formato portable</li>
          <li>✓ Si cambias de dispositivo, solo necesitas cargar el archivo JSON</li>
        </ul>
      </div>
    </div>
  );
}
