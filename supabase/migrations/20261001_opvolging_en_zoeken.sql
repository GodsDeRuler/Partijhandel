-- Opvolgingslog voor de werkomgeving (toegepast op project suwsagwkzflsahaptasy op 2026-10-01)
create table if not exists public.opvolging (
  id bigint generated always as identity primary key,
  klant_id bigint not null references public.klanten(id) on delete cascade,
  soort text not null default 'notitie' check (soort in ('mail','offerte','reactie','notitie')),
  tekst text,
  opvolgdatum date,
  afgehandeld boolean not null default false,
  aangemaakt timestamptz not null default now()
);
create index if not exists opvolging_klant_idx on public.opvolging (klant_id);
create index if not exists opvolging_open_idx on public.opvolging (opvolgdatum) where not afgehandeld;
alter table public.opvolging enable row level security;
create index if not exists orders_klant_idx on public.orders (klant_id, datum desc);
create index if not exists klanten_email_lower_idx on public.klanten (lower(email));
