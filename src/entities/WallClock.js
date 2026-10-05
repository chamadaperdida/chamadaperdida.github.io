// Relógio de ponteiros na parede do corredor (GDD 10). O mostrador é o sprite 'wall-clock'
// (12×12 + 1 px de contorno); os ponteiros são desenhados aqui, pixel a pixel, para ficarem
// nítidos como o resto da pixel art. Nas noites normais fica parado em 23:41; na madrugada
// do final acompanha as ligações (23:41, 23:44, 23:47).

const HOUR_LEN = 2.5;
const MINUTE_LEN = 4;

export class WallClock {
  /** @param sprite imagem do mostrador (origem no canto de cima à esquerda) */
  constructor(scene, sprite) {
    // Centro do mostrador: 1 px de contorno + metade de 12 px
    this.cx = sprite.x + 1 + 5.5;
    this.cy = sprite.y + 1 + 5.5;
    this.gfx = scene.add.graphics().setDepth(sprite.depth + 1);
    this.setTime('23:41');
  }

  /** '23:41' → ponteiros nessa hora. */
  setTime(time) {
    const [h, m] = time.split(':').map(Number);
    const g = this.gfx.clear();
    this.#hand(g, ((h % 12) + m / 60) / 12, HOUR_LEN, 0x1a1410);
    this.#hand(g, m / 60, MINUTE_LEN, 0x2a2018);
    g.fillStyle(0x8a1a14, 1).fillRect(Math.floor(this.cx), Math.floor(this.cy), 1, 1);
  }

  /** Um ponteiro: `turn` em voltas (0 = 12 h), pixel a pixel a partir do centro. */
  #hand(g, turn, length, color) {
    const a = turn * Math.PI * 2;
    const dx = Math.sin(a);
    const dy = -Math.cos(a);
    g.fillStyle(color, 1);
    for (let t = 0; t <= length; t += 0.5) {
      g.fillRect(Math.floor(this.cx + dx * t), Math.floor(this.cy + dy * t), 1, 1);
    }
  }
}
