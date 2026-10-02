-- Stamgegevens, instellingen, facturen, voorraadjournaal, prijsafspraken en contactpersonen voor Salesbureau (MyBusiness-vervanging).

create table if not exists public.instellingen (
  sleutel text primary key,
  waarde text,
  bijgewerkt timestamptz not null default now()
);
insert into public.instellingen (sleutel, waarde) values ('bedrijfsnaam', 'Frank van de Wijgert Partijhandel B.V.') on conflict do nothing;

create table if not exists public.btw_groepen (
  id bigint generated always as identity primary key,
  code text not null unique,
  naam text not null,
  percentage numeric not null default 0,
  actief boolean not null default true
);
insert into public.btw_groepen (code, naam, percentage) values
  ('HOOG', 'Hoog tarief 21%', 21), ('LAAG', 'Laag tarief 9%', 9), ('NUL', 'Nultarief 0%', 0),
  ('VERLEGD', 'Btw verlegd (intracommunautaire levering)', 0), ('EXPORT', 'Export buiten de EU (0%)', 0) on conflict do nothing;

create table if not exists public.betalingscondities (
  id bigint generated always as identity primary key,
  naam text not null,
  dagen integer not null default 30,
  actief boolean not null default true
);
insert into public.betalingscondities (naam, dagen) select * from (values ('Contant / vooraf', 0), ('14 dagen', 14), ('30 dagen', 30), ('60 dagen', 60)) v(n, d)
  where not exists (select 1 from public.betalingscondities);

create table if not exists public.betalingswijzen (
  id bigint generated always as identity primary key,
  naam text not null,
  actief boolean not null default true
);
insert into public.betalingswijzen (naam) select * from (values ('Bankoverschrijving'), ('Contant'), ('Pin'), ('Incasso')) v(n)
  where not exists (select 1 from public.betalingswijzen);

create table if not exists public.landen (
  code text primary key,
  naam text not null,
  eu boolean not null default false
);
insert into public.landen (code, naam, eu) values
  ('NL','Nederland',true),('BE','België',true),('DE','Duitsland',true),('FR','Frankrijk',true),('PL','Polen',true),('EE','Estland',true),('AT','Oostenrijk',true),('DK','Denemarken',true),
  ('FI','Finland',true),('RO','Roemenië',true),('LT','Litouwen',true),('BG','Bulgarije',true),('LV','Letland',true),('IT','Italië',true),('HR','Kroatië',true),('CZ','Tsjechië',true),
  ('ES','Spanje',true),('HU','Hongarije',true),('IE','Ierland',true),('SE','Zweden',true),('MT','Malta',true),('CY','Cyprus',true),('GR','Griekenland',true),('SI','Slovenië',true),
  ('SK','Slowakije',true),('LU','Luxemburg',true),('PT','Portugal',true),
  ('GB','Verenigd Koninkrijk',false),('CH','Zwitserland',false),('MA','Marokko',false),('BA','Bosnië en Herzegovina',false),('ME','Montenegro',false),('XK','Kosovo',false),('IQ','Irak',false),
  ('AL','Albanië',false),('LY','Libië',false),('NZ','Nieuw-Zeeland',false),('UA','Oekraïne',false),('PY','Paraguay',false),('CW','Curaçao',false),('US','Verenigde Staten',false),
  ('MD','Moldavië',false),('IL','Israël',false) on conflict do nothing;

create table if not exists public.merken (
  id bigint generated always as identity primary key,
  naam text not null unique
);
create table if not exists public.vervoerders (
  id bigint generated always as identity primary key,
  naam text not null,
  tracking_url text,
  actief boolean not null default true
);
create table if not exists public.medewerkers (
  id bigint generated always as identity primary key,
  naam text not null,
  email text,
  rol text,
  provisie_pct numeric,
  actief boolean not null default true
);

