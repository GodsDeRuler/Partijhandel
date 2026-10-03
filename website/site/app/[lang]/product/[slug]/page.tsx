import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eur, getT, href, isLang, num, LANGS } from "@/lib/i18n";
import { artikel, categorieen, getMij, SITE_URL } from "@/lib/site";
import { catNaam, itemNaam, itemSlug } from "@/lib/types";
import { AddToLijst } from "@/components/AddToLijst";
import { ItemFoto } from "@/components/ItemFoto";
import { Prijs } from "@/components/Card";
import { ActionForm } from "@/components/ActionForm";
import { bodAction } from "@/app/actions";

type P = { params: Promise<{ lang: string; slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLang(lang)) return {};
  const r = await artikel(slug, lang);
  if (!r || r.status !== "ok") return { robots: { index: false } };
  const i = r.item, naam = itemNaam(i, lang), t = getT(lang);
  const langs = Object.fromEntries(LANGS.map(l => [l, href(l, `/product/${itemSlug(i, l)}/`)]));
  return {
    title: naam, description: `${naam}. ${t("minAf")}. ${t("voorraad")}: ${num(lang, i.voorraad)}.`,
    alternates: { canonical: href(lang, `/product/${slug}/`), languages: { ...langs, "x-default": langs.nl } },
    // Artikelen die alleen na inloggen zichtbaar zijn, horen niet in zoekmachines
    robots: i.inlog ? { index: false } : undefined,
    openGraph: { title: naam, images: [{ url: `/foto/${i.nr}/groot/` }] },
  };
}

export default async function Product({ params }: P) {
  const { lang, slug } = await params;
  if (!isLang(lang)) notFound();
  const t = getT(lang);
  const [r, mij, cats] = await Promise.all([artikel(slug, lang), getMij(), categorieen()]);
  if (!r) notFound();
  if (r.status !== "ok") {
    return (
      <section className="blk"><div className="wrap" style={{ maxWidth: 720 }}>
        <div className="box" style={{ display: "grid", gap: 12 }}>
          <h1 style={{ color: "var(--navy)", fontSize: 26 }}>{r.status === "login" ? t("artikelLogin") : t("artikelNiet")}</h1>
          {r.status === "login" && <div><Link className="btn bl" href={href(lang, "/inloggen/")}>{t("login")}</Link></div>}
          <p><Link href={href(lang, "/partijen/")}>{t("terug")}</Link></p>
        </div>
      </div></section>
    );
  }
  const i = r.item, naam = itemNaam(i, lang);
  const ingelogd = mij.status === "goedgekeurd";
  const cat = cats.find(c => c.code === (i.sub || i.hoofd));
  const pageUrl = `${SITE_URL}${href(lang, `/product/${slug}/`)}`;
  const wa = `https://wa.me/?text=${encodeURIComponent(`${naam} ${pageUrl}`)}`;
  const ld = i.inlog ? null : { "@context": "https://schema.org", "@type": "Product", name: naam, sku: String(i.nr), ...(i.ean ? { gtin: i.ean } : {}), image: `${SITE_URL}/foto/${i.nr}/groot/`, url: pageUrl, brand: { "@type": "Brand", name: "Frank van de Wijgert Partijhandel" } };
  return (
    <section className="blk"><div className="wrap">
      {ld && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />}
      <p style={{ margin: "0 0 14px" }}><Link href={href(lang, "/partijen/")}>← {t("terug")}</Link>{cat ? <> · <Link href={href(lang, `/partijen/?hoofd=${i.hoofd}${i.sub ? `&sub=${i.sub}` : ""}`)}>{catNaam(cat, lang)}</Link></> : null}</p>
      <div className="pd">
        <div className="ph">{i.nieuw ? <span className="pill nw">{t("nieuwB")}</span> : null}<ItemFoto item={i} lang={lang} maat="groot" eager /></div>
        <div style={{ display: "grid", gap: 16, minWidth: 0 }}>
          <h1>{naam}</h1>
          <Prijs item={i} lang={lang} ingelogd={ingelogd} />
          <div className="label">
            <div className="bar"><span>{t("artnr")} {i.nr}</span><span>{t("opVoorraad")}</span></div>
            <div className="row">
              <div><span className="k">{t("voorraad")}</span><span className="v">{num(lang, i.voorraad)} {t("st")}</span></div>
              <div><span className="k">{t("omdoos")}</span><span className="v">{i.omdoos ? `${i.omdoos} ${t("st")}` : "–"}</span></div>
              <div><span className="k">{t("pallet")}</span><span className="v">{i.pallet ? `${num(lang, i.pallet)} ${t("st")}` : "–"}</span></div>
              {i.ean ? <div><span className="k">{t("ean")}</span><span className="v">{i.ean}</span></div> : null}
            </div>
          </div>
          <div className="note">{t("minAf")}. {t("prijsExcl")}</div>
          {i.restant && <div className="note wn"><b>{t("restant")}.</b> {t("restantP")} <Link href={href(lang, `/contact/?onderwerp=${encodeURIComponent(`${i.nr} ${naam}`)}`)}>{t("contact")}</Link></div>}
          {ingelogd && !i.restant && <div><AddToLijst className="btn bl" item={{ nr: i.nr, naam, slug, lang, omdoos: i.omdoos ?? null, pallet: i.pallet ?? null }} label={`${t("opLijst")}`} doneLabel={t("toegevoegd")} /></div>}
          {!ingelogd && <div><Link className="btn bl" href={href(lang, "/inloggen/")}>{t("loginVoorPrijs")}</Link></div>}
          <div className="bid">
            <b style={{ color: "var(--navy)" }}>{t("bodT")}</b>
            {ingelogd ? (
              <>
                <span className="src">{t("bodToelichting")}</span>
                <ActionForm action={bodAction} lang={lang} submitLabel={t("bodB")} hideOnOk>
                  <input type="hidden" name="artikel_nr" value={i.nr} />
                  <div className="field"><label htmlFor="bod">{t("bodLabel")}</label><input id="bod" name="bedrag" inputMode="decimal" required placeholder="€" /></div>
                  <div className="field"><label htmlFor="bodo">{t("bodAanvullend")}</label><textarea id="bodo" name="opmerking" rows={2} /></div>
                </ActionForm>
              </>
            ) : <span className="src">{t("bodLogin")}</span>}
          </div>
          <div><a className="btn ghost sm" href={wa} target="_blank" rel="noopener">{t("deelWa")}</a></div>
        </div>
      </div>
    </div></section>
  );
}
