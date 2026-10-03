import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const headings = (md) =>
  [...md.matchAll(/^(#{2,3}) (.+)$/gm)].map((m) => ({
    level: m[1].length,
    text: m[2],
    id: (m[2].match(/\{#([\w-]+)\}$/) || [])[1],
  }));
const sk = headings(read('../docs/manual.sk.md'));
const en = headings(read('../docs/manual.en.md'));

test('every chapter of the manual has an anchor, and no anchor repeats', () => {
  for (const [lang, hs] of [
    ['sk', sk],
    ['en', en],
  ]) {
    hs.forEach((h) => assert.ok(h.id, `${lang}: "${h.text}" has no {#anchor}`));
    assert.equal(new Set(hs.map((h) => h.id)).size, hs.length, `${lang}: repeated anchor`);
  }
});

test('the Slovak and English manuals have the same chapters in the same order', () => {
  assert.deepEqual(
    en.map((h) => `${h.level} ${h.id}`),
    sk.map((h) => `${h.level} ${h.id}`),
  );
});

test('links inside the manual and help links in the app point to existing chapters', () => {
  const ids = new Set(sk.map((h) => h.id));
  for (const file of ['../docs/manual.sk.md', '../docs/manual.en.md'])
    for (const m of read(file).matchAll(/\]\(#([\w-]+)\)/g)) assert.ok(ids.has(m[1]), `${file}: #${m[1]}`);
  const used = [...read('../src/app.html').matchAll(/data-help="([\w-]*)"/g)].map((m) => m[1]).filter(Boolean);
  assert.ok(used.length > 0);
  used.forEach((id) => assert.ok(ids.has(id), `app.html: data-help="${id}"`));
});

test('both manuals have the same number of tables and list items', () => {
  const count = (s, re) => (s.match(re) || []).length;
  const a = read('../docs/manual.sk.md'),
    b = read('../docs/manual.en.md');
  assert.equal(count(b, /^\| --- /gm), count(a, /^\| --- /gm), 'tables');
  assert.equal(count(b, /^\|/gm), count(a, /^\|/gm), 'table rows');
  assert.equal(count(b, /^(- |\d+\. )/gm), count(a, /^(- |\d+\. )/gm), 'list items');
});
