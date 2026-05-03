import React, { useState } from 'react';
import { useAppStore } from '../../lib/store';
import { Search, Download, Clock, Edit3, Plus, AlertTriangle, Trash2, Shield, CalendarDays } from 'lucide-react';
import { formatDateTime } from '../../lib/dateUtils';

export default function Logs() {
  const { logs } = useAppStore();
  const [search, setSearch] = useState('');

  const filtered = logs.filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    return l.userName.toLowerCase().includes(q) || l.target.toLowerCase().includes(q) || l.action.toLowerCase().includes(q);
  });

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'edit': return <Edit3 size={14} className="text-blue-500" />;
      case 'add': return <Plus size={14} className="text-green-500" />;
      case 'alert': return <AlertTriangle size={14} className="text-yellow-500" />;
      case 'delete': return <Trash2 size={14} className="text-[#E53935]" />;
      default: return <Clock size={14} className="text-white/40" />;
    }
  };

  const getLogBg = (type: string) => {
    switch (type) {
      case 'edit': return 'bg-blue-500/10 border-blue-500/20';
      case 'add': return 'bg-green-500/10 border-green-500/20';
      case 'alert': return 'bg-yellow-500/10 border-yellow-500/20';
      case 'delete': return 'bg-[#E53935]/10 border-[#E53935]/20';
      default: return 'bg-white/5 border-white/10';
    }
  };

  const handleExportPDF = () => {
    const content = filtered.map(log =>
      `[${formatDateTime(log.createdAt)}] ${log.userName} - ${log.action} (${log.target})`
    ).join('\n');

    const blob = new Blob([`FOCA RODAS - Relatorio de Auditoria\nGerado em: ${new Date().toLocaleString('pt-BR')}\n\n${content}`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `focarodas-logs-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            Auditoria <Shield className="w-8 h-8 text-[#E53935] drop-shadow-[0_0_10px_rgba(229,57,53,0.3)]" />
          </h1>
          <p className="text-white/50 text-sm mt-1 font-medium">Histórico imutável de ações no sistema.</p>
        </div>
        <button onClick={handleExportPDF} className="h-[42px] px-6 rounded-xl border border-white/10 bg-[#1C1C1F] hover:bg-white hover:text-black flex items-center justify-center gap-2 text-sm font-bold tracking-wide transition-all shadow-lg text-white/80">
            <Download size={16} /> Exportar Logs
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
         <div className="bg-[#1C1C1F] border border-white/5 rounded-2xl p-2 shadow-inner">
            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1 px-3 pt-2">Período</label>
            <select className="w-full bg-transparent text-sm font-bold focus:outline-none px-3 pb-2 rounded-xl text-white">
              <option value="24h" className="bg-[#222]">Últimas 24 horas</option>
              <option value="7d" className="bg-[#222]">Últimos 7 dias</option>
              <option value="30d" className="bg-[#222]">Últimos 30 dias</option>
            </select>
         </div>
         <div className="bg-[#1C1C1F] border border-white/5 rounded-2xl p-2 shadow-inner">
            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1 px-3 pt-2">Usuário</label>
            <select className="w-full bg-transparent text-sm font-bold focus:outline-none px-3 pb-2 rounded-xl text-white">
              <option value="all" className="bg-[#222]">Todos os usuários</option>
            </select>
         </div>
         <div className="bg-[#1C1C1F] border border-white/5 rounded-2xl p-2 shadow-inner">
            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1 px-3 pt-2">Tipo de Ação</label>
            <select className="w-full bg-transparent text-sm font-bold focus:outline-none px-3 pb-2 rounded-xl text-white">
              <option value="all" className="bg-[#222]">Todas as Ações</option>
              <option value="edit" className="bg-[#222]">Edições de Cadastro</option>
              <option value="add" className="bg-[#222]">Novos Cadastros</option>
              <option value="delete" className="bg-[#222]">Exclusões</option>
            </select>
         </div>
      </div>

      <div className="mb-10 relative group">
         <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5 group-focus-within:text-[#E53935] transition-colors" />
         <input 
           type="text" 
           placeholder="Buscar por usuário, ação, objeto..." 
           value={search}
           onChange={e => setSearch(e.target.value)}
           className="w-full bg-[#1C1C1F] border border-white/5 rounded-full pl-14 pr-6 py-4 focus:outline-none focus:border-[#E53935]/50 focus:bg-[#222] transition-colors text-white placeholder:text-white/20 shadow-inner"
         />
      </div>

      <div className="relative pl-6 sm:pl-10 border-l border-[#1C1C1F] space-y-6 max-w-4xl mx-auto md:mx-0">
        {filtered.map((log, i) => (
          <div key={log.id} className="relative animate-in slide-in-from-right-4 fade-in" style={{ animationDelay: `${i * 50}ms` }}>
             <div className={`absolute -left-[39.5px] sm:-left-[55.5px] top-4 w-8 h-8 rounded-full flex items-center justify-center border ring-8 ring-[#0B0B0D] z-10 shadow-lg ${getLogBg(log.type)}`}>
                {getLogIcon(log.type)}
             </div>
             
             <div className="bg-[#1C1C1F] border border-white/5 p-5 sm:p-6 rounded-3xl hover:bg-[#222] hover:border-white/10 transition-colors shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-white/5 pb-4">
                  <p className="text-sm">
                    <strong className="text-white font-black tracking-tight text-lg">{log.userName}</strong>
                    <span className="text-white/40 mx-2 text-xs uppercase tracking-widest font-bold">realizou ação de</span>
                    <span className="text-white font-medium">{log.action}</span>
                  </p>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#E53935] flex items-center gap-1.5 bg-[#E53935]/10 px-3 py-1.5 rounded-lg border border-[#E53935]/20 w-fit shrink-0">
                    <CalendarDays size={12} /> {formatDateTime(log.createdAt, { dateStyle:'short', timeStyle:'short' })}
                  </span>
                </div>
                
                {log.target && (
                  <div className="inline-flex flex-wrap items-center gap-2 mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Alvo:</span>
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold font-mono tracking-tight border shadow-inner ${
                      log.type === 'delete' ? 'text-[#E53935] border-[#E53935]/20 bg-[#E53935]/5' : 
                      log.type === 'alert' ? 'text-yellow-500 border-yellow-500/20 bg-yellow-500/5' :
                      'text-white border-white/10 bg-[#111]'
                    }`}>
                      {log.target}
                    </span>
                  </div>
                )}
                
                {log.details && (
                  <div className={`p-4 rounded-xl text-sm border bg-[#111] leading-relaxed ${log.type === 'delete' ? 'border-[#E53935]/30 text-[#E53935] bg-[#E53935]/5 font-medium' : 'border-white/5 text-white/70'}`}>
                    {log.details}
                  </div>
                )}
             </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center border px-4 border-white/5 rounded-3xl bg-[#1C1C1F] shadow-lg">
             <div className="w-20 h-20 bg-[#111] rounded-full flex items-center justify-center mb-6 border border-white/5 shadow-inner">
                 <Shield className="w-10 h-10 text-white/20" />
             </div>
             <h3 className="text-xl font-black text-white mb-2 tracking-tight">Nenhum registro encontrado</h3>
             <p className="text-white/40 text-sm font-medium">As ações importantes do sistema aparecerão aqui.</p>
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <div className="mt-12 text-center">
           <button className="px-8 py-3 rounded-xl font-bold tracking-widest uppercase text-xs bg-[#1A1A1A] border border-white/5 hover:bg-white hover:text-black transition-all shadow-lg hover:shadow-white/20 text-white/60">
             Carregar logs antigos
           </button>
        </div>
      )}
    </div>
  );
}
