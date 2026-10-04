import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getT, href, isLang } from "@/lib/i18n";
import { getMij } from "@/lib/site";
import { OfferteLijst } from "@/components/OfferteLijst";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return { title: isLang(lang) ? getT(lang)("offerteLijstTitel") : "Offertelijst", robots: { index: false } };
}

export default async function Offertelijst({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getT(lang);
  const mij = await getMij();
  const ingelogd = mij.status === "goedgekeurd";
  const keys = ["offerteLeegP", "naarPartijen", "naam", "aantalOmdozen", "stuksTotaal", "artnr", "omdoos", "st", "verwijder", "totArt", "totOm", "totSt", "palN", "inloggenVoorOfferte", "login", "afhalenKiezen", "lev", "levA", "levT", "levTP", "afhaalDatum", "adres", "landL", "klep", "opmerkingL", "verstuur", "mijn"];
  return (
    <section className="blk"><div className="wrap" style={{ maxWidth: 960 }}>
      <div className="sh"><div><h1 style={{ fontSize: 26, fontWeight: 800, textTransform: "uppercase", color: "var(--navy)" }}>{t("offerteLijstTitel")}</h1><p>{t("minAf")}. {t("prijsExcl")}</p></div></div>
      <OfferteLijst lang={lang} ingelogd={ingelogd} land={ingelogd ? mij.land ?? "" : ""} adres={ingelogd ? [mij.adres, [mij.postcode, mij.plaats].filter(Boolean).join(" ")].filter(Boolean).join("\n") : ""}
        l={Object.fromEntries(keys.map(k => [k, t(k)]))}
        hrefs={{ partijen: href(lang, "/partijen/"), inloggen: href(lang, "/inloggen/"), mijn: href(lang, "/mijn/") }} />
    </div></section>
  );
}
