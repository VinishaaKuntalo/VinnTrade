import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GeoMapLoader } from "@/components/geo-map/geo-map-loader";

export const metadata = {
  title: "Market Impact Map — VinnTrade",
  description:
    "Interactive world map showing geopolitical risk by country. Click any country to see top stocks and add them to your portfolio.",
};

export default function GeoMapPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SiteHeader />
      <main className="flex-1 overflow-hidden">
        <GeoMapLoader />
      </main>
      <SiteFooter />
    </div>
  );
}
