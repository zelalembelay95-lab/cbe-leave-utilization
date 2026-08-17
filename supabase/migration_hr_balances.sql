-- Run this ONLY if you already created the `employees` table using an
-- earlier version of schema.sql (the one with an `annual_entitlement`
-- column). If you're setting up Supabase for the first time, ignore this
-- file — schema.sql already has the right columns.
--
-- Supabase → SQL Editor → New query → paste this → Run.

alter table employees
  add column if not exists net_accrual_tillnow numeric not null default 0,
  add column if not exists leave_expiring_dec31 numeric not null default 0;

-- Optional: drop the old column once you've re-imported balances via
-- Admin → Employees → "Load starter roster" (or entered them by hand).
-- alter table employees drop column if exists annual_entitlement;
