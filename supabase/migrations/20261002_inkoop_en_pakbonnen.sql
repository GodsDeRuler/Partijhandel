-- Leveranciers, inkooporders (met goederenontvangst) en pakbonnen voor Salesbureau.
create table if not exists public.leveranciers (
  id bigint generated always as identity primary key,
  naam text not null,
  contactpersoon text,
  email text,
  telefoon text,
  adres text,
  postcode text,
  plaats text,
  land text,
  btw_nr text,
  betaaltermijn_dagen integer,
  opmerking text,
  aangemaakt timestamptz not null default now()
);

create table if not exists public.inkooporders (
  id bigint generated always as identity primary key,
  leverancier_id bigint not null references public.leveranciers(id) on delete restrict,
  datum date not null default current_date,
  verwacht date,
  status text not null default 'concept' check (status in ('concept','besteld','deels','ontvangen','geannuleerd')),
  referentie text,
  opmerking text,
  aangemaakt timestamptz not null default now()
);
create index if not exists inkooporders_lev_idx on public.inkooporders (leverancier_id);
create index if not exists inkooporders_status_idx on public.inkooporders (status, datum desc);

create table if not exists public.inkoop_regels (
  id bigint generated always as identity primary key,
  inkooporder_id bigint not null references public.inkooporders(id) on delete cascade,
  artikel_nr integer references public.artikelen(artikel_nr) on delete set null,
  omschrijving text not null,
  aantal integer not null default 1 check (aantal > 0),
  ontvangen integer not null default 0 check (ontvangen >= 0),
  inkoopprijs numeric,
  vervallen boolean not null default false
);
create index if not exists inkoop_regels_idx on public.inkoop_regels (inkooporder_id);

create table if not exists public.pakbonnen (
  id bigint generated always as identity primary key,
  order_nummer bigint not null references public.orders(nummer) on delete cascade,
  datum date not null default current_date,
  verzonden_op date,
  vervoerder text,
  track_trace text,
  opmerking text,
  aangemaakt timestamptz not null default now()
);
create index if not exists pakbonnen_order_idx on public.pakbonnen (order_nummer);

alter table public.artikelen add column if not exists leverancier_id bigint references public.leveranciers(id) on delete set null;

alter table public.leveranciers enable row level security;
alter table public.inkooporders enable row level security;
alter table public.inkoop_regels enable row level security;
alter table public.pakbonnen enable row level security;
