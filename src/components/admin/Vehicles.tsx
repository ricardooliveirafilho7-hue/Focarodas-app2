import React, { useState } from 'react';
import { useAppStore } from '../../lib/store';
import { Search, User as UserIcon, Calendar, Car, Plus, X, Image as ImageIcon, UploadCloud } from 'lucide-react';
import { Vehicle } from '../../types';
import { fileToDataUrl, uploadVehiclePhoto } from '../../lib/imageUpload';

export default function Vehicles() {
  const { vehicles, clients, getClientById, createVehicle, updateVehicle } = useAppStore();
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const [formData, setFormData] = useState({
    clientId: '',
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

  const filtered = vehicles.filter(v => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (v.model || '').toLowerCase().includes(q) || (v.plate || '').toLowerCase().includes(q);
  });

  const openNewModal = () => {
    setEditingVehicle(null);
    setPhotoFile(null);
    setErrorMsg('');
    setFormData({
      clientId: clients.length > 0 ? clients[0].id : '',
      model: '',
      plate: '',
      year: '',
      color: '',
      photo: '',
      observations: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (v: Vehicle) => {
    setEditingVehicle(v);
    setPhotoFile(null);
    setErrorMsg('');
    setFormData({
      clientId: v.clientId,
      model: v.model,
      plate: v.plate,
      year: v.year || '',
      color: v.color,
      photo: v.photo,
      observations: v.observations || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!formData.clientId) {
        alert('Por favor, selecione um cliente.');
        return;
    }

    setIsSaving(true);
    try {
      const photo = photoFile
        ? await uploadVehiclePhoto(photoFile, `${formData.plate || formData.model || formData.clientId}`)
        : formData.photo;
      const payload = { ...formData, photo };

      if (editingVehicle) {
        await updateVehicle(editingVehicle.id, payload);
      } else {
        await createVehicle(payload);
      }
      setIsModalOpen(false);
    } catch (error: any) {
      setErrorMsg(error?.message || 'Erro ao salvar a foto do veiculo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoChange = async (file?: File) => {
    if (!file) return;
    setErrorMsg('');
    setPhotoFile(file);
    try {
      const preview = await fileToDataUrl(file);
      setFormData(prev => ({ ...prev, photo: preview }));
    } catch (error: any) {
      setErrorMsg(error?.message || 'Nao foi possivel carregar a foto.');
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            Frota e Veículos
          </h1>
          <p className="text-white/50 text-sm mt-1">Gerencie os veículos cadastrados de todos os clientes.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Buscar veículo, placa..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[var(--color-brand-red)]/50 focus:bg-[#222] transition-colors"
            />
          </div>
          <button 
            onClick={openNewModal}
            className="h-[42px] px-4 rounded-xl font-medium transition-colors shrink-0 bg-[var(--color-brand-red)] hover:bg-[var(--color-brand-red-dark)] text-white flex items-center gap-2"
          >
             <Plus size={16} /> <span className="hidden sm:inline">Novo Veículo</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
        {filtered.map(v => {
          const client = getClientById(v.clientId);
          
          return (
            <div 
              key={v.id} 
              onClick={() => openEditModal(v)}
              className="bg-[#1A1A1A] border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-all cursor-pointer group flex flex-col"
            >
              <div className="h-40 bg-[#111] relative overflow-hidden shrink-0">
                {v.photo ? (
                    <img src={v.photo} alt={v.model} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Car size={32} className="text-white/10" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] to-transparent border-b border-white/5" />
                <span className="absolute bottom-3 left-4 text-xs font-mono px-2 py-0.5 rounded bg-black/60 text-white border border-white/10">
                   {v.plate}
                </span>
              </div>
              
              <div className="p-4 flex-1 flex flex-col">
                 <h3 className="font-bold text-lg leading-tight mb-1">{v.model}</h3>
                 <div className="flex items-center gap-2 text-white/50 text-sm mb-4">
                    <span>{v.year || '-'}</span>
                    <span>•</span>
                    <span>{v.color}</span>
                 </div>
                 
                 <div className="mt-auto pt-4 border-t border-white/5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center text-[10px] text-white/40 uppercase">
                       <UserIcon size={14} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                       <p className="text-xs text-white/40 uppercase">Cliente</p>
                       <p className="text-sm text-white/80 truncate">{client?.name || 'Cliente Removido'}</p>
                    </div>
                 </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-[#1A1A1A]/50 border border-dashed border-white/10 rounded-3xl mt-4">
             <Car className="w-12 h-12 text-white/20 mb-4" />
             <h3 className="text-xl font-bold text-white mb-2">Nenhum veículo encontrado</h3>
             <p className="text-white/40 mb-6 max-w-sm">Comece a cadastrar os veículos dos seus clientes.</p>
             <button 
                onClick={openNewModal}
                className="bg-[var(--color-brand-red)] text-white px-6 py-2.5 rounded-xl font-medium hover:bg-red-700 transition shadow-lg"
             >
                Cadastrar Veículo
             </button>
          </div>
       )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 md:p-6 border-b border-white/5 flex justify-between items-center bg-[#151515]">
              <h2 className="text-xl font-bold">{editingVehicle ? 'Editar Veículo' : 'Novo Veículo'}</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 text-white/40 hover:text-white rounded-full bg-white/5"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-4 md:p-6 space-y-4 overflow-y-auto flex-1">
              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-3 rounded-xl text-sm font-medium">
                  {errorMsg}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-white/40 uppercase mb-2">Cliente Proprietário</label>
                <select 
                    required 
                    value={formData.clientId} 
                    onChange={e => setFormData({...formData, clientId: e.target.value})} 
                    className="w-full form-input"
                >
                    <option value="" disabled>Selecione um cliente</option>
                    {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <label className="block text-xs font-semibold text-white/40 uppercase mb-2">Modelo</label>
                    <input type="text" required value={formData.model} onChange={e=>setFormData({...formData, model: e.target.value})} className="w-full form-input" placeholder="Ex: BMW 320i M Sport" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-white/40 uppercase mb-2">Placa</label>
                    <input type="text" required value={formData.plate} onChange={e=>setFormData({...formData, plate: e.target.value.toUpperCase()})} className="w-full form-input uppercase" placeholder="ABC-1234" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-white/40 uppercase mb-2">Ano</label>
                    <input type="text" value={formData.year} onChange={e=>setFormData({...formData, year: e.target.value})} className="w-full form-input" placeholder="2023" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-white/40 uppercase mb-2">Cor</label>
                    <input type="text" required value={formData.color} onChange={e=>setFormData({...formData, color: e.target.value})} className="w-full form-input" placeholder="Branco" />
                </div>
                <div className="col-span-2">
                    <label className="block text-xs font-semibold text-white/40 uppercase mb-2">Foto do Veiculo</label>
                    <label className="w-full min-h-32 bg-[#111] border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 text-white/50 hover:text-white hover:border-[var(--color-brand-red)]/50 cursor-pointer transition-colors overflow-hidden">
                      {formData.photo ? (
                        <img src={formData.photo} className="w-full h-36 object-cover" alt="Preview do veiculo" />
                      ) : (
                        <>
                          <UploadCloud size={24} />
                          <span className="text-xs font-bold uppercase tracking-widest">Selecionar foto</span>
                        </>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={e => handlePhotoChange(e.target.files?.[0])} />
                    </label>
                </div>
                <div className="col-span-2">
                    <label className="block text-xs font-semibold text-white/40 uppercase mb-2">Observações Internas</label>
                    <textarea value={formData.observations} onChange={e=>setFormData({...formData, observations: e.target.value})} className="w-full form-input resize-none" placeholder="Opcional..." />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 mt-6 border-t border-white/5">
                <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSaving} className="px-5 py-2.5 rounded-xl font-medium text-white/60 hover:text-white hover:bg-white/5 disabled:opacity-50">Cancelar</button>
                <button type="submit" disabled={isSaving} className="btn-primary py-2.5 px-6 rounded-xl text-white disabled:opacity-50">{isSaving ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
