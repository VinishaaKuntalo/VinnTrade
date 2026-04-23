/**
 * Maps VinnTrade internal symbol strings to Yahoo Finance query symbols.
 * Yahoo Finance quirks:
 *   - Crypto:   BTC  → BTC-USD
 *   - Forex:    EURUSD → EURUSD=X
 *   - Indices:  VIX → ^VIX, DJI → ^DJI
 *   - Regular stocks/ETFs: as-is
 */

const CRYPTO_SYMBOLS = new Set([
  "BTC","ETH","SOL","BNB","XRP","DOGE","ADA","AVAX","LINK",
]);

const FOREX_SYMBOLS = new Set([
  "EURUSD","GBPUSD","USDJPY","USDCNY","USDINR","USDCHF",
  "AUDUSD","USDCAD","USDRUB","USDTRY","DXY",
]);

const INDEX_MAP: Record<string, string> = {
  VIX:   "^VIX",
  DJI:   "^DJI",
  SPX:   "^GSPC",
  NDX:   "^NDX",
  COMP:  "^IXIC",
  // ETF proxies already work as-is (SPY, QQQ etc.)
};

// Symbols that are crypto ETFs — leave as-is (they trade on exchanges)
const CRYPTO_ETFS = new Set(["IBIT","GBTC","ETHE"]);

export function toYahooSymbol(symbol: string): string {
  if (INDEX_MAP[symbol]) return INDEX_MAP[symbol];
  if (CRYPTO_SYMBOLS.has(symbol) && !CRYPTO_ETFS.has(symbol)) return `${symbol}-USD`;
  if (FOREX_SYMBOLS.has(symbol)) return `${symbol}=X`;
  return symbol;
}

export function yahooSupportedAssetClass(assetClass: string): boolean {
  // All classes we list are supported on Yahoo Finance
  return true;
}
