import { DoubleColor, Round, PredictionResult, AppPreferences, LearnState, DeepInsights } from '../types';

export const COLORS: DoubleColor[] = ['red', 'black', 'white'];
export const BASE_RATES: Record<DoubleColor, number> = {
  red: 7 / 15,
  black: 7 / 15,
  white: 1 / 15,
};

export const COLOR_LABEL: Record<DoubleColor | 'skip', string> = {
  red: 'VERMELHO',
  black: 'PRETO',
  white: 'BRANCO',
  skip: 'AGUARDAR',
};

export const COLOR_PT: Record<DoubleColor, string> = {
  red: 'Vermelho',
  black: 'Preto',
  white: 'Branco',
};

export function colorOf(n: number): DoubleColor {
  if (n === 0) return 'white';
  if (n >= 1 && n <= 7) return 'red';
  return 'black';
}

function safeDiv(a: number, b: number): number {
  return b ? a / b : 0;
}

export function getRoundMeta(r: Round) {
  const d = new Date(r.created_at);
  return {
    hour: d.getHours(),
    minute: d.getMinutes(),
    second: d.getSeconds(),
    day: d.getDate(),
    weekday: d.getDay(),
    month: d.getMonth(),
    terminal: d.getMinutes() % 10,
    ts: d.getTime(),
  };
}

export function analyzeWhiteIntervals(rounds: Round[]) {
  const whites: Array<{ i: number; meta: ReturnType<typeof getRoundMeta>; number: number }> = [];
  rounds.forEach((r, i) => {
    if (r.color === 'white') {
      whites.push({ i, meta: getRoundMeta(r), number: r.number });
    }
  });

  if (whites.length < 2) {
    return { avg: 15, current: rounds.length, max: 0, list: [], whites };
  }

  const intervals: number[] = [];
  for (let i = 1; i < whites.length; i++) {
    intervals.push(whites[i].i - whites[i - 1].i);
  }

  const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const max = Math.max(...intervals);
  const current = rounds.length - 1 - (whites.length ? whites[whites.length - 1].i : -1);

  return { avg, current, max, list: intervals.slice(-20), whites };
}

export function analyzePullers(rounds: Round[]) {
  const pullers: Record<number, number> = {};
  for (let i = 1; i < rounds.length; i++) {
    if (rounds[i].color === 'white') {
      const prev = rounds[i - 1].number;
      pullers[prev] = (pullers[prev] || 0) + 1;
    }
  }
  const sorted = Object.entries(pullers).sort((a, b) => b[1] - a[1]);
  return sorted.slice(0, 5).map(([n, c]) => ({ number: +n, count: c }));
}

export function analyzeHotCold(rounds: Round[], window = 100) {
  const w = rounds.slice(-window);
  const counts: Record<number, number> = {};
  for (let n = 0; n <= 14; n++) counts[n] = 0;
  w.forEach(r => {
    counts[r.number] = (counts[r.number] || 0) + 1;
  });

  const sorted = Object.entries(counts)
    .map(([n, c]) => ({ number: +n, count: c, color: colorOf(+n) }))
    .sort((a, b) => b.count - a.count);

  return {
    hot: sorted.slice(0, 5),
    cold: sorted.slice(-5).reverse(),
    window: w.length,
  };
}

export function detectSequences(colors: DoubleColor[]) {
  const signals: Array<{ name: string; suggest: DoubleColor | 'skip'; strength: number }> = [];
  if (colors.length < 4) return signals;

  const last4 = colors.slice(-4).join('');
  const last3 = colors.slice(-3).join('');

  if (last4 === 'redblackredblack' || last4 === 'blackredblackred') {
    signals.push({
      name: '1x1 Alternando',
      suggest: colors[colors.length - 1] === 'red' ? 'black' : 'red',
      strength: 0.12,
    });
  }

  if (last4 === 'redredblackblack' || last4 === 'blackblackredred') {
    signals.push({
      name: '2x2 Dobradinha',
      suggest: colors[colors.length - 1],
      strength: 0.10,
    });
  }

  if (colors[colors.length - 1] === 'white') {
    signals.push({ name: 'Pós-Branco', suggest: 'skip', strength: 0.05 });
  }

  if (last3 === 'redblackred') signals.push({ name: 'VPV', suggest: 'black', strength: 0.08 });
  if (last3 === 'blackredblack') signals.push({ name: 'PVP', suggest: 'red', strength: 0.08 });

  return signals;
}

