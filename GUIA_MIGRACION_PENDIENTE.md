# 🚀 Guía de Continuación - Migración Firebase

## Páginas Pendientes de Migración

Esta guía describe cómo migrar las 5 páginas restantes de localStorage a Firestore.

---

## 1️⃣ Providers.jsx (Prioridad: ALTA)

### Cambios Necesarios:

**Props Actuales:**
```javascript
export default function Providers({
  providersData = [],
  setProvidersData = () => {},
  language = 'es'
})
```

**Props Nuevos:**
```javascript
export default function Providers({
  user,
  language = 'es',
  onShowToast = () => {}
})
```

### Funciones a Utilizar:
```javascript
import {
  getProviders,
  addProvider,
  updateProvider,
  deleteProvider
} from '../services/firebaseService';
```

### Cambios en Código:

**Antes (localStorage):**
```javascript
const [providers, setProviders] = useState(() => {
  const saved = localStorage.getItem('inventariox_providers');
  return saved ? JSON.parse(saved) : [];
});

// Guardar cambios
useEffect(() => {
  localStorage.setItem('inventariox_providers', JSON.stringify(providers));
}, [providers]);

// Crear proveedor
const newProvider = { id: Date.now(), ...formData };
setProviders([...providers, newProvider]);
localStorage.setItem('inventariox_providers', JSON.stringify(updatedProviders));
```

**Después (Firestore):**
```javascript
const [providers, setProviders] = useState([]);
const [loading, setLoading] = useState(true);

// Cargar proveedores
useEffect(() => {
  if (!user) return;
  
  const loadProviders = async () => {
    try {
      const data = await getProviders(user.uid);
      setProviders(data);
    } catch (error) {
      showToast('Error al cargar proveedores', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  loadProviders();
}, [user]);

// Crear proveedor
const handleSaveProvider = async () => {
  try {
    const newId = await addProvider(user.uid, formData);
    setProviders([...providers, { id: newId, ...formData }]);
    showToast('Proveedor creado exitosamente', 'success');
  } catch (error) {
    showToast('Error al crear proveedor', 'error');
  }
};
```

### App.jsx - Cambiar:
```javascript
// Antes:
<Providers
  providersData={providersData}
  setProvidersData={setProvidersData}
  language={language}
/>

// Después:
<Providers
  user={user}
  language={language}
  onShowToast={showToast}
/>
```

---

## 2️⃣ Movements.jsx (Prioridad: ALTA)

### Estructura Esperada:

**Props:**
```javascript
export default function Movements({
  user,
  language = 'es',
  onShowToast = () => {}
})
```

### Funciones Firebase:
```javascript
import { getMovements } from '../services/firebaseService';
```

### Implementación:

```javascript
const [movements, setMovements] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  if (!user) return;
  
  const loadMovements = async () => {
    try {
      const data = await getMovements(user.uid);
      setMovements(data.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      ));
    } catch (error) {
      showToast('Error al cargar movimientos', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  loadMovements();
}, [user]);
```

### Notas Importantes:
- Los movimientos se crean automáticamente en Stock.jsx
- Movements es solo lectura (no crear desde aquí)
- Agregar filtros por fecha y tipo
- Mostrar historial ordenado por fecha DESC

---

## 3️⃣ Database.jsx (Prioridad: MEDIA)

### Cambios Principales:

**Backup:**
```javascript
// Antes: Descargar JSON de localStorage
const handleBackup = () => {
  const data = {
    products: localStorage.getItem('inventariox_products'),
    providers: localStorage.getItem('inventariox_providers'),
    // ...
  };
};

// Después: Exportar desde Firestore
const handleBackup = async () => {
  try {
    const [products, orders, providers, movements] = await Promise.all([
      getProducts(user.uid),
      getOrders(user.uid),
      getProviders(user.uid),
      getMovements(user.uid)
    ]);
    
    const data = { products, orders, providers, movements };
    downloadJSON(data, `backup-${new Date().toISOString()}.json`);
    showToast('Backup creado exitosamente', 'success');
  } catch (error) {
    showToast('Error al crear backup', 'error');
  }
};
```

**Restore:**
```javascript
const handleRestore = async (file) => {
  try {
    const data = JSON.parse(await file.text());
    
    // Subir cada colección
    for (const product of data.products) {
      await addProduct(user.uid, product);
    }
    
    showToast('Datos restaurados exitosamente', 'success');
    // Recargar datos
    window.location.reload();
  } catch (error) {
    showToast('Error al restaurar datos', 'error');
  }
};
```

---

## 4️⃣ Dashboard.jsx (Prioridad: MEDIA)

### Cambios Principales:

**Cargar Datos en Tiempo Real:**
```javascript
import { onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

useEffect(() => {
  if (!user) return;
  
  // Cargar productos en tiempo real
  const q = query(
    collection(db, 'products'),
    where('userId', '==', user.uid)
  );
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setProductsData(products);
  });
  
  return unsubscribe;
}, [user]);

// Aplicar mismo patrón para:
// - orders
// - movements
// - providers
```

### Estadísticas:
```javascript
const getTotalStockValue = () => {
  return productsData.reduce((sum, product) => {
    return sum + (product.costo * product.stockActual);
  }, 0);
};

const getLowStockProducts = () => {
  return productsData.filter(p => 
    p.stockActual <= p.stockMinimo
  );
};

const getMonthlyOrders = () => {
  const month = new Date().getMonth();
  return ordersData.filter(o => 
    new Date(o.fecha).getMonth() === month
  );
};
```

