-- 8. CRM Enums

-- Client status in CRM workflow
create type client_status as enum (
  'lead',           -- Initial contact, no project yet
  'contacted',      -- In discussion
  'in_project',     -- Has active project(s)
  'pending_review', -- Project in review phase
  'completed',      -- All projects completed
  'archived'        -- Inactive client
);

-- Contact roles within a client organization
create type contact_role as enum (
  'decision_maker', -- The one who signs off
  'technical',      -- Technical contact (developer, IT)
  'billing',        -- Finance/accounting contact
  'marketing',      -- Marketing contact
  'other'           -- Other role
);
