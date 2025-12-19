# Plan de Pruebas: Sincronización de Datos de Empresa en Pedidos

## Estado: ✅ COMPLETADO

---

## Checklist de Correcciones Aplicadas

### 1. App.jsx
- [x] Creada constante `DEFAULT_COMPANY` con valores por defecto estandarizados
- [x] Implementado estado `companyDataState` con localStorage `fodexa_settings`
- [x] Creada función wrapper `setCompanyData()` que guarda automáticamente
- [x] Agregado `useEffect` para sincronización adicional de localStorage
- [x] Prop `companyData` pasada a Orders.jsx (no solo `companyName`)
- [x] Props `companyData` y `setCompanyData` pasadas a Settings.jsx
- [x] Clave localStorage standarizada: `fodexa_settings`

### 2. Settings.jsx
- [x] Props actualizado para recibir `companyData` y `setCompanyData`
- [x] Inicialización con valores de `companyData` en lugar de valores hardcoded
- [x] Agregado `useEffect` para sincronizar con cambios desde App.jsx
- [x] Función `handleSave()` actualizada para llamar `setCompanyData()`
- [x] localStorage.setItem actualizado a clave `fodexa_settings`
- [x] Inputs estandarizados: `nombreEmpresa`, `nitRut`, `direccion`

### 3. Orders.jsx
- [x] Props actualizado para recibir `companyData` como objeto (no solo `companyName`)
- [x] Función `generateWhatsAppMessage()` extraer `companyData.nombreEmpresa`
- [x] Función `generateWhatsAppMessage()` extraer `companyData.direccion`
- [x] Dirección incluida en el mensaje de WhatsApp
- [x] Manejo de fallback cuando companyData está vacío

### 4. Build y Compilación
- [x] `npm run build` compiló sin errores
- [x] 1263 módulos transformados correctamente
- [x] No hay warnings o errores de compilación
- [x] Archivos generados en dist/ correctamente

---

## Test Cases

### Test 1: Persistencia Básica en Configuración

**Pasos:**
1. Abrir aplicación en navegador
2. Ir a pestaña **Configuración**
3. Hacer clic en botón "Editar"
4. Cambiar valores:
   - Nombre Empresa: `FODEXA LTDA`
   - NIT/RUT: `76.123.456-7`
   - Dirección: `Av. Providencia 2025, Piso 5, Santiago`
5. Guardar cambios
6. **Recargar página (F5)**
7. Verificar que los valores persisten

**Resultado Esperado:**
- ✅ Los datos se muestran en Configuración después del reload

---

### Test 2: Sincronización entre Configuración y Pedidos

**Pasos:**
1. Completar Test 1 (tener datos configurados)
2. Ir a pestaña **Pedidos**
3. Crear nuevo pedido:
   - Seleccionar un proveedor
   - Seleccionar al menos 1 producto
   - Establecer cantidad > 0
4. Ir a paso "Confirmar"
5. Presionar botón "Enviar por WhatsApp"
6. **Capturar el mensaje que se genera**

**Resultado Esperado:**
- ✅ El mensaje contiene:
  - `Hola [PROVEEDOR], te adjunto el pedido de FODEXA LTDA:`
  - `Direccion: Av. Providencia 2025, Piso 5, Santiago`
  - Lista de productos
  - Solicitud de confirmación

**Ejemplo de Mensaje Esperado:**
```
Hola DISTRIBUIDORA ABC, te adjunto el pedido de FODEXA LTDA:
Direccion: Av. Providencia 2025, Piso 5, Santiago

- LAPTOP DELL XPS: 2 un.
- MONITOR LG 27": 1 un.

Me confirmas por favor y el total, gracias
```

---

### Test 3: localStorage Verification

**Pasos:**
1. Abrir DevTools (F12)
2. Ir a pestaña **Application**
3. En menu izquierdo: **Local Storage → http://localhost:3000** (o similar)
4. Buscar clave `fodexa_settings`
5. Hacer clic para expandir

**Resultado Esperado:**
```json
{
  "nombreEmpresa": "FODEXA LTDA",
  "nitRut": "76.123.456-7",
  "direccion": "Av. Providencia 2025, Piso 5, Santiago"
}
```

