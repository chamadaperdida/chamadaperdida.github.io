// Tela inicial (GDD 2.1): o telefone numa mesa escura. É a imagem principal do jogo, então
// é pintada com mais resolução (480×270, ampliada 2×) e com um "mini renderizador":
// cada pixel tem uma cor base e um tipo (parede, mesa, objeto, corredor, emissivo), e a luz
// é calculada depois — luz fria da rua entrando pela persiana em faixas, sombras longas dos
// objetos na mesa, cantos escuros — e o resultado é pontilhado (dithering) como pixel art.
//
// Na cena: céu atrás da janela, sombra no corredor (aparece nos relâmpagos) e os raios de luz
// com poeira são peças separadas. Detalhes que contam a história: secretária eletrônica com
// "1" e luz vermelha (a chamada perdida), relógio parado em 23:41, porta-retrato rachado,
// remédios derramados, urso com a costura vermelha e um olho faltando.

import { PixelCanvas, seeded } from './canvas.mjs';

export const TITLE_W = 480;
export const TITLE_H = 270;

// Tipos de pixel (definem como a luz age)
const EMPTY = 0; // transparente (vidro da janela: o céu aparece por trás)
const WALL = 1;
const TABLE = 2;
const OBJECT = 3;
const EMISSIVE = 4; // brilha sozinho (visor, luz no fim do corredor)
const HALL = 5; // corredor escuro
const BLIND = 6; // persiana (contra a luz)

const AMBIENT = [0.15, 0.16, 0.22];
const MOON = [0.62, 0.72, 0.95];

// Janela e persiana
const WIN = { x0: 326, x1: 438, y0: 30, y1: 156 }; // moldura
const GLASS = { x0: 332, x1: 432, y0: 36, y1: 150 };
const TABLE_TOP = 200; // borda de trás do tampo
const TABLE_EDGE = 238; // borda da frente
// Porta do corredor
const DOOR = { x0: 198, x1: 250, y0: 64, y1: TABLE_TOP };

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const smooth = (a, b, v) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// Ruído suave (manchas, veios da madeira, pelo)
function hash(x, y, seed) {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function noise(x, y, seed = 1) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const s = (t) => t * t * (3 - 2 * t);
  const a = hash(xi, yi, seed);
  const b = hash(xi + 1, yi, seed);
  const c = hash(xi, yi + 1, seed);
  const d = hash(xi + 1, yi + 1, seed);
  return a + (b - a) * s(xf) + (c - a) * s(yf) + (a - b - c + d) * s(xf) * s(yf);
}
const fbm = (x, y, seed) => noise(x, y, seed) * 0.6 + noise(x * 2.1, y * 2.1, seed + 7) * 0.3 + noise(x * 4.3, y * 4.3, seed + 13) * 0.1;

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/** Tela de pintura: cor base + tipo por pixel. */
class Scene {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.col = new Float32Array(w * h * 3);
    this.kind = new Uint8Array(w * h);
    this.obj = new Uint8Array(w * h); // 1 = projeta sombra na mesa
    this.shine = new Float32Array(w * h); // brilho extra (reflexo da luz da janela)
  }

  set(x, y, c, kind, shine = 0) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = y * this.w + x;
    this.col[i * 3] = c[0];
    this.col[i * 3 + 1] = c[1];
    this.col[i * 3 + 2] = c[2];
    this.kind[i] = kind;
    this.obj[i] = kind === OBJECT ? 1 : 0;
    this.shine[i] = shine;
  }

  get(x, y) {
    const i = y * this.w + x;
    return [this.col[i * 3], this.col[i * 3 + 1], this.col[i * 3 + 2]];
  }

  /** Escurece/clareia a cor base de uma região. */
  tint(x, y, k) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = y * this.w + x;
    for (let c = 0; c < 3; c++) this.col[i * 3 + c] *= k;
  }

  /** Pinta onde inside(x, y) for verdadeiro, com color(x, y). */
  shape(x0, y0, x1, y1, inside, color, kind, shine = 0) {
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
      for (let x = Math.floor(x0); x <= Math.ceil(x1); x++) {
        if (inside(x, y)) {
          const c = typeof color === 'function' ? color(x, y) : color;
          if (c) this.set(x, y, c, kind, typeof shine === 'function' ? shine(x, y) : shine);
        }
      }
    }
  }

  rect(x, y, w, h, color, kind, shine = 0) {
    this.shape(x, y, x + w - 1, y + h - 1, () => true, color, kind, shine);
  }

  ellipse(cx, cy, rx, ry, color, kind, shine = 0) {
    this.shape(
      cx - rx,
      cy - ry,
      cx + rx,
      cy + ry,
      (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1,
      color,
      kind,
      shine,
    );
  }

  line(x0, y0, x1, y1, color, kind, width = 1) {
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 1.5) + 1;
    for (let k = 0; k <= n; k++) {
      const x = x0 + ((x1 - x0) * k) / n;
      const y = y0 + ((y1 - y0) * k) / n;
      for (let w = 0; w < width; w++) this.set(x, y + w, color, kind);
    }
  }
}

/**
 * Pinta numa escala maior em volta de uma âncora (o telefone é desenhado em coordenadas
 * "normais" e sai ampliado, com detalhe de verdade em vez de pixels esticados).
 */
