# 🚀 QUICK START - Prueba v2.2.1

## Inicio Rápido

```bash
# 1. Navega a la carpeta del proyecto
cd c:\Users\Usuario\Desktop\programas\inventariox

# 2. Inicia el servidor de desarrollo
npm run dev

# 3. Abre en navegador (usualmente http://localhost:5173)
```

---

## ✅ Checklist de Pruebas Rápidas

### Settings - Tema 🌙☀️

**Paso 1: Cambiar Tema**
1. Click en pestaña "⚙️ Configuración" (Navbar)
2. Mira la tarjeta de "Preferencias" (lado derecho)
3. Localiza el toggle "🌙 Tema: Oscuro"
4. Haz click en el toggle
5. Debe cambiar a "☀️ Tema: Claro" y la UI se vuelve clara
6. Click de nuevo → Vuelve a Oscuro

**Resultado esperado**:
```
✅ Toggle visibilia Moon/Sun
✅ Texto cambia Oscuro ↔ Claro
✅ UI cambia Light ↔ Dark
✅ Estado mostrado en tarjeta
```

**Validar localStorage**:
```javascript
// En console del navegador:
localStorage.getItem('inventariox_theme')
// Debe mostrar: "dark" o "light"
```

---

### Settings - Idioma 🌐

**Paso 2: Cambiar Idioma**
1. En la tarjeta de "Preferencias"
2. Localiza el selector "🌐 Idioma"
3. Click en dropdown
4. Selecciona "🇺🇸 English"
5. Debe cambiar a English
6. Selecciona "🇪🇸 Español" → Vuelve a español

**Resultado esperado**:
```
✅ Dropdown visible
✅ Opciones: ES y EN con banderas
✅ Selección se refleja
✅ Texto en interfaz cambia (si hay traducc.)
```

**Validar localStorage**:
```javascript
// En console:
localStorage.getItem('inventariox_language')
// Debe mostrar: "es" o "en"
```

---

### Settings - Guardar Cambios 💾

**Paso 3: Guardar Cambios**
1. En Preferencias, cambia Tema a Light
2. Cambia Idioma a English
3. Mira el estado → "✓ Sincronizado"
4. Si hay botón "Guardar Todo", haz click
5. Cierra la aplicación completamente
6. Reabre el navegador y vuelve a Settings
7. El tema debe estar Light y idioma English

**Resultado esperado**:
```
✅ Estado "✓ Sincronizado" aparece
✅ Cambios persisten después de recargar
✅ localStorage contiene los valores guardados
```

---

### Settings - Editar Perfil 👤

**Paso 4: Editar Datos del Establecimiento**
1. En la tarjeta de "Perfil de Empresa"
2. Click en botón "Editar" (azul)
3. Cambia los campos:
   - Nombre del Establecimiento: "Mi Tienda 2024"
   - Nombre del Responsable: "Tu Nombre"
   - Ubicación: "Nueva dirección"
4. Click en "Guardar"
5. Vuelve a vista de lectura
6. Verifica que los datos nuevos aparezcan
7. Recarga la página
8. Los datos deben persistir

**Resultado esperado**:
```
✅ Click "Editar" cambia a formulario
✅ Campos editables (inputs y textarea)
✅ Click "Guardar" guarda y vuelve a lectura
✅ Datos nuevos muestran en vista lectura
✅ localStorage actualizado
```

---

### Orders - Crear Nuevo Pedido 📦

**Paso 5: Crear un Nuevo Pedido**
1. Click en pestaña "📦 Pedidos" (Navbar)
2. Click en botón azul "Nuevo" en la barra superior
3. Se abre un formulario "Crear Nuevo Pedido"
4. **Selector de Proveedor**:
   - Click en dropdown "Seleccionar Proveedor"
   - Elige un proveedor (ej: "DISTRIBUIDORA ABC")
5. **Agregar Productos**:
   - Abajo aparece "Agregar Productos"
   - Click en botones de productos (ej: "LAPTOP DELL XPS")
   - El botón se vuelve azul (seleccionado)
6. **Cantidad**:
   - Los productos aparecen en la tabla "Productos a Pedir"
   - Cambia la cantidad (ej: 5 unidades)
   - El total se calcula automáticamente
7. **Agregar más productos**:
   - Puedes agregar más de uno
   - Cada uno tiene cantidad editable
8. **Crear Pedido**:
   - Revisa el total en amarillo
   - Click en botón "✓ Crear Pedido"

