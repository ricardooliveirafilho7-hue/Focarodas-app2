-- Foca Rodas App - Supabase schema v2
-- Execute este arquivo no SQL Editor do Supabase antes de usar o app em producao.

create extension if not exists "uuid-ossp";

create table if not exists public.clients (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  login text not null,
  phone text not null,
  email text not null,
  address text,
  observations text,
  status text not null default 'Ativo' check (status in ('Ativo', 'Aguardando', 'Inativo')),
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.employees (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  login text not null,
  email text not null,
  role text not null check (role in ('Administrador', 'Gerente', 'Atendente', 'Técnico')),
  active boolean not null default true,
  avatar text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.vehicles (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references public.clients(id) on delete cascade,
  brand text,
  model text not null,
  plate text not null,
  year text,
  color text,
  mileage text,
  photo text,
  observations text,
  general_state text,
  tires_state text,
  wheels_state text,
  damage text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.service_orders (
  id uuid primary key default uuid_generate_v4(),
  short_id text,
  client_id uuid not null references public.clients(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  title text,
  description text,
  status text not null,
  priority text,
  services_full text,
  observations text,
  public_notes text,
  internal_notes text,
  technician_id uuid references public.employees(id) on delete set null,
  delivery_estimate text not null,
  finished_at timestamptz,
  updates jsonb not null default '[]'::jsonb,
  photos jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references public.clients(id) on delete cascade,
  sender_id text not null,
  sender_role text not null,
  title text not null,
  content text not null,
  type text not null default 'info' check (type in ('info', 'success', 'warning', 'error')),
  read boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.audit_logs (
  id text primary key,
  user_id text not null,
  user_name text not null,
  action text not null,
  target text not null,
  target_id text,
  type text not null check (type in ('edit', 'add', 'alert', 'delete', 'info')),
  details text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id text,
  client_id uuid references public.clients(id) on delete cascade,
  service_order_id uuid references public.service_orders(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'INFO' check (type in ('INFO', 'SUCCESS', 'WARNING', 'ERROR')),
  read boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.budgets (
  id uuid primary key default uuid_generate_v4(),
  service_order_id uuid not null references public.service_orders(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  status text not null default 'Rascunho' check (status in ('Rascunho', 'Enviado', 'Aprovado', 'Recusado')),
  approved_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.budget_items (
  id uuid primary key default uuid_generate_v4(),
  budget_id uuid not null references public.budgets(id) on delete cascade,
  description text not null,
  type text not null check (type in ('Peça', 'Serviço', 'Mão de obra', 'Outro')),
  quantity numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  service_order_id uuid references public.service_orders(id) on delete set null,
  budget_id uuid references public.budgets(id) on delete set null,
  client_id uuid not null references public.clients(id) on delete cascade,
  amount numeric(12,2) not null check (amount >= 0),
  method text not null check (method in ('Dinheiro', 'Pix', 'Cartao', 'Boleto', 'Transferencia', 'Outro')),
  status text not null default 'Pendente' check (status in ('Pendente', 'Parcial', 'Pago', 'Cancelado')),
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create unique index if not exists clients_login_unique_idx on public.clients (lower(login));
create unique index if not exists clients_email_unique_idx on public.clients (lower(email));
create unique index if not exists employees_login_unique_idx on public.employees (lower(login));
create unique index if not exists employees_email_unique_idx on public.employees (lower(email));
create unique index if not exists vehicles_plate_client_unique_idx on public.vehicles (client_id, upper(plate));

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists service_orders_set_updated_at on public.service_orders;
create trigger service_orders_set_updated_at
before update on public.service_orders
for each row
execute function public.set_updated_at();

drop trigger if exists budgets_set_updated_at on public.budgets;
create trigger budgets_set_updated_at
before update on public.budgets
for each row
execute function public.set_updated_at();

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at
before update on public.payments
for each row
execute function public.set_updated_at();

alter table public.clients enable row level security;
alter table public.employees enable row level security;
alter table public.vehicles enable row level security;
alter table public.service_orders enable row level security;
alter table public.messages enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notifications enable row level security;
alter table public.budgets enable row level security;
alter table public.budget_items enable row level security;
alter table public.payments enable row level security;

-- Policies permissivas para teste integrado do app Vite.
-- As APIs serverless usam service_role e ignoram RLS. Para uma producao mais restrita,
-- substitua estas policies por regras baseadas em auth.uid() e cargos.
drop policy if exists "foca clients public test access" on public.clients;
create policy "foca clients public test access" on public.clients for all using (true) with check (true);

drop policy if exists "foca employees public test access" on public.employees;
create policy "foca employees public test access" on public.employees for all using (true) with check (true);

drop policy if exists "foca vehicles public test access" on public.vehicles;
create policy "foca vehicles public test access" on public.vehicles for all using (true) with check (true);

drop policy if exists "foca service orders public test access" on public.service_orders;
create policy "foca service orders public test access" on public.service_orders for all using (true) with check (true);

drop policy if exists "foca messages public test access" on public.messages;
create policy "foca messages public test access" on public.messages for all using (true) with check (true);

drop policy if exists "foca audit logs public test access" on public.audit_logs;
create policy "foca audit logs public test access" on public.audit_logs for all using (true) with check (true);

drop policy if exists "foca notifications public test access" on public.notifications;
create policy "foca notifications public test access" on public.notifications for all using (true) with check (true);

drop policy if exists "foca budgets public test access" on public.budgets;
create policy "foca budgets public test access" on public.budgets for all using (true) with check (true);

drop policy if exists "foca budget items public test access" on public.budget_items;
create policy "foca budget items public test access" on public.budget_items for all using (true) with check (true);

drop policy if exists "foca payments public test access" on public.payments;
create policy "foca payments public test access" on public.payments for all using (true) with check (true);

insert into storage.buckets (id, name, public)
values ('vehicle-photos', 'vehicle-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "foca vehicle photos public read" on storage.objects;
create policy "foca vehicle photos public read"
on storage.objects for select
using (bucket_id = 'vehicle-photos');

drop policy if exists "foca vehicle photos public upload" on storage.objects;
create policy "foca vehicle photos public upload"
on storage.objects for insert
with check (bucket_id = 'vehicle-photos');

drop policy if exists "foca vehicle photos public update" on storage.objects;
create policy "foca vehicle photos public update"
on storage.objects for update
using (bucket_id = 'vehicle-photos')
with check (bucket_id = 'vehicle-photos');

drop policy if exists "foca vehicle photos public delete" on storage.objects;
create policy "foca vehicle photos public delete"
on storage.objects for delete
using (bucket_id = 'vehicle-photos');
