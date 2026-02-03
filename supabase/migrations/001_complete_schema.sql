-- Horde Portal - Complete Schema (from dev DB)
-- Generated from working dev database

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE user_role AS ENUM ('client', 'admin', 'editor');
CREATE TYPE project_status AS ENUM ('active', 'paused', 'completed', 'archived');
CREATE TYPE phase_status AS ENUM ('pending', 'in_progress', 'review', 'completed');
CREATE TYPE deliverable_status AS ENUM ('draft', 'pending_review', 'approved', 'revision_requested');
CREATE TYPE client_status AS ENUM ('lead', 'contacted', 'in_project', 'pending_review', 'completed', 'archived');
CREATE TYPE contact_role AS ENUM ('decision_maker', 'technical', 'billing', 'marketing', 'other');
CREATE TYPE message_type AS ENUM ('prospecting', 'followup', 'custom');

-- ============================================
-- TABLES
-- ============================================

-- Profiles
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  company text,
  role user_role DEFAULT 'client',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Clients
CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  website text,
  socials jsonb DEFAULT '{}',
  status client_status DEFAULT 'lead',
  notes text,
  profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  first_contact_date timestamptz,
  next_followup_date timestamptz,
  project_type text,
  sector text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Projects
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  status project_status DEFAULT 'active',
  staging_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Phases
CREATE TABLE phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  status phase_status DEFAULT 'pending',
  order_index integer NOT NULL,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Phase Templates
CREATE TABLE phase_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  order_index integer NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Deliverables
CREATE TABLE deliverables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id uuid REFERENCES phases(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status deliverable_status DEFAULT 'draft',
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Files
CREATE TABLE files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id uuid REFERENCES deliverables(id) ON DELETE CASCADE,
  name text NOT NULL,
  storage_path text NOT NULL,
  size_bytes bigint,
  mime_type text,
  version integer DEFAULT 1,
  uploaded_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Links
CREATE TABLE links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id uuid REFERENCES deliverables(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text NOT NULL,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Comments
CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id uuid REFERENCES deliverables(id) ON DELETE CASCADE,
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Project Members
CREATE TABLE project_members (
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);

-- Client Contacts
CREATE TABLE client_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  role contact_role DEFAULT 'other',
  is_primary boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Client Messages
CREATE TABLE client_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES client_contacts(id) ON DELETE SET NULL,
  subject text NOT NULL,
  content text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  sent_by uuid REFERENCES profiles(id),
  message_type message_type DEFAULT 'prospecting'
);

-- Activity Logs
CREATE TABLE activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  deliverable_id uuid REFERENCES deliverables(id) ON DELETE SET NULL,
  action text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Notifications
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text,
  link text,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- API Keys
CREATE TABLE api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name varchar(100) NOT NULL,
  key_hash varchar(64) NOT NULL,
  key_prefix varchar(12) NOT NULL,
  permissions text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_profile_id ON clients(profile_id);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_next_followup_date ON clients(next_followup_date);
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_phases_project_id ON phases(project_id);
CREATE INDEX idx_phases_status ON phases(status);
CREATE INDEX idx_deliverables_phase_id ON deliverables(phase_id);
CREATE INDEX idx_deliverables_status ON deliverables(status);
CREATE INDEX idx_files_deliverable_id ON files(deliverable_id);
CREATE INDEX idx_links_deliverable_id ON links(deliverable_id);
CREATE INDEX idx_comments_deliverable_id ON comments(deliverable_id);
CREATE INDEX idx_comments_author_id ON comments(author_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);
CREATE INDEX idx_client_contacts_client_id ON client_contacts(client_id);
CREATE INDEX idx_client_messages_client_id ON client_messages(client_id);
CREATE INDEX idx_client_messages_sent_at ON client_messages(sent_at DESC);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_profile_id ON api_keys(profile_id);
CREATE INDEX idx_api_keys_is_active ON api_keys(is_active);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
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

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Update API key last used
CREATE OR REPLACE FUNCTION public.update_api_key_last_used(key_hash_param varchar)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
begin
  update api_keys
  set last_used_at = now()
  where key_hash = key_hash_param and is_active = true;
end;
$$;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auth trigger (on auth.users)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at triggers
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_deliverables_updated_at
  BEFORE UPDATE ON deliverables
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE links ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES (no recursion!)
-- ============================================
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Authenticated users can view all profiles" ON profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Service role can insert profiles" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can delete profiles" ON profiles FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================
-- CLIENTS POLICIES
-- ============================================
CREATE POLICY "Admins can view all clients" ON clients FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can insert clients" ON clients FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can update clients" ON clients FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can delete clients" ON clients FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Editors can view all clients" ON clients FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor'));
CREATE POLICY "Editors can insert clients" ON clients FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor'));
CREATE POLICY "Editors can update clients" ON clients FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor'));
CREATE POLICY "Clients can view their own record" ON clients FOR SELECT
  USING (profile_id = auth.uid());

-- ============================================
-- PROJECTS POLICIES
-- ============================================
CREATE POLICY "Admins can view all projects" ON projects FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can insert projects" ON projects FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can update projects" ON projects FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can delete projects" ON projects FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Clients can view their projects via client record" ON projects FOR SELECT
  USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = projects.client_id AND clients.profile_id = auth.uid()));
