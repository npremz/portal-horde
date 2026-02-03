-- 11. Phase templates table
-- Reusable phase templates that can be selected when creating projects

create table phase_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  order_index int not null,
  is_default boolean default false,  -- Include by default in new projects
  created_at timestamptz default now()
);

-- Insert the 9 default phases as templates
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

-- RLS
alter table phase_templates enable row level security;

-- Everyone can read templates
create policy "Anyone can view phase templates"
  on phase_templates for select
  using (true);

-- Only admins can manage templates
create policy "Admins can insert templates"
  on phase_templates for insert
  with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update templates"
  on phase_templates for update
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can delete templates"
  on phase_templates for delete
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
