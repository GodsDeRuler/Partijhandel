import type { T } from "./i18n";
import type { Offerte, OfferteRij } from "./types";

/** Tekst en kleur van de status van een offerte voor de klant. */
export function offerteStatus(t: T, o: Pick<OfferteRij, "status" | "akkoord" | "order_nummer"> & { kan_accepteren?: boolean }): { tekst: string; kleur: "a" | "g" | "o" | "" } {
  if (o.order_nummer || o.status === "besteld") return { tekst: t("stOG"), kleur: "g" };
  if (o.akkoord) return { tekst: t("stAkkoord"), kleur: "g" };
  switch (o.status) {
    case "aanvraag": return { tekst: t("stA"), kleur: "a" };
    case "gereserveerd": return { tekst: t("stGereserveerd"), kleur: "a" };
    case "offerte": return o.kan_accepteren === false ? { tekst: t("stOfferte"), kleur: "a" } : { tekst: t("stV"), kleur: "o" };
    case "afgewezen": return { tekst: t("stAf"), kleur: "" };
    case "verlopen": return { tekst: t("stVerlopen"), kleur: "" };
    default: return { tekst: o.status, kleur: "" };
  }
}
export const offerteOpen = (o: Pick<OfferteRij, "status" | "akkoord" | "order_nummer">) => !o.order_nummer && !o.akkoord && ["aanvraag", "gereserveerd", "offerte"].includes(o.status);

const ORDER: Record<string, [string, "a" | "g" | "o" | "", string | null, boolean]> = {
  "In bewerking": ["stIB", "o", "uIB", true], Gereed: ["stG", "o", "uG", true], Geleverd: ["stGL", "g", null, false],
  "Te factureren": ["stTF", "a", "uTF", false], Afgesloten: ["stAS", "", null, false], Geannuleerd: ["stGeannuleerd", "", null, false],
};
export function orderStatus(t: T, status: string) {
  const m = ORDER[status];
  return { tekst: m ? t(m[0]) : status, kleur: m ? m[1] : ("" as const), uitleg: m && m[2] ? t(m[2]) : "", open: m ? m[3] : false };
}
export type { Offerte };
