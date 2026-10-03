// Tileset da casa (GDD 13.4): piso de taco, papel de parede desbotado, azulejos
// encardidos, lama e chuva no quintal, piso molhado na varanda. Paleta escura.

import { PixelCanvas, seeded } from './canvas.mjs';
import { T, TILE, TILE_COUNT } from '../../src/world/tiles.js';

function noise(c, ox, oy, rand, colors, amount) {
  for (let i = 0; i < amount; i++) {
    const x = Math.floor(rand() * TILE);
    const y = Math.floor(rand() * TILE);
    c.px(ox + x, oy + y, colors[Math.floor(rand() * colors.length)]);
  }
}

function wallCap(c, ox, oy, rand) {
  c.rect(ox, oy, TILE, TILE, '#24221f');
  noise(c, ox, oy, rand, ['#2a2825', '#1f1d1b'], 18);
}

function wallFace(c, ox, oy, rand) {
  c.rect(ox, oy, TILE, 4, '#24221f'); // topo da parede
  c.rect(ox, oy + 4, TILE, 1, '#1a1816');
  // Papel de parede desbotado com listras
  c.rect(ox, oy + 5, TILE, 8, '#4a4236');
  for (let x = 1; x < TILE; x += 4) c.rect(ox + x, oy + 5, 1, 8, '#544b3e');
  for (let x = 3; x < TILE; x += 8) c.px(ox + x, oy + 8, '#5c5244');
  noise(c, ox, oy + 5, rand, ['#433b30', '#3e372d'], 6); // manchas
  c.rect(ox, oy + 13, TILE, 3, '#2b2119'); // rodapé
  c.rect(ox, oy + 13, TILE, 1, '#3a2c20');
}

function wallFaceOutside(c, ox, oy, rand) {
  c.rect(ox, oy, TILE, 4, '#1d2024');
  c.rect(ox, oy + 4, TILE, 1, '#14171a');
  // Reboco externo molhado
  c.rect(ox, oy + 5, TILE, 11, '#33363a');
  noise(c, ox, oy + 5, rand, ['#2c2f33', '#3a3e43', '#272a2e'], 14);
  for (let x = 2; x < TILE; x += 5) c.rect(ox + x, oy + 6 + (x % 3), 1, 6, '#2a2d31'); // escorrido
}

function taco(c, ox, oy, rand) {
  // Taco em espinha: blocos 8×8 alternando tábuas horizontais/verticais
  const light = '#4d3826';
  const mid = '#443120';
  const dark = '#36271a';
  for (let by = 0; by < 2; by++) {
    for (let bx = 0; bx < 2; bx++) {
      const x0 = ox + bx * 8;
      const y0 = oy + by * 8;
      const horizontal = (bx + by) % 2 === 0;
      for (let k = 0; k < 4; k++) {
        const color = k % 2 ? light : mid;
        if (horizontal) c.rect(x0, y0 + k * 2, 8, 2, color);
        else c.rect(x0 + k * 2, y0, 2, 8, color);
      }
      if (horizontal) c.rect(x0, y0 + 7, 8, 1, dark);
      else c.rect(x0 + 7, y0, 1, 8, dark);
    }
  }
  noise(c, ox, oy, rand, ['#5a4632', '#3b2b1d', '#4f4436'], 10); // poeira
}

function corridor(c, ox, oy, rand) {
  // Tábuas corridas mais escuras
  for (let k = 0; k < 4; k++) {
    c.rect(ox, oy + k * 4, TILE, 4, k % 2 ? '#3a2a1c' : '#33251a');
    c.rect(ox, oy + k * 4 + 3, TILE, 1, '#271c13');
    c.px(ox + ((k * 7 + 3) % TILE), oy + k * 4 + 3, '#33251a');
  }
  noise(c, ox, oy, rand, ['#46362a', '#2c2017', '#4a4034'], 9);
}

function bathroom(c, ox, oy, rand) {
  c.rect(ox, oy, TILE, TILE, '#3a3f41'); // rejunte
  for (let ty = 0; ty < 2; ty++) {
    for (let tx = 0; tx < 2; tx++) c.rect(ox + tx * 8, oy + ty * 8, 7, 7, '#575f62');
  }
  noise(c, ox, oy, rand, ['#4a5154', '#4d4a3e', '#5f6669'], 12); // encardido
}

function kitchen(c, ox, oy, rand) {
  for (let ty = 0; ty < 2; ty++) {
    for (let tx = 0; tx < 2; tx++) {
      c.rect(ox + tx * 8, oy + ty * 8, 8, 8, (tx + ty) % 2 ? '#3a3733' : '#56524b');
    }
  }
  noise(c, ox, oy, rand, ['#4a463f', '#2f2c29', '#5e594f'], 12);
}

function mud(c, ox, oy, rand, puddle) {
  c.rect(ox, oy, TILE, TILE, '#2a261c');
  noise(c, ox, oy, rand, ['#332e22', '#231f17', '#2f3a24'], 40);
  if (puddle) {
    c.rect(ox + 4, oy + 6, 7, 3, '#1f2a33');
    c.rect(ox + 5, oy + 5, 5, 5, '#1f2a33');
    c.px(ox + 6, oy + 6, '#3b4b58');
  }
}

function concrete(c, ox, oy, rand) {
  c.rect(ox, oy, TILE, TILE, '#34393e');
  noise(c, ox, oy, rand, ['#3d444a', '#2d3236', '#47515a'], 22);
  c.rect(ox + 2, oy + 9, 5, 1, '#4b5660'); // brilho de molhado
  c.rect(ox, oy + 15, TILE, 1, '#2a2e32');
}

function threshold(c, ox, oy) {
  c.rect(ox, oy, TILE, TILE, '#2e2117');
  c.rect(ox, oy, TILE, 1, '#3a2a1c');
  c.rect(ox, oy + 15, TILE, 1, '#22180f');
}

export function drawTiles() {
  const c = new PixelCanvas(TILE * TILE_COUNT, TILE);
  const at = (index) => index * TILE;
  const r = (seed) => seeded(seed);

  c.rect(at(T.VOID), 0, TILE, TILE, '#050506');
  wallCap(c, at(T.WALL), 0, r(1));
  wallFace(c, at(T.WALL_FACE), 0, r(2));
  wallFaceOutside(c, at(T.WALL_FACE_OUT), 0, r(3));
  taco(c, at(T.TACO_A), 0, r(4));
  taco(c, at(T.TACO_B), 0, r(5));
  corridor(c, at(T.CORRIDOR_A), 0, r(6));
  corridor(c, at(T.CORRIDOR_B), 0, r(7));
  bathroom(c, at(T.BATHROOM_A), 0, r(8));
  bathroom(c, at(T.BATHROOM_B), 0, r(9));
  kitchen(c, at(T.KITCHEN_A), 0, r(10));
  kitchen(c, at(T.KITCHEN_B), 0, r(11));
  mud(c, at(T.MUD_A), 0, r(12), false);
  mud(c, at(T.MUD_B), 0, r(13), true);
  concrete(c, at(T.CONCRETE_A), 0, r(14));
  concrete(c, at(T.CONCRETE_B), 0, r(15));
  threshold(c, at(T.THRESHOLD), 0);
  return c;
}
