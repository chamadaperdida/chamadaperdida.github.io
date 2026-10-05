// Morte (GDD 2.5 e 13.6):
// 1. Todo o som corta por 0,2 s.
// 2. Jumpscare (~1,2 s): o monstro toma a tela, 4 quadros, tremor e glitch, grito.
// 3. Tela preta com chiado e estática vermelha que vai diminuindo até o preto total.
// 4. Frase do monstro em vermelho.
// 5. Volta para a tela inicial. O Continuar leva de volta para a casa, pulando a delegacia
//    (GDD 2.3).

import Phaser from 'phaser';
import { sfx } from '../audio/Sfx.js';
import { glitchCamera } from '../fx/GlitchPipeline.js';

const FONT = 'VT323, monospace';
const RED = '#b3161d';
const ROWS = { invasor: 0, distorcido: 1, helena: 2, clara: 3 };
// Grito de cada monstro (gravações, ver audio/Sfx.js → scream)
const SCREAMS = { invasor: 'roar1', distorcido: 'roar2', helena: 'woman', clara: 'girl' };
// Quadros de cada jumpscare (scripts/sprites/jumpscares.mjs: 128×128, 4 por monstro)
const FRAMES = 4;
const FRAME_AT = [200, 400, 600, 820]; // ms

export const DEATH_PHRASES = {
  clara: 'Ela só queria brincar de estátua.',
  helena: 'Algumas coisas não devem ser iluminadas.',
  distorcido: 'Ele foge da luz. Você foge da verdade.',
  invasor: 'Corra. Você já chegou tarde uma vez.',
};

export class DeathScene extends Phaser.Scene {
  constructor() {
    super('Death');
  }

  create({ monster, day }) {
    this.scene.setVisible(false, 'Hud');
    const { width, height } = this.scale;
    const cam = this.cameras.main;
    cam.setBackgroundColor('#000000');
    sfx.cutFor(0.2);

    const row = ROWS[monster] ?? 0;
    const scare = this.add
      .image(width / 2, height / 2, 'jumpscares', row * FRAMES)
      .setScale(4.6)
      .setVisible(false);
    // Artur distorcido: glitch alternando com o rosto normal do Artur
    const arturFace = this.add.image(width / 2, height / 2, 'face', 0).setScale(22).setVisible(false);

    // 2. Jumpscare
    this.time.delayedCall(200, () => {
      scare.setVisible(true);
      sfx.scream(0.95, false, SCREAMS[monster]);
      // Trecho escondido dos gritos da 3ª ligação final, abafado pelo telefone (GDD 13.6)
      sfx.scream(0.08, true, 'woman');
      // Helena: o grito vem misturado com o tom de linha ocupada (GDD 13.5)
      if (monster === 'helena') sfx.busyTone(1.2, 0.2);
      cam.shake(1100, 0.02);
      glitchCamera(this, cam, 1.1, 0.8);
    });
    for (let n = 1; n < FRAMES; n++) this.time.delayedCall(FRAME_AT[n], () => scare.setFrame(row * FRAMES + n));
    if (monster === 'distorcido') {
      for (let t = 750; t < 1300; t += 110) {
        this.time.delayedCall(t, () => arturFace.setVisible(true));
        this.time.delayedCall(t + 45, () => arturFace.setVisible(false));
      }
    }
    // Zoom e tremor da cabeça
    this.tweens.add({ targets: scare, scale: 5.4, duration: 1200, ease: 'Quad.easeIn' });

    // 3. Corta para preto com chiado e estática vermelha diminuindo
    this.time.delayedCall(1400, () => {
      scare.destroy();
      arturFace.destroy();
      this.staticLevel = 1;
      this.static = sfx.staticLoop(0.5);
      this.noise = this.add.graphics();
      this.tweens.add({
        targets: this,
        staticLevel: 0,
        duration: 2200,
        onUpdate: () => this.static.setVolume(0.5 * this.staticLevel),
        onComplete: () => {
          this.static.stop();
          this.noise.clear();
        },
      });
    });

    // 4. Frase do monstro
    const phrase = this.add
      .text(width / 2, height / 2, DEATH_PHRASES[monster] ?? '', {
        fontFamily: FONT,
        fontSize: '40px',
        color: RED,
        align: 'center',
        wordWrap: { width: width * 0.8 },
      })
      .setOrigin(0.5)
      .setAlpha(0);
    this.time.delayedCall(3800, () => this.tweens.add({ targets: phrase, alpha: 1, duration: 900 }));
    this.time.delayedCall(7500, () => this.tweens.add({ targets: phrase, alpha: 0, duration: 700 }));

    // 5. Tela inicial
    this.time.delayedCall(8500, () => this.scene.start('Title'));

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.static?.stop());
  }

  update() {
    if (!this.noise || !this.staticLevel) return;
    // Estática vermelha: pontos e riscos aleatórios, cada vez menos
    const { width, height } = this.scale;
    const g = this.noise;
    g.clear();
    const count = Math.floor(900 * this.staticLevel);
    for (let i = 0; i < count; i++) {
      const shade = Math.random() < 0.5 ? 0xb3161d : 0x5a0a0e;
      g.fillStyle(shade, 0.4 + Math.random() * 0.6 * this.staticLevel);
      g.fillRect(Math.random() * width, Math.random() * height, 3 + Math.random() * 10, 3);
    }
  }
}
