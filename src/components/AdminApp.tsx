import React, { useEffect, useRef, useState } from 'react';
import { 
  LayoutDashboard, 
  Car, 
  Users, 
  UserSquare2, 
  History, 
  Settings as SettingsIcon,
  Bell,
  AlertTriangle,
  Search,
  Plus,
  Menu,
  X,
  FileText,
  DollarSign,
  PieChart,
  ListOrdered
} from 'lucide-react';
import { useAppStore } from '../lib/store';
import Dashboard from './admin/Dashboard';
import Vehicles from './admin/Vehicles';
import ServiceOrders from './admin/ServiceOrders';
import Clients from './admin/Clients';
import Team from './admin/Team';
import Logs from './admin/Logs';
import Settings from './admin/Settings';
import NewServiceModal from './admin/NewServiceModal';
import Budgets from './admin/Budgets';
import Finance from './admin/Finance';
import Reports from './admin/Reports';
import Notifications from './admin/Notifications';

type AdminRoute = 'dashboard' | 'serviceOrders' | 'clients' | 'vehicles' | 'budgets' | 'finance' | 'team' | 'reports' | 'notifications' | 'settings' | 'logs';

export default function AdminApp() {
  const { logout, currentUser, clients, vehicles, serviceOrders, messages, notifications, isUsingLocalFallback, dataError } = useAppStore();
  const [currentRoute, setCurrentRoute] = useState<AdminRoute>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNewServiceModalOpen, setIsNewServiceModalOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);
  const unreadCount = messages.filter(message => !message.read).length + notifications.filter(notification => !notification.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setGlobalSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const globalResults = globalSearch.trim()
    ? [
        ...clients.filter(client => `${client.name} ${client.phone} ${client.login}`.toLowerCase().includes(globalSearch.toLowerCase())).slice(0, 3).map(client => ({ label: client.name, detail: 'Cliente', route: 'clients' as AdminRoute })),
        ...vehicles.filter(vehicle => `${vehicle.model} ${vehicle.plate}`.toLowerCase().includes(globalSearch.toLowerCase())).slice(0, 3).map(vehicle => ({ label: vehicle.model, detail: vehicle.plate, route: 'vehicles' as AdminRoute })),
        ...serviceOrders.filter(order => `${order.id} ${order.status} ${order.servicesFull}`.toLowerCase().includes(globalSearch.toLowerCase())).slice(0, 3).map(order => ({ label: `OS #${order.id.slice(-6).toUpperCase()}`, detail: order.status, route: 'serviceOrders' as AdminRoute }))
      ].slice(0, 8)
    : [];

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'serviceOrders', label: 'Ordens de Serviço', icon: History },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'vehicles', label: 'Veículos', icon: Car },
    { id: 'budgets', label: 'Orçamentos', icon: FileText },
    { id: 'finance', label: 'Financeiro', icon: DollarSign },
    { id: 'team', label: 'Equipe', icon: UserSquare2 },
    { id: 'reports', label: 'Relatórios', icon: PieChart },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'settings', label: 'Configurações', icon: SettingsIcon },
    { id: 'logs', label: 'Logs & Auditoria', icon: ListOrdered },
  ];

  return (
    <div className="flex h-screen bg-[#0B0B0D] text-white overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-[#151515] border-r border-white/5 shadow-2xl md:shadow-none
        flex flex-col transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black italic text-[#E53935] tracking-tighter drop-shadow-[0_2px_10px_rgba(229,57,53,0.3)]">
                FOCA RODAS
              </h1>
              <p className="text-xs text-white/40 mt-1 uppercase tracking-widest font-bold">Painel Admin</p>
            </div>
            <button className="md:hidden text-white/60 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
              <X size={24} />
            </button>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto hide-scrollbar">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = currentRoute === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentRoute(item.id as AdminRoute);
                  setIsSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-[#E53935]/10 text-[#E53935] font-bold shadow-[inset_4px_0_0_0_#E53935]' 
                    : 'text-white/60 hover:bg-white/5 hover:text-white font-medium'}
                `}
              >
                <Icon size={18} className={isActive ? 'text-[#E53935]' : 'text-white/40'} />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-white/5 bg-[#151515]">
          <button 
            onClick={() => setIsNewServiceModalOpen(true)}
            className="w-full bg-[#E53935] hover:bg-[#B71C1C] text-white py-3 rounded-xl flex items-center justify-center gap-2 transition-colors font-bold shadow-[0_0_15px_rgba(229,57,53,0.2)] hover:shadow-[0_0_20px_rgba(229,57,53,0.4)] mb-4"
          >
            <Plus size={18} />
            <span className="text-sm uppercase tracking-wider">Nova OS</span>
          </button>
          
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-[#1C1C1F] border border-white/10 flex items-center justify-center font-bold text-[#E53935]">
              {currentUser?.name?.substring(0, 2).toUpperCase() || 'AD'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold truncate text-white/90">{currentUser?.name}</p>
              <button onClick={logout} className="text-[11px] uppercase tracking-wider font-bold text-white/40 hover:text-[#E53935] transition-colors">
                Sair do sistema
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-[#0B0B0D]">
        {/* Top Header */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-4 md:px-8 bg-[#0B0B0D]/80 backdrop-blur-md shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-white/60 hover:text-white p-2 -ml-2" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-bold capitalize hidden sm:block text-white/90">
              {menuItems.find(i => i.id === currentRoute)?.label}
            </h2>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative hidden md:block group" ref={searchRef}>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-4 h-4 group-focus-within:text-[#E53935] transition-colors" />
              <input 
                type="text" 
                placeholder="Buscar clientes, placas, OS..." 
                value={globalSearch}
                onChange={e => setGlobalSearch(e.target.value)}
                className="bg-[#1C1C1F] border border-white/5 rounded-full pl-12 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#E53935]/50 focus:bg-[#242428] transition-all w-72 placeholder:text-white/30"
              />
              {globalResults.length > 0 && (
                <div className="absolute right-0 mt-3 w-80 bg-[#151515] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                  {globalResults.map((result, index) => (
                    <button
                      key={`${result.route}-${index}`}
                      onClick={() => {
                        setCurrentRoute(result.route);
                        setGlobalSearch('');
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-white/5 border-b border-white/5 last:border-b-0"
                    >
                      <p className="text-sm font-bold text-white">{result.label}</p>
                      <p className="text-[10px] uppercase tracking-widest text-white/40">{result.detail}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button 
                onClick={() => setCurrentRoute('notifications')} 
                className="text-white/40 hover:text-white relative p-2 hover:bg-white/5 rounded-full transition-colors"
            >
              <Bell size={20} />
              {unreadCount > 0 && <span className="absolute top-1 right-1 min-w-2 h-2 bg-[#E53935] rounded-full shadow-[0_0_5px_rgba(229,57,53,1)]"></span>}
            </button>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto w-full hide-scrollbar">
          {(isUsingLocalFallback || dataError) && (
            <div className="mx-4 md:mx-8 mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl px-4 py-3 flex items-start gap-3">
              <AlertTriangle size={16} className="text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-yellow-300">
                  {isUsingLocalFallback ? 'Modo local ativo - dados não persistem online' : 'Erro de conexão com Supabase'}
                </p>
                {dataError && <p className="text-xs text-yellow-300/70 mt-1">{dataError}</p>}
              </div>
            </div>
          )}
          <div className="max-w-[1400px] mx-auto w-full">
            {currentRoute === 'dashboard' && <Dashboard />}
            {currentRoute === 'serviceOrders' && <ServiceOrders />}
            {currentRoute === 'clients' && <Clients />}
            {currentRoute === 'vehicles' && <Vehicles />}
            {currentRoute === 'budgets' && <Budgets />}
            {currentRoute === 'finance' && <Finance />}
            {currentRoute === 'team' && <Team />}
            {currentRoute === 'reports' && <Reports />}
            {currentRoute === 'notifications' && <Notifications />}
            {currentRoute === 'settings' && <Settings />}
            {currentRoute === 'logs' && <Logs />}
          </div>
        </div>
      </main>

      {isNewServiceModalOpen && (
        <NewServiceModal onClose={() => setIsNewServiceModalOpen(false)} />
      )}
    </div>
  );
}
