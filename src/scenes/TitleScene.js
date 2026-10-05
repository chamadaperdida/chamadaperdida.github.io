// Tela inicial (GDD 2.1): título com glitch ocasional sobre um telefone numa mesa escura,
// chuva e, de tempos em tempos, um telefone tocando três vezes ao longe.
// Três botões: Novo jogo, Continuar (mostra o dia salvo) e Opções.
//
// Novo jogo → aviso de fone → "Faltam 6 dias" → "Delegacia" → delegacia (GDD 2.3).
// Continuar → "Faltam X dias" → delegacia, ou → "Casa" → casa se a delegacia do dia já
// foi feita (morreu ou saiu durante a noite).

import Phaser from 'phaser';
import { sfx } from '../audio/Sfx.js';
import { save } from '../systems/Save.js';
import { Menu, OptionsPanel, ConfirmBox } from '../ui/Menu.js';
import { daysLeftText } from './TransitionScene.js';
import { toDelegacia } from './DelegaciaScene.js';

const FONT = 'VT323, monospace';
const TITLE = 'Chamada Perdida';
const GLITCH_EVERY = [2.5, 6]; // s entre glitches do título
const GLITCH_LENGTH = 0.28; // s
const GLITCH_CHARS = '#%&*?/|<>~=+_^';
const RING_EVERY = [18, 32]; // s entre os telefones ao longe
const HEADPHONE_SECONDS = 3.5;