CREATE POLICY "Team members can view assigned projects" ON projects FOR SELECT
  USING (EXISTS (SELECT 1 FROM project_members WHERE project_id = projects.id AND user_id = auth.uid()));

-- ============================================
-- PHASES POLICIES
-- ============================================
CREATE POLICY "Admins can view all phases" ON phases FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can manage phases" ON phases FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users can view phases of their projects" ON phases FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects
    JOIN clients ON clients.id = projects.client_id
    WHERE projects.id = phases.project_id
    AND (clients.profile_id = auth.uid() OR EXISTS (
      SELECT 1 FROM project_members WHERE project_id = projects.id AND user_id = auth.uid()
    ))
  ));

-- ============================================
-- PHASE TEMPLATES POLICIES
-- ============================================
CREATE POLICY "Anyone can view phase templates" ON phase_templates FOR SELECT USING (true);
CREATE POLICY "Admins can insert templates" ON phase_templates FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can update templates" ON phase_templates FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can delete templates" ON phase_templates FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================
-- DELIVERABLES POLICIES
-- ============================================
CREATE POLICY "Admins can view all deliverables" ON deliverables FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can manage deliverables" ON deliverables FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users can view deliverables of their projects" ON deliverables FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM phases
    JOIN projects ON projects.id = phases.project_id
    JOIN clients ON clients.id = projects.client_id
    WHERE phases.id = deliverables.phase_id
    AND (clients.profile_id = auth.uid() OR EXISTS (
      SELECT 1 FROM project_members WHERE project_id = projects.id AND user_id = auth.uid()
    ))
  ));
CREATE POLICY "Clients can update deliverable status" ON deliverables FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM phases
    JOIN projects ON projects.id = phases.project_id
    JOIN clients ON clients.id = projects.client_id
    WHERE phases.id = deliverables.phase_id AND clients.profile_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM phases
    JOIN projects ON projects.id = phases.project_id
    JOIN clients ON clients.id = projects.client_id
    WHERE phases.id = deliverables.phase_id AND clients.profile_id = auth.uid()
  ));

-- ============================================
-- FILES POLICIES
-- ============================================
CREATE POLICY "Admins can view all files" ON files FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can manage files" ON files FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users can view files of their projects" ON files FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM deliverables
    JOIN phases ON phases.id = deliverables.phase_id
    JOIN projects ON projects.id = phases.project_id
    JOIN clients ON clients.id = projects.client_id
    WHERE deliverables.id = files.deliverable_id
    AND (clients.profile_id = auth.uid() OR EXISTS (
      SELECT 1 FROM project_members WHERE project_id = projects.id AND user_id = auth.uid()
    ))
  ));

-- ============================================
-- COMMENTS POLICIES
-- ============================================
CREATE POLICY "Admins can view all comments" ON comments FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can manage comments" ON comments FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users can view comments on their project deliverables" ON comments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM deliverables
    JOIN phases ON phases.id = deliverables.phase_id
    JOIN projects ON projects.id = phases.project_id
    JOIN clients ON clients.id = projects.client_id
    WHERE deliverables.id = comments.deliverable_id
    AND (clients.profile_id = auth.uid() OR EXISTS (
      SELECT 1 FROM project_members WHERE project_id = projects.id AND user_id = auth.uid()
    ))
  ));
