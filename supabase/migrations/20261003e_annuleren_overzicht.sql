-- Geannuleerde orders tellen niet mee in het klantoverzicht (aantal orders, laatste order, segment)
create or replace view klant_overzicht as
 WITH o AS (
         SELECT orders.klant_id, count(*) AS orders, sum(orders.prijs) AS omzet,
            sum(orders.prijs) FILTER (WHERE orders.datum > (CURRENT_DATE - 365)) AS omzet_12m,
            max(orders.datum) AS laatste_order, min(orders.datum) AS eerste_order
           FROM orders WHERE orders.status IS DISTINCT FROM 'Geannuleerd' GROUP BY orders.klant_id
        ), l AS (
         SELECT x.klant_id, string_agg(x.omschrijving, ' | '::text ORDER BY x.datum DESC) AS laatst_gekocht
           FROM ( SELECT orders.klant_id, orders.omschrijving, orders.datum,
                    row_number() OVER (PARTITION BY orders.klant_id ORDER BY orders.datum DESC) AS rn
                   FROM orders WHERE orders.status IS DISTINCT FROM 'Geannuleerd') x
          WHERE x.rn <= 3 GROUP BY x.klant_id
        )
 SELECT k.id, k.relatie_nr, k.naam, k.email, k.telefoon, k.taal, k.land, k.plaats, k.relatiebeheer, k.let_op, k.bron, k.interesses, k.afgemeld, k.notities, k.aangemaakt,
    COALESCE(o.orders, 0::bigint) AS orders, COALESCE(o.omzet, 0::numeric) AS omzet, COALESCE(o.omzet_12m, 0::numeric) AS omzet_12m, o.eerste_order, o.laatste_order, l.laatst_gekocht,
        CASE WHEN o.laatste_order IS NULL THEN 'nooit besteld'::text WHEN o.laatste_order > (CURRENT_DATE - 365) THEN 'actief'::text ELSE 'slapend'::text END AS segment,
        CASE WHEN o.laatste_order <= (CURRENT_DATE - 365) THEN
            CASE WHEN o.orders >= 6 THEN 'A'::text WHEN o.orders >= 3 THEN 'B'::text ELSE 'C'::text END
            ELSE NULL::text END AS prioriteit
   FROM klanten k
     LEFT JOIN o ON o.klant_id = k.id
     LEFT JOIN l ON l.klant_id = k.id
  WHERE k.samengevoegd_met IS NULL;
