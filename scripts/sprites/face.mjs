// Rosto do Artur no HUD (GDD 11), 24×24 por quadro, 6 estados de medo:
// 0 cansado · 1 tenso · 2 suando · 3 olhos arregalados · 4 pânico · 5 distorcido

import { PixelCanvas } from './canvas.mjs';

const C = {
  bg: '#0b0b0e',
  hair: '#2a2420',
  hairLight: '#3a322b',
  skin: '#c4a089',
  skinShade: '#a07c66',
  skinDark: '#86644f',
  bags: '#7a5a52',
  stubble: '#8a735f',
  white: '#d8d4c8',
  pupil: '#141012',
  mouth: '#4a3028',
  mouthIn: '#1e1010',
  brow: '#2a2420',
  sweat: '#9fc4d8',
  shirt: '#b3b6bd',
  collar: '#cfd1d6',
  outline: '#08080a',
};

export const FACE_SIZE = 24;
export const FACE_FRAMES = 6;

function base(c, ox, skin = C.skin, shade = C.skinShade) {
  // Pescoço e gola
  c.rect(ox + 9, 19, 6, 3, shade);
  c.rect(ox + 5, 21, 14, 3, C.shirt);
  c.rect(ox + 9, 21, 2, 2, C.collar);
  c.rect(ox + 13, 21, 2, 2, C.collar);
  // Cabeça
  c.rect(ox + 6, 6, 12, 13, skin);
  c.rect(ox + 7, 19, 10, 1, skin);
  c.rect(ox + 5, 10, 1, 4, shade); // orelhas
  c.rect(ox + 18, 10, 1, 4, shade);
  c.rect(ox + 6, 15, 12, 4, C.stubble); // barba por fazer
  c.rect(ox + 7, 19, 10, 1, C.stubble);
  c.px(ox + 6, 18, skin);
  c.px(ox + 17, 18, skin);
  // Cabelo
  c.rect(ox + 7, 2, 10, 2, C.hair);
  c.rect(ox + 6, 3, 12, 4, C.hair);
  c.rect(ox + 5, 5, 2, 4, C.hair);
  c.rect(ox + 17, 5, 2, 4, C.hair);
  c.px(ox + 9, 3, C.hairLight);
  c.px(ox + 13, 4, C.hairLight);
  c.rect(ox + 11, 12, 2, 2, shade); // nariz
}

function eyes(c, ox, { open, pupilDx = 0, small = false, bags = true }) {
  for (const ex of [7, 13]) {
    if (open === 0) {
      c.rect(ox + ex, 10, 4, 1, C.skinDark); // pálpebra caída
      c.rect(ox + ex, 11, 4, 1, C.white);
      c.px(ox + ex + 1 + pupilDx, 11, C.pupil);
      c.px(ox + ex + 2 + pupilDx, 11, C.pupil);
    } else {
      c.rect(ox + ex, 10, 4, open, C.white);
      const py = 10 + Math.floor((open - 1) / 2);
      if (small) c.px(ox + ex + 1 + pupilDx + 1, py, C.pupil);
      else c.rect(ox + ex + 1 + pupilDx, py, 2, Math.min(2, open), C.pupil);
    }
    if (bags) c.rect(ox + ex, 10 + Math.max(open, 1) + 1, 4, 1, C.bags);
  }
}

function brows(c, ox, style) {
  if (style === 'flat') {
    c.rect(ox + 7, 8, 4, 1, C.brow);
    c.rect(ox + 13, 8, 4, 1, C.brow);
  } else if (style === 'tense') {
    c.rect(ox + 7, 8, 3, 1, C.brow);
    c.px(ox + 10, 9, C.brow);
    c.rect(ox + 14, 8, 3, 1, C.brow);
    c.px(ox + 13, 9, C.brow);
  } else if (style === 'up') {
    c.rect(ox + 8, 7, 3, 1, C.brow);
    c.px(ox + 7, 8, C.brow);
    c.rect(ox + 13, 7, 3, 1, C.brow);
    c.px(ox + 16, 8, C.brow);
  }
}

export function drawFaces() {
  const S = FACE_SIZE;
  const c = new PixelCanvas(S * FACE_FRAMES, S);

  // 0 — cansado, olheiras, olhar vazio
  base(c, 0);
  eyes(c, 0, { open: 0 });
  brows(c, 0, 'flat');
  c.rect(10, 16, 4, 1, C.mouth);

  // 1 — sobrancelhas tensas, olhando de lado
  base(c, S);
  eyes(c, S, { open: 2, pupilDx: 1 });
  brows(c, S, 'tense');
  // Boca fechada, com o canto caído (nada de sorriso)
  c.rect(S + 10, 16, 4, 1, C.mouth);
  c.px(S + 14, 17, C.mouth);
  c.px(S + 9, 17, C.mouth);

  // 2 — suando, olhos mais abertos, boca entreaberta
  base(c, S * 2);
  eyes(c, S * 2, { open: 3 });
  brows(c, S * 2, 'tense');
  c.rect(S * 2 + 10, 16, 4, 2, C.mouth);
  c.rect(S * 2 + 11, 17, 2, 1, C.mouthIn);
  c.px(S * 2 + 6, 8, C.sweat);
  c.px(S * 2 + 6, 9, C.sweat);
  c.px(S * 2 + 17, 12, C.sweat);
  c.px(S * 2 + 17, 13, C.sweat);

  // 3 — olhos arregalados, pupilas pequenas
  base(c, S * 3);
  eyes(c, S * 3, { open: 3, small: true });
  brows(c, S * 3, 'up');
  c.rect(S * 3 + 9, 16, 6, 1, C.mouth);
  c.px(S * 3 + 6, 8, C.sweat);
  c.px(S * 3 + 17, 11, C.sweat);
  c.px(S * 3 + 17, 12, C.sweat);

  // 4 — pânico, boca aberta
  base(c, S * 4);
  eyes(c, S * 4, { open: 3, small: true });
  brows(c, S * 4, 'up');
  c.rect(S * 4 + 9, 15, 6, 4, C.mouth);
  c.rect(S * 4 + 10, 16, 4, 3, C.mouthIn);
  c.px(S * 4 + 6, 8, C.sweat);
  c.px(S * 4 + 6, 9, C.sweat);
  c.px(S * 4 + 17, 11, C.sweat);
  c.px(S * 4 + 17, 12, C.sweat);
  c.px(S * 4 + 7, 14, C.sweat);

  // 5 — distorcido: quase o Artur distorcido (pele de carvão, olhos pálidos, boca costurada)
  const ox = S * 5;
  base(c, ox, '#4a403c', '#332b28');
  c.rect(ox + 6, 15, 12, 4, '#2e2624');
  c.rect(ox + 7, 19, 10, 1, '#2e2624');
  c.rect(ox + 7, 10, 4, 3, '#0a0808');
  c.rect(ox + 13, 10, 4, 3, '#0a0808');
  c.px(ox + 9, 11, '#e8e4d8');
  c.px(ox + 14, 11, '#e8e4d8');
  c.rect(ox + 8, 16, 8, 1, '#120c0c'); // boca
  for (let x = 8; x <= 15; x += 2) {
    c.px(ox + x, 15, '#b8ae96'); // costura
    c.px(ox + x, 17, '#b8ae96');
  }
  c.px(ox + 10, 7, '#1a1412'); // rachaduras
  c.px(ox + 11, 8, '#1a1412');
  c.px(ox + 15, 14, '#1a1412');
  c.px(ox + 16, 15, '#1a1412');

  for (let f = 0; f < FACE_FRAMES; f++) c.outline(f * S, 0, S, S, C.outline);
  return c;
}
