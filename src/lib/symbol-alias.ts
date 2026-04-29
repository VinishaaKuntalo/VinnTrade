/**
 * Normalize common misspellings / company names to tradeable US symbols.
 */

const US_EQUITY_ALIASES: Record<string, string> = {
  TESLA: "TSLA",
  TESLAY: "TSLA",
  GOOGLE: "GOOGL",
  ALPHABET: "GOOGL",
  FACEBOOK: "META",
  FB: "META",
  MICROSOFT: "MSFT",
  APPLE: "AAPL",
  AMAZON: "AMZN",
  NETFLIX: "NFLX",
  NVIDIA: "NVDA",
  BOEING: "BA",
  DISNEY: "DIS",
  WALMART: "WMT",
  JPMORGAN: "JPM",
  BERKSHIRE: "BRK-B",
};

/**
 * @param rawFromRoute — URL segment (may be encoded once)
 */
export function canonicalUsEquitySymbol(rawFromRoute: string): string {
  const u = decodeURIComponent(rawFromRoute).trim().toUpperCase().replace(/\s/g, "");
  return US_EQUITY_ALIASES[u] ?? u;
}
