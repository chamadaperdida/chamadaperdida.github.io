// Base das alucinações (GDD 5).
//
// Cada alucinação recebe o contexto da casa (ctx) e diz quanto medo soma pela tabela 9.3
// (com addFear). A PRIMEIRA alucinação da noite (o evento garantido a caminho do quarto,
// GDD 4.8) dá um valor fixo maior no começo (+25) e ignora o medo da tabela.
//
// ctx: { scene, fear, sfx, hud, player, feet(), onScreen(px, py), findSpot(min, max, opts) }

import { BALANCE } from '../config/balance.js';

export class Hallucination {
  constructor(ctx, { first = false } = {}) {
    this.ctx = ctx;
    this.fear = ctx.fear;
    this.first = first;
    this.done = false;
    this.elapsed = 0;
    if (first) this.fear.add(BALANCE.extra.firstHallucinationFear);
  }

  /** Nome que aparece no debug. */
  get name() {
    return 'alucinação';
  }

  /** Medo da tabela 9.3 (× escala das alucinações). Na primeira da noite não soma nada. */
  addFear(base) {
    if (this.first || base <= 0) return 0;
    return this.fear.addHallucination(base);
  }

  /** Brilho da zona atual (alucinações de luz). 1 = normal. */
  get lightFactor() {
    return 1;
  }

  /** Algo para usar com F? { anchor: {x,y} px, point: {x,y} m, range: m, use() } */
  get interactable() {
    return null;
  }

  /** Pode continuar com a luz apagada? (só os passos falsos) */
  get worksInDark() {
    return false;
  }

  update(dt) {
    this.elapsed += dt;
  }

  /** Limpa sprites e sons. */
  end() {}
}
