// Sons da casa e da delegacia (GDD 14.1 e 14.2), gerados por código com as peças do Sfx:
// ambiente (chuva + ruído; chuva na janela + lâmpada fluorescente), tarefas, portas, passos,
// respiração, itens, gerador, lanterna, TV e os sussurros do sono.
//
// Todos os sons de um disparo recebem (volume, pan). Os contínuos devolvem um "handle"
// { setVolume(v, pan), stop() } (alguns com controles extras).

import { sfx } from './Sfx.js';

const rnd = (a, b) => a + Math.random() * (b - a);

// ---- Peças pequenas ----------------------------------------------------------------------

/** Tom curto com decaimento (louça, metal, cliques). */
function ping(at, out, freq, decay, level = 0.3, type = 'sine') {
  const ctx = sfx.ctx;
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(level, at + 0.002);
  env.gain.exponentialRampToValueAtTime(0.0001, at + decay);
  o.connect(env).connect(out);
  o.start(at);
  o.stop(at + decay + 0.02);
}

/** Ruído contínuo passando por filtros (cada um com seu nível). Devolve os nós para parar. */
function noiseInto(out, layers) {
  const ctx = sfx.ctx;
  return layers.map(({ type, freq, q = 0.7, level = 1 }) => {
    const n = sfx.noiseSource();
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.value = level;
    n.connect(f).connect(g).connect(out);
    n.start();
    return n;
  });
}

/** Oscilador lento que mexe num parâmetro (ondulação). */
function lfo(param, rate, depth) {
  const ctx = sfx.ctx;
  const o = ctx.createOscillator();
  o.frequency.value = rate;
  const g = ctx.createGain();
  g.gain.value = depth;
  o.connect(g).connect(param);
  o.start();
  return o;
}

/** Sequência de estalinhos de ruído (papel, plástico, vime): n estalos em `seconds`. */
function crackle(at, out, n, seconds, { lo, hi, q = 1.5, decay = [0.01, 0.04], level = 0.6 }) {
  for (let i = 0; i < n; i++) {
    sfx.burst(at + Math.random() * seconds, out, {
      filter: { type: 'bandpass', freq: rnd(lo, hi), q },
      attack: 0.001,
      decay: rnd(decay[0], decay[1]),
      level: level * rnd(0.5, 1),
    });
  }
}

class Foley {
  get ok() {
    return sfx.ready;
  }

