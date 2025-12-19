```
╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║              ✨ INVENTARIOX v1.0.0 - QUICK START ✨              ║
║                                                                    ║
║          Aplicación de Gestión de Inventario - React + Tailwind  ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
```

# 🚀 INICIO RÁPIDO

## 1️⃣ Instalación (Primera vez)

```bash
# Navegar a la carpeta del proyecto
cd c:\Users\Usuario\Desktop\programas\inventariox

# Instalar todas las dependencias
npm install

# Esperar a que termine la instalación...
# (Esto descargará React, Tailwind, Vite, etc.)
```

## 2️⃣ Ejecutar en Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# La aplicación abrirá automáticamente en:
# → http://localhost:3000

# Verás mensajes en consola:
# VITE v4.3.9 ready in 1234 ms
# Local: http://localhost:3000
```

## 3️⃣ Navegar por la Aplicación

### Pestañas Principales (Navbar)
1. **Dashboard** - Métricas principales y resumen
2. **Inventario** - Lista de productos con cálculo de costo real
3. **Proveedores** - Gestión de proveedores
4. **Pedidos** - Seguimiento de órdenes
5. **Configuración** - Datos empresa, tema e idioma ⭐ NUEVO

### Panel de Configuración ⭐
- Completa los datos de tu empresa
- Cambia entre Modo Oscuro y Claro
- Selecciona idioma (Español/Inglés)
- Haz clic en "Guardar Cambios"

## 4️⃣ Build para Producción

```bash
# Crear versión optimizada
npm run build

# Carpeta "dist" se generará automáticamente
# Archivos listos para servir en producción
```

---

# 📋 LO QUE DEBES SABER

## ✅ Ya Implementado
- ✅ Logo SVG personalizado con gradiente
- ✅ 5 pestañas de navegación
- ✅ Dashboard con métricas
- ✅ Tabla de inventario con Costo Real
- ✅ Panel de Configuración completo
- ✅ Toggle de Tema Oscuro/Claro
- ✅ Selector de Idioma
- ✅ Almacenamiento en localStorage
- ✅ Componentes reutilizables
- ✅ Funciones auxiliares

## 🔧 Datos de Demostración Incluidos
- 6 productos de ejemplo
- 3 proveedores
- 3 pedidos con estados diferentes

## 📂 Carpetas Importantes
```
src/
├── components/    ← Componentes reutilizables (Logo, Navbar, etc)
├── pages/         ← Páginas principales (Dashboard, Inventory, etc)
├── utils/         ← Funciones auxiliares para cálculos
├── App.jsx        ← Componente principal
└── index.css      ← Estilos globales
```

---

# 🎨 COLORES Y ESTILOS

**Colores Corporativos:**
- 🔵 Primario (Azul): `#206DDA`
- 🟢 Secundario (Verde): `#4CAF50`
- ⬛ Fondo Oscuro: `#111827`

**Clases Tailwind Personalizadas:**
- `.tab-active` - Pestaña activa (azul)
- `.metric-card` - Tarjeta de métrica
- `.table-row-hover` - Efecto hover en tabla

---

# 📊 FÓRMULA: COSTO REAL

La app calcula automáticamente el Costo Real considerando la merma:

```
Costo Real = Costo Base / (1 - %Merma/100)
```

**Ejemplo:**
- Costo Base: $800
- Merma: 2.5%
- Costo Real = 800 / (1 - 0.025) = **$820.51**

Ves esto en la tabla de Inventario en la columna "Costo Real"

---

# 🆘 TROUBLESHOOTING

### Error: "Port 3000 is already in use"
```bash
# El puerto está ocupado, matar el proceso:
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Error: "Module not found"
```bash
# Reinstalar dependencias:
rm -rf node_modules package-lock.json
npm install
```

### Cambios no se ven en navegador
```bash
# Limpiar caché:
Ctrl + Shift + Delete
# Luego recarga la página: F5
```

---

# 📚 DOCUMENTACIÓN

Incluida en el proyecto:
- **README.md** - Documentación técnica completa
- **GUIA_DE_USO.md** - Manual de usuario detallado
- **GUIA_DE_DESARROLLO.md** - Guía para developers
- **EJEMPLOS_DE_USO.md** - Casos de uso y patrones
- **RESUMEN_FINAL.md** - Resumen de todos los cambios

---

# 🔑 CARACTERÍSTICAS PRINCIPALES

1. **Logo Personalizado** 
   - SVG con gradiente azul-verde
   - Símbolo X elegante
   - 3 tamaños (sm, md, lg)

2. **Panel de Configuración** ⭐
   - Datos de la empresa
   - Toggle de tema
   - Selector de idioma
   - Botón guardar cambios

3. **Gestión de Inventario**
   - Búsqueda en tiempo real
   - Cálculo de costo real automático
   - Tabla con hover effects

4. **Componentes Reutilizables**
   - Logo.jsx
   - Navbar.jsx
   - MetricCard.jsx
   - TableContainer.jsx

5. **Funciones Auxiliares**
   - Cálculos de costo
   - Validaciones
   - Formateo de datos
   - Exportación CSV

---

# 🎯 SIGUIENTES PASOS

1. Explora todas las páginas
2. Prueba el panel de Configuración
3. Revisa cómo se calcula el Costo Real
4. Prueba el toggle de tema (oscuro/claro)
5. Lee la documentación para entender mejor

---

# 💡 TIPS

- Usa F12 para abrir DevTools y ver Console
- Los datos se guardan en localStorage (F12 → Application)
- Cambio de tema se aplica instantáneamente
- El logo tiene un hover effect (prueba pasando mouse)

---

# 📞 SOPORTE

Si encuentras problemas:
1. Verifica que npm install se completó bien
2. Asegúrate de que el puerto 3000 esté libre
3. Limpia el caché del navegador
4. Revisa la consola en F12 para errores
5. Lee las guías incluidas en el proyecto

---

# ✨ ¡LISTO PARA USAR!

Tu aplicación Inventariox está lista. 

**Para iniciar:**
```bash
cd c:\Users\Usuario\Desktop\programas\inventariox
npm run dev
```

¡Disfruta! 🚀

---

**Versión**: 1.0.0  
**Última actualización**: 18 de Diciembre, 2025  
**Desarrollado por**: FODEXA Development Team
