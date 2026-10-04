// Base dos monstros que perseguem Artur (Invasor, Artur distorcido, Clara).
// Seguem o caminho (A*) até ele, recalculado de tempos em tempos. Portas fechadas:
// param, esperam o atraso da perseguição (GDD 9.4: 1,2 s) e abrem. Trancadas: não passam.

import Phaser from 'phaser';
import { BALANCE } from '../config/balance.js';
import { PPM } from '../world/tiles.js';

const REPATH_EVERY = 0.35; // s
const CATCH_DISTANCE = 0.45; // m
// Rede de segurança: se mesmo assim empacar (ex.: Artur derrubou algo no caminho),
// atravessa o obstáculo por um instante em vez de ficar parado empurrando
const STUCK_SECONDS = 0.5;
const GHOST_SECONDS = 0.45;

export class Chaser {
  /**
   * @param ctx    { scene, nav, player, colliders: [] }
   * @param spawn  posição inicial (m)
   * @param opts   { anims: { side, down, up } (nomes no atlas), speed (m/s), frameTime }
   *                side = de perfil virado para a direita (espelha para a esquerda)
   */
  constructor(ctx, spawn, { anims, speed, frameTime = 0.1, bodySize = [10, 6] }) {
    this.ctx = ctx;
    this.anims = anims;
    this.view = 'down';
    const frames = anims.down;
    this.speed = speed;
    this.frameTime = frameTime;
    const s = ctx.scene.physics.add.sprite(spawn.x * PPM, spawn.y * PPM, 'props', frames[0]);
    this.frames = frames;
    s.setOrigin(0.5, 1);
    s.body.setSize(bodySize[0], bodySize[1]);
    s.body.setOffset((s.width - bodySize[0]) / 2, s.height - bodySize[1]);
    this.colliders = ctx.colliders.map((c) => ctx.scene.physics.add.collider(s, c));
    this.ghost = 0;
    this.sprite = s;
    this.bodySize = bodySize;
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
    // Visão pela direção: perfil (espelhado), frente (descendo) ou costas (subindo)
    if (Math.abs(v.x) >= Math.abs(v.y) * 0.8 && v.x !== 0) {
      this.view = 'side';
      s.setFlipX(v.x < 0);
    } else if (v.y !== 0) {
      this.view = v.y > 0 ? 'down' : 'up';
      s.setFlipX(false);
    }

    // Preso em algum canto (querendo andar e não saindo do lugar): recalcula o caminho e
    // atravessa o obstáculo por um instante
    if (this.ghost > 0) {
      this.ghost -= dt;
      if (this.ghost <= 0) this.colliders.forEach((c) => (c.active = true));
    }
    const moved = Math.hypot(s.x - this.lastPos.x, s.y - this.lastPos.y);
    this.stuck = moved < this.speed * PPM * dt * 0.3 ? this.stuck + dt : 0;
    if (this.stuck > STUCK_SECONDS) {
      // Só atravessa seguindo um caminho de verdade (nunca indo reto contra uma parede)
      if (this.path?.length) {
        this.ghost = GHOST_SECONDS;
        this.colliders.forEach((c) => (c.active = false));
      }
      this.path = null;
      this.stuck = 0;
    }
    this.lastPos = { x: s.x, y: s.y };

    // Animação
    this.frameIn -= dt;
    if (this.frameIn <= 0) {
      this.frameIn = this.frameTime;
      const frames = this.anims[this.view];
      this.frame = (this.frame + 1) % frames.length;
      s.setFrame(frames[this.frame]);
      // Quadros de tamanhos diferentes (perfil × frente): mantém o corpo nos pés
      s.body.setOffset((s.width - this.bodySize[0]) / 2, s.height - this.bodySize[1]);
    }
    s.setDepth(s.y);
    return true;
  }

  destroy() {
    this.colliders.forEach((c) => c.destroy());
    this.sprite.destroy();
  }
}
