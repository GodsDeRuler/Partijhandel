-- Stroomlijning: openstaande posten uit MyBusiness, annuleren van orders, transportaanvragen, doelen, samenvoegen van klanten.
-- Alles additief; verwijderen gaat via vervallen/samengevoegd_met.

-- 1) Openstaande posten (debiteuren) uit MyBusiness, naast de facturen van het Salesbureau
create table if not exists openstaande_posten (
  id bigint generated always as identity primary key,
  klant_id bigint not null references klanten (id),
  nummer text not null,
  datum date,
  vervaldatum date,
  bedrag_totaal numeric,
  bedrag_open numeric not null,
  bron text not null default 'mybusiness',
  import_op timestamptz not null default now(),
  vervallen boolean not null default false
);
create unique index if not exists openstaande_posten_uniek on openstaande_posten (klant_id, nummer);
alter table openstaande_posten enable row level security;

alter table aanmaningen alter column factuur_id drop not null;
alter table aanmaningen add column if not exists post_id bigint references openstaande_posten (id);
alter table aanmaningen drop constraint if exists aanmaning_hoort_ergens_bij;
alter table aanmaningen add constraint aanmaning_hoort_ergens_bij check (factuur_id is not null or post_id is not null);

create or replace view debiteur_posten with (security_invoker = true) as
select f.klant_id, 'factuur'::text as bron, f.id as ref_id, f.nummer::text as nummer, f.datum, f.vervaldatum,
  f.totaal_incl - coalesce((select sum(b.bedrag) from factuur_betalingen b where b.factuur_id = f.id), 0) as rest,
  (select max(a.niveau) from aanmaningen a where a.factuur_id = f.id) as niveau,
  (select max(a.datum) from aanmaningen a where a.factuur_id = f.id) as am_datum
from facturen f where f.status = 'definitief'
union all
select p.klant_id, 'mybusiness'::text, p.id, p.nummer, p.datum, p.vervaldatum, p.bedrag_open,
  (select max(a.niveau) from aanmaningen a where a.post_id = p.id),
  (select max(a.datum) from aanmaningen a where a.post_id = p.id)
from openstaande_posten p where not p.vervallen;

-- 2) Order annuleren (voorraad terug, omzet op 0, oorspronkelijke bedragen bewaard)
alter table orders add column if not exists geannuleerd_op timestamptz;
alter table orders add column if not exists geannuleerd_reden text;
alter table orders add column if not exists prijs_voor_annulering numeric;
alter table orders add column if not exists inkoop_voor_annulering numeric;

-- 3) Transport opvragen en vergelijken
alter table vervoerders add column if not exists email text;
alter table vervoerders add column if not exists telefoon text;
create table if not exists transport_aanvragen (
  id bigint generated always as identity primary key,
  pakbon_id bigint not null references pakbonnen (id),
  vervoerder_id bigint references vervoerders (id),
  vervoerder_naam text not null,
  aangevraagd_op timestamptz not null default now(),
  prijs numeric check (prijs is null or prijs >= 0),
  doorlooptijd text,
  opmerking text,
  gekozen boolean not null default false,
  antwoord_op timestamptz
);
create index if not exists transport_aanvragen_pakbon_idx on transport_aanvragen (pakbon_id);
alter table transport_aanvragen enable row level security;

-- 4) Doelen per maand
create table if not exists doelen (
  jaar integer not null,
  maand integer not null check (maand between 1 and 12),
  omzet numeric check (omzet is null or omzet >= 0),
  marge numeric check (marge is null or marge >= 0),
  primary key (jaar, maand)
);
alter table doelen enable row level security;

-- 5) Dubbele klanten samenvoegen: de samengevoegde klant blijft staan maar verdwijnt uit overzichten
alter table klanten add column if not exists samengevoegd_met bigint references klanten (id);

create or replace view klant_overzicht as
 WITH o AS (
         SELECT orders.klant_id, count(*) AS orders, sum(orders.prijs) AS omzet,
            sum(orders.prijs) FILTER (WHERE orders.datum > (CURRENT_DATE - 365)) AS omzet_12m,
            max(orders.datum) AS laatste_order, min(orders.datum) AS eerste_order
           FROM orders GROUP BY orders.klant_id
        ), l AS (
         SELECT x.klant_id, string_agg(x.omschrijving, ' | '::text ORDER BY x.datum DESC) AS laatst_gekocht
           FROM ( SELECT orders.klant_id, orders.omschrijving, orders.datum,
                    row_number() OVER (PARTITION BY orders.klant_id ORDER BY orders.datum DESC) AS rn
                   FROM orders) x
          WHERE x.rn <= 3 GROUP BY x.klant_id
        )
 SELECT k.id, k.relatie_nr, k.naam, k.email, k.telefoon, k.taal, k.land, k.plaats, k.relatiebeheer, k.let_op, k.bron, k.interesses, k.afgemeld, k.notities, k.aangemaakt,
    COALESCE(o.orders, 0::bigint) AS orders, COALESCE(o.omzet, 0::numeric) AS omzet, COALESCE(o.omzet_12m, 0::numeric) AS omzet_12m, o.eerste_order, o.laatste_order, l.laatst_gekocht,
        CASE WHEN o.laatste_order IS NULL THEN 'nooit besteld'::text WHEN o.laatste_order > (CURRENT_DATE - 365) THEN 'actief'::text ELSE 'slapend'::text END AS segment,
        CASE WHEN o.laatste_order <= (CURRENT_DATE - 365) THEN
            CASE WHEN o.orders >= 6 THEN 'A'::text WHEN o.orders >= 3 THEN 'B'::text ELSE 'C'::text END
            ELSE NULL::text END AS prioriteit
   FROM klanten k
     LEFT JOIN o ON o.klant_id = k.id
     LEFT JOIN l ON l.klant_id = k.id
  WHERE k.samengevoegd_met IS NULL;
