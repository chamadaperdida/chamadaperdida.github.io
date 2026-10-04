// Fórmulas da noite (GDD, seção 9.2).
// Todas recebem `night` = nightBalance(dia). O que antes o tempo facilitava agora depende
// dos ursos coletados: `bears` = fração dos ursos da noite já coletados (0 a 1).

import { BALANCE } from '../config/balance.js';

const F = BALANCE.formulas;

/** Intervalo médio (s) entre o fim de uma alucinação e o começo da próxima. */
export function hallucinationGap(night, bears) {
  const { hallucinationGapNoBears: none, hallucinationGapAllBears: all } = night;
  return none + (all - none) * Math.pow(bears, F.hallucinationGapExponent);
}

/** Intervalo sorteado: o médio com ±20%, nunca menor que o mínimo. */
export function rollHallucinationGap(night, bears) {
  const j = F.hallucinationGapJitter;
  const gap = hallucinationGap(night, bears) * (1 - j + Math.random() * 2 * j);
  return Math.max(BALANCE.extra.hallucinationMinGap, gap);
}

/** Quanto o medo cai por segundo (luz acesa, sem alucinação), em pontos percentuais. */
export function fearDecayPerSecond(night) {
  return night.fearDecay;
}

/**
 * Quanto o risco do gerador cresce neste segundo (só com Artur longe).
 * O chamador soma ao risco atual e limita com generatorRiskCap.
 */
export function generatorRiskIncrement(night, bears, lockedDoor = false) {
  const mult = lockedDoor ? F.generatorRiskLockedDoorMultiplier : 1;
  return night.generatorRiskIncrement * (1 - F.generatorRiskBearFactor * bears) * mult;
}

/** Soma `dt` segundos de crescimento ao risco atual, respeitando o teto. */
export function stepGeneratorRisk(night, risk, bears, dt, lockedDoor = false) {
  return Math.min(night.generatorRiskCap, risk + generatorRiskIncrement(night, bears, lockedDoor) * dt);
}

/**
 * Chance de o gerador cair durante a sequência de sono.
 * `base` começa em night.generatorSleepBaseChance e perde 35 p.p. a cada queda no sono.
 */
export function generatorSleepChance(base, bears) {
  return base * (1 - F.generatorSleepBearFactor * bears);
}

/** Nova base depois de uma queda durante o sono. */
export function reduceSleepBase(base) {
  return Math.max(0, base - F.generatorSleepBasePenalty);
}
