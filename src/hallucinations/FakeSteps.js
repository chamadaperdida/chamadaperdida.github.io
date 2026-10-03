// Passos falsos — GDD 5. Passos pesados correndo (confunde com o Artur distorcido).
// Também acontece no escuro. Nenhuma reação muda nada. Medo: 6 (9.3).

import { BALANCE } from '../config/balance.js';
import { Hallucination } from './Hallucination.js';

const DURATION = 2.6;

export class FakeStepsHallucination extends Hallucination {
  constructor(ctx, opts) {
    super(ctx, opts);
    this.addFear(BALANCE.hallucinationFear.fakeSteps.right);
    // Passa de um lado para o outro, como alguém correndo pelo cômodo vizinho
    const fromLeft = Math.random() < 0.5;
    ctx.sfx.heavySteps(DURATION, fromLeft ? -0.9 : 0.9, fromLeft ? 0.9 : -0.9);
  }

  get name() {
    return 'Passos falsos';
  }

  get worksInDark() {
    return true;
  }

  update(dt) {
    super.update(dt);
    if (this.elapsed >= DURATION) this.done = true;
  }
}