  #out(volume, pan = 0, bus = 'effects') {
    return sfx.out(volume, pan, bus).gain;
  }

  // ---- Ambiente ----------------------------------------------------------------------

  /**
   * Casa (GDD 14.1): chuva + ruído branco, o tempo todo. Dentro de casa a chuva chega
   * abafada; nas áreas externas, aberta e mais alta. Handle: setOutdoors(true/false), stop().
   */
  houseAmbience() {
    if (!this.ok) return { setOutdoors() {}, stop() {} };
    const ctx = sfx.ctx;
    const { gain, panner } = sfx.out(0, 0, 'ambient');
    const muffle = ctx.createBiquadFilter();
    muffle.type = 'lowpass';
    muffle.frequency.value = 900;
    muffle.connect(gain);
    const rain = ctx.createGain();
    rain.gain.value = 1;
    rain.connect(muffle);
    const nodes = noiseInto(rain, [
      { type: 'lowpass', freq: 900, q: 0.4, level: 0.9 },
      { type: 'bandpass', freq: 2400, q: 0.6, level: 0.35 },
      { type: 'highpass', freq: 6000, q: 0.5, level: 0.15 },
    ]);
    nodes.push(lfo(rain.gain, 0.07, 0.25)); // rajadas
    // Ruído branco baixinho por baixo de tudo (não passa pelo abafador)
    nodes.push(...noiseInto(gain, [{ type: 'highpass', freq: 200, q: 0.5, level: 0.04 }]));
    gain.gain.setTargetAtTime(0.4, ctx.currentTime, 0.8);
    const handle = sfx.loopHandle(gain, panner, nodes);
    let outdoors = null;
    handle.setOutdoors = (on) => {
      if (on === outdoors) return;
      outdoors = on;
      const t = ctx.currentTime;
      muffle.frequency.setTargetAtTime(on ? 7000 : 900, t, 0.25);
      gain.gain.setTargetAtTime(on ? 0.6 : 0.4, t, 0.25);
    };
    return handle;
  }

  /**
   * Delegacia (GDD 14.1): chuva na janela e o zumbido da lâmpada fluorescente.
   * Handle: setHum(0–1) (a lâmpada apaga nas piscadas), stop().
   */
  officeAmbience() {
    if (!this.ok) return { setHum() {}, stop() {} };
    const ctx = sfx.ctx;
    const { gain, panner } = sfx.out(0.35, 0, 'ambient');
    // Chuva batendo no vidro: abafada, com gotas mais agudas por cima
    const rain = ctx.createGain();
    rain.gain.value = 0.8;
    rain.connect(gain);
    const nodes = noiseInto(rain, [
      { type: 'lowpass', freq: 700, q: 0.5, level: 0.8 },
      { type: 'bandpass', freq: 3200, q: 1.2, level: 0.12 },
    ]);
    nodes.push(lfo(rain.gain, 0.05, 0.2));
    // Zumbido: 120 Hz e harmônicos, ásperos
    const hum = ctx.createGain();
    hum.gain.value = 0.05;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1400;
    hum.connect(lp).connect(gain);
    for (const [f, level] of [
      [120, 1],
      [240, 0.5],
      [360, 0.25],
    ]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = level;
      o.connect(g).connect(hum);
      o.start();
      nodes.push(o);
    }
    const handle = sfx.loopHandle(gain, panner, nodes);
    handle.setHum = (k) => hum.gain.setTargetAtTime(0.05 * k, ctx.currentTime, 0.01);
    return handle;
  }

  // ---- Passos e respiração -------------------------------------------------------------

  /** Passo do Artur: 'wood' (taco), 'tile' (azulejo/cozinha/concreto) ou 'mud' (lama). */
  footstep(surface, volume = 0.2, pan = 0) {
    if (!this.ok) return;
    const at = sfx.now;
    if (surface === 'mud') {
      const out = this.#out(volume * 5, pan);
      sfx.burst(at, out, { filter: { type: 'lowpass', freq: 380, q: 1.2 }, attack: 0.02, decay: 0.12, level: 1 });
      sfx.burst(at + 0.03, out, { filter: { type: 'bandpass', freq: 1200, q: 2 }, attack: 0.01, decay: 0.08, level: 0.3 });
      return;
    }
    if (surface === 'tile') {
      sfx.footstepAt(at, volume * 0.8, pan, 1.5);
      sfx.burst(at, this.#out(volume * 3, pan), { filter: { type: 'highpass', freq: 3000 }, decay: 0.02, level: 0.25 });
      return;
    }
    sfx.footstepAt(at, volume, pan, 1);
  }

  /** Respiração ofegante (estamina esgotada). Handle com setVolume/stop. */
  breathLoop() {
    if (!this.ok) return sfx.silentHandle();
    const ctx = sfx.ctx;
    const { gain, panner } = sfx.out(0);
    const breath = ctx.createGain();
    breath.gain.value = 0;
    breath.connect(gain);
    const nodes = noiseInto(breath, [
      { type: 'bandpass', freq: 1100, q: 1.2, level: 1.4 },
      { type: 'bandpass', freq: 2600, q: 2, level: 0.4 },
    ]);
    // Puxa e solta o ar ~1,4 vez por segundo
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = 1.4;
    const shape = ctx.createWaveShaper();
    shape.curve = new Float32Array([0, 0, 0.1, 1]);
    o.connect(shape).connect(breath.gain);
    o.start();
    nodes.push(o);
    gain.gain.setTargetAtTime(0.35, ctx.currentTime, 0.4);
    return sfx.loopHandle(gain, panner, nodes);
  }

  // ---- Portas ------------------------------------------------------------------------

  doorOpen(volume = 0.4, pan = 0) {
    if (!this.ok) return;
    const at = sfx.now;
    const out = this.#out(volume, pan);
    sfx.thump(at, { freq: 1300, dur: 0.03, volume: volume * 0.4, pan, noise: 0.9 }); // trinco
    this.#creak(at + 0.05, out, 0.5);
  }

  doorClose(volume = 0.45, pan = 0) {
    if (!this.ok) return;
    const at = sfx.now;
    this.#creak(at, this.#out(volume * 0.6, pan), 0.3);
    sfx.thump(at + 0.28, { freq: 95, dur: 0.16, volume, pan, noise: 0.6 });
    sfx.thump(at + 0.3, { freq: 1100, dur: 0.03, volume: volume * 0.35, pan, noise: 0.9 });
  }

  /** Rangido de dobradiça curto. */
  #creak(at, out, seconds) {
    const ctx = sfx.ctx;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(rnd(220, 300), at);
    o.frequency.linearRampToValueAtTime(rnd(160, 260), at + seconds);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1400;
    bp.Q.value = 2;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(0.25, at + 0.05);
    env.gain.exponentialRampToValueAtTime(0.0001, at + seconds);
    const chop = ctx.createGain();
    for (let t = 0; t < seconds; t += 0.02) chop.gain.setValueAtTime(Math.random() < 0.65 ? 1 : 0.1, at + t);
    o.connect(chop).connect(bp).connect(env).connect(out);
    o.start(at);
    o.stop(at + seconds + 0.05);
  }

  // ---- Itens -------------------------------------------------------------------------

  /** Remédio: frasco chacoalhando + falha digital (o glitch na tela). */
  pills(volume = 0.5) {
    if (!this.ok) return;
    const at = sfx.now;
    const out = this.#out(volume);
    for (let i = 0; i < 9; i++) ping(at + Math.random() * 0.25, out, rnd(3200, 5200), 0.03, 0.12, 'triangle');
    // Falha digital: tons quadrados pulando
    const ctx = sfx.ctx;
    const o = ctx.createOscillator();
    o.type = 'square';
    const g = ctx.createGain();
    g.gain.value = 0;
    for (let t = 0; t < 0.5; t += 0.03) {
      o.frequency.setValueAtTime(rnd(120, 1800), at + 0.3 + t);
      g.gain.setValueAtTime(Math.random() < 0.6 ? 0.06 : 0, at + 0.3 + t);
    }
    g.gain.setValueAtTime(0, at + 0.82);
    o.connect(g).connect(out);
    o.start(at + 0.3);
    o.stop(at + 0.85);
  }

  /** Pilha encaixando na lanterna (clique-claque). */
  battery(volume = 0.5) {
    if (!this.ok) return;
    const at = sfx.now;
    sfx.thump(at, { freq: 1500, dur: 0.03, volume: volume * 0.6, noise: 0.9 });
    sfx.thump(at + 0.14, { freq: 900, dur: 0.05, volume, noise: 0.9 });
  }

  /** Coisa pequena de plástico/metal pega de um móvel (celular, chave). */
  tick(volume = 0.35, pan = 0) {
    if (!this.ok) return;
    const at = sfx.now;
    const out = this.#out(volume, pan);
    ping(at, out, 2600, 0.04, 0.3, 'triangle');
    sfx.burst(at, out, { filter: { type: 'highpass', freq: 4000 }, decay: 0.02, level: 0.3 });
  }

  /** Fusível: pegar (metal fininho). */
  fusePick(volume = 0.4) {
    if (!this.ok) return;
    const at = sfx.now;
    const out = this.#out(volume);
    ping(at, out, 3400, 0.08, 0.25);
    ping(at + 0.05, out, 4700, 0.06, 0.15);
  }

  /** Lanterna: clique do botão. */
  flashlightClick(volume = 0.35) {
    if (!this.ok) return;
    sfx.thump(sfx.now, { freq: 2000, dur: 0.02, volume, noise: 1 });
  }

  /** Lanterna falhando (bateria fraca): estalido elétrico. */
  flashlightFlicker(volume = 0.25) {
    if (!this.ok) return;
    crackle(sfx.now, this.#out(volume), 4, 0.12, { lo: 2500, hi: 6000, q: 3, decay: [0.005, 0.015], level: 1 });
  }

  // ---- Gerador ------------------------------------------------------------------------

  /** Fusível encaixando + o gerador pegando: arranque engasgado e o motor firmando. */
  generatorStart(volume = 0.7, pan = 0) {
    if (!this.ok) return;
    const at = sfx.now;
    sfx.thump(at, { freq: 700, dur: 0.05, volume: volume * 0.6, pan, noise: 0.9 }); // encaixe
    sfx.thump(at + 0.12, { freq: 220, dur: 0.08, volume: volume * 0.5, pan, noise: 0.8 });
    for (let i = 0; i < 6; i++) sfx.thump(at + 0.5 + i * 0.13, { freq: 55, dur: 0.1, volume: volume * (0.5 + i * 0.08), pan, noise: 0.7 });
    // Motor firmando e sumindo ao fundo
    const ctx = sfx.ctx;
    const out = this.#out(volume * 0.5, pan);
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(30, at + 1.2);
    o.frequency.linearRampToValueAtTime(48, at + 1.8);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 300;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, at + 1.2);
    env.gain.exponentialRampToValueAtTime(0.5, at + 1.5);
    env.gain.exponentialRampToValueAtTime(0.0001, at + 3.2);
    o.connect(lp).connect(env).connect(out);
    o.start(at + 1.2);
    o.stop(at + 3.3);
  }

  /** Gerador falhando: o motor engasga, tosse e morre (com a luz caindo). */
  generatorFail(volume = 0.6) {
    if (!this.ok) return;
    const at = sfx.now;
    let t = 0;
    for (let i = 0; i < 7; i++) {
      t += 0.08 + i * 0.05 + Math.random() * 0.04;
      sfx.thump(at + t, { freq: 60 - i * 4, dur: 0.12, volume: volume * (1 - i * 0.11), noise: 0.8 });
    }
    // Zumbido elétrico caindo (a luz morrendo)
    const ctx = sfx.ctx;
    const out = this.#out(volume * 0.35);
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(120, at);
    o.frequency.exponentialRampToValueAtTime(25, at + 1.1);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 600;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.3, at);
    env.gain.exponentialRampToValueAtTime(0.0001, at + 1.1);
    o.connect(lp).connect(env).connect(out);
    o.start(at);
    o.stop(at + 1.15);
  }

  // ---- TV ------------------------------------------------------------------------------

  /** TV de tubo ligando: estalo, tranco do tubo e o apito agudo fino. */
  tvOn(volume = 0.5, pan = 0) {
    if (!this.ok) return;
    const at = sfx.now;
    sfx.thump(at, { freq: 1600, dur: 0.03, volume: volume * 0.5, pan, noise: 1 });
    sfx.thump(at + 0.05, { freq: 80, dur: 0.2, volume: volume * 0.7, pan, noise: 0.5 });
    const out = this.#out(volume * 0.06, pan);
    const ctx = sfx.ctx;
    const o = ctx.createOscillator();
    o.frequency.value = 15600;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, at + 0.05);
    env.gain.exponentialRampToValueAtTime(1, at + 0.3);
    env.gain.exponentialRampToValueAtTime(0.0001, at + 2.5);
    o.connect(env).connect(out);
    o.start(at + 0.05);
    o.stop(at + 2.6);
  }

  /** TV desligando: estalo seco. */
  tvOff(volume = 0.5, pan = 0) {
    if (!this.ok) return;
    sfx.thump(sfx.now, { freq: 1200, dur: 0.04, volume, pan, noise: 1 });
  }

  // ---- Tarefas (GDD 14.2) --------------------------------------------------------------

  /** Papel sendo pego / solto (lista da geladeira). */
  paper(volume = 0.4, pan = 0) {
    if (!this.ok) return;
    crackle(sfx.now, this.#out(volume * 2, pan), 7, 0.3, { lo: 2500, hi: 5500, q: 1, decay: [0.02, 0.06], level: 0.7 });
  }

  /** Plástico amassando (marmita, saco de lixo). low = saco grande (mais grave). */
  plastic(volume = 0.4, pan = 0, low = false) {
    if (!this.ok) return;
    crackle(sfx.now, this.#out(volume * 2, pan), 12, 0.45, {
      lo: low ? 1200 : 2800,
      hi: low ? 3500 : 7000,
      q: 2,
      decay: [0.01, 0.035],
      level: 0.8,
    });
  }

  /** Freezer: tampa abrindo (borracha descolando), plástico da marmita, tampa fechando. */
  freezer(volume = 0.5, pan = 0) {
    if (!this.ok) return;
    const at = sfx.now;
    const out = this.#out(volume * 3, pan);
    sfx.burst(at, out, { filter: { type: 'lowpass', freq: 350 }, attack: 0.03, decay: 0.15, level: 0.8 });
    crackle(at + 0.3, out, 10, 0.4, { lo: 2800, hi: 7000, q: 2, decay: [0.01, 0.03], level: 0.4 });
    sfx.thump(at + 0.9, { freq: 90, dur: 0.15, volume, pan, noise: 0.6 });
  }

  /** Porta de aparelho (micro-ondas, máquina): trinco. */
  applianceDoor(volume = 0.45, pan = 0) {
    if (!this.ok) return;
    const at = sfx.now;
    sfx.thump(at, { freq: 1400, dur: 0.03, volume: volume * 0.5, pan, noise: 0.9 });
    sfx.thump(at + 0.06, { freq: 300, dur: 0.06, volume, pan, noise: 0.7 });
  }

  /** Micro-ondas funcionando: zumbido grave contínuo. */
  microwaveLoop() {
    if (!this.ok) return sfx.silentHandle();
    const ctx = sfx.ctx;
    const { gain, panner } = sfx.out(0);
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = 120;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 450;
    const g = ctx.createGain();
    g.gain.value = 0.12;
    o.connect(lp).connect(g).connect(gain);
    o.start();
    const nodes = [o, ...noiseInto(gain, [{ type: 'bandpass', freq: 300, q: 1, level: 0.25 }])];
    return sfx.loopHandle(gain, panner, nodes);
  }

  /** Máquina de lavar girando: motor grave e água batendo em ondas. */
  washerLoop() {
    if (!this.ok) return sfx.silentHandle();
    const ctx = sfx.ctx;
    const { gain, panner } = sfx.out(0);
    const slosh = ctx.createGain();
    slosh.gain.value = 0.5;
    slosh.connect(gain);
    const nodes = noiseInto(slosh, [{ type: 'lowpass', freq: 380, q: 1, level: 1.4 }]);
    nodes.push(lfo(slosh.gain, 0.6, 0.45));
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = 52;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 200;
    const g = ctx.createGain();
    g.gain.value = 0.15;
    o.connect(lp).connect(g).connect(gain);
    o.start();
    nodes.push(o);
    return sfx.loopHandle(gain, panner, nodes);
  }

  /** Pratos batendo (pegar, empilhar). */
  plates(volume = 0.35, pan = 0) {
    if (!this.ok) return;
    const at = sfx.now;
    const out = this.#out(volume, pan);
    for (const [f, d] of [
      [2700, 0.22],
      [4100, 0.15],
      [5600, 0.1],
    ]) {
      ping(at, out, f * rnd(0.97, 1.03), d, 0.18);
      ping(at + 0.07, out, f * rnd(1.02, 1.06), d * 0.7, 0.1);
    }
  }

  /** Talher no prato (comendo). */
  cutlery(volume = 0.3, pan = 0) {
    if (!this.ok) return;
    const at = sfx.now;
    const out = this.#out(volume, pan);
    ping(at, out, rnd(4000, 4600), 0.07, 0.2);
    ping(at, out, rnd(6000, 6800), 0.05, 0.1);
  }

  /** Cadeira arrastando. */
  chair(volume = 0.4, pan = 0) {
    if (!this.ok) return;
    const ctx = sfx.ctx;
    const at = sfx.now;
    const out = this.#out(volume * 4, pan);
    const n = sfx.noiseSource();
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 5;
    bp.frequency.setValueAtTime(700, at);
    bp.frequency.linearRampToValueAtTime(380, at + 0.35);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(0.6, at + 0.05);
    env.gain.exponentialRampToValueAtTime(0.0001, at + 0.4);
    n.connect(bp).connect(env).connect(out);
    n.start(at);
    n.stop(at + 0.45);
  }

  /** Água corrente (torneira, tanque, regador derramando). Handle com setVolume/stop. */
  waterLoop(tone = 1800) {
    if (!this.ok) return sfx.silentHandle();
    const ctx = sfx.ctx;
    const { gain, panner } = sfx.out(0);
    const water = ctx.createGain();
    water.gain.value = 0.8;
    water.connect(gain);
    const nodes = noiseInto(water, [
      { type: 'bandpass', freq: tone, q: 0.8, level: 1.2 },
      { type: 'highpass', freq: 5000, q: 0.5, level: 0.15 },
    ]);
    nodes.push(lfo(water.gain, 7, 0.2)); // borbulhando
    return sfx.loopHandle(gain, panner, nodes);
  }

  /** Esfregando (bucha no prato). */
  scrub(volume = 0.3, pan = 0) {
    if (!this.ok) return;
    sfx.burst(sfx.now, this.#out(volume * 3, pan), { filter: { type: 'bandpass', freq: rnd(2200, 3000), q: 1.5 }, attack: 0.04, decay: 0.1, level: 0.7 });
  }

  /** Tampa do latão de lixo (metal grande). */
  metalLid(volume = 0.45, pan = 0) {
    if (!this.ok) return;
    const at = sfx.now;
    const out = this.#out(volume, pan);
    for (const [f, d, l] of [
      [310, 0.7, 0.2],
      [507, 0.5, 0.15],
      [833, 0.4, 0.1],
      [1270, 0.3, 0.07],
    ]) ping(at, out, f, d, l, 'triangle');
    sfx.burst(at, out, { filter: { type: 'bandpass', freq: 2500, q: 0.8 }, decay: 0.1, level: 0.5 });
  }

  /** Cesto de vime (estalidos secos). */
  wicker(volume = 0.4, pan = 0) {
    if (!this.ok) return;
    crackle(sfx.now, this.#out(volume * 2, pan), 8, 0.35, { lo: 900, hi: 1800, q: 6, decay: [0.01, 0.03], level: 0.9 });
  }

  /** Roupa molhada (encharcada, pesada). */
  wetCloth(volume = 0.4, pan = 0) {
    if (!this.ok) return;
    const at = sfx.now;
    const out = this.#out(volume * 4, pan);
    sfx.burst(at, out, { filter: { type: 'lowpass', freq: 500, q: 2 }, attack: 0.03, decay: 0.2, level: 0.8 });
    sfx.burst(at + 0.08, out, { filter: { type: 'bandpass', freq: 1100, q: 2 }, attack: 0.02, decay: 0.12, level: 0.35 });
  }

  /** Prendedor no varal. */
  clothespin(volume = 0.35, pan = 0) {
    if (!this.ok) return;
    const at = sfx.now;
    const out = this.#out(volume, pan);
    ping(at, out, 2300, 0.03, 0.25, 'triangle');
    sfx.burst(at, out, { filter: { type: 'highpass', freq: 3500 }, decay: 0.015, level: 0.3 });
  }

  /** Água enchendo o regador no tanque (o tom sobe conforme enche). */
  fillCan(volume = 0.4, pan = 0, seconds = 1.3) {
    if (!this.ok) return;
    const ctx = sfx.ctx;
    const at = sfx.now;
    const out = this.#out(volume * 2.5, pan);
    const n = sfx.noiseSource();
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 3;
    bp.frequency.setValueAtTime(450, at);
    bp.frequency.exponentialRampToValueAtTime(1500, at + seconds);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(0.8, at + 0.1);
    env.gain.setValueAtTime(0.8, at + seconds - 0.15);
    env.gain.exponentialRampToValueAtTime(0.0001, at + seconds);
    n.connect(bp).connect(env).connect(out);
    n.start(at);
    n.stop(at + seconds + 0.05);
  }

  /** Janela correndo no trilho. */
  windowSlide(volume = 0.4, pan = 0, seconds = 0.7) {
    if (!this.ok) return;
    const ctx = sfx.ctx;
    const at = sfx.now;
    const out = this.#out(volume * 3, pan);
    const n = sfx.noiseSource();
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 3;
    bp.frequency.setValueAtTime(600, at);
    bp.frequency.linearRampToValueAtTime(900, at + seconds);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(0.6, at + 0.06);
    env.gain.exponentialRampToValueAtTime(0.0001, at + seconds);
    const chop = ctx.createGain();
    for (let t = 0; t < seconds; t += 0.03) chop.gain.setValueAtTime(rnd(0.4, 1), at + t);
    n.connect(bp).connect(chop).connect(env).connect(out);
    n.start(at);
    n.stop(at + seconds + 0.05);
  }

  /** Trinco da janela. */
  latch(volume = 0.45, pan = 0) {
    if (!this.ok) return;
    const at = sfx.now;
    sfx.thump(at, { freq: 140, dur: 0.08, volume, pan, noise: 0.6 });
    sfx.thump(at + 0.05, { freq: 1700, dur: 0.03, volume: volume * 0.5, pan, noise: 0.9 });
  }

  /** Armário abrindo (madeira rangendo + batida). */
  wardrobe(volume = 0.4, pan = 0) {
    if (!this.ok) return;
    const at = sfx.now;
    this.#creak(at, this.#out(volume * 0.8, pan), 0.4);
    sfx.thump(at + 0.4, { freq: 130, dur: 0.1, volume: volume * 0.7, pan, noise: 0.6 });
  }

  /** Ferro de passar soltando vapor (chiado em sopros). */
  steamLoop() {
    if (!this.ok) return sfx.silentHandle();
    const ctx = sfx.ctx;
    const { gain, panner } = sfx.out(0);
    const puff = ctx.createGain();
    puff.gain.value = 0.4;
    puff.connect(gain);
    const nodes = noiseInto(puff, [{ type: 'highpass', freq: 3500, q: 0.5, level: 0.8 }]);
    nodes.push(lfo(puff.gain, 0.9, 0.35));
    return sfx.loopHandle(gain, panner, nodes);
  }

  /** Plugue do carregador. */
  plug(volume = 0.4, pan = 0) {
    if (!this.ok) return;
    const at = sfx.now;
    sfx.thump(at, { freq: 1800, dur: 0.02, volume: volume * 0.5, pan, noise: 1 });
    sfx.thump(at + 0.07, { freq: 1100, dur: 0.03, volume, pan, noise: 1 });
  }

  /** Objeto largado no chão, conforme o que é: 'soft', 'ceramic', 'plastic', 'box'. */
  drop(kind, volume = 0.45, pan = 0) {
    if (!this.ok) return;
    const at = sfx.now;
    if (kind === 'ceramic') {
      sfx.thump(at, { freq: 120, dur: 0.08, volume: volume * 0.6, pan, noise: 0.5 });
      this.plates(volume * 0.9, pan);
    } else if (kind === 'plastic') {
      sfx.thump(at, { freq: 160, dur: 0.07, volume, pan, noise: 0.6 });
      sfx.thump(at + 0.12, { freq: 220, dur: 0.05, volume: volume * 0.4, pan, noise: 0.6 });
    } else if (kind === 'box') {
      sfx.thump(at, { freq: 140, dur: 0.06, volume, pan, noise: 0.7 });
    } else {
      sfx.burst(at, this.#out(volume * 4, pan), { filter: { type: 'lowpass', freq: 300 }, attack: 0.01, decay: 0.12, level: 0.9 });
    }
  }

  /** Pegando de volta algo do chão. */
  pickUp(volume = 0.35, pan = 0) {
    if (!this.ok) return;
    crackle(sfx.now, this.#out(volume * 2, pan), 4, 0.15, { lo: 800, hi: 2500, q: 1, decay: [0.02, 0.05], level: 0.6 });
  }

  // ---- Ligações-alucinação (GDD 3.5) -----------------------------------------------

  /**
   * Ruído da noite da tragédia ao fundo de uma ligação-alucinação, baixo e abafado como
   * se viesse pela linha: 'generator' (gerador tentando ligar), 'creak' (porta rangendo),
   * 'birthday' ("parabéns pra você" quase inaudível), 'balloon' (balão sendo apertado).
   * Toca por ~25 s ou até stop().
   */
  callNoise(kind) {
    if (!this.ok) return sfx.silentHandle();
    const ctx = sfx.ctx;
    const { gain, panner } = sfx.out(0);
    const line = ctx.createBiquadFilter(); // filtro de telefone
    line.type = 'bandpass';
    line.frequency.value = 1000;
    line.Q.value = 0.8;
    line.connect(gain);
    const at = ctx.currentTime + 0.3;
    const nodes = [];
    if (kind === 'generator') {
      // Motor engasgando: tentativas de partida que não pegam
      for (let k = 0; k < 6; k++) {
        const t0 = at + 0.5 + k * 4;
        for (let i = 0; i < 5; i++) this.#thumpInto(line, t0 + i * 0.16, 70 - i * 3, 0.12, 0.9 - i * 0.12);
      }
      gain.gain.value = 1.1;
    } else if (kind === 'creak') {
      for (const t of [1, 6.5, 13]) this.#creak(at + t, line, 1.2);
      gain.gain.value = 1.4;
    } else if (kind === 'birthday') {
      // "Parabéns pra você" (melodia tradicional), lento, desafinado e quase inaudível
      const C = 392; // sol
      const notes = [
        [0, 0.75], [0, 0.25], [2, 1], [0, 1], [5, 1], [4, 2],
        [0, 0.75], [0, 0.25], [2, 1], [0, 1], [7, 1], [5, 2],
      ];
      let t = at + 0.8;
      for (const [semi, beats] of notes) {
        const o = ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.value = C * 2 ** (semi / 12) * rnd(0.985, 1.015);
        const env = ctx.createGain();
        const len = beats * 0.42;
        env.gain.setValueAtTime(0.0001, t);
        env.gain.exponentialRampToValueAtTime(0.25, t + 0.03);
        env.gain.exponentialRampToValueAtTime(0.0001, t + len);
        o.connect(env).connect(line);
        o.start(t);
        o.stop(t + len + 0.05);
        nodes.push(o);
        t += len + 0.05;
      }
      gain.gain.value = 0.5;
    } else if (kind === 'balloon') {
      // Borracha de balão sendo esfregada: guinchos curtos que sobem e descem
      for (let k = 0; k < 7; k++) {
        const t = at + 1 + k * rnd(1.8, 3.2);
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(rnd(500, 700), t);
        o.frequency.linearRampToValueAtTime(rnd(900, 1300), t + 0.25);
        o.frequency.linearRampToValueAtTime(rnd(600, 800), t + 0.45);
        const env = ctx.createGain();
        env.gain.setValueAtTime(0.0001, t);
        env.gain.exponentialRampToValueAtTime(0.12, t + 0.05);
        env.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
        o.connect(env).connect(line);
        o.start(t);
        o.stop(t + 0.5);
        nodes.push(o);
      }
      gain.gain.value = 0.6;
    }
    // Para o loopHandle: um nó "relógio" que dura o tempo do ruído
    const keep = ctx.createConstantSource();
    keep.offset.value = 0;
    keep.connect(gain);
    keep.start();
    keep.stop(at + 26);
    nodes.push(keep);
    return sfx.loopHandle(gain, panner, [keep]); // parar zera o volume (os sons já agendados ficam mudos)
  }

  /** Batida grave ligada a uma saída própria (o thump do Sfx vai direto para os efeitos). */
  #thumpInto(out, at, freq, dur, level) {
    const ctx = sfx.ctx;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(freq * 1.6, at);
    o.frequency.exponentialRampToValueAtTime(freq, at + dur * 0.6);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(level, at + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(env).connect(out);
    o.start(at);
    o.stop(at + dur + 0.02);
  }

  // ---- Sono --------------------------------------------------------------------------

  /**
   * Sussurros do sono (GDD 4.7): várias vozes sussurrando juntas, de lados diferentes,
   * aumentando. setLevel(0–1) e stop() (silêncio na hora).
   */
  sleepWhispers() {
    const voices = [-0.8, -0.3, 0.3, 0.8].map((pan) => ({ pan, h: sfx.whisperLoop() }));
    let level = 0;
    return {
      setLevel: (k) => {
        level = k;
        voices.forEach(({ pan, h }, i) => h.setVolume(Math.max(0, (k * 4 - i * 0.6) / 4) * 0.9, pan));
      },
      stop: () => {
        voices.forEach(({ h }) => h.stop());
        return level;
      },
    };
  }
}

export const foley = new Foley();
