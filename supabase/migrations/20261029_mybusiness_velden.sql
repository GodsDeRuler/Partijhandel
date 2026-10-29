-- Velden uit MyBusiness die in het Salesbureau nog ontbraken (screenshots 2026-10-29).
-- Verkoper en kanaal per order, relatietype en btw-code per relatie, aanvullende relatievelden.
alter table orders add column if not exists verkoper text;
alter table orders add column if not exists kanaal text;
alter table klanten add column if not exists relatietype text;
alter table klanten add column if not exists btw_code text;
alter table klanten add column if not exists iban text;
alter table klanten add column if not exists prijslijst text;
alter table klanten add column if not exists bedrijfsgroep text;
create index if not exists orders_verkoper_idx on orders (verkoper);
create index if not exists klanten_relatietype_idx on klanten (relatietype);
