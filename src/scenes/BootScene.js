// Carrega os sprites e cria as animações, depois abre a tela inicial (GDD 2.1).

import Phaser from 'phaser';
import { createArturAnimations } from '../entities/Player.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    const base = 'assets/sprites/';
    // ?v=… muda a cada publicação: o navegador sempre pega os sprites novos (sem cache antigo)
    const v = `?v=${__BUILD_ID__}`;
    this.load.spritesheet('artur', `${base}artur.png${v}`, { frameWidth: 16, frameHeight: 32 });
    this.load.image('tiles', `${base}tiles.png${v}`);
    this.load.spritesheet('face', `${base}face.png${v}`, { frameWidth: 24, frameHeight: 24 });
    this.load.spritesheet('jumpscares', `${base}jumpscares.png${v}`, { frameWidth: 64, frameHeight: 64 });
    this.load.atlas('props', `${base}props.png${v}`, `${base}props.json${v}`);
    this.load.atlas('delegacia', `${base}delegacia.png${v}`, `${base}delegacia.json${v}`);
  }

  create() {
    createArturAnimations(this.anims);
    // O HUD sobe junto (e antes) da casa, para já existir no primeiro quadro dela.
    this.scene.launch('Hud');
    this.scene.start('Title');
  }
}
