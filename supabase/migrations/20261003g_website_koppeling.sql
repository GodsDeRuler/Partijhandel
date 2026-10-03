-- Koppellaag tussen de nieuwe website en het Salesbureau (zelfde database).
--
-- Uitgangspunt: de openbare sleutel (anon) en ingelogde klanten (authenticated) mogen NIETS rechtstreeks uit tabellen lezen
-- of schrijven. Alles loopt via een paar functies hieronder, die zelf controleren wie er aanroept (auth.uid()) en
-- alleen vrijgeven wat de site nodig heeft: nooit inkoopprijzen, marges, andere klanten of interne notities.
--
-- Onderdelen
--   1. Alles dichtzetten voor anon/authenticated (ook de view klant_overzicht, die tot nu toe leesbaar was met de openbare sleutel)
--   2. Nieuwe kolommen en tabellen (klant_accounts, agenda, website_formulieren, website_meldingen)
--   3. Hulpfuncties (landcode, omdoos/pallet uit verpakking, prijs voor klant)
--   4. Wat de site mag lezen: zoeken, artikel, categorieen, agenda, foto
--   5. Wat een ingelogde klant mag: account koppelen, eigen gegevens, offertes, orders, openstaand, berichten
--   6. Wat een bezoeker mag insturen (alleen met het gedeelde geheim van de site-server): aanmelden, contact, partij aanbieden, Handel alert
--   7. Meldingen (queue) die de site-server per mail verstuurt
--
-- Terugdraaien: de nieuwe tabellen/kolommen/functies kunnen met drop worden verwijderd; onderdeel 1 is bewust blijvend.

---------------------------------------------------------------------------------------------------
-- 1. Dichtzetten
---------------------------------------------------------------------------------------------------
alter view klant_overzicht set (security_invoker = true);
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres revoke execute on functions from public;
alter default privileges for role postgres in schema public revoke execute on functions from anon, authenticated;

---------------------------------------------------------------------------------------------------
-- 2. Kolommen en tabellen
---------------------------------------------------------------------------------------------------
alter table klanten drop constraint if exists klanten_bron_check;
alter table klanten add constraint klanten_bron_check check (bron = any (array['relaties', 'orders', 'prospect', 'website']));
alter table klanten add column if not exists branche text;
alter table klanten add column if not exists site_toegang text check (site_toegang in ('goedgekeurd', 'geblokkeerd'));

alter table artikelen add column if not exists site_naam_nl text;
alter table artikelen add column if not exists site_naam_en text;
alter table artikelen add column if not exists site_naam_de text;
alter table artikelen add column if not exists slug_nl text;
alter table artikelen add column if not exists slug_en text;
alter table artikelen add column if not exists slug_de text;
alter table artikelen add column if not exists foto_grijs boolean not null default false;
create unique index if not exists artikelen_slug_nl_uq on artikelen (slug_nl) where slug_nl is not null;
create unique index if not exists artikelen_slug_en_uq on artikelen (slug_en) where slug_en is not null;
create unique index if not exists artikelen_slug_de_uq on artikelen (slug_de) where slug_de is not null;

alter table offertes add column if not exists soort text not null default 'offerte' check (soort in ('offerte', 'bod'));
alter table offertes add column if not exists bod_bedrag numeric check (bod_bedrag is null or bod_bedrag > 0);
alter table offertes add column if not exists levering text check (levering in ('afhalen', 'bezorgen'));
alter table offertes add column if not exists aflever_adres text;
alter table offertes add column if not exists aflever_land text;
alter table offertes add column if not exists laadklep boolean;
alter table offertes add column if not exists afhaal_datum date;
alter table offertes add column if not exists klant_akkoord_op timestamptz;
alter table offertes add column if not exists klant_akkoord_naam text;
alter table offertes add column if not exists via_site boolean not null default false;

create table if not exists klant_accounts (
  auth_user_id uuid primary key references auth.users (id) on delete cascade,
  klant_id bigint references klanten (id),
  email text not null,
  status text not null default 'aangevraagd' check (status in ('aangevraagd', 'goedgekeurd', 'geblokkeerd')),
  opmerking text,
  aangemaakt timestamptz not null default now(),
  goedgekeurd_op timestamptz,
  goedgekeurd_door text,
  laatst_ingelogd timestamptz
);
create index if not exists klant_accounts_klant_idx on klant_accounts (klant_id);
alter table klant_accounts enable row level security;

create table if not exists agenda (
  id bigint generated always as identity primary key,
  datum date not null,
  tot date,
  plaats text,
  titel_nl text not null,
  titel_en text,
  titel_de text,
  tekst_nl text,
  tekst_en text,
  tekst_de text,
  link text,
  zichtbaar boolean not null default true,
  aangemaakt timestamptz not null default now()
);
alter table agenda enable row level security;

create table if not exists website_formulieren (
  id bigint generated always as identity primary key,
  soort text not null check (soort in ('aanmelding', 'contact', 'partij_aanbieden', 'handel_alert')),
  taal text not null default 'NL' check (taal in ('NL', 'EN', 'DE')),
  naam text,
  bedrijf text,
  email text not null,
  telefoon text,
  tekst text,
  data jsonb not null default '{}'::jsonb,
  klant_id bigint references klanten (id),
  aangemaakt timestamptz not null default now(),
  verwerkt_op timestamptz,
  verwerkt_door text
);
create index if not exists website_formulieren_open_idx on website_formulieren (aangemaakt) where verwerkt_op is null;
create index if not exists website_formulieren_mail_idx on website_formulieren (lower(email), aangemaakt desc);
alter table website_formulieren enable row level security;

create table if not exists website_meldingen (
  id bigint generated always as identity primary key,
  soort text not null check (soort in ('vraag_klant', 'antwoord', 'aanvraag', 'akkoord', 'formulier')),
  ref_id bigint not null,
  aangemaakt timestamptz not null default now(),
  verstuurd_op timestamptz,
  pogingen smallint not null default 0,
  fout text
);
create index if not exists website_meldingen_open_idx on website_meldingen (aangemaakt) where verstuurd_op is null;
alter table website_meldingen enable row level security;

insert into instellingen (sleutel, waarde) values
  ('website_geheim', encode(gen_random_bytes(24), 'hex')),
  ('website_mails_aan', 'nee'),
  ('website_auto_goedkeuren', 'ja'),
  ('website_info_mail', 'info@fvdwpartijhandel.nl'),
  ('website_nieuw_dagen', '21')
on conflict (sleutel) do nothing;

---------------------------------------------------------------------------------------------------
-- 3. Hulpfuncties (niet aan anon/authenticated gegeven; alleen intern bruikbaar)
---------------------------------------------------------------------------------------------------
create or replace function site_instelling(p_sleutel text) returns text
language sql stable security definer set search_path = public, pg_temp as $$
  select waarde from instellingen where sleutel = p_sleutel
