import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validSong, makeBackup, readBackup, mergeSlots } from '../src/songdata.js';
import { mk } from '../src/theory.js';

const song = (...roots) => ({ v: 3, secs: [{ n: 'A', p: roots.map((r) => [mk(r, 'maj')]), m: null }], b: 100 });
const legacy = {
  p: [
    { r: 'A', t: 'm' },
    { r: 'G', t: 'maj' },
  ],
  b: 90,
};

test('songs in the current and the older format are accepted', () => {
  assert.ok(validSong(song('C', 'G')));
  assert.ok(validSong(legacy));
});

test('broken songs are refused', () => {
  assert.ok(!validSong(null));
  assert.ok(!validSong({}));
  assert.ok(!validSong(song('C')), 'one bar only');
  assert.ok(!validSong({ secs: [{ p: [[{ r: 'X', t: 'maj' }], [{ r: 'C', t: 'maj' }]] }] }), 'unknown note');
  assert.ok(!validSong({ secs: [{ p: [[{ r: 'C', t: 'zzz' }], [{ r: 'C', t: 'maj' }]] }] }), 'unknown chord type');
  assert.ok(!validSong({ secs: Array(7).fill(song('C', 'G').secs[0]) }), 'too many sections');
});

test('a backup round trip returns the saved songs', () => {
  const slots = { 'Moja pieseň': song('C', 'G'), Stará: legacy };
  const back = readBackup(makeBackup(slots, song('D', 'A'), '2026-10-03'));
  assert.deepEqual(Object.fromEntries(back), slots);
});

test('other files are not taken for a backup', () => {
  assert.throws(() => readBackup('hello'));
  assert.throws(() => readBackup('{"slots":{}}'));
  assert.throws(() => readBackup(JSON.stringify({ app: 'LubenoGuitar', kind: 'other', slots: {} })));
});

test('unusable songs in a backup are skipped; with none saved, the open song is offered', () => {
  const text = makeBackup({ ok: song('C', 'G'), bad: { p: 'x' } }, null, 'd');
  assert.deepEqual(
    readBackup(text).map(([n]) => n),
    ['ok'],
  );
  assert.deepEqual(
    readBackup(makeBackup({}, song('E', 'A'), 'd')).map(([n]) => n),
    ['Import'],
  );
});

test('restoring never overwrites: taken names get a number, identical songs are skipped', () => {
  const mine = { Blues: song('A', 'D') };
  const r = mergeSlots(mine, [
    ['Blues', song('E', 'A')],
    ['Blues', song('A', 'D')],
    ['Nová', song('C', 'F')],
  ]);
  assert.equal(r.added, 2);
  assert.deepEqual(Object.keys(r.slots), ['Blues', 'Blues (2)', 'Nová']);
  assert.deepEqual(r.slots.Blues, song('A', 'D'));
  assert.deepEqual(mine, { Blues: song('A', 'D') }, 'the original object is left alone');
});
