import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { ChevronLeft, Calendar, Camera, Plus, Check } from 'lucide-react';
import StaffUpdateModal from './StaffUpdateModal';
import { Send, X } from 'lucide-react';
import { STATUS_SEQUENCE } from '../lib/constants';
import { formatDate } from '../lib/dateUtils';
import { ServiceStatus } from '../types';

function SendMessageModal({ clientId, onClose }: { clientId: string, onClose: () => void }) {
  const { sendMessage, currentUser, role } = useAppStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    const success = await sendMessage({
      clientId,
      senderId: currentUser?.id || 'system',
      senderRole: role || 'STAFF',
      title,
      content,
      type
    });
    setIsSending(false);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200 backdrop-blur-sm">
      <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl relative">
        <div className="p-6 border-b border-white/5 flex justify-between items-start bg-[#151515]">
          <div>
            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2"><Send size={20} className="text-blue-500"/> Enviar Notificação</h2>
          </div>
          <button onClick={onClose} className="p-2 text-white/40 hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={handleSend} className="p-6 flex flex-col space-y-4">
          <div><input type="text" required value={title} onChange={e=>setTitle(e.target.value)} className="w-full bg-[#1A1A1A] border border-white/5 rounded-xl p-3 text-white" placeholder="Título" /></div>
          <div><textarea required value={content} onChange={e=>setContent(e.target.value)} className="w-full bg-[#1A1A1A] border border-white/5 rounded-xl p-3 text-white" rows={4} placeholder="Mensagem..." /></div>
          <div><select value={type} onChange={e=>setType(e.target.value as typeof type)} className="w-full bg-[#1A1A1A] border border-white/5 rounded-xl p-3 text-white"><option value="info">Info</option><option value="success">Sucesso</option><option value="warning">Aviso</option></select></div>
          <button type="submit" disabled={isSending} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold p-3 rounded-xl">{isSending ? 'Enviando...' : 'Enviar Agora'}</button>
        </form>
      </div>
    </div>
  );
}

