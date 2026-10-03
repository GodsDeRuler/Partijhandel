import { NextResponse } from "next/server";
import { rpc } from "@/lib/supabase";

type Foto = { data: string | null; url: string | null } | null;
const PRIVATE = { "Cache-Control": "private, max-age=3600" };

/** Productfoto. De database bepaalt of deze bezoeker het artikel mag zien (site_foto geeft anders niets terug). */
export async function GET(_req: Request, ctx: { params: Promise<{ nr: string; maat: string }> }) {
  const { nr, maat } = await ctx.params;
  if (!/^\d{1,9}$/.test(nr)) return new NextResponse(null, { status: 404 });
  const { data } = await rpc<Foto>("site_foto", { p_artikel: Number(nr), p_maat: maat === "groot" ? "groot" : "klein" });
  if (!data) return new NextResponse(null, { status: 404 });
  const m = data.data ? /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/s.exec(data.data) : null;
  if (m) return new NextResponse(Buffer.from(m[2], "base64"), { headers: { "Content-Type": m[1], "X-Content-Type-Options": "nosniff", ...PRIVATE } });
  if (data.url && /^https:\/\//.test(data.url)) return NextResponse.redirect(data.url, { status: 307, headers: PRIVATE });
  return new NextResponse(null, { status: 404 });
}
