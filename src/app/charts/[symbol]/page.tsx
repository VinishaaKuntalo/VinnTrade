import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { ChartWorkspace } from "@/components/charts/chart-workspace";
import { canonicalUsEquitySymbol } from "@/lib/symbol-alias";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ symbol: string }>;
}): Promise<Metadata> {
  const { symbol } = await params;
  const upper = decodeURIComponent(symbol).toUpperCase();
  return {
    title: `${upper} Chart — VinnTrade`,
    description: `Wide technical chart workspace for ${upper}.`,
  };
}

export default async function ChartPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  const canon = canonicalUsEquitySymbol(symbol);
  const upper = decodeURIComponent(symbol).trim().toUpperCase().replace(/\s/g, "");
  if (canon !== upper) {
    redirect(`/charts/${encodeURIComponent(canon)}`);
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <SiteHeader />
      <ChartWorkspace symbol={canon} />
    </div>
  );
}
