import React from 'react';
import { AppProvider, useAppStore } from './lib/store';
import Login from './components/Login';
import StaffApp from './components/StaffApp';
import ClientApp from './components/ClientApp';
import AdminApp from './components/AdminApp';

function Root() {
  const { role } = useAppStore();

  if (role === null) return <Login />;
  if (role === 'STAFF') return <StaffApp />;
  if (role === 'ADMIN') return <AdminApp />;
  if (role === 'CLIENT') return <ClientApp />;
  
  return null;
}

export default function App() {
  return (
    <AppProvider>
      <div className="app-container selection:bg-[var(--color-brand-red)]/30 text-white font-sans">
         <Root />
      </div>
    </AppProvider>
  );
}
