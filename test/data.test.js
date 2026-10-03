import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GR, PRE, preBars, INT, TR } from '../src/data.js';
import { EN } from '../src/lang/en.js';
import { SC, CH, ci } from '../src/theory.js';

test('presets use known grooves, chords and keys', () => {
  for (const [id, p] of Object.entries(PRE)) {
    assert.ok(GR[p.g], `${id}: groove`);
    assert.ok(ci(p.k[0]) >= 0 && ['maj', 'min'].includes(p.k[1]), `${id}: key`);
    const bars = preBars(p);
    assert.ok(bars.length >= 2 && bars.length <= 12, `${id}: length`);
    bars.flat().forEach((c) => assert.ok(ci(c.r) >= 0 && CH[c.t], `${id}: chord ${c.r}${c.t}`));
    bars.forEach((b) => assert.ok(b.length === 1 || b.length === 2, `${id}: chords per bar`));
  }
});

test('grooves only strum on steps inside their bar', () => {
  for (const [id, g] of Object.entries(GR)) {
    const steps = g.m === '4/4' ? 16 : 12;
    assert.ok(['4/4', '3/4', '6/8'].includes(g.m), id);
    g.h.forEach((s) => assert.ok(s >= 0 && s < steps, `${id}: step ${s}`));
  }
});

test('every name shown in a list has an English translation or reads the same in English', () => {
  const sameInEnglish = [
    'Rock / Pop',
    'Funk',
    'Jazz swing',
    'Shuffle',
    'Bossa nova',
    'Reggae',
    'Pop / Rock',
    'Jazz ii–V–I',
    'Neo-soul / funk',
    'tritonus',
  ];
  const names = [
    ...Object.values(SC).map((s) => s[0]),
    ...Object.values(GR).map((g) => g.n),
    ...Object.values(PRE).map((p) => p.n),
    ...INT,
    ...Object.values(TR),
  ];
  names.forEach((n) => assert.ok(EN[n] || sameInEnglish.includes(n), `no English text for "${n}"`));
  Object.entries(EN).forEach(([k, v]) => assert.ok(typeof v === 'string' && v.length, `empty translation for "${k}"`));
});
