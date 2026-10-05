// Jumpscares (GDD 13.5 e 13.6): 128×128 por quadro, 4 quadros por monstro, bem maiores e
// mais detalhados que os sprites do jogo — sombreado com pontilhado (dithering), luz da
// lanterna vindo de baixo e da frente, textura, e a cabeça tombando nos últimos quadros.
// Ordem das linhas: invasor, distorcido, helena, clara.

import { PixelCanvas, seeded } from './canvas.mjs';

export const JUMPSCARE_SIZE = 128;
export const JUMPSCARE_FRAMES = 4;
export const JUMPSCARE_ORDER = ['invasor', 'distorcido', 'helena', 'clara'];

const S = JUMPSCARE_SIZE;
const BG = '#050506';
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
// Luz da lanterna: de baixo e da frente, um pouco da direita
const LIGHT = (() => {
  const v = [0.25, 0.45, 0.86];
  const n = Math.hypot(...v);
  return v.map((k) => k / n);
})();

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/** Cor da rampa para o tom t (0–1), com pontilhado ordenado entre os degraus. */
function tone(ramp, t, x, y) {
  const k = clamp(t, 0, 1) * (ramp.length - 1) + (BAYER[y & 3][x & 3] + 0.5) / 16 - 0.5;
  return ramp[clamp(Math.round(k), 0, ramp.length - 1)];
}

/** Iluminação de uma superfície arredondada (elipsoide) no ponto (dx, dy) normalizado. */
function lit(dx, dy, ambient = 0.15, diffuse = 0.85) {
  const z = Math.sqrt(Math.max(0, 1 - dx * dx - dy * dy));
  const d = Math.max(0, dx * LIGHT[0] + dy * LIGHT[1] + z * LIGHT[2]);
  return ambient + diffuse * d;
}

/** Quadro de 128×128: desenha numa tela própria (para poder tombar a cabeça depois). */
class Frame {
  constructor(seed) {
    this.c = new PixelCanvas(S, S);
    this.rand = seeded(seed);
    this.c.rect(0, 0, S, S, BG);
  }
  px(x, y, color) {
    this.c.px(Math.round(x), Math.round(y), color);
  }
  /** Elipse sombreada como uma superfície curva. shade(dx, dy, t, x, y) → cor (opcional). */
  blob(cx, cy, rx, ry, ramp, { ambient = 0.15, diffuse = 0.85, shade, bias = 0 } = {}) {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) {
      for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        if (dx * dx + dy * dy > 1) continue;
        const t = lit(dx, dy, ambient, diffuse) + bias;
        this.px(x, y, shade ? shade(dx, dy, t, x, y) : tone(ramp, t, x, y));
      }
    }
  }
  fill(cx, cy, rx, ry, color) {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) {
      for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.px(x, y, color);
      }
    }
  }
  line(x0, y0, x1, y1, color, w = 1) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
    for (let i = 0; i <= n; i++) {
      const x = Math.round(x0 + ((x1 - x0) * i) / n);
      const y = Math.round(y0 + ((y1 - y0) * i) / n);
      this.c.rect(x - Math.floor((w - 1) / 2), y - Math.floor((w - 1) / 2), w, w, color);
    }
  }
  /** Rachadura que anda em zigue-zague, com borda clara de um lado. */
  crack(x, y, steps, dir, color, edge) {
    let [cx, cy] = [x, y];
    for (let i = 0; i < steps; i++) {
      this.px(cx, cy, color);
      if (edge) this.px(cx + 1, cy, edge);
      cx += dir[0] + (this.rand() < 0.4 ? (this.rand() < 0.5 ? -1 : 1) : 0);
      cy += dir[1] + (this.rand() < 0.25 ? 1 : 0);
      if (this.rand() < 0.08 && steps - i > 4) this.crack(cx, cy, Math.floor((steps - i) / 2), [-dir[0] || 1, dir[1]], color, edge);
    }
  }
  /** Granulado de filme por cima de tudo (escurece pixels soltos). */
  grain(amount = 0.06) {
    const d = this.c.data;
    for (let i = 0; i < d.length; i += 4) {
      if (this.rand() > amount) continue;
      const k = 0.55 + this.rand() * 0.3;
      d[i] *= k;
      d[i + 1] *= k;
      d[i + 2] *= k;
    }
  }
  /** Vinheta: escurece os cantos. */
  vignette(strength = 0.7) {
    const d = this.c.data;
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const r = Math.hypot((x - S / 2) / (S / 2), (y - S / 2) / (S / 2));
        const k = 1 - strength * clamp((r - 0.7) / 0.6, 0, 1);
        const i = (y * S + x) * 4;
        d[i] *= k;
        d[i + 1] *= k;
        d[i + 2] *= k;
      }
    }
  }
  /** Copia para o atlas tombando a cabeça (cisalhamento) e deslocando (tremor). */
  blit(atlas, ox, oy, { tilt = 0, dx = 0, dy = 0 } = {}) {
    for (let y = 0; y < S; y++) {
      const shift = Math.round((y - S / 2) * tilt) + dx;
      for (let x = 0; x < S; x++) {
        const sx = clamp(x - shift, 0, S - 1);
        const sy = clamp(y - dy, 0, S - 1);
        const si = (sy * S + sx) * 4;
        const di = ((oy + y) * atlas.width + ox + x) * 4;
        for (let k = 0; k < 4; k++) atlas.data[di + k] = this.c.data[si + k];
      }
    }
  }
}

