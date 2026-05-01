import React, { useState } from 'react';
import { useAppStore } from '../../lib/store';
import { X, Search, CheckCircle2, Car, Calendar, Info, UserPlus, ChevronRight, User, History, ClipboardList, UploadCloud } from 'lucide-react';
import { Vehicle, Client } from '../../types';
import { fileToDataUrl, uploadVehiclePhoto } from '../../lib/imageUpload';

export default function NewServiceModal({ onClose, defaultClientId }: { onClose: () => void, defaultClientId?: string }) {
  const { clients, vehicles, createClient, createVehicle, createServiceOrder } = useAppStore();
  
  const [step, setStep] = useState<1 | 2 | 3>(defaultClientId ? 2 : 1);
  
  // Step 1: Client
  const [clientMode, setClientMode] = useState<'search' | 'new'>('search');
  const [searchClient, setSearchClient] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(defaultClientId ? clients.find(c => c.id === defaultClientId) || null : null);
  const [newClient, setNewClient] = useState({ name: '', phone: '', email: '', login: '', password: '' });

  // Step 2: Vehicle
  const [vehicleMode, setVehicleMode] = useState<'select' | 'new'>('select');
  const [searchVehicle, setSearchVehicle] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [newVehicle, setNewVehicle] = useState({ model: '', plate: '', year: '', color: '', photo: '', observations: '' });
  const [newVehiclePhotoFile, setNewVehiclePhotoFile] = useState<File | null>(null);

  // Step 3: Service Order
  const [service, setService] = useState({ 
    servicesFull: '', 
    observations: '', 
    initialStatus: 'Recebido' as any, 
    deliveryEstimate: new Date(Date.now() + 86400000).toISOString().split('T')[0] 
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const filteredClients = clients.filter(c => {
    if (!searchClient) return true;
    const q = searchClient.toLowerCase();
    return (c.name || '').toLowerCase().includes(q) || (c.phone || '').includes(q);
  });

  const clientVehicles = selectedClient ? vehicles.filter(v => v.clientId === selectedClient.id) : [];

  const handleNextStep1 = () => {
    if (clientMode === 'search' && !selectedClient) return;
    if (clientMode === 'new' && (!newClient.name || !newClient.phone || !newClient.login || !newClient.password)) return;
    if (clientVehicles.length === 0 && clientMode !== 'new') {
        setVehicleMode('new');
    } else if (clientMode === 'new') {
        setVehicleMode('new');
    }
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (vehicleMode === 'select' && !selectedVehicle) return;
    if (vehicleMode === 'new' && (!newVehicle.model || !newVehicle.plate)) return;
    setStep(3);
  };

  const handleVehiclePhotoChange = async (file?: File) => {
    if (!file) return;
    setErrorMsg('');
    setNewVehiclePhotoFile(file);
    try {
      const preview = await fileToDataUrl(file);
      setNewVehicle(prev => ({ ...prev, photo: preview }));
    } catch (error: any) {
      setErrorMsg(error?.message || 'Nao foi possivel carregar a foto.');
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    setErrorMsg('');
    setIsSaving(true);

    let finalClientId = selectedClient?.id;

    try {
      if (!service.servicesFull.trim()) {
        setErrorMsg('Informe a lista de serviços solicitados.');
        return;
      }

      if (clientMode === 'new') {
        if (!newClient.name.trim() || !newClient.phone.trim() || !newClient.login.trim() || !newClient.password.trim()) {
          setErrorMsg('Preencha nome, telefone, login e senha do novo cliente.');
          return;
        }

        const result = await createClient({
          name: newClient.name.trim(),
          phone: newClient.phone.trim(),
          email: newClient.email.trim(),
          login: newClient.login.trim(),
          password: newClient.password,
          status: 'Ativo',
        } as Omit<Client, 'id'>);

        if (!result.success || !result.client?.id) {
          setErrorMsg(result.error || 'Não foi possível criar o cliente.');
          return;
        }
        finalClientId = result.client.id;
      }

      if (!finalClientId) {
        setErrorMsg('Selecione ou cadastre um cliente antes de criar a OS.');
        return;
      }

      let finalVehicleId = selectedVehicle?.id;

      if (vehicleMode === 'new') {
        if (!newVehicle.model.trim() || !newVehicle.plate.trim()) {
          setErrorMsg('Preencha modelo e placa do veículo.');
          return;
        }

        const photo = newVehiclePhotoFile
          ? await uploadVehiclePhoto(newVehiclePhotoFile, `${newVehicle.plate || newVehicle.model || finalClientId}`)
          : newVehicle.photo.trim();

        const createdVehicle = await createVehicle({
          clientId: finalClientId,
          model: newVehicle.model.trim(),
          plate: newVehicle.plate.toUpperCase().trim(),
          year: newVehicle.year.trim(),
          color: newVehicle.color.trim(),
          photo,
          observations: newVehicle.observations.trim()
        });

        if (!createdVehicle?.id) {
          setErrorMsg('Não foi possível criar o veículo vinculado ao cliente.');
          return;
        }
        finalVehicleId = createdVehicle.id;
      }

      if (!finalVehicleId) {
        setErrorMsg('Selecione ou cadastre um veículo antes de criar a OS.');
        return;
      }

      const createdOrder = await createServiceOrder({
        vehicleId: finalVehicleId,
        clientId: finalClientId,
        status: service.initialStatus,
        deliveryEstimate: service.deliveryEstimate,
        servicesFull: service.servicesFull.trim(),
        observations: service.observations.trim(),
      } as any);

      if (!createdOrder?.id) {
        setErrorMsg('Não foi possível criar a Ordem de Serviço.');
        return;
      }

      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[95vh] shadow-2xl">
        
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-white/5 flex justify-between items-start bg-[#151515] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-brand-red)]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="relative z-10 w-full">
            <div className="flex justify-between items-center mb-6">
               <div>
                 <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                   <ClipboardList className="text-[var(--color-brand-red)]" /> Nova Ordem de Serviço
                 </h2>
                 <p className="text-white/50 text-sm mt-1">Siga os passos para cadastrar tudo corretamente.</p>
               </div>
               <button onClick={onClose} className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-colors">
                 <X size={20} />
               </button>
            </div>
            
            {/* Progress Bar */}
            <div className="flex items-center gap-2 w-full max-w-md">
               <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-[var(--color-brand-red)] shadow-[0_0_10px_var(--color-brand-red)]' : 'bg-white/10'} transition-all`} />
               <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-[var(--color-brand-red)] shadow-[0_0_10px_var(--color-brand-red)]' : 'bg-white/10'} transition-all`} />
               <div className={`h-1.5 flex-1 rounded-full ${step >= 3 ? 'bg-[var(--color-brand-red)] shadow-[0_0_10px_var(--color-brand-red)]' : 'bg-white/10'} transition-all`} />
            </div>
            <div className="flex justify-between max-w-md text-[10px] uppercase font-bold text-white/40 tracking-widest mt-2">
               <span className={step >= 1 ? 'text-[var(--color-brand-red)]' : ''}>1. Cliente</span>
               <span className={step >= 2 ? 'text-[var(--color-brand-red)]' : ''}>2. Veículo</span>
               <span className={step >= 3 ? 'text-[var(--color-brand-red)]' : ''}>3. Ordem</span>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto flex-1 bg-gradient-to-b from-[#1A1A1A] to-[#111]">
          
          {/* STEP 1: CLIENTE */}
          {step === 1 && (
            <div className="space-y-6 max-w-xl mx-auto animate-in slide-in-from-right-4 duration-300">
               
               <div className="flex p-1 bg-black/40 rounded-xl border border-white/5 mx-auto max-w-sm mb-8">
                  <button 
                     onClick={() => setClientMode('search')}
                     className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${clientMode === 'search' ? 'bg-[#222] text-white shadow-sm border border-white/5' : 'text-white/40 hover:text-white'}`}
                  >Buscar Existente</button>
                  <button 
                     onClick={() => setClientMode('new')}
                     className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${clientMode === 'new' ? 'bg-[#222] text-white shadow-sm border border-white/5' : 'text-white/40 hover:text-white'}`}
                  >Novo Cadastro</button>
               </div>

               {clientMode === 'search' ? (
                 <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
                      <input 
                        type="text" 
                        placeholder="Buscar por nome ou telefone..." 
                        value={searchClient}
                        onChange={e => { setSearchClient(e.target.value); setSelectedClient(null); }}
                        className="w-full bg-[#111] border border-white/10 rounded-xl pl-12 pr-4 py-4 focus:border-[var(--color-brand-red)] transition-colors outline-none text-white placeholder-white/20"
                      />
                    </div>

                    <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 scrollbar-thin">
                       {filteredClients.map(c => (
                          <div 
                            key={c.id} 
                            onClick={() => setSelectedClient(c)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-4 ${selectedClient?.id === c.id ? 'bg-[var(--color-brand-red)]/10 border-[var(--color-brand-red)]/50' : 'bg-[#222] border-white/5 hover:border-white/20'}`}
                          >
                             <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${selectedClient?.id === c.id ? 'bg-[var(--color-brand-red)] text-white' : 'bg-black text-white/40'}`}>
                               <User size={20} />
                             </div>
                             <div>
                                <h4 className="font-bold text-white mb-0.5">{c.name}</h4>
                                <p className="text-sm text-white/50">{c.phone}</p>
                             </div>
                             {selectedClient?.id === c.id && <CheckCircle2 className="ml-auto text-[var(--color-brand-red)] w-6 h-6" />}
                          </div>
                       ))}
                       {filteredClients.length === 0 && (
                          <div className="text-center py-8 text-white/40 bg-black/20 rounded-xl border border-white/5 border-dashed">
                             <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                             <p>Nenhum cliente encontrado.</p>
                             <button onClick={() => setClientMode('new')} className="text-[var(--color-brand-red)] font-semibold mt-2 hover:underline">Cadastrar novo</button>
                          </div>
                       )}
                    </div>
                 </div>
               ) : (
                 <div className="space-y-5 bg-[#222] p-6 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3 mb-2">
                       <div className="w-10 h-10 rounded-lg bg-[var(--color-brand-red)]/20 text-[var(--color-brand-red)] flex items-center justify-center">
                          <User size={20} />
                       </div>
                       <h3 className="font-bold text-white text-lg">Dados do Cliente</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Nome Completo</label>
                        <input type="text" value={newClient.name} onChange={e=>setNewClient({...newClient, name: e.target.value})} className="w-full form-input" placeholder="Ex: João da Silva" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Telefone</label>
                        <input type="text" value={newClient.phone} onChange={e=>setNewClient({...newClient, phone: e.target.value})} className="w-full form-input" placeholder="(00) 00000-0000" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">E-mail <span className="lowercase font-normal text-white/30">(opcional)</span></label>
                        <input type="email" value={newClient.email} onChange={e=>setNewClient({...newClient, email: e.target.value})} className="w-full form-input" placeholder="joao@email.com" />
                      </div>
                      <div className="md:col-span-2 pt-4 border-t border-white/5 mt-2 grid grid-cols-2 gap-4">
                         <div className="col-span-2">
                            <p className="text-xs text-[var(--color-brand-red)] font-medium">🔐 Crie também os dados de acesso para o cliente ver pelo App online:</p>
                         </div>
                         <div>
                           <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Login</label>
                           <input type="text" value={newClient.login} onChange={e=>setNewClient({...newClient, login: e.target.value})} className="w-full form-input" placeholder="joao123" />
                         </div>
                         <div>
                           <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Senha</label>
                           <input type="text" value={newClient.password} onChange={e=>setNewClient({...newClient, password: e.target.value})} className="w-full form-input" placeholder="Senha provisória" />
                         </div>
                      </div>
                    </div>
                 </div>
               )}
            </div>
          )}

          {/* STEP 2: VEÍCULO */}
          {step === 2 && (
            <div className="space-y-6 max-w-xl mx-auto animate-in slide-in-from-right-4 duration-300">
               
               <div className="flex items-center gap-3 bg-[var(--color-brand-red)]/5 border border-[var(--color-brand-red)]/20 p-4 rounded-xl mb-6 shadow-inner">
                 <User className="text-[var(--color-brand-red)] w-8 h-8" />
                 <div>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--color-brand-red)] font-bold mb-0.5">Cliente Selecionado</p>
                    <p className="font-bold text-white">{clientMode === 'search' ? selectedClient?.name : newClient.name}</p>
                 </div>
               </div>

               <div className="flex p-1 bg-black/40 rounded-xl border border-white/5 mx-auto max-w-sm mb-8">
                  <button 
                     onClick={() => setVehicleMode('select')}
                     className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${vehicleMode === 'select' ? 'bg-[#222] text-white shadow-sm border border-white/5' : 'text-white/40 hover:text-white'}`}
                  >Veículos do Cliente</button>
                  <button 
                     onClick={() => setVehicleMode('new')}
                     className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${vehicleMode === 'new' ? 'bg-[#222] text-white shadow-sm border border-white/5' : 'text-white/40 hover:text-white'}`}
                  >Novo Veículo</button>
               </div>

               {vehicleMode === 'select' ? (
                 <div className="space-y-3">
                    {clientVehicles.length > 0 ? (
                      clientVehicles.map(v => (
                         <div 
                           key={v.id} 
                           onClick={() => setSelectedVehicle(v)}
                           className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-4 ${selectedVehicle?.id === v.id ? 'bg-[var(--color-brand-red)]/10 border-[var(--color-brand-red)]/50' : 'bg-[#222] border-white/5 hover:border-white/20'}`}
                         >
                            <div className="w-16 h-16 rounded-lg bg-[#111] overflow-hidden shrink-0 border border-white/5">
                              {v.photo ? <img src={v.photo} alt={v.model} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/20"><Car size={24}/></div>}
                            </div>
                            <div className="flex-1">
                               <h4 className="font-bold text-white text-lg leading-tight mb-1">{v.model}</h4>
                               <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-mono tracking-widest uppercase bg-black/40 px-2 py-0.5 rounded text-white/60 border border-white/5">{v.plate}</span>
                                  <span className="text-xs text-white/40">{v.color}</span>
                               </div>
                            </div>
                            {selectedVehicle?.id === v.id && <CheckCircle2 className="ml-auto text-[var(--color-brand-red)] w-6 h-6 shrink-0" />}
                         </div>
                      ))
                    ) : (
                      <div className="text-center py-12 bg-[#222] rounded-2xl border border-white/5">
                         <Car className="w-12 h-12 text-white/10 mx-auto mb-3" />
                         <p className="text-white/50 mb-4 px-4">Este cliente ainda não possui veículos cadastrados ou você está cadastrando um cliente novo.</p>
                         <button onClick={() => setVehicleMode('new')} className="btn-primary py-2 px-6 rounded-lg text-sm shadow-md">Cadastrar Primeiro Veículo</button>
                      </div>
                    )}
                 </div>
               ) : (
                 <div className="space-y-5 bg-[#222] p-6 rounded-2xl border border-white/5 shadow-xl">
                    <div className="flex items-center gap-3 mb-2">
                       <div className="w-10 h-10 rounded-lg bg-[var(--color-brand-red)]/20 text-[var(--color-brand-red)] flex items-center justify-center">
                          <Car size={20} />
                       </div>
                       <h3 className="font-bold text-white text-lg">Detalhes do Veículo</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Modelo</label>
                        <input type="text" value={newVehicle.model} onChange={e=>setNewVehicle({...newVehicle, model: e.target.value})} className="w-full form-input" placeholder="Ex: BMW 320i M Sport" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Placa</label>
                        <input type="text" value={newVehicle.plate} onChange={e=>setNewVehicle({...newVehicle, plate: e.target.value.toUpperCase()})} className="w-full form-input uppercase font-mono" placeholder="ABC-1234" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Ano</label>
                        <input type="text" value={newVehicle.year} onChange={e=>setNewVehicle({...newVehicle, year: e.target.value})} className="w-full form-input" placeholder="2023" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Cor</label>
                        <input type="text" value={newVehicle.color} onChange={e=>setNewVehicle({...newVehicle, color: e.target.value})} className="w-full form-input" placeholder="Preto" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Foto <span className="lowercase font-normal text-white/30">(opcional)</span></label>
                        <label className="w-full min-h-[50px] bg-[#151515] border border-dashed border-white/10 rounded-xl flex items-center justify-center gap-2 text-white/50 hover:text-white hover:border-[var(--color-brand-red)]/50 cursor-pointer transition-colors px-3">
                          <UploadCloud size={18} />
                          <span className="text-xs font-bold uppercase tracking-widest truncate">{newVehiclePhotoFile ? newVehiclePhotoFile.name : 'Selecionar foto'}</span>
                          <input type="file" accept="image/*" className="hidden" onChange={e => handleVehiclePhotoChange(e.target.files?.[0])} />
                        </label>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Observações / Detalhes (Opcional)</label>
                        <textarea value={newVehicle.observations} onChange={e=>setNewVehicle({...newVehicle, observations: e.target.value})} className="w-full form-input resize-none" rows={2} placeholder="Ex: Roda dianteira ralada, arranhão porta traseira..." />
                      </div>
                      {newVehicle.photo && (
                         <div className="md:col-span-2 mt-2 h-32 rounded-xl overflow-hidden border border-white/10">
                            <img src={newVehicle.photo} className="w-full h-full object-cover" alt="Preview"/>
                         </div>
                      )}
                    </div>
                 </div>
               )}
            </div>
          )}

          {/* STEP 3: ORDEM DE SERVIÇO */}
          {step === 3 && (
            <div className="space-y-6 max-w-2xl mx-auto animate-in slide-in-from-right-4 duration-300">
               
               <div className="flex flex-col md:flex-row gap-4 mb-6">
                 <div className="flex-1 bg-[#222] border border-white/5 rounded-xl p-4 flex items-center gap-3">
                    <User className="text-white/40 w-6 h-6" />
                    <div className="overflow-hidden">
                      <p className="text-[10px] uppercase text-white/40 font-bold mb-0.5">Proprietário</p>
                      <p className="font-bold text-sm truncate">{clientMode === 'search' ? selectedClient?.name : newClient.name}</p>
                    </div>
                 </div>
                 <div className="flex-1 bg-[#222] border border-[var(--color-brand-red)]/20 rounded-xl p-4 flex items-center gap-3 shadow-inner">
                    <Car className="text-[var(--color-brand-red)] w-6 h-6" />
                    <div className="overflow-hidden">
                      <p className="text-[10px] uppercase text-[var(--color-brand-red)] font-bold mb-0.5">Veículo Alvo</p>
                      <p className="font-bold text-sm truncate">{vehicleMode === 'select' ? selectedVehicle?.model : newVehicle.model}</p>
                    </div>
                 </div>
               </div>

               <div className="bg-[#222] rounded-2xl p-6 border border-white/5 shadow-xl">
                 <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                    <div className="w-12 h-12 rounded-xl bg-[var(--color-brand-red)]/20 text-[var(--color-brand-red)] flex items-center justify-center">
                       <History size={24} />
                    </div>
                    <div>
                       <h3 className="font-bold text-white text-xl">Escopo do Serviço</h3>
                       <p className="text-sm text-white/50">Detalhe o que deve ser feito e o prazo acordado.</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Info size={14}/> Lista de Serviços Solicitados
                      </label>
                      <textarea 
                        value={service.servicesFull} 
                        onChange={e=>setService({...service, servicesFull: e.target.value})}
                        className="w-full bg-[#151515] border border-white/10 rounded-xl p-4 text-white focus:border-[var(--color-brand-red)] outline-none resize-none h-32" 
                        placeholder="Ex: Troca de óleo, alinhamento, balanceamento, pintura do para-choque dianteiro..."
                      />
                   </div>

                   <div>
                      <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <History size={14}/> Status Inicial
                      </label>
                      <div className="relative">
                        <select 
                          value={service.initialStatus} 
                          onChange={e=>setService({...service, initialStatus: e.target.value as any})}
                          className="w-full bg-[#151515] border border-white/10 rounded-xl p-4 text-white focus:border-[var(--color-brand-red)] outline-none appearance-none"
                        >
                          <option value="Recebido">📥 Recebido (Pátio)</option>
                          <option value="Em análise">🔍 Em Análise (Orçamento)</option>
                          <option value="Em reparo">🔧 Em Reparo</option>
                        </select>
                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 rotate-90 pointer-events-none" />
                      </div>
                   </div>

                   <div>
                      <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Calendar size={14}/> Previsão de Entrega
                      </label>
                      <input 
                        type="date" 
                        value={service.deliveryEstimate} 
                        onChange={e=>setService({...service, deliveryEstimate: e.target.value})}
                        className="w-full bg-[#151515] border border-white/10 rounded-xl p-4 text-white focus:border-[var(--color-brand-red)] outline-none [color-scheme:dark]"
                      />
                   </div>

                   <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Observações Adicionais <span className="lowercase font-normal text-white/30">(opcional)</span></label>
                      <textarea 
                        value={service.observations} 
                        onChange={e=>setService({...service, observations: e.target.value})}
                        className="w-full bg-[#151515] border border-white/10 rounded-xl p-4 text-white focus:border-[var(--color-brand-red)] outline-none resize-none h-20" 
                        placeholder="Cliente pediu para ter cuidado com o banco rasgado..."
                      />
                   </div>
                 </div>
               </div>

            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 md:p-6 border-t border-white/5 flex flex-col gap-3 bg-[#151515] z-10 relative">
          {errorMsg && (
            <div className="w-full bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl px-4 py-3 text-sm font-medium">
              {errorMsg}
            </div>
          )}
          <div className="flex gap-3 justify-between items-center">
          <button 
            type="button"
            onClick={() => step > 1 ? setStep(s => (s - 1) as any) : onClose()} 
            disabled={isSaving}
            className="px-6 py-3 rounded-xl font-medium border border-white/10 bg-[#222] hover:bg-white/10 transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {step > 1 ? 'Voltar' : 'Cancelar'}
          </button>
          
          {step === 1 && (
            <button 
              onClick={handleNextStep1} 
              disabled={clientMode === 'search' ? !selectedClient : (!newClient.name || !newClient.phone || !newClient.login || !newClient.password)}
              className="btn-primary py-3 px-8 rounded-xl flex items-center gap-2 font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[var(--color-brand-red)]/20"
            >
              Avançar <ChevronRight size={18} />
            </button>
          )}

          {step === 2 && (
            <button 
              onClick={handleNextStep2} 
              disabled={vehicleMode === 'select' ? !selectedVehicle : (!newVehicle.model || !newVehicle.plate)}
              className="btn-primary py-3 px-8 rounded-xl flex items-center gap-2 font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[var(--color-brand-red)]/20"
            >
              Avançar <ChevronRight size={18} />
            </button>
          )}

          {step === 3 && (
            <button 
              onClick={handleSave} 
              disabled={!service.servicesFull || isSaving}
              className="bg-green-600 hover:bg-green-700 text-white py-3 px-8 rounded-xl flex items-center gap-2 font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-green-600/20"
            >
              {isSaving ? 'Criando...' : 'Confirmar e Criar'} <CheckCircle2 size={18} />
            </button>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
