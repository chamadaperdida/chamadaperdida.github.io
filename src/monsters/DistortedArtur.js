// Artur distorcido (GDD 6): aparece no escuro e persegue, um pouco mais rápido que Artur
// correndo (1,08×). Reconhecido pelos passos pesados e pela voz do Artur sussurrando,
// distorcida; quase invisível no escuro (todo preto, sem nenhuma parte brilhante).
// Sobreviver: apontar a lanterna nele por 0,6 s contínuos — ele se desfaz em cinzas.

import Phaser from 'phaser';
import { BALANCE } from '../config/balance.js';
import { positional } from '../audio/Sfx.js';
import { Chaser } from './Chaser.js';
import { MONSTER_ANIMS } from './anims.js';

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
      anims: MONSTER_ANIMS.distorted,
      speed: m.arturWalk * m.arturRunMultiplier * m.distortedArtur,
      frameTime: 0.075,
    });
    this.chasing = true;
    ctx.fear.add(BALANCE.fearEvents.chase);
    this.whisper = ctx.sfx.whisperLoop();
  }

  update(dt) {
    if (this.done || this.dying) return;
    this.chaser.update(dt);

    // Passos pesados, pela posição
    this.stepIn -= dt;
    if (this.stepIn <= 0) {
      this.stepIn = STEP_EVERY;
      const { volume, pan } = positional(this.ctx.player.feetMeters, this.chaser.feet, 14);
      this.ctx.sfx.step(0.9 * volume, pan, true);
    }
    // Sussurro: pela posição, ouvido de mais longe que os passos
    const w = positional(this.ctx.player.feetMeters, this.chaser.feet, 16);
    this.whisper.setVolume(0.55 * w.volume, w.pan);

    // Lanterna nele: 0,6 s contínuos e ele vira cinzas
    const f = this.chaser.feet;
    const inLight = this.ctx.litByFlashlight(f.x, f.y - 0.6);
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
    this.whisper?.stop();
    this.whisper = null;
    this.chasing = false;
    const s = this.chaser.sprite;
    s.body.setVelocity(0, 0);
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
    this.whisper?.stop();
    this.chaser?.destroy();
  }
}

