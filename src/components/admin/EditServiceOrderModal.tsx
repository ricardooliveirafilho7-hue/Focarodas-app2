import React, { useState } from 'react';
import { useAppStore } from '../../lib/store';
import { X, Save, Image as ImageIcon, Clock, MessageSquare, FileText } from 'lucide-react';
import { ServiceOrder, ServiceStatus } from '../../types';
import { fileToDataUrl, uploadVehiclePhoto } from '../../lib/imageUpload';

export default function EditServiceOrderModal({ order, onClose }: { order: ServiceOrder, onClose: () => void }) {
  const { updateServiceOrder, addVehicleUpdate, getVehicleById } = useAppStore();
  const [status, setStatus] = useState(order.status);
  const [delivery, setDelivery] = useState(order.deliveryEstimate);
  const [internalNote, setInternalNote] = useState('');
  const [publicMessage, setPublicMessage] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const vehicleInfo = getVehicleById(order.vehicleId);

  const handlePhotoSelect = async (files?: FileList | null) => {
    if (!files?.length) return;
    setErrorMsg('');
    const selected = Array.from(files);
    try {
      const previews = await Promise.all(selected.map(file => fileToDataUrl(file)));
      setPhotoFiles(prev => [...prev, ...selected]);
      setPhotos(prev => [...prev, ...previews]);
    } catch (error: unknown) {
      setErrorMsg(error instanceof Error ? error.message : 'Nao foi possivel carregar as fotos.');
    }
  };

  const handleSave = async () => {
    setErrorMsg('');
    setIsSaving(true);
    try {
      const uploadedPhotos = photoFiles.length
        ? await Promise.all(photoFiles.map(file => uploadVehiclePhoto(file, `${vehicleInfo?.plate || order.id}-${order.id}`)))
        : photos;
      if (status !== order.status || publicMessage.trim() || internalNote.trim() || uploadedPhotos.length > 0) {
        await addVehicleUpdate(order.id, status, publicMessage, internalNote, uploadedPhotos, delivery, !!publicMessage);
      } else if (delivery !== order.deliveryEstimate) {
        await updateServiceOrder(order.id, { deliveryEstimate: delivery });
      }
      onClose();
    } catch (error: unknown) {
      setErrorMsg(error instanceof Error ? error.message : 'Erro ao salvar OS.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200 backdrop-blur-sm">
      <div className="bg-[#111111] border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <div className="p-6 md:p-8 border-b border-white/5 flex justify-between items-start bg-[#151515] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-brand-red)]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="relative z-10 w-full">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-white">Editar Serviço <span className="text-[var(--color-brand-red)]">#{order.id.slice(-6).toUpperCase()}</span></h2>
                <p className="text-white/50 text-sm mt-1">{vehicleInfo?.model} - {vehicleInfo?.plate}</p>
              </div>
              <button onClick={onClose} className="p-2 text-white/40 hover:text-white rounded-full bg-white/5 border border-white/10 transition-colors shadow-lg">
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-8 bg-gradient-to-b from-[#151515] to-[#111]">
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-3 rounded-xl text-sm font-medium">
              {errorMsg}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#1C1C1F] p-5 rounded-2xl border border-white/5 shadow-inner">
              <label className="text-[10px] uppercase text-white/40 font-bold tracking-widest mb-3 flex items-center gap-2 drop-shadow-md">
                 <Clock size={14} className="text-[#E53935]" /> Status Atual
              </label>
              <select 
                value={status}
                onChange={e => setStatus(e.target.value as ServiceStatus)}
                className="w-full form-input bg-[#111] text-lg font-bold"
              >
                <option value="Em análise">🔍 Em análise (Orçamento)</option>
                <option value="Aguardando aprovação">⏳ Aguardando aprovação</option>
                <option value="Aprovado">👍 Aprovado</option>
                <option value="Em reparo">🔧 Em reparo</option>
                <option value="Pintura">🎨 Pintura</option>
                <option value="Alinhamento/Balanceamento">⚖️ Alinhamento/Balanceamento</option>
                <option value="Aguardando peças">📦 Aguardando peças</option>
                <option value="Pronto">✅ Pronto</option>
                <option value="Finalizado">🏁 Finalizado</option>
                <option value="Retirada">🚗 Retirada</option>
                <option value="Cancelado">❌ Cancelado</option>
              </select>
            </div>
            <div className="bg-[#1C1C1F] p-5 rounded-2xl border border-white/5 shadow-inner">
              <label className="text-[10px] uppercase text-white/40 font-bold tracking-widest mb-3 flex items-center gap-2 drop-shadow-md">
                 <Clock size={14} className="text-white/40" /> Previsão de Entrega
              </label>
              <input 
                type="date"
                value={delivery}
                onChange={e => setDelivery(e.target.value)}
                className="w-full form-input bg-[#111] [color-scheme:dark] text-lg font-bold"
              />
            </div>
          </div>

          <div className="bg-[#1C1C1F] p-6 rounded-2xl border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 bottom-0 w-1 bg-green-500/50" />
            <label className="text-[10px] uppercase text-white/40 font-bold tracking-widest mb-3 flex items-center gap-2 drop-shadow-md">
              <MessageSquare size={14} className="text-green-500/50"/> 
              Mensagem para o Cliente 
              <span className="text-green-500/50 font-normal ml-1">(Notificação)</span>
            </label>
            <textarea 
              value={publicMessage}
              onChange={e => setPublicMessage(e.target.value)}
              placeholder="Descreva a atualização para o cliente. Ex: A peça chegou e o serviço de pintura começou, estimamos a secagem amanhã."
              className="w-full form-input h-24 resize-none bg-[#111]"
            />
          </div>

          <div className="bg-[#1C1C1F] p-6 rounded-2xl border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 bottom-0 w-1 bg-yellow-500/50" />
            <label className="text-[10px] uppercase text-white/40 font-bold tracking-widest mb-3 flex items-center gap-2 drop-shadow-md">
              <FileText size={14} className="text-yellow-500/50"/>
              Anotação Interna 
              <span className="text-yellow-500/50 font-normal ml-1">(Equipe)</span>
            </label>
            <textarea 
              value={internalNote}
              onChange={e => setInternalNote(e.target.value)}
              placeholder="Notas para os mecânicos, como dificuldade para remover o parafuso, ou recomendação de checar rolamento depois."
              className="w-full form-input h-20 resize-none bg-[#111]"
            />
          </div>
          
          <div className="bg-[#1C1C1F] p-6 rounded-2xl border border-white/5">
            <label className="text-[10px] uppercase text-white/40 font-bold tracking-widest mb-3 flex items-center gap-2 drop-shadow-md">
               <ImageIcon size={14} /> Anexar Fotos
            </label>
            <label className="h-32 bg-[#111] border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-white/40 hover:bg-white/5 hover:border-white/30 hover:text-white transition-all cursor-pointer">
              <ImageIcon size={32} className="mb-2 opacity-50" />
              <span className="text-sm font-bold uppercase tracking-widest">Upload de Fotos</span>
              <span className="text-[10px] mt-1 opacity-50">Toque para selecionar</span>
              <input type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={e => handlePhotoSelect(e.target.files)} />
            </label>
            {photos.length > 0 && (
              <div className="flex gap-3 overflow-x-auto hide-scrollbar mt-4">
                {photos.map((photo, index) => (
                  <img key={index} src={photo} alt="Preview" className="w-20 h-20 rounded-xl object-cover border border-white/10" />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 md:p-6 border-t border-white/5 flex flex-col-reverse sm:flex-row justify-end gap-3 bg-[#111] z-10 relative">
          <button onClick={onClose} className="px-6 py-3 rounded-xl font-medium border border-white/10 bg-[#222] hover:bg-white/10 transition-colors text-white w-full sm:w-auto">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={isSaving} className="btn-primary py-3 px-8 rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-[var(--color-brand-red)]/20 w-full sm:w-auto disabled:opacity-50">
            <Save size={18} /> {isSaving ? 'Salvando...' : 'Salvar Nova Atualização'}
          </button>
        </div>
      </div>
    </div>
  );
}
