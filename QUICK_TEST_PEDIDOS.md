# ⚡ QUICK TEST - Ajustes de Pedidos

## 🚀 Inicio Rápido (5 minutos)

```bash
# Ejecuta el servidor
npm run dev

# Abre en navegador (usualmente localhost:5173)
```

---

## ✅ Checklist de Pruebas (5 minutos cada una)

### Test 1: Botón Eliminar (2 min)
**¿Funciona?** ✓ / ✗

```
1. Crea un nuevo pedido (cualquier proveedor, 1-2 productos)
2. Localiza la tarjeta del pedido
3. Click en botón Eliminar (X rojo en esquina)
4. Modal: "¿Estás seguro de eliminar este pedido?"
5. Click en "Eliminar" (confirmar)
6. Resultado esperado: Tarjeta desaparece inmediatamente
7. Recarga la página (F5)
8. Resultado esperado: Pedido NO aparece (localStorage persistió)
```

**Si NO funciona:**
- [ ] Abre Console (F12 > Console)
- [ ] ¿Hay error rojo? Cópialo
- [ ] ¿El modal aparece? ✓ / ✗
- [ ] ¿Desaparece la tarjeta? ✓ / ✗

---

### Test 2: WhatsApp CON Número (3 min)
**¿Funciona?** ✓ / ✗

**Paso previo: Verificar proveedor**
```javascript
// En browser console:
JSON.parse(localStorage.getItem('inventariox_providers'))
// O si está en props de App.jsx, busca el array "providers"
// Verifica que tenga "whatsapp: '56912345678'" (o similar)
```

```
1. Crea pedido con un proveedor que TIENE número WhatsApp
   Ejemplo: "DISTRIBUIDORA ABC" (si tiene whatsapp en datos)
2. Localiza la tarjeta
3. Click en botón WhatsApp (verde con icono de chat)
4. Resultado esperado:
   - Nueva pestaña se abre
   - URL: https://wa.me/56912345678?text=...
   - Pre-llena el chat de WhatsApp con el mensaje
5. Verifica que el mensaje incluya:
   - ID del pedido
   - Nombre del proveedor
   - Productos y cantidades
   - Fecha
   - Total
```

**Si NO funciona:**
- [ ] Verifica que el proveedor tenga whatsapp registrado
- [ ] ¿Se abre nueva pestaña? ✓ / ✗
- [ ] ¿Dice "https://wa.me/" en URL? ✓ / ✗

---

### Test 3: WhatsApp SIN Número (3 min)
**¿Funciona?** ✓ / ✗

```
1. Crea pedido con un proveedor que NO TIENE número WhatsApp
   Ejemplo: Proveedor cualquiera sin whatsapp registrado
2. Localiza la tarjeta
3. Click en botón WhatsApp (verde con icono de chat)
4. Resultado esperado:
   - Alerta: "Mensaje copiado al portapapeles"
   - NO se abre WhatsApp (sin número)
5. Abre un editor de texto (Notepad, Word, etc.)
6. Ctrl+V (pegar)
7. Resultado esperado: Aparece el mensaje formateado
```

**Mensaje esperado:**
```
Hola, le escribo respecto al pedido: PED-1736432800000

Proveedor: NOMBRE_PROVEEDOR
Fecha: 9 ene. 2024

Productos:
• PRODUCTO 1: 5 unidades
• PRODUCTO 2: 3 unidades

Total: $4,750,000

Gracias!
```

**Si NO funciona:**
- [ ] ¿Aparece alerta? ✓ / ✗
- [ ] ¿Se copia al portapapeles? (Ctrl+V) ✓ / ✗
- [ ] ¿Formato es correcto? ✓ / ✗

---

### Test 4: Estado "Recibido" Visual (2 min)
**¿Funciona?** ✓ / ✗