$$;

create or replace function site_land_code(p_land text) returns text
language sql stable security definer set search_path = public, pg_temp as $$
  select case when p_land is null or btrim(p_land) = '' then null else coalesce(
    (select l.code from landen l where upper(l.code) = upper(btrim(p_land)) limit 1),
    (select l.code from landen l where translate(lower(l.naam), 'éëèïíóöüúç', 'eeeiioouuc') = translate(lower(btrim(p_land)), 'éëèïíóöüúç', 'eeeiioouuc') limit 1),
    case lower(btrim(p_land))
      when 'engeland' then 'GB' when 'uk' then 'GB' when 'u.k.' then 'GB' when 'united kingdom' then 'GB' when 'united kingdon' then 'GB' when 'verenigd konikrijk' then 'GB'
      when 'estonia' then 'EE' when 'germany' then 'DE' when 'duistland' then 'DE' when 'belgiie' then 'BE' when 'belgium' then 'BE'
      when 'frankijk' then 'FR' when 'france' then 'FR' when 'nederlamd' then 'NL' when 'netherlands' then 'NL' when 'holland' then 'NL'
      when 'denmark' then 'DK' when 'croatia' then 'HR' when 'italy' then 'IT' when 'iraq' then 'IQ' when 'libya' then 'LY'
      when 'slovenia' then 'SI' when 'slowenien' then 'SI' when 'tjechie' then 'CZ' when 'albania' then 'AL' when 'bosnie hercegovina' then 'BA'
      when 'nieuw zeeland' then 'NZ' when 'moldavie' then 'MD' when 'austria' then 'AT' when 'poland' then 'PL' when 'switzerland' then 'CH'
      else null end) end
$$;

-- "400/10" = 400 per pallet, 10 per omdoos
create or replace function site_pallet(p_verpakking text) returns integer
language sql immutable as $$ select nullif(substring(p_verpakking from '^\s*(\d+)\s*/'), '')::integer $$;
create or replace function site_omdoos(p_verpakking text) returns integer
language sql immutable as $$ select nullif(substring(p_verpakking from '^\s*(?:\d+|-)?\s*/\s*(\d+)'), '')::integer $$;

-- slugs voor de site: web-adres per taal; nieuwe artikelen krijgen er automatisch een (bij botsing met -<artikelnr>)
create or replace function site_slugify(p_tekst text) returns text
language sql immutable as $$
  select nullif(btrim(regexp_replace(regexp_replace(
    translate(replace(lower(coalesce(p_tekst, '')), 'ß', 'ss'), 'àáâãäåāçćčèéêëēìíîïīñńòóôõöøōùúûüūýÿžź', 'aaaaaaaccceeeeeiiiiinnooooooouuuuuyyzz'),
    '[^a-z0-9]+', '-', 'g'), '-{2,}', '-', 'g'), '-'), '')
$$;

create or replace function site_slugs_aanvullen() returns integer
language plpgsql set search_path = public, pg_temp as $$
declare v_n integer; v_tot integer := 0; v_taal text; v_kol text; v_naam text;
begin
  foreach v_taal in array array['nl', 'en', 'de'] loop
    v_kol := 'slug_' || v_taal;
    v_naam := 'coalesce(nullif(site_naam_' || v_taal || ', ''''), nullif(site_naam_nl, ''''), naam)';
    execute format($f$
      with kand as (
        select artikel_nr, left(coalesce(site_slugify(%2$s), 'artikel'), 90) basis from artikelen where %1$I is null),
      tel as (
        select k.artikel_nr, k.basis,
          (exists (select 1 from artikelen a where a.%1$I = k.basis)
           or (select count(*) from kand k2 where k2.basis = k.basis) > 1) botst
        from kand k)
      update artikelen a set %1$I = case when t.botst then t.basis || '-' || a.artikel_nr else t.basis end
      from tel t where a.artikel_nr = t.artikel_nr
    $f$, v_kol, v_naam);
    get diagnostics v_n = row_count;
    v_tot := v_tot + v_n;
  end loop;
  return v_tot;
end $$;

-- zelfde volgorde als het Salesbureau: prijsafspraak, dan staffel, dan normale verkoopprijs
create or replace function site_prijs(p_klant bigint, p_artikel integer, p_aantal integer) returns numeric
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(
    (select p.prijs from prijsafspraken p where p.klant_id = p_klant and p.artikel_nr = p_artikel and p.vanaf <= current_date and (p.tot is null or p.tot >= current_date) order by p.vanaf desc, p.id desc limit 1),
    (select s.prijs from staffelprijzen s where s.artikel_nr = p_artikel and s.actief and s.vanaf_aantal <= greatest(1, coalesce(p_aantal, 1)) order by s.vanaf_aantal desc limit 1),
    (select a.verkoopprijs from artikelen a where a.artikel_nr = p_artikel))
$$;

-- de klant achter de ingelogde gebruiker, alleen als de toegang is goedgekeurd
create or replace function site_klant() returns bigint
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(k.samengevoegd_met, a.klant_id)
  from klant_accounts a join klanten k on k.id = a.klant_id
  where a.auth_user_id = auth.uid() and a.status = 'goedgekeurd' and k.site_toegang is distinct from 'geblokkeerd'
$$;

-- alle artikelen die op de site kunnen staan (nooit prijzen, nooit inkoop); de filtering per bezoeker doet site_zichtbaar
create or replace view site_artikel_basis as
select a.artikel_nr, a.slug_nl, a.slug_en, a.slug_de,
  coalesce(nullif(a.site_naam_nl, ''), a.naam) naam_nl,
  coalesce(nullif(a.site_naam_en, ''), nullif(a.site_naam_nl, ''), a.naam) naam_en,
  coalesce(nullif(a.site_naam_de, ''), nullif(a.site_naam_nl, ''), a.naam) naam_de,
  a.voorraad, a.zichtbaarheid, a.geblokkeerde_landen, a.verkoopprijs, a.ean, a.aangemaakt, a.btw_groep_id,
  site_omdoos(a.verpakking) omdoos_stuks, site_pallet(a.verpakking) pallet_stuks,
  coalesce(c.hoofdcode, c.code) hoofdcode, ac.categorie_code subcode,
  (a.aangemaakt > now() - make_interval(days => coalesce(nullif(site_instelling('website_nieuw_dagen'), '')::int, 21))) nieuw,
  (site_omdoos(a.verpakking) is not null and a.voorraad < site_omdoos(a.verpakking)) restant,
  exists (select 1 from artikel_fotos f where f.artikel_nr = a.artikel_nr and not f.vervallen) eigen_foto,
  a.foto_grijs
