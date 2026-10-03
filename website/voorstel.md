# Voorstel: één website met het Salesbureau

*Stand 3 oktober 2026. Er is niets live gezet en niets aan de huidige site, WordPress, PCextreme of de DNS veranderd.*

## In het kort

De nieuwe website en het Salesbureau gebruiken **dezelfde database** (Supabase). Wat Michel in het Salesbureau aanpast (voorraad, foto, prijs, of een artikel openbaar mag) staat direct goed op de site. Een offerteaanvraag of aanmelding van de site komt direct als offerte of prospect in het Salesbureau binnen. WordPress/WooCommerce verdwijnt na de overstap.

Bezoekers merken weinig verschil: zelfde huisstijl, zelfde adressen (`/product/<naam>/`, `/en/`, `/de/`), prijzen alleen na inloggen, geen winkelwagen maar een offertelijst. Wel nieuw: werkende aanmelding, minimale afname per omdoos, filters op de nieuwe 17 categorieën, en een klantomgeving met persoonlijk aanbod en de status van offertes en orders.

## Wat publiek meedoet en wat niet

Bron: artikelexport 01-10-2026 (1.151 artikelen) en de beperkingen in de artikelnaam. Per artikel uitgewerkt in `artikelen_publiek_indeling.csv`.

| Op de nieuwe site | Aantal | Waarom |
|---|---:|---|
| **Openbaar** (iedereen ziet artikel, prijs na inloggen) | **618** | Staat nu in de webshop en de naam bevat geen verkoopbeperking. |
| **Alleen na inloggen**, met landfilter | **95** | Staat nu in de webshop, maar de naam zegt: geen verkoop Benelux (48), geen verkoop DE/AT/CH (13), geen online/consumentenverkoop (10), geen online + geen verkoop Benelux (12), geen verkoop NL-BE-LU-DE-FR-AT-UAE (5), geen online + geen verkoop NL (4), niet aan Action-landen (2), plus 1 erotiekartikel. Een klant ziet zo'n artikel alleen als zijn land is toegestaan. |
| **Niet op de site** | **438** | Staat nu niet in de webshop. Blijft alleen per mail (weekmails) en als persoonlijk aanbod in de klantomgeving, als Michel dat wil (zie open vragen). Hieronder ook 25 met een verkoopbeperking en 2 met verkoopprijs 0. |

**Let op, nu al:** minstens 63 van die 95 artikelen met een beperking staan **op dit moment openbaar** op fvdwpartijhandel.nl (bijv. Fresh & Co dekbedovertrekken "Geen verkoop Benelux", Laser Cuisine messen "Geen ONLINE consumenten verkoop", borden en mokken "No sale DE-AT-CH" die ook in het Duits openbaar staan). Of dat mag, hangt af van de afspraak met de leverancier. Dit staat los van de nieuwe site.

Na de overstap wordt "openbaar" een vinkje per artikel in het Salesbureau, met een apart veld voor landen waar niet verkocht mag worden. De tekst in de artikelnaam is dan alleen nog een geheugensteun.

### Pagina's