class View {
  constructor(sc, ax, ay, k, dx = 0) {
    Object.assign(this, { sc, ax, ay, k, dx });
  }

  #fwd(x, y) {
    return [this.ax + (x - this.ax) * this.k + this.dx, this.ay + (y - this.ay) * this.k];
  }

  #inv(x, y) {
    return [this.ax + (x - this.dx - this.ax) / this.k, this.ay + (y - this.ay) / this.k];
  }

  shape(x0, y0, x1, y1, inside, color, kind, shine = 0) {
    const [a, b] = this.#fwd(x0, y0);
    const [c, d] = this.#fwd(x1 + 1, y1 + 1);
    const map = (fn) => (typeof fn === 'function' ? (x, y) => fn(...this.#inv(x + 0.5, y + 0.5).map(Math.floor)) : fn);
    this.sc.shape(a, b, c - 1, d - 1, (x, y) => {
      const [u, v] = this.#inv(x + 0.5, y + 0.5);
      return u >= x0 && u < x1 + 1 && v >= y0 && v < y1 + 1 && inside(Math.floor(u), Math.floor(v));
    }, map(color), kind, map(shine));
  }

  rect(x, y, w, h, color, kind, shine = 0) {
    this.shape(x, y, x + w - 1, y + h - 1, () => true, color, kind, shine);
  }

  ellipse(cx, cy, rx, ry, color, kind, shine = 0) {
    const [fx, fy] = this.#fwd(cx, cy);
    const k = this.k;
    this.sc.shape(fx - rx * k, fy - ry * k, fx + rx * k, fy + ry * k,
      (x, y) => ((x - fx) / (rx * k)) ** 2 + ((y - fy) / (ry * k)) ** 2 <= 1,
      typeof color === 'function' ? (x, y) => color(...this.#inv(x, y)) : color, kind,
      typeof shine === 'function' ? (x, y) => shine(...this.#inv(x, y)) : shine);
  }

  line(x0, y0, x1, y1, color, kind, width = 1) {
    const [a, b] = this.#fwd(x0, y0);
    const [c, d] = this.#fwd(x1, y1);
    this.sc.line(a, b, c, d, color, kind, Math.max(1, Math.round(width * this.k)));
  }

  set(x, y, c, kind, shine = 0) {
    const [a, b] = this.#fwd(x, y);
    const n = Math.max(1, Math.round(this.k));
    for (let yy = 0; yy < n; yy++) for (let xx = 0; xx < n; xx++) this.sc.set(a + xx, b + yy, c, kind, shine);
  }
}

// ---- Luz ------------------------------------------------------------------------------

/** Persiana: a fresta deixa a luz passar? (u = altura dentro do vidro) */
function slatOpen(u) {
  if (u < 0 || u > GLASS.y1 - GLASS.y0) return false;
  if (u > 40 && u < 49) return true; // lâmina torta: fresta maior
  return ((u % 5) + 5) % 5 >= 3;
}

/** Faixas de luz na parede, à esquerda da janela. */
function beamWall(x, y) {
  if (x >= WIN.x0) return 0;
  const d = WIN.x0 - x;
  if (d > 120) return 0;
  const u = y - GLASS.y0 - 20 - d * 0.55;
  if (!slatOpen(u)) return 0;
  return (1 - d / 120) ** 1.4;
}

/** Faixas de luz na mesa e nos objetos (vindo de cima e da direita). */
function beamTable(x, y) {
  const s = x * 0.55 + y * 1.0;
  const stripe = ((s % 10) + 10) % 10 < 6;
  const fall = clamp01(1 - Math.hypot((x - 395) / 210, (y - 205) / 95));
  if (fall <= 0) return 0;
  return (stripe ? 1 : 0.18) * fall ** 1.1;
}

/** A mesa está na sombra de algum objeto? (anda em direção à luz procurando objeto) */
function tableShadow(sc, x, y) {
  for (let t = 2; t < 70; t++) {
    const sx = Math.round(x + t);
    const sy = Math.round(y - t * 0.42);
    if (sx >= sc.w || sy < 0) return 1;
    if (sc.obj[sy * sc.w + sx]) return 0.22 + Math.min(0.5, t / 140);
  }
  return 1;
}

function render(sc) {
  const out = new PixelCanvas(sc.w, sc.h);
  for (let y = 0; y < sc.h; y++) {
    for (let x = 0; x < sc.w; x++) {
      const i = y * sc.w + x;
      const kind = sc.kind[i];
      if (kind === EMPTY) continue;
      const base = sc.get(x, y);
      let light;
      if (kind === EMISSIVE) light = [1, 1, 1];
      else if (kind === HALL) light = mul(AMBIENT, 0.55);
      else if (kind === BLIND) light = [0.32, 0.36, 0.46];
      else if (kind === WALL) {
        const b = beamWall(x, y);
        // mais escuro no alto (teto longe da luz)
        const top = 0.75 + 0.25 * smooth(0, 90, y);
        light = mul(AMBIENT, top).map((v, k) => v + MOON[k] * b * 0.75);
      } else if (kind === TABLE) {
        const b = beamTable(x, y) * tableShadow(sc, x, y);
        light = AMBIENT.map((v, k) => v * 1.1 + MOON[k] * b * 0.85);
      } else {
        const b = beamTable(x, y);
        light = AMBIENT.map((v, k) => v * 1.25 + MOON[k] * (0.1 + b * 0.6));
      }
      const shine = sc.shine[i];
      let c = base.map((v, k) => v * light[k] + shine * MOON[k] * 255 * 0.6);
      // Cantos escuros
      const r = Math.hypot((x - 250) / 300, (y - 150) / 190);
      c = mul(c, 1 - 0.6 * smooth(0.45, 1.05, r));
      // Pontilhado ordenado (pixel art)
      const d = (BAYER[y & 3][x & 3] / 16 - 0.5) * 7;
      const q = c.map((v) => Math.max(0, Math.min(255, Math.round((v + d) / 6) * 6)));
      out.px(x, y, `#${q.map((v) => v.toString(16).padStart(2, '0')).join('')}`);
    }
  }
  return out;
}

// ---- Cenário --------------------------------------------------------------------------

function paintWall(sc) {
  const paper = hex('#6a6c62');
  const stripe = hex('#727468');
  const stain = hex('#4a4436');
  for (let y = 0; y < TABLE_TOP + 2; y++) {
    for (let x = 0; x < sc.w; x++) {
      // Papel de parede: listras verticais e um motivo de losangos bem apagado
      let c = (x % 14) < 4 ? stripe : paper;
      const mx = ((x + 7) % 14) - 7;
      const my = ((y + (Math.floor(x / 14) % 2) * 9) % 18) - 9;
      if (Math.abs(mx) + Math.abs(my) === 4) c = mix(c, hex('#5a5c52'), 0.6);
      // Manchas de umidade (escorrendo do teto)
      const n = fbm(x / 38, y / 22, 3);
      const drip = smooth(0.55, 0.75, n) * (1 - smooth(20, 140, y)) + smooth(0.68, 0.8, fbm(x / 20, y / 60, 9)) * 0.5;
      c = mix(c, stain, clamp01(drip) * 0.7);
      // granulado
      c = mul(c, 0.94 + hash(x, y, 5) * 0.08);
      sc.set(x, y, c, WALL);
    }
  }
  // Moldura do teto e sombra logo abaixo
  sc.rect(0, 0, sc.w, 12, hex('#3e3c36'), WALL);
  sc.rect(0, 12, sc.w, 2, hex('#7a786c'), WALL);
  sc.rect(0, 14, sc.w, 2, hex('#4e4c44'), WALL);
  // Papel descolando perto da porta
  sc.shape(258, 96, 270, 140, (x, y) => x - 258 < (y - 96) * 0.28 + 3, (x, y) => mix(hex('#8a8a7c'), hex('#5a5a50'), (x - 258) / 12), WALL);
  sc.line(258, 96, 270, 140, hex('#2e2c28'), WALL);
}

function paintDoor(sc) {
  const { x0, x1, y0, y1 } = DOOR;
  // Batente
  sc.rect(x0 - 5, y0 - 5, x1 - x0 + 10, 5, hex('#76705e'), WALL);
  sc.rect(x0 - 5, y0, 5, y1 - y0, hex('#6e6856'), WALL);
  sc.rect(x1, y0, 5, y1 - y0, hex('#6e6856'), WALL);
  sc.rect(x0 - 5, y0 - 5, x1 - x0 + 10, 1, hex('#8a846e'), WALL);
  // Corredor: escuridão, com o fundo um pouco menos escuro
  sc.shape(x0, y0, x1 - 1, y1, () => true, (x, y) => {
    const far = x > 212 && x < 238 && y > 92 && y < 172;
    const base = far ? hex('#3a3a40') : hex('#24242a');
    return mul(base, 0.8 + 0.2 * smooth(y0, y1, y));
  }, HALL);
  // Porta do fundo do corredor, com luz por baixo
  sc.rect(216, 104, 18, 64, hex('#2e2c30'), HALL);
  sc.rect(217, 167, 16, 1, hex('#8a5a26'), EMISSIVE);
  sc.rect(219, 168, 12, 1, hex('#4a3016'), EMISSIVE);
  // Folha da porta entreaberta (à esquerda, em perspectiva)
  sc.shape(x0, y0, x0 + 9, y1, (x, y) => y > y0 + (x - x0) * 0.6, (x, y) => mix(hex('#5e4c3a'), hex('#3a2e24'), (x - x0) / 9), HALL);
  sc.rect(x0 + 2, y0 + 20, 1, 40, hex('#2a2018'), HALL);
  sc.rect(x0 + 2, y0 + 72, 1, 40, hex('#2a2018'), HALL);
  sc.rect(x0 + 6, y0 + 70, 2, 3, hex('#8a7a5a'), HALL); // maçaneta
}

/** Relógio de parede, parado em 23:41 (o mesmo horário das ligações). */
function paintClock(sc) {
  const cx = 306;
  const cy = 42;
  sc.ellipse(cx + 1, cy + 2, 13, 13, hex('#2e2c28'), WALL); // sombra
  sc.ellipse(cx, cy, 12, 12, hex('#3a3026'), WALL);
  sc.ellipse(cx, cy, 10, 10, (x, y) => mix(hex('#cfc8b0'), hex('#a8a088'), (y - cy + 10) / 20), WALL);
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    sc.set(cx + Math.sin(a) * 8, cy - Math.cos(a) * 8, hex(k % 3 ? '#6a6458' : '#2a2620'), WALL);
  }
  const hand = (deg, len, c) => {
    const a = (deg * Math.PI) / 180;
    sc.line(cx, cy, cx + Math.sin(a) * len, cy - Math.cos(a) * len, hex(c), WALL);
  };
  hand(((11 + 41 / 60) / 12) * 360, 5, '#1a1612');
  hand((41 / 60) * 360, 8, '#2a2420');
  sc.set(cx, cy, hex('#8a2424'), WALL);
  // Vidro rachado
  sc.line(cx - 6, cy - 7, cx + 1, cy + 2, hex('#e8e4d8'), WALL);
  sc.line(cx + 1, cy + 2, cx + 7, cy + 4, hex('#e8e4d8'), WALL);
}

function paintWindow(sc) {
  const { x0, x1, y0, y1 } = WIN;
  const frame = hex('#5a5a56');
  sc.rect(x0, y0, x1 - x0, y1 - y0, frame, WALL);
  sc.rect(x0, y0, x1 - x0, 1, hex('#7a7a74'), WALL);
  sc.rect(x0 + 2, y0 + 2, x1 - x0 - 4, 2, hex('#3a3a38'), WALL);
  // Vidro: transparente (o céu é outra peça) e a persiana por cima
  for (let y = GLASS.y0; y < GLASS.y1; y++) {
    for (let x = GLASS.x0; x < GLASS.x1; x++) {
      const u = y - GLASS.y0;
      if (u > 40 && u < 49) {
        sc.set(x, y, [0, 0, 0], EMPTY);
        continue;
      }
      if (((u % 5) + 5) % 5 >= 3) sc.set(x, y, [0, 0, 0], EMPTY);
      else sc.set(x, y, ((u % 5) + 5) % 5 === 0 ? hex('#c8c4b4') : hex('#8a867a'), BLIND);
    }
  }
  // Lâmina torta, caída na diagonal
  sc.line(GLASS.x0 + 4, GLASS.y0 + 41, GLASS.x0 + 62, GLASS.y0 + 48, hex('#b8b4a4'), BLIND, 2);
  sc.line(GLASS.x0 + 62, GLASS.y0 + 46, GLASS.x1 - 1, GLASS.y0 + 42, hex('#9a968a'), BLIND, 2);
  // Divisória do meio da janela
  sc.rect(381, GLASS.y0, 2, GLASS.y1 - GLASS.y0, hex('#4a4a46'), BLIND);
  // Cordão da persiana
  sc.line(428, GLASS.y0, 428, 128, hex('#d8d4c4'), BLIND);
  sc.rect(427, 128, 3, 5, hex('#c8c4b4'), BLIND);
  // Peitoril
  sc.rect(x0 - 6, y1 - 6, x1 - x0 + 12, 4, hex('#8a8a80'), WALL);
  sc.rect(x0 - 6, y1 - 2, x1 - x0 + 12, 2, hex('#4a4a44'), WALL);
}

function paintTable(sc) {
  const top = hex('#7e5a3a');
  for (let y = TABLE_TOP; y < TABLE_EDGE; y++) {
    const depth = (y - TABLE_TOP) / (TABLE_EDGE - TABLE_TOP);
    for (let x = 0; x < sc.w; x++) {
      // Veios: listras ao longo do comprimento, com nós
      const grain = fbm(x / 60, y * 0.9, 21);
      let c = mix(top, hex('#5e4028'), smooth(0.45, 0.75, grain) * 0.7);
      c = mul(c, 0.92 + 0.1 * depth + hash(x, y, 2) * 0.05);
      // Juntas das tábuas
      if (y === 213 || y === 226) c = mul(c, 0.55);
      // Marca de copo e arranhões
      const ring = Math.hypot((x - 120) / 1.0, (y - 222) * 2.6);
      if (ring > 10 && ring < 12) c = mul(c, 0.78);
      if (Math.abs(x - 70 - (y - TABLE_TOP) * 3) < 0.6 && y > 206 && y < 230) c = mul(c, 1.25);
      sc.set(x, y, c, TABLE);
    }
  }
  // Borda da frente (pega luz) e frente da mesa
  sc.rect(0, TABLE_EDGE, sc.w, 2, hex('#a07850'), TABLE);
  sc.rect(0, TABLE_EDGE + 2, sc.w, 1, hex('#4a3020'), TABLE);
  for (let y = TABLE_EDGE + 3; y < sc.h; y++) {
    for (let x = 0; x < sc.w; x++) {
      const c = mul(hex('#4a3222'), 0.9 - 0.4 * smooth(TABLE_EDGE, sc.h, y) + hash(x, y, 4) * 0.05);
      sc.set(x, y, c, WALL);
    }
  }
  // Gaveta
  sc.rect(150, 248, 180, 1, hex('#2a1c12'), WALL);
  sc.rect(236, 252, 10, 3, hex('#8a7a5a'), WALL);
}

/** Sombra de contato embaixo de um objeto (escurece a mesa). */
function contactShadow(sc, cx, cy, rx, ry, k = 0.45) {
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++) {
    for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
      if (d <= 1 && sc.kind[y * sc.w + x] === TABLE) sc.tint(x, y, k + (1 - k) * d);
    }
  }
}

// ---- Objetos --------------------------------------------------------------------------

const PHOTO_SHIFT = -40;

function paintPhoto(room) {
  contactShadow(room, 163 + PHOTO_SHIFT, 214, 18, 3);
  const sc = new View(room, 0, 0, 1, PHOTO_SHIFT);
  // Porta-retrato em pé
  sc.rect(149, 171, 30, 44, hex('#4a3020'), OBJECT);
  sc.rect(149, 171, 30, 1, hex('#7a5a3a'), OBJECT);
  sc.rect(178, 171, 1, 44, hex('#8a6a46'), OBJECT, 0.15);
  // Foto: uma menina, desbotada
  sc.shape(152, 174, 175, 211, () => true, (x, y) => mix(hex('#b8a080'), hex('#8a7058'), (y - 174) / 37), OBJECT);
  sc.ellipse(163, 196, 9, 6, hex('#8a3a36'), OBJECT); // vestido
  sc.rect(155, 198, 17, 13, hex('#8a3a36'), OBJECT);
  sc.ellipse(163, 186, 6, 7, hex('#3a2a22'), OBJECT); // cabelo
  sc.ellipse(163, 187, 4, 5, hex('#c09878'), OBJECT); // rosto
  sc.rect(157, 187, 2, 9, hex('#3a2a22'), OBJECT);
  sc.rect(168, 187, 2, 9, hex('#3a2a22'), OBJECT);
  sc.set(161, 186, hex('#2a1a14'), OBJECT);
  sc.set(165, 186, hex('#2a1a14'), OBJECT);
  sc.line(161, 190, 165, 190, hex('#7a4a3a'), OBJECT);
  // Vidro rachado por cima do rosto
  const crack = hex('#e8eaf0');
  sc.line(153, 176, 162, 190, crack, OBJECT);
  sc.line(162, 190, 158, 209, crack, OBJECT);
  sc.line(162, 190, 174, 196, crack, OBJECT);
  sc.line(162, 190, 170, 177, crack, OBJECT);
  sc.set(162, 190, hex('#ffffff'), OBJECT, 0.3);
}

const MACHINE_SHIFT = -42;

function paintAnsweringMachine(room) {
  contactShadow(room, 224 + MACHINE_SHIFT, 227, 30, 3);
  const sc = new View(room, 0, 0, 1, MACHINE_SHIFT);
  // Tampo e frente
  sc.shape(199, 202, 250, 208, (x, y) => x >= 199 + (208 - y) * 0.5, hex('#5a5a62'), OBJECT);
  sc.rect(198, 208, 53, 19, hex('#2e2e34'), OBJECT);
  sc.rect(198, 208, 53, 1, hex('#6a6a74'), OBJECT, 0.1);
  sc.rect(250, 203, 1, 24, hex('#7a7a86'), OBJECT, 0.2);
  // Janela da fita, com os carretéis
  sc.rect(203, 211, 24, 10, hex('#14161c'), OBJECT);
  sc.ellipse(209, 216, 3, 3, hex('#4a4a4e'), OBJECT);
  sc.ellipse(221, 216, 3, 3, hex('#4a4a4e'), OBJECT);
  sc.set(209, 216, hex('#14161c'), OBJECT);
  sc.set(221, 216, hex('#14161c'), OBJECT);
  sc.rect(204, 211, 22, 1, hex('#5a6a7a'), OBJECT, 0.15);
  // Visor: "1"
  sc.rect(230, 210, 10, 10, hex('#1a0a0a'), OBJECT);
  sc.rect(236, 211, 1, 4, hex('#c41a1a'), EMISSIVE);
  sc.rect(236, 216, 1, 3, hex('#c41a1a'), EMISSIVE);
  sc.set(235, 212, hex('#7a1010'), EMISSIVE);
  // Luz de mensagem (pisca na cena)
  sc.rect(243, 212, 3, 2, hex('#3a0a0a'), OBJECT);
  // Botões
  for (let k = 0; k < 5; k++) sc.rect(204 + k * 8, 223, 5, 2, hex('#6a6a70'), OBJECT);
}

const PHONE_SCALE = 1.45;

function paintPhone(room) {
  contactShadow(room, 300, 226, 50 * PHONE_SCALE, 6, 0.35);
  const sc = new View(room, 300, 226, PHONE_SCALE);
  const black = hex('#2a2a32');
  const dark = hex('#16161a');
  const rim = hex('#9aa4c0');
  // Fio do aparelho até a tomada (atrás, pela mesa)
  for (let x = 342; x < 480; x++) {
    const y = 221 - (x - 342) * 0.09 + Math.sin((x - 342) / 18) * 2;
    sc.set(x, y, hex('#141418'), OBJECT);
  }
  // Corpo (trapézio): mais largo embaixo
  sc.shape(256, 194, 344, 225, (x, y) => {
    const t = (y - 196) / 29;
    return y >= 196 && x >= 270 - 13 * t && x <= 330 + 13 * t;
  }, (x, y) => {
    const t = (y - 196) / 29;
    const xl = 270 - 13 * t;
    const xr = 330 + 13 * t;
    const u = (x - xl) / (xr - xl);
    let c = mix(dark, black, smooth(0, 0.6, u));
    if (y === 196) c = hex('#5a5e70');
    if (x >= xr - 1) c = rim;
    return c;
  }, OBJECT, (x, y) => {
    const t = (y - 196) / 29;
    const xr = 330 + 13 * t;
    return x >= xr - 1 ? 0.35 : y === 196 ? 0.12 : 0;
  });
  // Pés
  sc.rect(256, 224, 90, 2, hex('#0e0e10'), OBJECT);
  // Disco (o rosto do telefone), achatado pela perspectiva
  const cx = 300;
  const cy = 211;
  const ell = (x, y, r) => ((x - cx) / r) ** 2 + ((y - cy) / (r * 0.78)) ** 2;
  sc.shape(cx - 15, cy - 13, cx + 15, cy + 13, (x, y) => ell(x, y, 14) <= 1, (x, y) => {
    const d = ell(x, y, 14);
    if (d > 0.82) return x > cx ? hex('#c8ccd4') : hex('#7a7c84'); // aro de metal
    return hex('#d8d2bc'); // placa com os números
  }, OBJECT, (x, y) => (ell(x, y, 14) > 0.82 && x > cx + 4 ? 0.3 : 0));
  // Roda com os furos: dez furos, de 1 a 0
  sc.shape(cx - 12, cy - 10, cx + 12, cy + 10, (x, y) => ell(x, y, 11.5) <= 1 && ell(x, y, 4.5) > 1, (x, y) => {
    for (let k = 0; k < 10; k++) {
      const a = ((60 + k * 30) * Math.PI) / 180;
      const hx = cx + Math.cos(a) * 8;
      const hy = cy + Math.sin(a) * 8 * 0.78;
      if (Math.hypot(x - hx, (y - hy) / 0.85) <= 2.1) return null; // deixa ver a placa
    }
    return mix(hex('#3a3c46'), hex('#5a5e6a'), clamp01((x - cx + 10) / 20));
  }, OBJECT);
  // Números (pontinhos escuros dentro dos furos) e o centro
  for (let k = 0; k < 10; k++) {
    const a = ((60 + k * 30) * Math.PI) / 180;
    sc.set(cx + Math.cos(a) * 8, cy + Math.sin(a) * 8 * 0.78, hex('#3a3428'), OBJECT);
  }
  sc.ellipse(cx, cy, 4, 3, hex('#ece6d4'), OBJECT, 0.05);
  sc.rect(cx - 2, cy, 4, 1, hex('#a03030'), OBJECT);
  // Trava do dedo (metal), às 4 horas
  sc.line(cx + 9, cy + 7, cx + 13, cy + 9, hex('#d8dce4'), OBJECT);
  // Garfos do gancho
  for (const gx of [275, 321]) {
    sc.rect(gx, 188, 6, 9, dark, OBJECT);
    sc.rect(gx + 5, 188, 1, 9, rim, OBJECT, 0.25);
  }
  // Fone deitado no gancho: cabo no meio, conchas nas pontas
  sc.shape(262, 178, 338, 188, () => true, (x, y) => (y <= 179 ? hex('#6a7084') : mix(black, dark, (y - 179) / 9)), OBJECT, (x, y) => (y <= 179 ? 0.12 : 0));
  for (const [ex, flip] of [
    [262, -1],
    [338, 1],
  ]) {
    sc.shape(ex - 13, 174, ex + 13, 197, (x, y) => ((x - ex) / 12) ** 2 + ((y - 186) / 10) ** 2 <= 1, (x, y) => {
      const u = (x - ex) / 12;
      const v = (y - 186) / 10;
      if (v < -0.75) return hex('#7a8096');
      if (u > 0.82) return rim;
      return mix(black, dark, clamp01(0.5 - u * 0.5 + v * 0.4));
    }, OBJECT, (x) => ((x - ex) / 12 > 0.82 ? 0.35 : 0));
    // Abertura da concha (furinhos)
    sc.ellipse(ex, 192, 7, 2, hex('#0a0a0c'), OBJECT);
    for (let k = -2; k <= 2; k++) sc.set(ex + k * 2, 192, hex('#3a3a42'), OBJECT);
    void flip;
  }
  // Fio enrolado: sai da concha da esquerda, desce pelo lado e cai da mesa
  const path = [
    [252, 194],
    [246, 206],
    [242, 218],
    [236, 230],
    [232, 240],
    [230, 252],
    [233, 266],
  ];
  let prev = null;
  for (let s = 0; s < path.length - 1; s++) {
    const [ax, ay] = path[s];
    const [bx, by] = path[s + 1];
    const n = Math.hypot(bx - ax, by - ay);
    for (let t = 0; t < n; t += 2.4) {
      const x = ax + ((bx - ax) * t) / n;
      const y = ay + ((by - ay) * t) / n;
      sc.ellipse(x, y, 3, 1.6, hex('#1c1c22'), OBJECT);
      sc.set(x + 2, y - 1, hex('#5a5e70'), OBJECT, 0.15);
      prev = [x, y];
    }
  }
  void prev;
}

function paintPills(sc) {
  contactShadow(sc, 372, 231, 16, 2);
  // Frasco caído, tampa solta, comprimidos espalhados
  sc.rect(358, 222, 20, 9, hex('#a85a1e'), OBJECT);
  sc.rect(358, 222, 20, 2, hex('#d88a3e'), OBJECT, 0.2);
  sc.rect(364, 224, 9, 6, hex('#e0dcd0'), OBJECT);
  sc.rect(365, 226, 7, 1, hex('#8a8478'), OBJECT);
  sc.rect(378, 223, 2, 7, hex('#7a3a10'), OBJECT);
  sc.ellipse(394, 232, 4, 2, hex('#e8e4dc'), OBJECT); // tampa
  for (const [x, y] of [
    [382, 228],
    [385, 231],
    [389, 227],
    [383, 234],
    [400, 229],
    [376, 234],
  ]) {
    sc.rect(x, y, 2, 1, hex('#f0ece4'), OBJECT, 0.25);
    sc.set(x, y + 1, hex('#8a8680'), OBJECT);
  }
}

function paintBear(sc) {
  contactShadow(sc, 428, 233, 30, 4);
  const fur = hex('#7a5a40');
  const furDark = hex('#4a3424');
  const furLight = hex('#9a7652');
  const furAt = (cx, cy, rx, ry) => (x, y) => {
    const u = (x - cx) / rx;
    const v = (y - cy) / ry;
    // luz da direita/cima, sombra embaixo/esquerda, textura de pelo
    let c = mix(furDark, fur, clamp01(0.55 + u * 0.45 - v * 0.35));
    if (u * 0.8 - v * 0.4 > 0.72) c = furLight;
    return mul(c, 0.9 + noise(x * 0.9, y * 0.9, 31) * 0.2);
  };
  const part = (cx, cy, rx, ry) => sc.ellipse(cx, cy, rx, ry, furAt(cx, cy, rx, ry), OBJECT);
  part(408, 224, 10, 7); // perna esquerda
  part(428, 208, 21, 20); // corpo
  part(404, 202, 7, 12); // braço
  part(452, 204, 7, 12);
  part(448, 226, 10, 7); // perna direita
  sc.ellipse(402, 226, 4, 5, hex('#b8a080'), OBJECT); // sola
  sc.ellipse(454, 227, 4, 5, hex('#b8a080'), OBJECT);
  part(415, 163, 6, 6); // orelha esquerda
  part(428, 178, 16, 15); // cabeça
  // orelha direita rasgada (só metade)
  sc.shape(436, 157, 448, 168, (x, y) => ((x - 442) / 6) ** 2 + ((y - 163) / 6) ** 2 <= 1 && x < 444 - (y - 157) * 0.3, furAt(442, 163, 6, 6), OBJECT);
  sc.line(441, 158, 446, 166, hex('#d8d0b8'), OBJECT); // enchimento aparecendo
  sc.ellipse(415, 164, 3, 3, hex('#5a3a2a'), OBJECT);
  // Focinho e nariz
  sc.ellipse(428, 185, 7, 5, hex('#b09070'), OBJECT);
  sc.rect(426, 182, 4, 2, hex('#1a1210'), OBJECT);
  sc.line(428, 184, 428, 187, hex('#1a1210'), OBJECT);
  sc.line(425, 188, 431, 188, hex('#2a1a14'), OBJECT);
  // Olho de botão (esquerdo) e linha solta no lugar do direito
  sc.ellipse(421, 175, 2, 2, hex('#0e0a08'), OBJECT);
  sc.set(422, 174, hex('#d8dce8'), OBJECT, 0.4);
  sc.line(433, 173, 437, 177, hex('#c8c0a8'), OBJECT);
  sc.line(437, 173, 433, 177, hex('#c8c0a8'), OBJECT);
  sc.line(435, 177, 436, 182, hex('#c8c0a8'), OBJECT);
  // Costura vermelha descendo pela barriga
  sc.ellipse(428, 212, 11, 12, hex('#9a7a5a'), OBJECT);
  for (let y = 199; y < 224; y += 3) {
    sc.line(425, y, 431, y + 1, hex('#b3161d'), OBJECT);
  }
  sc.line(428, 198, 428, 225, hex('#4a2a1e'), OBJECT);
}

/** Sombra de menina no corredor (só aparece nos relâmpagos). */
function paintFigure(c, ox, oy) {
  // 26×72: silhueta quase preta, cabelo comprido, vestido, braços soltos
  const fill = '#060608';
  const inEllipse = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
  for (let y = 0; y < 72; y++) {
    for (let x = 0; x < 26; x++) {
      const head = inEllipse(x, y, 13, 10, 6, 7);
      const hair = y > 8 && y < 26 && x >= 6 && x <= 20 && Math.abs(x - 13) < 6 + (y - 8) * 0.08;
      const neck = y >= 16 && y < 20 && x >= 11 && x <= 15;
      const t = (y - 20) / 34;
      const dress = y >= 20 && y < 54 && Math.abs(x - 13) <= 6 + t * 5;
      const armL = y >= 21 && y < 46 && x >= 4 && x <= 6 - (y > 40 ? 1 : 0) && x >= 4 + Math.floor((y - 21) / 14);
      const armR = y >= 21 && y < 46 && x <= 22 && x >= 20 - Math.floor((y - 21) / 14);
      const legs = y >= 54 && ((x >= 9 && x <= 11) || (x >= 15 && x <= 17));
      if (head || hair || neck || dress || armL || armR || legs) c.px(ox + x, oy + y, fill);
    }
  }
  // Olhos: dois pontinhos claros, quase invisíveis
  c.px(ox + 11, oy + 10, '#8a8a90');
  c.px(ox + 15, oy + 10, '#8a8a90');
}

/** Céu de noite visto pela janela, com prédios e a luz da rua. */
function paintSky(c, ox, oy) {
  const w = GLASS.x1 - GLASS.x0;
  const h = GLASS.y1 - GLASS.y0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let col = mix(hex('#0a0e18'), hex('#1e2230'), y / h);
      const cloud = smooth(0.5, 0.75, fbm(x / 30, y / 10, 41));
      col = mix(col, hex('#2a3040'), cloud * 0.6 * (1 - y / h));
      // Prédios
      const roof = 70 + Math.floor(noise(Math.floor(x / 14), 0, 51) * 22);
      if (y > roof) {
        col = hex('#0c0d12');
        if ((x % 6 === 2 || x % 6 === 3) && y % 7 === 2 && hash(Math.floor(x / 6), Math.floor(y / 7), 61) > 0.86) col = hex('#8a6a30');
      }
      // Luz alaranjada do poste, embaixo à direita
      const glow = clamp01(1 - Math.hypot((x - 78) / 40, (y - 110) / 30));
      col = col.map((v, k) => v + [120, 70, 25][k] * glow ** 2);
      const d = (BAYER[y & 3][x & 3] / 16 - 0.5) * 6;
      const q = col.map((v) => Math.max(0, Math.min(255, Math.round((v + d) / 6) * 6)));
      c.px(ox + x, oy + y, `#${q.map((v) => v.toString(16).padStart(2, '0')).join('')}`);
    }
  }
}

