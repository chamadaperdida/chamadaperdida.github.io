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

  /**
   * Ruído filtrado com envelope curto: a base dos sons de impacto (passo, estouro, respingo).
   * filter: { type, freq, q } · attack/decay em segundos.
   */
  #burst(at, out, { filter, attack = 0.002, decay = 0.08, level = 1 }) {
    const n = this.#noiseSource();
    const f = this.ctx.createBiquadFilter();
    f.type = filter.type;
    f.frequency.value = filter.freq;
    f.Q.value = filter.q ?? 0.7;
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(level, at + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay);
    n.connect(f).connect(env).connect(out);
    n.start(at);
    n.stop(at + attack + decay + 0.02);
  }

  /** Um passo pesado no piso de madeira: calcanhar + ponta do pé, madeira estalando. */
  #footstep(at, volume, pan) {
    // Ruído filtrado perde muita energia: ganho extra para ficar no volume dos outros sons
    const { gain } = this.#out(volume * 6, pan);
    const jitter = 0.85 + Math.random() * 0.3;
    // Calcanhar: batida abafada no taco (grave, sem "tom" de tambor)
    this.#burst(at, gain, { filter: { type: 'lowpass', freq: 260 * jitter, q: 0.9 }, decay: 0.07, level: 1 });
    // Madeira cedendo: corpo médio curtinho
    this.#burst(at + 0.004, gain, { filter: { type: 'bandpass', freq: 520 * jitter, q: 2.5 }, decay: 0.045, level: 0.35 });
    // Ponta do pé, logo depois e mais fraca
    const toe = at + 0.06 + Math.random() * 0.02;
    this.#burst(toe, gain, { filter: { type: 'lowpass', freq: 340 * jitter, q: 0.8 }, decay: 0.05, level: 0.45 });
    // Arrasto da sola (bem baixinho)
    this.#burst(toe, gain, { filter: { type: 'highpass', freq: 2500, q: 0.5 }, attack: 0.01, decay: 0.05, level: 0.06 });
  }

  /** Passos pesados correndo (passos falsos / Artur distorcido), passando de um lado ao outro. */
  heavySteps(seconds = 2.6, panFrom = -0.8, panTo = 0.8, volume = 0.9) {
    if (!this.ready) return;
    const t0 = this.ctx.currentTime + 0.05;
    let t = 0;
    while (t < seconds) {
      const k = t / seconds;
      // Mais alto no meio (passa perto), mais baixo nas pontas
      const v = volume * (0.35 + 0.65 * Math.sin(Math.PI * k));
      this.#footstep(t0 + t, v, panFrom + (panTo - panFrom) * k);
      t += 0.3 + Math.random() * 0.05; // ritmo irregular de alguém correndo pesado
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

  /** Estouro de balão: estalo seco e curtíssimo, com um "tapa" de borracha. */
  pop(volume = 0.8, pan = 0) {
    if (!this.ready) return;
    const at = this.ctx.currentTime;
    const { gain } = this.#out(volume * 1.8, pan);
    // Estalo: ruído de banda larga, ataque instantâneo, some em ~25 ms
    this.#burst(at, gain, { filter: { type: 'bandpass', freq: 1800, q: 0.5 }, attack: 0.0005, decay: 0.025, level: 1 });
    // Corpo do estouro (ar saindo de uma vez)
    this.#burst(at, gain, { filter: { type: 'lowpass', freq: 700, q: 0.7 }, attack: 0.001, decay: 0.06, level: 0.5 });
    // Borracha batendo (bem curto, agudo)
    this.#burst(at + 0.02, gain, { filter: { type: 'highpass', freq: 3500, q: 0.7 }, attack: 0.001, decay: 0.03, level: 0.15 });
  }

  /** Gota caindo numa poça: "plim" de bolha (tom subindo) + respingo + eco do cômodo. */
  drip(volume = 0.5, pan = 0) {
    if (!this.ready || volume <= 0.01) return;
    const at = this.ctx.currentTime;
    const { gain } = this.#out(volume, pan);
    // Eco curto, como num cômodo vazio
    const delay = this.ctx.createDelay();
    delay.delayTime.value = 0.07;
    const fb = this.ctx.createGain();
    fb.gain.value = 0.25;
    const wet = this.ctx.createGain();
    wet.gain.value = 0.35;
    delay.connect(fb).connect(delay);
    delay.connect(wet).connect(gain);
    // Bolha: a frequência SOBE rápido (é isso que dá o som de gota)
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    const f0 = 700 + Math.random() * 250;
    osc.frequency.setValueAtTime(f0, at);
    osc.frequency.exponentialRampToValueAtTime(f0 * 2.2, at + 0.035);
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(0.5, at + 0.003);
    env.gain.exponentialRampToValueAtTime(0.0001, at + 0.06);
    osc.connect(env);
    env.connect(gain);
    env.connect(delay);
    osc.start(at);
    osc.stop(at + 0.08);
    // Respingo baixinho
    this.#burst(at, gain, { filter: { type: 'highpass', freq: 4000, q: 0.6 }, attack: 0.001, decay: 0.02, level: 0.12 });
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
