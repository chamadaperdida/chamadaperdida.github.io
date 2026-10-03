// Cena provisória da Etapa 1: confirma que o projeto roda e serve de bancada
// para o modo debug. Ela simula o relógio de uma noite e mostra no painel
// os valores das fórmulas da seção 9.2 para o dia escolhido.
//
// Atalhos (só com o debug ligado):
//   1–7  escolhe o dia      R  reinicia a noite      T  acelera o tempo (1×, 10×, 60×)

import Phaser from 'phaser';
import { BALANCE, TOTAL_DAYS, nightBalance } from '../config/balance.js';
import {
  hallucinationRate,
  isChaosPhase,
  calmWindow,
  fearDecayPerSecond,
  stepGeneratorRisk,
  generatorSleepChance,
} from '../systems/formulas.js';
import { debug } from '../debug/debug.js';

const SPEEDS = [1, 10, 60];
const RED = '#c0262d';

export class PrototypeScene extends Phaser.Scene {
  constructor() {
    super('Prototype');
  }

  create() {
    const { width, height } = this.scale;

    this.title = this.add
      .text(width / 2, height / 2 - 24, 'CHAMADA PERDIDA', {
        fontFamily: 'monospace',
        fontSize: '32px',
        fontStyle: 'bold',
        color: RED,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 16, 'protótipo — etapa 1', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#6b7380',
      })
      .setOrigin(0.5);

    this.day = 1;
    this.speedIndex = 0;
    this.resetNight();

    this.input.keyboard.on('keydown', (event) => {
      if (!debug.enabled) return;
      const n = Number(event.key);
      if (n >= 1 && n <= TOTAL_DAYS) {
        this.day = n;
        this.resetNight();
      } else if (event.key === 'r' || event.key === 'R') {
        this.resetNight();
      } else if (event.key === 't' || event.key === 'T') {
        this.speedIndex = (this.speedIndex + 1) % SPEEDS.length;
      }
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      debug.clearGroup('Noite');
      debug.clearGroup('Gerador');
    });
  }

  resetNight() {
    this.night = nightBalance(this.day);
    this.t = 0;
    this.generatorRisk = 0;
    this.generatorFailures = 0;
  }

  update(_time, deltaMs) {
    this.glitchTitle();

    const dt = (deltaMs / 1000) * SPEEDS[this.speedIndex];
    this.t += dt;

    // Simula o gerador com Artur sempre longe (pior caso), só para conferir a curva.
    this.generatorRisk = stepGeneratorRisk(this.night, this.generatorRisk, this.t, dt);
    if (Math.random() < 1 - Math.pow(1 - this.generatorRisk, dt)) {
      this.generatorFailures += 1;
      this.generatorRisk = 0;
    }

    if (debug.enabled) this.publishDebug();
  }

  publishDebug() {
    const night = this.night;
    const t = this.t;
    const min = Math.floor(t / 60);
    const sec = Math.floor(t % 60).toString().padStart(2, '0');

    debug.set('Geral/FPS', Math.round(this.game.loop.actualFps));
    debug.set('Geral/Atalhos', '1–7 dia · R reinicia · T velocidade');

    debug.set('Noite/Dia', `${this.day}`);
    debug.set('Noite/Tempo', `${min}:${sec}  (${SPEEDS[this.speedIndex]}×)`);
    debug.set(
      'Noite/Fase',
      isChaosPhase(night, t)
        ? `CAOS (faltam ${(night.chaosDuration - t).toFixed(0)} s)`
        : 'recuperação',
    );
    debug.set('Noite/Medo', '— (etapa 3)');
    debug.set('Noite/Alucinação', `${hallucinationRate(night, t).toFixed(4)} /s`);
    debug.set('Noite/Janela de calma', `${calmWindow(night, t).toFixed(1)} s`);
    debug.set('Noite/Queda do medo', `${fearDecayPerSecond(night, t).toFixed(3)} %/s`);
    debug.set('Noite/Mult. de medo', `×${night.fearMultiplier.toFixed(2)}`);
    debug.set('Noite/Monstros (escuro)', `${night.monsterEventRate.toFixed(4)} /s`);
    debug.set('Noite/Remédios · pilhas', `${night.medicineCount} · ${night.batteryCount}`);

    debug.set(
      'Gerador/Risco',
      `${this.generatorRisk.toFixed(5)} /s  (teto ${night.generatorRiskCap})`,
    );
    debug.set('Gerador/Quedas simuladas', `${this.generatorFailures}`);
    debug.set(
      'Gerador/Chance no sono',
      `${(generatorSleepChance(night.generatorSleepBaseChance, t) * 100).toFixed(1)}%`,
    );
    debug.set(
      'Gerador/Tranca',
      `1ª tentativa ${BALANCE.lockEvent.firstAttemptMin}–${BALANCE.lockEvent.firstAttemptMax} s`,
    );
  }

  // Glitch ocasional do título (GDD 2.1).
  glitchTitle() {
    if (this.title.glitching) return;
    if (Math.random() < 0.004) {
      this.title.glitching = true;
      const baseX = this.title.x;
      this.title.setX(baseX + Phaser.Math.Between(-4, 4)).setAlpha(0.6);
      this.time.delayedCall(Phaser.Math.Between(40, 120), () => {
        this.title.setX(baseX).setAlpha(1);
        this.title.glitching = false;
      });
    }
  }
}