**Resultado esperado**:
```
✅ Formulario se abre cuando click "Nuevo"
✅ Dropdown de proveedores funciona
✅ Grid de productos visible y clickeable
✅ Productos seleccionados resaltados en azul
✅ Tabla de items muestra seleccionados
✅ Cantidades editables (input numérico)
✅ Total se calcula automáticamente
✅ Botón "Crear Pedido" está habilitado
✅ Pedido se agrega a la lista (tarjeta nueva)
```

**Validar nuevo pedido**:
```javascript
// En console:
JSON.parse(localStorage.getItem('inventariox_orders'))
// Debe mostrar array con nuevo pedido:
// [{ id: "PED-...", proveedor: "...", estado: "Pendiente", ...}]
```

---

### Orders - Recibir Mercancía ✓

**Paso 6: Recibir Pedido**
1. En la lista de pedidos, mira las tarjetas
2. Localiza un pedido con estado "⏳ Pendiente"
3. Click en botón azul "✓ Recibir Mercancía"
4. Aparece modal de confirmación
5. Click en "Sí, recibir"
6. El estado cambia a "✓ Recibido" (en verde)

**Resultado esperado**:
```
✅ Botón "Recibir Mercancía" visible en pedidos
✅ Modal de confirmación aparece
✅ Estado cambia a "✓ Recibido"
✅ Stock en Inventory.jsx se actualiza
✅ localStorage.inventariox_stock updated
```

**Validar stock actualizado**:
```javascript
// En console:
JSON.parse(localStorage.getItem('inventariox_stock'))
// Los productos del pedido recibido deben tener mayor cantidad
```

---

### Validación Final 🎯

**Paso 7: Validación Cross-Component**

1. **Crea un pedido** en Orders
2. **Marca como Recibido** en Orders
3. **Ve a Inventario** (Stock)
4. **Busca los productos** del pedido
5. **Verifica stock actualizado** (cantidad aumentó)

**Resultado esperado**:
```
✅ Stock en Inventory mostró aumento correcto
✅ Cambios persisten entre páginas
✅ localStorage sincronizado
```

---

## 🔍 Debugging Tips

Si algo no funciona:

### Console Errors
```javascript
// Abre browser console (F12)
// Busca mensajes rojo en "Console" tab
// Si hay errores, cópialo en un archivo
```

### localStorage Check
```javascript
// En browser console:
console.log(JSON.stringify(localStorage, null, 2))
// Busca: inventariox_theme, inventariox_language, inventariox_orders
```

### React DevTools
```javascript
// Si tienes React DevTools extensión
// Busca componentes "Settings" y "Orders"
// Verifica props: theme, setTheme, language, setLanguage
```

### Browser Cache
```javascript
// Si no ves cambios después de editar:
1. Hard refresh: Ctrl+Shift+R (o Cmd+Shift+R en Mac)
2. Clear localStorage: localStorage.clear() en console
3. Cierra y reabre navegador
```

---

## 📋 Reporte de Pruebas

Después de probar, crea un archivo `TEST_REPORT_v2.2.1.md` con:

```markdown
# Reporte de Pruebas v2.2.1

## Fecha: [HOY]
## Navegador: [Chrome/Firefox/Safari/Edge]
## Sistema: Windows/Mac/Linux

### ✅ Pruebas Completadas

- [x] Settings - Theme toggle funciona
- [x] Settings - Language selector funciona
- [x] Settings - Profile edit funciona
- [x] Settings - Guardar cambios funciona
- [x] Settings - localStorage persiste
- [x] Orders - "Nuevo" button abre formulario
- [x] Orders - Crear pedido funciona
- [x] Orders - Recibir mercancía funciona
- [x] Orders - Stock se actualiza

### ❌ Problemas Encontrados

(Si hay alguno, descríbelo aquí)

### 📊 Resultado Final

ESTADO: [LISTO / REQUIERE AJUSTES]
```

---

## 🎉 ¡Listo!

Si todas las pruebas pasan:

```
✅ SETTINGS.JSX - FUNCIONAL
✅ ORDERS.JSX - FUNCIONAL
✅ INTEGRACIÓN APP.JSX - FUNCIONAL
✅ VERSIÓN v2.2.1 - LISTA PARA PRODUCCIÓN
```

---

**Duración estimada**: 10-15 minutos
**Dificultad**: ⭐☆☆ (Muy fácil - solo clicks)
**Requisitos**: Navegador + Proyecto corriendo
