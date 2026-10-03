// Jumpscares (GDD 13.5 e 13.6): 64×64 por quadro, 3 quadros por monstro, desenhados
// maiores e mais detalhados que os sprites do jogo. Versão provisória (a arte final é da
// etapa 12). Ordem das linhas: invasor, distorcido, helena, clara.

import { PixelCanvas, seeded } from './canvas.mjs';

export const JUMPSCARE_SIZE = 64;
export const JUMPSCARE_ORDER = ['invasor', 'distorcido', 'helena', 'clara'];

function ellipse(c, cx, cy, rx, ry, color) {
  for (let y = -ry; y <= ry; y++) {
    for (let x = -rx; x <= rx; x++) {
      if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) c.px(cx + x, cy + y, color);
    }
  }
}

function line(c, x0, y0, x1, y1, color, w = 1) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
  for (let i = 0; i <= n; i++) {
    const x = Math.round(x0 + ((x1 - x0) * i) / n);
    const y = Math.round(y0 + ((y1 - y0) * i) / n);
    c.rect(x, y, w, w, color);
  }
}

// ---- Invasor: o escuro do capuz racha num sorriso enorme, dentes demais -------------

function invader(c, ox, oy, frame, rand) {
  const coat = '#14171c';
  const wet = '#2c3440';
  c.rect(ox, oy, 64, 64, '#050506');
  ellipse(c, ox + 32, oy + 30, 27, 32, coat); // capuz
  for (let i = 0; i < 14; i++) c.px(ox + 8 + Math.floor(rand() * 48), oy + 4 + Math.floor(rand() * 50), wet);
  ellipse(c, ox + 32, oy + 34, 19, 22, '#000000'); // rosto: escuro total
  if (frame >= 1) {
    // Rachadura vermelha atravessando o escuro
    line(c, ox + 14, oy + 32, ox + 24, oy + 38, '#5a1a22');
    line(c, ox + 24, oy + 38, ox + 40, oy + 38, '#5a1a22');
    line(c, ox + 40, oy + 38, ox + 50, oy + 31, '#5a1a22');
  }
  if (frame === 2) {
    // Sorriso enorme: cantos quase nas orelhas, gengiva exposta, dentes tortos
    for (let x = 12; x <= 52; x++) {
      const t = (x - 32) / 20;
      const top = Math.round(36 - 9 * t * t);
      const bottom = Math.round(42 + 6 * (1 - t * t)) ;
      c.rect(ox + x, oy + top - 2, 1, 2, '#8a2a3a'); // gengiva de cima
      c.rect(ox + x, oy + top, 1, Math.max(1, bottom - top), '#0a0000');
      c.rect(ox + x, oy + bottom, 1, 2, '#8a2a3a'); // gengiva de baixo
    }
    // Dentes demais e desalinhados
    for (let x = 13; x <= 50; x += 2 + Math.floor(rand() * 2)) {
      const t = (x - 32) / 20;
      const top = Math.round(36 - 9 * t * t);
      const bottom = Math.round(42 + 6 * (1 - t * t));
      const h1 = 2 + Math.floor(rand() * 3);
      const h2 = 2 + Math.floor(rand() * 3);
      c.rect(ox + x, oy + top, 2, h1, rand() < 0.3 ? '#c8b880' : '#e8e0c0');
      c.rect(ox + x + (rand() < 0.5 ? 1 : 0), oy + bottom - h2, 2, h2, rand() < 0.3 ? '#c8b880' : '#e0d8b8');
    }
  }
}

// ---- Artur distorcido: os pontos da costura arrebentam, a boca rasga num grito -------

function distorted(c, ox, oy, frame, rand) {
  const skin = '#1c1816';
  const crack = '#34302c';
  c.rect(ox, oy, 64, 64, '#050506');
  ellipse(c, ox + 32, oy + 32, 24, 30, skin);
  for (let i = 0; i < 10; i++) {
    const x = 12 + Math.floor(rand() * 40);
    const y = 6 + Math.floor(rand() * 50);
    line(c, ox + x, oy + y, ox + x + Math.floor(rand() * 6) - 3, oy + y + 4, crack);
  }
  // Olhos brancos, sem íris
  ellipse(c, ox + 22, oy + 24, 5, 3, '#e8e4d8');
  ellipse(c, ox + 42, oy + 24, 5, 3, '#e8e4d8');
  // Boca costurada com linha grossa
  const thread = '#c8bca0';
  if (frame < 2) {
    line(c, ox + 18, oy + 44, ox + 46, oy + 44, frame === 1 ? '#3a0a0a' : '#0a0606', frame === 1 ? 2 : 1);
    for (let x = 20; x <= 44; x += 4) {
      const popped = frame === 1 && x % 8 === 0; // alguns pontos arrebentados
      if (popped) {
        c.px(ox + x, oy + 40, thread);
        c.px(ox + x + 1, oy + 48, thread);
      } else {
        line(c, ox + x, oy + 41, ox + x + 2, oy + 47, thread);
        line(c, ox + x + 2, oy + 41, ox + x, oy + 47, thread);
      }
    }
  } else {
    // Boca aberta, rasgando num grito
    ellipse(c, ox + 32, oy + 46, 13, 10, '#000000');
    for (let x = 20; x <= 44; x += 3) {
      c.px(ox + x, oy + 37 + Math.floor(rand() * 2), '#7a1a1a');
      c.px(ox + x, oy + 55 - Math.floor(rand() * 2), '#7a1a1a');
      c.px(ox + x, oy + 36, thread); // restos da linha
    }
  }
}

