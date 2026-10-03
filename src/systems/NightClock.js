// Relógio da noite: segundos desde que Artur chegou em casa, e os valores do dia.

import { nightBalance } from '../config/balance.js';
import { isChaosPhase } from './formulas.js';

export class NightClock {
  constructor(day) {
    this.day = day;
    this.night = nightBalance(day);
    this.t = 0;
    this.speed = 1; // só o modo debug muda (acelera a curva da noite)
  }

  /** Avança e devolve o dt "da noite" (já com a velocidade do debug). */
  update(dt) {
    const nightDt = dt * this.speed;
    this.t += nightDt;
    return nightDt;
  }

  get chaos() {
    return isChaosPhase(this.night, this.t);
  }
}