export function minutagemSignal(rounds: Round[]) {
  const whites = rounds.filter(r => r.color === 'white');
  if (whites.length < 1 || rounds.length < 2) return null;
  const lastW = whites[whites.length - 1];
  const idx = rounds.indexOf(lastW);
  if (idx < 0 || idx >= rounds.length - 1) return null;
  const after = rounds[idx + 1];
  const wm = getRoundMeta(lastW);
  const targetTerminal = (wm.terminal + (after.number % 10)) % 10;
  const now = new Date();
  const currentTerminal = now.getMinutes() % 10;
  const mirror = (wm.terminal + 5) % 10;

  return {
    whiteMinute: wm.minute,
    afterNumber: after.number,
    targetTerminal,
    mirrorTerminal: mirror,
    currentTerminal,
    nearTarget: currentTerminal === targetTerminal || currentTerminal === mirror,
  };
}

export function deepContext(rounds: Round[]): DeepInsights {
  if (!rounds.length) return { reasons: ['Sem dados para estudo'], boost: {} };
  const intervals = analyzeWhiteIntervals(rounds);
  const pullers = analyzePullers(rounds);
  const hc = analyzeHotCold(rounds);
  const seqs = detectSequences(rounds.map(r => r.color));
  const minu = minutagemSignal(rounds);
  const reasons: string[] = [];
  const boost: Partial<Record<DoubleColor, number>> = { red: 0, black: 0, white: 0 };

  if (intervals.current >= intervals.avg * 1.3) {
    boost.white = (boost.white || 0) + 0.04;
    reasons.push(`Intervalo branco atual ${intervals.current} > média ${intervals.avg.toFixed(0)}`);
  }
  if (intervals.current >= 25) {
    boost.white = (boost.white || 0) + 0.06;
    reasons.push(`Longo sem branco (${intervals.current} rodadas)`);
  }

  seqs.forEach(s => {
    if (s.suggest !== 'skip') {
      boost[s.suggest] = (boost[s.suggest] || 0) + s.strength;
      reasons.push(`Padrão ${s.name} → ${COLOR_PT[s.suggest]}`);
    }
  });

  if (hc.hot.length) {
    const top = hc.hot[0];
    boost[top.color] = (boost[top.color] || 0) + 0.03;
    reasons.push(`Número Quente #${top.number} (${top.count}x/${hc.window})`);
  }

  if (minu && minu.nearTarget) {
    boost.white = (boost.white || 0) + 0.05;
    reasons.push(`Minutagem: terminal ${minu.currentTerminal} próximo do alvo ${minu.targetTerminal}`);
  }

  if (pullers.length) {
    reasons.push(`Top puxadores de branco: ${pullers.map(p => '#' + p.number).join(', ')}`);
  }

  return { reasons, boost, intervals, pullers, hc, seqs, minu };
}

export function freqMulti(rounds: DoubleColor[]): Record<DoubleColor, number> {
  if (!rounds.length) return { ...BASE_RATES };
  const horizons: Array<[DoubleColor[], number]> = [
    [rounds.slice(-30), 0.38],
    [rounds.slice(-80), 0.22],
    [rounds.slice(-200), 0.18],
    [rounds.slice(-1000), 0.12],
    [rounds, 0.10],
  ];

  const out: Record<DoubleColor, number> = { red: 0, black: 0, white: 0 };
  let tw = 0;
  for (const [w, weight] of horizons) {
    if (w.length < 5) continue;
    const counts: Record<DoubleColor, number> = { red: 0, black: 0, white: 0 };
    w.forEach(c => { counts[c]++; });
    const t = w.length;
    COLORS.forEach(c => { out[c] += weight * (counts[c] / t); });
    tw += weight;
  }

  if (!tw) return { ...BASE_RATES };
  COLORS.forEach(c => { out[c] /= tw; });
  const n = rounds.length;
  const shrink = Math.max(0, 1 - n / 60) * 0.5;
  COLORS.forEach(c => { out[c] = (1 - shrink) * out[c] + shrink * BASE_RATES[c]; });
  const s = COLORS.reduce((a, c) => a + out[c], 0) || 1;
  COLORS.forEach(c => { out[c] /= s; });
  return out;
}

