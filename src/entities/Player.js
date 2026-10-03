// Artur na casa: anda (WASD), corre (Shift) gastando estamina (GDD 4.1 e 9.4).

import Phaser from 'phaser';
import { BALANCE } from '../config/balance.js';
import { PPM } from '../world/tiles.js';

const DIRS = ['down', 'up', 'left', 'right'];
const COLUMNS = 9;

export function createArturAnimations(anims) {
  DIRS.forEach((dir, row) => {
    const first = row * COLUMNS;
    anims.create({ key: `artur-idle-${dir}`, frames: [{ key: 'artur', frame: first }] });
    anims.create({
      key: `artur-walk-${dir}`,
      frames: anims.generateFrameNumbers('artur', { start: first + 1, end: first + 4 }),
      frameRate: 7, // passos arrastados
      repeat: -1,
    });
    anims.create({
      key: `artur-run-${dir}`,
      frames: anims.generateFrameNumbers('artur', { start: first + 5, end: first + 8 }),
      frameRate: 12,
      repeat: -1,
    });
  });
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'artur', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Origem nos pés; corpo de colisão só na base (vista de cima na diagonal)
    this.setOrigin(0.5, 1);
    this.body.setSize(10, 6).setOffset(3, 26);

    const m = BALANCE.movement;
    this.walkSpeed = m.arturWalk * PPM;
    this.runSpeed = m.arturWalk * m.arturRunMultiplier * PPM;

    this.stamina = 1; // 0 a 1
    this.exhausted = false;
    this.running = false;
    this.facing = 'down';
    this.frozen = false;

    this.keys = scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      run: Phaser.Input.Keyboard.KeyCodes.SHIFT,
    });
  }

  /** Ponto dos pés em metros (para saber o cômodo, distâncias etc.). */
  get feetMeters() {
    return { x: this.x / PPM, y: (this.y - 3) / PPM };
  }

  update(dt) {
    const k = this.keys;
    let dx = 0;
    let dy = 0;
    if (!this.frozen) {
      dx = (k.right.isDown ? 1 : 0) - (k.left.isDown ? 1 : 0);
      dy = (k.down.isDown ? 1 : 0) - (k.up.isDown ? 1 : 0);
    }
    const moving = dx !== 0 || dy !== 0;

    this.updateStamina(dt, moving && k.run.isDown);

    const speed = this.running ? this.runSpeed : this.walkSpeed;
    const v = new Phaser.Math.Vector2(dx, dy).normalize().scale(moving ? speed : 0);
    this.body.setVelocity(v.x, v.y);

    if (moving) {
      // Na diagonal, prioriza o lado (sprite de perfil lê melhor o movimento)
      if (dx !== 0) this.facing = dx < 0 ? 'left' : 'right';
      else this.facing = dy < 0 ? 'up' : 'down';
      this.anims.play(`artur-${this.running ? 'run' : 'walk'}-${this.facing}`, true);
    } else {
      this.anims.play(`artur-idle-${this.facing}`, true);
    }

    this.setDepth(this.y);
  }

  updateStamina(dt, wantsToRun) {
    const m = BALANCE.movement;
    if (this.exhausted && this.stamina >= m.staminaRecoverThreshold) this.exhausted = false;

    this.running = wantsToRun && !this.exhausted && this.stamina > 0;
    if (this.running) {
      this.stamina = Math.max(0, this.stamina - dt / m.staminaRunSeconds);
      if (this.stamina === 0) this.exhausted = true;
    } else {
      // Só recarrega sem correr
      this.stamina = Math.min(1, this.stamina + dt / m.staminaRechargeSeconds);
    }
  }
}
