import React from 'react';
import { Trophy } from 'lucide-react';

interface HeaderProps {
  status: 'offline' | 'connecting' | 'live' | 'error';
  statusText: string;
  isTargetHit?: boolean;
  onOpenCollectorModal?: () => void;
  onNavigateToBankroll?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status = 'offline',
  statusText = 'Offline',
  isTargetHit = false,
  onOpenCollectorModal,
  onNavigateToBankroll,
}) => {
  const safeStatus = status || 'offline';
  const isLive = safeStatus === 'live';
  const isConnecting = safeStatus === 'connecting';
  const safeText = statusText || (isLive ? 'Ao vivo' : isConnecting ? 'Conectando…' : 'Offline');

  return (
    <header className={`h-[52px] px-4 border-b flex items-center justify-between z-30 shrink-0 select-none transition-colors ${
      isTargetHit ? 'bg-[#141417] border-[#00E676]/30 shadow-[0_2px_12px_rgba(0,230,118,0.1)]' : 'bg-[#141417] border-white/5'
    }`}>
      <div className="flex items-center gap-2.5">
        <div className={`w-2.5 h-2.5 rounded-full ${isTargetHit ? 'bg-[#00E676] shadow-[0_0_12px_rgba(0,230,118,0.6)] animate-ping' : 'bg-[#FF2442] shadow-[0_0_12px_rgba(255,36,66,0.5)] animate-pulse-glow'}`} />
        <span className="font-display font-extrabold text-[15px] tracking-tight text-white flex items-center gap-1.5">
          Leandro Double <span className="text-[#FF2442] text-xs font-mono font-bold bg-[#FF2442]/10 border border-[#FF2442]/30 px-1.5 py-0.5 rounded">v2.9</span>
        </span>

        {isTargetHit && (
          <button
            type="button"
            onClick={onNavigateToBankroll}
            title="Meta diária atingida! Clique para ver a banca."
            className="flex items-center gap-1 bg-[#00E676]/20 border border-[#00E676]/50 text-[#00E676] px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide cursor-pointer hover:bg-[#00E676]/30 active:scale-95 transition-all animate-pulse"
          >
            <Trophy className="w-3 h-3" />
            <span className="hidden sm:inline">META</span> BATIDA
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onOpenCollectorModal}
        title="Clique para abrir status e diagnóstico da coleta"
        className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer hover:scale-105 active:scale-95 ${
          isLive
            ? 'bg-[#00E676]/10 text-[#00E676] border-[#00E676]/30 hover:bg-[#00E676]/20'
            : isConnecting
            ? 'bg-[#FF9100]/10 text-[#FF9100] border-[#FF9100]/30 hover:bg-[#FF9100]/20'
            : 'bg-[#1C1C21] text-[#A1A1AA] border-white/10 hover:border-white/30'
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isLive
              ? 'bg-[#00E676] animate-ping'
              : isConnecting
              ? 'bg-[#FF9100] animate-pulse'
              : 'bg-[#A1A1AA]'
          }`}
        />
        <span>{safeText}</span>
      </button>
    </header>
  );
};
