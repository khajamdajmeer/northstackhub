-- Schema for the /aka admin console.
--
-- Applied against the project's Postgres directly. Re-running is safe: every
-- statement is guarded, so this doubles as the migration record and the
-- provisioning script for a fresh environment.
--
--   psql "$SUPABASE_DB_URL" -f supabase/schema.sql
--
-- All reads and writes go through the service role from server-side code. RLS
-- is on with no permissive policy for anon or authenticated, so a leaked
-- publishable key cannot reach the enquiry data.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enquiries
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'submission_status') then
    create type submission_status as enum (
      'new',
      'contacted',
      'qualified',
      'proposal_sent',
      'won',
      'lost',
      'archived'
    );
  end if;
end
$$;

create table if not exists contact_submissions (
  id            uuid primary key default gen_random_uuid(),

  -- Mirrors the zod schema the public form validates against. Only name, email
  -- and message are required there, so everything else is nullable here.
  name          text not null,
  email         text not null,
  company       text,
  project_type  text,
  budget        text,
  timeline      text,
  message       text not null,

  status        submission_status not null default 'new',
  -- Internal working notes. Never shown to the person who submitted the form.
  notes         text,

  -- How the enquiry arrived. 'website' for the contact form; kept open for
  -- entries added by hand or imported later.
  source        text not null default 'website',

  -- Request metadata, captured for spam triage rather than analytics.
  ip_address    text,
  user_agent    text,
  referer       text,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists contact_submissions_created_at_idx
  on contact_submissions (created_at desc);
create index if not exists contact_submissions_status_idx
  on contact_submissions (status);
create index if not exists contact_submissions_email_idx
  on contact_submissions (lower(email));

-- ---------------------------------------------------------------------------
-- Per-enquiry activity trail
-- ---------------------------------------------------------------------------

create table if not exists submission_events (
  id            uuid primary key default gen_random_uuid(),
  submission_id uuid not null references contact_submissions (id) on delete cascade,

  -- null on the creation event, since there is no prior status.
  from_status   submission_status,
  to_status     submission_status,
  note          text,

  -- Email of the signed-in admin, or 'system' for automatic entries.
  actor         text not null default 'system',
  created_at    timestamptz not null default now()
);

create index if not exists submission_events_submission_id_idx
  on submission_events (submission_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Admin audit log
-- ---------------------------------------------------------------------------
-- Sign-in attempts (including failures) and every mutating action taken in the
-- console. Separate from submission_events because it outlives the rows it
-- refers to and is queried on its own timeline.

create table if not exists admin_audit_log (
  id            uuid primary key default gen_random_uuid(),
  actor         text not null,
  action        text not null,
  target_type   text,
  target_id     text,
  metadata      jsonb not null default '{}'::jsonb,
  ip_address    text,
  user_agent    text,
  created_at    timestamptz not null default now()
);

create index if not exists admin_audit_log_created_at_idx
  on admin_audit_log (created_at desc);
create index if not exists admin_audit_log_action_idx
  on admin_audit_log (action, created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------

-- clock_timestamp(), not now(): now() is the transaction start time, so a row
-- inserted and updated in the same transaction would keep an updated_at equal
-- to its created_at.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = clock_timestamp();
  return new;
end;
$$;

drop trigger if exists contact_submissions_set_updated_at on contact_submissions;
create trigger contact_submissions_set_updated_at
  before update on contact_submissions
  for each row
  execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
-- Enabled with no policies attached. The service role bypasses RLS, so the
-- server keeps full access while anon and authenticated get nothing. This is
-- deliberate: the console authenticates against ADMIN_EMAIL / ADMIN_PASSWORD_HASH
-- rather than Supabase Auth, so there is no authenticated Postgres role to
-- write a policy for.

alter table contact_submissions enable row level security;
alter table submission_events   enable row level security;
alter table admin_audit_log     enable row level security;

revoke all on contact_submissions from anon, authenticated;
revoke all on submission_events   from anon, authenticated;
revoke all on admin_audit_log     from anon, authenticated;
