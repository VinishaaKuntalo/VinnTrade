import { SiteHeader } from "@/components/site-header";
import { HeroSection } from "@/components/hero-section";
import { MciSnapshotBar } from "@/components/mci-snapshot-bar";
import { InvestmentGlobeLoader } from "@/components/investment-globe-loader";
import { UnderstandingStrip } from "@/components/understanding-strip";
import { StocksTeaser } from "@/components/stocks-teaser";
import { HowVinnTradeHelps } from "@/components/how-vinntrade-helps";
import { ForInvestorsSection } from "@/components/for-investors-section";
import { CtaSection } from "@/components/cta-section";
import { SiteFooter } from "@/components/site-footer";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1">
        <HeroSection />
        <MciSnapshotBar />
        <InvestmentGlobeLoader />
        <UnderstandingStrip />
        <StocksTeaser />
        <HowVinnTradeHelps />
        <ForInvestorsSection />
        <CtaSection />
      </main>
      <SiteFooter />
    </div>
  );
}
