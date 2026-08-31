import React from 'react';
import { AppPreferences, BrainState } from '../types';
import { calculateDynamicGaleMultiplier } from '../utils/prediction';
import { Sparkles, TrendingUp, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface BrainTabProps {
  prefs: AppPreferences;
  brain: BrainState;
  bankroll?: number;
  dayPL?: number;
  dayWins?: number;
  dayLosses?: number;
  onUpdatePref: (key: keyof AppPreferences, val: any) => void;
  onSave: () => void;
}

export const BrainTab: React.FC<BrainTabProps> = ({
  prefs,
  brain,
  bankroll = 1100,
  dayPL = 0,
  dayWins = 0,
  dayLosses = 0,
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

  const effectiveMult = prefs.brain_auto_multiplier
    ? dynamicInfo.multiplier
    : (prefs.brain_gale_multiplier || 2.0);

  return (
    <div className="space-y-3 pb-8">
      {/* Brain Controls Card */}
      <div className="bg-[#141417] border border-white/10 rounded-2xl p-4 shadow-md space-y-4">
        <div className="text-xs font-display font-bold uppercase text-[#A1A1AA]">
          Cérebro IA & Gestão de Gales
        </div>

        {/* Toggles */}
        <div className="space-y-3 divide-y divide-white/5">
          <div className="flex items-center justify-between pt-1">
            <div>
              <div className="text-xs font-semibold text-white">Cérebro Ativo</div>
              <div className="text-[11px] text-[#A1A1AA]">Entra e resolve ciclos automaticamente</div>
            </div>
            <button
              type="button"
              onClick={() => onUpdatePref('brain_enabled', !prefs.brain_enabled)}
              className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer border ${
                prefs.brain_enabled ? 'bg-[#FF2442] border-[#FF2442]' : 'bg-[#1C1C21] border-white/10'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  prefs.brain_enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Dynamic Gale Multiplier Toggle by Bankroll Volatility */}
          <div className="flex items-center justify-between pt-3">
            <div>
              <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                Multiplicador Dinâmico por Volatilidade
                <span className="text-[9px] bg-[#A855F7]/20 text-[#C084FC] px-1.5 py-0.5 rounded font-black border border-[#A855F7]/30">
                  IA BANCA
                </span>
              </div>
              <div className="text-[11px] text-[#A1A1AA]">
                Ajusta o multiplicador automaticamente conforme a volatilidade e segurança da banca
              </div>
            </div>
            <button
              type="button"
              onClick={() => onUpdatePref('brain_auto_multiplier', !prefs.brain_auto_multiplier)}
              className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer border ${
                prefs.brain_auto_multiplier ? 'bg-[#A855F7] border-[#A855F7]' : 'bg-[#1C1C21] border-white/10'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  prefs.brain_auto_multiplier ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between pt-3">
            <div>
              <div className="text-xs font-semibold text-white">Sempre fazer Gale</div>
              <div className="text-[11px] text-[#A1A1AA]">Garante gale até o limite configurado</div>
            </div>
            <button
              type="button"
              onClick={() => onUpdatePref('brain_always_gale', !prefs.brain_always_gale)}
              className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer border ${
                prefs.brain_always_gale ? 'bg-[#FF2442] border-[#FF2442]' : 'bg-[#1C1C21] border-white/10'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  prefs.brain_always_gale ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between pt-3">
            <div>
              <div className="text-xs font-semibold text-white">Continuar Automaticamente</div>
              <div className="text-[11px] text-[#A1A1AA]">Inicia novo ciclo após WIN ou LOSS final</div>
            </div>
            <button
              type="button"
              onClick={() => onUpdatePref('brain_auto_continue', !prefs.brain_auto_continue)}
              className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer border ${
                prefs.brain_auto_continue ? 'bg-[#FF2442] border-[#FF2442]' : 'bg-[#1C1C21] border-white/10'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  prefs.brain_auto_continue ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Dynamic Multiplier Live Breakdown Card (When Enabled) */}
        {prefs.brain_auto_multiplier && (
          <div className="bg-[#1C1525] border border-[#A855F7]/30 rounded-xl p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#C084FC]">
                <Sparkles className="w-3.5 h-3.5" />
                Calibração em Tempo Real da Volatilidade
              </div>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                  dynamicInfo.volatilityLevel === 'critical'
                    ? 'bg-[#FF2442]/20 border-[#FF2442]/40 text-[#FF2442]'
                    : dynamicInfo.volatilityLevel === 'high'
                    ? 'bg-[#FF9100]/20 border-[#FF9100]/40 text-[#FF9100]'
                    : dynamicInfo.volatilityLevel === 'low'
                    ? 'bg-[#00E676]/20 border-[#00E676]/40 text-[#00E676]'
                    : 'bg-[#3B82F6]/20 border-[#3B82F6]/40 text-[#60A5FA]'
                }`}
              >
                {dynamicInfo.label}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-[#14101A] p-2 rounded-lg border border-white/5">
                <div className="text-[10px] text-zinc-400">Multiplicador Atual</div>
                <div className="font-mono text-base font-black text-[#C084FC]">
                  {dynamicInfo.multiplier.toFixed(1)}x
                </div>
              </div>
              <div className="bg-[#14101A] p-2 rounded-lg border border-white/5">
                <div className="text-[10px] text-zinc-400">Cobertura da Banca</div>
                <div className="font-mono text-base font-bold text-white">
                  {dynamicInfo.bankrollRatio}x
                </div>
              </div>
              <div className="bg-[#14101A] p-2 rounded-lg border border-white/5">
                <div className="text-[10px] text-zinc-400">Drawdown do Dia</div>
                <div
                  className={`font-mono text-base font-bold ${
                    dynamicInfo.drawdownPct > 10 ? 'text-[#FF2442]' : 'text-zinc-300'
                  }`}
                >
                  {dynamicInfo.drawdownPct}%
                </div>
              </div>
            </div>

            <div className="text-[11px] text-zinc-300 bg-black/30 p-2 rounded-lg border border-white/5 flex items-start gap-1.5">
              <span className="text-[#C084FC] shrink-0">💡</span>
              <span>{dynamicInfo.reason}</span>
            </div>
          </div>
        )}

        {/* Numeric Settings */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div>
            <label className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider block mb-1.5">
              Máx. Gales (1–5)
            </label>
            <input
              type="number"
              min={1}
              max={5}
              value={prefs.brain_max_gales}
              onChange={e => onUpdatePref('brain_max_gales', Number(e.target.value))}
              className="w-full bg-[#1C1C21] border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider block mb-1.5">
              Confiança mín. Gale
            </label>
            <input
              type="number"
              min={0.3}
              max={0.95}
              step={0.05}
              value={prefs.brain_gale_min_confidence}
              onChange={e => onUpdatePref('brain_gale_min_confidence', Number(e.target.value))}
              className="w-full bg-[#1C1C21] border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider block mb-1.5">
              {prefs.brain_auto_multiplier ? 'Mult. Base (Dinâmico Ativo)' : 'Multiplicador Gale'}
            </label>
            <input
              type="number"
              min={1.5}
              max={3}
              step={0.1}
              value={prefs.brain_gale_multiplier}
              onChange={e => onUpdatePref('brain_gale_multiplier', Number(e.target.value))}
              className="w-full bg-[#1C1C21] border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono outline-none"
            />
            {prefs.brain_auto_multiplier && (
              <span className="text-[10px] text-[#C084FC] block mt-1">
                Efetivo agora: <strong>{effectiveMult.toFixed(1)}x</strong> (auto)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Brain Status Card */}
      <div className="bg-[#141417] border border-white/10 rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-display font-bold uppercase text-[#A1A1AA]">
            Estado do Cérebro
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#00E676]/10 border border-[#00E676]/30 text-[#00E676] text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00E676] animate-ping" />
            Watchdog 10s Ativo
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-[#1C1C21] p-3 rounded-xl text-center border border-white/5">
            <div className="text-[11px] text-[#A1A1AA] mb-1">Estado</div>
            <div className="font-mono text-sm font-bold text-white capitalize">{brain.state}</div>
          </div>
          <div className="bg-[#1C1C21] p-3 rounded-xl text-center border border-white/5">
            <div className="text-[11px] text-[#A1A1AA] mb-1">Gale Atual</div>
            <div className="font-mono text-base font-bold text-[#FF9100]">{brain.galeLevel}</div>
          </div>
          <div className="bg-[#1C1C21] p-3 rounded-xl text-center border border-white/5">
            <div className="text-[11px] text-[#A1A1AA] mb-1">Último Resultado</div>
            <div
              className={`font-mono text-base font-bold ${
                brain.lastOutcome === 'WIN' ? 'text-[#00E676]' : brain.lastOutcome === 'LOSS' ? 'text-[#FF2442]' : 'text-zinc-400'
              }`}
            >
              {brain.lastOutcome || '—'}
            </div>
          </div>
          <div className="bg-[#1C1C21] p-3 rounded-xl text-center border border-white/5">
            <div className="text-[11px] text-[#A1A1AA] mb-1">Ciclos Totais</div>
            <div className="font-mono text-base font-bold text-white">{brain.cycles}</div>
          </div>
        </div>
        <div className="bg-[#1C1C21]/60 border border-white/5 rounded-xl p-2.5 text-[11px] text-zinc-400 flex items-start gap-2">
          <span className="text-[#FF9100] text-xs">⚡</span>
          <span>
            <strong className="text-zinc-200">Watchdog de Ciclo:</strong> Quando o Cérebro estiver em modo <code className="text-[#FF9100] bg-white/5 px-1 py-0.5 rounded">in_gale</code>, se o coletor falhar ou ficar ocioso por mais de 10s, o sistema reconecta o WebSocket e sincroniza os giros instantaneamente para nunca perder a sequência de gales.
          </span>
        </div>
      </div>

      {/* Save Button */}
      <div className="bg-[#141417] border border-white/10 rounded-2xl p-4 shadow-md">
        <button
          type="button"
          onClick={onSave}
          className="w-full py-3 bg-[#FF2442] hover:bg-[#FF2442]/90 text-white font-bold text-sm rounded-full cursor-pointer shadow-lg active:scale-98"
        >
          💾 Salvar Configurações do Cérebro
        </button>
      </div>
    </div>
  );
};
