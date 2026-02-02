-- 10. Client contacts table
-- Multiple contacts per client organization

create table client_contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  role contact_role default 'other',
  is_primary boolean default false,
  notes text,
  created_at timestamptz default now()
);

-- Index for lookups
create index idx_client_contacts_client_id on client_contacts(client_id);

-- RLS
alter table client_contacts enable row level security;

-- Admins have full access
create policy "Admins can view all contacts"
  on client_contacts for select
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can insert contacts"
  on client_contacts for insert
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update contacts"
  on client_contacts for update
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can delete contacts"
  on client_contacts for delete
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Clients can view contacts for their own client record
create policy "Clients can view their contacts"
  on client_contacts for select
  using (
    exists (
      select 1 from clients
      where clients.id = client_contacts.client_id
      and clients.profile_id = auth.uid()
    )
  );
