// Diretor das alucinações (GDD 4.6, 5 e 9.2).
//
// - Antes de a noite começar não há alucinações (o diretor fica desligado).
// - O intervalo entre uma alucinação e a próxima depende SÓ dos ursos coletados: sem
//   nenhum, curtíssimo; com todos, o máximo da noite (fórmula 9.2, com ±20%).
// - Trava: enquanto os ursos coletados forem menos que a trava da noite, medo abaixo de
//   5% (luz acesa) dispara uma alucinação na hora — com poucos ursos, o medo nunca zera.
// - Luz apagada: só passos falsos. TV e telefone só com Artur perto deles.
// - Sempre um intervalo mínimo entre uma alucinação e a próxima (3 s).
// - Enquanto uma alucinação acontece, o medo não cai sozinho.

import { BALANCE } from '../config/balance.js';
import { rollHallucinationGap } from './formulas.js';

// Peso no sorteio (Helena é rara)
const WEIGHTS = {
  balloon: 1,
  bloodPool: 1,
  shadow: 1,
  flicker: 1,
  flickerHelena: 0.25,
  fakeSteps: 0.8,
  // TV e telefone só entram no sorteio com Artur perto deles; aí ganham peso alto,
  // senão quase nunca aconteciam
  tv: 3,
  landline: 3,
};

export class HallucinationDirector {
  /**
   * @param factory   (kind, opts) => alucinação
   * @param available (kind, { lightsOn }) => pode acontecer agora?
   */
  constructor(clock, fear, factory, available) {
    this.clock = clock;
    this.fear = fear;
    this.factory = factory;
    this.available = available;
    this.active = null;
    this.nextAt = null; // tempo da noite (s) da próxima alucinação
    this.lastEnd = -Infinity; // tempo da noite em que a última terminou
    this.enabled = false; // liga quando a noite começa
    this.count = 0;
    this.lastKind = null;
  }

  /** Trava ativa? (ursos coletados abaixo da trava da noite) */
  get locked() {
    return this.clock.bearsCollected < this.clock.night.bearLock;
  }

  /**
   * @param dt      segundos reais (duração das alucinações)
   * @param nightDt segundos da noite (acelera no debug)
   * @param ctx     { lightsOn, blocked, playerMoving, playerVelocity }
   */
  update(dt, nightDt, ctx) {
    if (this.active) {
      // Luz apagou: alucinações param na hora (menos passos falsos)
      if (!ctx.lightsOn && !this.active.worksInDark) this.finish();
      else {
        this.active.update(dt, ctx);
        if (this.active.done) this.finish();
      }
      return;
    }

    if (!this.enabled || ctx.blocked) return;
    const t = this.clock.t;
    this.nextAt ??= t + rollHallucinationGap(this.clock.night, this.clock.bears);

    const minGapOver = t - this.lastEnd >= BALANCE.extra.hallucinationMinGap;
    if (ctx.lightsOn && this.locked && minGapOver && this.fear.value < BALANCE.extra.lowFearTrigger) {
      this.start(ctx);
      return;
    }
    if (t >= this.nextAt) this.start(ctx);
  }

  /** Sorteia e começa uma alucinação. `kind` força um tipo (debug). */
  start(ctx, kind = null, opts = {}) {
    const chosen = kind ?? this.pick(ctx);
    if (!chosen) return null;
    this.active = this.factory(chosen, opts);
    this.fear.hallucinating = true;
    this.count += 1;
    this.lastKind = chosen;
    return this.active;
  }

  pick(ctx) {
    const options = Object.entries(WEIGHTS).filter(
      // Evita repetir o mesmo tipo duas vezes seguidas
      ([kind]) => kind !== this.lastKind && this.available(kind, ctx),
    );
    const total = options.reduce((s, [, w]) => s + w, 0);
    if (total <= 0) return null;
    let r = Math.random() * total;
    for (const [kind, w] of options) {
      r -= w;
      if (r <= 0) return kind;
    }
    return options[options.length - 1][0];
  }

  finish() {
    this.active.end();
    this.active = null;
    this.fear.hallucinating = false;
    this.lastEnd = this.clock.t;
    this.nextAt = this.clock.t + rollHallucinationGap(this.clock.night, this.clock.bears);
  }

  /** Brilho da zona atual (alucinações de luz), 1 = normal. */
  get lightFactor() {
    return this.active?.lightFactor ?? 1;
  }
}

export const HALLUCINATION_KINDS = Object.keys(WEIGHTS);