| Huidige pagina (NL / EN / DE) | Nieuwe site | |
|---|---|---|
| Home | Home | Zelfde opbouw: hero, nieuw binnen, categorieën, agenda, Handel alert |
| Partijgoederen / Shop (68 pagina's, ook uitverkochte artikelen) | Partijen | Alleen artikelen op voorraad; filter op de nieuwe 17 hoofdcategorieën en hun subcategorieën |
| Product (`/product/<naam>/`) | Zelfde adres | Zelfde naam in het adres, dus geen doorverwijzing nodig voor de 678 huidige |
| Productcategorie (10 oude) | Categoriepagina | Oude adressen verwijzen door naar de best passende nieuwe categorie |
| Klant worden | Klant worden | **Werkt nu niet**: in NL, EN en DE staat alleen de tekst `[wc-user-registration-page]` |
| Offerte / Request a quote | Offertelijst | Aanvraag komt als offerte in het Salesbureau |
| Mijn account | Mijn omgeving | Persoonlijk aanbod, offertes, orders, gegevens |
| Agenda, Over ons, Contact | Zelfde | Agenda beheerd vanuit het Salesbureau |
| Winkelwagen, Afrekenen | Vervalt | Doorverwijzing naar de offertelijst |
| Bedankt | Vervalt | Bevestiging op de pagina zelf |
| **Ontbreekt nu** | Privacybeleid, Algemene voorwaarden, Cookies | Nodig voor formulieren en aanmeldingen |

## Nieuw ten opzichte van de huidige site

Wat het voorbeeld laat zien en wat de huidige site niet heeft:

| Toevoeging | Waarom |
|---|---|
| **Partijlijst**: catalogus als tabel met voorraad, omdoos, pallet, prijs en een knop "+ 1 omdoos" | Handelaren scannen veel partijen tegelijk; dit is de partijlijst uit de mails, maar dan altijd actueel |
| **Bod op de hele partij** (na inloggen) | Typisch voor partijhandel: wie alles afneemt, mag bieden. Komt als offerte met status Bod in het Salesbureau, met het percentage van de vraagprijs erbij |
| Prijs **per omdoos** naast de prijs per stuk, en een totaal (artikelen, omdozen, stuks) op de offertelijst | Minimale afname is 1 omdoos; zo rekent de klant meteen in de goede eenheid |
| Labels **Nieuw** (laatste 3 weken binnen) en **Restant** (minder dan 1 omdoos) | Nieuw trekt herhaalbezoek; bij een restant ziet de klant direct dat hij moet bellen, net als nu op de site |
| **Handel alert per categorie** ("mail mij bij nieuwe partijen in Koken & tafelen") | Meer en betere aanmeldingen; past op de interesses in Mailchimp |
| **Mijn interesses** in de klantomgeving | Klant houdt zelf bij wat hij wil krijgen; stuurt het persoonlijke aanbod en de mails |
| **Landfilter met uitleg**: ingelogde klant ziet hoeveel artikelen voor zijn land verborgen zijn, en op de productpagina waar een artikel niet leverbaar is | Verkoopafspraken worden automatisch nageleefd |
| **Zo werkt het** in drie stappen op de home | Nieuwe bezoekers snappen meteen dat het om offertes gaat, niet om bestellen |
| **WhatsApp-knop** (bestaat nu ook) en **Deel via WhatsApp** op elke partij | Handelaren sturen partijen door aan hun eigen klanten |
| **Showroom op afspraak** bij Over ons | Zaterdag op afspraak staat nu alleen bij de openingstijden |
| **Werkende aanmelding** met KvK, btw, land, soort bedrijf en interesses | De huidige pagina Klant worden is kapot |

Na te vragen bij Michel: de tekst "klaargezet voor afhalen of transport" in stap 3 is afgeleid (eigen vrachtwagen, vervoerders in het Salesbureau), niet bevestigd.

## Opbouw

1. **Openbare site** (iedereen): home, partijen, productpagina's, agenda, over ons, contact, klant worden, partij aanbieden, Handel alert. Drie talen met eigen adressen.
2. **Klantomgeving** (na inloggen, alleen goedgekeurde klanten): prijzen, artikelen met beperking als het land klopt, persoonlijk aanbod, offertelijst zonder formulier, eigen offertes en orders met status.
3. **Salesbureau** (Michel en collega's): bestaat al. Krijgt erbij: vinkje openbaar en landbeperking per artikel, goedkeuren van nieuwe klanten, agenda-items, en binnenkomende websiteaanvragen bij Offertes.

Inloggen voor klanten gaat met een **inloglink per mail** (geen wachtwoord om te vergeten). Wie zich aanmeldt, komt als prospect in het Salesbureau en krijgt pas toegang als Michel op goedkeuren klikt; de KvK- en btw-nummers staan dan al bij de klant.

## Hoe het met Supabase praat

- De site draait als Next.js-project bij **Vercel**. Alleen de server van de site praat met Supabase; de browser van een bezoeker krijgt nooit een sleutel waarmee hij de database kan lezen.
- **Openbare artikelen** komen uit een aparte view `publiek_artikelen` zonder inkoopprijs, verkoopprijs, leverancier of marge. Pagina's worden vooraf gebouwd en elke paar minuten ververst, dus snel en goed vindbaar.
- **Prijzen** haalt de site pas op als een goedgekeurde klant is ingelogd, via een functie die controleert of het account bij een klant hoort.
- **Klantaccounts** gaan via Supabase Auth. Een koppeltabel `klant_accounts` verbindt een login met een rij in `klanten`. Toegangsregels (RLS) zorgen dat een klant alleen eigen offertes en orders ziet.
- **Offerteaanvraag** wordt een rij in `offertes` met status *Aanvraag* en bron *website*, plus `offerte_regels` in omdozen. Michel ziet die meteen in het Salesbureau en maakt er een offerte van.
- **Aanmelding** wordt een prospect in `klanten`. **Partij aanbieden** komt als inkoopkans bij Opvolging.
- **Foto's** komen in Supabase-opslag (openbare map alleen voor productfoto's). Nu staan ze bij MyBusiness en WordPress.
- Formulieren krijgen spambescherming (Cloudflare Turnstile, gratis; de huidige site gebruikt die ook).

Nu staan alle tabellen dicht (RLS aan, geen regels). Dat blijft zo; de site krijgt alleen de rechten die hierboven staan.

## Talen en vindbaarheid

- Zelfde adressen als nu: `/`, `/en/`, `/de/`, productpagina's onder `/product/<naam>/` met de huidige namen per taal (EN- en DE-adressen voor 678 artikelen staan al klaar).
- Productnamen in drie talen bestaan al (commerciële namen NL/EN/DE, zonder interne codes en beperkingsteksten). Categorienamen ook.
- **643 oude productadressen** (uitverkochte artikelen in de huidige sitemap) verwijzen door naar hun categorie, zodat Google en oude mails niet op een foutpagina uitkomen.
- Sitemap, taalverwijzingen (hreflang), titels en omschrijvingen per pagina. Na de overstap de sitemap aanmelden in Google Search Console.
- Bekende fout op de huidige site die vanzelf verdwijnt: het lettertype Montserrat wordt geladen van een testadres (`fvdwpartijhandel.test`) en valt daardoor vaak terug op een systeemlettertype.

## Wat er met WordPress/WooCommerce gebeurt

1. Blijft gewoon draaien tot de nieuwe site klaar en getest is.
2. Vooraf exporteren: klantaccounts (om te koppelen aan de klanten in Supabase), Handel alert-aanmeldingen (naar Mailchimp), agenda en teksten.
3. Bij de overstap gaat alleen het webadres naar Vercel. **De mail blijft ongemoeid**: die loopt via Microsoft 365 (MX-record) en dat record blijft staan.
4. WordPress blijft daarna nog een maand of drie bereikbaar op een apart adres als terugval, en wordt dan opgezegd.

Wie heeft de site gebouwd? Het thema en de maatwerkplugins heten "allroundweb" (offerteplugin, KvK- en btw-velden, agenda). Waarschijnlijk is dat het webbureau Allround Web; dat is afgeleid uit de namen, niet bevestigd. De site draait op een server met Plesk waarvan het IP-adres bij Hetzner hoort, dus vermoedelijk niet bij PCextreme; de DNS staat wel bij PCextreme (AuroraDNS). Het contract met de webbouwer en de opzegtermijn moeten bekend zijn voordat we een datum kiezen.

## Kosten (per maand, richtprijzen)

| Post | Nu | Nieuw |
|---|---|---|
| Hosting website | Bij de webbouwer, bedrag onbekend | Vercel Pro: $20 per gebruiker (gratis plan mag niet voor bedrijfssites) |
| Database | Supabase gratis | Supabase Pro: $25, nodig voor dagelijkse back-ups en omdat een gratis project na een week zonder gebruik pauzeert; een openbare site mag dat niet |
| Licenties | Elementor Pro, WPML, FacetWP, WP Rocket, maatwerkplugins | Vervallen |
| Domein en DNS | PCextreme | Blijft PCextreme |
| Mail | Microsoft 365 | Blijft |
| Mails van de site (bevestigingen, inloglinks) | Via WordPress | Gratis tot een paar duizend per maand (bijv. Resend), daarboven ca. $20 |

Ongeveer **€ 45 tot € 70 per maand**, plus de bouw. Daartegenover staan de hosting en licenties die bij WordPress wegvallen; de huidige kosten moeten bij de webbouwer worden opgevraagd.

## Risico's

| Risico | Wat we doen |
|---|---|
| Tijdelijk minder bezoekers via Google | Zelfde adressen, doorverwijzingen voor alles wat verdwijnt, sitemap direct aanmelden |
| Mail valt uit bij de overstap | Alleen het `www`- en hoofdadres wijzigen; MX en mailrecords niet aanraken. Vooraf een lijst van alle DNS-records maken |
| Prijzen of inkoopprijzen lekken | Nooit in de browser of openbare view; alleen via de server na inloggen. Test met een niet-goedgekeurd account |
| Artikel staat ten onrechte openbaar | Vinkje openbaar en landbeperking per artikel, standaard uit voor nieuwe artikelen |
| Data niet compleet | In Supabase is de kolom verpakking bij alle 1.154 artikelen leeg (de waarden staan wel in de import, `5_artikel_extra.csv`). Eerst vullen, want de omdoos is de minimale afname |
| Alles hangt aan één database | Supabase Pro met dagelijkse back-ups; de site blijft lezen als het Salesbureau even niet werkt |
| Het Salesbureau is nu een artifact | Prima voor Michel; de website hangt er niet van af, alleen van de database |
| Klanten moeten opnieuw inloggen | Inloglink per mail naar bestaande klanten bij de lancering; geen wachtwoorden overzetten |
| Contract webbouwer | Opzegtermijn en eigendom van teksten/foto's eerst navragen |

## Volgorde

1. **Besluit** van Michel (en de eigenaar): doorgaan met deze opzet.
2. **Data klaarzetten in Supabase** (via de thread Online werkomgeving sales): velden openbaar, landbeperking, adresnaam per taal, namen EN/DE, verpakking vullen; tabellen `klant_accounts` en `agenda`; view `publiek_artikelen`; toegangsregels.
3. **Michel maakt een Vercel-account** en zet de Supabase-sleutels daar zelf neer (niet in de code of in de chat).
4. **Bouwen** op een testadres (bijv. `nieuw.fvdwpartijhandel.nl` of het Vercel-adres), met dit voorbeeld als ontwerp.
5. **Testen** met Michel en een paar vaste klanten: aanmelden, inloggen, offerte aanvragen, landfilter.
6. **Exporteren uit WordPress** (klantaccounts, Handel alert, agenda) en doorverwijzingen controleren.
7. **Overstap** op een rustige dag: alleen het webadres in de DNS bij PCextreme wijzigen, na Michels ja. Mail blijft.
8. **Nazorg**: Search Console, foutpagina's bekijken, WordPress na een maand of drie opzeggen.

## Open vragen voor Michel


1. Mogen de 438 artikelen die nu niet in de webshop staan, in de klantomgeving als persoonlijk aanbod verschijnen (alleen voor ingelogde klanten), of alleen per mail?
2. Mogen artikelen met "geen online consumentenverkoop" wel achter de inlog voor zakelijke klanten? (Voorstel: ja, want alleen zakelijke klanten loggen in.)
3. Is de webbouwer Allround Web, en wat is de opzegtermijn?
4. Mag de voorraad openbaar zichtbaar blijven (nu wel), of alleen na inloggen?
5. Mag het bieden op een hele partij erin, en vanaf welk percentage van de vraagprijs wil je een bod zien?
