# Salesbureau

Eén HTML-pagina die als privé-artifact in claude.ai draait en via je eigen Supabase-koppeling
met het project "Partijhandel" (`suwsagwkzflsahaptasy`) praat. Geen sleutels in de code, RLS blijft aan.
Doel: vervanging van mybusiness, inclusief de sales.

Onderdelen
- Dashboard: omzet, marge, klanten, voorraadwaarde, offertes, mails, omzet per maand, top klanten en landen.
- Vandaag: opvolgingen, aanvragen en offertes zonder antwoord, slapende klanten, kopers van vorig jaar.
- Klanten: zoeken, toevoegen (klant of prospect), wijzigen, klantkaart met profiel, orders, offertes, notities en mailconcept.
- Assortiment: artikelen met foto, voorraad en marge, nieuw artikel en wijzigen, mandje voor aanbodmail of offerte, kopers per artikel.
- Offertes: aanvraag, reservering en offerte met regels; omzetten naar order (regels, orderregels, voorraad afboeken).
- Orders: overzicht, status wijzigen, inhoud.
- Campagnes: artikelen, ontvangers, geopend en reactie vastleggen. Verstuurt nooit zelf iets.
- Opvolging en Gegevens (CSV's uit de projectbestanden laden).

Regels
- De pagina verstuurt geen mail. Claude schrijft een concept, Michel verstuurt zelf.
- De pagina verwijdert niets (soft delete via `offerte_regels.vervallen`).
- Foto's komen uit `sales/aanbodpagina/fotos/<artikelnr>.jpg` in de projectbestanden.

Database: `supabase/migrations/`.
