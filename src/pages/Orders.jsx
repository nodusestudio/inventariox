import { Search, Plus, X, Trash2, Check, AlertCircle } from 'lucide-react';
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

  // Eliminar pedido
  const handleDeleteOrder = (orderId) => {
    setOrders(orders.filter(o => o.id !== orderId));
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
            className="flex items-center gap-2 bg-[#206DDA] hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition-all"
          >
            <Plus className="w-5 h-5" />
            Nuevo
          </button>
        </div>

        {/* Lista de tarjetas de pedidos */}
        {filteredOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map(order => (
              <div 
                key={order.id}
                className="bg-[#1f2937] light-mode:bg-white rounded-lg border border-gray-700 light-mode:border-gray-200 p-6 hover:border-[#206DDA]/50 transition-all"
              >
                {/* Encabezado de tarjeta */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white light-mode:text-gray-900">
                      {order.proveedor || 'Sin proveedor'}
                    </h3>
                    <p className="text-sm text-[#206DDA] font-semibold mt-1">
                      {order.id}
                    </p>
                  </div>
                  <button
                    onClick={() => setConfirmDelete(order.id)}
                    className="p-2 hover:bg-gray-700 light-mode:hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400 light-mode:text-red-600" />
                  </button>
                </div>

                {/* Contenido de tarjeta */}
                <div className="space-y-3 mb-4">
                  {/* Fecha */}
                  <div className="p-3 bg-[#111827] light-mode:bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-400 light-mode:text-gray-600 font-bold mb-1 uppercase">
                      Fecha
                    </p>
                    <p className="text-white light-mode:text-gray-900 font-semibold">
                      {formatDate(order.fecha)}
                    </p>
                  </div>

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

                {/* Botones de acción */}
                {order.estado !== 'Recibido' && (
                  <button
                    onClick={() => setConfirmReceive(order.id)}
                    className="w-full flex items-center justify-center gap-2 bg-[#206DDA] hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-all"
                  >
                    <Check className="w-4 h-4" />
                    Recibir Mercancía
                  </button>
                )}
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
