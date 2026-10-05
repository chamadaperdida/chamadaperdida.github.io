// Sons da casa e da delegacia (GDD 14.1 e 14.2), com as gravações reais (audio/Sfx.js →
// play): ambiente (chuva + ruído; chuva no vidro + lâmpada fluorescente), passos,
// respiração, portas, itens, gerador, lanterna, TV, tarefas e os sussurros do sono.
//
// Sons de um disparo recebem (volume, pan). Os contínuos devolvem um handle
// { setVolume(v, pan), stop() } (alguns com controles extras).

import { sfx } from './Sfx.js';

const rnd = (a, b) => a + Math.random() * (b - a);

class Foley {
  get ok() {
    return sfx.ready;
  }

  // ---- Ambiente ----------------------------------------------------------------------

  /**
   * Casa (GDD 14.1): chuva + ruído branco baixinho, o tempo todo. Dentro de casa a chuva
   * chega abafada pelas paredes; nas áreas externas, aberta e mais alta.
   * Handle: setOutdoors(true/false), stop().
   */
  houseAmbience() {
    if (!this.ok) return { setOutdoors() {}, stop() {} };
    const rain = sfx.play('rain', { loop: true, volume: 0, bus: 'ambient', filter: { type: 'lowpass', freq: 900 } });
    const { gain, panner } = sfx.out(0.025, 0, 'ambient');
    const noise = sfx.noiseSource();
    noise.connect(gain);
    noise.start();
    const bed = sfx.loopHandle(gain, panner, [noise]);
    let outdoors = null;
    return {
      setOutdoors: (on) => {
        if (on === outdoors) return;
        outdoors = on;
        rain.setVolume(on ? 2.2 : 3.5); // (a gravação é baixa; dentro, o filtro tira muito)
        rain.filter?.frequency.setTargetAtTime(on ? 12000 : 900, sfx.now, 0.25);
      },
      stop: () => {
        rain.stop(0.02);
        bed.stop();
      },
    };
  }

  /** Delegacia (GDD 14.1): chuva no vidro e o zumbido da lâmpada. Handle: setHum(0–1). */
  officeAmbience() {
    if (!this.ok) return { setHum() {}, stop() {} };
    const rain = sfx.play('rain-window', { loop: true, volume: 0.18, bus: 'ambient', filter: { type: 'lowpass', freq: 3500 } });
    const hum = sfx.play('hum', { loop: true, volume: 0.055, bus: 'ambient' });
    return {
      setHum: (k) => hum.setVolume(0.055 * k),
      stop: () => {
        rain.stop();
        hum.stop();
      },
    };
  }

  /** Lâmpada da delegacia piscando: estalo do reator. */
  lampFlicker(volume = 0.25) {
    sfx.play('bulb', { volume, vary: 0.1 });
  }

  /** Gerador ligado, ouvido de perto (quintal). */
  generatorLoop() {
    return sfx.play('gen-run', { loop: true, volume: 0, bus: 'ambient' });
  }

  // ---- Passos e respiração -------------------------------------------------------------

  /** Passo do Artur: 'wood' (taco), 'tile' (azulejo, cozinha, concreto) ou 'mud' (lama). */
  footstep(surface, volume = 0.2, pan = 0) {
    const name = { wood: 'step-wood-*', tile: 'step-hard-*', mud: 'step-mud-*' }[surface] ?? 'step-wood-*';
    const level = { wood: 3.2, tile: 5, mud: 5 }[surface] ?? 3.2; // iguala as gravações
    sfx.play(name, { volume: volume * level, pan, vary: 0.06 });
  }

  /** Respiração ofegante (estamina esgotada). */
  breathLoop() {
    return sfx.play('breath', { loop: true, volume: 0.36, fadeIn: 0.4 });
  }

  // ---- Portas ------------------------------------------------------------------------

  doorOpen(volume = 0.55, pan = 0) {
    sfx.play('door-open', { volume, pan, vary: 0.04 });
  }

  doorClose(volume = 0.9, pan = 0) {
    sfx.play('door-close', { volume, pan, vary: 0.04 });
  }

