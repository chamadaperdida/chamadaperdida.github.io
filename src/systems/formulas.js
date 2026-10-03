// Fórmulas da curva da noite (GDD, seção 9.2).
// Todas recebem `night` = nightBalance(dia) e `t` = segundos desde o início da noite.

import { BALANCE } from '../config/balance.js';

const F = BALANCE.formulas;

/** Alucinações por segundo no instante t. */
export function hallucinationRate(night, t) {
  const { hallucinationRateStart: start, hallucinationRateMin: min } = night;
  return min + (start - min) * Math.exp(-t / F.hallucinationDecayTau);
}

/** Está na fase de caos? (sem janelas de calma) */
export function isChaosPhase(night, t) {
  return t < night.chaosDuration;
}

/** Janela de calma garantida após cada alucinação (s). Zero durante o caos. */
export function calmWindow(night, t) {
  if (isChaosPhase(night, t)) return 0;
  return night.calmWindowTerminal * (1 - Math.exp(-(t - night.chaosDuration) / F.calmWindowTau));
}

/** Quanto o medo cai por segundo (luz acesa, sem alucinação), em pontos percentuais. */
export function fearDecayPerSecond(night, t) {
  const { fearDecayStart: start, fearDecayTerminal: terminal } = night;
  return terminal - (terminal - start) * Math.exp(-t / F.fearDecayTau);
}

/**
 * Quanto o risco do gerador cresce neste segundo (só com Artur longe).
 * O chamador soma ao risco atual e limita com generatorRiskCap.
 */
export function generatorRiskIncrement(night, t, lockedDoor = false) {
  const mult = lockedDoor ? F.generatorRiskLockedDoorMultiplier : 1;
  return night.generatorRiskIncrement * Math.exp(-t / F.generatorRiskTau) * mult;
}

/** Soma `dt` segundos de crescimento ao risco atual, respeitando o teto. */
export function stepGeneratorRisk(night, risk, t, dt, lockedDoor = false) {
  return Math.min(night.generatorRiskCap, risk + generatorRiskIncrement(night, t, lockedDoor) * dt);
}

/**
 * Chance de o gerador cair durante a sequência de sono.
 * `base` começa em night.generatorSleepBaseChance e perde 35 p.p. a cada queda no sono.
 */
export function generatorSleepChance(base, t) {
  return base * Math.exp(-t / F.generatorSleepTau);
}

/** Nova base depois de uma queda durante o sono. */
export function reduceSleepBase(base) {
  return Math.max(0, base - F.generatorSleepBasePenalty);
}
