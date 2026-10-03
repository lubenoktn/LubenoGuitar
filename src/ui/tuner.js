// Tuner: listens on the microphone and shows the note and its deviation in cents.
import { A } from '../audio.js';
import { $ } from '../dom.js';
import { L } from '../i18n.js';
import { detectPitch } from '../pitch.js';
import { SQ } from '../sequencer.js';
import { TUN, nm } from '../theory.js';
import { FB } from './fretboard.js';

export const TN = {
  on: false,
  msg: 'Zahraj jednu strunu blízko mikrofónu.',
  stream: null,
  src: null,
  an: null,
  timer: null,
  buf: null,
  miss: 0,
  async start() {
    try {
      A.resume();
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      this.an = A.ctx.createAnalyser();
      this.an.fftSize = 4096;
      this.buf = new Float32Array(4096);
      this.src = A.ctx.createMediaStreamSource(this.stream);
      this.src.connect(this.an);
      this.on = true;
      this.timer = setInterval(() => this.show(this.pitch()), 90);
      this.ui('Zahraj jednu strunu blízko mikrofónu.');
    } catch (e) {
      this.ui('Mikrofón nie je dostupný. Povoľ ho v prehliadači a skús to znova.');
    }
  },
  stop() {
    if (!this.on) return;
    this.on = false;
    clearInterval(this.timer);
    this.stream.getTracks().forEach((t) => t.stop());
    this.src.disconnect();
    this.miss = 9;
    this.show(0);
    this.ui('Mikrofón je vypnutý.');
  },
  ui(msg) {
    if (msg) this.msg = msg;
    $('tunmsg').textContent = L(this.msg);
    $('tunbtn').textContent = L(this.on ? 'Vypnúť mikrofón' : 'Zapnúť mikrofón');
    $('tunbtn').className =
      'px-4 py-2 rounded-xl font-semibold text-slate-950 ' + (this.on ? 'bg-rose-500' : 'bg-emerald-500');
  },
  pitch() {
    this.an.getFloatTimeDomainData(this.buf);
    return detectPitch(this.buf, A.ctx.sampleRate);
  },
  show(f) {
    const nd = $('tunneedle');
    if (!f) {
      if (++this.miss > 8) {
        $('tunnote').textContent = '–';
        $('tunnote').className = 'text-6xl font-extrabold text-slate-500';
        $('tuncents').textContent = '';
        nd.style.left = '50%';
        nd.className = nd.className.replace(/bg-\S+/, 'bg-slate-500');
        this.mark(-1);
      }
      return;
    }
    this.miss = 0;
    const m = 69 + 12 * Math.log2(f / 440),
      near = Math.round(m),
      ct = Math.round((m - near) * 100),
      ok = Math.abs(ct) <= 5;
    $('tunnote').textContent = nm(near, SQ.flat()) + (Math.floor(near / 12) - 1);
    $('tunnote').className = 'text-6xl font-extrabold ' + (ok ? 'text-emerald-400' : 'text-amber-400');
    $('tuncents').textContent = ok
      ? L('naladené')
      : ct < 0
        ? `${-ct} ${L('centov nízko – pritiahni')}`
        : `${ct} ${L('centov vysoko – povoľ')}`;
    nd.style.left = 50 + Math.max(-50, Math.min(50, ct)) + '%';
    nd.className = nd.className.replace(/bg-\S+/, ok ? 'bg-emerald-400' : 'bg-amber-400');
    this.mark(near);
  },
  mark(m) {
    [...$('tunstr').children].forEach((b) => b.classList.toggle('!border-emerald-400', +b.dataset.m === m));
  },
  strings() {
    $('tunstr').innerHTML = TUN[FB.tun]
      .slice()
      .reverse()
      .map(
        (m) =>
          `<button data-m="${m}" class="px-3 py-2 rounded-lg bg-s9 border-2 border-s6 font-bold text-amber-400">${nm(m, SQ.flat())}<span class="text-[10px] text-slate-400">${Math.floor(m / 12) - 1}</span></button>`,
      )
      .join('');
  },
};
$('tunbtn').onclick = () => (TN.on ? TN.stop() : TN.start());
$('tunstr').onclick = (e) => {
  const b = e.target.closest('button');
  if (b) A.pluck(+b.dataset.m);
};
