# Foca Rodas | Plataforma de Gestao

Aplicacao Vite + React + TypeScript para gestao da Foca Rodas, com painel Admin, Funcionario e Cliente, Supabase Auth, Supabase Storage e APIs serverless para deploy na Vercel.

## Rodar localmente

```bash
npm install
npm run dev
```

Para testar tambem as APIs serverless locais, rode:

```bash
npx vercel dev
```

## Variaveis de ambiente

Front-end:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Back-end/API serverless:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Nunca coloque `SUPABASE_SERVICE_ROLE_KEY` no front-end. Ela so pode existir nas funcoes em `api/admin/*`.

## Configurar Supabase

1. Crie o projeto no Supabase.
2. Execute `supabase-schema-v2.sql` no SQL Editor.
3. Confirme as tabelas: `clients`, `employees`, `vehicles`, `service_orders`, `messages`, `audit_logs`, `notifications`, `budgets`, `budget_items`, `payments` e `company_settings`.
4. Confirme o bucket privado `vehicle-photos` no Supabase Storage.
5. Crie o primeiro administrador diretamente no Supabase Auth e na tabela `employees`; depois use o painel Admin para criar clientes e funcionarios.

## Configurar Vercel

1. Importe o repositorio na Vercel.
2. Configure todas as variaveis de ambiente acima.
3. Build command: `npm run build`.
4. Rotas serverless usadas em producao:
   - `/api/admin/create-employee`
   - `/api/admin/update-employee`
   - `/api/admin/create-client`
   - `/api/admin/update-client`

## Checklist de teste

1. Entrar no Admin com um usuario real do Supabase Auth que exista em `employees` como `Administrador` ou `Gerente`.
2. Criar cliente, recarregar a pagina e confirmar persistencia em outro dispositivo.
3. Criar veiculo com upload de foto, recarregar e confirmar persistencia.
4. Criar OS com cliente e veiculo existentes.
5. Criar OS com cliente novo e veiculo novo.
6. Atualizar status da OS, adicionar mensagem publica, nota interna e fotos.
7. Entrar como cliente e confirmar que ele ve apenas os proprios dados.
8. Criar funcionario e testar login pelo painel Funcionario.
9. Testar filtros, busca global, notificacoes, orcamentos, financeiro e relatorios.
10. Rodar:

```bash
npm run lint
npm run typecheck
npm run build
```

## Persistencia

O Supabase e a unica fonte da verdade. Dados operacionais, configuracoes e fotos nao sao salvos em `localStorage`; se o Supabase ou as APIs da Vercel estiverem indisponiveis, a operacao falha de forma explicita.
