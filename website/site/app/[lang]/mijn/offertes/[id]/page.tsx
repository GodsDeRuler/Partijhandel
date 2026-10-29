import Link from "next/link";
import { notFound } from "next/navigation";
import { dateFmt, eur, getT, href, isLang } from "@/lib/i18n";
import { rpc } from "@/lib/supabase";
import { offerteStatus } from "@/lib/status";
import type { Bericht, Offerte } from "@/lib/types";
import { Chat } from "@/components/Chat";
import { ActionForm } from "@/components/ActionForm";
import { accepterenAction } from "@/app/actions";

export default async function OfferteDetail({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = await params;
  if (!isLang(lang) || !/^\d{1,12}$/.test(id)) notFound();
  const t = getT(lang);
  const { data: o } = await rpc<Offerte>("site_offerte", { p_id: Number(id) });
  if (!o) notFound();
  const { data: berichten } = await rpc<Bericht[]>("site_berichten", { p_offerte: o.id });
  const s = offerteStatus(t, o);
  const regelTotaal = (r: Offerte["regels"][number]) => Number(r.aantal) * Number(r.prijs) * (1 - Number(r.korting_pct || 0) / 100);
  const act = o.regels.filter(r => !r.optioneel), opt = o.regels.filter(r => r.optioneel);
  const totaal = act.reduce((x, r) => x + regelTotaal(r), 0);
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <p style={{ margin: 0 }}><Link href={href(lang, "/mijn/offertes/")}>← {t("mijnOffertes")}</Link></p>
      <div className="box" style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div><h2 style={{ margin: 0, color: "var(--navy)", fontSize: 22 }}>{t("offerteNr", { nr: o.nummer ?? o.id })}</h2>
            <span className="src">{t("datum")} {dateFmt(lang, o.datum)}{o.geldig_tot ? ` · ${t("geldig")} ${dateFmt(lang, o.geldig_tot)}` : ""}</span></div>
          <span><span className={`st ${s.kleur}`}>{s.tekst}</span></span>
        </div>
        {o.soort === "bod" && <p style={{ margin: 0 }}><b>{t("bodStatus")}:</b> {t("bodBedrag")} {eur(lang, o.bod_bedrag)}</p>}
        {o.order_nummer && <p style={{ margin: 0 }}>{t("bijOrd")}: <Link href={href(lang, `/mijn/orders/${o.order_nummer}/`)}>{o.order_nummer}</Link></p>}
        {o.intro && <p style={{ margin: 0, whiteSpace: "pre-line" }}>{o.intro}</p>}
        {o.regels.length ? (
          <div className="tw"><table className="t">
            <thead><tr><th>{t("omschrijving")}</th><th style={{ textAlign: "right" }}>{t("aantal")}</th><th style={{ textAlign: "right" }}>{t("prijsSt")}</th><th style={{ textAlign: "right" }}>{t("bedrag")}</th></tr></thead>
            <tbody>{act.map((r, i) => (
              <tr key={i}><td>{r.omschrijving}</td><td style={{ textAlign: "right" }}>{r.aantal}</td><td style={{ textAlign: "right" }}>{Number(r.prijs) > 0 ? eur(lang, r.prijs, 2) : "–"}{Number(r.korting_pct) ? ` (−${r.korting_pct}%)` : ""}</td><td style={{ textAlign: "right" }}>{Number(r.prijs) > 0 ? eur(lang, regelTotaal(r)) : "–"}</td></tr>
            ))}</tbody>
            <tfoot><tr><td colSpan={3}><b>{t("totaalExcl")}</b></td><td style={{ textAlign: "right" }}><b>{eur(lang, totaal)}</b></td></tr></tfoot>
          </table></div>
        ) : <p style={{ margin: 0 }}>{t("geenRegels")}</p>}
        {opt.length > 0 && <p className="src" style={{ margin: 0 }}>{opt.map(r => r.omschrijving).join(", ")}</p>}
        {(o.levertijd || o.betaling || o.levering) && <p className="src" style={{ margin: 0 }}>{[o.levering === "bezorgen" ? `${t("levT")}${o.aflever_adres ? `: ${o.aflever_adres}` : ""}` : o.levering === "afhalen" ? t("levA") : "", o.afhaal_datum ? `${t("afhaal")}: ${dateFmt(lang, o.afhaal_datum)}` : "", o.levertijd, o.betaling].filter(Boolean).join(" · ")}</p>}
        {o.voorwaarden && <p className="src" style={{ margin: 0, whiteSpace: "pre-line" }}>{o.voorwaarden}</p>}
        <p className="src" style={{ margin: 0 }}>{t("prijsExcl")}</p>
        {o.kan_accepteren && (
          <div className="note" style={{ display: "grid", gap: 10 }}>
            <b>{t("akkoordToelichting")}</b>
            <ActionForm action={accepterenAction} lang={lang} submitLabel={t("akkoordKnop")} hideOnOk>
              <input type="hidden" name="offerte_id" value={o.id} />
              <div className="field"><label htmlFor="naam">{t("akkoordNaamL")}</label><input id="naam" name="naam" required maxLength={120} /></div>
            </ActionForm>
          </div>
        )}
        {o.akkoord && !o.order_nummer && <p className="ok">{t("akkoordGegeven", { datum: dateFmt(lang, o.akkoord) })}</p>}
      </div>
      <div className="box"><Chat lang={lang} berichten={berichten ?? []} offerteId={o.id} /></div>
    </div>
  );
}
