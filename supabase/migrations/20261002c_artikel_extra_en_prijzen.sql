-- Extra artikelgegevens (herkomst), staffels met actief-vlag en unieke leveranciersnamen.
alter table public.artikelen add column if not exists herkomst text;
alter table public.staffelprijzen add column if not exists actief boolean not null default true;
create unique index if not exists leveranciers_naam_uniek on public.leveranciers (lower(naam));
