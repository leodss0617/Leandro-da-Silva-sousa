import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts';
import { SignalRecord } from '../types';
import { formatBRL } from '../utils/audio';
import { TrendingUp, TrendingDown, Activity, DollarSign, Calendar, ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react';

interface BankrollChartProps {
  signals: SignalRecord[];
  dayPL: number;
  bankroll: number;
  dayWins: number;
  dayLosses: number;
  targetProfit?: number;
  targetProfitEnabled?: boolean;
}

interface ChartDataPoint {
  index: number;
  time: string;
  fullTime: string;
  cumulativePL: number;
  deltaPL: number;
  balance: number;
  outcome?: 'win' | 'loss' | 'start';
  gale?: number;
  color?: string;
  confidence?: number;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export const BankrollChart: React.FC<BankrollChartProps> = ({
  signals,
  dayPL,
  bankroll,
  dayWins,
  dayLosses,
  targetProfit = 0,
  targetProfitEnabled = false,
}) => {
  const [viewMode, setViewMode] = useState<'cumulative' | 'balance'>('cumulative');
  const [timeRange, setTimeRange] = useState<'today' | 'all'>('today');

  // Filter signals by timeRange
  const relevantSignals = useMemo(() => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;

    const sorted = [...signals].sort((a, b) => {
      const ta = new Date(a.at).getTime() || 0;
      const tb = new Date(b.at).getTime() || 0;
      return ta - tb;
    });

    if (timeRange === 'today') {
      const filtered = sorted.filter(s => {
        if (!s.at) return false;
        const d = new Date(s.at);
        if (isNaN(d.getTime())) return false;
        const sDateStr = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
        return sDateStr === todayStr;
      });

      // If user has signals today, use them; otherwise if all signals are recent, show them
      return filtered.length > 0 ? filtered : sorted;
    }

    return sorted;
  }, [signals, timeRange]);

  // Build cumulative dataset
  const { chartData, peakPL, maxDrawdown, minPL, maxPL } = useMemo(() => {
    const initialBankroll = bankroll - dayPL;
    let runningPL = 0;
    let peak = 0;
    let maxDd = 0;
    let minVal = 0;
    let maxVal = 0;

    const points: ChartDataPoint[] = [];

    // Starting baseline point
    const now = new Date();
    const startTimeStr = relevantSignals.length > 0 && relevantSignals[0].at
      ? new Date(new Date(relevantSignals[0].at).getTime() - 60000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      : '00:00';

    points.push({
      index: 0,
      time: startTimeStr,
      fullTime: 'Início da Sessão',
      cumulativePL: 0,
      deltaPL: 0,
      balance: Math.round(initialBankroll * 100) / 100,
      outcome: 'start',
    });

    relevantSignals.forEach((sig, idx) => {
      const pl = Number(sig.pl) || 0;
      runningPL += pl;
      runningPL = Math.round(runningPL * 100) / 100;

      if (runningPL > peak) peak = runningPL;
      const currentDd = peak - runningPL;
      if (currentDd > maxDd) maxDd = currentDd;
      if (runningPL < minVal) minVal = runningPL;
      if (runningPL > maxVal) maxVal = runningPL;

      let timeLabel = `E${idx + 1}`;
      let fullTimeLabel = `Entrada #${idx + 1}`;

      if (sig.at) {
        const d = new Date(sig.at);
        if (!isNaN(d.getTime())) {
          timeLabel = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
          fullTimeLabel = `${d.toLocaleDateString('pt-BR')} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
        }
      }

      points.push({
        index: idx + 1,
        time: timeLabel,
        fullTime: fullTimeLabel,
        cumulativePL: runningPL,
        deltaPL: pl,
        balance: Math.round((initialBankroll + runningPL) * 100) / 100,
        outcome: sig.outcome,
        gale: sig.gale,
        color: sig.color,
        confidence: sig.confidence,
      });
    });

    // If no signals yet, push current point at 0 / dayPL
    if (relevantSignals.length === 0) {
      points.push({
        index: 1,
        time: `${pad2(now.getHours())}:${pad2(now.getMinutes())}`,
        fullTime: 'Agora',
        cumulativePL: dayPL,
        deltaPL: dayPL,
        balance: bankroll,
        outcome: 'start',
      });
      minVal = Math.min(0, dayPL);
      maxVal = Math.max(0, dayPL);
    }

    return {
      chartData: points,
      peakPL: Math.max(peak, dayPL, 0),
      maxDrawdown: Math.max(maxDd, 0),
      minPL: minVal,
      maxPL: maxVal,
    };
  }, [relevantSignals, dayPL, bankroll]);

  const isProfit = dayPL >= 0;
  const strokeColor = isProfit ? '#00E676' : '#FF2442';
  const fillColor = isProfit ? 'rgba(0, 230, 118, 0.12)' : 'rgba(255, 36, 66, 0.12)';

  return (
    <div className="bg-[#141417] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-md space-y-4">
      {/* Header with Title & Stats Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0">
            <Activity className="w-4 h-4 text-[#00E676]" />
          </div>
          <div>
            <div className="text-xs font-display font-bold uppercase text-[#A1A1AA]">
              Curva de Lucro Diário (P/L)
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-lg sm:text-xl font-extrabold text-white">
                {dayPL >= 0 ? `+${formatBRL(dayPL)}` : `-${formatBRL(Math.abs(dayPL))}`}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  isProfit
                    ? 'bg-[#00E676]/15 border-[#00E676]/30 text-[#00E676]'
                    : 'bg-[#FF2442]/15 border-[#FF2442]/30 text-[#FF2442]'
                }`}
              >
                {isProfit ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {isProfit ? 'Em Lucro' : 'Em Drawdown'}
              </span>
            </div>
          </div>
        </div>

        {/* View Mode Toggle Controls */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-[#1C1C21] p-1 rounded-xl border border-white/5">
          <button
            type="button"
            onClick={() => setViewMode('cumulative')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              viewMode === 'cumulative'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            P/L Acumulado
          </button>
          <button
            type="button"
            onClick={() => setViewMode('balance')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              viewMode === 'balance'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Saldo Total
          </button>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-[#1C1C21] p-2.5 rounded-xl border border-white/5">
          <div className="text-[10px] font-semibold text-[#A1A1AA] uppercase flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3 text-[#00E676]" />
            Pico de Lucro
          </div>
          <div className="font-mono text-sm font-bold text-[#00E676] mt-0.5">
            +{formatBRL(peakPL)}
          </div>
        </div>

        <div className="bg-[#1C1C21] p-2.5 rounded-xl border border-white/5">
          <div className="text-[10px] font-semibold text-[#A1A1AA] uppercase flex items-center gap-1">
            <ArrowDownRight className="w-3 h-3 text-[#FF2442]" />
            Max Drawdown
          </div>
          <div className="font-mono text-sm font-bold text-[#FF2442] mt-0.5">
            -{formatBRL(maxDrawdown)}
          </div>
        </div>

        <div className="bg-[#1C1C21] p-2.5 rounded-xl border border-white/5">
          <div className="text-[10px] font-semibold text-[#A1A1AA] uppercase">
            Taxa de Acerto
          </div>
          <div className="font-mono text-sm font-bold text-white mt-0.5">
            {dayWins + dayLosses > 0
              ? `${Math.round((dayWins / (dayWins + dayLosses)) * 100)}% (${dayWins}W/${dayLosses}L)`
              : '0% (0/0)'}
          </div>
        </div>

        <div className="bg-[#1C1C21] p-2.5 rounded-xl border border-white/5">
          <div className="text-[10px] font-semibold text-[#A1A1AA] uppercase">
            Total Entradas
          </div>
          <div className="font-mono text-sm font-bold text-white mt-0.5">
            {relevantSignals.length} operações
          </div>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="w-full h-56 pt-2 select-none">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
          >
            <defs>
              <linearGradient id="plAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.25} />
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />

            <XAxis
              dataKey="time"
              stroke="#71717A"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#27272A' }}
            />

            <YAxis
              stroke="#71717A"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#27272A' }}
              tickFormatter={(val: number) => {
                if (viewMode === 'cumulative') {
                  return `R$${val >= 0 ? '+' : ''}${val}`;
                }
                return `R$${val}`;
              }}
            />

            {viewMode === 'cumulative' && (
              <ReferenceLine
                y={0}
                stroke="#52525B"
                strokeDasharray="3 3"
                strokeWidth={1.5}
              />
            )}

            {viewMode === 'cumulative' && targetProfitEnabled && targetProfit > 0 && (
              <ReferenceLine
                y={targetProfit}
                stroke="#EAB308"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: `Meta R$${targetProfit}`,
                  fill: '#EAB308',
                  fontSize: 10,
                  position: 'insideTopRight',
                }}
              />
            )}

            <Tooltip content={<CustomTooltip viewMode={viewMode} />} />

            <Area
              type="monotone"
              dataKey={viewMode === 'cumulative' ? 'cumulativePL' : 'balance'}
              stroke="transparent"
              fill="url(#plAreaGradient)"
            />

            <Line
              type="monotone"
              dataKey={viewMode === 'cumulative' ? 'cumulativePL' : 'balance'}
              stroke={viewMode === 'cumulative' ? strokeColor : '#38BDF8'}
              strokeWidth={2.5}
              dot={(props: any) => {
                const { cx, cy, payload, index } = props;
                if (index === 0) return null;
                const isWin = payload.outcome === 'win';
                const dotColor = isWin ? '#00E676' : payload.outcome === 'loss' ? '#FF2442' : strokeColor;
                return (
                  <circle
                    key={`dot-${index}`}
                    cx={cx}
                    cy={cy}
                    r={3.5}
                    fill="#141417"
                    stroke={dotColor}
                    strokeWidth={2}
                  />
                );
              }}
              activeDot={{
                r: 6,
                fill: strokeColor,
                stroke: '#FFFFFF',
                strokeWidth: 2,
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Footer with Informational Note */}
      <div className="flex items-center justify-between text-[11px] text-zinc-400 bg-[#1C1C21]/60 px-3 py-2 rounded-xl border border-white/5">
        <div className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-[#00E676] shrink-0" />
          <span>
            {relevantSignals.length > 0
              ? `Gráfico atualizado em tempo real com ${relevantSignals.length} sinal(is) processados hoje.`
              : 'Aguardando primeiros sinais do dia. A curva será plotada automaticamente.'}
          </span>
        </div>
        <div className="text-[10px] text-zinc-500 font-mono">
          Recharts v2.x
        </div>
      </div>
    </div>
  );
};

// Custom Rich Tooltip for Recharts
interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  viewMode: 'cumulative' | 'balance';
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, viewMode }) => {
  if (!active || !payload || !payload.length) return null;
  const data: ChartDataPoint = payload[0].payload;

  return (
    <div className="bg-[#1C1C21] border border-white/20 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs space-y-1.5 z-50 min-w-[160px]">
      <div className="flex items-center justify-between border-b border-white/10 pb-1 text-[11px] text-zinc-400">
        <span className="font-semibold">{data.fullTime}</span>
        {data.outcome && data.outcome !== 'start' && (
          <span
            className={`font-black uppercase text-[9px] px-1.5 py-0.2 rounded ${
              data.outcome === 'win'
                ? 'bg-[#00E676]/20 text-[#00E676]'
                : 'bg-[#FF2442]/20 text-[#FF2442]'
            }`}
          >
            {data.outcome === 'win' ? `WIN ${data.gale ? `(G${data.gale})` : ''}` : `LOSS (G${data.gale})`}
          </span>
        )}
      </div>

      <div className="space-y-1 pt-0.5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-zinc-400">P/L Acumulado:</span>
          <span
            className={`font-mono font-bold ${
              data.cumulativePL >= 0 ? 'text-[#00E676]' : 'text-[#FF2442]'
            }`}
          >
            {data.cumulativePL >= 0 ? `+${formatBRL(data.cumulativePL)}` : `-${formatBRL(Math.abs(data.cumulativePL))}`}
          </span>
        </div>

        {data.outcome && data.outcome !== 'start' && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-zinc-400">Nesta Operação:</span>
            <span
              className={`font-mono font-bold ${
                data.deltaPL >= 0 ? 'text-[#00E676]' : 'text-[#FF2442]'
              }`}
            >
              {data.deltaPL >= 0 ? `+${formatBRL(data.deltaPL)}` : `-${formatBRL(Math.abs(data.deltaPL))}`}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-white/5 pt-1 text-[11px]">
          <span className="text-zinc-400">Saldo da Banca:</span>
          <span className="font-mono font-bold text-white">
            {formatBRL(data.balance)}
          </span>
        </div>
      </div>
    </div>
  );
};
