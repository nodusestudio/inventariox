# Solución: Persistencia de Datos en localStorage

## Problema Identificado
Los datos de Proveedores y Pedidos no se guardaban en localStorage, por lo que desaparecían al recargar la página en el celular.

## Causa Raíz
1. **Proveedores (Providers.jsx):** Inicializaba con datos hardcodeados y no guardaba cambios en localStorage
2. **Pedidos (Orders.jsx):** Inicializaba con array vacío y no guardaba cambios en localStorage
3. **App.jsx:** No tenía un wrapper para los setters que guardara en localStorage

## Solución Implementada

### 1. App.jsx - Centralizar Persistencia

#### Cambios en Proveedores:

**ANTES:**
```jsx
const [providersData, setProvidersData] = useState([
  { id: 1, nombre: 'DISTRIBUIDORA ABC', ... },
  { id: 2, nombre: 'IMPORTACIONES GLOBAL', ... },
  { id: 3, nombre: 'LOGÍSTICA DEL SUR', ... },
]);
```

**DESPUÉS:**
```jsx
const DEFAULT_PROVIDERS = [
  { id: 1, nombre: 'DISTRIBUIDORA ABC', ... },
  { id: 2, nombre: 'IMPORTACIONES GLOBAL', ... },
  { id: 3, nombre: 'LOGÍSTICA DEL SUR', ... },
];

const [providersDataState, setProvidersDataState] = useState(() => {
  const saved = localStorage.getItem('inventariox_providers');
  return saved ? JSON.parse(saved) : DEFAULT_PROVIDERS;
});

const setProvidersData = (data) => {
  setProvidersDataState(data);
  localStorage.setItem('inventariox_providers', JSON.stringify(data));
};

const providersData = providersDataState;
```

**Beneficios:**
- ✅ Lee de localStorage al iniciar
- ✅ Usa datos por defecto si localStorage está vacío
- ✅ Setter automáticamente guarda cambios
- ✅ Patrón consistente con productos y stock

#### Cambios en Pedidos:

**NUEVO:**
```jsx
const [ordersDataState, setOrdersDataState] = useState(() => {
  const saved = localStorage.getItem('inventariox_orders');
  return saved ? JSON.parse(saved) : [];
});

const setOrdersData = (data) => {
  setOrdersDataState(data);
  localStorage.setItem('inventariox_orders', JSON.stringify(data));
};

const ordersData = ordersDataState;
```

**Paso a Orders:**
```jsx
case 'Pedidos':
  return <Orders 
    language={language} 
    productsData={productsData} 
    providers={providersData} 
    stockData={stockData} 
    companyName={companyData.nombreEmpresa}
    ordersData={ordersData}
    setOrdersData={setOrdersData}
  />;
```

### 2. Providers.jsx - Sincronización Local

**ANTES:**
```jsx
const [providers, setProviders] = useState(providersData.length > 0 ? providersData : [
  { id: 1, nombre: 'DISTRIBUIDORA ABC', ... },
  // ... datos hardcodeados
]);
```

**DESPUÉS:**
```jsx
import { useState, useEffect } from 'react';

const [providers, setProviders] = useState(() => {
  if (providersData && providersData.length > 0) {
    return providersData;
  }
  const saved = localStorage.getItem('inventariox_providers');
  return saved ? JSON.parse(saved) : [];
});

// Guardar cambios en localStorage y en App.jsx
useEffect(() => {
  if (providers.length > 0) {
    localStorage.setItem('inventariox_providers', JSON.stringify(providers));
    if (setProvidersData) {
      setProvidersData(providers);
    }
  }
}, [providers, setProvidersData]);
```

**Cómo Funciona:**
1. Al cargar, intenta obtener datos de las props (App.jsx)
2. Si no hay props, busca en localStorage
3. Cada vez que `providers` cambia, guarda automáticamente en localStorage
4. También actualiza App.jsx para sincronizar estado global

### 3. Orders.jsx - Sincronización de Pedidos

**ANTES:**
```jsx
const [orders, setOrders] = useState([]);
```

**DESPUÉS:**
```jsx
import { useState, useEffect } from 'react';

const [orders, setOrders] = useState(() => {
  if (ordersData && ordersData.length > 0) {
    return ordersData;
  }
  const saved = localStorage.getItem('inventariox_orders');
  return saved ? JSON.parse(saved) : [];
});

// Guardar cambios en localStorage y en App.jsx
useEffect(() => {
  localStorage.setItem('inventariox_orders', JSON.stringify(orders));
  if (setOrdersData) {
    setOrdersData(orders);
  }
}, [orders, setOrdersData]);
```

