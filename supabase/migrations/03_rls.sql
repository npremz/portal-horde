-- 3. Row Level Security

alter table profiles enable row level security;
alter table projects enable row level security;
alter table phases enable row level security;
alter table deliverables enable row level security;
alter table files enable row level security;
alter table comments enable row level security;
alter table project_members enable row level security;

-- PROFILES policies
create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on profiles for select
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Admins can update any profile"
  on profiles for update
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can insert profiles"
  on profiles for insert
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- PROJECTS policies
create policy "Clients can view their projects"
  on projects for select
  using (client_id = auth.uid());

create policy "Team members can view assigned projects"
  on projects for select
  using (
    exists (
      select 1 from project_members
      where project_id = id and user_id = auth.uid()
    )
  );

create policy "Admins can view all projects"
  on projects for select
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can insert projects"
  on projects for insert
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update projects"
  on projects for update
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can delete projects"
  on projects for delete
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- PHASES policies
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

create policy "Admins can view all phases"
  on phases for select
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can manage phases"
  on phases for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- DELIVERABLES policies
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

create policy "Admins can view all deliverables"
  on deliverables for select
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can manage deliverables"
  on deliverables for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- FILES policies
create policy "Users can view files of their projects"
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

create policy "Admins can view all files"
  on files for select
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can manage files"
  on files for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- COMMENTS policies
create policy "Users can view comments on their project deliverables"
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

create policy "Admins can view all comments"
  on comments for select
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Users can insert comments on their project deliverables"
  on comments for insert
  with check (
    author_id = auth.uid()
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

create policy "Admins can manage comments"
  on comments for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- PROJECT_MEMBERS policies
create policy "Members can view their own membership"
  on project_members for select
  using (user_id = auth.uid());

create policy "Admins can view all memberships"
  on project_members for select
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can manage memberships"
  on project_members for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
