// Efeitos sonoros gerados por código (Web Audio). Versão básica para as alucinações
// funcionarem; a etapa 11 refina o som e adiciona ambiente, chuva, vozes etc.
//
// O navegador só libera áudio depois de uma tecla ou clique: o contexto liga sozinho
// no primeiro toque do jogador.

class Sfx {
  constructor() {
    this.ctx = null;
    const unlock = () => this.#ensure();
    window.addEventListener('keydown', unlock);
    window.addEventListener('pointerdown', unlock);
  }

  #ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.7;
      this.master.connect(this.ctx.destination);
      // 2 s de ruído branco, reaproveitado por todos os sons
      const len = this.ctx.sampleRate * 2;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  get ready() {
    return !!this.#ensure() && this.ctx.state === 'running';
  }

  /** Saída com volume e lado (pan −1 esquerda … 1 direita). */
  #out(volume = 1, pan = 0) {
    const gain = this.ctx.createGain();
    gain.gain.value = volume;
    const panner = this.ctx.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    gain.connect(panner).connect(this.master);
    return { gain, panner };
  }

  #noiseSource() {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    src.loopStart = Math.random();
    return src;
  }

  /** Batida grave (passo pesado, coração). */
  #thump(at, { freq = 70, dur = 0.12, volume = 1, pan = 0, noise = 0.4 }) {
    const { gain } = this.#out(volume, pan);
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(1, at + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    env.connect(gain);
    const osc = this.ctx.createOscillator();
    osc.frequency.setValueAtTime(freq * 1.8, at);
    osc.frequency.exponentialRampToValueAtTime(freq, at + dur * 0.6);
    osc.connect(env);
    osc.start(at);
    osc.stop(at + dur + 0.02);
    if (noise > 0) {
      const n = this.#noiseSource();
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 500;
      const ng = this.ctx.createGain();
      ng.gain.value = noise;
      n.connect(lp).connect(ng).connect(env);
      n.start(at);
      n.stop(at + dur + 0.02);
    }
  }

  /** Passos pesados correndo (passos falsos / Artur distorcido), passando de um lado ao outro. */
  heavySteps(seconds = 2.6, panFrom = -0.8, panTo = 0.8, volume = 0.9) {
    if (!this.ready) return;
    const t0 = this.ctx.currentTime + 0.05;
    const interval = 0.27;
    const count = Math.floor(seconds / interval);
    for (let i = 0; i < count; i++) {
      const k = i / Math.max(1, count - 1);
      // Mais alto no meio (passa perto), mais baixo nas pontas
      const v = volume * (0.45 + 0.55 * Math.sin(Math.PI * k));
      this.#thump(t0 + i * interval + Math.random() * 0.03, {
        freq: 55 + Math.random() * 10,
        dur: 0.16,
        volume: v,
        pan: panFrom + (panTo - panFrom) * k,
        noise: 0.7,
      });
    }
  }

  /** Coração batendo forte (toda vez que o medo sobe muito). */
  heartbeat(beats = 2, volume = 0.9) {
    if (!this.ready) return;
    const t0 = this.ctx.currentTime + 0.02;
    for (let b = 0; b < beats; b++) {
      const t = t0 + b * 0.75;
      this.#thump(t, { freq: 48, dur: 0.14, volume, noise: 0.2 });
      this.#thump(t + 0.2, { freq: 42, dur: 0.18, volume: volume * 0.75, noise: 0.2 });
    }
  }

  /** Estouro de balão. */
  pop(volume = 0.8, pan = 0) {
    if (!this.ready) return;
    const at = this.ctx.currentTime;
    const { gain } = this.#out(volume, pan);
    const n = this.#noiseSource();
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 900;
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(1, at);
    env.gain.exponentialRampToValueAtTime(0.0001, at + 0.12);
    n.connect(hp).connect(env).connect(gain);
    n.start(at);
    n.stop(at + 0.15);
  }

  /** Gota caindo. */
  drip(volume = 0.5, pan = 0) {
    if (!this.ready || volume <= 0.01) return;
    const at = this.ctx.currentTime;
    const { gain } = this.#out(volume, pan);
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1500, at);
    osc.frequency.exponentialRampToValueAtTime(500, at + 0.08);
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(0.6, at + 0.005);
    env.gain.exponentialRampToValueAtTime(0.0001, at + 0.12);
    osc.connect(env).connect(gain);
    osc.start(at);
    osc.stop(at + 0.14);
  }

  /** Clique de tranca/destrancar. */
  lockClick(volume = 0.8, pan = 0) {
    if (!this.ready) return;
    const at = this.ctx.currentTime;
    this.#thump(at, { freq: 900, dur: 0.04, volume: volume * 0.5, pan, noise: 0.8 });
    this.#thump(at + 0.09, { freq: 600, dur: 0.06, volume, pan, noise: 0.9 });
  }

  /** Chiado contínuo (TV). Devolve { setVolume(v, pan), stop() }. */
  staticLoop(volume = 0.4) {
    if (!this.ready) return { setVolume() {}, stop() {} };
    const { gain, panner } = this.#out(volume);
    const n = this.#noiseSource();
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 3000;
    bp.Q.value = 0.4;
    n.connect(bp).connect(gain);
    n.start();
    return {
      setVolume: (v, pan = 0) => {
        gain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
        panner.pan.setTargetAtTime(Math.max(-1, Math.min(1, pan)), this.ctx.currentTime, 0.05);
      },
      stop: () => {
        gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.02);
        n.stop(this.ctx.currentTime + 0.1);
      },
    };
  }

  /** Telefone antigo tocando (campainha), em ciclos. Devolve { setVolume(v, pan), stop() }. */
  phoneRing(volume = 0.5) {
    if (!this.ready) return { setVolume() {}, stop() {} };
    const { gain, panner } = this.#out(volume);
    const ring = this.ctx.createGain();
    ring.gain.value = 0;
    ring.connect(gain);
    // Campainha: dois tons batendo, liga e desliga rápido (sino), 1 s tocando / 2 s parado
    const oscs = [880, 1040].map((f) => {
      const o = this.ctx.createOscillator();
      o.type = 'square';
      o.frequency.value = f;
      const g = this.ctx.createGain();
      g.gain.value = 0.08;
      o.connect(g).connect(ring);
      o.start();
      return o;
    });
    const t0 = this.ctx.currentTime + 0.05;
    for (let cycle = 0; cycle < 20; cycle++) {
      const start = t0 + cycle * 3;
      for (let k = 0; k < 20; k++) {
        const t = start + k * 0.05;
        ring.gain.setValueAtTime(k % 2 ? 0 : 1, t);
      }
      ring.gain.setValueAtTime(0, start + 1);
    }
    return {
      setVolume: (v, pan = 0) => {
        gain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
        panner.pan.setTargetAtTime(Math.max(-1, Math.min(1, pan)), this.ctx.currentTime, 0.05);
      },
      stop: () => {
        gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.01);
        oscs.forEach((o) => o.stop(this.ctx.currentTime + 0.1));
      },
    };
  }
}

export const sfx = new Sfx();

/** Volume e lado de um som pela posição em relação ao Artur (m). */
export function positional(listener, source, maxDist = 10) {
  const dx = source.x - listener.x;
  const d = Math.hypot(dx, source.y - listener.y);
  return {
    volume: Math.max(0, 1 - d / maxDist),
    pan: Math.max(-1, Math.min(1, dx / 6)),
  };
}
