// Helena (GDD 6): ao apontar a lanterna, há chance de ela estar ali. Com a luz nela, vai
// surgindo como espírito: a cabeça vai se erguendo e o choro aumenta conforme fica menos
// transparente. Visível por completo (2,5 s de luz contínua): mata.
// Sobreviver: tirar a lanterna dela antes; ela volta a sumir (2× mais rápido).

import Phaser from 'phaser';
import { BALANCE } from '../config/balance.js';
import { PPM } from '../world/tiles.js';
import { positional } from '../audio/Sfx.js';

const MAX_UNSEEN = 25; // s sem nunca ser iluminada: o evento acaba

export class HelenaEvent {
  constructor(ctx) {
    this.ctx = ctx;
    this.kind = 'helena';
    this.name = 'Helena';
    this.done = false;
    this.chasing = false;
    this.reveal = 0; // 0 a 1
    this.elapsed = 0;
    this.everLit = false;

    // Ela está onde a lanterna aponta (ou numa direção qualquer, se estiver desligada)
    const spot = ctx.findHelenaSpot();
    if (!spot) {
      this.done = true;
      return;
    }
    this.pos = spot;
    this.sprite = ctx.scene.add
      .image(spot.x * PPM, spot.y * PPM, 'props', 'helena-0')
      .setOrigin(0.5, 1)
      .setDepth(spot.y * PPM)
      .setAlpha(0);
    this.cry = ctx.sfx.cryLoop();
  }

  update(dt) {
    if (this.done) return;
    this.elapsed += dt;
    const t = BALANCE.timings;
    const lit = this.ctx.litByFlashlight(this.pos.x, this.pos.y - 0.6);
    if (lit) {
      this.everLit = true;
      this.reveal = Math.min(1, this.reveal + dt / t.helenaRevealSeconds);
    } else {
      this.reveal = Math.max(0, this.reveal - (dt * t.helenaFadeSpeedMultiplier) / t.helenaRevealSeconds);
    }

    // Surgindo: menos transparente e a cabeça se erguendo; pula quadros (movimento travado)
    const jitter = lit && Math.random() < 0.15 ? Phaser.Math.Between(-1, 1) : 0;
    this.sprite.setAlpha(this.reveal * 0.95).setX(this.pos.x * PPM + jitter);
    this.sprite.setFrame(this.reveal < 0.4 ? 'helena-0' : this.reveal < 0.75 ? 'helena-1' : 'helena-2');
    const { pan } = positional(this.ctx.player.feetMeters, this.pos, 10);
    this.cry.setVolume(this.reveal > 0 ? 0.15 + 0.75 * this.reveal : 0, pan);

    if (this.reveal >= 1) {
      this.ctx.die('helena');
      return;
    }
    if (!this.everLit && this.elapsed > MAX_UNSEEN) this.done = true;
    if (this.everLit && this.reveal === 0 && !lit && this.elapsed > 6) this.done = true;
  }

  end() {
    this.cry?.stop();
    this.sprite?.destroy();
  }
}
