import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eur, getT, href, isLang, num, type Lang } from "@/lib/i18n";
import { categorieen, getMij, zoek } from "@/lib/site";
import { catNaam, itemNaam, itemSlug } from "@/lib/types";
import { Card } from "@/components/Card";
import { AddToLijst } from "@/components/AddToLijst";
import { ItemFoto } from "@/components/ItemFoto";
import { alternates } from "@/lib/seo";

type SP = { q?: string; hoofd?: string; sub?: string; sort?: string; weergave?: string; p?: string };
const CODE = /^[A-Za-z0-9_.-]{1,40}$/;

export async function generateMetadata({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<SP> }): Promise<Metadata> {
  const { lang } = await params, sp = await searchParams;
  if (!isLang(lang)) return {};
  const t = getT(lang);
  const cats = sp.hoofd && CODE.test(sp.hoofd) ? await categorieen() : [];
  const c = cats.find(x => x.code === (sp.sub || sp.hoofd));
  return {
    title: c ? catNaam(c, lang) : t("partijen"), description: t("metaPartijen"),
    alternates: alternates(lang, "/partijen/"), robots: sp.q || sp.p || sp.sort ? { index: false, follow: true } : undefined,
  };
}

export default async function Partijen({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<SP> }) {
  const { lang } = await params, sp = await searchParams;
  if (!isLang(lang)) notFound();
  const t = getT(lang);
  const q = (sp.q || "").slice(0, 100).trim();
  const hoofd = sp.hoofd && CODE.test(sp.hoofd) ? sp.hoofd : "";
  const sub = sp.sub && CODE.test(sp.sub) ? sp.sub : "";
  const sort = ["nieuw", "voorraad", "naam"].includes(sp.sort || "") ? (sp.sort as string) : "nieuw";
  const lijst = sp.weergave === "lijst";
  const limit = lijst ? 50 : 24;
  const pagina = Math.max(1, Math.min(500, parseInt(sp.p || "1", 10) || 1));
  const [mij, res, cats] = await Promise.all([getMij(), zoek({ q, hoofd, sub, sort, limit, offset: (pagina - 1) * limit }), categorieen()]);
  const ingelogd = mij.status === "goedgekeurd";
  const hoofdCats = cats.filter(c => c.niveau === "hoofd" && c.n > 0);
  const totaal = hoofdCats.reduce((s, c) => s + c.n, 0);
  const actief = cats.find(c => c.code === (sub || hoofd));
  const url = (o: Partial<SP>) => {
    const m = { q, hoofd, sub, sort: sort === "nieuw" ? "" : sort, weergave: lijst ? "lijst" : "", p: "", ...o };
    const s = new URLSearchParams(Object.entries(m).filter(([, v]) => v) as [string, string][]).toString();
    return href(lang, "/partijen/") + (s ? `?${s}` : "");
  };
  const paginas = Math.max(1, Math.ceil(res.totaal / limit));
  return (
    <section className="blk"><div className="wrap">
      <div className="sh"><div><h1 style={{ fontSize: 26, fontWeight: 800, textTransform: "uppercase", color: "var(--navy)" }}>{actief ? catNaam(actief, lang) : t("partijen")}</h1>
        <p className="num">{num(lang, res.totaal)} {t("resultaten")}{q ? ` · “${q}”` : ""}</p></div></div>
      <div className="cat-layout">
        <nav className="side" aria-label={t("cats")}>
          <Link className={!hoofd ? "on" : ""} href={url({ hoofd: "", sub: "" })}>{t("alleCat")} <span className="n">{totaal}</span></Link>
          {hoofdCats.map(c => (
            <div key={c.code}>
              <Link className={hoofd === c.code && !sub ? "on" : ""} href={url({ hoofd: c.code, sub: "" })}>{catNaam(c, lang)} <span className="n">{c.n}</span></Link>
              {hoofd === c.code && cats.filter(s => s.niveau === "sub" && s.hoofd === c.code && s.n > 0).map(s => (
                <Link key={s.code} className={`sub ${sub === s.code ? "on" : ""}`} href={url({ hoofd: c.code, sub: s.code })}>{catNaam(s, lang)} <span className="n">{s.n}</span></Link>
              ))}
            </div>
          ))}
        </nav>
        <div style={{ minWidth: 0 }}>
          <div className="toolbar">
            <div className="note">{t("minAf")}</div><span style={{ flex: 1 }} />
            <div className="view" role="group">
              <Link className={!lijst ? "on" : ""} href={url({ weergave: "" })}>{t("kaart")}</Link>
              <Link className={lijst ? "on" : ""} href={url({ weergave: "lijst" })}>{t("lijst")}</Link>
            </div>
            <form action={href(lang, "/partijen/")} method="get">
              {q && <input type="hidden" name="q" value={q} />}{hoofd && <input type="hidden" name="hoofd" value={hoofd} />}{sub && <input type="hidden" name="sub" value={sub} />}{lijst && <input type="hidden" name="weergave" value="lijst" />}
              <label className="lbl" htmlFor="sortsel">{t("sort")}</label>
              <select id="sortsel" name="sort" defaultValue={sort}><option value="nieuw">{t("sNieuw")}</option><option value="voorraad">{t("sVoorraad")}</option><option value="naam">{t("sNaam")}</option></select>
              <button className="btn ghost sm" type="submit">OK</button>
            </form>
          </div>
          {res.verborgen > 0 && <div className="note wn" style={{ marginBottom: 14 }}>{res.verborgen} {t("verborgen")}</div>}
          {!res.items.length ? (
            <div className="note" style={{ marginBottom: 14 }}>
              <p style={{ margin: "0 0 8px" }}>{q ? t("geenZoek") : t("geenResultaat")}</p>
              {q && <Link className="btn cy sm" href={href(lang, `/contact/?onderwerp=${encodeURIComponent(q)}`)}>{t("zoekVraagB")}</Link>}
            </div>
          ) : lijst ? <Tabel items={res.items} lang={lang} ingelogd={ingelogd} /> : <div className="grid">{res.items.map(i => <Card key={i.nr} item={i} lang={lang} ingelogd={ingelogd} />)}</div>}
          {paginas > 1 && (
            <nav className="pg" aria-label={t("pagina")}>
              {pagina > 1 && <Link className="btn ghost sm" href={url({ p: String(pagina - 1) })} rel="prev">← {t("vorige")}</Link>}
              <span>{t("pagina")} {pagina} {t("van")} {paginas}</span>
              {pagina < paginas && <Link className="btn ghost sm" href={url({ p: String(pagina + 1) })} rel="next">{t("volgende")} →</Link>}
            </nav>
          )}
          {actief && hoofd && (
            <div className="alertcat"><p>{t("alertCat")} <b>{catNaam(actief, lang)}</b></p><Link className="btn cy sm" href={href(lang, `/handel-alert/?cat=${hoofd}`)}>{t("alertCatB")}</Link></div>
          )}
        </div>
      </div>
    </div></section>
  );
}

