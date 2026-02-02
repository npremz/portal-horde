-- 17. Add project_type and sector fields to clients

alter table clients add column project_type text;
alter table clients add column sector text;

-- Index for filtering
create index idx_clients_project_type on clients(project_type);
create index idx_clients_sector on clients(sector);
