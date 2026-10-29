# Salesbureau

Eén HTML-pagina die als privé-artifact in claude.ai draait en via je eigen Supabase-koppeling
met het project "Partijhandel" (`suwsagwkzflsahaptasy`) praat. Geen sleutels in de code, RLS blijft aan.
Doel: vervanging van mybusiness, inclusief de sales.

Onderdelen
- Navigatie: vijf groepen (Overzicht, Verkoop, Artikelen, Marketing, Gegevens) met onderdelen eronder; zoekbalk bovenin voor klanten, artikelen en orders; menu "+ Nieuw" voor offerte, klant, artikel, inkooporder en leverancier.
- Dashboard: omzet, marge, klanten, voorraadwaarde, offertes, mails, omzet per maand, top klanten en landen.
- Vandaag: opvolgingen, aanvragen en offertes zonder antwoord, slapende klanten, kopers van vorig jaar.
- Klanten: zoeken, toevoegen (klant of prospect), wijzigen, klantkaart met profiel, orders, offertes, notities en mailconcept.
- Assortiment: artikelen met foto, voorraad en marge, nieuw artikel en wijzigen, mandje voor aanbodmail of offerte, kopers per artikel.
- Offertes: aanvraag, reservering en offerte met regels; omzetten naar order (regels, orderregels, voorraad afboeken).
- Orders: overzicht, status wijzigen, inhoud.
- Uitvoering: orders die nog verzonden moeten worden, orderpick en pakbon per order (afdrukbaar), verzonden markeren (orderstatus wordt Geleverd).
- Inkoop: leveranciers en inkooporders; bestelmail als concept; ontvangst boeken verhoogt de voorraad van het artikel.
- Facturen: factuur uit een order, btw (binnenland, verlegd bij EU met btw-nummer, export 0%), doorlopende nummers (instelbaar start), definitief maken, betalingen, creditnota, afdrukken als pdf, mailtekst. Stamgegevens (Onderhoud): bedrijfsgegevens, btw-groepen, betalingscondities en -wijzen, landen, merken, vervoerders, medewerkers.
- Prijzen: prijsafspraken per klant (met looptijd), staffelprijzen per artikel en een prijslijst per klant; de prijs volgt afspraak, dan staffel, dan verkoopprijs. Voorraad: analyse, mutatiejournaal, inventarisatie. Artikelformulier met leverancier, merk, verpakking, locatie, btw-groep en HS-code; de Gegevens-tab laadt `5_artikel_extra.csv` (leverancier en verpakking per artikel).
- Rapporten (Financieel): omzet en marge per maand, klant, land en relatiebeheerder (met provisie), omzet per artikel, btw per kwartaal, openstaande posten met ouderdomsanalyse en een klantenlijst met adressen; elk rapport is te kopiëren naar Excel. Orders ook als bord per status, Uitvoering toont zendingen met track & trace-link, de klantkaart heeft contactpersonen, adres- en factuurgegevens, prijsafspraken en facturen (migratie 20261002d).
- Dashboard: vier grote kerncijfers (omzet 12 mnd met verloop, omzet dit jaar tegenover vorig jaar, voorraad naar leeftijd, open offertes), een lijst 'Hier moet je iets mee' met alleen wat aandacht vraagt, orders in uitvoering, omzet per maand, verkoop in cijfers, voorraad naar leeftijd (inkoopwaarde ouder dan 2 jaar), klantgezondheid, top 10 en omzet per land; alles klikt door. Langliggende voorraad staat ook onder Artikelen, Voorraad, Analyse (leeftijd = aanmaakdatum in MyBusiness).
- Offertes uitgebreid (migratie 20261002e): offertenummer (jaartal + volgnummer), referentie, levertijd, betaling, inleiding en voorwaarden (standaard in te stellen bij Stamgegevens), korting en btw per regel, optionele regels, waarschuwingen (boven voorraad, geen veelvoud van de omdoos, onder inkoopprijs), een artikel start op 1 omdoos (kolom Verpakking, bv. 400/10 = 10) en het aantal wordt naar een veelvoud afgerond, prijs volgt het aantal (staffel), afdrukbare offerte met briefkop, kopie maken, markeren als verstuurd met opvolging, overzicht met opvolg- en conversiecijfers.
- Kaart: wereldkaart met klanten per plaats, grootte naar omzet (totaal of laatste 12 maanden), zoom en verschuiven, lijsten van klanten zonder precieze locatie. Locaties komen uit sales/kaart/locaties.csv (gemaakt met kaart/geocode.py uit postcode of plaats, GeoNames-gegevens); kaartvlakken uit Natural Earth 50m (world-atlas), ingebed in de pagina.
- Campagnes: artikelen, ontvangers, geopend en reactie vastleggen. Verstuurt nooit zelf iets.
- Opvolging en Gegevens (CSV's uit de projectbestanden laden; klanten en orders worden nooit overschreven, omdat de klantkoppeling op orders en de MyBusiness-gegevens op klanten vanuit de database komen).

Regels
- De pagina verstuurt geen mail. Claude schrijft een concept, Michel verstuurt zelf.
- De pagina verwijdert niets (soft delete via `offerte_regels.vervallen`).
- Foto's komen uit `sales/aanbodpagina/fotos/<artikelnr>.jpg` in de projectbestanden.

Database: `supabase/migrations/`.

## Uiterlijk
Huisstijl van fvdwpartijhandel.nl: Montserrat, blauw #0060F0, navy #0E2B5D, cyaan #4BD7E3, lichtblauw #EDF8FF, logo in de kop (in donker thema op een witte plaat), cyaan menubalk met ronde knoppen en een navy voetbalk. Alle kleuren staan als tokens bovenaan de stijl; lichte en donkere weergave volgen het systeem.

## Kaart, artikelfoto's en voorraad (2026-10-02)
- Kaart: zit nu als blok in het Dashboard (geen apart tabblad meer).
- Artikelfoto's: bij Artikel wijzigen kun je foto's kiezen of slepen. Ze worden in de browser verkleind (groot 1100 px, klein 360 px) en opgeslagen in de tabel `artikel_fotos` van Supabase (`supabase/migrations/20261002f_artikel_fotos.sql`). Eén hoofdfoto per artikel, verwijderen gaat via `vervallen`.
- Voorraad nu (Artikelen > Voorraad): zoekbare lijst met voorraad, onderweg, waarde en locatie, met knoppen Afboeken en Bijboeken (reden verplicht, niet meer afboeken dan er ligt). Alles komt in het voorraadjournaal (`20261002g_voorraad_afboeken.sql`).
- Automatisch afboeken: een offerte omzetten naar een order boekt de voorraad altijd af (journaal: Verkoop, "Order <nummer>"). Is er te weinig voorraad, dan wordt de order niet gemaakt en staat er per artikel wat er mist. Let op: een nieuwe artikelexport uit MyBusiness (Gegevens) overschrijft de voorraad.
- Voorraad heeft zichtbare knoppen: Voorraad nu, Analyse, Journaal, Tellen. Er is geen minimale voorraad of bijbestellen: het assortiment is opportunistisch (partijen komen binnen als ze zich aandienen).

## Logistiek (2026-10-03)
Menugroep Logistiek: Uitvoering (kengetallen en orders met pakbon), Orderpicken (pick-opdracht over meerdere orders, op volgorde van magazijnlocatie, met omdoos- en palletaantallen en een sorteerlijst per order; "Markeer als gepickt" zet de order op Gereed), Transport (planning per dag, soort Verzenden/Klant haalt af/Eigen vervoer, pallets, colli en gewicht op de pakbon, transportopdracht of afhaallijst per vervoerder, bulk verzenden), Werkbrieven (interne opdrachten met status, deadline en toewijzing, afdrukbaar, ook te maken vanuit een order), Retouren (vastleggen, ontvangen, per regel terug in voorraad of afkeuren) en Locaties (magazijnlocatie per artikel invullen of een locatie verplaatsen). Migratie `supabase/migrations/20261003_logistiek.sql`. Het dashboard meldt orders om te picken, werkbrieven voorbij de deadline en open retouren.

## Koppelingen (2026-10-03)
Doel: verkoop, website en backoffice werken op dezelfde gegevens (`supabase/migrations/20261003b_koppelingen.sql`).
- Per artikel staat vast waar het mag worden aangeboden (`zichtbaarheid`: openbaar op de website, na inloggen, alleen per mail), welke landen zijn uitgesloten (`geblokkeerde_landen`) en welke beperking geldt (`verkoopbeperking`). De startwaarden komen uit de indeling van de nieuwe website (website/artikelen_publiek_indeling.csv in de projectmap). Nieuwe artikelen staan standaard op "alleen per mail", dus er komt niets per ongeluk openbaar. Wijzigen kan bij Artikel wijzigen, filteren in Assortiment (Aanbieden).
- Offerte: waarschuwing per regel en bovenaan als een artikel niet naar het land van de klant mag, als de klant te laat betaalt of boven zijn kredietlimiet komt, en als er een Let op bij de klant staat. Omzetten naar order vraagt dan een tweede klik.
- Order: blok Gekoppeld met offerte, pickstatus en pakbon, factuur (en wat nog openstaat), werkbrieven, retouren en de automatische voorraadafboeking. Vanuit de order kun je een retour melden.
- Artikel: blok Gekoppeld met voorraad, hoeveel in open offertes, categorie, website, beperking, open offertes, recente orders, inkoop onderweg, werkbrieven, retouren en laatste voorraadmutaties, alles aanklikbaar.
- Klant: kredietlimiet (Gegevens wijzigen), openstaand bedrag, waarschuwing bij achterstand, retouren en klikbare orders.
- Financieel > Debiteuren: per klant wat openstaat, te laat, herinneringsniveau en kredietlimiet. "Herinnering opstellen" maakt een tekst in de taal van de klant (NL, EN of DE) die je zelf verstuurt; met "Ik heb deze mail verstuurd" wordt dat in `aanmaningen` en bij Opvolging vastgelegd. Alleen facturen uit het Salesbureau tellen mee; MyBusiness-facturen niet.
- Rapporten > ICP-opgaaf: leveringen met btw verlegd naar EU-klanten per kwartaal met btw-nummer.
- Website: een aanvraag van de nieuwe website komt als offerte met status Aanvraag en bron `webshop` binnen (zie de thread Nieuwe website met Salesbureau). Een live koppeling met de huidige WooCommerce-site vraagt API-sleutels van de webbouwer en is niet gemaakt.

## Berichten (2026-10-03)
Chat met klanten per offerte of order (`supabase/migrations/20261003c_berichten.sql`, opdracht uit de thread Nieuwe website met Salesbureau). Belletje met teller in de bovenbalk (ongelezen klantvragen, ververst bij elke weergave en elke 60 seconden), tabblad Verkoop > Berichten (standaard "Wacht op antwoord"), chatblok in elke offerte en order (openen markeert klantberichten als gelezen; een offerte en de order die eruit kwam delen één gesprek), handmatig vastleggen van telefoon, WhatsApp en mail, en een dashboardregel met het aantal wachtende vragen. Het Salesbureau mailt nooit zelf. De nieuwe website schrijft later in dezelfde tabel `berichten`; tot die live staat ziet de klant antwoorden niet.

## Stroomlijning (2026-10-03)
Migraties `20261003d_stroomlijning.sql`, `20261003e_annuleren_overzicht.sql`, `20261003f_samenvoegen_trigger.sql`.
- Debiteuren inlezen: knop in Financieel > Debiteuren leest een CSV of geplakte tabel uit MyBusiness (relatienummer, factuurnummer, datum, vervaldatum, openstaand bedrag). Kolommen worden herkend en zijn te corrigeren, er is eerst een controle. Wat niet meer op een nieuwe lijst staat, telt als betaald. Salesbureau-facturen en MyBusiness-posten staan samen in de view `debiteur_posten` (debiteuren, krediet, rapport en dashboard gebruiken die).
- Goederenontvangst: bij een inkoopontvangst vul je per regel de magazijnlocatie in; die wordt bij het artikel bewaard.
- Order annuleren: knop in de order, met controle (geen factuur, niet verzonden) en bevestiging. Voorraad gaat terug (bijboeking "Annulering order N"), omzet wordt 0 (oorspronkelijke bedragen blijven in `prijs_voor_annulering`), offerte wordt afgewezen, werkbrieven vervallen. Geannuleerde orders staan niet in picken, uitvoering, bord, rapporten en klantcijfers.
- Creditnota bij een retour: knop in de retour maakt een concept-creditnota met prijzen en btw van de oorspronkelijke factuur.
- Pakbon: etiketten per pallet en collo (1 pagina per etiket) en een vrachtbrief naar het CMR-model; een vervoerder kan een eigen officieel CMR-formulier eisen.
- Transport opvragen: per pakbon een prijsaanvraag per vervoerder (mailtekst NL of EN, e-mail staat bij Stamgegevens > Vervoerders), antwoorden vastleggen, laagste prijs zien en met Kies de vervoerder op de pakbon zetten. Het tabblad Transport toont een vergelijking per vervoerder.
- Doelen: Onderhoud > Stamgegevens > Doelen per maand (omzet en marge in euro). Het dashboard toont de voortgang met een streep voor waar je nu zou moeten staan.
- Automatische taken (opvolging): één keer per dag bij openen en met de knop Taken bijwerken: offerte 5 dagen zonder reactie, betaling 7+ dagen te laat zonder herinnering, order 3+ dagen gepickt maar niet verzonden, klantbericht 1+ dag onbeantwoord. Elke taak heeft een marker `[auto:...]` zodat niets dubbel komt.
- Dubbele klanten: knop Dubbelen zoeken (Klanten) groepeert op btw-nummer, KvK, e-mailadres en naam met postcode. Samenvoegen verplaatst orders, offertes, facturen, berichten en meer naar de gekozen klant en vult lege gegevens aan. De andere klant blijft staan met `samengevoegd_met` en verdwijnt uit overzichten. Nieuwe orders voor die klant komen via een trigger bij de bewaarde klant.
- Back-up: Onderhoud > Gegevens maakt één JSON-bestand met alle tabellen (via downloads, jij bevestigt het opslaan). Het dashboard waarschuwt als de laatste back-up ouder is dan een week.
