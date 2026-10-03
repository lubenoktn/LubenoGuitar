import { test } from 'node:test';
import assert from 'node:assert/strict';
import { voicingFor } from '../src/voicing.js';
import { N, CH, TUN, ci, mk, lab } from '../src/theory.js';

const tones = (c) => CH[c.t][1].map((i) => (ci(c.r) + i) % 12);

test('open C major in standard tuning is the familiar shape', () => {
  // strings high to low: e B G D A E
  assert.deepEqual(voicingFor(mk('C', 'maj'), TUN.standard), [0, 1, 0, 2, 3, -1]);
});

test('every chord in every tuning has a playable shape', () => {
  for (const [tun, T] of Object.entries(TUN))
    for (const r of N)
      for (const t of Object.keys(CH)) {
        const c = mk(r, t),
          v = voicingFor(c, T),
          name = `${lab(c)} / ${tun}`;
        assert.ok(v, `${name}: no shape`);
        const pcs = v.map((f, s) => (f < 0 ? -1 : (T[s] + f) % 12));
        const sounding = pcs.filter((p) => p >= 0);
        assert.ok(sounding.length >= 4, `${name}: fewer than four strings`);
        // only chord tones are played, the root is in the bass, and root and third (or fourth) are present
        const tn = tones(c);
        sounding.forEach((p) => assert.ok(tn.includes(p), `${name}: foreign note`));
        let low = 5;
        while (v[low] < 0) low--;
        assert.equal(pcs[low], tn[0], `${name}: root not in the bass`);
        assert.ok(pcs.includes(tn[1]), `${name}: third missing`);
        // a seventh, when the chord has one, is always in the shape
        CH[t][1]
          .filter((i) => i === 10 || i === 11)
          .forEach((i) => assert.ok(pcs.includes((ci(r) + i) % 12), `${name}: seventh missing`));
        // fretted notes fit in a four-fret window and need at most four fingers (one barre on the lowest fret)
        const fr = v.filter((f) => f > 0);
        if (fr.length) {
          const mn = Math.min(...fr);
          assert.ok(Math.max(...fr) - mn <= 3, `${name}: stretch`);
          const barre = fr.filter((f) => f === mn).length;
          assert.ok(fr.length - (barre > 1 ? barre - 1 : 0) <= 4, `${name}: too many fingers`);
        }
      }
});
