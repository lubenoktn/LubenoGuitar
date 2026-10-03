// Song sections: add, remove, rename, order.
import { $, toast } from '../dom.js';
import { L } from '../i18n.js';
import { SQ, edSync } from '../sequencer.js';
import { secName } from '../songdata.js';
import { drawTab } from './tab.js';

export function drawSecs() {
  $('secs').innerHTML = SQ.secs
    .map(
      (x, i) =>
        `<button data-i="${i}" class="px-3 py-1 rounded font-bold border ${i === SQ.cs ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-s7 border-s6 text-slate-200'}">${x.n}</button>`,
    )
    .join('');
  $('secname').value = SQ.secs[SQ.cs].n;
  $('songmode').checked = SQ.songMode;
  if (document.activeElement !== $('ord')) $('ord').value = SQ.order.map((i) => SQ.secs[i].n).join(' ');
}
// shows the current section (or section i) in the bar list, editor and tablature
export function showSec(i) {
  if (i != null) SQ.cs = i;
  SQ.shown = SQ.cs;
  SQ.sel = Math.min(SQ.sel, SQ.prog.length - 1);
  drawSecs();
  edSync();
  SQ.drawBars();
  drawTab();
  if (!SQ.playing) SQ.suggest(SQ.prog[SQ.sel][0]);
}
$('secs').onclick = (e) => {
  const b = e.target.closest('button');
  if (b) showSec(+b.dataset.i);
};
$('secadd').onclick = () => {
  if (SQ.secs.length >= 6) return toast(L('Maximum je 6 častí'));
  const c = SQ.secs[SQ.cs],
    n = 'ABCDEF'.split('').find((x) => !SQ.secs.some((y) => y.n.toLowerCase() === x.toLowerCase()));
  SQ.secs.push({ n, p: JSON.parse(JSON.stringify(c.p)), m: JSON.parse(JSON.stringify(c.m)), k: c.k.slice() });
  showSec(SQ.secs.length - 1);
};
$('secdel').onclick = () => {
  if (SQ.secs.length < 2) return toast(L('Musí ostať aspoň jedna časť'));
  const c = SQ.cs;
  SQ.secs.splice(c, 1);
  SQ.order = SQ.order.filter((i) => i !== c).map((i) => (i > c ? i - 1 : i));
  SQ.cs = Math.min(c, SQ.secs.length - 1);
  if (!SQ.order.length) SQ.order = [SQ.cs];
  SQ.oi = 0;
  SQ.bar = 0;
  showSec();
};
$('secname').onchange = (e) => {
  const n = secName(e.target.value);
  if (!n || SQ.secs.some((x, i) => i !== SQ.cs && x.n.toLowerCase() === n.toLowerCase()))
    toast(L('Názov je prázdny alebo už existuje'));
  else SQ.secs[SQ.cs].n = n;
  drawSecs();
};
$('ord').onchange = (e) => {
  const o = [];
  for (const w of e.target.value
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean)) {
    const i = SQ.secs.findIndex((x) => x.n.toLowerCase() === w.toLowerCase());
    if (i < 0) {
      toast(L('Neznáma časť: ') + w);
      e.target.blur();
      return drawSecs();
    }
    o.push(i);
  }
  SQ.order = o.length ? o.slice(0, 32) : [SQ.cs];
  SQ.oi = 0;
  e.target.blur();
  drawSecs();
};
$('songmode').onchange = (e) => {
  SQ.songMode = e.target.checked;
  SQ.drawBars();
};
