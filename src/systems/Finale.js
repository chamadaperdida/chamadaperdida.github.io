// Madrugada do dia 7 (GDD 10): Artur dormiu na última noite e acorda com o telefone fixo
// da sala tocando. Três ligações da Helena, às 23:41, 23:44 e 23:47; o relógio do
// corredor (no caminho entre a cama e o telefone) mostra o mesmo horário. Fica ambíguo
// se as ligações são reais.
//
// - Nada mais acontece na casa: sem alucinações, monstros, medo, gerador ou tarefas.
// - O telefone toca até Artur atender (F perto dele). Depois de cada ligação, um instante
//   de silêncio, o relógio pula para o próximo horário e o telefone toca de novo.
// - 3ª ligação: passos no corredor → porta rangendo → gritos → a linha cai. A tela
//   escurece, nada é mostrado, e o jogo segue para a reportagem (EndingScene).
// - Clima (triste e sinistro): cores lavadas e frias, vinheta que respira e fecha a cada
//   ligação, luz fraca que falha de vez em quando (e cai mais a cada ligação), câmera
//   balançando de leve e chegando mais perto conforme Artur se aproxima do telefone,
//   rastro apagado do Artur quando ele anda, granulado no máximo. Nos gritos, a luz pisca
//   sem parar, a tela treme e falha.
//
// A HouseScene cria este módulo ao terminar o sono do dia 7 e, enquanto ele existir,
// usa updateFinale() no lugar do update normal.

import { BALANCE } from '../config/balance.js';
import { FINAL_CALLS } from '../data/calls.js';
import { PPM } from '../world/tiles.js';
import { BED_POINT } from '../world/houseMap.js';
import { positional } from '../audio/Sfx.js';
import { glitchCamera } from '../fx/GlitchPipeline.js';
import { foley } from '../audio/Foley.js';
import { settings } from './Settings.js';

const WAKE_SECONDS = 1.2; // tela preta com o telefone já tocando
const FADE_IN_SECONDS = 2.5;
const BETWEEN_CALLS = 4; // s de silêncio entre uma ligação e a próxima
const RING_RESTART = 57; // a campainha do Sfx toca 20 ciclos (60 s): recomeça antes
const DARK_SECONDS = 3; // a tela escurece depois da linha cair
const AFTER_DARK = 2.5; // preto total antes da reportagem

// Clima da madrugada
const LIGHT_BY_CALL = [0.8, 0.66, 0.52]; // brilho do cômodo antes de cada ligação
const VIGNETTE_BY_CALL = [0.78, 0.7, 0.62]; // raio da vinheta (menor = mais fechada)
const FLICKER_EVERY = [3, 7]; // s entre falhas da luz
const SWAY = 0.006; // rad de balanço da câmera
const ZOOM_NEAR = 0.3; // zoom a mais perto do telefone
const ZOOM_FROM = 12; // m: começa a aproximar a partir daqui
const TRAIL_EVERY = 0.14; // s entre os rastros do Artur andando

export class Finale {
  /**
   * @param scene  HouseScene
   * @param hooks  { sfx, onEnd() }
   */
  constructor(scene, { sfx, onEnd }) {
    this.scene = scene;
    this.sfx = sfx;
    this.onEnd = onEnd;
    this.phone = scene.furnitureById.get('telefoneFixo').sprite;
    this.clock = scene.hallClock;
    this.baseX = this.phone.x;
    this.pos = { x: (this.phone.x + this.phone.width / 2) / PPM, y: (this.phone.y + this.phone.height) / PPM };
    this.marks = scene.add
      .image(this.phone.x + this.phone.width / 2, this.phone.y + 4, 'props', 'ring-marks')
      .setDepth(2_000_000)
      .setVisible(false);
    this.call = 0; // ligação atual (0 a 2)
    this.ring = null;
    this.ringTime = 0;
    this.wait = WAKE_SECONDS; // até o telefone tocar / a tela clarear
    this.state = 'waking'; // waking → ringing → talking → (pause → ringing …) → dark
    this.frozen = true; // Artur parado enquanto acorda
    this.time = 0;
    this.flickerIn = FLICKER_EVERY[0];
    this.flickerLeft = 0; // s de luz falhando agora
    this.storm = 0; // s de luz piscando sem parar (gritos)
    this.trailIn = 0;
  }

