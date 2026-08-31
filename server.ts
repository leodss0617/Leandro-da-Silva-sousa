import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

interface BlazeRoundRaw {
  id?: string;
  color?: number | string;
  roll?: number | string;
  number?: number | string;
  created_at?: string;
  status?: string;
  server_seed?: string;
}

interface NormalizedRound {
  id: string;
  number: number;
  color: 'red' | 'black' | 'white';
  roll: number;
  created_at: string;
  status: string;
}

// In-memory cache of recent rounds
let cachedRounds: NormalizedRound[] = [];
let lastFetchTimestamp = 0;
let activeMirror = 'blaze.bet.br';
let lastFetchStatus = 'initialized';
let consecutiveErrors = 0;

const MIRRORS = [
  'https://blaze.bet.br/api/roulette_games/recent',
  'https://blaze.com/api/roulette_games/recent',
  'https://blaze1.space/api/roulette_games/recent',
  'https://blaze-4.com/api/roulette_games/recent',
];

function normalizeColor(num: number, rawColor?: any): 'red' | 'black' | 'white' {
  if (num === 0) return 'white';
  if (num >= 1 && num <= 7) return 'red';
  if (num >= 8 && num <= 14) return 'black';
  if (rawColor === 0 || rawColor === 'white' || rawColor === '0') return 'white';
  if (rawColor === 1 || rawColor === 'red' || rawColor === '1') return 'red';
  if (rawColor === 2 || rawColor === 'black' || rawColor === '2') return 'black';
  return num === 0 ? 'white' : num <= 7 ? 'red' : 'black';
}

function normalizeRound(item: BlazeRoundRaw): NormalizedRound | null {
  const rollVal = item.roll ?? item.number;
  if (rollVal == null) return null;
  const num = typeof rollVal === 'number' ? rollVal : parseInt(String(rollVal), 10);
  if (isNaN(num) || num < 0 || num > 14) return null;

  const color = normalizeColor(num, item.color);
  const created_at = item.created_at || new Date().toISOString();
  const id = item.id ? String(item.id) : `blaze_${created_at}_${num}`;

  return {
    id,
    number: num,
    roll: num,
    color,
    created_at,
    status: item.status || 'complete',
  };
}

// Fetch from Blaze with fallback across mirrors
async function fetchBlazeRecent(): Promise<NormalizedRound[]> {
  for (const url of MIRRORS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cache-Control': 'no-cache',
        },
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const json = (await res.json()) as any;
        const list: BlazeRoundRaw[] = Array.isArray(json)
          ? json
          : Array.isArray(json?.records)
          ? json.records
          : Array.isArray(json?.data)
          ? json.data
          : [];

        if (list.length > 0) {
          const parsed: NormalizedRound[] = [];
          for (const item of list) {
            const nr = normalizeRound(item);
            if (nr) parsed.push(nr);
          }

          if (parsed.length > 0) {
            activeMirror = new URL(url).hostname;
            lastFetchStatus = 'online';
            consecutiveErrors = 0;
            lastFetchTimestamp = Date.now();

            // Merge into cached rounds without duplicates
            const existingIds = new Set(cachedRounds.map(r => r.id));
            const newItems = parsed.filter(r => !existingIds.has(r.id));

            if (newItems.length > 0 || cachedRounds.length === 0) {
              // Combine and sort by created_at ascending (or keep newest order)
              const combined = [...newItems, ...cachedRounds];
              // De-duplicate by created_at or id
              const map = new Map<string, NormalizedRound>();
              for (const r of combined) {
                map.set(r.id, r);
              }
              cachedRounds = Array.from(map.values()).slice(0, 1000);
            }

            return cachedRounds.length > 0 ? cachedRounds : parsed;
          }
        }
      }
    } catch {
      // try next mirror
    }
  }

  consecutiveErrors++;
  lastFetchStatus = consecutiveErrors > 5 ? 'failing' : 'retrying';
  return cachedRounds;
}

// Background polling loop every 3 seconds
setInterval(async () => {
  try {
    await fetchBlazeRecent();
  } catch {}
}, 3000);

// Initial immediate fetch
fetchBlazeRecent().catch(() => {});

// API ROUTES
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    cachedRounds: cachedRounds.length,
    activeMirror,
    lastFetchStatus,
    lastFetchTimestamp,
  });
});

app.get('/api/blaze/recent', async (_req, res) => {
  try {
    // If cache is empty or older than 5 seconds, attempt immediate fetch
    if (cachedRounds.length === 0 || Date.now() - lastFetchTimestamp > 5000) {
      await fetchBlazeRecent();
    }
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json({
      success: true,
      mirror: activeMirror,
      status: lastFetchStatus,
      count: cachedRounds.length,
      lastUpdated: new Date(lastFetchTimestamp).toISOString(),
      rounds: cachedRounds,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to fetch rounds',
      rounds: cachedRounds,
    });
  }
});

app.get('/api/blaze/status', (_req, res) => {
  res.json({
    status: lastFetchStatus,
    activeMirror,
    totalCached: cachedRounds.length,
    lastFetchTimestamp,
    consecutiveErrors,
    latestRound: cachedRounds[0] || null,
  });
});

// Start Server & Integrate Vite
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Leandro Double Server running on port ${PORT}`);
  });
}

startServer();
