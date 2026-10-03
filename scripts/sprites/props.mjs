// Portas e móveis da casa (GDD 13.4), vistos de cima na diagonal.
// Tudo vai para um atlas: props.png + props.json (formato JSON Hash do Phaser).

import { PixelCanvas, seeded } from './canvas.mjs';

const WOOD_DARK = '#2a1d14';
const WOOD = '#5a4130';
const WOOD_LIGHT = '#6b4e3a';
const WOOD_INSET = '#4c3628';
const CAP = '#24221f';
const OUTLINE = '#08080a';

// ---- Portas -----------------------------------------------------------------

function doorPanelH(c, x, y, stickers) {
  c.rect(x, y, 48, 16, WOOD_DARK); // batente
  c.rect(x, y, 48, 3, CAP);
  c.rect(x + 3, y + 3, 42, 13, WOOD);
  c.rect(x + 6, y + 5, 16, 9, WOOD_INSET);
  c.rect(x + 26, y + 5, 16, 9, WOOD_INSET);
  c.rect(x + 3, y + 3, 42, 1, WOOD_LIGHT);
  c.rect(x + 38, y + 9, 2, 2, '#a8925e'); // maçaneta
  if (stickers) {
    // Adesivos infantis desbotados
    c.rect(x + 9, y + 7, 3, 3, '#8f7b8a');
    c.px(x + 10, y + 6, '#8f7b8a');
    c.rect(x + 16, y + 10, 2, 2, '#9a6a74');
    c.rect(x + 29, y + 6, 3, 2, '#7d8fa0');
    c.rect(x + 33, y + 11, 2, 2, '#a8936a');
  }
}

function doorOpenH(c, x, y) {
  c.rect(x, y, 3, 16, WOOD_DARK);
  c.rect(x + 45, y, 3, 16, WOOD_DARK);
  c.rect(x, y, 48, 3, CAP);
  // Folha aberta encostada no batente esquerdo
  c.rect(x + 3, y + 3, 3, 13, WOOD);
  c.rect(x + 3, y + 3, 1, 13, WOOD_LIGHT);
}

function doorClosedV(c, x, y) {
  c.rect(x + 5, y, 6, 48, WOOD);
  c.rect(x + 5, y, 1, 48, WOOD_LIGHT);
  c.rect(x + 10, y, 1, 48, WOOD_DARK);
  c.rect(x + 4, y, 8, 3, WOOD_DARK);
  c.rect(x + 4, y + 45, 8, 3, WOOD_DARK);
  c.rect(x + 4, y + 36, 1, 2, '#a8925e');
}

function doorOpenV(c, x, y) {
  c.rect(x + 4, y, 8, 3, WOOD_DARK);
  c.rect(x + 4, y + 45, 8, 3, WOOD_DARK);
  // Folha aberta, girada para dentro do cômodo
  c.rect(x + 8, y + 3, 8, 3, WOOD);
  c.rect(x + 8, y + 3, 8, 1, WOOD_LIGHT);
}

// ---- Móveis -------------------------------------------------------------------

function bed(c, x, y) {
  // Cama desarrumada, 48×64
  c.rect(x, y, 48, 8, WOOD_DARK); // cabeceira
  c.rect(x + 1, y + 1, 46, 2, WOOD);
  c.rect(x + 2, y + 8, 44, 54, '#8e8b84'); // lençol
  c.rect(x + 5, y + 10, 16, 8, '#a19e96'); // travesseiros
  c.rect(x + 27, y + 11, 16, 7, '#97948c');
  c.rect(x + 2, y + 24, 44, 38, '#3a4656'); // cobertor embolado
  c.rect(x + 2, y + 22, 30, 3, '#465466');
  c.rect(x + 8, y + 30, 20, 2, '#2f3a48');
  c.rect(x + 18, y + 40, 22, 2, '#2f3a48');
  c.rect(x + 6, y + 50, 14, 2, '#465466');
  c.rect(x + 34, y + 26, 10, 6, '#8e8b84'); // lençol aparecendo
  c.rect(x, y + 62, 48, 2, WOOD_DARK); // pé da cama
}