  /** Começa a madrugada: Artur ao lado da cama, tela ainda preta, o telefone tocando. */
  start() {
    const p = this.scene.player;
    p.setPosition(BED_POINT.x * PPM, BED_POINT.y * PPM);
    p.body.reset(p.x, p.y);
    p.facing = 'down';
    this.#setClock(FINAL_CALLS[0].time);
    this.#startRinging();
    this.#startMood();
  }

  // ---- Clima --------------------------------------------------------------------------

  #startMood() {
    const cam = this.scene.cameras.main;
    this.cam = cam;
    this.baseZoom = cam.zoom;
    this.scene.hud.setCalm(0); // granulado e vinheta do HUD no máximo
    if (!cam.postFX || !settings.screenFx) return; // (sem WebGL, ou efeitos de tela desligados)
    this.color = cam.postFX.addColorMatrix();
    this.color.saturate(-0.6);
    // Tom frio: menos vermelho, mais azul
    this.color.multiply([0.86, 0, 0, 0, 0, 0, 0.94, 0, 0, 0, 0, 0, 1.12, 0, 0, 0, 0, 0, 1, 0], true);
    this.vignette = cam.postFX.addVignette(0.5, 0.5, VIGNETTE_BY_CALL[0], 0.65);
  }

  /** Brilho do cômodo agora (a cena passa para a iluminação). */
  get lightFactor() {
    const base = LIGHT_BY_CALL[Math.min(this.call, LIGHT_BY_CALL.length - 1)];
    if (this.storm > 0) return Math.random() < 0.45 ? 0.08 : base;
    return this.flickerLeft > 0 ? base * 0.25 : base;
  }

  #updateMood(dt, feet) {
    this.time += dt;
    // Luz falhando de vez em quando
    this.storm = Math.max(0, this.storm - dt);
    this.flickerLeft -= dt;
    this.flickerIn -= dt;
    if (this.flickerIn <= 0) {
      this.flickerIn = FLICKER_EVERY[0] + Math.random() * (FLICKER_EVERY[1] - FLICKER_EVERY[0]);
      this.flickerLeft = 0.06 + Math.random() * 0.14;
    }
    if (!this.cam) return;
    // Vinheta respirando devagar, mais fechada a cada ligação
    if (this.vignette) {
      const base = VIGNETTE_BY_CALL[Math.min(this.call, VIGNETTE_BY_CALL.length - 1)];
      this.vignette.radius = base + 0.03 * Math.sin(this.time * 0.9);
    }
    // Câmera balança de leve e chega mais perto conforme Artur se aproxima do telefone
    this.cam.setRotation(SWAY * Math.sin(this.time * 0.45));
    const d = Math.hypot(feet.x - this.pos.x, feet.y - this.pos.y);
    const near = 1 - Math.min(1, d / ZOOM_FROM);
    const target = this.baseZoom + ZOOM_NEAR * near * near;
    this.cam.setZoom(this.cam.zoom + (target - this.cam.zoom) * Math.min(1, dt * 1.5));
    // Rastro apagado do Artur quando ele anda
    const p = this.scene.player;
    this.trailIn -= dt;
    if (p.body.velocity.lengthSq() > 0 && this.trailIn <= 0) {
      this.trailIn = TRAIL_EVERY;
      const ghost = this.scene.add
        .image(p.x, p.y, p.texture.key, p.frame.name)
        .setOrigin(p.originX, p.originY)
        .setDepth(p.depth - 1)
        .setTint(0x8aa0c8)
        .setAlpha(0.28);
      this.scene.tweens.add({ targets: ghost, alpha: 0, duration: 700, onComplete: () => ghost.destroy() });
    }
  }

  #stopMood() {
    if (!this.cam) return;
    this.cam.setRotation(0);
    this.cam.setZoom(this.baseZoom);
    if (this.color) this.cam.postFX.remove(this.color);
    if (this.vignette) this.cam.postFX.remove(this.vignette);
    this.cam = null;
  }

  /** Atender: só com o telefone tocando, perto dele. */
  get target() {
    if (this.state !== 'ringing' || this.frozen) return null;
    return {
      kind: 'finale',
      anchor: { x: this.phone.x + this.phone.width / 2, y: this.phone.y - 2 },
      point: { x: this.pos.x, y: this.pos.y + 0.35 },
      range: 1.3,
      use: () => this.#answer(),
    };
  }

  update(dt, feet) {
    this.#updateMood(dt, feet);
    if (this.state === 'waking') {
      this.wait -= dt;
      if (this.wait <= 0) {
        this.state = 'ringing';
        this.scene.hud.clearFade(FADE_IN_SECONDS);
        this.scene.time.delayedCall(FADE_IN_SECONDS * 500, () => {
          this.frozen = false;
        });
      }
    } else if (this.state === 'pause') {
      this.wait -= dt;
      if (this.wait <= 0) {
        this.state = 'ringing';
        this.#setClock(FINAL_CALLS[this.call].time);
        this.#startRinging();
      }
    } else if (this.state === 'dark') {
      this.wait -= dt;
      if (this.wait <= 0) {
        this.state = 'done';
        this.onEnd();
      }
    }
    if (this.ring) this.#updateRinging(dt, feet);
  }

  // ---- Telefone ---------------------------------------------------------------------

  #startRinging() {
    this.ring = this.sfx.phoneRing(0);
    this.ringTime = 0;
  }

  #updateRinging(dt, feet) {
    this.ringTime += dt;
    if (this.ringTime >= RING_RESTART) {
      this.ring.stop();
      this.#startRinging();
    }
    // Alto o bastante para acordar o Artur no quarto
    const { volume, pan } = positional(feet, this.pos, BALANCE.extra.deviceSoundRange);
    this.ring.setVolume(0.55 * Math.max(0.3, volume), pan);
    // Treme junto com a campainha (1 s tocando, 2 s parado)
    const ringing = this.ringTime % 3 < 1;
    this.phone.x = this.baseX + (ringing ? (Math.floor(this.ringTime * 30) % 2 ? 1 : -1) : 0);
    this.marks.setVisible(ringing && Math.floor(this.ringTime * 8) % 2 === 0);
  }

  #stopRinging() {
    this.ring?.stop();
    this.ring = null;
    this.phone.x = this.baseX;
    this.marks.setVisible(false);
  }

  #setClock(time) {
    this.clock.setTime(time);
  }

  // ---- Ligações ---------------------------------------------------------------------

  async #answer() {
    this.#stopRinging();
    foley.handsetUp();
    this.state = 'talking';
    const call = FINAL_CALLS[this.call];
    const hud = this.scene.hud;
    await hud.talk([{ fx: `(${call.time})` }, ...call.lines]);
    for (const step of call.after ?? []) {
      this.#playSound(step.sound);
      await hud.talk(step.line);
    }
    if (this.call < FINAL_CALLS.length - 1) {
      this.call += 1;
      this.state = 'pause';
      this.wait = BETWEEN_CALLS;
      return;
    }
    // A tela escurece. Nada é mostrado.
    this.state = 'dark';
    this.frozen = true;
    this.wait = DARK_SECONDS + AFTER_DARK;
    hud.fadeToBlack(DARK_SECONDS);
  }

  #playSound(kind) {
    const sfx = this.sfx;
    if (kind === 'steps') {
      // Passos no corredor da casa da Helena, abafados pelo telefone
      for (let i = 0; i < 6; i++) {
        this.scene.time.delayedCall(i * 620, () => sfx.play('step-heavy-*', { volume: 0.3 + i * 0.08, phone: true, rate: 0.85, vary: 0.05 }));
      }
    } else if (kind === 'creak') sfx.doorCreak(0.4);
    else if (kind === 'screams') {
      // Pelo telefone: a Helena e a Clara
      sfx.scream(0.3, true, 'woman');
      this.scene.time.delayedCall(350, () => sfx.scream(0.25, true, 'girl'));
      // A luz pisca sem parar, a tela treme e falha
      this.storm = 1.8;
      this.scene.cameras.main.shake(900, 0.006);
      glitchCamera(this.scene, this.scene.cameras.main, 1.2, 0.8);
    }
    else if (kind === 'busy') sfx.busyTone(5, 0.12);
  }

  /** Debug: pula direto para a reportagem. */
  skip() {
    this.#stopRinging();
    this.state = 'done';
    this.onEnd();
  }

  end() {
    this.#stopRinging();
    this.#stopMood();
    this.marks.destroy();
  }
}