from artikelen a
left join artikel_categorie ac on ac.artikel_nr = a.artikel_nr
left join artikel_categorieen c on c.code = ac.categorie_code
where a.actief and a.voorraad > 0 and a.zichtbaarheid in ('openbaar', 'inlog');

create or replace function site_zichtbaar(p_klant bigint) returns setof site_artikel_basis
language sql stable security definer set search_path = public, pg_temp as $$
  select b.* from site_artikel_basis b
  where (p_klant is null and b.zichtbaarheid = 'openbaar' and cardinality(b.geblokkeerde_landen) = 0 and b.hoofdcode is distinct from 'ERO')
     or (p_klant is not null
         and (cardinality(b.geblokkeerde_landen) = 0
              or exists (select 1 from klanten k where k.id = p_klant and site_land_code(k.land) is not null and not (site_land_code(k.land) = any (b.geblokkeerde_landen))))
         and (b.hoofdcode is distinct from 'ERO' or exists (select 1 from klanten k where k.id = p_klant and 'ERO' = any (k.interesses))))
$$;

create or replace function site_item_json(p_klant bigint, z site_artikel_basis) returns jsonb
language sql stable security definer set search_path = public, pg_temp as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'nr', z.artikel_nr, 'slug_nl', z.slug_nl, 'slug_en', z.slug_en, 'slug_de', z.slug_de,
    'naam_nl', z.naam_nl, 'naam_en', z.naam_en, 'naam_de', z.naam_de,
    'voorraad', z.voorraad, 'omdoos', z.omdoos_stuks, 'pallet', z.pallet_stuks,
    'hoofd', z.hoofdcode, 'sub', z.subcode, 'nieuw', z.nieuw, 'restant', z.restant,
    'inlog', z.zichtbaarheid = 'inlog', 'eigen_foto', z.eigen_foto, 'foto_grijs', z.foto_grijs, 'ean', z.ean,
    'prijs', case when p_klant is not null and coalesce(site_prijs(p_klant, z.artikel_nr, coalesce(z.omdoos_stuks, 1)), 0) > 0
                  then round(site_prijs(p_klant, z.artikel_nr, coalesce(z.omdoos_stuks, 1)), 4) end,
    'prijs_omdoos', case when p_klant is not null and z.omdoos_stuks is not null and coalesce(site_prijs(p_klant, z.artikel_nr, z.omdoos_stuks), 0) > 0
                  then round(site_prijs(p_klant, z.artikel_nr, z.omdoos_stuks) * z.omdoos_stuks, 2) end))
$$;

---------------------------------------------------------------------------------------------------
-- 4. Lezen voor de site (bezoeker en ingelogde klant)
---------------------------------------------------------------------------------------------------
create or replace function site_zoek(p_q text default null, p_hoofd text default null, p_sub text default null,
  p_nieuw boolean default false, p_sort text default 'nieuw', p_limit integer default 24, p_offset integer default 0) returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  v_klant bigint := site_klant();
  v_q text := lower(nullif(btrim(coalesce(p_q, '')), ''));
  v_tot integer; v_items jsonb; v_verborgen integer := 0;
begin
  select count(*) into v_tot from site_zichtbaar(v_klant) z
  where (v_q is null or position(v_q in lower(z.naam_nl || ' ' || z.naam_en || ' ' || z.naam_de || ' ' || z.artikel_nr::text || ' ' || coalesce(z.ean, ''))) > 0)
    and (p_hoofd is null or z.hoofdcode = p_hoofd) and (p_sub is null or z.subcode = p_sub) and (not coalesce(p_nieuw, false) or z.nieuw);
  select coalesce(jsonb_agg(site_item_json(v_klant, q.z) order by q.rn), '[]'::jsonb) into v_items from (
    select z, row_number() over (order by case when p_sort = 'naam' then z.naam_nl end asc, case when p_sort = 'voorraad' then z.voorraad end desc, z.aangemaakt desc, z.artikel_nr) rn
    from site_zichtbaar(v_klant) z
    where (v_q is null or position(v_q in lower(z.naam_nl || ' ' || z.naam_en || ' ' || z.naam_de || ' ' || z.artikel_nr::text || ' ' || coalesce(z.ean, ''))) > 0)
      and (p_hoofd is null or z.hoofdcode = p_hoofd) and (p_sub is null or z.subcode = p_sub) and (not coalesce(p_nieuw, false) or z.nieuw)
    order by rn
    limit least(greatest(coalesce(p_limit, 24), 1), 200) offset greatest(coalesce(p_offset, 0), 0)) q;
  if v_klant is not null then
    select count(*) into v_verborgen from site_artikel_basis b
    where b.zichtbaarheid = 'inlog' and not exists (select 1 from site_zichtbaar(v_klant) z where z.artikel_nr = b.artikel_nr);
  end if;
  return jsonb_build_object('totaal', v_tot, 'items', v_items, 'ingelogd', v_klant is not null, 'verborgen', v_verborgen);
end $$;

create or replace function site_artikel(p_slug text, p_taal text default 'nl') returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_klant bigint := site_klant(); v_nr integer; v_z site_artikel_basis; v_taal text := lower(coalesce(p_taal, 'nl'));
begin
  select a.artikel_nr into v_nr from artikelen a
  where a.actief and a.voorraad > 0 and a.zichtbaarheid in ('openbaar', 'inlog')
    and ((v_taal = 'nl' and a.slug_nl = p_slug) or (v_taal = 'en' and a.slug_en = p_slug) or (v_taal = 'de' and a.slug_de = p_slug));
  if v_nr is null then return null; end if;
  select * into v_z from site_zichtbaar(v_klant) z where z.artikel_nr = v_nr;
  if found then return jsonb_build_object('status', 'ok', 'item', site_item_json(v_klant, v_z), 'ingelogd', v_klant is not null); end if;
  if v_klant is null then return jsonb_build_object('status', 'login'); end if;
  return jsonb_build_object('status', 'niet_leverbaar');
end $$;

create or replace function site_categorieen() returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_klant bigint := site_klant();
begin
  return coalesce((select jsonb_agg(jsonb_build_object('code', c.code, 'niveau', c.niveau, 'hoofd', c.hoofdcode, 'nl', c.naam_nl, 'en', c.naam_en, 'de', c.naam_de, 'n', coalesce(t.n, 0)) order by c.volgorde, c.code)
    from artikel_categorieen c
    left join (select x.code, count(*) n from (
        select z.subcode code from site_zichtbaar(v_klant) z where z.subcode is not null
        union all select z.hoofdcode from site_zichtbaar(v_klant) z where z.hoofdcode is not null) x group by x.code) t on t.code = c.code
    where c.hoofdcode is distinct from 'ERO' and c.code is distinct from 'ERO'), '[]'::jsonb);
