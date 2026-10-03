// Diretor das alucinações: a curva da noite (GDD 4.6 e 9.2).
//
// - Só com luz acesa. Nunca durante a sequência de sono ou com a caixa de diálogo aberta.
// - Frequência cai ao longo da noite (fórmula da taxa), mas nunca chega a zero.
// - Fase de caos (início até X s): sem janela de calma; se o medo chegar perto de zero,
//   dispara uma alucinação na hora.
// - Fase de recuperação: depois de cada alucinação, uma janela de calma garantida,
//   que cresce até o tamanho terminal da noite.
// - Enquanto uma alucinação acontece, o medo não cai sozinho.
//
// Os tipos de alucinação entram na etapa 5; por enquanto só a luz piscando.

import { BALANCE } from '../config/balance.js';
import { FlickerHallucination } from '../hallucinations/Flicker.js';
import { calmWindow, hallucinationRate } from './formulas.js';

const NEAR_ZERO_FEAR = 1; // % — "medo se aproximando de zero" no caos

export class HallucinationDirector {
  constructor(clock, fear) {
    this.clock = clock;
    this.fear = fear;
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

    const { night, t } = this.clock;
    if (this.clock.chaos && this.fear.value < NEAR_ZERO_FEAR) {
      this.start();
      return;
    }
    const rate = hallucinationRate(night, t);
    if (Math.random() < 1 - Math.exp(-rate * nightDt)) this.start();
  }

  start() {
    this.active = new FlickerHallucination(this.fear);
    this.fear.hallucinating = true;
    this.count += 1;
  }

  finish() {
    this.active.end();
    this.active = null;
    this.fear.hallucinating = false;
    // Janela de calma só na fase de recuperação (a fórmula já dá 0 durante o caos)
    this.calmUntil = this.clock.t + calmWindow(this.clock.night, this.clock.t);
  }

  /** Brilho extra da zona atual (alucinações de luz), 1 = normal. */
  get lightFactor() {
    return this.active?.lightFactor ?? 1;
  }
}
