// Poça de sangue — GDD 5. Aparece num lugar do mapa FORA do campo de visão do jogador.
// Quando entra na tela, o medo sobe — mais rápido quanto mais perto (inversamente
// proporcional à distância). Perto: goteira e gota caindo do teto.
// Reação certa: ficar longe por tempo suficiente, e ela some. Medo: 4 certo / 11 errado (9.3).

import { BALANCE } from '../config/balance.js';
import { PPM } from '../world/tiles.js';
import { Hallucination } from './Hallucination.js';
import { positional } from '../audio/Sfx.js';

// Medo por segundo com a poça na tela = FEAR_RATE / distância (m), antes da escala ×2.
// Ex.: a 4 m sobe 1/s; a 1 m, 4/s. Para no valor "errado" da tabela.
const FEAR_RATE = 4;
const MIN_DIST = 0.75; // m — evita divisão por quase zero em cima da poça
const FAR_DIST = 5; // m — longe
const VANISH_AFTER_FAR = 8; // s longe (depois de vista) e ela some
const UNSEEN_LIFE = 30; // s — se ninguém a viu até lá, some
const MAX_LIFE = 60;
const DRIP_EVERY = 1.3;

export class BloodPoolHallucination extends Hallucination {
  constructor(ctx, opts) {
    super(ctx, opts);
    this.fearLeft = BALANCE.hallucinationFear.bloodPool.wrong;
    this.seen = false;
    this.farTime = 0;
    this.dripIn = 0.3;

    // Sempre fora da tela: ela "já estava lá" quando o jogador chega
    const spot = ctx.findSpot(5, 12, { onScreen: false, offScreen: true });
    if (!spot) {
      this.done = true; // nenhum lugar fora da tela por perto: não aparece
      return;
    }
    this.pos = { x: spot.x / PPM, y: spot.y / PPM };
    this.pool = ctx.scene.add.image(spot.x, spot.y, 'props', 'blood-pool').setOrigin(0.5, 0.5).setDepth(spot.y - 20);
    this.drop = ctx.scene.add.image(spot.x, spot.y - 48, 'props', 'drip').setDepth(spot.y + 1).setVisible(false);
  }

  get name() {
    return 'Poça de sangue';
  }

  update(dt) {
    super.update(dt);
    if (!this.pool) return;
    const feet = this.ctx.feet();
    const d = Math.hypot(feet.x - this.pos.x, feet.y - this.pos.y);
    // "Entrou no campo de visão" = na tela e iluminada (nos cômodos escuros ela não aparece)
    const visible = this.ctx.onScreen(this.pool.x, this.pool.y) && this.ctx.isLit(this.pos.x, this.pos.y);

    // Na tela: medo inversamente proporcional à distância, até o valor "errado"
    if (visible) {
      this.seen = true;
      if (this.fearLeft > 0) {
        const add = Math.min(this.fearLeft, (FEAR_RATE / Math.max(MIN_DIST, d)) * dt);
        this.fearLeft -= add;
        this.addFear(add);
      }
    }

    // Gota caindo do teto + goteira (som pela distância)
    this.dripIn -= dt;
    if (this.dripIn <= 0) {
      this.dripIn = DRIP_EVERY + Math.random() * 0.4;
      this.drop.setPosition(this.pool.x, this.pool.y - 48).setVisible(true);
      this.ctx.scene.tweens.add({
        targets: this.drop,
        y: this.pool.y - 2,
        duration: 450,
        ease: 'Quad.easeIn',
        onComplete: () => {
          this.drop.setVisible(false);
          const { volume, pan } = positional(this.ctx.feet(), this.pos, 7);
          this.ctx.sfx.drip(volume * 0.7, pan);
        },
      });
    }

    // Some depois de um tempo longe — mas NUNCA enquanto está no campo de visão
    // (o tempo longe só conta depois de ela ter sido vista e com ela fora da tela)
    this.farTime = this.seen && !visible && d > FAR_DIST ? this.farTime + dt : 0;
    const gone = this.farTime > VANISH_AFTER_FAR || (!this.seen && this.elapsed > UNSEEN_LIFE);
    if (!visible && (gone || this.elapsed > MAX_LIFE)) this.done = true;
  }

  end() {
    if (!this.pool) return;
    this.ctx.scene.tweens.killTweensOf(this.drop);
    this.pool.destroy();
    this.drop.destroy();
  }
}
