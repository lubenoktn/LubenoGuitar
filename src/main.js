// Entry point: loads every module, wires the remaining controls and starts the app.
import * as m0 from './dom.js';
import * as m1 from './theory.js';
import * as m2 from './options.js';
import * as m3 from './lang/en.js';
import * as m4 from './i18n.js';
import * as m5 from './sequencer.js';
import * as m6 from './data.js';
import * as m7 from './audio.js';
import * as m8 from './ui/fretboard.js';
import * as m9 from './melody.js';
import * as m10 from './ui/tab.js';
import * as m11 from './ui/diagrams.js';
import * as m12 from './voicing.js';
import * as m13 from './export.js';
import * as m14 from './midi.js';
import * as m15 from './ui/quiz.js';
import * as m16 from './pitch.js';
import * as m17 from './ui/tuner.js';
import * as m18 from './songdata.js';
import * as m19 from './state.js';
import * as m20 from './ui/sections.js';
import * as m21 from './ui/share.js';
import { A, MIX } from './audio.js';
import { GR, INT, PRE, preBars } from './data.js';
import { $, LS, toast } from './dom.js';
import { L, i18n } from './i18n.js';
import { genAll, genMel } from './melody.js';
import { OPT } from './options.js';
import { SQ, drawBeats, edSync, meter } from './sequencer.js';
import { clampBpm } from './songdata.js';
import { SLOTS, drawMix, drawSlots, full, redraw, setState, song, syncUI, touch } from './state.js';
import { CH, SC, ci, cn, mk, parseDeg } from './theory.js';
import { drawDias } from './ui/diagrams.js';
import { FB, setScale } from './ui/fretboard.js';
import { QZ } from './ui/quiz.js';
import { fromHash } from './ui/share.js';
import { ED } from './ui/tab.js';
import { TN } from './ui/tuner.js';

