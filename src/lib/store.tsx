import React, { createContext, useContext, useState, useEffect } from 'react';
import { isSupabaseConfigured, supabase } from './supabase';
import { Vehicle, ServiceOrder, Client, UserRole, ServiceStatus, ServiceUpdate, Employee, AuditLog, Settings, Message, Budget, Payment, Notification } from '../types';

type ToastType = 'success' | 'error' | 'warning' | 'info';
type CurrentUser = Client | Employee | { id: string, name: string } | null;
type RealtimePayload = {
  eventType?: 'INSERT' | 'UPDATE' | 'DELETE' | string;
  old?: unknown;
  new?: unknown;
};

let _showToast: (msg: string, type?: ToastType) => void = () => {};
export const setToastFn = (fn: typeof _showToast) => {
  _showToast = fn;
};

const toast = {
  success: (msg: string) => _showToast(msg, 'success'),
  error: (msg: string) => _showToast(msg, 'error'),
  warning: (msg: string) => _showToast(msg, 'warning'),
  info: (msg: string) => _showToast(msg, 'info')
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const toCamel = <T = unknown>(obj: unknown): T => {
  if (Array.isArray(obj)) return obj.map(v => toCamel(v)) as T;
  if (isRecord(obj)) {
    return Object.keys(obj).reduce<Record<string, unknown>>((result, key) => {
      const camelKey = key.replace(/([-_][a-z])/ig, ($1) => $1.toUpperCase().replace('-', '').replace('_', ''));
      result[camelKey] = toCamel(obj[key]);
      return result;
    }, {}) as T;
  }
  return obj as T;
};

const toSnake = (obj: unknown): unknown => {
  if (Array.isArray(obj)) return obj.map(v => toSnake(v));
  if (isRecord(obj)) {
    return Object.keys(obj).reduce<Record<string, unknown>>((result, key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      result[snakeKey] = toSnake(obj[key]);
      return result;
    }, {});
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
  budgets: Budget[];
  payments: Payment[];
  notifications: Notification[];
  settings: Settings;
  role: UserRole;
  currentUser: CurrentUser;
  activeVehicleId: string | null;
  isUsingLocalFallback: boolean;
  dataError: string | null;
}

interface AppContextType extends AppState {
  setRole: (role: UserRole) => void;
  setCurrentUser: (user: CurrentUser) => void;
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
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => Promise<void>;
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
  markNotificationAsRead: (id: string) => Promise<void>;
  createBudget: (budget: Omit<Budget, 'id' | 'createdAt' | 'subtotal' | 'total'>) => Promise<Budget | null>;
  updateBudget: (id: string, budget: Partial<Budget>) => Promise<boolean>;
  createPayment: (payment: Omit<Payment, 'id' | 'createdAt'>) => Promise<Payment | null>;
  updatePayment: (id: string, payment: Partial<Payment>) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LEGACY_SESSION_ROLE_KEY = 'foca_role_v3';
const LEGACY_SESSION_USER_KEY = 'foca_user_v3';
const LEGACY_LOCAL_DATA_KEY = 'foca_local_data_v1';
const LEGACY_SETTINGS_KEY = 'foca_settings';
const clearLegacyLocalPersistence = () => {
  localStorage.removeItem(LEGACY_SESSION_ROLE_KEY);
  localStorage.removeItem(LEGACY_LOCAL_DATA_KEY);
  localStorage.removeItem(LEGACY_SETTINGS_KEY);
  localStorage.removeItem(LEGACY_SESSION_USER_KEY);
};

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

const upsertById = <T extends { id: string }>(items: T[], item: T): T[] => {
  const index = items.findIndex(existing => existing.id === item.id);
  if (index === -1) return [item, ...items];
  const updated = [...items];
  updated[index] = item;
  return updated;
};

const backendUnavailableMessage = () => {
  const protocol = typeof window !== 'undefined' ? window.location.protocol : '';
  if (protocol === 'file:') {
    return 'As APIs da Vercel nao funcionam abrindo o arquivo por file://. Abra pelo deploy da Vercel ou rode localmente com npx vercel dev.';
  }
  return 'Nao foi possivel acessar as APIs do servidor. Verifique se o deploy da Vercel esta ativo ou rode npx vercel dev para testar localmente.';
};

const apiPost = async <T extends object>(url: string, body: object): Promise<T & { success: boolean; error?: string }> => {
  try {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase nao configurado. Salvamento bloqueado para evitar dados locais falsos.' } as T & { success: boolean; error?: string };
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      return { success: false, error: 'Sessao expirada. Entre novamente para continuar.' } as T & { success: boolean; error?: string };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify(body)
    });
    const payload = await response.json().catch(() => ({})) as Partial<T> & { success?: boolean; error?: string };
    if (!response.ok || payload.success === false) {
      return { success: false, error: payload.error || 'Erro ao comunicar com a API.' } as T & { success: boolean; error?: string };
    }
    return payload as T & { success: boolean; error?: string };
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
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings] = useState<Settings>({ darkMode: true });
  
  const [role, setRole] = useState<UserRole>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser>(null);
  const [activeVehicleId, setActiveVehicleId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isUsingLocalFallback, setIsUsingLocalFallback] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const requireSupabase = (action = 'salvar') => {
    if (isSupabaseConfigured) return true;
    const message = `Supabase nao configurado. Nao foi possivel ${action}; dados locais foram bloqueados para manter o banco como fonte unica da verdade.`;
    setDataError(message);
    toast.error(message);
    return false;
  };

  // Load session
  useEffect(() => {
    let cancelled = false;
    async function restoreSession() {
      clearLegacyLocalPersistence();

      if (!isSupabaseConfigured) {
        setIsUsingLocalFallback(false);
        setDataError('Supabase nao configurado. O app bloqueou o modo local para evitar salvamentos que nao aparecem em outros dispositivos.');
        return;
      }

      const { data, error } = await supabase.auth.getUser();
      const authUserId = data.user?.id;
      if (!authUserId) {
        if (error) {
          console.warn('Supabase session restore failed', error);
        }
        return;
      }

      const [{ data: employeeRow }, { data: clientRow }] = await Promise.all([
        supabase.from('employees').select('*').eq('id', authUserId).maybeSingle(),
        supabase.from('clients').select('*').eq('id', authUserId).maybeSingle()
      ]);

      if (cancelled) return;

      if (employeeRow) {
        const employee = toCamel<Employee>(employeeRow);
        setCurrentUser(employee);
        setRole(employee.role === 'Administrador' || employee.role === 'Gerente' ? 'ADMIN' : 'STAFF');
        return;
      }

      if (clientRow) {
        setCurrentUser(toCamel<Client>(clientRow));
        setRole('CLIENT');
      }
    }
    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch data from Supabase
  useEffect(() => {
    async function loadData() {
      if (!role || !currentUser) {
        setIsReady(true);
        return;
      }

      if (!isSupabaseConfigured) {
        setIsUsingLocalFallback(false);
        setDataError('Supabase nao configurado. Nenhum dado operacional sera lido ou salvo localmente.');
        setIsReady(true);
        return;
      }
      
      try {
        setIsUsingLocalFallback(false);
        setDataError(null);
        // We load everything for ADMIN / STAFF, but restricted for CLIENT
        if (role === 'CLIENT') {
          const [resClients, resVehicles, resOrders, resMsgs, resBudgets, resPayments, resNotifications] = await Promise.all([
             supabase.from('clients').select('*').eq('id', currentUser.id),
             supabase.from('vehicles').select('*').eq('client_id', currentUser.id),
             supabase.from('service_orders').select('*').eq('client_id', currentUser.id),
             supabase.from('messages').select('*').eq('client_id', currentUser.id).order('created_at', { ascending: false }),
             supabase.from('budgets').select('*').eq('client_id', currentUser.id).in('status', ['Enviado', 'Aprovado']).order('created_at', { ascending: false }),
             supabase.from('payments').select('*').eq('client_id', currentUser.id).order('created_at', { ascending: false }),
             supabase.from('notifications').select('*').or(`client_id.eq.${currentUser.id},client_id.is.null`).order('created_at', { ascending: false })
          ]);
          const failed = [resClients, resVehicles, resOrders, resMsgs, resBudgets, resPayments, resNotifications].find(result => result.error);
          if (failed?.error) throw failed.error;
          if (resClients.data) setClients(toCamel<Client[]>(resClients.data));
          if (resVehicles.data) setVehicles(toCamel<Vehicle[]>(resVehicles.data));
          if (resOrders.data) setServiceOrders(toCamel<ServiceOrder[]>(resOrders.data));
          if (resMsgs.data) setMessages(toCamel<Message[]>(resMsgs.data));
          if (resBudgets.data) setBudgets(toCamel<Budget[]>(resBudgets.data));
          if (resPayments.data) setPayments(toCamel<Payment[]>(resPayments.data));
          if (resNotifications.data) setNotifications(toCamel<Notification[]>(resNotifications.data));
        } else {
          const [resClients, resVehicles, resOrders, resEmps, resMsgs, resLogs, resBudgets, resPayments, resNotifications] = await Promise.all([
             supabase.from('clients').select('*'),
             supabase.from('vehicles').select('*'),
             supabase.from('service_orders').select('*').order('created_at', { ascending: false }),
             supabase.from('employees').select('*'),
             supabase.from('messages').select('*').order('created_at', { ascending: false }),
             supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200),
             supabase.from('budgets').select('*').order('created_at', { ascending: false }),
             supabase.from('payments').select('*').order('created_at', { ascending: false }),
             supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(100)
          ]);
          const failed = [resClients, resVehicles, resOrders, resEmps, resMsgs, resLogs, resBudgets, resPayments, resNotifications].find(result => result.error);
          if (failed?.error) throw failed.error;
          if (resClients.data) setClients(toCamel<Client[]>(resClients.data));
          if (resVehicles.data) setVehicles(toCamel<Vehicle[]>(resVehicles.data));
          if (resOrders.data) setServiceOrders(toCamel<ServiceOrder[]>(resOrders.data));
          if (resEmps.data) setEmployees(toCamel<Employee[]>(resEmps.data));
          if (resMsgs.data) setMessages(toCamel<Message[]>(resMsgs.data));
          if (resLogs.data) setLogs(toCamel<AuditLog[]>(resLogs.data));
          if (resBudgets.data) setBudgets(toCamel<Budget[]>(resBudgets.data));
          if (resPayments.data) setPayments(toCamel<Payment[]>(resPayments.data));
          if (resNotifications.data) setNotifications(toCamel<Notification[]>(resNotifications.data));
        }
      } catch (err) {
        console.error("Supabase load error", err);
        setDataError(`Falha ao carregar dados do Supabase: ${err instanceof Error ? err.message : 'verifique schema, RLS e variaveis de ambiente.'}`);
      }
      
      setIsReady(true);
    }
    loadData();
    
    // Setup Supabase Realtime listeners
    if (role && currentUser && isSupabaseConfigured) {
      const applyRealtimeChange = <T extends { id: string }>(setter: React.Dispatch<React.SetStateAction<T[]>>, payload: RealtimePayload, rowFilter?: (row: T) => boolean) => {
        const raw = payload.eventType === 'DELETE' ? payload.old : payload.new;
        const row = toCamel(raw) as T;
        if (!row?.id || (rowFilter && !rowFilter(row))) return;
        if (payload.eventType === 'DELETE') setter(prev => prev.filter(item => item.id !== row.id));
        else setter(prev => upsertById(prev, row));
      };

      const channel = supabase.channel('schema-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, payload => {
           applyRealtimeChange<Message>(setMessages, payload, message => role !== 'CLIENT' || message.clientId === currentUser.id);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'service_orders' }, payload => {
           applyRealtimeChange<ServiceOrder>(setServiceOrders, payload, order => role !== 'CLIENT' || order.clientId === currentUser.id);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, payload => {
           applyRealtimeChange<Vehicle>(setVehicles, payload, vehicle => role !== 'CLIENT' || vehicle.clientId === currentUser.id);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, payload => {
           applyRealtimeChange<Client>(setClients, payload, client => role !== 'CLIENT' || client.id === currentUser.id);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'budgets' }, payload => {
           applyRealtimeChange<Budget>(setBudgets, payload, budget => role !== 'CLIENT' || budget.clientId === currentUser.id);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, payload => {
           applyRealtimeChange<Payment>(setPayments, payload, payment => role !== 'CLIENT' || payment.clientId === currentUser.id);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, payload => {
           applyRealtimeChange<Notification>(setNotifications, payload, notification => role !== 'CLIENT' || !notification.clientId || notification.clientId === currentUser.id);
        })
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [role, currentUser]);

  const addLog = (action: string, target: string, type: 'edit' | 'add' | 'alert' | 'delete' | 'info', details?: string, targetId?: string) => {
    const newLog: AuditLog = {
      id: crypto.randomUUID(),
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
      setLogs(prev => prev.filter(log => log.id !== newLog.id));
      setDataError('Supabase nao configurado. Log de auditoria nao foi salvo.');
      return;
    }
    void supabase.from('audit_logs').insert([toSnake(newLog)]).then(({ error }) => {
      if (error) {
        console.error('Audit log save failed', error);
        setLogs(prev => prev.filter(log => log.id !== newLog.id));
        setDataError(`Falha ao salvar log de auditoria no Supabase: ${error.message}`);
      }
    });
  };

  const addNotification = async (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      read: false
    };

    if (!isSupabaseConfigured) {
      setDataError('Supabase nao configurado. Notificacao nao foi salva.');
      return;
    }

    const { data, error } = await supabase.from('notifications').insert([toSnake(newNotification)]).select().single();
    if (error) {
      console.error('Notification save failed', error);
      return;
    }
    setNotifications(prev => upsertById(prev, toCamel(data) as Notification));
  };

  const loginUser = async (loginUserStr: string, pass: string, panel: 'cliente' | 'funcionario' | 'admin') => {
    const inputLogin = (loginUserStr || '').trim();
    const inputPass = pass || '';

    if (!inputLogin || !inputPass) return { success: false, error: 'Login ou senha inválidos.' };

    try {
      if (!isSupabaseConfigured) {
        return { success: false, error: 'Supabase nao configurado. O login local foi removido para evitar dados que nao sincronizam entre dispositivos.' };
      }


      let authUserId: string | null = null;

      // 2. Real Supabase Auth login
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

      // 3. Fetch specific role table
      if (panel === 'cliente') {
        const { data, error } = await supabase.from('clients').select('*').eq('id', authUserId).single();
        if (error || !data) return { success: false, error: 'Usuário não encontrado.' };
        
        const mappedData = toCamel<Client>(data);
        if (mappedData.status === 'Inativo') return { success: false, error: 'Conta inativa.' };
        
        setCurrentUser(mappedData);
        setRole('CLIENT');
        return { success: true };
      } 
      
      if (panel === 'funcionario' || panel === 'admin') {
        const { data, error } = await supabase.from('employees').select('*').eq('id', authUserId).single();
        if (error || !data) return { success: false, error: 'Usuário não encontrado.' };
        const mappedData = toCamel<Employee>(data);
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
    setBudgets([]);
    setPayments([]);
    setNotifications([]);
    setLogs([]);
    setDataError(null);
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
      id: crypto.randomUUID(),
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
      photos: [...(photos || []), ...(os.photos || [])],
      updates: [update, ...(os.updates || [])],
      updatedAt: new Date().toISOString()
    };

    if (!isSupabaseConfigured) {
      throw new Error('Supabase nao configurado. Atualizacao bloqueada para evitar salvamento local.');
    }

    
    const { data, error } = await supabase.from('service_orders').update(toSnake(updatedOs)).eq('id', serviceOrderId).select().single();
    if (error) {
       console.error("Error updating order", error);
       throw new Error("Erro ao salvar o status no Supabase: " + error.message);
    }

    const savedOrder = (data ? toCamel(data) : updatedOs) as ServiceOrder;
    setServiceOrders(prev => prev.map(o => o.id === serviceOrderId ? savedOrder : o));
    addLog('alterou o status da OS', `OS #${os.id} -> ${status}`, 'edit', internalNote, os.id);
    if (status === 'Pronto' || status === 'Cancelado') {
      await addNotification({
        clientId: updatedOs.clientId,
        serviceOrderId,
        title: `OS ${status}`,
        message: publicMessage || `A ordem de serviço mudou para ${status}.`,
        type: status === 'Pronto' ? 'SUCCESS' : 'WARNING'
      });
    }
    
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
        return { success: false, error: 'Supabase nao configurado. Cliente nao foi salvo.' };
      }

      const result = await apiPost<{ client?: Client }>('/api/admin/create-client', client);
      if (!result.success || !result.client) {
        return { success: false, error: result.error || 'Erro ao salvar cliente.' };
      }

      const savedClient = result.client;
      setClients(prev => upsertById(prev, savedClient));
      addLog('criou novo cliente', savedClient.name, 'add', '', savedClient.id);
      return { success: true, client: savedClient };
    } catch (e: unknown) {
      console.error(e);
      return { success: false, error: "Erro de conexão ao salvar cliente." };
    }
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    try {
      if (!isSupabaseConfigured) {
        setDataError('Supabase nao configurado. Cliente nao foi atualizado.');
        return false;
      }

      const result = await apiPost<{ client?: Client }>('/api/admin/update-client', { id, ...updates });

      if (!result.success || !result.client) {
        toast.error("Erro ao atualizar cliente: " + (result.error || "Erro desconhecido"));
        return false;
      }
      
      setClients(prev => prev.map(c => c.id === id ? result.client as Client : c));
      return true;
    } catch (e: unknown) {
      console.error(e);
      toast.error("Erro de conexão ao atualizar cliente.");
      return false;
    }
  };

  const createVehicle = async (vehicle: Omit<Vehicle, 'id'>) => {
    if (!requireSupabase('salvar o veiculo')) return null;

    const newVehicleObj = { ...vehicle, id: crypto.randomUUID(), createdAt: new Date().toISOString() };

    const { data, error } = await supabase.from('vehicles').insert([toSnake(newVehicleObj)]).select().single();
    if (error) {
       console.error("Supabase Error", error);
       if (error.message && error.message.includes("Could not find the table")) {
          toast.error("ERRO CRÍTICO: A tabela 'vehicles' não existe no Supabase. Execute o script 'supabase-schema-v2.sql' no Supabase SQL Editor.");
       } else {
          toast.error("Não foi possível salvar o veículo. Erro: " + error.message);
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
      setDataError('Supabase nao configurado. Veiculo nao foi atualizado.');
      return false;
    }

    const { data, error } = await supabase.from('vehicles').update(toSnake(updates)).eq('id', id).select().single();
    if (error) {
      toast.error("Erro ao atualizar veiculo: " + error.message);
      return false;
    }
    const savedVehicle = (data ? toCamel(data) : { ...vehicles.find(v => v.id === id), ...updates }) as Vehicle;
    setVehicles(prev => prev.map(v => v.id === id ? savedVehicle : v));
    addLog('editou um veiculo', `${savedVehicle.model} (${savedVehicle.plate})`, 'edit', '', id);
    return true;
  };

  const createServiceOrder = async (os: Omit<ServiceOrder, 'id' | 'updates'>) => {
    const now = new Date().toISOString();
    const newOSObj: ServiceOrder = { ...os, id: crypto.randomUUID(), updates: [], createdAt: now, updatedAt: now };

    if (!isSupabaseConfigured) {
      setDataError('Supabase nao configurado. Ordem de servico nao foi salva.');
      return null;
    }

    const { data, error } = await supabase.from('service_orders').insert([toSnake(newOSObj)]).select().single();
    if (error) {
       console.error("Supabase Error", error);
       if (error.message && error.message.includes("Could not find the table")) {
          toast.error("ERRO CRÍTICO: A tabela 'service_orders' não existe no Supabase. Execute o script 'supabase-schema-v2.sql' no Supabase SQL Editor.");
       } else {
          toast.error("Erro ao criar a Ordem de Serviço: " + error.message);
       }
       return null;
    }
    const savedOrder = (data ? toCamel(data) : newOSObj) as ServiceOrder;
    setServiceOrders(prev => upsertById(prev, savedOrder));
    addLog('criou uma OS', `OS #${savedOrder.id}`, 'add', savedOrder.servicesFull || '', savedOrder.id);
    await addNotification({
      clientId: savedOrder.clientId,
      serviceOrderId: savedOrder.id,
      title: 'Nova ordem de servico',
      message: `Sua ordem de servico foi cadastrada com status ${savedOrder.status}.`,
      type: 'INFO'
    });
    return savedOrder;
  };

  const updateServiceOrder = async (id: string, updates: Partial<ServiceOrder>) => {
    const updatesWithTimestamp = { ...updates, updatedAt: new Date().toISOString() };
    if (!isSupabaseConfigured) {
      setDataError('Supabase nao configurado. Ordem de servico nao foi atualizada.');
      return false;
    }

    const { data, error } = await supabase.from('service_orders').update(toSnake(updatesWithTimestamp)).eq('id', id).select().single();
    if (error) {
      toast.error("Erro ao atualizar OS: " + error.message);
      return false;
    }
    const savedOrder = (data ? toCamel(data) : { ...serviceOrders.find(v => v.id === id), ...updatesWithTimestamp }) as ServiceOrder;
    setServiceOrders(prev => prev.map(v => v.id === id ? savedOrder : v));
    addLog('editou uma OS', `OS #${id}`, 'edit', '', id);
    return true;
  };

  const createEmployee = async (emp: Omit<Employee, 'id'>) => {
    try {
      if (!isSupabaseConfigured) {
        return { success: false, error: 'Supabase nao configurado. Funcionario nao foi salvo.' };
      }

      const result = await apiPost<{ employee?: Employee }>('/api/admin/create-employee', emp);

      if (!result.success || !result.employee) {
        console.error("Supabase Error", result.error);
        return { success: false, error: result.error || "Erro ao criar funcionário." };
      }

      const savedEmployee = result.employee;
      setEmployees(prev => upsertById(prev, savedEmployee));
      return { success: true, employee: savedEmployee };
    } catch (e: unknown) {
      console.error(e);
      return { success: false, error: "Erro inesperado de conexão com o servidor." };
    }
  };

  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    try {
      if (!isSupabaseConfigured) {
        setDataError('Supabase nao configurado. Funcionario nao foi atualizado.');
        return false;
      }

      const result = await apiPost<{ employee?: Employee }>('/api/admin/update-employee', { id, ...updates });

      if (!result.success || !result.employee) {
        toast.error("Erro ao atualizar funcionário: " + (result.error || "Erro desconhecido"));
        return false;
      }
      
      setEmployees(prev => prev.map(e => e.id === id ? result.employee as Employee : e));
      return true;
    } catch (e: unknown) {
      console.error(e);
      toast.error("Erro de conexão ao atualizar funcionário.");
      return false;
    }
  };
  
  const sendMessage = async (msg: Omit<Message, 'id' | 'createdAt' | 'read'>) => {
     const newMsg = { ...msg, id: crypto.randomUUID(), createdAt: new Date().toISOString(), read: false };

     if (!isSupabaseConfigured) {
        setDataError('Supabase nao configurado. Mensagem nao foi enviada.');
        return false;
     }

     const { data, error } = await supabase.from('messages').insert([toSnake(newMsg)]).select().single();
     if (error) {
        toast.error("Erro ao enviar mensagem: " + error.message);
        return false;
     }
     const savedMessage = (data ? toCamel(data) : newMsg) as Message;
     setMessages(prev => upsertById(prev, savedMessage));
     addLog('enviou mensagem ao cliente', savedMessage.title, 'info', savedMessage.content, savedMessage.clientId);
     await addNotification({
       clientId: savedMessage.clientId,
       title: savedMessage.title,
       message: savedMessage.content,
       type: savedMessage.type === 'error' ? 'ERROR' : savedMessage.type === 'warning' ? 'WARNING' : savedMessage.type === 'success' ? 'SUCCESS' : 'INFO'
     });
     toast.success("Mensagem enviada com sucesso.");
     return true;
  };
  
  const markMessageAsRead = async (id: string) => {
     if (!isSupabaseConfigured) {
       setDataError('Supabase nao configurado. Leitura da mensagem nao foi salva.');
       return;
     }

     const { error } = await supabase.from('messages').update(toSnake({ read: true })).eq('id', id);
     if (error) return;
     setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
  };

  const markNotificationAsRead = async (id: string) => {
    if (!isSupabaseConfigured) {
      setDataError('Supabase nao configurado. Leitura da notificacao nao foi salva.');
      return;
    }
    const { error } = await supabase.from('notifications').update(toSnake({ read: true })).eq('id', id);
    if (!error) setNotifications(prev => prev.map(notification => notification.id === id ? { ...notification, read: true } : notification));
  };

  const computeBudgetTotals = (budget: Omit<Budget, 'id' | 'createdAt' | 'subtotal' | 'total'> | Partial<Budget>) => {
    const items = budget.items || [];
    const subtotal = items.reduce((sum, item) => sum + Number(item.total || Number(item.quantity || 0) * Number(item.unitPrice || 0)), 0);
    const discount = Number(budget.discount || 0);
    return { subtotal, total: Math.max(0, subtotal - discount) };
  };

  const createBudget = async (budget: Omit<Budget, 'id' | 'createdAt' | 'subtotal' | 'total'>) => {
    const totals = computeBudgetTotals(budget);
    const newBudget: Budget = {
      ...budget,
      ...totals,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };

    if (!isSupabaseConfigured) {
      setDataError('Supabase nao configurado. Orcamento nao foi salvo.');
      return null;
    }

    const { data, error } = await supabase.from('budgets').insert([toSnake(newBudget)]).select().single();
    if (error) {
      toast.error("Erro ao criar orçamento: " + error.message);
      return null;
    }
    const savedBudget = toCamel(data) as Budget;
    if (savedBudget.items.length > 0) {
      const { error: itemsError } = await supabase.from('budget_items').insert(
        savedBudget.items.map(item => toSnake({ ...item, budgetId: savedBudget.id }))
      );
      if (itemsError) console.error('Budget items save failed', itemsError);
    }
    setBudgets(prev => upsertById(prev, savedBudget));
    addLog('criou orçamento', `Orçamento #${savedBudget.id}`, 'add', '', savedBudget.id);
    return savedBudget;
  };

  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    const totals = updates.items || updates.discount !== undefined ? computeBudgetTotals({ ...budgets.find(b => b.id === id), ...updates }) : {};
    const payload = { ...updates, ...totals, updatedAt: new Date().toISOString() };
    if (!isSupabaseConfigured) {
      setDataError('Supabase nao configurado. Orcamento nao foi atualizado.');
      return false;
    }
    const { data, error } = await supabase.from('budgets').update(toSnake(payload)).eq('id', id).select().single();
    if (error) {
      toast.error("Erro ao atualizar orçamento: " + error.message);
      return false;
    }
    setBudgets(prev => prev.map(budget => budget.id === id ? toCamel(data) as Budget : budget));
    return true;
  };

  const createPayment = async (payment: Omit<Payment, 'id' | 'createdAt'>) => {
    const newPayment: Payment = {
      ...payment,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };

    if (!isSupabaseConfigured) {
      setDataError('Supabase nao configurado. Pagamento nao foi salvo.');
      return null;
    }

    const { data, error } = await supabase.from('payments').insert([toSnake(newPayment)]).select().single();
    if (error) {
      toast.error("Erro ao registrar pagamento: " + error.message);
      return null;
    }
    const savedPayment = toCamel(data) as Payment;
    setPayments(prev => upsertById(prev, savedPayment));
    addLog('registrou pagamento', `Pagamento #${savedPayment.id}`, 'add', String(savedPayment.amount), savedPayment.id);
    return savedPayment;
  };

  const updatePayment = async (id: string, updates: Partial<Payment>) => {
    const payload = { ...updates, updatedAt: new Date().toISOString() };
    if (!isSupabaseConfigured) {
      setDataError('Supabase nao configurado. Pagamento nao foi atualizado.');
      return false;
    }
    const { data, error } = await supabase.from('payments').update(toSnake(payload)).eq('id', id).select().single();
    if (error) {
      toast.error("Erro ao atualizar pagamento: " + error.message);
      return false;
    }
    setPayments(prev => prev.map(payment => payment.id === id ? toCamel(data) as Payment : payment));
    return true;
  };

  if (!isReady) {
    return <div className="app-container flex items-center justify-center text-white"><div className="w-8 h-8 border-4 border-[#E53935] border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <AppContext.Provider value={{
      vehicles, serviceOrders, clients, employees, logs, settings, role, currentUser, activeVehicleId, messages,
      budgets, payments, notifications, isUsingLocalFallback, dataError,
      setRole, setCurrentUser, loginUser, logout,
      addVehicleUpdate, setActiveVehicleId, getVehicleById, getServiceOrderById, getClientById,
      addLog, addNotification, createClient, updateClient, createVehicle, updateVehicle, createServiceOrder, updateServiceOrder, createEmployee, updateEmployee,
      sendMessage, markMessageAsRead, markNotificationAsRead, createBudget, updateBudget, createPayment, updatePayment
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