  /** Porta sendo trancada (evento da tranca). */
  lock(volume = 0.6, pan = 0) {
    sfx.play('lock', { volume, pan, reverb: 0.15 });
  }

  /** Destrancando com a chave. */
  unlockWithKey(volume = 2, pan = 0) {
    sfx.play('key-in-lock', { volume, pan, duration: 1.6 });
  }

  /** Tentando abrir uma porta trancada (maçaneta travada). */
  lockedHandle(volume = 0.5, pan = 0) {
    sfx.play('unlock', { volume, pan, rate: 0.9 });
  }

  // ---- Itens -------------------------------------------------------------------------

  /** Remédio: comprimido saindo da cartela. */
  pills(volume = 1) {
    sfx.play('pills-*', { volume });
  }

  /** Pilha entrando na lanterna (dois cliques). */
  battery(volume = 1) {
    if (!this.ok) return;
    sfx.play('click-1', { volume });
    sfx.play('click-2', { volume, when: sfx.now + 0.18 });
  }

  /** Coisa pequena pega de um móvel (celular). */
  tick(volume = 0.5, pan = 0) {
    sfx.play('small-object', { volume, pan, rate: 1.15 });
  }

  /** Fusível: pegar. */
  fusePick(volume = 0.5) {
    sfx.play('small-object', { volume, rate: 1.3 });
  }

  /** Lanterna: botão (ligar / desligar). */
  flashlightClick(on = true, volume = 0.8) {
    sfx.play(on ? 'switch-1' : 'switch-2', { volume });
  }

  /** Lanterna falhando (bateria fraca): o contato estalando. */
  flashlightFlicker(volume = 0.3) {
    sfx.play('bulb', { volume, rate: 1.3, vary: 0.1 });
  }

  // ---- Gerador ------------------------------------------------------------------------

  /** Fusível encaixando + o gerador pegando. */
  generatorStart(volume = 0.7, pan = 0) {
    if (!this.ok) return;
    sfx.play('fuse-in', { volume, pan });
    sfx.play('gen-start', { volume, pan, when: sfx.now + 0.45 });
  }

  /** Gerador falhando: o motor engasga e morre (com a luz caindo). */
  generatorFail(volume = 0.6) {
    sfx.play('gen-die', { volume, bus: 'ambient', filter: { type: 'lowpass', freq: 2500 } });
  }

  // ---- TV ------------------------------------------------------------------------------

  tvOn(volume = 0.5, pan = 0) {
    sfx.play('tv-on', { volume, pan });
  }

  tvOff(volume = 0.3, pan = 0) {
    sfx.play('tv-off', { volume, pan });
  }

  // ---- Papel ---------------------------------------------------------------------------

  /** Folha de papel sendo pega/solta (lista da geladeira, bilhete do Marcos). */
  paper(volume = 1.2, pan = 0) {
    sfx.play('paper-*', { volume, pan, vary: 0.05 });
  }

  /** Folha do calendário sendo levantada. */
  pageTurn(volume = 0.6) {
    sfx.play('page-turn', { volume });
  }

  // ---- Tarefas (GDD 14.2) --------------------------------------------------------------

  /** Mexendo em sacola/saco plástico (lixo, marmita). */
  plastic(volume = 0.6, pan = 0) {
    sfx.play('bag-*', { volume, pan, vary: 0.05 });
  }

  /** Freezer: porta abrindo, marmita no plástico, porta fechando. */
  freezer(volume = 0.6, pan = 0) {
    if (!this.ok) return;
    sfx.play('fridge-open', { volume, pan });
    sfx.play('bag-3', { volume: volume * 0.5, pan, when: sfx.now + 0.6, duration: 0.8 });
    sfx.play('freezer-close', { volume, pan, when: sfx.now + 1.4 });
  }

  microwaveOpen(volume = 0.55, pan = 0) {
    sfx.play('mw-open', { volume, pan });
  }

  microwaveClose(volume = 0.55, pan = 0) {
    sfx.play('mw-close', { volume, pan });
  }

  /** Micro-ondas pronto: a campainha. */
  microwaveBell(volume = 0.5, pan = 0) {
    sfx.play('mw-bell', { volume, pan });
  }

