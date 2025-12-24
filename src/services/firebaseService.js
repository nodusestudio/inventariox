import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc,
  Timestamp
} from 'firebase/firestore';
import { db, storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// ============================================================================
// OPERACIONES DE PRODUCTOS
// ============================================================================

export const addProduct = async (userId, productData) => {
  try {
    const docRef = await addDoc(collection(db, 'products'), {
      ...productData,
      userId,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
};

export const getProducts = async (userId) => {
  try {
    const q = query(collection(db, 'products'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const products = [];
    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() });
    });
    return products;
  } catch (error) {
    console.error('Error getting products:', error);
    return [];
  }
};

export const updateProduct = async (docId, productData) => {
  try {
    const productRef = doc(db, 'products', docId);
    await updateDoc(productRef, productData);
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

export const deleteProduct = async (docId) => {
  try {
    await deleteDoc(doc(db, 'products', docId));
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// ============================================================================
// OPERACIONES DE STOCK
// ============================================================================

export const addStock = async (userId, stockData) => {
  try {
    const docRef = await addDoc(collection(db, 'stock'), {
      ...stockData,
      userId,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding stock:', error);
    throw error;
  }
};

export const getStock = async (userId) => {
  try {
    const q = query(collection(db, 'stock'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const stock = [];
    querySnapshot.forEach((doc) => {
      stock.push({ id: doc.id, ...doc.data() });
    });
    return stock;
  } catch (error) {
    console.error('Error getting stock:', error);
    return [];
  }
};

export const updateStock = async (docId, stockData) => {
  try {
    const stockRef = doc(db, 'stock', docId);
    await updateDoc(stockRef, stockData);
  } catch (error) {
    console.error('Error updating stock:', error);
    throw error;
  }
};

export const deleteStock = async (docId) => {
  try {
    await deleteDoc(doc(db, 'stock', docId));
  } catch (error) {
    console.error('Error deleting stock:', error);
    throw error;
  }
};

// ============================================================================
// OPERACIONES DE PROVEEDORES
// ============================================================================

export const addProvider = async (userId, providerData) => {
  try {
    const docRef = await addDoc(collection(db, 'providers'), {
      ...providerData,
      userId,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding provider:', error);
    throw error;
  }
};

export const getProviders = async (userId) => {
  try {
    const q = query(collection(db, 'providers'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const providers = [];
    querySnapshot.forEach((doc) => {
      providers.push({ id: doc.id, ...doc.data() });
    });
    return providers;
  } catch (error) {
    console.error('Error getting providers:', error);
    return [];
  }
};

// Obtener todos los proveedores (debug/global)
export const getAllProviders = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'providers'));
    const providers = [];
    querySnapshot.forEach((doc) => {
      providers.push({ id: doc.id, ...doc.data() });
    });
    return providers;
  } catch (error) {
    console.error('Error getting all providers:', error);
    return [];
  }
};

export const updateProvider = async (docId, providerData) => {
  try {
    const providerRef = doc(db, 'providers', docId);
    await updateDoc(providerRef, providerData);
  } catch (error) {
    console.error('Error updating provider:', error);
    throw error;
  }
};

export const deleteProvider = async (docId) => {
  try {
    await deleteDoc(doc(db, 'providers', docId));
  } catch (error) {
    console.error('Error deleting provider:', error);
    throw error;
  }
};

// ============================================================================
// OPERACIONES DE PEDIDOS
// ============================================================================

export const addOrder = async (userId, orderData) => {
  try {
    const docRef = await addDoc(collection(db, 'orders'), {
      ...orderData,
      userId,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding order:', error);
    throw error;
  }
};

export const getOrders = async (userId) => {
  try {
    const q = query(collection(db, 'orders'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const orders = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      orders.push({ id: data.id || `PED-${doc.id}`, ...data });
    });
    return orders;
  } catch (error) {
    console.error('Error getting orders:', error);
    return [];
  }
};

export const updateOrder = async (docId, orderData) => {
  try {
    const orderRef = doc(db, 'orders', docId);
    await updateDoc(orderRef, orderData);
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
};

export const deleteOrder = async (docId) => {
  try {
    await deleteDoc(doc(db, 'orders', docId));
  } catch (error) {
    console.error('Error deleting order:', error);
    throw error;
  }
};

// ============================================================================
// OPERACIONES DE MOVIMIENTOS
// ============================================================================

export const addMovement = async (userId, movementData) => {
  try {
    const docRef = await addDoc(collection(db, 'movements'), {
      ...movementData,
      userId,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding movement:', error);
    throw error;
  }
};

export const getMovements = async (userId) => {
  try {
    const q = query(collection(db, 'movements'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const movements = [];
    querySnapshot.forEach((doc) => {
      movements.push({ id: doc.id, ...doc.data() });
    });
    return movements;
  } catch (error) {
    console.error('Error getting movements:', error);
    return [];
  }
};

// ============================================================================
// OPERACIONES DE EMPRESA
// ============================================================================

export const setCompanyData = async (userId, companyData) => {
  try {
    const q = query(collection(db, 'company'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      // Crear nuevo documento de empresa
      await addDoc(collection(db, 'company'), {
        ...companyData,
        userId,
        createdAt: Timestamp.now()
      });
    } else {
      // Actualizar documento existente
      const docId = querySnapshot.docs[0].id;
      const companyRef = doc(db, 'company', docId);
      await updateDoc(companyRef, companyData);
    }
    return true;
  } catch (error) {
    console.error('Error setting company data:', error);
    return false;
  }
};

export const getCompanyData = async (userId) => {
  try {
    const q = query(collection(db, 'company'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { nombre: '', rfc: '', direccion: '', telefono: '', email: '', logo: '' };
    }
    
    return querySnapshot.docs[0].data();
  } catch (error) {
    console.error('Error getting company data:', error);
    return { nombre: '', rfc: '', direccion: '', telefono: '', email: '', logo: '' };
  }
};

// Subir logo de empresa a Storage y guardar URL en Firestore
export const uploadCompanyLogo = async (userId, file) => {
  try {
    const path = `company_logos/${userId}/${Date.now()}_${file.name}`;
    const fileRef = ref(storage, path);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    await setCompanyData(userId, { logo: url });
    return url;
  } catch (error) {
    console.error('Error uploading company logo:', error);
    throw error;
  }
};

// ============================================================================
// OPERACIONES DE MERMAS (PÉRDIDAS)
// ============================================================================

export const addMerma = async (userId, mermaData) => {
  try {
    const docRef = await addDoc(collection(db, 'mermas'), {
      ...mermaData,
      userId,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding merma:', error);
    throw error;
  }
};

export const getMermas = async (userId) => {
  try {
    const q = query(collection(db, 'mermas'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const mermas = [];
    querySnapshot.forEach((doc) => {
      mermas.push({ id: doc.id, ...doc.data() });
    });
    return mermas;
  } catch (error) {
    console.error('Error getting mermas:', error);
    return [];
  }
};

export const deleteMerma = async (docId) => {
  try {
    await deleteDoc(doc(db, 'mermas', docId));
  } catch (error) {
    console.error('Error deleting merma:', error);
    throw error;
  }
};

// ============================================================================
// ELIMINACIÓN DE DATOS DE USUARIO (para cuando se elimina la cuenta)
// ============================================================================

export const deleteAllUserData = async (userId) => {
  try {
    let totalDeleted = 0;

    // Eliminar todos los productos del usuario
    const productsQuery = query(collection(db, 'products'), where('userId', '==', userId));
    const productsSnapshot = await getDocs(productsQuery);
    for (const doc of productsSnapshot.docs) {
      await deleteDoc(doc.ref);
      totalDeleted++;
    }
    console.log(`✅ Eliminados ${productsSnapshot.docs.length} productos`);

    // Eliminar todo el stock del usuario
    const stockQuery = query(collection(db, 'stock'), where('userId', '==', userId));
    const stockSnapshot = await getDocs(stockQuery);
    for (const doc of stockSnapshot.docs) {
      await deleteDoc(doc.ref);
      totalDeleted++;
    }
    console.log(`✅ Eliminados ${stockSnapshot.docs.length} registros de stock`);

    // Eliminar todos los proveedores del usuario
    const providersQuery = query(collection(db, 'providers'), where('userId', '==', userId));
    const providersSnapshot = await getDocs(providersQuery);
    for (const doc of providersSnapshot.docs) {
      await deleteDoc(doc.ref);
      totalDeleted++;
    }
    console.log(`✅ Eliminados ${providersSnapshot.docs.length} proveedores`);

    // Eliminar todos los pedidos del usuario
    const ordersQuery = query(collection(db, 'orders'), where('userId', '==', userId));
    const ordersSnapshot = await getDocs(ordersQuery);
    for (const doc of ordersSnapshot.docs) {
      await deleteDoc(doc.ref);
      totalDeleted++;
    }
    console.log(`✅ Eliminados ${ordersSnapshot.docs.length} pedidos`);

    // Eliminar todos los movimientos del usuario
    const movementsQuery = query(collection(db, 'movements'), where('userId', '==', userId));
    const movementsSnapshot = await getDocs(movementsQuery);
    for (const doc of movementsSnapshot.docs) {
      await deleteDoc(doc.ref);
      totalDeleted++;
    }
    console.log(`✅ Eliminados ${movementsSnapshot.docs.length} movimientos`);

    // Eliminar datos de la empresa del usuario
    const companyQuery = query(collection(db, 'company'), where('userId', '==', userId));
    const companySnapshot = await getDocs(companyQuery);
    for (const doc of companySnapshot.docs) {
      await deleteDoc(doc.ref);
      totalDeleted++;
    }
    console.log(`✅ Eliminados ${companySnapshot.docs.length} registros de empresa`);

    // Eliminar todas las mermas del usuario
    const mermasQuery = query(collection(db, 'mermas'), where('userId', '==', userId));
    const mermasSnapshot = await getDocs(mermasQuery);
    for (const doc of mermasSnapshot.docs) {
      await deleteDoc(doc.ref);
      totalDeleted++;
    }
    console.log(`✅ Eliminados ${mermasSnapshot.docs.length} registros de mermas`);

    console.log(`🎉 TOTAL: ${totalDeleted} documentos eliminados de Firestore`);
    return true;
  } catch (error) {
    console.error('❌ Error deletando datos del usuario:', error);
    throw error;
  }
};