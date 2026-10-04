// Coração do Artur (GDD 5 e 7): um batimento só, contínuo, que muda com o que acontece.
//
// - Volume e ritmo sobem com o medo, com o medo SUBINDO (ex.: chegando perto da poça de
//   sangue), durante alucinações e, muito mais, em perseguições.
// - Medo baixo e parado: o coração quase não se ouve.
// - A cada batida, o HUD pulsa as bordas da tela (mais forte quanto mais o medo sobe).

import { BALANCE } from '../config/balance.js';

export class Heart {
  constructor(fear, sfx, hud) {
    this.fear = fear;
    this.sfx = sfx;
    this.hud = hud;
    this.rise = 0; // medo subindo (pontos por segundo, suavizado)
    this.pending = 0; // medo somado desde o último quadro
    this.nextBeat = 0;
    this.level = 0;
    this.dread = 0;
    fear.onIncrease((amount) => {
      this.pending += amount;
      // Susto grande: a próxima batida vem já
      if (amount >= BALANCE.heart.jumpFear) this.nextBeat = Math.min(this.nextBeat, 0.05);
    });
  }

  /**
   * @param dt segundos reais
   * @param state { hallucinating, chasing }
   */
  update(dt, { hallucinating, chasing }) {
    const h = BALANCE.heart;
    // Medo subindo: média dos últimos ~1 s
    const instant = dt > 0 ? this.pending / dt : 0;
    this.pending = 0;
    this.rise += (instant - this.rise) * (1 - Math.exp(-dt / h.riseSmoothing));
    const rising = Math.min(1, this.rise / h.riseForFull);

    // Intensidade (0 a 1): medo atual, medo subindo, alucinação, perseguição
    const target = Math.min(
      1,
      (this.fear.value / 100) * h.weightFear + rising * h.weightRising + (hallucinating ? h.weightHallucination : 0) + (chasing ? h.weightChase : 0),
    );
    // Sobe rápido, desce devagar (o coração demora a acalmar)
    const speed = target > this.level ? 3 : 0.35;
    this.level += (target - this.level) * (1 - Math.exp(-dt * speed));
    // Bordas da tela: só quando o medo sobe ou há perseguição (não por medo parado)
    this.dread = Math.min(1, rising * 0.9 + (chasing ? 0.7 : 0) + (hallucinating ? 0.15 : 0));

    this.nextBeat -= dt;
    if (this.nextBeat > 0) return;
    const bpm = h.bpmMin + (h.bpmMax - h.bpmMin) * this.level;
    this.nextBeat = 60 / bpm;
    const volume = this.level < h.silentBelow ? 0 : h.volumeMin + (h.volumeMax - h.volumeMin) * this.level;
    if (volume > 0) this.sfx.heartBeat(volume, 60 / bpm);
    this.hud.heartPulse(this.dread, this.rise > 0.3);
  }

  /** Para o debug. */
  get debugText() {
    const h = BALANCE.heart;
    return `${Math.round(h.bpmMin + (h.bpmMax - h.bpmMin) * this.level)} bpm · nível ${this.level.toFixed(2)} · subindo ${this.rise.toFixed(1)}/s`;
  }
}
