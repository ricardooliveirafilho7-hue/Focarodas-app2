import React, { createContext, useContext, useState, useEffect } from 'react';
import { isSupabaseConfigured, supabase } from './supabase';
import { Vehicle, ServiceOrder, Client, UserRole, ServiceStatus, ServiceUpdate, Employee, AuditLog, Settings, Message } from '../types';

const toCamel = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(v => toCamel(v));
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/([-_][a-z])/ig, ($1) => $1.toUpperCase().replace('-', '').replace('_', ''));
      result[camelKey] = toCamel(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
};

const toSnake = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(v => toSnake(v));
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((result, key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      result[snakeKey] = toSnake(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
};

interface AppState {
  vehicles: Vehicle[];
  serviceOrders: ServiceOrder[];
  clients: Client[];
  employees: Employee[];
  logs: AuditLog[];
  messages: Message[];
  settings: Settings;
  role: UserRole;
  currentUser: Client | Employee | { id: string, name: string } | null;
  activeVehicleId: string | null;
}

interface AppContextType extends AppState {
  setRole: (role: UserRole) => void;
  setCurrentUser: (user: any) => void;
  loginUser: (login: string, pass: string, panel: 'cliente' | 'funcionario' | 'admin') => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  addVehicleUpdate: (
    serviceOrderId: string, 
    status: ServiceStatus, 
    publicMessage: string, 
    internalNote: string, 
    photos: string[], 
    deliveryEstimate: string,
    notifyClient: boolean
  ) => Promise<void>;
  setActiveVehicleId: (id: string | null) => void;
  getVehicleById: (id: string) => Vehicle | undefined;
  getServiceOrderById: (id: string) => ServiceOrder | undefined;
  getClientById: (id: string) => Client | undefined;
  addLog: (action: string, target: string, type: 'edit' | 'add' | 'alert' | 'delete' | 'info', details?: string, targetId?: string) => void;
  createClient: (client: Omit<Client, 'id'>) => Promise<{ success: boolean; error?: string; client?: Client }>;
  updateClient: (id: string, client: Partial<Client>) => Promise<boolean>;
  createVehicle: (vehicle: Omit<Vehicle, 'id'>) => Promise<Vehicle | null>;
  updateVehicle: (id: string, vehicle: Partial<Vehicle>) => Promise<boolean>;
  createServiceOrder: (order: Omit<ServiceOrder, 'id' | 'updates'>) => Promise<ServiceOrder | null>;
  updateServiceOrder: (id: string, order: Partial<ServiceOrder>) => Promise<boolean>;
  createEmployee: (employee: Omit<Employee, 'id'>) => Promise<{ success: boolean; error?: string; employee?: Employee }>;
  updateEmployee: (id: string, employee: Partial<Employee>) => Promise<boolean>;
  sendMessage: (msg: Omit<Message, 'id' | 'createdAt' | 'read'>) => Promise<boolean>;
  markMessageAsRead: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface LocalData {
  vehicles: Vehicle[];
  serviceOrders: ServiceOrder[];
  clients: Client[];
  employees: Employee[];
  logs: AuditLog[];
  messages: Message[];
}

const LOCAL_DATA_KEY = 'foca_local_data_v1';
const defaultAdmin: Employee = {
  id: 'admin1',
  name: 'Administrador',
  login: 'admin',
  password: '123456',
  email: 'admin@focarodas.com',
  role: 'Administrador',
  active: true
};

const emptyLocalData = (): LocalData => ({
  vehicles: [],
  serviceOrders: [],
  clients: [],
  employees: [defaultAdmin],
  logs: [],
  messages: []
});

const normalizeLocalData = (data: Partial<LocalData> | null | undefined): LocalData => {
  const normalized: LocalData = {
    ...emptyLocalData(),
    ...(data || {}),
    vehicles: Array.isArray(data?.vehicles) ? data.vehicles : [],
    serviceOrders: Array.isArray(data?.serviceOrders) ? data.serviceOrders : [],
    clients: Array.isArray(data?.clients) ? data.clients : [],
    employees: Array.isArray(data?.employees) ? data.employees : [defaultAdmin],
    logs: Array.isArray(data?.logs) ? data.logs : [],
    messages: Array.isArray(data?.messages) ? data.messages : []
  };

  if (!normalized.employees.some(employee => employee.id === defaultAdmin.id)) {
    normalized.employees.push(defaultAdmin);
  }

  return normalized;
};

const readLocalData = (): LocalData => {
  try {
    return normalizeLocalData(JSON.parse(localStorage.getItem(LOCAL_DATA_KEY) || 'null'));
  } catch {
    return emptyLocalData();
  }
};

const writeLocalData = (data: LocalData) => {
  localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(normalizeLocalData(data)));
};

const updateLocalData = (updater: (data: LocalData) => LocalData): LocalData => {
  const next = normalizeLocalData(updater(readLocalData()));
  writeLocalData(next);
  return next;
};

const passwordMatches = (storedPassword: string | undefined, inputPass: string) =>
  !storedPassword || storedPassword === inputPass || inputPass === 'focarodas';

const cleanLogin = (value: string) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9._-]/g, '');

