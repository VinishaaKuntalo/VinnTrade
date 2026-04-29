/**
 * Technical indicator computations — pure functions, no external deps.
 * All inputs are arrays of numbers (close prices, highs, lows, volumes).
 */

/* ── EMA ───────────────────────────────────────────────── */
export function ema(data: number[], period: number): number[] {
  if (data.length < period) return [];
  const k = 2 / (period + 1);
  const result: number[] = [];
  let val = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result.push(val);
  for (let i = period; i < data.length; i++) {
    val = data[i] * k + val * (1 - k);
    result.push(val);
  }
  return result;
}

/* ── SMA ───────────────────────────────────────────────── */
export function sma(data: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    result.push(slice.reduce((a, b) => a + b, 0) / period);
  }
  return result;
}

/* ── RSI (Wilder smoothing) ────────────────────────────── */
export function rsi(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  const changes = closes.slice(1).map((c, i) => c - closes[i]);
  const gains = changes.map((c) => (c > 0 ? c : 0));
  const losses = changes.map((c) => (c < 0 ? -c : 0));

  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = period; i < changes.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/* ── MACD ──────────────────────────────────────────────── */
export interface MACDResult {
  macdLine: number;   // EMA12 - EMA26
  signalLine: number; // EMA9 of MACD
  histogram: number;  // macdLine - signalLine
}

export function macd(
  closes: number[],
  fast = 12,
  slow = 26,
  signal = 9
): MACDResult | null {
  const ema12 = ema(closes, fast);
  const ema26 = ema(closes, slow);
  if (ema12.length < signal || ema26.length < 1) return null;

  // align: ema26 starts slow-1 bars after ema12 starts (fast-1 bars in)
  const offset = slow - fast;
  const macdLine = ema12.slice(offset).map((v, i) => v - ema26[i]);
  if (macdLine.length < signal) return null;

  const signalArr = ema(macdLine, signal);
  if (signalArr.length === 0) return null;

  const last = macdLine[macdLine.length - 1];
  const sig  = signalArr[signalArr.length - 1];
  return { macdLine: last, signalLine: sig, histogram: last - sig };
}

/* ── ATR ───────────────────────────────────────────────── */
export function atr(
  highs: number[],
  lows: number[],
  closes: number[],
  period = 14
): number {
  if (closes.length < period + 1) return closes[closes.length - 1] * 0.02;
  const trs: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    trs.push(
      Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1])
      )
    );
  }
  // Wilder smoothed ATR
  let val = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < trs.length; i++) {
    val = (val * (period - 1) + trs[i]) / period;
  }
  return val;
}

/* ── RSI series (full array, for charting) ─────────────── */
export function rsiSeries(closes: number[], period = 14): number[] {
  if (closes.length < period + 1) return closes.map(() => 50);
  const result: number[] = new Array(period).fill(50);
  const changes = closes.slice(1).map((c, i) => c - closes[i]);
  const gains = changes.map((c) => (c > 0 ? c : 0));
  const losses = changes.map((c) => (c < 0 ? -c : 0));

  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
  const rs0 = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  result.push(rs0);

  for (let i = period; i < changes.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    result.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
  }
  return result;
}

/* ── MACD series (full arrays, for charting) ───────────── */
export interface MACDSeries {
  macd: number[];
  signal: number[];
  histogram: number[];
  offset: number; // how many leading bars are empty (NaN)
}

