-- Links table for deliverables (external URLs)
create table links (
  id uuid primary key default gen_random_uuid(),
  deliverable_id uuid references deliverables(id) on delete cascade,
  title text not null,
  url text not null,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Index for faster lookups
CREATE INDEX idx_links_deliverable_id ON links(deliverable_id);
