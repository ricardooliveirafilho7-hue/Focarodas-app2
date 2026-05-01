# Foca Rodas | Plataforma de Gestão

Aplicação Vite + React + TypeScript para gestão da Foca Rodas, com painel Admin, Funcionário e Cliente, Supabase Auth, Supabase Storage e APIs serverless para deploy na Vercel.

## Rodar localmente

```bash
npm install
npm run dev
```

Para testar também as APIs serverless locais, rode:

```bash
npx vercel dev
```

## Variáveis de ambiente

Front-end:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Back-end/API serverless:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Nunca coloque `SUPABASE_SERVICE_ROLE_KEY` no front-end. Ela só pode existir nas funções em `api/admin/*`.

## Configurar Supabase

1. Crie o projeto no Supabase.
2. Execute `supabase-schema-v2.sql` no SQL Editor.
3. Confirme as tabelas: `clients`, `employees`, `vehicles`, `service_orders`, `messages`, `audit_logs`, `notifications`, `budgets`, `budget_items` e `payments`.
4. Confirme o bucket público `vehicle-photos` no Supabase Storage.
5. Use o painel Admin para criar clientes e funcionários, pois as APIs criam o usuário no Supabase Auth e salvam o mesmo `id` nas tabelas públicas.

## Configurar Vercel

1. Importe o repositório na Vercel.
2. Configure todas as variáveis de ambiente acima.
3. Build command: `npm run build`.
4. Rotas serverless usadas em produção:
   - `/api/admin/create-employee`
   - `/api/admin/update-employee`
   - `/api/admin/create-client`
   - `/api/admin/update-client`
   - `/api/admin/ensure-test-admin`

## Login de teste

Admin de teste obrigatório:

- Login: `focarodas`
- Senha: `123456`

Também é mantido suporte local para `admin / 123456`. Em produção, ao usar `focarodas / 123456`, a API `ensure-test-admin` tenta garantir um usuário real no Supabase Auth e um registro correspondente em `employees` com cargo `Administrador`.

## Checklist de teste

1. Entrar no Admin com `focarodas / 123456`.
2. Criar cliente, recarregar a página e confirmar persistência.
3. Criar veículo com upload de foto, recarregar e confirmar persistência.
4. Criar OS com cliente e veículo existentes.
5. Criar OS com cliente novo e veículo novo.
6. Atualizar status da OS, adicionar mensagem pública, nota interna e fotos.
7. Entrar como cliente e confirmar que ele vê apenas os próprios dados.
8. Criar funcionário e testar login pelo painel Funcionário.
9. Testar filtros, busca global, notificações, orçamentos, financeiro e relatórios.
10. Rodar:

```bash
npm run lint
npm run build
```

## Persistência

Quando Supabase está configurado, o app usa Supabase como fonte principal. O `localStorage` é usado apenas como fallback local sinalizado na UI. Se uma operação falhar no Supabase, o formulário permanece aberto ou a ação retorna erro claro em vez de fingir que salvou.
