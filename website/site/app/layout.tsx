import type { Metadata, Viewport } from "next";
import { Montserrat, Barlow_Condensed } from "next/font/google";
import { headers } from "next/headers";
import { isLang } from "@/lib/i18n";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"], variable: "--font-montserrat", display: "swap" });
const barlow = Barlow_Condensed({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-barlow", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Frank van de Wijgert Partijhandel", template: "%s | Frank van de Wijgert Partijhandel" },
  icons: { icon: "/img/favicon.png" },
};
export const viewport: Viewport = { themeColor: "#0E2B5D", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const l = h.get("x-lang");
  return (
    <html lang={isLang(l) ? l : "nl"} className={`${montserrat.variable} ${barlow.variable}`}>
      <body>{children}</body>
    </html>
  );
}
