import { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, Trash2, Calendar, Package } from 'lucide-react';
import { t } from '../utils/translations';
import ConfirmationModal from '../components/ConfirmationModal';

export default function Movements({ language = 'es', productsData = [] }) {
  const [movements, setMovements] = useState(() => {
    return JSON.parse(localStorage.getItem('inventariox_movements') || '[]');
  });
  const [filterType, setFilterType] = useState(''); // '', 'entrada', 'salida'
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Eliminar movimiento
  const handleDeleteMovement = (id) => {
    const updated = movements.filter(m => m.id !== id);
    setMovements(updated);
    localStorage.setItem('inventariox_movements', JSON.stringify(updated));
    setConfirmDelete(null);
  };

  // Filtrar movimientos
  const filteredMovements = movements.filter(m => {
    if (filterType === '') return true;
    return m.tipo === filterType;
  }).sort((a, b) => new Date(b.fechaHora) - new Date(a.fechaHora));

  // Formatear fecha y hora
  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    return {
      fecha: date.toLocaleDateString('es-CL'),
      hora: date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 bg-[#111827] light-mode:bg-gray-50 min-h-screen">
      {/* Título */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-white light-mode:text-gray-900 font-black text-xl sm:text-2xl md:text-3xl bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent mb-1 sm:mb-2">
          {language === 'es' ? 'Movimientos' : 'Movements'}
        </h1>
        <p className="text-gray-400 light-mode:text-gray-600 text-xs sm:text-sm md:text-base">
          {language === 'es' ? 'Registro automático de entradas y salidas' : 'Automatic record of entries and exits'}
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterType('')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm md:text-base ${
              filterType === ''
                ? 'bg-[#206DDA] text-white'
                : 'bg-gray-700 light-mode:bg-gray-200 text-gray-300 light-mode:text-gray-700 hover:bg-gray-600 light-mode:hover:bg-gray-300'
            }`}
          >
            {language === 'es' ? 'Todos' : 'All'}
          </button>
          <button
            onClick={() => setFilterType('entrada')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 text-sm md:text-base ${
              filterType === 'entrada'
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 light-mode:bg-gray-200 text-gray-300 light-mode:text-gray-700 hover:bg-gray-600 light-mode:hover:bg-gray-300'
            }`}
          >
            <ArrowUp className="w-4 h-4" />
            {language === 'es' ? 'Entradas' : 'Entries'}
          </button>
          <button
            onClick={() => setFilterType('salida')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 text-sm md:text-base ${
              filterType === 'salida'
                ? 'bg-red-600 text-white'
                : 'bg-gray-700 light-mode:bg-gray-200 text-gray-300 light-mode:text-gray-700 hover:bg-gray-600 light-mode:hover:bg-gray-300'
            }`}
          >
            <ArrowDown className="w-4 h-4" />
            {language === 'es' ? 'Salidas' : 'Exits'}
          </button>
        </div>
      </div>

      {/* Tabla de movimientos */}
      {filteredMovements.length > 0 ? (
        <div className="bg-[#1f2937] light-mode:bg-white rounded-lg border border-gray-700 light-mode:border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm md:text-base">
              <thead className="bg-gray-800 light-mode:bg-gray-100 border-b border-gray-700 light-mode:border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-300 light-mode:text-gray-700 font-semibold">{language === 'es' ? 'Fecha/Hora' : 'Date/Time'}</th>
                  <th className="px-4 py-3 text-left text-gray-300 light-mode:text-gray-700 font-semibold">{language === 'es' ? 'Producto' : 'Product'}</th>
                  <th className="px-4 py-3 text-left text-gray-300 light-mode:text-gray-700 font-semibold">{language === 'es' ? 'Tipo' : 'Type'}</th>
                  <th className="px-4 py-3 text-right text-gray-300 light-mode:text-gray-700 font-semibold">{language === 'es' ? 'Cantidad' : 'Quantity'}</th>
                  <th className="px-4 py-3 text-left text-gray-300 light-mode:text-gray-700 font-semibold">{language === 'es' ? 'Motivo' : 'Reason'}</th>
                  <th className="px-4 py-3 text-center text-gray-300 light-mode:text-gray-700 font-semibold">{language === 'es' ? 'Acciones' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovements.map((movement) => {
                  const { fecha, hora } = formatDateTime(movement.fechaHora);
                  const isEntrada = movement.tipo === 'entrada';

                  return (
                    <tr
                      key={movement.id}
                      className="border-b border-gray-700 light-mode:border-gray-200 hover:bg-gray-800/50 light-mode:hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-300 light-mode:text-gray-900">
                        <div className="text-xs md:text-sm">
                          <p className="font-semibold">{fecha}</p>
                          <p className="text-gray-500 light-mode:text-gray-600">{hora}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-300 light-mode:text-gray-900 font-semibold">{movement.productName}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isEntrada ? (
                            <>
                              <ArrowUp className="w-4 h-4 text-green-500" />
                              <span className="px-2 py-1 bg-green-900/30 text-green-400 rounded text-xs font-semibold">
                                {language === 'es' ? 'Entrada' : 'Entry'}
                              </span>
                            </>
                          ) : (
                            <>
                              <ArrowDown className="w-4 h-4 text-red-500" />
                              <span className="px-2 py-1 bg-red-900/30 text-red-400 rounded text-xs font-semibold">
                                {language === 'es' ? 'Salida' : 'Exit'}
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className={`px-4 py-3 text-right font-bold text-base ${
                        isEntrada ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {isEntrada ? '+' : '-'}{movement.cantidad}
                      </td>
                      <td className="px-4 py-3 text-gray-300 light-mode:text-gray-900">
                        {movement.motivo ? (
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            movement.motivo === 'venta' 
                              ? 'bg-blue-900/30 text-blue-400'
                              : movement.motivo === 'desecho'
                              ? 'bg-yellow-900/30 text-yellow-400'
                              : 'bg-purple-900/30 text-purple-400'
                          }`}>
                            {movement.motivo === 'venta' && (language === 'es' ? 'Venta' : 'Sale')}
                            {movement.motivo === 'desecho' && (language === 'es' ? 'Desecho' : 'Disposal')}
                            {movement.motivo === 'ajuste' && (language === 'es' ? 'Ajuste' : 'Adjustment')}
                          </span>
                        ) : (
                          <span className="text-gray-500 light-mode:text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setConfirmDelete(movement.id)}
                          className="p-1 hover:bg-gray-700 light-mode:hover:bg-gray-200 rounded transition-colors inline-flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4 text-red-400 light-mode:text-red-600" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-gray-800 light-mode:bg-gray-100 rounded-lg p-12 text-center">
          <Package className="w-12 h-12 text-gray-600 light-mode:text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400 light-mode:text-gray-600 text-lg">
            {language === 'es' ? 'No hay movimientos registrados' : 'No movements recorded'}
          </p>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      <ConfirmationModal
        isOpen={confirmDelete !== null}
        title={language === 'es' ? '¿Eliminar movimiento?' : 'Delete movement?'}
        message={language === 'es' ? '¿Estás seguro de eliminar este registro? Esta acción no se puede deshacer.' : 'Are you sure you want to delete this record? This action cannot be undone.'}
        onConfirm={() => handleDeleteMovement(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
        confirmText={language === 'es' ? 'Eliminar' : 'Delete'}
        cancelText={language === 'es' ? 'Cancelar' : 'Cancel'}
        isDangerous={true}
      />
    </div>
  );
}