end $$;

create or replace function site_agenda() returns jsonb
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', a.id, 'datum', a.datum, 'tot', a.tot, 'plaats', a.plaats,
    'titel_nl', a.titel_nl, 'titel_en', a.titel_en, 'titel_de', a.titel_de, 'tekst_nl', a.tekst_nl, 'tekst_en', a.tekst_en, 'tekst_de', a.tekst_de, 'link', a.link) order by a.datum), '[]'::jsonb)
  from agenda a where a.zichtbaar and coalesce(a.tot, a.datum) >= current_date
$$;

-- foto's: eigen foto uit de database gaat voor; anders de oude MyBusiness-link (niet als het de grijze standaardafbeelding is)
create or replace function site_foto(p_artikel integer, p_maat text default 'klein') returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_klant bigint := site_klant(); v_data text; v_url text; v_grijs boolean;
begin
  if not exists (select 1 from site_zichtbaar(v_klant) z where z.artikel_nr = p_artikel) then return null; end if;
  select case when p_maat = 'groot' then f.groot else f.klein end into v_data from artikel_fotos f
  where f.artikel_nr = p_artikel and not f.vervallen order by f.hoofd desc, f.volgorde, f.id limit 1;
  select a.foto_url, a.foto_grijs into v_url, v_grijs from artikelen a where a.artikel_nr = p_artikel;
  return jsonb_build_object('data', v_data, 'url', case when v_grijs then null else v_url end);
end $$;

---------------------------------------------------------------------------------------------------
-- 5. Ingelogde klant
---------------------------------------------------------------------------------------------------
-- Koppelt de login (Supabase Auth, inloglink per mail) aan een klant op basis van het bevestigde mailadres.
create or replace function site_koppel_account() returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v_mail text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_acc klant_accounts;
  v_ids bigint[];
  v_k klanten;
  v_status text;
  v_door text;
begin
  if v_uid is null then raise exception 'niet_ingelogd'; end if;
  select * into v_acc from klant_accounts where auth_user_id = v_uid;
  if found then
    update klant_accounts set laatst_ingelogd = now() where auth_user_id = v_uid;
    return jsonb_build_object('status', v_acc.status);
  end if;
  if v_mail = '' then return jsonb_build_object('status', 'onbekend'); end if;
  select coalesce(array_agg(distinct x.klant_id), '{}') into v_ids from (
    select k.id klant_id from klanten k where k.samengevoegd_met is null and (lower(k.email) = v_mail or lower(k.factuur_email) = v_mail)
    union
    select p.klant_id from personen p join klanten k on k.id = p.klant_id where not p.vervallen and k.samengevoegd_met is null and lower(p.email) = v_mail) x;
  if cardinality(v_ids) = 0 then return jsonb_build_object('status', 'onbekend'); end if;
  if cardinality(v_ids) > 1 then
    insert into klant_accounts (auth_user_id, klant_id, email, status, opmerking, laatst_ingelogd)
    values (v_uid, null, v_mail, 'aangevraagd', 'Meerdere klanten met dit mailadres: ' || array_to_string(v_ids, ', ') || '. Kies in het Salesbureau de juiste klant.', now());
    return jsonb_build_object('status', 'aangevraagd');
  end if;
  select * into v_k from klanten where id = v_ids[1];
  if v_k.site_toegang = 'geblokkeerd' then v_status := 'geblokkeerd';
  elsif v_k.site_toegang = 'goedgekeurd' then v_status := 'goedgekeurd'; v_door := 'Michel';
  elsif site_instelling('website_auto_goedkeuren') = 'ja' and v_k.relatie_nr is not null and coalesce(btrim(v_k.let_op), '') = '' and v_k.naam not ilike '%let op%' then
    v_status := 'goedgekeurd'; v_door := 'automatisch (bestaande klant)';
  else v_status := 'aangevraagd'; end if;
  insert into klant_accounts (auth_user_id, klant_id, email, status, goedgekeurd_op, goedgekeurd_door, laatst_ingelogd)
  values (v_uid, v_k.id, v_mail, v_status, case when v_status = 'goedgekeurd' then now() end, v_door, now());
  return jsonb_build_object('status', v_status);
end $$;

create or replace function site_mij() returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_uid uuid := auth.uid(); v_acc klant_accounts; v_klant bigint := site_klant(); v_k klanten;
begin
  if v_uid is null then return jsonb_build_object('status', 'uitgelogd'); end if;
  select * into v_acc from klant_accounts where auth_user_id = v_uid;
  if not found then return jsonb_build_object('status', 'onbekend', 'email', auth.jwt() ->> 'email'); end if;
  if v_klant is null then return jsonb_build_object('status', case when v_acc.status = 'goedgekeurd' then 'geblokkeerd' else v_acc.status end, 'email', v_acc.email); end if;
  select * into v_k from klanten where id = v_klant;
  return jsonb_build_object('status', 'goedgekeurd', 'email', v_acc.email, 'naam', v_k.naam, 'contactpersoon', v_k.contactpersoon,
    'telefoon', v_k.telefoon, 'taal', v_k.taal, 'land', v_k.land, 'plaats', v_k.plaats, 'adres', v_k.adres, 'postcode', v_k.postcode,
    'btw_nr', v_k.btw_nr, 'interesses', coalesce(to_jsonb(v_k.interesses), '[]'::jsonb), 'branche', v_k.branche,
    'ongelezen', (select count(*) from berichten b where b.klant_id = v_klant and b.afzender = 'verkoop' and b.gelezen_op is null),
    'openstaand', (select coalesce(sum(p.rest), 0) from debiteur_posten p where p.klant_id = v_klant and p.rest > 0));
end $$;

create or replace function site_gegevens_bijwerken(p_telefoon text, p_contactpersoon text, p_taal text, p_interesses text[]) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_klant bigint := site_klant(); v_int text[];
begin
  if v_klant is null then raise exception 'geen_toegang'; end if;
  select coalesce(array_agg(c.code), '{}') into v_int from artikel_categorieen c where c.niveau = 'hoofd' and c.code = any (coalesce(p_interesses, '{}'));
  update klanten set telefoon = left(nullif(btrim(p_telefoon), ''), 60), contactpersoon = left(nullif(btrim(p_contactpersoon), ''), 120),
    taal = case when upper(p_taal) in ('NL', 'EN', 'DE') then upper(p_taal) else taal end, interesses = v_int where id = v_klant;
end $$;

-- Offerteaanvraag: komt als offerte met status aanvraag binnen (regels in omdozen, prijs zoals het Salesbureau die berekent)
create or replace function site_offerte_aanvragen(p_regels jsonb, p_levering text default 'afhalen', p_adres text default null,
  p_land text default null, p_laadklep boolean default null, p_afhaal date default null, p_opmerking text default null) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_klant bigint := site_klant(); v_nr bigint; v_id bigint; v_r record; v_aantal integer; v_prijs numeric; v_n integer := 0; v_land text;
