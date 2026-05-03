import React from 'react';
import { useAppStore } from '../../lib/store';
import { Wrench, CheckCircle2, AlertTriangle, Hourglass, Users, LogIn } from 'lucide-react';
import { parseLocalDate } from '../../lib/dateUtils';

export default function Dashboard() {
  const { serviceOrders, employees, clients } = useAppStore();

  const emAtendimento = serviceOrders.filter(v => v.status === 'Em reparo' || v.status === 'Em análise' || v.status === 'Pintura').length;
  const pronto = serviceOrders.filter(v => v.status === 'Pronto' || v.status === 'Finalizado').length;
  const aguardandoPecas = serviceOrders.filter(v => v.status === 'Aguardando peças').length;
  const atrasados = serviceOrders.filter(v => parseLocalDate(v.deliveryEstimate) < new Date() && !['Finalizado', 'Retirada', 'Cancelado'].includes(v.status)).length;
  const activeEmployees = employees.filter(e => e.active).length;
  const clientes = clients.length;

  const stats = [
    { label: 'Em Atendimento', value: emAtendimento, icon: Wrench, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Finalizados', value: pronto, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Atrasos Críticos', value: atrasados, icon: AlertTriangle, color: 'text-[#E53935]', bg: 'bg-[#E53935]/10', border: 'border-[#E53935]/30' },
    { label: 'Aguardando Peças', value: aguardandoPecas, icon: Hourglass, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { label: 'Visão Clientes', value: clientes, icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Equipe Ativa', value: `${activeEmployees}/${employees.length}`, icon: LogIn, color: 'text-gray-400', bg: 'bg-gray-400/10' },
  ];

  const totalVehicles = serviceOrders.length;
  const percEmServico = totalVehicles > 0 ? Math.round((emAtendimento / totalVehicles) * 100) : 0;
  const percPronto = totalVehicles > 0 ? Math.round((pronto / totalVehicles) * 100) : 0;
  const percAguardando = totalVehicles > 0 ? Math.round((aguardandoPecas / totalVehicles) * 100) : 0;

  return (
    <div className="p-4 md:p-8">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Dashboard de Operações
          </h1>
          <p className="text-white/50 text-sm mt-1 font-medium">Resumo e performance da oficina em tempo real.</p>
        </div>
        <div className="text-xs font-bold uppercase tracking-widest text-white/50 bg-[#1C1C1F] px-5 py-2.5 rounded-full border border-white/5 inline-flex items-center shadow-lg">
          {new Date().toLocaleDateString('pt-BR', { dateStyle: 'full' })}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className={`bg-[#1C1C1F] p-5 rounded-2xl border ${stat.border || 'border-white/5'} flex flex-col justify-between min-h-[140px] hover:-translate-y-1 transition-transform duration-300 shadow-xl`}>
              <div className="flex justify-between items-start">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <Icon size={20} className={stat.color} />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">{stat.label}</p>
                <h3 className="text-3xl font-black text-white">{stat.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#1C1C1F] border border-white/5 rounded-3xl p-8 lg:col-span-2 shadow-2xl relative overflow-hidden group">
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-colors pointer-events-none"></div>
          
          <h3 className="font-bold text-lg mb-8 text-white relative z-10">Distribuição de Status</h3>
          <div className="flex flex-col md:flex-row items-center justify-center gap-12 relative w-full z-10">
            <div className="flex flex-col items-center justify-center relative my-4">
              <svg viewBox="0 0 36 36" className="w-40 h-40 transform -rotate-90">
                <circle stroke="#242428" strokeWidth="3" fill="none" cx="18" cy="18" r="16" />
                {totalVehicles > 0 && (
                  <>
                    <circle stroke="#3B82F6" strokeWidth="4" strokeDasharray={`${percEmServico}, 100`} strokeDashoffset="0" fill="none" cx="18" cy="18" r="16" className="drop-shadow-lg" />
                    <circle stroke="#22C55E" strokeWidth="4" strokeDasharray={`${percPronto}, 100`} strokeDashoffset={`-${percEmServico}`} fill="none" cx="18" cy="18" r="16" className="drop-shadow-lg" />
                    <circle stroke="#F59E0B" strokeWidth="4" strokeDasharray={`${percAguardando}, 100`} strokeDashoffset={`-${percEmServico + percPronto}`} fill="none" cx="18" cy="18" r="16" className="drop-shadow-lg" />
                  </>
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-white">{totalVehicles}</span>
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Total OS</span>
              </div>
            </div>
            <div className="flex flex-col flex-1 space-y-6 max-w-sm">
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" /> <span className="font-medium text-white/80">Em Serviço</span></div>
                <span className="text-white font-bold text-lg">{percEmServico}%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" /> <span className="font-medium text-white/80">Pronto / Finalizado</span></div>
                <span className="text-white font-bold text-lg">{percPronto}%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" /> <span className="font-medium text-white/80">Aguardando Peças</span></div>
                <span className="text-white font-bold text-lg">{percAguardando}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#1C1C1F] border border-white/5 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-[#E53935]/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex justify-between items-center mb-8 relative z-10">
             <h3 className="font-bold text-lg text-white">Alertas do Sistema</h3>
             <span className="w-6 h-6 rounded-full bg-[#E53935]/20 text-[#E53935] flex items-center justify-center text-xs font-bold">{atrasados > 0 ? atrasados : 0}</span>
          </div>

          <div className="space-y-4 relative z-10">
             {atrasados > 0 ? (
                 <div className="bg-[#E53935]/10 border border-[#E53935]/20 rounded-2xl p-4 flex gap-4">
                    <AlertTriangle className="text-[#E53935] shrink-0 mt-0.5" size={20} />
                    <div>
                       <h4 className="text-sm font-bold text-white mb-1">Veículos Atrasados</h4>
                       <p className="text-xs text-white/60 leading-relaxed">Existem {atrasados} veículo(s) que já passaram da data de previsão de entrega e não foram finalizados.</p>
                    </div>
                 </div>
             ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                    <CheckCircle2 className="w-10 h-10 text-green-500/50 mb-3" />
                    <p className="text-sm font-medium text-white/70">Nenhum atraso no momento!</p>
                    <p className="text-xs text-white/40 mt-1">Sua oficina está voando baixo.</p>
                </div>
             )}
          </div>
        </div>
      </div>

    </div>
  );
}