export function macdSeries(
  closes: number[],
  fast = 12,
  slow = 26,
  signalPeriod = 9
): MACDSeries {
  const ema12 = ema(closes, fast);
  const ema26 = ema(closes, slow);
  const offset = slow - 1; // ema26 starts at index (slow-1)

  const macdLine: number[] = [];
  for (let i = 0; i < ema26.length; i++) {
    macdLine.push(ema12[i + (fast - 1 === 0 ? 0 : fast - slow + slow - fast)] - ema26[i]);
  }
  // Simpler alignment: ema12 length = closes.length - (fast-1), ema26 length = closes.length - (slow-1)
  // Recompute cleanly
  const m: number[] = [];
  const e12 = ema(closes, fast);    // length = closes.length - fast + 1
  const e26 = ema(closes, slow);    // length = closes.length - slow + 1
  const diff = fast - slow; // negative, e.g. 12-26=-14
  // e26 starts slow-1 bars in, e12 starts fast-1 bars in
  // align: e26[i] corresponds to e12[i - diff] = e12[i + (slow-fast)]
  for (let i = 0; i < e26.length; i++) {
    m.push(e12[i + (slow - fast)] - e26[i]);
  }
  const sig = ema(m, signalPeriod);
  const histOffset = slow - 1 + signalPeriod - 1;
  const hist = sig.map((s, i) => m[i + (signalPeriod - 1)] - s);

  return {
    macd: m,
    signal: sig,
    histogram: hist,
    offset: histOffset,
  };
}

/* ── Bollinger Bands series ────────────────────────────── */
export interface BollingerPoint {
  upper: number;
  middle: number;
  lower: number;
}

export function bollingerSeries(
  closes: number[],
  period = 20,
  stdDevMult = 2
): BollingerPoint[] {
  const result: BollingerPoint[] = [];
  for (let i = period - 1; i < closes.length; i++) {
    const slice = closes.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period;
    const std = Math.sqrt(variance);
    result.push({
      upper: mean + stdDevMult * std,
      middle: mean,
      lower: mean - stdDevMult * std,
    });
  }
  return result;
}

/* ── Momentum (Rate of Change) ─────────────────────────── */
export function roc(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 0;
  const prev = closes[closes.length - 1 - period];
  const curr = closes[closes.length - 1];
  return ((curr - prev) / prev) * 100;
}

/* ── Volume ratio ──────────────────────────────────────── */
export function volumeRatio(volumes: number[], shortPeriod = 5, longPeriod = 20): number {
  if (volumes.length < longPeriod) return 1;
  const short = volumes.slice(-shortPeriod).reduce((a, b) => a + b, 0) / shortPeriod;
  const long  = volumes.slice(-longPeriod).reduce((a, b) => a + b, 0) / longPeriod;
  return long > 0 ? short / long : 1;
}

/* ── Relative Strength (52-week position, 0-100) ───────── */
export function relativeStrength(closes: number[], period = 252): number {
  const slice = closes.slice(-Math.min(period, closes.length));
  const lo = Math.min(...slice);
  const hi = Math.max(...slice);
  if (hi === lo) return 50;
  return Math.round(((closes[closes.length - 1] - lo) / (hi - lo)) * 100);
}

/* ── Stochastic %K ─────────────────────────────────────── */
export function stochasticK(highs: number[], lows: number[], closes: number[], period = 14): number {
  if (closes.length < period) return 50;
  const recentH = highs.slice(-period);
  const recentL = lows.slice(-period);
  const hi = Math.max(...recentH);
  const lo = Math.min(...recentL);
  if (hi === lo) return 50;
  return Math.round(((closes[closes.length - 1] - lo) / (hi - lo)) * 100);
}

/* ── Williams %R (-100 to 0) ───────────────────────────── */
export function williamsR(highs: number[], lows: number[], closes: number[], period = 14): number {
  if (closes.length < period) return -50;
  const recentH = highs.slice(-period);
  const recentL = lows.slice(-period);
  const hi = Math.max(...recentH);
  const lo = Math.min(...recentL);
  if (hi === lo) return -50;
  return Math.round(((hi - closes[closes.length - 1]) / (hi - lo)) * -100);
}

/* ── Full-series helpers for charting (daily OHLCV) ─────── */

export function vwapSeries(
  bars: { high: number; low: number; close: number; volume: number }[]
): number[] {
  let cumPV = 0;
  let cumV = 0;
  const out: number[] = [];
  for (const b of bars) {
    const tp = (b.high + b.low + b.close) / 3;
    const v = Math.max(0, b.volume);
    cumPV += tp * v;
    cumV += v;
    out.push(cumV > 0 ? cumPV / cumV : b.close);
  }
  return out;
}

