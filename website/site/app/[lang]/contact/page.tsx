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
  return { title: getT(lang)("contact"), alternates: alternates(lang, "/contact/") };
}

export default async function Contact({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ onderwerp?: string }> }) {
  const { lang } = await params, sp = await searchParams;
  if (!isLang(lang)) notFound();
  const t = getT(lang);
  const onderwerp = (sp.onderwerp || "").slice(0, 200);
  return (
    <section className="blk"><div className="wrap split">
      <div className="box" style={{ display: "grid", gap: 10, alignContent: "start" }}>
        <h1 style={{ color: "var(--navy)", fontWeight: 800, textTransform: "uppercase", fontSize: 26 }}>{t("contact")}</h1>
        <p style={{ margin: 0 }}>Rheastraat 19, 5047 TL Tilburg<br />+31 (0)13 57 11 75 5<br />info@fvdwpartijhandel.nl<br />WhatsApp +31 6 18 30 61 48</p>
        <h2 style={{ fontSize: 16, color: "var(--navy)", margin: "8px 0 0" }}>{t("openingstijden")}</h2>
        <table className="t"><tbody>
          <tr><td>{t("maVr")}</td><td>08:00–17:00</td></tr><tr><td>{t("za")}</td><td>{t("opAfspraak")}</td></tr><tr><td>{t("zo")}</td><td>{t("gesloten")}</td></tr>
        </tbody></table>
      </div>
      <div className="box">
        <ActionForm action={formulierAction.bind(null, "contact")} lang={lang} submitLabel={t("verzenden")} turnstile hideOnOk>
          <div className="form">
            <Veld id="naam" label={t("naam")} required autoComplete="name" />
            <Veld id="bedrijf" label={t("bedrijf")} autoComplete="organization" />
            <Veld id="email" label={t("email")} type="email" required autoComplete="email" />
            <Veld id="telefoon" label={t("tel")} type="tel" autoComplete="tel" />
            <Veld id="tekst" label={t("bericht")} required area full defaultValue={onderwerp ? `${onderwerp}\n` : undefined} />
            <Akkoord lang={lang} />
          </div>
        </ActionForm>
      </div>
    </div></section>
  );
}
