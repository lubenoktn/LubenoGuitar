// App state: what is saved, how it is loaded and validated, autosave, named slots, and the redraw helpers.
import { A, MIX } from './audio.js';
import { GR, TR } from './data.js';
import { $, LS } from './dom.js';
import { L } from './i18n.js';
import { applyLang } from './main.js';
import { forSecs, genMel, mkey } from './melody.js';
import { OPT } from './options.js';
import { S, SQ, drawBeats, edSync } from './sequencer.js';
import { clampBpm, guessKey, normBar, secName } from './songdata.js';
import { BLACK, CH, N, SC, TUN, ci, mk, nm } from './theory.js';
import { FB, tuning } from './ui/fretboard.js';
import { drawSecs } from './ui/sections.js';
import { drawTab } from './ui/tab.js';
import { TN } from './ui/tuner.js';

export const song = () => ({
  v: 3,
  secs: SQ.secs.map((x) => ({ n: x.n, p: x.p, m: x.m })),
  cs: SQ.cs,
  ord: SQ.order,
  sm: SQ.songMode,
  b: SQ.bpm,
  g: SQ.groove,
  ky: SQ.key,
  s: $('mstyle').value,
  ms: SQ.msound,
  t: FB.tun,
  cp: FB.capo,
});
export const full = () => ({
  ...song(),
  mix: MIX,
  o: OPT,
  fr: FB.root,
  fs: FB.scale,
  fx: FB.box,
  fm: FB.mode,
  cnt: $('cnt').checked,
  lock: $('lock').checked,
  as: $('autosync').checked,
  vol: $('vol').value,
  lh: FB.left,
  arp: FB.arp,
  pr: ['lpa', 'lpb', 'spinc', 'spev', 'spmax'].map((id) => $(id).value).concat($('lpon').checked, $('spon').checked),
});
// accepts the current format (sections) and the older ones (one progression; bars as plain chords, no key)
export function setState(d) {
  const bars = (p) => {
    const o = p.map((b) =>
      (Array.isArray(b) ? b : [b]).slice(0, 2).map((c) => {
        if (ci(c.r) < 0 || !CH[c.t]) throw 0;
        return mk(c.r, c.t);
      }),
    );
    if (o.length < 2 || o.length > 12) throw 0;
    return o;
  };
  const raw = Array.isArray(d.secs) && d.secs.length ? d.secs.slice(0, 6) : [{ n: 'A', p: d.p, m: d.m }],
    used = new Set();
  const secs = raw.map((x) => {
      let n = secName(x.n);
      if (!n || used.has(n.toLowerCase())) n = 'ABCDEFGHIJKL'.split('').find((c) => !used.has(c.toLowerCase()));
      used.add(n.toLowerCase());
      return { n, p: bars(x.p), m: x.m, k: null };
    }),
    p = secs[0].p;
  if (SQ.playing) SQ.stop();
  SQ.secs = secs;
  SQ.cs = Math.max(0, Math.min(secs.length - 1, d.cs | 0));
  SQ.order = (Array.isArray(d.ord) ? d.ord : [])
    .filter((i) => Number.isInteger(i) && i >= 0 && i < secs.length)
    .slice(0, 32);
  if (!SQ.order.length) SQ.order = [SQ.cs];
  SQ.oi = 0;
  SQ.songMode = !!d.sm;
  SQ.bpm = clampBpm(d.b);
  SQ.groove = GR[d.g] ? d.g : 'rock';
  SQ.key = d.ky && ci(d.ky.r) >= 0 ? { r: d.ky.r, m: d.ky.m === 'min' ? 'min' : 'maj' } : guessKey(p);
  SQ.sel = 0;
  if (d.mix)
    for (const k in MIX)
      if (d.mix[k]) {
        MIX[k].v = Math.max(0, Math.min(1, +d.mix[k].v || 0));
        MIX[k].m = !!d.mix[k].m;
      }
  if (d.o) {
    OPT.names = ['auto', 'sharp', 'flat'].includes(d.o.names) ? d.o.names : 'auto';
    OPT.h = !!d.o.h;
    OPT.lang = d.o.lang === 'en' ? 'en' : 'sk';
  }
  if (TUN[d.t]) FB.tun = d.t;
  if ('cp' in d) FB.capo = Math.max(0, Math.min(7, +d.cp || 0));
  if ('lh' in d) FB.left = !!d.lh;
  if ('arp' in d) FB.arp = ['all', 'C', 'A', 'G', 'E', 'D'].includes(d.arp) ? d.arp : '';
  if (Array.isArray(d.pr) && d.pr.length === 7) {
    ['lpa', 'lpb', 'spinc', 'spev', 'spmax'].forEach((id, i) => ($(id).value = parseInt(d.pr[i]) || $(id).value));
    $('lpon').checked = !!d.pr[5];
    $('spon').checked = !!d.pr[6];
  }
  if (ci(d.fr) >= 0) FB.root = d.fr;
  if (SC[d.fs]) FB.scale = d.fs;
  if ('fx' in d) FB.box = Math.max(0, Math.min(5, +d.fx || 0));
  if (['notes', 'int', 'dots'].includes(d.fm)) FB.mode = d.fm;
  if (['pent', 'lyric', 'blues'].includes(d.s)) $('mstyle').value = d.s;
  if (['ac', 'mute', 'clean', 'dist', 'flute', 'epiano'].includes(d.ms)) SQ.msound = d.ms;
  if ('cnt' in d) $('cnt').checked = !!d.cnt;
  if ('lock' in d) $('lock').checked = !!d.lock;
  if ('as' in d) $('autosync').checked = !!d.as;
  if ('vol' in d) $('vol').value = d.vol;
  const E = S() / 2,
    T = tuning();
  forSecs(() => {
    const m = SQ.mel;
    if (Array.isArray(m) && m.length === SQ.prog.length && m.every((b) => Array.isArray(b) && b.length === E)) {
      SQ.mel = m.map((b) => normBar(b, T, FB.nf()));
      SQ.melKey = SQ.prog.map(mkey);
    } else {
      SQ.mel = null;
      genMel(true);
    }
  });
  syncUI();
}
export function fillRoots() {
  ['root', 'eroot', 'eroot2', 'kroot'].forEach((id) => {
    const s = $(id);
    N.forEach((n, i) => {
      if (!s.options[i]) s.add(new Option(n, n));
      s.options[i].text = BLACK.includes(i) ? nm(i, false) + ' / ' + nm(i, true) : nm(i, false);
    });
  });
}
export function drawMix() {
  $('mix').innerHTML = Object.keys(TR)
    .map(
      (k) =>
        `<div class="flex items-center gap-2"><button data-mute="${k}" aria-pressed="${!MIX[k].m}" class="w-20 px-2 py-1 rounded border font-semibold ${MIX[k].m ? 'bg-s7 border-s6 text-slate-500 line-through' : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200'}">${L(TR[k])}</button><input type="range" data-vol="${k}" aria-label="${L('Hlasitosť')}: ${L(TR[k])}" min="0" max="1" step=".05" value="${MIX[k].v}" class="w-20 accent-emerald-400"></div>`,
    )
    .join('');
}
// redraws everything that shows note or chord names
export function redraw() {
  fillRoots();
  TN.strings();
  FB.render();
  SQ.drawBars();
  drawTab();
  SQ.suggest(SQ.prog[SQ.sel][0]);
}
export function syncUI() {
  applyLang();
  $('bpm').value = SQ.bpm;
  $('groove').value = SQ.groove;
  $('tun').value = FB.tun;
  $('box').value = FB.box;
  $('lab').value = FB.mode;
  $('names').value = OPT.names;
  $('hname').checked = OPT.h;
  $('msound').value = SQ.msound;
  $('capo').value = FB.capo;
  $('left').checked = FB.left;
  $('arp').value = FB.arp;
  fillRoots();
  $('root').value = FB.root;
  $('scale').value = FB.scale;
  $('kroot').value = SQ.key.r;
  $('kmode').value = SQ.key.m;
  SQ.shown = SQ.cs;
  drawSecs();
  drawMix();
  A.mix();
  drawBeats();
  edSync();
  redraw();
}
export let SLOTS = LS.get('lg_slots') || {};
export function drawSlots(sel) {
  const s = $('slots');
  s.innerHTML = '';
  const ks = Object.keys(SLOTS);
  if (!ks.length) s.add(new Option(L('— nič uložené —'), ''));
  ks.forEach((k) => s.add(new Option(k, k)));
  if (sel) s.value = sel;
}
export let saveT;
export const touch = () => {
  clearTimeout(saveT);
  saveT = setTimeout(() => LS.set('lg_auto', full()), 400);
};
