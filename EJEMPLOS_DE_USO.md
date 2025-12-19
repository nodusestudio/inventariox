/**
 * EJEMPLOS DE USO - Inventariox
 * Casos de uso y patrones recomendados
 */

// ==========================================
// 1. USAR COMPONENTES REUTILIZABLES
// ==========================================

import Logo from './components/Logo';
import MetricCard from './components/MetricCard';
import TableContainer from './components/TableContainer';
import { Package, AlertCircle } from 'lucide-react';

// Ejemplo: Logo en diferentes tamaños
export function LogoExamples() {
  return (
    <div className="flex gap-4">
      <Logo size="sm" />
      <Logo size="md" />
      <Logo size="lg" />
    </div>
  );
}

// Ejemplo: Tarjeta de métrica
export function MetricCardExample() {
  return (
    <MetricCard
      title="Total de Productos"
      value={156}
      icon={Package}
      color="primary"
      trend={{ value: '+12%', positive: true }}
    />
  );
}

// Ejemplo: Tabla con datos
export function TableExample() {
  const columns = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'precio', label: 'Precio', render: (v) => `$${v}` },
    { key: 'stock', label: 'Stock' },
  ];

  const data = [
    { nombre: 'Producto 1', precio: 100, stock: 15 },
    { nombre: 'Producto 2', precio: 250, stock: 8 },
  ];

  return (
    <TableContainer
      columns={columns}
      data={data}
      onRowClick={(row) => console.log('Seleccionado:', row)}
    />
  );
}

// ==========================================
// 2. USAR FUNCIONES AUXILIARES
// ==========================================

import { calculateCostReal, isLowStock, formatCurrency } from './utils/helpers';

// Ejemplo: Calcular costo real
export function CostCalculationExample() {
  const costBase = 800;
  const mermaPercentage = 2.5;
  
  const costReal = calculateCostReal(costBase, mermaPercentage);
  console.log(`Costo Real: $${costReal}`);  // $820.51
  
  return (
    <div>
      <p>Costo Base: ${costBase}</p>
      <p>Merma: {mermaPercentage}%</p>
      <p>Costo Real: ${costReal}</p>
    </div>
  );
}

// Ejemplo: Verificar stock bajo
export function StockAlertExample() {
  const stockActual = 5;
  const stockMinimo = 10;
  
  if (isLowStock(stockActual, stockMinimo)) {
    console.log('⚠️ Stock bajo! Hacer pedido urgente');
  }
}

// Ejemplo: Formatear moneda
export function CurrencyFormatExample() {
  const valor = 1500.50;
  const formatted = formatCurrency(valor);
  console.log(formatted);  // $1.500
}

// ==========================================
// 3. ESTADO EN CONFIGURACIÓN
// ==========================================

import { useState } from 'react';

export function SettingsStateExample() {
  const [formData, setFormData] = useState({
    nombreEmpresa: '',
    nitRut: '',
    direccion: '',
  });

  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState('es');

  const handleSave = () => {
    // Guardar en localStorage
    localStorage.setItem('companyData', JSON.stringify(formData));
    localStorage.setItem('theme', theme);
    localStorage.setItem('language', language);
    
    console.log('✓ Configuración guardada');
  };

  return (
    <div>
      <input
        value={formData.nombreEmpresa}
        onChange={(e) => setFormData({ ...formData, nombreEmpresa: e.target.value })}
        placeholder="Nombre de la empresa"
      />
      
      <button onClick={handleSave}>Guardar</button>
    </div>
  );
}

// ==========================================
// 4. TABLA DE INVENTARIO CON COSTO REAL
// ==========================================

export function InventoryTableExample() {
  const inventoryData = [
    {
      id: 1,
      nombre: 'Laptop',
      proveedor: 'ABC Corp',
      unidad: 'Unidades',
      stockActual: 15,
      stockMinimo: 5,
      merma: 2.5,
      costo: 800,
    },
    {
      id: 2,
      nombre: 'Monitor',
      proveedor: 'XYZ Ltd',
      unidad: 'Unidades',
      stockActual: 8,
      stockMinimo: 10,
      merma: 1.0,
      costo: 250,
    },
  ];

  const columns = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'proveedor', label: 'Proveedor' },
    { key: 'stock', label: 'Stock', render: (v) => v },
    {
      key: 'costoReal',
      label: 'Costo Real',
      render: (v) => `$${v}`,
    },
  ];

  // Enriquecer datos con costo real
  const enrichedData = inventoryData.map((item) => ({
    ...item,
    costoReal: calculateCostReal(item.costo, item.merma),
  }));

  return (
    <TableContainer
      columns={columns}
      data={enrichedData}
      onRowClick={(row) => console.log('Producto:', row)}
    />
  );
}

