// De offertelijst leeft in de browser van de bezoeker (localStorage) tot hij de aanvraag verstuurt.
// Er staat geen prijs in: de prijs rekent de database uit op het moment van aanvragen.
export type LijstRegel = { nr: number; omdozen: number; naam: string; slug: string; lang: string; omdoos: number | null; pallet: number | null };
export const LIJST_EVENT = "fvdw-lijst";
const KEY = "fvdw-offertelijst";

export function lijstLezen(): LijstRegel[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v.filter(r => r && Number.isInteger(r.nr) && Number.isInteger(r.omdozen) && r.omdozen > 0) : [];
  } catch { return []; }
}
export function lijstSchrijven(l: LijstRegel[]) {
  try { localStorage.setItem(KEY, JSON.stringify(l)); } catch { /* opslag geblokkeerd: lijst blijft dan leeg */ }
  window.dispatchEvent(new Event(LIJST_EVENT));
}
export function lijstToevoegen(r: Omit<LijstRegel, "omdozen">, omdozen = 1) {
  const l = lijstLezen();
  const i = l.findIndex(x => x.nr === r.nr);
  if (i >= 0) l[i] = { ...l[i], ...r, omdozen: l[i].omdozen + omdozen };
  else l.push({ ...r, omdozen });
  lijstSchrijven(l);
}
