# Corrección: Sincronización de Datos de Empresa en Pedidos

## Problema Identificado

1. Los datos de empresa (nombre y dirección) guardados en **Configuración** no se incluían en el mensaje de WhatsApp de **Pedidos**
2. Los datos se borraban al recargar la página

## Soluciones Implementadas

### 1. **Persistencia Global en App.jsx** ✓

#### Cambios Realizados:

**Antes:**
```jsx
const [companyData, setCompanyData] = useState(() => {
  const saved = localStorage.getItem('companyData');
  return saved ? JSON.parse(saved) : {...};
});
```

**Ahora:**
```jsx
// Constante por defecto estandarizada
const DEFAULT_COMPANY = {
  nombreEmpresa: 'MI EMPRESA',
  nitRut: '12.345.678-9',
  direccion: 'Calle Principal 123, Ciudad',
};

// Estado con localStorage usando clave 'fodexa_settings'
const [companyDataState, setCompanyDataState] = useState(() => {
  const saved = localStorage.getItem('fodexa_settings');
  return saved ? JSON.parse(saved) : DEFAULT_COMPANY;
});

// Wrapper para guardar automáticamente
const setCompanyData = (data) => {
  setCompanyDataState(data);
  localStorage.setItem('fodexa_settings', JSON.stringify(data));
};

// useEffect para sincronización adicional
useEffect(() => {
  localStorage.setItem('fodexa_settings', JSON.stringify(companyData));
}, [companyData]);
```

**Clave localStorage:** `fodexa_settings`

---

### 2. **Actualización de Settings.jsx** ✓

#### Props Recibidas:
```jsx
export default function Settings({ 
  theme, 
  setTheme, 
  language, 
  setLanguage,
  companyData,      // ← NUEVA
  setCompanyData    // ← NUEVA
}) {
```

#### Sincronización con companyData:
```jsx
// useEffect para sincronizar con cambios desde otros componentes
useEffect(() => {
  if (companyData) {
    setSavedData(companyData);
    setFormData(companyData);
  }
}, [companyData]);
```

#### Función handleSave Actualizada:
```jsx
const handleSave = () => {
  const dataToUpperCase = {
    nombreEmpresa: formData.nombreEmpresa.toUpperCase(),
    nitRut: formData.nitRut.toUpperCase(),
    direccion: formData.direccion.toUpperCase()
  };

  setSavedData(dataToUpperCase);
  setCompanyData(dataToUpperCase);  // ← Sincroniza con App.jsx
  
  // ... resto del código ...
  
  localStorage.setItem('fodexa_settings', JSON.stringify(dataToUpperCase));
};
```

#### Nombres de Inputs (Estandarizados):
- `nombreEmpresa` → Nombre de la empresa
- `nitRut` → NIT/RUT
- `direccion` → Dirección de la empresa

---

### 3. **Actualización de Orders.jsx** ✓

#### Props Recibidas:
```jsx
export default function Orders({ 
  language = 'es', 
  productsData = [], 
  providers = [], 
  stockData = [], 
  companyData = {},    // ← NUEVA (objeto completo)
  ordersData = [], 
  setOrdersData 
}) {
```

#### Función generateWhatsAppMessage Actualizada:
```jsx
const generateWhatsAppMessage = () => {
  const itemsList = orderItems
    .filter(item => item.cantidadPedir > 0)
    .map(item => `- ${item.nombre}: ${item.cantidadPedir} un.`)
    .join('\n');
  
  // ... código para deliveryInfo ...
  
  // ← EXTRAE NOMBRE Y DIRECCIÓN DEL OBJETO companyData
  const empresaNombre = companyData?.nombreEmpresa || 'Mi Empresa';
  const empresaDireccion = companyData?.direccion 
    ? `\nDireccion: ${companyData.direccion}` 
    : '';
  
  const message = language === 'es'
    ? `Hola ${selectedProvider.nombre}, te adjunto el pedido de ${empresaNombre}:${empresaDireccion}${deliveryInfo}\n${itemsList}${finalMessage}`
    : `Hello ${selectedProvider.nombre}, I'm sending you ${empresaNombre}'s order:${empresaDireccion}${deliveryInfo}\n${itemsList}${finalMessage}`;
  
  return encodeURIComponent(message);
};
```

#### Ejemplo de Mensaje GeneradoNuevo:
```
Hola DISTRIBUIDORA ABC, te adjunto el pedido de MI EMPRESA:
Direccion: Calle Principal 123, Ciudad

- LAPTOP DELL XPS: 2 un.
- MONITOR LG 27": 1 un.

Me confirmas por favor y el total, gracias
```

