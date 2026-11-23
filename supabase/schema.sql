-- VERBA cloud persistence (Phase 4). Not used by the local-first v1.
-- One JSON document per learner keeps the client store unchanged; normalised
-- tables for analytics can be derived from it later.
create table if not exists verba_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table verba_state enable row level security;

create policy "own state - read" on verba_state for select using (auth.uid() = user_id);
create policy "own state - write" on verba_state for insert with check (auth.uid() = user_id);
create policy "own state - update" on verba_state for update using (auth.uid() = user_id);
