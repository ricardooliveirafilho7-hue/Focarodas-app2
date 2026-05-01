import React from 'react';
import { BarChart3 } from 'lucide-react';

export default function Reports() {
  return (
    <div className="p-4 md:p-8 h-[calc(100vh-4rem)] flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#E53935]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      
      <div className="mb-8 relative z-10">
        <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
          Relatórios
        </h1>
        <p className="text-white/40 text-sm mt-2 font-medium">Métricas, produtividade e relatórios detalhados.</p>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-white/5 rounded-[2rem] bg-[#0A0A0A] relative z-10 shadow-2xl">
          <div className="w-24 h-24 bg-[#111] rounded-full flex items-center justify-center mb-6 shadow-inner border border-white/5">
              <BarChart3 size={48} className="text-blue-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]" />
          </div>
          <h3 className="text-3xl font-black text-white mb-3 tracking-tight">Relatórios Avançados</h3>
          <p className="text-white/40 font-medium max-w-md leading-relaxed">Estamos operando na processão em lote para liberar métricas avançadas.</p>
      </div>
    </div>
  );
}