function nightstand(c, x, y) {
  c.rect(x, y + 4, 16, 12, WOOD_DARK);
  c.rect(x, y + 4, 16, 4, WOOD);
  c.rect(x + 6, y + 11, 4, 1, '#a8925e');
  // Frascos de remédio vazios
  c.rect(x + 2, y, 3, 6, '#9a5a22');
  c.rect(x + 2, y, 3, 1, '#d8d4c8');
  c.rect(x + 7, y + 2, 3, 4, '#8a5020');
  c.rect(x + 7, y + 2, 3, 1, '#d8d4c8');
  c.rect(x + 11, y + 5, 4, 2, '#9a5a22'); // frasco caído
}

function sofa(c, x, y) {
  // 64×28, de frente para a TV (encosto embaixo)
  c.rect(x, y, 64, 28, '#3d302a');
  c.rect(x + 4, y + 2, 56, 16, '#4a3b34');
  c.rect(x + 4, y + 2, 27, 15, '#54443c');
  c.rect(x + 33, y + 2, 27, 15, '#54443c');
  c.rect(x + 14, y + 6, 6, 4, '#4a3b34'); // afundado
  c.rect(x, y + 18, 64, 10, '#352923'); // encosto
  c.rect(x, y + 18, 64, 1, '#4a3b34');
  c.rect(x, y, 4, 22, '#352923');
  c.rect(x + 60, y, 4, 22, '#352923');
}

function tv(c, x, y) {
  // TV de tubo num rack, 32×28
  c.rect(x, y + 18, 32, 10, WOOD_DARK);
  c.rect(x, y + 18, 32, 2, WOOD);
  c.rect(x + 3, y, 26, 19, '#29292b');
  c.rect(x + 3, y, 26, 2, '#3a3a3d');
  c.rect(x + 6, y + 3, 17, 13, '#151b1e');
  c.rect(x + 7, y + 4, 4, 2, '#2a3439'); // reflexo
  c.rect(x + 25, y + 5, 2, 2, '#55555a');
  c.rect(x + 25, y + 9, 2, 2, '#55555a');
}

function phoneTable(c, x, y) {
  c.rect(x + 1, y + 6, 14, 10, WOOD_DARK);
  c.rect(x + 1, y + 6, 14, 3, WOOD);
  c.rect(x + 3, y + 2, 10, 5, '#1e1e20'); // telefone fixo
  c.rect(x + 3, y + 1, 10, 2, '#2c2c2f'); // fone
  c.px(x + 7, y + 4, '#55555a');
  c.px(x + 9, y + 4, '#55555a');
}

function shelf(c, x, y) {
  // Estante, 32×24
  c.rect(x, y, 32, 24, WOOD_DARK);
  c.rect(x + 2, y + 2, 28, 6, '#1a130d');
  c.rect(x + 2, y + 11, 28, 6, '#1a130d');
  const books = ['#5a3a3a', '#3a4a5a', '#4a4a3a', '#5a5040'];
  for (let i = 0; i < 6; i++) c.rect(x + 3 + i * 4, y + 3, 3, 5, books[i % 4]);
  for (let i = 0; i < 4; i++) c.rect(x + 4 + i * 6, y + 12, 4, 5, books[(i + 2) % 4]);
  c.rect(x, y + 20, 32, 4, '#1f1610');
}

function fridge(c, x, y) {
  // Geladeira com desenhos de criança presos, 24×36
  c.rect(x, y, 24, 36, '#9a9c96');
  c.rect(x, y, 24, 5, '#b2b4ae');
  c.rect(x, y + 16, 24, 1, '#6e706b');
  c.rect(x + 20, y + 8, 2, 6, '#6e706b');
  c.rect(x + 20, y + 20, 2, 8, '#6e706b');
  // Desenhos
  c.rect(x + 3, y + 7, 8, 7, '#d8d4c4');
  c.rect(x + 5, y + 9, 2, 2, '#a85050');
  c.rect(x + 7, y + 11, 3, 1, '#5070a0');
  c.rect(x + 9, y + 19, 8, 9, '#d8d4c4');
  c.rect(x + 10, y + 22, 6, 1, '#a89040');
  c.rect(x + 12, y + 24, 2, 3, '#5a8a5a');
  c.rect(x, y + 34, 24, 2, '#5c5e59');
}

