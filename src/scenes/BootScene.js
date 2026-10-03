// Carrega os sprites e cria as animações, depois entra na casa.

import Phaser from 'phaser';
import { createArturAnimations } from '../entities/Player.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    const base = 'assets/sprites/';
    this.load.spritesheet('artur', `${base}artur.png`, { frameWidth: 16, frameHeight: 32 });
    this.load.image('tiles', `${base}tiles.png`);
    this.load.spritesheet('face', `${base}face.png`, { frameWidth: 24, frameHeight: 24 });
    this.load.atlas('props', `${base}props.png`, `${base}props.json`);
  }

  create() {
    createArturAnimations(this.anims);
    // O HUD sobe junto (e antes) da casa, para já existir no primeiro quadro dela.
    this.scene.launch('Hud');
    this.scene.start('House');
  }
}
