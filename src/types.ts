export type UserRole = 'ADMIN' | 'STAFF' | 'CLIENT' | null;

export type EmployeeRole = 'Administrador' | 'Gerente' | 'Atendente' | 'Técnico';

export type ServiceStatus = 
  | 'Recebido' 
  | 'Em análise' 
  | 'Aguardando aprovação' 
  | 'Aprovado' 
  | 'Aguardando peças' 
  | 'Em reparo' 
  | 'Pintura' 
  | 'Alinhamento/Balanceamento' 
  | 'Pronto' 
  | 'Finalizado' 
  | 'Retirada' 
  | 'Cancelado';

export type Priority = 'Baixa' | 'Normal' | 'Alta' | 'Urgente';

export interface ServiceUpdate {
  id: string;
  date: string;
  status: ServiceStatus;
  publicMessage?: string;
  internalNote?: string;
  photos?: string[];
  publicPhotos?: string[];
  updatedBy?: string;
}

export interface Vehicle {
  id: string;
  clientId: string;
  brand?: string;
  model: string;
  plate: string;
  year?: string;
  color: string;
  mileage?: string;
  photo?: string;
  observations?: string;
  generalState?: string;
  tiresState?: string;
  wheelsState?: string;
  damage?: string;
  createdAt?: string;
}

export interface ServiceOrder {
  id: string;
  shortId?: string;
  clientId: string;
  vehicleId: string;
  title?: string;
  description?: string;
  status: ServiceStatus;
  priority?: Priority;
  servicesFull?: string;
  observations?: string;
  publicNotes?: string;
  internalNotes?: string;
  technicianId?: string;
  createdAt?: string;
  updatedAt?: string;
  deliveryEstimate: string;
  finishedAt?: string;
  updates: ServiceUpdate[];
  photos?: string[];
}

export interface Client {
  id: string;
  name: string;
  login?: string;
  password?: string;
  phone: string;
  email?: string;
  address?: string;
  observations?: string;
  status?: 'Ativo' | 'Aguardando' | 'Inativo';
  createdAt?: string;
}

export interface Employee {
  id: string;
  name: string;
  login?: string;
  password?: string;
  email?: string;
  role: EmployeeRole;
  active: boolean;
  avatar?: string;
  createdAt?: string;
}

export interface BudgetItem {
  id: string;
  description: string;
  type: 'Peça' | 'Serviço' | 'Mão de obra' | 'Outro';
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Budget {
  id: string;
  serviceOrderId: string;
  clientId: string;
  vehicleId: string;
  items: BudgetItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: 'Rascunho' | 'Enviado' | 'Aprovado' | 'Recusado';
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  updatedAt?: string;
}

export interface Payment {
  id: string;
  serviceOrderId?: string;
  budgetId?: string;
  clientId: string;
  amount: number;
  method: 'Dinheiro' | 'Pix' | 'Cartao' | 'Boleto' | 'Transferencia' | 'Outro';
  status: 'Pendente' | 'Parcial' | 'Pago' | 'Cancelado';
  paidAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Notification {
  id: string;
  userId?: string;
  clientId?: string;
  serviceOrderId?: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  target: string;
  targetId?: string;
  type: 'edit' | 'add' | 'alert' | 'delete' | 'info';
  details?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  clientId: string;
  senderId: string;
  senderRole: string;
  title: string;
  content: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

export interface Settings {
  companyName?: string;
  companyPhone?: string;
  darkMode: boolean;
}
