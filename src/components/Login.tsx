import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { Car, Lock, User, Shield } from 'lucide-react';

export default function Login() {
  const { loginUser } = useAppStore();
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [panelType, setPanelType] = useState<'cliente' | 'funcionario' | 'admin'>('cliente');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    
    try {
      const res = await loginUser(loginInput, password, panelType);
      if (!res.success) {
        setErrorMsg(res.error || 'Login ou senha inválidos.');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao conectar com o banco.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111] flex items-center justify-center p-4 relative overflow-hidden flex-1 w-full">
      {/* Background decoration */}
      <div className="absolute top-0 w-full h-[500px] bg-gradient-to-b from-[var(--color-brand-red)]/20 to-transparent opacity-50 blur-3xl pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-[var(--color-brand-red)]/20 rounded-full blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute top-40 -left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="w-full max-w-md z-10">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#1A1A1A] to-[#111] border border-white/10 mb-6 shadow-2xl relative">
            <div className="absolute inset-0 rounded-full border border-[var(--color-brand-red)]/30 animate-pulse" />
            <Car size={36} className="text-[var(--color-brand-red)] drop-shadow-[0_0_15px_rgba(229,57,53,0.5)]" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter text-white drop-shadow-[0_4px_20px_rgba(211,47,47,0.25)]">
            FOCA RODAS
          </h1>
          <p className="text-[var(--color-brand-red)] font-medium tracking-wide uppercase text-sm mt-1">Plataforma de Gestão</p>
        </div>

        <div className="bg-[#1A1A1A]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--color-brand-red)] to-transparent opacity-50" />
           
           <div className="flex bg-[#111] rounded-xl p-1 mb-8 border border-white/5">
             <button 
               type="button"
               onClick={() => { setPanelType('cliente'); setErrorMsg(''); }}
               className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${panelType === 'cliente' ? 'bg-[#222] text-white shadow-md' : 'text-white/40 hover:text-white/80'}`}
             >
                <User size={14} /> Cliente
             </button>
             <button 
               type="button"
               onClick={() => { setPanelType('funcionario'); setErrorMsg(''); }}
               className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${panelType === 'funcionario' ? 'bg-[#222] text-white shadow-md' : 'text-white/40 hover:text-white/80'}`}
             >
                <Lock size={14} /> Funcionário
             </button>
             <button 
               type="button"
               onClick={() => { setPanelType('admin'); setErrorMsg(''); }}
               className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${panelType === 'admin' ? 'bg-[#222] text-[var(--color-brand-red)] shadow-md' : 'text-white/40 hover:text-white/80'}`}
             >
                <Shield size={14} /> Admin
             </button>
           </div>

           <form onSubmit={handleLogin} className="space-y-5">
             <div>
               <label className="block text-xs font-semibold text-white/40 uppercase mb-2">Login</label>
               <input 
                 type="text" 
                 value={loginInput} 
                 onChange={e => setLoginInput(e.target.value)} 
                 className="w-full bg-[#111] border border-white/5 focus:border-[var(--color-brand-red)]/50 rounded-xl px-4 py-3 text-white outline-none transition-colors" 
                 placeholder="Digite seu login"
                 required
               />
             </div>
             
             <div>
               <label className="block text-xs font-semibold text-white/40 uppercase mb-2">Senha</label>
               <input 
                 type="password" 
                 value={password} 
                 onChange={e => setPassword(e.target.value)} 
                 className="w-full bg-[#111] border border-white/5 focus:border-[var(--color-brand-red)]/50 rounded-xl px-4 py-3 text-white outline-none transition-colors text-lg tracking-widest font-mono placeholder:tracking-normal placeholder:font-sans" 
                 placeholder="••••••"
                 required
               />
             </div>
             
             {errorMsg && (
               <div className="text-red-500 text-sm bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center gap-2">
                 <Shield size={16} /> {errorMsg}
               </div>
             )}
             
             <button 
               type="submit" 
               disabled={loading}
               className="w-full bg-[var(--color-brand-red)] text-white font-bold p-4 rounded-xl hover:bg-[var(--color-brand-red-dark)] transition-colors shadow-[0_0_15px_rgba(211,47,47,0.3)] mt-2 flex justify-center items-center"
             >
               {loading ? <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Entrar no Sistema'}
             </button>
           </form>

           <div className="mt-6 pt-6 border-t border-white/5 text-center">
             <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-3">Credenciais de Teste</p>
             <div className="flex justify-center gap-4 text-xs text-white/50">
                <div className="bg-[#111] border border-white/5 px-3 py-2 rounded-lg">
                   <p className="mb-1"><span className="text-white/40">Login:</span> focarodas</p>
                   <p><span className="text-white/40">Senha:</span> 123456</p>
                </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
