import React from 'react';
import { Bell, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { useAppStore } from '../../lib/store';
import { formatDateTime, parseLocalDate } from '../../lib/dateUtils';

export default function Notifications() {
  const { notifications, serviceOrders, messages, payments, markNotificationAsRead } = useAppStore();
  const delayed = serviceOrders.filter(order => parseLocalDate(order.deliveryEstimate) < new Date() && !['Finalizado', 'Retirada', 'Cancelado'].includes(order.status));
  const ready = serviceOrders.filter(order => order.status === 'Pronto');
  const unreadMessages = messages.filter(message => !message.read);
  const pendingPayments = payments.filter(payment => payment.status === 'Pendente');

  const generated = [
    ...delayed.map(order => ({ id: `delay-${order.id}`, persisted: false, title: 'OS atrasada', message: `OS #${order.id.slice(-6).toUpperCase()} passou da previsão de entrega.`, type: 'WARNING' as const, createdAt: order.deliveryEstimate, read: false })),
    ...ready.map(order => ({ id: `ready-${order.id}`, persisted: false, title: 'OS pronta', message: `OS #${order.id.slice(-6).toUpperCase()} está pronta para retirada.`, type: 'SUCCESS' as const, createdAt: order.updatedAt || order.createdAt || new Date().toISOString(), read: false })),
    ...unreadMessages.map(message => ({ id: `msg-${message.id}`, persisted: false, title: 'Mensagem não lida', message: message.title, type: 'INFO' as const, createdAt: message.createdAt, read: false })),
    ...pendingPayments.map(payment => ({ id: `pay-${payment.id}`, persisted: false, title: 'Pagamento pendente', message: `${payment.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} aguardando baixa.`, type: 'WARNING' as const, createdAt: payment.createdAt, read: false })),
    ...notifications.map(notification => ({ ...notification, persisted: true }))
  ].sort((a, b) => parseLocalDate(b.createdAt).getTime() - parseLocalDate(a.createdAt).getTime());

  const getIcon = (type: string) => {
    if (type === 'SUCCESS') return <CheckCircle2 className="text-green-500" size={18} />;
    if (type === 'WARNING' || type === 'ERROR') return <AlertTriangle className="text-yellow-500" size={18} />;
    return <Bell className="text-blue-500" size={18} />;
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <Bell className="text-yellow-500" /> Notificações
        </h1>
        <p className="text-white/40 text-sm mt-2 font-medium">Central interna de alertas reais do sistema.</p>
      </div>

      <div className="bg-[#111] border border-white/5 rounded-3xl p-4 md:p-6">
        <div className="space-y-3">
          {generated.map(notification => (
            <button
              key={notification.id}
              onClick={() => notification.persisted && markNotificationAsRead(notification.id)}
              className={`w-full text-left bg-[#1A1A1A] border rounded-2xl p-4 flex gap-4 hover:bg-[#222] transition ${notification.read ? 'border-white/5 opacity-70' : 'border-yellow-500/20'}`}
            >
              <div className="w-10 h-10 rounded-xl bg-black/30 border border-white/5 flex items-center justify-center shrink-0">{getIcon(notification.type)}</div>
              <div className="flex-1">
                <div className="flex justify-between gap-3">
                  <h3 className="font-black text-white">{notification.title}</h3>
                  <span className="text-[10px] text-white/40 flex items-center gap-1"><Clock size={12} /> {formatDateTime(notification.createdAt)}</span>
                </div>
                <p className="text-sm text-white/60 mt-1">{notification.message}</p>
              </div>
            </button>
          ))}
          {generated.length === 0 && (
            <div className="flex flex-col items-center justify-center p-10 text-center">
              <Bell size={42} className="text-white/20 mb-4" />
              <h3 className="text-xl font-black text-white">Nenhuma notificação</h3>
              <p className="text-white/40 text-sm">Alertas de OS, mensagens e pagamentos aparecerão aqui.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
