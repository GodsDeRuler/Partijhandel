import { notFound } from "next/navigation";
import { getT, isLang } from "@/lib/i18n";
import { categorieen, getMij } from "@/lib/site";
import { catNaam } from "@/lib/types";
import { ActionForm } from "@/components/ActionForm";
import { Veld } from "@/components/Veld";
import { gegevensAction } from "@/app/actions";

export default async function Gegevens({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getT(lang);
  const [mij, cats] = await Promise.all([getMij(), categorieen()]);
  if (mij.status !== "goedgekeurd") return null;
  const hoofd = cats.filter(c => c.niveau === "hoofd");
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div className="box">
        <dl style={{ display: "grid", gridTemplateColumns: "minmax(110px,30%) 1fr", gap: "6px 12px", margin: 0 }}>
          {([[t("bedrijf"), mij.naam], [t("land"), mij.land], [t("adresL"), [mij.adres, [mij.postcode, mij.plaats].filter(Boolean).join(" ")].filter(Boolean).join(", ")], [t("btw"), mij.btw_nr], [t("email"), mij.email]] as [string, string | null][]).map(([k, v]) => v ? <div key={k} style={{ display: "contents" }}><dt className="src">{k}</dt><dd style={{ margin: 0 }}>{v}</dd></div> : null)}
        </dl>
        <p className="src" style={{ marginBottom: 0 }}>{t("gegevensNota")}</p>
      </div>
      <div className="box">
        <ActionForm action={gegevensAction} lang={lang} submitLabel={t("opslaan")} resetOnOk={false}>
          {mij.interesses.filter(c => !hoofd.some(h => h.code === c)).map(c => <input key={c} type="hidden" name="interesses" value={c} />)}
          <div className="form">
            <Veld id="contactpersoon" label={t("contactpersoonL")} defaultValue={mij.contactpersoon ?? ""} autoComplete="name" />
            <Veld id="telefoon" label={t("tel")} type="tel" defaultValue={mij.telefoon ?? ""} autoComplete="tel" />
            <Veld id="taal" label={t("taalL")}>
              <select id="taal" name="taal" defaultValue={(mij.taal || lang).toUpperCase()}><option value="NL">Nederlands</option><option value="EN">English</option><option value="DE">Deutsch</option></select>
            </Veld>
            <div className="field full"><label>{t("interesses")}</label><span className="src">{t("interessesP")}</span>
              <div className="checks">{hoofd.map(c => <label key={c.code}><input type="checkbox" name="interesses" value={c.code} defaultChecked={mij.interesses.includes(c.code)} />{catNaam(c, lang)}</label>)}</div></div>
          </div>
        </ActionForm>
      </div>
    </div>
  );
}
