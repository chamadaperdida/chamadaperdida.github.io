// Reportagem do final (GDD 13.7): tela cheia de uma TV de tubo com o plantão de Vale Sereno.
// Arte em 480×270 (ampliada 2× no jogo, como a tela inicial):
//   studio            fundo do estúdio (parede, painel de vídeo, bancada)
//   reporter-0/1/2    jornalista atrás da bancada: boca fechada, boca aberta, piscando
//   desk              frente da bancada (fica na frente da jornalista)
//   house-photo       foto antiga e borrada da casa da Rua das Acácias (aparece no painel)
// Linhas de varredura, chiado e a faixa "PLANTÃO — VALE SERENO" são desenhados pelo jogo.

import { PixelCanvas, seeded } from './canvas.mjs';

export const ENDING_W = 480;
export const ENDING_H = 270;
export const DESK_Y = 176; // topo da bancada
export const PANEL = { x: 262, y: 30, w: 176, h: 124 }; // painel de vídeo atrás da jornalista
export const REPORTER = { x: 118, y: 62, w: 100, h: 120 };
export const PHOTO = { w: 120, h: 86 };

const hexToRgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const rgbToHex = ([r, g, b]) =>
  `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;
const mix = (a, b, t) => rgbToHex(hexToRgb(a).map((v, i) => v + (hexToRgb(b)[i] - v) * t));

function ellipse(c, cx, cy, rx, ry, color) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx;
      const dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) c.px(x, y, color);
    }
  }
}

// ---- Estúdio ---------------------------------------------------------------------------

function paintStudio(c, ox, oy) {
  const rnd = seeded(71);
  // Parede: azul escuro, mais claro no meio (luz de estúdio barata)
  for (let y = 0; y < DESK_Y; y++) {
    for (let x = 0; x < ENDING_W; x++) {
      const d = Math.hypot((x - 200) / 260, (y - 90) / 150);
      let col = mix('#25324a', '#0b101c', Math.min(1, d));
      // Painéis verticais na parede
      if (x % 60 === 0) col = mix(col, '#05080e', 0.6);
      if (x % 60 === 1) col = mix(col, '#3a4a66', 0.25);
      if (rnd() < 0.04) col = mix(col, '#000000', 0.12);
      c.px(ox + x, oy + y, col);
    }
  }
  // Faixa de luz no alto da parede
  for (let x = 0; x < ENDING_W; x++) c.px(ox + x, oy + 14, mix('#3a4a66', '#141c2c', Math.abs(x - 220) / 260));
  // Logotipo do canal (à esquerda): "VS" em blocos
  const logo = [
    '#...#.####',
    '#...#.#...',
    '.#.#..####',
    '.#.#.....#',
    '..#...####',
  ];
  logo.forEach((row, j) =>
    [...row].forEach((v, i) => v === '#' && c.rect(ox + 30 + i * 3, oy + 40 + j * 3, 3, 3, '#6a7a98')),
  );
  c.rect(ox + 28, oy + 58, 34, 2, '#b3161d');
  // Painel de vídeo atrás da jornalista (moldura e tela apagada azulada)
  const { x, y, w, h } = PANEL;
  c.rect(ox + x - 3, oy + y - 3, w + 6, h + 6, '#05070c');
  c.rect(ox + x - 2, oy + y - 2, w + 4, h + 4, '#2a3242');
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      let col = mix('#1a2a44', '#0a1222', j / h);
      if (j % 3 === 0) col = mix(col, '#000000', 0.25);
      c.px(ox + x + i, oy + y + j, col);
    }
  }
  // Bancada: tampo (a frente fica em 'desk')
  for (let yy = DESK_Y; yy < ENDING_H; yy++) {
    for (let xx = 0; xx < ENDING_W; xx++) c.px(ox + xx, oy + yy, '#10141c');
  }
}

function paintDesk(c, ox, oy) {
  const h = ENDING_H - DESK_Y;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < ENDING_W; x++) {
      let col = y < 4 ? mix('#6a7488', '#3a4252', y / 4) : mix('#262c3a', '#0c0f16', (y - 4) / (h - 4));
      if (y === 4) col = '#0a0c12';
      // Brilho do tampo vindo da esquerda
      if (y < 4) col = mix(col, '#1e2430', Math.abs(x - 170) / 400);
      c.px(ox + x, oy + y, col);
    }
  }
  // Frente da bancada: faixa com a cor do canal
  c.rect(ox, oy + 14, ENDING_W, 2, '#5a0c10');
}

// ---- Jornalista ------------------------------------------------------------------------

const SKIN = '#d2a084';
const SKIN_SHADE = '#b5826a';
const HAIR = '#2a1c18';
const HAIR_LIGHT = '#43302a';
const BLAZER = '#3a2a3a';
const BLAZER_SHADE = '#281c2a';

/** Jornalista (100×120). mouth: 0 fechada, 1 aberta · blink: olhos fechados. */
function paintReporter(c, ox, oy, mouth, blink) {
  const cx = ox + 50;
  // Ombros e blazer (trapézio)
  for (let y = 64; y < 120; y++) {
    // Ombros arredondados: sobe rápido perto do pescoço e abre devagar embaixo
    const half = Math.min(26 + (y - 70) * 0.5, 9 + (y - 64) * 4);
    for (let x = Math.round(50 - half); x <= Math.round(50 + half); x++) {
      const shade = x > 50 + half * 0.55;
      c.px(ox + x, oy + y, shade ? BLAZER_SHADE : BLAZER);
    }
  }
  // Camisa clara em V e lapelas
  for (let y = 66; y < 96; y++) {
    const half = Math.max(0, 9 - (y - 66) * 0.35);
    for (let x = Math.round(50 - half); x <= Math.round(50 + half); x++) c.px(ox + x, oy + y, '#d8d4cc');
    c.px(ox + Math.round(50 - half) - 1, oy + y, '#4e3a4e');
    c.px(ox + Math.round(50 + half) + 1, oy + y, '#4e3a4e');
  }
  // Microfone de lapela
  c.rect(ox + 38, oy + 84, 2, 2, '#101010');
  // Pescoço
  c.rect(ox + 45, oy + 56, 10, 12, SKIN);
  c.rect(ox + 51, oy + 56, 4, 12, SKIN_SHADE);
  c.rect(ox + 45, oy + 56, 10, 3, SKIN_SHADE);
  // Cabelo atrás (chanel até o queixo)
  ellipse(c, cx, oy + 40, 17, 19, HAIR);
  c.rect(ox + 33, oy + 40, 6, 20, HAIR);
  c.rect(ox + 61, oy + 40, 6, 20, HAIR);
  // Rosto
  ellipse(c, cx, oy + 43, 12.5, 15.5, SKIN);
  for (let y = 32; y < 58; y++) c.px(ox + 61, oy + y, SKIN_SHADE);
  // Franja
  for (let x = 37; x <= 63; x++) {
    const h = 31 + Math.round(Math.sin((x - 37) / 4) * 1.5) + (x < 44 ? 2 : 0);
    for (let y = 22; y < h; y++) c.px(ox + x, oy + y, HAIR);
  }
  c.rect(ox + 40, oy + 25, 12, 1, HAIR_LIGHT);
  // Mechas dos lados do rosto
  c.rect(ox + 36, oy + 32, 3, 26, HAIR);
  c.rect(ox + 62, oy + 32, 3, 26, HAIR);
  c.rect(ox + 37, oy + 34, 1, 18, HAIR_LIGHT);
  // Sobrancelhas
  c.rect(ox + 42, oy + 37, 5, 1, '#2a1c18');
  c.rect(ox + 53, oy + 37, 5, 1, '#2a1c18');
  // Olhos
  if (blink) {
    c.rect(ox + 43, oy + 41, 4, 1, '#7a5040');
    c.rect(ox + 54, oy + 41, 4, 1, '#7a5040');
  } else {
    for (const ex of [43, 54]) {
      c.rect(ox + ex, oy + 40, 4, 2, '#e8e0d8');
      c.rect(ox + ex + 1, oy + 40, 2, 2, '#2a1a14');
      c.px(ox + ex, oy + 39, '#3a2620');
      c.rect(ox + ex, oy + 39, 4, 1, '#3a2620');
    }
  }
  // Nariz
  c.px(ox + 51, oy + 44, SKIN_SHADE);
  c.px(ox + 51, oy + 45, SKIN_SHADE);
  c.rect(ox + 49, oy + 47, 3, 1, SKIN_SHADE);
  // Boca
  if (mouth) {
    c.rect(ox + 47, oy + 51, 7, 3, '#3a1414');
    c.rect(ox + 47, oy + 50, 7, 1, '#9a4a48');
    c.rect(ox + 48, oy + 54, 5, 1, '#9a4a48');
  } else {
    c.rect(ox + 47, oy + 52, 7, 1, '#9a4a48');
    c.rect(ox + 48, oy + 53, 5, 1, '#b8706a');
  }
  // Brincos discretos
  c.px(ox + 37, oy + 50, '#d8c070');
  c.px(ox + 63, oy + 50, '#d8c070');
}

// ---- Foto da casa ----------------------------------------------------------------------

/** Foto antiga da casa (frente), borrada e amarelada, com borda branca gasta. */
function paintHousePhoto(c, ox, oy) {
  const { w, h } = PHOTO;
  const pic = new PixelCanvas(w, h);
  const rnd = seeded(5);
  // Céu de fim de tarde
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) pic.px(x, y, mix('#8aa0b0', '#c8c0a0', y / 50));
  // Gramado
  pic.rect(0, 62, w, h - 62, '#4a6a3a');
  // Árvore à esquerda
  ellipse(pic, 18, 34, 15, 18, '#2e4a2a');
  ellipse(pic, 24, 26, 10, 10, '#3a5a32');
  pic.rect(16, 46, 4, 18, '#3a2a1e');
  // Casa: corpo, telhado, porta, janelas
  pic.rect(40, 36, 64, 30, '#d8ccb0');
  pic.rect(40, 62, 64, 4, '#a89878');
  for (let y = 0; y < 18; y++) {
    const half = 38 - y * 2;
    pic.rect(72 - half, 36 - y, half * 2, 1, y < 2 ? '#5a2a20' : '#7a3a2a');
  }
  pic.rect(66, 46, 10, 18, '#5a3a2a');
  pic.px(74, 55, '#d8c070');
  pic.rect(46, 44, 12, 10, '#3a4a5a');
  pic.rect(86, 44, 12, 10, '#3a4a5a');
  pic.rect(51, 44, 2, 10, '#e8e0d0');
  pic.rect(91, 44, 2, 10, '#e8e0d0');
  // Cerca baixa
  for (let x = 2; x < w; x += 5) pic.rect(x, 64, 2, 6, '#e0d8c8');
  pic.rect(0, 66, w, 1, '#e0d8c8');
  // Desfoque (caixa 3×3, duas passadas)
  const blur = (src) => {
    const out = new PixelCanvas(w, h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const acc = [0, 0, 0];
        let n = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const xx = Math.min(w - 1, Math.max(0, x + dx));
            const yy = Math.min(h - 1, Math.max(0, y + dy));
            const i = (yy * w + xx) * 4;
            acc[0] += src.data[i];
            acc[1] += src.data[i + 1];
            acc[2] += src.data[i + 2];
            n++;
          }
        }
        out.px(x, y, rgbToHex(acc.map((v) => v / n)));
      }
    }
    return out;
  };
  const soft = blur(blur(pic));
  // Amarelado, manchas e cantos escuros (foto velha)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const [r, g, b] = [soft.data[i], soft.data[i + 1], soft.data[i + 2]];
      const lum = 0.3 * r + 0.59 * g + 0.11 * b;
      let col = rgbToHex([lum * 1.08 + 18, lum * 0.98 + 10, lum * 0.78]);
      const edge = Math.hypot((x - w / 2) / (w / 2), (y - h / 2) / (h / 2));
      col = mix(col, '#2a2014', Math.max(0, edge - 0.7) * 1.4);
      if (rnd() < 0.03) col = mix(col, '#f0e8d0', 0.25);
      c.px(ox + x, oy + y, col);
    }
  }
  // Borda branca gasta
  for (let x = -4; x < w + 4; x++) {
    for (const y of [-4, -3, -2, -1, h, h + 1, h + 2, h + 3]) c.px(ox + x, oy + y, rnd() < 0.1 ? '#c8c0b0' : '#e8e2d4');
  }
  for (let y = 0; y < h; y++) {
    for (const x of [-4, -3, -2, -1, w, w + 1, w + 2, w + 3]) c.px(ox + x, oy + y, rnd() < 0.1 ? '#c8c0b0' : '#e8e2d4');
  }
}

// ---- Atlas -----------------------------------------------------------------------------

export function drawEnding() {
  const W = 512;
  const deskH = ENDING_H - DESK_Y;
  const rowY = ENDING_H + deskH + 2;
  const H = rowY + Math.max(REPORTER.h, PHOTO.h + 8) + 2;
  const c = new PixelCanvas(W, H);
  const frames = {};
  paintStudio(c, 0, 0);
  frames.studio = { frame: { x: 0, y: 0, w: ENDING_W, h: ENDING_H } };
  paintDesk(c, 0, ENDING_H);
  frames.desk = { frame: { x: 0, y: ENDING_H, w: ENDING_W, h: deskH } };
  [
    [0, false],
    [1, false],
    [0, true],
  ].forEach(([mouth, blink], k) => {
    const x = k * (REPORTER.w + 2);
    paintReporter(c, x, rowY, mouth, blink);
    frames[`reporter-${k}`] = { frame: { x, y: rowY, w: REPORTER.w, h: REPORTER.h } };
  });
  const px = 3 * (REPORTER.w + 2) + 4;
  paintHousePhoto(c, px, rowY + 4);
  frames['house-photo'] = { frame: { x: px - 4, y: rowY, w: PHOTO.w + 8, h: PHOTO.h + 8 } };
  return { canvas: c, json: { frames, meta: { image: 'ending.png', size: { w: W, h: H }, scale: '1' } } };
}