/** Raios de luz no ar, saindo das frestas da persiana (camada somada na cena). */
function paintRays(c, ox, oy) {
  for (let y = 0; y < TITLE_H; y++) {
    for (let x = 0; x < GLASS.x0; x++) {
      const t = GLASS.x0 - x;
      if (t > 260) continue;
      const u = y - GLASS.y0 - t * 0.5;
      if (!slatOpen(u)) continue;
      const a = Math.round(48 * (1 - t / 260) ** 1.6 * (0.7 + 0.3 * Math.sin(u * 0.4)));
      if (a < 3) continue;
      c.px(ox + x, oy + y, `#9aaacc${a.toString(16).padStart(2, '0')}`);
    }
  }
}

function paintRoom() {
  const sc = new Scene(TITLE_W, TITLE_H);
  paintWall(sc);
  paintDoor(sc);
  paintClock(sc);
  paintWindow(sc);
  paintTable(sc);
  paintPhoto(sc);
  paintAnsweringMachine(sc);
  paintPhone(sc);
  paintPills(sc);
  paintBear(sc);
  return render(sc);
}

// ---- Atlas ----------------------------------------------------------------------------

export const TITLE_SPOTS = {
  sky: [GLASS.x0, GLASS.y0],
  glass: { x: GLASS.x0, y: GLASS.y0, w: GLASS.x1 - GLASS.x0, h: GLASS.y1 - GLASS.y0 },
  figure: [211, 128],
  led: [243 + MACHINE_SHIFT, 212],
};