/** Wilder ATR per bar; NaN until first valid index. */
export function atrSeries(highs: number[], lows: number[], closes: number[], period = 14): number[] {
  const n = closes.length;
  const out: number[] = new Array(n).fill(NaN);
  if (n < period + 1) return out;
  const tr: number[] = [];
  for (let i = 1; i < n; i++) {
    tr.push(
      Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1])
      )
    );
  }
  let val = tr.slice(0, period).reduce((a, b) => a + b, 0) / period;
  out[period] = val;
  for (let i = period; i < tr.length; i++) {
    val = (val * (period - 1) + tr[i]) / period;
    out[i + 1] = val;
  }
  return out;
}

export function stochasticFull(
  highs: number[],
  lows: number[],
  closes: number[],
  kPeriod = 14,
  dPeriod = 3
): { k: number[]; d: number[] } {
  const n = closes.length;
  const k = new Array(n).fill(NaN);
  for (let i = kPeriod - 1; i < n; i++) {
    const hi = Math.max(...highs.slice(i - kPeriod + 1, i + 1));
    const lo = Math.min(...lows.slice(i - kPeriod + 1, i + 1));
    k[i] = hi === lo ? 50 : ((closes[i] - lo) / (hi - lo)) * 100;
  }
  const d = new Array(n).fill(NaN);
  const startD = kPeriod - 1 + dPeriod - 1;
  for (let i = startD; i < n; i++) {
    let s = 0;
    for (let j = 0; j < dPeriod; j++) s += k[i - j];
    d[i] = s / dPeriod;
  }
  return { k, d };
}

export function williamsRSeries(highs: number[], lows: number[], closes: number[], period = 14): number[] {
  const n = closes.length;
  const w = new Array(n).fill(NaN);
  for (let i = period - 1; i < n; i++) {
    const hi = Math.max(...highs.slice(i - period + 1, i + 1));
    const lo = Math.min(...lows.slice(i - period + 1, i + 1));
    w[i] = hi === lo ? -50 : ((hi - closes[i]) / (hi - lo)) * -100;
  }
  return w;
}

export function rocSeries(closes: number[], period = 14): number[] {
  const n = closes.length;
  const out = new Array(n).fill(NaN);
  for (let i = period; i < n; i++) {
    const prev = closes[i - period];
    out[i] = prev === 0 ? 0 : ((closes[i] - prev) / prev) * 100;
  }
  return out;
}

export function obvSeries(closes: number[], volumes: number[]): number[] {
  const out: number[] = [0];
  for (let i = 1; i < closes.length; i++) {
    let prev = out[out.length - 1];
    const v = volumes[i] ?? 0;
    if (closes[i] > closes[i - 1]) prev += v;
    else if (closes[i] < closes[i - 1]) prev -= v;
    out.push(prev);
  }
  return out;
}

