// Vulto — GDD 5. Silhueta com a forma do Invasor, feita de luz. Ao aparecer na tela,
// foge de Artur (1,1× Artur correndo) até sair da tela.
// Reação: fugir para o lado oposto → medo sobe menos; correr atrás dele → sobe mais.
// Medo: 5 certo / 12 errado (9.3).

import Phaser from 'phaser';
import { BALANCE } from '../config/balance.js';
import { PPM } from '../world/tiles.js';
import { Hallucination } from './Hallucination.js';

const MAX_LIFE = 5;
const CHASE_SECONDS = 1.2; // tempo correndo atrás dele para chegar no valor "errado"

export class ShadowHallucination extends Hallucination {
  constructor(ctx, opts) {
    super(ctx, opts);
    const { right, wrong } = BALANCE.hallucinationFear.shadow;
    this.addFear(right);
    this.extraLeft = wrong - right;
    this.extraPerSecond = (wrong - right) / CHASE_SECONDS;

    const m = BALANCE.movement;
    this.speed = m.arturWalk * m.arturRunMultiplier * m.shadow * PPM;
    const spot = opts?.spot ?? ctx.findSpot(3, 5, { onScreen: true, sameRoom: false });
    this.sprite = ctx.scene.add
      .image(spot.x, spot.y, 'props', 'shadow-figure')
      .setOrigin(0.5, 1)
      .setDepth(spot.y)
      .setAlpha(0);
    ctx.scene.tweens.add({ targets: this.sprite, alpha: 0.75, duration: 150 });
  }

  get name() {
    return 'Vulto';
  }

  update(dt, { playerVelocity }) {
    super.update(dt);
    const p = this.ctx.player;
    const away = new Phaser.Math.Vector2(this.sprite.x - p.x, this.sprite.y - p.y);
    if (away.lengthSq() < 1) away.set(1, 0);
    away.normalize();

    // Foge depois de um instante parado (o susto de vê-lo)
    if (this.elapsed > 0.35) {
      this.sprite.x += away.x * this.speed * dt;
      this.sprite.y += away.y * this.speed * dt;
      this.sprite.setDepth(this.sprite.y);
    }

    // Correndo atrás dele: medo extra
    const towards = playerVelocity.x * away.x + playerVelocity.y * away.y;
    if (towards > 0.5 * playerVelocity.length() && playerVelocity.lengthSq() > 0 && this.extraLeft > 0) {
      const add = Math.min(this.extraLeft, this.extraPerSecond * dt);
      this.extraLeft -= add;
      this.addFear(add);
    }

    const visible = this.ctx.onScreen(this.sprite.x, this.sprite.y - 16, 24);
    if ((this.elapsed > 0.5 && !visible) || this.elapsed > MAX_LIFE) this.done = true;
  }

  end() {
    this.sprite.destroy();
  }
}
