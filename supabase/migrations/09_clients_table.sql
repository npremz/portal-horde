-- 9. Clients table (CRM entity)
-- Clients exist as business entities independent of user accounts
-- They can be created before having portal access

create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,                                    -- Company/client name
  email text not null unique,                            -- Primary contact email
  phone text,                                            -- Primary phone number
  website text,                                          -- Company website
  socials jsonb default '{}',                            -- {linkedin, instagram, facebook, twitter}
  status client_status default 'lead',                   -- CRM status
  notes text,                                            -- Internal notes (admin only)
  profile_id uuid references profiles(id) on delete set null,  -- Linked when invited
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for common queries
create index idx_clients_status on clients(status);
create index idx_clients_profile_id on clients(profile_id);
create index idx_clients_email on clients(email);

-- Trigger for updated_at
create trigger handle_clients_updated_at
  before update on clients
  for each row execute procedure handle_updated_at();

-- RLS
alter table clients enable row level security;

-- Admins have full access
create policy "Admins can view all clients"
  on clients for select
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can insert clients"
  on clients for insert
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update clients"
  on clients for update
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can delete clients"
  on clients for delete
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Clients can view their own client record (via profile_id)
create policy "Clients can view their own record"
  on clients for select
  using (profile_id = auth.uid());
