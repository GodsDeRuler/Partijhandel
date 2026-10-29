# Nieuwe website Frank van de Wijgert Partijhandel

De site staat in `website/site` (Next.js 16, App Router, NL/EN/DE). Het ontwerp en de afwegingen staan in `voorstel.md` (projectbestanden). Deze repository is **openbaar**: geen prijzen, klantgegevens of sleutels in de repository zetten.

## Hoe alles samenhangt

```
Bezoeker ──► Website (Vercel, website/site) ──► Supabase (database "Partijhandel") ◄── Salesbureau (werkomgeving/index.html)
                      │                                         ▲
                      └── Resend (mails, pas als Michel dat aanzet)
```

- **Eén database.** Website en Salesbureau lezen en schrijven in dezelfde Supabase-tabellen (artikelen, klanten, offertes, orders, berichten). Er is geen kopie en geen synchronisatie.
- **De website heeft nooit directe tabeltoegang.** Alle tabellen staan op RLS aan en `anon`/`authenticated` hebben geen tabelrechten. De site praat alleen met `site_*` functies (SECURITY DEFINER), gedefinieerd in `supabase/migrations/20261003g_website_koppeling.sql`:
  - openbaar: `site_zoek`, `site_artikel`, `site_categorieen`, `site_agenda`, `site_foto`
  - formulieren (alleen met de gedeelde sleutel): `site_formulier`, `site_meldingen_ophalen`, `site_meldingen_afronden`
  - ingelogde klant: `site_mij`, `site_koppel_account`, `site_gegevens_bijwerken`, `site_offerte_aanvragen`, `site_bod_plaatsen`, `site_mijn_offertes`, `site_offerte`, `site_offerte_accepteren`, `site_mijn_orders`, `site_order`, `site_openstaand`, `site_berichten`, `site_bericht_sturen`
  - beheer: `site_slugs_aanvullen`
- **Gedeelde sleutel.** `instellingen.website_geheim` staat alleen in de database. Michel ziet hem in het Salesbureau (Website > Site-beheer > "Toon de sleutel") en zet hem als `WEBSITE_FORM_SECRET` in Vercel. Nooit in de repository.
- **Toegang tot prijzen en Mijn omgeving.** Een klant logt in met een mail-link (Supabase Auth). `klant_accounts.status` en `klanten.site_toegang` bepalen of de klant wordt toegelaten (`website_auto_goedkeuren` staat op 'ja' voor bekende klanten). Goedkeuren, blokkeren, resetten en koppelen doet Michel in het Salesbureau (Website > Toegang).

### Wat landt waar in het Salesbureau

| Op de site | In het Salesbureau |
| --- | --- |
| Offerte aanvragen of bod uitbrengen | Website > Offertes via de site (en gewoon in Offertes) |
| Online akkoord op een offerte | Opvolgtaak `[site:akkoord:<id>]`; Michel zet de offerte met één klik om naar een order, dan vervalt de taak vanzelf |
| Contact, klant worden, partij aanbieden, handel-alert | Website > Formulieren (verwerkt-markering, toegang geven, interesses overnemen, antwoord per mail) |
| Account aangevraagd | Website > Toegang |
| Bericht van klant in Mijn omgeving | Berichten bij de klant |
| Agenda, zichtbaarheid van artikelen, namen NL/EN/DE, slugs, landen, beperkingen | Website > Site-beheer |

Orders, openstaande posten en offertes die de klant ziet in Mijn omgeving komen rechtstreeks uit dezelfde tabellen die het Salesbureau vult.

## Lokaal draaien

```
cd website/site
cp .env.example .env.local   # vul in (Turnstile testsleutels staan in het voorbeeld)
npm install
npm run dev
```

## Live zetten: wat Michel of een webbouwer nog moet regelen

Niets hiervan is al gebeurd. De site is gebouwd en getest tegen de echte database, maar staat nog niet online.