function kitchenCounter(c, x, y, rand) {
  // Bancada com pia e louça acumulada, 48×28
  c.rect(x, y, 48, 28, '#3e3a34');
  c.rect(x, y, 48, 14, '#68635a');
  c.rect(x + 14, y + 2, 20, 10, '#7f888a');
  c.rect(x + 16, y + 4, 16, 7, '#4f585b');
  c.rect(x + 23, y, 2, 4, '#9aa3a5'); // torneira
  for (let i = 0; i < 7; i++) {
    c.rect(x + 16 + Math.floor(rand() * 12), y + 4 + Math.floor(rand() * 5), 4, 2, '#c4bfae');
  }
  c.rect(x + 3, y + 3, 7, 3, '#b8b2a0'); // pratos ao lado
  c.rect(x + 38, y + 5, 6, 5, '#7a4a2a'); // panela
  c.rect(x, y + 14, 48, 1, '#2c2924');
  c.rect(x + 4, y + 18, 18, 8, '#36322d');
  c.rect(x + 26, y + 18, 18, 8, '#36322d');
}

function bathroomSink(c, x, y) {
  c.rect(x + 1, y, 14, 4, '#3b4144'); // espelho manchado (na parede)
  c.rect(x + 2, y + 1, 12, 2, '#5d686c');
  c.px(x + 5, y + 1, '#4a5356');
  c.rect(x + 2, y + 5, 12, 9, '#9aa2a4');
  c.rect(x + 4, y + 7, 8, 5, '#6f787b');
  c.rect(x + 7, y + 5, 2, 2, '#c0c6c8');
  c.rect(x + 6, y + 14, 4, 2, '#7d8588');
}

function cabinet(c, x, y) {
  c.rect(x, y, 24, 20, '#4b4a46');
  c.rect(x, y, 24, 3, '#5d5c57');
  c.rect(x + 11, y + 3, 1, 15, '#34332f');
  c.rect(x + 8, y + 9, 2, 2, '#8a8a80');
  c.rect(x + 13, y + 9, 2, 2, '#8a8a80');
  c.rect(x, y + 18, 24, 2, '#2e2d2a');
}

function desk(c, x, y) {
  // Mesa do escritório com pastas, 48×28
  c.rect(x, y, 48, 28, WOOD_DARK);
  c.rect(x, y, 48, 14, '#4a3626');
  c.rect(x + 4, y + 2, 12, 9, '#7a6a3a'); // pastas
  c.rect(x + 6, y + 3, 12, 9, '#8a7a48');
  c.rect(x + 22, y + 3, 10, 8, '#4a5a6a');
  c.rect(x + 36, y + 2, 8, 5, '#c8c2b0'); // papéis
  c.rect(x + 35, y + 6, 7, 5, '#b8b2a0');
  c.rect(x, y + 14, 48, 1, '#1a130d');
  c.rect(x + 30, y + 17, 14, 9, '#22180f');
  c.rect(x + 36, y + 21, 2, 1, '#a8925e');
}

function uniformRack(c, x, y) {
  // Farda antiga pendurada, 16×32
  c.rect(x + 7, y, 2, 32, WOOD_DARK);
  c.rect(x + 3, y + 30, 10, 2, WOOD_DARK);
  c.rect(x + 3, y + 4, 10, 2, '#5a5a5a');
  c.rect(x + 2, y + 6, 12, 14, '#2e3a4e'); // farda azul-escura
  c.rect(x + 4, y + 8, 2, 2, '#b8a050'); // distintivo
  c.rect(x + 7, y + 6, 1, 14, '#25303f');
  c.rect(x + 3, y + 3, 10, 2, '#1e2836'); // quepe
}

function box(c, x, y, rand) {
  c.rect(x, y, 16, 16, '#5c4830');
  c.rect(x, y, 16, 6, '#6b5435');
  c.rect(x + 7, y, 2, 6, '#8a7a5a'); // fita
  c.rect(x, y + 6, 16, 1, '#4a3a26');
  if (rand() > 0.5) c.rect(x + 3, y + 9, 6, 3, '#c8c2b0'); // etiqueta
}

