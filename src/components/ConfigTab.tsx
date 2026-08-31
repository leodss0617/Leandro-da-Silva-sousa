import React, { useState } from 'react';
import { AppPreferences } from '../types';
import { Volume2, VolumeX, Bell, Shield, Smartphone, Target, Music, Sparkles, Play, Check } from 'lucide-react';
import { play80PercentWarningSound, speakAnnouncement } from '../utils/audio';

interface ConfigTabProps {
  prefs: AppPreferences;
  collectorRunning: boolean;
  onToggleCollector: () => void;
  onUpdatePref: (key: keyof AppPreferences, val: any) => void;
  onTestSound: () => void;
  onRequestNotifications: () => void;
  onRequestWakeLock: () => void;
  onSaveAll: () => void;
  onOpenCollectorModal?: () => void;
}

export const ConfigTab: React.FC<ConfigTabProps> = ({
  prefs,
  collectorRunning,
  onToggleCollector,
  onUpdatePref,
  onTestSound,
  onRequestNotifications,
  onRequestWakeLock,
  onSaveAll,
  onOpenCollectorModal,
}) => {
  return (
    <div className="space-y-3 pb-8">
      {/* Collector Settings */}
      <div className="bg-[#141417] border border-white/10 rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-display font-bold uppercase text-[#A1A1AA]">
            Coletor em Tempo Real
          </div>
          {onOpenCollectorModal && (
            <button
              type="button"
              onClick={onOpenCollectorModal}
              className="text-[11px] text-[#00E676] hover:underline font-semibold cursor-pointer"
            >
              Abrir Diagnóstico
            </button>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-white">Coleta Automática</div>
            <div className="text-[11px] text-[#A1A1AA]">Reconecta e escuta novos giros da Blaze</div>
          </div>
          <button
            type="button"
            onClick={onToggleCollector}
            className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer border ${
              collectorRunning ? 'bg-[#FF2442] border-[#FF2442]' : 'bg-[#1C1C21] border-white/10'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                collectorRunning ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider block mb-1">
            Modo da Coleta
          </label>
          <select
            value={prefs.collector_mode || 'auto'}
            onChange={e => onUpdatePref('collector_mode', e.target.value)}
            className="w-full bg-[#1C1C21] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none cursor-pointer"
          >
            <option value="auto">Automático Híbrido (Servidor Proxy + WS + REST)</option>
            <option value="backend_proxy">Proxy do Servidor (Recomendado - Sem bloqueio CORS)</option>
            <option value="websocket">WebSocket Direto (api-gaming.blaze)</option>
            <option value="direct_rest">Polling REST Direto</option>
            <option value="simulation">Modo Simulação / Demo (Offline)</option>
          </select>
        </div>

        {onOpenCollectorModal && (
          <button
            type="button"
            onClick={onOpenCollectorModal}
            className="w-full py-2 bg-[#1C1C21] hover:bg-[#2A2A30] border border-white/10 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
          >
            🛠️ Ver Métricas, Latência e Espelhos de Conexão
          </button>
        )}
      </div>

      {/* Prediction Engine Toggles */}
      <div className="bg-[#141417] border border-white/10 rounded-2xl p-4 shadow-md space-y-3">
        <div className="text-xs font-display font-bold uppercase text-[#A1A1AA]">
          Motor de Análise e Modelos
        </div>

        <div className="space-y-3 divide-y divide-white/5">
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-medium text-white">Frequência Multi-Horizonte (30/80/200/1000)</span>
            <button
              type="button"
              onClick={() => onUpdatePref('use_frequency', !prefs.use_frequency)}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer border ${
                prefs.use_frequency ? 'bg-[#FF2442] border-[#FF2442]' : 'bg-[#1C1C21] border-white/10'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  prefs.use_frequency ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between pt-2.5">
            <span className="text-xs font-medium text-white">Cadeia de Markov (1ª e 2ª Ordem)</span>
            <button
              type="button"
              onClick={() => onUpdatePref('use_markov', !prefs.use_markov)}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer border ${
                prefs.use_markov ? 'bg-[#FF2442] border-[#FF2442]' : 'bg-[#1C1C21] border-white/10'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  prefs.use_markov ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between pt-2.5">
            <span className="text-xs font-medium text-white">Pressão Anti-Sequência (Quebra de Padrão)</span>
            <button
              type="button"
              onClick={() => onUpdatePref('use_streak', !prefs.use_streak)}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer border ${
                prefs.use_streak ? 'bg-[#FF2442] border-[#FF2442]' : 'bg-[#1C1C21] border-white/10'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  prefs.use_streak ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between pt-2.5">
            <span className="text-xs font-medium text-white">Ciclo e Maturação do Branco</span>
            <button
              type="button"
              onClick={() => onUpdatePref('use_white_cycle', !prefs.use_white_cycle)}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer border ${
                prefs.use_white_cycle ? 'bg-[#FF2442] border-[#FF2442]' : 'bg-[#1C1C21] border-white/10'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  prefs.use_white_cycle ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between pt-2.5">
            <span className="text-xs font-medium text-white">Caçador de Padrões (1x1, 2x2, VPV, Minutagem)</span>
            <button
              type="button"
              onClick={() => onUpdatePref('use_pattern', !prefs.use_pattern)}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer border ${
                prefs.use_pattern ? 'bg-[#FF2442] border-[#FF2442]' : 'bg-[#1C1C21] border-white/10'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  prefs.use_pattern ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="pt-2">
          <label className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider block mb-1">
            Confiança mínima para sinal ({Math.round(prefs.min_confidence * 100)}%)
          </label>
          <input
            type="range"
            min={0.4}
            max={0.9}
            step={0.05}
            value={prefs.min_confidence}
            onChange={e => onUpdatePref('min_confidence', Number(e.target.value))}
            className="w-full accent-[#FF2442] cursor-pointer"
          />
        </div>

        {/* Dynamic Gale Volatility Toggle in Engine */}
        <div className="pt-2 border-t border-white/5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-white flex items-center gap-1.5">
              Gale com Multiplicador Dinâmico
              <span className="text-[9px] bg-[#A855F7]/20 text-[#C084FC] px-1.5 py-0.5 rounded font-black border border-[#A855F7]/30">
                IA BANCA
              </span>
            </div>
            <div className="text-[11px] text-[#A1A1AA]">
              Ajusta o multiplicador do Gale automaticamente com base na volatilidade da banca
            </div>
          </div>
          <button
            type="button"
            onClick={() => onUpdatePref('brain_auto_multiplier', !prefs.brain_auto_multiplier)}
            className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer border shrink-0 ${
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
      </div>

      {/* Floating Bubble & Background Persistence */}
      <div className="bg-[#141417] border border-white/10 rounded-2xl p-4 shadow-md space-y-3">
        <div className="text-xs font-display font-bold uppercase text-[#A1A1AA]">
          Bolinha Flutuante & 2º Plano
        </div>

        <div className="space-y-3 divide-y divide-white/5">
          <div className="flex items-center justify-between pt-1">
            <div>
              <div className="text-xs font-semibold text-white">Mostrar bolinha flutuante</div>
              <div className="text-[11px] text-[#A1A1AA]">Widget na tela com status em tempo real</div>
            </div>
            <button
              type="button"
              onClick={() => onUpdatePref('show_bubble', !prefs.show_bubble)}
              className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer border ${
                prefs.show_bubble ? 'bg-[#FF2442] border-[#FF2442]' : 'bg-[#1C1C21] border-white/10'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  prefs.show_bubble ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between pt-3">
            <div>
              <div className="text-xs font-semibold text-white">Manter coleta contínua</div>
              <div className="text-[11px] text-[#A1A1AA]">WakeLock e reconexão persistente</div>
            </div>
            <button
              type="button"
              onClick={() => onUpdatePref('keep_background', !prefs.keep_background)}
              className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer border ${
                prefs.keep_background ? 'bg-[#FF2442] border-[#FF2442]' : 'bg-[#1C1C21] border-white/10'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  prefs.keep_background ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            type="button"
            onClick={onRequestNotifications}
            className="py-2 px-3 bg-[#1C1C21] hover:bg-[#2A2A30] border border-white/10 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5 text-[#00E676]" />
            Notificações
          </button>
          <button
            type="button"
            onClick={onRequestWakeLock}
            className="py-2 px-3 bg-[#1C1C21] hover:bg-[#2A2A30] border border-white/10 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-[#FF9100]" />
            Wake Lock
          </button>
        </div>
      </div>

      {/* Audio & Voice Alerts */}
      <div className="bg-[#141417] border border-white/10 rounded-2xl p-4 shadow-md space-y-3">
        <div className="text-xs font-display font-bold uppercase text-[#A1A1AA]">
          Alertas Sonoros e Voz da IA
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-white">Som ao gerar previsão</div>
            <div className="text-[11px] text-[#A1A1AA]">Alerta sintetizado com Web Audio</div>
          </div>
          <button
            type="button"
            onClick={() => onUpdatePref('sound_enabled', !prefs.sound_enabled)}
            className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer border ${
              prefs.sound_enabled ? 'bg-[#FF2442] border-[#FF2442]' : 'bg-[#1C1C21] border-white/10'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                prefs.sound_enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div>
            <div className="text-xs font-semibold text-white">Locução por Voz (Fala)</div>
            <div className="text-[11px] text-[#A1A1AA]">Fala em qual Gale está e o valor da aposta</div>
          </div>
          <button
            type="button"
            onClick={() => onUpdatePref('voice_enabled', !prefs.voice_enabled)}
            className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer border ${
              prefs.voice_enabled ? 'bg-[#00E676] border-[#00E676]' : 'bg-[#1C1C21] border-white/10'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                prefs.voice_enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-xs text-zinc-400">
            <span>Volume do Alerta e Voz</span>
            <span className="font-mono text-white font-bold">{Math.round(prefs.sound_volume * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(prefs.sound_volume * 100)}
            onChange={e => onUpdatePref('sound_volume', Number(e.target.value) / 100)}
            className="w-full accent-[#FF2442] cursor-pointer"
          />
        </div>

        <button
          type="button"
          onClick={onTestSound}
          className="w-full py-2.5 bg-[#1C1C21] hover:bg-[#2A2A30] border border-white/10 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
        >
          <Volume2 className="w-4 h-4 text-[#FF2442]" />
          Testar Som e Voz
        </button>
      </div>

      {/* 80% Daily Profit Warning Alert Configuration - Advanced Sound Selector Component */}
      <div className="bg-[#141417] border border-white/10 rounded-2xl p-4 shadow-md space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="text-xs font-display font-bold uppercase text-[#A1A1AA] flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-yellow-400" />
            Alerta 80% da Meta Diária (Pré-Encerramento)
          </div>
          <span className="text-[9px] bg-yellow-400/20 text-yellow-300 px-2 py-0.5 rounded font-black border border-yellow-400/30">
            STOP GAIN
          </span>
        </div>

        <div>
          <div className="text-xs font-semibold text-white">Seletor de Som & Alarme Antecipado</div>
          <div className="text-[11px] text-[#A1A1AA] mt-0.5">
            Escolha o timbre do aviso sonoro para desacelerar quando faltar apenas 20% para a meta, ou desative o alerta.
          </div>
        </div>

        {/* Interactive Sound Options Cards Grid */}
        <div className="space-y-2 pt-1">
          {[
            {
              id: 'off' as const,
              title: 'Desativado (Silencioso)',
              desc: 'Sem aviso sonoro ao atingir 80% da meta diária',
              icon: VolumeX,
              iconColor: 'text-zinc-500',
              badge: 'DESATIVADO',
              badgeColor: 'bg-zinc-800/80 text-zinc-400 border-zinc-700/60',
            },
            {
              id: 'fanfare' as const,
              title: 'Fanfarra Triunfal',
              desc: 'Arpejo ascendente de vitória (C5, E5, G5, C6)',
              icon: Music,
              iconColor: 'text-yellow-400',
              badge: 'POPULAR',
              badgeColor: 'bg-yellow-400/20 text-yellow-300 border-yellow-400/30',
            },
            {
              id: 'chime' as const,
              title: 'Chime Harmônico Zen',
              desc: 'Harmônicos suaves de sino tibetano relaxante',
              icon: Bell,
              iconColor: 'text-emerald-400',
              badge: 'ZEN',
              badgeColor: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30',
            },
            {
              id: 'radar' as const,
              title: 'Radar Sonar High-Tech',
              desc: 'Duplo pulso sonoro tático de atenção imediata',
              icon: Sparkles,
              iconColor: 'text-cyan-400',
              badge: 'PRO',
              badgeColor: 'bg-cyan-400/20 text-cyan-300 border-cyan-400/30',
            },
            {
              id: 'bell' as const,
              title: 'Sino Dourado Metálico',
              desc: 'Frequência cristalina e brilhante de conquista',
              icon: Target,
              iconColor: 'text-amber-400',
              badge: 'CLÁSSICO',
              badgeColor: 'bg-amber-400/20 text-amber-300 border-amber-400/30',
            },
          ].map(opt => {
            const currentSound =
              prefs.daily_profit_target_alert_80_enabled === false
                ? 'off'
                : prefs.daily_profit_target_alert_sound || 'fanfare';
            const isSelected = currentSound === opt.id;
            const IconComp = opt.icon;

            return (
              <div
                key={opt.id}
                onClick={() => {
                  if (opt.id === 'off') {
                    onUpdatePref('daily_profit_target_alert_sound', 'off');
                    onUpdatePref('daily_profit_target_alert_80_enabled', false);
                  } else {
                    onUpdatePref('daily_profit_target_alert_sound', opt.id);
                    onUpdatePref('daily_profit_target_alert_80_enabled', true);
                  }
                }}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                  isSelected
                    ? opt.id === 'off'
                      ? 'bg-zinc-800/40 border-zinc-500 shadow-md ring-1 ring-zinc-500/30'
                      : 'bg-yellow-500/10 border-yellow-500/60 shadow-md ring-1 ring-yellow-500/30'
                    : 'bg-[#1C1C21] border-white/5 hover:border-white/20 hover:bg-[#232329]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                      isSelected
                        ? opt.id === 'off'
                          ? 'bg-zinc-800 border-zinc-600'
                          : 'bg-yellow-400/20 border-yellow-400/40'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <IconComp className={`w-4 h-4 ${opt.iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold truncate ${
                          isSelected ? (opt.id === 'off' ? 'text-zinc-200' : 'text-yellow-300') : 'text-white'
                        }`}
                      >
                        {opt.title}
                      </span>
                      {opt.badge && (
                        <span className={`text-[8px] font-black px-1.5 py-0.2 rounded border shrink-0 ${opt.badgeColor}`}>
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-400 truncate mt-0.5">{opt.desc}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {opt.id !== 'off' && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        play80PercentWarningSound(prefs.sound_volume, opt.id, true, true);
                      }}
                      title="Testar este som"
                      className="px-2 py-1 bg-white/5 hover:bg-white/15 border border-white/10 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                    >
                      <Play className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span>Ouvir</span>
                    </button>
                  )}

                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                      isSelected
                        ? opt.id === 'off'
                          ? 'bg-zinc-600 border-zinc-500 text-white'
                          : 'bg-yellow-400 border-yellow-400 text-black'
                        : 'border-white/20 bg-black/30'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Master Test Action & Educational Note */}
        {prefs.daily_profit_target_alert_80_enabled !== false &&
          prefs.daily_profit_target_alert_sound !== 'off' && (
            <div className="space-y-2.5 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => {
                  const soundType = prefs.daily_profit_target_alert_sound || 'fanfare';
                  play80PercentWarningSound(prefs.sound_volume, soundType, true, true);
                  if (prefs.voice_enabled) {
                    speakAnnouncement(
                      'Atenção: 80% da sua meta diária de lucro foi atingida! Prepare-se para encerrar.',
                      true,
                      prefs.sound_volume
                    );
                  }
                }}
                className="w-full py-2.5 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 hover:text-yellow-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
              >
                <Music className="w-4 h-4 text-yellow-400" />
                Ouvir Alerta Completo (Som Selecionado + Locução)
              </button>

              <div className="text-[11px] text-zinc-400 bg-[#1C1C21] p-2.5 rounded-xl border border-white/5 leading-relaxed">
                💡 <strong className="text-zinc-300">Gestão Emocional & Stop Gain:</strong> Quando seu lucro diário atingir 80% do valor estipulado (ex: R$ {((prefs.daily_profit_target ?? 50) * 0.8).toFixed(2)} de R$ {(prefs.daily_profit_target ?? 50).toFixed(2)}), este som tocará para você proteger seus ganhos e finalizar o dia no verde.
              </div>
            </div>
          )}
      </div>

      {/* Global Save Button */}
      <div className="bg-[#141417] border border-white/10 rounded-2xl p-4 shadow-md">
        <button
          type="button"
          onClick={onSaveAll}
          className="w-full py-3.5 bg-[#FF2442] hover:bg-[#FF2442]/90 text-white font-bold text-sm rounded-full cursor-pointer shadow-lg active:scale-98"
        >
          💾 Salvar Todas as Configurações
        </button>
      </div>

      {/* About Box */}
      <div className="bg-[#141417] border border-white/10 rounded-2xl p-4 shadow-md text-xs text-zinc-400 space-y-1.5 leading-relaxed">
        <div className="text-white font-bold text-xs flex items-center gap-1.5">
          <Smartphone className="w-4 h-4 text-[#FF2442]" />
          Leandro Double IA v2.9 Coleta Persistente
        </div>
        <p>
          Sistema preditivo com Markov, Frequência Multi-Horizonte, Caçador de Padrões 1x1/2x2/VPV, Puxadores de Branco, Minutagem, Aprendizado Contínuo (∞) e Planilha Mega Troia.
        </p>
      </div>
    </div>
  );
};
