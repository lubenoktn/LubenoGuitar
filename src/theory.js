// Music theory with no page or sound access: notes, tunings, scales, chords, note naming and roman-numeral degrees.
import { OPT } from './options.js';

export const N = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const FL = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
export const IV = ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'];
export const TUN = {
  standard: [64, 59, 55, 50, 45, 40],
  drop_d: [64, 59, 55, 50, 45, 38],
  dadgad: [62, 57, 55, 50, 45, 38],
  half: [63, 58, 54, 49, 44, 39],
};
// [name, intervals, semitones from the parent major key's tonic up to this root (decides sharps vs flats)]
export const SC = {
  minor_pentatonic: ['Molová pentatonika', [0, 3, 5, 7, 10], 9],
  major_pentatonic: ['Durová pentatonika', [0, 2, 4, 7, 9], 0],
  blues: ['Bluesová', [0, 3, 5, 6, 7, 10], 9],
  ionian: ['Jónsky (dur)', [0, 2, 4, 5, 7, 9, 11], 0],
  dorian: ['Dórsky', [0, 2, 3, 5, 7, 9, 10], 2],
  phrygian: ['Frygický', [0, 1, 3, 5, 7, 8, 10], 4],
  lydian: ['Lydický', [0, 2, 4, 6, 7, 9, 11], 5],
  mixolydian: ['Mixolydický', [0, 2, 4, 5, 7, 9, 10], 7],
  aeolian: ['Eolský (mol)', [0, 2, 3, 5, 7, 8, 10], 9],
  locrian: ['Lokrický', [0, 1, 3, 5, 6, 8, 10], 11],
  harmonic_minor: ['Harmonická mol', [0, 2, 3, 5, 7, 8, 11], 9],
  melodic_minor: ['Melodická mol', [0, 2, 3, 5, 7, 9, 11], 9],
  altered: ['Alterovaná', [0, 1, 3, 4, 6, 8, 10], 8],
  diminished: ['Zmenšená (celý–pol)', [0, 2, 3, 5, 6, 8, 9, 11], 9],
};
export const CH = {
  maj: ['', [0, 4, 7]],
  m: ['m', [0, 3, 7]],
  7: ['7', [0, 4, 7, 10]],
  maj7: ['maj7', [0, 4, 7, 11]],
  m7: ['m7', [0, 3, 7, 10]],
  m7b5: ['m7b5', [0, 3, 6, 10]],
  dim7: ['dim7', [0, 3, 6, 9]],
  sus4: ['sus4', [0, 5, 7]],
  9: ['9', [0, 4, 7, 10, 14]],
  m9: ['m9', [0, 3, 7, 10, 14]],
  13: ['13', [0, 4, 10, 14, 21]],
  '7alt': ['7alt', [0, 4, 8, 10, 13]],
};
export const MINOR = ['m', 'm7', 'm9', 'm7b5', 'dim7'];
export const ci = (n) => N.indexOf(n),
  cn = (i) => N[((i % 12) + 12) % 12],
  mf = (m) => 440 * Math.pow(2, (m - 69) / 12);
export const mk = (r, t) => ({ r, t });
export const lab = (c) => c.r + CH[c.t][0],
  barLab = (b) => b.map(lab).join('|');
export const nm = (pc, flat) => {
  let s = (flat ? FL : N)[((pc % 12) + 12) % 12];
  if (OPT.h) {
    if (s === 'B') s = 'H';
    else if (s === 'Bb') s = 'B';
  }
  return s;
};
export const flatKey = (pc) => [5, 10, 3, 8, 1].includes(((pc % 12) + 12) % 12);
export const useFlat = (auto) => OPT.names === 'flat' || (OPT.names === 'auto' && auto);
export const ROM = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
export const DMAJ = ['I', 'bII', 'II', 'bIII', 'III', 'IV', '#IV', 'V', 'bVI', 'VI', 'bVII', 'VII'],
  DMIN = ['I', 'bII', 'II', 'III', '#III', 'IV', '#IV', 'V', 'VI', '#VI', 'VII', '#VII'];
