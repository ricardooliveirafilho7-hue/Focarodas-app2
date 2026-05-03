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

const allowedStatuses = new Set(['Ativo', 'Aguardando', 'Inativo']);

export default async function handler(req: ApiRequest, res: any) {
  if (rejectInvalidMethod(req, res)) return;
  setCors(res, req);

  try {
    assertServerEnv();
    const body = readBody<any>(req.body);
    const id = String(body.id || '').trim();
    if (!id) return sendError(res, 400, 'ID do cliente e obrigatorio.');

    const { data: current, error: currentError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (currentError || !current) return sendError(res, 404, 'Cliente nao encontrado.');

    const name = body.name !== undefined ? String(body.name || '').trim() : current.name;
    const phone = body.phone !== undefined ? String(body.phone || '').trim() : current.phone;
    const login = body.login !== undefined ? cleanLogin(body.login) : current.login;
    const email = body.email !== undefined || body.login !== undefined
      ? authEmailForLogin(login, body.email)
      : current.email;
    const status = body.status !== undefined
      ? (allowedStatuses.has(body.status) ? body.status : current.status)
      : current.status;
    const password = body.password ? String(body.password) : '';

    if (!name) return sendError(res, 400, 'Nome do cliente e obrigatorio.');
    if (!phone) return sendError(res, 400, 'Telefone do cliente e obrigatorio.');
    const credentialError = validateLoginAndPassword(login, password, false);
    if (credentialError) return sendError(res, 400, credentialError);

    const uniqueError = await ensureUnique('clients', login, email, id);
    if (uniqueError) return sendError(res, 409, uniqueError);

    const authUpdates: any = {
      email,
      user_metadata: {
        name,
        login,
        panel: 'client'
      }
    };
    if (password) authUpdates.password = password;

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, authUpdates);
    if (authError) return sendError(res, 400, authError.message || 'Nao foi possivel atualizar o usuario no Auth.');

    const updateRow = {
      name,
      phone,
      email,
      login,
      status,
      observations: body.observations ?? current.observations,
      address: body.address ?? current.address
    };

    const { data: client, error: updateError } = await supabaseAdmin
      .from('clients')
      .update(updateRow)
      .eq('id', id)
      .select()
      .single();

    if (updateError) return sendError(res, 400, `Auth atualizado, mas falhou ao salvar em clients: ${updateError.message}`);

    res.status(200).json({ success: true, client: toCamel(client) });
  } catch (error: any) {
    sendError(res, 500, error?.message || 'Erro interno ao atualizar cliente.');
  }
}
