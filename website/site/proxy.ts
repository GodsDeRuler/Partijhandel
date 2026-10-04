import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Taalroutes: Nederlands staat op de hoofdmap (/partijen/), Engels onder /en/ en Duits onder /de/.
// De pagina's zelf staan onder app/[lang]; deze proxy herschrijft Nederlandse adressen naar /nl/...
// en ververst de inlogsessie van de bezoeker als die er is.
const LANG_RE = /^\/(nl|en|de)(\/.*)?$/;

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const m = LANG_RE.exec(pathname);
  let lang = "nl";
  let rest = pathname;
  if (m) {
    lang = m[1];
    rest = m[2] || "/";
    if (lang === "nl") {
      const url = req.nextUrl.clone();
      url.pathname = rest;
      return NextResponse.redirect(url, 308); // /nl/x/ is geen eigen adres, het Nederlands staat zonder voorvoegsel
    }
  }

  const build = () => {
    const headers = new Headers(req.headers);
    headers.set("x-lang", lang);
    headers.set("x-path", rest + req.nextUrl.search);
    if (m) return NextResponse.next({ request: { headers } });
    const url = req.nextUrl.clone();
    url.pathname = `/nl${pathname === "/" ? "/" : pathname}`;
    return NextResponse.rewrite(url, { request: { headers } });
  };
  let res = build();

  // Sessie verversen, alleen als er een inlogcookie is (anonieme bezoekers kosten zo niets extra)
  if (req.cookies.getAll().some(c => c.name.startsWith("sb-")) && process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    const sb = createServerClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: list => {
          for (const { name, value } of list) req.cookies.set(name, value);
          res = build();
          for (const { name, value, options } of list) res.cookies.set(name, value, options);
        },
      },
    });
    await sb.auth.getUser();
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/|api/|auth/|foto/|taal/|.*\\..*).*)"],
};