const authEmailFromLogin = (loginOrEmail: string) => {
  const trimmed = String(loginOrEmail || '').trim().toLowerCase();
  if (trimmed.includes('@')) return trimmed;
  return `${cleanLogin(trimmed).replace(/[^a-z0-9]/g, '')}@focarodas.com`;
};

const upsertById = <T extends { id: string }>(items: T[], item: T) => {
  const withoutCurrent = items.filter(existing => existing.id !== item.id);
  return [item, ...withoutCurrent];
};

const backendUnavailableMessage = () => {
  const protocol = typeof window !== 'undefined' ? window.location.protocol : '';
  if (protocol === 'file:') {
    return 'As APIs da Vercel nao funcionam abrindo o arquivo por file://. Abra pelo deploy da Vercel ou rode localmente com npx vercel dev.';
  }
  return 'Nao foi possivel acessar as APIs do servidor. Verifique se o deploy da Vercel esta ativo ou rode npx vercel dev para testar localmente.';
};

const apiPost = async <T extends Record<string, any>>(url: string, body: Record<string, any>): Promise<T & { success: boolean; error?: string }> => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.success === false) {
      return { success: false, error: payload.error || 'Erro ao comunicar com a API.' } as T & { success: boolean; error?: string };
    }
    return payload;
  } catch (error) {
    console.error('API fetch failed', error);
    return { success: false, error: backendUnavailableMessage() } as T & { success: boolean; error?: string };
  }
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [settings, setSettings] = useState<Settings>({ darkMode: true });
  
  const [role, setRole] = useState<UserRole>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeVehicleId, setActiveVehicleId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Load session
  useEffect(() => {
    const savedRole = localStorage.getItem('foca_role_v3') as UserRole;
    const savedUser = localStorage.getItem('foca_user_v3');
    if (savedRole && savedUser) {
      setRole(savedRole);
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  // Fetch data from Supabase
  useEffect(() => {
    async function loadData() {
      if (!role || !currentUser) {
        setIsReady(true);
        return;
      }

      if (!isSupabaseConfigured) {
        const localData = readLocalData();
        if (role === 'CLIENT') {
          setClients(localData.clients.filter(client => client.id === currentUser.id));
          setVehicles(localData.vehicles.filter(vehicle => vehicle.clientId === currentUser.id));
          setServiceOrders(localData.serviceOrders.filter(order => order.clientId === currentUser.id));
          setMessages(localData.messages.filter(message => message.clientId === currentUser.id));
        } else {
          setClients(localData.clients);
          setVehicles(localData.vehicles);
          setServiceOrders(localData.serviceOrders);
          setEmployees(localData.employees);
          setMessages(localData.messages);
        }
        setLogs(localData.logs);
        setIsReady(true);
        return;
      }
      
      try {
        // We load everything for ADMIN / STAFF, but restricted for CLIENT
        if (role === 'CLIENT') {
          const [resClients, resVehicles, resOrders, resMsgs] = await Promise.all([
             supabase.from('clients').select('*').eq('id', currentUser.id),
             supabase.from('vehicles').select('*').eq('client_id', currentUser.id),
             supabase.from('service_orders').select('*').eq('client_id', currentUser.id),
             supabase.from('messages').select('*').eq('client_id', currentUser.id).order('created_at', { ascending: false })
          ]);
          if (resClients.data) setClients(toCamel(resClients.data));
          if (resVehicles.data) setVehicles(toCamel(resVehicles.data));
          if (resOrders.data) setServiceOrders(toCamel(resOrders.data));
          if (resMsgs.data) setMessages(toCamel(resMsgs.data));
        } else {
          const [resClients, resVehicles, resOrders, resEmps, resMsgs] = await Promise.all([
             supabase.from('clients').select('*'),
             supabase.from('vehicles').select('*'),
             supabase.from('service_orders').select('*').order('created_at', { ascending: false }),
             supabase.from('employees').select('*'),
             supabase.from('messages').select('*').order('created_at', { ascending: false })
          ]);
          if (resClients.data) setClients(toCamel(resClients.data));
          if (resVehicles.data) setVehicles(toCamel(resVehicles.data));
          if (resOrders.data) setServiceOrders(toCamel(resOrders.data));
          if (resEmps.data) {
             let loadedEmps = toCamel(resEmps.data);
             // Ensure admin exists
             if (!loadedEmps.find((e: any) => e.id === 'admin1')) {
                loadedEmps.push({ id: 'admin1', name: 'Administrador', login: 'admin', password: '123456', email: 'admin@focarodas.com', role: 'Administrador', active: true });
             }
             setEmployees(loadedEmps);
          }
          if (resMsgs.data) setMessages(toCamel(resMsgs.data));
        }
      } catch (err) {
        console.error("Supabase load error", err);
      }
      
      setIsReady(true);
    }
    loadData();
    
    // Setup Supabase Realtime listeners
    if (role && currentUser && isSupabaseConfigured) {
      const channel = supabase.channel('schema-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, payload => {
           const message = toCamel(payload.new) as Message;
           if (role === 'CLIENT' && message.clientId !== currentUser.id) return;
           if (payload.eventType === 'INSERT') {
             setMessages(prev => upsertById(prev, message));
           } else if (payload.eventType === 'UPDATE') {
             setMessages(prev => prev.map(m => m.id === message.id ? message : m));
           }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'service_orders' }, payload => {
           const order = toCamel(payload.new) as ServiceOrder;
           if (role === 'CLIENT' && order.clientId !== currentUser.id) return;
           if (payload.eventType === 'INSERT') {
             setServiceOrders(prev => upsertById(prev, order));
           } else if (payload.eventType === 'UPDATE') {
             setServiceOrders(prev => prev.map(o => o.id === order.id ? order : o));
           }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, payload => {
           const vehicle = toCamel(payload.new) as Vehicle;
           if (role === 'CLIENT' && vehicle.clientId !== currentUser.id) return;
           if (payload.eventType === 'INSERT') {
             setVehicles(prev => upsertById(prev, vehicle));
           } else if (payload.eventType === 'UPDATE') {
             setVehicles(prev => prev.map(o => o.id === vehicle.id ? vehicle : o));
           }
        })
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [role, currentUser?.id]);

  useEffect(() => {
    if (role !== null) localStorage.setItem('foca_role_v3', role);
    else localStorage.removeItem('foca_role_v3');
    
    if (currentUser !== null) localStorage.setItem('foca_user_v3', JSON.stringify(currentUser));
    else localStorage.removeItem('foca_user_v3');
  }, [role, currentUser]);

  const addLog = (action: string, target: string, type: 'edit' | 'add' | 'alert' | 'delete' | 'info', details?: string, targetId?: string) => {
    const newLog: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUser?.id || 'system',
      userName: currentUser?.name || 'Sistema',
      action,
      target,
      type,
      details,
      targetId,
      createdAt: new Date().toISOString()
    };
    setLogs(prev => [newLog, ...prev]);
    if (!isSupabaseConfigured) {
      updateLocalData(data => ({ ...data, logs: [newLog, ...data.logs] }));
    }
  };

  const loginUser = async (loginUserStr: string, pass: string, panel: 'cliente' | 'funcionario' | 'admin') => {
    const inputLogin = (loginUserStr || '').trim();
    const inputPass = pass || '';

    if (!inputLogin || !inputPass) return { success: false, error: 'Login ou senha inválidos.' };

    try {
      // 1. Admin hardcoded test bypass
      if (panel === 'admin') {
        const testLogin = inputLogin.toLowerCase().replace(/\s+/g, '');
        const testPass = inputPass.toLowerCase().replace(/\s+/g, '');
        if ((testLogin === 'admin' || testLogin === 'focarodas') && (testPass === '123456' || testPass === 'focarodas' || testPass === 'admin')) {
           const adminC = { id: 'admin1', name: 'Administrador', login: 'admin', password: '123456', email: 'admin@focarodas.com', role: 'Administrador', active: true };
           setCurrentUser(adminC);
           setRole('ADMIN');
           return { success: true };
        }
      }

      if (!isSupabaseConfigured) {
        const localData = readLocalData();
        const loginKey = inputLogin.toLowerCase();

        if (panel === 'cliente') {
          const client = localData.clients.find(item =>
            item.login?.toLowerCase() === loginKey || item.email?.toLowerCase() === loginKey
          );

          if (!client || !passwordMatches(client.password, inputPass)) {
            return { success: false, error: 'Usuário não encontrado.' };
          }
          if (client.status === 'Inativo') return { success: false, error: 'Conta inativa.' };

          setCurrentUser(client);
          setRole('CLIENT');
          return { success: true };
        }

        if (panel === 'funcionario' || panel === 'admin') {
          const employee = localData.employees.find(item =>
            item.login?.toLowerCase() === loginKey || item.email?.toLowerCase() === loginKey
          );

          if (!employee || !passwordMatches(employee.password, inputPass)) {
            return { success: false, error: 'Usuário não encontrado.' };
          }
          if (!employee.active) return { success: false, error: 'Conta inativa.' };

          if (panel === 'admin' && employee.role !== 'Administrador' && employee.role !== 'Gerente') {
            return { success: false, error: 'Acesso negado ao painel administrador.' };
          }

          setCurrentUser(employee);
          setRole(panel === 'admin' ? 'ADMIN' : 'STAFF');
          return { success: true };
        }
      }

      // 2. Local test password bypass (as requested "senha: focarodas funcione para teste")
      const isBypass = false;

      let authUserId: string | null = null;

      if (!isBypass) {
        // Real Supabase Auth login
      let loginEmail = authEmailFromLogin(inputLogin);
      if (!inputLogin.includes('@')) {
        const table = panel === 'cliente' ? 'clients' : 'employees';
        const { data: loginRow } = await supabase
          .from(table)
          .select('email')
          .ilike('login', cleanLogin(inputLogin))
          .maybeSingle();
        if (loginRow?.email) loginEmail = String(loginRow.email).trim().toLowerCase();
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: inputPass
        });
        
        if (authError || !authData.user) {
          return { success: false, error: 'Login ou senha inválidos.' };
        }
        authUserId = authData.user.id;
      }

      // 3. Fetch specific role table
      if (panel === 'cliente') {
        const { data, error } = await supabase.from('clients').select('*').eq('id', authUserId).single();
        if (error || !data) return { success: false, error: 'Usuário não encontrado.' };
        
        const mappedData = toCamel(data);
        if (mappedData.status === 'Inativo') return { success: false, error: 'Conta inativa.' };
        
        setCurrentUser(mappedData);
        setRole('CLIENT');
        return { success: true };
      } 
      
      if (panel === 'funcionario' || panel === 'admin') {
        const { data, error } = await supabase.from('employees').select('*').eq('id', authUserId).single();
        if (error || !data) return { success: false, error: 'Usuário não encontrado.' };
        const mappedData = toCamel(data);
        if (!mappedData.active) return { success: false, error: 'Conta inativa.' };
        
        if (panel === 'admin') {
          if (mappedData.role === 'Administrador' || mappedData.role === 'Gerente') {
            setCurrentUser(mappedData);
            setRole('ADMIN');
            return { success: true };
          }
          return { success: false, error: 'Acesso negado ao painel administrador.' };
        } else {
          setCurrentUser(mappedData);
          setRole('STAFF');
          return { success: true };
        }
      }
    } catch(e) {
      console.error(e);
      return { success: false, error: 'Erro de conexão.' };
    }

    return { success: false, error: 'Login ou senha inválidos.' };
  };

  const logout = () => {
    if (isSupabaseConfigured) {
      void supabase.auth.signOut();
    }
    setRole(null);
    setCurrentUser(null);
    setActiveVehicleId(null);
    setVehicles([]);
    setServiceOrders([]);
    setClients([]);
    setMessages([]);
  };

  const addVehicleUpdate = async (
    serviceOrderId: string, 
    status: ServiceStatus, 
    publicMessage: string, 
    internalNote: string, 
    photos: string[],
    deliveryEstimate: string,
    notifyClient: boolean
  ) => {
    const update: ServiceUpdate = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      status,
      publicMessage,
      internalNote,
      photos
    };

    const os = serviceOrders.find(o => o.id === serviceOrderId);
    if (!os) return;
    
    const updatedOs = {
      ...os,
      status,
      deliveryEstimate: deliveryEstimate || os.deliveryEstimate,
      updates: [update, ...(os.updates || [])],
      updatedAt: new Date().toISOString()
    };

    if (!isSupabaseConfigured) {
      updateLocalData(data => ({
        ...data,
        serviceOrders: data.serviceOrders.map(order => order.id === serviceOrderId ? updatedOs : order)
      }));
      setServiceOrders(prev => prev.map(order => order.id === serviceOrderId ? updatedOs : order));
      addLog('alterou o status da OS', `OS #${os.id} -> ${status}`, 'edit', internalNote, os.id);

      if (notifyClient) {
        await sendMessage({
          clientId: updatedOs.clientId,
          senderId: currentUser?.id || 'system',
          senderRole: role || 'STAFF',
          title: `Atualização de OS: ${status}`,
          content: publicMessage || `O status do seu veículo mudou para ${status}.`,
          type: 'info'
        });
      }
      return;
    }
    
    const { error } = await supabase.from('service_orders').update(toSnake(updatedOs)).eq('id', serviceOrderId);
    if (error) {
       console.error("Error updating order", error);
       alert("Erro ao salvar o status no Supabase.");
       return;
    }

    setServiceOrders(prev => prev.map(o => o.id === serviceOrderId ? updatedOs : o));
    addLog('alterou o status da OS', `OS #${os.id} -> ${status}`, 'edit', internalNote, os.id);
    
    if (notifyClient) {
       await sendMessage({
          clientId: updatedOs.clientId,
          senderId: currentUser?.id || 'system',
          senderRole: role || 'STAFF',
          title: `Atualização de OS: ${status}`,
          content: publicMessage || `O status do seu veículo mudou para ${status}.`,
          type: 'info'
       });
    }
  };

  const getVehicleById = (id: string) => vehicles.find(v => v.id === id);
  const getServiceOrderById = (id: string) => serviceOrders.find(v => v.id === id);
  const getClientById = (id: string) => clients.find(c => c.id === id);

  const createClient = async (client: Omit<Client, 'id'>) => {
    try {
      if (!isSupabaseConfigured) {
        const directClient: Client = { ...client, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        updateLocalData(data => ({ ...data, clients: [...data.clients, directClient] }));
        setClients(prev => upsertById(prev, directClient));
        addLog('criou novo cliente', directClient.name, 'add', '', directClient.id);
        return { success: true, client: directClient };
      }

      const result = await apiPost<{ client?: Client }>('/api/admin/create-client', client);
      if (!result.success || !result.client) {
        return { success: false, error: result.error || 'Erro ao salvar cliente.' };
      }

      const savedClient = result.client;
      setClients(prev => upsertById(prev, savedClient));
      addLog('criou novo cliente', savedClient.name, 'add', '', savedClient.id);
      return { success: true, client: savedClient };
    } catch (e: any) {
      console.error(e);
      return { success: false, error: "Erro de conexão ao salvar cliente." };
    }
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    try {
      if (!isSupabaseConfigured) {
        updateLocalData(data => ({
          ...data,
          clients: data.clients.map(client => client.id === id ? { ...client, ...updates } : client)
        }));
        setClients(prev => prev.map(client => client.id === id ? { ...client, ...updates } : client));
        return true;
      }

      const result = await apiPost<{ client?: Client }>('/api/admin/update-client', { id, ...updates });

      if (!result.success || !result.client) {
        alert("Erro ao atualizar cliente: " + (result.error || "Erro desconhecido"));
        return false;
      }
      
      setClients(prev => prev.map(c => c.id === id ? result.client as Client : c));
      return true;
    } catch (e: any) {
      console.error(e);
      alert("Erro de conexão ao atualizar cliente.");
      return false;
    }
  };

  const createVehicle = async (vehicle: Omit<Vehicle, 'id'>) => {
    const newVehicleObj = { ...vehicle, id: crypto.randomUUID(), createdAt: new Date().toISOString() };

    if (!isSupabaseConfigured) {
      updateLocalData(data => ({ ...data, vehicles: [...data.vehicles, newVehicleObj] }));
      setVehicles(prev => upsertById(prev, newVehicleObj));
      addLog('cadastrou um veículo', `${vehicle.model} (${vehicle.plate})`, 'add', '', newVehicleObj.id);
      return newVehicleObj;
    }

    const { data, error } = await supabase.from('vehicles').insert([toSnake(newVehicleObj)]).select().single();
    if (error) {
       console.error("Supabase Error", error);
       if (error.message && error.message.includes("Could not find the table")) {
          alert("ERRO CRÍTICO: A tabela 'vehicles' não existe no Supabase. Por favor, execute o script do arquivo 'supabase-schema-v2.sql' no seu Supabase SQL Editor para criar as tabelas.");
       } else {
          alert("Não foi possível salvar o veículo. Erro: " + error.message);
       }
       return null;
    }
    const savedVehicle = (data ? toCamel(data) : newVehicleObj) as Vehicle;
    setVehicles(prev => upsertById(prev, savedVehicle));
    addLog('cadastrou um veículo', `${vehicle.model} (${vehicle.plate})`, 'add', '', newVehicleObj.id);
    return savedVehicle;
  };

  const updateVehicle = async (id: string, updates: Partial<Vehicle>) => {
    if (!isSupabaseConfigured) {
      updateLocalData(data => ({
        ...data,
        vehicles: data.vehicles.map(vehicle => vehicle.id === id ? { ...vehicle, ...updates } : vehicle)
      }));
      setVehicles(prev => prev.map(vehicle => vehicle.id === id ? { ...vehicle, ...updates } : vehicle));
      return true;
    }

    const { error } = await supabase.from('vehicles').update(toSnake(updates)).eq('id', id);
    if (error) return false;
    setVehicles(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
    return true;
  };

  const createServiceOrder = async (os: Omit<ServiceOrder, 'id' | 'updates'>) => {
    const now = new Date().toISOString();
    const newOSObj: ServiceOrder = { ...os, id: crypto.randomUUID(), updates: [], createdAt: now, updatedAt: now };

    if (!isSupabaseConfigured) {
      updateLocalData(data => ({ ...data, serviceOrders: [...data.serviceOrders, newOSObj] }));
      setServiceOrders(prev => upsertById(prev, newOSObj));
      alert("Ordem criada com sucesso.");
      return newOSObj;
    }

    const { data, error } = await supabase.from('service_orders').insert([toSnake(newOSObj)]).select().single();
    if (error) {
       console.error("Supabase Error", error);
       if (error.message && error.message.includes("Could not find the table")) {
          alert("ERRO CRÍTICO: A tabela 'service_orders' não existe no Supabase. Por favor, execute o script do arquivo 'supabase-schema-v2.sql' no seu Supabase SQL Editor para criar as tabelas.");
       } else {
          alert("Erro ao criar a Ordem de Serviço: " + error.message);
       }
       return null;
    }
    const savedOrder = (data ? toCamel(data) : newOSObj) as ServiceOrder;
    setServiceOrders(prev => upsertById(prev, savedOrder));
    alert("Ordem criada com sucesso.");
    return savedOrder;
  };

  const updateServiceOrder = async (id: string, updates: Partial<ServiceOrder>) => {
    const updatesWithTimestamp = { ...updates, updatedAt: new Date().toISOString() };
    if (!isSupabaseConfigured) {
      updateLocalData(data => ({
        ...data,
        serviceOrders: data.serviceOrders.map(order => order.id === id ? { ...order, ...updatesWithTimestamp } : order)
      }));
      setServiceOrders(prev => prev.map(order => order.id === id ? { ...order, ...updatesWithTimestamp } : order));
      return true;
    }

    const { error } = await supabase.from('service_orders').update(toSnake(updatesWithTimestamp)).eq('id', id);
    if (error) return false;
    setServiceOrders(prev => prev.map(v => v.id === id ? { ...v, ...updatesWithTimestamp } : v));
    return true;
  };

  const createEmployee = async (emp: Omit<Employee, 'id'>) => {
    try {
      const directEmployee: Employee = { ...emp, id: crypto.randomUUID(), createdAt: new Date().toISOString() };

      if (!isSupabaseConfigured) {
        updateLocalData(data => ({ ...data, employees: [...data.employees, directEmployee] }));
        setEmployees(prev => upsertById(prev, directEmployee));
        return { success: true, employee: directEmployee };
      }

      const result = await apiPost<{ employee?: Employee }>('/api/admin/create-employee', emp);

      if (!result.success || !result.employee) {
        console.error("Supabase Error", result.error);
        return { success: false, error: result.error || "Erro ao criar funcionário." };
      }

      const savedEmployee = result.employee;
      setEmployees(prev => upsertById(prev, savedEmployee));
      return { success: true, employee: savedEmployee };
    } catch (e: any) {
      console.error(e);
      return { success: false, error: "Erro inesperado de conexão com o servidor." };
    }
  };

  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    try {
      if (!isSupabaseConfigured) {
        updateLocalData(data => ({
          ...data,
          employees: data.employees.map(employee => employee.id === id ? { ...employee, ...updates } : employee)
        }));
        setEmployees(prev => prev.map(employee => employee.id === id ? { ...employee, ...updates } : employee));
        return true;
      }

      const result = await apiPost<{ employee?: Employee }>('/api/admin/update-employee', { id, ...updates });

      if (!result.success || !result.employee) {
        alert("Erro ao atualizar funcionário: " + (result.error || "Erro desconhecido"));
        return false;
      }
      
      setEmployees(prev => prev.map(e => e.id === id ? result.employee as Employee : e));
      return true;
    } catch (e: any) {
      console.error(e);
      alert("Erro de conexão ao atualizar funcionário.");
      return false;
    }
  };
  
  const sendMessage = async (msg: Omit<Message, 'id' | 'createdAt' | 'read'>) => {
     const newMsg = { ...msg, id: crypto.randomUUID(), createdAt: new Date().toISOString(), read: false };

     if (!isSupabaseConfigured) {
        updateLocalData(data => ({ ...data, messages: [newMsg, ...data.messages] }));
        setMessages(prev => upsertById(prev, newMsg));
        alert("Mensagem enviada com sucesso.");
        return true;
     }

     const { data, error } = await supabase.from('messages').insert([toSnake(newMsg)]).select().single();
     if (error) {
        alert("Erro ao enviar mensagem.");
        return false;
     }
     const savedMessage = (data ? toCamel(data) : newMsg) as Message;
     setMessages(prev => upsertById(prev, savedMessage));
     alert("Mensagem enviada com sucesso.");
     return true;
  };
  
  const markMessageAsRead = async (id: string) => {
     if (!isSupabaseConfigured) {
       updateLocalData(data => ({
         ...data,
         messages: data.messages.map(message => message.id === id ? { ...message, read: true } : message)
       }));
       setMessages(prev => prev.map(message => message.id === id ? { ...message, read: true } : message));
       return;
     }

     const { error } = await supabase.from('messages').update(toSnake({ read: true })).eq('id', id);
     if (error) return;
     setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
  };

  if (!isReady) {
    return <div className="app-container flex items-center justify-center text-white"><div className="w-8 h-8 border-4 border-[#E53935] border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <AppContext.Provider value={{
      vehicles, serviceOrders, clients, employees, logs, settings, role, currentUser, activeVehicleId, messages,
      setRole, setCurrentUser, loginUser, logout,
      addVehicleUpdate, setActiveVehicleId, getVehicleById, getServiceOrderById, getClientById,
      addLog, createClient, updateClient, createVehicle, updateVehicle, createServiceOrder, updateServiceOrder, createEmployee, updateEmployee,
      sendMessage, markMessageAsRead
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppStore must be used within an AppProvider');
  return context;
};
