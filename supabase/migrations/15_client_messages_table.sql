-- 15. Client messages table (CRM prospection history)

create table client_messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  contact_id uuid references client_contacts(id) on delete set null,
  subject text not null,
  content text not null,
  sent_at timestamptz default now(),
  sent_by uuid references profiles(id),
  message_type message_type default 'prospecting'
);

-- Index for lookups
create index idx_client_messages_client_id on client_messages(client_id);
create index idx_client_messages_sent_at on client_messages(sent_at desc);

-- RLS
alter table client_messages enable row level security;

-- Admins have full access
create policy "Admins can view all messages"
  on client_messages for select
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can insert messages"
  on client_messages for insert
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update messages"
  on client_messages for update
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can delete messages"
  on client_messages for delete
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Clients can view messages for their own client record
create policy "Clients can view their messages"
  on client_messages for select
  using (
    exists (
      select 1 from clients
      where clients.id = client_messages.client_id
      and clients.profile_id = auth.uid()
    )
  );
