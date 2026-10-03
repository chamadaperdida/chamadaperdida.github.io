// Luz piscando (comum) — GDD 5. A luz do cômodo pisca.
// Reação certa: ficar parado (para de piscar mais rápido). Medo: 3 certo / 7 errado (9.3),
// vezes a escala das alucinações.

import { BALANCE } from '../config/balance.js';

export class FlickerHallucination {
  constructor(fear) {
    this.name = 'Luz piscando';
    this.fear = fear;
    const { right, wrong } = BALANCE.hallucinationFear.flicker;
    this.extraPerSecond = (wrong - right) / BALANCE.extra.flickerSeconds;
    fear.addHallucination(right); // o susto em si; se ficar se mexendo, soma até o valor "errado"
    this.progress = 0;
    this.done = false;
    this.lit = true;
    this.toggleIn = 0;
  }

  /** Brilho do cômodo agora (1 = normal, perto de 0 = apagado). */
  get lightFactor() {
    return this.lit ? 1 : 0.15;
  }

  update(dt, { playerMoving }) {
    const e = BALANCE.extra;
    this.progress += (dt * (playerMoving ? 1 : e.flickerStillSpeed)) / e.flickerSeconds;
    if (playerMoving) this.fear.addHallucination(this.extraPerSecond * dt);

    // Pisca de verdade: fica acesa e apaga em piscadas curtas e irregulares
    this.toggleIn -= dt;
    if (this.toggleIn <= 0) {
      this.lit = !this.lit;
      this.toggleIn = this.lit ? 0.15 + Math.random() * 0.5 : 0.04 + Math.random() * 0.1;
    }
    if (this.progress >= 1) this.done = true;
  }

  end() {}
}