export function markov(rounds: DoubleColor[]): Record<DoubleColor, number> {
  if (rounds.length < 2) return { ...BASE_RATES };
  const last1 = rounds[rounds.length - 1];
  const t1: Record<DoubleColor, number> = { red: 0, black: 0, white: 0 };
  for (let i = 0; i < rounds.length - 1; i++) {
    if (rounds[i] === last1) t1[rounds[i + 1]]++;
  }
  const n1 = t1.red + t1.black + t1.white;
  const m1 = n1 >= 5
    ? { red: safeDiv(t1.red, n1), black: safeDiv(t1.black, n1), white: safeDiv(t1.white, n1) }
    : { ...BASE_RATES };

  let m2 = { ...BASE_RATES };
  if (rounds.length >= 3) {
    const last2 = [rounds[rounds.length - 2], rounds[rounds.length - 1]];
    const t2: Record<DoubleColor, number> = { red: 0, black: 0, white: 0 };
    for (let i = 0; i < rounds.length - 2; i++) {
      if (rounds[i] === last2[0] && rounds[i + 1] === last2[1]) t2[rounds[i + 2]]++;
    }
    const n2 = t2.red + t2.black + t2.white;
    if (n2 >= 5) m2 = { red: safeDiv(t2.red, n2), black: safeDiv(t2.black, n2), white: safeDiv(t2.white, n2) };
  }

  const w2 = rounds.length >= 40 ? 0.45 : 0.30;
  const w1 = 1 - w2;
  const out: Record<DoubleColor, number> = { red: 0, black: 0, white: 0 };
  COLORS.forEach(c => { out[c] = w1 * m1[c] + w2 * m2[c]; });
  const s = COLORS.reduce((a, c) => a + out[c], 0) || 1;
  COLORS.forEach(c => { out[c] /= s; });
  return out;
}

export function streakPressure(rounds: DoubleColor[]): Record<DoubleColor, number> {
  if (!rounds.length) return { red: 1 / 3, black: 1 / 3, white: 1 / 3 };
  const last = rounds[rounds.length - 1];
  let streak = 0;
  for (let i = rounds.length - 1; i >= 0; i--) {
    if (rounds[i] === last) streak++;
    else break;
  }
  const out = { ...BASE_RATES };
  if (last === 'white') {
    out.red += 0.02;
    out.black += 0.02;
    out.white -= 0.04;
    const s = Math.max(0, out.red) + Math.max(0, out.black) + Math.max(0, out.white) || 1;
    return {
      red: Math.max(0, out.red) / s,
      black: Math.max(0, out.black) / s,
      white: Math.max(0, out.white) / s,
    };
  }
  if (streak < 3) return out;
  const bonus = Math.min(0.14, 0.05 + 0.03 * (streak - 3));
  const opposite: DoubleColor = last === 'red' ? 'black' : 'red';
  out[opposite] += bonus;
  out[last] = Math.max(0, out[last] - bonus * 0.7);
  const s = out.red + out.black + out.white || 1;
  COLORS.forEach(c => { out[c] /= s; });
  return out;
}

export function whiteCycle(rounds: DoubleColor[]): Record<DoubleColor, number> {
  if (!rounds.length) return { ...BASE_RATES };
  let since = 0;
  for (let i = rounds.length - 1; i >= 0; i--) {
    if (rounds[i] === 'white') break;
    since++;
  }
  const out = { ...BASE_RATES };
  let boost = 0;
  if (since >= 30) boost = Math.min(0.18, 0.10 + (since - 30) * 0.005);
  else if (since >= 18) boost = (since - 18) * 0.008;
  else if (since >= 10) boost = (since - 10) * 0.003;

  out.white = Math.max(0.005, out.white + boost);
  const left = 1 - out.white;
  out.red = left / 2;
  out.black = left - out.red;
  const s = out.red + out.black + out.white || 1;
  COLORS.forEach(c => { out[c] /= s; });
  return out;
}

