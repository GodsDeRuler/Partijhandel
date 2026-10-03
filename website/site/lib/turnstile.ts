import { headers } from "next/headers";

/** Controleert het Cloudflare Turnstile-antwoord. Zonder sleutel in productie wordt niets doorgelaten. */
export async function turnstileOk(token: FormDataEntryValue | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return process.env.NODE_ENV !== "production";
  if (typeof token !== "string" || !token) return false;
  const h = await headers();
  const ip = (h.get("x-forwarded-for") || "").split(",")[0].trim();
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set("remoteip", ip);
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body, cache: "no-store" });
    const j = (await r.json()) as { success?: boolean };
    return !!j.success;
  } catch { return false; }
}
