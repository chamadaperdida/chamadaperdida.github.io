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
// - Sorteio com memória: cada tipo tem uma "vez" acumulada (sua fatia do total). A cada
//   sorteio todos acumulam; quem sai paga uma vez. Quem está devendo mais tem bem mais
//   chance. Assim todos aparecem por igual ao longo da noite (Helena continua rara), e um
//   tipo que não podia acontecer (TV longe, sem porta para o vulto) entra logo que puder.

import { BALANCE } from '../config/balance.js';
import { rollHallucinationGap } from './formulas.js';

// Fatia de cada tipo no total da noite (Helena é rara)
const WEIGHTS = {
  balloon: 1,
  bloodPool: 1,
  shadow: 1,
  flicker: 1,
  flickerHelena: 0.25,
  fakeSteps: 1,
  tv: 1,
  landline: 1,
};
const TOTAL_WEIGHT = Object.values(WEIGHTS).reduce((s, w) => s + w, 0);
const MAX_DEBT = 2.5; // vezes acumuladas, no máximo (evita rajada do mesmo tipo)

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
    // Vez acumulada de cada tipo (começa sorteada, para a noite não abrir sempre igual)
    this.debt = Object.fromEntries(Object.keys(WEIGHTS).map((k) => [k, Math.random() * 0.5 - 0.25]));
    this.seen = Object.fromEntries(Object.keys(WEIGHTS).map((k) => [k, 0]));
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
    this.seen[chosen] += 1;
    // Todos acumulam sua fatia; quem saiu paga uma vez
    for (const [k, w] of Object.entries(WEIGHTS)) this.debt[k] = Math.min(MAX_DEBT, this.debt[k] + w / TOTAL_WEIGHT);
    this.debt[chosen] -= 1;
    // O teto não pode "sumir" com vezes: recentra para a soma continuar zero
    const kinds = Object.keys(this.debt);
    const mean = kinds.reduce((s, k) => s + this.debt[k], 0) / kinds.length;
    for (const k of kinds) this.debt[k] -= mean;
    return this.active;
  }

  pick(ctx) {
    // Evita repetir o mesmo tipo duas vezes seguidas
    const kinds = Object.keys(WEIGHTS).filter((kind) => kind !== this.lastKind && this.available(kind, ctx));
    if (!kinds.length) return null;
    // Chance pelo quanto cada um está devendo (ao quadrado: quem deve mais quase sempre sai)
    const chance = kinds.map((kind) => Math.max(0, this.debt[kind]) ** 2 + 0.0005);
    let r = Math.random() * chance.reduce((s, c) => s + c, 0);
    for (let i = 0; i < kinds.length; i++) {
      r -= chance[i];
      if (r <= 0) return kinds[i];
    }
    return kinds[kinds.length - 1];
  }

  /** Quantas vezes cada tipo saiu na noite (debug). */
  get seenText() {
    return Object.entries(this.seen)
      .map(([k, n]) => `${k} ${n}`)
      .join(' · ');
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
