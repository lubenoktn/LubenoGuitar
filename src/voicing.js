// Search for a playable chord shape on a given set of open strings. No page or sound access.
import { CH, ci } from './theory.js';

// best playable shape for chord c on the open strings T (high to low): fret per string, -1 = not played; null if none
export function voicingFor(c, T) {
  const iv = CH[c.t][1],
    pc = (i) => (ci(c.r) + i) % 12,
    tn = iv.map(pc),
    req = iv
      .filter((i) => !(iv.length > 3 && i === 7) && !(c.t === '13' && i === 14) && !(c.t === '7alt' && i === 8))
      .map(pc),
    loose = iv.filter((i) => [0, 3, 4, 5, 10, 11].includes(i)).map(pc);
  let best = null,
    bs = 1e9;
  for (const rq of [req, loose]) {
    if (best) break;
    for (let w = 0; w <= 9; w++) {
      const hi = w + (w ? 3 : 4),
        cur = [];
      const rec = (i, on) => {
        if (i < 0) {
          const sd = cur.filter((f) => f >= 0);
          if (sd.length < 4) return;
          let lo = 5;
          while (cur[lo] < 0) lo--;
          if ((T[lo] + cur[lo]) % 12 !== tn[0]) return;
          const pcs = cur.map((f, j) => (f < 0 ? -1 : (T[j] + f) % 12));
          if (!rq.every((r) => pcs.includes(r))) return;
          const fr = cur.filter((f) => f > 0),
            mn = Math.min(...fr),
            cnt = fr.filter((f) => f === mn).length,
            fg = fr.length - (cnt > 1 ? cnt - 1 : 0);
          if (fg > 4) return;
          const q =
            (fr.length ? Math.max(...fr) - mn : 0) * 2 +
            (6 - sd.length) * 1.5 +
            w * 0.4 -
            cur.filter((f) => f === 0).length * 0.6;
          if (q < bs) {
            bs = q;
            best = cur.slice();
          }
          return;
        }
        if (!on) {
          cur[i] = -1;
          rec(i - 1, false);
        }
        for (let f = 0; f <= hi; f++)
          if ((f === 0 || f >= w) && tn.includes((T[i] + f) % 12)) {
            cur[i] = f;
            rec(i - 1, true);
          }
      };
      rec(5, false);
    }
  }
  return best;
}