/** Chuva caindo no fundo (riscos diagonais). */
function rain(f, n, color) {
  for (let i = 0; i < n; i++) {
    const x = Math.floor(f.rand() * (S + 20)) - 10;
    const y = Math.floor(f.rand() * S);
    const len = 4 + Math.floor(f.rand() * 6);
    f.line(x, y, x - Math.floor(len / 3), y + len, color);
  }
}

// ---- Invasor: o escuro do capuz racha num sorriso enorme, dentes demais ---------------

const INV = {
  coat: ['#050608', '#0a0c10', '#11151b', '#1a2028', '#252d38', '#34404e', '#4a5868'],
  wet: '#7286a0',
  gum: ['#2a080e', '#4e1220', '#74202e', '#963444', '#b45460'],
  tooth: ['#3e3420', '#6a5c38', '#968660', '#c0b488', '#e0d8b4', '#f2ecd4'],
  mouth: ['#000000', '#100204', '#22060a'],
};

/** Boca do sorriso: em cima e embaixo, para a coluna x (u de −1 a 1 entre os cantos). */
function grinShape(x, cx, half, top, open) {
  const u = (x - cx) / half;
  if (Math.abs(u) > 1) return null;
  const up = top - 16 * u * u; // os cantos sobem até perto das orelhas
  const h = open * Math.pow(1 - u * u, 0.6);
  return [up, up + h];
}

