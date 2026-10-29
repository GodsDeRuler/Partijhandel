import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ActionForm } from "@/components/ActionForm";
import { Veld } from "@/components/Veld";
import { huidigeMedewerker } from "@/lib/intern";
import { internLoginAction } from "../actions";

export const metadata: Metadata = { title: "Inloggen medewerkers", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function InternInloggen({ searchParams }: { searchParams: Promise<{ fout?: string }> }) {
  const sp = await searchParams;
  if (await huidigeMedewerker()) redirect("/intern/");
  return (
    <section className="blk"><div className="wrap" style={{ maxWidth: 520 }}>
      <div className="box" style={{ display: "grid", gap: 14 }}>
        <h1 style={{ color: "var(--navy)", fontWeight: 800, textTransform: "uppercase", fontSize: 26 }}>Salesbureau</h1>
        <p style={{ margin: 0 }}>Log in met je e-mailadres. Je krijgt een link waarmee je direct binnenkomt, een wachtwoord is niet nodig.</p>
        {sp.fout && <p className="err">De link is verlopen of ongeldig. Vraag een nieuwe aan.</p>}
        <ActionForm action={internLoginAction} lang="nl" submitLabel="Stuur me een inloglink" hideOnOk>
          <Veld id="email" label="E-mailadres" type="email" required autoComplete="email" />
        </ActionForm>
      </div>
    </div></section>
  );
}
