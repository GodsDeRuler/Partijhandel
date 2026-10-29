import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getT, isLang } from "@/lib/i18n";
import { categorieen } from "@/lib/site";
import { catNaam } from "@/lib/types";
import { ActionForm } from "@/components/ActionForm";
import { Veld } from "@/components/Veld";
import { Akkoord } from "@/components/Akkoord";
import { formulierAction } from "@/app/actions";
import { alternates } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return { title: getT(lang)("klantTitel"), alternates: alternates(lang, "/klant-worden/") };
}

export default async function KlantWorden({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getT(lang);
  const cats = (await categorieen()).filter(c => c.niveau === "hoofd");
  return (
    <section className="blk"><div className="wrap" style={{ maxWidth: 820 }}>
      <div className="box" style={{ display: "grid", gap: 14 }}>
        <h1 style={{ color: "var(--navy)", fontWeight: 800, textTransform: "uppercase", fontSize: 26 }}>{t("klantTitel")}</h1>
        <p style={{ margin: 0 }}>{t("klantP")}</p>
        <ActionForm action={formulierAction.bind(null, "aanmelding")} lang={lang} submitLabel={t("aanmelden")} turnstile hideOnOk>
          <div className="form">
            <Veld id="bedrijf" label={t("bedrijf")} required autoComplete="organization" />
            <Veld id="naam" label={t("naam")} required autoComplete="name" />
            <Veld id="email" label={t("email")} type="email" required autoComplete="email" />
            <Veld id="telefoon" label={t("tel")} type="tel" autoComplete="tel" />
            <Veld id="kvk_nr" label={t("kvk")} />
            <Veld id="btw_nr" label={t("btw")} />
            <Veld id="adres" label={t("adresL")} autoComplete="street-address" />
            <Veld id="postcode" label={t("postcodeL")} autoComplete="postal-code" />
            <Veld id="plaats" label={t("plaatsL")} autoComplete="address-level2" />
            <Veld id="land" label={t("land")} required autoComplete="country-name" />
            <Veld id="branche" label={t("brancheL")} required>
              <select id="branche" name="branche" required defaultValue="">
                <option value="" disabled>{t("selecteer")}</option>
                {["detailhandel", "webshop", "groothandel", "horeca", "overig"].map(b => <option key={b} value={b}>{t(`br_${b}`)}</option>)}
              </select>
            </Veld>
            <div className="field full"><label>{t("interesse")}</label>
              <div className="checks">{cats.map(c => <label key={c.code}><input type="checkbox" name="interesses" value={c.code} />{catNaam(c, lang)}</label>)}</div></div>
            <p className="src" style={{ gridColumn: "1/-1", margin: 0 }}>{t("kvkOfBtw")}</p>
            <Akkoord lang={lang} />
          </div>
        </ActionForm>
      </div>
    </div></section>
  );
}