function Tabel({ items, lang, ingelogd }: { items: Awaited<ReturnType<typeof zoek>>["items"]; lang: Lang; ingelogd: boolean }) {
  const t = getT(lang);
  return (
    <div className="box tw">
      <table className="t list">
        <thead><tr><th></th><th>{t("naam")}</th><th>{t("artnr")}</th><th>{t("voorraad")}</th><th>{t("omdoos")}</th><th>{t("pallet")}</th><th>{t("prijsSt")}</th><th></th></tr></thead>
        <tbody>{items.map(i => {
          const naam = itemNaam(i, lang), slug = itemSlug(i, lang);
          return (
            <tr key={i.nr}>
              <td style={{ width: 54 }}><div className="thumb"><ItemFoto item={i} lang={lang} /></div></td>
              <td className="nm"><Link href={href(lang, `/product/${slug}/`)}>{naam}</Link>{i.restant ? <> <span className="st o">{t("restant")}</span></> : null}</td>
              <td>{i.nr}</td><td>{num(lang, i.voorraad)}</td><td>{i.omdoos ?? "–"}</td><td>{i.pallet ?? "–"}</td>
              <td>{i.prijs != null ? <>{eur(lang, i.prijs)}{i.prijs_omdoos != null && <><br /><small>{eur(lang, i.prijs_omdoos)} {t("perOm")}</small></>}</> : <Link href={href(lang, "/inloggen/")}>🔒</Link>}</td>
              <td>{ingelogd && !i.restant && <AddToLijst item={{ nr: i.nr, naam, slug, lang, omdoos: i.omdoos ?? null, pallet: i.pallet ?? null }} label={t("plus1")} doneLabel={t("toegevoegd")} />}</td>
            </tr>
          );
        })}</tbody>
      </table>
    </div>
  );
}
