# 🧪 GUÍA DE TESTING - SINCRONIZACIÓN PEDIDOS

## ⚡ TEST RÁPIDO (5 MINUTOS)

### Test 1: Filtro de Proveedor (1 min)
```
1. Abrir http://localhost:3000
2. Ir a pestaña "Pedidos"
3. Click "Crear Pedido"
4. Seleccionar "DISTRIBUIDORA ABC"
5. Verificar tabla:
   ✅ Muestra solo: LAPTOP DELL XPS, MOUSE INALÁMBRICO
   ✅ No muestra productos de otros proveedores
```

### Test 2: Stock Actualizado (1 min)
```
1. En tabla de Pedidos:
   ✅ Ver Stock Actual de LAPTOP = 5
   
2. Ir a Inventario:
   ✅ Verificar Stock Actual = 5
   
3. Volver a Pedidos:
   ✅ Stock sigue siendo 5
   ✅ Se sincronizó correctamente
```

### Test 3: Sugerencia Calculada (1 min)
```
1. En tabla de Pedidos:
   ✅ LAPTOP: Stock = 5, Objetivo = 10, Sugerencia = 5
   ✅ Cantidad viene pre-rellenada con 5
```

### Test 4: Edición de Cantidad (1 min)
```
1. Click en campo "Cantidad a Pedir"
2. Cambiar valor a 10
3. Verificar Total:
   ✅ LAPTOP (10 × $800.000) = $8.000.000
   ✅ MOUSE (5 × $35.000) = $175.000
   ✅ Total = $8.175.000 ✅
```

### Test 5: Envío WhatsApp (1 min)
```
1. Click "Continuar"
2. Verificar confirmación:
   ✅ Total correcto: $8.175.000
   ✅ Usa costo unitario (sin merma)
3. Click "Enviar por WhatsApp"
   ✅ Abre WhatsApp con mensaje correcto
```

---

## 🔍 VERIFICACIONES DETALLADAS

### Verificar Estructura de Datos
```javascript
// Abrir Console (F12)
// Ver datos cargados:

// 1. Productos
JSON.parse(localStorage.getItem('inventariox_products'))
// Debe mostrar: Array con productos que tienen "proveedor"

// 2. Stock
JSON.parse(localStorage.getItem('inventariox_stock'))
// Debe mostrar: Array con stock de cada producto

// 3. En Pedidos - cuando se selecciona proveedor:
// orderItems debe tener estructura:
// [
//   {
//     id: 1,
//     nombre: 'LAPTOP DELL XPS',
//     stockActual: 5,
//     sugerencia: 5,
//     cantidadPedir: 5,
//     costo: 800000
//   },
//   ...
// ]
```

### Verificar Función de Filtro
```javascript
// En Console, después de seleccionar proveedor:

// Ver productos filtrados:
console.log('Productos del proveedor:', orderItems);

// Debe mostrar solo los de ese proveedor
```

### Verificar Cálculos
```javascript
// Stock Actual: 5
// Stock Objetivo: 10
// Sugerencia: 10 - 5 = 5 ✅

// Cantidad a Pedir: 3
// Costo: 800.000
// Total: 3 × 800.000 = 2.400.000 ✅

// NO debe usar merma en cálculo
```

---

## 🎯 ESCENARIOS DE PRUEBA

### Escenario 1: Nuevo Proveedor
```
1. En Providers, agregar nuevo proveedor "TEST PROVIDER"
2. En Productos, crear producto con "TEST PROVIDER"
3. En Pedidos, seleccionar "TEST PROVIDER"
4. ✅ Ver producto nuevo en tabla
```

### Escenario 2: Stock Modificado
```
1. En Pedidos, seleccionar proveedor
2. Ver Stock Actual = 5
3. Ir a Inventario
4. Editar Stock Actual = 15
5. Volver a Pedidos
6. ✅ Stock Actual ahora = 15
7. ✅ Sugerencia recalculada
```

### Escenario 3: Cantidades Variables
```
1. En tabla Pedidos:
   ├─ Producto A: Cantidad = 5
   ├─ Producto B: Cantidad = 0 (no se incluye en pedido)
   └─ Producto C: Cantidad = 10

2. Click "Continuar"
3. ✅ Solo muestra A y C con cantidad > 0
4. ✅ B no aparece en mensaje WhatsApp
```

### Escenario 4: Sincronización Tiempo Real
```
1. Abrir Inventario en otra pestaña del navegador
2. En una pestaña: Ir a Pedidos, seleccionar proveedor
3. En otra pestaña: Modificar Stock
4. Volver a primer pestaña
5. ✅ Stock actualizado automáticamente (requiere refrescar)
```

---

