import { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

export default function InventoryHistory({ isOpen, onClose, language = 'es' }) {
  const [inventoryRecords, setInventoryRecords] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    // Cargar historial desde localStorage
    const saved = localStorage.getItem('inventoryHistory');
    if (saved) {
      setInventoryRecords(JSON.parse(saved));
    }
  }, [isOpen]);

  const formatDateTime = (dateTime) => {
    try {
      const date = new Date(dateTime);
      return date.toLocaleString('es-CL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateTime;
    }
  };

  const handleDelete = (id) => {
    if (window.confirm(language === 'es' ? '¿Eliminar este registro?' : 'Delete this record?')) {
      const updated = inventoryRecords.filter(record => record.id !== id);
      setInventoryRecords(updated);
      localStorage.setItem('inventoryHistory', JSON.stringify(updated));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111827] light-mode:bg-white rounded-lg w-full max-w-2xl max-h-96 flex flex-col shadow-2xl">
        {/* Encabezado */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 light-mode:border-gray-200">
          <h2 className="text-xl font-bold text-white light-mode:text-gray-900">
            {language === 'es' ? 'Historial de Inventarios' : 'Inventory History'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Contenido */}
        <div className="overflow-y-auto flex-1">
          {inventoryRecords.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-400 light-mode:text-gray-600">
                {language === 'es' ? 'No hay registros de inventarios' : 'No inventory records'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700 light-mode:divide-gray-200">
              {inventoryRecords.map((record) => (
                <div key={record.id} className="p-4 hover:bg-gray-800 light-mode:hover:bg-gray-50 transition-colors">
                  {/* Fila principal */}
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                  >
                    <div className="flex-1">
                      <div className="text-white light-mode:text-gray-900 font-semibold">
                        {formatDateTime(record.dateTime)}
                      </div>
                      <div className="text-sm text-gray-400 light-mode:text-gray-600 mt-1">
                        <span>{language === 'es' ? 'Responsable: ' : 'Responsible: '}</span>
                        <span className="font-semibold text-gray-300 light-mode:text-gray-700">{record.responsible}</span>
                      </div>
                      <div className="text-sm text-gray-400 light-mode:text-gray-600">
                        <span>{language === 'es' ? 'Proveedor: ' : 'Provider: '}</span>
                        <span className="font-semibold text-gray-300 light-mode:text-gray-700">{record.provider}</span>
                      </div>
                      <div className="text-xs text-gray-500 light-mode:text-gray-500 mt-1">
                        {language === 'es' ? 'Productos contados' : 'Items counted'}: {record.items.length}
                      </div>
                    </div>
                    <div className="ml-4 flex items-center gap-2">
                      {expandedId === record.id ? (
                        <ChevronUp className="text-gray-400" size={20} />
                      ) : (
                        <ChevronDown className="text-gray-400" size={20} />
                      )}
                    </div>
                  </div>

                  {/* Detalles expandidos */}
                  {expandedId === record.id && (
                    <div className="mt-4 pt-4 border-t border-gray-700 light-mode:border-gray-200">
                      <div className="space-y-2">
                        {record.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center p-2 bg-gray-700 light-mode:bg-gray-100 rounded">
                            <span className="text-gray-300 light-mode:text-gray-800 text-sm flex-1 truncate">
                              {item.productName}
                            </span>
                            <span className="text-[#206DDA] font-bold text-sm ml-2">
                              {item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="mt-4 w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded font-semibold transition-colors text-sm"
                      >
                        {language === 'es' ? 'Eliminar registro' : 'Delete record'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
