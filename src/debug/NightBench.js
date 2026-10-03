// Bancada do modo debug: simula o relógio de uma noite e mostra os valores das
// fórmulas da seção 9.2 para o dia escolhido. Fica até os sistemas reais
// (etapas 3 e 4) assumirem esses números.
//
// Atalhos (só com o debug ligado):
//   1–7  escolhe o dia      R  reinicia a noite      T  acelera o tempo (1×, 10×, 60×)

import { TOTAL_DAYS, nightBalance } from '../config/balance.js';
import {
  hallucinationRate,
  isChaosPhase,
  calmWindow,
  fearDecayPerSecond,
  stepGeneratorRisk,
  generatorSleepChance,
} from '../systems/formulas.js';
import { debug } from './debug.js';

const SPEEDS = [1, 10, 60];

export class NightBench {
  constructor(scene) {
    this.day = 1;
    this.speedIndex = 0;
    this.reset();

    scene.input.keyboard.on('keydown', (event) => {
      if (!debug.enabled) return;
      const n = Number(event.key);
      if (n >= 1 && n <= TOTAL_DAYS) {
        this.day = n;
        this.reset();
      } else if (event.key === 'r' || event.key === 'R') {
        this.reset();
      } else if (event.key === 't' || event.key === 'T') {
        this.speedIndex = (this.speedIndex + 1) % SPEEDS.length;
      }
    });
  }

  reset() {
    this.night = nightBalance(this.day);
    this.t = 0;
    this.generatorRisk = 0;
    this.generatorFailures = 0;
  }

  update(dtReal) {
    const dt = dtReal * SPEEDS[this.speedIndex];
    this.t += dt;
    // Gerador com Artur sempre longe (pior caso), só para conferir a curva.
    this.generatorRisk = stepGeneratorRisk(this.night, this.generatorRisk, this.t, dt);
    if (Math.random() < 1 - Math.pow(1 - this.generatorRisk, dt)) {
      this.generatorFailures += 1;
      this.generatorRisk = 0;
    }
    if (debug.enabled) this.publish();
  }

  publish() {
    const { night, t } = this;
    const min = Math.floor(t / 60);
    const sec = Math.floor(t % 60).toString().padStart(2, '0');

    debug.set('Noite (simulada)/Atalhos', '1–7 dia · R reinicia · T velocidade');
    debug.set('Noite (simulada)/Dia', `${this.day}`);
    debug.set('Noite (simulada)/Tempo', `${min}:${sec}  (${SPEEDS[this.speedIndex]}×)`);
    debug.set(
      'Noite (simulada)/Fase',
      isChaosPhase(night, t) ? `CAOS (faltam ${(night.chaosDuration - t).toFixed(0)} s)` : 'recuperação',
    );
    debug.set('Noite (simulada)/Alucinação', `${hallucinationRate(night, t).toFixed(4)} /s`);
    debug.set('Noite (simulada)/Janela de calma', `${calmWindow(night, t).toFixed(1)} s`);
    debug.set('Noite (simulada)/Queda do medo', `${fearDecayPerSecond(night, t).toFixed(3)} %/s`);
    debug.set('Noite (simulada)/Mult. de medo', `×${night.fearMultiplier.toFixed(2)}`);
    debug.set('Noite (simulada)/Monstros (escuro)', `${night.monsterEventRate.toFixed(4)} /s`);
    debug.set('Noite (simulada)/Remédios · pilhas', `${night.medicineCount} · ${night.batteryCount}`);
    debug.set(
      'Noite (simulada)/Gerador: risco',
      `${this.generatorRisk.toFixed(5)} /s  (teto ${night.generatorRiskCap})`,
    );
    debug.set('Noite (simulada)/Gerador: quedas', `${this.generatorFailures}`);
    debug.set(
      'Noite (simulada)/Gerador: no sono',
      `${(generatorSleepChance(night.generatorSleepBaseChance, t) * 100).toFixed(1)}%`,
    );
  }

  destroy() {
    debug.clearGroup('Noite (simulada)');
  }
}
