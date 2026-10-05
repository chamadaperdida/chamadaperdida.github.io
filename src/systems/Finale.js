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
//
// A HouseScene cria este módulo ao terminar o sono do dia 7 e, enquanto ele existir,
// usa updateFinale() no lugar do update normal.

import { BALANCE } from '../config/balance.js';
import { FINAL_CALLS } from '../data/calls.js';
import { PPM } from '../world/tiles.js';
import { BED_POINT } from '../world/houseMap.js';
import { positional } from '../audio/Sfx.js';

const WAKE_SECONDS = 1.2; // tela preta com o telefone já tocando
const FADE_IN_SECONDS = 2.5;
const BETWEEN_CALLS = 4; // s de silêncio entre uma ligação e a próxima
const RING_RESTART = 57; // a campainha do Sfx toca 20 ciclos (60 s): recomeça antes
const DARK_SECONDS = 3; // a tela escurece depois da linha cair
const AFTER_DARK = 2.5; // preto total antes da reportagem

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
    this.clock = scene.furnitureById.get('relogioCorredor').sprite;
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
  }

  /** Começa a madrugada: Artur ao lado da cama, tela ainda preta, o telefone tocando. */
  start() {
    const p = this.scene.player;
    p.setPosition(BED_POINT.x * PPM, BED_POINT.y * PPM);
    p.body.reset(p.x, p.y);
    p.facing = 'down';
    this.#setClock(FINAL_CALLS[0].time);
    this.#startRinging();
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
    this.clock.setFrame(`wall-clock-${time.replace(':', '')}`);
  }

  // ---- Ligações ---------------------------------------------------------------------

  async #answer() {
    this.#stopRinging();
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
      for (let i = 0; i < 6; i++) this.scene.time.delayedCall(i * 520, () => sfx.step(0.22 + i * 0.05, 0));
    } else if (kind === 'creak') sfx.doorCreak(0.4);
    else if (kind === 'screams') sfx.scream(0.5);
    else if (kind === 'busy') sfx.busyTone(5, 0.25);
  }

  /** Debug: pula direto para a reportagem. */
  skip() {
    this.#stopRinging();
    this.state = 'done';
    this.onEnd();
  }

  end() {
    this.#stopRinging();
    this.marks.destroy();
  }
}
