import React, { useState } from 'react';
import { Store, ListFilter, MessageSquareText, Bell, MonitorSmartphone, Image as ImageIcon, Save, Check } from 'lucide-react';
import { ConfirmModal } from '../ConfirmModal';

interface CompanyData {
  companyName?: string;
  document?: string;
  phone?: string;
  address?: string;
}

const readCompanySettings = (): CompanyData => {
  try {
    return JSON.parse(localStorage.getItem('foca_settings') || '{}') as CompanyData;
  } catch {
    return {};
  }
};

export default function Settings() {
  const [activeTab, setActiveTab] = useState('empresa');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [companyData, setCompanyData] = useState<CompanyData>(() => readCompanySettings());

  const tabs = [
    { id: 'empresa', label: 'Dados da Empresa', icon: Store },
    { id: 'status', label: 'Status Personalizados', icon: ListFilter },
    { id: 'mensagens', label: 'Mensagens Automáticas', icon: MessageSquareText },
    { id: 'notificacoes', label: 'Notificações', icon: Bell },
    { id: 'portal', label: 'Portal do Cliente', icon: MonitorSmartphone },
  ];

  const handleSave = () => {
    setIsSaving(true);
    try {
      localStorage.setItem('foca_settings', JSON.stringify(companyData));
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setShowDiscardConfirm(true);
  };

  const updateCompanyData = (field: keyof CompanyData, value: string) => {
    setCompanyData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-4 md:p-8 flex flex-col lg:flex-row gap-6 h-[calc(100vh-4rem)]">
      {showDiscardConfirm && (
        <ConfirmModal
          title="Descartar alterações?"
          message="Os campos serão recarregados a partir dos dados salvos neste navegador."
          confirmLabel="Descartar"
          onCancel={() => setShowDiscardConfirm(false)}
          onConfirm={() => {
            setCompanyData(readCompanySettings());
            setShowDiscardConfirm(false);
          }}
        />
      )}
      {/* Settings Nav */}
      <div className="lg:w-64 shrink-0 flex flex-col gap-2">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent mb-4">
          Configurações
        </h2>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-medium text-sm border
                ${isActive 
                  ? 'bg-[#1C1C1F] text-[#E53935] border-white/5 shadow-lg shadow-black/50' 
                  : 'bg-transparent text-white/40 border-transparent hover:bg-[#1A1A1A]/50 hover:text-white/80'}
              `}
            >
              <Icon size={18} className={isActive ? 'text-[#E53935]' : 'text-white/40'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Settings Content */}
      <div className="flex-1 bg-[#0A0A0A] rounded-3xl border border-white/5 flex flex-col overflow-hidden shadow-2xl relative">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#E53935]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
         
         <div className="p-6 md:p-10 overflow-y-auto flex-1 hide-scrollbar relative z-10">
           {activeTab === 'empresa' && (
             <div className="space-y-8 max-w-2xl animate-in fade-in duration-300">
               <div>
                 <h3 className="text-2xl font-black mb-1 text-white tracking-tight">Informações da Oficina</h3>
                 <p className="text-white/40 text-sm font-medium">Esses dados aparecerão em orçamentos e recibos para os clientes.</p>
               </div>

               <div className="flex items-center gap-6 bg-[#151515] p-5 rounded-2xl border border-white/5">
                 <div className="w-24 h-24 bg-[#111] border border-white/10 rounded-2xl flex flex-col items-center justify-center text-white/30 cursor-pointer hover:border-[#E53935]/50 transition-colors shadow-inner">
                   <ImageIcon size={28} className="mb-2" />
                   <span className="text-[10px] uppercase font-bold tracking-widest text-[#E53935]">Logo</span>
                 </div>
                 <div>
                   <p className="font-bold mb-1 text-white text-lg tracking-tight">Identidade Visual</p>
                   <p className="text-xs text-white/40 mb-4 font-medium leading-relaxed">Recomendado: 512x512px.<br/>Formatos aceitos: JPG, PNG, SVG transparente.</p>
                   <div className="flex gap-3">
                     <button className="px-5 py-2 rounded-xl border border-white/10 bg-[#222] hover:bg-white hover:text-black text-sm font-bold tracking-wide transition-all shadow-lg hover:shadow-white/20">Fazer Upload</button>
                     <button className="px-5 py-2 rounded-xl text-red-500 hover:bg-red-500/10 text-sm font-bold tracking-wide transition-colors">Remover</button>
                   </div>
                 </div>
               </div>

               <div className="space-y-6">
                 <div>
                   <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 ml-1">Nome Fantasia</label>
                   <input type="text" value={companyData.companyName || ''} onChange={e => updateCompanyData('companyName', e.target.value)} className="w-full form-input bg-[#111] text-lg font-bold placeholder:text-white/20" placeholder="Foca Rodas High Performance" />
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                     <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 ml-1">CNPJ / CPF</label>
                     <input type="text" value={companyData.document || ''} onChange={e => updateCompanyData('document', e.target.value)} className="w-full form-input bg-[#111] font-mono tracking-wider" placeholder="00.000.000/0001-00" />
                   </div>
                   <div>
                     <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 ml-1">Telefone / WhatsApp</label>
                     <input type="text" value={companyData.phone || ''} onChange={e => updateCompanyData('phone', e.target.value)} className="w-full form-input bg-[#111] font-mono tracking-wider" placeholder="(11) 99999-9999" />
                   </div>
                 </div>

                 <div>
                   <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 ml-1">Endereço Completo</label>
                   <input type="text" value={companyData.address || ''} onChange={e => updateCompanyData('address', e.target.value)} className="w-full form-input bg-[#111]" placeholder="Av. das Nações Unidas, 12345 - Galpão 4, São Paulo - SP" />
                 </div>
                 
                 <div className="border-t border-white/5 pt-8 mt-4">
                   <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Store size={16} className="text-[#E53935]" /> Preferências Regionais</h4>
                   <div className="flex flex-col sm:flex-row gap-6 bg-[#151515] p-5 rounded-2xl border border-white/5">
                     <label className="flex items-center gap-3 text-sm cursor-pointer group">
                        <div className="w-5 h-5 rounded-full border-2 border-[#E53935] flex items-center justify-center relative">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#E53935]" />
                        </div>
                        <span className="font-bold text-white group-hover:text-[#E53935] transition-colors">BRL (R$)</span>
                     </label>
                     <label className="flex items-center gap-3 text-sm cursor-pointer group">
                        <div className="w-5 h-5 rounded-full border-2 border-[#E53935] flex items-center justify-center relative">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#E53935]" />
                        </div>
                        <span className="font-bold text-white group-hover:text-[#E53935] transition-colors">Fuso: Brasília (BRT)</span>
                     </label>
                   </div>
                 </div>
               </div>
             </div>
           )}

           {activeTab !== 'empresa' && (
             <div className="h-full flex flex-col items-center justify-center text-white/30 animate-in fade-in duration-300">
               <div className="w-24 h-24 bg-[#151515] rounded-full flex items-center justify-center mb-6 shadow-inner border border-white/5">
                 <Store size={40} className="text-white/10" />
               </div>
               <h3 className="text-2xl font-black text-white/50 mb-2">Módulo em Breve</h3>
               <p className="text-sm font-medium">Configurações de {tabs.find(t=>t.id===activeTab)?.label} em desenvolvimento.</p>
             </div>
           )}
         </div>

         <div className="bg-[#111] p-6 border-t border-white/5 flex flex-col-reverse sm:flex-row justify-end gap-4 shrink-0 relative z-10">
            <button 
              onClick={handleCancel}
              className="px-6 py-3 rounded-xl font-bold tracking-wide text-white/60 bg-[#1A1A1A] hover:bg-[#222] hover:text-white transition-all w-full sm:w-auto"
            >
              Descartar
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className={`btn-primary py-3 px-8 rounded-xl font-bold tracking-wide flex items-center justify-center gap-2 transition-all w-full sm:w-auto ${showSuccess ? 'bg-green-500 hover:bg-green-600 shadow-green-500/20' : 'shadow-[var(--color-brand-red)]/20 shadow-lg'}`}
            >
              {isSaving ? (
                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : showSuccess ? (
                 <><Check size={18} /> Salvo com sucesso!</>
              ) : (
                 <><Save size={18} /> Salvar Alterações</>
              )}
            </button>
         </div>
      </div>
    </div>
  );
}