export default function StaffVehicleDetail({ orderId, onBack }: { orderId: string, onBack: () => void }) {
  const { getVehicleById, getClientById, serviceOrders } = useAppStore();
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isMsgModalOpen, setIsMsgModalOpen] = useState(false);

  const order = serviceOrders.find(o => o.id === orderId);
  if (!order) return <div>Ordem não encontrada.</div>;

  const vehicle = getVehicleById(order.vehicleId);
  const client = getClientById(order.clientId);

  if (!vehicle) return <div>Veículo não encontrado.</div>;

  const currentStatusIndex = STATUS_SEQUENCE.indexOf(order.status);

  return (
    <div className="flex-1 overflow-y-auto hide-scrollbar bg-[var(--color-background)]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[var(--color-background)]/90 backdrop-blur-md px-6 py-4 flex items-center gap-4 border-b border-white/5">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-white/5 text-white/50 hover:text-white transition">
           <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <div className="flex gap-3 text-[10px] uppercase font-bold tracking-widest text-[#d32f2f] mb-1">
            <span className="px-2 py-0.5 rounded border border-[#d32f2f]/30 bg-[#d32f2f]/10">{order.status}</span>
            <span className="text-white/40 border-l border-white/10 pl-3">ID: #{order.id.toUpperCase()}</span>
          </div>
          <h2 className="text-2xl font-bold text-white">{vehicle.model}</h2>
          <p className="text-xs text-white/40 font-mono tracking-widest uppercase">Placa: {vehicle.plate}</p>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Progress Timeline */}
          <div className="bg-[var(--color-card-bg)] border border-white/5 p-6 rounded-3xl shadow-xl">
             <div className="flex items-center gap-3 mb-8">
               <h3 className="font-bold text-lg text-white">Progresso do Serviço</h3>
             </div>
             
             <div className="flex justify-between relative px-2">
                <div className="absolute top-4 left-6 right-6 h-0.5 bg-white/5 -z-10"></div>
                <div 
                  className="absolute top-4 left-6 h-0.5 bg-[var(--color-brand-red)] -z-10 transition-all duration-1000"
                  style={{ width: `${Math.max(0, (currentStatusIndex / (STATUS_SEQUENCE.length - 1)) * 100)}%` }}
                ></div>

                {['Recebido', 'Em análise', order.status, 'Finalizado', 'Retirada'].filter((v, i, a) => a.indexOf(v) === i).map((step, idx) => {
                  const isCompleted = STATUS_SEQUENCE.indexOf(step as ServiceStatus) <= currentStatusIndex;
                  const isCurrent = step === order.status;
                  return (
                    <div key={idx} className="flex flex-col items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-lg transition-colors
                         ${isCurrent ? 'bg-[var(--color-brand-red)] border-[var(--color-brand-red)] shadow-[var(--color-brand-red)]/30 text-white' : 
                         isCompleted ? 'bg-[var(--color-brand-red-dark)] border-[var(--color-brand-red)] text-white' : 
                         'bg-[#1a1a1a] border-white/10 text-white/20'}`}
                      >
                         {isCompleted && !isCurrent ? <Check className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-current"></div>}
                      </div>
                      <div className="text-center">
                        <span className={`block text-xs font-bold ${isCurrent ? 'text-[var(--color-brand-red)]' : isCompleted ? 'text-white/80' : 'text-white/30'}`}>{step}</span>
                        {isCurrent && <span className="text-[9px] uppercase text-white/40 tracking-wider">Atual</span>}
                      </div>
                    </div>
                  )
                })}
             </div>
          </div>

          {/* Pictures */}
          <div className="bg-[var(--color-card-bg)] border border-white/5 p-6 rounded-3xl shadow-xl">
             <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-lg text-white">Galeria de Serviço</h3>
                </div>
                <button onClick={() => setIsUpdateModalOpen(true)} className="text-[10px] uppercase font-bold tracking-widest text-[var(--color-brand-red)] hover:text-white transition-colors flex items-center gap-1">
                  Adicionar Fotos <Plus className="w-3 h-3" />
                </button>
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {order.updates.flatMap(u => u.photos || []).map((img, i) => (
                  <div key={i} className="aspect-square bg-black/50 rounded-2xl border border-white/10 overflow-hidden relative group">
                     <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                ))}
                
                <button onClick={() => setIsUpdateModalOpen(true)} className="aspect-square bg-white/5 border border-white/10 border-dashed rounded-2xl flex flex-col items-center justify-center text-white/30 hover:bg-white/10 hover:text-white transition-colors cursor-pointer">
                  <Camera className="w-6 h-6 mb-2" />
                  <span className="text-xs font-bold">Nova foto</span>
                </button>
             </div>
          </div>

          {/* Observacoes / Public message */}
          {order.updates.length > 0 && order.updates[0].publicMessage && (
            <div className="bg-[var(--color-brand-red)]/5 border border-[var(--color-brand-red)]/20 p-6 rounded-3xl shadow-xl flex gap-4">
              <div className="w-8 h-8 rounded-full bg-[var(--color-brand-red)]/20 flex items-center justify-center shrink-0">
                <div className="w-1 h-3 rounded-full bg-[var(--color-brand-red)]"></div>
              </div>
              <div>
                <h4 className="text-[10px] uppercase font-bold tracking-widest text-[var(--color-brand-red)] mb-2">Mensagem ao Cliente</h4>
                <p className="text-sm text-white/80 leading-relaxed font-medium">
                  {order.updates[0].publicMessage}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <button 
            onClick={() => setIsUpdateModalOpen(true)}
            className="w-full bg-gradient-to-r from-[var(--color-brand-red-dark)] to-[var(--color-brand-red)] hover:opacity-90 text-white font-black uppercase tracking-wider text-sm py-4 rounded-2xl shadow-[0_0_20px_rgba(211,47,47,0.3)] transition"
          >
            Atualizar Serviço
          </button>

           <div className="bg-[var(--color-card-bg)] border border-white/5 p-6 rounded-3xl shadow-xl">
             <h3 className="font-bold text-lg text-white mb-6">Cliente</h3>
             <div className="flex items-center gap-4 mb-6">
               <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#1a1a1a] to-white/10 flex items-center justify-center font-bold text-xl uppercase border-2 border-white/5 shrink-0">
                 {client?.name.substring(0, 2)}
               </div>
               <div>
                  <h4 className="font-bold text-white">{client?.name}</h4>
                  {client?.status === 'Ativo' && <span className="text-[10px] font-bold text-[var(--color-brand-red)] tracking-widest uppercase">Cliente Ativo</span>}
               </div>
             </div>
             
             <div className="space-y-3 mb-2">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Telefone</span>
                  <span className="text-sm font-medium text-white">{client?.phone}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Email</span>
                  <span className="text-sm font-medium text-white">{client?.email}</span>
                </div>
             </div>
             <button onClick={() => setIsMsgModalOpen(true)} className="w-full mt-4 bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white font-bold text-sm py-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer">
                <Send size={16} /> Enviar Mensagem
             </button>
           </div>

           <div className="bg-[var(--color-card-bg)] border border-white/5 p-6 rounded-3xl shadow-xl">
              <h3 className="font-bold text-lg text-white mb-6">Dados Técnicos</h3>
              <div className="grid grid-cols-2 gap-3">
                 <div className="bg-white/5 rounded-xl p-3">
                    <span className="text-[9px] uppercase font-bold text-white/40 tracking-wider block mb-1">Cor</span>
                    <span className="text-sm font-bold text-white truncate">{vehicle.color}</span>
                 </div>
                 <div className="bg-white/5 rounded-xl p-3">
                    <span className="text-[9px] uppercase font-bold text-white/40 tracking-wider block mb-1">Ano</span>
                    <span className="text-sm font-bold text-white">{vehicle.year || '-'}</span>
                 </div>
                 <div className="bg-white/5 rounded-xl p-3 col-span-2 flex items-center justify-between mt-2 border border-white/10">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[var(--color-brand-red)]" />
                      <span className="text-[10px] uppercase font-bold text-white/60 tracking-wider">Entrega Programada</span>
                    </div>
                    <span className="text-sm font-bold text-white">{formatDate(order.deliveryEstimate)}</span>
                 </div>
              </div>
           </div>

           <div className="bg-[var(--color-card-bg)] border border-white/5 p-6 rounded-3xl shadow-xl">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-white flex items-center gap-2">Notas Internas</h3>
             </div>
             
             <div className="space-y-4 max-h-[300px] overflow-y-auto hide-scrollbar pr-2">
                {order.updates.filter(u => u.internalNote).map(u => (
                  <div key={u.id} className="border-l-2 border-white/10 pl-4 py-1 relative">
                     <p className="text-sm text-white/60 italic leading-relaxed mb-2">{`"${u.internalNote}"`}</p>
                     <div className="flex justify-between items-center">
                        <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{formatDate(u.date)}</span>
                        <span className="text-[9px] font-bold text-white/50 bg-white/5 px-2 py-0.5 rounded uppercase">Mecânico</span>
                     </div>
                  </div>
                ))}
             </div>
           </div>
        </div>
      </div>

      {isUpdateModalOpen && (
        <StaffUpdateModal orderId={order.id} onClose={() => setIsUpdateModalOpen(false)} />
      )}
      {isMsgModalOpen && client && (
        <SendMessageModal clientId={client.id} onClose={() => setIsMsgModalOpen(false)} />
      )}
    </div>
  );
}
