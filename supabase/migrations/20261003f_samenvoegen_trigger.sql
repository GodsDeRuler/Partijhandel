-- Nieuwe orders, offertes en facturen voor een samengevoegde klant komen automatisch bij de klant die bleef
create or replace function volg_samenvoeging() returns trigger language plpgsql as $$
begin
  if new.klant_id is not null then
    new.klant_id := coalesce((select k.samengevoegd_met from klanten k where k.id = new.klant_id), new.klant_id);
  end if;
  return new;
end $$;
drop trigger if exists orders_volg_samenvoeging on orders;
create trigger orders_volg_samenvoeging before insert on orders for each row execute function volg_samenvoeging();
drop trigger if exists offertes_volg_samenvoeging on offertes;
create trigger offertes_volg_samenvoeging before insert on offertes for each row execute function volg_samenvoeging();
drop trigger if exists facturen_volg_samenvoeging on facturen;
create trigger facturen_volg_samenvoeging before insert on facturen for each row execute function volg_samenvoeging();