/** ADX (Wilder-style); early bars default ~20. */
export function adxSeries(highs: number[], lows: number[], closes: number[], period = 14): number[] {
  const n = closes.length;
  const out = new Array(n).fill(20);
  if (n < period * 2 + 1) return out;

  const tr: number[] = new Array(n).fill(0);
  const plusDM: number[] = new Array(n).fill(0);
  const minusDM: number[] = new Array(n).fill(0);
  for (let i = 1; i < n; i++) {
    tr[i] = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    const up = highs[i] - highs[i - 1];
    const down = lows[i - 1] - lows[i];
    plusDM[i] = up > down && up > 0 ? up : 0;
    minusDM[i] = down > up && down > 0 ? down : 0;
  }

  let smTR = 0;
  let smPlus = 0;
  let smMinus = 0;
  for (let i = 1; i <= period; i++) {
    smTR += tr[i];
    smPlus += plusDM[i];
    smMinus += minusDM[i];
  }

  const dxVals: number[] = [];
  for (let i = period; i < n; i++) {
    if (i > period) {
      smTR = smTR - smTR / period + tr[i];
      smPlus = smPlus - smPlus / period + plusDM[i];
      smMinus = smMinus - smMinus / period + minusDM[i];
    }
    const pdi = smTR === 0 ? 0 : (100 * smPlus) / smTR;
    const mdi = smTR === 0 ? 0 : (100 * smMinus) / smTR;
    const t = pdi + mdi;
    dxVals.push(t === 0 ? 0 : (100 * Math.abs(pdi - mdi)) / t);
  }

  let adxSm = 0;
  for (let i = 0; i < dxVals.length; i++) {
    const barIdx = period + i;
    if (i < period) {
      adxSm += dxVals[i];
      if (i === period - 1) {
        adxSm /= period;
        out[barIdx] = adxSm;
      }
    } else {
      adxSm = (adxSm * (period - 1) + dxVals[i]) / period;
      out[barIdx] = adxSm;
    }
  }
  return out;
}

/* ── Alpha — 63-day momentum excess proxy (-100 to 100) ── */
export function alpha(closes: number[], period = 63): number {
  if (closes.length < period + 1) return 0;
  const r = roc(closes, period);
  // Normalise: ±30% move maps to ±100
  return Math.max(-100, Math.min(100, Math.round(r / 30 * 100)));
}

/* ── Beta — ATR-based volatility sensitivity (0-3) ─────── */
export function beta(highs: number[], lows: number[], closes: number[]): number {
  const atrVal = atr(highs, lows, closes, 20);
  const price  = closes[closes.length - 1];
  if (price === 0) return 1;
  // Annualise daily ATR and compare to ~1.5% baseline (S&P average daily ATR %)
  const dailyAtrPct = (atrVal / price) * 100;
  return Math.round((dailyAtrPct / 1.5) * 100) / 100;
}

/* ── Gamma — RSI momentum acceleration ─────────────────── */
export function gamma(closes: number[], lookback = 5): number {
  if (closes.length < 14 + lookback + 1) return 0;
  const rsiNow  = rsi(closes, 14);
  const rsiPrev = rsi(closes.slice(0, -lookback), 14);
  return Math.round((rsiNow - rsiPrev) * 10) / 10;
}

/* ── Theta — trend persistence score (0-100) ───────────── */
export function theta(closes: number[]): number {
  if (closes.length < 21) return 50;
  const emaArr = ema(closes, 20);
  const ema20  = emaArr[emaArr.length - 1];
  let streak = 0;
  const direction = closes[closes.length - 1] > ema20 ? 1 : -1;
  const emaFull = ema(closes, 20);
  for (let i = closes.length - 1; i >= closes.length - 20; i--) {
    const e = emaFull[emaFull.length - (closes.length - i)];
    if (e === undefined) break;
    if (direction === 1 && closes[i] > e) streak++;
    else if (direction === -1 && closes[i] < e) streak++;
    else break;
  }
  // 20-bar streak = 100; clamp 0-100
  return Math.round(Math.min(100, (streak / 20) * 100));
}

/* ── Signal scoring ────────────────────────────────────── */
export interface TechnicalSignal {
  direction: "BUY" | "SELL" | "HOLD";
  /** 50–95: higher when the winning side dominates per weighted indicator votes */
  confidence: number;
  rsiValue: number;
  macdHistogram: number;
  ema20: number;
  ema50: number;
  currentPrice: number;
  atrValue: number;
  momentumRoc: number;
  bullStrength: number;
  bearStrength: number;
  indicatorVotes: { label: string; vote: "BUY" | "SELL" | "HOLD"; weight: number }[];
  // Extended indicators
  rs: number;        // Relative Strength 0-100 (52-wk position)
  alphaScore: number;  // Excess momentum proxy -100 to 100
  betaScore: number;   // Volatility sensitivity (ATR-based, ~1.0 = market)
  gammaScore: number;  // RSI acceleration (change over 5 bars)
  thetaScore: number;  // Trend persistence 0-100
  stochK: number;    // Stochastic %K 0-100
  wR: number;        // Williams %R -100 to 0
}

