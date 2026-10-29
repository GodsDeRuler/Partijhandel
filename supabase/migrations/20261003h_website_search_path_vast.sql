-- Beveiligingsadvies Supabase: vaste search_path voor de hulpfuncties van de website.
alter function public.site_pallet(text) set search_path = public, extensions, pg_temp;
alter function public.site_omdoos(text) set search_path = public, extensions, pg_temp;
alter function public.site_slugify(text) set search_path = public, extensions, pg_temp;
alter function public.site_data_laden(jsonb) set search_path = public, extensions, pg_temp;
