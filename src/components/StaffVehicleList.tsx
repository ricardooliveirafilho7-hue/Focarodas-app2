import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { Search, User as UserIcon, Phone, Clock, AlertTriangle, MoreVertical, Car, Plus } from 'lucide-react';
import { Vehicle } from '../types';

export default function StaffVehicleList({ onSelectVehicle, onNewService }: { onSelectVehicle: (id: string) => void, onNewService?: () => void }) {
  const { serviceOrders, getVehicleById, clients } = useAppStore();
  const [search, setSearch] = useState('');

  const activeOrders = serviceOrders.filter(o => o.status !== 'Finalizado' && o.status !== 'Retirada');

  const filtered = activeOrders.filter(order => {
    const vehicle = getVehicleById(order.vehicleId);
    const client = clients.find(c => c.id === order.clientId);
    const searchString = `${vehicle?.model} ${vehicle?.plate} ${client?.name}`.toLowerCase();
    return searchString.includes(search.toLowerCase());
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Em Reparo': case 'Pintura': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Pronto': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Aguardando Peças': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-white/10 text-white border-white/20';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col p-4 md:p-6 pb-24">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Veículos em Oficina</h1>
          <p className="text-white/60">Gerencie o fluxo de trabalho e prazos de entrega.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80 shrink-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input 
              type="text" 
              placeholder="Buscar cliente, placa ou modelo..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-full py-3 pl-12 pr-4 text-white outline-none focus:border-[var(--color-brand-red)] transition-colors"
            />
          </div>
          <button 
            onClick={() => onNewService?.()}
            className="shrink-0 bg-[var(--color-brand-red)] hover:bg-red-700 text-white w-12 h-[50px] md:w-auto md:px-6 rounded-full flex items-center justify-center gap-2 transition font-medium"
          >
            <Plus size={20} />
            <span className="hidden md:inline">Nova OS</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.length === 0 && (
           <div className="lg:col-span-2 xl:col-span-3 flex flex-col items-center justify-center py-20 text-center bg-[#1A1A1A]/50 border border-dashed border-white/10 rounded-3xl mt-4">
              <Car className="w-12 h-12 text-white/20 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Nenhum veículo em oficina</h3>
              <p className="text-white/40 mb-6 max-w-sm">Não há nenhum veículo ativo no momento.</p>
           </div>
        )}
        {filtered.map(order => {
          const client = clients.find(c => c.id === order.clientId);
          const vehicle = getVehicleById(order.vehicleId);
          const isDelayed = new Date(order.deliveryEstimate) < new Date();

          return (
            <div key={order.id} className="bg-[var(--color-card-bg)] border border-white/5 rounded-2xl overflow-hidden shadow-lg flex flex-col group relative">
              <div className="h-48 relative overflow-hidden bg-black">
                <img 
                  src={vehicle?.photo || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=800'} 
                  alt={vehicle?.model} 
                  className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-x-0 bottom-0 py-10 bg-gradient-to-t from-[var(--color-card-bg)] to-transparent" />
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col z-10 relative -mt-4">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-[var(--color-brand-red)] transition-colors cursor-pointer" onClick={() => onSelectVehicle(order.id)}>
                      {vehicle?.model}
                    </h3>
                    <p className="text-[10px] font-mono tracking-widest text-white/40 uppercase">{vehicle?.plate}</p>
                  </div>
                  <button className="text-white/40 hover:text-white transition-colors p-1">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                      <UserIcon className="w-4 h-4 text-white/60" />
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-0.5">Cliente</p>
                      <p className="text-sm font-medium text-white">{client?.name}</p>
                    </div>
                  </div>
                  
                  {order.status === 'Pronto' ? (
                     <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                           <Phone className="w-4 h-4 text-white/60" />
                         </div>
                         <div>
                           <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-0.5">Telefone</p>
                           <p className="text-sm font-medium text-white">{client?.phone}</p>
                         </div>
                     </div>
                  ) : (
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isDelayed ? 'bg-[var(--color-brand-red)]/20' : 'bg-white/5'}`}>
                        {isDelayed ? <AlertTriangle className="w-4 h-4 text-[var(--color-brand-red)]" /> : <Clock className="w-4 h-4 text-white/60" />}
                        </div>
                        <div>
                        <p className={`text-[10px] uppercase font-bold tracking-wider mb-0.5 ${isDelayed ? 'text-[var(--color-brand-red)]/80' : 'text-white/40'}`}>
                            {isDelayed ? 'Atraso Crítico' : 'Estimativa de Entrega'}
                        </p>
                        <p className="text-sm font-medium text-white">
                            {isDelayed ? order.updates[0]?.internalNote || "Peça em importação" : 
                            new Date(order.deliveryEstimate).toLocaleDateString('pt-BR')}
                        </p>
                        </div>
                    </div>
                  )}
                </div>

                <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
                  <span className="text-[10px] text-white/30 italic">Última atualização: hoje</span>
                  
                  {order.status === 'Pronto' ? (
                      <button className="border border-white/20 text-white font-bold py-2 px-6 rounded-lg hover:bg-white/10 transition-colors text-sm">
                        Avisar cliente
                      </button>
                  ) : (
                      <button 
                        onClick={() => onSelectVehicle(order.id)}
                        className="bg-[var(--color-brand-red)] hover:bg-[var(--color-brand-red-dark)] text-white font-bold py-2 px-5 rounded-lg shadow-lg shadow-red-900/20 transition-colors text-sm"
                      >
                        Atualizar serviço
                      </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
