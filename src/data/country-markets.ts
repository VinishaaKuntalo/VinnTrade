export type RiskLevel = "critical" | "high" | "elevated" | "medium" | "low";

export interface CountryStock {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change: number; // percentage
  marketCap: string; // e.g. "$2.8T"
  exchange: string;
}

export interface CountryMarket {
  /** Country name matching Natural Earth TopoJSON */
  name: string;
  /** ISO 3166-1 alpha-2 */
  code: string;
  region: string;
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  riskDrivers: string[];
  marketSummary: string;
  topStocks: CountryStock[];
  currency: string;
  indices: string[];
}

export const countryMarkets: CountryMarket[] = [
  {
    name: "United States of America",
    code: "US",
    region: "Americas",
    riskScore: 55,
    riskLevel: "medium",
    riskDrivers: ["Trade policy uncertainty", "Fed rate trajectory", "Election cycle"],
    marketSummary: "World's largest equity market. Tariff escalation and Fed pivot timing are the dominant near-term drivers.",
    currency: "USD",
    indices: ["S&P 500", "NASDAQ", "Dow Jones"],
    topStocks: [
      { symbol: "AAPL", name: "Apple", sector: "Technology", price: 189.84, change: -0.39, marketCap: "$2.9T", exchange: "NASDAQ" },
      { symbol: "MSFT", name: "Microsoft", sector: "Technology", price: 415.20, change: 0.82, marketCap: "$3.1T", exchange: "NASDAQ" },
      { symbol: "NVDA", name: "NVIDIA", sector: "Technology", price: 875.40, change: 2.14, marketCap: "$2.2T", exchange: "NASDAQ" },
      { symbol: "AMZN", name: "Amazon", sector: "Consumer Discretionary", price: 187.63, change: -1.02, marketCap: "$1.9T", exchange: "NASDAQ" },
      { symbol: "GOOGL", name: "Alphabet", sector: "Communication Services", price: 174.15, change: 0.55, marketCap: "$2.1T", exchange: "NASDAQ" },
      { symbol: "JPM", name: "JPMorgan Chase", sector: "Financials", price: 206.42, change: -0.18, marketCap: "$594B", exchange: "NYSE" },
    ],
  },
  {
    name: "United Kingdom",
    code: "GB",
    region: "Europe",
    riskScore: 58,
    riskLevel: "medium",
    riskDrivers: ["Post-Brexit trade friction", "BoE rate path", "Energy cost pressures"],
    marketSummary: "FTSE 100 is commodity-heavy. Energy and financials dominate. BoE divergence from Fed creates FX headwinds.",
    currency: "GBP",
    indices: ["FTSE 100", "FTSE 250"],
    topStocks: [
      { symbol: "AZN", name: "AstraZeneca", sector: "Health Care", price: 78.20, change: 1.24, marketCap: "$243B", exchange: "NYSE" },
      { symbol: "BP", name: "BP plc", sector: "Energy", price: 34.15, change: -0.72, marketCap: "$92B", exchange: "NYSE" },
      { symbol: "HSBC", name: "HSBC Holdings", sector: "Financials", price: 48.30, change: 0.33, marketCap: "$188B", exchange: "NYSE" },
      { symbol: "RIO", name: "Rio Tinto", sector: "Materials", price: 62.45, change: -1.15, marketCap: "$101B", exchange: "NYSE" },
      { symbol: "GSK", name: "GSK plc", sector: "Health Care", price: 38.60, change: 0.52, marketCap: "$76B", exchange: "NYSE" },
    ],
  },
  {
    name: "Germany",
    code: "DE",
    region: "Europe",
    riskScore: 62,
    riskLevel: "elevated",
    riskDrivers: ["Manufacturing recession", "Energy transition costs", "Auto sector pressure"],
    marketSummary: "DAX tilts heavily industrial and chemical. ECB divergence and weak domestic demand are headwinds.",
    currency: "EUR",
    indices: ["DAX", "MDAX"],
    topStocks: [
      { symbol: "SAP", name: "SAP SE", sector: "Technology", price: 215.80, change: 1.02, marketCap: "$250B", exchange: "NYSE" },
      { symbol: "SIEGY", name: "Siemens AG", sector: "Industrials", price: 84.30, change: 0.15, marketCap: "$112B", exchange: "OTC" },
      { symbol: "BAYRY", name: "Bayer AG", sector: "Health Care", price: 8.42, change: -2.30, marketCap: "$8B", exchange: "OTC" },
      { symbol: "BMWYY", name: "BMW AG", sector: "Consumer Discretionary", price: 31.20, change: -0.95, marketCap: "$45B", exchange: "OTC" },
      { symbol: "DPSGY", name: "Deutsche Post DHL", sector: "Industrials", price: 38.70, change: 0.42, marketCap: "$46B", exchange: "OTC" },
    ],
  },
  {
    name: "France",
    code: "FR",
    region: "Europe",
    riskScore: 60,
    riskLevel: "elevated",
    riskDrivers: ["Political fragility", "ECB policy", "Luxury sector slowdown"],
    marketSummary: "CAC 40 led by luxury, energy, and financials. LVMH and TotalEnergies set the tone for the index.",
    currency: "EUR",
    indices: ["CAC 40"],
    topStocks: [
      { symbol: "LVMHF", name: "LVMH", sector: "Consumer Discretionary", price: 612.00, change: -1.45, marketCap: "$295B", exchange: "OTC" },
      { symbol: "TTE", name: "TotalEnergies", sector: "Energy", price: 62.15, change: 0.38, marketCap: "$136B", exchange: "NYSE" },
      { symbol: "BNPQY", name: "BNP Paribas", sector: "Financials", price: 31.40, change: 0.20, marketCap: "$63B", exchange: "OTC" },
      { symbol: "AIRBUS", name: "Airbus SE", sector: "Industrials", price: 156.80, change: 2.10, marketCap: "$122B", exchange: "OTC" },
    ],
  },
  {
    name: "Japan",
    code: "JP",
    region: "Asia-Pacific",
    riskScore: 52,
    riskLevel: "medium",
    riskDrivers: ["BoJ policy normalization", "Weak yen", "China export dependency"],
    marketSummary: "Nikkei hit multi-decade highs on weak yen tailwind. BoJ rate hike risk is the main pressure valve.",
    currency: "JPY",
    indices: ["Nikkei 225", "TOPIX"],
    topStocks: [
      { symbol: "TM", name: "Toyota Motor", sector: "Consumer Discretionary", price: 186.20, change: -0.62, marketCap: "$240B", exchange: "NYSE" },
      { symbol: "SONY", name: "Sony Group", sector: "Technology", price: 87.40, change: 1.18, marketCap: "$107B", exchange: "NYSE" },
      { symbol: "SFTBY", name: "SoftBank Group", sector: "Technology", price: 28.60, change: 2.35, marketCap: "$85B", exchange: "OTC" },
      { symbol: "NTDOY", name: "Nintendo", sector: "Technology", price: 15.80, change: 0.44, marketCap: "$206B", exchange: "OTC" },
      { symbol: "HMC", name: "Honda Motor", sector: "Consumer Discretionary", price: 29.15, change: -1.02, marketCap: "$47B", exchange: "NYSE" },
    ],
  },
  {
    name: "China",
    code: "CN",
    region: "Asia-Pacific",
    riskScore: 72,
    riskLevel: "high",
    riskDrivers: ["US tariff escalation", "Property sector debt", "Taiwan Strait tensions", "Deflation risk"],
    marketSummary: "Significant macro headwinds from US tariffs and a multi-year property deleveraging cycle. Stimulus impulse is the key wildcard.",
    currency: "CNY",
    indices: ["CSI 300", "Hang Seng", "Shanghai Composite"],
    topStocks: [
      { symbol: "BABA", name: "Alibaba Group", sector: "Consumer Discretionary", price: 84.30, change: -2.15, marketCap: "$202B", exchange: "NYSE" },
      { symbol: "JD", name: "JD.com", sector: "Consumer Discretionary", price: 38.60, change: -1.35, marketCap: "$55B", exchange: "NASDAQ" },
      { symbol: "BIDU", name: "Baidu", sector: "Communication Services", price: 82.40, change: 0.75, marketCap: "$28B", exchange: "NASDAQ" },
      { symbol: "NIO", name: "NIO Inc.", sector: "Consumer Discretionary", price: 4.18, change: -3.40, marketCap: "$8B", exchange: "NYSE" },
      { symbol: "PDD", name: "PDD Holdings", sector: "Consumer Discretionary", price: 96.20, change: -1.85, marketCap: "$134B", exchange: "NASDAQ" },
    ],
  },
  {
    name: "India",
    code: "IN",
    region: "Asia-Pacific",
    riskScore: 48,
    riskLevel: "medium",
    riskDrivers: ["INR depreciation pressure", "Global IT spend softness", "Border tensions"],
    marketSummary: "Sensex and Nifty benefit from strong domestic consumption and a growing tech export sector. One of the best structural growth stories.",
    currency: "INR",
    indices: ["Nifty 50", "BSE Sensex"],
    topStocks: [
      { symbol: "INFY", name: "Infosys", sector: "Technology", price: 21.40, change: 0.85, marketCap: "$90B", exchange: "NYSE" },
      { symbol: "WIT", name: "Wipro", sector: "Technology", price: 6.82, change: 0.30, marketCap: "$35B", exchange: "NYSE" },
      { symbol: "HDB", name: "HDFC Bank", sector: "Financials", price: 65.30, change: 1.20, marketCap: "$174B", exchange: "NYSE" },
      { symbol: "TTM", name: "Tata Motors", sector: "Consumer Discretionary", price: 17.40, change: -0.58, marketCap: "$62B", exchange: "NYSE" },
      { symbol: "IBN", name: "ICICI Bank", sector: "Financials", price: 28.90, change: 0.72, marketCap: "$103B", exchange: "NYSE" },
    ],
  },
  {
    name: "South Korea",
    code: "KR",
    region: "Asia-Pacific",
    riskScore: 65,
    riskLevel: "elevated",
    riskDrivers: ["DPRK provocation risk", "Memory chip cycle", "China exposure"],
    marketSummary: "KOSPI is semiconductor-heavy. Samsung and SK Hynix define the index. Memory cycle recovery is the key catalyst.",
    currency: "KRW",
    indices: ["KOSPI", "KOSDAQ"],
    topStocks: [
      { symbol: "SSNLF", name: "Samsung Electronics", sector: "Technology", price: 43.20, change: 1.30, marketCap: "$248B", exchange: "OTC" },
      { symbol: "HYMTF", name: "Hyundai Motor", sector: "Consumer Discretionary", price: 21.80, change: -0.45, marketCap: "$40B", exchange: "OTC" },
      { symbol: "HXSCF", name: "SK Hynix", sector: "Technology", price: 102.40, change: 2.85, marketCap: "$74B", exchange: "OTC" },
      { symbol: "034220.KS", name: "LG Display", sector: "Technology", price: 8.60, change: -1.20, marketCap: "$5B", exchange: "KRX" },
    ],
  },
  {
    name: "Taiwan",
    code: "TW",
    region: "Asia-Pacific",
    riskScore: 74,
    riskLevel: "high",
    riskDrivers: ["Cross-strait tensions", "Semiconductor concentration risk", "US-China tech war"],
    marketSummary: "TWSE is dominated by TSMC (~30% weight). Global AI buildout is the tailwind; any strait escalation is the tail risk.",
    currency: "TWD",
    indices: ["TWSE Weighted Index"],
    topStocks: [
      { symbol: "TSM", name: "Taiwan Semiconductor", sector: "Technology", price: 168.40, change: 1.95, marketCap: "$873B", exchange: "NYSE" },
      { symbol: "UMC", name: "United Microelectronics", sector: "Technology", price: 7.62, change: 0.40, marketCap: "$18B", exchange: "NYSE" },
      { symbol: "ASX", name: "Advanced Semiconductor Eng.", sector: "Technology", price: 9.84, change: 0.82, marketCap: "$14B", exchange: "NYSE" },
    ],
  },
  {
    name: "Canada",
    code: "CA",
    region: "Americas",
    riskScore: 50,
    riskLevel: "medium",
    riskDrivers: ["US tariff exposure", "Housing market correction", "Energy price dependency"],
    marketSummary: "TSX skews energy and financials. Shopify adds a growth tech dynamic. USD/CAD FX is key for cross-listed names.",
    currency: "CAD",
    indices: ["S&P/TSX Composite"],
    topStocks: [
      { symbol: "SHOP", name: "Shopify", sector: "Technology", price: 84.20, change: 1.62, marketCap: "$107B", exchange: "NYSE" },
      { symbol: "RY", name: "Royal Bank of Canada", sector: "Financials", price: 115.40, change: 0.28, marketCap: "$161B", exchange: "NYSE" },
      { symbol: "CNQ", name: "Canadian Natural Resources", sector: "Energy", price: 35.20, change: -0.84, marketCap: "$66B", exchange: "NYSE" },
      { symbol: "TD", name: "TD Bank Group", sector: "Financials", price: 54.80, change: -0.35, marketCap: "$95B", exchange: "NYSE" },
      { symbol: "SU", name: "Suncor Energy", sector: "Energy", price: 42.60, change: -0.62, marketCap: "$52B", exchange: "NYSE" },
    ],
  },
  {
    name: "Australia",
    code: "AU",
    region: "Asia-Pacific",
    riskScore: 45,
    riskLevel: "low",
    riskDrivers: ["China commodity demand", "RBA rate path", "Housing affordability"],
    marketSummary: "ASX 200 is mining and banking dominated. BHP and iron ore prices are leading indicators for the index.",
    currency: "AUD",
    indices: ["ASX 200", "ASX 300"],
    topStocks: [
      { symbol: "BHP", name: "BHP Group", sector: "Materials", price: 52.40, change: -1.28, marketCap: "$131B", exchange: "NYSE" },
      { symbol: "RIO", name: "Rio Tinto", sector: "Materials", price: 62.45, change: -1.15, marketCap: "$101B", exchange: "NYSE" },
      { symbol: "ANZBY", name: "ANZ Banking Group", sector: "Financials", price: 16.20, change: 0.25, marketCap: "$47B", exchange: "OTC" },
      { symbol: "WDS", name: "Woodside Energy", sector: "Energy", price: 13.80, change: -0.72, marketCap: "$27B", exchange: "NYSE" },
    ],
  },
  {
    name: "Brazil",
    code: "BR",
    region: "Americas",
    riskScore: 68,
    riskLevel: "elevated",
    riskDrivers: ["Fiscal deficit concerns", "BRL weakness", "Political uncertainty"],
    marketSummary: "Bovespa is commodity-heavy. Petrobras and Vale move with oil and iron ore. Fiscal path is the macro wildcard.",
    currency: "BRL",
    indices: ["Bovespa (IBOVESPA)"],
    topStocks: [
      { symbol: "PBR", name: "Petrobras", sector: "Energy", price: 12.80, change: -0.78, marketCap: "$83B", exchange: "NYSE" },
      { symbol: "VALE", name: "Vale SA", sector: "Materials", price: 9.62, change: -1.35, marketCap: "$44B", exchange: "NYSE" },
      { symbol: "ITUB", name: "Itaú Unibanco", sector: "Financials", price: 6.42, change: 0.47, marketCap: "$63B", exchange: "NYSE" },
      { symbol: "ABEV", name: "Ambev", sector: "Consumer Staples", price: 2.18, change: 0.92, marketCap: "$34B", exchange: "NYSE" },
    ],
  },
  {
    name: "Russia",
    code: "RU",
    region: "Eastern Europe",
    riskScore: 88,
    riskLevel: "critical",
    riskDrivers: ["War in Ukraine", "Western sanctions", "Capital controls", "Ruble instability"],
    marketSummary: "MOEX is isolated from global capital markets. Sanctioned entities dominate. Only indirect exposure available via energy proxies.",
    currency: "RUB",
    indices: ["MOEX Russia"],
    topStocks: [
      { symbol: "OGZPY", name: "Gazprom (ADR halted)", sector: "Energy", price: 0.45, change: 0.00, marketCap: "N/A", exchange: "OTC" },
      { symbol: "LUKOY", name: "Lukoil (ADR restricted)", sector: "Energy", price: 41.20, change: 0.00, marketCap: "N/A", exchange: "OTC" },
    ],
  },
  {
    name: "Saudi Arabia",
    code: "SA",
    region: "Middle East",
    riskScore: 72,
    riskLevel: "high",
    riskDrivers: ["Strait of Hormuz proximity", "Oil price dependency", "Regional conflict spillover"],
    marketSummary: "Tadawul is oil and petrochemical dominated. Saudi Aramco is the anchor. Vision 2030 diversification is a multi-year re-rating story.",
    currency: "SAR",
    indices: ["Tadawul (TASI)"],
    topStocks: [
      { symbol: "2222.SR", name: "Saudi Aramco", sector: "Energy", price: 27.85, change: 0.18, marketCap: "$1.8T", exchange: "Tadawul" },
      { symbol: "2010.SR", name: "SABIC", sector: "Materials", price: 70.40, change: -0.55, marketCap: "$56B", exchange: "Tadawul" },
      { symbol: "1180.SR", name: "Al Rajhi Bank", sector: "Financials", price: 92.60, change: 0.65, marketCap: "$73B", exchange: "Tadawul" },
    ],
  },
  {
    name: "Netherlands",
    code: "NL",
    region: "Europe",
    riskScore: 58,
    riskLevel: "medium",
    riskDrivers: ["ASML export controls", "ECB policy", "Energy transition"],
    marketSummary: "AEX is ASML-dominated. Semiconductor equipment export restrictions are a key regulatory risk.",
    currency: "EUR",
    indices: ["AEX"],
    topStocks: [
      { symbol: "ASML", name: "ASML Holding", sector: "Technology", price: 724.60, change: 2.84, marketCap: "$284B", exchange: "NASDAQ" },
      { symbol: "SHEL", name: "Shell plc", sector: "Energy", price: 68.40, change: -0.42, marketCap: "$209B", exchange: "NYSE" },
      { symbol: "PHG", name: "Philips", sector: "Health Care", price: 24.80, change: 1.15, marketCap: "$22B", exchange: "NYSE" },
      { symbol: "ING", name: "ING Groep", sector: "Financials", price: 16.82, change: 0.24, marketCap: "$62B", exchange: "NYSE" },
    ],
  },
  {
    name: "Mexico",
    code: "MX",
    region: "Americas",
    riskScore: 64,
    riskLevel: "elevated",
    riskDrivers: ["US tariff exposure (USMCA)", "Nearshoring boom vs risk", "Peso volatility"],
    marketSummary: "IPC benefiting from nearshoring tailwinds but US tariff policy creates binary outcome risk.",
    currency: "MXN",
    indices: ["IPC (S&P/BMV)"],
    topStocks: [
      { symbol: "AMX", name: "América Móvil", sector: "Communication Services", price: 16.20, change: 0.12, marketCap: "$54B", exchange: "NYSE" },
      { symbol: "BSMX", name: "Banco Santander México", sector: "Financials", price: 7.40, change: -0.27, marketCap: "$8B", exchange: "NYSE" },
      { symbol: "GRUMAB", name: "Gruma (corn)", sector: "Consumer Staples", price: 11.80, change: 0.55, marketCap: "$4B", exchange: "OTC" },
    ],
  },
  {
    name: "South Africa",
    code: "ZA",
    region: "Africa",
    riskScore: 70,
    riskLevel: "high",
    riskDrivers: ["Load-shedding / power crisis", "Political uncertainty", "USD-denominated debt"],
    marketSummary: "JSE is resource and financial heavy. Power infrastructure failures create structural drag on all sectors.",
    currency: "ZAR",
    indices: ["JSE All Share"],
    topStocks: [
      { symbol: "ANGPY", name: "Anglo American (ADR)", sector: "Materials", price: 18.40, change: -2.10, marketCap: "$27B", exchange: "OTC" },
      { symbol: "GOLD", name: "Harmony Gold (ADR)", sector: "Materials", price: 12.80, change: 1.45, marketCap: "$7B", exchange: "NYSE" },
      { symbol: "NPN", name: "Naspers (JSE)", sector: "Technology", price: 142.00, change: 0.85, marketCap: "$45B", exchange: "JSE" },
    ],
  },
  {
    name: "Singapore",
    code: "SG",
    region: "Asia-Pacific",
    riskScore: 40,
    riskLevel: "low",
    riskDrivers: ["Regional shipping exposure", "MAS tightening cycle"],
    marketSummary: "STI is a regional financial and logistics hub. DBS, OCBC and Grab represent banking, wealth management and tech.",
    currency: "SGD",
    indices: ["Straits Times Index (STI)"],
    topStocks: [
      { symbol: "DBSDY", name: "DBS Group (ADR)", sector: "Financials", price: 36.80, change: 0.65, marketCap: "$93B", exchange: "OTC" },
      { symbol: "GRAB", name: "Grab Holdings", sector: "Technology", price: 4.82, change: 1.68, marketCap: "$19B", exchange: "NASDAQ" },
      { symbol: "SE", name: "Sea Limited", sector: "Technology", price: 84.40, change: 3.20, marketCap: "$47B", exchange: "NYSE" },
    ],
  },
  {
    name: "Indonesia",
    code: "ID",
    region: "Asia-Pacific",
    riskScore: 55,
    riskLevel: "medium",
    riskDrivers: ["Commodity export reliance", "IDR pressure", "Political transition risk"],
    marketSummary: "JCI is driven by nickel, palm oil, and banking. Indonesia is a key player in EV battery supply chains via nickel.",
    currency: "IDR",
    indices: ["Jakarta Composite (JCI)"],
    topStocks: [
      { symbol: "TLKM", name: "Telkom Indonesia (ADR)", sector: "Communication Services", price: 18.20, change: -0.55, marketCap: "$16B", exchange: "NYSE" },
      { symbol: "PTNRY", name: "PT Aneka Tambang (nickel)", sector: "Materials", price: 0.48, change: -1.04, marketCap: "$2B", exchange: "OTC" },
    ],
  },
  {
    name: "Argentina",
    code: "AR",
    region: "Americas",
    riskScore: 82,
    riskLevel: "critical",
    riskDrivers: ["Hyperinflation", "IMF program uncertainty", "Debt restructuring risk"],
    marketSummary: "Merval in USD terms is volatile. Dollarization thesis under Milei is the key re-rating catalyst. Very high risk, very high potential.",
    currency: "ARS",
    indices: ["MERVAL"],
    topStocks: [
      { symbol: "YPF", name: "YPF SA (Vaca Muerta)", sector: "Energy", price: 28.40, change: 4.20, marketCap: "$11B", exchange: "NYSE" },
      { symbol: "GGAL", name: "Grupo Financiero Galicia", sector: "Financials", price: 47.20, change: 3.15, marketCap: "$8B", exchange: "NASDAQ" },
      { symbol: "MELI", name: "MercadoLibre", sector: "Technology", price: 1842.00, change: 1.82, marketCap: "$93B", exchange: "NASDAQ" },
    ],
  },
];

/** Look up a country by its Natural Earth name */
export function findCountryMarket(geoName: string): CountryMarket | undefined {
  const normalized = geoName.toLowerCase().trim();
  return countryMarkets.find((c) =>
    c.name.toLowerCase() === normalized ||
    c.name.toLowerCase().includes(normalized) ||
    normalized.includes(c.name.toLowerCase().split(" ")[0].toLowerCase())
  );
}

export const RISK_COLORS: Record<RiskLevel, string> = {
  critical: "#ef4444",
  high: "#f97316",
  elevated: "#eab308",
  medium: "#3b82f6",
  low: "#22c55e",
};

export const RISK_LABEL: Record<RiskLevel, string> = {
  critical: "Critical",
  high: "High",
  elevated: "Elevated",
  medium: "Medium",
  low: "Low",
};
