import {
  ApiRequest,
  ApiResponse,
  sendError,
  supabaseAdmin
} from './supabaseAdmin';

type AuthorizedEmployee = {
  id: string;
  role: 'Administrador' | 'Gerente';
};

const ADMIN_ROLES = new Set(['Administrador', 'Gerente']);

const readBearerToken = (req: ApiRequest) => {
  const raw = req.headers?.authorization;
  const authorization = Array.isArray(raw) ? raw[0] : raw;
  const [scheme, token] = String(authorization || '').split(' ');
  return scheme?.toLowerCase() === 'bearer' && token ? token : '';
};

export const requireAdmin = async (
  req: ApiRequest,
  res: ApiResponse
): Promise<AuthorizedEmployee | null> => {
  const accessToken = readBearerToken(req);
  if (!accessToken) {
    sendError(res, 401, 'Sessao ausente. Entre novamente para continuar.');
    return null;
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(accessToken);
  const userId = userData.user?.id;
  if (userError || !userId) {
    sendError(res, 401, 'Sessao invalida ou expirada. Entre novamente.');
    return null;
  }

  const { data: employee, error: employeeError } = await supabaseAdmin
    .from('employees')
    .select('id, role, active')
    .eq('id', userId)
    .maybeSingle();

  if (employeeError || !employee?.active || !ADMIN_ROLES.has(String(employee.role))) {
    sendError(res, 403, 'Acesso negado ao recurso administrativo.');
    return null;
  }

  return {
    id: String(employee.id),
    role: employee.role as AuthorizedEmployee['role']
  };
};
