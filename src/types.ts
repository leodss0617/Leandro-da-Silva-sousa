export type DoubleColor = 'red' | 'black' | 'white';
export type PredictionAction = 'ENTER' | 'SKIP';

export interface Round {
  id: string;
  external_id?: string;
  number: number;
  color: DoubleColor;
  created_at: string;
  source: string;
}

export interface SignalRecord {
  color: DoubleColor;
  confidence: number;
  outcome: 'win' | 'loss';
  gale: number;
  pl: number;
  at: string;
}

export interface AppPreferences {
  brain_enabled: boolean;
  brain_max_gales: number;
  brain_gale_min_confidence: number;
  brain_gale_multiplier: number;
  brain_auto_multiplier: boolean;
  brain_auto_continue: boolean;
  brain_always_gale: boolean;
  mega_troia_enabled: boolean;
  mega_troia_target_profit: number;
  mega_troia_max_entries: number;
  mega_troia_bankroll: number;
  bet_amount: number;
  daily_profit_target: number;
  daily_profit_target_enabled: boolean;
  daily_profit_target_alert_80_enabled: boolean;
  daily_profit_target_alert_sound: 'off' | 'fanfare' | 'chime' | 'radar' | 'bell';
  bankroll_mode: 'conservative' | 'balanced' | 'aggressive';
  white_only: boolean;
  skip_low_conf: boolean;
  min_confidence: number;
  use_frequency: boolean;
  use_markov: boolean;
  use_streak: boolean;
  use_white_cycle: boolean;
  use_pattern: boolean;
  show_bubble: boolean;
  collector_should_run: boolean;
  collector_mode?: 'auto' | 'backend_proxy' | 'websocket' | 'direct_rest' | 'simulation';
  collector_mirror?: string;
  keep_background: boolean;
  sound_enabled: boolean;
  voice_enabled: boolean;
  sound_volume: number;
}

export interface CollectorDiagnostics {
  status: 'live' | 'connecting' | 'polling' | 'offline' | 'error';
  activeSource: string;
  roundsCount: number;
  lastRoundTime: string | null;
  lastCheckTime: string | null;
  latencyMs: number;
  errorMessage: string | null;
  historySynced: boolean;
  backendMirror?: string;
}

export interface BrainState {
  state: 'idle' | 'waiting' | 'in_gale' | 'done';
  galeLevel: number;
  lastOutcome: 'WIN' | 'LOSS' | null;
  cycles: number;
  currentPred: PredictionResult | null;
  entryAmount: number;
}

export interface DeepInsights {
  reasons: string[];
  boost: Partial<Record<DoubleColor, number>>;
  intervals?: {
    avg: number;
    current: number;
    max: number;
    list: number[];
    whites?: Array<{ i: number; number: number }>;
  };
  pullers?: Array<{ number: number; count: number }>;
  hc?: {
    hot: Array<{ number: number; count: number; color: DoubleColor }>;
    cold: Array<{ number: number; count: number; color: DoubleColor }>;
    window: number;
  };
  seqs?: Array<{ name: string; suggest: DoubleColor | 'skip'; strength: number }>;
  minu?: {
    whiteMinute: number;
    afterNumber: number;
    targetTerminal: number;
    mirrorTerminal: number;
    currentTerminal: number;
    nearTarget: boolean;
  } | null;
}

export interface PredictionResult {
  color: DoubleColor | 'skip';
  confidence: number;
  probs: Record<DoubleColor, number>;
  reasons: string[];
  action: PredictionAction;
  deep?: DeepInsights;
  _signalVotes?: Record<string, DoubleColor>;
}

export interface MegaTroiaRow {
  entry: number;
  S_prev: number;
  black: number;
  white: number;
  total: number;
  S_after: number;
}

export interface MegaTroiaState {
  T: number;
  firstBlack: number;
  bank: number;
  maxEntries: number;
  currentEntry: number;
  enabled: boolean;
  rows: MegaTroiaRow[];
  currentWhite?: number;
  currentBlack?: number;
  currentTotal?: number;
}

export interface LearnState {
  signalWeights: Record<string, number>;
  signalHits: Record<string, { hits: number; total: number }>;
  sequenceMemory: Record<string, Record<DoubleColor, number>>;
  numberAfter: Record<string, Record<DoubleColor, number>>;
  hourBias: Record<number, { red: number; black: number; white: number; n: number }>;
  confCalibration: Array<{ conf: number; hit: number; color: string; actual: string }>;
  totalLearned: number;
  lastEvolveAt: number;
}

export type ScreenTab = 'home' | 'history' | 'blaze' | 'brain' | 'bankroll' | 'mega' | 'config';
