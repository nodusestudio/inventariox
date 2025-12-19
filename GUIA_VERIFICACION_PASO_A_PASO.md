# ✅ Verificación Paso a Paso: Corrección Datos de Empresa

## Pre-requisitos
- Navegador actualizado (Chrome, Firefox, Safari, Edge)
- DevTools disponibles (F12)
- Acceso a InventarioX corriendo en localhost:3000

---

## 🎬 Scenario 1: Persistencia de Datos (Test Crítico #1)

### Paso 1: Abrir Configuración
1. Abre InventarioX en `http://localhost:3000`
2. Haz clic en pestaña **"Configuración"** (ícono de engranaje)
3. Deberías ver una sección "Datos de la Empresa" con valores actuales

### Paso 2: Editar Datos
1. Haz clic en botón **"Editar"**
2. Verás un formulario con 3 campos edibles:
   - **Nombre Empresa:** `Mi Empresa` (u otro valor)
   - **NIT/RUT:** `12.345.678-9`
   - **Dirección:** `Calle Principal 123, Ciudad`

3. Cambia los valores a:
   ```
   Nombre Empresa:  FODEXA LTDA
   NIT/RUT:         76.123.456-7
   Dirección:       Av. Providencia 2025, Piso 5, Santiago
   ```

### Paso 3: Guardar Cambios
1. Haz clic en botón **"Guardar"**
2. Deberías ver mensaje verde: "✓ Cambios guardados exitosamente"
3. El formulario se cierra y vuelves a la vista de lectura

### Paso 4: Verificar Guardado
1. Verifica que en la sección "Datos de la Empresa" aparezcan los nuevos valores:
   - ✅ Nombre: `FODEXA LTDA`
   - ✅ NIT: `76.123.456-7`
   - ✅ Dirección: `Av. Providencia 2025, Piso 5, Santiago`

### Paso 5: Recargar Página (PRUEBA CRÍTICA)
1. Presiona **F5** o **Ctrl+R** para recargar la página
2. **AGUARDA a que cargue completamente**
3. Haz clic en **Configuración** nuevamente
4. **VERIFICACIÓN CRÍTICA:**
   - ✅ Los datos DEBEN estar ahí
   - ✅ NO deben haber vuelto a "Mi Empresa"
   - ❌ Si desaparecieron = ERROR

**Resultado Esperado:** ✅ PASS - Datos persisten después del reload

---

## 💬 Scenario 2: Datos en Mensaje WhatsApp (Test Crítico #2)

### Paso 1: Preparación
- Asume que completaste el **Scenario 1** exitosamente
- Tendrías datos guardados: FODEXA LTDA / Av. Providencia 2025

### Paso 2: Ir a Pedidos
1. Haz clic en pestaña **"Pedidos"**
2. Verás un listado de pedidos (probablemente vacío)
3. Haz clic en botón **"+ Nuevo Pedido"**

### Paso 3: Seleccionar Proveedor
1. Selecciona cualquier proveedor, ej. **"DISTRIBUIDORA ABC"**
2. Haz clic en **"Continuar"**

### Paso 4: Seleccionar Productos
1. Verás lista de productos disponibles del proveedor
2. Selecciona al menos 2 productos y establece cantidades:
   - [ ] LAPTOP DELL XPS: **2**
   - [ ] MONITOR LG 27": **1**
3. Haz clic en **"Continuar a Confirmación"**

### Paso 5: Confirmación
1. Revisa el resumen del pedido
2. Verifica que haya al menos 1 producto con cantidad > 0
3. Haz clic en **"Enviar por WhatsApp"**

### Paso 6: Capturar el Mensaje
1. Se abrirá WhatsApp Web (o tu cliente de WhatsApp)
2. Verás un mensaje pre-redactado para el proveedor

### Paso 7: VERIFICACIÓN CRÍTICA - Contenido del Mensaje
**DEBE contener:**

```
✅ Saludo al proveedor:
   "Hola DISTRIBUIDORA ABC, ..."

✅ Nombre de la empresa:
   "... te adjunto el pedido de FODEXA LTDA:..."

✅ Dirección de la empresa:
   "Direccion: Av. Providencia 2025, Piso 5, Santiago"

✅ Lista de productos:
   "- LAPTOP DELL XPS: 2 un.
    - MONITOR LG 27": 1 un."

✅ Cierre profesional:
   "Me confirmas por favor y el total, gracias"
```

**Mensaje Completo Esperado:**
```
Hola DISTRIBUIDORA ABC, te adjunto el pedido de FODEXA LTDA:
Direccion: Av. Providencia 2025, Piso 5, Santiago

- LAPTOP DELL XPS: 2 un.
- MONITOR LG 27": 1 un.

Me confirmas por favor y el total, gracias
```

**Resultado Esperado:** ✅ PASS - Mensaje contiene nombre y dirección

**Si FALTA la dirección:**
```
❌ FAIL - Hola DISTRIBUIDORA ABC, te adjunto el pedido de FODEXA LTDA:
(FALTA: Direccion: Av. Providencia 2025...)
```

---

## 💾 Scenario 3: Verificar localStorage (Test Técnico)

### Paso 1: Abrir DevTools
1. Presiona **F12** para abrir Developer Tools
2. Deberías ver paneles: Console, Elements, Network, Application, etc.

### Paso 2: Ir a Storage
1. Haz clic en pestaña **"Application"** (o "Storage" en Firefox)
2. En el menú izquierdo, busca **"Local Storage"**
3. Expande Local Storage

