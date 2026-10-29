import dict from "@/content/dict.json";
import { extra } from "./extra";

export const LANGS = ["nl", "en", "de"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "nl";
export const isLang = (v: string | undefined | null): v is Lang => !!v && (LANGS as readonly string[]).includes(v);

type Dict = Record<string, string>;
const base = dict as unknown as Record<Lang, Dict>;
const ext = extra as unknown as Record<Lang, Dict>;

/** Vertaalfunctie voor één taal. Ontbreekt een sleutel, dan valt hij terug op Nederlands en daarna op de sleutel zelf. */
export function getT(lang: Lang) {
  return (key: string, vars?: Record<string, string | number>) => {
    let s = ext[lang]?.[key] ?? base[lang]?.[key] ?? ext.nl[key] ?? base.nl[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
    return s;
  };
}
export type T = ReturnType<typeof getT>;

/** Adres met taalvoorvoegsel: Nederlands staat op de hoofdmap, Engels onder /en/, Duits onder /de/. */
export function href(lang: Lang, path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  const withSlash = p.endsWith("/") || p.includes("?") || p.includes("#") ? p : `${p}/`;
  return lang === DEFAULT_LANG ? withSlash : `/${lang}${withSlash === "/" ? "/" : withSlash}`;
}

export const LOCALE: Record<Lang, string> = { nl: "nl-NL", en: "en-GB", de: "de-DE" };
export const eur = (lang: Lang, v: number | string | null | undefined, digits = 2) =>
  v == null || v === "" ? "" : new Intl.NumberFormat(LOCALE[lang], { style: "currency", currency: "EUR", minimumFractionDigits: digits, maximumFractionDigits: Math.max(digits, 2) }).format(Number(v));
export const num = (lang: Lang, v: number | string | null | undefined) => new Intl.NumberFormat(LOCALE[lang]).format(Number(v ?? 0));
export const dateFmt = (lang: Lang, v: string | null | undefined) => {
  if (!v) return "";
  const d = new Date(String(v).length <= 10 ? `${v}T12:00:00` : String(v));
  return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString(LOCALE[lang], { day: "numeric", month: "short", year: "numeric" });
};
export const dateTimeFmt = (lang: Lang, v: string | null | undefined) => {
  if (!v) return "";
  const d = new Date(v);
  return isNaN(d.getTime()) ? String(v) : d.toLocaleString(LOCALE[lang], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
};
