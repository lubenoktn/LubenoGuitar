import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseChords, parseChordName, looksLikeChords, detectKey, mk, lab } from '../src/theory.js';

const names = (bars) => bars.map((b) => b.map(lab).join('+')).join(' ');

test('chord names become bars', () => {
  assert.equal(names(parseChords('C G Am F').bars), 'C G Am F');
  assert.equal(names(parseChords('Dm7 G7 Cmaj7 A7alt').bars), 'Dm7 G7 Cmaj7 A7alt');
  assert.equal(names(parseChords('C,G Am').bars), 'C+G Am');
});

test('flats, unicode accidentals and spelling variants are understood', () => {
  assert.equal(names(parseChords('Bb Eb Abm F#m').bars), 'A# D# G#m F#m');
  assert.equal(names(parseChords('B♭ F♯m').bars), 'A# F#m');
  assert.equal(names(parseChords('Amin Dmi7 E- CM7 Bø Fdim Gsus').bars), 'Am Dm7 Em Cmaj7 Bm7b5 Fdim7 Gsus4');
});

test('text pasted from a chord sheet: dashes and bar lines', () => {
  assert.equal(names(parseChords('C - G - Am - F').bars), 'C G Am F');
  assert.equal(names(parseChords('| C G | Am F | Dm | G7 |').bars), 'C+G Am+F Dm G7');
});

test('a bass note after a slash is ignored', () => {
  assert.deepEqual(parseChordName('C/E').c, mk('C', 'maj'));
  assert.deepEqual(parseChordName('Am7/G').c, mk('A', 'm7'));
});

test('chords the app does not have are replaced by the nearest and reported', () => {
  const r = parseChords('Cadd9 G6 Em7');
  assert.equal(names(r.bars), 'C G Em7');
  assert.deepEqual(r.approx, ['Cadd9 → C', 'G6 → G']);
  assert.deepEqual(parseChords('C G').approx, []);
});

test('H is B natural; a bare B is B flat only with German naming', () => {
  assert.equal(lab(parseChordName('H7').c), 'B7');
  assert.equal(lab(parseChordName('B').c), 'B');
  assert.equal(lab(parseChordName('B', true).c), 'A#');
  assert.equal(lab(parseChordName('Bb', true).c), 'A#');
});

test('text that is not a chord is rejected', () => {
  assert.throws(() => parseChords('C Xm'));
  assert.throws(() => parseChords('C Gfoo'));
  assert.throws(() => parseChords('c g'));
});

test('chord text is told apart from degrees', () => {
  assert.ok(looksLikeChords('C G Am F'));
  assert.ok(looksLikeChords(' | Bb F |'));
  assert.ok(!looksLikeChords('I V vi IV'));
  assert.ok(!looksLikeChords('bVII IV I'));
  assert.ok(!looksLikeChords('vi IV'));
});

test('the key is worked out from the chords', () => {
  const key = (s) => detectKey(parseChords(s).bars);
  assert.deepEqual(key('C G Am F'), { r: 'C', m: 'maj' });
  assert.deepEqual(key('Am F C G'), { r: 'A', m: 'min' });
  assert.deepEqual(key('F G C'), { r: 'C', m: 'maj' });
  assert.deepEqual(key('Dm7 G7 Cmaj7'), { r: 'C', m: 'maj' });
  assert.deepEqual(key('Am G F E7'), { r: 'A', m: 'min' });
  assert.deepEqual(key('D A Bm G'), { r: 'D', m: 'maj' });
});
