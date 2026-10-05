// Tutorial (opção nas configurações): setas douradas apontando o próximo passo.
// Se o ponto está na tela, a seta fica em cima dele, balançando; se não está, fica na borda
// da tela, girada para o lado dele. Quem decide os pontos é a HouseScene (tutorialPoints).

const DEPTH = 1_000_003; // acima da escuridão (a iluminação fica em 1_000_000)
const EDGE = 10; // px de tela entre a seta e a borda
const LIFT = 4; // px (mundo) acima do ponto

export class Tutorial {
  constructor(scene) {
    this.scene = scene;
    this.pool = [];
    this.time = 0;
  }

  /** points: pontos do mundo (px) onde há um próximo passo. */
  update(dt, points) {
    this.time += dt;
    const cam = this.scene.cameras.main;
    const view = cam.worldView;
    const edge = EDGE / cam.zoom;
    const bob = Math.round(Math.sin(this.time * 6) * 2);
    const alpha = 0.85 + 0.15 * Math.sin(this.time * 6);
    while (this.pool.length < points.length) {
      // 1,5× (com o zoom 2 da casa, cada pixel da seta vira 3 na tela: continua nítida)
      this.pool.push(this.scene.add.image(0, 0, 'props', 'tutorial-arrow').setDepth(DEPTH).setOrigin(0.5, 1).setScale(1.5));
    }
    this.pool.forEach((arrow, i) => {
      const p = points[i];
      arrow.setVisible(!!p);
      if (!p) return;
      arrow.setAlpha(alpha);
      const inside =
        p.x > view.x + edge && p.x < view.right - edge && p.y - LIFT - 11 > view.y + edge && p.y < view.bottom - edge;
      if (inside) {
        arrow.setOrigin(0.5, 1).setRotation(0).setPosition(p.x, p.y - LIFT + bob);
        return;
      }
      // Na borda: na linha entre o centro da tela e o ponto, girada para ele
      const cx = view.centerX;
      const cy = view.centerY;
      const dx = p.x - cx;
      const dy = p.y - cy;
      const hw = view.width / 2 - edge - 9;
      const hh = view.height / 2 - edge - 9;
      const k = Math.min(hw / Math.max(1e-6, Math.abs(dx)), hh / Math.max(1e-6, Math.abs(dy)));
      const push = Math.sin(this.time * 6) * 1.5; // cutucando na direção do ponto
      const len = Math.hypot(dx, dy) || 1;
      arrow
        .setOrigin(0.5, 0.5)
        .setRotation(Math.atan2(dy, dx) - Math.PI / 2) // a seta desenhada aponta para baixo
        .setPosition(cx + dx * k + (dx / len) * push, cy + dy * k + (dy / len) * push);
    });
  }

  hide() {
    this.pool.forEach((a) => a.setVisible(false));
  }

  destroy() {
    this.pool.forEach((a) => a.destroy());
    this.pool = [];
  }
}
