# 📖 Guía de Uso - Inventariox

## Tabla de Contenidos
1. [Navegación Básica](#navegación-básica)
2. [Dashboard](#dashboard)
3. [Inventario](#inventario)
4. [Proveedores](#proveedores)
5. [Pedidos](#pedidos)
6. [Configuración](#configuración)
7. [Fórmulas y Cálculos](#fórmulas-y-cálculos)

---

## 🧭 Navegación Básica

### Barra Superior (Navbar)
- **Logo Inventariox**: Clic para volver al Dashboard (puede agregarse funcionalidad)
- **Pestañas Principales**: Dashboard | Inventario | Proveedores | Pedidos | Configuración
- **Estado Activo**: La pestaña actual se muestra en azul (#206DDA) con sombra
- **Perfil de Usuario**: Círculo con gradiente en la esquina superior derecha

### Colores de Interfaz
- **Primario (Azul)**: #206DDA - Botones principales, pestañas activas
- **Secundario (Verde)**: #4CAF50 - Información positiva, stocks correctos
- **Fondo Oscuro**: #111827 - Fondo general de la aplicación
- **Gris Oscuro**: #111827 - Tarjetas y contenedores

---

## 📊 Dashboard

### Métricas Principales
Visualiza tres métricas clave en tarjetas:

1. **Total de Productos**
   - Muestra cantidad total de productos registrados
   - Incluye tendencia (+12% en el ejemplo)

2. **Stock Bajo**
   - Cantidad de productos con stock por debajo del mínimo
   - Alerta visual en rojo

3. **Pedidos Pendientes**
   - Número de pedidos en estado "Pendiente"
   - Información en verde

### Tabla de Productos Recientes
- Muestra los primeros 5 productos del inventario
- Columnas: Nombre, Proveedor, Stock Actual, Stock Mínimo
- Efecto hover en las filas
- Clic en fila para ver detalles (función a implementar)

---

## 📦 Inventario

### Búsqueda y Filtrado
- **Barra de Búsqueda**: Filtra por nombre de producto o proveedor
- **Búsqueda en Tiempo Real**: Los resultados se actualizan mientras escribes
- **Botón Agregar Producto**: Abre modal para crear nuevo producto (a implementar)

### Columnas de la Tabla

| Columna | Descripción |
|---------|-------------|
| Nombre | Nombre del producto |
| Proveedor | Empresa que suministra el producto |
| Unidad | Unidad de medida (Unidades, Metros, Tubos, etc.) |
| Stock Actual | Cantidad actual en inventario |
| Stock Mínimo | Cantidad mínima recomendada |
| % Merma | Porcentaje de merma (pérdida/deterioro) |
| Costo Real | Costo calculado con merma incluida |
| Acciones | Editar o eliminar producto |

### Cálculo Automático: Costo Real
```
Costo Real = Costo / (1 - %Merma/100)
```

**Ejemplo de Cálculo:**
- Producto: Laptop Dell XPS
- Costo Base: $800
- % Merma: 2.5%
- Cálculo: 800 / (1 - 0.025) = 800 / 0.975 = **$820.51**

### Acciones por Producto
- **Editar**: Icono lápiz (azul) - Abre formulario de edición
- **Eliminar**: Icono papelera (rojo) - Elimina el producto

---

## 👥 Proveedores

### Información de Proveedores
Cada proveedor contiene:
- **Nombre**: Nombre comercial del proveedor
- **Contacto**: Nombre de persona de contacto
- **Email**: Correo electrónico
- **Teléfono**: Número de teléfono con código de país

### Búsqueda de Proveedores
- Filtra por nombre de proveedor o contacto
- Búsqueda en tiempo real
- Botón "Nuevo Proveedor" para agregar

### Acciones
- **Editar**: Modificar información del proveedor
- **Eliminar**: Remover proveedor del sistema

---

## 📋 Pedidos

### Estados de Pedidos
1. **Entregado** (Verde)
   - Pedido completamente recibido
   - Inventario actualizado

2. **Pendiente** (Amarillo)
   - Pedido aún no procesado
   - Requiere acción

3. **En Tránsito** (Azul)
   - Pedido en camino
   - Seguimiento activo

### Información por Pedido
- Número de Pedido (ej: PED-001)
- Nombre del Proveedor
- Fecha del Pedido
- Estado (con badge de color)
- Monto Total

### Búsqueda
- Filtra por número de pedido o nombre de proveedor
- Botón "Nuevo Pedido" para crear orden

---

## ⚙️ Configuración

### Panel de Datos de la Empresa

#### Campos a Completar:
1. **Nombre de la Empresa** (Requerido)
   - Nombre comercial o legal de tu empresa

2. **NIT / RUT** (Requerido)
   - Número de identificación tributaria
   - Formatos válidos: 
     - Colombia: 10-12 dígitos (NIT)
     - Chile: XX.XXX.XXX-X (RUT)

3. **Dirección** (Requerido)
   - Dirección completa de la empresa
   - Puede incluir múltiples líneas

### Preferencias de Interfaz

#### Toggle de Tema
- **Modo Oscuro**: Fondo #111827 (por defecto)
- **Modo Claro**: Fondo #F9FAFB
- Cambia toda la interfaz instantáneamente
- Se guarda automáticamente

#### Selector de Idioma
- **Español**: Interfaz completa en español
- **Inglés**: Interfaz en inglés (traducción pendiente)
- Cambio instantáneo
- Se guarda en preferencias

### Información de la Aplicación
Muestra detalles sobre Inventariox:
- **Versión**: 1.0.0
- **Última Actualización**: Fecha de última versión
- **Estado**: ✓ Activo
- **Licencia**: Privada (FODEXA)

### Guardar Cambios
- **Botón Azul "Guardar Cambios"**: Guarda todos los cambios
- Mensaje de éxito al completar
- Datos se guardan en localStorage
- Sincronización con servidor (futuro)

---

## 📐 Fórmulas y Cálculos

### 1. Costo Real Considerando Merma

**Fórmula:**
```
Costo Real = Costo Base / (1 - %Merma/100)
```

**Propósito:** Calcular el precio de costo real considerando la pérdida por merma

**Interpretación:**
- Si no hay merma (0%), Costo Real = Costo Base
- A mayor merma, mayor será el Costo Real
- Evita pérdidas financieras por productos dañados

**Ejemplos:**

| Costo | Merma | Cálculo | Resultado |
|-------|-------|---------|-----------|
| $100 | 0% | 100 / 1.00 | $100.00 |
| $100 | 2.5% | 100 / 0.975 | $102.56 |
| $100 | 5% | 100 / 0.95 | $105.26 |
| $100 | 10% | 100 / 0.90 | $111.11 |
| $250 | 1% | 250 / 0.99 | $252.53 |
| $800 | 2.5% | 800 / 0.975 | $820.51 |

### 2. Porcentaje de Stock

**Fórmula:**
```
% Stock = (Stock Actual / Stock Mínimo) × 100
```

**Propósito:** Determinar qué tan cerca estamos del stock mínimo

**Interpretación:**
- < 50%: Stock muy bajo, pedir urgente
- 50-100%: Stock bajo, considerar pedido
- > 100%: Stock seguro

### 3. Valor Total del Inventario

**Fórmula:**
```
Valor Total = ∑(Costo Real × Stock Actual) para cada producto
```

**Propósito:** Conocer el valor monetario total del inventario

---

## 💡 Consejos de Uso

### Optimización de Inventario
1. Revisar regularmente productos con stock bajo
2. Actualizar % de merma según experiencia real
3. Verificar precios de proveedores periódicamente
4. Mantener registros precisos de entradas/salidas

### Mejor Gestión de Proveedores
1. Tener contactos actualizados
2. Comparar precios entre proveedores
3. Registrar tiempos de entrega
4. Evaluar calidad de productos

### Control de Pedidos
1. Crear pedidos antes de que falte stock
2. Hacer seguimiento regularmente
3. Documentar problemas o demoras
4. Confirmar entrega en el sistema

---

## 🔐 Privacidad y Seguridad

- Los datos se guardan en tu navegador (localStorage)
- Se recomienda usar contraseña en el dispositivo
- Próximamente: Sincronización segura con servidor
- Próximamente: Autenticación de usuarios

---

## ❓ Preguntas Frecuentes

**P: ¿Cómo cambio la información de mi empresa?**
R: Ve a Configuración > Datos de la Empresa, edita los campos y haz clic en "Guardar Cambios"

**P: ¿Se pierden mis datos si limpio el caché del navegador?**
R: Sí, porque actualmente se guardan en localStorage. Pronto habrá sincronización en servidor.

**P: ¿Cómo se calcula el Costo Real?**
R: Usamos la fórmula Costo / (1 - %Merma) para considerar pérdidas por deterioro.

**P: ¿Puedo cambiar entre Modo Oscuro y Claro?**
R: Sí, en Configuración > Preferencias de Interfaz > Toggle de Tema

**P: ¿Soporta otros idiomas?**
R: Actualmente solo Español. Inglés está en desarrollo.

---

**Última actualización**: 18 de Diciembre, 2025  
**Versión**: 1.0.0
