// Caixa de diálogo (substitui as vozes por IA — ver GDD 11.1).
//
// Mostra o nome de quem fala e o texto aparecendo como se estivesse sendo digitado.
// Espaço: se o texto ainda está sendo digitado, mostra tudo de uma vez;
//         se já terminou, passa para a próxima fala ou fecha a caixa.
//
// Uso:  await dialogue.show([{ speaker: 'Artur', text: '...aí não.' }])
//
// Extras por fala:
//   { fx: '(chiado)' }     efeito sonoro/ação: sem nome, em cinza
//   { ..., glitch: true }   voz distorcida das ligações-alucinação (GDD 3.5), sem áudio:
//                           o texto treme, letras falham por um instante (viram outros
//                           símbolos ou somem) e a digitação sai irregular
//
// Som: enquanto o texto é digitado, um "blip" a cada duas letras, com a voz de quem fala
// (grave para homens, mais agudo para mulheres e crianças); bilhetes soam como papel e
// efeitos como um tique abafado.

import { sfx } from '../audio/Sfx.js';

const FONT = 'VT323, monospace';
const CHARS_PER_SECOND = 38;
// Pausas extras (em segundos) depois de pontuação, para o texto "respirar".
const PAUSES = { '.': 0.28, ',': 0.12, '?': 0.3, '!': 0.3, '…': 0.35 };

// Voz distorcida: símbolos que aparecem no lugar das letras por um instante
const GLITCH_CHARS = '#%&*?/|<>~=+_^';
const GLITCH_SWAP = 0.05; // fração das letras visíveis trocadas em cada "falha"
const GLITCH_EVERY = [0.06, 0.22]; // s entre falhas
const GLITCH_SHAKE = 1.5; // px

// Voz de cada personagem no som da digitação (Hz)
const VOICES = [
  [/^Artur$/, { kind: 'voice', freq: 150 }],
  [/^Marcos$/, { kind: 'voice', freq: 128 }],
  [/^Bilhete|^Lista/, { kind: 'paper' }],
  [/Criança/, { kind: 'voice', freq: 380, wave: 'triangle' }],
  [/^Jovem$/, { kind: 'voice', freq: 200 }],
  [/Senhora/, { kind: 'voice', freq: 250, wave: 'triangle' }],
  [/Mãe|Moradora|Mulher|Moça|Voz de mulher|Helena/, { kind: 'voice', freq: 270, wave: 'triangle' }],
  [/Idoso|Senhor/, { kind: 'voice', freq: 112 }],
  [/Clara/, { kind: 'voice', freq: 400, wave: 'triangle' }],
];
const DEFAULT_VOICE = { kind: 'voice', freq: 125 }; // homens (vizinho, motorista, voz...)
const UNKNOWN_VOICE = { kind: 'fx' }; // ??? e efeitos
const BLIP_EVERY = 2; // letras por blip

function voiceOf(speaker, fx) {
  if (fx || !speaker || speaker === '???') return UNKNOWN_VOICE;
  return VOICES.find(([re]) => re.test(speaker))?.[1] ?? DEFAULT_VOICE;
}

const BOX_W = 780;
const BOX_H = 118;
const MARGIN_BOTTOM = 22;
const PAD_X = 26;

export class DialogueBox {
  constructor(scene) {
    this.scene = scene;
    const { width, height } = scene.scale;
    const x = (width - BOX_W) / 2;
    const y = height - BOX_H - MARGIN_BOTTOM;

    this.container = scene.add.container(0, 0).setDepth(1000).setVisible(false);

    const box = scene.add.graphics();
    box.fillStyle(0x07080a, 0.9).fillRect(x, y, BOX_W, BOX_H);
    box.lineStyle(2, 0x3a3c42, 1).strokeRect(x, y, BOX_W, BOX_H);
    box.lineStyle(1, 0x15161a, 1).strokeRect(x + 4, y + 4, BOX_W - 8, BOX_H - 8);

    // Etiqueta com o nome, encaixada na borda de cima da caixa
    this.nameBg = scene.add.graphics();
    this.nameText = scene.add
      .text(x + PAD_X, y, '', { fontFamily: FONT, fontSize: '28px', color: '#d8c79a' })
      .setOrigin(0, 0.5);
    this.nameX = x + PAD_X;
    this.nameY = y;

    this.bodyText = scene.add.text(x + PAD_X, y + 26, '', {
      fontFamily: FONT,
      fontSize: '30px',
      color: '#dcdcdc',
      lineSpacing: 2,
      wordWrap: { width: BOX_W - PAD_X * 2 },
    });

    this.next = scene.add
      .text(x + BOX_W - 16, y + BOX_H - 8, '▼', { fontFamily: FONT, fontSize: '22px', color: '#8a8d95' })
      .setOrigin(1, 1)
      .setVisible(false);
    scene.tweens.add({ targets: this.next, alpha: 0.2, duration: 450, yoyo: true, repeat: -1 });

    this.container.add([box, this.nameBg, this.nameText, this.bodyText, this.next]);

    this.queue = [];
    this.typing = false;
    this.resolve = null;

    scene.input.keyboard.on('keydown-SPACE', () => this.advance());
  }

  get isOpen() {
    return this.container.visible;
  }

