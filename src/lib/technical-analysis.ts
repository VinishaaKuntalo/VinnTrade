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

/* ── Signal scoring ────────────────────────────────────── */
export interface TechnicalSignal {
  direction: "BUY" | "SELL" | "HOLD";
  confidence: number;          // 0-100 real computed confidence
  uncertainty: number;
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

  // 6. Volume confirmation (amplifier, not a direction vote)
  const volBoost = Math.min(1.3, volRatio);

  // ── tally votes ──
  let buyScore  = 0;
  let sellScore = 0;
  let totalWeight = 0;
  for (const v of votes) {
    const w = v.weight * (v.strength + 0.3);
    totalWeight += v.weight;
    if (v.vote === "BUY")  buyScore  += w;
    if (v.vote === "SELL") sellScore += w;
  }

  buyScore  *= volBoost;
  sellScore *= volBoost;

  let direction: "BUY" | "SELL" | "HOLD";
  let rawConf: number;

  if (buyScore > sellScore * 1.25) {
    direction = "BUY";
    rawConf   = buyScore / (buyScore + sellScore + 0.01);
  } else if (sellScore > buyScore * 1.25) {
    direction = "SELL";
    rawConf   = sellScore / (buyScore + sellScore + 0.01);
  } else {
    direction = "HOLD";
    rawConf   = 0.5;
  }

  // scale confidence to 50-95 range
  const confidence  = Math.round(50 + rawConf * 45);
  const uncertainty = Math.round(100 - confidence + (Math.random() * 6 - 3));

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
    confidence: Math.min(95, Math.max(50, confidence)),
    uncertainty: Math.min(45, Math.max(5, uncertainty)),
    rsiValue:        Math.round(rsiVal * 10) / 10,
    macdHistogram:   macdRes ? Math.round(macdRes.histogram * 10000) / 10000 : 0,
    ema20:           Math.round(ema20Val * 100) / 100,
    ema50:           Math.round(ema50Val * 100) / 100,
    currentPrice:    Math.round(price * 100) / 100,
    atrValue:        Math.round(atrVal * 100) / 100,
    momentumRoc:     Math.round(rocVal * 100) / 100,
    bullStrength:    Math.min(100, Math.max(0, bullStrength)),
    bearStrength:    Math.min(100, Math.max(0, bearStrength)),
    indicatorVotes:  votes.map(v => ({ label: v.label, vote: v.vote, weight: v.weight })),
  };
}
