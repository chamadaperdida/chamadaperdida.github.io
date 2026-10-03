// Vulto — GDD 5. Quando Artur está a uma certa distância de uma porta aberta, uma sombra
// PRETA (forma do Invasor) passa CORRENDO do outro lado da porta, de um lado ao outro,
// bem rápida (2× Artur correndo), e some. Só é vista pelo vão da porta.
// Reação: fugir para o lado oposto → medo sobe menos; ir atrás dele → sobe mais.
// Medo: 5 certo / 12 errado (9.3).

import Phaser from 'phaser';
import { BALANCE } from '../config/balance.js';
import { PPM } from '../world/tiles.js';
import { Hallucination } from './Hallucination.js';

const BEYOND = 1.3; // m depois da linha da porta, dentro do outro cômodo
const HALF_PATH = 2.4; // m para cada lado do vão
const CHASE_SECONDS = 1.2; // tempo indo atrás dele para chegar no valor "errado"

export class ShadowHallucination extends Hallucination {
  /**
   * opts.door: passagem escolhida { door, toRoom, normal } — ou sorteada pela casa.
   */
  constructor(ctx, opts = {}) {
    super(ctx, opts);
    const pass = opts.door ?? ctx.findShadowDoor();
    if (!pass) {
      this.done = true;
      return;
    }
    const { right, wrong } = BALANCE.hallucinationFear.shadow;
    this.addFear(right);
    this.extraLeft = wrong - right;
    this.extraPerSecond = (wrong - right) / CHASE_SECONDS;

    const m = BALANCE.movement;
    const speed = m.arturWalk * m.arturRunMultiplier * m.shadow; // m/s
    const { door, toRoom, normal } = pass;
    this.doorPos = door.center;
    const side = { x: -normal.y, y: normal.x }; // perpendicular à passagem
    const dir = Math.random() < 0.5 ? 1 : -1;
    const center = { x: door.center.x + normal.x * BEYOND, y: door.center.y + normal.y * BEYOND };
    const from = { x: center.x - side.x * HALF_PATH * dir, y: center.y - side.y * HALF_PATH * dir };
    const to = { x: center.x + side.x * HALF_PATH * dir, y: center.y + side.y * HALF_PATH * dir };

    this.sprite = ctx.scene.add
      .image(from.x * PPM, from.y * PPM, 'props', 'shadow-run-0')
      .setOrigin(0.5, 1)
      .setDepth(from.y * PPM);
    // Só aparece dentro do outro cômodo (não "vaza" por cima das paredes)
    const maskShape = ctx.scene.make.graphics({}, false);
    maskShape.fillStyle(0xffffff).fillRect(toRoom.x * PPM, toRoom.y * PPM, toRoom.w * PPM, toRoom.h * PPM);
    this.maskShape = maskShape;
    this.sprite.setMask(maskShape.createGeometryMask());
    // Os quadros de corrida olham para a direita
    if (from.x > to.x) this.sprite.setFlipX(true);
    this.frame = 0;
    this.frameIn = 0;

    const duration = (Math.hypot(to.x - from.x, to.y - from.y) / speed) * 1000;
    this.tween = ctx.scene.tweens.add({
      targets: this.sprite,
      x: to.x * PPM,
      y: to.y * PPM,
      duration,
      delay: 120,
      onUpdate: () => this.sprite.setDepth(this.sprite.y),
      onComplete: () => {
        this.done = true;
      },
    });
  }

  get name() {
    return 'Vulto';
  }

  update(dt, { playerVelocity }) {
    super.update(dt);
    if (!this.sprite) return;
    // Animação de corrida
    this.frameIn -= dt;
    if (this.frameIn <= 0) {
      this.frameIn = 0.07;
      this.frame = (this.frame + 1) % 4;
      this.sprite.setFrame(`shadow-run-${this.frame}`);
    }
    // Indo na direção da porta (atrás dele): medo extra
    const feet = this.ctx.feet();
    const toDoor = new Phaser.Math.Vector2(this.doorPos.x - feet.x, this.doorPos.y - feet.y).normalize();
    const speed = playerVelocity.length();
    const towards = speed > 0 && (playerVelocity.x * toDoor.x + playerVelocity.y * toDoor.y) / speed > 0.5;
    if (towards && this.extraLeft > 0) {
      const add = Math.min(this.extraLeft, this.extraPerSecond * dt);
      this.extraLeft -= add;
      this.addFear(add);
    }
  }

  end() {
    if (!this.sprite) return;
    this.tween.remove();
    this.sprite.clearMask(true);
    this.maskShape.destroy();
    this.sprite.destroy();
  }
}
