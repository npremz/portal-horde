-- 18b. Editor role policies
-- Adds RLS policies for editor role

-- RLS policies for clients table
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

-- RLS policies for client_contacts table
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

-- RLS policies for client_messages table (view only)
CREATE POLICY "Editors can view all messages"
  ON client_messages FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'editor')
  );
