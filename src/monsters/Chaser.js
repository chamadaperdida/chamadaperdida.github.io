// Base dos monstros que perseguem Artur (Invasor, Artur distorcido, Clara).
// Seguem o caminho (A*) até ele, recalculado de tempos em tempos. Portas fechadas:
// param, esperam o atraso da perseguição (GDD 9.4: 1,2 s) e abrem. Trancadas: não passam.

import Phaser from 'phaser';
import { BALANCE } from '../config/balance.js';
import { PPM } from '../world/tiles.js';

const REPATH_EVERY = 0.35; // s
const CATCH_DISTANCE = 0.45; // m

export class Chaser {
  /**
   * @param ctx    { scene, nav, player, colliders: [] }
   * @param spawn  posição inicial (m)
   * @param opts   { frames: [nomes no atlas], speed (m/s), frameTime, origin }
   */
  constructor(ctx, spawn, { frames, speed, frameTime = 0.25, bodySize = [10, 6] }) {
    this.ctx = ctx;
    this.frames = frames;
    this.speed = speed;
    this.frameTime = frameTime;
    const s = ctx.scene.physics.add.sprite(spawn.x * PPM, spawn.y * PPM, 'props', frames[0]);
    s.setOrigin(0.5, 1);
    s.body.setSize(bodySize[0], bodySize[1]);
    s.body.setOffset((s.width - bodySize[0]) / 2, s.height - bodySize[1]);
    ctx.colliders.forEach((c) => ctx.scene.physics.add.collider(s, c));
    this.sprite = s;
    this.path = null;
    this.repathIn = 0;
    this.doorWait = 0;
    this.frame = 0;
    this.frameIn = frameTime;
    this.lastPos = { x: s.x, y: s.y };
    this.stuck = 0;
  }

  get feet() {
    return { x: this.sprite.x / PPM, y: (this.sprite.y - 3) / PPM };
  }

  distanceToPlayer() {
    const p = this.ctx.player.feetMeters;
    const f = this.feet;
    return Math.hypot(p.x - f.x, p.y - f.y);
  }

  get caught() {
    return this.distanceToPlayer() < CATCH_DISTANCE;
  }

  /** Persegue Artur. Devolve false se não há caminho até ele. */
  update(dt) {
    const s = this.sprite;
    this.repathIn -= dt;
    if (this.repathIn <= 0 || !this.path) {
      this.repathIn = REPATH_EVERY;
      this.path = this.ctx.nav.findPath(this.feet, this.ctx.player.feetMeters);
      if (this.path) this.path.shift(); // a primeira célula é onde ele já está
    }

    // Sem caminho ou já do lado dele: vai direto
    let target = this.path?.[0] ?? this.ctx.player.feetMeters;
    const f = this.feet;
    if (this.path && Math.hypot(target.x - f.x, target.y - f.y) < 0.12) {
      this.path.shift();
      target = this.path[0] ?? this.ctx.player.feetMeters;
    }

    // Porta fechada no caminho: espera o atraso e abre
    const door = this.path?.length ? this.ctx.nav.doorAt(...this.ctx.nav.cellOf(target.x, target.y)) : null;
    if (door && !door.isOpen) {
      if (door.locked || door.kind !== 'normal') {
        this.path = null; // não passa: recalcula
      } else {
        s.body.setVelocity(0, 0);
        this.doorWait += dt;
        if (this.doorWait >= BALANCE.timings.doorCloseChaseDelay) {
          door.setOpen(true);
          this.doorWait = 0;
        }
        return true;
      }
    }
    this.doorWait = 0;

    const v = new Phaser.Math.Vector2(target.x - f.x, target.y - f.y);
    if (v.lengthSq() > 0.0001) v.normalize().scale(this.speed * PPM);
    s.body.setVelocity(v.x, v.y);
    if (v.x !== 0) s.setFlipX(v.x < 0);

    // Preso em algum canto: recalcula logo
    const moved = Math.hypot(s.x - this.lastPos.x, s.y - this.lastPos.y);
    this.stuck = moved < 0.2 ? this.stuck + dt : 0;
    if (this.stuck > 0.5) {
      this.path = null;
      this.stuck = 0;
    }
    this.lastPos = { x: s.x, y: s.y };

    // Animação
    this.frameIn -= dt;
    if (this.frameIn <= 0) {
      this.frameIn = this.frameTime;
      this.frame = (this.frame + 1) % this.frames.length;
      s.setFrame(this.frames[this.frame]);
    }
    s.setDepth(s.y);
    return true;
  }

  destroy() {
    this.sprite.destroy();
  }
}
