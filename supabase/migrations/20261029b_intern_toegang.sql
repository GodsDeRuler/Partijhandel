-- Medewerkersomgeving (Salesbureau als webapp met inlog per medewerker).
-- LET OP: dit bestand is nog NIET toegepast op de database. Toepassen na akkoord van Michel (zie website/README.md, "Medewerkersomgeving").

-- 1. Wie mag erin, en met welke rol
alter table medewerkers add column if not exists aangemaakt timestamptz not null default now();
alter table medewerkers drop constraint if exists medewerkers_rol_check;
alter table medewerkers add constraint medewerkers_rol_check check (rol is null or rol in ('beheer', 'verkoop', 'magazijn', 'alleen_lezen'));
create unique index if not exists medewerkers_email_uq on medewerkers (lower(email)) where email is not null;

-- 2. Logboek van schrijfopdrachten (wie deed wat, wanneer)
create table if not exists intern_log (
  id bigserial primary key,
  tijd timestamptz not null default now(),
  medewerker_id bigint references medewerkers(id),
  query text,
  ms integer,
  fout text
);
alter table intern_log enable row level security;
create index if not exists intern_log_tijd_idx on intern_log (tijd desc);

-- 3. Databasegebruiker voor de server van de site. Het wachtwoord zet Michel zelf (nooit in de repository):
--    alter role salesbureau_app with password '<zelf te kiezen>';
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'salesbureau_app') then
    create role salesbureau_app login noinherit;
  end if;
end $$;
grant usage on schema public to salesbureau_app;
grant select, insert, update, delete on all tables in schema public to salesbureau_app;
grant usage, select on all sequences in schema public to salesbureau_app;
grant execute on all functions in schema public to salesbureau_app;
alter default privileges in schema public grant select, insert, update, delete on tables to salesbureau_app;
alter default privileges in schema public grant usage, select on sequences to salesbureau_app;
alter default privileges in schema public grant execute on functions to salesbureau_app;

-- 4. Alle tabellen staan onder RLS zonder regels voor bezoekers. Deze gebruiker krijgt op elke tabel één regel die alles toestaat.
--    Draai select intern_policies(); opnieuw na elke migratie die een tabel toevoegt.
create or replace function intern_policies() returns integer language plpgsql as $f$
declare t record; n integer := 0;
begin
  for t in select tablename from pg_tables where schemaname = 'public' and rowsecurity loop
    execute format('drop policy if exists salesbureau_app_alles on public.%I', t.tablename);
    execute format('create policy salesbureau_app_alles on public.%I for all to salesbureau_app using (true) with check (true)', t.tablename);
    n := n + 1;
  end loop;
  return n;
end $f$;
revoke execute on function intern_policies() from public, anon, authenticated;
select intern_policies();
