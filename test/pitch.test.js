import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectPitch } from '../src/pitch.js';

const SR = 44100;
// a string-like tone: fundamental with two overtones
const tone = (f, amp = 0.3) =>
  Float32Array.from(
    { length: 4096 },
    (_, i) =>
      amp *
      (Math.sin((2 * Math.PI * f * i) / SR) +
        0.6 * Math.sin((4 * Math.PI * f * i) / SR) +
        0.3 * Math.sin((6 * Math.PI * f * i) / SR)),
  );
const cents = (a, b) => 1200 * Math.log2(a / b);

test('open strings of standard and drop D tuning are found within 3 cents', () => {
  for (const f of [73.42, 82.41, 110, 146.83, 196, 246.94, 329.63]) {
    const got = detectPitch(tone(f), SR);
    assert.ok(Math.abs(cents(got, f)) < 3, `${f} Hz detected as ${got.toFixed(2)}`);
  }
});

test('a strong overtone does not shift the result an octave up', () => {
  const b = Float32Array.from(
    { length: 4096 },
    (_, i) => 0.2 * Math.sin((2 * Math.PI * 110 * i) / SR) + 0.3 * Math.sin((4 * Math.PI * 110 * i) / SR),
  );
  assert.ok(Math.abs(cents(detectPitch(b, SR), 110)) < 5);
});

test('silence and very quiet input give no pitch', () => {
  assert.equal(detectPitch(new Float32Array(4096), SR), 0);
  assert.equal(detectPitch(tone(110, 0.002), SR), 0);
});
