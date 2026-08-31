import React, { useState } from 'react';
import { X, RefreshCw, Activity, CheckCircle2, AlertTriangle, ShieldCheck, Zap, Radio, Globe } from 'lucide-react';
import { CollectorState, CollectorMode, MIRROR_URLS } from '../utils/collector';
import { COLOR_LABEL, COLOR_PT } from '../utils/prediction';

export interface CollectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectorState?: CollectorState;
  state?: CollectorState;
  collectorRunning?: boolean;
  roundsCount?: number;
  onToggleCollector?: () => void;
  onSelectMode: (mode: CollectorMode) => void;
  onSyncHistoryNow?: () => Promise<void> | void;
  onForceSync?: () => Promise<void> | void;
  onClearLogs?: () => void;
}

export const CollectorModal: React.FC<CollectorModalProps> = ({
  isOpen,
  onClose,
  collectorState: propState,
  state: aliasState,
  collectorRunning = true,
  roundsCount = 0,
  onToggleCollector,
  onSelectMode,
  onSyncHistoryNow,
  onForceSync,
  onClearLogs,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);

  if (!isOpen) return null;

  const collectorState: CollectorState = propState || aliasState || {
    status: 'connecting',
    statusText: 'Conectando...',
    mode: 'auto',
    activeSource: 'Proxy Servidor',
    lastRound: null,
    lastCheckTime: Date.now(),
    latencyMs: 0,
    totalCollectedSession: 0,
    logs: [],
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      if (onForceSync) {
        await onForceSync();
      } else if (onSyncHistoryNow) {
        await onSyncHistoryNow();
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const isLive = collectorState.status === 'live';
  const isConnecting = collectorState.status === 'connecting';
  const isError = collectorState.status === 'error';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#141417] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#1C1C21]">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-3 h-3 rounded-full ${
                isLive
                  ? 'bg-[#00E676] animate-ping'
                  : isConnecting
                  ? 'bg-[#FF9100] animate-pulse'
                  : isError
                  ? 'bg-[#FF2442]'
                  : 'bg-zinc-500'
              }`}
            />
            <div>
              <h3 className="font-display font-extrabold text-sm text-white">
                Diagnóstico & Status da Coleta
              </h3>
              <p className="text-[11px] text-zinc-400">
                Fonte ativa: <span className="text-zinc-200 font-mono font-bold">{collectorState.activeSource}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Status Banner */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between ${
              isLive
                ? 'bg-[#00E676]/10 border-[#00E676]/30 text-[#00E676]'
                : isConnecting
                ? 'bg-[#FF9100]/10 border-[#FF9100]/30 text-[#FF9100]'
                : isError
                ? 'bg-[#FF2442]/10 border-[#FF2442]/30 text-[#FF2442]'
                : 'bg-[#1C1C21] border-white/10 text-zinc-400'
            }`}
          >
            <div className="flex items-center gap-2">
              {isLive ? (
                <CheckCircle2 className="w-5 h-5 shrink-0" />
              ) : isError ? (
                <AlertTriangle className="w-5 h-5 shrink-0" />
              ) : (
                <Activity className="w-5 h-5 shrink-0 animate-spin" />
              )}
              <div>
                <div className="font-bold text-xs uppercase tracking-wide">
                  {collectorState.statusText}
                </div>
                <div className="text-[11px] opacity-80">
                  {collectorRunning ? 'Coletando giros e alimentando IA' : 'Coleta em pausa'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleCollector}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer transition-all ${
                collectorRunning
                  ? 'bg-zinc-800 hover:bg-zinc-700 text-white border border-white/20'
                  : 'bg-[#FF2442] hover:bg-[#FF2442]/90 text-white'
              }`}
            >
              {collectorRunning ? 'Pausar' : 'Ligar Coleta'}
            </button>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-2 text-center font-mono">
            <div className="bg-[#1C1C21] border border-white/5 p-2.5 rounded-xl">
              <span className="text-[10px] text-zinc-400 uppercase block mb-0.5">Total Histórico</span>
              <strong className="text-white text-sm">{roundsCount}</strong>
            </div>
            <div className="bg-[#1C1C21] border border-white/5 p-2.5 rounded-xl">
              <span className="text-[10px] text-zinc-400 uppercase block mb-0.5">Nesta Sessão</span>
              <strong className="text-[#00E676] text-sm">{collectorState.totalCollectedSession}</strong>
            </div>
            <div className="bg-[#1C1C21] border border-white/5 p-2.5 rounded-xl">
              <span className="text-[10px] text-zinc-400 uppercase block mb-0.5">Latência</span>
              <strong className="text-white text-sm">{collectorState.latencyMs > 0 ? `${collectorState.latencyMs}ms` : '—'}</strong>
            </div>
          </div>

          {/* Last Round Received */}
          {collectorState.lastRound && (
            <div className="bg-[#1C1C21] border border-white/5 p-3 rounded-xl flex items-center justify-between">
              <span className="text-zinc-400 font-semibold">Último giro recebido:</span>
              <div className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
                    collectorState.lastRound.color === 'red'
                      ? 'bg-[#FF2442] text-white'
                      : collectorState.lastRound.color === 'black'
                      ? 'bg-[#334155] text-white'
                      : 'bg-white text-black'
                  }`}
                >
                  {collectorState.lastRound.number}
                </span>
                <span className="font-mono text-zinc-300 font-bold">
                  {COLOR_PT[collectorState.lastRound.color]} ({collectorState.lastRound.time})
                </span>
              </div>
            </div>
          )}

          {/* Mode Selector */}
          <div className="space-y-2">
            <div className="font-display font-bold uppercase text-zinc-400 text-[11px]">
              Modo de Conexão
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onSelectMode('auto')}
                className={`p-2.5 rounded-xl text-left border cursor-pointer transition-all ${
                  collectorState.mode === 'auto'
                    ? 'bg-[#FF2442]/10 border-[#FF2442] text-white'
                    : 'bg-[#1C1C21] border-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Zap className="w-3.5 h-3.5 text-[#FF2442]" />
                  Automático (Híbrido)
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">
                  Alterna entre Servidor, WS e REST automaticamente.
                </div>
              </button>

              <button
                type="button"
                onClick={() => onSelectMode('backend_proxy')}
                className={`p-2.5 rounded-xl text-left border cursor-pointer transition-all ${
                  collectorState.mode === 'backend_proxy'
                    ? 'bg-[#FF2442]/10 border-[#FF2442] text-white'
                    : 'bg-[#1C1C21] border-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#00E676]" />
                  Proxy Servidor API
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">
                  100% livre de bloqueios CORS e firewalls de navegador.
                </div>
              </button>

              <button
                type="button"
                onClick={() => onSelectMode('websocket')}
                className={`p-2.5 rounded-xl text-left border cursor-pointer transition-all ${
                  collectorState.mode === 'websocket'
                    ? 'bg-[#FF2442]/10 border-[#FF2442] text-white'
                    : 'bg-[#1C1C21] border-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Radio className="w-3.5 h-3.5 text-[#FF9100]" />
                  WebSocket Direto
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">
                  Conexão socket direta com api-gaming.blaze.
                </div>
              </button>

              <button
                type="button"
                onClick={() => onSelectMode('simulation')}
                className={`p-2.5 rounded-xl text-left border cursor-pointer transition-all ${
                  collectorState.mode === 'simulation'
                    ? 'bg-[#FF2442]/10 border-[#FF2442] text-white'
                    : 'bg-[#1C1C21] border-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Globe className="w-3.5 h-3.5 text-purple-400" />
                  Modo Simulação / Demo
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">
                  Gera giros de teste a cada 25s para validação de estratégias.
                </div>
              </button>
            </div>
          </div>

          {/* Watchdog de Ciclo Status Card */}
          <div className="bg-[#1C1C21] border border-white/10 p-3 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#FF9100]/10 border border-[#FF9100]/30 flex items-center justify-center text-[#FF9100] font-bold text-sm shrink-0">
                ⚡
              </div>
              <div>
                <div className="font-bold text-white text-xs flex items-center gap-1.5">
                  Watchdog de Ciclo
                  <span className="text-[9px] bg-[#00E676]/20 text-[#00E676] px-1.5 py-0.5 rounded font-black border border-[#00E676]/30">
                    PROTEÇÃO 10S
                  </span>
                </div>
                <div className="text-[10px] text-zinc-400">
                  Em Gale ativo (<code className="text-[#FF9100]">in_gale</code>), reconecta WebSockets após 10s sem dados.
                </div>
              </div>
            </div>
          </div>

          {/* Historical Sync Action */}
          <div className="bg-[#1C1C21] border border-white/10 p-3 rounded-xl flex items-center justify-between">
            <div>
              <div className="font-bold text-white text-xs">Sincronizar Últimos 100 Giros</div>
              <div className="text-[10px] text-zinc-400">Puxa o histórico recente completo da Blaze agora</div>
            </div>
            <button
              type="button"
              disabled={isSyncing}
              onClick={handleSync}
              className="px-3.5 py-2 bg-[#FF2442] hover:bg-[#FF2442]/90 disabled:opacity-50 text-white font-bold rounded-lg flex items-center gap-1.5 text-xs cursor-pointer shadow-md"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Sincronizando...' : 'Puxar Agora'}
            </button>
          </div>

          {/* Collector Logs */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-display font-bold uppercase text-zinc-400 text-[11px]">
                Logs de Conexão em Tempo Real
              </span>
              {onClearLogs && collectorState.logs.length > 0 && (
                <button
                  type="button"
                  onClick={onClearLogs}
                  className="text-[10px] text-zinc-400 hover:text-zinc-200 cursor-pointer"
                >
                  Limpar Logs
                </button>
              )}
            </div>
            <div className="bg-black/40 border border-white/5 rounded-xl p-2.5 font-mono text-[11px] max-h-36 overflow-y-auto space-y-1 scrollbar-none">
              {collectorState.logs.length === 0 ? (
                <div className="text-zinc-500 text-center py-2">Nenhum evento registrado ainda.</div>
              ) : (
                collectorState.logs.slice(-15).reverse().map(log => (
                  <div key={log.id} className="flex items-start gap-1.5 leading-tight">
                    <span className="text-zinc-500 shrink-0">[{log.time}]</span>
                    <span
                      className={
                        log.type === 'success'
                          ? 'text-[#00E676]'
                          : log.type === 'error'
                          ? 'text-[#FF2442]'
                          : log.type === 'warning'
                          ? 'text-[#FF9100]'
                          : 'text-zinc-300'
                      }
                    >
                      {log.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-white/10 bg-[#1C1C21] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
