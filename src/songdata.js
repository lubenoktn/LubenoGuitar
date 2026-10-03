// Validation and packing of song data for saving and share links. No page or sound access.
import { ARTS } from './data.js';

export const clampBpm = (v) => Math.max(40, Math.min(240, parseInt(v) || 100));
export const guessKey = (p) => ({ r: p[0][0].r, m: ['m', 'm7', 'm9'].includes(p[0][0].t) ? 'min' : 'maj' });
// melody events are rebuilt from string and fret, so loaded or shared data cannot carry anything but valid notes
export const normNote = (e, T, mx) =>
  e && Number.isInteger(e.s) && Number.isInteger(e.f) && e.s >= 0 && e.s < 6 && e.f >= 0 && e.f <= mx
    ? { m: T[e.s] + e.f, s: e.s, f: e.f }
    : null;
export const normEv = (e, T, mx) => {
  if (!e) return null;
  if (e.tri) {
    const n3 = Array.isArray(e.tri) && e.tri.length === 3 ? e.tri.map((n) => normNote(n, T, mx)) : [];
    return n3.length === 3 && n3.every(Boolean) ? { tri: n3 } : null;
  }
  const n = normNote(e, T, mx);
  if (n) {
    if (e.len === 2) n.len = 2;
    if (ARTS.includes(e.a)) n.a = e.a;
  }
  return n;
};
export const normBar = (b, T, mx) => {
  const o = b.map((e) => normEv(e, T, mx));
  o.forEach((e, k) => {
    if (e && e.tri && k + 1 < o.length) o[k + 1] = null;
  });
  return o;
};
export const secName = (n) =>
  String(n == null ? '' : n)
    .replace(/[^\p{L}\p{N}_-]/gu, '')
    .slice(0, 12);
export const b64e = (s) => {
  let b = '';
  new TextEncoder().encode(s).forEach((c) => (b += String.fromCharCode(c)));
  return btoa(b).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
export const b64d = (c) =>
  new TextDecoder().decode(Uint8Array.from(atob(c.replace(/-/g, '+').replace(/_/g, '/')), (x) => x.charCodeAt(0)));
export const packEv = (e) =>
  !e ? 0 : e.tri ? [e.tri.map((n) => [n.s, n.f])] : [e.s, e.f, e.len === 2 ? 1 : 0, e.a || ''];
export const unpackEv = (x) =>
  !Array.isArray(x)
    ? null
    : Array.isArray(x[0])
      ? { tri: x[0].map((n) => ({ s: n[0], f: n[1] })) }
      : { s: x[0], f: x[1], len: x[2] ? 2 : 1, a: x[3] };