## 📋 CHECKLIST DE TESTING

### Conectividad
- [ ] Orders recibe productsData desde App ✅
- [ ] Orders recibe stockData desde App ✅
- [ ] Orders recibe providers desde App ✅

### Filtro
- [ ] Al seleccionar proveedor, filtra productos ✅
- [ ] Muestra solo productos del proveedor ✅
- [ ] Coincide por nombre de proveedor ✅

### Stock
- [ ] Muestra Stock Actual de cada producto ✅
- [ ] Stock viene de stockData ✅
- [ ] Stock se actualiza cuando cambia en Inventario ✅

### Sugerencia
- [ ] Se calcula automáticamente ✅
- [ ] Fórmula: Stock Objetivo - Stock Actual ✅
- [ ] Nunca es negativo ✅

### Cantidad
- [ ] Pre-rellenado con sugerencia ✅
- [ ] Es editable ✅
- [ ] Valida números >= 0 ✅

### Totales
- [ ] Usa costo unitario (sin merma) ✅
- [ ] Total = Cantidad × Costo Unitario ✅
- [ ] Se recalcula al cambiar cantidad ✅

### Diseño
- [ ] Botones azul #206DDA ✅
- [ ] Fondo oscuro #111827 ✅
- [ ] Títulos font-black text-2xl ✅

### Funcionalidad
- [ ] Flujo completo sin errores ✅
- [ ] WhatsApp con datos correctos ✅
- [ ] Historial de pedidos se crea ✅

---

## 🐛 DEBUGGING

### Si no aparecen productos:
```javascript
// Verificar en Console:
console.log('Productos:', productsData);
console.log('Proveedor seleccionado:', selectedProvider);

// Verificar coincidencia:
productsData.filter(p => p.proveedor === selectedProvider.nombre)
// Si retorna [], el nombre del proveedor no coincide
```

### Si Stock no se actualiza:
```javascript
// Verificar localStorage:
JSON.parse(localStorage.getItem('inventariox_stock'))

// Verificar stockData en Pedidos:
console.log('Stock Data:', stockData);

// Requiere refrescar la página (F5)
```

### Si Total es incorrecto:
```javascript
// Verificar costo unitario:
console.log('Producto:', product);
console.log('Costo:', product.costo); // NO debe tener merma

// Verificar cálculo:
const total = cantidadPedir * costo;
// Debe ser número limpio (sin decimales)
```

---

## ✅ RESULTADOS ESPERADOS

### Tabla de Productos (Paso 2):
```
Producto          | Stock Actual | Sugerencia | Cantidad
LAPTOP DELL XPS   | 5            | 5          | [5]
MOUSE INALÁMBRICO | 3            | 2          | [2]
```

### Confirmación de Pedido (Paso 3):
```
Total: $2.500.000

Productos:
- LAPTOP DELL XPS × 3
  $2.400.000

- MOUSE INALÁMBRICO × 5
  $175.000
```

### Mensaje WhatsApp:
```
Hola DISTRIBUIDORA ABC, te adjunto el pedido de FODEXA:

- LAPTOP DELL XPS: 3 un.
- MOUSE INALÁMBRICO: 5 un.

Total: $2.575.000
```

---

## 🎓 TIPS PARA TESTING

1. **Usar Console:**
   - F12 → Console
   - Ver logs de datos
   - Verificar cálculos

2. **Usar Múltiples Pestañas:**
   - Cambiar datos en una pestaña
   - Verificar sincronización en otra
   - (Requiere refrescar)

3. **Probar Casos Extremos:**
   - Cantidad = 0
   - Proveedor sin productos
   - Stock negativo

4. **Verificar localStorage:**
   - F12 → Application → Local Storage
   - Ver inventariox_products
   - Ver inventariox_stock

---

## 📞 SOPORTE

Si algo no funciona:

1. **Verificar servidor:**
   - Terminal: `npm run dev`
   - Debe mostrar: "ready in XXX ms"

2. **Refrescar página:**
   - Presionar F5
   - Los datos deben persistir

3. **Limpiar localStorage:**
   - F12 → Application → Local Storage
   - Eliminar inventariox_products
   - Eliminar inventariox_stock
   - Refrescar (cargará datos por defecto)

4. **Ver errores:**
   - F12 → Console
   - Buscar errores rojos
   - Reportar exactamente qué dice

---

**Testing completado exitosamente cuando:**
- ✅ Todos los checks pasan
- ✅ No hay errores en consola
- ✅ Datos fluyen correctamente
- ✅ Totales son precisos
- ✅ WhatsApp abre con mensaje correcto

---

**Estimado de Testing:** 15-20 minutos completos
**Estimado de Testing Rápido:** 5 minutos
