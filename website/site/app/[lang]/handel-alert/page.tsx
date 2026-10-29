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
  return { title: getT(lang)("alertTitel"), alternates: alternates(lang, "/handel-alert/") };
}

export default async function HandelAlert({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ cat?: string }> }) {
  const { lang } = await params, sp = await searchParams;
  if (!isLang(lang)) notFound();
  const t = getT(lang);
  const cats = (await categorieen()).filter(c => c.niveau === "hoofd");
  return (
    <section className="blk"><div className="wrap" style={{ maxWidth: 760 }}>
      <div className="box" style={{ display: "grid", gap: 14 }}>
        <h1 style={{ color: "var(--navy)", fontWeight: 800, textTransform: "uppercase", fontSize: 26 }}>{t("alertTitel")}</h1>
        <p style={{ margin: 0 }}>{t("alertP")}</p>
        <ActionForm action={formulierAction.bind(null, "handel_alert")} lang={lang} submitLabel={t("alertCatB")} turnstile hideOnOk>
          <div className="form">
            <Veld id="email" label={t("email")} type="email" required autoComplete="email" />
            <Veld id="naam" label={t("naam")} autoComplete="name" />
            <div className="field full"><label>{t("alertWelke")}</label>
              <div className="checks">{cats.map(c => <label key={c.code}><input type="checkbox" name="interesses" value={c.code} defaultChecked={sp.cat === c.code} />{catNaam(c, lang)}</label>)}</div></div>
            <Akkoord lang={lang} />
          </div>
        </ActionForm>
      </div>
    </div></section>
  );
}
