import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Round,
  SignalRecord,
  AppPreferences,
  BrainState,
  MegaTroiaState,
  LearnState,
  PredictionResult,
  ScreenTab,
  CollectorDiagnostics,
} from './types';
import { colorOf, predict, evolveWeights, calculateDynamicGaleMultiplier } from './utils/prediction';
import { calcMegaTroiaRows } from './utils/megaTroia';
import { playSignalSound, play80PercentWarningSound, unlockAudio, speakAnnouncement, formatBRL } from './utils/audio';
import { CollectorState, CollectorMode, CollectorLogItem, parseBlazeItem, cleanAndDeduplicateRounds, MIRROR_URLS } from './utils/collector';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { Toast } from './components/Toast';
import { FloatingBubble } from './components/FloatingBubble';
import { CollectorModal } from './components/CollectorModal';
import { HomeTab } from './components/HomeTab';
import { HistoryTab } from './components/HistoryTab';
import { BlazeTab } from './components/BlazeTab';
import { BrainTab } from './components/BrainTab';
import { BankrollTab } from './components/BankrollTab';
import { MegaTab } from './components/MegaTab';
import { ConfigTab } from './components/ConfigTab';
import { Trophy, ArrowRight, Target, Sparkles, CheckCircle2 } from 'lucide-react';

const DEFAULT_PREFS: AppPreferences = {
  brain_enabled: false,
  brain_max_gales: 2,
  brain_gale_min_confidence: 0.6,
  brain_gale_multiplier: 2.0,
  brain_auto_multiplier: false,
  brain_auto_continue: true,
  brain_always_gale: true,
  mega_troia_enabled: false,
  mega_troia_target_profit: 5,
  mega_troia_max_entries: 6,
  mega_troia_bankroll: 1100,
  bet_amount: 2.5,
  daily_profit_target: 50,
  daily_profit_target_enabled: true,
  daily_profit_target_alert_80_enabled: true,
  daily_profit_target_alert_sound: 'fanfare',
  bankroll_mode: 'balanced',
  white_only: false,
  skip_low_conf: true,
  min_confidence: 0.55,
  use_frequency: true,
  use_markov: true,
  use_streak: true,
  use_white_cycle: true,
  use_pattern: true,
  show_bubble: true,
  collector_should_run: true,
  collector_mode: 'auto',
  keep_background: true,
  sound_enabled: true,
  voice_enabled: true,
  sound_volume: 0.8,
};

const DEFAULT_BRAIN: BrainState = {
  state: 'idle',
  galeLevel: 0,
  lastOutcome: null,
  cycles: 0,
  currentPred: null,
  entryAmount: 2.5,
};

const DEFAULT_LEARN: LearnState = {
  signalWeights: {
    frequency: 0.22,
    markov: 0.2,
    streak: 0.1,
    white_cycle: 0.14,
    pattern: 0.12,
    deep: 0.12,
    sequence_mem: 0.1,
  },
  signalHits: {},
  sequenceMemory: {},
  numberAfter: {},
  hourBias: {},
  confCalibration: [],
  totalLearned: 0,
  lastEvolveAt: 0,
};

