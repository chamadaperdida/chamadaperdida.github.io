// Interface da casa (GDD 11). Nesta etapa: barra de estamina, caixa de diálogo
// e o aviso de interação [F]. Medo, rosto e bateria entram na etapa 3.

import Phaser from 'phaser';
import { DialogueBox } from '../ui/DialogueBox.js';

const FONT = 'VT323, monospace';

// Posições pensadas para o layout final: rosto (48 px) + barra de medo à direita,
// estamina e bateria logo abaixo do medo.
const BAR_X = 76;
const STAMINA_Y = 44;
const STAMINA_W = 170;
const STAMINA_H = 6;

export class HudScene extends Phaser.Scene {
  constructor() {
    super('Hud');
  }

  create() {
    this.staminaBg = this.add.rectangle(BAR_X, STAMINA_Y, STAMINA_W, STAMINA_H, 0x0d1420).setOrigin(0);
    this.staminaBg.setStrokeStyle(1, 0x26324a);
    this.staminaFill = this.add
      .rectangle(BAR_X, STAMINA_Y, STAMINA_W, STAMINA_H, 0x3f78c8)
      .setOrigin(0);

    this.prompt = this.add
      .text(0, 0, 'F', {
        fontFamily: FONT,
        fontSize: '22px',
        color: '#e8e2cf',
        backgroundColor: '#000000aa',
        padding: { x: 6, y: 0 },
      })
      .setOrigin(0.5, 1)
      .setVisible(false);

    this.dialogue = new DialogueBox(this);
  }

  update(_time, deltaMs) {
    this.dialogue.update(deltaMs / 1000);
  }

  setStamina(value, exhausted) {
    this.staminaFill.width = STAMINA_W * value;
    this.staminaFill.fillColor = exhausted ? 0x24406a : 0x3f78c8;
  }

  /** Abre a caixa de diálogo. Aceita uma fala ou uma lista de falas. */
  talk(lines) {
    return this.dialogue.show(Array.isArray(lines) ? lines : [lines]);
  }

  get talking() {
    return this.dialogue?.isOpen ?? false;
  }

  /** Aviso [F] sobre um ponto da tela, ou null para esconder. */
  showPrompt(screenPoint) {
    if (!screenPoint || this.talking) {
      this.prompt.setVisible(false);
      return;
    }
    this.prompt.setPosition(Math.round(screenPoint.x), Math.round(screenPoint.y)).setVisible(true);
  }
}
