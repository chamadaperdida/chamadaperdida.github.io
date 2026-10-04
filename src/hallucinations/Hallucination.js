// Base das alucinações (GDD 5).
//
// Cada alucinação recebe o contexto da casa (ctx) e diz quanto medo soma pela tabela 9.3
// (com addFear).
//
// ctx: { scene, fear, sfx, hud, player, feet(), onScreen(px, py), findSpot(min, max, opts) }

export class Hallucination {
  constructor(ctx) {
    this.ctx = ctx;
    this.fear = ctx.fear;
    this.done = false;
    this.elapsed = 0;
  }

  /** Nome que aparece no debug. */
  get name() {
    return 'alucinação';
  }

  /** Medo da tabela 9.3 (× escala das alucinações). */
  addFear(base) {
    if (base <= 0) return 0;
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
