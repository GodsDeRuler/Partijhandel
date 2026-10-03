import { notFound } from "next/navigation";
import { dateFmt, eur, getT, isLang } from "@/lib/i18n";
import { rpc } from "@/lib/supabase";
import type { Openstaand } from "@/lib/types";

export default async function OpenstaandPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getT(lang);
  const { data } = await rpc<Openstaand[]>("site_openstaand");
  const rows = data ?? [];
  const totaal = rows.reduce((s, r) => s + Number(r.rest), 0);
  return (
    <div className="box tw">
      {rows.length ? (
        <table className="t">
          <thead><tr><th>{t("factuur")}</th><th>{t("datum")}</th><th>{t("vervaldatum")}</th><th style={{ textAlign: "right" }}>{t("rest")}</th></tr></thead>
          <tbody>{rows.map(r => (
            <tr key={String(r.nummer)}><td>{r.nummer}</td><td>{dateFmt(lang, r.datum)}</td>
              <td>{dateFmt(lang, r.vervaldatum)}{r.te_laat ? <> <span className="st o">{t("teLaat")}</span></> : null}</td><td style={{ textAlign: "right" }}>{eur(lang, r.rest)}</td></tr>
          ))}</tbody>
          <tfoot><tr><td colSpan={3}><b>{t("nogOpenstaand")}</b></td><td style={{ textAlign: "right" }}><b>{eur(lang, totaal)}</b></td></tr></tfoot>
        </table>
      ) : <p style={{ margin: 0 }}>{t("nietsOpenstaand")}</p>}
    </div>
  );
}
