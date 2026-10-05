// Final (GDD 10, passos 4 a 7), depois que a tela escurece na madrugada do dia 7:
//
// 1. Uma TV de tubo liga com o plantão de Vale Sereno (GDD 13.7), vista por quem está
//    assistindo: a imagem começa ocupando a tela e a câmera vai se afastando devagar, até
//    aparecer a TV inteira (gabinete, antena, móvel) numa sala escura, iluminada só por
//    ela. Estúdio, jornalista, faixa "PLANTÃO — VALE SERENO", linhas de varredura e chiado
//    leve. A reportagem aparece na caixa de diálogo; durante a fala, uma foto antiga e
//    borrada da casa da Rua das Acácias surge no painel atrás dela. A TV desliga e a sala
//    fica escura.
// 2. Créditos rolando, com chuva ao fundo. Botão "Pular créditos" no canto (clique, Espaço,
//    Enter ou Esc) vai direto para a tela do CVV.
// 3. "Se você estiver passando por um momento difícil, ligue 188." (CVV)
// 4. Volta para a tela inicial (o save já está marcado como zerado: Continuar desativado).
//
// Arte em scripts/sprites/ending.mjs (480×270 ampliada 2×).

import Phaser from 'phaser';
import { sfx } from '../audio/Sfx.js';
import { DialogueBox } from '../ui/DialogueBox.js';

const FONT = 'VT323, monospace';
const S = 2;
// Posições na arte (ver scripts/sprites/ending.mjs)
const ENDING_W_ART = 480;
const ENDING_H_ART = 270;
const DESK_Y = 176;
const PANEL = { x: 262, y: 30, w: 176, h: 124 };
const REPORTER = { x: 118, y: 62 };
const PHOTO = { w: 128, h: 94 };
const BANNER_Y = 152; // faixa do plantão, logo acima da bancada
const TV_SET = { w: 548, h: 430, screenX: 34, screenY: 90 };
const TV_RACK = { w: 640 };
// Câmera se afastando da TV: de tela cheia (1) até a TV inteira na sala (0,5 = arte 1:1)
const PULL_BACK = { scale: 0.5, y: 228, delay: 1200, duration: 24000 };

const REPORT = [
  'Um ex-policial de 41 anos foi encontrado morto em sua casa, em Vale Sereno.',
  'Segundo a perícia, a morte está relacionada ao uso excessivo de medicamentos controlados.',
  'Artur Lemos havia sido afastado das ruas há um ano, após a morte da esposa, Helena, e da filha, Clara,',
  'durante uma invasão à residência da família no dia do aniversário da filha.',
  'O criminoso nunca foi identificado.',
].map((text) => ({ speaker: 'Jornalista', text }));
const PHOTO_AT_LINE = 1; // a foto aparece a partir da 2ª fala

// Créditos: [texto, tamanho]; '' = espaço
const CREDITS = [
  ['Chamada Perdida', 64],
  ['', 30],
  ['Um jogo de', 26],
  ['Nicolas', 38],
  ['', 30],
  ['História, design e direção', 26],
  ['Nicolas', 34],
  ['', 30],
  ['Pixel art e sons', 26],
  ['gerados por código', 26],
  ['', 30],
  ['Feito com Phaser 3 e Vite', 26],
  ['Fonte VT323, de Peter Hull', 26],
  ['', 60],
  ['Obrigado por jogar.', 34],
];
const CREDITS_SPEED = 42; // px/s
const CVV_TEXT = 'Se você estiver passando por um momento difícil,\nligue 188.';
const CVV_HOLD = 7000; // ms

export class EndingScene extends Phaser.Scene {
  constructor() {
    super('Ending');
  }

