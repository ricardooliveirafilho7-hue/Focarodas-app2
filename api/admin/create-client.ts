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
  setCors(res);

  try {
    assertServerEnv();
    const body = readBody<any>(req.body);
    const name = String(body.name || '').trim();
    const phone = String(body.phone || '').trim();
    const login = cleanLogin(body.login);
    const password = String(body.password || '');
    const email = authEmailForLogin(login, body.email);
    const status = allowedStatuses.has(body.status) ? body.status : 'Ativo';

    if (!name) return sendError(res, 400, 'Nome do cliente e obrigatorio.');
    if (!phone) return sendError(res, 400, 'Telefone do cliente e obrigatorio.');
    const credentialError = validateLoginAndPassword(login, password);
    if (credentialError) return sendError(res, 400, credentialError);

    const uniqueError = await ensureUnique('clients', login, email);
    if (uniqueError) return sendError(res, 409, uniqueError);

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        login,
        panel: 'client'
      }
    });

    if (authError || !authData.user) {
      return sendError(res, 400, authError?.message || 'Nao foi possivel criar o usuario no Supabase Auth.');
    }

    const userId = authData.user.id;
    const clientRow = {
      id: userId,
      name,
      phone,
      email,
      login,
      status,
      observations: body.observations || null,
      address: body.address || null,
      created_at: new Date().toISOString()
    };

    const { data: client, error: insertError } = await supabaseAdmin
      .from('clients')
      .insert(clientRow)
      .select()
      .single();

    if (insertError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return sendError(res, 400, `Usuario Auth criado, mas falhou ao salvar em clients: ${insertError.message}`);
    }

    res.status(200).json({ success: true, client: toCamel(client) });
  } catch (error: any) {
    sendError(res, 500, error?.message || 'Erro interno ao criar cliente.');
  }
}
