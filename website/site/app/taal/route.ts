import { NextResponse, type NextRequest } from "next/server";
import { href, isLang } from "@/lib/i18n";
import { artikel } from "@/lib/site";

/** Taalwisselaar: gaat naar dezelfde pagina in een andere taal. Bij een productpagina met het adres van die taal. */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const naar = sp.get("naar"), van = sp.get("van");
  let pad = sp.get("pad") || "/";
  if (!isLang(naar)) return NextResponse.redirect(new URL("/", req.url));
  if (!pad.startsWith("/") || pad.startsWith("//")) pad = "/";
  const prod = /^\/product\/([^/?#]+)\/?/.exec(pad);
  if (prod && isLang(van)) {
    const r = await artikel(decodeURIComponent(prod[1]), van);
    pad = r && r.status === "ok" ? `/product/${naar === "en" ? r.item.slug_en : naar === "de" ? r.item.slug_de : r.item.slug_nl}/` : "/partijen/";
  }
  const [path, query = ""] = pad.split("?");
  const url = new URL(href(naar, path), req.url);
  if (query) url.search = `?${query}`;
  return NextResponse.redirect(url);
}
