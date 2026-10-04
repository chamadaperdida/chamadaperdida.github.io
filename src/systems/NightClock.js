// Relógio da noite e os valores do dia.
// A noite (alucinações, sabotagem do gerador, prazo da queda garantida) só começa a
// contar quando ela começa de verdade (GDD 4.6).

import { nightBalance } from '../config/balance.js';

export class NightClock {
  constructor(day) {
    this.day = day;
    this.night = nightBalance(day);
    this.t = 0;
    this.started = false;
    this.speed = 1; // só o modo debug muda (acelera o relógio da noite)
    // Ursos coletados na noite (GDD 4.12). Provisório até a etapa 8: metade dos ursos,
    // para a noite seguir jogável enquanto os ursos ainda não existem na casa.
    this.bearsCollected = Math.ceil(this.night.bearCount / 2);
  }

  /** Fração dos ursos da noite já coletados (0 a 1). */
  get bears() {
    return this.bearsCollected / this.night.bearCount;
  }

  start() {
    this.started = true;
  }

  /** Avança e devolve o dt "da noite" (já com a velocidade do debug). 0 antes de começar. */
  update(dt) {
    if (!this.started) return 0;
    const nightDt = dt * this.speed;
    this.t += nightDt;
    return nightDt;
  }

  /** Passou o prazo da queda garantida do gerador? (GDD 4.4) */
  get guaranteedDropDue() {
    return this.t >= this.night.generatorGuaranteedDropAt;
  }
}
