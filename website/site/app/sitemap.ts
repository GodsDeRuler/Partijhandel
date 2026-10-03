import type { MetadataRoute } from "next";
import { LANGS, href } from "@/lib/i18n";
import { SITE_URL, zoek } from "@/lib/site";

export const dynamic = "force-dynamic";
const PAGES = ["/", "/partijen/", "/agenda/", "/over-ons/", "/contact/", "/klant-worden/", "/partij-aanbieden/", "/handel-alert/", "/privacy/", "/voorwaarden/"];

/** Alle openbare pagina's in drie talen, met taalverwijzingen. Artikelen die alleen na inloggen zichtbaar zijn, staan er niet in (site_zoek geeft ze anoniem niet terug). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const out: MetadataRoute.Sitemap = [];
  for (const p of PAGES) {
    const languages = Object.fromEntries(LANGS.map(l => [l, `${SITE_URL}${href(l, p)}`]));
    for (const l of LANGS) out.push({ url: `${SITE_URL}${href(l, p)}`, alternates: { languages } });
  }
  const items = [];
  for (let offset = 0; offset < 5000; offset += 200) {
    const r = await zoek({ limit: 200, offset, sort: "naam" });
    items.push(...r.items);
    if (r.items.length < 200) break;
  }
  for (const i of items) {
    if (i.inlog) continue;
    const slugs = { nl: i.slug_nl, en: i.slug_en, de: i.slug_de };
    const languages = Object.fromEntries(LANGS.map(l => [l, `${SITE_URL}${href(l, `/product/${slugs[l] || slugs.nl}/`)}`]));
    for (const l of LANGS) out.push({ url: languages[l], alternates: { languages } });
  }
  return out;
}