---

### Test 4: Múltiples Cambios y Sincronización

**Pasos:**
1. Ir a **Configuración**
2. Editar nombre empresa a `EMPRESA TEST V1`
3. Guardar
4. Ir a **Pedidos**, crear un pedido (sin enviarlo)
5. Volver a **Configuración**
6. Cambiar nombre a `EMPRESA TEST V2`
7. Guardar
8. Volver a **Pedidos**
9. Ver el pedido sin enviar
10. Ir a confirmación
11. Presionar "Enviar por WhatsApp"

**Resultado Esperado:**
- ✅ El mensaje refleja el nombre `EMPRESA TEST V2` (la última versión)
- ✅ La sincronización es automática

---

### Test 5: Datos Vacíos y Fallback

**Pasos:**
1. Limpiar localStorage: Abrir DevTools console y ejecutar:
   ```javascript
   localStorage.removeItem('fodexa_settings');
   ```
2. Recargar página
3. Ir a **Pedidos**
4. Crear nuevo pedido y ver el mensaje

**Resultado Esperado:**
- ✅ Usa valor por defecto: `Mi Empresa`
- ✅ No hay errores en consola
- ✅ La aplicación sigue funcionando

---

## Validación de Nombres de Campos

### Settings.jsx (Inputs)
```jsx
<input name="nombreEmpresa" ... />   // Usado en Orders
<input name="nitRut" ... />          // Disponible en companyData
<textarea name="direccion" ... />    // Usado en Orders
```

### Orders.jsx (Acceso a Datos)
```jsx
companyData.nombreEmpresa   // ← Nombre de la empresa
companyData.direccion       // ← Dirección de la empresa
```

**Validación:**
- ✅ Nombres estandarizados
- ✅ Sin conflictos entre componentes
- ✅ Sigue Manual de Identidad FODEXA

---

## Verificación de localStorage Keys

| Clave | Propósito | Status |
|-------|-----------|--------|
| `fodexa_settings` | Datos de empresa | ✅ Actualizado |
| `inventariox_providers` | Proveedores | ✅ Existente |
| `inventariox_orders` | Pedidos | ✅ Existente |
| `inventariox_products` | Productos | ✅ Existente |
| `inventariox_stock` | Stock | ✅ Existente |

---

## Logs de Compilación

```
✅ Build Status: SUCCESS

> inventariox@1.0.0 build
> vite build

vite v4.5.14 building for production...
✓ 1263 modules transformed.
dist/index.html                   1.00 kB │ gzip:  0.47 kB
dist/assets/index-8bbe075b.css   31.24 kB │ gzip:  5.39 kB
dist/assets/index-a0ec53a5.js   235.79 kB │ gzip: 63.32 kB
✓ built in 8.40s

No errors | No warnings
```

---

## Checklist de Validación Final

- [x] App.jsx: Persistencia global con useEffect
- [x] Settings.jsx: Sincronización con App.jsx
- [x] Orders.jsx: Recepción y uso de companyData
- [x] Mensaje WhatsApp: Incluye nombre y dirección
- [x] localStorage: Clave `fodexa_settings` funciona
- [x] Build: Sin errores
- [x] Props: Paso correcto entre componentes
- [x] Fallbacks: Manejo de datos ausentes
- [x] Documentación: Creada y completa

---

## Próximos Pasos (Opcionales)

1. **Agregar más campos a Settings:** Email, teléfono, etc.
2. **Incluir QR con datos de empresa** en pedidos
3. **Exportar pedidos** como PDF con datos de empresa
4. **Sincronizar con servidor** para backup en la nube

---

## Soporte

Si encuentras problemas:

1. **Datos no persisten:**
   - Verificar que localStorage no esté deshabilitado
   - Limpiar con `localStorage.clear()` en console

2. **Dirección no aparece en WhatsApp:**
   - Verificar que `companyData` tiene `direccion`
   - Revisar console.log('companyData:', companyData)

3. **Build fallido:**
   - Ejecutar: `npm install`
   - Luego: `npm run build`

---

**Última actualización:** 19/12/2025
**Versión:** 1.0.0
**Estado:** ✅ PRODUCCIÓN
