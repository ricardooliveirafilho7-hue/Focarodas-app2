import React, { createContext, useCallback, useContext, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);
    window.setTimeout(() => setToasts(prev => prev.filter(toast => toast.id !== id)), 4000);
  }, []);

  const icons = {
    success: <CheckCircle2 size={16} className="text-green-400" />,
    error: <AlertTriangle size={16} className="text-red-400" />,
    warning: <AlertTriangle size={16} className="text-yellow-400" />,
    info: <Info size={16} className="text-blue-400" />
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 bg-[#1C1C1F] border border-white/10 rounded-2xl px-4 py-3 shadow-2xl max-w-sm animate-in slide-in-from-right-4 fade-in duration-300"
          >
            <span className="mt-0.5 shrink-0">{icons[toast.type]}</span>
            <p className="text-sm text-white/90 leading-relaxed flex-1">{toast.message}</p>
            <button
              onClick={() => setToasts(prev => prev.filter(item => item.id !== toast.id))}
              className="text-white/30 hover:text-white shrink-0 mt-0.5"
              aria-label="Fechar notificacao"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