export default function App() {
  // State Initialization from LocalStorage
  const [rounds, setRounds] = useState<Round[]>(() => {
    try {
      const raw = localStorage.getItem('ld_v2');
      if (raw) {
        const d = JSON.parse(raw);
        if (d.rounds && Array.isArray(d.rounds)) {
          return cleanAndDeduplicateRounds(d.rounds);
        }
      }
    } catch {}
    return [];
  });

  const [signals, setSignals] = useState<SignalRecord[]>(() => {
    try {
      const raw = localStorage.getItem('ld_v2');
      if (raw) {
        const d = JSON.parse(raw);
        return d.signals || [];
      }
    } catch {}
    return [];
  });

  const [prefs, setPrefs] = useState<AppPreferences>(() => {
    try {
      const raw = localStorage.getItem('ld_v2');
      if (raw) {
        const d = JSON.parse(raw);
        return { ...DEFAULT_PREFS, ...(d.prefs || {}) };
      }
    } catch {}
    return DEFAULT_PREFS;
  });

  const [brain, setBrain] = useState<BrainState>(() => {
    try {
      const raw = localStorage.getItem('ld_v2');
      if (raw) {
        const d = JSON.parse(raw);
        return { ...DEFAULT_BRAIN, ...(d.brain || {}) };
      }
    } catch {}
    return DEFAULT_BRAIN;
  });

  const [mega, setMega] = useState<MegaTroiaState>(() => {
    try {
      const raw = localStorage.getItem('ld_mega');
      if (raw) {
        const d = JSON.parse(raw);
        const rows = calcMegaTroiaRows(d.T || 5, d.firstBlack || 2.5, d.maxEntries || 6);
        return { ...d, rows };
      }
    } catch {}
    return {
      T: 5,
      firstBlack: 2.5,
      bank: 1100,
      maxEntries: 6,
      currentEntry: 1,
      enabled: false,
      rows: calcMegaTroiaRows(5, 2.5, 6),
    };
  });

  const [learn, setLearn] = useState<LearnState>(() => {
    try {
      const raw = localStorage.getItem('ld_learn_v25');
      if (raw) {
        const d = JSON.parse(raw);
        return { ...DEFAULT_LEARN, ...d };
      }
    } catch {}
    return DEFAULT_LEARN;
  });

  const [bankroll, setBankroll] = useState<number>(() => {
    try {
      const raw = localStorage.getItem('ld_v2');
      if (raw) {
        const d = JSON.parse(raw);
        return d.bankroll || 1100;
      }
    } catch {}
    return 1100;
  });

  const [dayWins, setDayWins] = useState<number>(() => {
    try {
      const raw = localStorage.getItem('ld_v2');
      if (raw) return JSON.parse(raw).dayWins || 0;
    } catch {}
    return 0;
  });

  const [dayLosses, setDayLosses] = useState<number>(() => {
    try {
      const raw = localStorage.getItem('ld_v2');
      if (raw) return JSON.parse(raw).dayLosses || 0;
    } catch {}
    return 0;
  });

  const [dayPL, setDayPL] = useState<number>(() => {
    try {
      const raw = localStorage.getItem('ld_v2');
      if (raw) return JSON.parse(raw).dayPL || 0;
    } catch {}
    return 0;
  });

  const [currentTab, setCurrentTab] = useState<ScreenTab>('home');
  const [collectorState, setCollectorState] = useState<CollectorState>({
    status: 'connecting',
    statusText: 'Iniciando…',
    mode: prefs.collector_mode || 'auto',
    activeSource: 'Servidor Proxy (blaze.bet.br)',
    lastRound: null,
    lastCheckTime: Date.now(),
    latencyMs: 0,
    totalCollectedSession: 0,
    logs: [],
  });
  const [isCollectorModalOpen, setIsCollectorModalOpen] = useState(false);
  const [isSyncingHistory, setIsSyncingHistory] = useState(false);
  const [toastInfo, setToastInfo] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isTargetBannerDismissed, setIsTargetBannerDismissed] = useState(false);

  // Daily profit target metrics
  const dailyTargetProfit = prefs.daily_profit_target ?? 50;
  const isDailyTargetEnabled = prefs.daily_profit_target_enabled !== false;
  const isDailyTargetHit = isDailyTargetEnabled && dailyTargetProfit > 0 && dayPL >= dailyTargetProfit;

  // References for WebSocket & timer lifecycles & deduplication
  const wsRef = useRef<WebSocket | null>(null);
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const simulationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchdogTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastActivityTimeRef = useRef<number>(Date.now());
  const lastWatchdogTriggerTimeRef = useRef<number>(0);
  const lastSignalKeyRef = useRef<string | null>(null);
  const wakeLockRef = useRef<any>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSyncingRef = useRef(false);
  const hasAnnouncedTargetHitRef = useRef<boolean>(false);
  const hasAnnounced80PercentRef = useRef<boolean>(false);

  // Strict deduplication sets and refs
  const seenRoundKeysRef = useRef<Set<string>>(new Set());
  const lastProcessedRoundRef = useRef<{ number: number; time: number; id: string } | null>(null);
  const contentRef = useRef<HTMLElement | null>(null);

  // Scroll to top smoothly when switching tabs
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [currentTab]);

  // Initialize deduplication references on initial mount from existing rounds
  useEffect(() => {
    if (rounds.length > 0) {
      rounds.forEach(r => {
        if (r.id) seenRoundKeysRef.current.add(r.id);
        if (r.created_at) seenRoundKeysRef.current.add(`blaze_${r.created_at}_${r.number}`);
      });
      const last = rounds[rounds.length - 1];
      lastProcessedRoundRef.current = {
        number: last.number,
        time: new Date(last.created_at).getTime() || Date.now(),
        id: last.id,
      };
    }
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastInfo({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToastInfo(null);
    }, 3000);
  }, []);

  // Monitor daily profit target achievement (80% warning and 100% goal hit)
  useEffect(() => {
    if (!isDailyTargetEnabled || dailyTargetProfit <= 0) {
      hasAnnouncedTargetHitRef.current = false;
      hasAnnounced80PercentRef.current = false;
      return;
    }

    const target80Val = dailyTargetProfit * 0.8;

    // 100% Goal Hit
    if (dayPL >= dailyTargetProfit) {
      if (!hasAnnouncedTargetHitRef.current) {
        hasAnnouncedTargetHitRef.current = true;
        setIsTargetBannerDismissed(false);
        showToast(`🎉 META DIÁRIA BATIDA! Lucro: +R$ ${dayPL.toFixed(2)}`, 'success');
        playSignalSound(prefs.sound_volume, true, prefs.sound_enabled);
        speakAnnouncement(
          `Parabéns! Meta diária de lucro de ${dailyTargetProfit} reais batida com sucesso!`,
          prefs.voice_enabled,
          prefs.sound_volume
        );
      }
    } else {
      hasAnnouncedTargetHitRef.current = false;
    }

    // 80% Pre-warning alert (Triggered once when reaching 80% before 100%)
    const is80AlertEnabled = prefs.daily_profit_target_alert_80_enabled !== false && prefs.daily_profit_target_alert_sound !== 'off';
    if (dayPL >= target80Val && dayPL < dailyTargetProfit) {
      if (!hasAnnounced80PercentRef.current && is80AlertEnabled) {
        hasAnnounced80PercentRef.current = true;
        showToast(`🎯 80% DA META ATINGIDA (+R$ ${dayPL.toFixed(2)})! Prepare-se para encerrar.`, 'info');
        play80PercentWarningSound(
          prefs.sound_volume,
          prefs.daily_profit_target_alert_sound || 'fanfare',
          true,
          prefs.sound_enabled
        );
        speakAnnouncement(
          `Atenção: Você atingiu 80% da meta diária de lucro! Prepare-se para finalizar as operações.`,
          prefs.voice_enabled,
          prefs.sound_volume
        );
      }
    } else if (dayPL < target80Val * 0.9) {
      // Reset 80% trigger if dayPL drops below 72% of target (hysteresis)
      hasAnnounced80PercentRef.current = false;
    }
  }, [
    isDailyTargetEnabled,
    dailyTargetProfit,
    dayPL,
    prefs.daily_profit_target_alert_80_enabled,
    prefs.daily_profit_target_alert_sound,
    prefs.sound_volume,
    prefs.sound_enabled,
    prefs.voice_enabled,
    showToast,
  ]);

  const addCollectorLog = useCallback((message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setCollectorState(prev => ({
      ...prev,
      logs: [
        ...prev.logs,
        {
          id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          time: new Date().toLocaleTimeString('pt-BR', { hour12: false }),
          type,
          message,
        },
      ].slice(-50),
    }));
  }, []);

  // Save states to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        'ld_v2',
        JSON.stringify({
          rounds: rounds.slice(-5000),
          signals: signals.slice(-500),
          prefs,
          bankroll,
          dayWins,
          dayLosses,
          dayPL,
          brain,
        })
      );
    } catch {}
  }, [rounds, signals, prefs, bankroll, dayWins, dayLosses, dayPL, brain]);

  useEffect(() => {
    try {
      localStorage.setItem('ld_mega', JSON.stringify(mega));
    } catch {}
  }, [mega]);

  useEffect(() => {
    try {
      localStorage.setItem('ld_learn_v25', JSON.stringify(learn));
    } catch {}
  }, [learn]);

  // Recalculate Prediction & Arm Brain for new signals if idle
  const runPrediction = useCallback(
    (silent = false) => {
      const pred = predict(rounds, prefs, learn);
      setPrediction(pred);

      // If AI Brain is active and not currently fighting a Gale, arm it with this signal
      if (prefs.brain_enabled && pred.action === 'ENTER' && pred.color !== 'skip') {
        setBrain(prev => {
          if (prev.state === 'idle') {
            const inMega = mega.enabled && mega.rows.length > 0;
            const megaCurrent = inMega ? mega.rows[Math.min((mega.currentEntry || 1) - 1, mega.rows.length - 1)] : null;
            const entryAmt = inMega && megaCurrent ? megaCurrent.black : (prefs.bet_amount || 2.5);

            return {
              ...prev,
              state: 'waiting',
              galeLevel: 0,
              currentPred: pred,
              entryAmount: entryAmt,
            };
          }
          return prev;
        });
      }

      if (!silent && pred.action === 'ENTER' && pred.color !== 'skip') {
        const key = `${pred.color}_${Math.round(pred.confidence * 100)}_r${rounds.length}`;
        if (key !== lastSignalKeyRef.current) {
          lastSignalKeyRef.current = key;
          playSignalSound(prefs.sound_volume, false, prefs.sound_enabled);
          const colorName = pred.color === 'red' ? 'Vermelho' : pred.color === 'black' ? 'Preto' : 'Branco';
          const prefix = prefs.brain_enabled ? 'Cérebro IA: ' : '';
          speakAnnouncement(
            `${prefix}Entrada confirmada no ${colorName}. Valor da aposta: ${prefs.bet_amount.toFixed(2).replace('.', ',')} reais.`,
            prefs.voice_enabled,
            prefs.sound_volume
          );
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(`${prefix}Sinal: ${pred.color.toUpperCase()}`, {
                body: `Confiança ${Math.round(pred.confidence * 100)}% · 1ª Entrada: R$${prefs.bet_amount.toFixed(2)}`,
                silent: !prefs.sound_enabled,
              });
            } catch {}
          }
        }
      }
      return pred;
    },
    [rounds, prefs, learn, mega]
  );

  // Trigger prediction when rounds or preferences change
  useEffect(() => {
    runPrediction(true);
  }, [rounds.length, prefs, runPrediction]);

  // Handle New Round from WS, REST proxy, or Manual with STRICT synchronous deduplication
  const handleAddRound = useCallback(
    (number: number, source = 'blaze', createdAt?: string, customId?: string) => {
      if (typeof number !== 'number' || isNaN(number) || number < 0 || number > 14) return;

      const color = colorOf(number);
      const created_at = createdAt || new Date().toISOString();
      const roundTime = new Date(created_at).getTime() || Date.now();
      const id = customId || (createdAt ? `blaze_${createdAt}_${number}` : `r_${roundTime}_${number}`);

      // 1. Strict deduplication check via Set
      if (seenRoundKeysRef.current.has(id)) {
        return; // Already registered
      }

      // 2. Strict proximity check (avoid duplicate stream events for same roulette spin)
      if (lastProcessedRoundRef.current) {
        const last = lastProcessedRoundRef.current;
        const timeDiff = Math.abs(roundTime - last.time);
        if ((last.number === number && timeDiff < 14000) || last.id === id) {
          return; // Duplicate spin event ignored
        }
      }

      // Register round identifier
      seenRoundKeysRef.current.add(id);
      if (seenRoundKeysRef.current.size > 5000) {
        const arr = Array.from(seenRoundKeysRef.current);
        seenRoundKeysRef.current = new Set(arr.slice(-3000));
      }
      lastProcessedRoundRef.current = { number, time: roundTime, id };
      lastActivityTimeRef.current = Date.now();

      // Update state
      setRounds(prevRounds => {
        const exists = prevRounds.some(r => r.id === id);
        if (exists) return prevRounds;

        if (prevRounds.length > 0) {
          const last = prevRounds[prevRounds.length - 1];
          const tLast = new Date(last.created_at).getTime() || 0;
          if (last.number === number && Math.abs(roundTime - tLast) < 14000) {
            return prevRounds;
          }
        }

        const newRound: Round = {
          id,
          number,
          color,
          created_at,
          source,
        };

        const next = [...prevRounds, newRound];
        return next.length > 5000 ? next.slice(-5000) : next;
      });

      // Update Collector Live Diagnostics
      setCollectorState(prev => ({
        ...prev,
        status: 'live',
        statusText: 'Ao vivo',
        lastCheckTime: Date.now(),
        lastRound: {
          number,
          color,
          time: new Date(created_at).toLocaleTimeString('pt-BR', { hour12: false }),
        },
        totalCollectedSession: prev.totalCollectedSession + 1,
      }));

      // Update Continuous Learning Engine
      setLearn(prevLearn => {
        const L = { ...prevLearn };
        L.totalLearned = (L.totalLearned || 0) + 1;

        // Sequence memory
        const prevColors = rounds.map(r => r.color);
        for (let n = 2; n <= 5; n++) {
          if (prevColors.length >= n) {
            const key = prevColors.slice(-n).join(',');
            if (!L.sequenceMemory[key]) {
              L.sequenceMemory[key] = { red: 0, black: 0, white: 0 };
            }
            L.sequenceMemory[key][color] = (L.sequenceMemory[key][color] || 0) + 1;
          }
        }

        // Number after
        if (rounds.length >= 1) {
          const prev = rounds[rounds.length - 1];
          const nk = String(prev.number);
          if (!L.numberAfter[nk]) {
            L.numberAfter[nk] = { red: 0, black: 0, white: 0 };
          }
          L.numberAfter[nk][color] = (L.numberAfter[nk][color] || 0) + 1;
        }

        // Hour bias
        const h = new Date().getHours();
        if (!L.hourBias[h]) {
          L.hourBias[h] = { red: 0, black: 0, white: 0, n: 0 };
        }
        L.hourBias[h][color]++;
        L.hourBias[h].n++;

        // Calibration with last prediction
        if (prediction && prediction.action === 'ENTER') {
          const hit = prediction.color === color ? 1 : 0;
          L.confCalibration = [...(L.confCalibration || []), {
            conf: prediction.confidence,
            hit,
            color: prediction.color,
            actual: color,
          }].slice(-300);

          if (prediction._signalVotes) {
            Object.keys(prediction._signalVotes).forEach(name => {
              if (!L.signalHits[name]) L.signalHits[name] = { hits: 0, total: 0 };
              L.signalHits[name].total++;
              if (prediction._signalVotes![name] === color) {
                L.signalHits[name].hits++;
              }
            });
          }

          if (L.totalLearned % 10 === 0) {
            return evolveWeights(L);
          }
        }

        return L;
      });

      // 1. Resolve Active AI Brain & Gales & Mega Troia if we were in an active entry
      let cycleEnded = false;
      let targetForNextGale: PredictionResult | null = null;
      let nextGaleLevel = 0;
      let nextBetAmount = prefs.bet_amount || 2.5;

      setBrain(prevBrain => {
        if (!prefs.brain_enabled) return prevBrain;

        // If brain was in waiting (1st entry) or in_gale (G1, G2, etc.)
        if (prevBrain.state === 'waiting' || prevBrain.state === 'in_gale') {
          const pred = prevBrain.currentPred;
          if (!pred || pred.color === 'skip') {
            return { ...prevBrain, state: 'idle', galeLevel: 0 };
          }

          const win = color === pred.color;
          const amount = prevBrain.entryAmount || prefs.bet_amount || 2.5;
          let pl = 0;

          if (win) {
            pl = pred.color === 'white' ? amount * 14 : amount * 1;
            setBankroll(b => b + pl);
            setDayWins(w => w + 1);
            setDayPL(p => p + pl);

            setSignals(prevS => [
              ...prevS,
              {
                color: pred.color as any,
                confidence: pred.confidence,
                outcome: 'win',
                gale: prevBrain.galeLevel,
                pl,
                at: new Date().toISOString(),
              },
            ]);

            const targetColorName = pred.color === 'red' ? 'Vermelho' : pred.color === 'black' ? 'Preto' : 'Branco';
            showToast(`✅ WIN ${pred.color.toUpperCase()} +R$${pl.toFixed(2)} (Gale ${prevBrain.galeLevel})`, 'success');
            playSignalSound(prefs.sound_volume, true, prefs.sound_enabled);
            speakAnnouncement(
              `Vitória confirmada no ${targetColorName}! Lucro de ${pl.toFixed(2).replace('.', ',')} reais. No aguardo da próxima entrada.`,
              prefs.voice_enabled,
              prefs.sound_volume
            );

            // Reset Mega Troia to 1st entry on WIN
            setMega(prevM => {
              if (prevM.enabled) {
                return { ...prevM, currentEntry: 1 };
              }
              return prevM;
            });

            cycleEnded = true;
            return {
              ...prevBrain,
              state: 'idle',
              galeLevel: 0,
              lastOutcome: 'WIN',
              currentPred: null,
              cycles: (prevBrain.cycles || 0) + 1,
            };
          } else {
            // Loss on this step
            pl = -amount;
            setBankroll(b => b + pl);
            setDayPL(p => p + pl);

            const maxG = prefs.brain_max_gales || 2;
            const canDoGale =
              prevBrain.galeLevel < maxG &&
              (prefs.brain_always_gale || pred.confidence >= prefs.brain_gale_min_confidence);

            if (canDoGale) {
              const nextGale = prevBrain.galeLevel + 1;
              const dynamicMultInfo = calculateDynamicGaleMultiplier(
                bankroll,
                prefs.bet_amount,
                dayPL,
                dayWins,
                dayLosses,
                prefs.brain_gale_multiplier,
                prefs.bankroll_mode
              );
              const effectiveMultiplier = prefs.brain_auto_multiplier
                ? dynamicMultInfo.multiplier
                : (prefs.brain_gale_multiplier || 2);
              const nextAmount = amount * effectiveMultiplier;
              const targetColorName = pred.color === 'red' ? 'Vermelho' : pred.color === 'black' ? 'Preto' : 'Branco';

              targetForNextGale = pred;
              nextGaleLevel = nextGale;
              nextBetAmount = nextAmount;

              // Advance Mega Troia entry on loss if enabled
              setMega(prevM => {
                if (prevM.enabled && prevM.currentEntry < prevM.maxEntries) {
                  return { ...prevM, currentEntry: prevM.currentEntry + 1 };
                }
                return prevM;
              });

              lastActivityTimeRef.current = Date.now();
              const multLabel = prefs.brain_auto_multiplier ? ` (${effectiveMultiplier.toFixed(1)}x auto)` : '';
              showToast(`⚡ GALE ${nextGale} ATIVO: ${pred.color.toUpperCase()} — R$ ${nextAmount.toFixed(2)}${multLabel}`, 'error');
              playSignalSound(prefs.sound_volume, true, prefs.sound_enabled);
              speakAnnouncement(
                `Atenção! Entrar no Gale ${nextGale} na cor ${targetColorName}. Valor da aposta: ${nextAmount.toFixed(2).replace('.', ',')} reais.`,
                prefs.voice_enabled,
                prefs.sound_volume
              );

              return {
                ...prevBrain,
                state: 'in_gale',
                galeLevel: nextGale,
                entryAmount: nextAmount,
                lastOutcome: 'LOSS',
                currentPred: pred, // Preserve the original target color across the Gale cycle
              };
            } else {
              // Final Loss after exhausting max gales
              setDayLosses(l => l + 1);

              setSignals(prevS => [
                ...prevS,
                {
                  color: pred.color as any,
                  confidence: pred.confidence,
                  outcome: 'loss',
                  gale: prevBrain.galeLevel,
                  pl,
                  at: new Date().toISOString(),
                },
              ]);

              showToast(`❌ LOSS (Gale ${prevBrain.galeLevel}) — Ciclo Finalizado`, 'error');
              speakAnnouncement(
                'Ciclo encerrado. Ficando no aguardo da próxima entrada.',
                prefs.voice_enabled,
                prefs.sound_volume
              );

              // Reset Mega Troia entry
              setMega(prevM => {
                if (prevM.enabled) {
                  return { ...prevM, currentEntry: 1 };
                }
                return prevM;
              });

              cycleEnded = true;
              return {
                ...prevBrain,
                state: 'idle',
                galeLevel: 0,
                lastOutcome: 'LOSS',
                currentPred: null,
                cycles: (prevBrain.cycles || 0) + 1,
              };
            }
          }
        }

        return prevBrain;
      });
    },
    [rounds, prediction, prefs, showToast]
  );

  // Sync historical recent rounds from server proxy or public mirrors
  const syncHistoricalRounds = useCallback(
    async (showFeedback = false) => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;
      setIsSyncingHistory(true);
      const startT = performance.now();
      let fetchedList: any[] = [];
      let sourceUsed = 'Proxy Servidor';

      try {
        // 1. Try local server proxy endpoint
        const res = await fetch('/api/blaze/recent', { cache: 'no-cache' });
        if (res.ok) {
          const data = await res.json();
          if (data.rounds && Array.isArray(data.rounds) && data.rounds.length > 0) {
            fetchedList = data.rounds;
            sourceUsed = `Proxy Servidor (${data.mirror || 'blaze.bet.br'})`;
          }
        }
      } catch {}

      // 2. Direct fallback to mirrors if proxy returned empty
      if (fetchedList.length === 0) {
        for (const mirror of MIRROR_URLS) {
          try {
            const res = await fetch(mirror.rest, {
              cache: 'no-cache',
              headers: { Accept: 'application/json' },
            });
            if (res.ok) {
              const data = await res.json();
              const items = Array.isArray(data) ? data : data?.records || data?.data || [];
              if (items.length > 0) {
                fetchedList = items;
                sourceUsed = mirror.name;
                break;
              }
            }
          } catch {}
        }
      }

      const latency = Math.round(performance.now() - startT);

      if (fetchedList.length > 0) {
        const parsed: Round[] = [];
        for (const raw of fetchedList) {
          const p = parseBlazeItem(raw);
          if (p) {
            parsed.push({
              id: p.id,
              number: p.number,
              color: p.color,
              created_at: p.created_at,
              source: sourceUsed,
            });
          }
        }

        if (parsed.length > 0) {
          setRounds(prevRounds => {
            const combined = cleanAndDeduplicateRounds([...prevRounds, ...parsed]);
            // Populate seenRoundKeysRef with all historical IDs
            for (const r of combined) {
              if (r.id) seenRoundKeysRef.current.add(r.id);
              if (r.created_at) seenRoundKeysRef.current.add(`blaze_${r.created_at}_${r.number}`);
            }
            if (combined.length > 0) {
              const last = combined[combined.length - 1];
              lastProcessedRoundRef.current = {
                number: last.number,
                time: new Date(last.created_at).getTime() || Date.now(),
                id: last.id,
              };
            }
            return combined;
          });

          const latest = parsed[parsed.length - 1];
          setCollectorState(prev => ({
            ...prev,
            status: 'live',
            statusText: 'Ao vivo',
            activeSource: sourceUsed,
            latencyMs: latency,
            lastCheckTime: Date.now(),
            lastRound: latest
              ? {
                  number: latest.number,
                  color: latest.color,
                  time: new Date(latest.created_at).toLocaleTimeString('pt-BR', { hour12: false }),
                }
              : prev.lastRound,
          }));

          if (showFeedback) {
            showToast(`${parsed.length} giros sincronizados com a Blaze (${latency}ms)!`, 'success');
            addCollectorLog(`Sincronizados ${parsed.length} giros via ${sourceUsed}`, 'success');
          }
        }
      } else {
        setCollectorState(prev => ({
          ...prev,
          latencyMs: latency,
          lastCheckTime: Date.now(),
        }));
        if (showFeedback) {
          showToast('Não foi possível obter dados no momento', 'error');
        }
      }

      isSyncingRef.current = false;
      setIsSyncingHistory(false);
    },
    [addCollectorLog, showToast]
  );

  // WebSocket Collector Connection (Exact Blaze Double Replication Protocol)
  const connectWebSocket = useCallback(() => {
    if (wsRef.current) {
      try {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.onmessage = null;
        wsRef.current.close();
      } catch {}
      wsRef.current = null;
    }

    setCollectorState(prev => ({
      ...prev,
      status: 'connecting',
      statusText: 'Conectando WS…',
    }));

    try {
      const ws = new WebSocket('wss://api-gaming.blaze.bet.br/replication/?EIO=3&transport=websocket');
      wsRef.current = ws;

      ws.onopen = () => {
        lastActivityTimeRef.current = Date.now();
        setCollectorState(prev => ({
          ...prev,
          status: 'live',
          statusText: 'Ao vivo',
          activeSource: 'WebSocket Oficial (blaze.bet.br)',
        }));
        addCollectorLog('WebSocket conectado com sucesso na sala double_room_1', 'success');

        try {
          ws.send('420["cmd",{"id":"subscribe","payload":{"room":"double_room_1"}}]');
        } catch {}

        if (pingTimerRef.current) clearInterval(pingTimerRef.current);
        pingTimerRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            try {
              ws.send('2');
            } catch {}
          }
        }, 12000);
      };

      ws.onmessage = ev => {
        lastActivityTimeRef.current = Date.now();
        const raw = String(ev.data);

        // 1. Engine.IO initial handshake
        if (raw.startsWith('0')) {
          try {
            ws.send('2probe');
          } catch {}
          return;
        }

        // 2. Upgrade confirmation & Room Subscription
        if (raw === '3probe') {
          try {
            ws.send('5');
            ws.send('420["cmd",{"id":"subscribe","payload":{"room":"double_room_1"}}]');
          } catch {}
          return;
        }

        // 3. Heartbeat response / Connect ACK
        if (raw === '3' || raw === '40') {
          return;
        }

        // 4. Match regex pattern like in user's file: ^\d+\["data",(\{...\})\]
        const m = raw.match(/^\d+\["data",\s*(\{[\s\S]*\})\]$/);
        if (m) {
          try {
            const payload = JSON.parse(m[1]);
            const isTick = payload.id === 'double.tick' || (payload.payload && payload.payload.id === 'double.tick');
            const data = payload.payload || payload;
            const roll = data.roll ?? data.number ?? data.result;
            const status = data.status;
            const id = data.id || data.external_id || data.game_id;
            if ((status === 'complete' || status == null) && roll != null) {
              const num = parseInt(String(roll), 10);
              if (!isNaN(num) && num >= 0 && num <= 14) {
                const roundId = id ? String(id) : (data.created_at ? `blaze_${data.created_at}_${num}` : `ws_${Date.now()}_${num}`);
                handleAddRound(num, 'blaze', data.created_at, roundId);
                addCollectorLog(`Giro #${num} (${colorOf(num).toUpperCase()}) recebido via WebSocket`, 'info');
                return;
              }
            }
          } catch {}
        }

        // 5. Generic Socket.IO Double Data Events fallback
        if (raw.startsWith('42') || raw.startsWith('420') || raw.startsWith('421')) {
          try {
            const idx = raw.indexOf('[');
            if (idx !== -1) {
              const parsed = JSON.parse(raw.slice(idx));
              const eventPayload = parsed[1];
              const payload = eventPayload?.payload || eventPayload;

              if (payload) {
                const status = payload.status;
                const rollVal = payload.roll ?? payload.number ?? payload.result;

                // Process only when roll is determined and not still spinning ('rolling')
                if (status !== 'rolling' && rollVal != null) {
                  const num = parseInt(String(rollVal), 10);
                  if (!isNaN(num) && num >= 0 && num <= 14) {
                    const roundId = payload.id
                      ? String(payload.id)
                      : payload.created_at
                      ? `blaze_${payload.created_at}_${num}`
                      : `ws_${Date.now()}_${num}`;

                    handleAddRound(num, 'blaze', payload.created_at, roundId);
                    addCollectorLog(`Giro #${num} (${colorOf(num).toUpperCase()}) recebido via WebSocket`, 'info');
                  }
                }
              }
            }
          } catch {}
        }
      };

      ws.onclose = () => {
        if (pingTimerRef.current) clearInterval(pingTimerRef.current);
        if (prefs.collector_should_run) {
          setCollectorState(prev => ({
            ...prev,
            status: 'connecting',
            statusText: 'Reconectando…',
          }));
          addCollectorLog('WebSocket desconectado. Reconectando em 3s...', 'warning');
          setTimeout(() => {
            if (prefs.collector_should_run) connectWebSocket();
          }, 3000);
        } else {
          setCollectorState(prev => ({
            ...prev,
            status: 'offline',
            statusText: 'Offline',
          }));
        }
      };

      ws.onerror = () => {
        // Handled in onclose
      };
    } catch (err: any) {
      addCollectorLog(`Erro ao iniciar WebSocket: ${err?.message || 'Falha'}`, 'error');
    }
  }, [prefs.collector_should_run, handleAddRound, addCollectorLog]);

  // Main Collector Controller Loop
  useEffect(() => {
    if (!prefs.collector_should_run) {
      setCollectorState(prev => ({
        ...prev,
        status: 'offline',
        statusText: 'Offline',
      }));
      return;
    }

    const mode = prefs.collector_mode || 'auto';

    // 1. Always run initial historical batch sync
    syncHistoricalRounds(false);

    // 2. Clear old intervals
    if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);

    if (mode === 'simulation') {
      setCollectorState(prev => ({
        ...prev,
        status: 'live',
        statusText: 'Simulação Demo',
        activeSource: 'Gerador Simulador (Offline)',
      }));
      addCollectorLog('Modo Simulação Ativo: Gerando giros a cada ~25 segundos', 'info');

      simulationTimerRef.current = setInterval(() => {
        const rand = Math.random();
        let simulatedNumber = 0;
        if (rand < 0.071) {
          simulatedNumber = 0; // Branco (14x)
        } else if (rand < 0.535) {
          simulatedNumber = Math.floor(Math.random() * 7) + 1; // 1-7 Vermelho
        } else {
          simulatedNumber = Math.floor(Math.random() * 7) + 8; // 8-14 Preto
        }
        handleAddRound(simulatedNumber, 'simulation');
      }, 25000);

      return () => {
        if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
      };
    }

    if (mode === 'websocket') {
      connectWebSocket();
      return () => {
        if (wsRef.current) {
          try {
            wsRef.current.close();
          } catch {}
        }
      };
    }

    // Default 'auto' or 'backend_proxy' or 'direct_rest':
    // Polls the server proxy every 2.5s for real-time live double updates
    if (mode === 'auto') {
      // Try WebSocket concurrently for ultra-low latency, fallback gracefully
      connectWebSocket();
    }

    pollingTimerRef.current = setInterval(() => {
      syncHistoricalRounds(false);
    }, 2500);

    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {}
      }
    };
  }, [prefs.collector_should_run, prefs.collector_mode, syncHistoricalRounds, connectWebSocket, handleAddRound, addCollectorLog]);

  // Watchdog de Ciclo: monitora o Cérebro em 'in_gale' e, se o coletor falhar ou ficar ocioso por > 10s, dispara reconexão forçada dos WebSockets
  useEffect(() => {
    if (!prefs.brain_enabled || !prefs.collector_should_run) {
      if (watchdogTimerRef.current) {
        clearInterval(watchdogTimerRef.current);
        watchdogTimerRef.current = null;
      }
      return;
    }

    watchdogTimerRef.current = setInterval(() => {
      // Verifica se o Cérebro está ativado e em modo in_gale
      if (brain.state === 'in_gale' && brain.galeLevel > 0) {
        const now = Date.now();
        const idleMs = now - lastActivityTimeRef.current;
        const isWsDisconnected =
          !wsRef.current ||
          wsRef.current.readyState === WebSocket.CLOSED ||
          wsRef.current.readyState === WebSocket.CLOSING;
        const isCollectorFailing =
          collectorState.status === 'error' || collectorState.status === 'offline';

        // Dispara se o coletor falhar OU ficar ocioso por mais de 10 segundos (>10000ms)
        if (idleMs >= 10000 || isWsDisconnected || isCollectorFailing) {
          // Debounce de 6 segundos entre disparos consecutivos de reconexão forçada
          if (now - lastWatchdogTriggerTimeRef.current >= 6000) {
            lastWatchdogTriggerTimeRef.current = now;

            const idleSec = (idleMs / 1000).toFixed(1);
            addCollectorLog(
              `⚡ Watchdog de Ciclo: Gale ${brain.galeLevel} em andamento e coletor ocioso há ${idleSec}s (ou conexão instável). Disparando reconexão forçada dos WebSockets e sincronização emergencial!`,
              'warning'
            );

            // 1. Fechar socket travado e abrir nova conexão WebSocket
            if (wsRef.current) {
              try {
                wsRef.current.onclose = null;
                wsRef.current.onerror = null;
                wsRef.current.onmessage = null;
                wsRef.current.close();
              } catch {}
              wsRef.current = null;
            }
            connectWebSocket();

            // 2. Disparar sincronização REST emergencial imediata
            syncHistoricalRounds(false);
          }
        }
      }
    }, 1000);

    return () => {
      if (watchdogTimerRef.current) {
        clearInterval(watchdogTimerRef.current);
        watchdogTimerRef.current = null;
      }
    };
  }, [
    brain.state,
    brain.galeLevel,
    prefs.brain_enabled,
    prefs.collector_should_run,
    collectorState.status,
    connectWebSocket,
    syncHistoricalRounds,
    addCollectorLog,
  ]);

  // Toggle Collector
  const handleToggleCollector = useCallback(() => {
    setPrefs(prev => {
      const nextRun = !prev.collector_should_run;
      if (nextRun) {
        showToast('Coleta automática ligada', 'success');
        syncHistoricalRounds(false);
      } else {
        showToast('Coleta desligada', 'info');
        if (wsRef.current) {
          try {
            wsRef.current.close();
          } catch {}
          wsRef.current = null;
        }
        setCollectorState(c => ({ ...c, status: 'offline', statusText: 'Offline' }));
      }
      return { ...prev, collector_should_run: nextRun };
    });
  }, [syncHistoricalRounds, showToast]);

  // Request WakeLock
  const handleRequestWakeLock = useCallback(async () => {
    try {
      if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        showToast('Wake Lock ativo: tela mantida acesa', 'success');
      } else {
        showToast('Wake Lock não suportado pelo navegador', 'info');
      }
    } catch {
      showToast('Permissão de Wake Lock recusada', 'error');
    }
  }, [showToast]);

  // Request Notification Permission
  const handleRequestNotifications = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      showToast('Notificações não suportadas', 'info');
      return;
    }
    const res = await Notification.requestPermission();
    if (res === 'granted') {
      showToast('Notificações ativadas!', 'success');
    } else {
      showToast(`Status: ${res}`, 'info');
    }
  }, [showToast]);

  // Initial boot and background watchdog
  useEffect(() => {
    if (prefs.keep_background) {
      handleRequestWakeLock();
    }

    // Watchdog every 20 seconds to guarantee fresh data
    watchdogTimerRef.current = setInterval(() => {
      if (prefs.collector_should_run) {
        const timeSinceCheck = Date.now() - collectorState.lastCheckTime;
        if (timeSinceCheck > 15000) {
          syncHistoricalRounds(false);
        }
      }
    }, 20000);

    return () => {
      if (watchdogTimerRef.current) clearInterval(watchdogTimerRef.current);
      if (pingTimerRef.current) clearInterval(pingTimerRef.current);
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
      if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {}
      }
    };
  }, [prefs.keep_background, prefs.collector_should_run, collectorState.lastCheckTime, syncHistoricalRounds, handleRequestWakeLock]);

  // Keyboard shortcut listener for testing (Desktop 0-9)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      unlockAudio();
      if (e.key >= '0' && e.key <= '9') {
        const num = parseInt(e.key, 10);
        handleAddRound(num, 'manual');
        showToast(`Rodada #${num} adicionada`, 'success');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAddRound, showToast]);

  // Update Pref helper
  const handleUpdatePref = (key: keyof AppPreferences, val: any) => {
    setPrefs(prev => ({ ...prev, [key]: val }));
  };

  // Adjust Bankroll
  const handleAdjustBankroll = (delta: number) => {
    setBankroll(prev => {
      const next = Math.max(0, prev + delta);
      setMega(m => ({ ...m, bank: next }));
      return next;
    });
    showToast(`Banca atualizada: R$ ${(Math.max(0, bankroll + delta)).toFixed(2)}`, 'success');
  };

  const handleSetBankrollManual = (directVal?: number) => {
    if (typeof directVal === 'number' && !isNaN(directVal) && directVal >= 0) {
      setBankroll(directVal);
      setMega(prev => ({ ...prev, bank: directVal }));
      return;
    }

    const res = prompt('Digite o valor da banca (R$):', String(bankroll));
    if (res != null) {
      const parsed = parseFloat(res.replace(',', '.'));
      if (!isNaN(parsed) && parsed >= 0) {
        setBankroll(parsed);
        setMega(prev => ({ ...prev, bank: parsed }));
        showToast(`Banca definida: R$ ${parsed.toFixed(2)}`, 'success');
      }
    }
  };

  // Mega Troia changes
  const handleRecalcMega = (T: number, firstBlack: number, bank: number, maxE: number) => {
    const rows = calcMegaTroiaRows(T, firstBlack, maxE);
    setMega(prev => ({
      ...prev,
      T,
      firstBlack,
      bank,
      maxEntries: maxE,
      rows,
    }));
    // Sync bank and first bet directly with general bankroll and bet_amount
    setBankroll(bank);
    setPrefs(prev => ({
      ...prev,
      bet_amount: firstBlack,
      mega_troia_bankroll: bank,
      mega_troia_target_profit: T,
      mega_troia_max_entries: maxE,
    }));
  };

  // Import / Export / Clear History
  const handleImportHistory = () => {
    const raw = prompt(
      'Cole o histórico (array JSON de números 0-14 ou números separados por espaço):\nExemplo: [1, 7, 0, 14, 3] ou 1 7 0 14 3'
    );
    if (!raw) return;

    try {
      let nums: number[] = [];
      if (raw.trim().startsWith('[')) {
        nums = JSON.parse(raw);
      } else {
        nums = (raw.match(/\d+/g) || []).map(Number);
      }

      const validNums = nums.filter(n => !isNaN(n) && n >= 0 && n <= 14);
      if (validNums.length === 0) {
        showToast('Nenhum número válido encontrado', 'error');
        return;
      }

      validNums.forEach(n => {
        handleAddRound(n, 'import');
      });

      showToast(`${validNums.length} rodadas importadas com sucesso!`, 'success');
    } catch {
      showToast('Formato inválido para importação', 'error');
    }
  };

  const handleExportHistory = () => {
    const data = JSON.stringify(
      rounds.map(r => ({ number: r.number, color: r.color, created_at: r.created_at })),
      null,
      2
    );
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leandro_double_historico_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    showToast('Histórico exportado!', 'success');
  };

  const handleClearHistory = () => {
    if (!confirm('Deseja realmente limpar todo o histórico de rodadas e sinais?')) return;
    setRounds([]);
    setSignals([]);
    setDayWins(0);
    setDayLosses(0);
    setDayPL(0);
    setBrain(DEFAULT_BRAIN);
    showToast('Histórico e sinais reiniciados', 'info');
  };

  const handleOpenBlaze = () => {
    window.open('https://blaze.bet.br/pt/games/double', '_blank');
    showToast('Blaze aberta em nova janela', 'info');
  };

  return (
    <div className="flex justify-center w-full h-full min-h-0 bg-[#0A0A0C] overflow-hidden">
      <div className="w-full max-w-[480px] h-full min-h-0 bg-[#0A0A0C] flex flex-col relative border-x border-white/5 shadow-2xl overflow-hidden">
        {/* Top Header */}
        <Header
          status={collectorState.status}
          statusText={collectorState.statusText}
          isTargetHit={isDailyTargetHit}
          onOpenCollectorModal={() => setIsCollectorModalOpen(true)}
          onNavigateToBankroll={() => setCurrentTab('bankroll')}
        />

        {/* Daily Profit Target Reached Visual Alert Banner */}
        {isDailyTargetHit && !isTargetBannerDismissed && (
          <div className="bg-gradient-to-r from-[#00E676]/25 via-[#00E676]/15 to-[#00E676]/25 border-b border-[#00E676]/40 px-3.5 py-2.5 flex items-center justify-between gap-2 shadow-[0_4px_16px_rgba(0,230,118,0.2)] z-20 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#00E676] text-black flex items-center justify-center font-extrabold shrink-0 shadow-[0_0_12px_rgba(0,230,118,0.6)]">
                <Trophy className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[12px] font-display font-black text-white flex items-center gap-1.5 leading-tight">
                  <span>META BATIDA!</span>
                  <span className="text-[9px] bg-[#00E676] text-black px-1.5 py-0.2 rounded font-black tracking-wider uppercase">
                    +R$ {dayPL.toFixed(2)}
                  </span>
                </div>
                <div className="text-[10px] text-zinc-300 truncate">
                  Meta diária de R$ {dailyTargetProfit.toFixed(2)} alcançada! Proteja seu lucro.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setCurrentTab('bankroll')}
                className="px-2.5 py-1 text-[10px] font-bold bg-[#00E676] hover:bg-[#00C853] text-black rounded-lg transition-all cursor-pointer shadow-sm flex items-center gap-1 active:scale-95"
              >
                <span>Banca</span>
                <ArrowRight className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setIsTargetBannerDismissed(true)}
                title="Ocultar aviso do topo"
                className="p-1 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main ref={contentRef} id="content" className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3.5 pb-24 scroll-smooth">
          {currentTab === 'home' && (
            <HomeTab
              rounds={rounds}
              prediction={prediction}
              brain={brain}
              prefs={prefs}
              learn={learn}
              mega={mega}
              bankroll={bankroll}
              dayWins={dayWins}
              dayLosses={dayLosses}
              dayPL={dayPL}
              signals={signals}
              signalsCount={signals.length}
              collectorRunning={collectorState.status === 'live' || prefs.collector_should_run}
              collectorSource={collectorState.activeSource}
              isSyncing={isSyncingHistory}
              onUpdatePref={handleUpdatePref}
              onSyncHistory={() => syncHistoricalRounds(true)}
              onOpenCollectorModal={() => setIsCollectorModalOpen(true)}
              onToggleCollector={handleToggleCollector}
              onForcePredict={() => {
                unlockAudio();
                runPrediction(false);
                showToast('Análise de alta precisão recalculada', 'success');
              }}
              onImport={handleImportHistory}
              onExport={handleExportHistory}
              onClear={handleClearHistory}
              onAddManual={n => {
                unlockAudio();
                handleAddRound(n, 'manual');
              }}
            />
          )}

          {currentTab === 'history' && (
            <HistoryTab
              rounds={rounds}
              signals={signals}
              onRefresh={() => {
                syncHistoricalRounds(true);
              }}
            />
          )}

          {currentTab === 'blaze' && <BlazeTab onOpenExternal={handleOpenBlaze} />}

          {currentTab === 'brain' && (
            <BrainTab
              prefs={prefs}
              brain={brain}
              bankroll={bankroll}
              dayPL={dayPL}
              dayWins={dayWins}
              dayLosses={dayLosses}
              onUpdatePref={handleUpdatePref}
              onSave={() => showToast('Configurações salvas!', 'success')}
            />
          )}

          {currentTab === 'bankroll' && (
            <BankrollTab
              bankroll={bankroll}
              dayWins={dayWins}
              dayLosses={dayLosses}
              dayPL={dayPL}
              signals={signals}
              prefs={prefs}
              onAdjustBankroll={handleAdjustBankroll}
              onSetBankrollManual={handleSetBankrollManual}
              onUpdatePref={handleUpdatePref}
              onSave={() => showToast('Configurações de banca salvas!', 'success')}
            />
          )}

          {currentTab === 'mega' && (
            <MegaTab
              mega={mega}
              onChangeT={t => handleRecalcMega(t, mega.firstBlack, mega.bank, mega.maxEntries)}
              onChangeFirstBlack={b => handleRecalcMega(mega.T, b, mega.bank, mega.maxEntries)}
              onChangeBank={b => handleRecalcMega(mega.T, mega.firstBlack, b, mega.maxEntries)}
              onChangeMaxEntries={m => handleRecalcMega(mega.T, mega.firstBlack, mega.bank, m)}
              onToggleEnabled={() => {
                const nextEnabled = !mega.enabled;
                setMega(prev => ({ ...prev, enabled: nextEnabled }));
                setPrefs(prev => ({ ...prev, mega_troia_enabled: nextEnabled }));
                showToast(nextEnabled ? 'Mega Troia ATIVA nas entradas' : 'Mega Troia desativada', 'success');
              }}
              onSetEntry={n => {
                setMega(prev => ({ ...prev, currentEntry: n }));
                showToast(`Entrada definida para ${n}ª`, 'info');
              }}
              onNextEntry={() => {
                if (mega.currentEntry < mega.maxEntries) {
                  setMega(prev => ({ ...prev, currentEntry: prev.currentEntry + 1 }));
                  showToast(`Avançado para ${mega.currentEntry + 1}ª entrada`, 'info');
                } else {
                  showToast('Limite máximo de entradas alcançado', 'error');
                }
              }}
              onApplyToBets={() => {
                const curRow = mega.rows[mega.currentEntry - 1];
                if (curRow) {
                  setPrefs(prev => ({ ...prev, bet_amount: curRow.black }));
                  showToast(`Aplicado Cor R$${curRow.black.toFixed(2)} + Branco R$${curRow.white.toFixed(2)}`, 'success');
                }
              }}
              onSave={() => showToast('Configurações Mega Troia salvas!', 'success')}
            />
          )}

          {currentTab === 'config' && (
            <ConfigTab
              prefs={prefs}
              collectorRunning={collectorState.status === 'live' || prefs.collector_should_run}
              onToggleCollector={handleToggleCollector}
              onUpdatePref={handleUpdatePref}
              onTestSound={() => {
                unlockAudio();
                playSignalSound(prefs.sound_volume, true, true);
                speakAnnouncement(
                  `Teste de voz: Atenção! Entrar no Gale 1 na cor Vermelho. Valor da aposta: ${prefs.bet_amount * 2} reais.`,
                  true,
                  prefs.sound_volume
                );
                showToast('Som e voz de alerta testados', 'success');
              }}
              onRequestNotifications={handleRequestNotifications}
              onRequestWakeLock={handleRequestWakeLock}
              onSaveAll={() => showToast('Todas as configurações salvas!', 'success')}
              onOpenCollectorModal={() => setIsCollectorModalOpen(true)}
            />
          )}
        </main>

        {/* Bottom Navigation */}
        <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />

        {/* Floating Bubble Widget */}
        <FloatingBubble
          prediction={prediction}
          collectorStatus={collectorState.status}
          roundsCount={rounds.length}
          brain={brain}
          brainEnabled={prefs.brain_enabled}
          mega={mega}
          baseBet={prefs.bet_amount}
          onOpenBlaze={handleOpenBlaze}
          onForceCollector={() => syncHistoricalRounds(true)}
          visible={prefs.show_bubble}
        />

        {/* Collector Modal for Live Diagnostics & Mirrors */}
        <CollectorModal
          isOpen={isCollectorModalOpen}
          onClose={() => setIsCollectorModalOpen(false)}
          collectorState={collectorState}
          collectorRunning={collectorState.status === 'live' || prefs.collector_should_run}
          roundsCount={rounds.length}
          onToggleCollector={handleToggleCollector}
          onSelectMode={mode => {
            handleUpdatePref('collector_mode', mode);
            showToast(`Modo alterado para ${mode}`, 'info');
          }}
          onForceSync={() => syncHistoricalRounds(true)}
          onClearLogs={() => {
            setCollectorState(c => ({ ...c, logs: [] }));
            showToast('Logs limpos', 'info');
          }}
        />

        {/* Toast Feedback */}
        <Toast message={toastInfo?.message || null} type={toastInfo?.type} />
      </div>
    </div>
  );
}
