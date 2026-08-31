import React, { useState, useRef } from 'react';
import { PredictionResult, BrainState, MegaTroiaState } from '../types';
import { COLOR_LABEL } from '../utils/prediction';
import { formatBRL } from '../utils/audio';
import { X, ExternalLink, RefreshCw } from 'lucide-react';

interface FloatingBubbleProps {
  prediction: PredictionResult | null;
  collectorStatus: 'offline' | 'connecting' | 'live' | 'error';
  roundsCount: number;
  brain?: BrainState;
  brainEnabled?: boolean;
  mega?: MegaTroiaState;
  baseBet?: number;
  onOpenBlaze: () => void;
  onForceCollector: () => void;
  visible: boolean;
}

export const FloatingBubble: React.FC<FloatingBubbleProps> = ({
  prediction,
  collectorStatus = 'offline',
  roundsCount = 0,
  brain,
  brainEnabled = false,
  mega,
  baseBet = 2.5,
  onOpenBlaze,
  onForceCollector,
  visible,
}) => {
  const [panelOpen, setPanelOpen] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const elementStartPos = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  if (!visible) return null;

  const isGaleActive = brainEnabled && brain && brain.state === 'in_gale' && brain.galeLevel > 0;
  const isWaitingSignal = brainEnabled
    ? brain?.state === 'idle' || (!isGaleActive && (!prediction || prediction.action === 'SKIP' || prediction.color === 'skip'))
    : (!prediction || prediction.action === 'SKIP' || prediction.color === 'skip');

  const targetColor = isGaleActive
    ? (brain?.currentPred?.color || prediction?.color || 'red')
    : (brainEnabled && brain?.state === 'waiting' && brain.currentPred?.color)
    ? brain.currentPred.color
    : (prediction?.color || 'skip');

  const confidence = isGaleActive && brain?.currentPred
    ? Math.round(brain.currentPred.confidence * 100)
    : prediction
    ? Math.round(prediction.confidence * 100)
    : 0;

  const inMega = mega?.enabled && (mega.rows?.length || 0) > 0;
  const megaCurrent = inMega && mega?.rows ? mega.rows[Math.min((mega.currentEntry || 1) - 1, mega.rows.length - 1)] : null;
  const currentBetAmount = isGaleActive
    ? (inMega && megaCurrent ? megaCurrent.black : brain?.entryAmount || (baseBet * Math.pow(2, brain?.galeLevel || 1)))
    : (inMega && megaCurrent ? megaCurrent.black : baseBet);

  const colorBg = isGaleActive
    ? 'bg-[#FF9100]'
    : targetColor === 'red'
    ? 'bg-[#FF2442]'
    : targetColor === 'black'
    ? 'bg-[#1E293B] border border-slate-500'
    : targetColor === 'white'
    ? 'bg-[#E2E8F0] text-black'
    : 'bg-zinc-700';

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    hasMoved.current = false;
    dragStartPos.current = { x: e.clientX, y: e.clientY };

    const currentX = position ? position.x : window.innerWidth - 70;
    const currentY = position ? position.y : window.innerHeight - 150;
    elementStartPos.current = { x: currentX, y: currentY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      hasMoved.current = true;
    }
    const newX = Math.max(10, Math.min(window.innerWidth - 65, elementStartPos.current.x + dx));
    const newY = Math.max(60, Math.min(window.innerHeight - 120, elementStartPos.current.y + dy));
    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = () => {
    isDragging.current = false;
    if (!hasMoved.current) {
      setPanelOpen(prev => !prev);
    }
  };

  const stylePos = position
    ? { left: `${position.x}px`, top: `${position.y}px` }
    : { right: '16px', bottom: '80px' };

  return (
    <>
      {/* Draggable Bubble */}
      <div
        id="floatBubble"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={stylePos}
        className={`fixed z-40 w-14 h-14 rounded-full shadow-[0_6px_25px_rgba(255,36,66,0.4)] border-2 border-white/20 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none transition-transform duration-75 active:scale-90 ${
          collectorStatus === 'live' ? 'animate-pulse' : ''
        } ${isGaleActive ? 'bg-gradient-to-br from-[#FF9100] to-[#E65100]' : 'bg-gradient-to-br from-[#FF2442] to-[#B91C1C]'} text-white`}
      >
        <span className="font-display font-black text-[11px]">
          {isGaleActive ? `G${brain?.galeLevel}` : 'AI'}
        </span>
        <div className={`w-3.5 h-3.5 rounded-full absolute -top-0.5 -right-0.5 ${colorBg} border-2 border-[#141417] shadow-sm`} />
      </div>

      {/* Floating Status Panel */}
      {panelOpen && (
        <div
          id="floatPanel"
          style={{
            left: position ? `${Math.max(10, Math.min(window.innerWidth - 270, position.x - 100))}px` : 'auto',
            right: position ? 'auto' : '16px',
            top: position ? `${Math.max(70, Math.min(window.innerHeight - 280, position.y - 200))}px` : 'auto',
            bottom: position ? 'auto' : '145px',
          }}
          className="fixed z-40 w-[270px] bg-[#141417]/95 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 shadow-2xl animate-in fade-in zoom-in-95 select-none"
        >
          <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2.5">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-xs uppercase text-zinc-300">
                Double IA
              </span>
              {brainEnabled && (
                <span className="text-[9px] bg-[#A855F7]/25 text-[#C084FC] font-black px-1.5 py-0.5 rounded border border-[#A855F7]/40">
                  🧠 CÉREBRO
                </span>
              )}
              {isGaleActive && (
                <span className="text-[10px] bg-[#FF9100]/20 text-[#FF9100] font-black px-1.5 py-0.5 rounded border border-[#FF9100]/40">
                  GALE {brain?.galeLevel}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              className="text-zinc-400 hover:text-white p-0.5 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="text-center my-2">
            <div className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
              {isGaleActive ? `Entrada no Gale ${brain?.galeLevel}` : 'Previsão Atual'}
            </div>
            <div
              className={`font-display font-extrabold text-lg my-0.5 ${
                isWaitingSignal
                  ? 'text-zinc-500'
                  : targetColor === 'red'
                  ? 'text-[#FF2442]'
                  : targetColor === 'black'
                  ? 'text-slate-300'
                  : 'text-white'
              }`}
            >
              {isWaitingSignal ? 'NO AGUARDO' : COLOR_LABEL[targetColor as any] || 'ENTRAR'}
            </div>

            {/* Bet Value Callout */}
            {!isWaitingSignal && (
              <div className="text-xs font-mono font-bold text-[#00E676] my-1 bg-black/30 py-1 rounded-lg border border-white/5">
                Aposta: {formatBRL(currentBetAmount)}
              </div>
            )}

            <div className="text-[11px] text-zinc-400 font-mono mt-1">
              Confiança: <span className="text-white font-bold">{isWaitingSignal ? '—' : `${confidence}%`}</span> ·{' '}
              <span className={collectorStatus === 'live' ? 'text-[#00E676]' : 'text-zinc-400'}>
                {collectorStatus === 'live' ? 'Ao vivo' : collectorStatus}
              </span>
            </div>
          </div>

          <div className="bg-[#1C1C21] p-2 rounded-xl text-[11px] font-mono text-zinc-300 space-y-1 my-2.5 border border-white/5">
            <div className="flex justify-between">
              <span>Coleta:</span>
              <span className={collectorStatus === 'live' ? 'text-[#00E676] font-bold' : 'text-zinc-400'}>
                {collectorStatus === 'live' ? 'Conectado' : collectorStatus}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Rodadas Coletadas:</span>
              <span className="text-white font-bold">{roundsCount}</span>
            </div>
          </div>

          <div className="flex gap-1.5 mt-2">
            <button
              type="button"
              onClick={onOpenBlaze}
              className="flex-1 bg-[#FF2442] hover:bg-[#FF2442]/90 text-white text-[11px] font-bold py-2 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Blaze
            </button>
            <button
              type="button"
              onClick={onForceCollector}
              className="flex-1 bg-[#1C1C21] hover:bg-[#2A2A30] border border-white/10 text-white text-[11px] font-bold py-2 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reconectar
            </button>
          </div>
        </div>
      )}
    </>
  );
};

