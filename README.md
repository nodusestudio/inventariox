# Inventariox - Gestión de Inventario

Aplicación profesional de gestión de inventario construida con React y Tailwind CSS. Diseño idéntico a AliadoX con colores corporativos, componentes reutilizables y funcionalidades avanzadas.

## 🎨 Identidad Visual

- **Color Primario**: #206DDA (Azul corporativo)
- **Color Secundario**: #4CAF50 (Verde vibrante)
- **Fondo Dark Mode**: #111827 (Gris oscuro profesional)
- **Fondo Light Mode**: #F9FAFB (Blanco cálido)
- **Logo**: SVG personalizado con gradiente azul-verde y símbolo X elegante

## ✨ Características Principales

### 1. Dashboard Interactivo
- Métricas clave en tiempo real
- Total de productos
- Productos con stock bajo
- Pedidos pendientes
- Tabla de productos recientes con hover effect

### 2. Gestión de Inventario Completa
- **Campos**: Nombre, Proveedor, Unidad, Stock Actual, Stock Mínimo, % Merma
- **Cálculo Automático**: Costo Real = `Costo / (1 - %Merma/100)`
- Búsqueda en tiempo real
- Filtrado por nombre o proveedor
- Acciones de editar/eliminar por fila

### 3. Gestión de Proveedores
- Lista completa de proveedores
- Información de contacto
- Búsqueda y filtrado

### 4. Seguimiento de Pedidos
- Estados: Entregado, Pendiente, En Tránsito
- Badges de color para estados
- Información de fecha y total

### 5. Panel de Configuración 🔧
- **Datos de la Empresa**: Nombre, NIT/RUT, Dirección
- **Preferencias de Interfaz**: 
  - Toggle de Modo Oscuro/Claro
  - Selector de Idioma (Español/Inglés)
- **Resumen de Estado**: Información sincronizada y estado actual
- **Información de App**: Versión, actualización, estado y licencia

### 6. Componentes Reutilizables
- **Logo**: Componente personalizable con gradiente
- **Navbar**: Barra sticky con navegación y perfil
- **MetricCard**: Tarjetas de métricas con iconos
- **TableContainer**: Tablas con hover y acciones

## 📁 Estructura del Proyecto

```
inventariox/
├── src/
│   ├── components/
│   │   ├── Logo.jsx           # Logo SVG personalizado
│   │   ├── Navbar.jsx         # Barra de navegación
│   │   ├── MetricCard.jsx     # Tarjetas de métricas
│   │   └── TableContainer.jsx # Contenedor de tablas
│   ├── pages/
│   │   ├── Dashboard.jsx      # Página principal
│   │   ├── Inventory.jsx      # Gestión de inventario
│   │   ├── Providers.jsx      # Gestión de proveedores
│   │   ├── Orders.jsx         # Seguimiento de pedidos
│   │   └── Settings.jsx       # Configuración de app
│   ├── utils/
│   │   └── helpers.js         # Funciones auxiliares
│   ├── App.jsx                # Componente principal
│   ├── main.jsx               # Punto de entrada
│   └── index.css              # Estilos globales
├── tailwind.config.js         # Configuración de Tailwind
├── vite.config.js             # Configuración de Vite
├── postcss.config.js          # Configuración PostCSS
├── package.json               # Dependencias
├── .prettierrc                 # Formato de código
├── .gitignore                  # Archivos ignorados
└── index.html                 # HTML principal
```

## 🚀 Instalación y Uso

### Instalación
```bash
# Navegar al proyecto
cd c:\Users\Usuario\Desktop\programas\inventariox

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Build para producción
npm run build
```

### URLs
- **Desarrollo**: http://localhost:3000
- **Producción**: Ejecutar `npm run build` y servir la carpeta `dist/`

## 📚 Utilidades Disponibles

El proyecto incluye funciones auxiliares en `src/utils/helpers.js`:

- `calculateCostReal(costo, merma)` - Calcula costo real considerando merma
- `isLowStock(actual, minimo)` - Verifica si stock es bajo
- `getStockPercentage(actual, minimo)` - Calcula % de stock
- `formatCurrency(value)` - Formatea a moneda CLP
- `formatDate(date)` - Formatea fechas
- `calculateTotalInventoryValue(items)` - Valor total del inventario
- `exportToCSV(data)` - Exporta datos a CSV
- `validateNITRUT(value)` - Valida NIT/RUT

## 🎯 Fórmula de Costo Real

La aplicación calcula automáticamente el costo considerando la merma:

```
Costo Real = Costo / (1 - %Merma/100)
```

**Ejemplo**: Costo $100 con merma 5%
- Costo Real = 100 / (1 - 0.05) = 100 / 0.95 = **$105.26**

## 🛠️ Dependencias

- **React** 18.2.0 - Framework UI
- **Vite** 4.3.9 - Build tool (rápido y moderno)
- **Tailwind CSS** 3.3.0 - Framework CSS utility-first
- **Lucide React** 0.263.1 - Iconos SVG
- **PostCSS** - Procesamiento CSS
- **Autoprefixer** - Compatibilidad de navegadores

## 📋 Nuevas Características Añadidas (v1.0.0)

✅ **Logo Personalizado** - SVG con gradiente azul-verde
✅ **Panel de Configuración** - Gestión completa de preferencias
✅ **Datos de Empresa** - Campos para información corporativa
✅ **Toggle de Tema** - Cambio entre Modo Oscuro y Claro
✅ **Selector de Idioma** - Español e Inglés
✅ **Resumen de Estado** - Panel informativo sincronizado
✅ **Utilidades** - Funciones auxiliares para cálculos
✅ **Coherencia de Estilos** - Espaciado p-6 y sombras consistentes

## 🔮 Próximas Mejoras

- [ ] Implementar tema claro completamente funcional
- [ ] Traducción completa a inglés
- [ ] Agregar funcionalidad CRUD completa (crear/editar/eliminar)
- [ ] Integrar base de datos (Firebase o similar)
- [ ] Autenticación de usuarios
- [ ] Reportes avanzados y estadísticas
- [ ] Exportar datos a Excel/PDF
- [ ] Notificaciones de stock bajo
- [ ] Sincronización en tiempo real
- [ ] Aplicación móvil responsiva mejorada

## 📄 Licencia

Proyecto privado - Todos los derechos reservados (FODEXA)

---

**Desarrollado por**: Equipo de Desarrollo FODEXA  
**Última actualización**: 18 de Diciembre, 2025  
**Versión**: 1.0.0

## Licencia

Proyecto privado - Todos los derechos reservados
