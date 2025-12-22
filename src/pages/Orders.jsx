import { Search, Plus, X, Trash2, Check, AlertCircle, MessageCircle } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';
import { useState, useEffect } from 'react';

export default function Orders({ 
  language = 'es', 
  productsData = [], 
  providers = [], 
  stockData = [], 
  companyData = {}, 
  ordersData = [], 
  setOrdersData,
  setStockData 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState(() => {
    if (ordersData && ordersData.length > 0) {
      return ordersData;
    }
    const saved = localStorage.getItem('inventariox_orders');
    return saved ? JSON.parse(saved) : [];
  });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmReceive, setConfirmReceive] = useState(null);
  const [isAddingPedido, setIsAddingPedido] = useState(false);
  const [formData, setFormData] = useState({
    proveedor: '',
    items: []
  });

  // Guardar cambios en localStorage
  useEffect(() => {
    localStorage.setItem('inventariox_orders', JSON.stringify(orders));
    if (setOrdersData) {
      setOrdersData(orders);
    }
  }, [orders, setOrdersData]);

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
  const handleCreateOrder = () => {
    if (!formData.proveedor) {
      alert('Selecciona un proveedor');
      return;
    }
    if (formData.items.length === 0) {
      alert('Agrega al menos un producto');
      return;
    }

    const newOrder = {
      id: `PED-${Date.now()}`,
      proveedor: formData.proveedor,
      fecha: new Date().toISOString().split('T')[0],
      items: formData.items,
      total: formData.items.reduce((sum, item) => sum + ((item.precioUnitario || 0) * item.cantidadPedir), 0),
      estado: 'Pendiente'
    };

    setOrders([...orders, newOrder]);
    setIsAddingPedido(false);
    setFormData({ proveedor: '', items: [] });
  };

  // Agregar producto al formulario
  const handleAddItem = (productId) => {
    const product = productsData.find(p => p.id === productId);
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
      setFormData({
        ...formData,
        items: [...formData.items, { 
          id: productId,
          nombre: product.nombre,
          precioUnitario: product.precioUnitario || 0,
          cantidadPedir: 1
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

  // Actualizar cantidad
  const handleUpdateQty = (productId, qty) => {
    if (qty <= 0) {
      handleRemoveItem(productId);
    } else {
      setFormData({
        ...formData,
        items: formData.items.map(i =>
          i.id === productId ? { ...i, cantidadPedir: qty } : i
        )
      });
    }
  };

  // Eliminar pedido
  const handleDeleteOrder = (orderId) => {
    const updatedOrders = orders.filter(o => o.id !== orderId);
    setOrders(updatedOrders);
    localStorage.setItem('inventariox_orders', JSON.stringify(updatedOrders));
    setConfirmDelete(null);
  };

  // Recibir mercancía - actualizar inventario
  const handleReceiveOrder = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    // Actualizar stock con los items del pedido
    const updatedStock = stockData.map(stock => {
      const orderItem = order.items?.find(item => item.id === stock.productoId);
      if (orderItem) {
        const newQty = (parseInt(stock.stockActual) || 0) + (orderItem.cantidadPedir || 0);
        return {
          ...stock,
          stockActual: newQty.toString()
        };
      }
      return stock;
    });

    // Actualizar localStorage de stock
    localStorage.setItem('inventariox_stock', JSON.stringify(updatedStock));
    if (setStockData) {
      setStockData(updatedStock);
    }

    // Cambiar estado del pedido a "Recibido"
    const updatedOrders = orders.map(o => 
      o.id === orderId ? { ...o, estado: 'Recibido' } : o
    );
    setOrders(updatedOrders);
    localStorage.setItem('inventariox_orders', JSON.stringify(updatedOrders));
    setConfirmReceive(null);
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
  const generateWhatsAppMessage = (order) => {
    const itemsList = order.items
      .map(item => `• ${item.nombre}: ${item.cantidadPedir} unidades`)
      .join('%0A');
    
    const message = `Hola, le escribo respecto al pedido: ${order.id}%0A%0AProveedor: ${order.proveedor}%0AFecha: ${formatDate(order.fecha)}%0A%0AProductos:%0A${itemsList}%0A%0ATotal: $${formatCurrency(order.total)}%0A%0AGracias!`;
    
    return message;
  };

  // Copiar al portapapeles
  const copyToClipboard = (order) => {
    const itemsList = order.items
      .map(item => `• ${item.nombre}: ${item.cantidadPedir} unidades`)
      .join('\n');
    
    const text = `Hola, le escribo respecto al pedido: ${order.id}\n\nProveedor: ${order.proveedor}\nFecha: ${formatDate(order.fecha)}\n\nProductos:\n${itemsList}\n\nTotal: $${formatCurrency(order.total)}\n\nGracias!`;
    
    navigator.clipboard.writeText(text);
    alert('Mensaje copiado al portapapeles');
  };

  // Obtener número del proveedor
  const getProviderPhone = (providerName) => {
    const provider = providers.find(p => p.nombre === providerName);
    return provider?.whatsapp || null;
  };

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
                  setFormData({ proveedor: '', items: [] });
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
                  onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                  className="w-full px-4 py-3 bg-[#111827] light-mode:bg-gray-50 border-2 border-gray-600 light-mode:border-gray-300 rounded-lg text-white light-mode:text-gray-900 font-semibold focus:border-[#206DDA] focus:outline-none"
                >
                  <option value="">-- Elige un proveedor --</option>
                  {providers.map(p => (
                    <option key={p.id} value={p.nombre}>
                      {p.nombre} {p.contacto ? `(${p.contacto})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector de Productos */}
              {formData.proveedor && (
                <div>
                  <label className="block text-sm font-bold text-gray-300 light-mode:text-gray-700 mb-3 uppercase tracking-wide">
                    Agregar Productos
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto p-3 bg-[#111827] light-mode:bg-gray-50 rounded-lg border-2 border-gray-600 light-mode:border-gray-300">
                    {productsData.map(product => {
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
                  <label className="block text-sm font-bold text-gray-300 light-mode:text-gray-700 mb-3 uppercase tracking-wide">
                    Productos a Pedir ({formData.items.length})
                  </label>
                  <div className="space-y-3">
                    {formData.items.map(item => (
                      <div key={item.id} className="flex items-center gap-3 p-4 bg-[#111827] light-mode:bg-gray-50 rounded-lg border border-gray-600 light-mode:border-gray-300">
                        <div className="flex-1">
                          <p className="font-bold text-white light-mode:text-gray-900">{item.nombre}</p>
                          <p className="text-xs text-gray-400 light-mode:text-gray-600">
                            ${formatCurrency(item.precioUnitario)} c/u
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            value={item.cantidadPedir}
                            onChange={(e) => handleUpdateQty(item.id, parseInt(e.target.value) || 1)}
                            className="w-16 px-2 py-2 bg-[#1f2937] light-mode:bg-white border border-gray-600 light-mode:border-gray-300 rounded text-white light-mode:text-gray-900 text-center focus:outline-none focus:border-[#206DDA]"
                          />
                          <p className="text-yellow-400 font-bold w-24 text-right">
                            ${formatCurrency(item.precioUnitario * item.cantidadPedir)}
                          </p>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-2 hover:bg-gray-700 light-mode:hover:bg-gray-200 rounded-lg transition-colors"
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
                      ${formatCurrency(formData.items.reduce((sum, i) => sum + (i.precioUnitario * i.cantidadPedir), 0))}
                    </p>
                  </div>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleCreateOrder}
                  disabled={!formData.proveedor || formData.items.length === 0}
                  className="flex-1 px-6 py-3 bg-[#206DDA] hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl"
                >
                  ✓ Crear Pedido
                </button>
                <button
                  onClick={() => {
                    setIsAddingPedido(false);
                    setFormData({ proveedor: '', items: [] });
                  }}
                  className="flex-1 px-6 py-3 bg-gray-700 light-mode:bg-gray-300 hover:bg-gray-600 light-mode:hover:bg-gray-400 text-white light-mode:text-gray-900 font-bold rounded-lg transition-all"
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
                {/* Badge Recibido */}
                {order.estado === 'Recibido' && (
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                    ✓ RECIBIDO
                  </div>
                )}

                {/* Estructura: Header - Content - Actions */}
                <div className="flex flex-col h-full">
                  {/* Encabezado */}
                  <div className="mb-4 pb-4 border-b border-gray-600 light-mode:border-gray-300">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white light-mode:text-gray-900 mb-1">
                          {order.proveedor || 'Sin proveedor'}
                        </h3>
                        <p className="text-sm text-[#206DDA] font-semibold">
                          ID: {order.id}
                        </p>
                      </div>
                      <button
                        onClick={() => setConfirmDelete(order.id)}
                        className="p-2 hover:bg-gray-700 light-mode:hover:bg-gray-200 rounded-lg transition-colors ml-2"
                        title="Eliminar pedido"
                      >
                        <Trash2 className="w-4 h-4 text-red-400 light-mode:text-red-600" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 light-mode:text-gray-600 mt-2">
                      📅 {formatDate(order.fecha)}
                    </p>
                  </div>

                  {/* Contenido de tarjeta */}
                  <div className="space-y-3 mb-6 flex-1">
                  {/* Estado */}
                  <div className="p-3 bg-[#111827] light-mode:bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-400 light-mode:text-gray-600 font-bold mb-2 uppercase">
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
                        {order.items.map((item, idx) => (
                          <li key={idx} className="truncate">
                            • {item.nombre} ×{item.cantidadPedir}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  </div>

                  {/* Botones de acción - Fila dedicada */}
                  <div className="pt-4 border-t border-gray-600 light-mode:border-gray-300">
                    <div className="flex gap-3">
                      {order.estado !== 'Recibido' && (
                        <button
                          onClick={() => setConfirmReceive(order.id)}
                          className="flex-1 flex items-center justify-center gap-2 bg-[#206DDA] hover:bg-blue-600 text-white px-3 py-2 rounded-lg font-semibold transition-all text-sm"
                          title="Marcar como recibido"
                        >
                          <Check className="w-4 h-4" />
                          Recibir
                        </button>
                      )}
                      <button
                        onClick={() => {
                          const phone = getProviderPhone(order.proveedor);
                          if (phone) {
                            const message = generateWhatsAppMessage(order);
                            window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${message}`, '_blank');
                          } else {
                            copyToClipboard(order);
                          }
                        }}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-semibold transition-all text-sm"
                        title="Enviar por WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp
                      </button>
                    </div>
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
