import Link from "next/link";
import { notFound } from "next/navigation";
import { dateFmt, eur, getT, href, isLang } from "@/lib/i18n";
import { rpc } from "@/lib/supabase";
import { offerteStatus } from "@/lib/status";
import type { OfferteRij } from "@/lib/types";

export default async function Offertes({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getT(lang);
  const { data } = await rpc<OfferteRij[]>("site_mijn_offertes");
  const rows = data ?? [];
  return (
    <div className="box tw">
      {rows.length ? (
        <table className="t list">
          <thead><tr><th>Nr</th><th>{t("datum")}</th><th>{t("status")}</th><th style={{ textAlign: "right" }}>{t("totaalExcl")}</th><th></th></tr></thead>
          <tbody>{rows.map(o => { const s = offerteStatus(t, o); return (
            <tr key={o.id}>
              <td><Link href={href(lang, `/mijn/offertes/${o.id}/`)}>{o.nummer ?? o.id}</Link></td><td>{dateFmt(lang, o.datum)}</td>
              <td><span className={`st ${s.kleur}`}>{s.tekst}</span>{o.soort === "bod" ? <> <span className="st a">{t("bodStatus")}</span></> : null}{o.ongelezen ? <> <span className="dot">{o.ongelezen}</span></> : null}</td>
              <td style={{ textAlign: "right" }}>{o.soort === "bod" ? eur(lang, o.bod_bedrag) : eur(lang, o.totaal)}</td>
              <td><Link className="btn ghost sm" href={href(lang, `/mijn/offertes/${o.id}/`)}>{t("bekijk2")} →</Link></td>
            </tr>); })}</tbody>
        </table>
      ) : <p style={{ margin: 0 }}>{t("niksOpen")} <Link href={href(lang, "/partijen/")}>{t("naarPartijen")}</Link></p>}
    </div>
  );
}
