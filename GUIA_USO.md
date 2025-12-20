# Guía de Uso - InventarioX con Sidebar

## 🎯 Cómo Usar la Nueva Interfaz

### Navegación en Escritorio
- El **Sidebar** está siempre visible en la izquierda
- Haz clic en cualquier opción para navegar
- El botón activo se resalta en **azul (#206DDA)**

### Navegación en Móvil
1. Haz clic en el **botón hamburguesa** (☰) en la esquina superior izquierda
2. Se abre el sidebar con un overlay oscuro
3. Selecciona la opción deseada
4. El sidebar se cierra automáticamente

## 📊 Opciones del Menú

| Ícono | Nombre | Función |
|-------|--------|---------|
| 📊 | **Panel** | Dashboard con métricas principales |
| 👥 | **Proveedores** | Gestión de proveedores |
| 📦 | **Productos** | Catálogo de productos |
| 📈 | **Inventario** | Control de stock |
| 🛒 | **Pedidos** | Gestión de órdenes |
| 💾 | **Base de Datos** | Exportar/Importar datos |
| ⚙️ | **Configuración** | Temas, idioma, empresa |

## 🎨 Personalización

### Cambiar Tema
1. Ve a **Configuración** (⚙️)
2. Selecciona entre **Dark Mode** o **Light Mode**
3. La preferencia se guarda automáticamente

### Cambiar Idioma
1. Ve a **Configuración** (⚙️)
2. Elige entre **Español** o **English**
3. La interfaz se actualiza al instante

## 💾 Datos Automáticos

Todos los datos se guardan automáticamente:
- **Proveedores** - En tiempo real
- **Productos** - Cambios inmediatos
- **Stock** - Actualización automática
- **Pedidos** - Guardado al crear
- **Empresa** - Datos de configuración

> Los datos persisten incluso si cierras el navegador

## 🔄 Exportar/Importar Datos

Usa la pestaña **Base de Datos** para:
- Exportar todos los datos (Proveedores, Productos, Stock, Pedidos)
- Importar datos desde un JSON previo
- Respaldar tu información

## 🚀 Consejos de Uso

1. **Añade proveedores primero** - Necesarios para crear productos
2. **Crea productos** - Define código, nombre, costo
3. **Gestiona stock** - Establece mínimos y máximos
4. **Crea pedidos** - Cuando necesites reabastecer

## ❓ Preguntas Frecuentes

**¿Dónde están mis datos?**
- En el navegador, localStorage. No se envían a servidores.

**¿Puedo usar en móvil?**
- Sí, la interfaz es completamente responsiva.

**¿Se sincroniza entre dispositivos?**
- No, cada dispositivo tiene sus propios datos locales.

**¿Cómo respaldo mis datos?**
- Ve a Base de Datos y usa "Descargar Datos"

**¿Qué pasa si limpio cookies?**
- Los datos se perderán. Exporta primero en Base de Datos.

## 🎓 Tutoriales Básicos

### Crear un Proveedor
1. Ve a **Proveedores** (👥)
2. Haz clic en "Añadir Proveedor"
3. Completa: Nombre, Contacto, Email, WhatsApp
4. Guarda

### Crear un Producto
1. Ve a **Productos** (📦)
2. Haz clic en "Añadir Producto"
3. Completa: Nombre, Proveedor, Unidad, Costo
4. Guarda automáticamente

### Controlar Stock
1. Ve a **Inventario** (📈)
2. Ajusta Stock Actual, Mínimo y de Compra
3. El sistema alerta si el stock es bajo
4. Se guarda al cambiar

---

**Versión:** 2.0 (Sidebar)  
**Última actualización:** Diciembre 2024
