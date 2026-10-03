// Diretor das alucinações: a curva da noite (GDD 4.6, 5 e 9.2).
//
// - A noite começa com o EVENTO GARANTIDO a caminho do quarto (GDD 4.8): ele é a primeira
//   alucinação e dá +25 de medo. Antes dele não há alucinações (o diretor fica desligado).
// - Depois: sorteio entre as alucinações disponíveis, na taxa da fórmula 9.2.
// - Luz apagada: só passos falsos. TV e telefone só com Artur perto deles.
// - Fase de caos: sem janela de calma; com medo baixo (< 5%), dispara na hora.
// - Fase de recuperação: depois de cada alucinação, uma janela de calma garantida,
//   que cresce até o tamanho terminal da noite.
// - Sempre um intervalo mínimo entre uma alucinação e a próxima (3 s).
// - Enquanto uma alucinação acontece, o medo não cai sozinho.

import { BALANCE } from '../config/balance.js';
import { calmWindow, hallucinationRate } from './formulas.js';

// Peso no sorteio (Helena é rara)
const WEIGHTS = {
  balloon: 1,
  bloodPool: 1,
  shadow: 1,
  flicker: 1,
  flickerHelena: 0.25,
  fakeSteps: 0.8,
  tv: 1.2,
  landline: 1.2,
};

export class HallucinationDirector {
  /**
   * @param factory   (kind, { first }) => alucinação
   * @param available (kind, { lightsOn }) => pode acontecer agora?
   */
  constructor(clock, fear, factory, available) {
    this.clock = clock;
    this.fear = fear;
    this.factory = factory;
    this.available = available;
    this.active = null;
    this.calmUntil = 0; // tempo da noite (s) até quando não pode haver alucinação
    this.enabled = false; // liga depois do evento garantido
    this.count = 0;
    this.lastKind = null;
  }

  get inCalm() {
    return this.clock.t < this.calmUntil;
  }

  get rate() {
    return hallucinationRate(this.clock.night, this.clock.t);
  }

  /**
   * @param dt      segundos reais (duração das alucinações)
   * @param nightDt segundos da noite (curva; acelera no debug)
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

    if (!this.enabled || ctx.blocked || this.inCalm) return;

    if (ctx.lightsOn && this.clock.chaos && this.fear.value < BALANCE.extra.chaosLowFearTrigger) {
      this.start(ctx);
      return;
    }
    if (Math.random() < 1 - Math.exp(-this.rate * nightDt)) this.start(ctx);
  }

  /** Sorteia e começa uma alucinação. `kind` força um tipo (evento garantido, debug). */
  start(ctx, kind = null, opts = {}) {
    const chosen = kind ?? this.pick(ctx);
    if (!chosen) return null;
    this.active = this.factory(chosen, { first: this.count === 0, ...opts });
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
    // Janela de calma (a fórmula dá 0 durante o caos), nunca menor que o intervalo mínimo
    const calm = Math.max(BALANCE.extra.hallucinationMinGap, calmWindow(this.clock.night, this.clock.t));
    this.calmUntil = this.clock.t + calm;
  }

  /** Brilho da zona atual (alucinações de luz), 1 = normal. */
  get lightFactor() {
    return this.active?.lightFactor ?? 1;
  }
}

export const HALLUCINATION_KINDS = Object.keys(WEIGHTS);
