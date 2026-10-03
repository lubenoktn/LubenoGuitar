import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  b64e,
  b64d,
  packEv,
  unpackEv,
  normNote,
  normEv,
  normBar,
  secName,
  clampBpm,
  guessKey,
} from '../src/songdata.js';
import { TUN, mk } from '../src/theory.js';

const T = TUN.standard;

test('base64url keeps accented text and uses only link-safe characters', () => {
  const text = JSON.stringify({ n: 'Refrén ž š č', x: '??>>' });
  const code = b64e(text);
  assert.match(code, /^[A-Za-z0-9_-]+$/);
  assert.equal(b64d(code), text);
});

test('melody events survive packing', () => {
  const note = { m: 69, s: 1, f: 10, len: 2, a: 'b' };
  assert.deepEqual(normEv(unpackEv(packEv(note)), T, 17), note);
  const tri = {
    tri: [
      { m: 64, s: 0, f: 0 },
      { m: 62, s: 1, f: 3 },
      { m: 60, s: 1, f: 1 },
    ],
  };
  assert.deepEqual(normEv(unpackEv(packEv(tri)), T, 17), tri);
  assert.equal(unpackEv(packEv(null)), null);
});

test('the pitch is always recomputed from string and fret', () => {
  assert.deepEqual(normNote({ m: 999, s: 5, f: 3 }, T, 17), { m: 43, s: 5, f: 3 });
});

test('anything that is not a valid note is dropped', () => {
  for (const bad of [
    { s: '<img src=x>', f: 1 },
    { s: 1, f: '<b>' },
    { s: 6, f: 1 },
    { s: -1, f: 1 },
    { s: 1, f: 18 },
    { s: 1.5, f: 2 },
    { tri: [{ s: 0, f: 0 }] },
    { tri: 'x' },
  ])
    assert.equal(normEv(bad, T, 17), null, JSON.stringify(bad));
  assert.equal(normEv({ s: 1, f: 2, a: '<i>', len: 9 }, T, 17).a, undefined);
});

test('the slot after a triplet is always empty', () => {
  const n = { s: 0, f: 0 };
  const bar = normBar([{ tri: [n, n, n] }, { s: 1, f: 1 }, null, null], T, 17);
  assert.equal(bar[1], null);
});

test('section names keep letters and digits only', () => {
  assert.equal(secName('Refrén 1!'), 'Refrén1');
  assert.equal(secName('<img src=x onerror=alert(1)>'), 'imgsrcxonerr');
  assert.equal(secName(null), '');
});

test('tempo is kept between 40 and 240', () => {
  assert.equal(clampBpm('20'), 40);
  assert.equal(clampBpm(500), 240);
  assert.equal(clampBpm('abc'), 100);
});

test('the key is guessed from the first chord', () => {
  assert.deepEqual(guessKey([[mk('A', 'm7')], [mk('D', 'maj')]]), { r: 'A', m: 'min' });
  assert.deepEqual(guessKey([[mk('G', '7')]]), { r: 'G', m: 'maj' });
});
