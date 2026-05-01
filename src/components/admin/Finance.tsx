import React from 'react';
import { Wallet } from 'lucide-react';

export default function Finance() {
  return (
    <div className="p-4 md:p-8 h-[calc(100vh-4rem)] flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#E53935]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      
      <div className="mb-8 relative z-10">
        <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
          Financeiro
        </h1>
        <p className="text-white/40 text-sm mt-2 font-medium">Controle de faturamento, pagamentos e caixa.</p>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-white/5 rounded-[2rem] bg-[#0A0A0A] relative z-10 shadow-2xl">
          <div className="w-24 h-24 bg-[#111] rounded-full flex items-center justify-center mb-6 shadow-inner border border-white/5">
              <Wallet size={48} className="text-green-500 drop-shadow-[0_0_10px_rgba(34,197,94,0.3)]" />
          </div>
          <h3 className="text-3xl font-black text-white mb-3 tracking-tight">Módulo Financeiro</h3>
          <p className="text-white/40 font-medium max-w-md leading-relaxed">Este módulo está sendo preparado para integração com gateways de pagamento corporativos.</p>
      </div>
    </div>
  );
}
