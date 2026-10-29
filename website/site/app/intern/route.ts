import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { huidigeMedewerker } from "@/lib/intern";
import { INTERN_SHIM, INTERN_CSP } from "@/lib/intern-shim";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Het Salesbureau zelf. Zonder inlog als medewerker word je doorgestuurd naar de inlogpagina. */
export async function GET(req: Request) {
  const m = await huidigeMedewerker();
  if (!m) return NextResponse.redirect(new URL("/intern/inloggen/", req.url));
  const html = await readFile(path.join(process.cwd(), "private", "salesbureau.html"), "utf8");
  const meta = `<meta name="robots" content="noindex,nofollow"><script>window.INTERN={naam:${JSON.stringify(m.naam)},rol:${JSON.stringify(m.rol)}};</script>`;
  // Het Salesbureau is een stuk pagina zonder omhulsel (zo publiceert claude.ai het); hier geven we het hetzelfde omhulsel.
  const head = `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>html{color-scheme:light}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>`;
  const out = `<!doctype html><html lang="nl"><head>${head}${meta}${INTERN_SHIM}</head><body>${html}</body></html>`;
  return new NextResponse(out, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "private, no-store", "content-security-policy": INTERN_CSP } });
}
