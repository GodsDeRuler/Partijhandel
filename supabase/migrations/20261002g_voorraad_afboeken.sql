-- Handmatig af- en bijboeken van voorraad met reden; elke boeking komt in het voorraadjournaal.
alter table voorraad_mutaties drop constraint if exists voorraad_mutaties_soort_check;
alter table voorraad_mutaties add constraint voorraad_mutaties_soort_check check (soort = any (array['inkoop','verkoop','correctie','inventarisatie','retour','afboeking','bijboeking']));
alter table voorraad_mutaties add column if not exists reden text;
create index if not exists voorraad_mutaties_artikel_idx on voorraad_mutaties (artikel_nr, datum desc);
