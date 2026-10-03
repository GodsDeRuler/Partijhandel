import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getT, isLang } from "@/lib/i18n";
import { Legal } from "@/components/Legal";
import { alternates } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return { title: getT(lang)("privacy"), alternates: alternates(lang, "/privacy/") };
}

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return <Legal lang={lang} doc="privacy" />;
}
