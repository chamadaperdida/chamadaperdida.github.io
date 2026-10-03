// Poça de sangue — GDD 5. Aparece num lugar do mapa (não precisa ser na tela). Perto:
// som de goteira e gota caindo do teto. O medo sobe ao se aproximar.
// Reação certa: ficar longe por tempo suficiente, e ela some. Medo: 4 certo / 11 errado (9.3).

import { BALANCE } from '../config/balance.js';
import { PPM } from '../world/tiles.js';
import { Hallucination } from './Hallucination.js';
import { positional } from '../audio/Sfx.js';

const DISCOVER_DIST = 4; // m — ao chegar a esta distância, o primeiro susto
const CLOSE_DIST = 2; // m — perto demais: medo continua subindo
const FAR_DIST = 5; // m — longe
const VANISH_AFTER_FAR = 8; // s longe e ela some
const MAX_LIFE = 60;
const DRIP_EVERY = 1.3;

export class BloodPoolHallucination extends Hallucination {
  constructor(ctx, opts) {
    super(ctx, opts);
    const { right, wrong } = BALANCE.hallucinationFear.bloodPool;
    this.right = right;
    this.extraLeft = wrong - right;
    this.discovered = false;
    this.farTime = 0;
    this.dripIn = 0.3;

    const spot = ctx.findSpot(3, 8, { onScreen: false, sameRoom: false });
    this.pos = { x: spot.x / PPM, y: spot.y / PPM };
    this.pool = ctx.scene.add.image(spot.x, spot.y, 'props', 'blood-pool').setOrigin(0.5, 0.5).setDepth(spot.y - 20);
    this.drop = ctx.scene.add.image(spot.x, spot.y - 48, 'props', 'drip').setDepth(spot.y + 1).setVisible(false);
  }

  get name() {
    return 'Poça de sangue';
  }

  update(dt) {
    super.update(dt);
    const feet = this.ctx.feet();
    const d = Math.hypot(feet.x - this.pos.x, feet.y - this.pos.y);

    if (!this.discovered && d < DISCOVER_DIST) {
      this.discovered = true;
      this.addFear(this.right);
    }
    if (d < CLOSE_DIST && this.extraLeft > 0) {
      const add = Math.min(this.extraLeft, 3 * dt);
      this.extraLeft -= add;
      this.addFear(add);
    }

    // Gota caindo do teto + goteira (som pela distância)
    this.dripIn -= dt;
    if (this.dripIn <= 0) {
      this.dripIn = DRIP_EVERY + Math.random() * 0.4;
      this.drop.setPosition(this.pool.x, this.pool.y - 48).setVisible(true);
      this.ctx.scene.tweens.add({
        targets: this.drop,
        y: this.pool.y - 2,
        duration: 450,
        ease: 'Quad.easeIn',
        onComplete: () => {
          this.drop.setVisible(false);
          const { volume, pan } = positional(feet, this.pos, 7);
          this.ctx.sfx.drip(volume * 0.7, pan);
        },
      });
    }

    this.farTime = d > FAR_DIST ? this.farTime + dt : 0;
    if (this.farTime > VANISH_AFTER_FAR || this.elapsed > MAX_LIFE) this.done = true;
  }

  end() {
    this.ctx.scene.tweens.killTweensOf(this.drop);
    this.pool.destroy();
    this.drop.destroy();
  }
}
