-- Offertes, offerteregels, orderregels en uitbreiding campagnes/verzendingen voor Salesbureau.
create table if not exists public.offertes (
  id bigint generated always as identity primary key,
  klant_id bigint not null references public.klanten(id) on delete restrict,
  datum date not null default current_date,
  geldig_tot date,
  status text not null default 'aanvraag' check (status in ('aanvraag','gereserveerd','offerte','besteld','afgewezen','verlopen')),
  bron text not null default 'handmatig' check (bron in ('handmatig','mail','webshop')),
  opmerking text,
  order_nummer bigint references public.orders(nummer) on delete set null,
  aangemaakt timestamptz not null default now()
);
create index if not exists offertes_klant_idx on public.offertes (klant_id);
create index if not exists offertes_status_idx on public.offertes (status, datum desc);

create table if not exists public.offerte_regels (
  id bigint generated always as identity primary key,
  offerte_id bigint not null references public.offertes(id) on delete cascade,
  artikel_nr integer references public.artikelen(artikel_nr) on delete set null,
  omschrijving text not null,
  aantal integer not null default 1 check (aantal > 0),
  prijs numeric,
  inkoop numeric
);
create index if not exists offerte_regels_idx on public.offerte_regels (offerte_id);

create table if not exists public.order_regels (
  id bigint generated always as identity primary key,
  order_nummer bigint not null references public.orders(nummer) on delete cascade,
  artikel_nr integer references public.artikelen(artikel_nr) on delete set null,
  omschrijving text not null,
  aantal integer not null default 1,
  prijs numeric,
  inkoop numeric
);
create index if not exists order_regels_idx on public.order_regels (order_nummer);

alter table public.offertes enable row level security;
alter table public.offerte_regels enable row level security;
alter table public.order_regels enable row level security;

create unique index if not exists verzendingen_uniek on public.verzendingen (campagne_id, klant_id);
create index if not exists verzendingen_klant_idx on public.verzendingen (klant_id);

alter table public.offerte_regels add column if not exists vervallen boolean not null default false;
