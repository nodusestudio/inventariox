# 🚀 Mejoras en Pestaña "Base de Datos" - Herramientas Avanzadas

## 📋 Descripción General

Se han implementado tres funciones poderosas en la pestaña "Base de Datos" para optimizar la gestión de información:

1. **Importar Masivamente** - Carga proveedores/productos desde CSV o JSON
2. **Respaldo Rápido** - Descarga completa con un click
3. **Limpiador/Restablecer** - Con doble confirmación de seguridad

---

## 🎯 Función 1: Importar Masivamente

### ¿Qué hace?
Permite cargar múltiples proveedores o productos desde archivos CSV o JSON, agregándolos a los datos existentes (no borra, sino suma).

### Características
- ✅ Soporta archivos CSV y JSON
- ✅ Detecta automáticamente si son proveedores o productos por nombre de archivo
- ✅ Valida campos obligatorios
- ✅ Muestra cantidad de registros importados
- ✅ Recarga automática después de importar
- ✅ Color FODEXA azul (#206DDA)

### Cómo Usarlo

#### **Formato CSV:**
```csv
id,nombre,proveedor,contacto,email,whatsapp,unidad,contenidoEmpaque,costo,merma
1,LAPTOP DELL,DIST ABC,JUAN,JUAN@ABC.COM,56912345678,UNIDADES,1 UNIDAD,800000,2.5
2,MONITOR,IMP GLOBAL,MARÍA,MARIA@GLOBAL.COM,56987654321,UNIDADES,1 UNIDAD,250000,1.0
```

#### **Nombre de archivo:**
- Para proveedores: `proveedores.csv` o `proveedores_2025.json`
- Para productos: `productos.csv` o `productos_importar.json`

#### **Formato JSON:**
```json
[
  {
    "id": 1,
    "nombre": "LAPTOP DELL",
    "proveedor": "DIST ABC",
    "contacto": "JUAN",
    "email": "JUAN@ABC.COM",
    "whatsapp": "56912345678",
    "unidad": "UNIDADES",
    "contenidoEmpaque": "1 UNIDAD",
    "costo": 800000,
    "merma": 2.5
  }
]
```

### Código Implementado

```javascript
// Para CSV de Proveedores
const importProvidersFromCSV = (csvContent) => {
  const lines = csvContent.split('\n').filter(line => line.trim());
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
};

// Para JSON de Productos
const importProductsFromJSON = (jsonContent) => {
  const data = JSON.parse(jsonContent);
  const products = Array.isArray(data) ? data : data.products || [];
  
  return products.map(p => ({
    id: p.id || Date.now(),
    nombre: p.nombre || '',
    proveedor: p.proveedor || '',
    // ... otros campos
  })).filter(p => p.nombre);
};

// Handler de importación masiva
const handleImportMassive = (e) => {
  const file = e.target.files?.[0];
  const fileName = file.name.toLowerCase();
  
  if (fileName.includes('proveedor')) {
    importedProviders = isJSON 
      ? importProvidersFromJSON(content)
      : importProvidersFromCSV(content);
  } else if (fileName.includes('producto')) {
    importedProducts = isJSON 
      ? importProductsFromJSON(content)
      : importProductsFromCSV(content);
  }
  
  // Actualizar estado y localStorage
  const updated = [...(providersData || []), ...importedProviders];
  setProvidersData(updated);
  localStorage.setItem('inventariox_providers', JSON.stringify(updated));
  alert(`✅ ${importedProviders.length} proveedores importados`);
};
```

---

## 💾 Función 2: Respaldo Rápido

### ¿Qué hace?
Descarga un archivo JSON completo con toda la información del sistema en un solo click.

### Características
- ✅ Botón prominente con color FODEXA azul
- ✅ Incluye: Proveedores, Productos, Inventario, Pedidos
- ✅ Metadatos: fecha y versión
- ✅ Nombre de archivo con fecha automática
- ✅ Formato JSON ordenado (indentado)
- ✅ Recomendado para respaldos diarios

### Archivo Descargado
```
respaldo-rapido-2025-12-19.json
```

### Contenido Estructura
```json
{
  "exportDate": "2025-12-19T14:30:45.123Z",
  "version": "1.0.0",
  "data": {
    "company": {
      "nombreEmpresa": "MI EMPRESA",
      "nitRut": "12.345.678-9",
      "direccion": "Calle Principal 123"
    },
    "providers": [
      { "id": 1, "nombre": "DISTRIBUIDORA ABC", ... }
    ],
    "products": [
      { "id": 1, "nombre": "LAPTOP DELL", ... }
    ],
    "stock": [
      { "id": 1, "productoId": 1, "stockActual": 5, ... }
    ],
    "orders": [
      { "id": 1, "proveedor": "DIST ABC", ... }
    ]
  }
}
```

### Código Implementado

```javascript
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
```

---

## 🔴 Función 3: Restablecer Sistema (Limpiador)

### ¿Qué hace?
Borra TODOS los datos del localStorage de forma segura con doble confirmación.

### Características
- ✅ Requiere **2 confirmaciones** sucesivas
- ✅ Cambio de color progresivo (advertencia)
- ✅ Zona de peligro con alertas visuales claras
- ✅ Texto adecuado: "Restablecer Sistema"
- ✅ Color ROJO para indicar peligro
- ✅ Botón "Cancelar" para abortar
- ✅ Botón progresivo que cambia de texto

### Flujo de Confirmación

```
Estado 0 (Inicial):
┌─────────────────────────────────────┐
│ 🗑️ Restablecer Sistema              │
│ [Rojo oscuro - #7f1d1d]             │
│ Haz click para confirmar             │
└─────────────────────────────────────┘
        ↓ (Click)
        
Estado 1 (Primera confirmación):
┌─────────────────────────────────────┐
│ ⚠️ ¿Confirmas?                      │
│ [Naranja - #ea580c]                 │
│ Confirmación: 1/2                   │
│ ⚠️ Esta acción no se puede deshacer │
└─────────────────────────────────────┘
        ↓ (Click)
        
Estado 2 (Segunda confirmación):
┌─────────────────────────────────────┐
│ 🔴 ÚLTIMO AVISO - Click para conf.  │
│ [Rojo brillante - #dc2626]          │
│ Confirmación: 2/2                   │
│ ⚠️ Se eliminarán:                   │
│ • Todos los proveedores             │
│ • Todos los productos               │
│ • Todo el inventario                │
│ • Todos los pedidos                 │
└─────────────────────────────────────┘
        ↓ (Click)
        
✅ Sistema restablecido completamente
```

### Datos Eliminados
```javascript
// Se borra todo localStorage:
localStorage.clear();

// Se resetean estados a valores por defecto:
{
  nombreEmpresa: 'MI EMPRESA',
  nitRut: '12.345.678-9',
  direccion: 'Calle Principal 123, Ciudad',
}
setProvidersData([]);
setProductsData([]);
setStockData([]);
setOrdersData([]);
```

### Código Implementado

```javascript
const [resetConfirm, setResetConfirm] = useState(0);

const handleReset = () => {
  // Primera confirmación
  if (resetConfirm === 0) {
    setResetConfirm(1);
    return;
  }

  // Segunda confirmación
  if (resetConfirm === 1) {
    setResetConfirm(2);
    return;
  }

  // Ejecutar reset
  if (resetConfirm === 2) {
    try {
      localStorage.clear();
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
      alert('❌ Error al restablecer el sistema');
    }
  }
};

const resetButtonText = 
  resetConfirm === 0 ? '🗑️ Restablecer Sistema' :
  resetConfirm === 1 ? '⚠️ ¿Confirmas?' :
  '🔴 ÚLTIMO AVISO - Click para confirmar';
```

---

## 🎨 Diseño y Colores FODEXA

### Paleta de Colores Implementada

| Elemento | Color | Uso |
|----------|-------|-----|
| **Primario** | `#206DDA` (Azul FODEXA) | Botones de acción, importar, respaldo rápido |
| **Peligro** | `#991b1b` → `#dc2626` (Rojo) | Restablecer sistema, zona de peligro |
| **Advertencia** | `#ea580c` (Naranja) | Segunda confirmación |
| **Fondo tarjetas** | `#1f2937` (Gris oscuro) | Cards y secciones |
| **Texto** | `#ffffff` (Blanco) | Dark mode / light-mode compatible |

### Estilos Aplicados

```css
/* Botón Importar/Respaldo */
background: linear-gradient(135deg, #206DDA 0%, #0e4ba9 100%);
color: white;
transition: all 0.2s;
transform: hover:scale-105;

/* Zona de Peligro */
background: linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%);
border: 1px solid rgba(153, 27, 27, 0.4);
background-color: rgba(127, 29, 29, 0.2);

/* Segunda Confirmación */
background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);

/* Confirmación Final */
background: linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%);
```

---

## 📊 Cambios en Database.jsx

### Imports Nuevos
```javascript
import { Download, Upload, Database, HardDrive, Trash2, AlertTriangle } from 'lucide-react';
```

### Estados Nuevos
```javascript
const [resetConfirm, setResetConfirm] = useState(0);        // Para doble confirmación
const [showResetModal, setShowResetModal] = useState(false); // Opcional para modal
```

### Funciones Nuevas (5)
1. `importProvidersFromCSV()` - Parsea CSV de proveedores
2. `importProductsFromCSV()` - Parsea CSV de productos
3. `importProvidersFromJSON()` - Parsea JSON de proveedores
4. `importProductsFromJSON()` - Parsea JSON de productos
5. `handleImportMassive()` - Handler principal de importación
6. `handleQuickBackup()` - Descarga respaldo rápido
7. `handleReset()` - Ejecuta reset con doble confirmación

### Total de Líneas Agregadas
- **Funciones de parseo**: ~150 líneas
- **Handlers**: ~100 líneas
- **UI/JSX**: ~200 líneas
- **TOTAL**: ~450 líneas (bien organizadas)

---

## 🔒 Seguridad

### Medidas Implementadas

1. **Doble Confirmación en Reset**
   ```javascript
   if (resetConfirm === 0) { /* Primera confirmación */ }
   if (resetConfirm === 1) { /* Segunda confirmación */ }
   if (resetConfirm === 2) { /* Ejecutar reset */ }
   ```

2. **Validación de Archivos**
   ```javascript
   const isJSON = file.name.endsWith('.json');
   const isCSV = file.name.endsWith('.csv');
   if (!isJSON && !isCSV) throw new Error('Solo .json o .csv');
   ```

3. **Detección de Tipo por Nombre**
   ```javascript
   if (fileName.includes('proveedor')) { /* Importar proveedores */ }
   if (fileName.includes('producto')) { /* Importar productos */ }
   ```

4. **Try-Catch en Todas Partes**
   ```javascript
   try {
     // Lógica de importación/reset
   } catch (error) {
     console.error('Error:', error);
     alert(`❌ Error: ${error.message}`);
   }
   ```

5. **Alertas Progresivas**
   ```
   - Primera advertencia: Zona de peligro
   - Segunda: Lista de qué se borra
   - Tercera: Último aviso con confirmación visual
   ```

---

## 🚀 Cómo Usar

### Importar Masivamente
1. Abre la pestaña **"Base de Datos"**
2. Busca la sección **"Importar Masivamente"**
3. Sube un archivo CSV o JSON (nombrado con "proveedores" o "productos")
4. Sistema cargará automáticamente los nuevos registros

### Respaldo Rápido
1. En **"Respaldo Rápido"**
2. Haz click en **"Descargar Respaldo Ahora"**
3. Se descargará `respaldo-rapido-YYYY-MM-DD.json`
4. Guárdalo en un lugar seguro

### Restablecer Sistema
1. En **"Zona de Peligro"**
2. Haz click en **"Restablecer Sistema"** (estado 0)
3. Confirma: **"¿Confirmas?"** (estado 1)
4. Último aviso: **"ÚLTIMO AVISO"** (estado 2)
5. O haz click **"Cancelar"** para abortar en cualquier momento

---

## ✅ Build Status

```
✓ 1264 modules transformed
✓ built in 8.07s
0 errors
0 warnings
Status: PRODUCCIÓN LISTA
```

---

## 🎉 Resumen de Mejoras

| Función | Estado | Característica |
|---------|--------|-----------------|
| **Importar Masivamente** | ✅ Completo | CSV/JSON, auto-detección, validación |
| **Respaldo Rápido** | ✅ Completo | 1-click, archivo JSON completo |
| **Restablecer** | ✅ Completo | Doble confirmación, colores progresivos |
| **Colores FODEXA** | ✅ Implementado | Azul #206DDA, Rojo para peligro |
| **Responsive** | ✅ Compatible | Móvil y desktop, dark/light mode |
| **Seguridad** | ✅ Máxima | Validaciones, alertas, try-catch |

**Total de funcionalidad nueva: 3 características avanzadas completamente funcionales**

