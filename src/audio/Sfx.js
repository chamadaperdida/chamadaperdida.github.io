// Efeitos sonoros gerados por código (Web Audio). Versão básica para as alucinações
// funcionarem; a etapa 11 refina o som e adiciona ambiente, chuva, vozes etc.
//
// O navegador só libera áudio depois de uma tecla ou clique: o contexto liga sozinho
// no primeiro toque do jogador.
//
// Volumes (opções, GDD 2.1): geral → { ambiente, efeitos }. Os sons de ambiente (chuva,
// telefone ao longe da tela inicial) vão para o canal do ambiente; o resto, para os efeitos.
// Pausa (GDD 2.4): o contexto de áudio inteiro congela e volta de onde parou.

import { options } from '../systems/Save.js';

const MASTER_LEVEL = 0.7;

class Sfx {
  constructor() {
    this.ctx = null;
    this.paused = false;
    this.volumes = options.load();
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
      this.master.connect(this.ctx.destination);
      this.effects = this.ctx.createGain();
      this.effects.connect(this.master);
      this.ambient = this.ctx.createGain();
      this.ambient.connect(this.master);
      this.#applyVolumes();
      // 2 s de ruído branco, reaproveitado por todos os sons
      const len = this.ctx.sampleRate * 2;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended' && !this.paused) this.ctx.resume();
    return this.ctx;
  }

  get ready() {
    return !!this.#ensure() && this.ctx.state === 'running';
  }

  /** Volumes das opções: { master, ambient, effects } de 0 a 1. */
  setVolumes(v) {
    this.volumes = { ...this.volumes, ...v };
    if (this.ctx) this.#applyVolumes();
  }