begin
  if v_klant is null then raise exception 'geen_toegang'; end if;
  if p_regels is null or jsonb_typeof(p_regels) <> 'array' or jsonb_array_length(p_regels) = 0 then raise exception 'geen_regels'; end if;
  if jsonb_array_length(p_regels) > 100 then raise exception 'te_veel_regels'; end if;
  if (select count(*) from offertes o where o.klant_id = v_klant and o.via_site and o.aangemaakt > now() - interval '1 hour') >= 10 then raise exception 'te_vaak'; end if;
  perform pg_advisory_xact_lock(7001);
  select greatest(coalesce((select max(nummer) from offertes where nummer >= extract(year from current_date)::bigint * 100000), 0), extract(year from current_date)::bigint * 100000) + 1 into v_nr;
  insert into offertes (nummer, klant_id, datum, status, bron, via_site, soort, geldig_tot, opmerking, levering, aflever_adres, aflever_land, laadklep, afhaal_datum)
  values (v_nr, v_klant, current_date, 'aanvraag', 'webshop', true, 'offerte', current_date + 14, left(nullif(btrim(p_opmerking), ''), 2000),
    case when p_levering in ('afhalen', 'bezorgen') then p_levering else 'afhalen' end,
    case when p_levering = 'bezorgen' then left(nullif(btrim(p_adres), ''), 400) end, case when p_levering = 'bezorgen' then left(nullif(btrim(p_land), ''), 80) end,
    case when p_levering = 'bezorgen' then p_laadklep end, p_afhaal)
  returning id into v_id;
  for v_r in select (e ->> 'artikel_nr')::integer a, (e ->> 'omdozen')::integer d from jsonb_array_elements(p_regels) e loop
    if v_r.a is null or v_r.d is null or v_r.d < 1 or v_r.d > 10000 then raise exception 'ongeldige_regel'; end if;
    if not exists (select 1 from site_zichtbaar(v_klant) z where z.artikel_nr = v_r.a) then raise exception 'niet_beschikbaar:%', v_r.a; end if;
    select v_r.d * coalesce(z.omdoos_stuks, 1) into v_aantal from site_artikel_basis z where z.artikel_nr = v_r.a;
    if v_aantal > (select voorraad from artikelen where artikel_nr = v_r.a) then raise exception 'te_weinig_voorraad:%', v_r.a; end if;
    v_prijs := coalesce(site_prijs(v_klant, v_r.a, v_aantal), 0);
    insert into offerte_regels (offerte_id, artikel_nr, omschrijving, aantal, prijs, inkoop, btw_pct)
    select v_id, a.artikel_nr, coalesce(nullif(a.site_naam_nl, ''), a.naam), v_aantal, v_prijs, a.inkoopprijs, coalesce((select percentage from btw_groepen g where g.id = a.btw_groep_id), 21)
    from artikelen a where a.artikel_nr = v_r.a;
    v_n := v_n + 1;
  end loop;
  insert into website_meldingen (soort, ref_id) values ('aanvraag', v_id);
  return jsonb_build_object('id', v_id, 'nummer', v_nr, 'regels', v_n);
end $$;

-- Bod op een hele partij: de klant noemt een totaalbedrag, de site stelt nooit een bedrag voor. Het percentage ziet alleen het Salesbureau.
create or replace function site_bod_plaatsen(p_artikel integer, p_bedrag numeric, p_opmerking text default null) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_klant bigint := site_klant(); v_nr bigint; v_id bigint; v_voorraad integer;
begin
  if v_klant is null then raise exception 'geen_toegang'; end if;
  if p_bedrag is null or p_bedrag <= 0 or p_bedrag > 10000000 then raise exception 'ongeldig_bedrag'; end if;
  if not exists (select 1 from site_zichtbaar(v_klant) z where z.artikel_nr = p_artikel) then raise exception 'niet_beschikbaar:%', p_artikel; end if;
  if (select count(*) from offertes o where o.klant_id = v_klant and o.via_site and o.aangemaakt > now() - interval '1 hour') >= 10 then raise exception 'te_vaak'; end if;
  select voorraad into v_voorraad from artikelen where artikel_nr = p_artikel;
  perform pg_advisory_xact_lock(7001);
  select greatest(coalesce((select max(nummer) from offertes where nummer >= extract(year from current_date)::bigint * 100000), 0), extract(year from current_date)::bigint * 100000) + 1 into v_nr;
  insert into offertes (nummer, klant_id, datum, status, bron, via_site, soort, bod_bedrag, geldig_tot, opmerking)
  values (v_nr, v_klant, current_date, 'aanvraag', 'webshop', true, 'bod', round(p_bedrag, 2), current_date + 14, left(nullif(btrim(p_opmerking), ''), 2000)) returning id into v_id;
  insert into offerte_regels (offerte_id, artikel_nr, omschrijving, aantal, prijs, inkoop, btw_pct)
  select v_id, a.artikel_nr, coalesce(nullif(a.site_naam_nl, ''), a.naam) || ' (bod op hele partij)', v_voorraad, round(p_bedrag / v_voorraad, 4), a.inkoopprijs,
    coalesce((select percentage from btw_groepen g where g.id = a.btw_groep_id), 21)
  from artikelen a where a.artikel_nr = p_artikel;
  insert into website_meldingen (soort, ref_id) values ('aanvraag', v_id);
  return jsonb_build_object('id', v_id, 'nummer', v_nr);
end $$;

create or replace function site_mijn_offertes() returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_klant bigint := site_klant();
begin
  if v_klant is null then raise exception 'geen_toegang'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', o.id, 'nummer', o.nummer, 'datum', o.datum, 'status', o.status, 'soort', o.soort, 'geldig_tot', o.geldig_tot,
      'akkoord', o.klant_akkoord_op, 'bod_bedrag', o.bod_bedrag,
      'totaal', (select coalesce(sum(r.aantal * r.prijs * (1 - r.korting_pct / 100.0)), 0) from offerte_regels r where r.offerte_id = o.id and not r.vervallen and not r.optioneel),
      'regels', (select count(*) from offerte_regels r where r.offerte_id = o.id and not r.vervallen),
      'order_nummer', o.order_nummer, 'ongelezen', (select count(*) from berichten b where b.offerte_id = o.id and b.afzender = 'verkoop' and b.gelezen_op is null)) order by o.datum desc, o.id desc)
    from offertes o where o.klant_id = v_klant and (o.verzonden_op is not null or o.via_site)), '[]'::jsonb);
end $$;

