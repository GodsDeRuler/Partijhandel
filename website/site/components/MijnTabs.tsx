"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getT, href, type Lang } from "@/lib/i18n";

const TABS: [string, string, string][] = [["", "mijnOverzicht", "/mijn/"], ["openstaand", "mijnOpenstaand", "/mijn/openstaand/"], ["offertes", "mijnOffertes", "/mijn/offertes/"], ["orders", "mijnOrders", "/mijn/orders/"], ["berichten", "mijnBerichten", "/mijn/berichten/"], ["gegevens", "mijnGegevens", "/mijn/gegevens/"]];

export function MijnTabs({ lang, ongelezen }: { lang: Lang; ongelezen: number }) {
  const t = getT(lang);
  const pad = usePathname().replace(/^\/(en|de)(?=\/)/, "");
  return (
    <nav className="mijntabs" aria-label={t("mijn")}>
      {TABS.map(([k, label, p]) => {
        const on = k === "" ? pad === "/mijn/" : pad.startsWith(p);
        return <Link key={k} href={href(lang, p)} className={on ? "on" : ""} aria-current={on ? "page" : undefined}>{t(label)}{k === "berichten" && ongelezen ? <> <span className="dot">{ongelezen}</span></> : null}</Link>;
      })}
    </nav>
  );
}