1. **Vercel.** Project aanmaken op deze repository, *Root Directory* `website/site`. Environment variables uit `.env.example` invullen. De cron (`vercel.json`, elke 5 minuten) die mails verstuurt vraagt een Pro-abonnement; zonder cron gaat er simpelweg niets uit.
2. **Supabase Auth.** Site URL = het publieke adres; Redirect URLs: `https://<domein>/auth/callback/`. Mailtemplate "Magic link" aanpassen naar `{{ .SiteURL }}/auth/callback/?token_hash={{ .TokenHash }}&type=email&lang=nl` (dan werkt inloggen ook als de klant de mail op een ander apparaat opent). Eigen SMTP instellen (de ingebouwde mail is zwaar beperkt) en de rate limits nakijken.
3. **Cloudflare Turnstile.** Site key en secret aanmaken en in Vercel zetten. Zonder secret weigert de site in productie alle formulieren (bewust).
4. **Resend + domein.** Domein verifiëren (SPF/DKIM). **Raak de MX-records niet aan**: de mail van het bedrijf blijft op Microsoft 365. DNS staat bij PCextreme.
5. **Mails vanuit de site** blijven uit (`website_mails_aan` = 'nee') tot Michel expliciet zegt dat ze aan mogen.
6. **Oude adressen.** Er zijn ongeveer 643 oude productadressen van de huidige WooCommerce-site; bij de overgang moeten die doorverwijzen (301) naar de nieuwe `/product/<slug>/`. De slugs staan in `artikelen.slug_nl`, `slug_en` en `slug_de`.
7. **Juridische teksten.** Privacy en voorwaarden zijn concept met velden als "[invullen]". Laat ze door een jurist nakijken; zet daarna `LEGAL_FINAL=1` in Vercel om de conceptbanner weg te halen.
8. **Foto's.** 230 zichtbare artikelen hebben alleen de grijze standaardfoto (de site toont dan "Foto volgt"). De overige foto's worden via `/foto/<nr>/<maat>/` doorgestuurd naar MyBusiness; uploaden naar eigen opslag kan later via het Salesbureau.
9. **Agenda** is leeg; Michel vult die in het Salesbureau.

## Medewerkersomgeving (Salesbureau op /intern/)

Het Salesbureau draait ook als webapp op dezelfde site, met inlog per medewerker. De bron blijft `werkomgeving/index.html`; `node scripts/sync-salesbureau.mjs` (in `website/site`) kopieert hem naar `private/salesbureau.html`, het bestand dat `/intern/` uitserveert. Draai dat na elke wijziging aan het Salesbureau.

- **Inloggen:** `/intern/inloggen/`, met een inloglink per mail (Supabase Auth). Alleen een e-mailadres in de tabel `medewerkers` (actief, met een rol) komt binnen. Rollen: `beheer`, `verkoop`, `magazijn`, `alleen_lezen` (die laatste kan niets wijzigen).
- **Hoe de pagina praat:** `lib/intern-shim.ts` zet de aanroepen die het Salesbureau in claude.ai deed (database, AI, bestanden opslaan) om naar `/intern/api/sql/` en `/intern/api/ai/`. De browser krijgt nooit een sleutel. Schrijfopdrachten komen in het logboek `intern_log`.
- **Database:** de server verbindt met de gebruiker `salesbureau_app` (`SUPABASE_DB_URL`). Migratie `supabase/migrations/20261029b_intern_toegang.sql` maakt die gebruiker, het logboek en de regels per tabel (draai `select intern_policies();` na elke migratie die een tabel toevoegt). Het wachtwoord van de gebruiker kiest Michel zelf in de SQL-editor van Supabase: `alter role salesbureau_app with password '...';`.
- **Eerste medewerkers:** `insert into medewerkers (naam, email, rol) values ('Naam', 'mail@adres.nl', 'beheer');`
- **Nog niet:** projectbestanden lezen (import vanuit de projectmap) werkt alleen in claude.ai; op de site komt daar een uploadknop voor. Rechten per rol gelden nu alleen voor alleen_lezen; menu's verbergen per rol volgt.

## Bekende beperkingen

- Pagina's worden per bezoek opgebouwd (geen caching of ISR). Dat is bewust eenvoudig begonnen; later te verbeteren.
- EN/DE-pagina's gebruiken dezelfde (Nederlandse) padnamen, bijvoorbeeld `/en/partijen/`.
- Inloggen met mail-link en de ingelogde schermen zijn hier niet end-to-end in een browser getest: een testaccount aanmaken in de echte database is niet toegestaan in deze sessie. De databasefuncties zijn wel met een terugrol-test gecontroleerd.
- De sitemap laadt maximaal 5.000 artikelen.
