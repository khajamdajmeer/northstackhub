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
-- People documents are issued to
-- ---------------------------------------------------------------------------
-- Upserted by email whenever a document is generated, so every letter and
-- payslip for one person hangs off a single row and the console can show their
-- history. Not a payroll system of record — only what the documents need.

create table if not exists employees (
  id           uuid primary key default gen_random_uuid(),

  full_name    text not null,
  -- Lowercased on write. The natural key: generating a second document for the
  -- same address updates this row rather than creating a duplicate person.
  email        text not null unique,
  phone        text,
  designation  text,
  department   text,
  address      text,
  -- Employee code as it appears on the payslip, e.g. NSH-014.
  employee_code text,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists employees_full_name_idx on employees (lower(full_name));

-- ---------------------------------------------------------------------------
-- Generated HR documents
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'hr_document_type') then
    create type hr_document_type as enum (
      'internship_certificate',
      'payslip',
      'offer_letter',
      'increment_letter'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'hr_document_status') then
    create type hr_document_status as enum ('draft', 'issued', 'revoked');
  end if;
end
$$;

create table if not exists hr_documents (
  id              uuid primary key default gen_random_uuid(),
  employee_id     uuid not null references employees (id) on delete cascade,

  type            hr_document_type not null,
  status          hr_document_status not null default 'draft',

  -- Human-readable reference printed on the document itself, e.g.
  -- NSH/CERT/2026/0007. Unique so a reference can never identify two documents.
  reference       text not null unique,

  -- The document's own fields, validated by the per-type zod schema in
  -- src/lib/admin/hr/schemas.ts before it lands here. Kept as jsonb rather than
  -- four sets of columns because the four types share almost nothing, and a
  -- document must render exactly as it was issued even if the form later gains
  -- or loses a field.
  data            jsonb not null default '{}'::jsonb,

  -- Denormalised at issue time. The employee row can be corrected later; an
  -- issued document must not silently change the name it was handed out under.
  employee_name   text not null,
  issued_on       date not null default current_date,

  created_by      text not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists hr_documents_created_at_idx on hr_documents (created_at desc);
create index if not exists hr_documents_type_idx       on hr_documents (type, created_at desc);
create index if not exists hr_documents_employee_idx   on hr_documents (employee_id, created_at desc);
create index if not exists hr_documents_status_idx     on hr_documents (status);

-- Per-year, per-type counter behind the `reference` column. A sequence would
-- not do: the count has to restart each calendar year and be scoped by type.
create table if not exists hr_document_counters (
  type       hr_document_type not null,
  year       integer not null,
  last_value integer not null default 0,
  primary key (type, year)
);

/**
 * Reserves the next reference for a type and year, atomically.
 *
 * The upsert takes a row lock, so two admins generating a document in the same
 * second cannot be handed the same number — which the unique index on
 * hr_documents.reference would reject anyway, but this avoids the error.
 */
create or replace function next_hr_reference(doc_type hr_document_type, doc_year integer)
returns text
language plpgsql
as $$
declare
  seq    integer;
  prefix text;
begin
  insert into hr_document_counters (type, year, last_value)
  values (doc_type, doc_year, 1)
  on conflict (type, year)
    do update set last_value = hr_document_counters.last_value + 1
  returning last_value into seq;

  prefix := case doc_type
    when 'internship_certificate' then 'CERT'
    when 'payslip'                then 'PAY'
    when 'offer_letter'           then 'OFR'
    when 'increment_letter'       then 'INC'
  end;

  return format('NSH/%s/%s/%s', prefix, doc_year, lpad(seq::text, 4, '0'));
end;
$$;

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------

drop trigger if exists employees_set_updated_at on employees;
create trigger employees_set_updated_at
  before update on employees
  for each row
  execute function set_updated_at();

drop trigger if exists hr_documents_set_updated_at on hr_documents;
create trigger hr_documents_set_updated_at
  before update on hr_documents
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
--
-- This matters more here than for enquiries: these tables hold salary figures
-- and home addresses.

alter table contact_submissions   enable row level security;
alter table submission_events     enable row level security;
alter table admin_audit_log       enable row level security;
alter table employees             enable row level security;
alter table hr_documents          enable row level security;
alter table hr_document_counters  enable row level security;

revoke all on contact_submissions   from anon, authenticated;
revoke all on submission_events     from anon, authenticated;
revoke all on admin_audit_log       from anon, authenticated;
revoke all on employees             from anon, authenticated;
revoke all on hr_documents          from anon, authenticated;
revoke all on hr_document_counters  from anon, authenticated;
revoke all on function next_hr_reference(hr_document_type, integer) from anon, authenticated;
