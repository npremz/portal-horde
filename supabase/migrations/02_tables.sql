-- 2. Tables principales

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

-- Projects
create table projects (
  id uuid primary key default gen_random_uuid(),
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

-- Comments
create table comments (
  id uuid primary key default gen_random_uuid(),
  deliverable_id uuid references deliverables(id) on delete cascade,
  author_id uuid references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Project members (team Horde assignee)
create table project_members (
  project_id uuid references projects(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (project_id, user_id)
);
