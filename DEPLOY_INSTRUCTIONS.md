# 🚀 INSTRUCCIONES DE DESPLIEGUE - InventarioX v2.1.0

## ✅ Pre-Despliegue

### Verificaciones Finales
- [x] Compilación exitosa (`npm run build`)
- [x] Sin errores en console
- [x] Todas las features probadas
- [x] Documentación completa
- [x] Testing completado

### Build Status
```
✓ 1265 módulos transformados
✓ Tiempo: 8.67s
✓ CSS: 43.95 kB (gzip: 6.72 kB)
✓ JS: 252.47 kB (gzip: 69.54 kB)
✓ Tamaño total: 1.08 MB
✓ Errores: NINGUNO
```

---

## 📦 Archivos Listos para Desplegar

### En Carpeta `dist/`
```
dist/
├─ index.html (1.00 kB)
├─ assets/
│  ├─ index-47da6b9f.css (43.95 kB)
│  └─ index-aa8b62e7.js (252.47 kB)
└─ favicon.ico
```

### Cómo Desplegar

#### Opción 1: Servidor Web Estático
```bash
# Copiar carpeta dist/ a tu servidor web
# Ejemplo: Apache, Nginx, GitHub Pages, Netlify, Vercel

cp -r dist/* /ruta/servidor/inventariox/
```

#### Opción 2: GitHub Pages
```bash
# Si tienes repositorio en GitHub
git add .
git commit -m "Optimización v2.1.0"
git push origin main

# Luego configurar en Settings > Pages > Deploy from branch: main/docs
```

#### Opción 3: Netlify
```bash
# Arrastra carpeta dist/ a Netlify
# O usa CLI:
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

#### Opción 4: Vercel
```bash
# Vercel detecta automáticamente Vite
npm install -g vercel
vercel --prod
```

---

## 📋 Checklist Pre-Despliegue

### Código
- [x] Importaciones correctas (ExitReasonModal)
- [x] Estados inicializados
- [x] Funciones implementadas
- [x] Sin console.errors
- [x] Sin console.warnings

### Features
- [x] Buscador funcional
- [x] Modal de motivos funcionando
- [x] Valor de stock calculado
- [x] Movimientos registran motivo
- [x] Sidebar auto-cierre (móvil)

### Compatibilidad
- [x] Chrome ✓
- [x] Firefox ✓
- [x] Safari ✓
- [x] Edge ✓
- [x] iOS Safari ✓
- [x] Android Chrome ✓

### Performance
- [x] Carga rápida
- [x] Búsqueda instantánea
- [x] Sin memory leaks
- [x] localStorage optimizado

### Documentación
- [x] GUIA_OPTIMIZACIONES.md
- [x] OPTIMIZACION_PERFORMANCE.md
- [x] NOVEDADES_v2.1.0.md
- [x] RESUMEN_OPTIMIZACION.md
- [x] REPORTE_FINAL.md

---

## 🌐 Paso a Paso para Desplegar

### Paso 1: Preparar el Build
```bash
cd inventariox
npm run build
# Verifica que la carpeta dist/ se cree correctamente
```

### Paso 2: Verificar Contenido
```bash
ls -la dist/
# Debe ver:
# - index.html
# - assets/ (con archivos CSS y JS)
```

### Paso 3: Copiar a Servidor
**Opción A: FTP/SFTP**
```bash
# Usando programa como FileZilla
# Copiar contenido de dist/ a servidor web
# Usualmente: /public_html/ o /var/www/html/
```

**Opción B: Línea de Comandos**
```bash
scp -r dist/* usuario@servidor:/ruta/inventariox/
```

**Opción C: Git + Webhooks**
```bash
git push origin main
# Servidor automáticamente hace pull y deploy
```

### Paso 4: Verificar en Navegador
```
URL: https://tu-dominio.com/inventariox/
     o
     https://inventariox.vercel.app/
     
Verificar:
✓ Carga el sitio
✓ Buscador visible
✓ Botones (-) funcionan
✓ Modal de motivos aparece
✓ Valor Stock visible
```

### Paso 5: Notificar a Usuarios
Usar documentación:
- [NOVEDADES_v2.1.0.md] - Qué cambió
- [GUIA_OPTIMIZACIONES.md] - Cómo usar

---

## 🔧 Configuración del Servidor

### Nginx
```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    
    root /var/www/inventariox;
    index index.html;
    
    # Rewrite para Single Page App
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Caché para assets
    location ~* \.(js|css|png|jpg|gif)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Apache
```apache
<Directory /var/www/inventariox>
    Options Indexes FollowSymLinks
    AllowOverride All
    Require all granted
    
    # Rewrite para Single Page App
    <IfModule mod_rewrite.c>
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </IfModule>
</Directory>
```

---

## 🔒 Seguridad en Producción

### HTTPS (Obligatorio)
```bash
# Usar Let's Encrypt para certificados SSL gratis
# Vercel y Netlify lo hacen automático

# Si es manual:
certbot certonly --webroot -w /var/www/inventariox -d tu-dominio.com
```

### Headers de Seguridad
```nginx
# Agregar a Nginx:
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self'" always;
```

### Backup Regular
```bash
# Respaldar datos periódicamente
# Los datos se guardan en localStorage (navegador del usuario)
# Pero es buena práctica hacer backup de la carpeta dist/

cron job cada semana:
0 0 * * 0 /backup-script.sh
```

---

## ⚠️ Posibles Problemas y Soluciones

### Problema 1: Página No Carga
```
Causa: Archivo no encontrado (404)
Solución: 
  1. Verificar que dist/ se copió completo
  2. Verificar permisos de carpeta
  3. Revisar rutas en servidor web config
```

### Problema 2: Assets No Cargan (CSS/JS)
```
Causa: Rutas incorrectas
Solución:
  1. Si está en subcarpeta, actualizar vite.config.js:
     export default defineConfig({
       base: '/inventariox/',
       ...
     })
  2. Hacer rebuild: npm run build
  3. Copiar dist/ nuevamente
```

### Problema 3: localStorage No Funciona
```
Causa: CORS o configuración del navegador
Solución:
  1. Verificar que está usando HTTPS en producción
  2. Revisar console.log de errores
  3. Verificar que navegador permite localStorage
```

### Problema 4: Modal No Aparece
```
Causa: Error en JavaScript
Solución:
  1. Abrir DevTools (F12)
  2. Ir a Console
  3. Buscar errores
  4. Revisar ExitReasonModal.jsx está importado
```

---

## 📊 Monitoreo Post-Despliegue

### Verificación Diaria
```bash
# URL accesible
curl -I https://tu-dominio.com/inventariox/

# Debe responder con 200 OK
# Verificar archivo index.html existe
# Verificar assets se sirven correctamente
```

### Monitoring Recomendado
1. **Uptime Monitor:** Pingdom, Uptime Robot
2. **Error Tracking:** Sentry, LogRocket
3. **Analytics:** Google Analytics, Plausible
4. **Performance:** Google PageSpeed, WebPageTest

### Logs a Revisar
```
Buscar en logs del servidor:
- 404 errors (archivos no encontrados)
- 500 errors (errores del servidor)
- Time out errors (servidor lento)
- SSL errors (certificado vencido)
```

---

## 🔄 Rollback (Si es Necesario)

### Volver a Versión Anterior
```bash
# Si hay problemas críticos en v2.1.0
# Volver a versión anterior

# 1. Guardar versión actual
mv dist/ dist-backup-2.1.0/

# 2. Restaurar versión anterior
cp -r dist-2.0.0/ dist/

# 3. Redeploy
# Copiar dist/ a servidor nuevamente
```

### Recomendación
```
Mantener backups de cada versión:
- dist-2.0.0/
- dist-2.1.0/  ← Actual
- dist-2.1.1/  ← Próxima si hay fix
```

---

## 📝 Documentación Post-Despliegue

### Informar a Usuarios

**Email Template:**
```
Asunto: InventarioX Actualizada - v2.1.0 🚀

Estimados usuarios,

InventarioX ha sido actualizada con nuevas características:

✨ Buscador en tiempo real mejorado
✨ Motivos de salida (Venta/Desecho/Ajuste)
✨ Columna de valorización de inventario
✨ Mejor experiencia en móvil

Para más información, consultar:
📖 GUIA_OPTIMIZACIONES.md

¿Preguntas? Contactar a [soporte@...]

Saludos,
El equipo
```

### Compartir Documentación
1. Enviar GUIA_OPTIMIZACIONES.md
2. Publicar NOVEDADES_v2.1.0.md en intranet
3. Hacer video tutorial (opcional)
4. Hacer sesión de capacitación (opcional)

---

## ✅ Checklist Final de Despliegue

```
PRE-DESPLIEGUE
[ ] Build compilado sin errores
[ ] Testing completado
[ ] Documentación lista
[ ] Backups de versión anterior

DURANTE DESPLIEGUE
[ ] Copiar dist/ a servidor
[ ] Verificar permisos de carpeta
[ ] Verificar HTTPS/SSL
[ ] Verificar URLs correctas

POST-DESPLIEGUE
[ ] Acceso a URL funciona
[ ] Assets cargan correctamente
[ ] Features funcionan (buscador, motivos, etc)
[ ] localStorage funciona
[ ] Responsive en móvil
[ ] Sin errores en console

COMUNICACIÓN
[ ] Email a usuarios
[ ] Documentación disponible
[ ] Soporte notificado
[ ] FAQs actualizadas
```

---

## 📞 Soporte

### Si Algo Falla
1. Revisar logs del servidor
2. Abrir DevTools en navegador (F12)
3. Revisar console para errores
4. Contactar al equipo de desarrollo
5. Usar rollback si es crítico

### Info de Contacto
```
Soporte Técnico: [email/teléfono]
Horarios: L-V 9:00-18:00
Respuesta de emergencia: 24/7
```

---

## 🎉 ¡Listo para Desplegar!

```
╔════════════════════════════════════════╗
║                                        ║
║    ✅ InventarioX v2.1.0 LISTA       ║
║       PARA PRODUCCIÓN                ║
║                                        ║
║    Compilación: ✓ Exitosa            ║
║    Testing: ✓ Completado             ║
║    Documentación: ✓ Completa          ║
║    Status: 🚀 LISTO PARA DEPLOY      ║
║                                        ║
╚════════════════════════════════════════╝
```

---

**Versión:** 2.1.0  
**Fecha de Release:** 2024  
**Build:** 1265 módulos | 1.08 MB  
**Status:** ✅ LISTO PARA PRODUCCIÓN
