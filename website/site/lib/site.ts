import { cache } from "react";
import { cookies } from "next/headers";
import { rpc } from "./supabase";
import type { AgendaItem, Categorie, Mij, ZoekResultaat, Item } from "./types";

export const SITE_URL = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export const getMij = cache(async (): Promise<Mij> => {
  const store = await cookies();
  if (!store.getAll().some(c => c.name.startsWith("sb-"))) return { status: "uitgelogd" };
  const { data } = await rpc<Mij>("site_mij");
  return data ?? { status: "uitgelogd" };
});
export const heeftToegang = (m: Mij): m is Extract<Mij, { status: "goedgekeurd" }> => m.status === "goedgekeurd";

export type ZoekParams = { q?: string; hoofd?: string; sub?: string; nieuw?: boolean; sort?: string; limit?: number; offset?: number };
export async function zoek(p: ZoekParams = {}): Promise<ZoekResultaat> {
  const { data } = await rpc<ZoekResultaat>("site_zoek", {
    p_q: p.q || null, p_hoofd: p.hoofd || null, p_sub: p.sub || null, p_nieuw: !!p.nieuw, p_sort: p.sort || "nieuw", p_limit: p.limit ?? 24, p_offset: p.offset ?? 0,
  });
  return data ?? { totaal: 0, items: [], ingelogd: false, verborgen: 0 };
}
export const categorieen = cache(async (): Promise<Categorie[]> => (await rpc<Categorie[]>("site_categorieen")).data ?? []);
export const agenda = cache(async (): Promise<AgendaItem[]> => (await rpc<AgendaItem[]>("site_agenda")).data ?? []);

export type ArtikelUitkomst = { status: "ok"; item: Item; ingelogd: boolean } | { status: "login" } | { status: "niet_leverbaar" } | null;
export async function artikel(slug: string, lang: string): Promise<ArtikelUitkomst> {
  const { data } = await rpc<ArtikelUitkomst>("site_artikel", { p_slug: slug, p_taal: lang });
  return data;
}
