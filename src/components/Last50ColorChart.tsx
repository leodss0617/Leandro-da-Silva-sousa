import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { Round } from '../types';
import { BarChart3, Scale, AlertTriangle, CheckCircle2, Flame, Snowflake, Info } from 'lucide-react';

interface Last50ColorChartProps {
  rounds: Round[];
}

interface ColorStatItem {
  key: 'red' | 'black' | 'white';
  name: string;
  count: number;
  pct: number;
  expectedPct: number;
  expectedCount: number;
  deltaPct: number;
  deltaCount: number;
  fillColor: string;
  strokeColor: string;
  textColor: string;
  badgeBg: string;
}

export const Last50ColorChart: React.FC<Last50ColorChartProps> = ({ rounds }) => {
  const [sampleSize, setSampleSize] = useState<50 | 25 | 100>(50);

  const {
    data,
    totalSample,
    imbalanceReport,
    dominantColor,
  } = useMemo(() => {
    const totalAvailable = rounds.length;
    const selectedRounds = totalAvailable > sampleSize ? rounds.slice(-sampleSize) : rounds;
    const count = selectedRounds.length || 1;

    let redCount = 0;
    let blackCount = 0;
    let whiteCount = 0;

    for (let i = 0; i < selectedRounds.length; i++) {
      const c = selectedRounds[i].color;
      if (c === 'red') redCount++;
      else if (c === 'black') blackCount++;
      else if (c === 'white') whiteCount++;
    }

    const redPct = (redCount / count) * 100;
    const blackPct = (blackCount / count) * 100;
    const whitePct = (whiteCount / count) * 100;

    // Double Blaze standard theoretical probability: 7/15 (~46.67%), 7/15 (~46.67%), 1/15 (~6.67%)
    const expRedPct = 46.67;
    const expBlackPct = 46.67;
    const expWhitePct = 6.67;

    const expRedCount = Math.round((expRedPct / 100) * count * 10) / 10;
    const expBlackCount = Math.round((expBlackPct / 100) * count * 10) / 10;
    const expWhiteCount = Math.round((expWhitePct / 100) * count * 10) / 10;

    const stats: ColorStatItem[] = [
      {
        key: 'red',
        name: 'Vermelho',
        count: redCount,
        pct: redPct,
        expectedPct: expRedPct,
        expectedCount: expRedCount,
        deltaPct: redPct - expRedPct,
        deltaCount: redCount - expRedCount,
        fillColor: '#FF2442',
        strokeColor: '#FF2442',
        textColor: 'text-[#FF2442]',
        badgeBg: 'bg-[#FF2442]/15 text-[#FF2442] border-[#FF2442]/30',
      },
      {
        key: 'black',
        name: 'Preto',
        count: blackCount,
        pct: blackPct,
        expectedPct: expBlackPct,
        expectedCount: expBlackCount,
        deltaPct: blackPct - expBlackPct,
        deltaCount: blackCount - expBlackCount,
        fillColor: '#64748B',
        strokeColor: '#94A3B8',
        textColor: 'text-slate-300',
        badgeBg: 'bg-slate-800/80 text-slate-300 border-slate-700',
      },
      {
        key: 'white',
        name: 'Branco',
        count: whiteCount,
        pct: whitePct,
        expectedPct: expWhitePct,
        expectedCount: expWhiteCount,
        deltaPct: whitePct - expWhitePct,
        deltaCount: whiteCount - expWhiteCount,
        fillColor: '#FFFFFF',
        strokeColor: '#E2E8F0',
        textColor: 'text-white',
        badgeBg: 'bg-white/20 text-white border-white/40',
      },
    ];

    // Imbalance diagnosis
    let dominant: 'red' | 'black' | 'white' | 'balanced' = 'balanced';
    let statusText = 'Mesa em Equilíbrio';
    let statusDesc = 'Distribuição próxima à expectativa teórica estatística.';
    let statusType: 'balanced' | 'warning' | 'alert' = 'balanced';

    const redDiff = redPct - blackPct;

    if (whitePct >= 12) {
      statusText = `Sobrecarga de Branco (${whiteCount}x)`;
      statusDesc = `Branco saindo ${whitePct.toFixed(1)}% acima da média estatística (6.7%).`;
      statusType = 'warning';
      dominant = 'white';
    } else if (redDiff >= 14) {
      statusText = `Predomínio de Vermelho (+${redDiff.toFixed(0)}%)`;
      statusDesc = `Vermelho domina com ${redPct.toFixed(1)}% contra ${blackPct.toFixed(1)}% do preto.`;
      statusType = 'alert';
      dominant = 'red';
    } else if (redDiff <= -14) {
      statusText = `Predomínio de Preto (+${Math.abs(redDiff).toFixed(0)}%)`;
      statusDesc = `Preto domina com ${blackPct.toFixed(1)}% contra ${redPct.toFixed(1)}% do vermelho.`;
      statusType = 'alert';
      dominant = 'black';
    } else if (whiteCount === 0 && count >= 30) {
      statusText = 'Atraso Crítico do Branco';
      statusDesc = `Nenhum branco nos últimos ${count} giros (esperado ~${expWhiteCount}x).`;
      statusType = 'warning';
      dominant = 'white';
    }

    return {
      data: stats,
      totalSample: count,
      imbalanceReport: { statusText, statusDesc, statusType },
      dominantColor: dominant,
    };
  }, [rounds, sampleSize]);

  return (
    <div className="bg-[#141417] border border-white/10 rounded-2xl p-4 shadow-md space-y-3.5">
      {/* Header with Title and Sample Filter */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-display font-bold uppercase text-white tracking-wide">
              Contagem por Cor ({totalSample} Giros)
            </div>
            <div className="text-[10px] text-zinc-400">
              Identificação de tendência e desequilíbrio na roleta
            </div>
          </div>
        </div>

        {/* Sample size toggle */}
        <div className="flex items-center gap-1 bg-[#1C1C21] p-0.5 rounded-lg border border-white/5 text-[10px]">
          <button
            type="button"
            onClick={() => setSampleSize(25)}
            className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
              sampleSize === 25 ? 'bg-white/15 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            25G
          </button>
          <button
            type="button"
            onClick={() => setSampleSize(50)}
            className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
              sampleSize === 50 ? 'bg-white/15 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            50G
          </button>
          <button
            type="button"
            onClick={() => setSampleSize(100)}
            className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
              sampleSize === 100 ? 'bg-white/15 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            100G
          </button>
        </div>
      </div>

      {/* Imbalance Status Badge */}
      <div
        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${
          imbalanceReport.statusType === 'alert'
            ? 'bg-[#FF2442]/10 border-[#FF2442]/30 text-white'
            : imbalanceReport.statusType === 'warning'
            ? 'bg-yellow-500/10 border-yellow-500/30 text-white'
            : 'bg-emerald-500/10 border-emerald-500/30 text-white'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {imbalanceReport.statusType === 'alert' ? (
            <Flame className="w-4 h-4 text-[#FF2442] shrink-0" />
          ) : imbalanceReport.statusType === 'warning' ? (
            <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
          ) : (
            <Scale className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <div className="min-w-0">
            <div className="font-bold truncate text-[11px]">{imbalanceReport.statusText}</div>
            <div className="text-[10px] text-zinc-300 truncate">{imbalanceReport.statusDesc}</div>
          </div>
        </div>

        <div className="shrink-0 text-right font-mono text-[10px]">
          {dominantColor === 'red' && (
            <span className="text-[#FF2442] font-black bg-[#FF2442]/20 px-1.5 py-0.5 rounded border border-[#FF2442]/40">
              🔴 +VERMELHO
            </span>
          )}
          {dominantColor === 'black' && (
            <span className="text-slate-300 font-black bg-slate-800 px-1.5 py-0.5 rounded border border-slate-600">
              ⚫ +PRETO
            </span>
          )}
          {dominantColor === 'white' && (
            <span className="text-white font-black bg-white/20 px-1.5 py-0.5 rounded border border-white/30">
              ⚪ BRANCO
            </span>
          )}
          {dominantColor === 'balanced' && (
            <span className="text-emerald-400 font-black bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30">
              ⚖️ EQUILÍBRIO
            </span>
          )}
        </div>
      </div>

      {/* Recharts Simple Bar Chart */}
      <div className="w-full h-40 pt-1 select-none">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 12, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#A1A1AA"
              fontSize={11}
              fontWeight={600}
              tickLine={false}
              axisLine={{ stroke: '#27272A' }}
            />
            <YAxis
              stroke="#71717A"
              fontSize={9}
              tickLine={false}
              axisLine={{ stroke: '#27272A' }}
              tickFormatter={(val: number) => `${val}`}
            />
            <Tooltip content={<CustomBarTooltip totalSample={totalSample} />} />

            <Bar
              dataKey="count"
              radius={[6, 6, 0, 0]}
              maxBarSize={54}
            >
              {data.map((entry) => (
                <Cell
                  key={`cell-${entry.key}`}
                  fill={entry.fillColor}
                  stroke={entry.strokeColor}
                  strokeWidth={1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Proportional Color Cards Comparison */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        {data.map(item => {
          const isHigher = item.deltaCount > 0;
          const isNear = Math.abs(item.deltaCount) < 1.5;

          return (
            <div
              key={item.key}
              className="bg-[#1C1C21] p-2.5 rounded-xl border border-white/5 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-extrabold ${item.textColor} flex items-center gap-1`}>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      item.key === 'red'
                        ? 'bg-[#FF2442]'
                        : item.key === 'black'
                        ? 'bg-slate-400'
                        : 'bg-white'
                    }`}
                  />
                  {item.name}
                </span>
                <span className="font-mono text-xs font-black text-white">
                  {item.count}
                </span>
              </div>

              {/* Progress Bar with Expected Marker */}
              <div className="relative w-full h-2 bg-black/40 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, item.pct)}%`,
                    backgroundColor: item.fillColor,
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                <span>{item.pct.toFixed(1)}%</span>
                <span
                  className={
                    isNear
                      ? 'text-zinc-500'
                      : isHigher
                      ? 'text-emerald-400 font-bold'
                      : 'text-amber-400 font-bold'
                  }
                >
                  {isNear ? '≈ Média' : `${isHigher ? '+' : ''}${item.deltaCount.toFixed(0)} giros`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[10px] text-zinc-500 border-t border-white/5 pt-1">
        <span className="flex items-center gap-1">
          <Info className="w-3 h-3 text-zinc-400" />
          Média teórica da roleta: 46.7% 🔴 · 46.7% ⚫ · 6.7% ⚪
        </span>
        <span>Amostra: {totalSample} giros</span>
      </div>
    </div>
  );
};

interface CustomBarTooltipProps {
  active?: boolean;
  payload?: any[];
  totalSample: number;
}

const CustomBarTooltip: React.FC<CustomBarTooltipProps> = ({ active, payload, totalSample }) => {
  if (!active || !payload || !payload.length) return null;
  const item: ColorStatItem = payload[0].payload;

  return (
    <div className="bg-[#1C1C21] border border-white/20 rounded-xl p-2.5 shadow-2xl backdrop-blur-md text-xs space-y-1 z-50 min-w-[150px]">
      <div className="flex items-center justify-between border-b border-white/10 pb-1 font-bold">
        <span className={item.textColor}>{item.name}</span>
        <span className="font-mono text-white">{item.count} de {totalSample}</span>
      </div>
      <div className="space-y-0.5 pt-0.5 text-[11px]">
        <div className="flex justify-between">
          <span className="text-zinc-400">Frequência Real:</span>
          <span className="font-mono font-bold text-white">{item.pct.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">Esperado Teórico:</span>
          <span className="font-mono text-zinc-300">{item.expectedPct.toFixed(1)}% (~{item.expectedCount}x)</span>
        </div>
        <div className="flex justify-between border-t border-white/5 pt-0.5">
          <span className="text-zinc-400">Desvio:</span>
          <span
            className={`font-mono font-bold ${
              item.deltaPct > 0 ? 'text-emerald-400' : item.deltaPct < 0 ? 'text-amber-400' : 'text-zinc-300'
            }`}
          >
            {item.deltaPct > 0 ? `+${item.deltaPct.toFixed(1)}%` : `${item.deltaPct.toFixed(1)}%`}
          </span>
        </div>
      </div>
    </div>
  );
};
