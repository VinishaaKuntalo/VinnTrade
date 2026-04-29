/**
 * Display currency for a ticker symbol (US equities default USD; forex / .TO use mapping).
 * Client-safe — no server-only imports.
 */

const FOREX_QUOTE_CCY: Record<string, string> = {
  EURUSD: "USD",
  GBPUSD: "USD",
  AUDUSD: "USD",
  NZDUSD: "USD",
  USDCAD: "CAD",
  USDJPY: "JPY",
  USDCHF: "CHF",
  USDCNY: "CNY",
  USDINR: "INR",
  USDRUB: "RUB",
  USDTRY: "TRY",
};

export function instrumentCurrency(symbol: string): string {
  const u = symbol.toUpperCase().replace(/\s/g, "");
  if (u.endsWith(".TO") || u.endsWith(".V")) return "CAD";
  if (FOREX_QUOTE_CCY[u]) return FOREX_QUOTE_CCY[u];
  return "USD";
}

export function formatInstrumentPrice(amount: number, currency: string): string {
  const c = currency.toUpperCase();
  const n = amount.toLocaleString("en-US", {
    minimumFractionDigits: c === "JPY" ? 0 : 2,
    maximumFractionDigits: c === "JPY" ? 0 : 2,
  });
  if (c === "USD") return `$${n}`;
  if (c === "CAD") return `C$${n}`;
  if (c === "JPY") return `¥${n}`;
  if (c === "GBP") return `£${n}`;
  if (c === "EUR") return `€${n}`;
  return `${n} ${c}`;
}