alter table public.artikelen add column if not exists btw_groep_id bigint references public.btw_groepen(id) on delete set null;
alter table public.artikelen add column if not exists merk_id bigint references public.merken(id) on delete set null;
alter table public.artikelen add column if not exists minimale_voorraad integer;
alter table public.artikelen add column if not exists locatie text;
alter table public.artikelen add column if not exists gewicht_kg numeric;
alter table public.artikelen add column if not exists hs_code text;
alter table public.artikelen add column if not exists verpakking text;
alter table public.artikelen add column if not exists favoriet boolean not null default false;
alter table public.artikelen add column if not exists actief boolean not null default true;
alter table public.klanten add column if not exists betalingsconditie_id bigint references public.betalingscondities(id) on delete set null;

create table if not exists public.personen (
  id bigint generated always as identity primary key,
  klant_id bigint not null references public.klanten(id) on delete cascade,
  naam text not null,
  functie text,
  email text,
  telefoon text,
  opmerking text
);
create index if not exists personen_klant_idx on public.personen (klant_id);

create table if not exists public.voorraad_mutaties (
  id bigint generated always as identity primary key,
  artikel_nr integer not null references public.artikelen(artikel_nr) on delete cascade,
  datum timestamptz not null default now(),
  aantal integer not null,
  soort text not null check (soort in ('inkoop','verkoop','correctie','inventarisatie','retour')),
  referentie text,
  opmerking text
);
create index if not exists voorraad_mutaties_artikel_idx on public.voorraad_mutaties (artikel_nr, datum desc);

create table if not exists public.prijsafspraken (
  id bigint generated always as identity primary key,
  klant_id bigint not null references public.klanten(id) on delete cascade,
  artikel_nr integer not null references public.artikelen(artikel_nr) on delete cascade,
  prijs numeric not null,
  vanaf date not null default current_date,
  tot date,
  opmerking text
);
create index if not exists prijsafspraken_klant_idx on public.prijsafspraken (klant_id);
create table if not exists public.staffelprijzen (
  id bigint generated always as identity primary key,
  artikel_nr integer not null references public.artikelen(artikel_nr) on delete cascade,
  vanaf_aantal integer not null check (vanaf_aantal > 0),
  prijs numeric not null
);
create index if not exists staffelprijzen_artikel_idx on public.staffelprijzen (artikel_nr, vanaf_aantal);

create table if not exists public.facturen (
  id bigint generated always as identity primary key,
  nummer bigint unique,
  type text not null default 'factuur' check (type in ('factuur','credit')),
  credit_van bigint references public.facturen(id) on delete set null,
  klant_id bigint not null references public.klanten(id) on delete restrict,
  order_nummer bigint references public.orders(nummer) on delete set null,
  datum date not null default current_date,
  vervaldatum date,
  status text not null default 'concept' check (status in ('concept','definitief','betaald')),
  btw_regime text not null default 'NL' check (btw_regime in ('NL','verlegd','export')),
  betalingsconditie text,
  referentie text,
  opmerking text,
  totaal_excl numeric not null default 0,
  totaal_btw numeric not null default 0,
  totaal_incl numeric not null default 0,
  aangemaakt timestamptz not null default now()
);
create index if not exists facturen_klant_idx on public.facturen (klant_id);
create index if not exists facturen_status_idx on public.facturen (status, datum desc);
create table if not exists public.factuur_regels (
  id bigint generated always as identity primary key,
  factuur_id bigint not null references public.facturen(id) on delete cascade,
  artikel_nr integer references public.artikelen(artikel_nr) on delete set null,
  omschrijving text not null,
  aantal numeric not null default 1,
  prijs numeric not null default 0,
  btw_pct numeric not null default 21,
  vervallen boolean not null default false
);
create index if not exists factuur_regels_idx on public.factuur_regels (factuur_id);
create table if not exists public.factuur_betalingen (
  id bigint generated always as identity primary key,
  factuur_id bigint not null references public.facturen(id) on delete cascade,
  datum date not null default current_date,
  bedrag numeric not null,
  wijze text,
  opmerking text
);
create index if not exists factuur_betalingen_idx on public.factuur_betalingen (factuur_id);

do $$ declare t text; begin
  foreach t in array array['instellingen','btw_groepen','betalingscondities','betalingswijzen','landen','merken','vervoerders','medewerkers','personen','voorraad_mutaties','prijsafspraken','staffelprijzen','facturen','factuur_regels','factuur_betalingen'] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;
