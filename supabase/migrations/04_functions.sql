-- 4. Functions et Triggers

-- Fonction pour creer automatiquement un profil apres inscription
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

-- Trigger sur auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Fonction pour mettre a jour updated_at
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Triggers updated_at sur les tables concernees
create trigger handle_profiles_updated_at
  before update on profiles
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

-- Fonction pour creer les phases par defaut d'un projet
create or replace function public.create_default_phases()
returns trigger
language plpgsql
as $$
begin
  insert into phases (project_id, name, description, order_index) values
    (new.id, 'Audit', 'Analyse de l''existant et benchmark concurrentiel', 0),
    (new.id, 'Proposition', 'Proposition commerciale et devis', 1),
    (new.id, 'Brief', 'Definition des besoins, objectifs et specifications', 2),
    (new.id, 'Maquette', 'Design UI/UX et wireframes', 3),
    (new.id, 'Validation maquette', 'Approbation des maquettes par le client', 4),
    (new.id, 'Developpement', 'Integration et developpement technique', 5),
    (new.id, 'Validation staging', 'Tests et recette sur environnement de pre-production', 6),
    (new.id, 'Mise en production', 'Deploiement et lancement officiel', 7),
    (new.id, 'Review', 'Retour d''experience et ajustements post-lancement', 8);
  return new;
end;
$$;

create trigger on_project_created
  after insert on projects
  for each row execute procedure create_default_phases();
