-- 6. Index pour performance

create index idx_projects_client_id on projects(client_id);
create index idx_projects_status on projects(status);
create index idx_phases_project_id on phases(project_id);
create index idx_phases_status on phases(status);
create index idx_deliverables_phase_id on deliverables(phase_id);
create index idx_deliverables_status on deliverables(status);
create index idx_files_deliverable_id on files(deliverable_id);
create index idx_comments_deliverable_id on comments(deliverable_id);
create index idx_comments_author_id on comments(author_id);
create index idx_project_members_user_id on project_members(user_id);
