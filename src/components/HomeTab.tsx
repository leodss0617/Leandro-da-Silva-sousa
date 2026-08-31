import React from 'react';
import { Round, PredictionResult, BrainState, AppPreferences, LearnState, MegaTroiaState, DoubleColor, SignalRecord } from '../types';
import { COLOR_LABEL, COLOR_PT, calculateDynamicGaleMultiplier } from '../utils/prediction';
import { formatBRL } from '../utils/audio';
import { HomeTrendChart } from './HomeTrendChart';
import { Last50ColorChart } from './Last50ColorChart';
import { Play, Square, Sparkles, Download, Upload, Trash2, Plus, RefreshCw, Radio, Brain, Cpu, Zap, CheckCircle2 } from 'lucide-react';

interface HomeTabProps {
  rounds: Round[];
  prediction: PredictionResult | null;
  brain: BrainState;
  prefs: AppPreferences;
  learn: LearnState;
  mega: MegaTroiaState;
  bankroll: number;
  dayWins: number;
  dayLosses: number;
  dayPL?: number;
  signals?: SignalRecord[];
  signalsCount: number;
  collectorRunning: boolean;
  collectorSource?: string;
  isSyncing?: boolean;
  onUpdatePref?: (key: keyof AppPreferences, val: any) => void;
  onToggleCollector: () => void;
  onForcePredict: () => void;
  onImport: () => void;
  onExport: () => void;
  onClear: () => void;
  onAddManual: (n: number) => void;
  onSyncHistory?: () => void;
  onOpenCollectorModal?: () => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  rounds,
  prediction,
  brain,
  prefs,
  learn,
  mega,
  bankroll,
  dayWins,
  dayLosses,
  dayPL = 0,
  signals = [],
  signalsCount,
  collectorRunning,
  collectorSource = 'Blaze Live',
  isSyncing = false,
  onUpdatePref,
  onToggleCollector,
  onForcePredict,
  onImport,
  onExport,
  onClear,
  onAddManual,
  onSyncHistory,
  onOpenCollectorModal,
}) => {
  const isBrainActive = prefs.brain_enabled;
  const isGaleActive = isBrainActive && brain.state === 'in_gale' && brain.galeLevel > 0;
  const isWaitingSignal = isBrainActive
    ? brain.state === 'idle' || (!isGaleActive && (!prediction || prediction.action === 'SKIP' || prediction.color === 'skip'))
    : (!prediction || prediction.action === 'SKIP' || prediction.color === 'skip');

  const targetColor = isGaleActive
    ? (brain.currentPred?.color || prediction?.color || 'red')
    : (isBrainActive && brain.state === 'waiting' && brain.currentPred?.color)
    ? brain.currentPred.color
    : (prediction?.color || 'skip');

  const confidence = isGaleActive && brain.currentPred
    ? Math.round(brain.currentPred.confidence * 100)
    : prediction
    ? Math.round(prediction.confidence * 100)
    : 0;

  const prob = prediction && targetColor !== 'skip' ? (prediction.probs[targetColor as DoubleColor] * 100).toFixed(1) : '—';
  
  const reasons = isGaleActive
    ? [
        `🧠 Cérebro IA gerenciando Gale ${brain.galeLevel} de ${prefs.brain_max_gales}.`,
        `Recuperando entrada na cor ${COLOR_LABEL[targetColor as DoubleColor] || targetColor.toUpperCase()}.`,
      ]
    : isWaitingSignal
    ? [
        isBrainActive ? '🧠 Cérebro IA sincronizado e monitorando padrões em tempo real.' : 'Probabilidade insuficiente para entrada segura.',
        'Aguardando confirmação do próximo giro.',
      ]
    : (prediction?.reasons || ['Padrão identificado pela inteligência artificial.']);

  // Distribution
  const total = rounds.length || 1;
  const rc = rounds.filter(r => r.color === 'red').length;
  const bc = rounds.filter(r => r.color === 'black').length;
  const wc = rounds.filter(r => r.color === 'white').length;
  const rPct = (rc / total) * 100;
  const bPct = (bc / total) * 100;
  const wPct = (wc / total) * 100;
  const circ = 2 * Math.PI * 30; // ~188.5

  // Since white
  let sinceWhite = 0;
  for (let i = rounds.length - 1; i >= 0; i--) {
    if (rounds[i].color === 'white') break;
    sinceWhite++;
  }

  // Win rate
  const totalSignals = dayWins + dayLosses;
  const winRate = totalSignals > 0 ? `${Math.round((dayWins / totalSignals) * 100)}%` : '—';

  // Bet values & Dynamic Volatility Multiplier
  const baseBet = prefs.bet_amount || 2.5;
  const dynamicInfo = calculateDynamicGaleMultiplier(
    bankroll,
    baseBet,
    0,
    dayWins,
    dayLosses,
    prefs.brain_gale_multiplier,
    prefs.bankroll_mode
  );
  const mult = prefs.brain_auto_multiplier ? dynamicInfo.multiplier : (prefs.brain_gale_multiplier || 2);
  const g1 = baseBet * mult;
  const g2 = baseBet * mult * mult;

  // Active mega or gale display
  const inMega = mega.enabled && mega.rows.length > 0;
  const megaCurrent = mega.rows[Math.min((mega.currentEntry || 1) - 1, mega.rows.length - 1)];
  const currentBetAmount = isGaleActive 
    ? (inMega && megaCurrent ? megaCurrent.black : brain.entryAmount || (brain.galeLevel === 1 ? g1 : g2))
    : (inMega && megaCurrent ? megaCurrent.black : baseBet);

  return (
    <div className="space-y-3 pb-8">
      {/* Brain Master Synchronizer Banner */}
      <div className={`p-3.5 rounded-2xl border transition-all shadow-md ${
        isBrainActive
          ? 'bg-gradient-to-r from-[#1E1428] via-[#161420] to-[#141417] border-[#A855F7]/40 ring-1 ring-[#A855F7]/20'
          : 'bg-[#141417] border-white/10'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all ${
              isBrainActive 
                ? 'bg-[#A855F7]/20 border-[#A855F7]/60 text-[#C084FC] shadow-[0_0_12px_rgba(168,85,247,0.3)] animate-pulse'
                : 'bg-white/5 border-white/10 text-zinc-500'
            }`}>
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-display font-bold text-white tracking-wide">
                  CÉREBRO IA
                </span>
                {isBrainActive ? (
                  <span className="text-[10px] bg-[#A855F7]/20 text-[#C084FC] border border-[#A855F7]/40 font-black px-2 py-0.2 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00E676] animate-ping" />
                    SINCRONIZADO
                  </span>
                ) : (
                  <span className="text-[10px] bg-zinc-800 text-zinc-400 font-bold px-2 py-0.2 rounded-full">
                    DESATIVADO
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
                {isBrainActive
                  ? isGaleActive
                    ? `Controlando Gale ${brain.galeLevel} de ${prefs.brain_max_gales} · Multiplicador ${prefs.brain_gale_multiplier}x`
                    : brain.state === 'waiting'
                    ? `1ª Entrada Armada no ${COLOR_LABEL[targetColor as DoubleColor] || 'Alvo'}`
                    : `Sincronizado e monitorando giros em tempo real (Ciclos: ${brain.cycles})`
                  : 'Ative para o Cérebro IA assumir o controle total das entradas e gales'}
              </p>
            </div>
          </div>

          {onUpdatePref && (
            <button
              type="button"
              onClick={() => onUpdatePref('brain_enabled', !prefs.brain_enabled)}
              title={isBrainActive ? 'Desativar Cérebro IA' : 'Ativar e Sincronizar Cérebro IA'}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer border shrink-0 ${
                isBrainActive ? 'bg-[#A855F7] border-[#A855F7]' : 'bg-[#1C1C21] border-white/10'
              }`}
            >
              <div
                className={`w-4.5 h-4.5 rounded-full bg-white transition-transform shadow ${
                  isBrainActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Prediction Hero Card */}
      <div
        id="predHero"
        className={`relative overflow-hidden rounded-2xl p-5 border shadow-xl transition-all ${
          isGaleActive
            ? 'border-[#FF9100]/60 bg-gradient-to-br from-[#1C1710] to-[#141417] ring-1 ring-[#FF9100]/30 animate-pulse'
            : !isWaitingSignal
            ? 'border-white/10 bg-gradient-to-br from-[#1C1C21] to-[#141417] signal-flash'
            : 'border-white/5 bg-[#141417]/80'
        }`}
      >
        <div className="absolute inset-0 bg-radial from-[#FF2442]/10 to-transparent pointer-events-none" />

        <div className="flex items-center justify-between relative z-10 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="font-display text-[11px] font-bold tracking-wider uppercase text-[#A1A1AA]">
              {isGaleActive ? 'Recuperação Gale Ativa' : isBrainActive ? 'Ordem Cérebro IA' : 'Próxima Entrada'}
            </span>
            {isBrainActive && (
              <span className="text-[9px] bg-[#A855F7]/20 text-[#C084FC] border border-[#A855F7]/30 px-1.5 py-0.5 rounded font-mono font-bold">
                AUTO
              </span>
            )}
          </div>
          {isGaleActive ? (
            <span className="inline-flex items-center gap-1 bg-[#FF9100]/20 border border-[#FF9100] text-[#FF9100] text-xs font-black px-3 py-1 rounded-full animate-bounce shadow-[0_0_12px_rgba(255,145,0,0.4)]">
              ⚡ GALE {brain.galeLevel}
            </span>
          ) : !isWaitingSignal ? (
            <span className="inline-flex items-center gap-1 bg-[#00E676]/20 border border-[#00E676]/60 text-[#00E676] text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
              ▶ 1ª ENTRADA
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-zinc-800/80 border border-white/10 text-zinc-400 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
              ⏸ NO AGUARDO
            </span>
          )}
        </div>

        {/* Prediction Color / Waiting State */}
        <div
          id="predColor"
          className={`font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-center my-2 uppercase ${
            isWaitingSignal
              ? 'text-zinc-500 font-bold'
              : targetColor === 'red'
              ? 'text-[#FF2442] drop-shadow-[0_0_20px_rgba(255,36,66,0.5)]'
              : targetColor === 'black'
              ? 'text-slate-300 drop-shadow-[0_0_15px_rgba(148,163,184,0.3)]'
              : 'text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.6)]'
          }`}
        >
          {isWaitingSignal ? 'NO AGUARDO' : COLOR_LABEL[targetColor as DoubleColor] || 'ENTRAR'}
        </div>

        {/* Active Bet Value Callout */}
        <div className="text-center my-1.5">
          {isGaleActive ? (
            <div className="inline-flex items-center gap-1.5 bg-[#FF9100]/15 border border-[#FF9100]/40 px-3.5 py-1.5 rounded-xl">
              <span className="text-[11px] text-[#FF9100] uppercase font-bold">Valor no Gale {brain.galeLevel}:</span>
              <strong className="text-white text-sm font-mono font-black">{formatBRL(currentBetAmount)}</strong>
            </div>
          ) : !isWaitingSignal ? (
            <div className="inline-flex items-center gap-1.5 bg-[#00E676]/15 border border-[#00E676]/30 px-3 py-1 rounded-xl">
              <span className="text-[11px] text-[#00E676] uppercase font-bold">Aposta Sugerida:</span>
              <strong className="text-white text-sm font-mono font-black">{formatBRL(currentBetAmount)}</strong>
            </div>
          ) : (
            <span className="text-[11px] text-zinc-500 font-mono">Aguardando confirmação do próximo giro</span>
          )}
        </div>

        {/* Prediction Meta Grid */}
        <div className="grid grid-cols-3 gap-2 text-center font-mono my-3 text-xs">
          <div className="bg-black/25 py-2 rounded-xl border border-white/5">
            <span className="text-[10px] text-[#A1A1AA] uppercase block">Confiança</span>
            <strong className="text-white text-sm font-bold">{isWaitingSignal ? '—' : `${confidence}%`}</strong>
          </div>
          <div className="bg-black/25 py-2 rounded-xl border border-white/5">
            <span className="text-[10px] text-[#A1A1AA] uppercase block">Prob. IA</span>
            <strong className="text-white text-sm font-bold">{isWaitingSignal || prob === '—' ? '—' : `${prob}%`}</strong>
          </div>
          <div className="bg-black/25 py-2 rounded-xl border border-white/5">
            <span className="text-[10px] text-[#A1A1AA] uppercase block">Ação</span>
            <strong className={`text-sm font-black ${
              isGaleActive
                ? 'text-[#FF9100]'
                : !isWaitingSignal
                ? 'text-[#00E676]'
                : 'text-zinc-500'
            }`}>
              {isGaleActive ? `GALE ${brain.galeLevel}` : !isWaitingSignal ? 'ENTRAR' : 'AGUARDAR'}
            </strong>
          </div>
        </div>

        {/* Confidence Fill Bar */}
        <div className="w-full h-1.5 bg-[#1C1C21] rounded-full overflow-hidden my-3 border border-white/5">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isGaleActive
                ? 'bg-[#FF9100]'
                : !isWaitingSignal
                ? 'bg-gradient-to-r from-[#FF2442] to-[#00E676]'
                : 'bg-zinc-700'
            }`}
            style={{ width: isWaitingSignal ? '15%' : `${confidence}%` }}
          />
        </div>

        {/* Reasons & Deep Analysis */}
        <p className="text-xs text-[#A1A1AA] text-center leading-relaxed font-sans mt-2">
          {reasons.join(' · ')}
        </p>

        {/* Bet Suggestion Chips */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/5">
          <div className={`bg-[#1C1C21] border rounded-xl p-2 text-center transition-all ${
            !isGaleActive && !isWaitingSignal
              ? 'border-[#00E676] ring-1 ring-[#00E676] bg-[#00E676]/5'
              : 'border-white/10'
          }`}>
            <div className="text-[10px] text-[#A1A1AA] uppercase font-bold">
              {inMega ? `Cor ${mega.currentEntry}ª` : '1ª Entrada'}
            </div>
            <div className="font-mono text-xs sm:text-sm font-bold text-white mt-0.5">
              {inMega && megaCurrent ? formatBRL(megaCurrent.black) : formatBRL(baseBet)}
            </div>
          </div>

          <div className={`bg-[#1C1C21] border rounded-xl p-2 text-center transition-all ${
            isGaleActive && brain.galeLevel === 1
              ? 'border-[#FF9100] ring-2 ring-[#FF9100] bg-[#FF9100]/10 shadow-[0_0_10px_rgba(255,145,0,0.3)]'
              : 'border-white/10'
          }`}>
            <div className="text-[10px] text-[#A1A1AA] uppercase font-bold flex items-center justify-center gap-1">
              <span>{inMega ? `Cor ${(mega.currentEntry || 1) + 1}ª` : 'Gale 1'}</span>
              {prefs.brain_auto_multiplier && !inMega && (
                <span className="text-[8px] bg-[#A855F7]/30 text-[#C084FC] px-1 py-0.2 rounded font-mono">
                  {mult.toFixed(1)}x
                </span>
              )}
            </div>
            <div className="font-mono text-xs sm:text-sm font-bold text-[#FF9100] mt-0.5">
              {inMega && mega.rows[mega.currentEntry]
                ? formatBRL(mega.rows[mega.currentEntry].black)
                : formatBRL(g1)}
            </div>
          </div>

          <div className={`bg-[#1C1C21] border rounded-xl p-2 text-center transition-all ${
            isGaleActive && brain.galeLevel >= 2
              ? 'border-[#FF2442] ring-2 ring-[#FF2442] bg-[#FF2442]/10 shadow-[0_0_10px_rgba(255,36,66,0.3)]'
              : 'border-white/10'
          }`}>
            <div className="text-[10px] text-[#A1A1AA] uppercase font-bold flex items-center justify-center gap-1">
              <span>{inMega ? `Cor ${(mega.currentEntry || 1) + 2}ª` : 'Gale 2'}</span>
              {prefs.brain_auto_multiplier && !inMega && (
                <span className="text-[8px] bg-[#A855F7]/30 text-[#C084FC] px-1 py-0.2 rounded font-mono">
                  {(mult * mult).toFixed(1)}x
                </span>
              )}
            </div>
            <div className="font-mono text-xs sm:text-sm font-bold text-[#FF2442] mt-0.5">
              {inMega && mega.rows[(mega.currentEntry || 1) + 1]
                ? formatBRL(mega.rows[(mega.currentEntry || 1) + 1].black)
                : formatBRL(g2)}
            </div>
          </div>
        </div>

        {inMega && megaCurrent && (
          <div className="mt-2 text-center text-xs text-zinc-300 font-mono">
            Proteção Branco: <strong className="text-white">{formatBRL(megaCurrent.white)}</strong> · Total: <strong className="text-white">{formatBRL(megaCurrent.total)}</strong>
          </div>
        )}
      </div>

      {/* Live Recent Strip */}
      <div className="bg-[#141417] border border-white/10 rounded-2xl p-4 shadow-md">
        <div className="flex items-center justify-between text-xs font-display font-bold uppercase text-[#A1A1AA] mb-2.5">
          <div className="flex items-center gap-2">
            <span>Últimas Rodadas</span>
            <button
              type="button"
              onClick={onOpenCollectorModal}
              title="Ver detalhes da conexão"
              className="px-2 py-0.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-zinc-300 font-mono flex items-center gap-1 cursor-pointer transition-all"
            >
              <Radio className="w-2.5 h-2.5 text-[#00E676] animate-pulse" />
              {collectorSource}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-zinc-400 font-normal">{rounds.length} rodadas</span>
            {onSyncHistory && (
              <button
                type="button"
                onClick={onSyncHistory}
                disabled={isSyncing}
                title="Sincronizar últimos giros da Blaze"
                className="p-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white cursor-pointer transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-[#FF2442]' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {rounds.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#A1A1AA] font-mono">
            Nenhuma rodada coletada ainda. Inicie a coleta ou adicione rodadas abaixo.
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto py-1 scrollbar-none items-center">
            {rounds
              .slice(-30)
              .reverse()
              .map((r, i) => {
                const isLatest = i === 0;
                const ballBg =
                  r.color === 'red'
                    ? 'bg-[#FF2442] text-white'
                    : r.color === 'black'
                    ? 'bg-[#334155] text-white'
                    : 'bg-[#E2E8F0] text-black';

                return (
                  <div
                    key={r.id || `${r.number}-${i}`}
                    title={`#${r.number} (${COLOR_PT[r.color]})`}
                    className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center font-mono text-[11px] font-bold shadow transition-transform ${ballBg} ${
                      isLatest ? 'ring-2 ring-white scale-110 shadow-lg' : ''
                    }`}
                  >
                    {r.number}
                  </div>
                );
              })}
          </div>
        )}

        {/* Quick Add Numbers Bar (for testing/manual usage) */}
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between gap-1 flex-wrap">
          <span className="text-[10px] uppercase font-bold text-zinc-400 font-mono">
            Add rápido:
          </span>
          <div className="flex gap-1 flex-wrap">
            <button
              type="button"
              onClick={() => onAddManual(0)}
              className="px-2 py-0.5 bg-white text-black font-bold font-mono text-xs rounded hover:bg-zinc-200 cursor-pointer"
            >
              0 (Branco)
            </button>
            <button
              type="button"
              onClick={() => onAddManual(1)}
              className="px-2 py-0.5 bg-[#FF2442] text-white font-bold font-mono text-xs rounded hover:opacity-90 cursor-pointer"
            >
              1-7 (Vermelho)
            </button>
            <button
              type="button"
              onClick={() => onAddManual(8)}
              className="px-2 py-0.5 bg-[#334155] text-white font-bold font-mono text-xs rounded hover:opacity-90 cursor-pointer"
            >
              8-14 (Preto)
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="bg-[#141417] border border-white/10 rounded-2xl p-4 shadow-md">
        <div className="text-xs font-display font-bold uppercase text-[#A1A1AA] mb-3">
          Estatísticas Rápidas
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-[#1C1C21] p-3 rounded-xl text-center border border-white/5">
            <div className="text-[11px] text-[#A1A1AA] mb-1">Taxa de Acerto</div>
            <div className="font-mono text-lg font-bold text-[#00E676]">{winRate}</div>
          </div>
          <div className="bg-[#1C1C21] p-3 rounded-xl text-center border border-white/5">
            <div className="text-[11px] text-[#A1A1AA] mb-1">Sinais Hoje</div>
            <div className="font-mono text-lg font-bold text-white">{signalsCount}</div>
          </div>
          <div className="bg-[#1C1C21] p-3 rounded-xl text-center border border-white/5">
            <div className="text-[11px] text-[#A1A1AA] mb-1">Desde o Branco</div>
            <div className="font-mono text-lg font-bold text-[#FF9100]">
              {rounds.length ? sinceWhite : '—'}
            </div>
          </div>
          <div className="bg-[#1C1C21] p-3 rounded-xl text-center border border-white/5">
            <div className="text-[11px] text-[#A1A1AA] mb-1">Banca Atual</div>
            <div className="font-mono text-lg font-bold text-white">{formatBRL(bankroll)}</div>
          </div>
        </div>
      </div>

      {/* Last 50 Spins Color Count & Imbalance Bar Chart */}
      <Last50ColorChart rounds={rounds} />

      {/* Color Distribution Rings */}
      <div className="bg-[#141417] border border-white/10 rounded-2xl p-4 shadow-md">
        <div className="text-xs font-display font-bold uppercase text-[#A1A1AA] mb-3">
          Distribuição (Histórico Atual)
        </div>
        <div className="flex justify-center items-center gap-6 my-2">
          {/* Red Ring */}
          <div className="relative w-[70px] h-[70px] flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 70 70">
              <circle cx="35" cy="35" r="30" className="fill-none stroke-[#1C1C21] stroke-[6]" />
              <circle
                cx="35"
                cy="35"
                r="30"
                className="fill-none stroke-[#FF2442] stroke-[6] transition-all duration-500"
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - rPct / 100)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold text-[#FF2442]">
              {rPct.toFixed(0)}%
            </div>
          </div>

          {/* Black Ring */}
          <div className="relative w-[70px] h-[70px] flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 70 70">
              <circle cx="35" cy="35" r="30" className="fill-none stroke-[#1C1C21] stroke-[6]" />
              <circle
                cx="35"
                cy="35"
                r="30"
                className="fill-none stroke-[#64748B] stroke-[6] transition-all duration-500"
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - bPct / 100)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold text-slate-300">
              {bPct.toFixed(0)}%
            </div>
          </div>

          {/* White Ring */}
          <div className="relative w-[70px] h-[70px] flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 70 70">
              <circle cx="35" cy="35" r="30" className="fill-none stroke-[#1C1C21] stroke-[6]" />
              <circle
                cx="35"
                cy="35"
                r="30"
                className="fill-none stroke-[#E2E8F0] stroke-[6] transition-all duration-500"
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - wPct / 100)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold text-white">
              {wPct.toFixed(0)}%
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-6 text-[11px] text-[#A1A1AA] mt-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#FF2442]" /> Vermelho ({rc})
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-400" /> Preto ({bc})
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-white" /> Branco ({wc})
          </span>
        </div>
      </div>

      {/* Deep Study Panel */}
      <div className="bg-[#141417] border border-white/10 rounded-2xl p-4 shadow-md">
        <div className="text-xs font-display font-bold uppercase text-[#A1A1AA] mb-2 flex items-center justify-between">
          <span>Estudo Profundo</span>
          <span className="text-[10px] text-[#00E676] font-mono">Multi-Horizonte</span>
        </div>
        <div className="text-xs text-zinc-300 space-y-1.5 font-sans leading-relaxed">
          {prediction?.deep ? (
            <>
              {prediction.deep.intervals && (
                <div className="bg-[#1C1C21] p-2.5 rounded-xl border border-white/5">
                  ⏱ Intervalo do branco: atual <b className="text-white">{prediction.deep.intervals.current}</b> · média{' '}
                  <b className="text-white">{prediction.deep.intervals.avg.toFixed(1)}</b> · máximo{' '}
                  <b className="text-white">{prediction.deep.intervals.max}</b>
                </div>
              )}
              {prediction.deep.pullers && prediction.deep.pullers.length > 0 && (
                <div className="bg-[#1C1C21] p-2.5 rounded-xl border border-white/5">
                  🎯 Puxadores de Branco:{' '}
                  {prediction.deep.pullers.map(p => (
                    <span key={p.number} className="inline-block bg-black/40 px-1.5 py-0.5 rounded text-white font-mono text-[11px] mr-1">
                      #{p.number} ({p.count}x)
                    </span>
                  ))}
                </div>
              )}
              {prediction.deep.hc && prediction.deep.hc.hot.length > 0 && (
                <div className="bg-[#1C1C21] p-2.5 rounded-xl border border-white/5">
                  🔥 Mais frequentes:{' '}
                  {prediction.deep.hc.hot.slice(0, 3).map(h => (
                    <span key={h.number} className="inline-block bg-red-950/40 text-red-300 px-1.5 py-0.5 rounded font-mono text-[11px] mr-1">
                      #{h.number}
                    </span>
                  ))}
                  {' · '}❄️ Frios:{' '}
                  {prediction.deep.hc.cold.slice(0, 3).map(c => (
                    <span key={c.number} className="inline-block bg-blue-950/40 text-blue-300 px-1.5 py-0.5 rounded font-mono text-[11px] mr-1">
                      #{c.number}
                    </span>
                  ))}
                </div>
              )}
              {prediction.deep.seqs && prediction.deep.seqs.length > 0 && (
                <div className="bg-[#1C1C21] p-2.5 rounded-xl border border-white/5">
                  📐 Padrões Ativos: <span className="text-[#FF9100] font-bold">{prediction.deep.seqs.map(s => s.name).join(', ')}</span>
                </div>
              )}
              {prediction.deep.minu && (
                <div className="bg-[#1C1C21] p-2.5 rounded-xl border border-white/5">
                  🕐 Minutagem: Terminal alvo <b className="text-white">{prediction.deep.minu.targetTerminal}</b> · Espelho{' '}
                  <b className="text-white">{prediction.deep.minu.mirrorTerminal}</b> · Minuto atual{' '}
                  <b className="text-white">{prediction.deep.minu.currentTerminal}</b>
                </div>
              )}
            </>
          ) : (
            <p className="text-zinc-400">Colete dados para ativar análise de sequências, minutagem e puxadores.</p>
          )}
        </div>
      </div>

      {/* Continuous Learning Engine Card */}
      <div className="bg-[#141417] border border-white/10 rounded-2xl p-4 shadow-md">
        <div className="text-xs font-display font-bold uppercase text-[#A1A1AA] mb-2 flex items-center justify-between">
          <span>Aprendizado Contínuo (∞)</span>
          <span className="text-[10px] text-purple-400 font-mono">Auto-Evolução</span>
        </div>
        <div className="text-xs text-zinc-300 space-y-1.5 font-sans leading-relaxed">
          <div className="flex justify-between">
            <span className="text-zinc-400">🧠 Rodadas aprendidas:</span>
            <b className="font-mono text-white">{learn.totalLearned || 0}</b>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">📚 Padrões na memória:</span>
            <b className="font-mono text-white">{Object.keys(learn.sequenceMemory || {}).length}</b>
          </div>
          <div className="text-zinc-400 text-[11px] pt-1">
            ⚖️ Pesos dos modelos:{' '}
            <span className="text-zinc-200 font-mono">
              {(Object.entries(learn.signalWeights || {}) as Array<[string, number]>)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 4)
                .map(([k, v]) => `${k} ${Math.round(v * 100)}%`)
                .join(' · ')}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 opacity-80 pt-1">
            O motor recalibra a cada 10 rodadas e se adapta ao comportamento da mesa.
          </p>
        </div>
      </div>

      {/* Controls Card */}
      <div className="bg-[#141417] border border-white/10 rounded-2xl p-4 shadow-md space-y-3">
        <div className="text-xs font-display font-bold uppercase text-[#A1A1AA]">
          Controles Principais
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            id="btnStartCollector"
            onClick={onToggleCollector}
            className={`flex-1 py-3 px-4 rounded-full font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg active:scale-98 ${
              collectorRunning
                ? 'bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10'
                : 'bg-[#FF2442] hover:bg-[#FF2442]/90 text-white shadow-[0_4px_20px_rgba(255,36,66,0.35)]'
            }`}
          >
            {collectorRunning ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            {collectorRunning ? 'Parar Coleta' : 'Iniciar Coleta'}
          </button>

          <button
            type="button"
            onClick={onForcePredict}
            className="flex-1 py-3 px-4 bg-[#1C1C21] hover:bg-[#2A2A30] border border-white/10 text-white rounded-full font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
          >
            <Sparkles className="w-4 h-4 text-[#FF9100]" />
            Analisar Agora
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            type="button"
            onClick={onImport}
            className="py-2 px-2 bg-[#1C1C21] hover:bg-[#2A2A30] border border-white/10 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            Importar
          </button>
          <button
            type="button"
            onClick={onExport}
            className="py-2 px-2 bg-[#1C1C21] hover:bg-[#2A2A30] border border-white/10 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar
          </button>
          <button
            type="button"
            onClick={onClear}
            className="py-2 px-2 bg-[#1C1C21] hover:bg-red-950/40 border border-white/10 text-zinc-300 hover:text-[#FF2442] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Limpar
          </button>
        </div>
      </div>

      {/* 50-Round Bankroll / DayPL Trend Chart Component (Final da Página) */}
      <HomeTrendChart
        rounds={rounds}
        signals={signals}
        dayPL={dayPL}
        bankroll={bankroll}
        targetProfit={prefs.daily_profit_target}
        targetProfitEnabled={prefs.daily_profit_target_enabled}
      />
    </div>
  );
};
