// Melody generation: scale ladders per chord, motif reuse, fingering and articulations.
import { $ } from './dom.js';
import { old } from './main.js';
import { S, SQ, meter, splitS } from './sequencer.js';
import { CH, SC, barLab, ci, mainScale } from './theory.js';
import { FB, tuning } from './ui/fretboard.js';
import { drawTab } from './ui/tab.js';

export const mkey = (bar) => barLab(bar) + meter();
export function genMel(force) {
  const st = $('mstyle').value,
    old = SQ.mel,
    ok = SQ.melKey,
    keep = $('lock').checked && !force && old && ok,
    E = S() / 2,
    sE = splitS() / 2,
    six = meter() === '6/8';
  let hand = 7,
    prev = 69,
    motif = null;
  const lastOf = (ev) => {
    const l = ev.filter(Boolean).pop();
    if (l) prev = l.tri ? l.tri[2].m : l.m;
  };
  const fing = (m, bx) => {
    let b = null,
      bs = 99;
    tuning().forEach((o, s) => {
      const f = m - o;
      if (f < 0 || f > FB.nf()) return;
      const q = Math.abs(f - hand) + (f === 0 ? 1.5 : 0) + (bx && FB.box && !FB.inBox(f, SC[FB.scale][1]) ? 4 : 0);
      if (q < bs) {
        bs = q;
        b = { m, s, f };
      }
    });
    return b;
  };
  SQ.mel = SQ.prog.map((bar, bi) => {
    if (keep && ok[bi] === mkey(bar) && old[bi] && old[bi].length === E) {
      lastOf(old[bi]);
      return old[bi];
    }
    // per chord: the scale ladder across the playable range and a nearest-note lookup (optionally chord tones only)
    const cx = bar.map((c) => {
      const minor = ['m', 'm7', 'm9', '7', '9', '13', '7alt'].includes(c.t),
        r = ci(c.r);
      const sk =
        st === 'blues'
          ? 'blues'
          : st === 'pent' && !['m7b5', 'dim7'].includes(c.t)
            ? minor
              ? 'minor_pentatonic'
              : 'major_pentatonic'
            : mainScale(c);
      const pool = SC[sk][1].map((i) => (r + i) % 12),
        ct = CH[c.t][1].map((i) => (r + i) % 12),
        lad = [];
      for (let m = 55; m <= 81; m++) if (pool.includes(m % 12)) lad.push(m);
      return {
        lad,
        near: (v, only) => {
          let b = 0,
            bd = 99;
          lad.forEach((m, i) => {
            const d = Math.abs(m - v);
            if (d < bd && (!only || ct.includes(m % 12))) {
              bd = d;
              b = i;
            }
          });
          return b;
        },
      };
    });
    const at = (k) => cx[bar.length > 1 && k >= sE ? 1 : 0],
      strong = (k) => (six ? k % 3 === 0 : k % 2 === 0),
      pick = (x, i) => x.lad[Math.max(0, Math.min(x.lad.length - 1, i))];
    const m0 = pick(cx[0], cx[0].near(prev, 1));
    let ms;
    if (st === 'lyric' && bi % 2 && motif && motif.length === E)
      ms = motif.map((d, k) => {
        if (d === null) return null;
        const x = at(k);
        return pick(x, x.near(m0 + d, strong(k)));
      });
    else {
      ms = [m0];
      let cm = m0;
      for (let k = 1; k < E; k++) {
        const x = at(k),
          i = x.near(cm, 0);
        if (!strong(k)) {
          if (Math.random() < 0.15) {
            ms.push(null);
            continue;
          }
          cm = pick(x, i + [-2, -1, 1, 2][(Math.random() * 4) | 0]);
        } else cm = pick(x, x.near(pick(x, i + [-2, -1, 0, 1, 2][(Math.random() * 5) | 0]), 1));
        ms.push(cm);
      }
      if (bi % 2 === 0) motif = ms.map((m) => (m === null ? null : m - m0));
    }
    const ev = ms.map((m) => {
      if (m === null) return null;
      const best = fing(m, 1);
      if (best && best.f > 0) hand = best.f;
      return best;
    });
    if (!six)
      for (let k = 2; k < E; k += 2)
        if (ev[k] && Math.random() < 0.2) {
          const x = at(k),
            i = x.lad.indexOf(ev[k].m),
            dr = Math.random() < 0.5 ? 1 : -1,
            ns = [ev[k], fing(pick(x, i + dr)), fing(pick(x, i + 2 * dr))];
          if (ns.every(Boolean)) {
            ev[k] = { tri: ns };
            ev[k + 1] = null;
          }
        }
    for (let k = 0; k < E; k += 2)
      if (ev[k] && !ev[k].tri && (ev[k + 1] === null || (ev[k + 1] && Math.random() < 0.25))) {
        ev[k + 1] = null;
        ev[k].len = 2;
      }
    for (let k = 1; k < E; k++) {
      const e = ev[k],
        q = ev[k - 1];
      if (e && q && !e.tri && !q.tri && e.s === q.s && e.f > 0 && q.f > 0 && Math.random() < 0.6) {
        const d = e.f - q.f;
        if (d > 0 && d <= 2) e.a = 'h';
        else if (d < 0 && d >= -2) e.a = 'p';
        else if (Math.abs(d) >= 3) e.a = d > 0 ? '/' : '\\';
      }
    }
    if (st === 'blues')
      ev.forEach((e) => {
        if (e && !e.tri && e.len && e.f > 0 && !e.a && Math.random() < 0.4) e.a = 'b';
      });
    lastOf(ev);
    return ev;
  });
  SQ.melKey = SQ.prog.map(mkey);
  drawTab();
}
// runs fn with every section selected in turn (SQ.prog and SQ.mel then refer to that section)
export const forSecs = (fn) => {
  const c = SQ.cs;
  try {
    SQ.secs.forEach((_, i) => {
      SQ.cs = i;
      fn();
    });
  } finally {
    SQ.cs = c;
  }
};
export const genAll = (force) => {
  forSecs(() => genMel(force));
  drawTab();
};