// ---- Helena: o cabelo se abre — pele cinza, olhos sem íris, lágrimas pretas ---------

function helena(c, ox, oy, frame, rand) {
  const hair = '#0a090b';
  const strand = '#1c1a20';
  const skin = '#8a8e90';
  c.rect(ox, oy, 64, 64, '#050506');
  if (frame >= 1) {
    // Rosto aparecendo entre o cabelo
    const w = frame === 1 ? 8 : 22;
    ellipse(c, ox + 32, oy + 34, w, 26, skin);
    // Olhos sem íris
    ellipse(c, ox + 32 - (frame === 1 ? 2 : 9), oy + 26, 3, 2, '#f0f0e8');
    if (frame === 2) {
      ellipse(c, ox + 41, oy + 26, 3, 2, '#f0f0e8');
      // Lágrimas pretas e secas do olho ao queixo
      line(c, ox + 23, oy + 29, ox + 22, oy + 52, '#141010', 2);
      line(c, ox + 41, oy + 29, ox + 42, oy + 52, '#141010', 2);
      // Maxilar deslocado além do normal
      ellipse(c, ox + 32, oy + 48, 7, 12, '#000000');
    } else {
      line(c, ox + 30, oy + 29, ox + 30, oy + 48, '#141010', 2);
    }
  }
  // Cabelo molhado caindo pelos lados (ou cobrindo tudo no quadro 0)
  for (let x = 0; x < 64; x++) {
    const dist = Math.abs(x - 32);
    const open = frame === 0 ? -1 : frame === 1 ? 6 : 20;
    if (dist <= open) continue;
    const len = 50 + Math.floor(rand() * 14);
    c.rect(ox + x, oy, 1, len, rand() < 0.15 ? strand : hair);
  }
}

// ---- Clara: de costas; a cabeça gira; a porcelana racha; a boca abre demais ---------

function clara(c, ox, oy, frame, rand) {
  const porcelain = '#e8e2d8';
  const crack = '#7a7468';
  c.rect(ox, oy, 64, 64, '#050506');
  if (frame === 0) {
    // De costas: cabelo castanho, chapéu de aniversário torto, ombros do vestido
    ellipse(c, ox + 32, oy + 30, 18, 20, '#3a2a1e');
    for (let i = 0; i < 20; i++) c.px(ox + 16 + Math.floor(rand() * 32), oy + 14 + Math.floor(rand() * 30), '#4a3828');
    for (let y = 0; y < 16; y++) c.rect(ox + 36 + Math.floor(y / 3), oy + 2 + y, 10 - Math.floor(y / 2), 1, '#b3161d');
    c.rect(ox + 14, oy + 50, 36, 14, '#c8b8b0');
    return;
  }
  // Rosto de boneca de porcelana, virado num ângulo impossível
  ellipse(c, ox + 32, oy + 32, 20, 24, porcelain);
  ellipse(c, ox + 24, oy + 27, 4, 5, '#000000'); // olhos totalmente pretos
  ellipse(c, ox + 40, oy + 27, 4, 5, '#000000');
  // Rachaduras (mais no quadro 2)
  const cracks = frame === 1 ? 4 : 9;
  for (let i = 0; i < cracks; i++) {
    let x = 16 + Math.floor(rand() * 32);
    let y = 10 + Math.floor(rand() * 40);
    for (let k = 0; k < 6; k++) {
      c.px(ox + x, oy + y, crack);
      x += Math.floor(rand() * 3) - 1;
      y += 1;
    }
  }
  if (frame === 1) {
    line(c, ox + 26, oy + 44, ox + 38, oy + 44, '#5a3030');
  } else {
    // Boca aberta larga demais
    ellipse(c, ox + 32, oy + 46, 12, 9, '#000000');
    ellipse(c, ox + 32, oy + 43, 9, 3, '#3a0a0a');
  }
  // Chapéu torto
  for (let y = 0; y < 10; y++) c.rect(ox + 40 + y, oy + 2 + y, 6, 1, '#b3161d');
}

const DRAW = { invasor: invader, distorcido: distorted, helena, clara };

export function drawJumpscares() {
  const S = JUMPSCARE_SIZE;
  const c = new PixelCanvas(S * 3, S * JUMPSCARE_ORDER.length);
  JUMPSCARE_ORDER.forEach((name, row) => {
    for (let f = 0; f < 3; f++) DRAW[name](c, f * S, row * S, f, seeded(row * 10 + f + 1));
  });
  return c;
}
