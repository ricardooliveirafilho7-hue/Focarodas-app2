import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirmar',
  onConfirm,
  onCancel,
  danger = false
}: Props) {
  return (
    <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-sm p-6 shadow-2xl">
        <div className="flex items-start gap-4 mb-6">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${danger ? 'bg-red-500/20' : 'bg-yellow-500/20'}`}>
            <AlertTriangle size={20} className={danger ? 'text-red-400' : 'text-yellow-400'} />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg mb-1">{title}</h3>
            <p className="text-sm text-white/60 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 font-bold transition-colors">
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl font-bold transition-colors ${danger ? 'bg-[#E53935] hover:bg-[#B71C1C] text-white' : 'bg-yellow-600 hover:bg-yellow-700 text-white'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