### Paso 3: Seleccionar Origen
1. Haz clic en `http://localhost:3000` (o similar)
2. Verás lista de keys guardadas en localStorage

### Paso 4: Buscar fodexa_settings
1. Busca la clave: **`fodexa_settings`**
2. Haz clic para expandir

### Paso 5: VERIFICACIÓN - Contenido JSON
**Debes ver algo como:**

```json
{
  "nombreEmpresa": "FODEXA LTDA",
  "nitRut": "76.123.456-7",
  "direccion": "Av. Providencia 2025, Piso 5, Santiago"
}
```

**Verificación:**
- ✅ La clave existe: `fodexa_settings`
- ✅ Contiene JSON válido
- ✅ `nombreEmpresa` = "FODEXA LTDA"
- ✅ `direccion` = "Av. Providencia 2025, Piso 5, Santiago"

**Resultado Esperado:** ✅ PASS - localStorage correcto

---

## 🔄 Scenario 4: Sincronización Entre Secciones (Test Avanzado)

### Paso 1: Tener datos guardados
- Asume que completaste Scenario 1 exitosamente
- Datos guardados: FODEXA LTDA / Av. Providencia 2025

### Paso 2: Cambiar en Configuración
1. Ir a **Configuración**
2. Haz clic en **"Editar"**
3. Cambia nombre a: **"EMPRESA TEST V2"**
4. Guarda cambios
5. Verifica que aparezca actualizado

### Paso 3: Ir a Pedidos (sin reload)
1. Haz clic en pestaña **"Pedidos"**
2. Crea nuevo pedido y sigue hasta confirmación
3. Envía por WhatsApp

### Paso 4: VERIFICACIÓN - Mensaje Reflejará Cambio
**El mensaje DEBE tener:**
```
"... te adjunto el pedido de EMPRESA TEST V2:..."
```

**NO debe tener:**
```
"... te adjunto el pedido de FODEXA LTDA:..."
```

**Resultado Esperado:** ✅ PASS - Sincronización automática

---

## 🛑 Troubleshooting

### Problema: "Datos no persisten después de F5"

**Diagnóstico:**
1. Abre DevTools (F12)
2. Ve a Application → Local Storage
3. ¿Existe la clave `fodexa_settings`?

**Solución:**
```javascript
// En DevTools Console, ejecuta:
localStorage.clear()

// Luego recarga:
location.reload()

// Y vuelve a guardar datos en Configuración
```

---

### Problema: "No aparece la dirección en el mensaje WhatsApp"

**Diagnóstico:**
1. Ve a DevTools → Application → Local Storage
2. Haz clic en `fodexa_settings`
3. ¿Tiene la propiedad `direccion`?
4. ¿Tiene valor?

**Posibles Causas:**
- [ ] Guardaste en Configuración pero la dirección estaba vacía
- [ ] Usaste un navegador/dispositivo diferente (localStorage es por dominio)
- [ ] El campo `direccion` se dejó en blanco

**Solución:**
```
1. Ve a Configuración
2. Haz clic en Editar
3. Completa la dirección: "Av. Providencia 2025, Piso 5, Santiago"
4. Guarda cambios
5. Vuelve a crear un pedido
6. Verifica el mensaje
```

---

### Problema: "Los datos se ven en localStorage pero no en Configuración"

**Solución:**
```javascript
// En DevTools Console:
localStorage.getItem('fodexa_settings')

// Debería imprimir algo como:
// {"nombreEmpresa":"FODEXA LTDA","nitRut":"76.123.456-7","direccion":"..."}

// Si está vacío o incorrecto:
localStorage.removeItem('fodexa_settings')
location.reload()
```

---

## ✅ Checklist de Validación Final

Después de completar los 4 scenarios, marca estos:

- [ ] **Scenario 1 PASS:** Datos persisten después de F5
- [ ] **Scenario 2 PASS:** Dirección aparece en mensaje WhatsApp
- [ ] **Scenario 3 PASS:** localStorage tiene clave `fodexa_settings` con datos correctos
- [ ] **Scenario 4 PASS:** Cambios en Configuración se reflejan en Pedidos sin reload
- [ ] **NO hay errores en DevTools Console** (F12 → Console tab)
- [ ] **App compila sin warnings:** `npm run build` sale limpio

---

## 📊 Resultados Esperados Finales

| Test | Status | Evidencia |
|------|--------|-----------|
| Persistencia | ✅ PASS | Datos aparecen después de F5 |
| WhatsApp | ✅ PASS | Mensaje incluye nombre y dirección |
| localStorage | ✅ PASS | Clave `fodexa_settings` tiene JSON |
| Sincronización | ✅ PASS | Cambios reflejados sin reload |
| Compilación | ✅ PASS | `npm run build` sin errores |

---

## 🎯 En Caso de Fallos

Si algún test falla, proporciona:

1. **Screenshot del error** (si hay)
2. **Contenido de localStorage:** 
   ```javascript
   // Copia/pega esto en DevTools Console:
   console.log(localStorage.getItem('fodexa_settings'))
   ```
3. **Error en DevTools Console:** (si lo hay)
4. **Pasos exactos para reproducir**

---

## 📞 Contacto/Soporte

Archivo de referencia técnica: `CORRECCION_DATOS_EMPRESA_PEDIDOS.md`

---

**Test Created:** 19/12/2025  
**Version:** 1.0.0  
**Status:** Ready for Testing ✅
