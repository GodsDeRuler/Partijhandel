import { getT, type Lang } from "@/lib/i18n";
import { itemNaam, type Item } from "@/lib/types";

/** Productfoto via /foto/<nr>/: eigen foto uit de database, anders de oude MyBusiness-link. De grijze standaardafbeelding tonen we niet. */
export function ItemFoto({ item, lang, maat = "klein", eager = false }: { item: Item; lang: Lang; maat?: "klein" | "groot"; eager?: boolean }) {
  const t = getT(lang);
  if (item.foto_grijs && !item.eigen_foto)
    return <div className="nofoto"><img src="/img/logo.png" alt="" width={120} height={17} style={{ opacity: 0.35 }} /><span>{t("fotoVolgt")}</span></div>;
  return <img src={`/foto/${item.nr}/${maat}/`} alt={itemNaam(item, lang)} loading={eager ? "eager" : "lazy"} />;
}
