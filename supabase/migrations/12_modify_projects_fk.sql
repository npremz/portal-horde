-- 12. Modify projects FK to point to clients instead of profiles
-- This is a major migration that changes the relationship model

-- Step 0: Drop RLS policies that depend on the old client_id column
DROP POLICY IF EXISTS "Clients can view their projects" ON projects;
DROP POLICY IF EXISTS "Users can view phases of their projects" ON phases;
DROP POLICY IF EXISTS "Users can view deliverables of their projects" ON deliverables;
DROP POLICY IF EXISTS "Users can view files of their projects" ON files;
DROP POLICY IF EXISTS "Users can view comments on their project deliverables" ON comments;
DROP POLICY IF EXISTS "Users can insert comments on their project deliverables" ON comments;
DROP POLICY IF EXISTS "Users can view files from their projects" ON storage.objects;

-- Step 1: Create clients for existing projects that have profiles
-- This preserves all existing data
insert into clients (name, email, profile_id, status)
select
  coalesce(p.full_name, p.company, p.email) as name,
  p.email,
  p.id as profile_id,
  'in_project'::client_status as status
from profiles p
where p.role = 'client'
  and exists (select 1 from projects where projects.client_id = p.id)
  and not exists (select 1 from clients where clients.profile_id = p.id)
on conflict (email) do nothing;

-- Step 2: Add new column for client reference
alter table projects add column new_client_id uuid references clients(id) on delete set null;

-- Step 3: Migrate data - link projects to the new clients table
update projects
set new_client_id = (
  select c.id from clients c
  where c.profile_id = projects.client_id
)
where projects.client_id is not null;

-- Step 4: Drop old FK constraint and column
alter table projects drop constraint if exists projects_client_id_fkey;
alter table projects drop column client_id;

-- Step 5: Rename new column to client_id
alter table projects rename column new_client_id to client_id;

-- Step 6: Create index on new FK
create index idx_projects_client_id on projects(client_id);