export function patternMatch(rounds: DoubleColor[], window = 4): Record<DoubleColor, number> {
  if (rounds.length < window + 5) return { ...BASE_RATES };
  const seq = rounds.slice(-window);
  const after: Record<DoubleColor, number> = { red: 0, black: 0, white: 0 };
  let hits = 0;

  for (let i = 0; i <= rounds.length - window - 1; i++) {
    let match = true;
    for (let j = 0; j < window; j++) {
      if (rounds[i + j] !== seq[j]) {
        match = false;
        break;
      }
    }
    if (match) {
      after[rounds[i + window]]++;
      hits++;
    }
  }

  if (hits < 3) return { ...BASE_RATES };
  const s = after.red + after.black + after.white || 1;
  return { red: after.red / s, black: after.black / s, white: after.white / s };
}

export function sequenceMemoryPredict(colors: DoubleColor[], learn: LearnState): Record<DoubleColor, number> {
  const out: Record<DoubleColor, number> = { red: 0, black: 0, white: 0 };
  let tw = 0;

  for (let n = 5; n >= 2; n--) {
    if (colors.length < n) continue;
    const key = colors.slice(-n).join(',');
    const mem = learn.sequenceMemory?.[key];
    if (!mem) continue;
    const t = (mem.red || 0) + (mem.black || 0) + (mem.white || 0);
    if (t < 2) continue;
    const w = n * 0.15 * Math.min(1, t / 5);
    COLORS.forEach(c => {
      out[c] += w * ((mem[c] || 0) / t);
    });
    tw += w;
  }

  if (tw < 0.01) return { ...BASE_RATES };
  COLORS.forEach(c => { out[c] /= tw; });
  return out;
}

export function numberAfterPredict(rounds: Round[], learn: LearnState): Record<DoubleColor, number> {
  if (!rounds.length) return { ...BASE_RATES };
  const last = rounds[rounds.length - 1];
  const mem = learn.numberAfter?.[String(last.number)];
  if (!mem) return { ...BASE_RATES };
  const t = (mem.red || 0) + (mem.black || 0) + (mem.white || 0);
  if (t < 3) return { ...BASE_RATES };
  return { red: mem.red / t, black: mem.black / t, white: mem.white / t };
}

export function hourBiasPredict(learn: LearnState): Record<DoubleColor, number> {
  const h = new Date().getHours();
  const mem = learn.hourBias?.[h];
  if (!mem || mem.n < 10) return { ...BASE_RATES };
  return { red: mem.red / mem.n, black: mem.black / mem.n, white: mem.white / mem.n };
}

export function evolveWeights(learn: LearnState): LearnState {
  const next = { ...learn };
  const hits = next.signalHits || {};
  const names = Object.keys(next.signalWeights);
  let changed = false;

  names.forEach(name => {
    const h = hits[name];
    if (!h || h.total < 8) return;
    const rate = h.hits / h.total;
    const target = 0.05 + rate * 0.25;
    const cur = next.signalWeights[name];
    next.signalWeights[name] = cur * 0.85 + target * 0.15;
    changed = true;
  });

  if (changed) {
    const sum = names.reduce((a, n) => a + next.signalWeights[n], 0) || 1;
    names.forEach(n => {
      next.signalWeights[n] /= sum;
    });
    next.lastEvolveAt = Date.now();
  }

  return next;
}

