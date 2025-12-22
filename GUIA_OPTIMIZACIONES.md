# 🚀 Guía Rápida - Optimizaciones en InventarioX

## 1️⃣ Buscador en Tiempo Real

### Usar el buscador
1. **Abre la pestaña "Inventario"**
2. **Ve al buscador** (con icono de lupa 🔍)
3. **Escribe parte del nombre** del producto
4. El inventario se filtra **mientras escribes**

### Limpiar búsqueda
- Haz clic en la **X** a la derecha del buscador
- O elimina todo el texto

### Combinar filtros
- Puedes usar **Buscador + Filtro de Proveedores** al mismo tiempo
- Resultado: productos que coinciden con AMBOS criterios

### Información de resultados
- Ves cuántos productos se encontraron (ej: "3 productos encontrados")
- Si no hay resultados, muestra "No se encontraron productos"

---

## 2️⃣ Motivos de Salida Rápidos

### Registrar una salida con motivo
1. **Abre "Inventario"**
2. **Busca el producto** que quieres reducir
3. **Presiona el botón ROJO (-)** en "Acciones Rápidas"
4. **Se abre modal de motivo**

### Seleccionar motivo
Elige uno de estos 3 motivos:

| Motivo | Uso | Color |
|--------|-----|-------|
| **Venta** 💰 | Producto vendido a cliente | Azul |
| **Desecho** 🗑️ | Producto defectuoso/expirado | Amarillo |
| **Ajuste** 🔧 | Corrección de inventario | Púrpura |

5. **Se abre modal de cantidad**
6. **Ingresa cuántas unidades** salen
7. **Presiona "Confirmar"**

### Resultado
- ✅ Stock se reduce automáticamente
- ✅ Motivo se registra en "Movimientos"
- ✅ Puedes ver el historial en cualquier momento

---

## 3️⃣ Columna Valor Stock

### Qué es
Una nueva columna en la tabla de "Inventario" que muestra:

**Valor Stock = Stock Actual × Costo Unitario**

### Ejemplo
```
Producto: Laptop
Stock Actual: 5 unidades
Costo Unitario: $50,000
─────────────────────────
Valor Stock: $250,000
```

### Para qué sirve
- 📊 Ver cuánto dinero tienes invertido en cada producto
- 🎯 Identificar productos con mayor valor en inventario
- 📈 Tomar decisiones sobre reorden y prioridades

### Beneficios
- Toma de decisiones más rápida
- Control financiero del inventario
- Visualización clara de inversión

---

## 4️⃣ Cierre Automático de Sidebar (Móvil)

### Qué cambió
Cuando accedes desde un **teléfono o tablet**:
- Al seleccionar una pestaña, el sidebar se **cierra automáticamente**
- No necesitas cerrar manualmente el menú

### Beneficio
- ⚡ Experiencia más fluida
- 📱 Más espacio en pantalla para el contenido
- 🎯 Menos clics necesarios

---

## 📊 Ver Motivos en Movimientos

### Visualizar historial con motivos
1. **Abre la pestaña "Movimientos"**
2. **Filtra por "Salidas"** (botón rojo ↓)
3. **Nueva columna "Motivo"** muestra por qué salió

### Código de colores en Movimientos
- 🔵 Azul = Venta
- 🟡 Amarillo = Desecho
- 🟣 Púrpura = Ajuste

### Ejemplo de registro
```
Producto: Mouse
Tipo: Salida ↓
Cantidad: -2
Motivo: Venta
─────────────────────────
El sistema sabe que 2 mouses se vendieron
```

---

## ⚡ Flujo Completo de Ejemplo

### Escenario: Vender 3 Laptops

**Paso 1: Ir a Inventario**
```
Pestaña: Inventario ✓
```

**Paso 2: Buscar producto**
```
Buscador: "Laptop"
Resultado: Laptop - Stock: 10
```

**Paso 3: Presionar botón de salida**
```
Botón ROJO (-) en Acciones Rápidas
```

**Paso 4: Seleccionar motivo**
```
Modal: "¿Motivo de Salida?"
Selecciona: VENTA ✓
```

**Paso 5: Ingresar cantidad**
```
¿Cuántas unidades salieron?
Ingresa: 3
Presiona: Confirmar
```

**Resultado Automático:**
✅ Stock de Laptop: 10 → 7  
✅ Registro en Movimientos con motivo "Venta"  
✅ Valor Stock actualizado a 7 × $50,000 = $350,000  

---

## 🎯 Atajos y Tips

### Buscador más rápido
- 💡 Busca por nombre o primera letra
- 💡 Combina con filtro de proveedor
- 💡 Usa la X para limpiar rápidamente

### Salidas más rápidas
- 💡 Selecciona el motivo correcto desde el inicio
- 💡 Los 3 botones (Venta/Desecho/Ajuste) son siempre los mismos
- 💡 Ingresa cantidad directamente sin letra

### Auditoría
- 💡 Revisa "Movimientos" para ver historial completo
- 💡 Filtra por tipo (Entrada/Salida)
- 💡 Busca por producto (próxima feature)

---

## ❓ Preguntas Frecuentes

**P: ¿Puedo cambiar el motivo después?**  
R: No, pero puedes eliminar el movimiento y crear uno nuevo.

**P: ¿El buscador es case-sensitive?**  
R: No, puedes escribir en mayúscula o minúscula.

**P: ¿Qué pasa si no selecciono motivo?**  
R: El modal no permite continuar sin seleccionar, está obligatorio.

**P: ¿Se guardan los datos en la nube?**  
R: Por ahora todo se guarda localmente en tu navegador (localStorage).

**P: ¿Puedo exportar movimientos?**  
R: No por ahora, pero es una feature planeada.

---

## 📞 Soporte

Si encuentras algún problema:
1. Recarga la página (F5)
2. Limpia el caché (Ctrl + Shift + Delete)
3. Verifica que el navegador esté actualizado

---

**Última Actualización:** 2024  
**Versión:** 2.1.0 (Optimizada)  
**Estado:** ✅ Funcional