export function scoreTechnicals(
  closes: number[],
  highs: number[],
  lows: number[],
  volumes: number[]
): TechnicalSignal {
  const price = closes[closes.length - 1];

  // compute indicators
  const rsiVal    = rsi(closes, 14);
  const macdRes   = macd(closes, 12, 26, 9);
  const ema20Arr  = ema(closes, 20);
  const ema50Arr  = ema(closes, 50);
  const atrVal    = atr(highs, lows, closes, 14);
  const rocVal    = roc(closes, 14);
  const volRatio  = volumeRatio(volumes, 5, 20);
  // Extended indicators
  const rsVal     = relativeStrength(closes, 252);
  const alphaVal  = alpha(closes, 63);
  const betaVal   = beta(highs, lows, closes);
  const gammaVal  = gamma(closes, 5);
  const thetaVal  = theta(closes);
  const stochKVal = stochasticK(highs, lows, closes, 14);
  const wRVal     = williamsR(highs, lows, closes, 14);

  const ema20Val  = ema20Arr.at(-1) ?? price;
  const ema50Val  = ema50Arr.at(-1) ?? price;

  // ── individual indicator votes with weights ──
  type Vote = "BUY" | "SELL" | "HOLD";
  const votes: { label: string; vote: Vote; weight: number; strength: number }[] = [];

  // 1. RSI
  let rsiVote: Vote = "HOLD";
  let rsiStrength = 0;
  if (rsiVal < 30)      { rsiVote = "BUY";  rsiStrength = (30 - rsiVal) / 30; }
  else if (rsiVal < 45) { rsiVote = "BUY";  rsiStrength = (45 - rsiVal) / 45 * 0.5; }
  else if (rsiVal > 70) { rsiVote = "SELL"; rsiStrength = (rsiVal - 70) / 30; }
  else if (rsiVal > 55) { rsiVote = "SELL"; rsiStrength = (rsiVal - 55) / 45 * 0.5; }
  votes.push({ label: "RSI(14)", vote: rsiVote, weight: 2.5, strength: rsiStrength });

  // 2. MACD histogram
  let macdVote: Vote = "HOLD";
  let macdStrength = 0;
  if (macdRes) {
    const norm = Math.abs(macdRes.histogram) / (price * 0.01 + 0.0001);
    macdStrength = Math.min(1, norm);
    macdVote = macdRes.histogram > 0 ? "BUY" : macdRes.histogram < 0 ? "SELL" : "HOLD";
  }
  votes.push({ label: "MACD", vote: macdVote, weight: 2.0, strength: macdStrength });

  // 3. EMA 20 vs 50 (trend)
  const emaCross: Vote = ema20Val > ema50Val ? "BUY" : ema20Val < ema50Val ? "SELL" : "HOLD";
  const emaDiff = Math.abs(ema20Val - ema50Val) / ema50Val;
  votes.push({ label: "EMA20/50", vote: emaCross, weight: 2.0, strength: Math.min(1, emaDiff * 20) });

  // 4. Price vs EMA20 (short-term trend)
  const priceEma20: Vote = price > ema20Val ? "BUY" : price < ema20Val ? "SELL" : "HOLD";
  const priceEmaDiff = Math.abs(price - ema20Val) / ema20Val;
  votes.push({ label: "Price/EMA20", vote: priceEma20, weight: 1.5, strength: Math.min(1, priceEmaDiff * 15) });

  // 5. Momentum (ROC)
  let rocVote: Vote = "HOLD";
  let rocStrength = 0;
  if (rocVal > 3)       { rocVote = "BUY";  rocStrength = Math.min(1, rocVal / 15); }
  else if (rocVal > 0)  { rocVote = "BUY";  rocStrength = rocVal / 15 * 0.4; }
  else if (rocVal < -3) { rocVote = "SELL"; rocStrength = Math.min(1, -rocVal / 15); }
  else if (rocVal < 0)  { rocVote = "SELL"; rocStrength = -rocVal / 15 * 0.4; }
  votes.push({ label: "Momentum(14)", vote: rocVote, weight: 1.5, strength: rocStrength });

  // 7. Relative strength (52-week range position)
  let rsVote: Vote = "HOLD";
  let rsStrength = 0;
  if (rsVal >= 70) {
    rsVote = "BUY";
    rsStrength = Math.min(1, (rsVal - 50) / 50);
  } else if (rsVal <= 30) {
    rsVote = "SELL";
    rsStrength = Math.min(1, (50 - rsVal) / 50);
  } else if (rsVal > 55) {
    rsVote = "BUY";
    rsStrength = ((rsVal - 50) / 50) * 0.55;
  } else if (rsVal < 45) {
    rsVote = "SELL";
    rsStrength = ((50 - rsVal) / 50) * 0.55;
  }
  votes.push({ label: "RS(252d)", vote: rsVote, weight: 1.8, strength: rsStrength });

  // 8. Alpha (63d momentum excess)
  let alphaVote: Vote = "HOLD";
  let alphaStrength = 0;
  if (alphaVal > 15) {
    alphaVote = "BUY";
    alphaStrength = Math.min(1, alphaVal / 60);
  } else if (alphaVal < -15) {
    alphaVote = "SELL";
    alphaStrength = Math.min(1, -alphaVal / 60);
  } else if (alphaVal > 5) {
    alphaVote = "BUY";
    alphaStrength = (alphaVal / 60) * 0.45;
  } else if (alphaVal < -5) {
    alphaVote = "SELL";
    alphaStrength = (-alphaVal / 60) * 0.45;
  }
  votes.push({ label: "Alpha(63d)", vote: alphaVote, weight: 1.5, strength: alphaStrength });

  // 9. Beta (ATR % vs baseline) — elevated vol leans defensive
  let betaVote: Vote = "HOLD";
  let betaStrength = 0;
  if (betaVal > 1.55) {
    betaVote = "SELL";
    betaStrength = Math.min(1, (betaVal - 1) / 2);
  } else if (betaVal < 0.82) {
    betaVote = "BUY";
    betaStrength = Math.min(1, (1 - betaVal) / 1.2);
  }
  votes.push({ label: "Beta(ATR)", vote: betaVote, weight: 1.0, strength: betaStrength });

  // 10. Gamma (RSI acceleration)
  let gammaVote: Vote = "HOLD";
  let gammaStrength = 0;
  if (gammaVal > 1.5) {
    gammaVote = "BUY";
    gammaStrength = Math.min(1, Math.abs(gammaVal) / 12);
  } else if (gammaVal < -1.5) {
    gammaVote = "SELL";
    gammaStrength = Math.min(1, Math.abs(gammaVal) / 12);
  }
  votes.push({ label: "Gamma(RSIΔ)", vote: gammaVote, weight: 1.2, strength: gammaStrength });

  // 11. Theta (trend persistence vs EMA20)
  let thetaVote: Vote = "HOLD";
  let thetaStrength = 0;
  if (thetaVal > 52) {
    if (price > ema20Val) {
      thetaVote = "BUY";
      thetaStrength = Math.min(1, (thetaVal - 50) / 50);
    } else {
      thetaVote = "SELL";
      thetaStrength = Math.min(1, (thetaVal - 50) / 50);
    }
  }
  votes.push({ label: "Theta(trend)", vote: thetaVote, weight: 1.3, strength: thetaStrength });

  // 12. Stochastic %K
  let stochVote: Vote = "HOLD";
  let stochStrength = 0;
  if (stochKVal < 22) {
    stochVote = "BUY";
    stochStrength = Math.min(1, (22 - stochKVal) / 22);
  } else if (stochKVal > 78) {
    stochVote = "SELL";
    stochStrength = Math.min(1, (stochKVal - 78) / 22);
  } else if (stochKVal < 42) {
    stochVote = "BUY";
    stochStrength = ((42 - stochKVal) / 42) * 0.45;
  } else if (stochKVal > 58) {
    stochVote = "SELL";
    stochStrength = ((stochKVal - 58) / 42) * 0.45;
  }
  votes.push({ label: "Stoch %K", vote: stochVote, weight: 1.5, strength: stochStrength });

  // 13. Williams %R
  let wVote: Vote = "HOLD";
  let wStrength = 0;
  if (wRVal < -78) {
    wVote = "BUY";
    wStrength = Math.min(1, (-78 - wRVal) / 22);
  } else if (wRVal > -22) {
    wVote = "SELL";
    wStrength = Math.min(1, (wRVal + 22) / 22);
  } else if (wRVal < -55) {
    wVote = "BUY";
    wStrength = ((-55 - wRVal) / 23) * 0.45;
  } else if (wRVal > -45) {
    wVote = "SELL";
    wStrength = ((wRVal + 45) / 23) * 0.45;
  }
  votes.push({ label: "Williams %R", vote: wVote, weight: 1.5, strength: wStrength });

  // 14. Volume confirmation (amplifier, not a direction vote)
  const volBoost = Math.min(1.3, volRatio);

  // ── tally votes ──
  let buyScore  = 0;
  let sellScore = 0;
  for (const v of votes) {
    const w = v.weight * (v.strength + 0.3);
    if (v.vote === "BUY")  buyScore  += w;
    if (v.vote === "SELL") sellScore += w;
  }

  buyScore  *= volBoost;
  sellScore *= volBoost;

  let direction: "BUY" | "SELL" | "HOLD";

  if (buyScore > sellScore * 1.25) {
    direction = "BUY";
  } else if (sellScore > buyScore * 1.25) {
    direction = "SELL";
  } else {
    direction = "HOLD";
  }

  const total = buyScore + sellScore + 1e-9;
  let margin: number;
  if (direction === "BUY") {
    margin = (buyScore - sellScore) / total;
  } else if (direction === "SELL") {
    margin = (sellScore - buyScore) / total;
  } else {
    margin = 1 - (2 * Math.min(buyScore, sellScore)) / total;
  }
  const confidence = Math.round(50 + 45 * Math.min(1, Math.max(0, margin)));

  const bullStrength = Math.round(
    votes.filter(v => v.vote === "BUY").reduce((a, v) => a + v.weight * v.strength, 0) /
    votes.reduce((a, v) => a + v.weight, 0) * 100
  );
  const bearStrength = Math.round(
    votes.filter(v => v.vote === "SELL").reduce((a, v) => a + v.weight * v.strength, 0) /
    votes.reduce((a, v) => a + v.weight, 0) * 100
  );

  return {
    direction,
    confidence:    Math.min(95, Math.max(50, confidence)),
    rsiValue:      Math.round(rsiVal * 10) / 10,
    macdHistogram: macdRes ? Math.round(macdRes.histogram * 10000) / 10000 : 0,
    ema20:         Math.round(ema20Val * 100) / 100,
    ema50:         Math.round(ema50Val * 100) / 100,
    currentPrice:  Math.round(price * 100) / 100,
    atrValue:      Math.round(atrVal * 100) / 100,
    momentumRoc:   Math.round(rocVal * 100) / 100,
    bullStrength:  Math.min(100, Math.max(0, bullStrength)),
    bearStrength:  Math.min(100, Math.max(0, bearStrength)),
    indicatorVotes: votes.map(v => ({ label: v.label, vote: v.vote, weight: v.weight })),
    rs:          rsVal,
    alphaScore:  alphaVal,
    betaScore:   betaVal,
    gammaScore:  gammaVal,
    thetaScore:  thetaVal,
    stochK:      stochKVal,
    wR:          wRVal,
  };
}
