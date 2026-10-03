import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeMidi } from '../src/midi.js';

const str = (b, i, n) => String.fromCharCode(...b.slice(i, i + n));
const u32 = (b, i) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;

// [tick, on, note, velocity]
const events = () => ({
  mel: [
    [0, 1, 64, 100],
    [480, 0, 64, 0],
    [480, 1, 67, 100],
    [960, 0, 67, 0],
  ],
  chords: [
    [0, 1, 48, 70],
    [1920, 0, 48, 0],
  ],
  bass: [
    [0, 1, 36, 100],
    [300, 0, 36, 0],
  ],
  drums: [
    [0, 1, 36, 110],
    [10, 0, 36, 0],
  ],
});

test('the file is a format 1 MIDI file with five well-formed tracks', () => {
  const b = encodeMidi(events(), 500000, [4, 2], 25, 480);
  assert.equal(str(b, 0, 4), 'MThd');
  assert.equal(u32(b, 4), 6);
  assert.deepEqual([...b.slice(8, 14)], [0, 1, 0, 5, 480 >> 8, 480 & 255]);
  let pos = 14,
    tracks = 0;
  while (pos < b.length) {
    assert.equal(str(b, pos, 4), 'MTrk');
    const len = u32(b, pos + 4);
    // every track ends with the end-of-track meta event
    assert.deepEqual([...b.slice(pos + 8 + len - 3, pos + 8 + len)], [255, 47, 0]);
    pos += 8 + len;
    tracks++;
  }
  assert.equal(pos, b.length);
  assert.equal(tracks, 5);
});

test('tempo and time signature are written to the first track', () => {
  const b = encodeMidi(events(), 500000, [6, 3], 25, 480);
  const t0 = [...b.slice(22, 22 + 15)];
  assert.deepEqual(t0.slice(0, 7), [0, 255, 81, 3, 0x07, 0xa1, 0x20]); // 500000 microseconds per quarter
  assert.deepEqual(t0.slice(7, 13), [0, 255, 88, 4, 6, 3]);
});

test('the melody track selects the requested instrument and ends a note before the next starts', () => {
  const b = [...encodeMidi(events(), 500000, [4, 2], 73, 480)];
  const i = b.findIndex((x, k) => x === 0xc0 && b[k + 1] === 73);
  assert.ok(i > 0, 'program change for the melody');
  // at tick 480 the note-off of 64 comes before the note-on of 67
  const off = b.indexOf(0x80, i),
    on2 = b.indexOf(67, i);
  assert.ok(off > 0 && off < on2);
});

test('long delta times use variable-length encoding', () => {
  const ev = events();
  ev.chords = [
    [0, 1, 48, 70],
    [200000, 0, 48, 0],
  ];
  const b = [...encodeMidi(ev, 500000, [4, 2], 25, 480)];
  // 200000 = 0x8C 0x9A 0x40 as a variable-length quantity
  const s = b.join(',');
  assert.ok(s.includes([0x8c, 0x9a, 0x40, 0x81, 48, 0].join(',')));
});
