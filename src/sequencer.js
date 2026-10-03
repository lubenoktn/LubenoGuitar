// The sequencer: look-ahead scheduler, grooves, song sections, practice loop, and the bar list it drives.
import { A, MIX } from './audio.js';
import { GR, PRE, preBars } from './data.js';
import { $, toast } from './dom.js';
import { L } from './i18n.js';
import { CH, SC, ci, degOf, flatKey, lab, mainScale, mf, nm, useFlat } from './theory.js';
import { drawDias } from './ui/diagrams.js';
import { FB, flash, setScale } from './ui/fretboard.js';
import { showSec } from './ui/sections.js';
import { hlTab } from './ui/tab.js';

export const dl = (c) => nm(ci(c.r), SQ.flat()) + CH[c.t][0];
export const meter = () => GR[SQ.groove].m,
  S = () => (meter() === '4/4' ? 16 : 12),
  splitS = () => (meter() === '6/8' ? 6 : 8),
  bstep = () => (meter() === '6/8' ? 2 : 4);
export const sdur = () => 60 / SQ.bpm / (meter() === '6/8' ? 6 : 4);
// prog is a list of bars; a bar holds one chord, or two with the second starting at splitS()
export const SQ = {
  playing: false,
  metOnly: false,
  msound: 'ac',
  bpm: 100,
  groove: 'rock',
  key: { r: 'C', m: 'maj' },
  secs: [{ n: 'A', p: preBars(PRE.pop), m: null, k: null }],
  cs: 0,
  shown: 0,
  order: [0],
  oi: 0,
  songMode: false,
  step: 0,
  bar: 0,
  next: 0,
  timer: null,
  sel: 0,
  cur: -1,
  curCh: '',
  flat() {
    return useFlat(flatKey(ci(this.key.r) + (this.key.m === 'min' ? 3 : 0)));
  },
  toggle(met) {
    const same = this.playing && this.metOnly === met;
    if (this.playing) this.stop();
    if (!same) {
      this.metOnly = met;
      this.start();
    }
  },
  // the bars, melody and melody keys in use are those of the current section
  get prog() {
    return this.secs[this.cs].p;
  },
  set prog(v) {
    this.secs[this.cs].p = v;
  },
  get mel() {
    return this.secs[this.cs].m;
  },
  set mel(v) {
    this.secs[this.cs].m = v;
  },
  get melKey() {
    return this.secs[this.cs].k;
  },
  set melKey(v) {
    this.secs[this.cs].k = v;
  },
  start() {
    A.resume();
    this.playing = true;
    this.step = 0;
    if (this.songMode && !this.metOnly) {
      this.oi = 0;
      this.cs = this.order[0];
      if (this.shown !== this.cs) showSec();
    }
    this.bar = loopRange()[0];
    this.laps = 0;
    this.cur = -1;
    this.curCh = '';
    this.next = A.ctx.currentTime + 0.08;
    if ($('cnt').checked && !this.metOnly) {
      const bs = bstep(),
        nb = S() / bs,
        d = bs * sdur();
      for (let i = 0; i < nb; i++) A.click(this.next + i * d, i ? 0 : 2);
      this.next += nb * d;
    }
    this.timer = setInterval(() => this.pump(), 25);
    this.btns();
    $('nowplaying').classList.remove('hidden');
    this.drawBars();
  },
  stop() {
    this.playing = false;
    clearInterval(this.timer);
    this.btns();
    $('nowplaying').classList.add('hidden');
    hlTab(-1);
    beatOn(-1);
    if (this.shown !== this.cs) showSec();
    this.drawBars();
  },
  btns() {
    const p = this.playing && !this.metOnly,
      m = this.playing && this.metOnly;
    const pl = L(p ? 'Zastaviť' : 'Spustiť sprievod');
    $('play').innerHTML = `${p ? '■' : '▶'}<span class="hidden sm:inline"> ${pl}</span>`;
    $('play').setAttribute('aria-label', pl);
    $('play').className = 'px-4 py-2 rounded-xl font-semibold text-slate-950 ' + (p ? 'bg-rose-500' : 'bg-emerald-500');
    $('met').innerHTML = `${m ? '■' : '♩'}<span class="hidden sm:inline"> ${L('Metronóm')}</span>`;
    $('met').setAttribute('aria-label', L('Metronóm'));
    $('met').className =
      'px-3 py-2 rounded-xl font-semibold text-sm border ' +
      (m ? 'bg-rose-500 border-rose-400 text-slate-950' : 'bg-s7 border-s6');
  },
  // one pass through the progression (or the loop) finished: speed up if the practice option asks for it
  lap() {
    this.laps++;
    if (!$('spon').checked) return;
    const n = (id, lo, hi, d) => Math.max(lo, Math.min(hi, parseInt($(id).value) || d)),
      mx = n('spmax', 40, 240, 160);
    if (this.laps % n('spev', 1, 16, 2) === 0 && this.bpm < mx) {
      this.bpm = Math.min(mx, this.bpm + n('spinc', 1, 20, 2));
      $('bpm').value = this.bpm;
      toast('Tempo: ' + this.bpm + ' BPM');
    }
  },
  pump() {
    while (this.next < A.ctx.currentTime + 0.12) {
      const bi = this.bar,
        st = this.step,
        sec = this.cs,
        sd = sdur(),
        bs = bstep(),
        sp = splitS(),
        t = this.next + (GR[this.groove].sw && st % 4 === 2 ? (sd * 2) / 3 : 0);
      this.play(st, t, bi);
      setTimeout(
        () => {
          if (!this.playing) return;
          if (st % bs === 0) beatOn(st / bs);
          if (this.metOnly) {
            if (st % bs === 0)
              $('nowplaying').textContent = `${L('Metronóm')} ${meter()} · ${L('doba')} ${st / bs + 1}`;
            return;
          }
          if (sec !== this.cs) return;
          if (this.shown !== sec) showSec(); // the section changed: stale callbacks stop, the first new one switches the view
          const bar = this.prog[bi];
          if (!bar) return;
          const two = bar.length > 1,
            c = bar[two && st >= sp ? 1 : 0];
          this.cur = bi;
          this.curCh = lab(c);
          $('nowplaying').textContent =
            `${this.secs.length > 1 ? this.secs[sec].n + ' · ' : ''}${dl(c)} · ${L('takt')} ${bi + 1}/${this.prog.length} · ${L('doba')} ${Math.floor(st / bs) + 1}`;
          if (st === 0 || (two && st === sp)) {
            this.drawBars();
            this.suggest(c);
            hlTab(bi);
          }
          if (st % 2 === 0) {
            const e = this.mel && this.mel[bi] && this.mel[bi][st / 2];
            if (e) e.tri ? e.tri.forEach((n, i) => setTimeout(() => flash(n), (i * sd * 4000) / 3)) : flash(e);
          }
        },
        Math.max(0, (t - A.ctx.currentTime) * 1000),
      );
      this.next += sd;
      this.step++;
      if (this.step >= S()) {
        this.step = 0;
        const [a, b] = loopRange();
        let nb = this.bar + 1;
        if (nb > b || nb >= this.prog.length) {
          if (this.songMode && !this.metOnly) {
            this.oi = (this.oi + 1) % this.order.length;
            if (!this.oi) this.lap();
            this.cs = this.order[this.oi];
            nb = 0;
          } else {
            nb = a;
            this.lap();
          }
        }
        this.bar = nb;
      }
    }
  },
  play(st, t, bi) {
    const G = GR[this.groove],
      g = this.groove,
      bs = bstep(),
      b = (st / bs) | 0,
      sub = st % bs,
      six = G.m === '6/8';
    if (sub === 0 && (this.metOnly || !MIX.click.m))
      A.click(t, b === 0 ? 2 : six && b === 3 ? 1 : 0, this.metOnly ? A.out : A.bus.click);
    if (this.metOnly) return;
    const bar = this.prog[bi];
    if (!bar) return;
    const n = S(),
      sp = splitS(),
      sd = sdur(),
      two = bar.length > 1,
      c = bar[two && st >= sp ? 1 : 0],
      r = ci(c.r),
      iv = CH[c.t][1],
      rf = mf(r + 36),
      f5 = mf(r + 43),
      ms = iv.map((i) => r + 48 + i).sort((x, y) => x - y);
    const strum = (d) => A.chord(ms, t, G.sh ? sd * 1.5 : d * sd * 0.95),
      hi = G.h.indexOf(st);
    if (hi >= 0) {
      let e = hi + 1 < G.h.length ? G.h[hi + 1] : n;
      if (two && st < sp) e = Math.min(e, sp);
      strum(e - st);
    } else if (two && st === sp && !G.h.some((x) => x >= sp) && !six) strum(n - sp); // make sure the second chord of the bar is heard
    if (this.mel && st % 2 === 0) {
      const e = this.mel[bi] && this.mel[bi][st / 2];
      if (e) this.pm(e, t, this.mel[bi][st / 2 - 1]);
    }
    if (g === 'rock') {
      if (sub === 0) {
        b % 2 ? A.snare(t) : A.kick(t);
        A.bass(rf, t, 0.28);
      } else if (sub === 2 && b === 3) A.bass(f5, t, 0.22);
      if (sub % 2 === 0) A.hat(t);
    } else if (g === 'funk') {
      if ([0, 6, 10].includes(st)) A.kick(t);
      if (st === 4 || st === 12) A.snare(t);
      A.hat(t, st === 14);
      if (st === 0 || st === 6) A.bass(rf, t, 0.22);
      if (st === 10 || st === 12) A.bass(f5, t, 0.18);
    } else if (g === 'jazz') {
      if (sub === 0) {
        A.hat(t);
        if (b === 0) A.kick(t);
        if (b % 2) A.snare(t, 0.4);
        const o = [0, iv[1], iv[2], iv[iv.length > 3 ? 3 : 2]];
        A.bass(mf(r + 36 + o[b]), t, 0.35);
      }
      if (sub === 2 && b % 2) A.hat(t, 0, 0.2);
    } else if (g === 'shuffle') {
      if (sub === 0) {
        b % 2 ? A.snare(t) : A.kick(t);
        A.hat(t);
        A.bass(rf, t, 0.3);
      }
      if (sub === 2) {
        A.hat(t, 0, 0.18);
        A.bass(b % 2 ? f5 : rf, t, 0.16);
      }
    } else if (g === 'bossa') {
      if (sub % 2 === 0) A.hat(t, 0, 0.16);
      if ([0, 6, 8, 14].includes(st)) A.kick(t);
      if ([0, 3, 6, 10, 13].includes(st)) A.rim(t);
      if (st === 0 || st === 14) A.bass(rf, t, st ? 0.2 : 0.5);
      if (st === 6 || st === 8) A.bass(f5, t, st === 6 ? 0.2 : 0.5);
    } else if (g === 'reggae') {
      if (sub % 2 === 0) A.hat(t, 0, 0.2);
      if (st === 8) {
        A.kick(t);
        A.rim(t);
      }
      if (st === 0 || st === 8) A.bass(rf, t, 0.4);
      if (st === 6) A.bass(mf(r + 36 + iv[1]), t, 0.2);
      if (st === 10) A.bass(f5, t, 0.3);
    } else if (g === 'waltz') {
      if (st === 0) {
        A.kick(t);
        A.bass(bi % 2 ? f5 : rf, t, 0.6);
      }
      if (st === 4 || st === 8) {
        A.hat(t);
        A.snare(t, 0.18);
      }
    } else if (g === 'b68') {
      if (sub === 0) {
        A.hat(t, 0, b % 3 ? 0.15 : 0.28);
        if (b === 0) {
          A.kick(t);
          A.bass(rf, t, 0.9);
        }
        if (b === 3) {
          A.snare(t, 0.5);
          A.bass(f5, t, 0.5);
        }
        A.gtr(ms[[0, 1, 2, 3, 2, 1][b] % ms.length], t, sd * 5, 0.34, A.bus.chords);
      }
    } else {
      if (sub === 0 && b === 0) A.kick(t);
      if (sub === 0 && b === 2) A.snare(t);
      if (sub % 2 === 0) A.hat(t);
      if (sub === 0 && b % 2 === 0) A.bass(rf, t, 0.5);
    }
  },
  pm(e, t, pv) {
    const e8 = sdur() * 2;
    if (e.tri) {
      const d = (e8 * 2) / 3;
      e.tri.forEach((n, i) => A.mel(n.m, t + i * d, d * 1.5, 0.5));
      return;
    }
    const soft = e.a === 'h' || e.a === 'p',
      sl = e.a === '/' || e.a === '\\';
    A.mel(e.m, t, Math.max(0.3, (e.len || 1) * e8 * 1.8), soft ? 0.36 : 0.55, {
      soft,
      bend: e.a === 'b',
      slide: sl ? (pv && pv.m ? mf(pv.m) / mf(e.m) : e.a === '/' ? 0.8 : 1.25) : 0,
    });
  },
  suggest(c) {
    const r = c.r,
      main = mainScale(c);
    let alts = [];
    if (main === 'dorian') alts = ['minor_pentatonic', 'aeolian'];
    else if (main === 'mixolydian') alts = ['blues', 'major_pentatonic'];
    else if (main === 'ionian') alts = ['major_pentatonic', 'lydian'];
    const l = (s) =>
      `<button class="underline text-emerald-300 mr-2" data-r="${r}" data-s="${s}">${nm(ci(r), useFlat(flatKey(ci(r) - SC[s][2])))} ${L(SC[s][0])}</button>`;
    $('sugg').innerHTML =
      `${L('K akordu')} <b class="text-amber-400">${dl(c)}</b> ${L('sedí:')} ${l(main)}${alts.map(l).join('')}`;
    FB.chord = FB.arp ? c : null;
    if (this.playing && $('autosync').checked) setScale(r, main);
    else if (FB.arp) FB.render();
  },
  drawBars() {
    $('bars').innerHTML = '';
    const lr = $('lpon').checked ? loopRange() : null;
    this.prog.forEach((bar, i) => {
      const d = document.createElement('button');
      const cur = this.playing && !this.metOnly && i === this.cur;
      d.className =
        'p-2 rounded-xl border text-center ' +
        (cur ? 'bg-amber-500/20 border-amber-400' : i === this.sel ? 'bg-s7 border-emerald-400' : 'bg-s9 border-s7') +
        (lr && i >= lr[0] && i <= lr[1] ? ' ring-1 ring-cyan-400/70' : '');
      d.innerHTML = `<div class="text-[10px] text-slate-400">${L('Takt')} ${i + 1}</div><div class="${bar.length > 1 ? 'text-sm' : 'text-lg'} font-extrabold text-amber-400">${bar.map(dl).join(' · ')}</div><div class="text-[10px] font-mono text-cyan-300/80">${bar.map((c) => degOf(c, this.key)).join(' · ')}</div>`;
      d.onclick = () => {
        this.sel = i;
        edSync();
        this.drawBars();
      };
      $('bars').appendChild(d);
    });
    if (document.activeElement !== $('degs'))
      $('degs').value = this.prog.map((b) => b.map((c) => degOf(c, this.key)).join(',')).join(' ');
    drawDias();
  },
};
export const loopRange = () => {
  const n = SQ.prog.length;
  if (!$('lpon').checked || SQ.songMode) return [0, n - 1];
  const a = Math.max(0, Math.min(n - 1, (parseInt($('lpa').value) || 1) - 1));
  return [a, Math.max(a, Math.min(n - 1, (parseInt($('lpb').value) || n) - 1))];
};
export const edSync = () => {
  const b = SQ.prog[SQ.sel],
    c2 = b[1] || b[0];
  $('ebar').textContent = SQ.sel + 1;
  $('eroot').value = b[0].r;
  $('etype').value = b[0].t;
  $('e2on').checked = b.length > 1;
  $('eroot2').value = c2.r;
  $('etype2').value = c2.t;
  $('eroot2').disabled = $('etype2').disabled = b.length < 2;
};
$('sugg').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (b) {
    setScale(b.dataset.r, b.dataset.s);
    toast(L('Hmatník: ') + b.textContent);
  }
});
export const drawBeats = () => {
  const six = meter() === '6/8',
    n = S() / bstep();
  $('beats').innerHTML = Array.from(
    { length: n },
    (_, i) => `<span class="bd${i === 0 || (six && i === 3) ? ' ac' : ''}"></span>`,
  ).join('');
};
export const beatOn = (i) => [...$('beats').children].forEach((d, j) => d.classList.toggle('on', j === i));
