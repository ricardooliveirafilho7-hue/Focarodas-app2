import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { Bell, Settings, Home, Car, MessageCircle, User as UserIcon, LogOut, Check, Camera } from 'lucide-react';
import { STATUS_SEQUENCE } from './StaffVehicleDetail';

export default function ClientApp() {
  const { logout, currentUser, vehicles, serviceOrders, messages, markMessageAsRead } = useAppStore();
  const [activeTab, setActiveTab] = useState('Garagem');
  
  // Find the service orders belonging to this client
  const clientOrders = serviceOrders.filter(o => o.clientId === currentUser?.id);
  const activeOrder = clientOrders.length > 0 ? clientOrders[0] : null;
  const activeVehicle = activeOrder ? vehicles.find(v => v.id === activeOrder.vehicleId) : null;
  
  const unreadCount = messages.filter(m => !m.read).length;

  if (!currentUser) return null;

  const currentStatusIndex = activeOrder ? STATUS_SEQUENCE.indexOf(activeOrder.status) : -1;

  return (
    <div className="flex-1 flex flex-col w-full h-full min-h-0 bg-[var(--color-background)]">
      {/* Header */}
      <header className="flex justify-between items-center p-6 shrink-0 z-50">
        <h1 className="text-xl font-black italic text-white tracking-tighter drop-shadow-[0_4px_20px_rgba(211,47,47,0.25)]">
          FOCA RODAS
        </h1>
        <div className="flex gap-4">
          <button className="text-white/50 hover:text-white transition relative" onClick={() => setActiveTab('Mensagens')}>
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-[var(--color-background)]"></div>}
          </button>
          <button className="text-[var(--color-brand-red)] hover:text-red-400 transition" onClick={logout}>
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {activeTab === 'Garagem' && (
          <main className="px-4 md:px-6 max-w-4xl mx-auto pt-2 pb-24 space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-red-500/90 to-red-300 drop-shadow-[0_4px_20px_rgba(211,47,47,0.25)]">
                FOCA RODAS
              </h1>
              <div className="h-0.5 w-16 bg-gradient-to-r from-transparent via-[var(--color-brand-red)] to-transparent mx-auto mt-3"></div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-light tracking-tight text-white">Minha Garagem</h2>
            </div>
            
            {activeVehicle ? (
              <div className="space-y-6">
                <div 
                  className="bg-[var(--color-card-bg)] border border-white/5 rounded-[2rem] overflow-hidden shadow-xl cursor-pointer group hover:border-[var(--color-brand-red)]/50 transition-all block"
                  onClick={() => setActiveTab('Detalhes')}
                >
                  <div className="relative h-64 md:h-80 w-full bg-black">
                    <img 
                      src={activeVehicle?.photo || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=800'} 
                      alt={activeVehicle?.model} 
                      className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-x-0 bottom-0 py-16 bg-gradient-to-t from-[var(--color-card-bg)] to-transparent" />
                    
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-[var(--color-brand-red)] shadow-[0_0_10px_rgba(211,47,47,0.8)] animate-pulse"></div>
                       <span className="text-[10px] font-bold text-white uppercase tracking-wider">{activeOrder?.status}</span>
                    </div>
                  </div>
                  
                  <div className="p-6 relative z-10 -mt-10">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-2xl font-bold group-hover:text-[var(--color-brand-red)] transition-colors text-white">{activeVehicle?.model}</h3>
                    </div>
                    <div className="flex gap-3 text-sm text-white/50 font-medium mb-6">
                      <span className="bg-white/5 px-2 py-1 rounded-md">{activeVehicle?.year || '-'}</span>
                      <span className="bg-white/5 px-2 py-1 rounded-md tracking-wider">{activeVehicle?.plate}</span>
                    </div>

                    <div className="bg-black/30 border border-white/5 rounded-2xl p-4 flex justify-between items-center group-hover:bg-white/5 transition-colors">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-white/40 tracking-wider mb-1">Previsão de Entrega</p>
                        <p className="font-bold text-white tracking-wide">{activeOrder?.deliveryEstimate ? new Date(activeOrder.deliveryEstimate).toLocaleDateString('pt-BR') : '-'}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-[var(--color-brand-red)]/10 text-[var(--color-brand-red)] flex items-center justify-center group-hover:bg-[var(--color-brand-red)] group-hover:text-white transition-colors">
                        <span className="font-bold text-sm">Ver</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
               <div className="bg-[var(--color-card-bg)] border border-white/5 rounded-[2rem] p-8 text-center text-white/50">
                  <div className="flex justify-center mb-4"><Car className="w-12 h-12 text-white/20"/></div>
                  <h3 className="text-xl font-bold text-white mb-2">Nenhum serviço vinculado</h3>
                  <p className="text-sm">Quando a Foca Rodas cadastrar um serviço para você, ele aparecerá aqui.</p>
               </div>
            )}
          </main>
        )}

        {activeTab === 'Detalhes' && activeVehicle && activeOrder && (
          <main className="px-4 md:px-6 max-w-4xl mx-auto pt-6 pb-24 space-y-6">
            <div className="flex items-center mb-6">
               <button
                  onClick={() => setActiveTab("Garagem")}
                  className="p-2 -ml-2 rounded-full hover:bg-white/5 text-white/50 hover:text-white transition-colors flex items-center gap-1"
               >
                  <Home className="w-5 h-5" />
                  <span className="text-xs uppercase font-bold tracking-widest">Voltar</span>
               </button>
            </div>

            <div className="flex items-end justify-between bg-black/40 border border-white/10 rounded-3xl p-6 relative overflow-hidden">
               <div className="relative z-10">
                 <h2 className="text-3xl font-bold tracking-tight mb-2 text-white">{activeVehicle.model}</h2>
                 <p className="text-[10px] font-mono tracking-widest text-[#d32f2f] uppercase opacity-80 bg-[#d32f2f]/10 inline-block px-2 py-1 rounded">OS #{activeOrder.id.toUpperCase()}</p>
               </div>
               <div className="text-right relative z-10">
                 <p className="text-[10px] uppercase font-bold text-white/40 tracking-wider mb-1">Previsão</p>
                 <p className="text-xl font-bold text-white">{new Date(activeOrder.deliveryEstimate).toLocaleDateString('pt-BR')}</p>
               </div>
               <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-brand-red)] rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 opacity-20 pointer-events-none"></div>
            </div>

            <div className="bg-[var(--color-card-bg)] border border-white/5 p-6 md:p-8 rounded-[2rem] shadow-xl overflow-hidden relative">
              <h3 className="font-bold text-xl mb-8 flex items-center gap-3 text-white">
                Progresso do Serviço
              </h3>
              
              <div className="flex justify-between relative px-2 md:px-8 mb-8">
                <div className="absolute top-4 left-6 right-6 md:left-12 md:right-12 h-0.5 bg-white/5 -z-10"></div>
                <div 
                  className="absolute top-4 left-6 md:left-12 h-0.5 bg-[var(--color-brand-red)] -z-10 transition-all duration-1000"
                  style={{ width: `${Math.max(0, (currentStatusIndex / (STATUS_SEQUENCE.length - 1)) * 100)}%` }}
                ></div>

                {['Recebido', 'Em análise', activeOrder.status, 'Finalizado', 'Retirada'].filter((v, i, a) => a.indexOf(v) === i).map((step, idx, arr) => {
                  let isCompleted = STATUS_SEQUENCE.indexOf(step as any) <= currentStatusIndex;
                  let isCurrent = step === activeOrder.status;
                  return (
                    <div key={idx} className="flex flex-col items-center gap-3 w-16">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-lg transition-colors
                         ${isCurrent ? 'bg-[var(--color-brand-red)] border-[var(--color-brand-red)] shadow-[var(--color-brand-red)]/30 text-white' : 
                         isCompleted ? 'bg-[var(--color-brand-red-dark)] border-[var(--color-brand-red)] text-white' : 
                         'bg-[#1a1a1a] border-white/10 text-white/20'}`}
                      >
                         {isCompleted && !isCurrent ? <Check className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-current"></div>}
                      </div>
                      <div className="text-center w-24">
                        <span className={`block text-[10px] md:text-xs font-bold leading-tight ${isCurrent ? 'text-[var(--color-brand-red)]' : isCompleted ? 'text-white/80' : 'text-white/30'}`}>{step}</span>
                        {isCurrent && <span className="text-[9px] uppercase text-white/40 tracking-wider">Atual</span>}
                      </div>
                    </div>
                  )
                })}
              </div>

              {activeOrder.updates.length > 0 && activeOrder.updates[0].publicMessage && (
                <div className="mt-8 bg-[var(--color-brand-red)]/5 border border-[var(--color-brand-red)]/20 p-5 rounded-２xl flex gap-4 animate-in fade-in slide-in-from-bottom-4">
                   <div className="w-8 h-8 rounded-full bg-[var(--color-brand-red)]/20 flex items-center justify-center shrink-0">
                      <MessageCircle className="w-4 h-4 text-[var(--color-brand-red)]" />
                   </div>
                   <div>
                      <h4 className="text-[10px] uppercase font-bold tracking-widest text-[var(--color-brand-red)] mb-1">Última Atualização</h4>
                      <p className="text-sm text-white/80 leading-relaxed font-medium">
                        {activeOrder.updates[0].publicMessage}
                      </p>
                      <span className="text-[9px] text-white/40 uppercase tracking-widest font-bold block mt-2">
                        {new Date(activeOrder.updates[0].date).toLocaleString('pt-BR')}
                      </span>
                   </div>
                </div>
              )}
            </div>

            {activeOrder.updates.some(u => u.photos && u.photos.length > 0) && (
              <div className="mb-6">
                <h3 className="font-bold text-xl mb-4 px-2 text-white">Galeria de Serviço</h3>
                <div className="flex overflow-x-auto hide-scrollbar gap-4 px-2 snap-x pb-4">
                  {activeOrder.updates.flatMap(u => u.photos || []).map((img, i) => (
                    <div key={i} className="w-48 h-48 md:w-64 md:h-64 shrink-0 snap-center rounded-[2rem] overflow-hidden bg-black border border-white/5 shadow-xl relative group">
                      <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
        )}

        {activeTab === 'Mensagens' && (
          <main className="px-4 md:px-6 max-w-4xl mx-auto pt-6 pb-24 space-y-6">
            <h2 className="text-2xl font-light tracking-tight text-white mb-6">Mensagens</h2>
            <div className="space-y-4">
               {messages.length === 0 ? (
                 <div className="bg-[var(--color-card-bg)] border border-white/5 rounded-[2rem] p-8 text-center text-white/50">
                    <MessageCircle className="w-12 h-12 text-white/20 mx-auto mb-4"/>
                    <h3 className="text-xl font-bold text-white mb-2">Sem mensagens</h3>
                    <p className="text-sm">Você ainda não recebeu mensagens da equipe.</p>
                 </div>
               ) : (
                 messages.map(msg => (
                   <div key={msg.id} className={`p-5 rounded-2xl border ${msg.read ? 'bg-[#151515] border-white/5' : 'bg-blue-600/10 border-blue-500/30'} flex flex-col gap-2 relative overflow-hidden transition-all`} onClick={() => markMessageAsRead(msg.id)}>
                     {!msg.read && <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/20 blur-xl pointer-events-none" />}
                     <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-white tracking-tight">{msg.title}</h4>
                        <span className="text-[10px] text-white/40 font-mono">{new Date(msg.createdAt).toLocaleDateString('pt-BR')}</span>
                     </div>
                     <p className="text-sm text-white/70 leading-relaxed">{msg.content}</p>
                   </div>
                 ))
               )}
            </div>
          </main>
        )}

        {activeTab === 'Perfil' && (
          <main className="px-4 md:px-6 max-w-4xl mx-auto pt-6 pb-24 space-y-6">
             <h2 className="text-2xl font-light tracking-tight text-white mb-6">Meu Perfil</h2>
             <div className="bg-[#1C1C1F] border border-white/5 p-6 rounded-[2rem] shadow-xl">
                <div className="space-y-4">
                   <div>
                     <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest block mb-1">Nome Completo</label>
                     <p className="text-lg font-bold text-white">{currentUser.name}</p>
                   </div>
                   <div>
                     <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest block mb-1">Telefone</label>
                     <p className="text-lg font-mono text-white">{currentUser.phone}</p>
                   </div>
                   <div>
                     <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest block mb-1">Login de Acesso</label>
                     <p className="text-lg font-mono text-white">{currentUser.login}</p>
                   </div>
                   <button onClick={logout} className="mt-8 w-full bg-[#E53935]/10 border border-[#E53935]/30 text-[#E53935] py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#E53935] hover:text-white transition-all">
                     <LogOut size={18} /> Sair da Conta
                   </button>
                </div>
             </div>
          </main>
        )}
      </div>
      
      {/* Bottom Nav */}
      <div className="bg-[var(--color-card-bg)] border-t border-white/5 shrink-0 px-6 pt-2 pb-safe relative z-40 mt-auto">
        <div className="flex justify-around items-center h-16 max-w-sm mx-auto">
          {[
            { id: "Garagem", icon: Car },
            { id: "Mensagens", icon: MessageCircle },
            { id: "Perfil", icon: UserIcon }
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1.5 transition-colors p-2 relative ${activeTab === item.id ? 'text-[var(--color-brand-red)]' : 'text-white/40 hover:text-white/60'}`}
            >
              <item.icon className="w-6 h-6" />
              {item.id === 'Mensagens' && unreadCount > 0 && (
                <div className="absolute top-1 right-1/4 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-[var(--color-card-bg)]"></div>
              )}
              <span className="text-[9px] font-bold tracking-widest uppercase">{item.id}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