export const DSUF = {
  maj: '',
  m: '',
  7: '7',
  maj7: 'maj7',
  m7: '7',
  m7b5: 'ø',
  dim7: '°',
  sus4: 'sus4',
  9: '9',
  m9: '9',
  13: '13',
  '7alt': '7alt',
};
export function degOf(c, key) {
  const d = (key.m === 'min' ? DMIN : DMAJ)[(((ci(c.r) - ci(key.r)) % 12) + 12) % 12];
  return (MINOR.includes(c.t) ? d.toLowerCase() : d) + DSUF[c.t];
}
export function parseDeg(str, key) {
  const k = ci(key.r),
    sc = key.m === 'min' ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
  const UP = {
      '': 'maj',
      7: '7',
      maj7: 'maj7',
      9: '9',
      13: '13',
      sus4: 'sus4',
      '7alt': '7alt',
      alt: '7alt',
      m: 'm',
      m7: 'm7',
      m9: 'm9',
      dim: 'dim7',
      dim7: 'dim7',
      m7b5: 'm7b5',
    },
    LO = {
      '': 'm',
      7: 'm7',
      9: 'm9',
      m: 'm',
      m7: 'm7',
      m9: 'm9',
      dim: 'dim7',
      dim7: 'dim7',
      m7b5: 'm7b5',
      '7b5': 'm7b5',
    };
  return str
    .trim()
    .split(/[\s|]+/)
    .filter(Boolean)
    .map((tok) =>
      tok
        .split(',')
        .filter(Boolean)
        .slice(0, 2)
        .map((x) => {
          const m = x.match(/^([b#]?)(VII|VI|IV|V|III|II|I|vii|vi|iv|v|iii|ii|i)(.*)$/);
          if (!m) throw x;
          const up = m[2] === m[2].toUpperCase(),
            q = m[3].replace('°', 'dim').replace('ø', 'm7b5'),
            T = up ? UP : LO;
          if (!(q in T)) throw x;
          return mk(cn(k + sc[ROM.indexOf(m[2].toUpperCase())] + (m[1] === 'b' ? -1 : m[1] === '#' ? 1 : 0)), T[q]);
        }),
    );
}
export const mainScale = (c) =>
  ['m', 'm7', 'm9'].includes(c.t)
    ? 'dorian'
    : c.t === '7alt'
      ? 'altered'
      : ['7', '9', '13'].includes(c.t)
        ? 'mixolydian'
        : c.t === 'm7b5'
          ? 'locrian'
          : c.t === 'dim7'
            ? 'diminished'
            : 'ionian';
export const BLACK = [1, 3, 6, 8, 10];

/* ---------- CHORDS WRITTEN AS TEXT ("C G Am F", "| Dm7 G7 | Cmaj7 |") ---------- */
const ENHARMONIC = { Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#', Cb: 'B', Fb: 'E', 'E#': 'F', 'B#': 'C' };
// suffix as people write it -> chord type of the app
const SUFFIX = {
  '': 'maj',
  maj: 'maj',
  M: 'maj',
  m: 'm',
  min: 'm',
  mi: 'm',
  '-': 'm',
  7: '7',
  dom7: '7',
  maj7: 'maj7',
  M7: 'maj7',
  ma7: 'maj7',
  Δ: 'maj7',
  Δ7: 'maj7',
  m7: 'm7',
  min7: 'm7',
  mi7: 'm7',
  '-7': 'm7',
  m7b5: 'm7b5',
  min7b5: 'm7b5',
  'm7(b5)': 'm7b5',
  ø: 'm7b5',
  ø7: 'm7b5',
  dim: 'dim7',
  dim7: 'dim7',
  '°': 'dim7',
  '°7': 'dim7',
  o: 'dim7',
  o7: 'dim7',
  sus4: 'sus4',
  sus: 'sus4',
  9: '9',
  m9: 'm9',
  min9: 'm9',
  13: '13',
  '7alt': '7alt',
  alt: '7alt',
};
// suffixes the app has no chord for -> the nearest chord it has
const NEAREST = {
  5: 'maj',
  6: 'maj',
  add9: 'maj',
  '6/9': 'maj',
  aug: 'maj',
  '+': 'maj',
  sus2: 'sus4',
  '7sus4': 'sus4',
  '7sus': 'sus4',
  maj9: 'maj7',
  M9: 'maj7',
  maj13: 'maj7',
  m6: 'm',
  min6: 'm',
  madd9: 'm',
  mMaj7: 'm',
  'm(maj7)': 'm',
  m11: 'm7',
  min11: 'm7',
  m13: 'm9',
  11: '9',
  '9#11': '9',
  '7#9': '7alt',
  '7b9': '7alt',
  '7#5': '7alt',
  '7b5': '7alt',
  '7#11': '7alt',
  '7b13': '7alt',
};
// one chord name; germanB: a bare B means B flat (and H is always B natural). A bass note after "/" is ignored.
export function parseChordName(tok, germanB = false) {
  const m = tok
    .replace(/♯/g, '#')
    .replace(/♭/g, 'b')
    .match(/^([A-H])([#b]?)(.*)$/);
  if (!m) throw tok;
  let name = m[1] === 'H' ? 'B' + m[2] : m[1] === 'B' && germanB && !m[2] ? 'Bb' : m[1] + m[2];
  name = ENHARMONIC[name] || name;
  const suf = m[3] in SUFFIX || m[3] in NEAREST ? m[3] : m[3].replace(/\/[A-H][#b]?$/, '');
  if (ci(name) < 0 || !(suf in SUFFIX || suf in NEAREST)) throw tok;
  return { c: mk(name, SUFFIX[suf] || NEAREST[suf]), approx: !(suf in SUFFIX) };
}
// bars from chord names. Without "|" every name is a bar and a comma joins two chords in one bar;
// with "|" the bars are what stands between the lines. approx lists the chords that were simplified.
export function parseChords(str, germanB = false) {
  const text = str.replace(/[–—]/g, '-').replace(/\s-\s/g, ' ').trim();
  const approx = [];
  const one = (tok) => {
    const x = parseChordName(tok, germanB);
    if (x.approx) approx.push(tok + ' → ' + lab(x.c));
    return x.c;
  };
  const bar = (b, sep) => b.split(sep).filter(Boolean).slice(0, 2).map(one);
  const bars = text.includes('|')
    ? text
        .split('|')
        .map((b) => b.trim())
        .filter(Boolean)
        .map((b) => bar(b, /[\s,]+/))
    : text
        .split(/\s+/)
        .filter(Boolean)
        .map((b) => bar(b, ','));
  return { bars, approx };
}
// chord names start with a note letter; degrees start with a roman numeral or an accidental
export const looksLikeChords = (str) => /^[\s|]*[A-H]/.test(str);
// the key whose scale holds most of the chords; ties go to the key of the first, then the last chord
export function detectKey(bars) {
  const cs = bars.flat();
  const tonic = (c, pc, m) => ci(c.r) === pc && MINOR.includes(c.t) === (m === 'min');
  let best = null,
    top = -1;
  for (let pc = 0; pc < 12; pc++)
    for (const m of ['maj', 'min']) {
      // degree -> expected quality (M major, m minor, x either)
      const want =
        m === 'maj'
          ? { 0: 'M', 2: 'm', 4: 'm', 5: 'M', 7: 'M', 9: 'm' }
          : { 0: 'm', 3: 'M', 5: 'm', 7: 'x', 8: 'M', 10: 'M' };
      let score = tonic(cs[0], pc, m) * 0.6 + tonic(cs[cs.length - 1], pc, m) * 0.3;
      cs.forEach((c) => {
        const q = want[(((ci(c.r) - pc) % 12) + 12) % 12];
        if (q && (q === 'x' || (q === 'm') === MINOR.includes(c.t))) score++;
      });
      if (score > top) {
        top = score;
        best = { r: cn(pc), m };
      }
    }
  return best;
}