create or replace function site_offerte(p_id bigint) returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_klant bigint := site_klant(); v_o offertes;
begin
  if v_klant is null then raise exception 'geen_toegang'; end if;
  select * into v_o from offertes o where o.id = p_id and o.klant_id = v_klant and (o.verzonden_op is not null or o.via_site);
  if not found then return null; end if;
  return jsonb_build_object('id', v_o.id, 'nummer', v_o.nummer, 'datum', v_o.datum, 'status', v_o.status, 'soort', v_o.soort, 'geldig_tot', v_o.geldig_tot,
    'referentie', v_o.referentie, 'levertijd', v_o.levertijd, 'betaling', v_o.betaling, 'intro', v_o.intro, 'voorwaarden', v_o.voorwaarden, 'opmerking', v_o.opmerking,
    'levering', v_o.levering, 'aflever_adres', v_o.aflever_adres, 'aflever_land', v_o.aflever_land, 'afhaal_datum', v_o.afhaal_datum,
    'akkoord', v_o.klant_akkoord_op, 'akkoord_naam', v_o.klant_akkoord_naam, 'bod_bedrag', v_o.bod_bedrag, 'order_nummer', v_o.order_nummer,
    'kan_accepteren', (v_o.status = 'offerte' and v_o.verzonden_op is not null and v_o.klant_akkoord_op is null and (v_o.geldig_tot is null or v_o.geldig_tot >= current_date)),
    'regels', coalesce((select jsonb_agg(jsonb_build_object('artikel_nr', r.artikel_nr, 'omschrijving', r.omschrijving, 'aantal', r.aantal, 'prijs', r.prijs,
        'korting_pct', r.korting_pct, 'btw_pct', r.btw_pct, 'optioneel', r.optioneel) order by r.id) from offerte_regels r where r.offerte_id = v_o.id and not r.vervallen), '[]'::jsonb));
end $$;

-- Online akkoord: zet de offerte op "klant akkoord" en maakt een taak voor Michel. De order zelf (voorraad, krediet, btw) maakt het Salesbureau met een klik.
create or replace function site_offerte_accepteren(p_id bigint, p_naam text) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_klant bigint := site_klant(); v_o offertes;
begin
  if v_klant is null then raise exception 'geen_toegang'; end if;
  if nullif(btrim(p_naam), '') is null then raise exception 'naam_nodig'; end if;
  select * into v_o from offertes o where o.id = p_id and o.klant_id = v_klant for update;
  if not found then raise exception 'niet_gevonden'; end if;
  if v_o.klant_akkoord_op is not null then return jsonb_build_object('ok', true, 'al_akkoord', true); end if;
  if v_o.status <> 'offerte' or v_o.verzonden_op is null or (v_o.geldig_tot is not null and v_o.geldig_tot < current_date) then raise exception 'niet_te_accepteren'; end if;
  update offertes set klant_akkoord_op = now(), klant_akkoord_naam = left(btrim(p_naam), 120) where id = p_id;
  insert into opvolging (klant_id, soort, tekst, opvolgdatum) values (v_klant, 'notitie',
    '[site:akkoord:' || p_id || '] Klant heeft offerte ' || coalesce(v_o.nummer::text, p_id::text) || ' online geaccepteerd (' || left(btrim(p_naam), 120) || '). Omzetten naar order.', current_date);
  insert into website_meldingen (soort, ref_id) values ('akkoord', p_id);
  return jsonb_build_object('ok', true);
end $$;

create or replace function site_mijn_orders() returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_klant bigint := site_klant();
begin
  if v_klant is null then raise exception 'geen_toegang'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('nummer', o.nummer, 'datum', o.datum, 'status', o.status, 'omschrijving', o.omschrijving, 'prijs', o.prijs,
      'ongelezen', (select count(*) from berichten b where b.order_nummer = o.nummer and b.afzender = 'verkoop' and b.gelezen_op is null)) order by o.datum desc, o.nummer desc)
    from orders o where o.klant_id = v_klant and o.status is distinct from 'Geannuleerd' and o.datum > current_date - 730), '[]'::jsonb);
end $$;

create or replace function site_order(p_nummer bigint) returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_klant bigint := site_klant(); v_o orders;
begin
  if v_klant is null then raise exception 'geen_toegang'; end if;
  select * into v_o from orders o where o.nummer = p_nummer and o.klant_id = v_klant and o.status is distinct from 'Geannuleerd';
  if not found then return null; end if;
  return jsonb_build_object('nummer', v_o.nummer, 'datum', v_o.datum, 'status', v_o.status, 'omschrijving', v_o.omschrijving, 'prijs', v_o.prijs,
    'regels', coalesce((select jsonb_agg(jsonb_build_object('artikel_nr', r.artikel_nr, 'omschrijving', r.omschrijving, 'aantal', r.aantal, 'prijs', r.prijs) order by r.id) from order_regels r where r.order_nummer = v_o.nummer), '[]'::jsonb),
    'zendingen', coalesce((select jsonb_agg(jsonb_build_object('soort', p.soort, 'verzonden_op', p.verzonden_op, 'vervoerder', p.vervoerder, 'track_trace', p.track_trace,
        'gepland_op', p.gepland_op, 'afhaaltijd', p.afhaaltijd, 'pallets', p.pallets, 'colli', p.colli) order by p.id) from pakbonnen p where p.order_nummer = v_o.nummer), '[]'::jsonb),
    'offerte_id', (select o.id from offertes o where o.order_nummer = v_o.nummer and o.klant_id = v_klant limit 1));
end $$;

create or replace function site_openstaand() returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_klant bigint := site_klant();
begin
  if v_klant is null then raise exception 'geen_toegang'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('nummer', p.nummer, 'datum', p.datum, 'vervaldatum', p.vervaldatum, 'rest', p.rest,
      'te_laat', p.vervaldatum is not null and p.vervaldatum < current_date) order by p.vervaldatum nulls last, p.datum)
    from debiteur_posten p where p.klant_id = v_klant and p.rest > 0), '[]'::jsonb);
end $$;

-- chat bij een offerte of order
create or replace function site_berichten(p_offerte bigint default null, p_order bigint default null) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_klant bigint := site_klant();
begin
  if v_klant is null then raise exception 'geen_toegang'; end if;
  if (p_offerte is null) = (p_order is null) then raise exception 'kies_offerte_of_order'; end if;
  update berichten set gelezen_op = now()
  where klant_id = v_klant and afzender = 'verkoop' and gelezen_op is null and offerte_id is not distinct from p_offerte and order_nummer is not distinct from p_order;
  return coalesce((select jsonb_agg(jsonb_build_object('id', b.id, 'afzender', b.afzender, 'naam', b.afzender_naam, 'tekst', b.tekst, 'aangemaakt', b.aangemaakt) order by b.aangemaakt, b.id)
    from berichten b where b.klant_id = v_klant and b.offerte_id is not distinct from p_offerte and b.order_nummer is not distinct from p_order), '[]'::jsonb);
