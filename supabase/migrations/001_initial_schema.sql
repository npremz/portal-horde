-- Horde Portal - Initial Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Enums
create type user_role as enum ('client', 'admin');
create type project_status as enum ('active', 'paused', 'completed', 'archived');
create type phase_status as enum ('pending', 'in_progress', 'review', 'completed');
create type deliverable_status as enum ('draft', 'pending_review', 'approved', 'revision_requested');

-- Profiles (extends auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  company text,
  role user_role default 'client',
  created_at timestamptz default now()
);

-- Projects
create table projects (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  client_id uuid references profiles(id) on delete set null,
  status project_status default 'active',
  staging_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Phases
create table phases (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade not null,
  name text not null,
  description text,
  status phase_status default 'pending',
  order_index int not null,
  started_at timestamptz,
  completed_at timestamptz
);

-- Deliverables
create table deliverables (
  id uuid primary key default uuid_generate_v4(),
  phase_id uuid references phases(id) on delete cascade not null,
  title text not null,
  description text,
  status deliverable_status default 'draft',
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Files
create table files (
  id uuid primary key default uuid_generate_v4(),
  deliverable_id uuid references deliverables(id) on delete cascade not null,
  name text not null,
  storage_path text not null,
  size_bytes bigint,
  mime_type text,
  version int default 1,
  uploaded_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- Comments
create table comments (
  id uuid primary key default uuid_generate_v4(),
  deliverable_id uuid references deliverables(id) on delete cascade not null,
  author_id uuid references profiles(id) on delete set null,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Project members (team members assigned to project)
create table project_members (
  project_id uuid references projects(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  primary key (project_id, user_id)
);

-- Indexes
create index idx_projects_client on projects(client_id);
create index idx_projects_status on projects(status);
create index idx_phases_project on phases(project_id);
create index idx_phases_status on phases(status);
create index idx_deliverables_phase on deliverables(phase_id);
create index idx_deliverables_status on deliverables(status);
create index idx_files_deliverable on files(deliverable_id);
create index idx_comments_deliverable on comments(deliverable_id);

-- Updated_at trigger function
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at triggers
create trigger projects_updated_at
  before update on projects
  for each row execute function update_updated_at();

create trigger deliverables_updated_at
  before update on deliverables
  for each row execute function update_updated_at();

create trigger comments_updated_at
  before update on comments
  for each row execute function update_updated_at();

-- Auto-create profile on user signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Row Level Security (RLS)
alter table profiles enable row level security;
alter table projects enable row level security;
alter table phases enable row level security;
alter table deliverables enable row level security;
alter table files enable row level security;
alter table comments enable row level security;
alter table project_members enable row level security;

-- Profiles policies
create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on profiles for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Admins can update all profiles"
  on profiles for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Projects policies
create policy "Clients can view their own projects"
  on projects for select
  using (client_id = auth.uid());

create policy "Team members can view assigned projects"
  on projects for select
  using (
    exists (
      select 1 from project_members
      where project_id = projects.id and user_id = auth.uid()
    )
  );

create policy "Admins have full access to projects"
  on projects for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Phases policies
create policy "Users can view phases of their projects"
  on phases for select
  using (
    exists (
      select 1 from projects
      where projects.id = phases.project_id
      and (
        projects.client_id = auth.uid()
        or exists (
          select 1 from project_members
          where project_id = projects.id and user_id = auth.uid()
        )
      )
    )
  );

create policy "Admins have full access to phases"
  on phases for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Deliverables policies
create policy "Users can view deliverables of their projects"
  on deliverables for select
  using (
    exists (
      select 1 from phases
      join projects on projects.id = phases.project_id
      where phases.id = deliverables.phase_id
      and (
        projects.client_id = auth.uid()
        or exists (
          select 1 from project_members
          where project_id = projects.id and user_id = auth.uid()
        )
      )
    )
  );

create policy "Admins have full access to deliverables"
  on deliverables for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Files policies
create policy "Users can view files of their deliverables"
  on files for select
  using (
    exists (
      select 1 from deliverables
      join phases on phases.id = deliverables.phase_id
      join projects on projects.id = phases.project_id
      where deliverables.id = files.deliverable_id
      and (
        projects.client_id = auth.uid()
        or exists (
          select 1 from project_members
          where project_id = projects.id and user_id = auth.uid()
        )
      )
    )
  );

create policy "Admins have full access to files"
  on files for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Comments policies
create policy "Users can view comments on their deliverables"
  on comments for select
  using (
    exists (
      select 1 from deliverables
      join phases on phases.id = deliverables.phase_id
      join projects on projects.id = phases.project_id
      where deliverables.id = comments.deliverable_id
      and (
        projects.client_id = auth.uid()
        or exists (
          select 1 from project_members
          where project_id = projects.id and user_id = auth.uid()
        )
      )
    )
  );

create policy "Users can create comments on their deliverables"
  on comments for insert
  with check (
    auth.uid() = author_id
    and exists (
      select 1 from deliverables
      join phases on phases.id = deliverables.phase_id
      join projects on projects.id = phases.project_id
      where deliverables.id = comments.deliverable_id
      and (
        projects.client_id = auth.uid()
        or exists (
          select 1 from project_members
          where project_id = projects.id and user_id = auth.uid()
        )
      )
    )
  );

create policy "Users can update their own comments"
  on comments for update
  using (author_id = auth.uid());

create policy "Admins have full access to comments"
  on comments for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Project members policies
create policy "Users can view project members of their projects"
  on project_members for select
  using (
    exists (
      select 1 from projects
      where projects.id = project_members.project_id
      and (
        projects.client_id = auth.uid()
        or exists (
          select 1 from project_members pm
          where pm.project_id = projects.id and pm.user_id = auth.uid()
        )
      )
    )
  );

create policy "Admins have full access to project members"
  on project_members for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Storage bucket for deliverable files
insert into storage.buckets (id, name, public)
values ('deliverables', 'deliverables', false);

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
      where files.storage_path = storage.objects.name
      and (
        projects.client_id = auth.uid()
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
    and exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can delete files"
  on storage.objects for delete
  using (
    bucket_id = 'deliverables'
    and exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );
