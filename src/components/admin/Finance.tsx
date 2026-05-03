import React, { useState } from 'react';
import { Wallet, Plus } from 'lucide-react';
import { useAppStore } from '../../lib/store';
import { formatDateTime } from '../../lib/dateUtils';
import { useToast } from '../Toast';
import { Payment } from '../../types';

export default function Finance() {
  const { payments, budgets, serviceOrders, getClientById, createPayment, updatePayment } = useAppStore();
  const { showToast } = useToast();
  const [serviceOrderId, setServiceOrderId] = useState(serviceOrders[0]?.id || '');
  const [budgetId, setBudgetId] = useState('');
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<'Dinheiro' | 'Pix' | 'Cartao' | 'Boleto' | 'Transferencia' | 'Outro'>('Pix');
  const [status, setStatus] = useState<'Pendente' | 'Parcial' | 'Pago' | 'Cancelado'>('Pendente');

  const paidTotal = payments.filter(payment => payment.status === 'Pago' || payment.status === 'Parcial').reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const pendingTotal = payments.filter(payment => payment.status === 'Pendente').reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  const savePayment = async () => {
    const order = serviceOrders.find(item => item.id === serviceOrderId);
    const budget = budgets.find(item => item.id === budgetId);
    if (order && budget && order.clientId !== budget.clientId) {
      showToast('A OS e o orçamento selecionados pertencem a clientes diferentes.', 'error');
      return;
    }
    const clientId = order?.clientId || budget?.clientId;
    if (!clientId || amount <= 0) {
      showToast('Informe OS/orçamento e valor válido.', 'error');
      return;
    }
    await createPayment({
      serviceOrderId: order?.id,
      budgetId: budget?.id,
      clientId,
      amount: Number(amount),
      method,
      status,
      paidAt: status === 'Pago' ? new Date().toISOString() : undefined
    });
    setAmount(0);
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <Wallet className="text-green-500" /> Financeiro
        </h1>
        <p className="text-white/40 text-sm mt-2 font-medium">Controle simples de faturamento e pagamentos por OS.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#111] border border-white/5 rounded-2xl p-5">
          <p className="text-white/40 text-xs uppercase tracking-widest">Recebido</p>
          <p className="text-2xl font-black text-green-500">{paidTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        </div>
        <div className="bg-[#111] border border-white/5 rounded-2xl p-5">
          <p className="text-white/40 text-xs uppercase tracking-widest">Pendente</p>
          <p className="text-2xl font-black text-yellow-500">{pendingTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        </div>
        <div className="bg-[#111] border border-white/5 rounded-2xl p-5">
          <p className="text-white/40 text-xs uppercase tracking-widest">Lançamentos</p>
          <p className="text-2xl font-black text-white">{payments.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-[#111] border border-white/5 rounded-3xl p-6 space-y-4">
          <h2 className="font-black text-xl">Novo pagamento</h2>
          <select className="form-input" value={serviceOrderId} onChange={e => setServiceOrderId(e.target.value)}>
            <option value="">Sem OS</option>
            {serviceOrders.map(order => <option key={order.id} value={order.id}>OS #{order.id.slice(-6).toUpperCase()} - {getClientById(order.clientId)?.name}</option>)}
          </select>
          <select className="form-input" value={budgetId} onChange={e => setBudgetId(e.target.value)}>
            <option value="">Sem orçamento</option>
            {budgets.map(budget => <option key={budget.id} value={budget.id}>Orçamento #{budget.id.slice(-6).toUpperCase()} - {budget.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</option>)}
          </select>
          <input className="form-input" type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(Number(e.target.value))} placeholder="Valor" />
          <select className="form-input" value={method} onChange={e => setMethod(e.target.value as Payment['method'])}>
            <option value="Pix">Pix</option>
            <option value="Dinheiro">Dinheiro</option>
            <option value="Cartao">Cartão</option>
            <option value="Boleto">Boleto</option>
            <option value="Transferencia">Transferência</option>
            <option value="Outro">Outro</option>
          </select>
          <select className="form-input" value={status} onChange={e => setStatus(e.target.value as Payment['status'])}>
            <option value="Pendente">Pendente</option>
            <option value="Parcial">Parcial</option>
            <option value="Pago">Pago</option>
            <option value="Cancelado">Cancelado</option>
          </select>
          <button onClick={savePayment} className="btn-primary py-3 px-5 rounded-xl flex items-center justify-center gap-2 w-full">
            <Plus size={16} /> Registrar
          </button>
        </div>

        <div className="xl:col-span-2 bg-[#111] border border-white/5 rounded-3xl p-6">
          <h2 className="font-black text-xl mb-4">Pagamentos</h2>
          <div className="space-y-3">
            {payments.map(payment => (
              <div key={payment.id} className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-white">{getClientById(payment.clientId)?.name || 'Cliente'}</p>
                  <p className="text-xs text-white/40">{payment.method} - {formatDateTime(payment.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-black text-white">{payment.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  <select value={payment.status} onChange={e => updatePayment(payment.id, { status: e.target.value as Payment['status'], paidAt: e.target.value === 'Pago' ? new Date().toISOString() : payment.paidAt })} className="bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-sm">
                    <option value="Pendente">Pendente</option>
                    <option value="Parcial">Parcial</option>
                    <option value="Pago">Pago</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>
              </div>
            ))}
            {payments.length === 0 && <p className="text-white/40 text-sm">Nenhum pagamento registrado.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