end $$;

create or replace function site_bericht_sturen(p_offerte bigint default null, p_order bigint default null, p_tekst text default null) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_klant bigint := site_klant(); v_id bigint; v_naam text;
begin
  if v_klant is null then raise exception 'geen_toegang'; end if;
  if (p_offerte is null) = (p_order is null) then raise exception 'kies_offerte_of_order'; end if;
  if nullif(btrim(coalesce(p_tekst, '')), '') is null then raise exception 'leeg_bericht'; end if;
  if p_offerte is not null and not exists (select 1 from offertes where id = p_offerte and klant_id = v_klant) then raise exception 'niet_gevonden'; end if;
  if p_order is not null and not exists (select 1 from orders where nummer = p_order and klant_id = v_klant) then raise exception 'niet_gevonden'; end if;
  if (select count(*) from berichten where klant_id = v_klant and afzender = 'klant' and aangemaakt > now() - interval '1 day') >= 30 then raise exception 'te_vaak'; end if;
  select coalesce(nullif(contactpersoon, ''), naam) into v_naam from klanten where id = v_klant;
  insert into berichten (klant_id, offerte_id, order_nummer, afzender, afzender_naam, tekst, kanaal)
  values (v_klant, p_offerte, p_order, 'klant', v_naam, left(btrim(p_tekst), 4000), 'website') returning id into v_id;
  insert into website_meldingen (soort, ref_id) values ('vraag_klant', v_id);
  return jsonb_build_object('id', v_id);
end $$;

---------------------------------------------------------------------------------------------------
-- 6. Formulieren van bezoekers (alleen met het gedeelde geheim van de site-server; die controleert eerst Turnstile)
---------------------------------------------------------------------------------------------------
create or replace function site_formulier(p_geheim text, p_soort text, p jsonb) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_secret text := site_instelling('website_geheim');
  v_email text := lower(btrim(coalesce(p ->> 'email', '')));
  v_taal text := upper(coalesce(nullif(p ->> 'taal', ''), 'NL'));
  v_naam text := left(nullif(btrim(coalesce(p ->> 'naam', '')), ''), 160);
  v_bedrijf text := left(nullif(btrim(coalesce(p ->> 'bedrijf', '')), ''), 200);
  v_tekst text := left(nullif(btrim(coalesce(p ->> 'tekst', '')), ''), 4000);
  v_tel text := left(nullif(btrim(coalesce(p ->> 'telefoon', '')), ''), 60);
  v_land text; v_kid bigint; v_bestaat boolean := false; v_fid bigint; v_ints text[]; v_branche text;
begin
  if v_secret is null or p_geheim is distinct from v_secret then raise exception 'geheim_onjuist'; end if;
  if p_soort not in ('aanmelding', 'contact', 'partij_aanbieden', 'handel_alert') then raise exception 'onbekend_formulier'; end if;
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' or length(v_email) > 200 then raise exception 'ongeldig_mailadres'; end if;
  if v_taal not in ('NL', 'EN', 'DE') then v_taal := 'NL'; end if;
  if (select count(*) from website_formulieren where lower(email) = v_email and aangemaakt > now() - interval '1 hour') >= 5 then raise exception 'te_vaak'; end if;
  if (select count(*) from website_formulieren where aangemaakt > now() - interval '1 hour') >= 300 then raise exception 'te_druk'; end if;
  if p_soort = 'handel_alert' then
    select coalesce(array_agg(c.code), '{}') into v_ints from artikel_categorieen c
    where c.niveau = 'hoofd' and c.code = any (array(select jsonb_array_elements_text(coalesce(p -> 'interesses', '[]'::jsonb))));
    if cardinality(v_ints) = 0 then raise exception 'kies_categorie'; end if;
  end if;
  if p_soort in ('contact', 'partij_aanbieden') and v_tekst is null then raise exception 'tekst_nodig'; end if;

  select k.id into v_kid from klanten k where k.samengevoegd_met is null and (lower(k.email) = v_email or lower(k.factuur_email) = v_email) order by k.relatie_nr nulls last limit 1;

  if p_soort = 'aanmelding' then
    if v_bedrijf is null or v_naam is null then raise exception 'gegevens_ontbreken'; end if;
    if nullif(btrim(coalesce(p ->> 'kvk_nr', '')), '') is null and nullif(btrim(coalesce(p ->> 'btw_nr', '')), '') is null then raise exception 'kvk_of_btw_nodig'; end if;
    v_land := coalesce((select l.naam from landen l where l.code = site_land_code(p ->> 'land') limit 1), left(nullif(btrim(coalesce(p ->> 'land', '')), ''), 80));
    v_branche := case when p ->> 'branche' in ('detailhandel', 'webshop', 'groothandel', 'horeca', 'overig') then p ->> 'branche' else 'overig' end;
    select coalesce(array_agg(c.code), '{}') into v_ints from artikel_categorieen c
    where c.niveau = 'hoofd' and c.code = any (array(select jsonb_array_elements_text(coalesce(p -> 'interesses', '[]'::jsonb))));
    if v_kid is not null then v_bestaat := true;
    else
      perform pg_advisory_xact_lock(7002);
      insert into klanten (id, naam, email, telefoon, taal, land, plaats, adres, postcode, btw_nr, kvk_nr, contactpersoon, bron, branche, interesses, notities)
      values ((select coalesce(max(id), 0) + 1 from klanten), v_bedrijf, v_email, v_tel, v_taal, v_land, left(nullif(btrim(coalesce(p ->> 'plaats', '')), ''), 100),
        left(nullif(btrim(coalesce(p ->> 'adres', '')), ''), 200), left(nullif(btrim(coalesce(p ->> 'postcode', '')), ''), 20),
        left(nullif(btrim(coalesce(p ->> 'btw_nr', '')), ''), 40), left(nullif(btrim(coalesce(p ->> 'kvk_nr', '')), ''), 40), v_naam, 'website', v_branche, v_ints,
        'Aanmelding via de website op ' || to_char(current_date, 'DD-MM-YYYY') || '.')
      returning id into v_kid;
    end if;
  end if;

  insert into website_formulieren (soort, taal, naam, bedrijf, email, telefoon, tekst, data, klant_id)
  values (p_soort, v_taal, v_naam, v_bedrijf, v_email, v_tel, v_tekst,
    jsonb_strip_nulls(jsonb_build_object('interesses', to_jsonb(v_ints), 'branche', v_branche, 'land', v_land, 'bestaande_klant', v_bestaat,
      'kvk_nr', nullif(btrim(coalesce(p ->> 'kvk_nr', '')), ''), 'btw_nr', nullif(btrim(coalesce(p ->> 'btw_nr', '')), ''),
      'omschrijving', left(p ->> 'omschrijving', 1000), 'hoeveelheid', left(p ->> 'hoeveelheid', 200), 'prijsidee', left(p ->> 'prijsidee', 200), 'link', left(p ->> 'link', 500))),
    v_kid) returning id into v_fid;
  insert into website_meldingen (soort, ref_id) values ('formulier', v_fid);
  return jsonb_build_object('ok', true); -- bewust niets over bestaande klanten teruggeven (geen mailadressen laten raden)
