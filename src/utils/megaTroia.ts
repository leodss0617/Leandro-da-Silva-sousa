import { MegaTroiaRow } from '../types';

/**
 * Official Mega Troia Mathematical System:
 * - White payout: 14x (1:13 net profit)
 * - Color payout: 2x (1:1 net profit)
 * 1st Entry:
 *   black = firstBlack
 *   white = (T + black) / 13
 * Next entries (i > 1):
 *   black = (7/6) * (T + S_prev)
 *   white = (T + S_prev + black) / 13
 */
export function calcMegaTroiaRows(T: number, firstBlack: number, maxE: number): MegaTroiaRow[] {
  const target = Number(T) || 5;
  const initialBlack = Number(firstBlack) || 2.5;
  const entries = Math.min(6, Math.max(1, Number(maxE) || 6));
  const rows: MegaTroiaRow[] = [];
  let S = 0;

  for (let i = 1; i <= entries; i++) {
    let black: number;
    let white: number;

    if (i === 1) {
      black = initialBlack;
      white = (target + black) / 13;
    } else {
      black = (7 / 6) * (target + S);
      white = (target + S + black) / 13;
    }

    const total = black + white;
    const S_prev = S;
    S = S + total;

    rows.push({
      entry: i,
      S_prev,
      black,
      white,
      total,
      S_after: S,
    });
  }

  return rows;
}
