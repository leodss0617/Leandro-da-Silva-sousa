import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { Round, SignalRecord, DoubleColor } from '../types';
import { formatBRL } from '../utils/audio';
import { TrendingUp, TrendingDown, Activity, ChevronDown, ChevronUp, Zap, Target } from 'lucide-react';

interface HomeTrendChartProps {
  rounds: Round[];
  signals?: SignalRecord[];
  dayPL: number;
  bankroll: number;
  targetProfit?: number;
  targetProfitEnabled?: boolean;
}

interface RoundTrendPoint {
  index: number;
  roundNumber: number;
  color: DoubleColor;
  time: string;
  fullTime: string;
  dayPL: number;
  deltaPL: number;
  balance: number;
  hasBet: boolean;
  betOutcome?: 'win' | 'loss';
  betGale?: number;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export const HomeTrendChart: React.FC<HomeTrendChartProps> = ({
  rounds,
  signals = [],
  dayPL,
  bankroll,
  targetProfit = 50,
  targetProfitEnabled = false,
}) => {
  const [viewMode, setViewMode] = useState<'dayPL' | 'balance'>('dayPL');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [windowSize, setWindowSize] = useState<50 | 25>(50);

  // Compute 50-round sequence and running dayPL/bankroll progression
  const { chartData, windowPLChange, trendDirection, peakInWindow, minInWindow } = useMemo(() => {
    const totalRounds = rounds.length;
    const selectedRounds = totalRounds > windowSize ? rounds.slice(-windowSize) : rounds;
    
    // Sort signals chronologically
    const sortedSignals = [...signals].sort((a, b) => {
      const ta = new Date(a.at).getTime() || 0;
      const tb = new Date(b.at).getTime() || 0;
      return ta - tb;
    });

    const initialBankroll = bankroll - dayPL;
    let runningCumulativePL = 0;
    
    // If no rounds exist yet, return a clean baseline
    if (selectedRounds.length === 0) {
      const now = new Date();
      const points: RoundTrendPoint[] = [
        {
          index: 0,
          roundNumber: 0,
          color: 'red',
          time: `${pad2(now.getHours())}:${pad2(now.getMinutes())}`,
          fullTime: 'Início',
          dayPL: 0,
          deltaPL: 0,
          balance: initialBankroll,
          hasBet: false,
        },
        {
          index: 1,
          roundNumber: 1,
          color: 'red',
          time: 'Agora',
          fullTime: 'Atual',
          dayPL: dayPL,
          deltaPL: dayPL,
          balance: bankroll,
          hasBet: false,
        },
      ];
      return {
        chartData: points,
        windowPLChange: dayPL,
        trendDirection: dayPL > 0 ? 'up' : dayPL < 0 ? 'down' : 'neutral',
        peakInWindow: Math.max(0, dayPL),
        minInWindow: Math.min(0, dayPL),
      };
    }

    // Map signal times to rounds
    // Determine the baseline P/L before the window started
    const firstRoundInWindowTime = selectedRounds[0]?.created_at
      ? new Date(selectedRounds[0].created_at).getTime()
      : 0;

    let preWindowPL = 0;
    let signalPointer = 0;

    if (firstRoundInWindowTime > 0) {
      while (
        signalPointer < sortedSignals.length &&
        new Date(sortedSignals[signalPointer].at).getTime() < firstRoundInWindowTime
      ) {
        preWindowPL += Number(sortedSignals[signalPointer].pl) || 0;
        signalPointer++;
      }
    }

    runningCumulativePL = Math.round(preWindowPL * 100) / 100;
    const windowStartPL = runningCumulativePL;

    let peak = runningCumulativePL;
    let minVal = runningCumulativePL;

    const points: RoundTrendPoint[] = [];

    selectedRounds.forEach((r, idx) => {
      const rTime = r.created_at ? new Date(r.created_at).getTime() : 0;
      let roundDelta = 0;
      let hasBetThisRound = false;
      let betOutcome: 'win' | 'loss' | undefined;
      let betGale: number | undefined;

      // Check if any signal corresponds to this round time window
      while (signalPointer < sortedSignals.length) {
        const sig = sortedSignals[signalPointer];
        const sTime = new Date(sig.at).getTime();

        // If signal timestamp is before or matches current round
        // (or within 35 seconds of round)
        if (sTime <= rTime + 5000 || idx === selectedRounds.length - 1) {
          const delta = Number(sig.pl) || 0;
          roundDelta += delta;
          runningCumulativePL += delta;
          hasBetThisRound = true;
          betOutcome = sig.outcome;
          betGale = sig.gale;
          signalPointer++;
        } else {
          break;
        }
      }

      runningCumulativePL = Math.round(runningCumulativePL * 100) / 100;

      if (runningCumulativePL > peak) peak = runningCumulativePL;
      if (runningCumulativePL < minVal) minVal = runningCumulativePL;

      let timeStr = `R${idx + 1}`;
      let fullTimeStr = `Rodada #${r.number} (${r.color.toUpperCase()})`;
      if (r.created_at) {
        const d = new Date(r.created_at);
        if (!isNaN(d.getTime())) {
          timeStr = `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
          fullTimeStr = `${d.toLocaleTimeString('pt-BR')} — Rodada #${r.number}`;
        }
      }

      points.push({
        index: idx + 1,
        roundNumber: r.number,
        color: r.color,
        time: timeStr,
        fullTime: fullTimeStr,
        dayPL: runningCumulativePL,
        deltaPL: roundDelta,
        balance: Math.round((initialBankroll + runningCumulativePL) * 100) / 100,
        hasBet: hasBetThisRound,
        betOutcome,
        betGale,
      });
    });

    // If signals were not matched by timestamp, anchor the last point to actual dayPL
    if (points.length > 0 && Math.abs(points[points.length - 1].dayPL - dayPL) > 0.01) {
      const lastPt = points[points.length - 1];
      lastPt.dayPL = dayPL;
      lastPt.balance = bankroll;
    }

    const windowChange = runningCumulativePL - windowStartPL;
    let trend: 'up' | 'down' | 'neutral' = 'neutral';
    if (windowChange > 0.5) trend = 'up';
    else if (windowChange < -0.5) trend = 'down';

    return {
      chartData: points,
      windowPLChange: windowChange,
      trendDirection: trend,
      peakInWindow: peak,
      minInWindow: minVal,
    };
  }, [rounds, signals, dayPL, bankroll, windowSize]);

  const isProfit = dayPL >= 0;
  const isWindowPositive = windowPLChange >= 0;
  const strokeColor = viewMode === 'balance' ? '#38BDF8' : isProfit ? '#00E676' : '#FF2442';

  return (
    <div className="bg-[#141417] border border-white/10 rounded-2xl p-4 shadow-md space-y-3.5 transition-all">
      {/* Header with Title, Trend Tag and Controls */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all ${
              trendDirection === 'up'
                ? 'bg-[#00E676]/15 border-[#00E676]/30 text-[#00E676]'
                : trendDirection === 'down'
                ? 'bg-[#FF2442]/15 border-[#FF2442]/30 text-[#FF2442]'
                : 'bg-white/5 border-white/10 text-cyan-400'
            }`}
          >
            {trendDirection === 'up' ? (
              <TrendingUp className="w-4 h-4" />
            ) : trendDirection === 'down' ? (
              <TrendingDown className="w-4 h-4" />
            ) : (
              <Activity className="w-4 h-4" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-display font-extrabold text-white tracking-wide uppercase">
                Tendência da Banca ({Math.min(rounds.length, windowSize)} Rodadas)
              </span>
              <span
                className={`text-[9px] font-black px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  trendDirection === 'up'
                    ? 'bg-[#00E676]/15 border-[#00E676]/40 text-[#00E676]'
                    : trendDirection === 'down'
                    ? 'bg-[#FF2442]/15 border-[#FF2442]/40 text-[#FF2442]'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                }`}
              >
                {trendDirection === 'up' ? '↗ ALTA' : trendDirection === 'down' ? '↘ BAIXA' : '↔ LATERAL'}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-400">
              <span>
                P/L Hoje:{' '}
                <strong className={`font-mono ${dayPL >= 0 ? 'text-[#00E676]' : 'text-[#FF2442]'}`}>
                  {dayPL >= 0 ? `+${formatBRL(dayPL)}` : `-${formatBRL(Math.abs(dayPL))}`}
                </strong>
              </span>
              <span>•</span>
              <span>
                Saldo:{' '}
                <strong className="font-mono text-white">
                  {formatBRL(bankroll)}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* View Toggle & Collapse */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Window size toggle */}
          <div className="bg-[#1C1C21] p-0.5 rounded-lg border border-white/5 flex items-center text-[10px]">
            <button
              type="button"
              onClick={() => setWindowSize(25)}
              className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                windowSize === 25 ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              25R
            </button>
            <button
              type="button"
              onClick={() => setWindowSize(50)}
              className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                windowSize === 50 ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              50R
            </button>
          </div>

          {/* Metric View Toggle */}
          <div className="bg-[#1C1C21] p-0.5 rounded-lg border border-white/5 flex items-center text-[10px]">
            <button
              type="button"
              onClick={() => setViewMode('dayPL')}
              className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                viewMode === 'dayPL' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              P/L (R$)
            </button>
            <button
              type="button"
              onClick={() => setViewMode('balance')}
              className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                viewMode === 'balance' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Saldo (R$)
            </button>
          </div>

          {/* Collapse/Expand button */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Recolher gráfico' : 'Expandir gráfico'}
            className="p-1 rounded-lg bg-[#1C1C21] border border-white/5 text-zinc-400 hover:text-white cursor-pointer transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-3 gap-2 pt-0.5">
            <div className="bg-[#1C1C21] p-2 rounded-xl border border-white/5">
              <div className="text-[9px] uppercase tracking-wider text-zinc-400 font-semibold">
                Variação ({windowSize}R)
              </div>
              <div
                className={`font-mono text-xs font-extrabold mt-0.5 ${
                  isWindowPositive ? 'text-[#00E676]' : 'text-[#FF2442]'
                }`}
              >
                {windowPLChange >= 0 ? `+${formatBRL(windowPLChange)}` : `-${formatBRL(Math.abs(windowPLChange))}`}
              </div>
            </div>

            <div className="bg-[#1C1C21] p-2 rounded-xl border border-white/5">
              <div className="text-[9px] uppercase tracking-wider text-zinc-400 font-semibold">
                Pico na Janela
              </div>
              <div className="font-mono text-xs font-extrabold text-[#00E676] mt-0.5">
                +{formatBRL(peakInWindow)}
              </div>
            </div>

            <div className="bg-[#1C1C21] p-2 rounded-xl border border-white/5">
              <div className="text-[9px] uppercase tracking-wider text-zinc-400 font-semibold">
                Rodadas Coletadas
              </div>
              <div className="font-mono text-xs font-extrabold text-white mt-0.5">
                {rounds.length} giros
              </div>
            </div>
          </div>

          {/* Main Recharts Line Chart */}
          <div className="w-full h-44 select-none pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="homeTrendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={strokeColor} stopOpacity={0.22} />
                    <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />

                <XAxis
                  dataKey="time"
                  stroke="#71717A"
                  fontSize={9}
                  tickLine={false}
                  axisLine={{ stroke: '#27272A' }}
                  interval="preserveStartEnd"
                />

                <YAxis
                  stroke="#71717A"
                  fontSize={9}
                  tickLine={false}
                  axisLine={{ stroke: '#27272A' }}
                  tickFormatter={(val: number) => {
                    if (viewMode === 'dayPL') {
                      return `R$${val >= 0 ? '+' : ''}${val}`;
                    }
                    return `R$${val}`;
                  }}
                />

                {viewMode === 'dayPL' && (
                  <ReferenceLine
                    y={0}
                    stroke="#52525B"
                    strokeDasharray="3 3"
                    strokeWidth={1.5}
                  />
                )}

                {viewMode === 'dayPL' && targetProfitEnabled && targetProfit > 0 && (
                  <ReferenceLine
                    y={targetProfit}
                    stroke="#EAB308"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: `Meta R$${targetProfit}`,
                      fill: '#EAB308',
                      fontSize: 9,
                      position: 'insideTopRight',
                    }}
                  />
                )}

                <Tooltip content={<TrendTooltip viewMode={viewMode} />} />

                <Area
                  type="monotone"
                  dataKey={viewMode === 'dayPL' ? 'dayPL' : 'balance'}
                  stroke="transparent"
                  fill="url(#homeTrendGradient)"
                />

                <Line
                  type="monotone"
                  dataKey={viewMode === 'dayPL' ? 'dayPL' : 'balance'}
                  stroke={strokeColor}
                  strokeWidth={2.2}
                  dot={(props: any) => {
                    const { cx, cy, payload, index } = props;
                    if (!payload?.hasBet) return null;
                    const isWin = payload.betOutcome === 'win';
                    const color = isWin ? '#00E676' : '#FF2442';
                    return (
                      <circle
                        key={`dot-trend-${index}`}
                        cx={cx}
                        cy={cy}
                        r={4}
                        fill="#141417"
                        stroke={color}
                        strokeWidth={2}
                      />
                    );
                  }}
                  activeDot={{
                    r: 5.5,
                    fill: strokeColor,
                    stroke: '#FFFFFF',
                    strokeWidth: 2,
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Micro Footer Indicator */}
          <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-0.5 border-t border-white/5">
            <div className="flex items-center gap-1 text-zinc-400">
              <Zap className="w-3 h-3 text-[#00E676]" />
              <span>Gráfico atualizado a cada novo giro da roleta</span>
            </div>
            <span>Últimos {Math.min(rounds.length, windowSize)} giros</span>
          </div>
        </>
      )}
    </div>
  );
};

// Rich Tooltip for Home Trend Chart
interface TrendTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  viewMode: 'dayPL' | 'balance';
}

const TrendTooltip: React.FC<TrendTooltipProps> = ({ active, payload, viewMode }) => {
  if (!active || !payload || !payload.length) return null;
  const data: RoundTrendPoint = payload[0].payload;

  const colorBg =
    data.color === 'red'
      ? 'bg-[#FF2442] text-white'
      : data.color === 'black'
      ? 'bg-black text-white border border-white/20'
      : 'bg-white text-black font-black';

  return (
    <div className="bg-[#1C1C21] border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-xs space-y-1 z-50 min-w-[150px]">
      <div className="flex items-center justify-between border-b border-white/10 pb-1 text-[10px] text-zinc-400">
        <span className="font-semibold">{data.fullTime}</span>
        <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${colorBg}`}>
          {data.color === 'white' ? '0' : data.roundNumber} {data.color.toUpperCase()}
        </span>
      </div>

      <div className="space-y-0.5 pt-0.5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-zinc-400 text-[11px]">P/L Acumulado:</span>
          <span
            className={`font-mono font-bold text-[11px] ${
              data.dayPL >= 0 ? 'text-[#00E676]' : 'text-[#FF2442]'
            }`}
          >
            {data.dayPL >= 0 ? `+${formatBRL(data.dayPL)}` : `-${formatBRL(Math.abs(data.dayPL))}`}
          </span>
        </div>

        {data.hasBet && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-zinc-400 text-[11px]">Entrada:</span>
            <span
              className={`font-mono font-black text-[11px] ${
                data.betOutcome === 'win' ? 'text-[#00E676]' : 'text-[#FF2442]'
              }`}
            >
              {data.betOutcome === 'win' ? `WIN (+${formatBRL(data.deltaPL)})` : `LOSS (${formatBRL(data.deltaPL)})`}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-white/5 pt-1 text-[10px]">
          <span className="text-zinc-400">Saldo da Banca:</span>
          <span className="font-mono font-bold text-white">
            {formatBRL(data.balance)}
          </span>
        </div>
      </div>
    </div>
  );
};
