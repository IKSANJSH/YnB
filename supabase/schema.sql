-- 머니업: 계정별 데이터 저장용 테이블
-- Supabase 대시보드 -> SQL Editor -> New query 에 붙여넣고 실행하세요.

create table if not exists trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date text not null,
  time text not null,
  symbol text not null,
  action text not null,
  qty numeric not null,
  price numeric not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create table if not exists morning_letters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date text not null,
  content text not null,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

create table if not exists ai_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null,
  role text not null,
  content text not null,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists portfolios (
  user_id uuid primary key references auth.users(id) on delete cascade,
  cash numeric not null,
  mode text not null,
  assets jsonb not null,
  holdings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table trades enable row level security;
alter table morning_letters enable row level security;
alter table ai_messages enable row level security;
alter table portfolios enable row level security;

drop policy if exists "trades_owner" on trades;
create policy "trades_owner" on trades
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "morning_letters_owner" on morning_letters;
create policy "morning_letters_owner" on morning_letters
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "ai_messages_owner" on ai_messages;
create policy "ai_messages_owner" on ai_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "portfolios_owner" on portfolios;
create policy "portfolios_owner" on portfolios
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
