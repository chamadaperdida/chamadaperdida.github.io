// Diretor dos monstros (GDD 6 e 7). Só com a luz apagada.
//
// - Helena: presença quase constante no escuro. Sempre que nenhum outro monstro está
//   agindo, ela está em algum lugar perto (e vai mudando de lugar). Quando outro monstro
//   age, ela some e volta depois.
// - Invasor, Artur distorcido e Clara: eventos na taxa da noite (9.1, "eventos de monstro
//   no escuro por s").
// - Medo abaixo de 100%: um desses por vez (a perseguição do Invasor não coincide com as
//   risadas da Clara nem com o Artur distorcido).
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
const RANDOM_KINDS = ['invasor', 'distorcido', 'clara'];
const FURY_RETURN = 6; // s até o Invasor furioso voltar, se o medo continuar em 100%
const HELENA_RETURN = [1, 2.5]; // s até a Helena reaparecer (em outro lugar)
const HELENA_FIRST = 2; // s depois da luz cair, a Helena já está por perto

export class MonsterDirector {
  constructor(ctx, clock, fear) {
    this.ctx = ctx;
    this.clock = clock;
    this.fear = fear;
    this.active = [];
    this.wasFull = false;
    this.count = 0;
    this.helenaIn = HELENA_FIRST;
  }

  get chasing() {
    return this.active.some((e) => e.chasing);
  }

  /** Outros monstros (não a Helena) agindo agora. */
  get others() {
    return this.active.filter((e) => e.kind !== 'helena');
  }

  /**
   * @param frame { dark, playerMoving }
   */
  update(dt, nightDt, frame) {
    if (!frame.dark) {
      if (this.active.length) this.endAll();
      this.wasFull = this.fear.full;
      this.helenaIn = HELENA_FIRST;
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
    for (const e of this.active.filter((ev) => ev.done)) {
      e.end();
      if (e.kind === 'helena') this.helenaIn = HELENA_RETURN[0] + Math.random() * (HELENA_RETURN[1] - HELENA_RETURN[0]);
    }
    this.active = this.active.filter((e) => !e.done);

    // Outro monstro agindo: a Helena some (abaixo de 100% de medo)
    const helena = this.active.find((e) => e.kind === 'helena');
    if (helena && this.others.length && !this.fear.full) this.stop(helena);

    // Sem outro monstro: a Helena está sempre por perto
    if (!this.active.some((e) => e.kind === 'helena') && (!this.others.length || this.fear.full)) {
      this.helenaIn -= dt;
      if (this.helenaIn <= 0) {
        this.helenaIn = HELENA_RETURN[0];
        this.start('helena');
      }
    }

    // Eventos sorteados (Invasor, Artur distorcido, Clara). Abaixo de 100%: um por vez.
    if (this.others.length && !this.fear.full) return;
    const rate = this.clock.night.monsterEventRate;
    if (Math.random() < 1 - Math.exp(-rate * nightDt)) {
      const free = RANDOM_KINDS.filter((k) => !this.active.some((e) => e.kind === k));
      if (free.length) this.start(free[Math.floor(Math.random() * free.length)]);
    }
  }

  start(kind, opts) {
    const event = new EVENTS[kind](this.ctx, opts);
    if (event.done) {
      event.end();
      return null; // não achou onde aparecer
    }
    // Outro monstro começou a agir: a Helena sai de cena
    if (kind !== 'helena' && !this.fear.full) {
      const helena = this.active.find((e) => e.kind === 'helena');
      if (helena) this.stop(helena);
    }
    this.active.push(event);
    if (kind !== 'helena') this.count += 1;
    return event;
  }

  stop(event) {
    event.end();
    this.active = this.active.filter((e) => e !== event);
    this.helenaIn = HELENA_RETURN[1];
  }

  endAll() {
    this.active.forEach((e) => e.end());
    this.active = [];
  }
}
