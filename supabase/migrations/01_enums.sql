-- 1. Extensions et Enums
create extension if not exists "uuid-ossp";

create type user_role as enum ('client', 'admin');
create type project_status as enum ('active', 'paused', 'completed', 'archived');
create type phase_status as enum ('pending', 'in_progress', 'review', 'completed');
create type deliverable_status as enum ('draft', 'pending_review', 'approved', 'revision_requested');
