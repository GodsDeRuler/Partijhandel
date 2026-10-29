import Link from "next/link";
import { notFound } from "next/navigation";
import { dateFmt, eur, getT, href, isLang } from "@/lib/i18n";
import { rpc } from "@/lib/supabase";
import { orderStatus } from "@/lib/status";
import type { Bericht, Order } from "@/lib/types";
import { Chat } from "@/components/Chat";

export default async function OrderDetail({ params }: { params: Promise<{ lang: string; nr: string }> }) {
  const { lang, nr } = await params;
  if (!isLang(lang) || !/^\d{1,12}$/.test(nr)) notFound();
  const t = getT(lang);
  const { data: o } = await rpc<Order>("site_order", { p_nummer: Number(nr) });
  if (!o) notFound();
  const { data: berichten } = await rpc<Bericht[]>("site_berichten", { p_order: o.nummer });
  const s = orderStatus(t, o.status);
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <p style={{ margin: 0 }}><Link href={href(lang, "/mijn/orders/")}>← {t("mijnOrders")}</Link></p>
      <div className="box" style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div><h2 style={{ margin: 0, color: "var(--navy)", fontSize: 22 }}>{t("orderNr", { nr: o.nummer })}</h2><span className="src">{t("datum")} {dateFmt(lang, o.datum)}</span></div>
          <span className={`st ${s.kleur}`}>{s.tekst}</span>
        </div>
        {s.uitleg && <p style={{ margin: 0 }}>{s.uitleg}</p>}
        {o.offerte_id && <p style={{ margin: 0 }}>{t("bijOff")}: <Link href={href(lang, `/mijn/offertes/${o.offerte_id}/`)}>{t("docOff")}</Link></p>}
        {o.regels.length ? (
          <div className="tw"><table className="t">
            <thead><tr><th>{t("omschrijving")}</th><th style={{ textAlign: "right" }}>{t("aantal")}</th><th style={{ textAlign: "right" }}>{t("prijsSt")}</th></tr></thead>
            <tbody>{o.regels.map((r, i) => <tr key={i}><td>{r.omschrijving}</td><td style={{ textAlign: "right" }}>{r.aantal}</td><td style={{ textAlign: "right" }}>{Number(r.prijs) > 0 ? eur(lang, r.prijs) : "–"}</td></tr>)}</tbody>
          </table></div>
        ) : o.omschrijving ? <p style={{ margin: 0, whiteSpace: "pre-line" }}>{o.omschrijving}</p> : null}
        {o.prijs != null && <p style={{ margin: 0 }}><b>{t("totaalExcl")}: {eur(lang, o.prijs)}</b></p>}
        {o.zendingen.length > 0 && (
          <div><h3 style={{ color: "var(--navy)", margin: "0 0 6px" }}>{t("zendingen")}</h3>
            {o.zendingen.map((z, i) => (
              <p key={i} className="src" style={{ margin: "0 0 6px" }}>{[z.vervoerder ? `${t("vervoerder")}: ${z.vervoerder}` : "", z.track_trace ? `${t("trackTrace")}: ${z.track_trace}` : "", z.gepland_op ? `${t("gepland")}: ${dateFmt(lang, z.gepland_op)}` : "", z.afhaaltijd ? `${t("afhaaltijd")}: ${z.afhaaltijd}` : "", z.pallets ? `${t("pallets")}: ${z.pallets}` : "", z.colli ? `${t("colli")}: ${z.colli}` : ""].filter(Boolean).join(" · ") || (z.soort ?? "")}</p>
            ))}
          </div>
        )}
      </div>
      <div className="box"><Chat lang={lang} berichten={berichten ?? []} orderNummer={o.nummer} /></div>
    </div>
  );
}
