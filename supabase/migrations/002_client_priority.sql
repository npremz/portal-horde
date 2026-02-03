-- Add priority flag to clients
ALTER TABLE clients ADD COLUMN is_priority boolean DEFAULT false;

-- Index for faster filtering by priority
CREATE INDEX idx_clients_priority ON clients(is_priority) WHERE is_priority = true;
