-- 16. Add contact tracking fields to clients

alter table clients add column first_contact_date timestamptz;
alter table clients add column next_followup_date timestamptz;

-- Index for followup queries
create index idx_clients_next_followup_date on clients(next_followup_date);
