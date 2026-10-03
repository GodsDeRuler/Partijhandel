import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getT, href, isLang } from "@/lib/i18n";
import { alternates } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return { title: getT(lang)("over"), alternates: alternates(lang, "/over-ons/") };
}

const TEKST: Record<string, string> = {
  nl: "Ruim 10 jaar is Frank van de Wijgert partijhandel actief in de verkoop van restpartijen. Onze klanten zijn van winkelketens en marktkramen tot groothandelaren. Na aankoop van de partijen worden de goederen in onze eigen magazijnen geteld en gesorteerd. Hierna worden de goederen ter verkoop aangeboden.",
  en: "For more than 10 years Frank van de Wijgert partijhandel has been selling surplus stock. Our customers range from retail chains and market traders to wholesalers. After we buy a lot, the goods are counted and sorted in our own warehouses. Then they are offered for sale.",
  de: "Seit mehr als 10 Jahren verkauft Frank van de Wijgert partijhandel Restposten. Unsere Kunden reichen von Handelsketten und Marktständen bis zu Großhändlern. Nach dem Ankauf werden die Waren in unseren eigenen Lagern gezählt und sortiert. Danach werden sie zum Verkauf angeboten.",
};

export default async function OverOns({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getT(lang);
  return (
    <>
      <section className="blk"><div className="wrap split" style={{ alignItems: "center" }}>
        <div style={{ display: "grid", gap: 14 }}>
          <h1 style={{ color: "var(--navy)", fontSize: 30, fontWeight: 900, textTransform: "uppercase" }}>{t("over")}</h1>
          <p style={{ margin: 0, maxWidth: "60ch" }}>{TEKST[lang]}</p>
          <div><Link className="btn bl" href={href(lang, "/contact/")}>{t("contact")}</Link></div>
        </div>
        <img src="/img/pand.jpg" alt="Rheastraat, Tilburg" style={{ borderRadius: 25, width: "100%" }} />
      </div></section>
      <section className="blk" style={{ paddingTop: 0 }}><div className="wrap split" style={{ alignItems: "center" }}>
        <img src="/img/showroom.jpg" alt="Showroom" style={{ borderRadius: 25, width: "100%", maxHeight: 460, objectFit: "cover" }} />
        <div className="panel i"><h2 style={{ fontSize: 22, fontWeight: 800, textTransform: "uppercase" }}>{t("showT")}</h2><p>{t("showP")}</p><Link className="btn bl" href={href(lang, "/contact/")}>{t("showB")}</Link></div>
      </div></section>
    </>
  );
}
