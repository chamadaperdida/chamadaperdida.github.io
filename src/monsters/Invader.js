// Invasor (GDD 6): perseguições periódicas no escuro, 0,80× Artur correndo.
// Com medo em 100%: perseguição garantida e mais agressiva (0,90×) — correr quase não
// adianta, mas ainda dá para escapar. Fugir: correr, usar portas e os circuitos da casa.
// Desiste se Artur abrir distância (ou depois de um tempo).

import { BALANCE } from '../config/balance.js';
import { Chaser } from './Chaser.js';
import { MONSTER_ANIMS } from './anims.js';

const GIVE_UP_DISTANCE = 11; // m de caminho reto (aprox.)
const GIVE_UP_AFTER = 3; // s longe
const MAX_CHASE = 25; // s (furioso: 40 s)

export class InvaderEvent {
  constructor(ctx, { furious = false } = {}) {
    this.ctx = ctx;
    this.kind = 'invasor';
    this.name = furious ? 'Invasor (furioso)' : 'Invasor';
    this.furious = furious;
    this.done = false;
    this.elapsed = 0;
    this.farTime = 0;
    const spawn = ctx.findSpawn(8, 14);
    if (!spawn) {
      this.done = true;
      return;
    }
    const m = BALANCE.movement;
    const run = m.arturWalk * m.arturRunMultiplier;
    this.chaser = new Chaser(ctx, spawn, {
      anims: MONSTER_ANIMS.invader,
      speed: run * (furious ? m.intruderChaseMaxFear : m.intruderChase),
      frameTime: 0.11, // passo rígido, de manequim
    });
    this.chasing = true;
    ctx.fear.add(BALANCE.fearEvents.chase);
  }

  /** Medo chegou a 100% no meio da perseguição: fica furioso. */
  enrage() {
    if (this.furious || !this.chaser) return;
    this.furious = true;
    this.name = 'Invasor (furioso)';
    const m = BALANCE.movement;
    this.chaser.speed = m.arturWalk * m.arturRunMultiplier * m.intruderChaseMaxFear;
  }

  update(dt) {
    if (this.done) return;
    this.elapsed += dt;
    this.chaser.update(dt);
    if (this.chaser.caught) {
      this.ctx.die('invasor');
      return;
    }
    const d = this.chaser.distanceToPlayer();
    this.farTime = d > GIVE_UP_DISTANCE ? this.farTime + dt : 0;
    if (this.farTime > GIVE_UP_AFTER || this.elapsed > (this.furious ? MAX_CHASE * 1.6 : MAX_CHASE)) this.done = true;
  }

  end() {
    this.chaser?.destroy();
  }
}
