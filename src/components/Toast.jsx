import { useEffect } from 'react';
import { Check, AlertCircle, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = {
    success: 'bg-green-600 light-mode:bg-green-50',
    error: 'bg-red-600 light-mode:bg-red-50',
    info: 'bg-blue-600 light-mode:bg-blue-50'
  }[type];

  const textColor = {
    success: 'text-white light-mode:text-green-700',
    error: 'text-white light-mode:text-red-700',
    info: 'text-white light-mode:text-blue-700'
  }[type];

  const borderColor = {
    success: 'border-green-500 light-mode:border-green-300',
    error: 'border-red-500 light-mode:border-red-300',
    info: 'border-blue-500 light-mode:border-blue-300'
  }[type];

  const Icon = {
    success: Check,
    error: AlertCircle,
    info: AlertCircle
  }[type];

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border-2 ${bgColor} ${borderColor} animate-pulse-in`}>
      <Icon className="w-5 h-5 flex-shrink-0" />
      <p className={`text-sm font-semibold ${textColor}`}>
        {message}
      </p>
      <button
        onClick={onClose}
        className={`ml-2 flex-shrink-0 ${textColor} hover:opacity-80 transition-opacity`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
