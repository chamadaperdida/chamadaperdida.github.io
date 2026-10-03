// Luz piscando (comum) — GDD 5. A luz do cômodo pisca.
// Reação certa: ficar parado (para de piscar mais rápido). Medo: 3 certo / 7 errado (9.3).

import { BALANCE } from '../config/balance.js';
import { Hallucination } from './Hallucination.js';

export class FlickerHallucination extends Hallucination {
  constructor(ctx, opts) {
    super(ctx, opts);
    const { right, wrong } = BALANCE.hallucinationFear.flicker;
    this.addFear(right); // o susto em si; se ficar se mexendo, soma até o valor "errado"
    this.extraPerSecond = (wrong - right) / BALANCE.extra.flickerSeconds;
    this.progress = 0;
    this.lit = true;
    this.toggleIn = 0;
  }

  get name() {
    return 'Luz piscando';
  }

  get lightFactor() {
    return this.lit ? 1 : 0.15;
  }

  update(dt, { playerMoving }) {
    super.update(dt);
    const e = BALANCE.extra;
    this.progress += (dt * (playerMoving ? 1 : e.flickerStillSpeed)) / e.flickerSeconds;
    if (playerMoving) this.addFear(this.extraPerSecond * dt);

    // Fica acesa e apaga em piscadas curtas e irregulares
    this.toggleIn -= dt;
    if (this.toggleIn <= 0) {
      this.lit = !this.lit;
      this.toggleIn = this.lit ? 0.15 + Math.random() * 0.5 : 0.04 + Math.random() * 0.1;
    }
    if (this.progress >= 1) this.done = true;
  }
}
