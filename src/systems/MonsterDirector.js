// Diretor dos monstros (GDD 6 e 7). Só com a luz apagada.
//
// - Eventos de monstro na taxa da noite (9.1, "eventos de monstro no escuro por s").
// - Sorteio entre Invasor, Artur distorcido, Clara e Helena.
// - Medo abaixo de 100%: um evento por vez (a perseguição do Invasor não coincide com
//   as risadas da Clara nem com o Artur distorcido).
// - Medo chegando a 100%: perseguição garantida do Invasor furioso, e os eventos podem
//   acontecer ao mesmo tempo.
// - A luz voltou: todos os monstros somem.

import { InvaderEvent } from '../monsters/Invader.js';
import { DistortedArturEvent } from '../monsters/DistortedArtur.js';
import { ClaraEvent } from '../monsters/Clara.js';
import { HelenaEvent } from '../monsters/Helena.js';

const EVENTS = {
  invasor: InvaderEvent,
  distorcido: DistortedArturEvent,
  clara: ClaraEvent,
  helena: HelenaEvent,
};
export const MONSTER_KINDS = Object.keys(EVENTS);
const FURY_RETURN = 6; // s até o Invasor furioso voltar, se o medo continuar em 100%

export class MonsterDirector {
  constructor(ctx, clock, fear) {
    this.ctx = ctx;
    this.clock = clock;
    this.fear = fear;
    this.active = [];
    this.wasFull = false;
    this.count = 0;
  }

  get chasing() {
    return this.active.some((e) => e.chasing);
  }

  /**
   * @param frame { dark, playerMoving }
   */
  update(dt, nightDt, frame) {
    if (!frame.dark) {
      if (this.active.length) this.endAll();
      this.wasFull = this.fear.full;
      return;
    }

    // Medo chegando a 100%: Invasor furioso garantido
    // (e, enquanto continuar em 100% no escuro, ele volta depois de um respiro)
    const justFull = this.fear.full && !this.wasFull;
    this.wasFull = this.fear.full;
    const invader = this.active.find((e) => e.kind === 'invasor');
    if (justFull && invader) invader.enrage();
    if (!invader) this.furyCooldown = Math.max(0, (this.furyCooldown ?? 0) - dt);
    if (this.fear.full && !invader && (justFull || this.furyCooldown === 0)) {
      this.start('invasor', { furious: true });
      this.furyCooldown = FURY_RETURN;
    }

    for (const e of this.active) e.update(dt, frame);
    for (const e of this.active.filter((ev) => ev.done)) e.end();
    this.active = this.active.filter((e) => !e.done);

    // Abaixo de 100%: um evento por vez
    if (this.active.length && !this.fear.full) return;
    const rate = this.clock.night.monsterEventRate;
    if (Math.random() < 1 - Math.exp(-rate * nightDt)) {
      const free = MONSTER_KINDS.filter((k) => !this.active.some((e) => e.kind === k));
      if (free.length) this.start(free[Math.floor(Math.random() * free.length)]);
    }
  }

  start(kind, opts) {
    const event = new EVENTS[kind](this.ctx, opts);
    if (event.done) {
      event.end();
      return null; // não achou onde aparecer
    }
    this.active.push(event);
    this.count += 1;
    return event;
  }

  endAll() {
    this.active.forEach((e) => e.end());
    this.active = [];
  }
}