  washerDoor(volume = 0.55, pan = 0) {
    sfx.play('washer-door', { volume, pan });
  }

  microwaveLoop() {
    return sfx.play('mw-run', { loop: true, volume: 0 });
  }

  washerLoop() {
    return sfx.play('washer', { loop: true, volume: 0 });
  }

  /** Pratos batendo (pegar). */
  plates(volume = 0.55, pan = 0) {
    sfx.play('plates-*', { volume, pan, vary: 0.04 });
  }

  /** Prato limpo empilhado no canto da pia. */
  plateStack(volume = 0.45, pan = 0) {
    sfx.play('plate-stack-*', { volume, pan, vary: 0.04 });
  }

  cutlery(volume = 0.45, pan = 0) {
    sfx.play('cutlery-*', { volume, pan, vary: 0.05 });
  }

  chair(volume = 0.5, pan = 0) {
    sfx.play('chair-*', { volume, pan, vary: 0.04 });
  }

  /** Água corrente: tone > 1000 = torneira da pia; senão, regador nos vasos. */
  waterLoop(tone = 1800) {
    return sfx.play(tone > 1000 ? 'faucet' : 'watering', { loop: true, volume: 0, fadeIn: 0.15 });
  }

  /** Esfregando (bucha no prato). */
  scrub(volume = 0.65, pan = 0) {
    sfx.play('scrub-*', { volume, pan, vary: 0.06, duration: 0.6 });
  }

  /** Saco caindo dentro do latão + a tampa de metal. */
  metalLid(volume = 0.55, pan = 0) {
    if (!this.ok) return;
    sfx.play('can-lid', { volume, pan, duration: 1.2 });
    sfx.play('trash-in', { volume, pan, when: sfx.now + 0.5, offset: 1.0 });
  }

  wicker(volume = 0.36, pan = 0) {
    sfx.play('wicker', { volume, pan });
  }

  wetCloth(volume = 0.55, pan = 0) {
    sfx.play('wet-cloth', { volume, pan });
  }

  clothespin(volume = 1, pan = 0) {
    sfx.play('pin-*', { volume, pan, vary: 0.08 });
  }

  /** Água enchendo o regador no tanque. */
  fillCan(volume = 0.55, pan = 0) {
    sfx.play('fill', { volume, pan, duration: 1.6 });
  }

  windowSlide(volume = 0.36, pan = 0) {
    sfx.play('window-slide', { volume, pan });
  }

  latch(volume = 0.6, pan = 0) {
    sfx.play('latch', { volume, pan });
  }

  /** Armário abrindo/fechando. */
  wardrobe(volume = 0.55, pan = 0) {
    sfx.play('closet-*', { volume, pan });
  }

  /** Vapor do ferro (enquanto passa o uniforme). */
  steamLoop() {
    return sfx.play('steam', { volume: 0, filter: { type: 'highpass', freq: 1500 }, rate: 1.3 });
  }

  plug(volume = 0.9, pan = 0) {
    sfx.play('plug', { volume, pan });
  }

  /** Objeto largado no chão, conforme o que é: 'soft', 'ceramic', 'plastic', 'box'. */
  drop(kind, volume = 0.55, pan = 0) {
    if (kind === 'ceramic') sfx.play('drop-ceramic', { volume, pan });
    else if (kind === 'plastic') sfx.play('drop-plastic', { volume, pan });
    else if (kind === 'box') sfx.play('drop-plastic', { volume, pan, rate: 0.8 });
    else sfx.play('drop-soft-*', { volume, pan, vary: 0.05 });
  }

  /** Pegando de volta algo do chão. */
  pickUp(volume = 0.5, pan = 0) {
    sfx.play('cloth-*', { volume, pan, vary: 0.05 });
  }

  // ---- Telefone ----------------------------------------------------------------------

  /** Fone do telefone sendo tirado do gancho. */
  handsetUp(volume = 0.9) {
    sfx.play('handset-up', { volume });
  }

  /** Fone sendo posto de volta no gancho. */
  handsetDown(volume = 0.6) {
    sfx.play('handset-down', { volume });
  }

  // ---- Ligações-alucinação (GDD 3.5) -----------------------------------------------

