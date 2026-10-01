# Salesbureau

Eén HTML-pagina die als privé-artifact in claude.ai draait en via je eigen Supabase-koppeling
met het project "Partijhandel" (`suwsagwkzflsahaptasy`) praat. Geen sleutels in de code, RLS blijft aan.

Schermen: Vandaag, Klanten (met klantkaart, mailconcept, opvolging), Voorraad naar kopers, Opvolging, Gegevens (CSV's laden).

Gegevens laden: tabblad Gegevens leest `sales/supabase-import/*.csv` uit de projectbestanden en schrijft ze in batches
(upsert, dus herhaalbaar; notities, afmeldingen en opvolgingen blijven staan).

Mails worden nooit verstuurd door de pagina: Claude maakt een concept, Michel verstuurt zelf.
Database-uitbreiding: `supabase/migrations/20261001_opvolging_en_zoeken.sql`.
