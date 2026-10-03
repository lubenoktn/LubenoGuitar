// Quiz: find a note on the fretboard, name an interval.
import { A } from '../audio.js';
import { INT } from '../data.js';
import { $ } from '../dom.js';
import { L } from '../i18n.js';
import { SQ } from '../sequencer.js';
import { nm } from '../theory.js';
import { FB, tuning } from './fretboard.js';

export const QZ = {
  on: false,
  asked: false,
  mode: 'find',
  ok: 0,
  bad: 0,
  pc: 0,
  found: new Set(),
  total: 0,
  a: null,
  b: null,
  iv: 0,
  done: false,
  maxF() {
    return Math.min(12, FB.nf());
  },
  pcName(pc) {
    const a = nm(pc, false),
      b = nm(pc, true);
    return a === b ? a : a + ' / ' + b;
  },
  text() {
    $('qtext').textContent =
      this.mode === 'find'
        ? this.done
          ? L('Výborne, všetky nájdené!')
          : `${L('Nájdi všetky tóny')} ${this.pcName(this.pc)} (${this.found.size}/${this.total})`
        : this.done
          ? `${L('Správne')}: ${L(INT[this.iv - 1])}`
          : L('Aký interval je medzi oranžovým a bielym tónom?');
    $('qok').textContent = this.ok;
    $('qbad').textContent = this.bad;
  },
  next() {
    this.asked = true;
    this.mode = $('qmode').value;
    this.done = false;
    clearTimeout(this.tm);
    const T = tuning(),
      mx = this.maxF();
    if (this.mode === 'find') {
      this.pc = (Math.random() * 12) | 0;
      this.found = new Set();
      this.total = 0;
      T.forEach((o) => {
        for (let f = 0; f <= mx; f++) if ((o + f) % 12 === this.pc) this.total++;
      });
      $('qans').innerHTML = '';
    } else {
      for (;;) {
        const s = (Math.random() * 6) | 0,
          f = (Math.random() * Math.min(9, mx + 1)) | 0,
          iv = 1 + ((Math.random() * 12) | 0),
          m = T[s] + f + iv;
        let best = null;
        T.forEach((o, s2) => {
          const f2 = m - o;
          if (f2 >= 0 && f2 <= mx && Math.abs(s2 - s) <= 2 && (!best || Math.abs(f2 - f) < Math.abs(best.f - f)))
            best = { s: s2, f: f2, m };
        });
        if (best && Math.abs(best.f - f) <= 5) {
          this.a = { s, f, m: T[s] + f };
          this.b = best;
          this.iv = iv;
          break;
        }
      }
      const o = new Set([this.iv]);
      while (o.size < 4) o.add(1 + ((Math.random() * 12) | 0));
      $('qans').innerHTML = [...o]
        .sort(() => Math.random() - 0.5)
        .map(
          (i) =>
            `<button data-iv="${i}" class="px-3 py-1.5 rounded-lg bg-s7 border border-s6 text-sm font-semibold">${L(INT[i - 1])}</button>`,
        )
        .join('');
      A.resume();
      const t = A.ctx.currentTime;
      A.gtr(this.a.m, t, 1.2, 0.6);
      A.gtr(this.b.m, t + 0.5, 1.4, 0.6);
    }
    this.text();
    FB.render();
  },
  // class and label of one fretboard position while the quiz is on
  look(s, f, m) {
    const dim = ['bg-s9/60 border-stone-800 opacity-30', ''],
      hid = ['bg-s7 border-stone-500 hover:border-white', ''];
    if (this.mode === 'find')
      return f > this.maxF()
        ? dim
        : this.found.has(s + ':' + f)
          ? ['bg-emerald-500 text-slate-950 border-emerald-300 font-bold', nm(m, SQ.flat())]
          : hid;
    return this.a && s === this.a.s && f === this.a.f
      ? ['bg-amber-500 text-slate-950 border-amber-300 font-black', '1']
      : this.b && s === this.b.s && f === this.b.f
        ? ['bg-white text-slate-950 border-white font-black', '?']
        : dim;
  },
  click(s, f, m) {
    if (this.mode !== 'find' || this.done || f > this.maxF() || this.found.has(s + ':' + f)) return;
    if (m % 12 === this.pc) {
      this.found.add(s + ':' + f);
      if (this.found.size === this.total) {
        this.ok++;
        this.done = true;
        this.tm = setTimeout(() => this.on && this.next(), 1200);
      }
    } else this.bad++;
    this.text();
    FB.render();
  },
  answer(b) {
    if (this.mode !== 'int' || this.done) return;
    if (+b.dataset.iv === this.iv) {
      this.ok++;
      this.done = true;
      b.className += ' !bg-emerald-500 !text-slate-950';
      this.tm = setTimeout(() => this.on && this.next(), 1200);
    } else {
      this.bad++;
      b.disabled = true;
      b.className += ' opacity-40 line-through';
    }
    this.text();
  },
};
$('qnext').onclick = () => QZ.next();
$('qmode').onchange = () => QZ.next();
$('qans').onclick = (e) => {
  const b = e.target.closest('button');
  if (b) QZ.answer(b);
};
