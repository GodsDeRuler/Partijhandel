import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";

export async function GET(req: Request) {
  const sb = await db();
  await sb.auth.signOut();
  return NextResponse.redirect(new URL("/intern/inloggen/", req.url));
}
