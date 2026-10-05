// Luz piscando com Helena (rara) — GDD 5: pisca → silhueta de Helena → pisca → some.
// Duração fixa, nenhuma reação muda nada. Sons de susto + coração. Medo: 12 (9.3).

import { BALANCE } from '../config/balance.js';
import { Hallucination } from './Hallucination.js';

// Linha do tempo (s): [início, brilho da luz, Helena visível?]
const TIMELINE = [
  [0, 0.05, false], // apaga
  [0.35, 1, true], // acende: ela está ali
  [0.55, 0.2, true],
  [0.62, 1, true],
  [1.35, 0.05, false], // apaga de novo
  [1.7, 0.6, false], // volta piscando, ela sumiu
  [1.8, 0.1, false],
  [1.9, 1, false],
];
const DURATION = 2.1;

export class HelenaFlickerHallucination extends Hallucination {
  constructor(ctx, opts) {
    super(ctx, opts);
    const spot = ctx.findSpot(2.5, 5, { onScreen: true, sameRoom: true });
    this.factor = 1;
    this.scared = false;
    this.sprite = ctx.scene.add
      .image(spot.x, spot.y, 'props', 'helena-silhouette')
      .setOrigin(0.5, 1)
      .setDepth(spot.y)
      .setAlpha(0.9)
      .setVisible(false);
    // Som sinistro: grito invertido crescendo até ela aparecer
    ctx.sfx.helenaSting();
  }

  get name() {
    return 'Luz piscando com Helena';
  }

  get lightFactor() {
    return this.factor;
  }

  update(dt) {
    super.update(dt);
    let step = TIMELINE[0];
    for (const s of TIMELINE) if (this.elapsed >= s[0]) step = s;
    this.factor = step[1];
    this.sprite.setVisible(step[2]);

    if (!this.scared && step[2]) {
      this.scared = true;
      this.addFear(BALANCE.hallucinationFear.flickerHelena.right);
      this.ctx.scene.cameras.main.shake(250, 0.006);
    }
    if (this.elapsed >= DURATION) this.done = true;
  }

  end() {
    this.sprite.destroy();
  }
}