// ==========================================
// 5. COMPONENTE CON BÚSQUEDA
// ==========================================

import { Search } from 'lucide-react';

export function SearchableInventory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [inventoryData] = useState([
    { id: 1, nombre: 'Laptop', proveedor: 'ABC' },
    { id: 2, nombre: 'Monitor', proveedor: 'XYZ' },
  ]);

  const filteredData = inventoryData.filter((item) =>
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.proveedor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Search className="w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
        />
      </div>
      
      <p>Resultados: {filteredData.length}</p>
      {filteredData.map((item) => (
        <div key={item.id} className="p-4 bg-gray-700 rounded mb-2">
          <p>{item.nombre} - {item.proveedor}</p>
        </div>
      ))}
    </div>
  );
}

// ==========================================
// 6. VALIDACIÓN DE FORMULARIO
// ==========================================

import { validateNITRUT } from './utils/helpers';

export function FormValidationExample() {
  const [nit, setNit] = useState('');
  const [error, setError] = useState('');

  const handleValidate = () => {
    if (validateNITRUT(nit)) {
      setError('');
      console.log('✓ NIT/RUT válido');
    } else {
      setError('NIT/RUT inválido');
    }
  };

  return (
    <div>
      <input
        value={nit}
        onChange={(e) => setNit(e.target.value)}
        placeholder="12.345.678-9"
        className={error ? 'border-red-500' : ''}
      />
      <button onClick={handleValidate}>Validar</button>
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}

// ==========================================
// 7. TOGGLE DE TEMA
// ==========================================

export function ThemeToggleExample() {
  const [theme, setTheme] = useState('dark');

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    // Aquí se aplicaría el cambio visual
  };

  return (
    <button
      onClick={toggleTheme}
      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
        theme === 'dark' ? 'bg-primary' : 'bg-gray-600'
      }`}
    >
      <span
        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
          theme === 'dark' ? 'translate-x-7' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

// ==========================================
// 8. EXPORTAR A CSV
// ==========================================

import { exportToCSV } from './utils/helpers';

export function ExportExample() {
  const handleExport = () => {
    const data = [
      { nombre: 'Producto 1', precio: 100, stock: 15 },
      { nombre: 'Producto 2', precio: 250, stock: 8 },
    ];

    exportToCSV(data, 'inventario.csv');
    console.log('✓ Archivo descargado');
  };

  return (
    <button 
      onClick={handleExport}
      className="px-4 py-2 bg-primary text-white rounded"
    >
      Descargar CSV
    </button>
  );
}

// ==========================================
// 9. MÉTODOS DE PAGO EN ORDENES
// ==========================================

export function OrderStatusBadge({ status }) {
  const statusStyles = {
    Entregado: 'bg-green-900/30 text-green-400',
    Pendiente: 'bg-yellow-900/30 text-yellow-400',
    'En Tránsito': 'bg-blue-900/30 text-blue-400',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusStyles[status]}`}>
      {status}
    </span>
  );
}

// ==========================================
// 10. CÁLCULO DE VALOR TOTAL
// ==========================================

import { calculateTotalInventoryValue } from './utils/helpers';

export function InventoryValueExample() {
  const inventoryData = [
    {
      nombre: 'Laptop',
      costo: 800,
      merma: 2.5,
      stockActual: 10,
    },
    {
      nombre: 'Monitor',
      costo: 250,
      merma: 1.0,
      stockActual: 5,
    },
  ];

  const totalValue = calculateTotalInventoryValue(inventoryData);
  
  return (
    <div>
      <p>Valor Total del Inventario: ${totalValue.toFixed(2)}</p>
    </div>
  );
}

// ==========================================
// NOTAS IMPORTANTES
// ==========================================

/*
1. ALMACENAMIENTO DE DATOS:
   - localStorage es local al navegador
   - Para producción, usar base de datos
   - Implementar API REST para sincronización

2. VALIDACIONES:
   - Siempre validar en cliente
   - También validar en servidor
   - Usar esquemas (Zod, Yup)

3. RENDIMIENTO:
   - Usar React.memo para componentes costosos
   - Implementar virtualización para listas grandes
   - Lazy loading de imágenes

4. SEGURIDAD:
   - Nunca guardar datos sensibles en localStorage
   - Implementar HTTPS
   - Validar entrada de usuario

5. TESTING:
   - Jest para unit tests
   - React Testing Library para componentes
   - Cypress para E2E

6. ESTILO:
   - Mantener consistencia con Tailwind
   - Usar clases predefinidas
   - Evitar inline styles
*/