export function predict(
  rounds: Round[],
  prefs: AppPreferences,
  learn: LearnState
): PredictionResult {
  const roundsColors = rounds.map(r => r.color);
  const W = learn.signalWeights || {};
  const signals: Array<Record<DoubleColor, number>> = [];
  const weights: number[] = [];
  const votes: Record<string, DoubleColor> = {};

  function addSignal(name: string, dist: Record<DoubleColor, number>, enabled: boolean) {
    if (!enabled) return;
    const w = W[name] != null ? W[name] : 0.1;
    if (w <= 0.001) return;
    signals.push(dist);
    weights.push(w);
    const top = COLORS.reduce((a, c) => (dist[c] > dist[a] ? c : a), 'red');
    votes[name] = top;
  }

  if (prefs.use_frequency) addSignal('frequency', freqMulti(roundsColors), true);
  if (prefs.use_markov) addSignal('markov', markov(roundsColors), true);
  if (prefs.use_streak) addSignal('streak', streakPressure(roundsColors), true);
  if (prefs.use_white_cycle) addSignal('white_cycle', whiteCycle(roundsColors), true);
  if (prefs.use_pattern) addSignal('pattern', patternMatch(roundsColors), true);

  addSignal('sequence_mem', sequenceMemoryPredict(roundsColors, learn), true);
  addSignal('number_after', numberAfterPredict(rounds, learn), true);
  addSignal('hour_bias', hourBiasPredict(learn), true);

  const deep = deepContext(rounds);
  if (deep && deep.boost) {
    const base = { red: BASE_RATES.red, black: BASE_RATES.black, white: BASE_RATES.white };
    COLORS.forEach(c => {
      base[c] = Math.max(0.01, base[c] + (deep.boost[c] || 0));
    });
    const s = COLORS.reduce((a, c) => a + base[c], 0) || 1;
    COLORS.forEach(c => { base[c] /= s; });
    addSignal('deep', base, true);
  }

  if (!signals.length) {
    return {
      color: 'skip',
      confidence: 0,
      probs: { ...BASE_RATES },
      reasons: ['Nenhum modelo preditivo ativo'],
      action: 'SKIP',
      deep,
      _signalVotes: votes,
    };
  }

  const tw = weights.reduce((a, b) => a + b, 0) || 1;
  const probs: Record<DoubleColor, number> = { red: 0, black: 0, white: 0 };
  signals.forEach((sig, i) => {
    COLORS.forEach(c => {
      probs[c] += (weights[i] / tw) * sig[c];
    });
  });

  const s = probs.red + probs.black + probs.white || 1;
  COLORS.forEach(c => { probs[c] /= s; });

  let agreement = 0;
  const top = COLORS.reduce((a, c) => (probs[c] > probs[a] ? c : a), 'red');
  signals.forEach(sig => {
    const sigTop = COLORS.reduce((a, c) => (sig[c] > sig[a] ? c : a), 'red');
    if (sigTop === top) agreement++;
  });

  const agreeRatio = agreement / signals.length;
  const dataFactor = Math.min(1, roundsColors.length / 80);
  const learnFactor = Math.min(1, (learn.totalLearned || 0) / 200);
  let confidence = 0.28 + 0.30 * agreeRatio + 0.22 * dataFactor + 0.12 * learnFactor + 0.08 * Math.max(0, probs[top] - BASE_RATES[top]);

  const cal = learn.confCalibration || [];
  if (cal.length >= 20) {
    const high = cal.filter(x => x.conf >= 0.6);
    if (high.length >= 8) {
      const hr = high.reduce((a, x) => a + x.hit, 0) / high.length;
      if (hr < 0.4) confidence *= 0.85;
      if (hr > 0.55) confidence = Math.min(0.95, confidence * 1.08);
    }
  }
  confidence = Math.max(0.18, Math.min(0.95, confidence));

  const reasons: string[] = [];
  reasons.push(`Consenso ${agreement}/${signals.length} · IA ${COLOR_PT[top]} ${(probs[top] * 100).toFixed(1)}%`);
  
  const topW = Object.entries(learn.signalWeights || {}).sort((a, b) => b[1] - a[1])[0];
  if (topW) {
    reasons.push(`Peso líder: ${topW[0]} (${(topW[1] * 100).toFixed(0)}%)`);
  }
  if (deep?.reasons?.length) {
    reasons.push(...deep.reasons.slice(0, 3));
  }

  if (prefs.white_only) {
    if (top !== 'white' || confidence < prefs.min_confidence) {
      return {
        color: 'skip',
        confidence,
        probs,
        reasons: ['Modo Somente Branco ativo: sem entrada clara'],
        action: 'SKIP',
        deep,
        _signalVotes: votes,
      };
    }
  }

  if (prefs.skip_low_conf && confidence < prefs.min_confidence) {
    return {
      color: 'skip',
      confidence,
      probs,
      reasons: [`Confiança baixa (${(confidence * 100).toFixed(0)}% < ${(prefs.min_confidence * 100).toFixed(0)}%)`].concat(reasons),
      action: 'SKIP',
      deep,
      _signalVotes: votes,
    };
  }

  return {
    color: top,
    confidence,
    probs,
    reasons,
    action: 'ENTER',
    deep,
    _signalVotes: votes,
  };
}

