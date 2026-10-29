-- Contactpersonen per klant: verwijderen gaat via 'vervallen' (geen DELETE vanuit het Salesbureau).
alter table personen add column if not exists vervallen boolean not null default false;
create index if not exists personen_klant_idx on personen (klant_id);