  /** Mostra uma ou mais falas. A promessa termina quando a última for fechada. */
  show(lines) {
    // Se já havia diálogo aberto, as novas falas entram na fila
    this.queue.push(...lines);
    if (this.isOpen) return this.pending;
    this.container.setVisible(true);
    this.pending = new Promise((resolve) => {
      this.resolve = resolve;
    });
    this.#startLine(this.queue.shift());
    return this.pending;
  }

  /** Fecha na hora, sem avisar quem esperava (ex.: noite reiniciada). */
  clear() {
    this.glitch = false;
    this.queue = [];
    this.typing = false;
    this.resolve = null;
    this.container.setVisible(false);
  }

  advance() {
    if (!this.isOpen) return;
    if (this.typing) {
      this.#finishTyping();
      return;
    }
    if (this.queue.length > 0) {
      this.#startLine(this.queue.shift());
      return;
    }
    this.container.setVisible(false);
    this.glitch = false;
    const resolve = this.resolve;
    this.resolve = null;
    resolve?.();
  }

  /** Quem está falando agora (nome), ou null em efeitos. */
  get speaker() {
    return this.isOpen ? this.currentSpeaker : null;
  }

  /** O texto ainda está sendo digitado? */
  get isTyping() {
    return this.isOpen && this.typing;
  }

  #startLine({ speaker, text, fx, glitch }) {
    this.#setSpeaker(fx ? null : speaker);
    this.currentSpeaker = fx ? null : speaker;
    this.voice = voiceOf(speaker, fx);
    this.blipCount = 0;
    this.bodyText.setColor(fx ? '#7d8088' : '#dcdcdc');
    this.glitch = !!glitch;
    this.glitchIn = 0;
    this.bodyText.x = this.bodyX ?? (this.bodyX = this.bodyText.x);
    this.bodyText.y = this.bodyY ?? (this.bodyY = this.bodyText.y);
    this.fullText = fx ?? text;
    this.shown = 0;
    this.wait = 0;
    this.typing = true;
    this.bodyText.setText('');
    this.next.setVisible(false);
  }

  #setSpeaker(name) {
    this.nameText.setText(name ?? '');
    this.nameBg.clear();
    if (!name) return;
    const w = this.nameText.width + 20;
    this.nameBg.fillStyle(0x07080a, 1).fillRect(this.nameX - 10, this.nameY - 15, w, 30);
    this.nameBg.lineStyle(2, 0x3a3c42, 1).strokeRect(this.nameX - 10, this.nameY - 15, w, 30);
  }

  #finishTyping() {
    this.typing = false;
    this.shown = this.fullText.length;
    this.bodyText.setText(this.fullText);
    this.next.setVisible(true);
  }

  /** Chamado todo quadro pela cena dona da caixa. */
  update(dt) {
    if (this.isOpen && this.glitch) this.#updateGlitch(dt);
    if (!this.typing) return;
    this.wait -= dt;
    while (this.wait <= 0 && this.shown < this.fullText.length) {
      const ch = this.fullText[this.shown];
      this.shown += 1;
      // Som da digitação: um blip a cada poucas letras (não em espaços e pontuação)
      if (/[\p{L}\p{N}]/u.test(ch) && this.blipCount++ % BLIP_EVERY === 0) sfx.textBlip(this.voice, this.glitch);
      const nextCh = this.fullText[this.shown];
      // Reticências: pausa só no último ponto
      const pause = ch === '.' && nextCh === '.' ? 0.12 : (PAUSES[ch] ?? 0);
      // Voz distorcida: ritmo irregular (às vezes trava, às vezes corre)
      const jitter = this.glitch ? (Math.random() < 0.08 ? 0.25 + Math.random() * 0.3 : Math.random() * 0.03) : 0;
      this.wait += 1 / CHARS_PER_SECOND + jitter + (nextCh === undefined ? 0 : pause);
    }
    if (!this.glitch) this.bodyText.setText(this.fullText.slice(0, this.shown));
    if (this.shown >= this.fullText.length) this.#finishTyping();
  }

  /** Voz distorcida (sem áudio): o texto treme e letras falham por um instante. */
  #updateGlitch(dt) {
    const visible = this.fullText.slice(0, this.shown);
    this.glitchIn -= dt;
    if (this.glitchIn > 0 && this.glitchText !== undefined) {
      this.bodyText.setText(this.glitchText.slice(0, this.shown));
      return;
    }
    this.glitchIn = GLITCH_EVERY[0] + Math.random() * (GLITCH_EVERY[1] - GLITCH_EVERY[0]);
    const chars = [...this.fullText];
    const glitchNow = Math.random() < 0.55;
    if (glitchNow) {
      const n = Math.max(1, Math.round(visible.length * GLITCH_SWAP));
      for (let i = 0; i < n; i++) {
        const k = Math.floor(Math.random() * visible.length);
        if (chars[k] === ' ') continue;
        // Some (palavras sumindo) ou vira outro símbolo
        chars[k] = Math.random() < 0.4 ? ' ' : GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
      }
    }
    this.glitchText = chars.join('');
    this.bodyText.setText(this.glitchText.slice(0, this.shown));
    // Tremor leve
    this.bodyText.x = this.bodyX + (Math.random() < 0.5 ? Math.round((Math.random() * 2 - 1) * GLITCH_SHAKE) : 0);
    this.bodyText.y = this.bodyY + (Math.random() < 0.3 ? Math.round((Math.random() * 2 - 1) * GLITCH_SHAKE) : 0);
  }
}

export const SPEAKERS = {
  artur: 'Artur',
};

