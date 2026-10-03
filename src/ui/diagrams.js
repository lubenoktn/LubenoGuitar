// Chord diagrams for the chords of the current section.
import { $ } from '../dom.js';
import { L } from '../i18n.js';
import { SQ, dl } from '../sequencer.js';
import { lab } from '../theory.js';
import { FB, tuning } from './fretboard.js';
import { voicingFor } from '../voicing.js';

export const VC = {};
export const voicing = (c) => {
  const key = lab(c) + FB.tun + FB.capo;
  return key in VC ? VC[key] : (VC[key] = voicingFor(c, tuning()));
};
export function dia(c) {
  const v = voicing(c);
  if (!v) return '<div class="text-xs text-slate-500 p-4">' + L('bez tvaru') + '</div>';
  const fr = v.filter((f) => f > 0),
    base = fr.length && Math.max(...fr) > 4 ? Math.min(...fr) : 1;
  let g = '';
  for (let i = 0; i < 6; i++) g += `<line x1="${12 + i * 10}" y1="18" x2="${12 + i * 10}" y2="78" stroke="#94a3b8"/>`;
  for (let r = 0; r <= 4; r++)
    g += `<line x1="12" y1="${18 + r * 15}" x2="62" y2="${18 + r * 15}" stroke="#94a3b8" stroke-width="${r === 0 && base === 1 ? 3 : 1}"/>`;
  v.forEach((f, i) => {
    const x = 12 + (FB.left ? i : 5 - i) * 10;
    if (f < 0) g += `<text x="${x}" y="13" font-size="10" text-anchor="middle" fill="#94a3b8">x</text>`;
    else if (f === 0) g += `<circle cx="${x}" cy="9" r="3" fill="none" stroke="#94a3b8"/>`;
    else g += `<circle cx="${x}" cy="${18 + (f - base + 0.5) * 15}" r="4.5" fill="#f59e0b"/>`;
  });
  if (base > 1) g += `<text x="66" y="29" font-size="9" fill="#94a3b8">${base}</text>`;
  return `<svg viewBox="0 0 76 84" width="76" height="84">${g}</svg>`;
}
export function drawDias() {
  const seen = new Set();
  $('dias').innerHTML = SQ.prog
    .flat()
    .map((c) => {
      const k = lab(c);
      if (seen.has(k)) return '';
      seen.add(k);
      const on = SQ.playing && !SQ.metOnly && SQ.curCh === k;
      return `<div class="text-center p-1 rounded-lg border ${on ? 'border-amber-400 bg-amber-500/10' : 'border-s7'}"><div class="text-xs font-bold text-amber-400">${dl(c)}</div>${dia(c)}</div>`;
    })
    .join('');
}
