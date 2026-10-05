// Pausa (GDD 2.4): Esc na casa ou na delegacia. Congela tudo (a cena do jogo, o HUD e
// todo o som) e mostra: Voltar ao jogo, Opções, Sair para o menu.
// Sair avisa que o progresso será perdido: na casa, a noite atual; na delegacia, o turno
// recomeça do zero ao continuar.
//
//   openPause(this)   // de dentro da HouseScene ou da DelegaciaScene

import Phaser from 'phaser';
import { sfx } from '../audio/Sfx.js';
import { Menu, OptionsPanel, ConfirmBox } from '../ui/Menu.js';

const FONT = 'VT323, monospace';
// O mesmo Esc que fecha a pausa não pode abrir outra logo em seguida
const REOPEN_GUARD_MS = 250;
let closedAt = 0;

/** Abre a pausa por cima da cena do jogo (ignora se acabou de fechar). */
export function openPause(scene) {
  if (performance.now() - closedAt < REOPEN_GUARD_MS) return;
  if (scene.scene.isActive('Pause')) return;
  scene.scene.launch('Pause', { from: scene.scene.key });
}

export class PauseScene extends Phaser.Scene {
  constructor() {
    super('Pause');
  }

  create({ from }) {
    this.from = from;
    this.hudPaused = this.scene.isActive('Hud');
    this.scene.pause(from);
    if (this.hudPaused) this.scene.pause('Hud');
    this.scene.bringToTop();
    sfx.pause();

    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x000000, 0.72).setOrigin(0).setInteractive();
    this.add.text(width / 2, height / 2 - 120, 'PAUSADO', { fontFamily: FONT, fontSize: '64px', color: '#b3161d' }).setOrigin(0.5);
    this.menu = new Menu(this, {
      x: width / 2,
      y: height / 2 - 20,
      spacing: 54,
      fontSize: 40,
      onBack: () => this.#resume(),
      items: [
        { label: 'Voltar ao jogo', select: () => this.#resume() },
        { label: 'Opções', select: () => this.#openOptions() },
        { label: 'Sair para o menu', select: () => this.#confirmQuit() },
      ],
    });
  }

  #resume() {
    closedAt = performance.now();
    this.menu.destroy();
    sfx.resume();
    if (this.hudPaused) this.scene.resume('Hud');
    this.scene.resume(this.from);
    this.scene.stop();
  }

  #openOptions() {
    this.menu.setActive(false);
    new OptionsPanel(this, { onClose: () => this.menu.setActive(true) });
  }

  #confirmQuit() {
    this.menu.setActive(false);
    const text =
      this.from === 'Delegacia'
        ? 'O turno de hoje será perdido e recomeça do zero. Sair para o menu?'
        : 'O progresso da noite atual será perdido. Sair para o menu?';
    new ConfirmBox(this, {
      text,
      yes: () => this.#quit(),
      no: () => this.menu.setActive(true),
    });
  }

  #quit() {
    this.menu.destroy();
    if (this.hudPaused) this.scene.resume('Hud');
    this.scene.stop(this.from); // os sons da cena param no SHUTDOWN dela
    sfx.resume();
    this.scene.start('Title');
  }
}
