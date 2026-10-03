// Luz piscando com Helena (GDD 5): pisca → silhueta de Helena → pisca → some.
// Duração fixa, nenhuma reação muda nada. Sons de susto + coração entram na etapa 11.
//
// É a alucinação mais forte: a primeira de toda noite é sempre ela, com +40 de medo
// (BALANCE.extra.firstHallucinationFear). Fora isso, rara (etapa 5), com o valor da 9.3.

import { BALANCE } from '../config/balance.js';

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

export class HelenaFlickerHallucination {
  /**
   * @param ctx { scene, fear, spot: {x, y} em px onde ela aparece, fearAmount (base) }
   */
  constructor({ scene, fear, spot, fearAmount }) {
    this.name = 'Luz piscando com Helena';
    this.scene = scene;
    this.fear = fear;
    this.fearAmount = fearAmount ?? BALANCE.hallucinationFear.flickerHelena.right;
    this.elapsed = 0;
    this.done = false;
    this.scared = false;
    this.factor = 1;
    this.sprite = scene.add
      .image(spot.x, spot.y, 'props', 'helena-silhouette')
      .setOrigin(0.5, 1)
      .setDepth(spot.y)
      .setAlpha(0.9)
      .setVisible(false);
  }

  get lightFactor() {
    return this.factor;
  }

  update(dt) {
    this.elapsed += dt;
    let step = TIMELINE[0];
    for (const s of TIMELINE) if (this.elapsed >= s[0]) step = s;
    this.factor = step[1];
    this.sprite.setVisible(step[2]);

    if (!this.scared && step[2]) {
      this.scared = true;
      this.fear.add(this.fearAmount);
      this.scene.cameras.main.shake(250, 0.006);
    }
    if (this.elapsed >= DURATION) this.done = true;
  }

  end() {
    this.sprite.destroy();
  }
}
