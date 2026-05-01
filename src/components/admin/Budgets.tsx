import React, { useState } from 'react';
import { Calculator, Plus, Save } from 'lucide-react';
import { useAppStore } from '../../lib/store';
import { BudgetItem } from '../../types';

const emptyItem = (): BudgetItem => ({
  id: crypto.randomUUID(),
  description: '',
  type: 'Serviço',
  quantity: 1,
  unitPrice: 0,
  total: 0
});

export default function Budgets() {
  const { budgets, serviceOrders, getClientById, getVehicleById, createBudget, updateBudget } = useAppStore();
  const [selectedOrderId, setSelectedOrderId] = useState(serviceOrders[0]?.id || '');
  const [items, setItems] = useState<BudgetItem[]>([emptyItem()]);
  const [discount, setDiscount] = useState(0);
  const [status, setStatus] = useState<'Rascunho' | 'Enviado' | 'Aprovado' | 'Recusado'>('Rascunho');
  const [isSaving, setIsSaving] = useState(false);

  const normalizedItems = items.map(item => ({ ...item, total: Number(item.quantity || 0) * Number(item.unitPrice || 0) }));
  const subtotal = normalizedItems.reduce((sum, item) => sum + item.total, 0);
  const total = Math.max(0, subtotal - Number(discount || 0));
  const selectedOrder = serviceOrders.find(order => order.id === selectedOrderId);

  const saveBudget = async () => {
    if (!selectedOrder || normalizedItems.some(item => !item.description.trim())) {
      alert('Selecione uma OS e preencha a descrição dos itens.');
      return;
    }
    setIsSaving(true);
    try {
      await createBudget({
        serviceOrderId: selectedOrder.id,
        clientId: selectedOrder.clientId,
        vehicleId: selectedOrder.vehicleId,
        items: normalizedItems,
        discount: Number(discount || 0),
        status
      });
      setItems([emptyItem()]);
      setDiscount(0);
      setStatus('Rascunho');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <Calculator className="text-[#E53935]" /> Orçamentos
        </h1>
        <p className="text-white/40 text-sm mt-2 font-medium">Monte propostas vinculadas a uma ordem de serviço.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-[#111] border border-white/5 rounded-3xl p-6 space-y-5">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold block mb-2">Ordem de Serviço</label>
            <select value={selectedOrderId} onChange={e => setSelectedOrderId(e.target.value)} className="form-input bg-[#1A1A1A] w-full">
              {serviceOrders.map(order => {
                const vehicle = getVehicleById(order.vehicleId);
                const client = getClientById(order.clientId);
                return <option key={order.id} value={order.id}>{vehicle?.plate || '---'} - {client?.name || 'Cliente'} - {order.status}</option>;
              })}
            </select>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-[#1A1A1A] border border-white/5 rounded-2xl p-4">
                <input className="form-input md:col-span-5" placeholder="Descrição" value={item.description} onChange={e => setItems(prev => prev.map((current, i) => i === index ? { ...current, description: e.target.value } : current))} />
                <select className="form-input md:col-span-3" value={item.type} onChange={e => setItems(prev => prev.map((current, i) => i === index ? { ...current, type: e.target.value as any } : current))}>
                  <option value="Serviço">Serviço</option>
                  <option value="Peça">Peça</option>
                  <option value="Mão de obra">Mão de obra</option>
                  <option value="Outro">Outro</option>
                </select>
                <input className="form-input md:col-span-2" type="number" min="1" value={item.quantity} onChange={e => setItems(prev => prev.map((current, i) => i === index ? { ...current, quantity: Number(e.target.value) } : current))} />
                <input className="form-input md:col-span-2" type="number" min="0" step="0.01" value={item.unitPrice} onChange={e => setItems(prev => prev.map((current, i) => i === index ? { ...current, unitPrice: Number(e.target.value) } : current))} />
              </div>
            ))}
          </div>

          <button onClick={() => setItems(prev => [...prev, emptyItem()])} className="px-4 py-2 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 flex items-center gap-2">
            <Plus size={16} /> Adicionar item
          </button>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className="form-input" type="number" min="0" step="0.01" value={discount} onChange={e => setDiscount(Number(e.target.value))} placeholder="Desconto" />
            <select className="form-input" value={status} onChange={e => setStatus(e.target.value as any)}>
              <option value="Rascunho">Rascunho</option>
              <option value="Enviado">Enviado</option>
              <option value="Aprovado">Aprovado</option>
              <option value="Recusado">Recusado</option>
            </select>
            <button onClick={saveBudget} disabled={isSaving} className="btn-primary rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
              <Save size={16} /> {isSaving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>

          <div className="bg-black/30 rounded-2xl p-4 border border-white/5 text-right">
            <p className="text-white/40 text-sm">Subtotal: {subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            <p className="text-2xl font-black text-white">Total: {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          </div>
        </div>

        <div className="bg-[#111] border border-white/5 rounded-3xl p-6">
          <h2 className="text-xl font-black mb-4">Orçamentos cadastrados</h2>
          <div className="space-y-3">
            {budgets.map(budget => {
              const vehicle = getVehicleById(budget.vehicleId);
              const client = getClientById(budget.clientId);
              return (
                <div key={budget.id} className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-4">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-bold text-white">{client?.name || 'Cliente'} - {vehicle?.plate || '---'}</p>
                      <p className="text-xs text-white/40">{budget.items.length} itens</p>
                    </div>
                    <select value={budget.status} onChange={e => updateBudget(budget.id, { status: e.target.value as any })} className="bg-[#111] border border-white/10 rounded-xl px-3 text-sm">
                      <option value="Rascunho">Rascunho</option>
                      <option value="Enviado">Enviado</option>
                      <option value="Aprovado">Aprovado</option>
                      <option value="Recusado">Recusado</option>
                    </select>
                  </div>
                  <p className="mt-3 text-lg font-black text-[#E53935]">{budget.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </div>
              );
            })}
            {budgets.length === 0 && <p className="text-white/40 text-sm">Nenhum orçamento cadastrado ainda.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
