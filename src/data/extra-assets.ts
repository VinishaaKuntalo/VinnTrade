/**
 * Non-S&P-500 tradeable assets for the signals page.
 * Prices are typical reference levels — educational demo only.
 */
import type { AssetClass } from "@/types/signals";

export interface ExtraAsset {
  symbol: string;
  name: string;
  assetClass: AssetClass;
  sector: string;          // used for geo trigger mapping
  subIndustry: string;
  typicalPrice: number;    // reference level for trade calc
  hq: string;
}

export const EXTRA_ASSETS: ExtraAsset[] = [
  /* ── COMMODITIES ─────────────────────────────────────────── */
  { symbol: "GLD",   name: "Gold (SPDR)",              assetClass: "Commodities", sector: "Commodities", subIndustry: "Precious Metals",        typicalPrice: 226,    hq: "United States" },
  { symbol: "SLV",   name: "Silver (iShares)",         assetClass: "Commodities", sector: "Commodities", subIndustry: "Precious Metals",        typicalPrice: 27.5,   hq: "United States" },
  { symbol: "GDXC",  name: "VanEck Gold Miners (Comm)", assetClass: "Commodities", sector: "Commodities", subIndustry: "Gold Mining",            typicalPrice: 40.8,   hq: "United States" },
  { symbol: "USO",   name: "US Oil Fund",              assetClass: "Commodities", sector: "Energy",      subIndustry: "Crude Oil",              typicalPrice: 74.2,   hq: "United States" },
  { symbol: "UNG",   name: "US Natural Gas Fund",      assetClass: "Commodities", sector: "Energy",      subIndustry: "Natural Gas",            typicalPrice: 15.4,   hq: "United States" },
  { symbol: "CPER",  name: "Copper Strategy ETF",      assetClass: "Commodities", sector: "Materials",   subIndustry: "Copper",                 typicalPrice: 28.6,   hq: "United States" },
  { symbol: "WEAT",  name: "Teucrium Wheat",           assetClass: "Commodities", sector: "Consumer Staples", subIndustry: "Agricultural",      typicalPrice: 5.9,    hq: "United States" },
  { symbol: "CORN",  name: "Teucrium Corn",            assetClass: "Commodities", sector: "Consumer Staples", subIndustry: "Agricultural",      typicalPrice: 22.1,   hq: "United States" },
  { symbol: "SOYB",  name: "Teucrium Soybean",         assetClass: "Commodities", sector: "Consumer Staples", subIndustry: "Agricultural",      typicalPrice: 26.4,   hq: "United States" },
  { symbol: "PDBC",  name: "Invesco Commodity Fund",   assetClass: "Commodities", sector: "Commodities", subIndustry: "Diversified Commodities", typicalPrice: 15.6,  hq: "United States" },
  { symbol: "GUNR",  name: "FlexShares Natural Res",   assetClass: "Commodities", sector: "Energy",      subIndustry: "Natural Resources",      typicalPrice: 38.1,   hq: "United States" },
  { symbol: "PPLT",  name: "Platinum (abrdn)",         assetClass: "Commodities", sector: "Commodities", subIndustry: "Precious Metals",        typicalPrice: 94.5,   hq: "United States" },

  /* ── EQUITY INDICES ──────────────────────────────────────── */
  { symbol: "SPY",   name: "S&P 500 (SPDR)",           assetClass: "Indices",     sector: "Financials",  subIndustry: "Broad Market",          typicalPrice: 538,    hq: "United States" },
  { symbol: "QQQ",   name: "Nasdaq 100 (Invesco)",     assetClass: "Indices",     sector: "Information Technology", subIndustry: "Tech-Heavy Index", typicalPrice: 465, hq: "United States" },
  { symbol: "IWM",   name: "Russell 2000 (iShares)",   assetClass: "Indices",     sector: "Financials",  subIndustry: "Small Cap",             typicalPrice: 198,    hq: "United States" },
  { symbol: "DIA",   name: "Dow Jones (SPDR)",         assetClass: "Indices",     sector: "Financials",  subIndustry: "Blue Chip Index",       typicalPrice: 426,    hq: "United States" },
  { symbol: "EEM",   name: "Emerging Markets (iShares)", assetClass: "Indices",   sector: "Financials",  subIndustry: "Emerging Markets",      typicalPrice: 41.8,   hq: "United States" },
  { symbol: "EWJ",   name: "Japan (iShares)",          assetClass: "Indices",     sector: "Financials",  subIndustry: "Japan Index",           typicalPrice: 66.4,   hq: "Japan" },
  { symbol: "FXI",   name: "China Large-Cap (iShares)",assetClass: "Indices",     sector: "Financials",  subIndustry: "China Index",           typicalPrice: 33.5,   hq: "China" },
  { symbol: "EWZ",   name: "Brazil (iShares)",         assetClass: "Indices",     sector: "Financials",  subIndustry: "Brazil Index",          typicalPrice: 27.9,   hq: "Brazil" },
  { symbol: "EWG",   name: "Germany (iShares)",        assetClass: "Indices",     sector: "Financials",  subIndustry: "Germany Index",         typicalPrice: 34.2,   hq: "Germany" },
  { symbol: "VIX",   name: "CBOE Volatility Index",    assetClass: "Indices",     sector: "Financials",  subIndustry: "Volatility",            typicalPrice: 18.5,   hq: "United States" },
  { symbol: "KWEB",  name: "KraneShares CSI Internet", assetClass: "Indices",     sector: "Information Technology", subIndustry: "China Internet", typicalPrice: 32.4, hq: "China" },

  /* ── ETFs ────────────────────────────────────────────────── */
  { symbol: "XLE",   name: "Energy Select Sector",     assetClass: "ETFs",        sector: "Energy",      subIndustry: "Energy ETF",            typicalPrice: 88.6,   hq: "United States" },
  { symbol: "XLF",   name: "Financial Select Sector",  assetClass: "ETFs",        sector: "Financials",  subIndustry: "Financials ETF",        typicalPrice: 44.8,   hq: "United States" },
  { symbol: "XLK",   name: "Technology Select Sector", assetClass: "ETFs",        sector: "Information Technology", subIndustry: "Tech ETF",    typicalPrice: 215,    hq: "United States" },
  { symbol: "XLV",   name: "Health Care Select",       assetClass: "ETFs",        sector: "Health Care", subIndustry: "Health Care ETF",       typicalPrice: 148,    hq: "United States" },
  { symbol: "XLI",   name: "Industrials Select",       assetClass: "ETFs",        sector: "Industrials", subIndustry: "Industrials ETF",       typicalPrice: 134,    hq: "United States" },
  { symbol: "XLU",   name: "Utilities Select",         assetClass: "ETFs",        sector: "Utilities",   subIndustry: "Utilities ETF",         typicalPrice: 72.4,   hq: "United States" },
  { symbol: "ARKK",  name: "ARK Innovation ETF",       assetClass: "ETFs",        sector: "Information Technology", subIndustry: "Disruptive Tech", typicalPrice: 42.1, hq: "United States" },
  { symbol: "IHYG",  name: "iShares High Yield Corp",  assetClass: "ETFs",        sector: "Financials",  subIndustry: "High Yield Credit ETF", typicalPrice: 78.5,   hq: "United States" },
  { symbol: "SOXX",  name: "iShares Semiconductor",    assetClass: "ETFs",        sector: "Information Technology", subIndustry: "Semiconductors ETF", typicalPrice: 198, hq: "United States" },
  { symbol: "ITB",   name: "iShares Home Construction",assetClass: "ETFs",        sector: "Consumer Discretionary", subIndustry: "Homebuilders ETF", typicalPrice: 92.3, hq: "United States" },
  { symbol: "GDX",   name: "VanEck Gold Miners ETF",   assetClass: "ETFs",        sector: "Materials",   subIndustry: "Gold Miners ETF",       typicalPrice: 40.8,   hq: "United States" },
  { symbol: "TAN",   name: "Invesco Solar ETF",        assetClass: "ETFs",        sector: "Utilities",   subIndustry: "Solar Energy",          typicalPrice: 38.2,   hq: "United States" },

  /* ── FOREX ───────────────────────────────────────────────── */
  { symbol: "EURUSD", name: "Euro / US Dollar",        assetClass: "Forex",       sector: "Financials",  subIndustry: "Major FX Pair",         typicalPrice: 1.085,  hq: "Europe" },
  { symbol: "GBPUSD", name: "Pound / US Dollar",       assetClass: "Forex",       sector: "Financials",  subIndustry: "Major FX Pair",         typicalPrice: 1.262,  hq: "United Kingdom" },
  { symbol: "USDJPY", name: "US Dollar / Japanese Yen",assetClass: "Forex",       sector: "Financials",  subIndustry: "Major FX Pair",         typicalPrice: 154.2,  hq: "Japan" },
  { symbol: "USDCNY", name: "US Dollar / Chinese Yuan",assetClass: "Forex",       sector: "Financials",  subIndustry: "EM FX Pair",            typicalPrice: 7.24,   hq: "China" },
  { symbol: "USDINR", name: "US Dollar / Indian Rupee",assetClass: "Forex",       sector: "Financials",  subIndustry: "EM FX Pair",            typicalPrice: 83.5,   hq: "India" },
  { symbol: "USDCHF", name: "US Dollar / Swiss Franc", assetClass: "Forex",       sector: "Financials",  subIndustry: "Major FX Pair",         typicalPrice: 0.892,  hq: "Switzerland" },
  { symbol: "AUDUSD", name: "Australian Dollar / USD", assetClass: "Forex",       sector: "Financials",  subIndustry: "Commodity FX",          typicalPrice: 0.644,  hq: "Australia" },
  { symbol: "USDCAD", name: "US Dollar / Canadian Dollar", assetClass: "Forex",   sector: "Financials",  subIndustry: "Commodity FX",          typicalPrice: 1.362,  hq: "Canada" },
  { symbol: "USDRUB", name: "US Dollar / Russian Ruble",assetClass: "Forex",      sector: "Financials",  subIndustry: "Sanctioned FX",         typicalPrice: 92.8,   hq: "Russia" },
  { symbol: "USDTRY", name: "US Dollar / Turkish Lira",assetClass: "Forex",       sector: "Financials",  subIndustry: "EM FX Pair",            typicalPrice: 32.6,   hq: "Turkey" },
  { symbol: "DXY",   name: "US Dollar Index",          assetClass: "Forex",       sector: "Financials",  subIndustry: "Dollar Index",          typicalPrice: 104.2,  hq: "United States" },

  /* ── CRYPTO ──────────────────────────────────────────────── */
  { symbol: "BTC",   name: "Bitcoin",                  assetClass: "Crypto",      sector: "Financials",  subIndustry: "Store of Value",        typicalPrice: 67400,  hq: "Decentralised" },
  { symbol: "ETH",   name: "Ethereum",                 assetClass: "Crypto",      sector: "Financials",  subIndustry: "Smart Contract Platform",typicalPrice: 3420,  hq: "Decentralised" },
  { symbol: "SOL",   name: "Solana",                   assetClass: "Crypto",      sector: "Financials",  subIndustry: "Layer 1 Blockchain",    typicalPrice: 182,    hq: "Decentralised" },
  { symbol: "BNB",   name: "BNB (Binance)",            assetClass: "Crypto",      sector: "Financials",  subIndustry: "Exchange Token",        typicalPrice: 598,    hq: "Cayman Islands" },
  { symbol: "XRP",   name: "Ripple",                   assetClass: "Crypto",      sector: "Financials",  subIndustry: "Payments Crypto",       typicalPrice: 0.542,  hq: "United States" },
  { symbol: "DOGE",  name: "Dogecoin",                 assetClass: "Crypto",      sector: "Financials",  subIndustry: "Meme Crypto",           typicalPrice: 0.162,  hq: "Decentralised" },
  { symbol: "ADA",   name: "Cardano",                  assetClass: "Crypto",      sector: "Financials",  subIndustry: "Layer 1 Blockchain",    typicalPrice: 0.462,  hq: "Decentralised" },
  { symbol: "AVAX",  name: "Avalanche",                assetClass: "Crypto",      sector: "Financials",  subIndustry: "Layer 1 Blockchain",    typicalPrice: 37.4,   hq: "Decentralised" },
  { symbol: "LINK",  name: "Chainlink",                assetClass: "Crypto",      sector: "Financials",  subIndustry: "Oracle Network",        typicalPrice: 14.8,   hq: "Decentralised" },
  { symbol: "IBIT",  name: "iShares Bitcoin Trust",    assetClass: "Crypto",      sector: "Financials",  subIndustry: "Bitcoin ETF",           typicalPrice: 38.2,   hq: "United States" },

  /* ── BONDS ───────────────────────────────────────────────── */
  { symbol: "TLT",   name: "iShares 20+ Year Treasury",assetClass: "Bonds",       sector: "Financials",  subIndustry: "Long Duration Treasury", typicalPrice: 92.8,  hq: "United States" },
  { symbol: "IEF",   name: "iShares 7-10 Year Treasury",assetClass: "Bonds",      sector: "Financials",  subIndustry: "Medium Duration Treasury",typicalPrice: 97.4, hq: "United States" },
  { symbol: "SHY",   name: "iShares 1-3 Year Treasury",assetClass: "Bonds",       sector: "Financials",  subIndustry: "Short Duration Treasury",typicalPrice: 81.5,  hq: "United States" },
  { symbol: "LQD",   name: "iShares IG Corporate Bond",assetClass: "Bonds",       sector: "Financials",  subIndustry: "Investment Grade Credit",typicalPrice: 108.2, hq: "United States" },
  { symbol: "HYG",   name: "iShares High Yield Bond",  assetClass: "Bonds",       sector: "Financials",  subIndustry: "High Yield Credit",     typicalPrice: 78.5,   hq: "United States" },
  { symbol: "EMB",   name: "iShares EM Bond",          assetClass: "Bonds",       sector: "Financials",  subIndustry: "Emerging Market Debt",  typicalPrice: 88.3,   hq: "United States" },
  { symbol: "TIPS",  name: "iShares TIPS Bond",        assetClass: "Bonds",       sector: "Financials",  subIndustry: "Inflation-Protected",   typicalPrice: 107.6,  hq: "United States" },
  { symbol: "BND",   name: "Vanguard Total Bond",      assetClass: "Bonds",       sector: "Financials",  subIndustry: "Broad Bond Market",     typicalPrice: 73.8,   hq: "United States" },
  { symbol: "BNDX",  name: "Vanguard Intl Bond",       assetClass: "Bonds",       sector: "Financials",  subIndustry: "International Bonds",   typicalPrice: 47.2,   hq: "United States" },
  { symbol: "MUB",   name: "iShares Muni Bond",        assetClass: "Bonds",       sector: "Financials",  subIndustry: "Municipal Bond",        typicalPrice: 108.9,  hq: "United States" },
];
