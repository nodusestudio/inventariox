import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc,
  Timestamp,
  runTransaction,
  onSnapshot
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

// 🔥 REACTIVIDAD: Suscripción en tiempo real para productos
export const subscribeToProducts = (userId, callback) => {
  const q = query(collection(db, 'products'), where('userId', '==', userId));
  
  return onSnapshot(q, 
    (querySnapshot) => {
      const products = [];
      querySnapshot.forEach((doc) => {
        products.push({ id: doc.id, ...doc.data() });
      });
      callback(products);
    },
    (error) => {
      console.error('Error in products subscription:', error);
      callback([]);
    }
  );
};

export const updateProduct = async (docId, productData) => {
  try {
    // Verificar que el docId no sea undefined
    if (!docId || docId === undefined) {
      throw new Error('ID del producto no válido');
    }

    // Sanitizar datos antes de enviar a Firebase
    const sanitizedData = {
      nombre: (productData.nombre || '').toString().trim(),
      proveedor: (productData.proveedor || '').toString().trim(),
      unidad: (productData.unidad || '').toString().trim(),
      costo: Number(productData.costo) || 0,
      stockActual: Number(productData.stockActual) || 0,
      stockMinimo: Number(productData.stockMinimo) || 0,
      stockCompra: Number(productData.stockCompra) || 0,
      updatedAt: Timestamp.now()
    };

    // ✅ NO validar nombre/proveedor aquí - updateProduct solo actualiza stocks existentes

    // 🔥 FILTRO DE OBJETOS: Eliminar cualquier campo undefined/null antes de updateDoc
    const cleanData = Object.fromEntries(
      Object.entries(sanitizedData).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );

    // Verificar que haya datos válidos para actualizar
    if (Object.keys(cleanData).length === 0) {
      throw new Error('No hay datos válidos para actualizar');
    }

    // Verificar que el ID no esté dentro del objeto de datos
    if (cleanData.id || cleanData.docId) {
      delete cleanData.id;
      delete cleanData.docId;
    }

    const productRef = doc(db, 'products', docId);
    await updateDoc(productRef, cleanData);
  } catch (error) {
    console.error('Error updating product:', error);
    // Manejo de errores específicos de Firebase
    if (error.code === 'invalid-argument') {
      throw new Error('Datos inválidos: ' + error.message);
    } else if (error.code === 'not-found') {
      throw new Error('Producto no encontrado');
    } else if (error.code === 'permission-denied') {
      throw new Error('Permiso denegado');
    }
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

export const updateStock = async (docId, stockData, userId = null, productInfo = null) => {
  try {
    const stockRef = doc(db, 'stock', docId);
    await updateDoc(stockRef, stockData);

    // Si hay cambio en stockActual y tenemos info del producto, registrar movimiento
    if (userId && productInfo && stockData.stockActual !== undefined) {
      const producto = productInfo.nombre || productInfo.productName || 'Producto';
      const cantidadPrevia = productInfo.stockActualPrevio || 0;
      const cantidadNueva = stockData.stockActual;
      const diferencia = cantidadNueva - cantidadPrevia;
      
      if (diferencia !== 0) {
        const tipo = diferencia > 0 ? 'Entrada' : 'Salida';
        await createMovement(
          userId,
          tipo,
          producto,
          Math.abs(diferencia),
          productInfo.costo || 0,
          docId
        );
      }
    }
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
      // Usar el ID del documento de Firestore como ID principal
      orders.push({ 
        id: doc.id, 
        ...data,
        // Guardar el ID original de data si existe, como referencia
        originalId: data.id 
      });
    });
    return orders;
  } catch (error) {
    console.error('Error getting orders:', error);
    return [];
  }
};

// 🔥 REACTIVIDAD: Suscripción en tiempo real para pedidos
export const subscribeToOrders = (userId, callback) => {
  const q = query(collection(db, 'orders'), where('userId', '==', userId));
  
  return onSnapshot(q,
    (querySnapshot) => {
      const orders = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        orders.push({ 
          id: doc.id, 
          ...data,
          originalId: data.id 
        });
      });
      callback(orders);
    },
    (error) => {
      console.error('Error in orders subscription:', error);
      callback([]);
    }
  );
};

