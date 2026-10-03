// Validation and packing of song data for saving and share links. No page or sound access.
import { ARTS } from './data.js';
import { CH, ci } from './theory.js';

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

/* ---------- BACKUP FILE of the saved songs ---------- */
// a song is usable when it has 1–6 sections (or the older single progression) of 2–12 bars of known chords
export function validSong(d) {
  try {
    const secs = Array.isArray(d.secs) && d.secs.length ? d.secs : [{ p: d.p }];
    const chord = (c) => !!c && ci(c.r) >= 0 && !!CH[c.t];
    const bar = (b) => {
      const cs = Array.isArray(b) ? b : [b];
      return cs.length >= 1 && cs.length <= 2 && cs.every(chord);
    };
    return (
      secs.length <= 6 && secs.every((x) => Array.isArray(x.p) && x.p.length >= 2 && x.p.length <= 12 && x.p.every(bar))
    );
  } catch (e) {
    return false;
  }
}
export const makeBackup = (slots, current, date) =>
  JSON.stringify({ app: 'LubenoGuitar', kind: 'backup', v: 1, date, slots, current });
// [name, song] pairs from a backup file; throws when the text is not a backup, skips songs that are not usable
export function readBackup(text) {
  const d = JSON.parse(text);
  if (!d || d.app !== 'LubenoGuitar' || d.kind !== 'backup' || !d.slots || typeof d.slots !== 'object')
    throw new Error('not a backup');
  const songs = Object.entries(d.slots)
    .filter(([, s]) => validSong(s))
    .map(([n, s]) => [String(n).trim().slice(0, 30) || 'Import', s]);
  if (!songs.length && validSong(d.current)) songs.push(['Import', d.current]);
  return songs;
}
// adds songs to the saved ones without overwriting: a taken name gets " (2)", an identical song is skipped
export function mergeSlots(existing, songs) {
  const slots = { ...existing };
  let added = 0;
  for (const [name, song] of songs) {
    if (name in slots && JSON.stringify(slots[name]) === JSON.stringify(song)) continue;
    let n = name;
    for (let i = 2; n in slots; i++) n = `${name} (${i})`;
    slots[n] = song;
    added++;
  }
  return { slots, added };
}
