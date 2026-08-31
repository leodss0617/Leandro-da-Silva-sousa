import React, { useState } from 'react';
import { Round, SignalRecord, DoubleColor } from '../types';
import { COLOR_PT, colorOf } from '../utils/prediction';
import { RefreshCw } from 'lucide-react';

interface HistoryTabProps {
  rounds: Round[];
  signals: SignalRecord[];
  onRefresh: () => void;
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ rounds, signals, onRefresh }) => {
  const [selectedDay, setSelectedDay] = useState<string>('today');

  // Group rounds by day YYYY-MM-DD
  const byDay: Record<string, Array<{ number: number; color: DoubleColor; date: Date; h: number; m: number; s: number }>> = {};
  
  rounds.forEach(r => {
    if (!r.created_at) return;
    const d = new Date(r.created_at);
    if (isNaN(d.getTime())) return;
    const key = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    if (!byDay[key]) byDay[key] = [];
    byDay[key].push({
      number: r.number,
      color: r.color || colorOf(r.number),
      date: d,
      h: d.getHours(),
      m: d.getMinutes(),
      s: d.getSeconds(),
    });
  });

  const days = Object.keys(byDay).sort().reverse();
  const activeDayKey = selectedDay === 'today' ? days[0] || 'today' : selectedDay;
  const dayRounds = byDay[activeDayKey] || [];

  // Group into 10-minute blocks (row = HH:block00-50, cols = 0-9 minute, 2 slots per minute)
  const bucket: Record<string, Record<number, Array<{ number: number; color: DoubleColor } | null>>> = {};
  
  dayRounds.forEach(r => {
    const block = Math.floor(r.m / 10) * 10;
    const col = r.m % 10;
    const rowKey = `${pad2(r.h)}:${pad2(block)}`;
    if (!bucket[rowKey]) bucket[rowKey] = {};
    if (!bucket[rowKey][col]) bucket[rowKey][col] = [];
    bucket[rowKey][col].push(r);
  });

  // Resolve 2 slots for each minute (approx 30s each)
  const formattedBucket: Record<string, Record<number, [any, any]>> = {};
  Object.keys(bucket).forEach(rk => {
    formattedBucket[rk] = {};
    for (let col = 0; col < 10; col++) {
      const arr = bucket[rk][col] || [];
      let s0 = null;
      let s1 = null;
      if (arr.length >= 2) {
        s0 = arr[arr.length - 2];
        s1 = arr[arr.length - 1];
      } else if (arr.length === 1) {
        s0 = arr[0];
        s1 = null;
      }
      formattedBucket[rk][col] = [s0, s1];
    }
  });

  const rowKeys = Object.keys(formattedBucket).sort((a, b) => {
    const pa = a.split(':').map(Number);
    const pb = b.split(':').map(Number);
    return pb[0] * 60 + pb[1] - (pa[0] * 60 + pa[1]);
  });

  return (
    <div className="space-y-3 pb-8">
      {/* 10-Minute Grid Map Card */}
      <div className="bg-[#141417] border border-white/10 rounded-2xl p-4 shadow-md">
        <div className="text-xs font-display font-bold uppercase text-[#A1A1AA] mb-1">
          Histórico — Mapa por Minuto
        </div>
        <p className="text-[11px] text-[#A1A1AA] leading-relaxed mb-3">
          Colunas <b>00–09</b> = minutos do bloco. Cada minuto possui <b>2 bolinhas</b> (2 rodadas ≈ 30s cada), layout oficial.
        </p>

        {/* Date Filter & Refresh */}
        <div className="flex gap-2 mb-3">
          <select
            value={selectedDay}
            onChange={e => setSelectedDay(e.target.value)}
            className="flex-1 bg-[#1C1C21] border border-white/10 text-white rounded-xl px-3 py-2 text-xs font-mono outline-none"
          >
            {days.length === 0 ? (
              <option value="today">Hoje</option>
            ) : (
              days.map(d => {
                const parts = d.split('-');
                return (
                  <option key={d} value={d}>
                    {parts[2]}/{parts[1]}/{parts[0]} ({byDay[d].length} rodadas)
                  </option>
                );
              })
            )}
          </select>

          <button
            type="button"
            onClick={onRefresh}
            className="px-3 py-2 bg-[#1C1C21] hover:bg-[#2A2A30] border border-white/10 text-white rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Atualizar
          </button>
        </div>

        {/* Minute Grid Scroll Area */}
        <div className="overflow-x-auto pb-2 -mx-1 px-1">
          <div className="min-w-[340px] space-y-2">
            {/* Header Columns 00 to 09 */}
            <div className="grid grid-cols-10 gap-1.5 justify-start">
              {['00', '01', '02', '03', '04', '05', '06', '07', '08', '09'].map(min => (
                <span
                  key={min}
                  className="w-7 text-center bg-blue-700 text-white font-mono text-[10px] font-bold py-1 rounded shadow-sm"
                >
                  {min}
                </span>
              ))}
            </div>

            {/* Grid Rows */}
            {rowKeys.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#A1A1AA] font-mono">
                Nenhuma rodada para o dia selecionado.
              </div>
            ) : (
              rowKeys.map(rk => {
                const parts = rk.split(':');
                const h = parseInt(parts[0], 10);
                const block = parseInt(parts[1], 10);

                return (
                  <div key={rk} className="grid grid-cols-10 gap-1.5 justify-start py-1 border-b border-white/5">
                    {Array.from({ length: 10 }).map((_, col) => {
                      const slots = formattedBucket[rk]?.[col] || [null, null];
                      const minute = block + col;
                      const timeStr = `${pad2(h)}:${pad2(minute)}`;

                      return (
                        <div key={col} className="w-7 flex flex-col items-center gap-1">
                          {/* Dual ball pair */}
                          <div className="flex flex-row gap-0.5 justify-center">
                            {slots.map((s, idx) => {
                              if (!s) {
                                return (
                                  <div
                                    key={idx}
                                    className="w-[13px] h-[13px] rounded-full border border-zinc-700 bg-transparent"
                                  />
                                );
                              }
                              const ballBg =
                                s.color === 'red'
                                  ? 'bg-[#E11D48] text-white border-[#E11D48]'
                                  : s.color === 'black'
                                  ? 'bg-[#18181B] text-white border-zinc-400'
                                  : 'bg-white text-[#E11D48] border-[#E11D48]';

                              return (
                                <div
                                  key={idx}
                                  title={`#${s.number} (${s.color})`}
                                  className={`w-[13px] h-[13px] rounded-full flex items-center justify-center font-mono text-[7px] font-bold border ${ballBg}`}
                                >
                                  {s.color === 'white' ? '★' : s.number}
                                </div>
                              );
                            })}
                          </div>
                          {/* Time label */}
                          <div className="text-[7px] text-zinc-500 font-mono text-center leading-none">
                            {timeStr}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Recent List */}
      <div className="bg-[#141417] border border-white/10 rounded-2xl p-4 shadow-md">
        <div className="text-xs font-display font-bold uppercase text-[#A1A1AA] mb-3">
          Lista Recente ({rounds.length})
        </div>
        <div className="max-h-60 overflow-y-auto space-y-1 divide-y divide-white/5 pr-1">
          {rounds.length === 0 ? (
            <div className="text-center py-4 text-xs text-[#A1A1AA]">Sem rodadas no histórico</div>
          ) : (
            rounds
              .slice(-60)
              .reverse()
              .map((r, i) => {
                const ballBg =
                  r.color === 'red'
                    ? 'bg-[#FF2442] text-white'
                    : r.color === 'black'
                    ? 'bg-[#334155] text-white'
                    : 'bg-white text-black font-bold';

                const time = r.created_at ? new Date(r.created_at).toLocaleTimeString('pt-BR') : '—';

                return (
                  <div key={r.id || i} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold ${ballBg}`}>
                        {r.number}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">
                          {COLOR_PT[r.color]} #{r.number}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono">{time}</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono bg-[#1C1C21] px-2 py-0.5 rounded border border-white/5">
                      {r.source}
                    </span>
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* Signals List */}
      <div className="bg-[#141417] border border-white/10 rounded-2xl p-4 shadow-md">
        <div className="text-xs font-display font-bold uppercase text-[#A1A1AA] mb-3">
          Sinais e Entradas Anteriores ({signals.length})
        </div>
        <div className="max-h-52 overflow-y-auto space-y-1 divide-y divide-white/5 pr-1">
          {signals.length === 0 ? (
            <div className="text-center py-4 text-xs text-[#A1A1AA]">Nenhum sinal registrado ainda</div>
          ) : (
            signals
              .slice(-40)
              .reverse()
              .map((s, i) => {
                const isWin = s.outcome === 'win';
                const time = s.at ? new Date(s.at).toLocaleTimeString('pt-BR') : '—';

                return (
                  <div key={i} className="flex items-center justify-between py-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3.5 h-3.5 rounded-full ${
                          s.color === 'red' ? 'bg-[#FF2442]' : s.color === 'black' ? 'bg-slate-400' : 'bg-white'
                        }`}
                      />
                      <div>
                        <span className="font-bold text-white mr-1.5">{COLOR_PT[s.color]}</span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {Math.round(s.confidence * 100)}% · G{s.gale} · {time}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                        isWin ? 'bg-[#00E676]/20 text-[#00E676]' : 'bg-[#FF2442]/20 text-[#FF2442]'
                      }`}
                    >
                      {isWin ? 'WIN' : 'LOSS'} {s.pl >= 0 ? `+R$${s.pl.toFixed(2)}` : `-R$${Math.abs(s.pl).toFixed(2)}`}
                    </span>
                  </div>
                );
              })
          )}
        </div>
      </div>
    </div>
  );
};
