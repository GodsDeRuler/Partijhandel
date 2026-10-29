import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getT, href, isLang, num } from "@/lib/i18n";
import { agenda, categorieen, getMij, zoek } from "@/lib/site";
import { catNaam } from "@/lib/types";
import { Card } from "@/components/Card";
import { alternates } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const t = getT(lang);
  return { title: { absolute: `Frank van de Wijgert Partijhandel | ${t("heroT")}` }, description: t("metaHome"), alternates: alternates(lang, "/") };
}

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getT(lang);
  const [mij, nieuw, cats, ag] = await Promise.all([getMij(), zoek({ limit: 10, sort: "nieuw" }), categorieen(), agenda()]);
  const ingelogd = mij.status === "goedgekeurd";
  const hoofd = cats.filter(c => c.niveau === "hoofd" && c.n > 0);
  return (
    <>
      <section className="hero">
        <img src="/img/vrachtwagen.jpg" alt="" />
        <div className="wrap">
          <h1>{t("heroT")}</h1><p>{t("heroP")}</p>
          <div className="ctas">
            <Link className="btn cy" href={href(lang, "/partijen/")}>{t("bekijk")}</Link>
            {mij.status === "uitgelogd" && <><Link className="btn" href={href(lang, "/klant-worden/")}>{t("klant")}</Link><Link className="btn ghost" href={href(lang, "/inloggen/")}>{t("login")}</Link></>}
          </div>
        </div>
      </section>
      <div className="facts"><div className="wrap">
        <div><b className="num">{num(lang, nieuw.totaal)}</b><span>{t("f1")}</span></div>
        <div><b>{t("f2v")}</b><span>{t("f2")}</span></div>
        <div><b>{t("f3v")}</b><span>{t("f3")}</span></div>
        <div><b>NL · EN · DE</b><span>{t("f4")}</span></div>
      </div></div>
      <section className="blk"><div className="wrap">
        <div className="sh"><div><h2>{t("nieuw")}</h2><p>{t("nieuwP")}</p></div><Link className="btn bl sm" href={href(lang, "/partijen/")}>{t("alles")} →</Link></div>
        <div className="grid">{nieuw.items.map(i => <Card key={i.nr} item={i} lang={lang} ingelogd={ingelogd} />)}</div>
      </div></section>
      <section className="blk" style={{ paddingTop: 0 }}><div className="wrap">
        <div className="sh"><h2>{t("hoeT")}</h2></div>
        <div className="steps">
          <div className="step"><b>{t("h1")}</b><p>{t("h1p")}</p></div>
          <div className="step"><b>{t("h2")}</b><p>{t("h2p")}</p></div>
          <div className="step"><b>{t("h3")}</b><p>{t("h3p")}</p></div>
        </div>
      </div></section>
      <section className="blk" style={{ paddingTop: 0 }}><div className="wrap">
        <div className="sh"><h2>{t("cats")}</h2></div>
        <div className="cats">{hoofd.map(c => (
          <Link key={c.code} className="cat" href={href(lang, `/partijen/?hoofd=${c.code}`)}><b>{catNaam(c, lang)}</b><span className="num">{c.n}</span></Link>
        ))}</div>
      </div></section>
      <section className="blk" style={{ paddingTop: 0 }}><div className="wrap split">
        <div className="panel c"><h3>{t("aanbiedenT")}</h3><p>{t("aanbiedenP")}</p><Link className="btn" href={href(lang, "/partij-aanbieden/")}>{t("aanbiedenB")}</Link></div>
        <div className="panel i"><h3>{t("agendaT")}</h3><p>{t("agendaP")}</p>
          {ag.slice(0, 3).map(a => (
            <div className="agenda-row" key={a.id}><span className="d">{new Date(a.datum + "T12:00:00").toLocaleDateString(lang === "nl" ? "nl-NL" : lang === "de" ? "de-DE" : "en-GB", { day: "numeric", month: "short" })}</span>
              <span><b>{(lang === "en" ? a.titel_en : lang === "de" ? a.titel_de : a.titel_nl) || a.titel_nl}</b>{a.plaats ? <><br />{a.plaats}</> : null}</span></div>
          ))}
          <Link className="btn bl sm" href={href(lang, "/agenda/")}>{t("agenda")} →</Link></div>
      </div></section>
    </>
  );
}
