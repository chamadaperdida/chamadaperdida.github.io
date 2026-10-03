// Relógio da noite e os valores do dia.
// A noite (curva, caos, gerador) só começa a contar no evento garantido a caminho do
// quarto (GDD 4.8): "o jogo começa depois desse evento".

import { nightBalance } from '../config/balance.js';
import { isChaosPhase } from './formulas.js';

export class NightClock {
  constructor(day) {
    this.day = day;
    this.night = nightBalance(day);
    this.t = 0;
    this.started = false;
    this.speed = 1; // só o modo debug muda (acelera a curva da noite)
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

  get chaos() {
    return isChaosPhase(this.night, this.t);
  }
}
