// Balão vermelho — GDD 5. Aparece na tela e fica parado ali. Enquanto estiver na tela,
// o medo sobe aos poucos. Ir até ele e estourar (F): voz diz "ops" e o medo para de subir.
// Medo: 6 certo / 18 errado (9.3).

import { BALANCE } from '../config/balance.js';
import { PPM } from '../world/tiles.js';
import { Hallucination } from './Hallucination.js';

const FONT = 'VT323, monospace';
const OFFSCREEN_VANISH = 12; // s fora da tela e ele some
const MAX_LIFE = 60;

export class BalloonHallucination extends Hallucination {
  constructor(ctx, opts) {
    super(ctx, opts);
    const { right, wrong } = BALANCE.hallucinationFear.balloon;
    this.addFear(right);
    this.extraLeft = wrong - right;
    this.extraPerSecond = (wrong - right) / BALANCE.extra.balloonSeconds;
    this.offscreen = 0;
    this.popped = false;

    const spot = opts?.spot ?? ctx.findSpot(2, 5, { onScreen: true, sameRoom: true });
    this.baseY = spot.y - 10; // flutua um pouco acima do chão
    this.sprite = ctx.scene.add.image(spot.x, this.baseY, 'props', 'balloon').setOrigin(0.5, 1).setDepth(spot.y);
  }

  get name() {
    return 'Balão vermelho';
  }

  get interactable() {
    if (this.popped) return null;
    return {
      anchor: { x: this.sprite.x, y: this.sprite.y - 24 },
      point: { x: this.sprite.x / PPM, y: (this.baseY + 10) / PPM },
      range: 1.1,
      use: () => this.pop(),
    };
  }

  pop() {
    this.popped = true;
    this.ctx.sfx.pop();
    const { x, y } = this.sprite;
    this.sprite.destroy();
    const text = this.ctx.scene.add
      .text(x, y - 12, 'ops', { fontFamily: FONT, fontSize: '12px', color: '#d8c79a', resolution: 4 })
      .setOrigin(0.5)
      .setDepth(2_000_000);
    this.ctx.scene.tweens.add({
      targets: text,
      y: y - 22,
      alpha: 0,
      duration: 900,
      onComplete: () => {
        text.destroy();
        this.done = true;
      },
    });
  }

  update(dt) {
    super.update(dt);
    if (this.popped) return;
    this.sprite.y = this.baseY + Math.sin(this.elapsed * 2) * 1.5;

    if (this.ctx.onScreen(this.sprite.x, this.sprite.y - 10)) {
      this.offscreen = 0;
      if (this.extraLeft > 0) {
        const add = Math.min(this.extraLeft, this.extraPerSecond * dt);
        this.extraLeft -= add;
        this.addFear(add);
      }
    } else {
      this.offscreen += dt;
    }
    if (this.offscreen > OFFSCREEN_VANISH || this.elapsed > MAX_LIFE) this.done = true;
  }

  end() {
    if (!this.popped) this.sprite.destroy();
  }
}
