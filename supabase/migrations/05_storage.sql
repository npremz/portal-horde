-- 5. Storage bucket et policies

-- Creer le bucket pour les livrables
insert into storage.buckets (id, name, public)
values ('deliverables', 'deliverables', false)
on conflict (id) do nothing;

-- Policy: Les utilisateurs peuvent voir les fichiers de leurs projets
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

-- Policy: Les admins peuvent uploader des fichiers
create policy "Admins can upload files"
  on storage.objects for insert
  with check (
    bucket_id = 'deliverables'
    and exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Policy: Les admins peuvent supprimer des fichiers
create policy "Admins can delete files"
  on storage.objects for delete
  using (
    bucket_id = 'deliverables'
    and exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );
