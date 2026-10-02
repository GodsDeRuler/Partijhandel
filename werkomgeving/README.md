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
- Prijzen: prijsafspraken per klant (met looptijd), staffelprijzen per artikel en een prijslijst per klant; de prijs volgt afspraak, dan staffel, dan verkoopprijs. Voorraad: analyse, mutatiejournaal, inventarisatie en inkoopplanning (minimale voorraad, 'Inkooporder maken'). Artikelformulier met leverancier, merk, verpakking, locatie, btw-groep en HS-code; de Gegevens-tab laadt `5_artikel_extra.csv` (leverancier en verpakking per artikel).
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
