import { createClient } from '@supabase/supabase-js';

export type ApiResponse = {
  setHeader: (name: string, value: string) => void;
  status: (code: number) => { json: (body: unknown) => void; end?: () => void };
};

export type ApiRequest = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
};

export const cleanLogin = (value: string) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9._-]/g, '');

export const authEmailForLogin = (login: string, email?: string) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (normalizedEmail) return normalizedEmail;
  return `${cleanLogin(login).replace(/[^a-z0-9]/g, '')}@focarodas.com`;
};

export const toCamel = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(item => toCamel(item));
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/([-_][a-z])/gi, match => match.toUpperCase().replace('-', '').replace('_', ''));
      result[camelKey] = toCamel(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
};

const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '')
  .replace(/\/rest\/v1\/?$/, '')
  .replace(/\/$/, '');

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  serviceRoleKey || 'placeholder',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export const assertServerEnv = () => {
  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL ou VITE_SUPABASE_URL nao configurada.');
  }
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY nao configurada.');
  }
};

const DEFAULT_ALLOWED_ORIGINS = [
  'https://focarodas-app2.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

export const setCors = (res: ApiResponse, req?: ApiRequest) => {
  const originHeader = req?.headers?.origin;
  const origin = Array.isArray(originHeader) ? originHeader[0] || '' : originHeader || '';
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
  const originAllowList = allowedOrigins.length > 0 ? allowedOrigins : DEFAULT_ALLOWED_ORIGINS;
  const allowedOrigin = originAllowList.includes(origin) ? origin : originAllowList[0];
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Vary', 'Origin');
};

export const rejectInvalidMethod = (req: ApiRequest, res: ApiResponse) => {
  setCors(res, req);
  if (req.method === 'OPTIONS') {
    res.status(204).end?.();
    return true;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Metodo nao permitido.' });
    return true;
  }
  return false;
};

export const readBody = <T extends Record<string, any>>(body: unknown): T => {
  if (typeof body === 'string') return JSON.parse(body || '{}') as T;
  return (body || {}) as T;
};

export const sendError = (res: ApiResponse, code: number, error: string) => {
  res.status(code).json({ success: false, error });
};

export const validateLoginAndPassword = (login: string, password?: string, requirePassword = true) => {
  const normalizedLogin = cleanLogin(login);
  if (normalizedLogin.length < 3) return 'Login deve ter pelo menos 3 caracteres validos.';
  if (requirePassword && String(password || '').length < 6) return 'Senha deve ter pelo menos 6 caracteres.';
  if (!requirePassword && password && String(password).length < 6) return 'Senha deve ter pelo menos 6 caracteres.';
  return '';
};

export const ensureUnique = async (
  table: 'clients' | 'employees',
  login: string,
  email: string,
  ignoreId?: string
) => {
  const normalizedLogin = cleanLogin(login);
  const normalizedEmail = email.trim().toLowerCase();

  const loginQuery = supabaseAdmin.from(table).select('id').ilike('login', normalizedLogin).limit(1);
  const { data: loginRows, error: loginError } = ignoreId
    ? await loginQuery.neq('id', ignoreId)
    : await loginQuery;

  if (loginError) throw loginError;
  if (loginRows?.length) return 'Este login ja esta cadastrado.';

  const emailQuery = supabaseAdmin.from(table).select('id').ilike('email', normalizedEmail).limit(1);
  const { data: emailRows, error: emailError } = ignoreId
    ? await emailQuery.neq('id', ignoreId)
    : await emailQuery;

  if (emailError) throw emailError;
  if (emailRows?.length) return 'Este e-mail ja esta cadastrado.';

  return '';
};