function invader(frame, seed) {
  const f = new Frame(seed);
  rain(f, 70, '#0e1218');
  // Ombros da capa
  f.blob(64, 150, 92, 52, INV.coat, { ambient: 0.1, diffuse: 0.7 });
  // Capuz
  f.blob(64, 66, 54, 66, INV.coat, { ambient: 0.12, diffuse: 0.9 });
  // Dobras do capuz (sulcos escuros curvos)
  for (const [x0, bend] of [[22, -6], [32, -3], [96, 3], [106, 6]]) {
    for (let y = 18; y < 120; y++) {
      const x = x0 + Math.round(bend * Math.sin((y / 120) * Math.PI));
      f.px(x, y, INV.coat[1]);
      if (y % 3) f.px(x + Math.sign(bend), y, INV.coat[2]);
    }
  }
  // Borda grossa do capuz em volta do rosto
  f.blob(64, 74, 36, 44, INV.coat, { ambient: 0.25, diffuse: 0.8, bias: 0.1 });
  // Rosto: escuro total
  f.fill(64, 76, 29, 37, '#000000');
  // Pingos brilhando na capa e escorrendo da borda do capuz
  for (let i = 0; i < 46; i++) {
    const x = 14 + Math.floor(f.rand() * 100);
    const y = 6 + Math.floor(f.rand() * 118);
    const inFace = ((x - 64) / 31) ** 2 + ((y - 76) / 39) ** 2 < 1;
    if (inFace) continue;
    f.px(x, y, INV.wet);
    f.px(x, y + 1, INV.coat[4]);
    if (f.rand() < 0.3) f.line(x, y + 2, x, y + 4 + Math.floor(f.rand() * 5), INV.coat[3]);
  }
  for (const x of [38, 47, 57, 70, 81, 90]) {
    const y0 = 76 + Math.round(37 * Math.sqrt(Math.max(0, 1 - ((x - 64) / 29) ** 2)));
    f.line(x, y0, x, y0 + 3 + ((x * 7) % 9), INV.coat[4]);
    f.px(x, y0 + 4 + ((x * 7) % 9), INV.wet);
  }

  // Olhinhos de luz no fundo do escuro, desde o primeiro quadro (é um rosto que avança,
  // não uma boca surgindo do nada); crescem e brilham mais
  const glint = frame >= 2 ? ['#f0e8d8', '#a8a090'] : ['#a8a090', '#5a564e'];
  for (const [ex, ey] of [[50, 66], [77, 64]]) {
    f.px(ex, ey, glint[0]);
    f.px(ex + 1, ey, glint[1]);
    if (frame >= 2) {
      f.px(ex, ey + 1, glint[1]);
      f.px(ex - 1, ey, '#3a3630');
    }
  }

  // O sorriso já está lá (dentes cerrados, no escuro) e vai rasgando a cada quadro
  {
    const half = [24, 29, 34, 38][frame];
    const open = [7, 13, 19, 24][frame];
    const top = [84, 86, 87, 88][frame];
    const dim = frame === 0 ? 0.22 : 0;
    const cols = [];
    for (let x = 64 - half; x <= 64 + half; x++) {
      const s = grinShape(x, 64, half, top, open);
      if (!s) continue;
      const [a, b] = s.map(Math.round);
      cols.push([x, a, b]);
      // fundo da boca: preto avermelhado
      for (let y = a; y <= b; y++) f.px(x, y, tone(INV.mouth, (y - a) / Math.max(1, b - a), x, y));
      // gengiva exposta em cima e embaixo (rasgando o escuro)
      for (let k = 1; k <= 4; k++) f.px(x, a - k, tone(INV.gum, 0.9 - k * 0.18 - dim, x, a - k));
      for (let k = 1; k <= 4; k++) f.px(x, b + k, tone(INV.gum, 0.85 - k * 0.18 - dim, x, b + k));
    }
    // Dentes demais e desalinhados, duas fileiras (a de trás mais escura)
    for (const row of [1, 0]) {
      let x = 64 - half + 1 + row;
      while (x < 64 + half - 1) {
        const w = 2 + Math.floor(f.rand() * 3);
        const col = cols.find((c) => c[0] === x);
        if (!col) break;
        const [, a, b] = col;
        const gap = b - a;
        const hTop = Math.min(gap * 0.55, 3 + Math.floor(f.rand() * (gap * 0.45)));
        const hBot = Math.min(gap * 0.5, 3 + Math.floor(f.rand() * (gap * 0.4)));
        const lean = f.rand() < 0.3 ? (f.rand() < 0.5 ? -1 : 1) : 0;
        const dark = (row ? 0.35 : 0) + dim;
        for (let i = 0; i < w; i++) {
          for (let y = 0; y < hTop; y++) {
            const t = 0.95 - (y / hTop) * 0.25 - (i === w - 1 ? 0.3 : 0) - dark - (f.rand() < 0.15 ? 0.25 : 0);
            f.px(x + i + Math.round((lean * y) / hTop), a + y, tone(INV.tooth, t, x + i, a + y));
          }
          for (let y = 0; y < hBot; y++) {
            const t = 0.85 - (y / hBot) * 0.2 - (i === w - 1 ? 0.3 : 0) - dark;
            f.px(x + i - Math.round((lean * y) / hBot), b - y, tone(INV.tooth, t, x + i, b - y));
          }
        }
        x += w + (f.rand() < 0.3 ? 1 : 0);
      }
    }
    // Fios de baba entre os dentes
    for (let i = 0; i < [0, 2, 3, 6][frame]; i++) {
      const col = cols[Math.floor(cols.length * (0.25 + f.rand() * 0.5))];
      const [x, a, b] = col;
      for (let y = a + 4; y < b - 3; y++) if ((y + x) % 3) f.px(x, y, '#6a6458');
    }
  }
  f.vignette(0.8);
  f.grain(0.05);
  return f;
}

// ---- Artur distorcido: rosto do Artur em carvão; os pontos arrebentam, a boca rasga ---

const DIS = {
  skin: ['#030202', '#080606', '#0f0c0a', '#18130f', '#221b16', '#2e251e', '#3e322a'],
  crack: '#2e2620',
  crackDark: '#000000',
  eye: ['#5a5448', '#8e887a', '#c4beae', '#e6e0d0', '#f6f2e6'],
  vein: '#6a1a1a',
  thread: ['#4a4030', '#7a6c52', '#a8987a', '#cfc2a2'],
  blood: ['#2a0606', '#4e0c0c', '#741616'],
};

