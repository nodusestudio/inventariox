/**
 * Utilidades para Inventariox
 * Funciones auxiliares para cálculos y manejo de datos
 */

/**
 * Calcula el Costo Real considerando la merma
 * Fórmula: Costo / (1 - %Merma/100)
 * 
 * @param {number} costo - Costo unitario del producto
 * @param {number} mermaPercentage - Porcentaje de merma (0-100)
 * @returns {number} Costo real calculado
 */
export const calculateCostReal = (costo, mermaPercentage) => {
  const mermaDecimal = mermaPercentage / 100;
  
  // Validación: si merma es >= 100%, retorna 0
  if (mermaDecimal >= 1) return 0;
  
  return Number((costo / (1 - mermaDecimal)).toFixed(2));
};

/**
 * Determina si el stock de un producto es bajo
 * 
 * @param {number} stockActual - Stock actual del producto
 * @param {number} stockMinimo - Stock mínimo recomendado
 * @returns {boolean} True si el stock es bajo
 */
export const isLowStock = (stockActual, stockMinimo) => {
  return stockActual < stockMinimo;
};

/**
 * Calcula el porcentaje de stock disponible
 * 
 * @param {number} stockActual - Stock actual
 * @param {number} stockMinimo - Stock mínimo
 * @returns {number} Porcentaje del stock
 */
export const getStockPercentage = (stockActual, stockMinimo) => {
  if (stockMinimo === 0) return 0;
  return Math.min(100, Math.round((stockActual / stockMinimo) * 100));
};

/**
 * Formatea un número como moneda
 * 
 * @param {number} value - Valor a formatear
 * @param {string} currency - Código de moneda (default: 'CLP')
 * @returns {string} Valor formateado
 */
export const formatCurrency = (value, currency = 'CLP') => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: currency,
  }).format(value);
};

/**
 * Formatea una fecha al formato local
 * 
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} Fecha formateada
 */
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Obtiene el estado de color para un nivel de stock
 * 
 * @param {number} stockActual - Stock actual
 * @param {number} stockMinimo - Stock mínimo
 * @returns {string} Clase de color Tailwind
 */
export const getStockColorClass = (stockActual, stockMinimo) => {
  if (stockActual === 0) return 'text-red-500';
  if (stockActual < stockMinimo) return 'text-yellow-500';
  return 'text-green-500';
};

/**
 * Calcula el total de valor en inventario
 * 
 * @param {array} items - Array de items del inventario
 * @returns {number} Valor total del inventario
 */
export const calculateTotalInventoryValue = (items) => {
  return items.reduce((total, item) => {
    const costReal = calculateCostReal(item.costo, item.merma);
    return total + (costReal * item.stockActual);
  }, 0);
};

/**
 * Exporta datos a CSV
 * 
 * @param {array} data - Array de objetos para exportar
 * @param {string} filename - Nombre del archivo
 */
export const exportToCSV = (data, filename = 'export.csv') => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escapar comillas y envolver en comillas si contiene comas
        return typeof value === 'string' && value.includes(',') 
          ? `"${value.replace(/"/g, '""')}"` 
          : value;
      }).join(',')
    )
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};

/**
 * Valida un NIT/RUT
 * 
 * @param {string} value - Valor a validar
 * @returns {boolean} True si es válido
 */
export const validateNITRUT = (value) => {
  // Expresión regular para NIT (Colombia) o RUT (Chile)
  // NIT: 10-12 dígitos
  // RUT: XX.XXX.XXX-X (con guiones)
  const nitRegex = /^\d{10,12}$/;
  const rutRegex = /^\d{1,3}\.\d{3}\.\d{3}-[0-9kK]$/;
  
  return nitRegex.test(value.replace(/[.-]/g, '')) || rutRegex.test(value);
};

/**
 * Limpia un número de teléfono WhatsApp
 * Elimina espacios, guiones, paréntesis y caracteres especiales
 * Mantiene solo dígitos (sin agregar código de país automáticamente)
 * 
 * @param {string} phoneNumber - Número a limpiar
 * @returns {string} Número limpiado (solo dígitos)
 * 
 * @example
 * cleanPhoneNumber('+56 9 1234 5678') // '56912345678'
 * cleanPhoneNumber('(300) 123-4567') // '3001234567'
 * cleanPhoneNumber('300 123 4567') // '3001234567'
 */
export const cleanPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  // Elimina todo excepto dígitos y signos +
  return phoneNumber.replace(/[^\d+]/g, '').replace(/^\+/, '');
};
