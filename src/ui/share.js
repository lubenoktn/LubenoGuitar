// Share links: the song packed into the address after #s=.
import { $, toast } from '../dom.js';
import { L } from '../i18n.js';
import { SQ } from '../sequencer.js';
import { b64d, b64e, packEv, unpackEv } from '../songdata.js';
import { setState } from '../state.js';
import { ci, cn } from '../theory.js';
import { FB } from './fretboard.js';

export const shareCode = () =>
  b64e(
    JSON.stringify({
      v: 3,
      b: SQ.bpm,
      g: SQ.groove,
      ky: [SQ.key.r, SQ.key.m],
      s: $('mstyle').value,
      ms: SQ.msound,
      t: FB.tun,
      cp: FB.capo,
      sm: +SQ.songMode,
      ord: SQ.order,
      cs: SQ.cs,
      secs: SQ.secs.map((x) => ({
        n: x.n,
        p: x.p.map((b) => b.map((c) => [ci(c.r), c.t])),
        m: x.m.map((b) => b.map(packEv)),
      })),
    }),
  );
// takes a whole link or just the code; only song fields are read, everything is validated again by setState
export function openShare(v) {
  const d = JSON.parse(b64d(v.trim().replace(/^.*#s=/, '')));
  setState({
    b: d.b,
    g: d.g,
    ky: { r: d.ky[0], m: d.ky[1] },
    s: d.s,
    ms: d.ms,
    t: d.t,
    cp: d.cp,
    sm: d.sm,
    ord: d.ord,
    cs: d.cs,
    secs: d.secs.map((x) => ({
      n: x.n,
      p: x.p.map((b) => b.map((c) => ({ r: cn(c[0] | 0), t: c[1] }))),
      m: x.m.map((b) => b.map(unpackEv)),
    })),
  });
}
$('share').onclick = async () => {
  const url = location.href.split('#')[0] + '#s=' + shareCode();
  $('linkin').value = url;
  try {
    await navigator.clipboard.writeText(url);
    toast(L('Odkaz skopírovaný'));
  } catch (e) {
    $('linkin').select();
    toast(L('Odkaz je v poli, skopíruj ho'));
  }
};
$('linkgo').onclick = () => {
  const v = $('linkin').value.trim();
  if (!v) return toast(L('Vlož odkaz alebo kód'));
  try {
    openShare(v);
    $('linkin').value = '';
    toast(L('Odkaz načítaný'));
  } catch (e) {
    toast(L('Odkaz sa nepodarilo načítať'));
  }
};
export const fromHash = () => {
  const h = location.hash.match(/^#s=(.+)/);
  if (!h) return;
  try {
    openShare(h[1]);
    toast(L('Odkaz načítaný'));
  } catch (e) {
    toast(L('Odkaz sa nepodarilo načítať'));
  }
  try {
    history.replaceState(null, '', location.pathname + location.search);
  } catch (e) {}
};
addEventListener('hashchange', fromHash);
