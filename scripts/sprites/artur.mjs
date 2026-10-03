// Artur (GDD 13.2): 41 anos, magro, ombros caídos, barba por fazer, olheiras fundas,
// camisa social amarrotada e calça escura. Passos arrastados; correndo, corpo inclinado.
//
// Spritesheet 16×32 por quadro. Linhas: baixo, cima, esquerda, direita.
// Colunas: 0 parado · 1–4 andando · 5–8 correndo.

import { PixelCanvas } from './canvas.mjs';

const C = {
  hair: '#2a2420',
  hairLight: '#3a322b',
  skin: '#c4a089',
  skinShade: '#a07c66',
  bags: '#7f6159', // olheiras
  stubble: '#86705f',
  mouth: '#5e463b',
  eye: '#141012',
  shirt: '#b3b6bd',
  shirtShade: '#8a8d95',
  shirtWrinkle: '#9da0a8',
  collar: '#cfd1d6',
  belt: '#17171a',
  pants: '#2b2e36',
  pantsShade: '#1d1f25',
  shoe: '#121214',
  outline: '#08080a',
};

export const ARTUR_FRAME = { width: 16, height: 32 };
export const ARTUR_COLUMNS = 9;
export const ARTUR_ROWS = ['down', 'up', 'left', 'right'];

// Ciclo de passos: [fase das pernas, balanço dos braços, desce o corpo]
const WALK = [
  [1, 1, 0],
  [0, 0, 1],
  [-1, -1, 0],
  [0, 0, 1],
];

function drawFrontBack(c, ox, oy, { back, leg, arm, bob, lean }) {
  const b = bob + lean; // correndo: corpo um pouco mais baixo (inclinado)

  // Pernas e sapatos (presos ao chão)
  const legTop = 23 + b;
  const leftLift = leg > 0 ? 1 + lean : 0;
  const rightLift = leg < 0 ? 1 + lean : 0;
  c.rect(ox + 5, oy + legTop, 3, 29 - legTop - leftLift, C.pants);
  c.rect(ox + 8, oy + legTop, 3, 29 - legTop - rightLift, C.pants);
  c.rect(ox + 7, oy + legTop + 2, 1, 27 - legTop - leftLift, C.pantsShade);
  c.rect(ox + 4, oy + 29 - leftLift, 4, 2, C.shoe);
  c.rect(ox + 8, oy + 29 - rightLift, 4, 2, C.shoe);

  // Cinto
  c.rect(ox + 4, oy + 22 + b, 8, 1, C.belt);

  // Tronco (ombros caídos: mais estreito em cima)
  c.rect(ox + 5, oy + 13 + b, 6, 1, C.shirt);
  c.rect(ox + 4, oy + 14 + b, 8, 8, C.shirt);
  c.rect(ox + 4, oy + 20 + b, 8, 2, C.shirtShade); // camisa meio para fora da calça
  // Amassados
  c.px(ox + 6, oy + 16 + b, C.shirtWrinkle);
  c.px(ox + 9, oy + 18 + b, C.shirtWrinkle);
  c.px(ox + 7, oy + 19 + b, C.shirtShade);
  c.px(ox + 10, oy + 15 + b, C.shirtShade);
  if (!back) {
    c.rect(ox + 7, oy + 13 + b, 2, 1, C.collar);
    c.rect(ox + 8, oy + 14 + b, 1, 7, C.shirtWrinkle); // vista dos botões
  }

  // Braços (balançando)
  const la = arm;
  const ra = -arm;
  c.rect(ox + 3, oy + 14 + b, 1, 7 + la, C.shirtShade);
  c.rect(ox + 12, oy + 14 + b, 1, 7 + ra, C.shirtShade);
  c.rect(ox + 3, oy + 21 + b + la, 1, 2, C.skin);
  c.rect(ox + 12, oy + 21 + b + ra, 1, 2, C.skin);

  // Pescoço
  c.rect(ox + 7, oy + 12 + b, 2, 1, C.skinShade);

  // Cabeça (levemente baixa)
  const h = 3 + b;
  c.rect(ox + 6, oy + h, 4, 1, C.hair);
  c.rect(ox + 5, oy + h + 1, 6, 2, C.hair);
  if (back) {
    c.rect(ox + 5, oy + h + 3, 6, 5, C.hair);
    c.px(ox + 7, oy + h + 2, C.hairLight);
    c.px(ox + 9, oy + h + 4, C.hairLight);
    c.rect(ox + 6, oy + h + 8, 4, 1, C.skinShade); // nuca
  } else {
    c.px(ox + 5, oy + h + 3, C.hair);
    c.px(ox + 10, oy + h + 3, C.hair);
    c.rect(ox + 6, oy + h + 3, 4, 1, C.skin);
    c.rect(ox + 5, oy + h + 4, 6, 3, C.skin);
    c.px(ox + 5, oy + h + 5, C.skinShade);
    c.px(ox + 10, oy + h + 5, C.skinShade);
    c.px(ox + 6, oy + h + 4, C.eye);
    c.px(ox + 9, oy + h + 4, C.eye);
    c.px(ox + 6, oy + h + 5, C.bags);
    c.px(ox + 9, oy + h + 5, C.bags);
    // Barba por fazer e boca
    c.rect(ox + 6, oy + h + 7, 4, 1, C.stubble);
    c.rect(ox + 7, oy + h + 7, 2, 1, C.mouth);
    c.rect(ox + 7, oy + h + 8, 2, 1, C.stubble);
    c.px(ox + 5, oy + h + 7, C.skinShade);
    c.px(ox + 10, oy + h + 7, C.skinShade);
  }
}

