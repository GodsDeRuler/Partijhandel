-- Testrijen die tijdens het bouwen zijn aangemaakt (id/nummer vanaf 999991). Eenmalig draaien in de Supabase SQL-editor.
delete from opvolging where klant_id in (999991, 999992);
delete from orders where nummer in (999991, 999992);
delete from artikelen where artikel_nr = 999991;
delete from klant_profielen where email = 'test@x.nl';
delete from klanten where id in (999991, 999992);
