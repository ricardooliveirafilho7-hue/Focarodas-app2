# Foca Rodas | Plataforma de Gestão

Aplicação Vite + React + TypeScript para gestão da Foca Rodas, com painel Admin, Funcionário e Cliente, Supabase Auth, tabelas públicas e APIs serverless para deploy na Vercel.

## Rodar localmente

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Copie `.env.example` para `.env.local` e preencha as variáveis.
3. Inicie o Vite:
   ```bash
   npm run dev
   ```
4. Abra a URL exibida no terminal.

Para testar as APIs serverless localmente, use a CLI da Vercel:
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

Nunca coloque `SUPABASE_SERVICE_ROLE_KEY` no código do navegador. Ela é usada apenas pelas rotas em `api/admin/*`.

## Configurar Supabase

1. Crie um projeto no Supabase.
2. No SQL Editor, execute `supabase-schema-v2.sql`.
3. Confirme que existem as tabelas:
   `clients`, `employees`, `vehicles`, `service_orders`, `messages`.
4. Garanta que os cadastros de clientes e funcionários sejam feitos pelo painel Admin, pois as APIs criam o usuário no Supabase Auth e gravam o mesmo `id` na tabela correspondente.

## Configurar Vercel

1. Importe o repositório na Vercel.
2. Configure as variáveis de ambiente do projeto:
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
3. Use o build padrão:
   ```bash
   npm run build
   ```
4. As rotas de produção ficam em:
   `/api/admin/create-employee`, `/api/admin/update-employee`, `/api/admin/create-client`, `/api/admin/update-client`.

## Testar acessos

Admin de teste local:
- Login: `admin`
- Senha: `123456`

Funcionário:
1. Entre no painel Admin.
2. Cadastre um funcionário com login e senha.
3. Entre no painel Funcionário usando o login ou o e-mail cadastrado.

Cliente:
1. Entre no painel Admin.
2. Cadastre um cliente com login e senha.
3. Entre no painel Cliente usando o login ou o e-mail cadastrado.
4. O cliente deve ver apenas veículos, ordens e mensagens vinculados ao próprio `client_id`.

## Verificações recomendadas

Antes de publicar:
```bash
npm run lint
npm run build
```

Fluxos principais para validar:
- Admin cria, edita, ativa e desativa funcionário.
- Funcionário cadastrado faz login pelo painel Funcionário.
- Admin cria cliente e cliente faz login pelo painel Cliente.
- Veículos são criados com `client_id` correto.
- OS com cliente existente e cliente novo cria `client_id` e `vehicle_id` corretos.
- Mensagens são salvas em `messages`, filtradas por cliente e marcadas como lidas.
