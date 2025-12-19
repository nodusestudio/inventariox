# 🛠️ Guía de Desarrollo - Inventariox

## Estructura de Desarrollo

### Ambiente Local

**Requisitos:**
- Node.js 16.x o superior
- npm o yarn
- Navegador moderno (Chrome, Firefox, Safari, Edge)

**Instalación Inicial:**
```bash
cd inventariox
npm install
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

### Herramientas Utilizadas

```json
{
  "React": "18.2.0 - Framework UI",
  "Vite": "4.3.9 - Build tool rápido",
  "Tailwind CSS": "3.3.0 - Utility-first CSS",
  "Lucide React": "0.263.1 - Iconografía",
  "PostCSS": "8.4.24 - Procesamiento CSS",
  "Autoprefixer": "10.4.14 - Compatibilidad"
}
```

---

## 📂 Estructura de Carpetas

```
inventariox/
├── src/
│   ├── components/           # Componentes reutilizables
│   │   ├── Logo.jsx         # Logo SVG personalizado
│   │   ├── Navbar.jsx       # Barra de navegación
│   │   ├── MetricCard.jsx   # Tarjetas de métricas
│   │   └── TableContainer.jsx # Tablas
│   │
│   ├── pages/               # Páginas principales
│   │   ├── Dashboard.jsx    # Dashboard principal
│   │   ├── Inventory.jsx    # Gestión de inventario
│   │   ├── Providers.jsx    # Gestión de proveedores
│   │   ├── Orders.jsx       # Seguimiento de pedidos
│   │   └── Settings.jsx     # Panel de configuración
│   │
│   ├── utils/               # Funciones auxiliares
│   │   └── helpers.js       # Utilidades reutilizables
│   │
│   ├── App.jsx              # Componente raíz
│   ├── main.jsx             # Entrada de la app
│   └── index.css            # Estilos globales
│
├── public/                  # Archivos estáticos
├── node_modules/            # Dependencias (ignorado en git)
├── dist/                    # Build para producción
│
├── tailwind.config.js       # Configuración de Tailwind
├── vite.config.js           # Configuración de Vite
├── postcss.config.js        # Configuración de PostCSS
├── package.json             # Dependencias y scripts
├── .prettierrc               # Formato de código
├── .gitignore               # Archivos ignorados
├── README.md                # Documentación principal
├── GUIA_DE_USO.md           # Guía de usuario
└── GUIA_DE_DESARROLLO.md    # Este archivo
```

---

## 🎨 Guía de Estilos

### Colores Personalizados

Definidos en `tailwind.config.js`:

```javascript
colors: {
  primary: '#206DDA',      // Azul corporativo
  secondary: '#4CAF50',    // Verde vibrante
  'dark-bg': '#111827',    // Fondo oscuro
}
```

### Clases CSS Personalizadas

Definidas en `index.css`:

```css
.gradient-logo     /* Gradiente azul-verde para texto */
.tab-active        /* Pestaña activa en navbar */
.tab-inactive      /* Pestaña inactiva en navbar */
.metric-card       /* Estilo de tarjeta de métrica */
.table-row-hover   /* Efecto hover en tabla */
```

### Convenciones de Tailwind

```jsx
// Espaciado
p-6        // Padding 24px (estándar en tarjetas)
px-6       // Padding horizontal
py-4       // Padding vertical

// Bordes
border-gray-700    // Borde gris oscuro
rounded-lg         // Radio de esquina grande

// Colores de Fondo
bg-gray-800        // Gris oscuro para contenedores
bg-gray-900        // Gris muy oscuro para encabezados
bg-dark-bg         // Fondo general oscuro

// Sombras
shadow-lg          // Sombra grande
shadow-md          // Sombra mediana

// Transiciones
transition-colors  // Transición suave de colores
transition-all     // Todas las propiedades
duration-300       // Duración 300ms
```

---

## 🔧 Componentes Reutilizables

### 1. Logo Component

**Ubicación:** `src/components/Logo.jsx`

```jsx
import Logo from './components/Logo';

// Uso
<Logo size="md" />  // Tamaños: 'sm', 'md', 'lg'
```

**Props:**
- `size`: 'sm' | 'md' | 'lg' (default: 'md')

---

### 2. Navbar Component

**Ubicación:** `src/components/Navbar.jsx`

```jsx
import Navbar from './components/Navbar';

// Uso
<Navbar activeTab={activeTab} onTabChange={setActiveTab} />
```

**Props:**
- `activeTab`: string - Pestaña actual
- `onTabChange`: function - Callback al cambiar pestaña

---

### 3. MetricCard Component

**Ubicación:** `src/components/MetricCard.jsx`

```jsx
import MetricCard from './components/MetricCard';
import { Package } from 'lucide-react';

// Uso
<MetricCard
  title="Total de Productos"
  value={totalProducts}
  icon={Package}
  color="primary"
  trend={{ value: '+12%', positive: true }}
