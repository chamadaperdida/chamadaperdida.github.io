// Diretor das alucinações: a curva da noite (GDD 4.6 e 9.2).
//
// - Só com luz acesa. Nunca durante a sequência de sono ou com a caixa de diálogo aberta.
// - A PRIMEIRA alucinação da noite é sempre a mais forte: luz piscando com Helena, +40 de medo.
// - Frequência: taxa da fórmula 9.2 × (1 − medo/100). Quanto mais medo, menos alucinações;
//   com o medo baixo elas voltam a vir com força. Nunca chega a zero com medo < 100%.
// - Fase de caos (início até X s): sem janela de calma; com medo baixo (< 5%), dispara na hora.
// - Fase de recuperação: depois de cada alucinação, uma janela de calma garantida,
//   que cresce até o tamanho terminal da noite.
// - Sempre um intervalo mínimo entre uma alucinação e a próxima (3 s).
// - Enquanto uma alucinação acontece, o medo não cai sozinho.
//
// Os outros tipos de alucinação entram na etapa 5.

import { BALANCE } from '../config/balance.js';
import { calmWindow, hallucinationRate } from './formulas.js';

export class HallucinationDirector {
  /**
   * @param factory (kind) => alucinação. kind: 'helena-first' | 'flicker'
   */
  constructor(clock, fear, factory) {
    this.clock = clock;
    this.fear = fear;
    this.factory = factory;
    this.active = null;
    this.calmUntil = 0; // tempo da noite (s) até quando não pode haver alucinação
    this.enabled = false; // liga depois da fala de chegada
    this.count = 0;
  }

  /** Começa a contar depois de um atraso (s de jogo). */
  enableAfter(scene, seconds = BALANCE.extra.hallucinationStartDelay) {
    scene.time.delayedCall(seconds * 1000, () => {
      this.enabled = true;
    });
  }

  get inCalm() {
    return this.clock.t < this.calmUntil;
  }

  /** Taxa efetiva agora (alucinações por segundo). */
  get rate() {
    return hallucinationRate(this.clock.night, this.clock.t) * Math.max(0, 1 - this.fear.value / 100);
  }

  /**
   * @param dt      segundos reais (duração das alucinações)
   * @param nightDt segundos da noite (curva; acelera no debug)
   * @param ctx     { lightsOn, blocked, playerMoving }
   */
  update(dt, nightDt, ctx) {
    if (this.active) {
      // Luz apagou: alucinações param na hora
      if (!ctx.lightsOn) this.finish();
      else {
        this.active.update(dt, ctx);
        if (this.active.done) this.finish();
      }
      return;
    }

    if (!this.enabled || !ctx.lightsOn || ctx.blocked || this.inCalm) return;

    if (this.count === 0) {
      this.start('helena-first');
      return;
    }
    if (this.clock.chaos && this.fear.value < BALANCE.extra.chaosLowFearTrigger) {
      this.start();
      return;
    }
    if (Math.random() < 1 - Math.exp(-this.rate * nightDt)) this.start();
  }

  start(kind = 'flicker') {
    this.active = this.factory(kind);
    this.fear.hallucinating = true;
    this.count += 1;
  }

  finish() {
    this.active.end();
    this.active = null;
    this.fear.hallucinating = false;
    // Janela de calma (a fórmula dá 0 durante o caos), nunca menor que o intervalo mínimo
    const calm = Math.max(BALANCE.extra.hallucinationMinGap, calmWindow(this.clock.night, this.clock.t));
    this.calmUntil = this.clock.t + calm;
  }

  /** Brilho extra da zona atual (alucinações de luz), 1 = normal. */
  get lightFactor() {
    return this.active?.lightFactor ?? 1;
  }
}
