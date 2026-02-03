-- Horde Portal - Schema Complet
-- Version: 1.0.0
-- Base de donnees production (etat final)

-- ============================================
-- 1. EXTENSIONS
-- ============================================
create extension if not exists "uuid-ossp";

-- ============================================
-- 2. ENUMS
-- ============================================
create type user_role as enum ('client', 'admin', 'editor');
create type project_status as enum ('active', 'paused', 'completed', 'archived');
create type phase_status as enum ('pending', 'in_progress', 'review', 'completed');
create type deliverable_status as enum ('draft', 'pending_review', 'approved', 'revision_requested');
create type client_status as enum ('lead', 'contacted', 'in_project', 'pending_review', 'completed', 'archived');
create type contact_role as enum ('decision_maker', 'technical', 'billing', 'marketing', 'other');
create type message_type as enum ('prospecting', 'followup', 'custom');

-- ============================================
-- 3. TABLES
-- ============================================

-- Profiles (etend auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  company text,
  role user_role default 'client',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Clients (entite CRM, independante des comptes utilisateur)
create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  phone text,
  website text,
  socials jsonb default '{}',
  status client_status default 'lead',
  notes text,
  profile_id uuid references profiles(id) on delete set null,
  first_contact_date timestamptz,
  next_followup_date timestamptz,
  project_type text,
  sector text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Client contacts (contacts multiples par client)
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

-- Client messages (historique de prospection CRM)
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

-- Projects (client_id reference clients, pas profiles)
create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  client_id uuid references clients(id) on delete set null,
  status project_status default 'active',
  staging_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Phases
create table phases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  description text,
  status phase_status default 'pending',
  order_index int not null,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- Phase templates (modeles reutilisables)
create table phase_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  order_index int not null,
  is_default boolean default false,
  created_at timestamptz default now()
);

-- Deliverables
create table deliverables (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid references phases(id) on delete cascade,
  title text not null,
  description text,
  status deliverable_status default 'draft',
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Files
create table files (
  id uuid primary key default gen_random_uuid(),
  deliverable_id uuid references deliverables(id) on delete cascade,
  name text not null,
  storage_path text not null,
  size_bytes bigint,
  mime_type text,
  version int default 1,
  uploaded_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Links (URLs externes pour deliverables)
create table links (
  id uuid primary key default gen_random_uuid(),
  deliverable_id uuid references deliverables(id) on delete cascade,
  title text not null,
  url text not null,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Comments
create table comments (
  id uuid primary key default gen_random_uuid(),
  deliverable_id uuid references deliverables(id) on delete cascade,
  author_id uuid references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Project members (equipe Horde assignee)
create table project_members (
  project_id uuid references projects(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (project_id, user_id)
);

-- API Keys (authentification bot/agent)
create table api_keys (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  name varchar(100) not null,
  key_hash varchar(64) not null,
  key_prefix varchar(12) not null,
  permissions text[] not null default '{}',
  is_active boolean not null default true,
  expires_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================
-- 4. INDEXES
-- ============================================
create index idx_profiles_role on profiles(role);

create index idx_clients_status on clients(status);
create index idx_clients_profile_id on clients(profile_id);
create index idx_clients_email on clients(email);
create index idx_clients_next_followup_date on clients(next_followup_date);
create index idx_clients_project_type on clients(project_type);
create index idx_clients_sector on clients(sector);

create index idx_client_contacts_client_id on client_contacts(client_id);

create index idx_client_messages_client_id on client_messages(client_id);
create index idx_client_messages_sent_at on client_messages(sent_at desc);

create index idx_projects_client_id on projects(client_id);
create index idx_projects_status on projects(status);

create index idx_phases_project_id on phases(project_id);
create index idx_phases_status on phases(status);

create index idx_deliverables_phase_id on deliverables(phase_id);
create index idx_deliverables_status on deliverables(status);

create index idx_files_deliverable_id on files(deliverable_id);

create index idx_links_deliverable_id on links(deliverable_id);

create index idx_comments_deliverable_id on comments(deliverable_id);
create index idx_comments_author_id on comments(author_id);

create index idx_project_members_user_id on project_members(user_id);

create index idx_api_keys_key_hash on api_keys(key_hash);
create index idx_api_keys_profile_id on api_keys(profile_id);
create index idx_api_keys_is_active on api_keys(is_active);

-- ============================================
-- 5. FUNCTIONS
-- ============================================

-- Creer automatiquement un profil apres inscription
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

-- Mettre a jour updated_at
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Mettre a jour last_used_at pour API keys
create or replace function update_api_key_last_used(key_hash_param varchar(64))
returns void as $$
begin
  update api_keys
  set last_used_at = now()
  where key_hash = key_hash_param and is_active = true;
end;
$$ language plpgsql security definer;

-- ============================================
-- 6. TRIGGERS
-- ============================================

-- Auto-create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- updated_at triggers
create trigger handle_profiles_updated_at
  before update on profiles
  for each row execute procedure handle_updated_at();

create trigger handle_clients_updated_at
  before update on clients
  for each row execute procedure handle_updated_at();

create trigger handle_projects_updated_at
  before update on projects
  for each row execute procedure handle_updated_at();

create trigger handle_deliverables_updated_at
  before update on deliverables
  for each row execute procedure handle_updated_at();

create trigger handle_comments_updated_at
  before update on comments
  for each row execute procedure handle_updated_at();

-- ============================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================

alter table profiles enable row level security;
alter table clients enable row level security;
alter table client_contacts enable row level security;
alter table client_messages enable row level security;
alter table projects enable row level security;
alter table phases enable row level security;
alter table phase_templates enable row level security;
alter table deliverables enable row level security;
alter table files enable row level security;
alter table links enable row level security;
alter table comments enable row level security;
alter table project_members enable row level security;
alter table api_keys enable row level security;

-- ============================================
-- 7.1 PROFILES POLICIES
-- ============================================
create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on profiles for select
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Admins can update any profile"
  on profiles for update
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can insert profiles"
  on profiles for insert
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can delete profiles"
  on profiles for delete
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- ============================================
-- 7.2 CLIENTS POLICIES
-- ============================================
create policy "Admins can view all clients"
  on clients for select
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can insert clients"
  on clients for insert
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can update clients"
  on clients for update
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can delete clients"
  on clients for delete
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Editors can view all clients"
  on clients for select
  using (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));

create policy "Editors can insert clients"
  on clients for insert
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));

create policy "Editors can update clients"
  on clients for update
  using (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));

create policy "Clients can view their own record"
  on clients for select
  using (profile_id = auth.uid());

-- ============================================
-- 7.3 CLIENT CONTACTS POLICIES
-- ============================================
create policy "Admins can view all contacts"
  on client_contacts for select
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can insert contacts"
  on client_contacts for insert
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can update contacts"
  on client_contacts for update
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can delete contacts"
  on client_contacts for delete
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Editors can view all contacts"
  on client_contacts for select
  using (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));

create policy "Editors can insert contacts"
  on client_contacts for insert
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));

