import React, { useState } from 'react';
import { useAppStore } from '../../lib/store';
import { Search, Filter, Eye, Edit2, Calendar, Users, ClipboardList, Plus } from 'lucide-react';
import EditServiceOrderModal from './EditServiceOrderModal';
import ViewServiceOrderModal from './ViewServiceOrderModal';
import NewServiceModal from './NewServiceModal';
import { ServiceOrder, ServiceStatus } from '../../types';

type FilterType = 'Todas' | 'Em Serviço' | 'Aguardando Peças' | 'Pronto';

const ALL_STATUSES: ServiceStatus[] = [
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

export default function ServiceOrders() {
  const { serviceOrders, getVehicleById, getClientById } = useAppStore();
  const [filter, setFilter] = useState<FilterType>('Todas');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ServiceOrder | null>(null);
  const [viewingOrder, setViewingOrder] = useState<ServiceOrder | null>(null);
  const [isNewServiceModalOpen, setIsNewServiceModalOpen] = useState(false);

  const filtered = serviceOrders.filter(os => {
    if (statusFilter && os.status !== statusFilter) return false;
    if (filter === 'Em Serviço' && !['Em reparo', 'Em análise', 'Pintura', 'Alinhamento/Balanceamento'].includes(os.status)) return false;
    if (filter === 'Aguardando Peças' && os.status !== 'Aguardando peças') return false;
    if (filter === 'Pronto' && !['Pronto', 'Finalizado', 'Retirada'].includes(os.status)) return false;

    if (search) {
      const q = search.toLowerCase();
      const vehicle = getVehicleById(os.vehicleId);
      const client = getClientById(os.clientId);
      const haystack = `${os.id} ${os.shortId || ''} ${os.status} ${os.servicesFull || ''} ${vehicle?.model || ''} ${vehicle?.plate || ''} ${client?.name || ''}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const getStatusColor = (status: string) => {
    if (status === 'Pronto' || status === 'Finalizado') return 'bg-green-500/10 text-green-500 border-green-500/20';
    if (status === 'Aguardando peças') return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    if (status === 'Cancelado') return 'bg-red-500/10 text-red-400 border-red-500/20';
    return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            Ordens de Serviço
          </h1>
          <p className="text-white/50 text-sm mt-1">Acompanhe o status e histórico dos serviços.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar OS, placa, cliente..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[var(--color-brand-red)]/50 focus:bg-[#222] transition-colors"
            />
          </div>
          <button onClick={() => setFiltersOpen(open => !open)} className="h-[42px] px-4 rounded-xl border border-white/10 bg-[#1A1A1A] hover:bg-[#222] flex items-center gap-2 text-sm font-medium transition-colors shrink-0">
            <Filter size={16} /> <span className="hidden sm:inline">Filtros</span>
          </button>
          <button
            onClick={() => setIsNewServiceModalOpen(true)}
            className="h-[42px] px-4 rounded-xl font-medium transition-colors shrink-0 bg-[var(--color-brand-red)] hover:bg-[var(--color-brand-red-dark)] text-white flex items-center gap-2"
          >
            <Plus size={16} /> <span className="hidden sm:inline">Nova</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none">
        {(['Todas', 'Em Serviço', 'Aguardando Peças', 'Pronto'] as FilterType[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all border ${
              filter === f
                ? 'bg-[var(--color-brand-red)] text-white border-[var(--color-brand-red)]'
                : 'bg-[#1A1A1A] text-white/60 border-white/5 hover:border-white/20 hover:text-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtersOpen && (
        <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-4 mb-4 flex flex-col sm:flex-row gap-3">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="form-input bg-[#111] sm:w-72">
            <option value="">Todos os status</option>
            {ALL_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
          </select>
          <button onClick={() => { setStatusFilter(''); setFilter('Todas'); }} className="px-4 py-2 rounded-xl border border-white/10 text-sm text-white/70 hover:text-white hover:bg-white/5">
            Limpar filtros
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
        {filtered.map(os => {
          const client = getClientById(os.clientId);
          const vehicle = getVehicleById(os.vehicleId);

          return (
            <div key={os.id} className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <p className="text-[10px] text-white/40 uppercase mb-1 font-mono tracking-wider">#{os.id.slice(-8).toUpperCase()}</p>
                  <h3 className="font-bold text-lg leading-tight truncate pr-2">{vehicle?.model || 'Veículo Desconhecido'}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded bg-[#2A2A2A] text-white/50 uppercase tracking-wider border border-white/5">{vehicle?.plate || '---'}</span>
                    <p className="text-sm text-white/60 truncate max-w-[120px]"><Users size={12} className="inline mr-1"/>{client?.name || 'Sem Cliente'}</p>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium whitespace-nowrap shrink-0 ${getStatusColor(os.status)}`}>
                  {os.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-auto">
                <div>
                  <p className="text-[10px] text-white/40 uppercase mb-1">Serviço</p>
                  <p className="text-sm text-white/80 truncate">{os.servicesFull || 'Não descrito'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/40 uppercase mb-1">Telefone</p>
                  <p className="text-sm text-white/80 font-mono tracking-tight">{client?.phone ? client.phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3') : '-'}</p>
                </div>
              </div>

              <div className="flex justify-between items-end mt-5 pt-4 border-t border-white/5">
                <div>
                  <p className="text-[10px] text-white/40 uppercase mb-1">Previsão</p>
                  <p className="text-sm font-medium flex items-center gap-1.5 min-h-[20px]">
                    <Calendar size={14} className="text-white/40"/> {os.deliveryEstimate ? new Date(os.deliveryEstimate).toLocaleDateString('pt-BR') : '-'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setViewingOrder(os)} className="w-8 h-8 rounded-lg border border-white/10 bg-[#222] hover:bg-white hover:text-black flex items-center justify-center transition-all text-white/60">
                    <Eye size={16} />
                  </button>
                  <button onClick={() => setEditingOrder(os)} className="w-8 h-8 rounded-lg border border-white/10 bg-[#222] hover:bg-[var(--color-brand-red)] hover:border-[var(--color-brand-red)] flex items-center justify-center transition-all text-white/60 hover:text-white">
                    <Edit2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-[#1A1A1A]/50 border border-dashed border-white/10 rounded-3xl mt-4">
          <ClipboardList className="w-12 h-12 text-white/20 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Nenhuma ordem encontrada</h3>
          <p className="text-white/40 mb-6 max-w-sm">Crie uma nova ordem de serviço ou ajuste os filtros.</p>
          <button onClick={() => setIsNewServiceModalOpen(true)} className="bg-[var(--color-brand-red)] text-white px-6 py-2.5 rounded-xl font-medium hover:bg-red-700 transition shadow-lg">
            Nova Ordem
          </button>
        </div>
      )}

      {editingOrder && <EditServiceOrderModal order={editingOrder} onClose={() => setEditingOrder(null)} />}
      {viewingOrder && <ViewServiceOrderModal order={viewingOrder} onClose={() => setViewingOrder(null)} />}
      {isNewServiceModalOpen && <NewServiceModal onClose={() => setIsNewServiceModalOpen(false)} />}
    </div>
  );
}
