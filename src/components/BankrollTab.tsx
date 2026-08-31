import React from 'react';
import { AppPreferences, SignalRecord } from '../types';
import { formatBRL } from '../utils/audio';
import { calculateDynamicGaleMultiplier } from '../utils/prediction';
import { BankrollChart } from './BankrollChart';
import { Sparkles, Target, Trophy, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';

interface BankrollTabProps {
  bankroll: number;
  dayWins: number;
  dayLosses: number;
  dayPL: number;
  signals?: SignalRecord[];
  prefs: AppPreferences;
  onAdjustBankroll: (delta: number) => void;
  onSetBankrollManual: (val?: number) => void;
  onUpdatePref: (key: keyof AppPreferences, val: any) => void;
  onSave: () => void;
}

export const BankrollTab: React.FC<BankrollTabProps> = ({
  bankroll,
  dayWins,
  dayLosses,
  dayPL,
  signals = [],
  prefs,
  onAdjustBankroll,
  onSetBankrollManual,
  onUpdatePref,
  onSave,
}) => {
  const dynamicInfo = calculateDynamicGaleMultiplier(
    bankroll,
    prefs.bet_amount,
    dayPL,
    dayWins,
    dayLosses,
    prefs.brain_gale_multiplier,
    prefs.bankroll_mode
  );

  const targetProfit = prefs.daily_profit_target ?? 50;
  const isTargetEnabled = prefs.daily_profit_target_enabled !== false;
  const isTargetHit = isTargetEnabled && targetProfit > 0 && dayPL >= targetProfit;
  const progressPct = targetProfit > 0 ? Math.min(Math.max((dayPL / targetProfit) * 100, 0), 100) : 0;
  const remainingForTarget = Math.max(targetProfit - dayPL, 0);

  return (
    <div className="space-y-3 pb-8">
      {/* Big Bankroll Card */}
      <div className="bg-[#141417] border border-white/10 rounded-2xl p-5 shadow-md text-center space-y-3">
        <div className="text-xs font-display font-bold uppercase text-[#A1A1AA]">
          Banca Disponível
        </div>
        <div className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
          {formatBRL(bankroll)}
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider block mb-1.5">
              Valor da Banca (R$)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                step={1}
                value={bankroll}
                onChange={e => {
                  const v = parseFloat(e.target.value);
                  if (!isNaN(v) && v >= 0) {
                    onSetBankrollManual(v);
                  }
                }}
                className="flex-1 bg-[#1C1C21] border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono outline-none focus:border-[#00E676]"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-center flex-wrap pt-1">
            <button
              type="button"
              onClick={() => onAdjustBankroll(50)}
              className="px-3 py-1.5 bg-[#00E676]/20 hover:bg-[#00E676]/30 text-[#00E676] border border-[#00E676]/30 rounded-xl text-xs font-bold font-mono cursor-pointer transition-all"
            >
              +50
            </button>
            <button
              type="button"
              onClick={() => onAdjustBankroll(100)}
              className="px-3 py-1.5 bg-[#00E676]/20 hover:bg-[#00E676]/30 text-[#00E676] border border-[#00E676]/30 rounded-xl text-xs font-bold font-mono cursor-pointer transition-all"
            >
              +100
            </button>
            <button
              type="button"
              onClick={() => onAdjustBankroll(500)}
              className="px-3 py-1.5 bg-[#00E676]/20 hover:bg-[#00E676]/30 text-[#00E676] border border-[#00E676]/30 rounded-xl text-xs font-bold font-mono cursor-pointer transition-all"
            >
              +500
            </button>
            <button
              type="button"
              onClick={() => onAdjustBankroll(-50)}
              className="px-3 py-1.5 bg-[#FF2442]/20 hover:bg-[#FF2442]/30 text-[#FF2442] border border-[#FF2442]/30 rounded-xl text-xs font-bold font-mono cursor-pointer transition-all"
            >
              -50
            </button>
            <button
              type="button"
              onClick={() => onAdjustBankroll(-100)}
              className="px-3 py-1.5 bg-[#FF2442]/20 hover:bg-[#FF2442]/30 text-[#FF2442] border border-[#FF2442]/30 rounded-xl text-xs font-bold font-mono cursor-pointer transition-all"
            >
              -100
            </button>
          </div>
        </div>
      </div>

      {/* Daily Profit Target (Meta de Lucro Diário) Card */}
      <div
        className={`bg-[#141417] border rounded-2xl p-4 sm:p-5 shadow-md space-y-3.5 transition-all ${
          isTargetHit
            ? 'border-[#00E676]/60 bg-gradient-to-b from-[#00E676]/10 via-[#141417] to-[#141417] shadow-[0_0_20px_rgba(0,230,118,0.15)]'
            : 'border-white/10'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                isTargetHit
                  ? 'bg-[#00E676]/20 border-[#00E676]/40 text-[#00E676]'
                  : 'bg-white/5 border-white/10 text-yellow-400'
              }`}
            >
              {isTargetHit ? <Trophy className="w-4 h-4" /> : <Target className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-xs font-display font-bold uppercase text-white flex items-center gap-1.5">
                Meta de Lucro Diário (Take Profit)
                {isTargetHit && (
                  <span className="text-[9px] bg-[#00E676] text-black px-1.5 py-0.2 rounded font-black tracking-wider animate-pulse">
                    BATIDA
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[#A1A1AA]">
                Configuração de meta para proteção de ganhos e encerramento diário
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onUpdatePref('daily_profit_target_enabled', !isTargetEnabled)}
            className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer border shrink-0 ${
              isTargetEnabled ? 'bg-[#00E676] border-[#00E676]' : 'bg-[#1C1C21] border-white/10'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                isTargetEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {isTargetEnabled && (
          <div className="space-y-3 pt-1">
            {/* Target Value Input & Quick Presets */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider block">
                  Valor da Meta (R$)
                </label>
                <span className="text-[11px] font-mono font-bold text-zinc-300">
                  {((targetProfit / Math.max(bankroll, 1)) * 100).toFixed(1)}% da banca
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  step={5}
                  value={targetProfit}
                  onChange={e => {
                    const val = Number(e.target.value);
                    if (!isNaN(val)) {
                      onUpdatePref('daily_profit_target', Math.max(val, 0));
                    }
                  }}
                  className="w-full bg-[#1C1C21] border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono outline-none focus:border-[#00E676]"
                  placeholder="Ex: 50.00"
                />
              </div>

              {/* Quick Target Presets */}
              <div className="flex gap-1.5 flex-wrap pt-2">
                {[25, 50, 100, 200].map(val => (
                  <button
                    key={`preset-val-${val}`}
                    type="button"
                    onClick={() => onUpdatePref('daily_profit_target', val)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
                      targetProfit === val
                        ? 'bg-yellow-400/20 text-yellow-300 border-yellow-400/40'
                        : 'bg-[#1C1C21] text-zinc-400 border-white/5 hover:text-white hover:border-white/20'
                    }`}
                  >
                    R$ {val}
                  </button>
                ))}
                {bankroll > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => onUpdatePref('daily_profit_target', Math.round(bankroll * 0.05))}
                      className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#1C1C21] text-[#00E676] border border-[#00E676]/20 hover:bg-[#00E676]/10 transition-all cursor-pointer"
                    >
                      5% (R${Math.round(bankroll * 0.05)})
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdatePref('daily_profit_target', Math.round(bankroll * 0.10))}
                      className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#1C1C21] text-[#00E676] border border-[#00E676]/20 hover:bg-[#00E676]/10 transition-all cursor-pointer"
                    >
                      10% (R${Math.round(bankroll * 0.10)})
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Target Progress Bar */}
            <div className="bg-[#1C1C21] p-3 rounded-xl border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-medium">Progresso da Meta:</span>
                <span className="font-mono font-bold text-white">
                  {dayPL >= 0 ? `+${formatBRL(dayPL)}` : `-${formatBRL(Math.abs(dayPL))}`} / {formatBRL(targetProfit)}
                </span>
              </div>

              {/* Bar track */}
              <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/10 p-[1px]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isTargetHit
                      ? 'bg-gradient-to-r from-[#00E676] to-[#A3E635] shadow-[0_0_10px_rgba(0,230,118,0.5)]'
                      : dayPL > 0
                      ? 'bg-gradient-to-r from-yellow-400 to-[#00E676]'
                      : 'bg-zinc-700'
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] pt-0.5">
                <span className="text-zinc-400 font-mono">
                  {progressPct.toFixed(0)}% alcançado
                </span>
                <span className="font-mono font-semibold">
                  {isTargetHit ? (
                    <span className="text-[#00E676] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Superou em {formatBRL(dayPL - targetProfit)}!
                    </span>
                  ) : remainingForTarget > 0 ? (
                    <span className="text-yellow-400">
                      Faltam {formatBRL(remainingForTarget)}
                    </span>
                  ) : (
                    <span className="text-zinc-400">Meta concluída</span>
                  )}
                </span>
              </div>

              {isTargetHit ? (
                <div className="mt-2 bg-[#00E676]/15 border border-[#00E676]/30 p-2.5 rounded-lg text-[11px] text-[#00E676] flex items-center gap-2">
                  <Trophy className="w-4 h-4 shrink-0 text-[#00E676]" />
                  <span>
                    <strong>Parabéns! Meta diária batida com sucesso.</strong> É altamente recomendado pausar as operações de hoje para garantir e proteger o lucro.
                  </span>
                </div>
              ) : progressPct >= 80 ? (
                <div className="mt-2 bg-yellow-500/15 border border-yellow-500/30 p-2.5 rounded-lg text-[11px] text-yellow-300 flex items-center gap-2">
                  <Target className="w-4 h-4 shrink-0 text-yellow-400" />
                  <span>
                    <strong>Zona de 80% da Meta!</strong> Você já conquistou 80% do seu objetivo do dia. Prepare-se para encerrar e garantir os lucros.
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* P/L Daily Evolution Line Chart (Recharts) */}
      <BankrollChart
        signals={signals}
        dayPL={dayPL}
        bankroll={bankroll}
        dayWins={dayWins}
        dayLosses={dayLosses}
        targetProfit={targetProfit}
        targetProfitEnabled={isTargetEnabled}
      />

      {/* Risk Management Card */}
      <div className="bg-[#141417] border border-white/10 rounded-2xl p-4 shadow-md space-y-3">
        <div className="text-xs font-display font-bold uppercase text-[#A1A1AA]">
          Gestão de Risco & Entradas
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider block mb-1.5">
              Valor da 1ª Entrada (R$)
            </label>
            <input
              type="number"
              min={0.5}
              step={0.5}
              value={prefs.bet_amount}
              onChange={e => onUpdatePref('bet_amount', Number(e.target.value))}
              className="w-full bg-[#1C1C21] border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider block mb-1.5">
              Perfil de Risco
            </label>
            <select
              value={prefs.bankroll_mode}
              onChange={e => onUpdatePref('bankroll_mode', e.target.value)}
              className="w-full bg-[#1C1C21] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none font-sans cursor-pointer"
            >
              <option value="conservative">Conservador (Stop Curto / Menos Gales)</option>
              <option value="balanced">Equilibrado (Recomendado)</option>
              <option value="aggressive">Agressivo (Mais Gales / Busca Alto Volume)</option>
            </select>
          </div>

          {/* Dynamic Gale Multiplier Toggle */}
          <div className="bg-[#1C1C21] p-3 rounded-xl border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  Multiplicador Dinâmico por Volatilidade
                  <span className="text-[9px] bg-[#A855F7]/20 text-[#C084FC] px-1.5 py-0.5 rounded font-black border border-[#A855F7]/30">
                    {prefs.brain_auto_multiplier ? `${dynamicInfo.multiplier.toFixed(1)}x ATIVO` : 'OPCIONAL'}
                  </span>
                </div>
                <div className="text-[11px] text-[#A1A1AA]">
                  Modula o valor dos Gales com base no drawdown e saldo restante
                </div>
              </div>
              <button
                type="button"
                onClick={() => onUpdatePref('brain_auto_multiplier', !prefs.brain_auto_multiplier)}
                className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer border shrink-0 ${
                  prefs.brain_auto_multiplier ? 'bg-[#A855F7] border-[#A855F7]' : 'bg-[#141417] border-white/10'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    prefs.brain_auto_multiplier ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {prefs.brain_auto_multiplier && (
              <div className="text-[11px] text-zinc-400 bg-black/20 p-2 rounded-lg border border-white/5 flex items-start gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C084FC] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-zinc-200">{dynamicInfo.label}:</strong> {dynamicInfo.reason}
                </span>
              </div>
            )}
          </div>

          {/* Toggles */}
          <div className="pt-2 space-y-3 divide-y divide-white/5">
            <div className="flex items-center justify-between pt-1">
              <div>
                <div className="text-xs font-semibold text-white">Somente Branco</div>
                <div className="text-[11px] text-[#A1A1AA]">Entra apenas quando houver sinal forte para branco</div>
              </div>
              <button
                type="button"
                onClick={() => onUpdatePref('white_only', !prefs.white_only)}
                className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer border ${
                  prefs.white_only ? 'bg-[#FF2442] border-[#FF2442]' : 'bg-[#1C1C21] border-white/10'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    prefs.white_only ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between pt-3">
              <div>
                <div className="text-xs font-semibold text-white">Pular se confiança for baixa</div>
                <div className="text-[11px] text-[#A1A1AA]">Exibe AGUARDAR quando a confiança for inferior ao limite</div>
              </div>
              <button
                type="button"
                onClick={() => onUpdatePref('skip_low_conf', !prefs.skip_low_conf)}
                className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer border ${
                  prefs.skip_low_conf ? 'bg-[#FF2442] border-[#FF2442]' : 'bg-[#1C1C21] border-white/10'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    prefs.skip_low_conf ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Result of the Day */}
      <div className="bg-[#141417] border border-white/10 rounded-2xl p-4 shadow-md">
        <div className="text-xs font-display font-bold uppercase text-[#A1A1AA] mb-3">
          Resultado do Dia
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-[#1C1C21] p-3 rounded-xl text-center border border-white/5">
            <div className="text-[11px] text-[#A1A1AA] mb-1">Lucro / Prejuízo</div>
            <div
              className={`font-mono text-base font-bold ${
                dayPL >= 0 ? 'text-[#00E676]' : 'text-[#FF2442]'
              }`}
            >
              {dayPL >= 0 ? `+${formatBRL(dayPL)}` : `-${formatBRL(Math.abs(dayPL))}`}
            </div>
          </div>
          <div className="bg-[#1C1C21] p-3 rounded-xl text-center border border-white/5">
            <div className="text-[11px] text-[#A1A1AA] mb-1">Acertos / Erros</div>
            <div className="font-mono text-base font-bold text-white">
              {dayWins} / {dayLosses}
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="bg-[#141417] border border-white/10 rounded-2xl p-4 shadow-md">
        <button
          type="button"
          onClick={onSave}
          className="w-full py-3 bg-[#FF2442] hover:bg-[#FF2442]/90 text-white font-bold text-sm rounded-full cursor-pointer shadow-lg active:scale-98"
        >
          💾 Salvar Configurações de Banca
        </button>
      </div>
    </div>
  );
};