end $$;

---------------------------------------------------------------------------------------------------
-- 7. Meldingen: de site-server haalt op wat er gemaild moet worden (alleen als website_mails_aan = ja)
---------------------------------------------------------------------------------------------------
create or replace function site_meldingen_ophalen(p_geheim text) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_secret text := site_instelling('website_geheim');
begin
  if v_secret is null or p_geheim is distinct from v_secret then raise exception 'geheim_onjuist'; end if;
  if site_instelling('website_mails_aan') is distinct from 'ja' then return jsonb_build_object('aan', false, 'info_mail', site_instelling('website_info_mail'), 'items', '[]'::jsonb); end if;
  return jsonb_build_object('aan', true, 'info_mail', site_instelling('website_info_mail'), 'items', coalesce((
    select jsonb_agg(x.j order by x.id) from (
      select m.id, case m.soort
        when 'vraag_klant' then jsonb_build_object('id', m.id, 'soort', m.soort, 'klant', k.naam, 'klant_email', k.email, 'taal', k.taal, 'tekst', b.tekst, 'offerte_id', b.offerte_id, 'order_nummer', b.order_nummer,
            'offerte_nummer', (select o.nummer from offertes o where o.id = b.offerte_id))
        when 'antwoord' then jsonb_build_object('id', m.id, 'soort', m.soort, 'klant', k.naam, 'klant_email', coalesce((select a.email from klant_accounts a where a.klant_id = k.id and a.status = 'goedgekeurd' order by a.laatst_ingelogd desc nulls last limit 1), k.email),
            'taal', k.taal, 'tekst', b.tekst, 'offerte_id', b.offerte_id, 'order_nummer', b.order_nummer, 'offerte_nummer', (select o.nummer from offertes o where o.id = b.offerte_id))
        when 'aanvraag' then jsonb_build_object('id', m.id, 'soort', m.soort, 'klant', k2.naam, 'klant_email', k2.email, 'taal', k2.taal, 'offerte_id', o2.id, 'offerte_nummer', o2.nummer, 'offerte_soort', o2.soort,
            'bod_bedrag', o2.bod_bedrag, 'levering', o2.levering,
            'regels', (select coalesce(jsonb_agg(jsonb_build_object('omschrijving', r.omschrijving, 'aantal', r.aantal)), '[]'::jsonb) from offerte_regels r where r.offerte_id = o2.id and not r.vervallen))
        when 'akkoord' then jsonb_build_object('id', m.id, 'soort', m.soort, 'klant', k2.naam, 'offerte_id', o2.id, 'offerte_nummer', o2.nummer, 'akkoord_naam', o2.klant_akkoord_naam)
        when 'formulier' then jsonb_build_object('id', m.id, 'soort', m.soort, 'formulier', f.soort, 'naam', f.naam, 'bedrijf', f.bedrijf, 'email', f.email, 'telefoon', f.telefoon, 'taal', f.taal, 'tekst', f.tekst, 'data', f.data)
      end j
      from website_meldingen m
      left join berichten b on m.soort in ('vraag_klant', 'antwoord') and b.id = m.ref_id
      left join klanten k on k.id = b.klant_id
      left join offertes o2 on m.soort in ('aanvraag', 'akkoord') and o2.id = m.ref_id
      left join klanten k2 on k2.id = o2.klant_id
      left join website_formulieren f on m.soort = 'formulier' and f.id = m.ref_id
      where m.verstuurd_op is null and m.pogingen < 5 and m.aangemaakt > now() - interval '3 days'
      order by m.id limit 50) x where x.j is not null), '[]'::jsonb));
end $$;

create or replace function site_meldingen_afronden(p_geheim text, p_ids bigint[], p_fout text default null) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if site_instelling('website_geheim') is null or p_geheim is distinct from site_instelling('website_geheim') then raise exception 'geheim_onjuist'; end if;
  if p_fout is null then update website_meldingen set verstuurd_op = now() where id = any (p_ids) and verstuurd_op is null;
  else update website_meldingen set pogingen = pogingen + 1, fout = left(p_fout, 400) where id = any (p_ids) and verstuurd_op is null; end if;
end $$;

-- antwoord van Michel in het Salesbureau (afzender verkoop, kanaal website) komt in de meldingenrij zodat de klant een mail krijgt
create or replace function site_antwoord_melden() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.afzender = 'verkoop' and new.kanaal = 'website' then insert into website_meldingen (soort, ref_id) values ('antwoord', new.id); end if;
  return new;
end $$;
create or replace trigger berichten_antwoord_melden after insert on berichten for each row execute function site_antwoord_melden();

---------------------------------------------------------------------------------------------------
-- Rechten: precies dit mag de openbare sleutel en een ingelogde klant, verder niets
---------------------------------------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function site_zoek(text, text, text, boolean, text, integer, integer) to anon, authenticated;
grant execute on function site_artikel(text, text) to anon, authenticated;
grant execute on function site_categorieen() to anon, authenticated;
grant execute on function site_agenda() to anon, authenticated;
grant execute on function site_foto(integer, text) to anon, authenticated;
grant execute on function site_formulier(text, text, jsonb) to anon, authenticated;
grant execute on function site_meldingen_ophalen(text) to anon, authenticated;
grant execute on function site_meldingen_afronden(text, bigint[], text) to anon, authenticated;
grant execute on function site_mij() to anon, authenticated;
grant execute on function site_koppel_account() to authenticated;
grant execute on function site_gegevens_bijwerken(text, text, text, text[]) to authenticated;
grant execute on function site_offerte_aanvragen(jsonb, text, text, text, boolean, date, text) to authenticated;
grant execute on function site_bod_plaatsen(integer, numeric, text) to authenticated;
grant execute on function site_mijn_offertes() to authenticated;
grant execute on function site_offerte(bigint) to authenticated;
grant execute on function site_offerte_accepteren(bigint, text) to authenticated;
grant execute on function site_mijn_orders() to authenticated;
grant execute on function site_order(bigint) to authenticated;
grant execute on function site_openstaand() to authenticated;
grant execute on function site_berichten(bigint, bigint) to authenticated;
grant execute on function site_bericht_sturen(bigint, bigint, text) to authenticated;
