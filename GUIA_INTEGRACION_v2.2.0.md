# Guía de Integración v2.2.0

## 🔧 Cambios Necesarios en App.jsx

### 1. Actualizar Props de Orders

Asegúrate de pasar `setStockData` a el componente Orders:

```jsx
// En la sección donde renderizas Orders
<Orders 
  language={language}
  productsData={productsData}
  providers={providers}
  stockData={stockData}
  setStockData={setStockData}  // ← AÑADIR ESTA LÍNEA
  companyData={companyData}
  ordersData={ordersData}
  setOrdersData={setOrdersData}
/>
```

### 2. Verificar Props de Settings

Confirma que Settings recibe estos props:

```jsx
<Settings 
  language={language}
  companyData={companyData}
  setCompanyData={setCompanyData}
/>
```

---

## 📱 Estructura de Datos

### CompanyData (Settings)
```javascript
{
  nombreEstablecimiento: "Mi Tienda",
  nombreResponsable: "Juan Pérez",
  ubicacion: "Calle Principal 123, Ciudad"
}
```

### Orders (Estructura esperada)
```javascript
[
  {
    id: "PED-001",
    proveedor: "Proveedor A",
    fecha: "2024-01-15",
    total: 50000,
    estado: "Pendiente" | "Recibido",
    items: [
      {
        id: "PROD-1",
        nombre: "Producto A",
        cantidadPedir: 5,
        costo: 1000
      }
    ]
  }
]
```

### StockData (Para actualizar)
```javascript
[
  {
    id: "STK-1",
    productoId: "PROD-1",
    stockActual: 10,
    stockMinimo: 5,
    stockCompra: 20
  }
]
```

---

## ⚠️ Cambios Importantes

### Removido de Settings
- ❌ Selector de Tema (Dark/Light toggle)
- ❌ Selector de Idioma (Español/Inglés)
- ❌ Importación de `Moon`, `Sun`, `Globe` icons
- ❌ Importación de función `t` (translations)

### Removido de Orders
- ❌ Flujo multi-paso (provider-select → products-select → confirm)
- ❌ Integración WhatsApp
- ❌ Crear nuevo pedido (botón deshabilitado por ahora)
- ❌ Selección de productos
- ❌ Tabla de productos
- ❌ Importación de `MessageCircle` icon
- ❌ Importación de `TableContainer`

### Nuevo en Orders
- ✅ Función `handleReceiveOrder` para recibir mercancía
- ✅ Modal de confirmación para "Recibir Mercancía"
- ✅ Actualización automática de stock
- ✅ Vista de tarjetas (card-based layout)

---

## 🧪 Checklist de Verificación

### Settings
- [ ] Abre la página, verifica datos guardados
- [ ] Edita un campo, guarda cambios
- [ ] Recarga la página, los datos persisten
- [ ] Otros componentes reciben `companyData` actualizado

### Orders
- [ ] Se muestran tarjetas para cada pedido
- [ ] Búsqueda funciona por proveedor y número
- [ ] Badge de estado es correcto (Naranja/Verde)
- [ ] Clic en "Recibir Mercancía" abre modal
- [ ] Modal confirmación actualiza:
  - Estado a "Recibido"
  - Stock en inventario
  - Botón desaparece
- [ ] Clic en "Eliminar" funciona con confirmación
- [ ] Datos persisten en localStorage
- [ ] Recarga de página mantiene cambios

---

## 📊 LocalStorage Keys

Los siguientes keys se usan y se deben sincronizar:

```javascript
'inventariox_company'    // Datos de empresa (Settings)
'inventariox_orders'     // Listado de pedidos (Orders)
'inventariox_stock'      // Inventario actualizado (Stock)
```

---

## 🔗 Relaciones Entre Componentes

```
App.jsx
├── Settings
│   └── Modifica: companyData → localStorage
├── Orders
│   ├── Lee: ordersData
│   ├── Lee: stockData
│   ├── Modifica: ordersData → setOrdersData
│   └── Modifica: stockData → setStockData
├── Stock
│   ├── Lee: stockData
│   └── Se actualiza cuando Orders recibe mercancía
└── Providers
    └── Lee: providers
```

---

## 🚀 Deployado y Listo

✅ Código compilado correctamente
✅ Sin errores de syntax
✅ Imports simplificados
✅ Props actualizados
✅ LocalStorage integrado

---

## 📝 Notas Importantes

1. **Props en App.jsx**: Asegúrate de pasar `setStockData` a Orders
2. **LocalStorage**: Los datos se sincronizan automáticamente
3. **No agregar temática**: Settings ya no maneja tema/idioma
4. **Botón "Nuevo" en Orders**: Está deshabilitado (sin onClick)
5. **Flujo de Recepción**: Automático al confirmar modal

---

## ❓ Preguntas Comunes

**P: ¿Dónde agrego nuevos pedidos?**
R: Por ahora, el botón "Nuevo" está sin implementación. Puedes agregar esto en el futuro o manualmente en localStorage.

**P: ¿Cómo cambio el tema?**
R: El tema se maneja a nivel de App.jsx, no en Settings.

**P: ¿Qué pasa con los pedidos antiguos?**
R: Se migran automáticamente desde localStorage si tienen la estructura correcta.

**P: ¿Puedo crear pedidos desde la UI?**
R: No en esta versión. El flujo está simplificado. Puedes agregarlo en v2.3.0+

