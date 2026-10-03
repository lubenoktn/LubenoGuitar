// Pitch detection by autocorrelation, used by the tuner. No page or sound access.
// fundamental in Hz of the samples in b, or 0 when the signal is too quiet or unclear
export function detectPitch(b, sr) {
  const n = b.length;
  let e = 0;
  for (let i = 0; i < n; i++) e += b[i] * b[i];
  if (Math.sqrt(e / n) < 0.01) return 0;
  const mx = Math.min(n >> 1, (sr / 60) | 0),
    w = n - mx - 1,
    c = new Float32Array(mx + 2);
  for (let l = 0; l <= mx + 1; l++) {
    let s = 0;
    for (let i = 0; i < w; i++) s += b[i] * b[i + l];
    c[l] = s;
  }
  let d = 0;
  while (d < mx && c[d] > c[d + 1]) d++;
  let top = 0;
  for (let l = d; l <= mx; l++) if (c[l] > top) top = c[l];
  if (top < c[0] * 0.4) return 0;
  let p = 0;
  for (let l = Math.max(1, d); l <= mx; l++)
    if (c[l] >= top * 0.9 && c[l] >= c[l - 1] && c[l] >= c[l + 1]) {
      p = l;
      break;
    }
  if (!p) return 0;
  const a = (c[p - 1] + c[p + 1] - 2 * c[p]) / 2,
    bb = (c[p + 1] - c[p - 1]) / 2,
    f = sr / (a ? p - bb / (2 * a) : p);
  return f > 55 && f < 1400 ? f : 0;
}
