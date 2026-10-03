// Standard MIDI file encoder. No page or sound access.
// Standard MIDI file (format 1) from note events [tick, on(1)/off(0), note, velocity] per track
export function encodeMidi(tr, us, ts, melProg, PPQ) {
  const vlq = (v) => {
    const b = [v & 127];
    while ((v >>= 7)) b.unshift((v & 127) | 128);
    return b;
  };
  const chunk = (id, d) =>
    [...id]
      .map((c) => c.charCodeAt(0))
      .concat([(d.length >>> 24) & 255, (d.length >>> 16) & 255, (d.length >>> 8) & 255, d.length & 255], d);
  const track = (ev, ch, prog, name) => {
    ev.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const nb = [...name].map((c) => c.charCodeAt(0));
    let d = [0, 255, 3, nb.length, ...nb],
      last = 0;
    if (prog != null) d.push(0, 192 | ch, prog);
    ev.forEach((e) => {
      d.push(...vlq(e[0] - last), (e[1] ? 144 : 128) | ch, e[2], e[3]);
      last = e[0];
    });
    d.push(0, 255, 47, 0);
    return chunk('MTrk', d);
  };
  const tracks = [
    chunk('MTrk', [
      0,
      255,
      81,
      3,
      (us >> 16) & 255,
      (us >> 8) & 255,
      us & 255,
      0,
      255,
      88,
      4,
      ts[0],
      ts[1],
      24,
      8,
      0,
      255,
      47,
      0,
    ]),
    track(tr.mel, 0, melProg, 'Melodia'),
    track(tr.chords, 1, 24, 'Akordy'),
    track(tr.bass, 2, 33, 'Basa'),
    track(tr.drums, 9, null, 'Bicie'),
  ];
  return new Uint8Array(chunk('MThd', [0, 1, 0, tracks.length, PPQ >> 8, PPQ & 255]).concat(...tracks));
}