  /**
   * "Parabéns pra você" ao fundo da ligação-alucinação do dia 6: melodia tradicional, lenta,
   * grave, desafinada e abafada pela linha, repetindo até stop() (fim da ligação).
   * Agenda uma volta de cada vez pelo relógio do áudio (a pausa do jogo congela junto).
   */
  callNoise(kind) {
    if (!this.ok || kind !== 'birthday') return sfx.silentHandle();
    const ctx = sfx.ctx;
    const { gain } = sfx.out(0.5);
    const line = ctx.createBiquadFilter(); // filtro de telefone
    line.type = 'bandpass';
    line.frequency.value = 1000;
    line.Q.value = 0.8;
    line.connect(gain);
    const ROOT = 294; // ré, grave
    const BEAT = 0.62; // s por tempo (lento)
    const notes = [
      [0, 0.75], [0, 0.25], [2, 1], [0, 1], [5, 1], [4, 2],
      [0, 0.75], [0, 0.25], [2, 1], [0, 1], [7, 1], [5, 2],
      [0, 0.75], [0, 0.25], [12, 1], [9, 1], [5, 1], [4, 1], [2, 2],
      [10, 0.75], [10, 0.25], [9, 1], [5, 1], [7, 1], [5, 2.5],
    ];
    const lapLength = notes.reduce((t, [, beats]) => t + beats * BEAT, 0) + 1.5;
    const scheduleLap = (start) => {
      let t = start;
      for (const [semi, beats] of notes) {
        const len = beats * BEAT;
        // Desafina um pouco a cada nota e arrasta para baixo no fim (fita velha)
        const f = ROOT * 2 ** (semi / 12) * rnd(0.98, 1.02);
        const o = ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.setValueAtTime(f, t);
        o.frequency.linearRampToValueAtTime(f * 0.97, t + len);
        const env = ctx.createGain();
        env.gain.setValueAtTime(0.0001, t);
        env.gain.exponentialRampToValueAtTime(0.22, t + 0.04);
        env.gain.exponentialRampToValueAtTime(0.0001, t + len * 0.95);
        o.connect(env).connect(line);
        o.start(t);
        o.stop(t + len);
        t += len;
      }
    };
    let next = ctx.currentTime + 0.8;
    let running = true;
    const tick = () => {
      if (!running) return;
      if (next - ctx.currentTime < 2) {
        scheduleLap(next);
        next += lapLength;
      }
    };
    tick();
    const timer = setInterval(tick, 250);
    return {
      setVolume: (v) => gain.gain.setTargetAtTime(v, ctx.currentTime, 0.05),
      stop: () => {
        running = false;
        clearInterval(timer);
        gain.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
      },
    };
  }

  // ---- Sono --------------------------------------------------------------------------

  /**
   * Sussurros do sono (GDD 4.7): vozes sussurrando de lados diferentes, lentas e graves,
   * com eco longo, aumentando. setLevel(0–1) e stop() (silêncio na hora).
   */
  sleepWhispers() {
    const echo = { time: 0.55, feedback: 0.5, mix: 0.55 };
    const voices = [
      { pan: -0.7, h: sfx.play('whisper-man', { loop: true, volume: 0, rate: 0.78, reverb: 0.6, echo }) },
      { pan: 0.7, h: sfx.play('whisper-man-2', { loop: true, volume: 0, rate: 0.74, reverb: 0.6, echo, offset: 5 }) },
      { pan: 0.1, h: sfx.play('whisper-soft', { every: 3.5, volume: 0, rate: 0.7, reverb: 0.7, echo }) },
      { pan: -0.2, h: sfx.play('whisper-man', { loop: true, volume: 0, rate: 0.66, reverse: true, reverb: 0.7, echo, offset: 9 }) },
    ];
    return {
      // (gravações de sussurro são baixas: ×4)
      setLevel: (k) => voices.forEach(({ pan, h }, i) => h.setVolume(Math.max(0, Math.min(1, k * 1.6 - i * 0.25)) * 4, pan)),
      stop: () => voices.forEach(({ h }) => h.stop(0.01, true)),
    };
  }
}

export const foley = new Foley();