export interface VolatilityGaleInfo {
  multiplier: number;
  volatilityLevel: 'low' | 'medium' | 'high' | 'critical';
  label: string;
  reason: string;
  bankrollRatio: number;
  drawdownPct: number;
}

export function calculateDynamicGaleMultiplier(
  bankroll: number,
  betAmount: number,
  dayPL: number,
  dayWins: number,
  dayLosses: number,
  baseMultiplier: number = 2.0,
  bankrollMode: 'conservative' | 'balanced' | 'aggressive' = 'balanced'
): VolatilityGaleInfo {
  const baseBet = Math.max(betAmount || 2.5, 0.5);
  const currentBankroll = Math.max(bankroll || 0, 0);
  const coverageRounds = baseBet > 0 ? currentBankroll / baseBet : 100;

  // Calculate win rate & loss pressure
  const totalRounds = dayWins + dayLosses;
  const lossRate = totalRounds > 0 ? dayLosses / totalRounds : 0.45;

  // Drawdown impact (negative dayPL relative to bankroll)
  const drawdown = dayPL < 0 ? Math.abs(dayPL) : 0;
  const totalEquity = currentBankroll + drawdown;
  const drawdownPct = totalEquity > 0 ? (drawdown / totalEquity) * 100 : 0;

  let targetMult = baseMultiplier;
  let volatilityLevel: 'low' | 'medium' | 'high' | 'critical' = 'medium';
  let label = 'Volatilidade Estável';
  let reason = 'Ajuste proporcional ao saldo e oscilação da banca';

  if (coverageRounds < 15 || drawdownPct > 25 || (totalRounds >= 4 && lossRate > 0.65)) {
    // Critical / High risk -> protect capital with conservative multiplier (1.5x - 1.7x)
    volatilityLevel = 'critical';
    targetMult = Math.max(1.5, Math.min(baseMultiplier, 1.6));
    label = 'Alta Volatilidade (Proteção de Capital)';
    reason = `Banca sob oscilação alta (Drawdown ${drawdownPct.toFixed(0)}% / ${Math.round(coverageRounds)}x coberturas). Multiplicador reduzido para proteger saldo.`;
  } else if (coverageRounds < 40 || drawdownPct > 12 || (totalRounds >= 3 && lossRate > 0.5)) {
    // Elevated volatility -> adjusted to 1.7x - 1.8x
    volatilityLevel = 'high';
    targetMult = Math.max(1.6, Math.min(baseMultiplier, 1.8));
    label = 'Volatilidade Elevada';
    reason = `Oscilação moderada detectada. Multiplicador ajustado para 1.8x para diminuir o risco de exposição.`;
  } else if (coverageRounds > 80 && drawdownPct < 5 && lossRate < 0.4) {
    // Low Volatility / Healthy bankroll & Profit -> optimize recovery (2.0x - 2.2x based on mode)
    volatilityLevel = 'low';
    const boost = bankrollMode === 'aggressive' ? 0.2 : bankrollMode === 'conservative' ? 0 : 0.1;
    targetMult = Math.min(2.3, Math.max(baseMultiplier, 2.0 + boost));
    label = 'Baixa Volatilidade (Banca Saudável)';
    reason = `Banca saudável (${Math.round(coverageRounds)}x coberturas) com baixa oscilação. Recuperação otimizada.`;
  } else {
    // Standard / Medium (1.9x - 2.0x)
    volatilityLevel = 'medium';
    targetMult = Math.min(2.1, Math.max(1.8, baseMultiplier));
    label = 'Volatilidade Estável';
    reason = `Condições equilibradas. Multiplicador calibrado em ${targetMult.toFixed(1)}x.`;
  }

  // Round to 1 decimal place
  const finalMultiplier = Math.round(targetMult * 10) / 10;

  return {
    multiplier: finalMultiplier,
    volatilityLevel,
    label,
    reason,
    bankrollRatio: Math.round(coverageRounds),
    drawdownPct: Math.round(drawdownPct * 10) / 10,
  };
}

