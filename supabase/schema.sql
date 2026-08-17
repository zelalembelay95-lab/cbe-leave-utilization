-- CBE Leave Utilization — Supabase schema
-- Run this once in Supabase: Project → SQL Editor → New query → paste → Run.
--
-- Security model: the browser never talks to Supabase directly. All reads
-- and writes go through the Cloudflare Pages Functions in /functions/api,
-- which verify the user's Firebase Auth token first and then use the
-- Supabase *service role* key (kept secret in Cloudflare's environment
-- variables). Row Level Security is enabled below and left "deny all" as a
-- safety net — the anon/public key alone can never read or write anything.

create extension if not exists "pgcrypto";

-- Mirrors the Firebase-authenticated user + their app role.
create table if not exists app_users (
  uid text primary key,               -- Firebase Auth UID
  email text not null,
  display_name text,
  role text not null default 'pending' check (role in ('pending','employee','team_leader','manager','admin')),
  employee_id text,
  created_at timestamptz not null default now()
);

-- The HR/Oracle employee roster + HR's leave balance export.
create table if not exists employees (
  id text primary key,                -- staff ID, e.g. "70695"
  full_name text not null,
  position text not null default '',
  department text not null default '',
  sector text not null default '',
  division text not null default '',
  -- From HR's leave balance export:
  net_accrual_tillnow numeric not null default 0,   -- total unused leave accrued as of the export
  leave_expiring_dec31 numeric not null default 0,  -- portion of the above lost if unused by Dec 31
  status text not null default 'active' check (status in ('active','inactive'))
);

-- Weekly leave submissions.
create table if not exists leave_entries (
  id uuid primary key default gen_random_uuid(),
  employee_id text not null references employees(id) on delete cascade,
  employee_name text not null,
  position text not null default '',
  sector text not null default '',
  department text not null default '',
  days_count numeric not null,
  start_date date not null,
  end_date date not null,
  week_start date not null,
  week_end date not null,
  month int not null,
  year int not null,
  submitted_by_uid text not null,
  submitted_by_name text,
  submitted_at timestamptz not null default now()
); 

create index if not exists leave_entries_year_idx on leave_entries (year);
create index if not exists leave_entries_week_start_idx on leave_entries (week_start);
create index if not exists leave_entries_employee_idx on leave_entries (employee_id);
create index if not exists leave_entries_submitted_by_idx on leave_entries (submitted_by_uid);

-- Enable RLS and leave no policies attached, so the anon/public API key
-- (if it ever leaked) still can't read or write anything. Only the service
-- role key — used exclusively inside Cloudflare Pages Functions — bypasses
-- RLS and can reach these tables.
alter table app_users enable row level security;
alter table employees enable row level security;
alter table leave_entries enable row level security;
