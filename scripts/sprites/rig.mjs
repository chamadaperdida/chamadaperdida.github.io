// "Esqueleto" simples para desenhar personagens animados em pixel art: cada quadro é uma
// pose (quadril, joelhos, pés, ombro, cotovelos, mãos, cabeça) e os membros viram linhas
// grossas. Assim os ciclos de corrida/caminhada ficam consistentes entre os quadros.

/** Linha com espessura (w px). */
export function limb(c, x, y, a, b, w, color) {
  const n = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])) || 1;
  for (let i = 0; i <= n; i++) {
    const px = Math.round(a[0] + ((b[0] - a[0]) * i) / n);
    const py = Math.round(a[1] + ((b[1] - a[1]) * i) / n);
    c.rect(x + px - Math.floor((w - 1) / 2), y + py - Math.floor((w - 1) / 2), w, w, color);
  }
}

/** Polígono cheio (contorno convexo simples, por varredura). */
export function poly(c, x, y, points, color) {
  const ys = points.map((p) => p[1]);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  for (let py = minY; py <= maxY; py++) {
    const xs = [];
    for (let i = 0; i < points.length; i++) {
      const [x0, y0] = points[i];
      const [x1, y1] = points[(i + 1) % points.length];
      if ((py >= Math.min(y0, y1)) && (py <= Math.max(y0, y1)) && y0 !== y1) {
        xs.push(x0 + ((py - y0) * (x1 - x0)) / (y1 - y0));
      }
    }
    if (xs.length < 2) continue;
    const l = Math.round(Math.min(...xs));
    const r = Math.round(Math.max(...xs));
    c.rect(x + l, y + py, r - l + 1, 1, color);
  }
}

export function ellipse(c, x, y, cx, cy, rx, ry, color) {
  for (let yy = -ry; yy <= ry; yy++) {
    for (let xx = -rx; xx <= rx; xx++) {
      if ((xx * xx) / (rx * rx || 1) + (yy * yy) / (ry * ry || 1) <= 1) c.px(x + cx + xx, y + cy + yy, color);
    }
  }
}

/**
 * Ciclo de corrida de perfil (virado para a direita), 8 quadros.
 * Devolve poses com joelhos/pés de cada perna e cotovelos/mãos de cada braço, relativos ao
 * quadril (0,0). `stride` escala a passada, `bend` o quanto os joelhos dobram.
 */
export function runCycle({ stride = 1, bend = 1, arms = 1, bounce = 1 } = {}) {
  // Meio ciclo (perna A na frente → perna B na frente): contato, descida, passagem, impulso
  const half = [
    { bob: 0, A: { k: [4, 5], f: [7, 11] }, B: { k: [-3, 5], f: [-6, 10] }, armA: { e: [-3, 3], h: [-4, 6] }, armB: { e: [3, 3], h: [5, 1] } },
    { bob: 1, A: { k: [3, 6], f: [2, 12] }, B: { k: [-4, 4], f: [-7, 7] }, armA: { e: [-2, 4], h: [-2, 7] }, armB: { e: [2, 4], h: [4, 3] } },
    { bob: 0, A: { k: [1, 6], f: [0, 12] }, B: { k: [3, 3], f: [-1, 7] }, armA: { e: [0, 4], h: [1, 7] }, armB: { e: [0, 4], h: [0, 7] } },
    { bob: -1, A: { k: [-1, 6], f: [-4, 11] }, B: { k: [5, 3], f: [6, 7] }, armA: { e: [2, 4], h: [4, 3] }, armB: { e: [-2, 3], h: [-3, 6] } },
  ];
  const scale = ([dx, dy], sx, sy = 1) => [Math.round(dx * sx), Math.round(dy * sy)];
  const frames = [];
  for (let k = 0; k < 8; k++) {
    const p = half[k % 4];
    const swap = k >= 4;
    const legA = swap ? p.B : p.A;
    const legB = swap ? p.A : p.B;
    const armA = swap ? p.armB : p.armA;
    const armB = swap ? p.armA : p.armB;
    const leg = (l) => ({ k: scale(l.k, stride * 0.9, 1 - (1 - bend) * 0.15), f: scale(l.f, stride) });
    const arm = (a) => ({ e: scale(a.e, arms), h: scale(a.h, arms) });
    frames.push({ bob: Math.round(p.bob * bounce), near: leg(legA), far: leg(legB), armNear: arm(armB), armFar: arm(armA) });
  }
  return frames;
}

/** Ciclo de caminhada de frente/de costas, 4 quadros: [pé esq. ergue, dir. ergue] + balanço. */
export function frontCycle() {
  return [
    { bob: 0, liftL: 0, liftR: 0, armL: 0, armR: 0 },
    { bob: 1, liftL: 2, liftR: 0, armL: 1, armR: -1 },
    { bob: 0, liftL: 0, liftR: 0, armL: 0, armR: 0 },
    { bob: 1, liftL: 0, liftR: 2, armL: -1, armR: 1 },
  ];
}
