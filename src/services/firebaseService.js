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
import { db } from '../config/firebase';

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
