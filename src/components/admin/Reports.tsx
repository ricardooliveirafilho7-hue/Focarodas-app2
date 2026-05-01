import React from 'react';
import { BarChart3, AlertTriangle, Users } from 'lucide-react';
import { useAppStore } from '../../lib/store';

export default function Reports() {
  const { serviceOrders, clients, employees, payments } = useAppStore();
  const openStatuses = serviceOrders.reduce<Record<string, number>>((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});
  const delayed = serviceOrders.filter(order => new Date(order.deliveryEstimate) < new Date() && !['Finalizado', 'Retirada', 'Cancelado'].includes(order.status));
  const revenue = payments.filter(payment => payment.status === 'Pago' || payment.status === 'Parcial').reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const activeClients = clients.filter(client => client.status !== 'Inativo').length;
  const byTechnician = employees.map(employee => ({
    employee,
    count: serviceOrders.filter(order => order.technicianId === employee.id).length
  })).filter(item => item.count > 0);

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <BarChart3 className="text-blue-500" /> Relatórios
        </h1>
        <p className="text-white/40 text-sm mt-2 font-medium">Indicadores operacionais baseados nos dados salvos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#111] border border-white/5 rounded-2xl p-5">
          <p className="text-white/40 text-xs uppercase tracking-widest">OS total</p>
          <p className="text-3xl font-black text-white">{serviceOrders.length}</p>
        </div>
        <div className="bg-[#111] border border-white/5 rounded-2xl p-5">
          <p className="text-white/40 text-xs uppercase tracking-widest">Clientes ativos</p>
          <p className="text-3xl font-black text-purple-400">{activeClients}</p>
        </div>
        <div className="bg-[#111] border border-white/5 rounded-2xl p-5">
          <p className="text-white/40 text-xs uppercase tracking-widest">Atrasos</p>
          <p className="text-3xl font-black text-[#E53935]">{delayed.length}</p>
        </div>
        <div className="bg-[#111] border border-white/5 rounded-2xl p-5">
          <p className="text-white/40 text-xs uppercase tracking-widest">Faturamento</p>
          <p className="text-2xl font-black text-green-500">{revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[#111] border border-white/5 rounded-3xl p-6">
          <h2 className="font-black text-xl mb-4 flex items-center gap-2"><BarChart3 size={18} /> OS por status</h2>
          <div className="space-y-3">
            {Object.entries(openStatuses).map(([status, count]) => (
              <div key={status}>
                <div className="flex justify-between text-sm mb-1"><span>{status}</span><span>{count}</span></div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-[#E53935]" style={{ width: `${Math.max(8, (Number(count) / Math.max(1, serviceOrders.length)) * 100)}%` }} /></div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#111] border border-white/5 rounded-3xl p-6">
          <h2 className="font-black text-xl mb-4 flex items-center gap-2"><AlertTriangle size={18} /> Serviços em atraso</h2>
          <div className="space-y-3">
            {delayed.map(order => <div key={order.id} className="bg-[#1A1A1A] rounded-xl p-3 text-sm">OS #{order.id.slice(-6).toUpperCase()} - {order.status}</div>)}
            {delayed.length === 0 && <p className="text-white/40 text-sm">Nenhuma OS atrasada.</p>}
          </div>
        </div>

        <div className="bg-[#111] border border-white/5 rounded-3xl p-6">
          <h2 className="font-black text-xl mb-4 flex items-center gap-2"><Users size={18} /> Produtividade</h2>
          <div className="space-y-3">
            {byTechnician.map(({ employee, count }) => <div key={employee.id} className="bg-[#1A1A1A] rounded-xl p-3 flex justify-between text-sm"><span>{employee.name}</span><span>{count} OS</span></div>)}
            {byTechnician.length === 0 && <p className="text-white/40 text-sm">Sem OS atribuída a funcionário ainda.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
