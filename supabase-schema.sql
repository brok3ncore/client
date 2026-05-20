create table if not exists public.school_states (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.school_states enable row level security;

revoke all on public.school_states from anon;
revoke all on public.school_states from authenticated;

drop policy if exists "public school state read" on public.school_states;
drop policy if exists "public school state upsert" on public.school_states;