create policy "Editors can update contacts"
  on client_contacts for update
  using (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));

create policy "Editors can delete contacts"
  on client_contacts for delete
  using (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));

create policy "Clients can view their contacts"
  on client_contacts for select
  using (exists (
    select 1 from clients
    where clients.id = client_contacts.client_id
    and clients.profile_id = auth.uid()
  ));

-- ============================================
-- 7.4 CLIENT MESSAGES POLICIES
-- ============================================
create policy "Admins can view all messages"
  on client_messages for select
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can insert messages"
  on client_messages for insert
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can update messages"
  on client_messages for update
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can delete messages"
  on client_messages for delete
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Editors can view all messages"
  on client_messages for select
  using (exists (select 1 from profiles where id = auth.uid() and role = 'editor'));

create policy "Clients can view their messages"
  on client_messages for select
  using (exists (
    select 1 from clients
    where clients.id = client_messages.client_id
    and clients.profile_id = auth.uid()
  ));

-- ============================================
-- 7.5 PROJECTS POLICIES
-- ============================================
create policy "Admins can view all projects"
  on projects for select
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can insert projects"
  on projects for insert
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can update projects"
  on projects for update
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can delete projects"
  on projects for delete
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Clients can view their projects via client record"
  on projects for select
  using (exists (
    select 1 from clients
    where clients.id = projects.client_id
    and clients.profile_id = auth.uid()
  ));

create policy "Team members can view assigned projects"
  on projects for select
  using (exists (
    select 1 from project_members
    where project_id = id and user_id = auth.uid()
  ));

-- ============================================
-- 7.6 PHASES POLICIES
-- ============================================
create policy "Admins can view all phases"
  on phases for select
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can manage phases"
  on phases for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Users can view phases of their projects"
  on phases for select
  using (exists (
    select 1 from projects
    join clients on clients.id = projects.client_id
    where projects.id = phases.project_id
    and (
      clients.profile_id = auth.uid()
      or exists (
        select 1 from project_members
        where project_id = projects.id and user_id = auth.uid()
      )
    )
  ));

-- ============================================
-- 7.7 PHASE TEMPLATES POLICIES
-- ============================================
create policy "Anyone can view phase templates"
  on phase_templates for select
  using (true);

create policy "Admins can insert templates"
  on phase_templates for insert
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can update templates"
  on phase_templates for update
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can delete templates"
  on phase_templates for delete
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- ============================================
-- 7.8 DELIVERABLES POLICIES
-- ============================================
create policy "Admins can view all deliverables"
  on deliverables for select
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can manage deliverables"
  on deliverables for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Users can view deliverables of their projects"
  on deliverables for select
  using (exists (
    select 1 from phases
    join projects on projects.id = phases.project_id
    join clients on clients.id = projects.client_id
    where phases.id = deliverables.phase_id
    and (
      clients.profile_id = auth.uid()
      or exists (
        select 1 from project_members
        where project_id = projects.id and user_id = auth.uid()
      )
    )
  ));

