import { Search, Plus, X, Trash2, Check, AlertCircle, MessageCircle } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';
import { toast } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import {
  getOrders,
  addOrder,
  updateOrder,
  deleteOrderWithMovements,
  getProducts,
  getProviders,
  updateProduct,
  receiveOrderWithTransaction
} from '../services/firebaseService';

export default function Orders({ 
  language = 'es', 
  user,
  companyData = {}
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [listaProveedores, setListaProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmReceive, setConfirmReceive] = useState(null);
  const [isAddingPedido, setIsAddingPedido] = useState(false);
  const [formData, setFormData] = useState({
    proveedor: '',
    fechaEntrega: '',
    horaEntrega: '',
    direccionEntrega: '',
    items: []
  });

  // Cargar datos al montar el componente
  useEffect(() => {
    if (!user) return;
    
    const loadData = async () => {
      try {
        setLoading(true);
        const [ordersData, productsData, providersData] = await Promise.all([
          getOrders(user.uid),
          getProducts(user.uid),
          getProviders(user.uid)
        ]);
        setOrders(ordersData);
        setProducts(productsData);
        setListaProveedores(providersData);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('❌ Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Formatear moneda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-CL', { 
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Crear nuevo pedido
  const handleCreateOrder = async () => {
    if (!formData.proveedor) {
      toast.error('Selecciona un proveedor');
      return;
    }
    if (formData.items.length === 0) {
      toast.error('Agrega al menos un producto');
      return;
    }

    // Validar que todos los items pertenezcan al proveedor seleccionado
    const invalidItems = formData.items.filter(item => {
      const product = products.find(p => p.id === item.id);
      return !product || product.proveedor !== formData.proveedor;
    });

    if (invalidItems.length > 0) {
      toast.error('❌ Algunos productos no pertenecen al proveedor seleccionado');
      return;
    }

    const newOrder = {
      proveedor: formData.proveedor,
      fecha: new Date().toISOString().split('T')[0],
      fechaEntrega: formData.fechaEntrega,
      horaEntrega: formData.horaEntrega,
      items: formData.items,
      total: formData.items.reduce((sum, item) => sum + ((item.costo || 0) * item.cantidadPedir), 0),
      estado: 'Pendiente'
    };

    try {
      const orderId = await addOrder(user.uid, newOrder);
      setOrders([...orders, { id: orderId, ...newOrder }]);
      setIsAddingPedido(false);
      setFormData({ proveedor: '', fechaEntrega: '', horaEntrega: '', items: [] });
      toast.success('✓ Pedido creado exitosamente');
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('❌ Error al crear el pedido');
    }
  };

  // Agregar producto al formulario
  const handleAddItem = (productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const exists = formData.items.find(i => i.id === productId);
    if (exists) {
      setFormData({
        ...formData,
        items: formData.items.map(i => 
          i.id === productId 
            ? { ...i, cantidadPedir: Math.min((i.cantidadPedir || 1) + 1, 999) }
            : i
        )
      });
    } else {
      // Inicializar con valores por defecto
      // stockEnMano se llenarán con stockActual del producto
      // cantidadSugerida = stockCompra - stockActual
      const stockEnMano = product.stockActual || 0;
      const cantidadSugerida = Math.max(0, (product.stockCompra || 10) - stockEnMano);
      
      setFormData({
        ...formData,
        items: [...formData.items, { 
          id: productId,
          nombre: product.nombre,
          unidad: product.unidad || 'UNIDADES', // 🔥 VERIFICACIÓN: Guardar unidad del producto
          costo: product.costo || 0,
          stockEnMano: stockEnMano,
          stockObjetivo: product.stockCompra || 10,
          cantidadSugerida: cantidadSugerida,
          cantidadPedir: cantidadSugerida || 1
        }]
      });
    }
  };

  // Eliminar producto del formulario
  const handleRemoveItem = (productId) => {
    setFormData({
      ...formData,
      items: formData.items.filter(i => i.id !== productId)
    });
  };

  // Actualizar cantidad - permite input vacío para mejor UX en móvil
  const handleUpdateQty = (productId, value) => {
    // Permitir vacío temporalmente para que el usuario pueda borrar
    if (value === '' || value === null || value === undefined) {
      setFormData({
        ...formData,
        items: formData.items.map(i =>
          i.id === productId ? { ...i, cantidadPedir: '' } : i
        )
      });
      return;
    }

    const qty = parseInt(value);
    
    // Si es 0 o negativo, mantener en 0 (no eliminar automáticamente)
    if (qty <= 0 || isNaN(qty)) {
      setFormData({
        ...formData,
        items: formData.items.map(i =>
          i.id === productId ? { ...i, cantidadPedir: 0 } : i
        )
      });
    } else {
      // Limitar a 999 máximo
      const finalQty = Math.min(qty, 999);
      setFormData({
        ...formData,
        items: formData.items.map(i =>
          i.id === productId ? { ...i, cantidadPedir: finalQty } : i
        )
      });
    }
  };

  // Actualizar stock en mano y recalcular cantidad sugerida
  const handleUpdateStockEnMano = (productId, stockEnMano) => {
    setFormData({
      ...formData,
      items: formData.items.map(i => {
        if (i.id === productId) {
          const nuevoStockEnMano = parseInt(stockEnMano) || 0;
          const stockObjetivo = i.stockObjetivo || 10;
          // LÓGICA CORRECTA: Si Stock en Mano >= Stock Objetivo, Sugerido = 0
          const nuevaCantidadSugerida = nuevoStockEnMano >= stockObjetivo ? 0 : (stockObjetivo - nuevoStockEnMano);
          
          return {
            ...i,
            stockEnMano: nuevoStockEnMano,
            cantidadSugerida: nuevaCantidadSugerida,
            // Auto-actualizar cantidad a pedir si aún no se ha modificado manualmente
            cantidadPedir: nuevaCantidadSugerida
          };
        }
        return i;
      })
    });
  };

  // Eliminar pedido
  const handleDeleteOrder = async (orderId) => {
    if (!orderId) {
      toast.error('❌ ID de pedido inválido');
      setConfirmDelete(null);
      return;
    }

    try {
      const loadingToast = toast.loading('Eliminando pedido...');
      console.log('🗑️ Eliminando pedido y movimientos relacionados:', orderId);
      
      // Eliminar pedido y sus movimientos relacionados
      await deleteOrderWithMovements(orderId, user.uid);
      
      // Actualizar estado local solo si la eliminación fue exitosa
      setOrders(prevOrders => prevOrders.filter(o => o.id !== orderId));
      
      toast.dismiss(loadingToast);
      toast.success('✓ Pedido eliminado exitosamente');
      console.log('✅ Pedido y movimientos eliminados correctamente');
      setConfirmDelete(null);
    } catch (error) {
      console.error('❌ Error al eliminar pedido:', error);
      
      // Mensajes de error específicos
      if (error.code === 'permission-denied') {
        toast.error('❌ No tienes permisos para eliminar este pedido');
      } else if (error.code === 'not-found') {
        toast.error('❌ El pedido no existe');
      } else if (error.message?.includes('network')) {
        toast.error('❌ Error de conexión. Verifica tu internet');
      } else {
        toast.error('❌ Error al eliminar el pedido');
      }
      
      setConfirmDelete(null);
    }
  };

  // Recibir mercancía - actualizar inventario con transacción atómica
  const handleReceiveOrder = async (orderId) => {
    // Validar que el ID del pedido existe
    if (!orderId) {
      console.warn('⚠️ Order ID is undefined');
      toast.error('❌ Error: ID de pedido inválido');
      return;
    }

    const order = orders.find(o => o.id === orderId);
    if (!order) {
      console.warn('⚠️ Order not found for ID:', orderId);
      toast.error('❌ Error: Pedido no encontrado');
      return;
    }

    // Validar que el pedido tiene productos
    if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
      console.warn('⚠️ Order items are undefined or empty:', order);
      toast.error('❌ Error: Pedido sin productos');
      return;
    }

    try {
      // Usar transacción para asegurar que stock y estado se actualicen juntos
      const loadingToast = toast.loading('Recibiendo mercancía...');
      
      await receiveOrderWithTransaction(orderId, order.items, user.uid);
      
      // Actualizar estado local
      const updatedOrder = { ...order, estado: 'Recibido' };
      setOrders(orders.map(o => o.id === orderId ? updatedOrder : o));
      
      // Actualizar productos en estado local
      const updatedProducts = [...products];
      order.items.forEach(item => {
        const productIndex = updatedProducts.findIndex(p => p.id === item.id);
        if (productIndex !== -1) {
          updatedProducts[productIndex] = {
            ...updatedProducts[productIndex],
            stockActual: (updatedProducts[productIndex].stockActual || 0) + item.cantidadPedir
          };
        }
      });
      setProducts(updatedProducts);
      
      setConfirmReceive(null);
      toast.dismiss(loadingToast);
      toast.success('✓ Mercancía recibida y stock actualizado correctamente');
    } catch (error) {
      console.error('Error receiving order:', error);
      
      // Mensajes de error específicos
      if (error.message.includes('no encontrado')) {
        toast.error('❌ El pedido no existe en la base de datos');
      } else if (error.message.includes('permisos')) {
        toast.error('❌ No tienes permisos para realizar esta operación');
      } else if (error.message.includes('conexión') || error.message.includes('network')) {
        toast.error('❌ Error de conexión. Verifica tu internet');
      } else {
        toast.error(`❌ Error al recibir mercancía: ${error.message || 'Intenta de nuevo'}`);
      }
    }
  };

  // Filtrar pedidos por búsqueda
  const filteredOrders = orders.filter(o =>
    o.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.proveedor?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Obtener color de estado
  const getEstadoColor = (estado) => {
    if (estado === 'Recibido') {
      return 'bg-green-900/30 text-green-400 border border-green-500/50';
    }
    return 'bg-orange-900/30 text-orange-400 border border-orange-500/50';
  };

  const getEstadoLabel = (estado) => {
    return estado === 'Recibido' ? '✓ Recibido' : '⏳ Pendiente';
  };

  // Generar mensaje de WhatsApp
  const generateWhatsAppMessage = (order, companyName) => {
    try {
      // Validar datos críticos
      if (!order) {
        console.warn('⚠️ Order object is undefined');
        return '';
      }

      // Obtener nombre del proveedor
      const supplierName = order.supplierName || order.proveedor || 'Proveedor';
      const empresa = companyName || 'MI EMPRESA';

      // Formatear fecha con Intl.DateTimeFormat
      let fechaFormato = 'Por confirmar';
      if (order.fechaEntrega) {
        try {
          const [
año, mes, día] = order.fechaEntrega.split('-');
          const date = new Date(año, parseInt(mes) - 1, día);
          
          const formatter = new Intl.DateTimeFormat('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          
          fechaFormato = formatter.format(date);
          // Capitalizar primer carácter (viernes → Viernes)
          fechaFormato = fechaFormato.charAt(0).toUpperCase() + fechaFormato.slice(1);
        } catch (error) {
          console.warn('⚠️ Error formatting delivery date:', error);
          fechaFormato = order.fechaEntrega || 'Por confirmar';
        }
      }

      // Obtener hora
      const hora = order.horaEntrega || 'Por confirmar';

      // Obtener dirección de entrega
      const direccion = order.direccionEntrega || companyData?.direccion || '';

      // 🔥 REFRESCO DE DATOS: Consultar productos actualizados para obtener unidad real
      let itemsList = '';
      if (order.items && Array.isArray(order.items) && order.items.length > 0) {
        const validItems = order.items.filter(item => {
          if (!item.nombre || !item.cantidadPedir) {
            console.warn('⚠️ Item missing nombre or cantidadPedir:', item);
            return false;
          }
          return true;
        });

        if (validItems.length === 0) {
          console.warn('⚠️ No valid items in order');
          itemsList = '- Sin productos';
        } else {
          // 🔥 Cruce de datos con products para traer unidad actualizada
          itemsList = validItems
            .map(item => {
              // Buscar producto actual en la colección de products por nombre o ID
              const currentProduct = products.find(p => 
                p.id === item.id || p.nombre === item.nombre
              );
              
              // Usar unidad actualizada del inventario, no la guardada en el pedido
              const unidadActualizada = currentProduct?.unidad || item.unidad || 'unidades';
              const cantidad = item.cantidadPedir;
              const nombre = item.nombre;
              
              // 🔥 FORMATEO DINÁMICO: [Cantidad] [Unidad] de [Producto]
              return `- ${cantidad} ${unidadActualizada.toLowerCase()} de ${nombre}`;
            })
            .join('%0A');
        }
      } else {
        console.warn('⚠️ Order items are undefined or empty');
        itemsList = '- Sin productos';
      }

      // Construir mensaje profesional con formato exacto
      let message = `Hola ${supplierName}, te adjunto el pedido de *${empresa}*:

El pedido lo necesito para el *${fechaFormato}* a las *${hora}*`;
      
      // Añadir dirección si existe
      if (direccion) {
        message += `

*Dirección de entrega:*
${direccion}`;
      }
      
      message += `

*Detalle del pedido:*
${decodeURIComponent(itemsList)}

Me confirmas por favor el total, gracias.

_Mensaje generado automáticamente mediante el sistema InventarioX_ 📦`;

      return encodeURIComponent(message);
    } catch (error) {
      console.error('Error generating WhatsApp message:', error);
      return '';
    }
  };

  // Copiar al portapapeles
  const copyToClipboard = (order) => {
    // 🔥 MAPEO DE UNIDADES: Consultar products para obtener unidad actualizada
    const itemsList = order.items
      .map(item => {
        // Buscar producto actual para obtener unidad real
        const currentProduct = products.find(p => 
          p.id === item.id || p.nombre === item.nombre
        );
        
        // 🔥 LÓGICA DINÁMICA: Usar unidad del producto, fallback a 'unidades'
        const unidad = currentProduct?.unidad || item.unidad || 'unidades';
        
        // 🔥 FORMATO FINAL: [Cantidad] [Unidad] de [Nombre del Producto]
        return `• ${item.cantidadPedir} ${unidad.toLowerCase()} de ${item.nombre}`;
      })
      .join('\n');
    
    const text = `Hola, le escribo respecto al pedido: ${order.id}\n\nProveedor: ${order.proveedor}\nFecha: ${formatDate(order.fecha)}\n\nProductos:\n${itemsList}\n\nTotal: $${formatCurrency(order.total)}\n\nGracias!`;
    
    navigator.clipboard.writeText(text);
    alert('Mensaje copiado al portapapeles');
  };

  // Obtener número del proveedor
  const getProviderPhone = (providerName) => {
    const provider = listaProveedores.find(p => p.nombre === providerName);
    return provider?.telefono || provider?.whatsapp || null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#206DDA]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111827] light-mode:bg-gray-50 p-4 sm:p-6 lg:p-8 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        {/* Encabezado */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-white light-mode:text-gray-900 mb-2">
            Pedidos
          </h1>
          <p className="text-gray-400 light-mode:text-gray-600">
            Gestión de pedidos a proveedores
          </p>
        </div>

        {/* Barra de búsqueda */}
        <div className="mb-8 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-3 w-5 h-5 text-gray-500 light-mode:text-gray-400" />
            <input
              type="text"
              placeholder="Buscar pedidos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2 bg-[#1f2937] light-mode:bg-white border-2 border-gray-700 light-mode:border-gray-300 rounded-lg text-white light-mode:text-gray-900 placeholder-gray-500 focus:border-[#206DDA] focus:outline-none transition-all"
            />
          </div>
          <button 
            onClick={() => setIsAddingPedido(true)}
            className="flex items-center gap-2 bg-[#206DDA] hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition-all"
          >
            <Plus className="w-5 h-5" />
            Nuevo
          </button>
        </div>

        {/* FORMULARIO NUEVO PEDIDO */}
        {isAddingPedido && (
          <div className="mb-8 bg-[#1f2937] light-mode:bg-white rounded-lg border border-gray-700 light-mode:border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white light-mode:text-gray-900">
                Crear Nuevo Pedido
              </h2>
              <button
                onClick={() => {
                  setIsAddingPedido(false);
                  setFormData({ proveedor: '', fechaEntrega: '', horaEntrega: '', direccionEntrega: '', items: [] });
                }}
                className="p-2 hover:bg-gray-700 light-mode:hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400 light-mode:text-gray-600" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Selector de Proveedor */}
              <div>
                <label className="block text-sm font-bold text-gray-300 light-mode:text-gray-700 mb-3 uppercase tracking-wide">
                  Seleccionar Proveedor
                </label>
                <select
                  value={formData.proveedor}
                  onChange={(e) => setFormData({ ...formData, proveedor: e.target.value, items: [] })}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-[#111827] light-mode:bg-gray-50 border-2 border-gray-600 light-mode:border-gray-300 rounded-lg text-white light-mode:text-gray-900 font-semibold focus:border-[#206DDA] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {loading ? '⏳ Cargando proveedores...' : '-- Elige un proveedor --'}
                  </option>
                  {listaProveedores.map(p => (
                    <option key={p.id} value={p.nombre}>
                      {p.nombre} {p.contacto ? `(${p.contacto})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fecha y Hora de Entrega */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-300 light-mode:text-gray-700 mb-3 uppercase tracking-wide">
                    📅 Fecha de Entrega
                  </label>
                  <input
                    type="date"
                    value={formData.fechaEntrega}
                    onChange={(e) => setFormData({ ...formData, fechaEntrega: e.target.value })}
                    className="w-full px-4 py-3 bg-[#111827] light-mode:bg-gray-50 border-2 border-gray-600 light-mode:border-gray-300 rounded-lg text-white light-mode:text-gray-900 font-semibold focus:border-[#206DDA] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-300 light-mode:text-gray-700 mb-3 uppercase tracking-wide">
                    🕐 Hora de Entrega
                  </label>
                  <input
                    type="time"
                    value={formData.horaEntrega}
                    onChange={(e) => setFormData({ ...formData, horaEntrega: e.target.value })}
                    className="w-full px-4 py-3 bg-[#111827] light-mode:bg-gray-50 border-2 border-gray-600 light-mode:border-gray-300 rounded-lg text-white light-mode:text-gray-900 font-semibold focus:border-[#206DDA] focus:outline-none"
                  />
                </div>
              </div>

              {/* Selector de Dirección de Entrega */}
              {(companyData?.direccion || companyData?.direccion2) && (
                <div>
                  <label className="block text-sm font-bold text-gray-300 light-mode:text-gray-700 mb-3 uppercase tracking-wide">
                    📍 Dirección de Entrega
                  </label>
                  <select
                    value={formData.direccionEntrega}
                    onChange={(e) => setFormData({ ...formData, direccionEntrega: e.target.value })}
                    className="w-full px-4 py-3 bg-[#111827] light-mode:bg-gray-50 border-2 border-gray-600 light-mode:border-gray-300 rounded-lg text-white light-mode:text-gray-900 font-semibold focus:border-[#206DDA] focus:outline-none"
                  >
                    {companyData?.direccion && (
                      <option value={companyData.direccion}>
                        {companyData.direccion}
                      </option>
                    )}
                    {companyData?.direccion2 && (
                      <option value={companyData.direccion2}>
                        {companyData.direccion2}
                      </option>
                    )}
                  </select>
                  <p className="text-xs text-gray-400 light-mode:text-gray-600 mt-2">
                    Esta dirección se incluirá en el mensaje de WhatsApp
                  </p>
                </div>
              )}

              {/* Selector de Productos */}
              {formData.proveedor && (
                <div>
                  <label className="block text-sm font-bold text-gray-300 light-mode:text-gray-700 mb-3 uppercase tracking-wide">
                    Agregar Productos
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto p-3 bg-[#111827] light-mode:bg-gray-50 rounded-lg border-2 border-gray-600 light-mode:border-gray-300">
                    {products
                      .filter(product => product.proveedor === formData.proveedor)
                      .map(product => {
                        const isSelected = formData.items.some(i => i.id === product.id);
                        return (
                          <button
                            key={product.id}
                            onClick={() => handleAddItem(product.id)}
                            className={`text-left p-3 rounded-lg border-2 transition-all font-semibold text-sm ${
                              isSelected
                                ? 'bg-[#206DDA] border-blue-400 text-white'
                                : 'bg-gray-700 light-mode:bg-white border-gray-500 light-mode:border-gray-300 text-gray-300 light-mode:text-gray-900 hover:border-[#206DDA]'
                            }`}
                          >
                            {product.nombre}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Items agregados */}
              {formData.items.length > 0 && (
                <div>
                  <label className="block text-sm font-bold text-gray-300 light-mode:text-gray-700 mb-2 uppercase tracking-wide">
                    Productos a Pedir ({formData.items.length})
                  </label>
                  <div className="space-y-1 overflow-x-auto">
                    {formData.items.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 p-2 bg-[#111827] light-mode:bg-gray-50 rounded border border-gray-600 light-mode:border-gray-300 text-xs whitespace-nowrap"
                      >
                        {/* Nombre y Costo a la izquierda */}
                        <div className="min-w-[140px]">
                          <p className="font-bold text-white light-mode:text-gray-900 truncate">{item.nombre}</p>
                          <p className="text-xs text-gray-400 light-mode:text-gray-600">${formatCurrency(item.costo)}/u</p>
                        </div>

                        {/* Bloque de datos centrado con anchos fijos */}
                        <div className="flex items-center gap-3 flex-shrink-0 justify-center">
                          {/* Stock Actual */}
                          <div className="w-24">
                            <label className="text-xs text-gray-400 light-mode:text-gray-600 block mb-0.5">Actual:</label>
                            <input
                              type="number"
                              inputMode="numeric"
                              min="0"
                              value={item.stockEnMano || 0}
                              onChange={(e) => handleUpdateStockEnMano(item.id, e.target.value)}
                              className="w-full px-2 py-1 bg-[#1f2937] light-mode:bg-white border border-gray-600 light-mode:border-gray-300 rounded text-white light-mode:text-gray-900 text-center text-xs focus:outline-none focus:border-[#206DDA]"
                            />
                          </div>

                          {/* Stock Objetivo */}
                          <div className="w-16">
                            <label className="text-xs text-gray-400 light-mode:text-gray-600 block mb-0.5">Obj:</label>
                            <p className="w-full px-1.5 py-1 bg-[#1f2937] light-mode:bg-gray-100 border border-gray-600 light-mode:border-gray-300 rounded text-white light-mode:text-gray-900 text-center text-xs font-bold">
                              {item.stockObjetivo || 10}
                            </p>
                          </div>

                          {/* Cantidad Sugerida */}
                          <div className="w-16">
                            <label className="text-xs text-yellow-400 light-mode:text-yellow-600 block mb-0.5 font-bold">Sug:</label>
                            <p className="w-full px-1.5 py-1 bg-yellow-900/30 light-mode:bg-yellow-100 border border-yellow-600 light-mode:border-yellow-400 rounded text-yellow-300 light-mode:text-yellow-700 text-center text-xs font-bold">
                              {item.cantidadSugerida || 0}
                            </p>
                          </div>

                          {/* Cantidad a Pedir - Optimizado para móvil */}
                          <div className="w-24">
                            <label className="text-xs text-gray-400 light-mode:text-gray-600 block mb-0.5">Pedir:</label>
                            <input
                              type="tel"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={item.cantidadPedir === '' ? '' : item.cantidadPedir}
                              onChange={(e) => handleUpdateQty(item.id, e.target.value)}
                              onBlur={(e) => {
                                // Si está vacío al perder foco, poner 1 por defecto
                                if (e.target.value === '' || e.target.value === '0') {
                                  handleUpdateQty(item.id, 1);
                                }
                              }}
                              placeholder="1"
                              className="w-full px-2 py-2 bg-[#1f2937] light-mode:bg-white border-2 border-gray-600 light-mode:border-gray-300 rounded text-white light-mode:text-gray-900 text-center text-base font-bold focus:outline-none focus:border-[#206DDA] focus:ring-2 focus:ring-[#206DDA]/50"
                            />
                          </div>
                        </div>

                        {/* Subtotal y eliminar a la derecha */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="w-20 text-center">
                            <p className="text-xs text-yellow-400 font-bold">
                              ${formatCurrency(item.costo * item.cantidadPedir)}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1 hover:bg-gray-700 light-mode:hover:bg-gray-200 rounded transition-colors"
                            title="Eliminar producto"
                          >
                            <X className="w-4 h-4 text-red-400 light-mode:text-red-600" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Total */}
              {formData.items.length > 0 && (
                <div className="p-4 bg-[#111827] light-mode:bg-gray-50 rounded-lg border-2 border-[#206DDA]">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-bold text-gray-400 light-mode:text-gray-600 uppercase">Total del Pedido</p>
                    <p className="text-2xl font-black text-yellow-400">
                      ${formatCurrency(formData.items.reduce((sum, i) => sum + (i.costo * i.cantidadPedir), 0))}
                    </p>
                  </div>
                </div>
              )}

              {/* Botones de acción - Responsivos y táctiles */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={handleCreateOrder}
                  disabled={!formData.proveedor || formData.items.length === 0}
                  className="w-full sm:flex-1 px-6 py-4 sm:py-3 bg-[#206DDA] hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl active:scale-95 text-base sm:text-sm"
                >
                  ✓ Crear Pedido
                </button>
                <button
                  onClick={() => {
                    setIsAddingPedido(false);
                    setFormData({ proveedor: '', fechaEntrega: '', horaEntrega: '', direccionEntrega: '', items: [] });
                  }}
                  className="w-full sm:flex-1 px-6 py-4 sm:py-3 bg-gray-700 light-mode:bg-gray-300 hover:bg-gray-600 light-mode:hover:bg-gray-400 text-white light-mode:text-gray-900 font-bold rounded-lg transition-all active:scale-95 text-base sm:text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LISTADO DE PEDIDOS */}
        {filteredOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map(order => (
              <div 
                key={order.id}
                className={`rounded-lg p-6 transition-all relative ${
                  order.estado === 'Recibido'
                    ? 'bg-[#1f2937]/80 light-mode:bg-green-50 border-2 border-green-500 shadow-lg shadow-green-500/20'
                    : 'bg-[#1f2937] light-mode:bg-white border border-gray-700 light-mode:border-gray-200 hover:border-[#206DDA]/50'
                }`}
              >
                {/* Estructura: Header - Content - Actions */}
                <div className="flex flex-col h-full">
                  {/* Encabezado */}
                  <div className="mb-4 pb-4 border-b border-gray-600 light-mode:border-gray-300">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white light-mode:text-gray-900">
                          {order.proveedor || 'Sin proveedor'}
                        </h3>
                      </div>
                      <button
                        onClick={() => setConfirmDelete(order.id)}
                        className="p-2 hover:bg-red-500/20 light-mode:hover:bg-red-100 rounded-lg transition-colors flex-shrink-0 relative z-10 active:scale-95"
                        title="Eliminar pedido"
                      >
                        <Trash2 className="w-5 h-5 text-red-400 light-mode:text-red-600" />
                      </button>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm text-[#206DDA] font-semibold">
                        ID: {order.id}
                      </p>
                      <p className="text-xs text-gray-400 light-mode:text-gray-600">
                        📅 {formatDate(order.fecha)}
                      </p>
                    </div>
                  </div>

                  {/* Contenido de tarjeta */}
                  <div className="space-y-3 mb-6 flex-1">
                    {/* Estado - Solo un badge */}
                    <div className="p-3 bg-[#111827] light-mode:bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-400 light-mode:text-gray-600 font-bold uppercase mb-2">
                        Estado
                      </p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getEstadoColor(order.estado)}`}>
                        {getEstadoLabel(order.estado)}
                      </span>
                    </div>

                    {/* Total */}
                    {order.total && (
                      <div className="p-3 bg-[#111827] light-mode:bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-400 light-mode:text-gray-600 font-bold mb-1 uppercase">
                          Monto
                        </p>
                        <p className="text-yellow-400 font-bold text-lg">
                          ${formatCurrency(order.total)}
                        </p>
                      </div>
                    )}

                    {/* Items resumen */}
                    {order.items && order.items.length > 0 && (
                      <div className="p-3 bg-[#111827] light-mode:bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-400 light-mode:text-gray-600 font-bold mb-2 uppercase">
                          Items ({order.items.length})
                        </p>
                        <ul className="text-sm text-gray-300 light-mode:text-gray-700 space-y-1">
                          {order.items.map((item, idx) => {
                            // 🔥 ACTUALIZACIÓN DE PEDIDOS PENDIENTES: Consultar unidad actual del inventario
                            const currentProduct = products.find(p => 
                              p.id === item.id || p.nombre === item.nombre
                            );
                            const unidadActualizada = currentProduct?.unidad || item.unidad || 'unidades';
                            
                            return (
                              <li key={idx} className="truncate">
                                • {item.cantidadPedir} {unidadActualizada.toLowerCase()} de {item.nombre}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Botones de acción - Fila dedicada */}
                  <div className="pt-4 border-t border-gray-600 light-mode:border-gray-300 space-y-3">
                    {order.estado !== 'Recibido' && (
                      <button
                        onClick={() => setConfirmReceive(order.id)}
                        className="w-full flex items-center justify-center gap-2 bg-[#206DDA] hover:bg-blue-600 text-white px-4 py-4 rounded-lg font-bold transition-all text-base shadow-lg hover:shadow-xl active:scale-95"
                        title="Marcar como recibido"
                      >
                        <Check className="w-5 h-5" />
                        Recibir Mercancía
                      </button>
                    )}
                    <button
                      onClick={() => {
                        const phone = getProviderPhone(order.proveedor);
                        const companyName = companyData?.nombre || companyData?.nombreEmpresa || 'MI EMPRESA';
                        if (phone) {
                          const message = generateWhatsAppMessage(order, companyName);
                          toast('Abriendo WhatsApp...');
                          window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${message}`, '_blank');
                        } else {
                          toast('Mensaje copiado al portapapeles');
                          copyToClipboard(order);
                        }
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-4 rounded-lg font-bold transition-all text-base shadow-lg hover:shadow-xl active:scale-95"
                      title="Enviar por WhatsApp"
                    >
                      <MessageCircle className="w-5 h-5" />
                      WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-[#1f2937] light-mode:bg-white rounded-lg border-2 border-dashed border-gray-700 light-mode:border-gray-300">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 light-mode:text-gray-600 text-lg">
              {orders.length === 0 ? 'No hay pedidos registrados' : 'No se encontraron resultados'}
            </p>
          </div>
        )}

        {/* Modal de confirmación - Eliminar */}
        <ConfirmationModal
          isOpen={confirmDelete !== null}
          title="¿Eliminar este pedido?"
          message="¿Estás seguro de eliminar este registro? Esta acción no se puede deshacer."
          onConfirm={() => handleDeleteOrder(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
          confirmText="Eliminar"
          cancelText="Cancelar"
          isDangerous={true}
        />

        {/* Modal de confirmación - Recibir */}
        <ConfirmationModal
          isOpen={confirmReceive !== null}
          title="¿Recibir esta mercancía?"
          message="Se agregarán automáticamente las cantidades al inventario y el pedido se marcará como recibido."
          onConfirm={() => handleReceiveOrder(confirmReceive)}
          onCancel={() => setConfirmReceive(null)}
          confirmText="Sí, recibir"
          cancelText="Cancelar"
          isDangerous={false}
        />
      </div>
    </div>
  );
}
