import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmationModal({ 
  isOpen, 
  title = '¿Estás seguro?', 
  message = 'Esta acción no se puede deshacer.',
  onConfirm, 
  onCancel, 
  confirmText = 'Eliminar',
  cancelText = 'Cancelar',
  isDangerous = true 
}) {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-200"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm mx-4 sm:mx-0">
        <div className="bg-[#1f2937] light-mode:bg-white rounded-lg shadow-xl border border-gray-700 light-mode:border-gray-200 p-6">
          {/* Encabezado */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDangerous ? 'bg-red-900/30' : 'bg-yellow-900/30'}`}>
                <AlertTriangle className={`w-6 h-6 ${isDangerous ? 'text-red-500' : 'text-yellow-500'}`} />
              </div>
              <h2 className="text-lg font-bold text-white light-mode:text-gray-900">{title}</h2>
            </div>
            <button 
              onClick={onCancel}
              className="p-1 hover:bg-gray-700 light-mode:hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-5 h-5 text-gray-400 light-mode:text-gray-600" />
            </button>
          </div>

          {/* Mensaje */}
          <p className="text-gray-300 light-mode:text-gray-700 mb-6">
            {message}
          </p>

          {/* Botones */}
          <div className="flex gap-3 justify-end">
            <button 
              onClick={onCancel}
              className="px-4 py-2 bg-gray-700 light-mode:bg-gray-200 hover:bg-gray-600 light-mode:hover:bg-gray-300 text-white light-mode:text-gray-900 rounded-lg font-medium transition-colors"
            >
              {cancelText}
            </button>
            <button 
              onClick={onConfirm}
              className={`px-4 py-2 rounded-lg font-medium transition-colors text-white ${
                isDangerous 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-yellow-600 hover:bg-yellow-700'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