export function drawTitle() {
  const room = paintRoom();
  const skyW = GLASS.x1 - GLASS.x0;
  const skyH = GLASS.y1 - GLASS.y0;
  const W = 512;
  const H = TITLE_H * 2 + 4 + skyH + 2;
  const c = new PixelCanvas(W, H);
  const frames = {};
  // Quarto
  for (let y = 0; y < TITLE_H; y++) {
    for (let x = 0; x < TITLE_W; x++) {
      const i = (y * TITLE_W + x) * 4;
      const j = (y * W + x) * 4;
      for (let k = 0; k < 4; k++) c.data[j + k] = room.data[i + k];
    }
  }
  frames.room = { frame: { x: 0, y: 0, w: TITLE_W, h: TITLE_H } };
  // Raios de luz
  paintRays(c, 0, TITLE_H + 2);
  frames.rays = { frame: { x: 0, y: TITLE_H + 2, w: GLASS.x0, h: TITLE_H } };
  // Céu e silhueta
  const y2 = TITLE_H * 2 + 4;
  paintSky(c, 0, y2);
  frames.sky = { frame: { x: 0, y: y2, w: skyW, h: skyH } };
  paintFigure(c, skyW + 2, y2);
  frames.figure = { frame: { x: skyW + 2, y: y2, w: 26, h: 72 } };
  return { canvas: c, json: { frames, meta: { image: 'title.png', size: { w: W, h: H }, scale: '1' } } };
}
