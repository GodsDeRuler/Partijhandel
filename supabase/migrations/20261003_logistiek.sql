-- Logistiek: orderpicken, transport, interne werkbrieven en retouren. Verwijderen gaat via 'vervallen'.
alter table orders add column if not exists gepickt_op timestamptz;
alter table orders add column if not exists gepickt_door text;

alter table pakbonnen add column if not exists soort text not null default 'verzenden' check (soort in ('verzenden', 'afhalen', 'eigen_vervoer'));
alter table pakbonnen add column if not exists pallets integer;
alter table pakbonnen add column if not exists colli integer;
alter table pakbonnen add column if not exists gewicht_kg numeric;
alter table pakbonnen add column if not exists gepland_op date;
alter table pakbonnen add column if not exists afhaaltijd text;
create index if not exists pakbonnen_gepland_idx on pakbonnen (gepland_op) where verzonden_op is null;

create table if not exists werkbrieven (
  id bigint generated always as identity primary key,
  soort text not null,
  titel text not null,
  omschrijving text,
  order_nummer bigint references orders (nummer) on delete set null,
  artikel_nr integer references artikelen (artikel_nr) on delete set null,
  toegewezen_aan text,
  prioriteit text not null default 'normaal' check (prioriteit in ('laag', 'normaal', 'hoog')),
  deadline date,
  status text not null default 'open' check (status in ('open', 'bezig', 'klaar')),
  gereed_op timestamptz,
  vervallen boolean not null default false,
  aangemaakt timestamptz not null default now()
);
create index if not exists werkbrieven_status_idx on werkbrieven (status, deadline) where not vervallen;

create table if not exists retouren (
  id bigint generated always as identity primary key,
  datum date not null default current_date,
  klant_id bigint references klanten (id) on delete set null,
  klantnaam text,
  order_nummer bigint references orders (nummer) on delete set null,
  reden text,
  opmerking text,
  status text not null default 'gemeld' check (status in ('gemeld', 'ontvangen', 'afgehandeld')),
  vervallen boolean not null default false,
  aangemaakt timestamptz not null default now()
);
create table if not exists retour_regels (
  id bigint generated always as identity primary key,
  retour_id bigint not null references retouren (id) on delete cascade,
  artikel_nr integer references artikelen (artikel_nr) on delete set null,
  omschrijving text not null,
  aantal integer not null check (aantal > 0),
  afhandeling text check (afhandeling in ('voorraad', 'afkeur')),
  afgehandeld_op timestamptz
);
create index if not exists retour_regels_idx on retour_regels (retour_id);
alter table werkbrieven enable row level security;
alter table retouren enable row level security;
alter table retour_regels enable row level security;
