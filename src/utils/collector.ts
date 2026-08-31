import { Round, DoubleColor } from '../types';
import { colorOf } from './prediction';

export type CollectorMode = 'auto' | 'backend_proxy' | 'websocket' | 'direct_rest' | 'simulation';

export interface CollectorLogItem {
  id: string;
  time: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export interface CollectorState {
  status: 'offline' | 'connecting' | 'live' | 'error';
  statusText: string;
  mode: CollectorMode;
  activeSource: string;
  lastRound: { number: number; color: DoubleColor; time: string } | null;
  lastCheckTime: number;
  latencyMs: number;
  totalCollectedSession: number;
  logs: CollectorLogItem[];
}

export const MIRROR_URLS = [
  { name: 'Blaze Brasil (bet.br)', rest: 'https://blaze.bet.br/api/roulette_games/recent', ws: 'wss://api-gaming.blaze.bet.br/replication/?EIO=3&transport=websocket' },
  { name: 'Blaze Global (.com)', rest: 'https://blaze.com/api/roulette_games/recent', ws: 'wss://api-gaming.blaze.com/replication/?EIO=3&transport=websocket' },
  { name: 'Blaze Espelho 1 (space)', rest: 'https://blaze1.space/api/roulette_games/recent', ws: 'wss://api-v2.blaze.com/replication/?EIO=3&transport=websocket' },
];

export function parseBlazeItem(item: any): { number: number; color: DoubleColor; id: string; created_at: string } | null {
  if (!item) return null;
  const rollVal = item.roll ?? item.number ?? item.result;
  if (rollVal == null) return null;
  const num = parseInt(String(rollVal), 10);
  if (isNaN(num) || num < 0 || num > 14) return null;

  const color = colorOf(num);
  const created_at = item.created_at || new Date().toISOString();
  // Deterministic ID to avoid duplicates across fetches
  const id = item.id ? String(item.id) : `blaze_${created_at}_${num}`;

  return { number: num, color, id, created_at };
}

export function cleanAndDeduplicateRounds(list: Round[]): Round[] {
  if (!list || !Array.isArray(list) || list.length === 0) return [];

  // Sort chronologically ascending (oldest first)
  const sorted = [...list].sort((a, b) => {
    const tA = new Date(a.created_at || 0).getTime() || 0;
    const tB = new Date(b.created_at || 0).getTime() || 0;
    return tA - tB;
  });

  const result: Round[] = [];
  const seenIds = new Set<string>();

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    if (!current || typeof current.number !== 'number' || isNaN(current.number)) continue;

    // Check duplicate ID
    if (current.id && seenIds.has(current.id)) {
      continue;
    }

    // Check time proximity with last accepted round
    if (result.length > 0) {
      const last = result[result.length - 1];
      const tCurrent = new Date(current.created_at).getTime() || 0;
      const tLast = new Date(last.created_at).getTime() || 0;
      const timeDiff = Math.abs(tCurrent - tLast);

      // In Blaze Double, distinct rounds are spaced ~22s to 35s apart.
      // If the same number is received within 14 seconds, it's a duplicate stream/update packet.
      if (last.number === current.number && timeDiff < 14000) {
        continue;
      }
    }

    if (current.id) seenIds.add(current.id);
    result.push(current);
  }

  return result.slice(-5000);
}
