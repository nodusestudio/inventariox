# Documentación Técnica - Migración a Sidebar

## Estructura de Carpetas Actualizada

```
inventariox/
├── src/
│   ├── App.jsx                 [ACTUALIZADO] Estructura flexbox con Sidebar
│   ├── index.css              [ACTUALIZADO] Estilos unificados
│   ├── components/
│   │   ├── Sidebar.jsx        [NUEVO] Menú lateral izquierdo
│   │   ├── Navbar.jsx         [DEPRECADO] Ya no se utiliza
│   │   ├── Logo.jsx
│   │   ├── MetricCard.jsx
│   │   └── TableContainer.jsx [ACTUALIZADO] Colores unificados
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Inventory.jsx
│   │   ├── Stock.jsx
│   │   ├── Providers.jsx
│   │   ├── Orders.jsx
│   │   ├── Settings.jsx
│   │   └── Database.jsx
│   └── utils/
│       ├── helpers.js
│       └── translations.js
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── index.html
```

## Cambios en App.jsx

### Layout Principal
```jsx
// ANTES:
<div className="min-h-screen w-full">
  <Navbar />
  <div className="max-w-7xl mx-auto">{content}</div>
</div>

// AHORA:
<div className="min-h-screen w-full flex">
  <Sidebar />
  <div className="flex-1 overflow-auto">
    <div className="p-4 md:p-6">{content}</div>
  </div>
</div>
```

### Imports Actualizados
```jsx
// ANTES:
import Navbar from './components/Navbar';

// AHORA:
import Sidebar from './components/Sidebar';
```

## Componente Sidebar.jsx

### Props
```jsx
{
  activeTab: string,      // Pestaña activa actual
  onTabChange: function,  // Callback para cambiar pestaña
  language: string        // Idioma actual ('es' o 'en')
}
```

### Features
- ✅ 7 opciones de navegación con iconos
- ✅ Responsive: fijo en desktop, colapsable en móvil
- ✅ Soporte para light/dark mode
- ✅ Soporte para múltiples idiomas
- ✅ Avatar de usuario en footer
- ✅ Transiciones suaves (300ms)

### Estados Manejados
```jsx
const [sidebarOpen, setSidebarOpen] = useState(false);
// true: Sidebar visible en móvil
// false: Sidebar oculto en móvil
```

## Estilos Principales

### Sidebar Container
```css
.sidebar {
  width: 256px;          /* w-64 */
  background: #1f2937;   /* Gris oscuro */
  border-right: 1px solid #374151;
  position: fixed;       /* Desktop */
  position: absolute;    /* Mobile (con overlay) */
  height: 100vh;
  z-index: 40;
}
```

### Button Active State
```css
.sidebar-nav button.active {
  background: #206DDA;   /* Azul marca */
  color: white;
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.2);
}
```

### Mobile Responsive
```css
/* Móvil: Hidden por defecto */
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);  /* Oculto */
    transition: transform 300ms;
  }
  
  .sidebar.open {
    transform: translateX(0);      /* Visible */
  }
  
  .overlay {
    display: block;                /* Overlay visible */
  }
}

/* Desktop: Siempre visible */
@media (min-width: 768px) {
  .sidebar {
    transform: translateX(0);      /* Siempre visible */
    position: static;
  }
  
  .overlay {
    display: none;                 /* Overlay oculto */
  }
}
```

## Color Palette (Unificada)

```javascript
const colors = {
  // Fondo
  background: '#111827',      // Fondo principal (negro azulado)
  card: '#1f2937',            // Fondo tarjetas/sidebar (gris oscuro)
  
  // Bordes
  border: '#374151',          // Bordes normales
  borderHover: '#475569',     // Bordes en hover
  
  // Interacción
  primary: '#206DDA',         // Botón activo (azul marca)
  secondary: '#3b82f6',       // Hover states
  
  // Texto
  textPrimary: '#ffffff',     // Texto principal
  textSecondary: '#d1d5db',   // Texto secundario
  textMuted: '#9ca3af',       // Texto atenuado
  
  // Estados
  success: '#10b981',         // Verde
  warning: '#f59e0b',         // Naranja
  error: '#ef4444',           // Rojo
};
```

## LocalStorage Schema

```javascript
{
  'fodexa_settings': {
    nombreEmpresa: string,
    nitRut: string,
    direccion: string
  },
  'inventariox_providers': [
    { id, nombre, contacto, email, whatsapp }
  ],
  'inventariox_products': [
    { id, nombre, proveedor, proveedorId, unidad, contenidoEmpaque, merma, costo }
  ],
  'inventariox_stock': [
    { id, productoId, stockActual, stockMinimo, stockCompra }
  ],
  'inventariox_orders': [
    { ... }
  ]
}
```

## Funciones Clave

### loadFromLocalStorage(key, defaultValue)
```javascript
// Carga segura desde localStorage
// Retorna defaultValue si no existe o hay error
const data = loadFromLocalStorage('key', DEFAULT_VALUE);
```

### saveToLocalStorage(key, value)
```javascript
// Guarda segura en localStorage
// No rompe la app si falla
saveToLocalStorage('key', value);
```

## Flujo de Navegación

```
Usuario hace click
      ↓
Sidebar detecta onClick
      ↓
onTabChange(tabName)
      ↓
setActiveTab(tabName)
      ↓
renderContent() evalúa switch(activeTab)
      ↓
Renderiza componente de página correspondiente
```

## Testing Checklist

- [ ] Sidebar visible en escritorio
- [ ] Hamburguesa funcional en móvil
- [ ] Click en opción cambia pestaña
- [ ] Opción activa se resalta en azul
- [ ] Overlay aparece al abrir en móvil
- [ ] Sidebar se cierra al seleccionar en móvil
- [ ] localStorage persiste datos
- [ ] Temas light/dark funcionan
- [ ] Idiomas cambian correctamente
- [ ] Responsive en 320px, 768px, 1024px

## Migraciones Futuras

Si necesitas hacer más cambios visuales:

1. **Cambiar colores**: Edita `colors` en Sidebar.jsx y index.css
2. **Agregar más opciones**: Añade objeto en array `tabs`
3. **Cambiar ancho sidebar**: Modifica `w-64` en className
4. **Agregar más iconos**: Importa de `lucide-react`

## Incompatibilidades Conocidas

- ✅ Navbar.jsx ya no se utiliza (puede eliminarse)
- ✅ Todos los componentes de página funcionan igual
- ✅ No hay breaking changes en las funciones

## Backward Compatibility

- ✅ Todos los datos de localStorage se preservan
- ✅ Funcionalidades siguen siendo las mismas
- ✅ Estados de tema e idioma se mantienen
- ✅ Componentes de página sin cambios

---

**Última actualización:** Diciembre 2024  
**Versión:** 2.0  
**Estatus:** Producción
