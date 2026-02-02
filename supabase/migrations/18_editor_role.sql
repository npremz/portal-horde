-- 18. Editor role
-- Adds 'editor' role for AI agents/collaborators who can manage clients/contacts
-- but cannot send messages or invite clients to the portal

-- NOTE: PostgreSQL requires enum values to be committed before use.
-- This migration must be run in two separate transactions:
-- 1. First: ALTER TYPE user_role ADD VALUE 'editor';
-- 2. Then: All CREATE POLICY statements below

-- Add the editor value to user_role enum
ALTER TYPE user_role ADD VALUE 'editor';

-- ============================================
-- RUN THE FOLLOWING IN A SEPARATE TRANSACTION
-- ============================================

-- RLS policies for clients table
-- Editors can view all clients
CREATE POLICY "Editors can view all clients"
  ON clients FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor')
  );

CREATE POLICY "Editors can insert clients"
  ON clients FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor')
  );

CREATE POLICY "Editors can update clients"
  ON clients FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor')
  );

-- NOTE: Editors cannot delete clients (admin only)

-- RLS policies for client_contacts table
-- Editors can manage contacts
CREATE POLICY "Editors can view all contacts"
  ON client_contacts FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor')
  );

CREATE POLICY "Editors can insert contacts"
  ON client_contacts FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor')
  );

CREATE POLICY "Editors can update contacts"
  ON client_contacts FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor')
  );

CREATE POLICY "Editors can delete contacts"
  ON client_contacts FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor')
  );

-- RLS policies for client_messages table
-- Editors can ONLY VIEW messages (no insert/update/delete)
CREATE POLICY "Editors can view all messages"
  ON client_messages FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor')
  );

-- NOTE: Editors cannot INSERT into client_messages (prospection is admin-only)
-- NOTE: Editors cannot UPDATE or DELETE messages (admin-only)