---

## 5️⃣ Settings.jsx (Prioridad: BAJA)

### Cambios Principales:

**Guardar Preferencias de Usuario:**
```javascript
const [language, setLanguage] = useState('es');
const [theme, setTheme] = useState('dark');

// Guardar en Firestore
const handleLanguageChange = async (newLang) => {
  try {
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, { language: newLang });
    setLanguage(newLang);
    showToast('Idioma actualizado', 'success');
  } catch (error) {
    showToast('Error al guardar preferencias', 'error');
  }
};

// Cargar preferencias
useEffect(() => {
  if (!user) return;
  
  const userRef = doc(db, 'users', user.uid);
  getDoc(userRef).then((snap) => {
    if (snap.exists()) {
      const { language, theme } = snap.data();
      setLanguage(language);
      setTheme(theme);
    }
  });
}, [user]);
```

### Colección users:
```
/users/{uid}
├── email: "usuario@example.com"
├── language: "es"
├── theme: "dark"
├── createdAt: Timestamp
└── updatedAt: Timestamp
```

---

## 🔧 Funciones Firebase Service a Agregar

Si no existen, agregar a `firebaseService.js`:

```javascript
// MOVEMENTS
export const addMovement = async (userId, movementData) => {
  const docRef = await addDoc(collection(db, 'movements'), {
    ...movementData,
    userId,
    createdAt: Timestamp.now()
  });
  return docRef.id;
};

export const getMovements = async (userId) => {
  const q = query(collection(db, 'movements'), where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// PROVIDERS
export const getProviders = async (userId) => {
  // Ya existe, verificar
};

export const addProvider = async (userId, providerData) => {
  // Similar a addProduct
};

export const updateProvider = async (userId, providerId, data) => {
  // Similar a updateProduct
};

export const deleteProvider = async (userId, providerId) => {
  // Similar a deleteProduct
};

// COMPANY DATA
export const getCompanyData = async (userId) => {
  const docRef = doc(db, 'company', userId);
  const snap = await getDoc(docRef);
  return snap.exists() ? snap.data() : null;
};

export const updateCompanyData = async (userId, data) => {
  const docRef = doc(db, 'company', userId);
  await updateDoc(docRef, { ...data, updatedAt: Timestamp.now() });
};
```

---

## 📋 Checklist de Migración

### Providers.jsx
- [ ] Cambiar props (agregar user, onShowToast)
- [ ] Importar funciones Firebase
- [ ] Reemplazar useState con useEffect para cargar
- [ ] Reemplazar handleAddProvider con addProvider()
- [ ] Reemplazar handleUpdateProvider con updateProvider()
- [ ] Reemplazar handleDeleteProvider con deleteProvider()
- [ ] Agregar loading state
- [ ] Actualizar App.jsx

### Movements.jsx
- [ ] Cambiar props
- [ ] Importar getMovements
- [ ] Cargar datos en useEffect
- [ ] Agregar filtros por fecha
- [ ] Agregar ordenamiento DESC por fecha
- [ ] Actualizar App.jsx

### Database.jsx
- [ ] Cambiar props
- [ ] Actualizar handleBackup para Firestore
- [ ] Actualizar handleRestore para Firestore
- [ ] Agregar validación de datos
- [ ] Actualizar App.jsx

### Dashboard.jsx
- [ ] Cambiar props
- [ ] Usar onSnapshot para datos en tiempo real
- [ ] Actualizar cálculo de estadísticas
- [ ] Actualizar App.jsx

### Settings.jsx
- [ ] Cambiar props
- [ ] Agregar guardado a Firestore
- [ ] Cargar preferencias al iniciar
- [ ] Actualizar App.jsx

---

## 🚀 Orden Recomendado de Migración

1. **Providers.jsx** - Usado por Stock y Orders (crítico)
2. **Movements.jsx** - Solo lectura, más simple
3. **Dashboard.jsx** - Requiere onSnapshot para tiempo real
4. **Database.jsx** - Backup/Restore, importancia media
5. **Settings.jsx** - Última prioridad, solo preferencias

---

## 💡 Tips Importantes

### Cuando Migres:
1. Mantén la lógica de negocios igual
2. Solo cambia localStorage → Firestore
3. Usa async/await consistentemente
4. Agrega loading states
5. Manejo de errores con try/catch

### Testing:
1. Prueba crear nuevo registro
2. Prueba editar registro existente
3. Prueba eliminar registro
4. Prueba búsqueda/filtros
5. Prueba con múltiples usuarios

### Errores Comunes:
❌ Olvidar agregar `userId` a documentos
❌ No filtrar por `userId` en queries
❌ No manejar async correctamente
❌ Olvidar actualizar App.jsx
❌ No agregar loading states

---

## 📞 Referencia Rápida

**Para cada página migrada:**

```javascript
import { 
  getXXX, 
  addXXX, 
  updateXXX, 
  deleteXXX 
} from '../services/firebaseService';

export default function XXX({ user, language, onShowToast = () => {} }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const data = await getXXX(user.uid);
        setItems(data);
      } catch (error) {
        onShowToast('Error al cargar', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);
  
  // ... resto del código
}
```

---

**¡Con esta guía podrás completar la migración en 2-3 horas!**
