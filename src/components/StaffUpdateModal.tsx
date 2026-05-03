import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { Camera, X, Bell, Calendar as CalendarIcon } from 'lucide-react';
import { ServiceStatus } from '../types';
import { fileToDataUrl, uploadVehiclePhoto } from '../lib/imageUpload';

const STATUS_OPTIONS: ServiceStatus[] = [
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

export default function StaffUpdateModal({ orderId, onClose }: { orderId: string, onClose: () => void }) {
  const { getVehicleById, getServiceOrderById, addVehicleUpdate } = useAppStore();
  const order = getServiceOrderById(orderId);
  const vehicle = order ? getVehicleById(order.vehicleId) : undefined;

  const [status, setStatus] = useState<ServiceStatus>(order?.status || 'Recebido');
  const [publicMessage, setPublicMessage] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [estimate, setEstimate] = useState(order?.deliveryEstimate?.split('T')[0] || new Date().toISOString().split('T')[0]);
  const [notify, setNotify] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!order || !vehicle) return null;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSaving(true);
    try {
      const uploadedPhotos = photoFiles.length
        ? await Promise.all(photoFiles.map(file => uploadVehiclePhoto(file, `${vehicle.plate}-${order.id}`)))
        : photos;
      await addVehicleUpdate(orderId, status, publicMessage, internalNote, uploadedPhotos, estimate, notify);
      onClose();
    } catch (error: unknown) {
      setErrorMsg(error instanceof Error ? error.message : 'Erro ao salvar atualizacao.');
    } finally {
      setIsSaving(false);
    }
  };

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
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-3 rounded-xl text-sm font-medium">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="text-[10px] uppercase font-bold tracking-widest text-white/50 mb-3 block">Novo Status do Veiculo</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setStatus(opt)}
                  className={`py-3 px-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                    status === opt
                      ? 'bg-[var(--color-brand-red)]/10 text-[var(--color-brand-red)] border-[var(--color-brand-red)]/50 shadow-inner'
                      : 'bg-black/30 text-white/40 border-white/5 hover:bg-white/5'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold tracking-widest text-white/50 mb-3 block">Mensagem ao Cliente</label>
            <textarea
              rows={3}
              placeholder="Informe o cliente sobre o progresso atual (opcional)..."
              value={publicMessage}
              onChange={e => setPublicMessage(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white placeholder-white/30 outline-none focus:border-[var(--color-brand-red)] transition-colors resize-none"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-[10px] uppercase font-bold tracking-widest text-white/50">Nota Interna</label>
              <span className="text-[9px] uppercase font-bold text-[#d32f2f] bg-[#d32f2f]/10 px-2 py-0.5 rounded border border-[#d32f2f]/20">Somente Equipe</span>
            </div>
            <textarea
              rows={2}
              placeholder="Detalhes tecnicos, fornecedores ou observacoes internas..."
              value={internalNote}
              onChange={e => setInternalNote(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white/70 placeholder-white/20 outline-none focus:border-white/20 transition-colors resize-none font-mono text-sm"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] uppercase font-bold tracking-widest text-white/50 mb-3 block">Fotos do Progresso</label>
              <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
                <label className="w-24 h-24 shrink-0 rounded-2xl bg-[var(--color-brand-red)]/5 border border-[var(--color-brand-red)]/20 text-[var(--color-brand-red)] flex flex-col items-center justify-center gap-2 hover:bg-[var(--color-brand-red)]/10 transition-colors cursor-pointer">
                  <Camera className="w-6 h-6" />
                  <input type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={e => handlePhotoSelect(e.target.files)} />
                </label>
                {photos.map((p, i) => (
                  <img key={i} src={p} alt="" className="w-24 h-24 rounded-2xl object-cover shrink-0 border border-white/10" />
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold tracking-widest text-white/50 mb-3 block">Estimativa de Entrega</label>
              <div className="relative">
                <CalendarIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="date"
                  value={estimate}
                  onChange={e => setEstimate(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 pl-12 text-white font-bold outline-none focus:border-[var(--color-brand-red)] transition-colors [color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-brand-red)]/5 border border-[var(--color-brand-red)]/20 p-5 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${notify ? 'bg-[var(--color-brand-red)]/20 text-[var(--color-brand-red)]' : 'bg-black/50 text-white/20'}`}>
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h4 className={`text-sm font-bold mb-0.5 transition-colors ${notify ? 'text-white' : 'text-white/50'}`}>Enviar notificacao ao cliente</h4>
                <p className="text-[10px] text-white/40">O cliente recebera uma mensagem interna no painel do cliente.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setNotify(!notify)}
              className={`w-12 h-6 rounded-full relative transition-colors ${notify ? 'bg-[var(--color-brand-red)]' : 'bg-white/10'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-md transition-transform ${notify ? 'translate-x-6 left-[1px]' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <div className="pt-4 border-t border-white/5">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-[var(--color-brand-red)] hover:bg-[var(--color-brand-red-dark)] text-white font-black uppercase tracking-wider text-sm py-4 rounded-2xl shadow-[0_0_20px_rgba(211,47,47,0.3)] transition disabled:opacity-50"
            >
              {isSaving ? 'Salvando...' : 'Publicar atualizacao'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
