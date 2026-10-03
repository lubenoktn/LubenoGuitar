// Tablature rendering and the melody editor.
import { A } from '../audio.js';
import { $ } from '../dom.js';
import { L } from '../i18n.js';
import { SQ, dl } from '../sequencer.js';
import { touch } from '../state.js';
import { nm } from '../theory.js';
import { FB, tuning } from './fretboard.js';

export const tl = (s) => {
  const ns = tuning().map((m) => nm(m, SQ.flat())),
    w = Math.max(...ns.map((n) => n.length));
  return (s ? ns[s] : ns[s].toLowerCase()).padEnd(w);
};
// one string of one bar as cells: k = first eighth slot, w = slots covered (a triplet covers two), x = its text
export function rowCells(b, s) {
  const m = SQ.mel[b],
    o = [];
  for (let k = 0; k < m.length; k++) {
    const e = m[k];
    if (e && e.tri) {
      o.push({ k, w: 2, x: e.tri.map((n) => (n.s === s ? String(n.f).padStart(2, '-') : '--')).join('') });
      k++;
      continue;
    }
    let x = '---';
    if (e && e.s === s) {
      const n = m[k + 1];
      x =
        String(e.f).padStart(2, '-') + (n && !n.tri && n.s === s && n.a && n.a !== 'b' ? n.a : e.a === 'b' ? 'b' : '-');
    }
    o.push({ k, w: 1, x });
  }
  return o;
}
export const rowStr = (b, s) =>
  rowCells(b, s)
    .map((c) => c.x)
    .join('');
export function drawTab() {
  $('tab').innerHTML = SQ.prog
    .map((bar, b) => {
      let o = bar.map(dl).join('  ') + '\n';
      for (let s = 0; s < 6; s++)
        o +=
          tl(s) +
          '|' +
          rowCells(b, s)
            .map(
              (c) =>
                `<span data-k="${c.k}" data-s="${s}"${ED.on && ED.b === b && ED.s === s && (ED.k === c.k || (c.w === 2 && ED.k === c.k + 1)) ? ' class="sel"' : ''}>${c.x}</span>`,
            )
            .join('') +
          '|\n';
      return `<pre data-b="${b}" class="tb text-[11px] leading-4 font-mono text-slate-200 p-2 rounded-lg border border-s7">${o}</pre>`;
    })
    .join('');
  if (SQ.playing && !SQ.metOnly) hlTab(SQ.cur);
  if (ED.on) ED.ui();
}
export const ED = {
  on: false,
  b: 0,
  k: 0,
  s: 0,
  ld: null,
  lt: 0,
  lp: '',
  toggle() {
    this.on = !this.on;
    $('edbar').classList.toggle('hidden', !this.on);
    $('tab').classList.toggle('ed', this.on);
    $('edbtn').className =
      'px-3 py-1 rounded border ' +
      (this.on ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold' : 'bg-s7 border-s6');
    if (this.on) $('lock').checked = true;
    drawTab();
  },
  fix() {
    this.b = Math.min(this.b, SQ.mel.length - 1);
    this.k = Math.min(this.k, SQ.mel[this.b].length - 1);
  },
  // slot that owns the cursor: the first slot of a triplet when the cursor sits on its second half
  head() {
    const bar = SQ.mel[this.b];
    return this.k > 0 && bar[this.k - 1] && bar[this.k - 1].tri ? this.k - 1 : this.k;
  },
  ui() {
    this.fix();
    const e = SQ.mel[this.b][this.head()],
      one = e && !e.tri;
    $('edpos').textContent = `${L('Takt')} ${this.b + 1} · ${L('osmina')} ${this.k + 1} · ${L('struna')} ${this.s + 1}`;
    $('edart').value = (one && e.a) || '';
    $('edlen').checked = !!(one && e.len === 2);
    $('edart').disabled = $('edlen').disabled = !one;
  },
  put(s, f) {
    this.fix();
    if (f < 0 || f > FB.nf()) return;
    const bar = SQ.mel[this.b],
      h = this.head(),
      m = tuning()[s] + f;
    if (h !== this.k) bar[h] = null;
    const pv = bar[this.k - 1];
    if (pv && pv.len === 2) delete pv.len;
    bar[this.k] = { m, s, f };
    this.s = s;
    A.resume();
    A.mel(m, A.ctx.currentTime, 0.5, 0.55);
    drawTab();
    touch();
  },
  del() {
    this.fix();
    const bar = SQ.mel[this.b];
    bar[this.head()] = null;
    bar[this.k] = null;
    drawTab();
    touch();
  },
  move(dk, ds) {
    this.fix();
    this.s = Math.max(0, Math.min(5, this.s + ds));
    let k = this.k + dk,
      b = this.b;
    const n = SQ.mel.length;
    if (k < 0) {
      b = (b + n - 1) % n;
      k = SQ.mel[b].length - 1;
    } else if (k >= SQ.mel[b].length) {
      b = (b + 1) % n;
      k = 0;
    }
    this.b = b;
    this.k = k;
    drawTab();
  },
  // digits type a fret (two digits within a moment make 10 and up), arrows move, Delete clears; true when the key was used
  key(e) {
    const k = e.key;
    if (/^\d$/.test(k)) {
      const now = Date.now(),
        pos = this.b + ':' + this.k + ':' + this.s;
      let f = +k;
      if (this.ld !== null && now - this.lt < 900 && this.lp === pos && this.ld * 10 + f <= FB.nf()) {
        f += this.ld * 10;
        this.ld = null;
      } else this.ld = f;
      this.lt = now;
      this.lp = pos;
      this.put(this.s, f);
      return true;
    }
    const mv = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[k];
    if (mv) {
      this.move(...mv);
      return true;
    }
    if (k === 'Delete' || k === 'Backspace') {
      this.del();
      return true;
    }
    return false;
  },
};
$('edbtn').onclick = () => ED.toggle();
$('eddel').onclick = () => ED.del();
$('tab').onclick = (e) => {
  const sp = ED.on && e.target.closest('span[data-k]');
  if (!sp) return;
  ED.b = +sp.closest('pre').dataset.b;
  ED.k = +sp.dataset.k;
  ED.s = +sp.dataset.s;
  drawTab();
};
$('edart').onchange = (e) => {
  const n = SQ.mel[ED.b][ED.k];
  if (!n || n.tri) return;
  if (e.target.value) n.a = e.target.value;
  else delete n.a;
  drawTab();
};
$('edlen').onchange = (e) => {
  const bar = SQ.mel[ED.b],
    n = bar[ED.k];
  if (!n || n.tri) return;
  if (e.target.checked) {
    n.len = 2;
    if (ED.k + 1 < bar.length) bar[ED.k + 1] = null;
  } else delete n.len;
  drawTab();
};
export function hlTab(bar) {
  document.querySelectorAll('.tb').forEach((e) => e.classList.toggle('on', +e.dataset.b === bar));
}