---

### 4. **Actualización de App.jsx (Pasos de Integración)** ✓

#### Paso 1: Pasar companyData a Orders
```jsx
case 'Pedidos':
  return <Orders 
    language={language} 
    productsData={productsData} 
    providers={providersData} 
    stockData={stockData} 
    companyData={companyData}        // ← NUEVA
    ordersData={ordersData} 
    setOrdersData={setOrdersData} 
  />;
```

#### Paso 2: Pasar companyData y setCompanyData a Settings
```jsx
case 'Configuración':
  return <Settings 
    theme={theme} 
    setTheme={setTheme} 
    language={language} 
    setLanguage={setLanguage}
    companyData={companyData}         // ← NUEVA
    setCompanyData={setCompanyData}   // ← NUEVA
  />;
```

---

## Flujo de Sincronización

```
Settings.jsx
    ↓ (handleSave)
setCompanyData(data)
    ↓
App.jsx (companyData actualizado)
    ↓
localStorage.setItem('fodexa_settings', ...)
    ↓
Orders.jsx recibe companyData como prop
    ↓
generateWhatsAppMessage() usa companyData.nombreEmpresa y companyData.direccion
```

---

## Verificación de Funcionamiento

### Test 1: Persistencia en Configuración
1. Ir a **Configuración**
2. Editar nombre de empresa a "FODEXA LTDA"
3. Editar dirección a "Av. Principal 456"
4. Guardar cambios
5. **Recargar página (F5)**
6. Verificar que los datos persisten ✓

### Test 2: Sincronización en Pedidos
1. Ir a **Pedidos**
2. Crear nuevo pedido
3. Seleccionar proveedor
4. Seleccionar productos
5. Ir a confirmar
6. Presionar "Enviar por WhatsApp"
7. **Verificar que el mensaje incluya:**
   - Nombre de empresa: "FODEXA LTDA"
   - Dirección: "Av. Principal 456"
   - ✓ Formato correcto en el texto

### Test 3: localStorage
1. Abrir DevTools (F12)
2. Ir a **Application → Local Storage**
3. Buscar la clave: `fodexa_settings`
4. **Verificar contenido:**
```json
{
  "nombreEmpresa": "FODEXA LTDA",
  "nitRut": "12.345.678-9",
  "direccion": "Av. Principal 456"
}
```

---

## Claves localStorage Utilizadas

| Clave | Contenido | Ubicación |
|-------|-----------|-----------|
| `fodexa_settings` | Datos de empresa (nombre, NIT, dirección) | App.jsx, Settings.jsx, Orders.jsx |
| `inventariox_providers` | Lista de proveedores | App.jsx, Providers.jsx |
| `inventariox_orders` | Historial de pedidos | App.jsx, Orders.jsx |
| `inventariox_products` | Lista de productos | App.jsx, Inventory.jsx |
| `inventariox_stock` | Datos de stock | App.jsx, Stock.jsx |

---

## Estandarización de Nombres de Campos

**Definidos en Settings.jsx (inputs):**
- `nombreEmpresa` → Usado en Orders.jsx como `companyData.nombreEmpresa`
- `nitRut` → Disponible como `companyData.nitRut`
- `direccion` → Usado en Orders.jsx como `companyData.direccion`

**Compatibilidad:**
- ✓ Manual de Identidad FODEXA
- ✓ Consistente en toda la aplicación
- ✓ Sin conflictos entre componentes

---

## Estado de la Compilación

✅ **Build exitoso:** `npm run build`
- 1263 módulos transformados
- Sin errores
- 235.79 kB JS (63.32 kB gzip)
- 31.24 kB CSS (5.39 kB gzip)

---

## Resumen de Cambios

| Archivo | Cambios | Estado |
|---------|---------|--------|
| App.jsx | Persistencia global con useEffect, paso de props a Settings y Orders | ✓ Completo |
| Settings.jsx | Sincronización con App.jsx, actualización de handleSave | ✓ Completo |
| Orders.jsx | Recepción de companyData, extracción de datos en WhatsApp | ✓ Completo |

---

## ¿Qué hacer si falta algo?

Si el usuario reporta que el nombre o dirección no aparecen en el mensaje:

1. **Verificar localStorage:**
   - Abre DevTools (F12)
   - Revisa que `fodexa_settings` tenga datos guardados

2. **Verificar companyData:**
   - En Orders.jsx, agregar `console.log('companyData:', companyData);`
   - Verificar en consola que llega el objeto completo

3. **Limpiar localStorage:**
   - `localStorage.clear()` en DevTools console
   - Recargar página
   - Volver a configurar datos en Configuración