// Recibir pedido con transacción (actualiza stock y estado de forma atómica)
export const receiveOrderWithTransaction = async (orderId, orderItems, userId) => {
  try {
    console.log('🔒 Iniciando transacción atómica para pedido:', orderId);
    
    await runTransaction(db, async (transaction) => {
      // Leer el pedido
      const orderRef = doc(db, 'orders', orderId);
      const orderDoc = await transaction.get(orderRef);
      
      if (!orderDoc.exists()) {
        throw new Error('Pedido no encontrado');
      }

      const orderData = orderDoc.data();
      
      // Verificar que el pedido esté en estado Pendiente
      if (orderData.estado === 'Recibido') {
        throw new Error('El pedido ya fue recibido anteriormente');
      }

      // Actualizar stock de cada producto de forma atómica
      const productUpdates = [];
      for (const item of orderItems) {
        if (!item.id || !item.cantidadPedir || item.cantidadPedir <= 0) {
          console.warn('⚠️ Item inválido omitido:', item);
          continue;
        }

        const productRef = doc(db, 'products', item.id);
        const productDoc = await transaction.get(productRef);
        
        if (!productDoc.exists()) {
          console.warn('⚠️ Producto no encontrado:', item.id);
          continue;
        }

        const currentStock = productDoc.data().stockActual || 0;
        const newStock = currentStock + item.cantidadPedir;
        
        transaction.update(productRef, { 
          stockActual: newStock,
          updatedAt: Timestamp.now()
        });
        
        productUpdates.push({ 
          id: item.id, 
          oldStock: currentStock, 
          newStock, 
          quantity: item.cantidadPedir 
        });
      }

      // Actualizar estado del pedido a Recibido (todo o nada)
      transaction.update(orderRef, { 
        estado: 'Recibido',
        fechaRecepcion: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      console.log('✅ Transacción completada. Productos actualizados:', productUpdates.length);
    });

    // Registrar movimientos después de la transacción exitosa
    if (userId) {
      for (const item of orderItems) {
        if (item.id && item.cantidadPedir && item.cantidadPedir > 0) {
          await createMovement(
            userId,
            'Entrada',
            item.nombre || item.productName || 'Producto',
            item.cantidadPedir,
            item.costo || 0,
            item.id,
            orderId  // Pasar orderId para vincular el movimiento
          );
        }
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error en transacción de recibir pedido:', error);
    throw error;
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
    return { success: true };
  } catch (error) {
    console.error('Error deleting order:', error);
    throw error;
  }
};

// Eliminar movimientos relacionados con un pedido específico
export const deleteMovementsByOrderId = async (userId, orderId) => {
  try {
    // Buscar todos los movimientos del usuario
    const q = query(
      collection(db, 'movements'),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    
    let deletedCount = 0;
    
    // Eliminar movimientos relacionados con el pedido
    for (const movementDoc of querySnapshot.docs) {
      const data = movementDoc.data();
      // Verificar si el movimiento está relacionado con el pedido
      if (data.orderId === orderId || data.relatedOrderId === orderId) {
        await deleteDoc(doc(db, 'movements', movementDoc.id));
        deletedCount++;
      }
    }
    
    return deletedCount;
  } catch (error) {
    console.error('Error deleting movements by order:', error);
    // No lanzar error para no afectar la eliminación del pedido
    return 0;
  }
};

// Eliminar pedido y sus movimientos relacionados
export const deleteOrderWithMovements = async (docId, userId) => {
  try {
    console.log('🗑️ Iniciando eliminación del pedido:', docId);
    
    // Primero eliminar el pedido de Firestore
    await deleteDoc(doc(db, 'orders', docId));
    console.log('✅ Pedido eliminado de Firestore:', docId);
    
    // Luego eliminar movimientos relacionados
    if (userId) {
      await deleteMovementsByOrderId(userId, docId);
      console.log('✅ Movimientos relacionados eliminados');
    }
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting order with movements:', error);
    console.error('❌ DocId recibido:', docId);
    console.error('❌ UserId recibido:', userId);
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

// Función auxiliar para crear movimiento automáticamente
export const createMovement = async (userId, tipo, productoNombre, cantidad, costoUnitario, productoId = null, orderId = null, observaciones = '') => {
  try {
    const total = cantidad * costoUnitario;
    const movementData = {
      fecha: Timestamp.now(),
      tipo, // 'Entrada', 'Salida', 'Merma', 'Ajuste'
      productoNombre,
      productoId,
      cantidad,
      costoUnitario,
      total
    };
    
    // Agregar orderId si existe
    if (orderId) {
      movementData.orderId = orderId;
      movementData.relatedOrderId = orderId;
    }
    
    // Agregar observaciones si existen
    if (observaciones && observaciones.trim()) {
      movementData.observaciones = observaciones.trim();
    }
    
    return await addMovement(userId, movementData);
  } catch (error) {
    console.error('Error creating movement:', error);
    // No lanzar error para no afectar la operación principal
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

// 🔥 REACTIVIDAD: Suscripción en tiempo real para movimientos
export const subscribeToMovements = (userId, callback) => {
  const q = query(collection(db, 'movements'), where('userId', '==', userId));
  
  return onSnapshot(q,
    (querySnapshot) => {
      const movements = [];
      querySnapshot.forEach((doc) => {
        movements.push({ id: doc.id, ...doc.data() });
      });
      callback(movements);
    },
    (error) => {
      console.error('Error in movements subscription:', error);
      callback([]);
    }
  );
};

// ============================================================================
// OPERACIONES DE EMPRESA
// ============================================================================

export const setCompanyData = async (userId, companyData) => {
  try {
    const q = query(collection(db, 'company'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    let docRef;
    if (querySnapshot.empty) {
      // Crear nuevo documento de empresa
      docRef = await addDoc(collection(db, 'company'), {
        ...companyData,
        userId,
        createdAt: Timestamp.now()
      });
    } else {
      // Actualizar documento existente con merge para no sobrescribir todo
      const docId = querySnapshot.docs[0].id;
      const companyRef = doc(db, 'company', docId);
      await setDoc(companyRef, {
        ...companyData,
        userId,
        updatedAt: Timestamp.now()
      }, { merge: true });
    }
    return true;
  } catch (error) {
    console.error('Error setting company data:', error);
    throw error;
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
    
    // Registrar movimiento automáticamente
    if (mermaData.productoNombre && mermaData.cantidad && mermaData.costo !== undefined) {
      await createMovement(
        userId,
        'Merma',
        mermaData.productoNombre,
        mermaData.cantidad,
        mermaData.costo,
        mermaData.productoId,
        null,
        mermaData.observaciones || ''
      );
    }
    
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

// 🔥 REACTIVIDAD: Suscripción en tiempo real para mermas
export const subscribeToMermas = (userId, callback) => {
  const q = query(collection(db, 'mermas'), where('userId', '==', userId));
  
  return onSnapshot(q,
    (querySnapshot) => {
      const mermas = [];
      querySnapshot.forEach((doc) => {
        mermas.push({ id: doc.id, ...doc.data() });
      });
      callback(mermas);
    },
    (error) => {
      console.error('Error in mermas subscription:', error);
      callback([]);
    }
  );
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
// OPERACIONES DE INVENTARIO DIARIO (inventory_logs)
// NOTA CRÍTICA: NO incluye campo 'sede' - Eliminado para ROAL BURGER
// ============================================================================

export const addInventoryLog = async (userId, responsable, proveedor, productos) => {
  try {
    // Validaciones estrictas (sin sede)
    if (!responsable || responsable.trim() === '') {
      throw new Error('Falta el nombre del responsable');
    }
    if (!proveedor || proveedor.trim() === '') {
      throw new Error('Falta seleccionar el proveedor');
    }
    if (!productos || productos.length === 0) {
      throw new Error('No hay productos para registrar');
    }

    // Calcular métricas de consumo
    const consumoTotal = productos.reduce((sum, item) => 
      sum + (item.consumo > 0 ? item.consumo : 0), 0
    );
    const productosConsumo = productos.filter(item => item.consumo > 0).length;

    console.log('📦 Firebase - Objeto a guardar (SIN sede):');
    console.log('   - Responsable:', responsable.trim());
    console.log('   - Proveedor:', proveedor.trim());
    console.log('   - Total Productos:', productos.length);
    console.log('   - Consumo Total:', consumoTotal);

    // Objeto limpio para Firebase: responsable, proveedor, productos, fecha, totalConsumo
    const docRef = await addDoc(collection(db, 'inventory_logs'), {
      responsable: responsable.trim(),
      proveedor: proveedor.trim(),
      productos,
      consumoTotal,
      productosConsumo,
      totalProductos: productos.length,
      userId,
      fecha_hora: Timestamp.now(),
      createdAt: Timestamp.now()
      // ❌ NO incluye 'sede' - Campo eliminado permanentemente
    });
    
    console.log('✅ Firebase - Documento guardado con ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Firebase - Error al guardar:', error);
    throw error;
  }
};

export const getInventoryLogs = async (userId) => {
  try {
    const q = query(collection(db, 'inventory_logs'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const inventoryLogs = [];
    querySnapshot.forEach((doc) => {
      inventoryLogs.push({ id: doc.id, ...doc.data() });
    });
    return inventoryLogs;
  } catch (error) {
    console.error('Error getting inventory logs:', error);
    return [];
  }
};

// 🔥 REACTIVIDAD: Suscripción en tiempo real para inventory_logs
export const subscribeToInventoryLogs = (userId, callback) => {
  const q = query(collection(db, 'inventory_logs'), where('userId', '==', userId));
  
  return onSnapshot(q,
    (querySnapshot) => {
      const inventoryLogs = [];
      querySnapshot.forEach((doc) => {
        inventoryLogs.push({ id: doc.id, ...doc.data() });
      });
      callback(inventoryLogs);
    },
    (error) => {
      console.error('Error in inventory_logs subscription:', error);
      callback([]);
    }
  );
};

// Verificar si ya existe un cierre de inventario para hoy
export const getTodayInventoryLog = async (userId) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const q = query(
      collection(db, 'inventory_logs'),
      where('userId', '==', userId),
      where('fecha_hora', '>=', Timestamp.fromDate(today)),
      where('fecha_hora', '<', Timestamp.fromDate(tomorrow))
    );
    
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting today inventory log:', error);
    return null;
  }
};

// ============================================================================
// OPERACIONES DE AUDITORÍA (LEGACY - audit_logs)
// ============================================================================

export const addAuditLog = async (userId, auditData) => {
  try {
    const docRef = await addDoc(collection(db, 'audit_logs'), {
      ...auditData,
      userId,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding audit log:', error);
    throw error;
  }
};

export const getAuditLogs = async (userId) => {
  try {
    const q = query(collection(db, 'audit_logs'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const auditLogs = [];
    querySnapshot.forEach((doc) => {
      auditLogs.push({ id: doc.id, ...doc.data() });
    });
    return auditLogs;
  } catch (error) {
    console.error('Error getting audit logs:', error);
    return [];
  }
};

// 🔥 REACTIVIDAD: Suscripción en tiempo real para audit_logs
export const subscribeToAuditLogs = (userId, callback) => {
  const q = query(collection(db, 'audit_logs'), where('userId', '==', userId));
  
  return onSnapshot(q,
    (querySnapshot) => {
      const auditLogs = [];
      querySnapshot.forEach((doc) => {
        auditLogs.push({ id: doc.id, ...doc.data() });
      });
      callback(auditLogs);
    },
    (error) => {
      console.error('Error in audit_logs subscription:', error);
      callback([]);
    }
  );
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