function drawSide(c, ox, oy, { leg, arm, bob, lean, stride }) {
  const b = bob;
  const f = -lean; // correndo: tronco e cabeça vão 1px para a frente (esquerda)

  // Pernas: perna de trás mais escura
  const legTop = 23 + b;
  const near = leg >= 0 ? C.pants : C.pantsShade;
  const far = leg >= 0 ? C.pantsShade : C.pants;
  const s = leg === 0 ? 0 : stride;
  for (let y = legTop; y <= 28; y++) {
    const k = (y - legTop) / (28 - legTop); // 0 no quadril, 1 no pé
    const back = Math.round(7 + k * s);
    const front = Math.round(7 - k * s);
    c.rect(ox + back, oy + y, 2, 1, far);
    c.rect(ox + front, oy + y, 2, 1, near);
  }
  c.rect(ox + 7 + s, oy + 29, 3, 2, C.shoe);
  c.rect(ox + 6 - s - 1, oy + 29, 3, 2, C.shoe);

  // Cinto e tronco
  c.rect(ox + 6 + f, oy + 22 + b, 5, 1, C.belt);
  c.rect(ox + 6 + f, oy + 13 + b, 4, 1, C.shirt);
  c.rect(ox + 6 + f, oy + 14 + b, 5, 8, C.shirt);
  c.rect(ox + 6 + f, oy + 20 + b, 5, 2, C.shirtShade);
  c.px(ox + 9 + f, oy + 17 + b, C.shirtWrinkle);
  c.px(ox + 7 + f, oy + 15 + b, C.shirtWrinkle);

  // Braço (na frente do tronco), balança para frente/trás
  const ax = 8 + f - arm;
  c.rect(ox + ax, oy + 14 + b, 2, 7, C.shirtShade);
  c.rect(ox + ax, oy + 21 + b, 2, 1, C.skin);
  c.px(ox + ax + (arm > 0 ? 0 : 1), oy + 22 + b, C.skin);

  // Pescoço e cabeça virados para a esquerda
  c.rect(ox + 7 + f, oy + 12 + b, 2, 1, C.skinShade);
  const h = 3 + b;
  const hx = ox + f;
  c.rect(hx + 6, oy + h, 4, 1, C.hair);
  c.rect(hx + 5, oy + h + 1, 6, 2, C.hair);
  c.rect(hx + 7, oy + h + 3, 4, 1, C.hair);
  c.rect(hx + 5, oy + h + 3, 2, 1, C.skin);
  c.rect(hx + 5, oy + h + 4, 4, 3, C.skin);
  c.rect(hx + 9, oy + h + 4, 2, 3, C.hair);
  c.px(hx + 8, oy + h + 5, C.skinShade); // orelha
  c.px(hx + 4, oy + h + 5, C.skin); // nariz
  c.px(hx + 5, oy + h + 4, C.eye);
  c.px(hx + 5, oy + h + 5, C.bags);
  c.rect(hx + 5, oy + h + 7, 3, 1, C.stubble);
  c.px(hx + 5, oy + h + 7, C.mouth);
  c.rect(hx + 6, oy + h + 8, 3, 1, C.stubble);
}

export function drawArtur() {
  const { width: W, height: H } = ARTUR_FRAME;
  const c = new PixelCanvas(W * ARTUR_COLUMNS, H * ARTUR_ROWS.length);

  const frames = [{ leg: 0, arm: 0, bob: 0, lean: 0, stride: 0 }];
  for (const [leg, arm, bob] of WALK) frames.push({ leg, arm, bob, lean: 0, stride: 1 });
  for (const [leg, arm, bob] of WALK) frames.push({ leg, arm: arm * 2, bob, lean: 1, stride: 2 });

  frames.forEach((f, col) => {
    const ox = col * W;
    drawFrontBack(c, ox, 0, { ...f, back: false });
    drawFrontBack(c, ox, H, { ...f, back: true });
    drawSide(c, ox, H * 2, f);
    for (let row = 0; row < 3; row++) c.outline(ox, row * H, W, H, C.outline);
    c.mirrorRegion(ox, H * 2, W, H, ox, H * 3);
  });

  return c;
}
