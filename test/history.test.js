import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHistory } from '../src/history.js';

test('snapshots come back newest first and are copies', () => {
  const h = createHistory();
  const data = [{ f: 1 }];
  h.push('a', data);
  data[0].f = 2;
  h.push('a', data);
  assert.equal(h.size, 2);
  assert.deepEqual(h.pop('a'), [{ f: 2 }]);
  assert.deepEqual(h.pop('a'), [{ f: 1 }]);
  assert.equal(h.pop('a'), undefined);
});

test('a snapshot from a different situation is refused and clears the history', () => {
  const h = createHistory();
  h.push('standard|0', 1);
  h.push('standard|0', 2);
  assert.equal(h.pop('drop_d|0'), null);
  assert.equal(h.size, 0);
});

test('only the newest entries are kept', () => {
  const h = createHistory(3);
  for (let i = 0; i < 10; i++) h.push('s', i);
  assert.equal(h.size, 3);
  assert.equal(h.pop('s'), 9);
});