/>
```

**Props:**
- `title`: string - Título de la métrica
- `value`: number - Valor a mostrar
- `icon`: React.Component - Icono de lucide-react
- `color`: 'primary' | 'secondary' | 'warning' (default: 'primary')
- `trend`: object - { value: string, positive: boolean }

---

### 4. TableContainer Component

**Ubicación:** `src/components/TableContainer.jsx`

```jsx
import TableContainer from './components/TableContainer';

// Uso
<TableContainer
  columns={columns}
  data={data}
  onRowClick={(row) => console.log(row)}
/>
```

**Props:**
- `columns`: array - Definición de columnas
- `data`: array - Datos de filas
- `onRowClick`: function - Callback al hacer clic en fila

**Definición de Columnas:**
```jsx
const columns = [
  { 
    key: 'nombre', 
    label: 'Nombre' 
  },
  { 
    key: 'precio', 
    label: 'Precio',
    render: (value) => `$${value}`  // Renderizador personalizado
  }
];
```

---

## 📚 Funciones Auxiliares

**Ubicación:** `src/utils/helpers.js`

### Cálculo de Costo Real
```javascript
import { calculateCostReal } from './utils/helpers';

const costoReal = calculateCostReal(800, 2.5);  // $820.51
```

### Validación de Stock
```javascript
import { isLowStock } from './utils/helpers';

if (isLowStock(5, 10)) {
  console.log('Stock bajo!');
}
```

### Formateo de Moneda
```javascript
import { formatCurrency } from './utils/helpers';

const formatted = formatCurrency(1500.50);  // $1.500
```

### Exportar a CSV
```javascript
import { exportToCSV } from './utils/helpers';

exportToCSV(inventoryData, 'inventario.csv');
```

---

## 🔄 Flujo de Estado

### Estado Global (App.jsx)

```jsx
const [activeTab, setActiveTab] = useState('Dashboard');
const [inventoryData] = useState([...]);

// Componentes consumen el estado
<Navbar activeTab={activeTab} onTabChange={setActiveTab} />
```

### Estado Local (Componentes)

```jsx
const [searchTerm, setSearchTerm] = useState('');
const [theme, setTheme] = useState('dark');
```

---

## 📝 Convenciones de Código

### Nombrado de Componentes
```
PascalCase: Dashboard.jsx, MetricCard.jsx, Navbar.jsx
```

### Nombrado de Funciones
```javascript
camelCase: calculateCostReal, isLowStock, formatCurrency
```

### Nombrado de Variables
```javascript
camelCase: activeTab, inventoryData, searchTerm
```

### Nombrado de Clases CSS
```
kebab-case: tab-active, metric-card, table-row-hover
```

---

## 🧪 Testing (Futuro)

Se recomienda agregar testing con:
- **Jest** para unit tests
- **React Testing Library** para component tests
- **Cypress** para E2E tests

```bash
npm install --save-dev jest react-testing-library
```

---

## 📦 Build para Producción

### Crear Build
```bash
npm run build
```

**Output:** Carpeta `dist/` optimizada y lista para servir

### Verificar Build
```bash
npm run preview
```

### Servir en Producción
```bash
# Usando un servidor HTTP simple
npx serve -s dist

# O usar tu servidor favorito (Nginx, Apache, etc.)
```

---

## 🚀 Deploy

### Opciones Recomendadas

1. **Vercel**
   ```bash
   npm i -g vercel
   vercel
   ```

2. **Netlify**
   - Conectar repositorio GitHub
   - Branch a deployar: main
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **GitHub Pages**
   - Agregar base URL en `vite.config.js`
   - Crear workflow de CI/CD

---

## 🐛 Troubleshooting

### Puerto 3000 en uso
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3000
kill -9 <PID>
```

### Problemas con Tailwind
```bash
# Limpiar caché
rm -rf node_modules/.cache
npm run dev
```

### Errores de módulos
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Recursos

- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Lucide Icons](https://lucide.dev)

---

## 📋 Checklist de Features

### Phase 1 (Completado ✅)
- ✅ Estructura base de React
- ✅ Navegación con 5 pestañas
- ✅ Dashboard con métricas
- ✅ Gestión de inventario con cálculo de costo real
- ✅ Gestión de proveedores
- ✅ Seguimiento de pedidos
- ✅ Panel de configuración
- ✅ Logo personalizado
- ✅ Funciones auxiliares

### Phase 2 (Próximo)
- [ ] CRUD completo de productos
- [ ] Base de datos (Firebase)
- [ ] Autenticación de usuarios
- [ ] Tema claro funcional
- [ ] Traducción completa a inglés

### Phase 3 (Futuro)
- [ ] Reportes avanzados
- [ ] Exportar a Excel/PDF
- [ ] Gráficos de tendencias
- [ ] Notificaciones en tiempo real
- [ ] Aplicación móvil
- [ ] API REST

---

**Última actualización**: 18 de Diciembre, 2025  
**Versión**: 1.0.0  
**Mantenedor**: FODEXA Development Team
