-- Offertes uitgebreid: offertenummer, voorwaarden, kortingen, btw per regel, optionele regels.
alter table offertes add column if not exists nummer bigint;
alter table offertes add column if not exists referentie text;
alter table offertes add column if not exists levertijd text;
alter table offertes add column if not exists betaling text;
alter table offertes add column if not exists intro text;
alter table offertes add column if not exists voorwaarden text;
alter table offertes add column if not exists verzonden_op date;
alter table offertes add column if not exists kopie_van bigint;
alter table offertes add column if not exists afwijsreden text;
alter table offerte_regels add column if not exists korting_pct numeric not null default 0;
alter table offerte_regels add column if not exists btw_pct numeric;
alter table offerte_regels add column if not exists optioneel boolean not null default false;

-- bestaande offertes krijgen een nummer: jaartal + volgnummer (zoals orders)
with n as (
  select id, extract(year from datum)::bigint * 100000 + row_number() over (partition by extract(year from datum) order by id) nr
  from offertes where nummer is null)
update offertes o set nummer = n.nr from n where n.id = o.id;
create unique index if not exists offertes_nummer_uq on offertes (nummer) where nummer is not null;