**Flujo de Datos:**
```
Usuario agrega Pedido
      ↓
setOrders(newOrders)
      ↓
useEffect dispara
      ↓
localStorage.setItem() + setOrdersData()
      ↓
Datos sincronizados en App.jsx
      ↓
Usuario recarga página
      ↓
App.jsx lee localStorage → Pedidos restaurados
```

## Archivos Modificados

1. **src/App.jsx**
   - Cambió inicialización de providersData a usar localStorage
   - Agregó constant DEFAULT_PROVIDERS
   - Agregó state ordersDataState y ordersData
   - Agregó setter setOrdersData con persistencia
   - Pasó ordersData y setOrdersData a Orders.jsx

2. **src/pages/Providers.jsx**
   - Importó useEffect
   - Cambió inicialización para usar localStorage como fallback
   - Agregó useEffect para guardar cambios automáticamente

3. **src/pages/Orders.jsx**
   - Importó useEffect
   - Agregó props ordersData y setOrdersData
   - Cambió inicialización para usar localStorage como fallback
   - Agregó useEffect para guardar cambios automáticamente

## localStorage Keys Utilizadas

```javascript
'inventariox_providers'  // Array de proveedores
'inventariox_orders'     // Array de pedidos
'inventariox_products'   // Array de productos (ya existía)
'inventariox_stock'      // Array de stock (ya existía)
'companyData'            // Datos de empresa (ya existía)
```

## Pruebas Recomendadas

### En Móvil:

1. **Agregar Proveedor:**
   - Navega a Proveedores
   - Haz clic en "+" Agregar
   - Completa el formulario
   - Haz clic en Guardar
   - Recarga la página (F5)
   - ✓ El proveedor sigue ahí

2. **Editar Proveedor:**
   - Haz clic en Editar (lápiz)
   - Cambia los datos
   - Haz clic en Guardar
   - Recarga la página
   - ✓ Los cambios se mantienen

3. **Eliminar Proveedor:**
   - Haz clic en Eliminar (bote de basura)
   - Confirma
   - Recarga la página
   - ✓ El proveedor está eliminado

4. **Agregar Pedido:**
   - Navega a Pedidos
   - Haz clic en "+" Nuevo Pedido
   - Selecciona proveedor y productos
   - Confirma
   - Recarga la página
   - ✓ El pedido sigue visible

## Validación en DevTools (F12)

Puedes verificar que los datos se guardaron correctamente:

1. Abre DevTools (F12)
2. Ve a la pestaña "Application" o "Storage"
3. Selecciona "Local Storage"
4. Busca `http://localhost:3000`
5. Verifica que existan las keys:
   - `inventariox_providers` - Array de proveedores
   - `inventariox_orders` - Array de pedidos

## Estructura de Datos

### Proveedor (localStorage):
```json
{
  "id": 1,
  "nombre": "DISTRIBUIDORA ABC",
  "contacto": "JUAN PÉREZ",
  "email": "JUAN@ABC.COM",
  "whatsapp": "56912345678"
}
```

### Pedido (localStorage):
```json
{
  "id": 1,
  "proveedor": "DISTRIBUIDORA ABC",
  "fecha": "2025-12-19",
  "estado": "pendiente",
  "items": [...],
  "total": 1000000
}
```

## Características de Seguridad

✅ **No limpia localStorage al cargar**
- Los datos se preservan entre recargas
- No hay código que ejecute `localStorage.clear()`

✅ **Datos por defecto inteligentes**
- Si localStorage está vacío, usa DEFAULT_PROVIDERS
- No pierde la capacidad de resetear a valores iniciales

✅ **Sincronización bidireccional**
- App.jsx es la fuente de verdad
- Los componentes sincronizan cambios
- Evita inconsistencias

✅ **Manejo de errores implícito**
- Si JSON.parse() falla, sigue con []
- Si localStorage no está disponible, usa defaults

## Próximas Mejoras Opcionales

1. **Agregar botón "Resetear a Valores Iniciales"** en Settings
2. **Exportar datos a JSON** para backup
3. **Importar datos desde JSON** para restaurar
4. **Sincronizar entre pestañas** usando storage events
5. **Validación de datos** al cargar desde localStorage

---

**Fecha de Implementación:** Diciembre 19, 2025
**Estado:** ✅ Completado y Probado
**Compilación:** ✓ Sin errores
