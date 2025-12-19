export default function TableContainer({ columns, data, onRowClick, isRowAlert }) {
  return (
    <div className="bg-gray-800 light-mode:bg-white rounded-lg shadow-lg border border-gray-700 light-mode:border-gray-200 overflow-hidden transition-colors duration-300">
      {/* Tabla Desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          {/* Encabezados */}
          <thead className="bg-gray-900 light-mode:bg-gray-100 border-b border-gray-700 light-mode:border-gray-300">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-4 text-left text-sm font-semibold text-gray-300 light-mode:text-gray-900"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* Filas */}
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-400 light-mode:text-gray-500">
                  No hay datos disponibles
                </td>
              </tr>
            ) : (
              data.map((row, idx) => {
                const hasAlert = isRowAlert ? isRowAlert(row) : false;
                return (
                  <tr
                    key={idx}
                    onClick={() => onRowClick?.(row)}
                    className={`border-b border-gray-700 light-mode:border-gray-200 cursor-pointer ${
                      hasAlert 
                        ? 'bg-red-950/30 light-mode:bg-red-100/30 hover:bg-red-950/50 light-mode:hover:bg-red-100/50' 
                        : 'table-row-hover'
                    }`}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className="px-6 py-4 text-sm text-gray-200 light-mode:text-gray-900"
                      >
                        {column.render ? column.render(row[column.key], row) : row[column.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Cards Mobile */}
      <div className="md:hidden space-y-3 p-4">
        {data.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 light-mode:text-gray-500">No hay datos disponibles</p>
          </div>
        ) : (
          data.map((row, idx) => {
            const hasAlert = isRowAlert ? isRowAlert(row) : false;
            return (
              <div
                key={idx}
                onClick={() => onRowClick?.(row)}
                className={`p-4 rounded-lg border cursor-pointer transition-all duration-300 ${
                  hasAlert
                    ? 'bg-red-950/30 light-mode:bg-red-100/30 border-red-800 light-mode:border-red-300'
                    : 'bg-gray-700 light-mode:bg-gray-100 border-gray-600 light-mode:border-gray-300 hover:bg-gray-600 light-mode:hover:bg-gray-200'
                }`}
              >
                <div className="grid grid-cols-1 gap-2">
                  {columns.map((column) => (
                    <div key={column.key} className="flex justify-between items-start">
                      <span className="text-xs font-semibold text-gray-400 light-mode:text-gray-600 uppercase">
                        {column.label}
                      </span>
                      <span className="text-sm font-semibold text-gray-200 light-mode:text-gray-900 text-right ml-2">
                        {column.render ? column.render(row[column.key], row) : row[column.key]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