function distorted(frame, seed) {
  const f = new Frame(seed);
  // Pescoço e ombros curvados
  f.blob(64, 148, 70, 44, DIS.skin, { ambient: 0.05, diffuse: 0.6 });
  f.blob(64, 112, 22, 26, DIS.skin, { ambient: 0.05, diffuse: 0.7 });
  // Cabeça comprida, o queixo estreito (o rosto magro do Artur)
  const head = (x, y) => {
    const dy = (y - 60) / 54;
    const narrow = y > 64 ? 1 - ((y - 64) / 50) ** 2 * 0.45 : 1;
    const rx = 40 * narrow;
    const dx = (x - 64) / rx;
    return dx * dx + dy * dy <= 1 ? [dx, dy] : null;
  };
  for (let y = 4; y < 116; y++) {
    for (let x = 18; x < 110; x++) {
      const p = head(x, y);
      if (!p) continue;
      let t = lit(p[0], p[1], 0.08, 0.85);
      // maçãs do rosto fundas e bochechas encovadas
      const cheek = Math.min(Math.hypot((x - 40) / 9, (y - 80) / 14), Math.hypot((x - 88) / 9, (y - 80) / 14));
      if (cheek < 1) t -= 0.25 * (1 - cheek);
      // sobrancelha saltada: sombra embaixo dela
      if (y > 46 && y < 52 && Math.abs(x - 64) < 34) t -= 0.18;
      f.px(x, y, tone(DIS.skin, t, x, y));
    }
  }
  // Cabelo curto e ralo do Artur, queimado, em tufos no alto da cabeça
  for (let y = 6; y < 30; y++) {
    for (let x = 26; x < 102; x++) {
      const p = head(x, y);
      if (!p || (x * 7 + y * 3) % 11 < 2) continue;
      if (y > 18 + Math.round(Math.sin(x * 0.4) * 4)) continue;
      f.px(x, y, tone(['#000000', '#060504', '#0d0b09', '#16120f'], 0.2 + lit(p[0], p[1], 0, 0.6), x, y));
    }
  }
  // Barba por fazer: pontinhos no queixo e no rosto de baixo
  for (let i = 0; i < 260; i++) {
    const x = 34 + Math.floor(f.rand() * 60);
    const y = 82 + Math.floor(f.rand() * 30);
    if (head(x, y)) f.px(x, y, DIS.skin[1]);
  }
  // Rachaduras de carvão por toda a pele
  for (let i = 0; i < 11; i++) {
    const x = 30 + Math.floor(f.rand() * 68);
    const y = 10 + Math.floor(f.rand() * 92);
    if (!head(x, y)) continue;
    f.crack(x, y, 8 + Math.floor(f.rand() * 14), [f.rand() < 0.5 ? 1 : -1, 1], DIS.crackDark, DIS.crack);
  }
  // Órbitas fundas e os olhos brancos, sem íris (maiores quando a boca rasga)
  const eyeR = frame >= 3 ? [10, 7] : [8, 5];
  for (const ex of [45, 83]) {
    f.fill(ex, 58, 13, 9, '#000000');
    f.blob(ex, 58, eyeR[0], eyeR[1], DIS.eye, { ambient: 0.35, diffuse: 0.7 });
    // veias vermelhas
    for (let k = 0; k < 3; k++) {
      const a = f.rand() * Math.PI * 2;
      f.line(ex + Math.round(Math.cos(a) * eyeR[0]), 58 + Math.round(Math.sin(a) * eyeR[1]), ex + Math.round(Math.cos(a) * (eyeR[0] - 3)), 58 + Math.round(Math.sin(a) * (eyeR[1] - 2)), DIS.vein);
    }
    // olheiras fundas embaixo
    for (let x = ex - 10; x <= ex + 10; x++) f.px(x, 68 + Math.round(((x - ex) / 10) ** 2 * -2), DIS.skin[1]);
  }
  // Nariz: dorso iluminado e narinas
  for (let y = 60; y < 84; y++) f.px(66, y, tone(DIS.skin, 0.75, 66, y));
  f.fill(59, 84, 2, 1, '#000000');
  f.fill(70, 84, 2, 1, '#000000');

  // Boca costurada
  const my = 97;
  const stitches = [44, 50, 56, 62, 68, 74, 80];
  const popped = frame === 0 ? [] : frame === 1 ? [56, 74] : frame === 2 ? [44, 56, 62, 74, 80] : stitches;
  if (frame <= 1) {
    f.line(42, my, 86, my, '#000000', 2);
    for (let x = 42; x <= 86; x++) f.px(x, my + 2, DIS.skin[4]); // lábio de baixo
  } else if (frame === 2) {
    // a boca começa a rasgar: uma fresta preta e vermelha
    for (let x = 42; x <= 86; x++) {
      const u = (x - 64) / 22;
      const h = Math.round(5 * (1 - u * u));
      for (let y = my - h; y <= my + h; y++) f.px(x, y, y === my - h || y === my + h ? DIS.blood[2] : '#000000');
    }
  } else {
    // rasgada num grito: a mandíbula desce, lábios rasgados, sangue
    const cx = 64;
    const cy = 106;
    for (let y = cy - 20; y <= cy + 24; y++) {
      for (let x = cx - 26; x <= cx + 26; x++) {
        const dx = (x - cx) / 26;
        const dy = (y - cy) / (y < cy ? 20 : 24);
        const r = dx * dx + dy * dy;
        if (r > 1) continue;
        f.px(x, y, r > 0.82 ? tone(DIS.blood, 1 - r, x, y) : r > 0.6 ? '#120202' : '#000000');
      }
    }
    // rasgos nos cantos
    f.line(42, 104, 34, 98, DIS.blood[1], 2);
    f.line(86, 104, 95, 97, DIS.blood[1], 2);
    // escorrendo
    for (const x of [52, 61, 75]) f.line(x, 124, x + (x % 2), 128, DIS.blood[1]);
  }
  // pontos de linha grossa: inteiros (X) ou arrebentados (pontas soltas)
  for (const x of stitches) {
    if (frame === 3) {
      f.line(x, my - 16 - (x % 3), x + 2, my - 11, DIS.thread[2], 1); // restos pendurados
      f.line(x - 1, my + 20, x, my + 25 + (x % 4), DIS.thread[1], 1);
      continue;
    }
    if (popped.includes(x)) {
      f.line(x, my - 4, x - 2, my - 9, DIS.thread[3], 2);
      f.line(x + 2, my + 4, x + 4, my + 8, DIS.thread[2], 2);
      f.px(x + 1, my - 1, DIS.blood[2]);
      f.px(x + 1, my + 3, DIS.blood[1]);
    } else {
      f.line(x - 2, my - 5, x + 3, my + 5, DIS.thread[2], 2);
      f.line(x + 3, my - 5, x - 2, my + 5, DIS.thread[3], 2);
      f.px(x - 2, my - 5, DIS.blood[1]); // furo na pele
      f.px(x + 3, my + 5, DIS.blood[1]);
    }
  }
  f.vignette(0.8);
  f.grain(0.05);
  return f;
}