-- ============================================
-- 7.9 FILES POLICIES
-- ============================================
create policy "Admins can view all files"
  on files for select
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can manage files"
  on files for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Users can view files of their projects"
  on files for select
  using (exists (
    select 1 from deliverables
    join phases on phases.id = deliverables.phase_id
    join projects on projects.id = phases.project_id
    join clients on clients.id = projects.client_id
    where deliverables.id = files.deliverable_id
    and (
      clients.profile_id = auth.uid()
      or exists (
        select 1 from project_members
        where project_id = projects.id and user_id = auth.uid()
      )
    )
  ));

-- ============================================
-- 7.10 LINKS POLICIES
-- ============================================
create policy "Admins can view all links"
  on links for select
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can manage links"
  on links for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Users can view links of their projects"
  on links for select
  using (exists (
    select 1 from deliverables
    join phases on phases.id = deliverables.phase_id
    join projects on projects.id = phases.project_id
    join clients on clients.id = projects.client_id
    where deliverables.id = links.deliverable_id
    and (
      clients.profile_id = auth.uid()
      or exists (
        select 1 from project_members
        where project_id = projects.id and user_id = auth.uid()
      )
    )
  ));

-- ============================================
-- 7.11 COMMENTS POLICIES
-- ============================================
create policy "Admins can view all comments"
  on comments for select
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can manage comments"
  on comments for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Users can view comments on their project deliverables"
  on comments for select
  using (exists (
    select 1 from deliverables
    join phases on phases.id = deliverables.phase_id
    join projects on projects.id = phases.project_id
    join clients on clients.id = projects.client_id
    where deliverables.id = comments.deliverable_id
    and (
      clients.profile_id = auth.uid()
      or exists (
        select 1 from project_members
        where project_id = projects.id and user_id = auth.uid()
      )
    )
  ));

create policy "Users can insert comments on their project deliverables"
  on comments for insert
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from deliverables
      join phases on phases.id = deliverables.phase_id
      join projects on projects.id = phases.project_id
      join clients on clients.id = projects.client_id
      where deliverables.id = comments.deliverable_id
      and (
        clients.profile_id = auth.uid()
        or exists (
          select 1 from project_members
          where project_id = projects.id and user_id = auth.uid()
        )
      )
    )
  );

-- ============================================
-- 7.12 PROJECT MEMBERS POLICIES
-- ============================================
create policy "Members can view their own membership"
  on project_members for select
  using (user_id = auth.uid());

create policy "Admins can view all memberships"
  on project_members for select
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can manage memberships"
  on project_members for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- ============================================
-- 7.13 API KEYS POLICIES
-- ============================================
create policy "Admins can view all api keys"
  on api_keys for select
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can insert api keys"
  on api_keys for insert
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can update api keys"
  on api_keys for update
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can delete api keys"
  on api_keys for delete
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- ============================================
-- 8. STORAGE
-- ============================================

-- Bucket pour les livrables
insert into storage.buckets (id, name, public)
values ('deliverables', 'deliverables', false)
on conflict (id) do nothing;

-- Storage policies
create policy "Users can view files from their projects"
  on storage.objects for select
  using (
    bucket_id = 'deliverables'
    and exists (
      select 1 from files
      join deliverables on deliverables.id = files.deliverable_id
      join phases on phases.id = deliverables.phase_id
      join projects on projects.id = phases.project_id
      join clients on clients.id = projects.client_id
      where files.storage_path = storage.objects.name
      and (
        clients.profile_id = auth.uid()
        or exists (
          select 1 from project_members
          where project_id = projects.id and user_id = auth.uid()
        )
        or exists (
          select 1 from profiles
          where id = auth.uid() and role = 'admin'
        )
      )
    )
  );

create policy "Admins can upload files"
  on storage.objects for insert
  with check (
    bucket_id = 'deliverables'
    and exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can delete files"
  on storage.objects for delete
  using (
    bucket_id = 'deliverables'
    and exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================
-- 9. SEED DATA
-- ============================================

-- Phase templates par defaut
insert into phase_templates (name, description, order_index, is_default) values
  ('Audit', 'Analyse de l''existant et benchmark concurrentiel', 0, true),
  ('Proposition', 'Proposition commerciale et devis', 1, true),
  ('Brief', 'Definition des besoins, objectifs et specifications', 2, true),
  ('Maquette', 'Design UI/UX et wireframes', 3, true),
  ('Validation maquette', 'Approbation des maquettes par le client', 4, true),
  ('Developpement', 'Integration et developpement technique', 5, true),
  ('Validation staging', 'Tests et recette sur environnement de pre-production', 6, true),
  ('Mise en production', 'Deploiement et lancement officiel', 7, true),
  ('Review', 'Retour d''experience et ajustements post-lancement', 8, true);
