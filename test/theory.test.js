import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ci, cn, mf, mk, lab, barLab, nm, flatKey, degOf, parseDeg, mainScale, SC, CH, TUN } from '../src/theory.js';
import { OPT } from '../src/options.js';

test('note index and name wrap around the octave', () => {
  assert.equal(ci('A'), 9);
  assert.equal(cn(-1), 'B');
  assert.equal(cn(13), 'C#');
  assert.equal(Math.round(mf(69)), 440);
});

test('chord labels', () => {
  assert.equal(lab(mk('C', 'maj')), 'C');
  assert.equal(lab(mk('F#', 'm7b5')), 'F#m7b5');
  assert.equal(barLab([mk('D', 'maj'), mk('A', '7')]), 'D|A7');
});

test('note names follow sharps, flats and the H option', () => {
  OPT.h = false;
  assert.equal(nm(10, false), 'A#');
  assert.equal(nm(10, true), 'Bb');
  assert.equal(nm(11, true), 'B');
  OPT.h = true;
  assert.equal(nm(11, false), 'H');
  assert.equal(nm(10, true), 'B');
  OPT.h = false;
});

test('flat keys are F, Bb, Eb, Ab and Db', () => {
  assert.deepEqual([0, 1, 3, 5, 6, 7, 8, 10].map(flatKey), [false, true, true, true, false, false, true, true]);
});

test('degrees are parsed relative to the key', () => {
  const key = { r: 'F', m: 'maj' };
  assert.deepEqual(parseDeg('I,V vi7 bVII iiø', key), [
    [mk('F', 'maj'), mk('C', 'maj')],
    [mk('D', 'm7')],
    [mk('D#', 'maj')],
    [mk('G', 'm7b5')],
  ]);
  assert.deepEqual(parseDeg('i VII VI V7', { r: 'A', m: 'min' }), [
    [mk('A', 'm')],
    [mk('G', 'maj')],
    [mk('F', 'maj')],
    [mk('E', '7')],
  ]);
});

test('an unknown degree is rejected', () => {
  assert.throws(() => parseDeg('I X', { r: 'C', m: 'maj' }));
  assert.throws(() => parseDeg('Iq', { r: 'C', m: 'maj' }));
});

test('every chord type survives degree -> text -> degree in both modes', () => {
  for (const key of [
    { r: 'C', m: 'maj' },
    { r: 'F#', m: 'min' },
  ])
    for (let pc = 0; pc < 12; pc++)
      for (const t of Object.keys(CH)) {
        const c = mk(cn(pc), t);
        const back = parseDeg(degOf(c, key), key)[0][0];
        assert.equal(back.r, c.r, `${lab(c)} in ${key.r} ${key.m}`);
        // maj/sus4 and m/m7... keep their own type; the text must lead back to the same chord
        assert.equal(back.t, c.t, `${lab(c)} in ${key.r} ${key.m}`);
      }
});

test('every chord type has a recommended scale that exists', () => {
  for (const t of Object.keys(CH)) assert.ok(SC[mainScale(mk('C', t))], t);
});

test('tunings have six strings from high to low', () => {
  for (const [name, t] of Object.entries(TUN)) {
    assert.equal(t.length, 6, name);
    for (let i = 1; i < 6; i++) assert.ok(t[i] < t[i - 1], name);
  }
});