// ---- Helena: o cabelo se abre — pele cinza, olhos sem íris, lágrimas pretas e secas ----

const HEL = {
  hair: ['#030304', '#08080b', '#0f0f13', '#17171d', '#212129', '#2e2e38', '#3e3e4a'],
  sheen: '#545462',
  skin: ['#1e2022', '#34373a', '#4a4e52', '#62666a', '#7a7e82', '#909496', '#a4a8aa'],
  eye: ['#7a7e7c', '#b4b8b4', '#dcdeda', '#f0f2ee'],
  tear: '#070606',
  tearEdge: '#24201e',
};

function helena(frame, seed) {
  const f = new Frame(seed);
  const open = [16, 28, 33, 37][frame]; // abertura do cabelo (já aparece no 1º quadro)
  const cx = 64;
  const cy = 60;
  const jaw = [1, 1, 1.2, 1.45][frame]; // maxilar deslocando: a metade de baixo estica
  // Rosto (desenhado antes; o cabelo cobre o resto)
  {
    for (let y = 0; y < 128; y++) {
      for (let x = 22; x < 106; x++) {
        const dx = (x - cx) / 34;
        const dy = y < cy ? (y - cy) / 54 : (y - cy) / (50 * jaw);
        if (dx * dx + dy * dy > 1) continue;
        let t = lit(dx, dy, 0.12, 0.85);
        const socket = Math.min(Math.hypot((x - 50) / 11, (y - 54) / 8), Math.hypot((x - 78) / 11, (y - 54) / 8));
        if (socket < 1) t -= 0.45 * (1 - socket);
        if (Math.abs(x - 66) < 2 && y > 56 && y < 78) t += 0.15; // dorso do nariz
        f.px(x, y, tone(HEL.skin, t, x, y));
      }
    }
    f.fill(61, 79, 2, 1, HEL.skin[0]);
    f.fill(70, 79, 2, 1, HEL.skin[0]);
    // olhos sem íris, leitosos
    const eyes = [50, 78];
    for (const ex of eyes) {
      f.blob(ex, 54, 7, 4, HEL.eye, { ambient: 0.45, diffuse: 0.6 });
      f.px(ex - 2, 52, '#ffffff');
    }
    // lágrimas pretas e secas: uma faixa grossa de cada olho até o queixo
    for (const tx of eyes) {
      const end = cy + Math.round(48 * jaw);
      for (let y = 58; y < end; y++) {
        const x = tx + Math.round(Math.sin(y * 0.18 + tx) * 1.2);
        const w = 3 + (y % 9 < 2 ? 1 : 0);
        f.c.rect(x - 1, y, w, 1, HEL.tear);
        f.px(x - 2, y, HEL.tearEdge);
        f.px(x + w - 1, y, HEL.tearEdge);
        if (y % 13 === 0) f.fill(x, y + 1, 2, 2, HEL.tear); // gota seca
      }
    }
    if (frame === 2) {
      // lábios cinzentos entreabertos
      for (let x = 54; x <= 74; x++) {
        const y = 90 + Math.round(((x - 64) / 10) ** 2);
        f.px(x, y, '#000000');
        f.px(x, y + 1, HEL.skin[1]);
      }
    } else if (frame === 3) {
      // maxilar deslocado além do normal: boca escancarada, pele esticada
      for (let y = 80; y < 128; y++) {
        for (let x = 44; x < 85; x++) {
          const dx = (x - 64) / 14;
          const dy = (y - 106) / 26;
          const r = dx * dx + dy * dy;
          if (r <= 1) f.px(x, y, r > 0.8 ? '#1a1214' : '#000000');
        }
      }
      for (const sg of [-1, 1]) for (let k = 0; k < 4; k++) f.line(64 + sg * 15, 92 + k * 7, 64 + sg * 22, 88 + k * 8, HEL.skin[1]);
    }
  }
  // Cabelo preto, longo e encharcado, em mechas grudadas, caindo dos dois lados
  let x = 0;
  while (x < S) {
    const w = 2 + Math.floor(f.rand() * 5);
    const base = 0.3 + f.rand() * 0.35;
    for (let i = 0; i < w && x < S; i++, x++) {
      const dist = Math.abs(x - cx);
      for (let y = 0; y < S; y++) {
        // a abertura começa estreita no alto da cabeça e abre no meio do rosto
        const edge = open * Math.min(1, y / 40) + Math.sin(y * 0.11 + x) * 1.5;
        if (dist < edge) continue;
        const nearEdge = dist < edge + 5;
        const t = base + (i === 0 ? -0.15 : 0) - y / 200 + (nearEdge ? 0.12 : 0);
        f.px(x, y, tone(HEL.hair, t, x, y));
      }
      if (f.rand() < 0.12) {
        const y0 = 10 + Math.floor(f.rand() * 70);
        f.line(x, y0, x, y0 + 8 + Math.floor(f.rand() * 30), HEL.sheen); // brilho molhado
      }
    }
  }
  // gotas pingando
  for (let i = 0; i < 12; i++) {
    const gx = Math.floor(f.rand() * S);
    const gy = 90 + Math.floor(f.rand() * 36);
    f.px(gx, gy, '#5a6068');
    f.px(gx, gy + 1, '#3a4048');
  }
  f.vignette(0.8);
  f.grain(0.05);
  return f;
}

