import React, { useState } from 'react';
import { useAppStore } from '../../lib/store';
import { Mail, Shield, UserX, KeyRound, Search, CheckCircle2, UserSquare2, Users, Plus, UserCheck, X, Crown, Save } from 'lucide-react';
import { Employee, EmployeeRole } from '../../types';

function EmployeeModal({ employee, onClose, onSave }: { employee?: Employee | null, onClose: () => void, onSave: (e: any) => Promise<{success: boolean, error?: string}> }) {
  const [formData, setFormData] = useState({
    name: employee?.name || '',
    email: employee?.email || '',
    login: employee?.login || '',
    password: employee?.password || '',
    role: employee?.role || 'Técnico',
    active: employee?.active ?? true,
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
        setErrorMsg(res.error || 'Ocorreu um erro ao salvar o funcionário.');
      }
    } catch (err) {
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
            <h2 className="text-2xl font-black tracking-tight text-white">{employee ? 'Editar Funcionário' : 'Novo Funcionário'}</h2>
            <p className="text-white/40 text-sm mt-1 font-medium">{employee ? 'Modifique os acessos e permissões do membro da equipe.' : 'Cadastre um novo membro e defina seus acessos.'}</p>
          </div>
          <button onClick={onClose} className="p-2 text-white/40 hover:text-white rounded-full bg-white/5 border border-white/10 transition-colors shadow-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 overflow-y-auto flex-1 space-y-6 bg-gradient-to-b from-[#151515] to-[#111] relative z-10">
          
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 error-msg-present">
              <UserX className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{errorMsg}</p>
            </div>
          )}

          <div className="bg-[#1C1C1F] p-6 rounded-2xl border border-white/5 space-y-5 shadow-inner">
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-widest text-[#E53935] mb-2 ml-1">Identificação Pessoal</label>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 ml-1">Nome Completo</label>
              <input type="text" required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full form-input bg-[#111] font-bold" placeholder="Ex: João Silva" />
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 ml-1">E-mail <span className="lowercase font-normal text-white/30">(opcional)</span></label>
              <input type="email" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full form-input bg-[#111]" placeholder="joao.silva@oficina.com.br" />
            </div>
          </div>

          <div className="bg-[#1C1C1F] p-6 rounded-2xl border border-white/5 space-y-5 shadow-inner">
             <div>
               <label className="block text-[10px] uppercase font-bold tracking-widest text-blue-500 mb-2 ml-1 flex items-center gap-1.5"><KeyRound size={12}/> Credenciais de Acesso</label>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
               <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 ml-1">Usuário de Login</label>
                  <input type="text" required value={formData.login} onChange={e=>setFormData({...formData, login: e.target.value})} className="w-full form-input bg-[#111] font-mono" placeholder="joao_sil" />
               </div>

               <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 ml-1">Senha Segura</label>
                  <input type="text" required={!employee} value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})} className="w-full form-input bg-[#111] font-mono" placeholder={employee ? 'Preencha apenas se quiser trocar' : 'Senha Forte'} />
               </div>
             </div>
          </div>

          <div className="bg-[#1C1C1F] p-6 rounded-2xl border border-white/5 space-y-5 shadow-inner">
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-widest text-yellow-500 mb-2 ml-1 flex items-center gap-1.5"><Shield size={12}/> Configurações de Permissão</label>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 ml-1">Cargo / Função</label>
              <select value={formData.role} onChange={e=>setFormData({...formData, role: e.target.value as EmployeeRole})} className="w-full form-input bg-[#111] font-bold text-white">
                <option value="Administrador" className="bg-[#222]">👑 Administrador (Acesso Total)</option>
                <option value="Gerente" className="bg-[#222]">👔 Gerente (Dashboard e Relatórios)</option>
                <option value="Atendente" className="bg-[#222]">💬 Atendente (Apenas OS e Clientes)</option>
                <option value="Técnico" className="bg-[#222]">🔧 Técnico (Apenas Visualização e Atualização de Próprias OS)</option>
              </select>
            </div>
            
            <div className="pt-2">
              <label className="flex items-center gap-3 p-4 bg-[#111] border border-white/5 rounded-xl cursor-pointer group">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors ${formData.active ? 'bg-[#E53935] border-[#E53935]' : 'bg-[#222] border-white/20'}`}>
                  {formData.active && <CheckCircle2 size={16} className="text-white" />}
                </div>
                <input 
                  type="checkbox" 
                  checked={formData.active}
                  onChange={e => setFormData({...formData, active: e.target.checked})}
                  className="hidden"
                />
                <div>
                   <p className="text-sm font-bold text-white">Conta Ativa</p>
                   <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mt-0.5">Membro pode logar no painel</p>
                </div>
              </label>
            </div>
          </div>

          <div className="pt-4 flex flex-col-reverse sm:flex-row justify-end gap-3 z-10 relative">
            <button type="button" onClick={onClose} disabled={loading} className="px-6 py-3 rounded-xl font-bold tracking-wide border border-white/10 bg-[#1C1C1F] hover:bg-[#222] transition-colors text-white/60 hover:text-white w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-primary py-3 px-8 rounded-xl font-bold tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-[#E53935]/20 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed">
              <Save size={18} /> {loading ? 'Salvando...' : 'Salvar Funcionário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Team() {
  const { employees, createEmployee, updateEmployee } = useAppStore();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalEmployee, setModalEmployee] = useState<Employee | null>(null);

  const filtered = employees.filter(e => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (e.name || '').toLowerCase().includes(q) || (e.role || '').toLowerCase().includes(q) || (e.email || '').toLowerCase().includes(q) || (e.login && e.login.toLowerCase().includes(q));
  });

  const stats = [
    { label: 'Total Equipe', value: employees.length, icon: Users, color: 'text-white/60' },
    { label: 'Ativos', value: employees.filter(e => e.active).length, icon: CheckCircle2, color: 'text-blue-500' },
    { label: 'Técnicos', value: employees.filter(e => e.role === 'Técnico').length, icon: Shield, color: 'text-[#E53935]' },
    { label: 'Gerentes', value: employees.filter(e => e.role === 'Gerente').length, icon: Crown, color: 'text-yellow-500' },
  ];

  const handleSaveEmployee = async (data: any) => {
    let res;
    if (modalEmployee) {
      const success = await updateEmployee(modalEmployee.id, data);
      res = success ? { success: true } : { success: false, error: 'Erro ao atualizar funcionário. Verifique os dados e a conexão.' };
    } else {
      const result = await createEmployee(data) as any;
      if (result && result.success === false) {
          res = result; // preserve error message
      } else {
          res = { success: true };
      }
    }
    
    if (res.success) {
      setIsModalOpen(false);
    }
    return res;
  };

  const handleToggleStatus = async (emp: Employee) => {
    if (emp.id === 'admin1') return; // Cannot block system admin
    await updateEmployee(emp.id, { active: !emp.active });
  };

  return (
    <div className="p-4 md:p-8">
       {isModalOpen && (
         <EmployeeModal 
           employee={modalEmployee}
           onClose={() => setIsModalOpen(false)}
           onSave={handleSaveEmployee}
         />
       )}

       <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
             Equipe <Users className="w-8 h-8 text-[#E53935] drop-shadow-[0_0_10px_rgba(229,57,53,0.3)]" />
          </h1>
          <p className="text-white/50 text-sm mt-1 font-medium">Controle de acesso, funções e credenciais de funcionários.</p>
        </div>
        <button 
          onClick={() => { setModalEmployee(null); setIsModalOpen(true); }}
          className="btn-primary py-3 px-8 rounded-xl font-bold tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-[#E53935]/20"
        >
            <Plus size={18} /> Novo Funcionário
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-[#1C1C1F] p-5 rounded-3xl border border-white/5 shadow-inner hover:border-white/10 transition-colors relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
              <div className="flex justify-between items-start mb-2 relative z-10">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{stat.label}</p>
                <Icon size={16} className={stat.color} />
              </div>
              <h3 className="text-4xl font-black tracking-tight text-white relative z-10">{stat.value}</h3>
            </div>
          );
        })}
      </div>

      <div className="bg-[#1C1C1F] border border-white/5 rounded-3xl p-6 relative overflow-hidden min-h-[400px] shadow-lg">
         <div className="mb-8 relative group">
             <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5 group-focus-within:text-[#E53935] transition-colors" />
             <input 
               type="text" 
               placeholder="Buscar por nome, login ou cargo..." 
               value={search}
               onChange={e => setSearch(e.target.value)}
               className="w-full bg-[#111] border border-white/5 rounded-full pl-14 pr-6 py-4 focus:outline-none focus:border-[#E53935]/50 focus:bg-[#151515] transition-colors text-white placeholder:text-white/20 shadow-inner"
             />
         </div>

         <div className="space-y-4">
           {employees.length <= 1 && search === '' ? (
             <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-white/5 rounded-3xl bg-[#151515] mt-4">
                 <div className="w-20 h-20 bg-[#111] rounded-full flex items-center justify-center mb-6 shadow-inner border border-white/5">
                    <Users className="w-10 h-10 text-[#E53935] drop-shadow-[0_0_10px_rgba(229,57,53,0.5)]" />
                 </div>
                 <h3 className="text-2xl font-black tracking-tight text-white mb-2">Nenhum funcionário cadastrado</h3>
                 <p className="text-white/40 font-medium mb-8 max-w-md mx-auto">Crie o primeiro funcionário para liberar acesso ao painel operacional e distribuir as tarefas.</p>
                 <button 
                     onClick={() => { setModalEmployee(null); setIsModalOpen(true); }}
                     className="btn-primary py-3 px-8 rounded-xl font-bold tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-[#E53935]/20"
                 >
                     <Plus size={18} /> Criar Primeiro Membro
                 </button>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
               {filtered.map((emp, i) => (
                 <div 
                   key={emp.id} 
                   className="bg-[#111] border border-white/5 p-5 rounded-3xl flex flex-col hover:border-[#E53935]/30 hover:shadow-[0_0_20px_rgba(229,57,53,0.1)] transition-all cursor-pointer group relative overflow-hidden animate-in fade-in slide-in-from-bottom-4"
                   style={{ animationDelay: `${i * 50}ms` }}
                   onClick={() => { setModalEmployee(emp); setIsModalOpen(true); }}
                  >
                    {!emp.active && (
                       <div className="absolute top-0 right-0 bg-[#E53935] text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow-lg">Inativo</div>
                    )}
                    <div className="flex items-center gap-4 mb-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black tracking-tighter text-xl border-2 shrink-0 transition-transform group-hover:scale-105 shadow-inner ${emp.active ? 'bg-gradient-to-br from-[#E53935] to-[#b71c1c] text-white border-white/20' : 'bg-[#151515] text-white/20 border-white/5'}`}>
                        {emp.name.split(' ').map(n=>n[0]).join('').substring(0,2)}
                      </div>
                      <div className="min-w-0 pr-6">
                        <h3 className="font-black text-white text-lg tracking-tight truncate">{emp.name}</h3>
                        <p className="text-xs font-bold text-white/40 uppercase tracking-widest truncate">{emp.role}</p>
                      </div>
                    </div>

                    <div className="bg-[#1C1C1F] rounded-2xl p-4 space-y-3 mb-5 border border-white/5 shadow-inner text-sm">
                       <div className="flex items-center gap-2 text-white/60">
                         <Mail size={14} /> <span className="truncate">{emp.email}</span>
                       </div>
                       <div className="flex items-center gap-2 text-white/60">
                         <UserSquare2 size={14} /> <span className="bg-[#111] border border-white/10 px-2 py-0.5 rounded font-mono text-xs">{emp.login}</span>
                       </div>
                    </div>

                    <div className="mt-auto flex gap-2">
                       {emp.id !== 'admin1' ? (
                          <>
                             <button 
                               onClick={(e) => { e.stopPropagation(); setModalEmployee(emp); setIsModalOpen(true); }}
                               title="Editar Credenciais" 
                               className="flex-1 py-2 rounded-xl bg-[#1C1C1F] border border-white/5 hover:border-blue-500/50 hover:bg-blue-500/10 text-white/60 hover:text-blue-500 font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                             >
                                <KeyRound size={14} /> Senha
                             </button>
                             <button 
                               onClick={(e) => { e.stopPropagation(); handleToggleStatus(emp); }}
                               title={emp.active ? 'Bloquear Acesso' : 'Desbloquear Acesso'} 
                               className={`w-12 rounded-xl border transition-all flex items-center justify-center shadow-inner ${emp.active ? 'bg-[#1C1C1F] border-white/5 hover:border-yellow-500/50 hover:bg-yellow-500/10 text-white/40 hover:text-yellow-500' : 'bg-[#E53935]/10 border-[#E53935]/20 text-[#E53935] hover:bg-green-500/10 hover:text-green-500 hover:border-green-500/20'}`}
                             >
                                {emp.active ? <UserX size={16} /> : <UserCheck size={16} />}
                             </button>
                          </>
                       ) : (
                          <div className="w-full py-2 rounded-xl bg-[#1C1C1F] border border-white/5 text-white/30 font-bold text-xs uppercase tracking-widest text-center flex items-center justify-center gap-2">
                             <Shield size={14} /> Administrador Protegido
                          </div>
                       )}
                    </div>
                 </div>
               ))}
             </div>
           )}
           {filtered.length === 0 && search !== '' && (
              <div className="text-center py-20 text-white/40 font-medium">Nenhum membro da equipe encontrado para: <strong className="text-white">{search}</strong></div>
           )}
         </div>
      </div>
    </div>
  );
}
