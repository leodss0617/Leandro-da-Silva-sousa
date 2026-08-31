import React, { useState } from 'react';
import { ExternalLink, RotateCw, Home, Compass } from 'lucide-react';

interface BlazeTabProps {
  onOpenExternal: () => void;
}

export const BlazeTab: React.FC<BlazeTabProps> = ({ onOpenExternal }) => {
  const [url, setUrl] = useState('https://blaze.bet.br/pt/games/double');
  const [iframeKey, setIframeKey] = useState(1);

  const handleReload = () => {
    setIframeKey(prev => prev + 1);
  };

  const handleGoHome = () => {
    setUrl('https://blaze.bet.br/pt/games/double');
    setIframeKey(prev => prev + 1);
  };

  return (
    <div className="flex flex-col h-full space-y-3 pb-8">
      {/* Blaze Toolbar */}
      <div className="bg-[#141417] border border-white/10 rounded-2xl p-3 shadow-md flex items-center gap-2">
        <button
          type="button"
          onClick={handleGoHome}
          title="Início Blaze"
          className="p-2 bg-[#1C1C21] hover:bg-[#2A2A30] border border-white/10 text-zinc-300 rounded-xl cursor-pointer"
        >
          <Home className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          className="flex-1 bg-[#1C1C21] border border-white/10 text-white rounded-xl px-3 py-2 text-xs font-mono outline-none"
        />

        <button
          type="button"
          onClick={handleReload}
          title="Recarregar"
          className="p-2 bg-[#1C1C21] hover:bg-[#2A2A30] border border-white/10 text-zinc-300 rounded-xl cursor-pointer"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onOpenExternal}
          className="px-3 py-2 bg-[#FF2442] hover:bg-[#FF2442]/90 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Navegador
        </button>
      </div>

      {/* Embedded Iframe / Fallback Card */}
      <div className="flex-1 min-h-[420px] bg-[#141417] border border-white/10 rounded-2xl overflow-hidden shadow-lg flex flex-col relative">
        <iframe
          key={iframeKey}
          src={url}
          title="Blaze Double Game"
          className="w-full flex-1 border-0 bg-black"
          allow="autoplay; fullscreen; payment; geolocation"
          referrerPolicy="no-referrer-when-downgrade"
        />

        {/* Informative Overlay Card */}
        <div className="bg-[#1C1C21] border-t border-white/10 p-4 text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-white font-display font-bold text-xs uppercase">
            <Compass className="w-4 h-4 text-[#FF2442]" />
            Dica para Jogar com a IA
          </div>
          <p className="text-xs text-[#A1A1AA] leading-relaxed">
            Caso o site da Blaze bloqueie a exibição interna por segurança (X-Frame-Options), use o botão{' '}
            <b className="text-white">Abrir Blaze no Navegador</b> e ative a <b className="text-white">Bolinha AI flutuante</b> ou a tela dividida.
          </p>
          <div className="flex gap-2 justify-center pt-1">
            <button
              type="button"
              onClick={onOpenExternal}
              className="px-4 py-2.5 bg-[#FF2442] text-white font-bold text-xs rounded-full cursor-pointer hover:bg-[#FF2442]/90 transition-all shadow-md active:scale-95"
            >
              Abrir Blaze em Nova Janela
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
