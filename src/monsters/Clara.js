// Clara (GDD 6): do nada, risadas de criança diabólicas. A risada é um AVISO: depois de
// 1,2 s, se Artur se mexer, ela aparece e corre atrás dele de quatro (1,12× Artur
// correndo) — fuga impossível. A risada sumir é o aviso de que pode voltar a se mexer.
// Sobreviver: ficar parado durante as risadas.

import Phaser from 'phaser';
import { BALANCE } from '../config/balance.js';
import { positional } from '../audio/Sfx.js';
import { Chaser } from './Chaser.js';

const CRACK_EVERY = 0.18; // s — estalos enquanto corre

export class ClaraEvent {
  constructor(ctx) {
    this.ctx = ctx;
    this.kind = 'clara';
    this.name = 'Clara (risadas)';
    this.done = false;
    this.elapsed = 0;
    this.chasing = false;
    const t = BALANCE.timings;
    this.laughSeconds = Phaser.Math.FloatBetween(t.claraLaughMin, t.claraLaughMax);
    // A risada vem de um lado (esquerda ou direita)
    this.laughSound = ctx.sfx.laugh(this.laughSeconds, 0.65, Math.random() < 0.5 ? -0.6 : 0.6);
    this.crackIn = 0;
  }

  get frozenWindow() {
    const t = BALANCE.timings;
    return !this.chasing && this.elapsed >= t.claraLaughGrace && this.elapsed < this.laughSeconds;
  }

  update(dt, { playerMoving }) {
    if (this.done) return;
    this.elapsed += dt;

    if (!this.chasing) {
      if (this.frozenWindow && playerMoving) this.startChase();
      else if (this.elapsed >= this.laughSeconds) this.done = true; // ficou parado: passou
      return;
    }

    this.chaser.update(dt);
    this.crackIn -= dt;
    if (this.crackIn <= 0) {
      this.crackIn = CRACK_EVERY;
      const { volume, pan } = positional(this.ctx.player.feetMeters, this.chaser.feet, 12);
      this.ctx.sfx.cracks(0.6 * volume, pan);
    }
    if (this.chaser.caught) this.ctx.die('clara');
  }

  startChase() {
    // Ela aparece perto (fora da tela) e corre de quatro
    const spawn = this.ctx.findSpawn(5, 9);
    if (!spawn) {
      this.done = true;
      return;
    }
    const m = BALANCE.movement;
    this.chaser = new Chaser(this.ctx, spawn, {
      frames: ['clara-0', 'clara-1'],
      speed: m.arturWalk * m.arturRunMultiplier * m.clara,
      frameTime: 0.08, // rápido e desconjuntado
      bodySize: [12, 6],
    });
    this.chasing = true;
    this.name = 'Clara (perseguindo)';
    this.ctx.fear.add(BALANCE.fearEvents.chase);
  }

  end() {
    this.laughSound.stop();
    this.chaser?.destroy();
  }
}
