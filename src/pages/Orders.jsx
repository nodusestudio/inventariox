import { Search, Plus, X, Trash2, MessageCircle } from 'lucide-react';
import TableContainer from '../components/TableContainer';
import { useState, useEffect } from 'react';
import { t } from '../utils/translations';

export default function Orders({ language = 'es', productsData = [], providers = [], stockData = [], companyData = {}, ordersData = [], setOrdersData }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState(() => {
    if (ordersData && ordersData.length > 0) {
      return ordersData;
    }
    const saved = localStorage.getItem('inventariox_orders');
    return saved ? JSON.parse(saved) : [];
  });
  const [confirmDelete, setConfirmDelete] = useState(null);
  
  // Estados para el flujo de creación de pedido
  const [step, setStep] = useState('list'); // 'list', 'provider-select', 'products-select', 'confirm'
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [orderTotal, setOrderTotal] = useState(0);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');

  // Guardar cambios en localStorage y en App.jsx
  useEffect(() => {
    localStorage.setItem('inventariox_orders', JSON.stringify(orders));
    if (setOrdersData) {
      setOrdersData(orders);
    }
  }, [orders, setOrdersData]);

  // Funciones de formateo
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Obtener productos vinculados a un proveedor
  const getProductsByProvider = (provider) => {
    // Filtrar por nombre del proveedor (coincidencia)
    return productsData.filter(p => p.proveedor === provider.nombre);
  };

  // Obtener información de stock de un producto
  const getStockInfo = (productId) => {
    const stock = stockData.find(s => s.productoId === productId);
    if (!stock) {
      return {
        stockActual: 0,
        stockMinimo: 0,
        stockCompra: 0,
        sugerencia: 0
      };
    }
    const stockActual = parseInt(stock.stockActual) || 0;
    const stockMinimo = parseInt(stock.stockMinimo) || 0;
    const stockCompra = parseInt(stock.stockCompra) || 0;
    const sugerencia = Math.max(0, stockCompra - stockActual);
    
    return {
      stockActual,
      stockMinimo,
      stockCompra,
      sugerencia
    };
  };

  // Obtener sugerencia de compra para un producto
  const getSuggestion = (productId) => {
    return getStockInfo(productId).sugerencia;
  };

  // Iniciar creación de nuevo pedido
  const handleNewOrder = () => {
    setOrderItems([]);
    setOrderTotal(0);
    setSelectedProvider(null);
    setStep('provider-select');
  };

  // Seleccionar proveedor
  const handleSelectProvider = (providerId) => {
    const provider = providers.find(p => p.id === providerId);
    setSelectedProvider(provider);
    
    // Obtener productos del proveedor
    const productsOfProvider = getProductsByProvider(provider);
    
    // Inicializar items con información completa
    const items = productsOfProvider.map(product => {
      const stockInfo = getStockInfo(product.id);
      return {
        id: product.id,
        nombre: product.nombre,
        stockActual: stockInfo.stockActual,
        sugerencia: stockInfo.sugerencia,
        cantidadPedir: stockInfo.sugerencia, // Pre-rellenado con sugerencia
        costo: product.costo || 0
      };
    });
    
    setOrderItems(items);
    setStep('products-select');
  };

  // Actualizar cantidad a pedir de un producto
  const handleQuantityChange = (productId, quantity) => {
    const updated = orderItems.map(item =>
      item.id === productId ? { ...item, cantidadPedir: parseInt(quantity) || 0 } : item
    );
    setOrderItems(updated);
    
    // Calcular total
    const total = updated.reduce((sum, item) => sum + (item.cantidadPedir * item.costo), 0);
    setOrderTotal(total);
  };

  // Validar y pasar a confirmación
  const handleContinueToConfirm = () => {
    const hasItems = orderItems.some(item => item.cantidadPedir > 0);
    if (!hasItems) {
      alert(language === 'es' ? 'Debes seleccionar al menos 1 producto' : 'You must select at least 1 product');
      return;
    }
    setStep('confirm');
  };

  // Generar mensaje para WhatsApp
  const generateWhatsAppMessage = () => {
    const itemsList = orderItems
      .filter(item => item.cantidadPedir > 0)
      .map(item => `- ${item.nombre}: ${item.cantidadPedir} un.`)
      .join('\n');
    
    // Formatear fecha de entrega si existe
    let deliveryInfo = '';
    if (deliveryDate || deliveryTime) {
      let dateText = '';
      let timeText = '';
      
      if (deliveryDate) {
        const dateObj = new Date(deliveryDate + 'T00:00:00');
        dateText = dateObj.toLocaleDateString('es-CL', { 
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      }
      
      if (deliveryTime) {
        timeText = deliveryTime;
      }
      
      if (dateText && timeText) {
        deliveryInfo = `\n${language === 'es' ? 'El pedido lo necesito para el' : 'I need the order for'} ${dateText} ${language === 'es' ? 'y hora' : 'and time'} ${timeText}\n`;
      } else if (dateText) {
        deliveryInfo = `\n${language === 'es' ? 'El pedido lo necesito para el' : 'I need the order for'} ${dateText}\n`;
      } else if (timeText) {
        deliveryInfo = `\n${language === 'es' ? 'El pedido lo necesito para la hora' : 'I need the order for'} ${timeTime}\n`;
      }
    }
    
    const finalMessage = language === 'es'
      ? `\n\nMe confirmas por favor y el total, gracias`
      : `\n\nPlease confirm and the total, thank you`;
    
    // Extraer nombre de empresa y dirección del companyData
    const empresaNombre = companyData?.nombreEmpresa || 'Mi Empresa';
    const empresaDireccion = companyData?.direccion ? `\nDireccion: ${companyData.direccion}` : '';
    
    const message = language === 'es'
      ? `Hola ${selectedProvider.nombre}, te adjunto el pedido de ${empresaNombre}:${empresaDireccion}${deliveryInfo}\n${itemsList}${finalMessage}`
      : `Hello ${selectedProvider.nombre}, I'm sending you ${empresaNombre}'s order:${empresaDireccion}${deliveryInfo}\n${itemsList}${finalMessage}`;
    
    return encodeURIComponent(message);
  };

  // Enviar por WhatsApp
  const handleSendWhatsApp = () => {
    // Extraer número de WhatsApp del proveedor
    const phoneNumber = selectedProvider?.whatsapp || '';
    
    if (!phoneNumber) {
      alert(language === 'es' 
        ? 'El proveedor no tiene número de WhatsApp registrado' 
        : 'Provider has no WhatsApp number');
      return;
    }
    
    const message = generateWhatsAppMessage();
    // Formato: https://wa.me/[numero] (sin +)
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    
    // Crear el pedido en el historial
    const newOrder = {
      id: 'PED-' + String(orders.length + 1).padStart(3, '0'),
      proveedorId: selectedProvider.id,
      proveedor: selectedProvider.nombre,
      fecha: new Date().toISOString().split('T')[0],
      items: orderItems.filter(i => i.cantidadPedir > 0),
      total: orderTotal,
      fechaEntrega: deliveryDate,
      horaEntrega: deliveryTime,
      estado: language === 'es' ? 'Enviado' : 'Sent',
      enviado: new Date().toLocaleString('es-CL')
    };
    
    setOrders([...orders, newOrder]);
    
    // Abrir WhatsApp
    window.open(whatsappUrl, '_blank');
    
    // Volver a la lista
    setStep('list');
    setSelectedProvider(null);
    setOrderItems([]);
    setOrderTotal(0);
    setDeliveryDate('');
    setDeliveryTime('');
  };

  // Eliminar pedido
  const handleDeleteOrder = (orderId) => {
    setOrders(orders.filter(o => o.id !== orderId));
    setConfirmDelete(null);
  };

  // Cancelar creación
  const handleCancel = () => {
    setStep('list');
    setSelectedProvider(null);
    setOrderItems([]);
    setOrderTotal(0);
    setDeliveryDate('');
    setDeliveryTime('');
  };

  // Filtrar pedidos por búsqueda
  const filteredOrders = orders.filter(o =>
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.proveedor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // VISTA: Lista de Pedidos
  if (step === 'list') {
    const orderColumns = [
      { 
        key: 'id', 
        label: language === 'es' ? 'Número' : 'Number'
      },
      { 
        key: 'proveedor',
        label: t(language, 'proveedor')
      },
      { 
        key: 'fecha', 
        label: t(language, 'fecha')
      },
      { 
        key: 'total',
        label: t(language, 'monto'),
        render: (value) => <span className="font-bold text-yellow-400">${formatCurrency(value)}</span>
      },
      { 
        key: 'estado', 
        label: t(language, 'estado'),
        render: (value) => (
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-900/30 text-green-400">
            {value}
          </span>
        )
      },
      {
        key: 'acciones',
        label: t(language, 'accion'),
        render: (_, row) => (
          <button 
            onClick={() => setConfirmDelete(row.id)}
            className="p-1 hover:bg-gray-700 light-mode:hover:bg-gray-200 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-400 light-mode:text-red-600" />
          </button>
        )
      }
    ];

    return (
      <div className="min-h-screen bg-[#111827] light-mode:bg-gray-50 p-4 sm:p-6 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          {/* Encabezado */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl font-black mb-1 sm:mb-2 bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
              {t(language, 'pedidos')}
            </h1>
            <p className="text-gray-400 light-mode:text-gray-600">{t(language, 'gestionPedidos')}</p>
          </div>

          {/* Barra de búsqueda y acciones */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-500 light-mode:text-gray-400" />
              <input
                type="text"
                placeholder={language === 'es' ? 'Buscar pedidos...' : 'Search orders...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 light-mode:bg-white border border-gray-700 light-mode:border-gray-300 rounded-lg text-white light-mode:text-gray-900 placeholder-gray-500 light-mode:placeholder-gray-400 focus:border-[#206DDA] focus:outline-none transition-colors duration-300"
              />
            </div>
            <button 
              onClick={handleNewOrder}
              className="flex items-center gap-2 bg-[#206DDA] hover:bg-[#1a5ab8] text-white px-6 py-2 rounded-lg transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              {t(language, 'crearPedido')}
            </button>
          </div>

          {/* Tabla de Pedidos */}
          {orders.length > 0 ? (
            <TableContainer
              columns={orderColumns}
              data={filteredOrders}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 light-mode:text-gray-600">
                {language === 'es' ? 'No hay pedidos registrados' : 'No orders registered'}
              </p>
            </div>
          )}

          {/* Diálogo de Confirmación de Eliminación */}
          {confirmDelete && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-[#111827] light-mode:bg-white rounded-lg p-8 max-w-sm w-full mx-4">
                <h3 className="text-xl font-bold text-white light-mode:text-gray-900 mb-4">
                  {language === 'es' ? '¿Eliminar este pedido?' : 'Delete this order?'}
                </h3>
                <p className="text-gray-400 light-mode:text-gray-600 mb-6">
                  {language === 'es' ? 'Esta acción no se puede deshacer.' : 'This action cannot be undone.'}
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 light-mode:bg-gray-200 light-mode:hover:bg-gray-300 text-white light-mode:text-gray-900 rounded-lg transition-colors font-medium"
                  >
                    {language === 'es' ? 'Cancelar' : 'Cancel'}
                  </button>
                  <button
                    onClick={() => handleDeleteOrder(confirmDelete)}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                  >
                    {language === 'es' ? 'Eliminar' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // VISTA: Seleccionar Proveedor
  if (step === 'provider-select') {
    return (
      <div className="min-h-screen bg-[#111827] light-mode:bg-gray-50 p-6 transition-colors duration-300">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-black mb-2 bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
              {language === 'es' ? 'Nuevo Pedido' : 'New Order'}
            </h1>
            <p className="text-gray-400 light-mode:text-gray-600">
              {language === 'es' ? 'Paso 1: Selecciona un proveedor' : 'Step 1: Select a provider'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {providers.map(provider => (
              <button
                key={provider.id}
                onClick={() => handleSelectProvider(provider.id)}
                className="p-6 bg-gray-800 light-mode:bg-white border-2 border-gray-700 light-mode:border-gray-300 rounded-lg hover:border-[#206DDA] transition-colors text-left"
              >
                <h3 className="text-lg font-bold text-white light-mode:text-gray-900 mb-2">
                  {provider.nombre}
                </h3>
                <p className="text-gray-400 light-mode:text-gray-600 text-sm">
                  {provider.contacto}
                </p>
                <p className="text-gray-500 light-mode:text-gray-500 text-sm mt-2">
                  {provider.email}
                </p>
              </button>
            ))}
          </div>

          <button
            onClick={handleCancel}
            className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 light-mode:bg-gray-200 light-mode:hover:bg-gray-300 text-white light-mode:text-gray-900 rounded-lg transition-colors font-medium"
          >
            {language === 'es' ? 'Cancelar' : 'Cancel'}
          </button>
        </div>
      </div>
    );
  }

  // VISTA: Seleccionar Productos
  if (step === 'products-select') {
    // Si no hay productos del proveedor
    if (orderItems.length === 0) {
      return (
        <div className="min-h-screen bg-[#111827] light-mode:bg-gray-50 p-6 transition-colors duration-300">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-black mb-2 bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                {language === 'es' ? 'Nuevo Pedido' : 'New Order'}
              </h1>
              <p className="text-gray-400 light-mode:text-gray-600">
                {language === 'es' 
                  ? `Paso 2: Selecciona productos de ${selectedProvider.nombre}` 
                  : `Step 2: Select products from ${selectedProvider.nombre}`
                }
              </p>
            </div>

            <div className="bg-gray-800 light-mode:bg-white rounded-lg p-8 text-center mb-8">
              <p className="text-gray-400 light-mode:text-gray-600 text-lg">
                {language === 'es' 
                  ? `No hay productos disponibles para ${selectedProvider.nombre}`
                  : `No products available for ${selectedProvider.nombre}`
                }
              </p>
            </div>

            <button
              onClick={handleCancel}
              className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 light-mode:bg-gray-200 light-mode:hover:bg-gray-300 text-white light-mode:text-gray-900 rounded-lg transition-colors font-medium"
            >
              {language === 'es' ? 'Volver' : 'Back'}
            </button>
          </div>
        </div>
      );
    }

    const productsColumns = [
      {
        key: 'nombre',
        label: language === 'es' ? 'Producto' : 'Product'
      },
      {
        key: 'stockActual',
        label: language === 'es' ? 'Stock Actual' : 'Current Stock',
        render: (value) => <span className="font-semibold">{value}</span>
      },
      {
        key: 'sugerencia',
        label: language === 'es' ? 'Sugerencia de Compra' : 'Purchase Suggestion',
        render: (value) => <span className="font-semibold text-yellow-400">{value}</span>
      },
      {
        key: 'cantidad',
        label: language === 'es' ? 'Cantidad a Pedir' : 'Qty to Order',
        render: (_, row) => (
          <input
            type="number"
            value={row.cantidadPedir}
            onChange={(e) => handleQuantityChange(row.id, e.target.value)}
            className="w-24 px-3 py-2 bg-gray-700 light-mode:bg-gray-100 border border-gray-600 light-mode:border-gray-300 rounded text-white light-mode:text-gray-900 text-center focus:border-[#206DDA] focus:outline-none font-semibold"
            min="0"
          />
        )
      }
    ];

    return (
      <div className="min-h-screen bg-[#111827] light-mode:bg-gray-50 p-6 transition-colors duration-300">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-black mb-2 bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
              {language === 'es' ? 'Nuevo Pedido' : 'New Order'}
            </h1>
            <p className="text-gray-400 light-mode:text-gray-600">
              {language === 'es' 
                ? `Paso 2: Selecciona productos de ${selectedProvider.nombre}` 
                : `Step 2: Select products from ${selectedProvider.nombre}`
              }
            </p>
          </div>

          {/* Tabla de productos */}
          <div className="mb-8 bg-gray-800 light-mode:bg-white rounded-lg overflow-hidden">
            <TableContainer
              columns={productsColumns}
              data={orderItems}
            />
          </div>

          {/* Resumen */}
          <div className="bg-gray-800 light-mode:bg-white p-6 rounded-lg mb-6">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-white light-mode:text-gray-900">
                {language === 'es' ? 'Total Estimado:' : 'Estimated Total:'}
              </span>
              <span className="text-3xl font-bold text-yellow-400">
                ${formatCurrency(orderTotal)}
              </span>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-4">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 light-mode:bg-gray-200 light-mode:hover:bg-gray-300 text-white light-mode:text-gray-900 rounded-lg transition-colors font-medium"
            >
              {language === 'es' ? 'Cancelar' : 'Cancel'}
            </button>
            <button
              onClick={handleContinueToConfirm}
              className="flex-1 px-4 py-3 bg-[#206DDA] hover:bg-[#1a5ab8] text-white rounded-lg transition-colors font-bold"
            >
              {language === 'es' ? 'Continuar' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // VISTA: Confirmación y envío por WhatsApp
  if (step === 'confirm') {
    const itemsToSend = orderItems.filter(item => item.cantidadPedir > 0);
    
    return (
      <div className="min-h-screen bg-[#111827] light-mode:bg-gray-50 p-6 transition-colors duration-300">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-800 light-mode:bg-white rounded-lg p-8">
            <h1 className="text-3xl font-black mb-2 bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent text-center">
              {language === 'es' ? 'Confirmación de Pedido' : 'Order Confirmation'}
            </h1>
            
            <div className="my-8 p-6 bg-gray-900 light-mode:bg-gray-50 rounded-lg border-2 border-yellow-400">
              <p className="text-gray-300 light-mode:text-gray-700 text-center mb-2">
                {language === 'es' ? 'Tu pedido tiene un valor total de' : 'Your order has a total value of'}
              </p>
              <p className="text-4xl font-black text-yellow-400 text-center">
                ${formatCurrency(orderTotal)}
              </p>
            </div>

            {/* Detalles del pedido */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-white light-mode:text-gray-900 mb-4">
                {language === 'es' ? 'Productos:' : 'Products:'}
              </h2>
              <div className="space-y-2">
                {itemsToSend.map(item => (
                  <div key={item.id} className="flex justify-between p-3 bg-gray-900 light-mode:bg-gray-50 rounded">
                    <span className="text-white light-mode:text-gray-900">
                      {item.nombre} × {item.cantidadPedir}
                    </span>
                    <span className="text-yellow-400 font-bold">
                      ${formatCurrency(item.cantidadPedir * item.costo)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Detalles del proveedor */}
            <div className="mb-8 p-4 bg-gray-900 light-mode:bg-gray-50 rounded">
              <p className="text-gray-400 light-mode:text-gray-600 mb-2">
                {language === 'es' ? 'Proveedor:' : 'Provider:'}
              </p>
              <p className="text-xl font-bold text-white light-mode:text-gray-900">
                {selectedProvider.nombre}
              </p>
              <p className="text-gray-400 light-mode:text-gray-600 mt-2">
                {selectedProvider.contacto}
              </p>
            </div>

            {/* Fecha y Hora de entrega */}
            <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-900 light-mode:bg-gray-50 rounded">
                <label className="block text-gray-400 light-mode:text-gray-600 mb-2 font-semibold">
                  {language === 'es' ? '📅 Fecha de Entrega:' : '📅 Delivery Date:'}
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 light-mode:bg-gray-100 border border-gray-600 light-mode:border-gray-300 rounded text-white light-mode:text-gray-900 focus:border-[#206DDA] focus:outline-none cursor-pointer"
                />
                {deliveryDate && (
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(deliveryDate + 'T00:00:00').toLocaleDateString('es-CL', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                )}
              </div>

              <div className="p-4 bg-gray-900 light-mode:bg-gray-50 rounded">
                <label className="block text-gray-400 light-mode:text-gray-600 mb-2 font-semibold">
                  {language === 'es' ? '⏰ Hora de Entrega:' : '⏰ Delivery Time:'}
                </label>
                <input
                  type="time"
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 light-mode:bg-gray-100 border border-gray-600 light-mode:border-gray-300 rounded text-white light-mode:text-gray-900 focus:border-[#206DDA] focus:outline-none cursor-pointer"
                />
                {deliveryTime && (
                  <p className="text-xs text-gray-400 mt-2">
                    {deliveryTime}
                  </p>
                )}
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-4">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 light-mode:bg-gray-200 light-mode:hover:bg-gray-300 text-white light-mode:text-gray-900 rounded-lg transition-colors font-medium"
              >
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
              <button
                onClick={handleSendWhatsApp}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#4CAF50] hover:bg-[#45a049] text-white rounded-lg transition-colors font-bold"
              >
                <MessageCircle className="w-5 h-5" />
                {language === 'es' ? 'Enviar por WhatsApp' : 'Send via WhatsApp'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