  create() {
    this.scene.setVisible(false, 'Hud');
    sfx.resume();
    this.cameras.main.setBackgroundColor('#000000');
    this.phase = 'black';
    this.static = null;
    this.rain = null;
    this.mouthIn = 0;
    this.blinkIn = 2.5;
    this.blinking = 0;
    this.photoShown = false;

    this.#buildTv();
    this.dialogue = new DialogueBox(this);
    this.dialogue.container.setDepth(1000);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.static?.stop();
      this.rain?.stop();
    });
    // Um instante de preto (a tela já veio escura da casa) e a TV liga
    this.time.delayedCall(1600, () => this.#tvOn());
  }

  // ---- TV ----------------------------------------------------------------------------

  #buildTv() {
    const { width, height } = this.scale;
    const img = (x, y, frame) => this.add.image(x * S, y * S, 'ending', frame).setOrigin(0).setScale(S);
    // Tudo o que está "dentro" da TV fica num container (para ligar e desligar a imagem)
    this.tv = this.add.container(width / 2, height / 2).setVisible(false);
    const put = (obj) => {
      obj.x -= width / 2;
      obj.y -= height / 2;
      this.tv.add(obj);
      return obj;
    };
    put(img(0, 0, 'studio'));
    this.photo = put(
      img(PANEL.x + (PANEL.w - PHOTO.w) / 2, PANEL.y + (PANEL.h - PHOTO.h) / 2, 'house-photo').setAlpha(0),
    );
    this.reporter = put(img(REPORTER.x, REPORTER.y, 'reporter-0'));
    put(img(0, DESK_Y, 'desk'));

    // Faixa do plantão
    const bar = this.add.graphics();
    bar.fillStyle(0x0c0608, 0.92).fillRect(0, BANNER_Y * S, width, 20 * S);
    bar.fillStyle(0xb3161d, 1).fillRect(0, BANNER_Y * S, 120 * S, 20 * S);
    bar.fillStyle(0x6a0c10, 1).fillRect(0, (BANNER_Y + 20) * S - 3, width, 3);
    put(bar);
    put(
      this.add
        .text(60 * S, (BANNER_Y + 10) * S, 'PLANTÃO', { fontFamily: FONT, fontSize: '34px', color: '#ffffff' })
        .setOrigin(0.5),
    );
    put(
      this.add
        .text(132 * S, (BANNER_Y + 10) * S, 'VALE SERENO', { fontFamily: FONT, fontSize: '34px', color: '#e8e2d4' })
        .setOrigin(0, 0.5),
    );
    // Marca "AO VIVO" piscando no canto
    this.live = put(
      this.add.text(width - 28, 22, '● AO VIVO', { fontFamily: FONT, fontSize: '24px', color: '#d0261c' }).setOrigin(1, 0),
    );
    this.tweens.add({ targets: this.live, alpha: 0.25, duration: 700, yoyo: true, repeat: -1 });

    // Chiado: granulado que muda a cada poucos quadros
    this.noiseW = Math.ceil(width / 3);
    this.noiseH = Math.ceil(height / 3);
    if (!this.textures.exists('tv-noise')) this.textures.createCanvas('tv-noise', this.noiseW, this.noiseH);
    this.noiseTex = this.textures.get('tv-noise');
    this.noise = put(this.add.image(0, 0, 'tv-noise').setOrigin(0).setScale(3).setAlpha(0.5));
    this.noiseIn = 0;
    // Faixa clara que desce devagar (imagem de TV velha)
    this.roll = put(this.add.rectangle(0, 0, width, 46, 0xffffff, 1).setOrigin(0).setAlpha(0.035));

    // Linhas de varredura e cantos arredondados do tubo
    if (!this.textures.exists('tv-scanlines')) {
      const tex = this.textures.createCanvas('tv-scanlines', width, height);
      const ctx = tex.getContext();
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      for (let y = 0; y < height; y += 3) ctx.fillRect(0, y, width, 1);
      const g = ctx.createRadialGradient(width / 2, height / 2, height * 0.42, width / 2, height / 2, width * 0.62);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.9)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);
      tex.refresh();
    }
    put(this.add.image(0, 0, 'tv-scanlines').setOrigin(0));
    // Clarão de ligar/desligar
    this.flash = put(this.add.rectangle(0, 0, width, height, 0xe8f0ff, 1).setOrigin(0).setAlpha(0));

    // A TV na sala: luz da tela no escuro, móvel, a imagem e o gabinete (tela vazada).
    // Tudo num container que encolhe (a câmera se afastando).
    if (!this.textures.exists('tv-room-glow')) {
      const size = 256;
      const tex = this.textures.createCanvas('tv-room-glow', size, size);
      const ctx = tex.getContext();
      const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      g.addColorStop(0, 'rgba(110,140,200,0.32)');
      g.addColorStop(0.5, 'rgba(70,95,150,0.12)');
      g.addColorStop(1, 'rgba(40,60,110,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
      tex.refresh();
    }
    const top = -(ENDING_H_ART / 2 + TV_SET.screenY) * S;
    this.roomGlow = this.add.image(0, 0, 'tv-room-glow').setScale(10, 7).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);
    const rack = this.add
      .image(-(TV_RACK.w / 2) * S, top + TV_SET.h * S, 'ending', 'tv-rack')
      .setOrigin(0)
      .setScale(S);
    const casing = this.add
      .image(-(ENDING_W_ART / 2 + TV_SET.screenX) * S, top, 'ending', 'tv-set')
      .setOrigin(0)
      .setScale(S);
    this.tv.setPosition(0, 0);
    this.set = this.add.container(width / 2, height / 2, [this.roomGlow, rack, this.tv, casing]);
  }

  /** A TV liga: a imagem abre de uma linha no meio, com um clarão e o chiado. */
  #tvOn() {
    this.phase = 'tv';
    this.tv.setVisible(true).setScale(1, 0.01);
    this.flash.setAlpha(1);
    this.static = sfx.staticLoop(0.35);
    this.tweens.add({ targets: this.tv, scaleY: 1, duration: 260, ease: 'Cubic.easeOut' });
    this.tweens.add({ targets: this.flash, alpha: 0, duration: 600, delay: 120 });
    // O chiado baixa quando a imagem firma
    this.time.delayedCall(900, () => this.static?.setVolume(0.07));
    // A câmera vai se afastando: aparece a TV inteira, na sala escura
    this.tweens.add({
      targets: this.set,
      scale: PULL_BACK.scale,
      y: PULL_BACK.y,
      delay: PULL_BACK.delay,
      duration: PULL_BACK.duration,
      ease: 'Sine.easeInOut',
    });
    this.tweens.add({ targets: this.roomGlow, alpha: 1, delay: PULL_BACK.delay, duration: PULL_BACK.duration * 0.6 });
    this.time.delayedCall(1800, () => this.dialogue.show(REPORT).then(() => this.time.delayedCall(1400, () => this.#tvOff())));
  }

  /** A TV desliga: a imagem fecha numa linha e depois num ponto. */
  #tvOff() {
    this.phase = 'off';
    this.flash.setAlpha(0.6);
    this.static?.setVolume(0.3);
    this.tweens.chain({
      targets: this.tv,
      tweens: [
        { scaleY: 0.006, duration: 160, ease: 'Cubic.easeIn' },
        { scaleX: 0, duration: 200, ease: 'Cubic.easeIn' },
      ],
      onComplete: () => {
        this.tv.setVisible(false);
        this.static?.stop();
        this.static = null;
        // Sem a luz da tela, a sala some no escuro
        this.tweens.killTweensOf(this.set);
        this.roomGlow.setAlpha(0);
        this.tweens.add({ targets: this.set, alpha: 0, duration: 1400 });
        this.time.delayedCall(2200, () => this.#credits());
      },
    });
  }

  // ---- Créditos e CVV ----------------------------------------------------------------

  #credits() {
    const { width, height } = this.scale;
    this.phase = 'credits';
    this.rain = sfx.rainLoop(0);
    this.rain.setVolume(0.45);
    this.rainGfx = this.add.graphics();
    this.drops = Array.from({ length: 150 }, () => this.#newDrop(true));
    this.creditText = this.add.container(0, height + 20);
    let y = 0;
    for (const [text, size] of CREDITS) {
      if (text) {
        const t = this.add
          .text(width / 2, y, text, { fontFamily: FONT, fontSize: `${size}px`, color: size >= 60 ? '#b3161d' : '#c8c4b8' })
          .setOrigin(0.5, 0);
        this.creditText.add(t);
      }
      y += size + 8;
    }
    this.creditsHeight = y;

    // Pular créditos (vai para a tela do CVV, que não se pula)
    this.skipButton = this.add
      .text(width - 24, height - 20, 'Pular créditos  [Espaço]', {
        fontFamily: FONT,
        fontSize: '22px',
        color: '#7d8088',
        backgroundColor: '#000000aa',
        padding: { x: 8, y: 2 },
      })
      .setOrigin(1, 1)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => this.skipButton.setColor('#e8e2cf'))
      .on('pointerout', () => this.skipButton.setColor('#7d8088'))
      .on('pointerdown', () => this.#skipCredits());
    this.skipKeys = ['keydown-SPACE', 'keydown-ENTER', 'keydown-ESC'];
    for (const k of this.skipKeys) this.input.keyboard.on(k, this.#skipCredits, this);
  }

  #skipCredits() {
    if (this.phase !== 'credits') return;
    this.#endCredits();
    this.tweens.add({ targets: this.creditText, alpha: 0, duration: 500, onComplete: () => this.#cvv() });
  }

  /** Créditos acabaram (ou foram pulados): some o botão e as teclas. */
  #endCredits() {
    this.phase = 'credits-end';
    for (const k of this.skipKeys) this.input.keyboard.off(k, this.#skipCredits, this);
    this.skipButton.destroy();
  }

  #cvv() {
    const { width, height } = this.scale;
    this.phase = 'cvv';
    const text = this.add
      .text(width / 2, height / 2, CVV_TEXT, {
        fontFamily: FONT,
        fontSize: '34px',
        color: '#dcdcdc',
        align: 'center',
        lineSpacing: 6,
      })
      .setOrigin(0.5)
      .setAlpha(0);
    // A chuva fica mais fraca atrás do texto
    this.tweens.add({ targets: this.rainGfx, alpha: 0.4, duration: 1400 });
    this.tweens.chain({
      targets: text,
      tweens: [
        { alpha: 1, duration: 1400 },
        { alpha: 1, duration: CVV_HOLD },
        { alpha: 0, duration: 1400 },
      ],
      onComplete: () => {
        this.rain?.setVolume(0);
        this.time.delayedCall(900, () => this.scene.start('Title'));
      },
    });
  }

  #newDrop(anywhere = false) {
    const { width, height } = this.scale;
    return {
      x: Phaser.Math.Between(-60, width),
      y: anywhere ? Phaser.Math.Between(0, height) : Phaser.Math.Between(-80, -10),
      len: Phaser.Math.Between(10, 22),
      speed: Phaser.Math.Between(520, 760),
      alpha: Phaser.Math.FloatBetween(0.12, 0.3),
    };
  }

  // ---- Quadro a quadro ---------------------------------------------------------------

  update(time, deltaMs) {
    const dt = deltaMs / 1000;
    this.dialogue.update(dt);
    if (this.tv.visible) this.#updateTv(dt);
    if (this.drops) this.#updateRain(dt);
    if (this.phase === 'credits') {
      this.creditText.y -= CREDITS_SPEED * dt;
      if (this.creditText.y + this.creditsHeight < -20) {
        this.#endCredits();
        this.#cvv();
      }
    }
  }

  #updateTv(dt) {
    // Jornalista: boca mexe enquanto o texto é digitado; pisca de vez em quando
    this.mouthIn -= dt;
    if (this.mouthIn <= 0) {
      this.mouthIn = 0.11;
      this.mouthOpen = this.dialogue.isTyping && !this.mouthOpen;
    }
    this.blinkIn -= dt;
    if (this.blinkIn <= 0) {
      this.blinkIn = Phaser.Math.FloatBetween(2.5, 5);
      this.blinking = 0.14;
    }
    this.blinking -= dt;
    this.reporter.setFrame(this.blinking > 0 ? 'reporter-2' : this.mouthOpen ? 'reporter-1' : 'reporter-0');

    // Foto da casa durante a fala
    const line = REPORT.length - this.dialogue.queue.length - 1;
    if (!this.photoShown && this.dialogue.isOpen && line >= PHOTO_AT_LINE) {
      this.photoShown = true;
      this.tweens.add({ targets: this.photo, alpha: 0.9, duration: 1600 });
    }

    // Chiado e faixa descendo
    this.noiseIn -= dt;
    if (this.noiseIn <= 0) {
      this.noiseIn = 0.05;
      const ctx = this.noiseTex.getContext();
      const data = ctx.createImageData(this.noiseW, this.noiseH);
      for (let i = 0; i < data.data.length; i += 4) {
        const v = Math.random() * 255;
        data.data[i] = v;
        data.data[i + 1] = v;
        data.data[i + 2] = v;
        data.data[i + 3] = Math.random() < 0.5 ? 26 : 0;
      }
      ctx.putImageData(data, 0, 0);
      this.noiseTex.refresh();
    }
    const h = this.scale.height;
    this.roll.y += 40 * dt;
    if (this.roll.y > h / 2) this.roll.y = -h / 2 - 46;
  }

  #updateRain(dt) {
    const { height } = this.scale;
    const g = this.rainGfx;
    g.clear();
    for (const d of this.drops) {
      d.y += d.speed * dt;
      d.x += d.speed * 0.12 * dt;
      if (d.y > height) Object.assign(d, this.#newDrop());
      g.lineStyle(1, 0x8a9ab8, d.alpha);
      g.lineBetween(d.x, d.y, d.x + d.len * 0.12, d.y + d.len);
    }
  }
}
