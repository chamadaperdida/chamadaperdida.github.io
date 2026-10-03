// Telas de transição (GDD 2.2): tela preta, todo texto em vermelho.
// Mostra uma ou mais telas de texto em sequência e depois inicia a próxima cena.
//
//   this.scene.start('Transition', { screens: ['Faltam 5 dias'], next: { scene: 'House', data: { day: 2 } } })

import Phaser from 'phaser';

const FONT = 'VT323, monospace';
const RED = '#b3161d';
const FADE_MS = 700;
const HOLD_MS = 1800;

export class TransitionScene extends Phaser.Scene {
  constructor() {
    super('Transition');
  }

  create({ screens, next }) {
    this.cameras.main.setBackgroundColor('#000000');
    this.scene.setVisible(false, 'Hud');
    const { width, height } = this.scale;
    const text = this.add
      .text(width / 2, height / 2, '', { fontFamily: FONT, fontSize: '56px', color: RED, align: 'center' })
      .setOrigin(0.5)
      .setAlpha(0);

    const show = (index) => {
      if (index >= screens.length) {
        this.scene.start(next.scene, next.data);
        return;
      }
      text.setText(screens[index]);
      this.tweens.chain({
        targets: text,
        tweens: [
          { alpha: 1, duration: FADE_MS },
          { alpha: 1, duration: HOLD_MS },
          { alpha: 0, duration: FADE_MS },
        ],
        onComplete: () => show(index + 1),
      });
    };
    // Um instante de preto total antes do primeiro texto
    this.time.delayedCall(500, () => show(0));
  }
}

/** Texto da tela de transição de cada dia (GDD 2.2). */
export function daysLeftText(day) {
  const left = 7 - day;
  if (left === 0) return 'É hoje';
  if (left === 1) return 'Falta 1 dia';
  return `Faltam ${left} dias`;
}