// ---- Clara: de costas; a cabeça gira; a porcelana racha; a boca abre demais ------------

const CLA = {
  porcelain: ['#6e685e', '#948e82', '#b6b0a4', '#d2ccc0', '#e8e2d6', '#f6f1e8'],
  crack: '#3a342c',
  crackEdge: '#fbf8f0',
  hair: ['#070503', '#0e0906', '#170f09', '#21160d', '#2c1e12', '#3a2818'],
  dress: ['#5e524c', '#7e706a', '#a09088', '#bcaca4', '#d4c6be', '#e6dad2'],
  lace: ['#a8a29a', '#d8d2ca', '#f2ede6'],
  stain: '#5a2626',
  hat: ['#4a0a0c', '#7a1014', '#b3161d', '#d8323a'],
  hatStripe: ['#8a7428', '#b89a34', '#e0c34a'],
  blush: '#d4a8a0',
};

function clara(frame, seed) {
  const f = new Frame(seed);
  const cx = 64;
  const cy = 56;
  // Vestido de festa de costas: mangas bufantes, corpo, manchas
  f.blob(cx, 146, 44, 34, CLA.dress, { ambient: 0.15, diffuse: 0.75 });
  for (const sx of [22, 106]) {
    f.blob(sx, 126, 20, 17, CLA.dress, { ambient: 0.15, diffuse: 0.8 });
    for (let k = -12; k <= 12; k += 6) f.line(sx + k, 112, Math.round(sx + k * 1.3), 140, CLA.dress[1]);
  }
  f.fill(84, 128, 5, 3, CLA.stain);
  f.fill(46, 134, 3, 2, CLA.stain);
  f.fill(98, 120, 2, 2, CLA.stain);
  // pescoço: nos quadros 2 e 3, torcido (a cabeça girou para trás)
  f.blob(cx, 102, 10, 12, CLA.porcelain, { ambient: 0.1, diffuse: 0.6 });
  if (frame >= 2) for (let k = 0; k < 4; k++) f.line(cx - 9, 96 + k * 4, cx + 9, 100 + k * 4, CLA.porcelain[0]);
  // gola de renda
  for (let x = cx - 26; x <= cx + 26; x++) {
    const y = 110 + Math.round(((x - cx) / 26) ** 2 * 4);
    const sc = Math.round(Math.abs(Math.sin(x * 0.6)) * 3);
    for (let k = 0; k < 4 + sc; k++) f.px(x, y + k, tone(CLA.lace, 0.9 - k * 0.12, x, y + k));
  }
  // cabelo de trás, comprido, caindo pelos ombros
  for (let x = cx - 40; x <= cx + 40; x++) {
    const len = 104 + Math.round(Math.sin(x * 0.5) * 4 + (x % 3) * 2);
    for (let y = cy - 4; y < len; y++) {
      const t = 0.25 + (1 - Math.abs((x - cx) / 40)) * 0.3 + Math.sin(x * 1.1) * 0.08 - (y - cy) / 260;
      f.px(x, y, tone(CLA.hair, t, x, y));
    }
  }
  f.blob(cx, cy, 36, 40, CLA.hair, { ambient: 0.12, diffuse: 0.8 });

  if (frame === 0) {
    // de costas: só a nuca e o cabelo, em mechas
    for (let i = 0; i < 120; i++) {
      const x = cx - 34 + Math.floor(f.rand() * 68);
      const y = cy - 30 + Math.floor(f.rand() * 70);
      f.line(x, y, x + (f.rand() < 0.5 ? -1 : 1), y + 6, CLA.hair[5]);
    }
  } else {
    // a cabeça gira para trás: de lado no quadro 1, de frente nos quadros 2 e 3
    const turn = frame === 1 ? 0.6 : 0;
    const fcx = Math.round(cx + turn * 16);
    const frx = Math.round(30 * (1 - turn * 0.3));
    f.blob(fcx, cy + 6, frx, 35, CLA.porcelain, { ambient: 0.25, diffuse: 0.8 });
    // bochechas pintadas
    for (const bx of turn ? [fcx + 10] : [fcx - 15, fcx + 15]) {
      for (let y = 72; y < 80; y++) for (let x = bx - 5; x < bx + 5; x++) if ((x + y) % 2 === 0) f.px(x, y, CLA.blush);
    }
    // olhos totalmente pretos, de boneca; sobrancelhas pintadas finas
    const eyes = turn ? [fcx + 8] : [fcx - 12, fcx + 12];
    const er = frame === 3 ? [8, 10] : [7, 8];
    for (const ex of eyes) {
      f.fill(ex, 58, er[0], er[1], '#000000');
      f.px(ex - 3, 54, '#5a5a64');
      f.px(ex - 2, 54, '#33333a');
      f.line(ex - 6, 46, ex + 5, 45, CLA.hair[3]);
      if (frame >= 2) f.line(ex, 66, ex - 1 + (ex % 2), 76 + frame * 3, '#000000', 2); // escorrendo preto
    }
    f.px(fcx + 1, 70, CLA.porcelain[2]);
    // franja em pontas, irregular
    for (let x = cx - 33; x <= cx + 33; x++) {
      const len = 14 + Math.abs(((x * 7) % 11) - 5) * 2 + (f.rand() < 0.2 ? 3 : 0);
      for (let y = cy - 38; y < cy - 38 + len; y++) if (((x - cx) / 36) ** 2 + ((y - cy) / 40) ** 2 <= 1) f.px(x, y, tone(CLA.hair, 0.35 + ((x * 5) % 7) * 0.06 - (y - cy + 38) / 80, x, y));
    }
    // mechas da lateral caindo por cima das bordas do rosto
    for (const sx of [fcx - frx - 1, fcx + frx - 4]) {
      for (let x = sx; x < sx + 6; x++) {
        for (let y = cy - 20; y < cy + 44 - ((x * 3) % 7); y++) f.px(x, y, tone(CLA.hair, 0.3 + ((x - sx) % 3) * 0.1, x, y));
      }
    }
    // rachaduras na porcelana (mais a cada quadro)
    const cracks = [0, 4, 9, 16][frame];
    for (let i = 0; i < cracks; i++) {
      const x = Math.round(fcx - frx * 0.7 + f.rand() * frx * 1.4);
      const y = 36 + Math.floor(f.rand() * 48);
      f.crack(x, y, 10 + Math.floor(f.rand() * 14), [f.rand() < 0.5 ? 1 : -1, 1], CLA.crack, CLA.crackEdge);
    }
    if (frame === 1) {
      f.line(fcx + 4, 86, fcx + 12, 85, CLA.crack);
    } else if (frame === 2) {
      // sorriso fino e torto, subindo demais de um lado
      for (let x = fcx - 12; x <= fcx + 15; x++) {
        const y = 87 - Math.round(((x - fcx) / 13) ** 2 * 4) - (x > fcx ? Math.round((x - fcx) / 4) : 0);
        f.px(x, y, '#000000');
        f.px(x, y + 1, CLA.porcelain[1]);
      }
    } else {
      // boca aberta larga demais: a porcelana quebra em volta, pedaços faltando
      for (let y = 76; y < 118; y++) {
        for (let x = fcx - 26; x <= fcx + 26; x++) {
          const dx = (x - fcx) / 23;
          const dy = (y - 95) / 17;
          const jag = Math.sin(x * 1.7) * 0.12 + Math.sin(y * 2.3) * 0.1;
          const r = dx * dx + dy * dy + jag;
          if (r > 1) continue;
          f.px(x, y, r > 0.85 ? CLA.crack : '#000000');
        }
      }
      for (const [x, y] of [[fcx - 22, 82], [fcx + 20, 100], [fcx - 8, 114], [fcx + 25, 86]]) {
        f.c.rect(x, y, 3, 2, CLA.porcelain[4]);
        f.px(x, y + 2, CLA.porcelain[2]);
      }
    }
  }
  // Chapéu de aniversário torto (listrado, com pompom)
  const tip = frame === 3 ? [104, 2] : [96, 0];
  for (let y = tip[1]; y <= 26; y++) {
    const t = (y - tip[1]) / (26 - tip[1]);
    const xl = Math.round(tip[0] + (66 - tip[0]) * t);
    const xr = Math.round(tip[0] + (98 - tip[0]) * t);
    for (let xx = xl; xx <= xr; xx++) {
      const stripe = Math.floor((y + (xx - xl) * 0.4) / 5) % 2 === 0;
      const lt = 0.3 + ((xx - xl) / Math.max(1, xr - xl)) * 0.6;
      f.px(xx, y, tone(stripe ? CLA.hat : CLA.hatStripe, lt, xx, y));
    }
  }
  f.blob(tip[0], tip[1] + 2, 3, 3, ['#8a8478', '#d8d2c6', '#f4efe6'], { ambient: 0.4 });
  if (frame >= 2) f.line(70, 26, 40, 96, '#b8b0a0'); // elástico passando pelo rosto
  f.vignette(0.8);
  f.grain(0.04);
  return f;
}

const DRAW = { invasor: invader, distorcido: distorted, helena, clara };
// Tremor e cabeça tombando por quadro (o último quadro tomba mais)
const MOTION = [
  { tilt: 0, dx: 0, dy: 0 },
  { tilt: 0.03, dx: -2, dy: 1 },
  { tilt: -0.05, dx: 3, dy: 0 },
  { tilt: 0.12, dx: -3, dy: 2 },
];

export function drawJumpscares() {
  const atlas = new PixelCanvas(S * JUMPSCARE_FRAMES, S * JUMPSCARE_ORDER.length);
  JUMPSCARE_ORDER.forEach((name, row) => {
    for (let n = 0; n < JUMPSCARE_FRAMES; n++) {
      const frame = DRAW[name](n, row * 10 + n + 1);
      frame.blit(atlas, n * S, row * S, MOTION[n]);
    }
  });
  return atlas;
}