```
1. Localiza un pedido en estado "Pendiente"
   (Debe mostrar "⏳ Pendiente")
2. Click botón "Recibir Mercancía" (azul)
3. Modal: "¿Recibir esta mercancía?"
4. Click "Sí, recibir"
5. Resultado esperado:
   ✓ Tarjeta cambia visualmente:
     - Borde VERDE (no gris)
     - Sombra verde alrededor
     - Fondo ligeramente verde (light mode)
   ✓ Badge "✓ RECIBIDO" en esquina superior derecha (blanco sobre verde)
   ✓ Botón "Recibir Mercancía" desaparece
   ✓ Botón "WhatsApp" sigue visible (verde)
   ✓ Estado cambia a "✓ Recibido"
```

**Si NO funciona:**
- [ ] ¿Tarjeta cambia de borde? ✓ / ✗
- [ ] ¿Aparece badge "✓ RECIBIDO"? ✓ / ✗
- [ ] ¿Botón "Recibir" desaparece? ✓ / ✗
- [ ] ¿Botón "WhatsApp" sigue ahí? ✓ / ✗

---

### Test 5: WhatsApp después de "Recibido" (2 min)
**¿Funciona?** ✓ / ✗

```
1. De un pedido que ya está "Recibido"
2. Click en botón "WhatsApp"
3. Resultado esperado:
   - Si tiene número: Se abre WhatsApp
   - Si no tiene número: Se copia al portapapeles
4. Esto permite reenviar comprobantes o información
```

**Si NO funciona:**
- [ ] ¿Botón está disponible? ✓ / ✗
- [ ] ¿Ejecuta la acción? ✓ / ✗

---

## 🎯 Reporte Rápido

### Estado General
```
Botón Eliminar:          ✓ / ✗
WhatsApp con número:     ✓ / ✗
WhatsApp sin número:     ✓ / ✗
Visual Recibido:         ✓ / ✗
WhatsApp en Recibido:    ✓ / ✗
```

### Errores Encontrados
```
[  ] Error de compilación (F12 > Console)
[  ] Botón no funciona
[  ] WhatsApp no abre
[  ] Mensaje mal formateado
[  ] Visual no cambia
[  ] localStorage no persiste
[  ] Otro: _________________
```

---

## 📱 Responsive (Bonus)

En móvil, verifica:
```
[ ] Botones apilados correctamente (flex)
[ ] Badge posicionado bien
[ ] Tarjetas adaptan tamaño
[ ] Estilos se ven correctos
```

---

## 🐛 Debugging Si Algo Falla

### Abre la Console (F12)
```javascript
// Ver todos los pedidos
JSON.parse(localStorage.getItem('inventariox_orders'))

// Ver proveedores
JSON.parse(localStorage.getItem('inventariox_providers'))
// O: console.log(providers) si está en props

// Ver si una función existe
typeof handleDeleteOrder // "function"
typeof getProviderPhone  // "function"
```

### Verifica el HTML (F12 > Inspector)
```html
<!-- Busca el botón WhatsApp -->
<button class="... bg-green-600 ...">
  <svg...>MessageCircle</svg>
  WhatsApp
</button>

<!-- Busca el badge de Recibido -->
<div class="... bg-green-500 ...">✓ RECIBIDO</div>
```

---

## ✨ Resumen (Tiempos)

| Test | Duración | Estado |
|------|----------|--------|
| Eliminar | 2 min | ✓ / ✗ |
| WhatsApp (con #) | 3 min | ✓ / ✗ |
| WhatsApp (sin #) | 3 min | ✓ / ✗ |
| Visual Recibido | 2 min | ✓ / ✗ |
| WhatsApp Recibido | 2 min | ✓ / ✗ |
| **TOTAL** | **12 min** | - |

---

## 🎉 Si TODO Funciona

```
✅ Todos los botones funcionan
✅ WhatsApp abre correctamente
✅ Visual de Recibido es correcto
✅ localStorage persiste cambios
✅ Sin errores en console
✅ Responsive se ve bien

👉 LISTO PARA PRODUCCIÓN
```

---

**Nota**: Si encuentras algún problema, anota:
- Qué test falló
- Qué error aparece
- En qué navegador
- Screenshot si es posible

¡Gracias por testear! 🙌
