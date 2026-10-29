-- Marketing in het Salesbureau: doelgroepen, uitsluitingen met reden, mailstatus per adres,
-- planning en akkoord per campagne, resultaten per ontvanger en een overzicht van wie wel en niet gemaild mag worden.
-- Het Salesbureau verstuurt zelf nooit mail; versturen gebeurt in Mailchimp na akkoord van Michel.

-- 1. Mailstatus per klant (bijgehouden na import van afmeldingen en bounces uit Mailchimp)
alter table klanten add column if not exists mail_status text not null default 'ok';
alter table klanten add column if not exists mail_status_op date;
alter table klanten add column if not exists mail_status_bron text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'klanten_mail_status_check') then
    alter table klanten add constraint klanten_mail_status_check check (mail_status in ('ok', 'afgemeld', 'bounced', 'klacht', 'ongeldig'));
  end if;
end $$;

-- 2. Uitsluitingen met reden (besluiten van Michel, fraude, interne accounts)
create table if not exists mail_uitsluitingen (
  id bigserial primary key,
  klant_id bigint references klanten(id),
  email text,
  naam text,
  categorie text not null check (categorie in ('gesloten', 'fraude', 'duitstalig', 'geen_afnemer', 'intern', 'overig')),
  reden text,
  bron text,
  actief boolean not null default true,
  aangemaakt timestamptz not null default now()
);
create unique index if not exists mail_uitsluitingen_email_uq on mail_uitsluitingen (lower(email)) where email is not null and actief;
alter table mail_uitsluitingen enable row level security;

-- 3. Doelgroepen (opgeslagen selecties)
create table if not exists doelgroepen (
  id bigserial primary key,
  naam text not null,
  omschrijving text,
  filters jsonb not null default '{}'::jsonb,
  aangemaakt timestamptz not null default now(),
  gewijzigd timestamptz not null default now()
);
alter table doelgroepen enable row level security;

-- 4. Campagnes: planning, akkoord, checklist
alter table campagnes add column if not exists doelgroep_id bigint references doelgroepen(id) on delete set null;
alter table campagnes add column if not exists fase int;
alter table campagnes add column if not exists doel text;
alter table campagnes add column if not exists preheader text;
alter table campagnes add column if not exists geplande_datum date;
alter table campagnes add column if not exists afzender text;
alter table campagnes add column if not exists antwoordadres text;
alter table campagnes add column if not exists mailchimp_url text;
alter table campagnes add column if not exists checklist jsonb not null default '{}'::jsonb;
alter table campagnes add column if not exists akkoord_door text;
alter table campagnes add column if not exists akkoord_op timestamptz;
alter table campagnes add column if not exists notities text;
alter table campagnes drop constraint if exists campagnes_status_check;
alter table campagnes add constraint campagnes_status_check check (status in ('concept', 'klaar', 'akkoord', 'verzonden', 'geannuleerd'));
alter table campagnes drop constraint if exists campagnes_soort_check;
alter table campagnes add constraint campagnes_soort_check check (soort in ('aanbod', 'reactivatie', 'introductie', 'persoonlijk', 'weekmail', 'partijlijst', 'handel-alert', 'nieuwsbrief', 'overig'));

-- 5. Resultaten per ontvanger
alter table verzendingen add column if not exists geklikt boolean not null default false;
alter table verzendingen add column if not exists afgemeld boolean not null default false;
alter table verzendingen add column if not exists bounced boolean not null default false;
alter table verzendingen add column if not exists bron text;
create index if not exists verzendingen_klant_idx on verzendingen (klant_id);

-- 6. Wie mag gemaild worden en waarom niet
create or replace view marketing_klanten with (security_invoker = true) as
select v.id, v.relatie_nr, v.naam, v.email, v.taal, v.land, v.plaats, v.segment, v.prioriteit, v.orders, v.omzet, v.omzet_12m,
  v.eerste_order, v.laatste_order, v.laatst_gekocht, v.interesses, v.bron, v.aangemaakt,
  p.bedrijfstype, p.status_bedrijf,
  (coalesce(p.profiel ->> 'collega_partijhandel', '') ilike 'ja%') as collega,
  k.mail_status,
  case
    when v.afgemeld or k.mail_status = 'afgemeld' then 'afgemeld'
    when k.mail_status in ('bounced', 'ongeldig') then 'adres werkt niet'
    when k.mail_status = 'klacht' then 'spamklacht'
    when nullif(trim(v.email), '') is null then 'geen e-mailadres'
    when coalesce(v.let_op, '') <> '' or u.categorie = 'fraude' then 'LET OP of fraudesignaal'
    when p.status_bedrijf = 'gesloten/failliet' or u.categorie = 'gesloten' then 'gesloten of failliet'
    when u.categorie = 'intern' then 'interne account'
    when u.categorie = 'duitstalig' and v.orders = 0 then 'Duitstalig, nooit gekocht (besluit Michel)'
    when u.categorie = 'geen_afnemer' or (coalesce(p.profiel ->> 'geen_afnemer', '') ilike 'ja%' and v.orders = 0) then 'geen logische afnemer (besluit Michel)'
    when u.categorie is not null and u.categorie <> 'duitstalig' then 'besluit Michel'
  end as uitsluit_reden,
  u.reden as uitsluit_detail,
  (select max(z.verzonden_op) from verzendingen z where z.klant_id = v.id) as laatste_mail,
  (select count(*) from verzendingen z where z.klant_id = v.id and z.verzonden_op > now() - interval '14 days') as mails_14d
from klant_overzicht v
join klanten k on k.id = v.id
left join lateral (select pp.bedrijfstype, pp.status_bedrijf, pp.profiel from klant_profielen pp where lower(pp.email) = lower(v.email) limit 1) p on true
left join lateral (select x.categorie, x.reden from mail_uitsluitingen x where x.actief and (x.klant_id = v.id or lower(x.email) = lower(v.email)) limit 1) u on true;

-- 7. Resultaten per campagne, inclusief wat de ontvangers daarna bestelden of aanvroegen (30 dagen)
create or replace view marketing_campagne_stats with (security_invoker = true) as
select c.id as campagne_id,
  count(z.id) as ontvangers,
  count(z.verzonden_op) as verzonden,
  count(*) filter (where z.geopend) as geopend,
  count(*) filter (where z.geklikt) as geklikt,
  count(*) filter (where z.gereageerd) as gereageerd,
  count(*) filter (where z.afgemeld) as afgemeld,
  count(*) filter (where z.bounced) as bounced,
  coalesce(sum(a.orders30), 0) as orders_30d,
  coalesce(sum(a.omzet30), 0) as omzet_30d,
  count(*) filter (where a.orders30 > 0) as kopers_30d,
  count(*) filter (where b.offertes30 > 0) as offerteklanten_30d
from campagnes c
left join verzendingen z on z.campagne_id = c.id
left join lateral (select count(*) as orders30, sum(o.prijs) as omzet30 from orders o
  where o.klant_id = z.klant_id and z.verzonden_op is not null and o.status is distinct from 'Geannuleerd'
    and o.prijs between 0 and 10000000 and o.datum >= z.verzonden_op::date and o.datum <= z.verzonden_op::date + 30) a on true
left join lateral (select count(*) as offertes30 from offertes f
  where f.klant_id = z.klant_id and z.verzonden_op is not null and f.datum >= z.verzonden_op::date and f.datum <= z.verzonden_op::date + 30) b on true
group by c.id;
