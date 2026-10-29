"use server";
import { db } from "@/lib/supabase";
import { medewerkerByEmail } from "@/lib/intern";
import { SITE_URL } from "@/lib/site";
import type { FormState } from "@/components/ActionForm";

const MAILRE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Inloglink voor medewerkers. Het antwoord is altijd hetzelfde, zodat niemand kan nagaan wie er wel of niet medewerker is. */
export async function internLoginAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = String(fd.get("email") ?? "").trim().toLowerCase().slice(0, 200);
  if (!MAILRE.test(email)) return { ok: false, msg: "Dat is geen geldig e-mailadres." };
  const ok = { ok: true, msg: `Als ${email} bij een medewerker hoort, staat er zo een inloglink in de mailbox.` };
  try {
    if (!(await medewerkerByEmail(email))) return ok;
    const sb = await db();
    const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo: `${SITE_URL}/auth/callback/?next=intern` } });
    if (error) { console.error("intern signInWithOtp:", error.message); return { ok: false, msg: "De link kon niet worden verstuurd. Probeer het zo opnieuw." }; }
  } catch (e) {
    console.error("intern login:", e instanceof Error ? e.message : e);
    return { ok: false, msg: "Inloggen is nu niet mogelijk. Probeer het zo opnieuw." };
  }
  return ok;
}
