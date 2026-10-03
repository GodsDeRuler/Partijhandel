-- Eigen artikelfoto's in de database (geen link): groot formaat voor de detailweergave, klein formaat voor lijsten.
-- Beide als data-url (jpeg), in de browser verkleind voor het opslaan. Verwijderen gaat via 'vervallen'.
create table if not exists artikel_fotos (
  id bigint generated always as identity primary key,
  artikel_nr integer not null references artikelen (artikel_nr),
  bestandsnaam text,
  groot text not null,
  klein text not null,
  bytes integer,
  hoofd boolean not null default false,
  volgorde integer not null default 0,
  vervallen boolean not null default false,
  aangemaakt timestamptz not null default now()
);
create index if not exists artikel_fotos_artikel_idx on artikel_fotos (artikel_nr) where not vervallen;
create unique index if not exists artikel_fotos_hoofd_uq on artikel_fotos (artikel_nr) where hoofd and not vervallen;
alter table artikel_fotos enable row level security;
