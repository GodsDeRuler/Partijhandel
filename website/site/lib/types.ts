import type { Lang } from "./i18n";

export type Item = {
  nr: number; slug_nl: string; slug_en: string; slug_de: string;
  naam_nl: string; naam_en: string; naam_de: string;
  voorraad: number; omdoos?: number; pallet?: number;
  hoofd?: string; sub?: string; nieuw?: boolean; restant?: boolean; inlog?: boolean;
  eigen_foto?: boolean; foto_grijs?: boolean; ean?: string;
  prijs?: number; prijs_omdoos?: number;
};
export type ZoekResultaat = { totaal: number; items: Item[]; ingelogd: boolean; verborgen: number };
export type Categorie = { code: string; niveau: "hoofd" | "sub"; hoofd: string | null; nl: string; en: string; de: string; n: number };
export type AgendaItem = { id: number; datum: string; tot: string | null; plaats: string | null; titel_nl: string; titel_en: string | null; titel_de: string | null; tekst_nl: string | null; tekst_en: string | null; tekst_de: string | null; link: string | null };
export type Mij =
  | { status: "uitgelogd" }
  | { status: "onbekend"; email?: string }
  | { status: "aangevraagd" | "geblokkeerd"; email?: string }
  | { status: "goedgekeurd"; email: string; naam: string; contactpersoon: string | null; telefoon: string | null; taal: string | null; land: string | null; plaats: string | null; adres: string | null; postcode: string | null; btw_nr: string | null; interesses: string[]; branche: string | null; ongelezen: number; openstaand: number };
export type OfferteRij = { id: number; nummer: number | null; datum: string; status: string; soort: string; geldig_tot: string | null; akkoord: string | null; bod_bedrag: number | null; totaal: number; regels: number; order_nummer: number | null; ongelezen: number };
export type OfferteRegel = { artikel_nr: number | null; omschrijving: string; aantal: number; prijs: number; korting_pct: number; btw_pct: number | null; optioneel: boolean };
export type Offerte = Omit<OfferteRij, "totaal" | "regels" | "ongelezen"> & {
  referentie: string | null; levertijd: string | null; betaling: string | null; intro: string | null; voorwaarden: string | null; opmerking: string | null;
  levering: string | null; aflever_adres: string | null; aflever_land: string | null; afhaal_datum: string | null; akkoord_naam: string | null;
  kan_accepteren: boolean; regels: OfferteRegel[];
};
export type OrderRij = { nummer: number; datum: string; status: string; omschrijving: string | null; prijs: number | null; ongelezen: number };
export type Order = {
  nummer: number; datum: string; status: string; omschrijving: string | null; prijs: number | null; offerte_id: number | null;
  regels: { artikel_nr: number | null; omschrijving: string; aantal: number; prijs: number }[];
  zendingen: { soort: string | null; verzonden_op: string | null; vervoerder: string | null; track_trace: string | null; gepland_op: string | null; afhaaltijd: string | null; pallets: number | null; colli: number | null }[];
};
export type Openstaand = { nummer: string | number; datum: string; vervaldatum: string | null; rest: number; te_laat: boolean };
export type Bericht = { id: number; afzender: "klant" | "verkoop"; naam: string | null; tekst: string; aangemaakt: string };

export const itemNaam = (i: Item, lang: Lang) => (lang === "en" ? i.naam_en : lang === "de" ? i.naam_de : i.naam_nl) || i.naam_nl;
export const itemSlug = (i: Item, lang: Lang) => (lang === "en" ? i.slug_en : lang === "de" ? i.slug_de : i.slug_nl) || i.slug_nl;
export const catNaam = (c: Categorie, lang: Lang) => (lang === "en" ? c.en : lang === "de" ? c.de : c.nl) || c.nl;
