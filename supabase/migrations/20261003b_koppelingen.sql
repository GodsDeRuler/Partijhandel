-- Koppelingen tussen verkoop, website en backoffice
-- 1) Krediet per klant en betalingsherinneringen (aanmaningen) per factuur
-- 2) Per artikel: waar mag het worden aangeboden (website/inlog/alleen per mail), welke landen zijn uitgesloten en welke beperking geldt
alter table klanten add column if not exists kredietlimiet numeric check (kredietlimiet is null or kredietlimiet >= 0);

alter table artikelen add column if not exists zichtbaarheid text not null default 'alleen_mail' check (zichtbaarheid in ('openbaar', 'inlog', 'alleen_mail'));
alter table artikelen add column if not exists geblokkeerde_landen text[] not null default '{}';
alter table artikelen add column if not exists verkoopbeperking text;

create table if not exists aanmaningen (
  id bigint generated always as identity primary key,
  factuur_id bigint not null references facturen (id),
  niveau smallint not null check (niveau between 1 and 3),
  datum date not null default current_date,
  opmerking text,
  aangemaakt timestamptz not null default now()
);
create index if not exists aanmaningen_factuur_idx on aanmaningen (factuur_id);
alter table aanmaningen enable row level security;
