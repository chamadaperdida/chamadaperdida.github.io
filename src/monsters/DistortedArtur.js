// Artur distorcido (GDD 6): aparece no escuro e persegue, um pouco mais rápido que Artur
// correndo (1,08×). Reconhecido pelos passos pesados; quase invisível no escuro (só dois
// pontos pálidos no lugar dos olhos; o distintivo reflete a lanterna).
// Sobreviver: apontar a lanterna nele por 0,6 s contínuos — ele se desfaz em cinzas.

import Phaser from 'phaser';
import { BALANCE } from '../config/balance.js';
import { positional } from '../audio/Sfx.js';
import { Chaser } from './Chaser.js';

const STEP_EVERY = 0.34; // s

export class DistortedArturEvent {
  constructor(ctx) {
    this.ctx = ctx;
    this.kind = 'distorcido';
    this.name = 'Artur distorcido';
    this.done = false;
    this.lit = 0;
    this.stepIn = 0;
    this.dying = false;
    const spawn = ctx.findSpawn(8, 13);
    if (!spawn) {
      this.done = true;
      return;
    }
    const m = BALANCE.movement;
    this.chaser = new Chaser(ctx, spawn, {
      frames: ['distorted-0', 'distorted-1'],
      speed: m.arturWalk * m.arturRunMultiplier * m.distortedArtur,
      frameTime: 0.22,
    });
    // Olhos pálidos acima da escuridão (aparecem mesmo no escuro); distintivo só na luz
    this.eyes = ctx.scene.add.image(0, 0, 'props', 'distorted-eyes').setOrigin(0.5, 1).setDepth(1_500_000).setAlpha(0.7);
    this.badge = ctx.scene.add.image(0, 0, 'props', 'distorted-badge').setOrigin(0.5, 1).setDepth(1_500_000).setVisible(false);
    this.chasing = true;
    ctx.fear.add(BALANCE.fearEvents.chase);
  }

  update(dt) {
    if (this.done || this.dying) return;
    this.chaser.update(dt);
    const s = this.chaser.sprite;
    this.eyes.setPosition(s.x, s.y).setFlipX(s.flipX);
    this.badge.setPosition(s.x, s.y).setFlipX(s.flipX);

    // Passos pesados, pela posição
    this.stepIn -= dt;
    if (this.stepIn <= 0) {
      this.stepIn = STEP_EVERY;
      const { volume, pan } = positional(this.ctx.player.feetMeters, this.chaser.feet, 14);
      this.ctx.sfx.step(0.9 * volume, pan, true);
    }

    // Lanterna nele: 0,6 s contínuos e ele vira cinzas
    const f = this.chaser.feet;
    const inLight = this.ctx.litByFlashlight(f.x, f.y - 0.6);
    this.badge.setVisible(inLight);
    this.lit = inLight ? this.lit + dt : 0;
    if (this.lit >= BALANCE.timings.distortedArturAshSeconds) {
      this.crumble();
      return;
    }
    if (this.chaser.caught) this.ctx.die('distorcido');
  }

  /** Se desfaz em cinzas (sem rastro: as cinzas caem e somem ali mesmo). */
  crumble() {
    this.dying = true;
    this.chasing = false;
    const s = this.chaser.sprite;
    s.body.setVelocity(0, 0);
    this.eyes.setVisible(false);
    this.badge.setVisible(false);
    const scene = this.ctx.scene;
    for (let i = 0; i < 40; i++) {
      const px = s.x + Phaser.Math.Between(-7, 7);
      const py = s.y - Phaser.Math.Between(0, 34);
      const ash = scene.add.image(px, py, 'props', 'ash').setDepth(s.y + 1);
      scene.tweens.add({
        targets: ash,
        y: s.y - Phaser.Math.Between(0, 3),
        x: px + Phaser.Math.Between(-4, 4),
        alpha: 0,
        duration: 500 + Math.random() * 500,
        delay: (34 - (s.y - py)) * 8,
        onComplete: () => ash.destroy(),
      });
    }
    scene.tweens.add({
      targets: s,
      alpha: 0,
      duration: 350,
      onComplete: () => {
        this.done = true;
      },
    });
  }

  end() {
    this.chaser?.destroy();
    this.eyes?.destroy();
    this.badge?.destroy();
  }
}

