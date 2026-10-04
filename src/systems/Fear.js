// Medo (GDD 4.5): 0 a 100.
// - Começa em 0 toda noite.
// - Cai com luz acesa e sem alucinação acontecendo (valor fixo da noite, 9.1), ou com remédio.
// - No escuro fica parado: só sobe com eventos e só cai com remédio.
// - Tudo que soma passa pelo multiplicador da noite.

import { BALANCE } from '../config/balance.js';
import { fearDecayPerSecond } from './formulas.js';

export const FEAR_MAX = 100;

export class Fear {
  constructor(clock) {
    this.clock = clock;
    this.value = 0;
    this.hallucinating = false; // ligado pelas alucinações (etapa 5)
    this.listeners = [];
  }

  get full() {
    return this.value >= FEAR_MAX;
  }

  /** Soma medo de um evento (valor da tabela 9.3, antes do multiplicador). */
  add(base) {
    const amount = base * this.clock.night.fearMultiplier;
    this.value = Math.min(FEAR_MAX, this.value + amount);
    this.listeners.forEach((fn) => fn(amount));
    return amount;
  }

  /** Medo de uma alucinação (tabela 9.3): passa também pela escala das alucinações. */
  addHallucination(base) {
    return this.add(base * BALANCE.extra.hallucinationFearScale);
  }

  /** Tira medo direto (remédio), sem multiplicador. */
  reduce(amount) {
    this.value = Math.max(0, this.value - amount);
  }

  onIncrease(fn) {
    this.listeners.push(fn);
  }

  update(nightDt, lightsOn) {
    if (lightsOn && !this.hallucinating) {
      this.value = Math.max(0, this.value - fearDecayPerSecond(this.clock.night) * nightDt);
    }
  }
}
