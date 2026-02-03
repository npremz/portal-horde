-- 20. API Keys table for bot/agent authentication

create table api_keys (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  name varchar(100) not null,                       -- "Bot CRM", "Agent Prospection"
  key_hash varchar(64) not null,                    -- SHA-256 hash of the full key
  key_prefix varchar(12) not null,                  -- "horde_ab" for display
  permissions text[] not null default '{}',         -- ['clients:read', 'clients:write', 'stats:read']
  is_active boolean not null default true,
  expires_at timestamptz,                           -- NULL = never expires
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_api_keys_key_hash on api_keys(key_hash);
create index idx_api_keys_profile_id on api_keys(profile_id);
create index idx_api_keys_is_active on api_keys(is_active);

-- RLS
alter table api_keys enable row level security;

-- Only admins can manage API keys
create policy "Admins can view all api keys"
  on api_keys for select
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can insert api keys"
  on api_keys for insert
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update api keys"
  on api_keys for update
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can delete api keys"
  on api_keys for delete
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Function to update last_used_at (called from application)
create or replace function update_api_key_last_used(key_hash_param varchar(64))
returns void as $$
begin
  update api_keys
  set last_used_at = now()
  where key_hash = key_hash_param and is_active = true;
end;
$$ language plpgsql security definer;
