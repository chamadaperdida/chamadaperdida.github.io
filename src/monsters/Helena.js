// Helena (GDD 6): presença quase constante no escuro. Ela fica em algum lugar perto de
// Artur, onde a lanterna alcança — às vezes exatamente onde ela aponta. Com a luz nela, vai
// surgindo como espírito: a cabeça vai se erguendo e o choro aumenta conforme fica menos
// transparente. Visível por completo: mata. O tempo para surgir diminui a cada noite.
// Sobreviver: tirar a lanterna dela antes; ela volta a sumir (2× mais rápido).
//
// Quando outro monstro age, ela some (o diretor a encerra) e volta depois.
// Cada "aparição" termina quando ela some de novo ou fica tempo demais sem ser vista:
// o diretor a coloca em outro lugar logo em seguida.

import Phaser from 'phaser';
import { BALANCE } from '../config/balance.js';
import { PPM } from '../world/tiles.js';
import { positional } from '../audio/Sfx.js';

const RELOCATE_UNSEEN = 7; // s sem ser iluminada: muda de lugar
const GONE_AFTER_FADE = 1.5; // s depois de sumir (de volta a 0): muda de lugar

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
    this.fadedFor = 0;
    this.swayIn = 0;
    this.sway = 0;

    const spot = ctx.findHelenaSpot();
    if (!spot) {
      this.done = true;
      return;
    }
    this.pos = spot;
    this.sprite = ctx.scene.add
      .image(spot.x * PPM, spot.y * PPM, 'props', 'helena-0-0')
      .setOrigin(0.5, 1)
      .setDepth(spot.y * PPM)
      .setAlpha(0);
    this.cry = ctx.sfx.cryLoop();
  }

  get revealSeconds() {
    return this.ctx.night.helenaRevealSeconds;
  }

  update(dt) {
    if (this.done) return;
    this.elapsed += dt;
    const lit = this.ctx.litByFlashlight(this.pos.x, this.pos.y - 0.6);
    if (lit) {
      this.everLit = true;
      this.reveal = Math.min(1, this.reveal + dt / this.revealSeconds);
    } else {
      const fade = BALANCE.timings.helenaFadeSpeedMultiplier;
      this.reveal = Math.max(0, this.reveal - (dt * fade) / this.revealSeconds);
    }

    // Movimento travado, "pulando quadros": cabelo e corpo trocam aos trancos
    this.swayIn -= dt;
    if (this.swayIn <= 0) {
      this.swayIn = 0.12 + Math.random() * 0.35;
      this.sway = 1 - this.sway;
    }
    const head = this.reveal < 0.4 ? 0 : this.reveal < 0.75 ? 1 : 2;
    this.sprite.setFrame(`helena-${head}-${this.sway}`);
    const jitter = lit && Math.random() < 0.15 ? Phaser.Math.Between(-1, 1) : 0;
    this.sprite.setAlpha(this.reveal * 0.95).setX(this.pos.x * PPM + jitter);
    const { pan } = positional(this.ctx.player.feetMeters, this.pos, 10);
    this.cry.setVolume(this.reveal > 0 ? 0.15 + 0.75 * this.reveal : 0, pan);

    if (this.reveal >= 1) {
      this.ctx.die('helena');
      return;
    }
    // Muda de lugar: se ficou tempo demais sem ser vista, ou depois de sumir de novo
    this.fadedFor = this.everLit && this.reveal === 0 ? this.fadedFor + dt : 0;
    if ((!this.everLit && this.elapsed > RELOCATE_UNSEEN) || this.fadedFor > GONE_AFTER_FADE) this.done = true;
  }

  end() {
    this.cry?.stop();
    this.sprite?.destroy();
  }
}
