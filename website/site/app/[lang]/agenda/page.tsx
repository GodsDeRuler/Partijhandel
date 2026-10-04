import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { dateFmt, getT, isLang } from "@/lib/i18n";
import { agenda } from "@/lib/site";
import { alternates } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return { title: getT(lang)("agenda"), alternates: alternates(lang, "/agenda/") };
}

export default async function Agenda({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getT(lang);
  const items = await agenda();
  return (
    <section className="blk"><div className="wrap" style={{ maxWidth: 900 }}>
      <div className="sh"><div><h1 style={{ fontSize: 26, fontWeight: 800, textTransform: "uppercase", color: "var(--navy)" }}>{t("agenda")}</h1><p>{t("agendaP")}</p></div></div>
      <div className="box">
        {items.length ? items.map(a => {
          const titel = (lang === "en" ? a.titel_en : lang === "de" ? a.titel_de : a.titel_nl) || a.titel_nl;
          const tekst = (lang === "en" ? a.tekst_en : lang === "de" ? a.tekst_de : a.tekst_nl) || a.tekst_nl;
          return (
            <div className="agenda-row" key={a.id} style={{ alignItems: "flex-start" }}>
              <span className="d">{dateFmt(lang, a.datum)}{a.tot ? <small style={{ display: "block", fontSize: 13, fontWeight: 500 }}>{t("agendaTot")} {dateFmt(lang, a.tot)}</small> : null}</span>
              <span style={{ minWidth: 0 }}><b>{titel}</b>{a.plaats ? ` · ${a.plaats}` : ""}{tekst ? <><br />{tekst}</> : null}
                {a.link && /^https?:\/\//.test(a.link) ? <><br /><a className="rowlink" href={a.link} target="_blank" rel="noopener noreferrer">{a.link.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}</a></> : null}</span>
            </div>
          );
        }) : <p>{t("agendaLeeg")}</p>}
      </div>
    </div></section>
  );
}
