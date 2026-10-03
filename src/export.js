// Exports: tablature as text and the song as a MIDI file.
import { A } from './audio.js';
import { GR } from './data.js';
import { $, toast } from './dom.js';
import { L } from './i18n.js';
import { forSecs } from './melody.js';
import { encodeMidi } from './midi.js';
import { S, SQ, dl, meter, sdur } from './sequencer.js';
import { rowStr, tl } from './ui/tab.js';

export function tabText() {
  const w = (S() / 2) * 3,
    many = SQ.secs.length > 1;
  let o =
    'LubenoGuitar - ' +
    L('tabulatúra') +
    ' (' +
    $('mstyle').selectedOptions[0].text +
    ', ' +
    L(GR[SQ.groove].n) +
    ', ' +
    SQ.bpm +
    ' BPM, ' +
    L('1 stĺpec = osmina') +
    ')\n';
  if (many) o += L('Poradie') + ': ' + SQ.order.map((i) => SQ.secs[i].n).join(' ') + '\n';
  o += '\n';
  forSecs(() => {
    if (many) o += '[' + SQ.secs[SQ.cs].n + ']\n';
    for (let r = 0; r < SQ.prog.length; r += 2) {
      const bs = [r, r + 1].filter((b) => b < SQ.prog.length);
      o += ' '.repeat(tl(0).length) + bs.map((b) => ' ' + SQ.prog[b].map(dl).join('  ').padEnd(w)).join('') + '\n';
      for (let s = 0; s < 6; s++) o += tl(s) + bs.map((b) => '|' + rowStr(b, s)).join('') + '|\n';
      o += '\n';
    }
  });
  return o;
}
export const saveBlob = (fn, blob) => {
  const u = URL.createObjectURL(blob),
    a = document.createElement('a');
  a.href = u;
  a.download = fn;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
};
$('savetab').onclick = async () => {
  const fn = 'lubenoguitar-tabulatura.txt';
  try {
    const d = window.claude && (await claude.use('downloads'));
    if (d) return await d.save({ filename: fn, data: tabText() });
    saveBlob(fn, new Blob([tabText()], { type: 'text/plain;charset=utf-8' }));
  } catch (e) {
    if (!e || e.code !== 'declined') toast(L('Uloženie zlyhalo'));
  }
};
// MIDI: one pass of the progression, rendered by running the sequencer with note recorders in place of the synth
export function midiBytes() {
  A.resume();
  const PPQ = 480,
    n = S(),
    sd = sdur(),
    q = sd * 4,
    tk = (t) => Math.max(0, Math.round((t / q) * PPQ)),
    f2m = (f) => Math.round(69 + 12 * Math.log2(f / 440)),
    vel = (v) => Math.max(1, Math.min(127, v | 0));
  const tr = { mel: [], chords: [], bass: [], drums: [] },
    add = (k, m, t, d, v) => tr[k].push([tk(t), 1, m, vel(v)], [Math.max(tk(t) + 1, tk(t + d)), 0, m, 0]);
  const rec = {
    kick: (t) => add('drums', 36, t, 0.1, 110),
    snare: (t, p = 0.8) => add('drums', 38, t, 0.1, 40 + p * 80),
    rim: (t) => add('drums', 37, t, 0.1, 90),
    hat: (t, o, p = 0.3) => add('drums', o ? 46 : 42, t, 0.1, 40 + p * 200),
    click() {},
    bass: (f, t, d) => add('bass', f2m(f), t, d, 100),
    chord: (ms, t, d) => ms.forEach((m) => add('chords', m, t, d, 70)),
    gtr: (m, t, d) => add('chords', m, t, d, 70),
    mel: (m, t, d) => add('mel', m, t, d, 105),
  };
  const keep = {},
    mo = SQ.metOnly;
  for (const k in rec) {
    keep[k] = A[k];
    A[k] = rec[k];
  }
  SQ.metOnly = false;
  const c0 = SQ.cs;
  let off = 0; // the whole song in song mode, otherwise the section shown
  try {
    (SQ.songMode ? SQ.order : [c0]).forEach((si) => {
      SQ.cs = si;
      SQ.prog.forEach((bar, bi) => {
        for (let st = 0; st < n; st++)
          SQ.play(st, ((off + bi) * n + st) * sd + (GR[SQ.groove].sw && st % 4 === 2 ? (sd * 2) / 3 : 0), bi);
      });
      off += SQ.prog.length;
    });
  } finally {
    SQ.cs = c0;
    Object.assign(A, keep);
    SQ.metOnly = mo;
  }
  return encodeMidi(
    tr,
    Math.round(q * 1e6),
    { '4/4': [4, 2], '3/4': [3, 2], '6/8': [6, 3] }[meter()],
    { ac: 25, mute: 28, clean: 27, dist: 29, flute: 73, epiano: 4 }[SQ.msound],
    PPQ,
  );
}
$('savemid').onclick = () => {
  try {
    saveBlob('lubenoguitar.mid', new Blob([midiBytes()], { type: 'audio/midi' }));
  } catch (e) {
    toast(L('Uloženie zlyhalo'));
  }
};
