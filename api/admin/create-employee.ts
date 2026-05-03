import {
  ApiRequest,
  assertServerEnv,
  authEmailForLogin,
  cleanLogin,
  ensureUnique,
  readBody,
  rejectInvalidMethod,
  sendError,
  setCors,
  supabaseAdmin,
  toCamel,
  validateLoginAndPassword
} from '../_utils/supabaseAdmin';

const allowedRoles = new Set(['Administrador', 'Gerente', 'Atendente', 'Tecnico', 'Técnico']);

export default async function handler(req: ApiRequest, res: any) {
  if (rejectInvalidMethod(req, res)) return;
  setCors(res, req);

  try {
    assertServerEnv();
    const body = readBody<any>(req.body);
    const name = String(body.name || '').trim();
    const login = cleanLogin(body.login);
    const password = String(body.password || '');
    const role = body.role === 'Tecnico' ? 'Técnico' : String(body.role || '').trim();
    const active = typeof body.active === 'boolean' ? body.active : true;
    const email = authEmailForLogin(login, body.email);

    if (!name) return sendError(res, 400, 'Nome do funcionario e obrigatorio.');
    const credentialError = validateLoginAndPassword(login, password);
    if (credentialError) return sendError(res, 400, credentialError);
    if (!allowedRoles.has(role)) return sendError(res, 400, 'Cargo do funcionario invalido.');

    const uniqueError = await ensureUnique('employees', login, email);
    if (uniqueError) return sendError(res, 409, uniqueError);

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        login,
        role,
        panel: 'employee'
      }
    });

    if (authError || !authData.user) {
      return sendError(res, 400, authError?.message || 'Nao foi possivel criar o usuario no Supabase Auth.');
    }

    const userId = authData.user.id;
    const employeeRow = {
      id: userId,
      name,
      login,
      email,
      role,
      active,
      avatar: body.avatar || null,
      created_at: new Date().toISOString()
    };

    const { data: employee, error: insertError } = await supabaseAdmin
      .from('employees')
      .insert(employeeRow)
      .select()
      .single();

    if (insertError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return sendError(res, 400, `Usuario Auth criado, mas falhou ao salvar em employees: ${insertError.message}`);
    }

    res.status(200).json({ success: true, employee: toCamel(employee) });
  } catch (error: any) {
    sendError(res, 500, error?.message || 'Erro interno ao criar funcionario.');
  }
}
