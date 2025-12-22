import { X } from 'lucide-react';

export default function ExitReasonModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  language = 'es' 
}) {
  if (!isOpen) return null;

  const reasons = [
    { id: 'venta', label: language === 'es' ? 'Venta' : 'Sale', color: 'bg-blue-600 hover:bg-blue-700' },
    { id: 'desecho', label: language === 'es' ? 'Desecho' : 'Disposal', color: 'bg-yellow-600 hover:bg-yellow-700' },
    { id: 'ajuste', label: language === 'es' ? 'Ajuste' : 'Adjustment', color: 'bg-purple-600 hover:bg-purple-700' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 light-mode:bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white light-mode:text-gray-900">
            {language === 'es' ? 'Motivo de Salida' : 'Exit Reason'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 light-mode:text-gray-500 light-mode:hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <p className="text-gray-400 light-mode:text-gray-600 mb-6 text-sm">
          {language === 'es' 
            ? 'Selecciona el motivo por el cual se reduce el inventario' 
            : 'Select the reason for reducing inventory'}
        </p>

        <div className="space-y-3">
          {reasons.map(reason => (
            <button
              key={reason.id}
              onClick={() => onConfirm(reason.id)}
              className={`w-full py-3 rounded font-semibold text-white transition-colors ${reason.color}`}
            >
              {reason.label}
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 py-2 bg-gray-700 light-mode:bg-gray-300 hover:bg-gray-600 light-mode:hover:bg-gray-400 text-white light-mode:text-gray-900 rounded transition-colors text-sm"
        >
          {language === 'es' ? 'Cancelar' : 'Cancel'}
        </button>
      </div>
    </div>
  );
}