function generator(c, x, y) {
  // Gerador velho sob um pequeno telhado com lâmpada externa, 48×40
  c.rect(x, y, 48, 6, '#2b2f33'); // telhadinho
  c.rect(x, y + 5, 48, 1, '#1b1e21');
  c.rect(x + 22, y + 6, 4, 3, '#d8c890'); // lâmpada
  c.rect(x + 4, y + 6, 2, 30, '#2b2f33'); // pilares
  c.rect(x + 42, y + 6, 2, 30, '#2b2f33');
  c.rect(x + 8, y + 14, 32, 22, '#454a34'); // corpo
  c.rect(x + 8, y + 14, 32, 6, '#555b40');
  c.rect(x + 11, y + 22, 12, 10, '#2e3224');
  for (let i = 0; i < 4; i++) c.rect(x + 12, y + 23 + i * 2, 10, 1, '#3a3f2d'); // grade
  c.rect(x + 27, y + 23, 9, 5, '#2a2a28'); // painel
  c.rect(x + 28, y + 24, 2, 2, '#8a3030');
  c.rect(x + 32, y + 24, 2, 2, '#3a3a36');
  c.rect(x + 34, y + 10, 3, 5, '#2a2a28'); // escapamento
  c.rect(x + 8, y + 36, 32, 2, '#2a2d20');
}

// ---- Atlas ------------------------------------------------------------------

// [nome, largura, altura, desenho, contorno?]
const PROPS = [
  ['door-h-closed', 48, 16, (c, x, y) => doorPanelH(c, x, y, false)],
  ['door-h-clara', 48, 16, (c, x, y) => doorPanelH(c, x, y, true)],
  ['door-h-open', 48, 16, doorOpenH],
  ['door-v-closed', 16, 48, doorClosedV],
  ['door-v-open', 16, 48, doorOpenV],
  ['bed', 48, 64, bed, true],
  ['nightstand', 16, 16, nightstand, true],
  ['sofa', 64, 28, sofa, true],
  ['tv', 32, 28, tv, true],
  ['phone-table', 16, 16, phoneTable, true],
  ['shelf', 32, 24, shelf, true],
  ['fridge', 24, 36, fridge, true],
  ['kitchen-counter', 48, 28, kitchenCounter, true],
  ['bathroom-sink', 16, 16, bathroomSink, true],
  ['cabinet', 24, 20, cabinet, true],
  ['desk', 48, 28, desk, true],
  ['uniform', 16, 32, uniformRack, true],
  ['box', 16, 16, box, true],
  ['generator', 48, 40, generator, true],
];

export function drawProps() {
  // Empacota em prateleiras de 256 px de largura, com 1 px de folga para o contorno.
  const ATLAS_WIDTH = 256;
  const PAD = 1;
  const placed = [];
  let x = 0;
  let y = 0;
  let rowHeight = 0;
  for (const [name, w, h, draw, outline] of PROPS) {
    const cw = w + PAD * 2;
    const ch = h + PAD * 2;
    if (x + cw > ATLAS_WIDTH) {
      x = 0;
      y += rowHeight;
      rowHeight = 0;
    }
    placed.push({ name, x: x + PAD, y: y + PAD, w, h, draw, outline });
    x += cw;
    rowHeight = Math.max(rowHeight, ch);
  }
  const height = y + rowHeight;
  const c = new PixelCanvas(ATLAS_WIDTH, height);
  const frames = {};
  placed.forEach((p, i) => {
    p.draw(c, p.x, p.y, seeded(100 + i));
    if (p.outline) {
      // contorno só por fora: desenha na borda de 1px reservada
      c.outline(p.x - PAD, p.y - PAD, p.w + PAD * 2, p.h + PAD * 2, OUTLINE);
      frames[p.name] = { frame: { x: p.x - PAD, y: p.y - PAD, w: p.w + PAD * 2, h: p.h + PAD * 2 } };
    } else {
      frames[p.name] = { frame: { x: p.x, y: p.y, w: p.w, h: p.h } };
    }
  });
  const json = {
    frames,
    meta: { image: 'props.png', size: { w: ATLAS_WIDTH, h: height }, scale: '1' },
  };
  return { canvas: c, json };
}
