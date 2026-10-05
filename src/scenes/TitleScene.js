// Tela inicial (GDD 2.1): título com glitch ocasional sobre um telefone numa mesa escura,
// chuva e, de tempos em tempos, um telefone tocando três vezes ao longe. A sala é a arte
// mais caprichada do jogo (scripts/sprites/title.mjs): luz fria da rua entrando pela
// persiana, chuva, relâmpagos que às vezes mostram alguém parado no corredor, e a luz de
// "1 mensagem" da secretária eletrônica piscando.
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
const RED = '#b3161d';
const LIGHTNING_EVERY = [12, 26]; // s

// Arte da sala: 480×270 ampliada 2× (posições na arte, ver scripts/sprites/title.mjs)
const S = 2;
const GLASS = { x: 332, y: 36, w: 100, h: 114 };
const FIGURE = [211, 128];
const DOORWAY = { x: 198, y: 64, w: 52, h: 136 };
const LED = [201, 212];
const TITLE_X = 52;
const TITLE_Y = 92;

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

    this.#buildRoom();
    this.#buildTitle();

    const saved = save.load();
    this.menu = new Menu(this, {
      x: TITLE_X + 6,
      y: 214,
      spacing: 52,
      fontSize: 40,
      align: 'left',
      depth: 20,
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

  /**
   * A sala (arte em scripts/sprites/title.mjs, 480×270 ampliada 2×): céu atrás da persiana,
   * chuva no vidro, raios de luz com poeira, luz de mensagem piscando, relâmpagos.
   */
  #buildRoom() {
    const img = (x, y, frame) => this.add.image(x * S, y * S, 'title', frame).setOrigin(0).setScale(S);
    const { x, y, w, h } = GLASS;
    img(x, y, 'sky').setDepth(0);
    this.skyFlash = this.add.rectangle(x * S, y * S, w * S, h * S, 0xdce4ff, 1).setOrigin(0).setAlpha(0).setDepth(1);
    this.rainGfx = this.add.graphics().setDepth(2);
    this.drops = Array.from({ length: 34 }, () => this.#newDrop(true));
    img(0, 0, 'room').setDepth(3);
    // Raios de luz pela persiana: respiram devagar
    this.rays = img(0, 0, 'rays').setDepth(4).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.85);
    this.tweens.add({ targets: this.rays, alpha: 0.6, duration: 3200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.dust = Array.from({ length: 46 }, () => this.#newDust());
    this.dustGfx = this.add.graphics().setDepth(5).setBlendMode(Phaser.BlendModes.ADD);
    // Luz de mensagem da secretária eletrônica: a chamada perdida
    if (!this.textures.exists('title-led-glow')) {
      const size = 64;
      const tex = this.textures.createCanvas('title-led-glow', size, size);
      const ctx = tex.getContext();
      const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      g.addColorStop(0, 'rgba(255,40,30,0.55)');
      g.addColorStop(1, 'rgba(255,40,30,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
      tex.refresh();
    }
    const [lx, ly] = LED;
    this.led = this.add.rectangle(lx * S, ly * S, 3 * S, 2 * S, 0xff3a2a).setOrigin(0).setDepth(6);
    this.ledGlow = this.add
      .image((lx + 1.5) * S, (ly + 1) * S, 'title-led-glow')
      .setScale(1.1)
      .setAlpha(0.8)
      .setDepth(6)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.ledIn = 0;
    // Relâmpago: clarão na sala e, às vezes, alguém parado no corredor
    this.flash = this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0xc8d4ff, 1)
      .setOrigin(0)
      .setAlpha(0)
      .setDepth(7)
      .setBlendMode(Phaser.BlendModes.ADD);
    // O corredor clareia mais que a sala (luz de outra janela, lá dentro)
    const dw = DOORWAY;
    this.hallFlash = this.add
      .rectangle(dw.x * S, dw.y * S, dw.w * S, dw.h * S, 0xb8c4e8, 1)
      .setOrigin(0)
      .setAlpha(0)
      .setDepth(7)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.figure = img(...FIGURE, 'figure').setDepth(8).setVisible(false);
    this.lightningIn = Phaser.Math.FloatBetween(4, 8);
  }

  #newDrop(anywhere = false) {
    const { x, y, w, h } = GLASS;
    return {
      x: x + Math.random() * w,
      y: anywhere ? y + Math.random() * h : y - Math.random() * 12,
      len: 3 + Math.floor(Math.random() * 4),
      speed: 110 + Math.random() * 70,
    };
  }

  #updateRain(dt) {
    const { x, y, w, h } = GLASS;
    const g = this.rainGfx.clear();
    g.fillStyle(0x8a9ab8, 0.5);
    for (const d of this.drops) {
      d.y += d.speed * dt;
      d.x -= d.speed * dt * 0.12; // vento
      if (d.y > y + h || d.x < x) Object.assign(d, this.#newDrop());
      const top = Math.max(y, Math.round(d.y));
      const bottom = Math.min(y + h, Math.round(d.y) + d.len);
      if (bottom > top) g.fillRect(Math.round(d.x) * S, top * S, S, (bottom - top) * S);
    }
  }

  /** Grão de poeira flutuando na luz que entra pela persiana. */
  #newDust() {
    const t = Math.random() * 220;
    return {
      x: GLASS.x - t,
      y: GLASS.y + 24 + Math.random() * 100 + t * 0.5,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.3) * 1.5,
      phase: Math.random() * Math.PI * 2,
    };
  }

  #updateDust(dt, time) {
    const g = this.dustGfx.clear();
    for (const d of this.dust) {
      d.x += d.vx * dt;
      d.y += d.vy * dt + Math.sin(time / 1300 + d.phase) * dt * 1.5;
      const t = GLASS.x - d.x;
      if (t < 0 || t > 230 || d.y > 196 || d.y < 20) Object.assign(d, this.#newDust());
      const a = 0.35 * (1 - t / 230) * (0.6 + 0.4 * Math.sin(time / 700 + d.phase));
      g.fillStyle(0xc8d4f0, Math.max(0, a));
      g.fillRect(Math.round(d.x) * S, Math.round(d.y) * S, S, S);
    }
  }

  /** Mensagem não ouvida: a luz pisca devagar. */
  #updateLed(dt) {
    this.ledIn -= dt;
    if (this.ledIn > 0) return;
    const on = !this.led.visible;
    this.led.setVisible(on);
    this.ledGlow.setVisible(on);
    this.ledIn = on ? 0.55 : 0.75;
  }

  /**
   * Relâmpago: duas piscadas, trovão depois. Às vezes revela a silhueta no corredor: ela
   * aparece no clarão e some junto com ele (some no escuro, sem corte).
   */
  #lightning() {
    const showFigure = Math.random() < 0.6;
    const pulse = (at, peak, ms, withFigure) =>
      this.time.delayedCall(at, () => {
        this.tweens.killTweensOf([this.flash, this.hallFlash, this.skyFlash, this.figure]);
        this.flash.setAlpha(peak);
        this.hallFlash.setAlpha(Math.min(1, peak * 2.4));
        this.skyFlash.setAlpha(Math.min(1, peak * 3));
        this.tweens.add({ targets: [this.flash, this.hallFlash, this.skyFlash], alpha: 0, duration: ms, ease: 'Quad.easeOut' });
        if (!withFigure) return;
        this.figure.setVisible(true).setAlpha(1);
        // Fica até o corredor voltar ao escuro e então se dissolve nele
        this.tweens.add({ targets: this.figure, alpha: 0, delay: ms * 0.5, duration: ms * 1.6, ease: 'Sine.easeIn' });
      });
    pulse(0, 0.1, 120, false);
    pulse(190, 0.2, 520, showFigure);
    this.time.delayedCall(Phaser.Math.Between(700, 1500), () => sfx.thunder(0.5));
  }


  #buildTitle() {
    const style = { fontFamily: FONT, fontSize: '86px', color: '#ddd5c0' };
    const at = (t) => t.setOrigin(0, 0.5).setDepth(20);
    // Sombra vermelha embaixo do título
    at(this.add.text(TITLE_X + 3, TITLE_Y + 4, TITLE, { ...style, color: '#4a0608' }));
    // Cópias coloridas que só aparecem no glitch (separação de cor)
    this.titleRed = at(this.add.text(TITLE_X, TITLE_Y, TITLE, { ...style, color: RED })).setAlpha(0);
    this.titleCyan = at(this.add.text(TITLE_X, TITLE_Y, TITLE, { ...style, color: '#3a8a8a' })).setAlpha(0);
    this.title = at(this.add.text(TITLE_X, TITLE_Y, TITLE, style));
    // Risco vermelho embaixo, como uma linha de telefone cortada
    const g = this.add.graphics().setDepth(20);
    g.fillStyle(0xb3161d, 0.85).fillRect(TITLE_X + 4, TITLE_Y + 44, 300, 3);
    g.fillRect(TITLE_X + 316, TITLE_Y + 44, 46, 3);
    g.fillRect(TITLE_X + 372, TITLE_Y + 44, 14, 3);
    this.glitching = 0;
  }

  #updateGlitch(dt) {
    if (this.glitching > 0) {
      this.glitching -= dt;
      if (this.glitching <= 0) {
        this.title.setText(TITLE).setX(TITLE_X);
        this.titleRed.setAlpha(0);
        this.titleCyan.setAlpha(0);
        return;
      }
      // Treme, separa as cores e troca algumas letras
      const jitter = () => Phaser.Math.Between(-6, 6);
      this.title.setX(TITLE_X + jitter());
      this.titleRed.setAlpha(0.8).setPosition(TITLE_X + jitter() - 5, TITLE_Y + Phaser.Math.Between(-2, 2));
      this.titleCyan.setAlpha(0.6).setPosition(TITLE_X + jitter() + 5, TITLE_Y + Phaser.Math.Between(-2, 2));
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
    g.fillStyle(0xb3161d, 1);
    const ox = width / 2 - (HEADPHONES[0].length * px) / 2;
    const oy = height / 2 - 120;
    HEADPHONES.forEach((row, y) =>
      [...row].forEach((ch, x) => ch === '#' && g.fillRect(ox + x * px, oy + y * px, px, px)),
    );
    this.add
      .text(width / 2, height / 2 + 40, 'Para uma melhor experiência, jogue com fones de ouvido.', {
        fontFamily: FONT,
        fontSize: '32px',
        color: RED,
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
    this.#updateRain(dt);
    this.#updateDust(dt, time);
    this.#updateLed(dt);
    this.lightningIn -= dt;
    if (this.lightningIn <= 0) {
      this.lightningIn = Phaser.Math.FloatBetween(...LIGHTNING_EVERY);
      this.#lightning();
    }
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
