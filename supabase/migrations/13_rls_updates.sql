-- 13. RLS Policy Updates for new client relationship
-- projects.client_id now points to clients.id instead of profiles.id
-- Access chain: profiles (auth) -> clients (profile_id) -> projects (client_id)

-- Drop old project policies that reference the old FK
drop policy if exists "Clients can view their projects" on projects;

-- Create new policy using the new relationship chain
create policy "Clients can view their projects via client record"
  on projects for select
  using (
    exists (
      select 1 from clients
      where clients.id = projects.client_id
      and clients.profile_id = auth.uid()
    )
  );

-- Update phases policy
drop policy if exists "Users can view phases of their projects" on phases;

create policy "Users can view phases of their projects"
  on phases for select
  using (
    exists (
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
    )
  );

-- Update deliverables policy
drop policy if exists "Users can view deliverables of their projects" on deliverables;

create policy "Users can view deliverables of their projects"
  on deliverables for select
  using (
    exists (
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
    )
  );

-- Update files policy
drop policy if exists "Users can view files of their projects" on files;

create policy "Users can view files of their projects"
  on files for select
  using (
    exists (
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
    )
  );

-- Update comments select policy
drop policy if exists "Users can view comments on their project deliverables" on comments;

create policy "Users can view comments on their project deliverables"
  on comments for select
  using (
    exists (
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

-- Update comments insert policy
drop policy if exists "Users can insert comments on their project deliverables" on comments;

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

-- Update the auto-create phases function to not create phases automatically
-- (we'll now use phase templates selected by admin)
drop trigger if exists on_project_created on projects;
drop function if exists create_default_phases();
