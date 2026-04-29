/**
 * Maps VinnTrade internal symbols to Stooq query symbols.
 *
 * Stooq conventions:
 *   US stocks / ETFs / bonds  →  {symbol}.us   (e.g. gld.us, spy.us, tlt.us)
 *   Forex pairs               →  lowercase      (e.g. eurusd, usdjpy)
 *   DXY dollar index          →  dxy.i
 *   VIX volatility index      →  ^vix
 *   Crypto vs USD             →  {symbol}usd    (e.g. btcusd, ethusd)
 */

const FOREX_SYMBOLS = new Set([
  "EURUSD", "GBPUSD", "USDJPY", "USDCNY", "USDINR", "USDCHF",
  "AUDUSD", "USDCAD", "USDRUB", "USDTRY",
]);

const CRYPTO_SYMBOLS = new Set([
  "BTC", "ETH", "SOL", "BNB", "XRP", "DOGE", "ADA", "AVAX", "LINK",
]);

// ETFs that trade on US exchanges and should use .us suffix
const CRYPTO_ETFS = new Set(["IBIT", "GBTC", "ETHE"]);

const SPECIAL_MAP: Record<string, string> = {
  DXY: "dxy.i",
  VIX: "^vix",
};

export function toStooqSymbol(symbol: string): string {
  if (SPECIAL_MAP[symbol]) return SPECIAL_MAP[symbol];
  if (FOREX_SYMBOLS.has(symbol)) return symbol.toLowerCase();
  if (CRYPTO_SYMBOLS.has(symbol) && !CRYPTO_ETFS.has(symbol)) {
    return `${symbol.toLowerCase()}usd`;
  }
  // All US-listed equities, ETFs, and bond funds
  return `${symbol.toLowerCase()}.us`;
}
