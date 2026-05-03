import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../lib/store';
import { Search, Phone, Calendar, MessageSquare, Edit2, Car, Users, Plus, Key, X, User, ChevronRight, Send, UploadCloud } from 'lucide-react';
import { Client, Vehicle } from '../../types';
import { fileToDataUrl, uploadVehiclePhoto } from '../../lib/imageUpload';
import { SkeletonCard } from '../SkeletonCard';

import NewServiceModal from './NewServiceModal';
const BookUser = Users;

function VehicleModal({ clientId, onClose, onSave }: { clientId: string, onClose: () => void, onSave: (v: Omit<Vehicle, 'id'>) => Promise<void> | void }) {
  const [formData, setFormData] = useState({
    model: '',
    plate: '',
    year: '',
    color: '',
    photo: '',
    observations: ''
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handlePhotoChange = async (file?: File) => {
    if (!file) return;
    setErrorMsg('');
    setPhotoFile(file);
    try {
      const preview = await fileToDataUrl(file);
      setFormData(prev => ({ ...prev, photo: preview }));
    } catch (error: unknown) {
      setErrorMsg(error instanceof Error ? error.message : 'Nao foi possivel carregar a foto.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSaving(true);
    try {
      const photo = photoFile
        ? await uploadVehiclePhoto(photoFile, `${formData.plate || formData.model || clientId}`)
        : formData.photo;
      await onSave({ ...formData, photo, clientId });
    } catch (error: unknown) {
      setErrorMsg(error instanceof Error ? error.message : 'Erro ao salvar a foto do veiculo.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200 backdrop-blur-sm">
      <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#E53935]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="p-6 border-b border-white/5 flex justify-between items-start bg-[#151515] relative z-10">
          <div>
             <h2 className="text-2xl font-black tracking-tight text-white">Adicionar Veículo</h2>
             <p className="text-white/40 text-sm mt-1 font-medium">Vincule um novo automóvel ao cliente.</p>
          </div>
          <button onClick={onClose} className="p-2 text-white/40 hover:text-white rounded-full bg-white/5 border border-white/10 shadow-lg transition-colors"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1 bg-gradient-to-b from-[#151515] to-[#111] relative z-10">
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-3 rounded-xl text-sm font-medium">
              {errorMsg}
            </div>
          )}
          <div className="bg-[#1C1C1F] p-6 rounded-2xl border border-white/5 space-y-5 shadow-inner">
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 ml-1">Modelo</label>
              <input type="text" required value={formData.model} onChange={e=>setFormData({...formData, model: e.target.value})} className="w-full form-input bg-[#111] font-bold" placeholder="Ex: VW Golf GTI" />
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 ml-1">Placa</label>
              <input type="text" required value={formData.plate} onChange={e=>setFormData({...formData, plate: e.target.value.toUpperCase()})} className="w-full form-input bg-[#111] uppercase font-mono tracking-widest font-bold text-lg" placeholder="ABC-1234" />
            </div>
            
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 ml-1">Ano</label>
                <input type="text" required value={formData.year} onChange={e=>setFormData({...formData, year: e.target.value})} className="w-full form-input bg-[#111]" placeholder="2022" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 ml-1">Cor</label>
                <input type="text" required value={formData.color} onChange={e=>setFormData({...formData, color: e.target.value})} className="w-full form-input bg-[#111]" placeholder="Prata" />
              </div>
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 ml-1">Foto do Veiculo <span className="lowercase font-normal text-white/30">(opcional)</span></label>
              <label className="w-full min-h-28 bg-[#111] border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 text-white/50 hover:text-white hover:border-[#E53935]/50 cursor-pointer transition-colors overflow-hidden">
                {formData.photo ? (
                  <img src={formData.photo} className="w-full h-40 object-cover" alt="Preview do veiculo" />
                ) : (
                  <>
                    <UploadCloud size={24} />
                    <span className="text-xs font-bold uppercase tracking-widest">Selecionar foto</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoChange(e.target.files?.[0])} />
              </label>
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 ml-1">Observações Especiais</label>
              <textarea value={formData.observations} onChange={e=>setFormData({...formData, observations: e.target.value})} className="w-full form-input bg-[#111] resize-none h-20" placeholder="Ex: Roda dianteira direita ralada..." />
            </div>
          </div>

          <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-3 pb-2">
            <button type="button" onClick={onClose} disabled={isSaving} className="px-6 py-3 rounded-xl font-bold tracking-wide border border-white/10 bg-[#1C1C1F] hover:bg-[#222] transition-colors text-white/60 hover:text-white w-full sm:w-auto disabled:opacity-50">Cancelar</button>
            <button type="submit" className="btn-primary py-3 px-8 rounded-xl font-bold tracking-wide shadow-lg shadow-[#E53935]/20 w-full sm:w-auto">Salvar Veículo</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ClientModal({ client, onClose, onSave }: { client?: Client | null, onClose: () => void, onSave: (c: Omit<Client, 'id'>) => Promise<{success: boolean, error?: string}> | void }) {
  const [formData, setFormData] = useState({
    name: client?.name || '',
    login: client?.login || '',
    password: client?.password || '',
    phone: client?.phone || '',
    email: client?.email || '',
    observations: client?.observations || '',
    status: client?.status || 'Ativo',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await onSave(formData);
      if (res && res.success === false) {
        setErrorMsg(res.error || 'Ocorreu um erro ao salvar o cliente.');
      }
    } catch (err: unknown) {
      setErrorMsg('Erro inesperado: ' + String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200 backdrop-blur-sm">
      <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#E53935]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="p-6 md:p-8 border-b border-white/5 flex justify-between items-start bg-[#151515] relative z-10">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-white">{client ? 'Editar Cliente' : 'Novo Cliente'}</h2>
            <p className="text-white/40 text-sm mt-1 font-medium">{client ? 'Atualize os dados de cadastro e portal do cliente.' : 'Cadastre as credenciais e informações do proprietário.'}</p>
          </div>
          <button onClick={onClose} className="p-2 text-white/40 hover:text-white rounded-full bg-white/5 border border-white/10 shadow-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 overflow-y-auto flex-1 space-y-6 bg-gradient-to-b from-[#151515] to-[#111] relative z-10">
          
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
              <p className="text-sm font-medium">{errorMsg}</p>
            </div>
          )}

          <div className="bg-[#1C1C1F] p-6 rounded-2xl border border-white/5 space-y-5 shadow-inner">
             <div>
               <label className="block text-[10px] uppercase font-bold tracking-widest text-[#E53935] mb-2 ml-1">Dados Funcionais</label>
             </div>
             
             <div>
               <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 ml-1">Nome Completo</label>
               <input type="text" required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full form-input bg-[#111] font-bold" />
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
               <div>
                 <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 ml-1">Telefone / WhatsApp</label>
                 <input type="text" required value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} className="w-full form-input bg-[#111] font-mono" />
               </div>
               <div>
                 <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 ml-1">E-mail Pessoal</label>
                 <input type="email" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full form-input bg-[#111]" />
               </div>
             </div>
             
             <div>
                 <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 ml-1">Status da Conta</label>
                 <select value={formData.status} onChange={e=>setFormData({...formData, status: e.target.value as Client['status']})} className="w-full form-input bg-[#111] font-bold text-white">
                   <option value="Ativo" className="bg-[#222]">🟢 Cliente Ativo</option>
                   <option value="Aguardando" className="bg-[#222]">🟡 Em Prospecção / Aguardando</option>
                   <option value="Inativo" className="bg-[#222]">⚫ Cliente Inativo</option>
                 </select>
             </div>
          </div>
          
          <div className="bg-[#1C1C1F] p-6 rounded-2xl border border-white/5 space-y-5 shadow-inner">
             <div>
               <label className="block text-[10px] uppercase font-bold tracking-widest text-blue-500 mb-2 ml-1 flex items-center gap-1.5"><Key size={12}/> Credenciais do Portal do Cliente</label>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 ml-1">Login</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                    <input type="text" required value={formData.login} onChange={e=>setFormData({...formData, login: e.target.value})} className="w-full form-input bg-[#111] pl-10 font-mono" placeholder="usuario_cli" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 ml-1">Senha</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                    <input type="password" autoComplete="new-password" required={!client} value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})} className="w-full form-input bg-[#111] pl-10 font-mono" placeholder={client ? 'Preencha apenas se quiser trocar' : 'Senha'} />
                  </div>
                </div>
             </div>
          </div>

          <div className="bg-[#1C1C1F] p-6 rounded-2xl border border-white/5 space-y-5 shadow-inner">
             <div>
               <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 ml-1">Anotações (Apenas Equipe)</label>
               <textarea rows={3} value={formData.observations} onChange={e=>setFormData({...formData, observations: e.target.value})} className="w-full form-input bg-[#111] resize-none" placeholder="Detalhes extras sobre o cliente, preferências, histórico informal..." />
             </div>
          </div>

          <div className="pt-4 flex flex-col-reverse sm:flex-row justify-end gap-3 z-10 relative">
            <button type="button" onClick={onClose} disabled={loading} className="px-6 py-3 rounded-xl font-bold tracking-wide border border-white/10 bg-[#1C1C1F] hover:bg-[#222] transition-colors text-white/60 hover:text-white w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-primary py-3 px-8 rounded-xl font-bold tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-[#E53935]/20 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Salvando...' : 'Salvar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

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
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="p-6 border-b border-white/5 flex justify-between items-start bg-[#151515] relative z-10">
          <div>
            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2"><Send size={20} className="text-blue-500"/> Enviar Notificação</h2>
            <p className="text-white/40 text-xs mt-1 font-medium">Esta mensagem aparecerá diretamente no painel do cliente.</p>
          </div>
          <button onClick={onClose} className="p-2 text-white/40 hover:text-white rounded-full bg-white/5 border border-white/10 shadow-lg transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={handleSend} className="p-6 flex flex-col space-y-4 relative z-10">
          <div>
             <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">Título do Aviso</label>
             <input type="text" required value={title} onChange={e=>setTitle(e.target.value)} className="w-full bg-[#1A1A1A] border border-white/5 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none transition-colors" placeholder="Ex: Veículo Liberado" />
          </div>
          <div>
             <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">Mensagem</label>
             <textarea required value={content} onChange={e=>setContent(e.target.value)} className="w-full bg-[#1A1A1A] border border-white/5 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none transition-colors resize-none" rows={4} placeholder="Digite os detalhes para o cliente..." />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-white/40 mb-2">Urgência</label>
            <select value={type} onChange={e=>setType(e.target.value as typeof type)} className="w-full bg-[#1A1A1A] border border-white/5 rounded-xl p-3 text-white focus:border-blue-500 transition-colors">
               <option value="info">Geral / Informativo</option>
               <option value="success">Sucesso / Concluído</option>
               <option value="warning">Aviso / Importante</option>
            </select>
          </div>
          <button type="submit" disabled={isSending} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold p-3 rounded-xl mt-4 flex items-center justify-center gap-2 transition-all">
             {isSending ? 'Enviando...' : <><Send size={16}/> Enviar Agora</>}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Clients() {
  const { clients, vehicles, createClient, updateClient, createVehicle } = useAppStore();
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(clients[0] || null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMsgModalOpen, setIsMsgModalOpen] = useState(false);
  const [modalClient, setModalClient] = useState<Client | null>(null);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isNewServiceModalOpen, setIsNewServiceModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const filtered = clients.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (c.name || '').toLowerCase().includes(q) || ((c.phone || '').includes(q)) || (c.login && c.login.toLowerCase().includes(q));
  });

  const getClientVehicles = (id: string) => vehicles.filter(v => v.clientId === id);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 250);
    return () => window.clearTimeout(timer);
  }, []);

  const handleSaveClient = async (data: Omit<Client, 'id'>) => {
    let res;
    if (modalClient) {
      const success = await updateClient(modalClient.id, data);
      res = success ? { success: true } : { success: false, error: 'Erro ao atualizar cliente. Verifique a conexão.' };
      if (success) setSelectedClient({ ...modalClient, ...data });
    } else {
      const result = await createClient(data);
      if (!result.success) {
        res = result;
      } else {
        res = { success: true };
        if (result.client) setSelectedClient(result.client);
      }
    }
    
    if (res.success) {
      setIsModalOpen(false);
    }
    return res;
  };

  const handleSaveVehicle = async (data: Omit<Vehicle, 'id'>) => {
    const vehicle = await createVehicle(data);
    if (vehicle) setIsVehicleModalOpen(false);
  };

  return (
    <div className="p-4 md:p-8 flex flex-col lg:flex-row gap-6 h-[calc(100vh-4rem)]">
      {isModalOpen && (
        <ClientModal 
          client={modalClient} 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSaveClient} 
        />
      )}

      {isMsgModalOpen && selectedClient && (
        <SendMessageModal
          clientId={selectedClient.id}
          onClose={() => setIsMsgModalOpen(false)}
        />
      )}

      {isVehicleModalOpen && selectedClient && (
        <VehicleModal
          clientId={selectedClient.id}
          onClose={() => setIsVehicleModalOpen(false)}
          onSave={handleSaveVehicle}
        />
      )}

      {isNewServiceModalOpen && selectedClient && (
        <NewServiceModal
          defaultClientId={selectedClient.id}
          onClose={() => setIsNewServiceModalOpen(false)}
        />
      )}

      {/* Left side: Directory */}
      <div className="lg:w-[400px] flex flex-col bg-[#0A0A0A] rounded-[2rem] border border-white/5 overflow-hidden shrink-0 h-[400px] lg:h-full shadow-2xl relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#E53935]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="p-6 md:p-8 border-b border-white/5 bg-[#111] relative z-10 shadow-lg">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
                 Clientes <Users className="w-8 h-8 text-[#E53935] drop-shadow-[0_0_10px_rgba(229,57,53,0.3)]" />
              </h1>
            </div>
            <button 
              onClick={() => { setModalClient(null); setIsModalOpen(true); }}
              className="bg-[#1C1C1F] hover:bg-white text-white/60 hover:text-black border border-white/10 p-3 rounded-2xl transition-all shadow-lg hover:shadow-white/20"
              title="Novo Cliente"
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="relative group">
             <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5 group-focus-within:text-[#E53935] transition-colors" />
             <input 
               type="text" 
               placeholder="Buscar cliente, tel ou login..." 
               value={search}
               onChange={e => setSearch(e.target.value)}
               className="w-full bg-[#1C1C1F] border border-white/5 rounded-full pl-14 pr-6 py-4 text-sm focus:outline-none focus:border-[#E53935]/50 focus:bg-[#222] transition-colors text-white placeholder:text-white/20 shadow-inner"
             />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 pb-24 lg:pb-6 relative z-10 hide-scrollbar">
           <div className="flex justify-between items-center px-2 mb-4">
             <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2"><BookUser size={12}/> Catálogo</span>
             <span className="text-[10px] bg-[#1C1C1F] border border-white/5 px-2.5 py-1 rounded-full text-white/60 font-bold uppercase tracking-widest">{filtered.length} Registros</span>
           </div>
           
           {isLoading && Array.from({ length: 3 }).map((_, index) => (
             <SkeletonCard key={`client-skeleton-${index}`} className="rounded-3xl" />
           ))}

           {!isLoading && filtered.map(client => {
             const isSelected = selectedClient?.id === client.id;
             const vCount = getClientVehicles(client.id).length;
             return (
               <button 
                 key={client.id}
                 onClick={() => setSelectedClient(client)}
                 className={`
                   w-full text-left p-5 rounded-3xl transition-all border group relative overflow-hidden
                   ${isSelected 
                     ? 'bg-[#1C1C1F] border-[var(--color-brand-red)]/50 shadow-[0_0_30px_rgba(229,57,53,0.15)] shadow-inner' 
                     : 'bg-[#111] border-white/5 hover:border-white/20 hover:bg-[#151515]'}
                 `}
               >
                  {isSelected && <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-brand-red)]/5 rounded-bl-full -mr-8 -mt-8 pointer-events-none" />}
                  <div className="flex justify-between items-start mb-3 relative z-10">
                    <h3 className={`font-black tracking-tight text-lg truncate pr-4 ${isSelected ? 'text-white' : 'text-white/80'}`}>{client.name}</h3>
                    {client.status === 'Ativo' && <span className="text-[9px] font-black bg-green-500/10 text-green-500 border border-green-500/20 px-2 py-1 rounded-lg uppercase tracking-widest shrink-0">Ativo</span>}
                    {client.status === 'Aguardando' && <span className="text-[9px] font-black bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-1 rounded-lg uppercase tracking-widest shrink-0">Espera</span>}
                    {client.status === 'Inativo' && <span className="text-[9px] font-black bg-[#333] text-white/40 border border-white/10 px-2 py-1 rounded-lg uppercase tracking-widest shrink-0">Inativo</span>}
                  </div>
                  <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5"><User size={12} className="inline mr-1" /> {client.login || 'S/ Portal'}</div>
                  <p className="text-xs text-white/50 font-mono tracking-wider font-bold mb-4">{(client.phone || '').replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}</p>
                  
                  <div className="flex justify-between items-end relative z-10 mt-auto pt-2 border-t border-white/5">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/40 bg-[#1C1C1F] border border-white/5 px-2.5 py-1 rounded-lg">
                      <Car size={12} className={vCount > 0 ? 'text-[#E53935]':''}/> {vCount} {vCount===1?'Veículo':'Veículos'}
                    </span>
                    <ChevronRight size={16} className={`transition-transform ${isSelected ? 'text-[#E53935] translate-x-1' : 'text-white/20 group-hover:text-white/40 group-hover:translate-x-1'}`} />
                  </div>
               </button>
             );
           })}

           {!isLoading && clients.length === 0 && (
             <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-white/5 rounded-3xl bg-[#151515] mt-4">
                 <div className="w-20 h-20 bg-[#111] rounded-full flex items-center justify-center mb-6 shadow-inner border border-white/5">
                    <Users className="w-10 h-10 text-[#E53935] drop-shadow-[0_0_10px_rgba(229,57,53,0.5)]" />
                 </div>
                 <h3 className="text-2xl font-black tracking-tight text-white mb-2">Sem clientes base</h3>
                 <p className="text-white/40 font-medium mb-8 max-w-[200px] mx-auto text-sm">Os registros cadastrados aparecerão nesta lista central.</p>
                 <button 
                   onClick={() => { setModalClient(null); setIsModalOpen(true); }}
                   className="btn-primary py-3 px-8 rounded-xl font-bold tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-[#E53935]/20 text-sm"
                 >
                   Criar Cadastro
                 </button>
             </div>
           )}
        </div>
      </div>

      {/* Right side: Detail */}
      <div className="lg:w-2/3 flex-1 overflow-y-auto pb-8 lg:pb-0 hide-scrollbar bg-[#0A0A0A] rounded-[2rem] border border-white/5 p-4 md:p-8 relative shadow-2xl">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#E53935]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
         
        {selectedClient ? (
          <div className="space-y-6 relative z-10 animate-in slide-in-from-right-8 fade-in">
            <div className="bg-[#111] border border-white/5 rounded-3xl p-6 md:p-8 relative overflow-hidden flex flex-col sm:flex-row items-center sm:items-start gap-8 shadow-xl">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Users size={180} />
              </div>
              <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-[#1C1C1F] to-[#111] flex items-center justify-center border-2 border-white/10 shadow-inner shrink-0 text-5xl font-black text-white/20">
                 {selectedClient.name.substring(0,2).toUpperCase()}
              </div>
              <div className="flex-1 text-center sm:text-left z-10 w-full">
                 <div className="flex flex-col xl:flex-row justify-between items-center xl:items-start gap-6 mb-4">
                   <div>
                     <h2 className="text-4xl font-black tracking-tight text-white mb-3">{selectedClient.name}</h2>
                     <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
                       <span className="text-[#E53935] font-bold text-xs uppercase tracking-widest flex items-center gap-1.5 bg-[#E53935]/10 px-3 py-1.5 rounded-xl border border-[#E53935]/20 shadow-inner">
                         <User size={14} /> Portal: {selectedClient.login || 'Não ativado'}
                       </span>
                       <span className="text-white/40 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1.5 bg-[#1C1C1F] px-3 py-1.5 rounded-xl border border-white/5">
                         <Calendar size={14}/> Base desde {selectedClient.createdAt ? new Date(selectedClient.createdAt).getFullYear() : new Date().getFullYear()}
                       </span>
                     </div>
                   </div>
                   <div className="flex flex-wrap gap-3 w-full xl:w-auto justify-center sm:justify-start xl:justify-end shrink-0">
                     <button 
                       onClick={() => setIsNewServiceModalOpen(true)}
                       className="px-6 py-3 rounded-xl bg-[#E53935] text-white border border-[#E53935] hover:bg-white hover:text-black hover:border-white transition-all flex items-center justify-center gap-2 text-sm font-bold tracking-wide shadow-lg shadow-[#E53935]/20 w-full sm:w-auto"
                     >
                       Nova O.S.
                     </button>
                     <button 
                       onClick={() => setIsMsgModalOpen(true)}
                       className="px-6 py-3 rounded-xl bg-blue-600/10 text-blue-500 border border-blue-500/20 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2 text-sm font-bold tracking-wide shadow-inner w-full sm:w-auto mt-2 sm:mt-0 xl:mt-0"
                     >
                       <Send size={16} /> Enviar Mensagem
                     </button>
                     <button 
                       onClick={() => { setModalClient(selectedClient); setIsModalOpen(true); }}
                       className="px-6 py-3 rounded-xl bg-[#1C1C1F] border border-white/10 hover:bg-[#222] transition-all flex items-center justify-center gap-2 text-sm font-bold tracking-wide text-white/80 hover:text-white shadow-inner w-full sm:w-auto mt-2 sm:mt-0 xl:mt-0"
                     >
                       <Edit2 size={16} /> Ajustar Perfil
                     </button>
                   </div>
                 </div>
                 
                 {selectedClient.observations && (
                   <div className="mt-8 bg-[#1C1C1F] border border-white/5 p-5 rounded-2xl shadow-inner relative overflow-hidden group">
                     <div className="absolute top-0 left-0 bottom-0 w-1 bg-yellow-500/50" />
                     <p className="text-sm font-medium text-white/50 leading-relaxed pl-2 text-left flex items-start gap-3">
                       <MessageSquare size={16} className="text-yellow-500/50 shrink-0 mt-0.5" />
                       {selectedClient.observations}
                     </p>
                   </div>
                 )}
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
               <div className="bg-[#111] border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl">
                 <h3 className="font-black text-xl mb-8 text-white tracking-tight flex items-center gap-3">
                    <Phone size={24} className="text-[#E53935] bg-[#E53935]/10 p-1.5 rounded-lg border border-[#E53935]/20"/> 
                    Contatos Principais
                 </h3>
                 <div className="space-y-6">
                   <div className="bg-[#1C1C1F] p-5 rounded-2xl border border-white/5 shadow-inner">
                     <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">Célular / WhatsApp</span>
                     <span className="font-mono text-2xl font-bold tracking-tight text-white">{(selectedClient.phone || '').replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}</span>
                   </div>
                   <div className="bg-[#1C1C1F] p-5 rounded-2xl border border-white/5 shadow-inner overflow-hidden">
                     <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">E-mail Pessoal</span>
                     <span className="text-base font-bold text-white/80 truncate block">{selectedClient.email || 'Não informado no sistema'}</span>
                   </div>
                 </div>
               </div>

               <div className="bg-[#111] border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col">
                 <div className="flex justify-between items-center mb-8">
                   <h3 className="font-black text-xl text-white tracking-tight flex items-center gap-3">
                     <Car size={24} className="text-[#E53935] bg-[#E53935]/10 p-1.5 rounded-lg border border-[#E53935]/20"/> 
                     Frota do Cliente
                   </h3>
                   <button onClick={() => setIsVehicleModalOpen(true)} className="bg-[#1C1C1F] hover:bg-white text-white/60 hover:text-black border border-white/10 p-2 rounded-xl transition-all shadow-lg hover:shadow-white/20" title="Vincular Novo Automóvel">
                      <Plus size={20}/>
                   </button>
                 </div>
                 
                 <div className="space-y-4 flex-1 overflow-y-auto hide-scrollbar -mx-2 px-2">
                   {getClientVehicles(selectedClient.id).map((v, i) => (
                     <div key={v.id} className="bg-[#1C1C1F] border border-white/5 p-5 rounded-2xl flex items-center gap-5 shadow-inner animate-in slide-in-from-right-4 fade-in" style={{ animationDelay: `${i*100}ms`}}>
                        <div className="w-16 h-16 bg-[#111] border border-white/10 rounded-2xl flex items-center justify-center text-white/20 overflow-hidden shrink-0 shadow-inner">
                           {v.photo ? <img src={v.photo} alt={v.model} className="w-full h-full object-cover" /> : <Car size={28} className="text-[#E53935]/50 drop-shadow-[0_0_10px_rgba(229,57,53,0.5)]" />}
                        </div>
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="font-black text-lg tracking-tight text-white mb-2 truncate">{v.model}</p>
                          <div className="flex flex-wrap items-center gap-3">
                             <span className="text-xs font-mono font-bold uppercase tracking-widest text-black bg-white px-2.5 py-1 rounded-lg shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)] border border-white/20">{v.plate}</span>
                             <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-1.5 bg-[#111] px-2.5 py-1 rounded-lg border border-white/5">{v.color} - {v.year}</span>
                          </div>
                        </div>
                     </div>
                   ))}
                   {getClientVehicles(selectedClient.id).length === 0 && (
                     <div className="h-full flex flex-col items-center justify-center py-10 bg-[#1C1C1F] rounded-2xl border border-white/5 shadow-inner border-dashed">
                        <Car size={32} className="text-white/10 mb-3" />
                        <p className="text-xs font-bold uppercase tracking-widest text-white/30 text-center">Nenhum veículo<br/>vinculado no momento.</p>
                     </div>
                   )}
                 </div>
               </div>
            </div>

          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-white/30 border-2 border-dashed border-white/5 rounded-[2rem] bg-[#111]">
            <div className="w-24 h-24 bg-[#1C1C1F] rounded-full flex items-center justify-center mb-6 shadow-inner border border-white/5">
                <Users size={40} className="text-[#E53935] drop-shadow-[0_0_10px_rgba(229,57,53,0.3)]" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight mb-2">Painel de Visualização</h2>
            <p className="font-medium text-white/40">Selecione um cliente no catálogo lateral para examinar seus dados.</p>
          </div>
        )}
      </div>
    </div>
  );
}
