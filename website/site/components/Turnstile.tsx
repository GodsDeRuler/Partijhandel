"use client";
import Script from "next/script";

declare global { interface Window { turnstile?: { reset: (el?: string | HTMLElement) => void } } }

/** Spamcontrole van Cloudflare (Turnstile). Het antwoord komt vanzelf als verborgen veld in het formulier. */
export function Turnstile() {
  const key = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!key) return null;
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" />
      <div className="cf-turnstile" data-sitekey={key} data-theme="light" />
    </>
  );
}
