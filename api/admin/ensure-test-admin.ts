import {
  ApiRequest,
  assertServerEnv,
  readBody,
  rejectInvalidMethod,
  sendError,
  setCors,
  supabaseAdmin,
  toCamel
} from '../_utils/supabaseAdmin';

const TEST_LOGIN = 'focarodas';
const TEST_EMAIL = 'focarodas@focarodas.com';
const TEST_PASSWORD = '123456';

export default async function handler(req: ApiRequest, res: any) {
  if (rejectInvalidMethod(req, res)) return;
  setCors(res);

  try {
    assertServerEnv();
    const body = readBody<any>(req.body);
    if (String(body.login || '').trim().toLowerCase() !== TEST_LOGIN || String(body.password || '') !== TEST_PASSWORD) {
      return sendError(res, 403, 'Credenciais de teste invalidas.');
    }

    const { data: existingEmployee } = await supabaseAdmin
      .from('employees')
      .select('*')
      .ilike('login', TEST_LOGIN)
      .maybeSingle();

    if (existingEmployee?.id) {
      await supabaseAdmin.auth.admin.updateUserById(existingEmployee.id, {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        email_confirm: true,
        user_metadata: {
          name: 'Administrador FOCA RODAS',
          login: TEST_LOGIN,
          role: 'Administrador',
          panel: 'employee'
        }
      });
      const { data: employee, error } = await supabaseAdmin
        .from('employees')
        .update({
          name: existingEmployee.name || 'Administrador FOCA RODAS',
          email: TEST_EMAIL,
          role: 'Administrador',
          active: true
        })
        .eq('id', existingEmployee.id)
        .select()
        .single();
      if (error) return sendError(res, 400, error.message);
      return res.status(200).json({ success: true, employee: toCamel(employee), email: TEST_EMAIL });
    }

    let { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: {
        name: 'Administrador FOCA RODAS',
        login: TEST_LOGIN,
        role: 'Administrador',
        panel: 'employee'
      }
    });

    if (authError || !authData.user) {
      const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      const existingAuthUser = (usersData?.users as any[] | undefined)?.find(user => String(user.email || '').toLowerCase() === TEST_EMAIL);
      if (listError || !existingAuthUser) {
        return sendError(res, 400, authError?.message || 'Nao foi possivel criar o admin de teste.');
      }
      await supabaseAdmin.auth.admin.updateUserById(existingAuthUser.id, {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        email_confirm: true,
        user_metadata: {
          name: 'Administrador FOCA RODAS',
          login: TEST_LOGIN,
          role: 'Administrador',
          panel: 'employee'
        }
      });
      authData = { user: existingAuthUser };
    }

    const { data: employee, error: insertError } = await supabaseAdmin
      .from('employees')
      .insert({
        id: authData.user.id,
        name: 'Administrador FOCA RODAS',
        login: TEST_LOGIN,
        email: TEST_EMAIL,
        role: 'Administrador',
        active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return sendError(res, 400, insertError.message);
    }

    res.status(200).json({ success: true, employee: toCamel(employee), email: TEST_EMAIL });
  } catch (error: any) {
    sendError(res, 500, error?.message || 'Erro interno ao preparar admin de teste.');
  }
}
