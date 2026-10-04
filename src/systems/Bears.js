// Ursos de pelúcia (GDD 4.12).
//
// - Só aparecem quando a noite começa (ao ler a lista). Quantidade fixa por noite.
// - Ficam no chão, em cômodos diferentes enquanto der (nunca no quarto da Clara).
// - Coletáveis a qualquer momento, com a luz acesa ou apagada.
// - Brilho âmbar bem fraco (por cima da escuridão, discreto). Nenhum som ajuda a achar.
// - Ao coletar: some como uma presença (partículas de luz subindo) e uma nota de caixinha
//   de música. O jogador não sabe quantos faltam.
// - Efeito no jogo: clock.bearsCollected (intervalo das alucinações, trava, gerador).

import Phaser from 'phaser';
import { BALANCE } from '../config/balance.js';
import { roomAt } from '../world/houseMap.js';
import { PPM } from '../world/tiles.js';

const ABOVE_DARKNESS = 1_000_001; // a escuridão (Lighting) fica em 1.000.000
const CLEARANCE = 0.75; // metros livres de móveis e portas em volta do urso

function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export class Bears {
  /**
   * @param nav  NavGrid da casa (células livres)
   * @param furnitureRects retângulos dos móveis (px)
   */
  constructor(scene, clock, nav, furnitureRects) {
    this.scene = scene;
    this.clock = clock;
    this.nav = nav;
    this.furnitureRects = furnitureRects;
    this.list = [];
  }

  /** Lugares possíveis no chão, agrupados por cômodo. */
  #candidates() {
    const byRoom = new Map();
    const clear = CLEARANCE * PPM;
    for (let j = 0; j < this.nav.h; j++) {
      for (let i = 0; i < this.nav.w; i++) {
        if (!this.nav.passable(i, j) || this.nav.doorAt(i, j)) continue;
        const p = this.nav.center(i, j);
        const room = roomAt(p.x, p.y);
        if (!room || room.id === 'quartoClara') continue;
        // Longe de paredes, portas e móveis: as 4 direções a CLEARANCE também livres
        const ok = [
          [CLEARANCE, 0],
          [-CLEARANCE, 0],
          [0, CLEARANCE],
          [0, -CLEARANCE],
        ].every(([dx, dy]) => {
          const [ci, cj] = this.nav.cellOf(p.x + dx, p.y + dy);
          return this.nav.passable(ci, cj) && !this.nav.doorAt(ci, cj);
        });
        if (!ok) continue;
        const px = p.x * PPM;
        const py = p.y * PPM;
        const area = new Phaser.Geom.Rectangle(px - clear, py - clear, clear * 2, clear * 2);
        if (this.furnitureRects.some((r) => Phaser.Geom.Rectangle.Overlaps(r, area))) continue;
        if (!byRoom.has(room.id)) byRoom.set(room.id, []);
        byRoom.get(room.id).push(p);
      }
    }
    return byRoom;
  }

  /** Espalha os ursos da noite. */
  spawn(count) {
    const byRoom = this.#candidates();
    const rooms = shuffle([...byRoom.keys()]);
    const picks = [];
    // Um por cômodo; se faltar cômodo, repete
    for (let k = 0; picks.length < count && k < count * 3; k++) {
      const id = rooms[k % rooms.length];
      const cells = byRoom.get(id);
      if (!cells?.length) continue;
      picks.push(cells.splice(Math.floor(Math.random() * cells.length), 1)[0]);
    }
    for (const p of picks) this.list.push(this.#create(p));
  }

  #create(p) {
    const x = p.x * PPM;
    const y = p.y * PPM;
    const sprite = this.scene.add.image(x, y, 'props', 'bear').setOrigin(0.5, 1).setDepth(y);
    const glow = this.scene.add
      .image(x, y - 6, 'props', 'glow')
      .setDepth(ABOVE_DARKNESS)
      .setAlpha(BALANCE.bears.glowAlpha)
      .setScale(BALANCE.bears.glowScale)
      .setBlendMode(Phaser.BlendModes.ADD);
    return { x: p.x, y: p.y, sprite, glow };
  }

  /** Urso ao alcance dos pés, ou null. */
  nearest(feet) {
    let best = null;
    let bestDist = BALANCE.bears.reach;
    for (const b of this.list) {
      const d = Math.hypot(feet.x - b.x, feet.y - b.y);
      if (d < bestDist) {
        best = b;
        bestDist = d;
      }
    }
    return best;
  }

  collect(bear, sfx) {
    this.list = this.list.filter((b) => b !== bear);
    this.clock.bearsCollected += 1;
    const { x, y } = bear.sprite;
    bear.sprite.destroy();
    this.scene.tweens.add({ targets: bear.glow, alpha: 0, scale: 1.6, duration: 500, onComplete: () => bear.glow.destroy() });
    // Some como uma presença: partículas de luz quente subindo
    for (let i = 0; i < 12; i++) {
      const spark = this.scene.add
        .image(x + Phaser.Math.Between(-6, 6), y - Phaser.Math.Between(2, 12), 'props', 'spark')
        .setDepth(ABOVE_DARKNESS)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setAlpha(0.9);
      this.scene.tweens.add({
        targets: spark,
        y: spark.y - Phaser.Math.Between(18, 36),
        x: spark.x + Phaser.Math.Between(-5, 5),
        alpha: 0,
        duration: Phaser.Math.Between(500, 900),
        ease: 'Sine.easeOut',
        onComplete: () => spark.destroy(),
      });
    }
    sfx.musicBox();
  }

  /** Quantos ainda estão na casa (só debug). */
  get remaining() {
    return this.list.length;
  }
}
