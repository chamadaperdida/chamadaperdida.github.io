// Caixa de diálogo (substitui as vozes por IA — ver GDD 11.1).
//
// Mostra o nome de quem fala e o texto aparecendo como se estivesse sendo digitado.
// Espaço: se o texto ainda está sendo digitado, mostra tudo de uma vez;
//         se já terminou, passa para a próxima fala ou fecha a caixa.
//
// Uso:  await dialogue.show([{ speaker: 'Artur', text: '...aí não.' }])

const FONT = 'VT323, monospace';
const CHARS_PER_SECOND = 38;
// Pausas extras (em segundos) depois de pontuação, para o texto "respirar".
const PAUSES = { '.': 0.28, ',': 0.12, '?': 0.3, '!': 0.3, '…': 0.35 };

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
    const resolve = this.resolve;
    this.resolve = null;
    resolve?.();
  }

  #startLine({ speaker, text }) {
    this.#setSpeaker(speaker);
    this.fullText = text;
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
    if (!this.typing) return;
    this.wait -= dt;
    while (this.wait <= 0 && this.shown < this.fullText.length) {
      const ch = this.fullText[this.shown];
      this.shown += 1;
      const nextCh = this.fullText[this.shown];
      // Reticências: pausa só no último ponto
      const pause = ch === '.' && nextCh === '.' ? 0.12 : (PAUSES[ch] ?? 0);
      this.wait += 1 / CHARS_PER_SECOND + (nextCh === undefined ? 0 : pause);
    }
    this.bodyText.setText(this.fullText.slice(0, this.shown));
    if (this.shown >= this.fullText.length) this.#finishTyping();
  }
}

export const SPEAKERS = {
  artur: 'Artur',
};

