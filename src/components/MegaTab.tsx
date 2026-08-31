import React from 'react';
import { MegaTroiaState } from '../types';
import { formatBRL } from '../utils/audio';

interface MegaTabProps {
  mega: MegaTroiaState;
  onChangeT: (t: number) => void;
  onChangeFirstBlack: (b: number) => void;
  onChangeBank: (b: number) => void;
  onChangeMaxEntries: (m: number) => void;
  onToggleEnabled: () => void;
  onSetEntry: (n: number) => void;
  onNextEntry: () => void;
  onApplyToBets: () => void;
  onSave: () => void;
}

export const MegaTab: React.FC<MegaTabProps> = ({
  mega,
  onChangeT,
  onChangeFirstBlack,
  onChangeBank,
  onChangeMaxEntries,
  onToggleEnabled,
  onSetEntry,
  onNextEntry,
  onApplyToBets,
  onSave,
}) => {
  const rows = mega.rows || [];
  const last = rows[rows.length - 1];
  const gastoTotal = last ? last.S_after : 0;
  const sobra = (mega.bank || 1100) - gastoTotal;
  const curEntry = Math.min(mega.currentEntry || 1, rows.length);
  const activeRow = rows[curEntry - 1];

  return (
    <div className="space-y-3 pb-8">
      {/* Mega Troia Setup Card */}
      <div className="bg-[#141417] border border-white/10 rounded-2xl p-4 shadow-md space-y-3">
        <div className="text-xs font-display font-bold uppercase text-[#A1A1AA]">
          Mega Troia — Configuração Oficial
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider block mb-1.5">
              Lucro Alvo T (R$)
            </label>
            <input
              type="number"
              min={0.5}
              step={0.5}
              value={mega.T}
              onChange={e => onChangeT(Number(e.target.value))}
              className="w-full bg-[#1C1C21] border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider block mb-1.5">
              1ª Aposta na Cor / Preto (R$)
            </label>
            <input
              type="number"
              min={0.1}
              step={0.1}
              value={mega.firstBlack}
              onChange={e => onChangeFirstBlack(Number(e.target.value))}
              className="w-full bg-[#1C1C21] border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider block mb-1.5">
              Banca de Referência (R$)
            </label>
            <input
              type="number"
              min={1}
              step={1}
              value={mega.bank}
              onChange={e => onChangeBank(Number(e.target.value))}
              className="w-full bg-[#1C1C21] border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider block mb-1.5">
              Máx. Entradas (1–6)
            </label>
            <input
              type="number"
              min={1}
              max={6}
              value={mega.maxEntries}
              onChange={e => onChangeMaxEntries(Number(e.target.value))}
              className="w-full bg-[#1C1C21] border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono outline-none"
            />
          </div>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div>
            <div className="text-xs font-semibold text-white">Usar Mega Troia nas entradas</div>
            <div className="text-[11px] text-[#A1A1AA]">Ajusta o valor sugerido de cor e proteção no branco</div>
          </div>
          <button
            type="button"
            onClick={onToggleEnabled}
            className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer border ${
              mega.enabled ? 'bg-[#FF2442] border-[#FF2442]' : 'bg-[#1C1C21] border-white/10'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                mega.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Summary Grid */}
      <div className="bg-[#141417] border border-white/10 rounded-2xl p-4 shadow-md">
        <div className="text-xs font-display font-bold uppercase text-[#A1A1AA] mb-3">
          Resumo do Ciclo
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-[#1C1C21] p-3 rounded-xl text-center border border-white/5">
            <div className="text-[11px] text-[#A1A1AA] mb-1">Gasto Total ({mega.maxEntries}ª)</div>
            <div className="font-mono text-sm sm:text-base font-bold text-white">
              {formatBRL(gastoTotal)}
            </div>
          </div>
          <div className="bg-[#1C1C21] p-3 rounded-xl text-center border border-white/5">
            <div className="text-[11px] text-[#A1A1AA] mb-1">Sobra da Banca</div>
            <div
              className={`font-mono text-sm sm:text-base font-bold ${
                sobra >= 0 ? 'text-[#00E676]' : 'text-[#FF2442]'
              }`}
            >
              {formatBRL(sobra)}
            </div>
          </div>
          <div className="bg-[#1C1C21] p-3 rounded-xl text-center border border-white/5">
            <div className="text-[11px] text-[#A1A1AA] mb-1">Entrada Atual</div>
            <div className="font-mono text-sm sm:text-base font-bold text-[#FF9100]">
              {curEntry}ª
            </div>
          </div>
          <div className="bg-[#1C1C21] p-3 rounded-xl text-center border border-white/5">
            <div className="text-[11px] text-[#A1A1AA] mb-1">Aposta Cor Atual</div>
            <div className="font-mono text-sm sm:text-base font-bold text-white">
              {activeRow ? formatBRL(activeRow.black) : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Table of Entries */}
      <div className="bg-[#141417] border border-white/10 rounded-2xl p-4 shadow-md">
        <div className="text-xs font-display font-bold uppercase text-[#A1A1AA] mb-3">
          Tabela de Entradas (Planilha Oficial)
        </div>

        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-xs font-mono text-left border-collapse min-w-[320px]">
            <thead>
              <tr className="border-b border-white/10 text-[#A1A1AA] text-[10px] uppercase font-sans">
                <th className="py-2 px-2">Ent.</th>
                <th className="py-2 px-2">S ant.</th>
                <th className="py-2 px-2 text-slate-300">Cor</th>
                <th className="py-2 px-2 text-white">Branco</th>
                <th className="py-2 px-2">Total</th>
                <th className="py-2 px-2">S após</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map(r => {
                const isActive = r.entry === curEntry;
                return (
                  <tr
                    key={r.entry}
                    className={`transition-colors ${
                      isActive ? 'bg-[#FF2442]/15 font-bold text-white' : 'text-zinc-300'
                    }`}
                  >
                    <td className="py-2.5 px-2 font-bold">{r.entry}ª</td>
                    <td className="py-2.5 px-2">{r.S_prev.toFixed(2)}</td>
                    <td className="py-2.5 px-2 text-slate-300">{r.black.toFixed(2)}</td>
                    <td className="py-2.5 px-2 text-white">{r.white.toFixed(2)}</td>
                    <td className="py-2.5 px-2 font-bold">{r.total.toFixed(2)}</td>
                    <td className="py-2.5 px-2">{r.S_after.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="text-[11px] text-[#A1A1AA] leading-relaxed mt-3 pt-2 border-t border-white/5">
          Fórmula: 1ª entrada Branco = (T + cor) / 13. Entradas 2ª–6ª: cor = (7/6) × (T + S); branco = (T + S + cor) / 13.
        </p>
      </div>

      {/* Cycle Controls */}
      <div className="bg-[#141417] border border-white/10 rounded-2xl p-4 shadow-md space-y-3">
        <div className="text-xs font-display font-bold uppercase text-[#A1A1AA]">
          Controle do Ciclo Mega Troia
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onSetEntry(1)}
            className="flex-1 py-2.5 bg-[#1C1C21] hover:bg-[#2A2A30] border border-white/10 text-white font-bold text-xs rounded-xl cursor-pointer transition-all active:scale-95"
          >
            Reset 1ª
          </button>
          <button
            type="button"
            onClick={onNextEntry}
            className="flex-1 py-2.5 bg-[#1C1C21] hover:bg-[#2A2A30] border border-white/10 text-[#FF9100] font-bold text-xs rounded-xl cursor-pointer transition-all active:scale-95"
          >
            Próxima Entrada
          </button>
          <button
            type="button"
            onClick={onApplyToBets}
            className="flex-1 py-2.5 bg-[#FF2442] hover:bg-[#FF2442]/90 text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-md active:scale-95"
          >
            Aplicar ao App
          </button>
        </div>

        <button
          type="button"
          onClick={onSave}
          className="w-full py-3 bg-[#FF2442] hover:bg-[#FF2442]/90 text-white font-bold text-sm rounded-full cursor-pointer shadow-lg active:scale-98 mt-2"
        >
          💾 Salvar Configurações Mega Troia
        </button>
      </div>
    </div>
  );
};
