// Gerador (GDD 4.4 e 9.2).
// - Risco de queda cresce por segundo só com Artur LONGE, até um teto; zera quando cai.
// - Queda garantida: caos acabou e ainda não caiu nenhuma vez → cai assim que Artur estiver longe.
// - Medo em 100%: cai na hora, mesmo com Artur perto.
// - Com uma porta trancada, o risco cresce ×1,5 (a tranca entra na etapa 7).
// - Toda queda soma medo (+4). Religar: segurar F por 3 s perto dele.

import { BALANCE } from '../config/balance.js';
import { stepGeneratorRisk } from './formulas.js';

export class Generator {
  constructor(clock, fear, position) {
    this.clock = clock;
    this.fear = fear;
    this.position = position; // metros
    this.on = true;
    this.risk = 0;
    this.drops = 0;
    this.lockedDoor = false;
    this.holdProgress = 0; // 0 a 1 enquanto segura F
    this.listeners = { drop: [], restore: [] };
  }

  listen(event, fn) {
    this.listeners[event].push(fn);
  }

  distanceTo(feet) {
    return Math.hypot(feet.x - this.position.x, feet.y - this.position.y);
  }

  isFar(feet) {
    return this.distanceTo(feet) > BALANCE.extra.generatorNearDistance;
  }

  update(nightDt, feet) {
    if (!this.on) return;

    if (this.fear.full) {
      this.drop('medo 100%');
      return;
    }

    const far = this.isFar(feet);
    if (!far) return;

    if (!this.clock.chaos && this.drops === 0) {
      this.drop('garantida');
      return;
    }

    const { night, t } = this.clock;
    this.risk = stepGeneratorRisk(night, this.risk, t, nightDt, this.lockedDoor);
    // Risco é uma chance por segundo: converte para a chance neste quadro
    if (Math.random() < 1 - Math.pow(1 - this.risk, nightDt)) this.drop('sabotagem');
  }

  drop(reason) {
    if (!this.on) return;
    this.on = false;
    this.risk = 0;
    this.drops += 1;
    this.lastDropReason = reason;
    this.fear.add(BALANCE.fearEvents.generatorFailure);
    this.listeners.drop.forEach((fn) => fn(reason));
  }

  /** Chamado todo quadro enquanto o jogador segura F perto do gerador. */
  hold(dt) {
    if (this.on) return;
    this.holdProgress = Math.min(1, this.holdProgress + dt / BALANCE.timings.generatorHoldSeconds);
    if (this.holdProgress >= 1) this.restore();
  }

  /** Soltou F ou se afastou: perde o progresso. */
  release() {
    this.holdProgress = 0;
  }

  restore() {
    this.on = true;
    this.holdProgress = 0;
    this.listeners.restore.forEach((fn) => fn());
  }
}
