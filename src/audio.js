// Sound synthesis on the Web Audio clock: plucked string, drums, bass, click and the melody voices, plus the track mixer.
import { $ } from './dom.js';
import { SQ } from './sequencer.js';
import { mf } from './theory.js';

export const MIX = {
  drums: { v: 0.9, m: false },
  bass: { v: 0.9, m: false },
  chords: { v: 0.8, m: false },
  mel: { v: 0.9, m: false },
  click: { v: 0.7, m: true },
};
export const A = {
  ctx: null,
  out: null,
  noise: null,
  bus: {},
  KS: {},
  resume() {
    if (!this.ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      this.ctx = new C();
      this.out = this.ctx.createGain();
      this.out.gain.value = +$('vol').value;
      this.out.connect(this.ctx.destination);
      for (const k in MIX) {
        this.bus[k] = this.ctx.createGain();
        this.bus[k].connect(this.out);
      }
      this.mix();
      const b = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate),
        d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      this.noise = b;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },
  mix() {
    if (this.ctx)
      for (const k in MIX) this.bus[k].gain.setTargetAtTime(MIX[k].m ? 0 : MIX[k].v, this.ctx.currentTime, 0.02);
  },
  env(g, t, peak, dur, att = 0.01) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + att);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  },
  osc(type, f, t, dur, peak, cut, att, dest) {
    const c = this.ctx,
      o = c.createOscillator(),
      fl = c.createBiquadFilter(),
      g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    fl.type = 'lowpass';
    fl.frequency.value = cut;
    this.env(g, t, peak, dur, att);
    o.connect(fl);
    fl.connect(g);
    g.connect(dest || this.out);
    o.start(t);
    o.stop(t + dur + 0.05);
    return o;
  },
  kick(t) {
    const c = this.ctx,
      o = c.createOscillator(),
      g = c.createGain();
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(32, t + 0.12);
    this.env(g, t, 1, 0.35, 0.002);
    o.connect(g);
    g.connect(this.bus.drums);
    o.start(t);
    o.stop(t + 0.4);
  },
  noiseHit(t, type, f, peak, dur) {
    const c = this.ctx,
      n = c.createBufferSource(),
      fl = c.createBiquadFilter(),
      g = c.createGain();
    n.buffer = this.noise;
    fl.type = type;
    fl.frequency.value = f;
    this.env(g, t, peak, dur, 0.002);
    n.connect(fl);
    fl.connect(g);
    g.connect(this.bus.drums);
    n.start(t);
    n.stop(t + dur + 0.02);
  },
  snare(t, p = 0.8) {
    this.noiseHit(t, 'bandpass', 1800, p, 0.22);
    this.osc('triangle', 190, t, 0.12, p * 0.6, 3000, 0.002, this.bus.drums);
  },
  rim(t) {
    this.noiseHit(t, 'bandpass', 3200, 0.35, 0.04);
    this.osc('triangle', 820, t, 0.05, 0.35, 4000, 0.001, this.bus.drums);
  },
  hat(t, open, p = 0.3) {
    this.noiseHit(t, 'highpass', 7500, p, open ? 0.3 : 0.06);
  },
  bass(f, t, d) {
    this.osc('triangle', f, t, d, 0.7, 320, 0.02, this.bus.bass);
  },
  click(t, acc, dest) {
    this.osc('square', acc === 2 ? 1500 : acc ? 1150 : 850, t, 0.05, 0.35, 5000, 0.002, dest);
  },
  // Karplus-Strong plucked string, rendered once per pitch; r corrects the pitch for the integer delay length. br = brighter, longer-ringing electric string
  ks(m, br) {
    const key = m + (br ? 'b' : '');
    if (this.KS[key]) return this.KS[key];
    const sr = this.ctx.sampleRate,
      f = mf(m),
      n = Math.max(2, Math.round(sr / f + 0.5)),
      len = (sr * 2.5) | 0,
      b = this.ctx.createBuffer(1, len, sr),
      d = b.getChannelData(0);
    let p = 0,
      avg = 0,
      pk = 0;
    for (let i = 0; i < n; i++) {
      p += (br ? 0.9 : 0.55) * (Math.random() * 2 - 1 - p);
      d[i] = p;
      avg += p;
    }
    avg /= n;
    for (let i = 0; i < n; i++) {
      d[i] -= avg;
      pk = Math.max(pk, Math.abs(d[i]));
    }
    for (let i = 0; i < n; i++) d[i] /= pk;
    const dmp = 0.5 * Math.pow(10, -3 / (f * (br ? 6 : 3.5)));
    for (let i = n; i < len; i++) d[i] = dmp * (d[i - n] + d[i - n + 1]);
    return (this.KS[key] = { b, r: (f * (n - 0.5)) / sr });
  },
  curve() {
    if (!this.cv) {
      this.cv = new Float32Array(1024);
      for (let i = 0; i < 1024; i++) this.cv[i] = Math.tanh(((i / 1023) * 2 - 1) * 3);
    }
    return this.cv;
  },
  // o: soft (no pick attack), slide (start pitch ratio), bend, br (electric string), mute (palm mute), dist (overdrive)
  gtr(m, t, dur, peak, dest, o = {}) {
    const c = this.ctx,
      k = this.ks(m, o.br),
      s = c.createBufferSource(),
      g = c.createGain();
    s.buffer = k.b;
    this.glide([[s.playbackRate, k.r]], t, dur, o);
    g.gain.setValueAtTime(peak, t);
    g.gain.setTargetAtTime(0, o.mute ? t + 0.02 : t + dur, o.mute ? 0.07 : 0.06);
    let n = s;
    if (o.mute) {
      const f = c.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 1300;
      n.connect(f);
      n = f;
    }
    if (o.dist) {
      const pre = c.createGain(),
        ws = c.createWaveShaper(),
        f = c.createBiquadFilter();
      pre.gain.value = 14;
      ws.curve = this.curve();
      ws.oversample = '2x';
      f.type = 'lowpass';
      f.frequency.value = 3800;
      n.connect(pre);
      pre.connect(ws);
      ws.connect(f);
      n = f;
    }
    n.connect(g);
    g.connect(dest || this.out);
    s.start(t, o.soft ? 0.012 : 0);
    s.stop(t + dur + 0.5);
  },
  // slide into the note and whole-tone bend, applied to every pitch parameter of a voice
  glide(ps, t, dur, o) {
    ps.forEach(([p, f]) => {
      p.setValueAtTime(f, t);
      if (o.slide) {
        p.setValueAtTime(f * o.slide, t);
        p.exponentialRampToValueAtTime(f, t + 0.09);
      }
      if (o.bend) {
        p.setValueAtTime(f, t + dur * 0.25);
        p.exponentialRampToValueAtTime(f * 1.1225, t + dur * 0.55);
      }
    });
  },
  flute(m, t, dur, peak, o) {
    const c = this.ctx,
      f = mf(m),
      o1 = c.createOscillator(),
      o2 = c.createOscillator(),
      g2 = c.createGain(),
      g = c.createGain(),
      lfo = c.createOscillator(),
      lg = c.createGain(),
      fl = c.createBiquadFilter(),
      end = t + dur;
    o1.type = 'triangle';
    g2.gain.value = 0.3;
    this.glide(
      [
        [o1.frequency, f],
        [o2.frequency, f * 2],
      ],
      t,
      dur,
      o,
    );
    lfo.frequency.value = 5.2;
    lg.gain.setValueAtTime(0, t);
    lg.gain.linearRampToValueAtTime(9, t + 0.3);
    lfo.connect(lg);
    lg.connect(o1.detune);
    lg.connect(o2.detune);
    fl.type = 'lowpass';
    fl.frequency.value = 2400;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak * 0.36, t + (o.soft ? 0.02 : 0.05));
    g.gain.setTargetAtTime(0, end, 0.05);
    o1.connect(fl);
    o2.connect(g2);
    g2.connect(fl);
    fl.connect(g);
    g.connect(this.bus.mel);
    [o1, o2, lfo].forEach((x) => {
      x.start(t);
      x.stop(end + 0.4);
    });
  },
  // two-operator FM electric piano with a short bright tine on the attack
  epiano(m, t, dur, peak, o) {
    const c = this.ctx,
      f = mf(m),
      car = c.createOscillator(),
      mod = c.createOscillator(),
      mg = c.createGain(),
      tine = c.createOscillator(),
      tg = c.createGain(),
      g = c.createGain(),
      end = t + dur;
    this.glide(
      [
        [car.frequency, f],
        [mod.frequency, f],
        [tine.frequency, f * 4],
      ],
      t,
      dur,
      o,
    );
    mg.gain.setValueAtTime(f * 1.6, t);
    mg.gain.exponentialRampToValueAtTime(f * 0.25, t + 0.5);
    mod.connect(mg);
    mg.connect(car.frequency);
    tg.gain.setValueAtTime(0.3, t);
    tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    tine.connect(tg);
    tg.connect(g);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak * 0.45, t + 0.006);
    g.gain.setTargetAtTime(peak * 0.13, t + 0.006, 0.6);
    g.gain.setTargetAtTime(0, end, 0.08);
    car.connect(g);
    g.connect(this.bus.mel);
    [car, mod, tine].forEach((x) => {
      x.start(t);
      x.stop(end + 0.6);
    });
  },
  // one melody note in the selected melody sound
  mel(m, t, dur, peak, o = {}) {
    const M = this.bus.mel,
      sn = SQ.msound;
    if (sn === 'flute') this.flute(m, t, dur, peak, o);
    else if (sn === 'epiano') this.epiano(m, t, dur, peak, o);
    else
      this.gtr(
        m,
        t,
        dur,
        sn === 'dist' ? peak * 0.26 : sn === 'mute' ? peak * 1.8 : peak,
        M,
        sn === 'mute'
          ? { ...o, mute: 1 }
          : sn === 'clean'
            ? { ...o, br: 1 }
            : sn === 'dist'
              ? { ...o, br: 1, dist: 1 }
              : o,
      );
  },
  chord(ms, t, d) {
    ms.forEach((m, i) => this.gtr(m, t + i * 0.018, d, 0.24, this.bus.chords));
  },
  pluck(m) {
    this.resume();
    this.gtr(m, this.ctx.currentTime, 1.8, 0.7);
  },
};