// (re)builds every list whose entries are translated, keeping the current selection
export function fillLists() {
  const fill = (id, items) => {
    const s = $(id),
      v = s.value;
    s.innerHTML = '';
    items.forEach(([k, x]) => s.add(new Option(x, k)));
    if (v) s.value = v;
  };
  fill(
    'scale',
    Object.entries(SC).map(([k, v]) => [k, L(v[0])]),
  );
  ['etype', 'etype2'].forEach((id) =>
    fill(
      id,
      ['maj', 'm', '7', 'maj7', 'm7', 'm7b5', 'dim7', 'sus4', '9', 'm9', '13', '7alt'].map((k) => [
        k,
        CH[k][0] || L('dur'),
      ]),
    ),
  );
  fill(
    'groove',
    Object.entries(GR).map(([k, v]) => [k, L(v.n)]),
  );
  fill(
    'capo',
    Array.from({ length: 8 }, (_, i) => [
      i,
      i ? (OPT.lang === 'en' ? 'fret ' + i : i + '. pražec') : L('bez kapodastra'),
    ]),
  );
  $('presets').innerHTML = Object.entries(PRE)
    .map(
      ([k, p]) =>
        `<button data-p="${k}" class="w-full text-left p-3 rounded-xl bg-s9 border border-s7 hover:border-slate-500"><div class="font-bold text-sm text-amber-400">${L(p.n)}</div><div class="text-xs text-slate-400">${p.d} · ${L(GR[p.g].n)} · ${p.bpm} BPM</div></button>`,
    )
    .join('');
}
export function applyLang() {
  document.documentElement.lang = OPT.lang;
  $('lang').textContent = OPT.lang === 'en' ? 'SK' : 'EN';
  i18n();
  fillLists();
  SQ.btns();
  TN.ui();
  drawSlots($('slots').value);
  if (QZ.asked) {
    QZ.text();
    [...$('qans').children].forEach((b) => (b.textContent = L(INT[b.dataset.iv - 1])));
  }
}
$('lang').onclick = () => {
  OPT.lang = OPT.lang === 'en' ? 'sk' : 'en';
  syncUI();
};
$('presets').onclick = (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  const p = PRE[b.dataset.p],
    om = meter();
  SQ.prog = preBars(p);
  SQ.bpm = p.bpm;
  SQ.groove = p.g;
  SQ.key = { r: p.k[0], m: p.k[1] };
  SQ.sel = 0;
  SQ.bar = 0;
  SQ.step = 0;
  $('bpm').value = p.bpm;
  $('groove').value = p.g;
  $('kroot').value = p.k[0];
  $('kmode').value = p.k[1];
  drawBeats();
  edSync();
  meter() !== om ? genAll(true) : genMel(true);
  redraw();
  toast('Preset: ' + L(p.n));
};
$('bpm').onchange = (e) => {
  e.target.value = SQ.bpm = clampBpm(e.target.value);
};
$('vol').oninput = (e) => {
  if (A.out) A.out.gain.setTargetAtTime(+e.target.value, A.ctx.currentTime, 0.05);
};
$('play').onclick = () => SQ.toggle(false);
$('met').onclick = () => SQ.toggle(true);
$('groove').onchange = (e) => {
  const old = meter();
  SQ.groove = e.target.value;
  drawBeats();
  if (meter() !== old) {
    SQ.step = 0;
    genAll(true);
  }
};
$('mix').onclick = (e) => {
  const b = e.target.closest('[data-mute]');
  if (!b) return;
  MIX[b.dataset.mute].m = !MIX[b.dataset.mute].m;
  drawMix();
  A.mix();
};
$('mix').oninput = (e) => {
  const k = e.target.dataset.vol;
  if (k) {
    MIX[k].v = +e.target.value;
    A.mix();
  }
};
$('addbar').onclick = () => {
  if (SQ.prog.length >= 12) return toast(L('Maximum je 12 taktov'));
  SQ.prog.push(SQ.prog[SQ.prog.length - 1].map((c) => ({ ...c })));
  genMel();
  SQ.drawBars();
};
$('rembar').onclick = () => {
  if (SQ.prog.length <= 2) return toast(L('Minimum sú 2 takty'));
  SQ.prog.pop();
  SQ.bar %= SQ.prog.length;
  SQ.sel = Math.min(SQ.sel, SQ.prog.length - 1);
  edSync();
  genMel();
  SQ.drawBars();
};
$('e2on').onchange = (e) => {
  $('eroot2').disabled = $('etype2').disabled = !e.target.checked;
};
$('eapply').onclick = () => {
  const b = [mk($('eroot').value, $('etype').value)];
  if ($('e2on').checked) b.push(mk($('eroot2').value, $('etype2').value));
  SQ.prog[SQ.sel] = b;
  genMel();
  SQ.drawBars();
  SQ.suggest(b[0]);
};
$('root').onchange = $('scale').onchange = () => setScale($('root').value, $('scale').value);
$('box').onchange = (e) => {
  FB.box = +e.target.value;
  FB.render();
};
$('lab').onchange = (e) => {
  FB.mode = e.target.value;
  FB.render();
};
$('tun').onchange = (e) => {
  FB.tun = e.target.value;
  TN.strings();
  FB.render();
  genAll(true);
  SQ.drawBars();
};
$('capo').onchange = (e) => {
  FB.capo = +e.target.value;
  FB.render();
  genAll(true);
  SQ.drawBars();
  if (QZ.on) QZ.next();
};
$('left').onchange = (e) => {
  FB.left = e.target.checked;
  FB.render();
  drawDias();
};
$('arp').onchange = (e) => {
  FB.arp = e.target.value;
  FB.chord = null;
  SQ.suggest(SQ.prog[SQ.sel][0]);
  FB.render();
};
['lpon', 'lpa', 'lpb'].forEach((id) => ($(id).onchange = () => SQ.drawBars()));
$('names').onchange = (e) => {
  OPT.names = e.target.value;
  redraw();
};
$('hname').onchange = (e) => {
  OPT.h = e.target.checked;
  redraw();
};
export const tab = (k) => {
  ['scales', 'backing', 'quiz', 'tuner'].forEach((x) => {
    $('t-' + x).classList.toggle('hidden', x !== k);
  });
  if (k !== 'tuner') TN.stop();
  QZ.on = k === 'quiz';
  if (QZ.on && !QZ.asked) QZ.next();
  else FB.render();
  document
    .querySelectorAll('#tabs button')
    .forEach(
      (b) =>
        (b.className =
          'px-4 py-2 text-sm font-semibold rounded-lg ' +
          (b.dataset.tab === k ? 'bg-emerald-500 text-slate-950' : 'text-slate-300')),
    );
};
$('tabs').onclick = (e) => {
  const b = e.target.closest('button');
  if (b) tab(b.dataset.tab);
};
addEventListener('keydown', (e) => {
  if (
    ED.on &&
    !QZ.on &&
    !e.ctrlKey &&
    !e.metaKey &&
    !e.altKey &&
    !$('t-backing').classList.contains('hidden') &&
    !['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName) &&
    ED.key(e)
  ) {
    e.preventDefault();
    return;
  }
  if (e.code === 'Space' && !['INPUT', 'SELECT', 'BUTTON', 'TEXTAREA'].includes(e.target.tagName)) {
    e.preventDefault();
    SQ.toggle(SQ.playing && SQ.metOnly);
  }
});
export let taps = [];
$('tap').onclick = () => {
  const n = Date.now();
  if (taps.length && n - taps[taps.length - 1] > 2000) taps = [];
  taps.push(n);
  taps = taps.slice(-5);
  if (taps.length > 1) {
    const v = clampBpm(Math.round(60000 / ((taps[taps.length - 1] - taps[0]) / (taps.length - 1))));
    SQ.bpm = v;
    $('bpm').value = v;
  }
};
// transposing moves the key with the chords, so the degrees stay the same
export const tp = (d) => {
  SQ.secs.forEach((x) => (x.p = x.p.map((b) => b.map((c) => mk(cn(ci(c.r) + d), c.t)))));
  SQ.key.r = cn(ci(SQ.key.r) + d);
  $('kroot').value = SQ.key.r;
  edSync();
  genAll(true);
  redraw();
};
$('trm').onclick = () => {
  tp(-1);
  toast(L('Tónina −½ tónu'));
};
$('trp').onclick = () => {
  tp(1);
  toast(L('Tónina +½ tónu'));
};
$('kroot').onchange = (e) => tp(ci(e.target.value) - ci(SQ.key.r));
$('kmode').onchange = (e) => {
  SQ.key.m = e.target.value;
  redraw();
};
export const degApply = () => {
  try {
    const p = parseDeg($('degs').value, SQ.key);
    if (p.length < 2 || p.length > 12) return toast(L('Postupnosť musí mať 2 až 12 taktov'));
    SQ.prog = p;
    SQ.sel = 0;
    SQ.bar %= p.length;
    edSync();
    genMel(true);
    $('degs').blur();
    redraw();
    toast(L('Postupnosť nastavená'));
  } catch (x) {
    toast(L('Nerozumiem stupňu: ') + x);
  }
};
$('degapply').onclick = degApply;
$('degs').onkeydown = (e) => {
  if (e.key === 'Enter') degApply();
};
$('svp').onclick = () => {
  const n = $('sname').value.trim() || $('slots').value;
  if (!n) return toast(L('Zadaj názov'));
  SLOTS[n] = song();
  if (!LS.set('lg_slots', SLOTS)) return toast(L('Ukladanie nie je dostupné'));
  $('sname').value = '';
  drawSlots(n);
  toast(L('Uložené: ') + n);
};
$('ldp').onclick = () => {
  const d = SLOTS[$('slots').value];
  if (!d) return toast(L('Nič nie je uložené'));
  try {
    setState(d);
    toast(L('Načítané: ') + $('slots').value);
  } catch (e) {
    toast(L('Načítanie zlyhalo'));
  }
};
$('dlp').onclick = () => {
  const n = $('slots').value;
  if (!SLOTS[n]) return toast(L('Nič nie je uložené'));
  delete SLOTS[n];
  LS.set('lg_slots', SLOTS);
  drawSlots();
  toast(L('Zmazané: ') + n);
};
$('msound').onchange = (e) => {
  SQ.msound = e.target.value;
  A.resume();
  A.mel(64, A.ctx.currentTime, 0.9, 0.55);
};
$('newmel').onclick = () => genMel(true);
$('mstyle').onchange = () => genAll(true);
// start: restore the autosaved state, otherwise the defaults; the old single save becomes a slot
export const old = LS.get('fm1');
if (old && !Object.keys(SLOTS).length) {
  SLOTS['Uložené'] = old;
  LS.set('lg_slots', SLOTS);
}
drawSlots();
try {
  setState(LS.get('lg_auto'));
} catch (e) {
  genMel(true);
  syncUI();
}
fromHash();
// a shared link wins over the autosaved state
tab('scales');
document.addEventListener('change', touch);
document.addEventListener('click', touch);
addEventListener('pagehide', () => LS.set('lg_auto', full()));
// debugging handle: everything the modules export, reachable from the browser console
window.__lg = Object.assign(
  {},
  m0,
  m1,
  m2,
  m3,
  m4,
  m5,
  m6,
  m7,
  m8,
  m9,
  m10,
  m11,
  m12,
  m13,
  m14,
  m15,
  m16,
  m17,
  m18,
  m19,
  m20,
  m21,
  { fillLists, applyLang, tab, taps, tp, degApply, old },
);