// Fone de ouvido em pixel art (aviso antes do Novo jogo)
const HEADPHONES = [
  '.....######.....',
  '...##......##...',
  '..#..........#..',
  '.#............#.',
  '.#............#.',
  '#..............#',
  '#..............#',
  '###..........###',
  '####........####',
  '####........####',
  '####........####',
  '####........####',
  '.##..........##.',
];

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    const { width, height } = this.scale;
    this.scene.setVisible(false, 'Hud');
    sfx.resume();
    this.cameras.main.setBackgroundColor('#000000').fadeIn(800, 0, 0, 0);
    this.leaving = false;

    this.#buildDesk();
    this.#buildTitle();

    const saved = save.load();
    this.menu = new Menu(this, {
      x: width / 2,
      y: 236,
      spacing: 54,
      fontSize: 40,
      items: [
        { label: 'Novo jogo', select: () => this.#newGame() },
        {
          label: () => (save.canContinue() ? `Continuar — dia ${saved.day}` : 'Continuar'),
          enabled: () => save.canContinue(),
          select: () => this.#continue(),
        },
        { label: 'Opções', select: () => this.#openOptions() },
      ],
    });

    // Som: chuva sem parar e o telefone ao longe. O navegador só libera o áudio depois do
    // primeiro clique ou tecla, então a chuva começa assim que ele estiver pronto.
    this.rain = null;
    this.ringIn = 6;
    this.glitchIn = Phaser.Math.FloatBetween(1, 3);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.rain?.stop();
      this.ringing?.stop();
    });
  }

  // ---- Cenário -----------------------------------------------------------------------

  /** Mesa escura com o telefone antigo, iluminada de cima por uma luz fraca. */
  #buildDesk() {
    const { width, height } = this.scale;
    if (!this.textures.exists('title-light')) {
      const size = 512;
      const tex = this.textures.createCanvas('title-light', size, size);
      const ctx = tex.getContext();
      const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      g.addColorStop(0, 'rgba(200,190,160,0.16)');
      g.addColorStop(1, 'rgba(200,190,160,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
      tex.refresh();
    }
    const top = height - 64;
    const g = this.add.graphics();
    g.fillStyle(0x1a120c, 1).fillRect(0, top, width, 12); // tampo
    g.fillStyle(0x24190f, 1).fillRect(0, top, width, 2);
    g.fillStyle(0x0d0906, 1).fillRect(0, top + 12, width, height - top - 12); // frente
    g.fillStyle(0x070504, 1).fillRect(0, top + 12, width, 4);
    this.add
      .image(width / 2, top - 10, 'title-light')
      .setScale(1.4, 0.7)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.phone = this.add
      .image(width / 2, top + 6, 'delegacia', 'phone')
      .setOrigin(0.5, 1)
      .setScale(6)
      .setTint(0x6a6660);
  }

  #buildTitle() {
    const { width } = this.scale;
    const style = { fontFamily: FONT, fontSize: '104px', color: '#d8d0bc' };
    // Cópias coloridas que só aparecem no glitch (separação de cor)
    this.titleRed = this.add.text(width / 2, 120, TITLE, { ...style, color: '#b3161d' }).setOrigin(0.5).setAlpha(0);
    this.titleCyan = this.add.text(width / 2, 120, TITLE, { ...style, color: '#3a8a8a' }).setOrigin(0.5).setAlpha(0);
    this.title = this.add.text(width / 2, 120, TITLE, style).setOrigin(0.5);
    this.glitching = 0;
  }

  #updateGlitch(dt) {
    const { width } = this.scale;
    if (this.glitching > 0) {
      this.glitching -= dt;
      if (this.glitching <= 0) {
        this.title.setText(TITLE).setX(width / 2);
        this.titleRed.setAlpha(0);
        this.titleCyan.setAlpha(0);
        return;
      }
      // Treme, separa as cores e troca algumas letras
      const jitter = () => Phaser.Math.Between(-6, 6);
      this.title.setX(width / 2 + jitter());
      this.titleRed.setAlpha(0.8).setPosition(width / 2 + jitter() - 5, 120 + Phaser.Math.Between(-2, 2));
      this.titleCyan.setAlpha(0.6).setPosition(width / 2 + jitter() + 5, 120 + Phaser.Math.Between(-2, 2));
      this.title.setText(
        [...TITLE].map((ch) => (ch !== ' ' && Math.random() < 0.18 ? Phaser.Utils.Array.GetRandom([...GLITCH_CHARS]) : ch)).join(''),
      );
      return;
    }
    this.glitchIn -= dt;
    if (this.glitchIn <= 0) {
      this.glitchIn = Phaser.Math.FloatBetween(...GLITCH_EVERY);
      this.glitching = GLITCH_LENGTH;
    }
  }

  // ---- Botões ------------------------------------------------------------------------

  #newGame() {
    if (save.canContinue()) {
      this.menu.setActive(false);
      new ConfirmBox(this, {
        text: 'Isso apaga seu progresso. Continuar?',
        yes: () => this.#startNewGame(),
        no: () => this.menu.setActive(true),
      });
      return;
    }
    this.#startNewGame();
  }

  #startNewGame() {
    save.newGame();
    this.#leave(() => this.#headphoneWarning());
  }

  #continue() {
    const s = save.load();
    const next = s.delegaciaDone
      ? { screens: [daysLeftText(s.day), 'Casa'], next: { scene: 'House', data: { day: s.day } } }
      : toDelegacia(s.day);
    this.#leave(() => this.scene.start('Transition', next));
  }

  #openOptions() {
    this.menu.setActive(false);
    new OptionsPanel(this, { onClose: () => this.menu.setActive(true) });
  }

  /** Apaga a tela inicial (som e imagem) e segue. */
  #leave(then) {
    if (this.leaving) return;
    this.leaving = true;
    this.menu.setActive(false);
    this.rain?.setVolume(0);
    this.ringing?.stop();
    this.cameras.main.fadeOut(700, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, then);
  }

  /** Aviso de fone (GDD 2.3): ícone + frase, some sozinho depois de alguns segundos. */
  #headphoneWarning() {
    this.rain?.stop();
    this.rain = null;
    this.ringing?.stop();
    this.menu.destroy();
    this.children.removeAll(true);
    const { width, height } = this.scale;
    const px = 7;
    const g = this.add.graphics();
    g.fillStyle(0xcfc9b6, 1);
    const ox = width / 2 - (HEADPHONES[0].length * px) / 2;
    const oy = height / 2 - 120;
    HEADPHONES.forEach((row, y) =>
      [...row].forEach((ch, x) => ch === '#' && g.fillRect(ox + x * px, oy + y * px, px, px)),
    );
    this.add
      .text(width / 2, height / 2 + 40, 'Para uma melhor experiência, jogue com fones de ouvido.', {
        fontFamily: FONT,
        fontSize: '32px',
        color: '#cfc9b6',
        align: 'center',
        wordWrap: { width: width * 0.8 },
      })
      .setOrigin(0.5);
    const cam = this.cameras.main;
    cam.fadeIn(600, 0, 0, 0);
    this.time.delayedCall(HEADPHONE_SECONDS * 1000, () => {
      cam.fadeOut(600, 0, 0, 0);
      cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('Transition', toDelegacia(1)));
    });
  }

  // ---- Quadro a quadro ---------------------------------------------------------------

  update(time, delta) {
    if (this.leaving) return;
    const dt = Math.min(delta / 1000, 0.1);
    this.#updateGlitch(dt);
    if (!this.rain && sfx.ready) this.rain = sfx.rainLoop(0.45);
    if (this.rain) {
      this.ringIn -= dt;
      if (this.ringIn <= 0) {
        this.ringIn = Phaser.Math.FloatBetween(...RING_EVERY);
        this.ringing = sfx.distantRing(0.22, Phaser.Math.FloatBetween(-0.6, 0.6));
      }
    }
  }
}