  #applyVolumes() {
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(MASTER_LEVEL * this.volumes.master, t, 0.02);
    this.effects.gain.setTargetAtTime(this.volumes.effects, t, 0.02);
    this.ambient.gain.setTargetAtTime(this.volumes.ambient, t, 0.02);
  }

  /** Congela todo o som do jogo (pausa). */
  pause() {
    this.paused = true;
    if (this.ctx?.state === 'running') this.ctx.suspend();
  }

  resume() {
    this.paused = false;
    if (this.ctx?.state === 'suspended') this.ctx.resume();
  }

  /** Saída com volume e lado (pan −1 esquerda … 1 direita). */
  #out(volume = 1, pan = 0, bus = this.effects) {
    const gain = this.ctx.createGain();
    gain.gain.value = volume;
    const panner = this.ctx.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    gain.connect(panner).connect(bus);
    return { gain, panner };
  }

  // ---- Ambiente (tela inicial) ------------------------------------------------

  /** Chuva contínua (ruído filtrado, com intensidade oscilando devagar). */
  rainLoop(volume = 0.5) {
    if (!this.ready) return this.#silentHandle();
    const { gain, panner } = this.#out(volume, 0, this.ambient);
    const layers = [
      { type: 'lowpass', freq: 900, q: 0.4, level: 0.9 },
      { type: 'bandpass', freq: 2400, q: 0.6, level: 0.35 },
      { type: 'highpass', freq: 6000, q: 0.5, level: 0.12 },
    ];
    const nodes = [];
    for (const l of layers) {
      const n = this.#noiseSource();
      const f = this.ctx.createBiquadFilter();
      f.type = l.type;
      f.frequency.value = l.freq;
      f.Q.value = l.q;
      const g = this.ctx.createGain();
      g.gain.value = l.level;
      n.connect(f).connect(g).connect(gain);
      n.start();
      nodes.push(n);
    }
    // Rajadas: a chuva engrossa e afina devagar
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const depth = this.ctx.createGain();
    depth.gain.value = volume * 0.3;
    lfo.connect(depth).connect(gain.gain);
    lfo.start();
    nodes.push(lfo);
    return this.#loopHandle(gain, panner, nodes);
  }

  /** Um telefone antigo tocando três vezes, ao longe (abafado, com eco). */
  distantRing(volume = 0.25, pan = 0) {
    if (!this.ready) return;
    const { gain } = this.#out(volume, pan, this.ambient);
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1100;
    const ring = this.ctx.createGain();
    ring.gain.value = 0;
    ring.connect(lp).connect(gain);
    // Eco de corredor
    const delay = this.ctx.createDelay();
    delay.delayTime.value = 0.23;
    const fb = this.ctx.createGain();
    fb.gain.value = 0.35;
    lp.connect(delay).connect(fb).connect(delay);
    fb.connect(gain);
    const t0 = this.ctx.currentTime + 0.05;
    const end = t0 + 3 * 3;
    for (const f of [880, 1040]) {
      const o = this.ctx.createOscillator();
      o.type = 'square';
      o.frequency.value = f;
      const g = this.ctx.createGain();
      g.gain.value = 0.08;
      o.connect(g).connect(ring);
      o.start(t0);
      o.stop(end);
    }
    for (let cycle = 0; cycle < 3; cycle++) {
      const start = t0 + cycle * 3;
      for (let k = 0; k < 20; k++) ring.gain.setValueAtTime(k % 2 ? 0 : 1, start + k * 0.05);
      ring.gain.setValueAtTime(0, start + 1);
    }
    return { stop: () => gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05) };
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
  #footstep(at, volume, pan, pitch = 1) {
    // Ruído filtrado perde muita energia: ganho extra para ficar no volume dos outros sons
    const { gain } = this.#out(volume * 6, pan);
    const jitter = (0.85 + Math.random() * 0.3) * pitch;
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

  /** Uma batida do coração (tum-tum). period = tempo até a próxima batida (s). */
  heartBeat(volume = 0.6, period = 0.8) {
    if (!this.ready) return;
    const t = this.ctx.currentTime + 0.01;
    const gap = Math.min(0.2, period * 0.32);
    this.#thump(t, { freq: 48, dur: 0.14, volume, noise: 0.2 });
    this.#thump(t + gap, { freq: 42, dur: 0.16, volume: volume * 0.72, noise: 0.2 });
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

  /** Nota curta de caixinha de música (urso coletado): duas notas suaves, sem melodia conhecida. */
  musicBox(volume = 0.35) {
    if (!this.ready) return;
    const at = this.ctx.currentTime + 0.01;
    const { gain } = this.#out(volume);
    for (const [freq, delay] of [
      [1318.5, 0],
      [1046.5, 0.22],
    ]) {
      for (const [mult, level] of [
        [1, 1],
        [3, 0.18],
      ]) {
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq * mult;
        const env = this.ctx.createGain();
        env.gain.setValueAtTime(0.0001, at + delay);
        env.gain.exponentialRampToValueAtTime(level, at + delay + 0.005);
        env.gain.exponentialRampToValueAtTime(0.0001, at + delay + 1.1);
        osc.connect(env).connect(gain);
        osc.start(at + delay);
        osc.stop(at + delay + 1.2);
      }
    }
  }

  /** Bipe de aparelho (micro-ondas, máquina de lavar terminou). */
  beep(times = 3, volume = 0.25, pan = 0) {
    if (!this.ready) return;
    const at = this.ctx.currentTime + 0.01;
    const { gain } = this.#out(volume, pan);
    for (let i = 0; i < times; i++) {
      const osc = this.ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = 1900;
      const env = this.ctx.createGain();
      const t = at + i * 0.32;
      env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(0.4, t + 0.005);
      env.gain.setValueAtTime(0.4, t + 0.16);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      osc.connect(env).connect(gain);
      osc.start(t);
      osc.stop(t + 0.2);
    }
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

  // ---- Monstros (etapa 6) — provisórios até a etapa 11 -----------------------

  /** Um passo avulso (ex.: Artur distorcido se aproximando). heavy = mais grave e forte. */
  step(volume = 0.6, pan = 0, heavy = false) {
    if (!this.ready || volume <= 0.01) return;
    this.#footstep(this.ctx.currentTime, volume * (heavy ? 1.4 : 1), pan, heavy ? 0.7 : 1);
  }

  /**
   * Chaveiro tilintando (Invasor, GDD 6): várias chaves batendo umas nas outras, metálico e
   * agudo. Toca um "chacoalhar" curto; o Invasor chama a cada passo.
   */
  keyJingle(volume = 0.5, pan = 0) {
    if (!this.ready || volume <= 0.01) return;
    const { gain } = this.#out(volume * 0.5, pan);
    const at = this.ctx.currentTime;
    const clinks = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < clinks; i++) {
      const t = at + i * (0.025 + Math.random() * 0.035);
      // Metal: parciais inarmônicas agudas, decaimento curto e diferente em cada uma
      const base = 2600 + Math.random() * 2200;
      for (const [ratio, level, decay] of [
        [1, 0.5, 0.12],
        [1.47, 0.3, 0.08],
        [2.09, 0.2, 0.05],
      ]) {
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = base * ratio;
        const env = this.ctx.createGain();
        env.gain.setValueAtTime(0.0001, t);
        env.gain.exponentialRampToValueAtTime(level, t + 0.002);
        env.gain.exponentialRampToValueAtTime(0.0001, t + decay);
        osc.connect(env).connect(gain);
        osc.start(t);
        osc.stop(t + decay + 0.02);
      }
      // Batida das chaves (ruído bem agudo, curtinho)
      this.#burst(t, gain, { filter: { type: 'highpass', freq: 5000, q: 0.7 }, attack: 0.0005, decay: 0.012, level: 0.6 });
    }
  }

  /**
   * Sussurro do Artur, distorcido (Artur distorcido, GDD 6). Contínuo: frases sussurradas
   * (sílabas de ruído com formantes de vogal) com pausas, tom de voz masculina sem voz
   * (só ar) e uma modulação que deixa tudo "errado". Devolve { setVolume(v, pan), stop() }.
   */
  whisperLoop() {
    if (!this.ready) return this.#silentHandle();
    const { gain, panner } = this.#out(0);
    const n = this.#noiseSource();
    // Formantes de vogais (voz masculina): a cada sílaba, uma vogal diferente
    const VOWELS = [
      [730, 1090],
      [530, 1840],
      [270, 2290],
      [570, 840],
      [300, 870],
    ];
    const f1 = this.ctx.createBiquadFilter();
    f1.type = 'bandpass';
    f1.Q.value = 6;
    const f2 = this.ctx.createBiquadFilter();
    f2.type = 'bandpass';
    f2.Q.value = 8;
    // Chiado do "s" e do "f" do sussurro
    const hiss = this.ctx.createBiquadFilter();
    hiss.type = 'highpass';
    hiss.frequency.value = 4500;
    const syll = this.ctx.createGain();
    syll.gain.value = 0;
    const hissGain = this.ctx.createGain();
    hissGain.gain.value = 0;
    // Modulação em anel lenta e grave: a voz parece vir "de dentro", deformada
    const ring = this.ctx.createGain();
    ring.gain.value = 0.6;
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 38;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.4;
    lfo.connect(lfoGain).connect(ring.gain);
    n.connect(f1).connect(syll);
    n.connect(f2).connect(syll);
    n.connect(hiss).connect(hissGain);
    syll.connect(ring);
    hissGain.connect(ring);
    // Ganho alto: ruído em filtro estreito perde muita energia
    const makeup = this.ctx.createGain();
    makeup.gain.value = 9;
    ring.connect(makeup).connect(gain);
    // Eco curto, como num corredor
    const delay = this.ctx.createDelay();
    delay.delayTime.value = 0.17;
    const fb = this.ctx.createGain();
    fb.gain.value = 0.25;
    makeup.connect(delay).connect(fb).connect(delay);
    fb.connect(gain);

    // Frases: 3 a 7 sílabas, pausas de 0,6 a 1,6 s (agendado para ~60 s)
    const t0 = this.ctx.currentTime + 0.1;
    let t = 0;
    while (t < 60) {
      const count = 3 + Math.floor(Math.random() * 5);
      for (let k = 0; k < count; k++) {
        const at = t0 + t;
        const [a, b] = VOWELS[Math.floor(Math.random() * VOWELS.length)];
        const shift = 0.9 + Math.random() * 0.2;
        f1.frequency.setValueAtTime(a * shift, at);
        f2.frequency.setValueAtTime(b * shift, at);
        const len = 0.12 + Math.random() * 0.12;
        syll.gain.setValueAtTime(0, at);
        syll.gain.linearRampToValueAtTime(1, at + 0.03);
        syll.gain.linearRampToValueAtTime(0, at + len);
        // Às vezes uma consoante sibilante antes da vogal
        if (Math.random() < 0.4) {
          hissGain.gain.setValueAtTime(0, at - 0.06);
          hissGain.gain.linearRampToValueAtTime(0.05, at - 0.03);
          hissGain.gain.linearRampToValueAtTime(0, at);
        }
        t += len + 0.03 + Math.random() * 0.05;
      }
      t += 0.6 + Math.random() * 1.0;
    }
    n.start();
    lfo.start();
    return this.#loopHandle(gain, panner, [n, lfo]);
  }

  /**
   * Som de digitação da caixa de diálogo (um a cada poucas letras).
   * voice: { kind: 'voice' | 'paper' | 'fx', freq (Hz, só voz), wave } · glitch: voz distorcida.
   */
  textBlip(voice, glitch = false, volume = 0.12) {
    if (!this.ready) return;
    const at = this.ctx.currentTime;
    const { gain } = this.#out(volume);
    if (voice.kind === 'paper') {
      // Caneta/papel: raspadinha aguda
      this.#burst(at, gain, { filter: { type: 'bandpass', freq: 3200 + Math.random() * 800, q: 1.5 }, decay: 0.03, level: 3 });
      return;
    }
    if (voice.kind === 'fx') {
      // Efeito/ação: tique abafado
      this.#burst(at, gain, { filter: { type: 'lowpass', freq: 900, q: 0.7 }, decay: 0.025, level: 2 });
      return;
    }
    const osc = this.ctx.createOscillator();
    osc.type = voice.wave ?? 'square';
    // Cada letra varia um pouco; distorcida: tom oscilando bem mais
    const spread = glitch ? 0.35 : 0.06;
    const f = voice.freq * (1 + (Math.random() * 2 - 1) * spread);
    osc.frequency.setValueAtTime(f, at);
    if (glitch && Math.random() < 0.4) osc.frequency.exponentialRampToValueAtTime(f * 0.6, at + 0.05);
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1800;
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(0.5, at + 0.005);
    env.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);
    osc.connect(lp).connect(env).connect(gain);
    osc.start(at);
    osc.stop(at + 0.06);
  }

  /** Estalos secos (Clara correndo de quatro). */
  cracks(volume = 0.5, pan = 0) {
    if (!this.ready) return;
    const { gain } = this.#out(volume * 4, pan);
    const at = this.ctx.currentTime;
    for (let i = 0; i < 2; i++) {
      this.#burst(at + i * 0.04 + Math.random() * 0.02, gain, {
        filter: { type: 'bandpass', freq: 2500 + Math.random() * 1500, q: 3 },
        attack: 0.0005,
        decay: 0.015,
        level: 1,
      });
    }
  }

  /** Corta todo o som por um instante (início do jumpscare, GDD 13.6). */
  cutFor(seconds) {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(0, t);
    this.master.gain.setValueAtTime(MASTER_LEVEL * this.volumes.master, t + seconds);
  }

  /** Voz "sintética" com formantes (base da risada e do choro). Devolve nós para controlar. */
  #voice(baseFreq, formants) {
    const src = this.ctx.createOscillator();
    src.type = 'sawtooth';
    src.frequency.value = baseFreq;
    const vib = this.ctx.createOscillator();
    vib.frequency.value = 6;
    const vibGain = this.ctx.createGain();
    vibGain.gain.value = baseFreq * 0.04;
    vib.connect(vibGain).connect(src.frequency);
    const sum = this.ctx.createGain();
    sum.gain.value = 0;
    for (const [f, q, g] of formants) {
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = f;
      bp.Q.value = q;
      const fg = this.ctx.createGain();
      fg.gain.value = g;
      src.connect(bp).connect(fg).connect(sum);
    }
    src.start();
    vib.start();
    return { src, vib, sum };
  }

  #loopHandle(gain, panner, stopNodes, onStop) {
    return {
      setVolume: (v, pan = 0) => {
        gain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
        panner.pan.setTargetAtTime(Math.max(-1, Math.min(1, pan)), this.ctx.currentTime, 0.05);
      },
      stop: () => {
        gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.03);
        const at = this.ctx.currentTime + 0.2;
        stopNodes.forEach((n) => n.stop(at));
        onStop?.();
      },
    };
  }

  #silentHandle() {
    return { setVolume() {}, stop() {} };
  }

  /**
   * Risadas de criança, distorcidas (Clara). Toca por `seconds` e para sozinha.
   * Sílabas "hi-hi-hi" curtas, agudas, com distorção e eco.
   */
  laugh(seconds = 5, volume = 0.6, pan = 0) {
    if (!this.ready) return this.#silentHandle();
    const { gain, panner } = this.#out(volume, pan);
    const v = this.#voice(520, [
      [900, 6, 1],
      [2600, 8, 0.6],
    ]);
    // Distorção leve ("diabólica")
    const shaper = this.ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i / 128) - 1;
      curve[i] = Math.tanh(3 * x);
    }
    shaper.curve = curve;
    const delay = this.ctx.createDelay();
    delay.delayTime.value = 0.11;
    const fb = this.ctx.createGain();
    fb.gain.value = 0.3;
    v.sum.connect(shaper).connect(gain);
    shaper.connect(delay).connect(fb).connect(delay);
    fb.connect(gain);
    // Sílabas: rajadas de risada com pausas
    const t0 = this.ctx.currentTime + 0.05;
    let t = 0;
    while (t < seconds - 0.2) {
      const burst = 3 + Math.floor(Math.random() * 4);
      for (let k = 0; k < burst && t < seconds - 0.2; k++) {
        const at = t0 + t;
        const pitch = 480 + Math.random() * 200 + k * 25;
        v.src.frequency.setValueAtTime(pitch, at);
        v.src.frequency.linearRampToValueAtTime(pitch * 0.85, at + 0.1);
        v.sum.gain.setValueAtTime(0, at);
        v.sum.gain.linearRampToValueAtTime(1.6, at + 0.015);
        v.sum.gain.linearRampToValueAtTime(0, at + 0.11);
        t += 0.14 + Math.random() * 0.04;
      }
      t += 0.25 + Math.random() * 0.35;
    }
    const end = t0 + seconds;
    v.src.stop(end + 0.3);
    v.vib.stop(end + 0.3);
    return this.#loopHandle(gain, panner, [], null);
  }

  /** Choro (Helena). Contínuo; o volume acompanha o quanto ela já surgiu. */
  cryLoop() {
    if (!this.ready) return this.#silentHandle();
    const { gain, panner } = this.#out(0);
    const v = this.#voice(330, [
      [700, 5, 1],
      [1150, 6, 0.7],
    ]);
    v.sum.connect(gain);
    // Soluços: o volume e o tom sobem e caem em ondas
    const t0 = this.ctx.currentTime + 0.05;
    for (let i = 0; i < 40; i++) {
      const at = t0 + i * 1.3;
      v.src.frequency.setValueAtTime(380, at);
      v.src.frequency.exponentialRampToValueAtTime(260, at + 1.1);
      v.sum.gain.setValueAtTime(0.05, at);
      v.sum.gain.linearRampToValueAtTime(1.2, at + 0.15);
      v.sum.gain.linearRampToValueAtTime(0.3, at + 0.9);
      v.sum.gain.linearRampToValueAtTime(0.05, at + 1.2);
    }
    // Respiração entre os soluços
    const n = this.#noiseSource();
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1400;
    bp.Q.value = 0.8;
    const ng = this.ctx.createGain();
    ng.gain.value = 0.08;
    n.connect(bp).connect(ng).connect(gain);
    n.start();
    return this.#loopHandle(gain, panner, [v.src, v.vib, n]);
  }

  /** Perseguição: coração forte + respiração ofegante de Artur, em loop. */
  /** Perseguição: respiração ofegante (e o coração, se withHeart). */
  chaseLoop(volume = 0.8, withHeart = true) {
    if (!this.ready) return this.#silentHandle();
    const { gain, panner } = this.#out(volume);
    // Respiração ofegante: ruído filtrado entrando e saindo rápido
    const n = this.#noiseSource();
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1100;
    bp.Q.value = 0.9;
    const breath = this.ctx.createGain();
    breath.gain.value = 0;
    n.connect(bp).connect(breath).connect(gain);
    n.start();
    const t0 = this.ctx.currentTime + 0.05;
    for (let i = 0; i < 160; i++) {
      const at = t0 + i * 0.42;
      const inhale = i % 2 === 0;
      breath.gain.setValueAtTime(0, at);
      breath.gain.linearRampToValueAtTime(inhale ? 0.25 : 0.35, at + 0.08);
      breath.gain.linearRampToValueAtTime(0, at + (inhale ? 0.3 : 0.36));
    }
    // Coração forte e rápido (a casa usa o coração contínuo, Heart.js, e desliga este)
    const beats = [];
    if (withHeart) for (let i = 0; i < 120; i++) beats.push(t0 + i * 0.55);
    const heart = this.ctx.createGain();
    heart.gain.value = 1;
    heart.connect(gain);
    beats.forEach((at) => {
      this.#thumpTo(at, heart, 50, 0.14, 0.9);
      this.#thumpTo(at + 0.17, heart, 44, 0.16, 0.65);
    });
    return this.#loopHandle(gain, panner, [n], () => heart.disconnect());
  }

  #thumpTo(at, out, freq, dur, level) {
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(level, at + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    env.connect(out);
    const osc = this.ctx.createOscillator();
    osc.frequency.setValueAtTime(freq * 1.6, at);
    osc.frequency.exponentialRampToValueAtTime(freq, at + dur * 0.6);
    osc.connect(env);
    osc.start(at);
    osc.stop(at + dur + 0.02);
  }

  /** Grito do jumpscare (~1 s): ruído rasgado + vozes desafinadas subindo. */
  scream(volume = 0.9) {
    if (!this.ready) return;
    const at = this.ctx.currentTime;
    const { gain } = this.#out(volume);
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(1, at + 0.03);
    env.gain.setValueAtTime(1, at + 0.8);
    env.gain.exponentialRampToValueAtTime(0.0001, at + 1.2);
    env.connect(gain);
    const shaper = this.ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) curve[i] = Math.tanh(5 * ((i / 128) - 1));
    shaper.curve = curve;
    shaper.connect(env);
    for (const [f, detune] of [
      [420, 0],
      [437, 30],
      [630, -20],
      [890, 15],
    ]) {
      const o = this.ctx.createOscillator();
      o.type = 'sawtooth';
      o.detune.value = detune;
      o.frequency.setValueAtTime(f, at);
      o.frequency.exponentialRampToValueAtTime(f * 1.9, at + 0.9);
      const og = this.ctx.createGain();
      og.gain.value = 0.18;
      o.connect(og).connect(shaper);
      o.start(at);
      o.stop(at + 1.25);
    }
    this.#burst(at, env, { filter: { type: 'bandpass', freq: 2200, q: 0.5 }, attack: 0.01, decay: 1.1, level: 0.6 });
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
