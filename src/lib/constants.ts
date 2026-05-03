import { ServiceStatus } from '../types';

export const STATUS_SEQUENCE: ServiceStatus[] = [
  'Recebido',
  'Em análise',
  'Aguardando aprovação',
  'Aprovado',
  'Aguardando peças',
  'Em reparo',
  'Pintura',
  'Alinhamento/Balanceamento',
  'Pronto',
  'Finalizado',
  'Retirada',
  'Cancelado'
];
