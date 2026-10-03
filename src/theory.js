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
