// Porta da casa (GDD 4.9). O jogador abre e fecha; mais tarde as entidades também.
// Porta fechada bloqueia passagem (jogador e, depois, monstros).

import Phaser from 'phaser';
import { DOOR_WIDTH } from '../world/houseMap.js';
import { PPM, TILE } from '../world/tiles.js';

export class Door {
  constructor(scene, def) {
    this.scene = scene;
    this.def = def;
    this.id = def.id;
    this.kind = def.kind;
    this.axis = def.axis;
    this.isOpen = def.open;

    const cx = def.x * PPM;
    const cy = def.y * PPM;
    const long = DOOR_WIDTH * PPM;
    const w = def.axis === 'h' ? long : TILE;
    const h = def.axis === 'h' ? TILE : long;
    this.rect = new Phaser.Geom.Rectangle(cx - w / 2, cy - h / 2, w, h);
    this.center = { x: def.x, y: def.y };

    this.sprite = scene.add.image(cx, cy, 'props', this.#frame());
    this.sprite.setDepth(this.rect.bottom - (def.axis === 'h' ? 0 : long));

    // Corpo estático: existe sempre; só colide quando fechada
    this.blocker = scene.add.zone(cx, cy, w, h);
    scene.physics.add.existing(this.blocker, true);
    this.blocker.body.enable = !this.isOpen;
  }

  #frame() {
    if (this.axis === 'v') return this.isOpen ? 'door-v-open' : 'door-v-closed';
    if (this.kind === 'clara') return 'door-h-clara';
    return this.isOpen ? 'door-h-open' : 'door-h-closed';
  }

  /** Pode ser aberta/fechada pelo jogador? */
  get operable() {
    return this.kind === 'normal';
  }

  /** Algo (retângulo em px) está no vão da porta? Não dá para fechar em cima. */
  isObstructedBy(bounds) {
    return Phaser.Geom.Intersects.RectangleToRectangle(this.rect, bounds);
  }

  setOpen(open) {
    if (!this.operable || open === this.isOpen) return;
    this.isOpen = open;
    this.blocker.body.enable = !open;
    this.sprite.setFrame(this.#frame());
  }

  toggle() {
    this.setOpen(!this.isOpen);
  }
}
