import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import StaffDashboard from './StaffDashboard';
import StaffVehicleList from './StaffVehicleList';
import StaffVehicleDetail from './StaffVehicleDetail';
import Clients from './admin/Clients';
import NewServiceModal from './admin/NewServiceModal';
import { AlertTriangle, Bell, Settings, Home, Car, User as UserIcon, Users } from 'lucide-react';

export default function StaffApp() {
  const { logout, activeVehicleId, setActiveVehicleId, isUsingLocalFallback, dataError } = useAppStore();
  const [activeTab, setActiveTab] = useState('Início');
  const [isNewServiceModalOpen, setIsNewServiceModalOpen] = useState(false);

  // If we are viewing a specific vehicle, we show the detail screen instead of tabs
  if (activeVehicleId) {
    return (
      <div className="flex-1 flex flex-col w-full h-full min-h-0 bg-[var(--color-background)]">
        <StaffVehicleDetail orderId={activeVehicleId} onBack={() => setActiveVehicleId(null)} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col w-full h-full min-h-0 bg-[var(--color-background)]">
      {/* Header */}
      <header className="flex justify-between items-center p-6 shrink-0 z-50">
        <h1 className="text-xl font-black italic text-[var(--color-brand-red)] tracking-tighter">
          FOCA RODAS
        </h1>
        <div className="flex gap-4">
          <button className="text-white/50 hover:text-white transition">
            <Bell className="w-5 h-5" />
          </button>
          <button className="text-white/50 hover:text-[var(--color-brand-red)] transition" onClick={logout}>
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>
      
      {(isUsingLocalFallback || dataError) && (
        <div className="mx-4 md:mx-8 mb-4 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl px-4 py-3 flex items-start gap-3">
          <AlertTriangle size={16} className="text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-yellow-300">
              {isUsingLocalFallback ? 'Modo local ativo - dados não persistem online' : 'Erro de conexão com Supabase'}
            </p>
            {dataError && <p className="text-xs text-yellow-300/70 mt-1">{dataError}</p>}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {activeTab === 'Início' && <StaffDashboard onNavigate={setActiveTab} onNewService={() => setIsNewServiceModalOpen(true)} />}
      {activeTab === 'Veículos' && <StaffVehicleList onSelectVehicle={setActiveVehicleId} onNewService={() => setIsNewServiceModalOpen(true)} />}
      {activeTab === 'Clientes' && <div className="flex-1 overflow-y-auto"><Clients /></div>}
      {activeTab === 'Perfil' && (
         <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <UserIcon className="w-16 h-16 text-white/20 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Meu Perfil</h3>
            <button onClick={logout} className="mt-8 px-8 py-3 bg-[#1A1A1A] border border-white/10 rounded-xl text-[var(--color-brand-red)] font-semibold hover:bg-white/5 transition">
              Sair do Sistema
            </button>
         </div>
      )}

      {/* Modals */}
      {isNewServiceModalOpen && (
        <NewServiceModal onClose={() => setIsNewServiceModalOpen(false)} />
      )}

      {/* Bottom Nav */}
      <div className="bg-[var(--color-card-bg)] border-t border-white/5 shrink-0 px-6 pt-2 pb-safe relative z-40 mt-auto">
        <div className="flex justify-around items-center h-16 max-w-sm mx-auto">
          {[
            { id: "Início", icon: Home },
            { id: "Veículos", icon: Car },
            { id: "Clientes", icon: Users },
            { id: "Perfil", icon: UserIcon }
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1.5 transition-colors p-2 ${activeTab === item.id ? 'text-[var(--color-brand-red)]' : 'text-white/40 hover:text-white/60'}`}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-[9px] font-bold tracking-widest uppercase">{item.id}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
