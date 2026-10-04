// TV ligando sozinha — GDD 5. Só se Artur estiver perto. Chiado; às vezes meia palavra de
// uma jornalista (prenuncia o final). O medo sobe enquanto ela estiver ligada.
// Reação certa: interagir com a TV (F) para desligar. Medo: 5 certo / 13 errado (9.3).

import { BALANCE } from '../config/balance.js';
import { PPM } from '../world/tiles.js';
import { Hallucination } from './Hallucination.js';
import { positional } from '../audio/Sfx.js';

const FONT = 'VT323, monospace';
const MAX_LIFE = 60;
// Pedaços da reportagem do final (GDD 10)
const WORDS = ['...ex-policial de qua—', '...encontrado mor—', '...Vale Ser—', '...medicamentos contro—', '...a esposa e a fi—'];

export class TvHallucination extends Hallucination {
  constructor(ctx, opts) {
    super(ctx, opts);
    const { right, wrong } = BALANCE.hallucinationFear.tv;
    this.addFear(right);
    this.extraLeft = wrong - right;
    this.extraPerSecond = (wrong - right) / BALANCE.extra.tvSeconds;

    this.tv = ctx.furniture('tv');
    this.screen = ctx.scene.add
      .image(this.tv.x + 7, this.tv.y + 4, 'props', 'tv-static-0')
      .setOrigin(0)
      .setDepth(this.tv.depth + 1);
    this.frame = 0;
    this.frameIn = 0;
    this.wordIn = 2 + Math.random() * 2;
    this.pos = { x: (this.tv.x + this.tv.width / 2) / PPM, y: (this.tv.y + this.tv.height) / PPM };
    this.sound = ctx.sfx.staticLoop(0);
  }

  get name() {
    return 'TV ligando sozinha';
  }

  get interactable() {
    return {
      anchor: { x: this.tv.x + this.tv.width / 2, y: this.tv.y - 2 },
      point: { x: this.pos.x, y: this.pos.y + 0.35 },
      range: 1.3,
      use: () => {
        this.done = true;
      },
    };
  }

  update(dt) {
    super.update(dt);
    this.frameIn -= dt;
    if (this.frameIn <= 0) {
      this.frameIn = 0.06;
      this.frame = (this.frame + 1) % 3;
      this.screen.setFrame(`tv-static-${this.frame}`);
    }

    // Chiado alto o bastante para chamar o Artur de outros cômodos
    const { volume, pan } = positional(this.ctx.feet(), this.pos, BALANCE.extra.deviceSoundRange);
    this.sound.setVolume(0.6 * Math.max(0.12, volume), pan);

    if (this.extraLeft > 0) {
      const add = Math.min(this.extraLeft, this.extraPerSecond * dt);
      this.extraLeft -= add;
      this.addFear(add);
    }

    // Às vezes, meia palavra da jornalista
    this.wordIn -= dt;
    if (this.wordIn <= 0) {
      this.wordIn = 3.5 + Math.random() * 3;
      if (Math.random() < 0.6) this.sayWord();
    }
    if (this.elapsed > MAX_LIFE) this.done = true;
  }

  sayWord() {
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    const text = this.ctx.scene.add
      .text(this.tv.x + this.tv.width / 2, this.tv.y - 6, word, {
        fontFamily: FONT,
        fontSize: '10px',
        color: '#a8b4bc',
        resolution: 4,
      })
      .setOrigin(0.5, 1)
      .setDepth(2_000_000);
    this.ctx.scene.tweens.add({ targets: text, alpha: 0, delay: 900, duration: 500, onComplete: () => text.destroy() });
  }

  end() {
    this.sound.stop();
    this.screen.destroy();
  }
}
