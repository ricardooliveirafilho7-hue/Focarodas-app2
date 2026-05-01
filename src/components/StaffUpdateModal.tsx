import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { Camera, X, Bell, Calendar as CalendarIcon } from 'lucide-react';
import { STATUS_SEQUENCE } from './StaffVehicleDetail';
import { ServiceStatus } from '../types';

export default function StaffUpdateModal({ orderId, onClose }: { orderId: string, onClose: () => void }) {
  const { getVehicleById, getServiceOrderById, addVehicleUpdate } = useAppStore();
  const order = getServiceOrderById(orderId);

  if (!order) return null;
  const vehicle = getVehicleById(order.vehicleId);
  if (!vehicle) return null;

  const [status, setStatus] = useState<ServiceStatus>(order.status);
  const [publicMessage, setPublicMessage] = useState('');
  const [internalNote, setInternalNote] = useState('');
  // For simplicity, we just simulate adding a photo by adding a static URL.
  const [photos, setPhotos] = useState<string[]>([]);
  const [estimate, setEstimate] = useState(order.deliveryEstimate.split('T')[0]);
  const [notify, setNotify] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addVehicleUpdate(orderId, status, publicMessage, internalNote, photos, estimate, notify);
    onClose();
  };

  const statusOptions: ServiceStatus[] = [
    'Recebido', 
    'Em análise', 
    'Aguardando aprovação', 
    'Aprovado', 
    'Aguardando peças', 
    'Em reparo', 
    'Pintura', 
    'Alinhamento/Balanceamento', 
    'Pronto', 
    'Finalizado', 
    'Retirada', 
    'Cancelado'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
       <div className="bg-[#111113] w-full max-w-2xl max-h-[90vh] overflow-y-auto hide-scrollbar rounded-3xl border border-white/10 shadow-2xl relative flex flex-col animate-in slide-in-from-bottom-10 duration-300">
         <div className="sticky top-0 bg-[#111113]/90 backdrop-blur-xl border-b border-white/5 p-6 flex justify-between items-center z-10 shrink-0">
           <div>
             <h2 className="text-2xl font-bold text-white mb-1">Atualizar Serviço</h2>
             <p className="text-xs text-white/50">OS #{order.id.toUpperCase()} - {vehicle.model} ({vehicle.color})</p>
           </div>
           <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/60">
             <X className="w-5 h-5" />
           </button>
         </div>

         <form onSubmit={handleSubmit} className="p-6 space-y-8">
            
            {/* Status grid */}
            <div>
              <label className="text-[10px] uppercase font-bold tracking-widest text-white/50 mb-3 block">Novo Status do Veículo</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                 {statusOptions.map(opt => (
                   <button 
                     key={opt}
                     type="button"
                     onClick={() => setStatus(opt)}
                     className={`py-3 px-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border
                        ${status === opt 
                          ? 'bg-[var(--color-brand-red)]/10 text-[var(--color-brand-red)] border-[var(--color-brand-red)]/50 shadow-inner' 
                          : 'bg-black/30 text-white/40 border-white/5 hover:bg-white/5 border-transparent'}`}
                   >
                     {opt}
                   </button>
                 ))}
              </div>
            </div>

            {/* Public Message */}
            <div>
              <label className="text-[10px] uppercase font-bold tracking-widest text-white/50 mb-3 block">Mensagem ao Cliente</label>
              <textarea 
                rows={3}
                placeholder="Informe o cliente sobre o progresso atual..."
                value={publicMessage}
                onChange={e => setPublicMessage(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white placeholder-white/30 outline-none focus:border-[var(--color-brand-red)] transition-colors resize-none"
                required
              />
            </div>

            {/* Internal Note */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-[10px] uppercase font-bold tracking-widest text-white/50">Nota Interna</label>
                <span className="text-[9px] uppercase font-bold text-[#d32f2f] bg-[#d32f2f]/10 px-2 py-0.5 rounded border border-[#d32f2f]/20">🔒 Somente Equipe</span>
              </div>
              <textarea 
                rows={2}
                placeholder="Detalhes técnicos, fornecedores ou observações internas..."
                value={internalNote}
                onChange={e => setInternalNote(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white/70 placeholder-white/20 outline-none focus:border-white/20 transition-colors resize-none font-mono text-sm"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
               {/* Photos */}
               <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-white/50 mb-3 block">Fotos do Progresso</label>
                  <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
                     <button type="button" onClick={() => {
                        const url = prompt('Cole a URL da Imagem (Ex: https://...):', '');
                        if (url && url.length > 5) setPhotos([...photos, url]);
                     }} className="w-24 h-24 shrink-0 rounded-2xl bg-[var(--color-brand-red)]/5 border border-[var(--color-brand-red)]/20 text-[var(--color-brand-red)] flex flex-col items-center justify-center gap-2 hover:bg-[var(--color-brand-red)]/10 transition-colors">
                        <Camera className="w-6 h-6" />
                     </button>
                     {photos.map((p, i) => (
                       <img key={i} src={p} alt="" className="w-24 h-24 rounded-2xl object-cover shrink-0 border border-white/10" />
                     ))}
                  </div>
               </div>
               
               {/* Delivery */}
               <div>
                  <label className="text-[10px] uppercase font-bold tracking-widest text-white/50 mb-3 block">Estimativa de Entrega</label>
                  <div className="relative">
                    <CalendarIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                    <input 
                      type="date" 
                      value={estimate}
                      onChange={e => setEstimate(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 pl-12 text-white font-bold outline-none focus:border-[var(--color-brand-red)] transition-colors [&::-webkit-calendar-picker-indicator]:invert"
                    />
                  </div>
               </div>
            </div>

            {/* Notifications toggle */}
            <div className="bg-[var(--color-brand-red)]/5 border border-[var(--color-brand-red)]/20 p-5 rounded-2xl flex items-center justify-between">
               <div className="flex items-center gap-4">
                 <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${notify ? 'bg-[var(--color-brand-red)]/20 text-[var(--color-brand-red)]' : 'bg-black/50 text-white/20'}`}>
                   <Bell className="w-5 h-5" />
                 </div>
                 <div>
                   <h4 className={`text-sm font-bold mb-0.5 transition-colors ${notify ? 'text-white' : 'text-white/50'}`}>Enviar notificação ao cliente</h4>
                   <p className="text-[10px] text-white/40">O cliente receberá um SMS e WhatsApp.</p>
                 </div>
               </div>
               <button 
                 type="button" 
                 onClick={() => setNotify(!notify)}
                 className={`w-12 h-6 rounded-full relative transition-colors ${notify ? 'bg-[var(--color-brand-red)]' : 'bg-white/10'}`}
               >
                 <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-md transition-transform ${notify ? 'translate-x-6.5 left-[1px]' : 'translate-x-0.5'}`} />
               </button>
            </div>
            
            {/* Submit */}
            <div className="pt-4 border-t border-white/5">
              <button 
                type="submit" 
                className="w-full bg-[var(--color-brand-red)] hover:bg-[var(--color-brand-red-dark)] text-white font-black uppercase tracking-wider text-sm py-4 rounded-2xl shadow-[0_0_20px_rgba(211,47,47,0.3)] transition"
              >
                Publicar atualização
              </button>
            </div>
         </form>
       </div>
    </div>
  );
}
