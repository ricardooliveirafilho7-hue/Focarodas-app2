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
  setCors(res);

  try {
    assertServerEnv();
    const body = readBody<any>(req.body);
    const id = String(body.id || '').trim();
    if (!id) return sendError(res, 400, 'ID do funcionario e obrigatorio.');

    const { data: current, error: currentError } = await supabaseAdmin
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();

    if (currentError || !current) return sendError(res, 404, 'Funcionario nao encontrado.');

    const name = body.name !== undefined ? String(body.name || '').trim() : current.name;
    const login = body.login !== undefined ? cleanLogin(body.login) : current.login;
    const role = body.role !== undefined
      ? (body.role === 'Tecnico' ? 'Técnico' : String(body.role || '').trim())
      : current.role;
    const active = typeof body.active === 'boolean' ? body.active : current.active;
    const email = body.email !== undefined || body.login !== undefined
      ? authEmailForLogin(login, body.email)
      : current.email;
    const password = body.password ? String(body.password) : '';

    if (!name) return sendError(res, 400, 'Nome do funcionario e obrigatorio.');
    const credentialError = validateLoginAndPassword(login, password, false);
    if (credentialError) return sendError(res, 400, credentialError);
    if (!allowedRoles.has(role)) return sendError(res, 400, 'Cargo do funcionario invalido.');

    const uniqueError = await ensureUnique('employees', login, email, id);
    if (uniqueError) return sendError(res, 409, uniqueError);

    const authUpdates: any = {
      email,
      user_metadata: {
        name,
        login,
        role,
        panel: 'employee'
      }
    };
    if (password) authUpdates.password = password;

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, authUpdates);
    if (authError) return sendError(res, 400, authError.message || 'Nao foi possivel atualizar o usuario no Auth.');

    const updateRow = {
      name,
      login,
      email,
      role,
      active,
      avatar: body.avatar ?? current.avatar
    };

    const { data: employee, error: updateError } = await supabaseAdmin
      .from('employees')
      .update(updateRow)
      .eq('id', id)
      .select()
      .single();

    if (updateError) return sendError(res, 400, `Auth atualizado, mas falhou ao salvar em employees: ${updateError.message}`);

    res.status(200).json({ success: true, employee: toCamel(employee) });
  } catch (error: any) {
    sendError(res, 500, error?.message || 'Erro interno ao atualizar funcionario.');
  }
}
