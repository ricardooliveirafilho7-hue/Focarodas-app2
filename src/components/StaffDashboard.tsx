import React from 'react';
import { useAppStore } from '../lib/store';
import { Car, Clock, AlertTriangle, MessageCircle, CheckCircle2 } from 'lucide-react';
import { Search, Plus } from 'lucide-react';

export default function StaffDashboard({ onNavigate, onNewService }: { onNavigate: (tab: string) => void, onNewService?: () => void }) {
  const { serviceOrders, getVehicleById, currentUser } = useAppStore();

  const activeOrders = serviceOrders.filter(v => v.status !== 'Finalizado' && v.status !== 'Retirada');
  const finishedToday = serviceOrders.filter(v => v.status === 'Finalizado').length; 
  const delayed = serviceOrders.filter(v => new Date(v.deliveryEstimate) < new Date() && v.status !== 'Finalizado' && v.status !== 'Retirada');
  const awaitingApproval = serviceOrders.filter(v => v.status === 'Em análise').length;
  // Without a real messaging system yet, messages are 0
  const messagesCount = 0;

  return (
    <div className="flex-1 overflow-y-auto hide-scrollbar p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Painel Operacional</h1>
        <p className="text-white/60">Bem-vindo, {currentUser?.name}. Confira o status atual da oficina.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
        <div className="bg-[var(--color-card-bg)] border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors" onClick={() => onNavigate('Veículos')}>
          <Car className="w-6 h-6 text-white/40 mb-2" />
          <span className="text-3xl font-black text-white">{activeOrders.length}</span>
          <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider mt-1 text-center">Carros em<br/>Atendimento</span>
        </div>
        <div className="bg-[var(--color-card-bg)] border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors">
          <Clock className="w-6 h-6 text-white/40 mb-2" />
          <span className="text-3xl font-black text-white">{awaitingApproval < 10 ? `0${awaitingApproval}` : awaitingApproval}</span>
          <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider mt-1 text-center">Aguardando<br/>Aprovação</span>
        </div>
        <div className="bg-[var(--color-brand-red)]/10 border border-[var(--color-brand-red)]/30 rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer hover:bg-[var(--color-brand-red)]/20 transition-colors">
          <AlertTriangle className="w-6 h-6 text-[var(--color-brand-red)] mb-2" />
          <span className="text-3xl font-black text-[var(--color-brand-red)]">{delayed.length < 10 ? `0${delayed.length}` : delayed.length}</span>
          <span className="text-[10px] uppercase font-bold text-[var(--color-brand-red)]/70 tracking-wider mt-1 text-center">Serviços<br/>Atrasados</span>
        </div>
        <div className="bg-[var(--color-card-bg)] border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors">
          <MessageCircle className="w-6 h-6 text-white/40 mb-2" />
          <span className="text-3xl font-black text-white">{messagesCount < 10 ? `0${messagesCount}` : messagesCount}</span>
          <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider mt-1 text-center">Mensagens<br/>Pendentes</span>
        </div>
        <div className="bg-[var(--color-card-bg)] border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors">
          <CheckCircle2 className="w-6 h-6 text-white/40 mb-2" />
          <span className="text-3xl font-black text-white">{finishedToday < 10 ? `0${finishedToday}` : finishedToday}</span>
          <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider mt-1 text-center">Finalizados<br/>Hoje</span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Serviços Ativos</h2>
            <button className="text-sm font-medium text-white/50 border border-white/10 rounded-full py-1.5 px-4 hover:text-white hover:bg-white/5 transition">
              Ver Todos
            </button>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-4">
            {activeOrders.length === 0 ? (
               <div className="sm:col-span-2 flex flex-col items-center justify-center py-10 bg-[#1A1A1A] border border-white/5 rounded-2xl">
                  <Car className="w-12 h-12 text-white/20 mb-3" />
                  <h3 className="text-lg font-medium text-white/80">Nenhum veículo em atendimento</h3>
                  <p className="text-sm text-white/40 text-center max-w-sm mt-1">Quando um carro for recebido, ele aparecerá aqui com seu status de serviço.</p>
               </div>
            ) : (
              activeOrders.slice(0, 4).map((order, idx) => {
                const vehicle = getVehicleById(order.vehicleId);
                return (
                <div key={order.id} className="bg-[var(--color-card-bg)] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition cursor-pointer" onClick={() => onNavigate('Veículos')}>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-white/40 text-xs font-mono">Placa: {vehicle?.plate}</span>
                    <span className="px-2.5 py-1 rounded-full bg-white/5 text-[10px] font-bold tracking-wider text-white/70 uppercase">
                      {order.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg mb-4 text-white line-clamp-1">{vehicle?.model}</h3>
                  <div className="flex gap-3 items-center">
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/10 bg-black/50">
                       {vehicle?.photo ? <img src={vehicle.photo} alt={vehicle.model} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-white/5"><Car size={16} className="text-white/20"/></div>}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-white/60 line-clamp-2">{order.updates[0]?.internalNote || "Nenhuma nota recente"}</p>
                    </div>
                  </div>
                </div>
              )})
            )}
          </div>
        </div>

        <div>
           <h2 className="text-xl font-bold text-white mb-6">Ações Rápidas</h2>
           <div className="space-y-4">
             <button onClick={() => onNewService?.()} className="w-full bg-[var(--color-brand-red)] hover:bg-[var(--color-brand-red-dark)] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition shadow-lg">
               <Plus className="w-5 h-5" />
               NOVA ORDEM DE SERVIÇO
             </button>
             <button onClick={() => onNavigate('Veículos')} className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition">
               <Search className="w-5 h-5" />
               GERENCIAR VEÍCULOS
             </button>
           </div>

           <h2 className="text-xl font-bold text-white mt-8 mb-6">Mensagens Recentes</h2>
           <div className="space-y-3">
              <div className="bg-[#1A1A1A] border border-white/5 rounded-xl p-8 flex flex-col items-center justify-center text-center">
                 <MessageCircle className="w-10 h-10 text-white/20 mb-3" />
                 <h3 className="text-sm font-medium text-white/80">Nenhuma mensagem ainda</h3>
                 <p className="text-xs text-white/40 mt-1">As mensagens dos clientes aparecerão aqui.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
