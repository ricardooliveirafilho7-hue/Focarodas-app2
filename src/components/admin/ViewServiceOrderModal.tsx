import React from 'react';
import { useAppStore } from '../../lib/store';
import { X, Calendar, Clock, MessageSquare, Car, Shield, Wrench, FileText, Download } from 'lucide-react';
import { ServiceOrder } from '../../types';

export default function ViewServiceOrderModal({ order, onClose }: { order: ServiceOrder, onClose: () => void }) {
  const { getClientById, getVehicleById } = useAppStore();
  const client = getClientById(order.clientId);
  const vehicle = getVehicleById(order.vehicleId);

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-300">
      <div className="bg-[#111111] border border-white/10 rounded-3xl w-full max-w-5xl overflow-hidden flex flex-col md:flex-row max-h-[95vh] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        
        {/* Left side: Images & Basic Details */}
        <div className="md:w-5/12 flex flex-col bg-[#151515] border-r border-white/5 relative">
          <div className="p-4 border-b border-white/5 flex justify-between items-center md:hidden bg-[#151515] relative z-10">
            <h2 className="text-xl font-bold truncate pr-4 text-white">{vehicle?.model}</h2>
            <button onClick={onClose} className="p-2 text-white/40 hover:text-white rounded-full bg-white/5">
              <X size={20} />
            </button>
          </div>
          
          <div className="h-56 md:h-80 relative overflow-hidden shrink-0 group">
            {vehicle?.photo ? (
               <img src={vehicle.photo} alt={vehicle.model} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            ) : (
               <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center">
                  <Car className="w-20 h-20 text-white/5" />
               </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#151515] via-[#151515]/20 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
               <span className="text-xs px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white font-bold mb-3 inline-block shadow-lg uppercase tracking-wider">
                 Status: {order.status}
               </span>
               <h2 className="text-3xl font-black hidden md:block leading-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-tight">{vehicle?.model}</h2>
            </div>
            
            <button className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all hidden md:flex items-center gap-2">
               <FileText size={16} /> <span className="text-xs font-bold uppercase tracking-wider">Gerar PDF</span>
            </button>
          </div>
          
          <div className="p-6 md:p-8 overflow-y-auto flex-1 hide-scrollbar">
             <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-8">
               <div>
                  <p className="text-[10px] uppercase text-white/40 font-bold tracking-widest mb-1.5">Placa</p>
                  <div className="inline-block px-3 py-1 bg-black/40 border border-white/10 rounded-lg text-lg font-mono font-bold text-white shadow-inner">{vehicle?.plate}</div>
               </div>
               <div>
                  <p className="text-[10px] uppercase text-white/40 font-bold tracking-widest mb-1.5">Cor / Ano</p>
                  <p className="text-lg font-medium text-white">{vehicle?.color} {vehicle?.year ? `/ ${vehicle.year}` : ''}</p>
               </div>
               <div className="col-span-2">
                  <p className="text-[10px] uppercase text-white/40 font-bold tracking-widest mb-1.5">Previsão Entrega</p>
                  <p className="text-xl font-bold text-[#E53935] flex items-center gap-2">
                     <Calendar size={18} /> {new Date(order.deliveryEstimate).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
               </div>
             </div>

             <div className="bg-gradient-to-br from-[#222] to-[#1A1A1A] border border-white/5 rounded-2xl p-5 mb-6 shadow-lg relative overflow-hidden">
                <Shield className="absolute -bottom-4 -right-4 w-24 h-24 text-white/5" />
                <p className="text-[10px] uppercase text-[var(--color-brand-red)] font-bold tracking-widest mb-3 flex items-center gap-2"><UserIcon size={14} /> Cliente Vinculado</p>
                <p className="font-black text-xl text-white mb-1 tracking-tight">{client?.name}</p>
                <p className="text-sm text-white/60 font-mono tracking-wider">{client?.phone ? client.phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3') : 'Sem telefone'}</p>
             </div>
             
             <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-5 shadow-lg">
                 <p className="text-[10px] uppercase text-white/40 font-bold tracking-widest mb-3 flex items-center gap-2"><Wrench size={14} /> Serviços Solicitados</p>
                 <p className="text-sm font-medium text-white/80 leading-relaxed whitespace-pre-wrap">{order.servicesFull || 'Nenhum serviço detalhado.'}</p>
                 
                 {order.observations && (
                   <div className="mt-4 pt-4 border-t border-white/5">
                      <p className="text-xs text-white/40 uppercase font-bold tracking-widest mb-1">Notas da OS</p>
                      <p className="text-sm text-white/60 italic leading-relaxed">{order.observations}</p>
                   </div>
                 )}
             </div>
          </div>
        </div>

        {/* Right side: History timeline */}
        <div className="md:w-7/12 flex flex-col max-h-[95vh] bg-[#0A0A0A]">
          <div className="p-6 md:p-8 border-b border-white/5 hidden md:flex justify-between items-center bg-[#111] z-10 shrink-0">
            <div>
               <h3 className="font-black text-2xl tracking-tight text-white mb-1">Histórico & Updates</h3>
               <p className="text-xs font-bold uppercase tracking-widest text-white/40">Linha do tempo do veículo</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-white/40 hover:text-white rounded-full bg-white/5 hover:bg-[var(--color-brand-red)] border border-white/10 hover:border-transparent transition-all shadow-lg hover:shadow-[0_0_15px_rgba(229,57,53,0.5)]">
              <X size={20} />
            </button>
          </div>
          
          <div className="p-6 md:p-8 overflow-y-auto flex-1 hide-scrollbar">
             {order.updates.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-16 h-16 rounded-full bg-[#1A1A1A] flex items-center justify-center mb-4 border border-white/5">
                       <Clock className="w-8 h-8 text-white/20" />
                    </div>
                    <p className="text-lg font-bold text-white mb-1">Nenhum evento registrado.</p>
                    <p className="text-sm text-white/40">As atualizações de status aparecerão aqui.</p>
                </div>
             ) : (
                <div className="relative pl-6 sm:pl-8 border-l-2 border-[#1A1A1A] space-y-10">
                   {/* Create a visual representation of order creation at the bottom */}
                   <div className="absolute top-0 bottom-0 left-[23px] sm:left-[31px] w-[2px] bg-gradient-to-b from-[var(--color-brand-red)] via-[#1A1A1A] to-transparent pointer-events-none" />
                   
                   {order.updates.map((update, i) => (
                     <div key={update.id} className="relative group animate-in slide-in-from-right-4 fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                        <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full bg-[#0A0A0A] border-4 border-[var(--color-brand-red)] shadow-[0_0_10px_rgba(229,57,53,0.5)] group-hover:bg-[var(--color-brand-red)] transition-colors" />
                        
                        <div className="bg-[#151515] border border-white/5 rounded-2xl p-5 sm:p-6 shadow-xl hover:border-white/10 transition-colors">
                           <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4 border-b border-white/5 pb-4">
                              <span className="font-black text-lg text-white">{update.status}</span>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-[#E53935] flex items-center gap-1.5 bg-[#E53935]/10 px-2.5 py-1 rounded-md border border-[#E53935]/20 w-fit">
                                <Clock size={12} /> {new Date(update.date).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour:'2-digit', minute:'2-digit' }).replace(' de ', ' ')}
                              </span>
                           </div>
                           
                           {(update.publicMessage || update.internalNote || (update.photos && update.photos.length > 0)) ? (
                              <div className="space-y-4">
                                 {update.publicMessage && (
                                   <div className="bg-black/30 rounded-xl p-4 border border-white/5 relative overflow-hidden">
                                      <div className="absolute top-0 left-0 bottom-0 w-1 bg-green-500/50" />
                                      <div className="flex items-center gap-2 mb-2 text-[10px] font-bold uppercase tracking-widest text-white/40"><MessageSquare size={14} className="text-green-500/50"/> Visível p/ Cliente</div>
                                      <p className="text-sm font-medium text-white/90 leading-relaxed">{update.publicMessage}</p>
                                   </div>
                                 )}
                                 
                                 {update.internalNote && (
                                   <div className="bg-[#1A1A1A] rounded-xl p-4 border border-yellow-500/10 relative overflow-hidden">
                                      <div className="absolute top-0 left-0 bottom-0 w-1 bg-yellow-500/50" />
                                      <div className="flex items-center gap-2 mb-2 text-[10px] font-bold uppercase tracking-widest text-white/40"><FileText size={14} className="text-yellow-500/50"/> Nota Interna (Privada)</div>
                                      <p className="text-sm text-white/70 italic leading-relaxed">{update.internalNote}</p>
                                   </div>
                                 )}

                                 {update.photos && update.photos.length > 0 && (
                                   <div className="pt-2">
                                     <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Anexos Fotográficos</p>
                                     <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
                                       {update.photos.map((p, j) => (
                                          <div key={j} className="w-24 h-24 shrink-0 rounded-xl overflow-hidden border border-white/10 relative group">
                                             <img src={p} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 cursor-pointer" alt="update" />
                                             <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                                <Download size={20} className="text-white" />
                                             </div>
                                          </div>
                                       ))}
                                     </div>
                                   </div>
                                 )}
                              </div>
                           ) : (
                              <p className="text-sm text-white/40 italic">Alteração de status simples.</p>
                           )}
                        </div>
                     </div>
                   ))}
                </div>
             )}
          </div>
        </div>

      </div>
    </div>
  );
}

// User Icon helper since we didn't import User from lucide in the main block
function UserIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
