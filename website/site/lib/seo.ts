import type { Metadata } from "next";
import { LANGS, href, type Lang } from "./i18n";

/** Canonieke adressen en taalverwijzingen (hreflang) voor een pagina die in alle talen hetzelfde pad heeft. */
export function alternates(lang: Lang, path: string): Metadata["alternates"] {
  return {
    canonical: href(lang, path),
    languages: { ...Object.fromEntries(LANGS.map(l => [l, href(l, path)])), "x-default": href("nl", path) },
  };
}
