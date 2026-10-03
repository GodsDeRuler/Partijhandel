import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getT, isLang } from "@/lib/i18n";
import { ActionForm } from "@/components/ActionForm";
import { Veld } from "@/components/Veld";
import { Akkoord } from "@/components/Akkoord";
import { formulierAction } from "@/app/actions";
import { alternates } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return { title: getT(lang)("aanbiedenT"), alternates: alternates(lang, "/partij-aanbieden/") };
}

export default async function Aanbieden({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getT(lang);
  return (
    <section className="blk"><div className="wrap split">
      <img src="/img/vrachtwagen.jpg" alt="" style={{ borderRadius: 25, width: "100%", maxHeight: 520, objectFit: "cover" }} />
      <div className="box" style={{ display: "grid", gap: 12, alignContent: "start" }}>
        <h1 style={{ color: "var(--navy)", fontWeight: 800, textTransform: "uppercase", fontSize: 26 }}>{t("aanbiedenT")}</h1>
        <p style={{ margin: 0 }}>{t("aanbiedenP")}</p>
        <ActionForm action={formulierAction.bind(null, "partij_aanbieden")} lang={lang} submitLabel={t("verzenden")} turnstile hideOnOk>
          <div className="form">
            <Veld id="bedrijf" label={t("bedrijf")} required autoComplete="organization" />
            <Veld id="naam" label={t("naam")} autoComplete="name" />
            <Veld id="email" label={t("email")} type="email" required autoComplete="email" />
            <Veld id="telefoon" label={t("telefoonL")} type="tel" autoComplete="tel" />
            <Veld id="omschrijving" label={t("omschrijvingL")} required area full />
            <Veld id="hoeveelheid" label={t("hoeveelheidL")} />
            <Veld id="prijsidee" label={t("prijsideeL")} />
            <Veld id="link" label={t("linkL")} type="url" full />
            <Akkoord lang={lang} />
          </div>
        </ActionForm>
      </div>
    </div></section>
  );
}
