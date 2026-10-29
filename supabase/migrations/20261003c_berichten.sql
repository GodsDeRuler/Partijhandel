-- Berichten tussen klant en verkoop, per offerte of order (chat in de klantomgeving van de nieuwe site).
-- Additief: alleen een nieuwe tabel. Terugdraaien: drop table berichten;
create table if not exists berichten (
  id bigint generated always as identity primary key,
  klant_id bigint not null references klanten(id),
  offerte_id bigint references offertes(id),
  order_nummer bigint references orders(nummer),
  afzender text not null check (afzender in ('klant', 'verkoop')),
  afzender_naam text,
  tekst text not null check (length(tekst) between 1 and 4000),
  kanaal text not null default 'website' check (kanaal in ('website', 'mail', 'telefoon', 'whatsapp')),
  aangemaakt timestamptz not null default now(),
  gelezen_op timestamptz,
  constraint bericht_hoort_ergens_bij check (offerte_id is not null or order_nummer is not null)
);
create index if not exists berichten_klant_idx on berichten (klant_id, aangemaakt desc);
create index if not exists berichten_offerte_idx on berichten (offerte_id) where offerte_id is not null;
create index if not exists berichten_order_idx on berichten (order_nummer) where order_nummer is not null;
-- Ongelezen vragen van klanten (teller in het Salesbureau)
create index if not exists berichten_ongelezen_idx on berichten (aangemaakt) where afzender = 'klant' and gelezen_op is null;
alter table berichten enable row level security;
-- Geen policies: net als de andere tabellen alleen bereikbaar via de Supabase-koppeling van het Salesbureau.
-- Voor de website komen later policies op basis van klant_accounts (klant ziet alleen eigen berichten).
