// The fretboard: tuning with capo, scale and chord-tone display, left-handed view, click to play.
import { A } from '../audio.js';
import { $ } from '../dom.js';
import { CH, IV, SC, TUN, ci, flatKey, nm, useFlat } from '../theory.js';
import { QZ } from './quiz.js';
import { ED } from './tab.js';

export const tuning = () => TUN[FB.tun].map((m) => m + FB.capo);
// open strings as they sound with the capo on
export const FB = {
  frets: 17,
  tun: 'standard',
  root: 'A',
  scale: 'minor_pentatonic',
  box: 0,
  mode: 'notes',
  capo: 0,
  left: false,
  arp: '',
  chord: null,
  nf() {
    return this.frets - this.capo;
  },
  flat() {
    return useFlat(flatKey(ci(this.root) - SC[this.scale][2]));
  },
  inBox(f, intervals) {
    if (!this.box) return true;
    const low = tuning()[5] % 12,
      d = intervals[(this.box - 1) % intervals.length],
      start = (((ci(this.root) + d - low) % 12) + 12) % 12;
    return (((f - start) % 12) + 12) % 12 <= 4;
  },
  // CAGED: fret window of the chosen shape around the chord root on the 6th (E, G), 5th (A, C) or 4th (D) string
  cwin() {
    const sh = this.arp;
    if (sh.length !== 1) return null;
    const up = 'EAD'.includes(sh),
      f = (((ci(this.chord.r) - tuning()[{ E: 5, G: 5, A: 4, C: 4, D: 3 }[sh]]) % 12) + 12) % 12;
    let lo = up ? f : f - 3;
    if (lo < 0) lo += 12;
    return (x) => [-12, 0, 12].some((o) => x >= lo + o && x <= lo + 3 + o);
  },
  render() {
    const iv = SC[this.scale][1],
      ri = ci(this.root),
      fl = this.flat(),
      pcs = iv.map((i) => (ri + i) % 12),
      nf = this.nf(),
      rev = this.left ? ' flex-row-reverse' : '';
    const cpc = this.chord && !QZ.on ? CH[this.chord.t][1].map((i) => (ci(this.chord.r) + i) % 12) : null,
      win = cpc ? this.cwin() : null;
    $('snotes').textContent = pcs.map((p) => nm(p, fl)).join(', ');
    $('sform').textContent = iv.map((i) => IV[i]).join(' ');
    const inl = [3, 5, 7, 9, 15, 17, 19, 21];
    let h = `<div class="py-3${this.left ? ' lh' : ''}"><div class="flex${rev} text-[11px] font-mono font-bold text-slate-400 pb-1 border-b border-stone-800"><div class="w-14 text-center">${this.capo ? 'K' + this.capo : 0}</div>`;
    for (let f = 1; f <= nf; f++) h += `<div class="flex-1 text-center">${f}</div>`;
    h += '</div>';
    tuning().forEach((open, s) => {
      h += `<div data-row="${s}" class="relative flex${rev} items-center h-11 border-b border-stone-800/80"><div class="absolute left-0 right-0 pointer-events-none bg-slate-300/80" style="height:${(1.5 + s * 0.6).toFixed(1)}px;top:50%"></div>`;
      for (let f = 0; f <= nf; f++) {
        const m = open + f,
          pc = m % 12,
          nt = nm(pc, fl),
          d = (((pc - ri) % 12) + 12) % 12,
          on = pcs.includes(pc),
          af = f + this.capo,
          isCh = cpc && cpc.includes(pc) && (!win || win(f));
        h += `<div class="${f === 0 ? 'w-14 nut' : 'flex-1 fw'} relative flex items-center justify-center h-full">`;
        if (f && ((s === 2 && inl.includes(af)) || (af === 12 && (s === 1 || s === 3))))
          h += '<span class="dot"></span>';
        let cls = on
          ? d === 0
            ? 'bg-amber-500 text-slate-950 border-amber-300 rg font-black'
            : d === 3 || d === 4
              ? 'bg-emerald-500 text-slate-950 border-emerald-300 font-bold'
              : d === 7
                ? 'bg-cyan-500 text-slate-950 border-cyan-300 font-bold'
                : 'bg-slate-600 text-white border-slate-400 font-bold'
          : 'bg-s9/60 text-slate-400 border-stone-700 opacity-25 hover:opacity-90';
        if (on && !this.inBox(f, iv) && !isCh) cls += ' opacity-15';
        if (isCh) cls = (on ? cls : 'bg-s7 text-white border-white font-bold') + ' ring-2 ring-white';
        let txt = this.mode === 'notes' ? nt : this.mode === 'int' ? IV[d] : '';
        let sz = this.mode === 'dots' ? (d === 0 ? 'w-4 h-4' : 'w-3 h-3') : d === 0 ? 'w-7 h-7' : 'w-6 h-6';
        if (QZ.on) {
          [cls, txt] = QZ.look(s, f, m);
          sz = 'w-6 h-6';
        }
        h += `<button class="nb z-10 rounded-full border text-[10px] flex items-center justify-center ${sz} ${cls}" data-m="${m}" data-s="${s}" data-f="${f}"${QZ.on ? '' : ` title="${nt}${Math.floor(m / 12) - 1} (${IV[d]})"`}>${txt}</button></div>`;
      }
      h += '</div>';
    });
    $('fb').innerHTML = h + '</div>';
  },
};
$('fb').addEventListener('click', (e) => {
  const b = e.target.closest('.nb');
  if (!b) return;
  A.pluck(+b.dataset.m);
  if (QZ.on) QZ.click(+b.dataset.s, +b.dataset.f, +b.dataset.m);
  else if (ED.on) {
    ED.put(+b.dataset.s, +b.dataset.f);
    ED.move(1, 0);
  }
});
export const setScale = (r, s) => {
  FB.root = r;
  FB.scale = s;
  $('root').value = r;
  $('scale').value = s;
  FB.render();
};
export const flash = (e) => {
  const b = document.querySelector(`.nb[data-m="${e.m}"][data-s="${e.s}"]`);
  if (b) {
    b.classList.add('mel');
    setTimeout(() => b.classList.remove('mel'), 220);
  }
};