CREATE POLICY "Users can insert comments on their project deliverables" ON comments FOR INSERT
  WITH CHECK (author_id = auth.uid() AND EXISTS (
    SELECT 1 FROM deliverables
    JOIN phases ON phases.id = deliverables.phase_id
    JOIN projects ON projects.id = phases.project_id
    JOIN clients ON clients.id = projects.client_id
    WHERE deliverables.id = comments.deliverable_id
    AND (clients.profile_id = auth.uid() OR EXISTS (
      SELECT 1 FROM project_members WHERE project_id = projects.id AND user_id = auth.uid()
    ))
  ));

-- ============================================
-- PROJECT MEMBERS POLICIES
-- ============================================
CREATE POLICY "Admins can view all memberships" ON project_members FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can manage memberships" ON project_members FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Members can view their own membership" ON project_members FOR SELECT
  USING (user_id = auth.uid());

-- ============================================
-- CLIENT CONTACTS POLICIES
-- ============================================
CREATE POLICY "Admins can view all contacts" ON client_contacts FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can insert contacts" ON client_contacts FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can update contacts" ON client_contacts FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can delete contacts" ON client_contacts FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Editors can view all contacts" ON client_contacts FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor'));
CREATE POLICY "Editors can insert contacts" ON client_contacts FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor'));
CREATE POLICY "Editors can update contacts" ON client_contacts FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor'));
CREATE POLICY "Editors can delete contacts" ON client_contacts FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor'));
CREATE POLICY "Clients can view their contacts" ON client_contacts FOR SELECT
  USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = client_contacts.client_id AND clients.profile_id = auth.uid()));

-- ============================================
-- CLIENT MESSAGES POLICIES
-- ============================================
CREATE POLICY "Admins can view all messages" ON client_messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can insert messages" ON client_messages FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can update messages" ON client_messages FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can delete messages" ON client_messages FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Editors can view all messages" ON client_messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor'));
CREATE POLICY "Clients can view their messages" ON client_messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = client_messages.client_id AND clients.profile_id = auth.uid()));

-- ============================================
-- ACTIVITY LOGS POLICIES (no recursion!)
-- ============================================
CREATE POLICY "Admins can read all logs" ON activity_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Authenticated users can insert logs" ON activity_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- NOTIFICATIONS POLICIES (no recursion!)
-- ============================================
CREATE POLICY "Users can read own notifications" ON notifications FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "Service role can insert notifications" ON notifications FOR INSERT
  WITH CHECK (true);

-- ============================================
-- API KEYS POLICIES
-- ============================================
CREATE POLICY "Admins can view all api keys" ON api_keys FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can insert api keys" ON api_keys FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can update api keys" ON api_keys FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can delete api keys" ON api_keys FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================
-- STORAGE BUCKET
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('deliverables', 'deliverables', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;

-- ============================================
-- STORAGE POLICIES
-- ============================================
CREATE POLICY "Users can view files from their projects" ON storage.objects FOR SELECT
  USING (bucket_id = 'deliverables' AND EXISTS (
    SELECT 1 FROM files
    JOIN deliverables ON deliverables.id = files.deliverable_id
    JOIN phases ON phases.id = deliverables.phase_id
    JOIN projects ON projects.id = phases.project_id
    JOIN clients ON clients.id = projects.client_id
    WHERE files.storage_path = storage.objects.name
    AND (clients.profile_id = auth.uid() OR EXISTS (
      SELECT 1 FROM project_members WHERE project_id = projects.id AND user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ))
  ));
CREATE POLICY "Admins can upload files" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'deliverables' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can delete files" ON storage.objects FOR DELETE
  USING (bucket_id = 'deliverables' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Avatars policies
CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update avatars" ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete avatars" ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

-- ============================================
-- SEED DATA
-- ============================================
INSERT INTO phase_templates (name, description, order_index, is_default) VALUES
  ('Audit', 'Analyse de l''existant et benchmark concurrentiel', 0, true),
  ('Proposition', 'Proposition commerciale et devis', 1, true),
  ('Brief', 'Definition des besoins, objectifs et specifications', 2, true),
  ('Maquette', 'Design UI/UX et wireframes', 3, true),
  ('Validation maquette', 'Approbation des maquettes par le client', 4, true),
  ('Developpement', 'Integration et developpement technique', 5, true),
  ('Validation staging', 'Tests et recette sur environnement de pre-production', 6, true),
  ('Mise en production', 'Deploiement et lancement officiel', 7, true),
  ('Review', 'Retour d''experience et ajustements post-lancement', 8, true);
