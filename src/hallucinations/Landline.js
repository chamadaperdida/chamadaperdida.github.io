// Telefone fixo tocando — GDD 5. Só se Artur estiver perto.
// Deixar tocar até parar: medo sobe pouco (4). Atender (F): chiado e respiração,
// medo sobe muito (14) + coração. Medo: 4 certo / 14 errado (9.3).

import { BALANCE } from '../config/balance.js';
import { PPM } from '../world/tiles.js';
import { Hallucination } from './Hallucination.js';
import { positional } from '../audio/Sfx.js';

export class LandlineHallucination extends Hallucination {
  constructor(ctx, opts) {
    super(ctx, opts);
    const { right, wrong } = BALANCE.hallucinationFear.landline;
    this.addFear(right);
    this.answerExtra = wrong - right;
    this.phone = ctx.furniture('telefoneFixo');
    this.baseX = this.phone.x;
    this.pos = { x: (this.phone.x + this.phone.width / 2) / PPM, y: (this.phone.y + this.phone.height) / PPM };
    this.ring = ctx.sfx.phoneRing(0);
    this.answered = false;
  }

  get name() {
    return 'Telefone fixo tocando';
  }

  get interactable() {
    if (this.answered) return null;
    return {
      anchor: { x: this.phone.x + this.phone.width / 2, y: this.phone.y - 2 },
      point: { x: this.pos.x, y: this.pos.y + 0.35 },
      range: 1.3,
      use: () => this.answer(),
    };
  }

  answer() {
    this.answered = true;
    this.stopRinging();
    this.addFear(this.answerExtra);
    this.ctx.hud
      .talk([
        { speaker: 'Artur', text: 'Alô?' },
        { speaker: '???', text: '(chiado... e uma respiração do outro lado da linha)' },
      ])
      .then(() => {
        this.done = true;
      });
  }

  stopRinging() {
    this.ring.stop();
    this.phone.x = this.baseX;
  }

  update(dt) {
    super.update(dt);
    if (this.answered) return;
    const { volume, pan } = positional(this.ctx.feet(), this.pos, 14);
    this.ring.setVolume(0.5 * Math.max(0.15, volume), pan);
    // Treme junto com a campainha (1 s tocando, 2 s parado)
    const ringing = this.elapsed % 3 < 1;
    this.phone.x = this.baseX + (ringing ? (Math.floor(this.elapsed * 30) % 2 ? 1 : -1) : 0);
    if (this.elapsed >= BALANCE.extra.landlineRingSeconds) this.done = true;
  }

  end() {
    if (!this.answered) this.stopRinging();
  }
}
