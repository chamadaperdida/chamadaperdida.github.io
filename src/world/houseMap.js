// Mapa da casa (GDD 4.2 e planta-casa-v2.svg).
//
// Tudo em METROS, com a origem no canto superior esquerdo da garagem.
// A planta v2 usa 1 quadrado = 1 m: um cômodo que ocupa os quadrados x..x2 vai de x a x2+1.
// A casa ocupa 48 m × 29 m contando quintal, jardim e varanda (externos).
//
// O mapa vira uma grade de células de 0,5 m (1 tile = 16 px). As paredes ficam
// SOBRE as linhas que dividem os cômodos, com 0,5 m de espessura.
// Cômodos em L são vários retângulos com o mesmo id: a linha entre eles vira piso.

import { CELL_METERS, FLOORS, T } from './tiles.js';

export const WORLD = { width: 48, height: 29 }; // metros

// Cômodos e áreas externas: retângulos em metros (o mesmo id pode aparecer mais de uma vez).
export const ROOMS = [
  { id: 'garagem', name: 'Garagem', x: 0, y: 1, w: 9, h: 13, floor: 'concrete' },
  { id: 'corredorServico', name: 'Corredor de serviço', x: 9, y: 3, w: 2, h: 15, floor: 'corridor' },
  { id: 'sala', name: 'Sala', x: 11, y: 1, w: 5, h: 5, floor: 'taco' },
  { id: 'sala', name: 'Sala', x: 11, y: 6, w: 11, h: 8, floor: 'taco' },
  { id: 'entrada', name: 'Entrada', x: 16, y: 0, w: 6, h: 6, floor: 'taco' },
  { id: 'corredorQuartos', name: 'Corredor dos quartos', x: 22, y: 2, w: 12, h: 2, floor: 'corridor' },
  { id: 'corredorQuartos', name: 'Corredor dos quartos', x: 32, y: 4, w: 2, h: 8, floor: 'corridor' },
  { id: 'corredorQuartos', name: 'Corredor dos quartos', x: 34, y: 10, w: 8, h: 2, floor: 'corridor' },
  { id: 'quartoArtur', name: 'Quarto do Artur', x: 22, y: 4, w: 7, h: 6, floor: 'taco' },
  { id: 'suite', name: 'Suíte', x: 29, y: 4, w: 3, h: 6, floor: 'bathroom' },
  { id: 'banheiroSocial', name: 'Banheiro social', x: 34, y: 1, w: 4, h: 5, floor: 'bathroom' },
  { id: 'escritorio', name: 'Escritório', x: 38, y: 0, w: 10, h: 10, floor: 'taco' },
  { id: 'escritorio', name: 'Escritório', x: 34, y: 6, w: 4, h: 4, floor: 'taco' },
  { id: 'quartoClara', name: 'Quarto da Clara', x: 42, y: 10, w: 6, h: 8, floor: 'taco' },
  { id: 'salaJantar', name: 'Sala de jantar', x: 22, y: 10, w: 10, h: 8, floor: 'taco' },
  { id: 'hospedes', name: 'Quarto de hóspedes', x: 32, y: 12, w: 10, h: 8, floor: 'taco' },
  { id: 'cozinha', name: 'Cozinha', x: 11, y: 14, w: 11, h: 8, floor: 'kitchen' },
  { id: 'cozinha', name: 'Cozinha', x: 22, y: 18, w: 10, h: 4, floor: 'kitchen' },
  { id: 'lavanderia', name: 'Lavanderia', x: 11, y: 22, w: 8, h: 4, floor: 'bathroom' },
  { id: 'despensa', name: 'Despensa', x: 19, y: 22, w: 3, h: 4, floor: 'kitchen' },
  { id: 'corredorFundos', name: 'Corredor dos fundos', x: 22, y: 22, w: 2, h: 4, floor: 'corridor' },
  { id: 'deposito', name: 'Depósito', x: 37, y: 22, w: 6, h: 4, floor: 'concrete' },
  { id: 'quintal', name: 'Quintal', x: 0, y: 14, w: 9, h: 15, floor: 'mud', external: true },
  { id: 'quintal', name: 'Quintal', x: 9, y: 18, w: 2, h: 11, floor: 'mud', external: true },
  { id: 'jardim', name: 'Jardim', x: 24, y: 22, w: 13, h: 4, floor: 'mud', external: true },
  { id: 'jardim', name: 'Jardim', x: 32, y: 20, w: 16, h: 2, floor: 'mud', external: true },
  { id: 'jardim', name: 'Jardim', x: 42, y: 18, w: 6, h: 2, floor: 'mud', external: true },
  { id: 'jardim', name: 'Jardim', x: 43, y: 22, w: 5, h: 4, floor: 'mud', external: true },
  { id: 'varanda', name: 'Varanda externa', x: 11, y: 26, w: 37, h: 3, floor: 'concrete', external: true },
];

// Passagens abertas (sem porta) sobre uma linha de parede.
// axis 'h' = parede horizontal (linha y, de x0 a x1); 'v' = parede vertical (linha x, de y0 a y1).
export const OPENINGS = [
  { axis: 'h', y: 6, x0: 16, x1: 22, floor: 'taco' }, // entrada ↔ sala
  { axis: 'v', x: 22, y0: 11, y1: 14, floor: 'taco' }, // sala ↔ sala de jantar
  { axis: 'v', x: 11, y0: 26, y1: 29, floor: 'concrete' }, // quintal ↔ varanda
  { axis: 'h', y: 26, x0: 24, x1: 37, floor: 'concrete' }, // jardim ↔ varanda
  { axis: 'h', y: 26, x0: 43, x1: 48, floor: 'concrete' }, // jardim ↔ varanda
];

// Portas: 1,5 m de largura (3 células), centradas em (x, y) sobre a linha da parede.
//   kind: 'normal' abre/fecha · 'clara' sempre fechada · 'front' porta da frente / portão (não abre)
export const DOORS = [
  { id: 'frente', axis: 'h', x: 19, y: 0, kind: 'front', open: false },
  { id: 'portao', axis: 'h', x: 4.5, y: 1, kind: 'front', open: false },
  { id: 'entradaCorredor', axis: 'v', x: 22, y: 3, kind: 'normal', open: true },
  { id: 'quartoArtur', axis: 'h', x: 26, y: 4, kind: 'normal', open: true },
  { id: 'suite', axis: 'v', x: 29, y: 7, kind: 'normal', open: true },
  { id: 'banheiroSocial', axis: 'v', x: 34, y: 5, kind: 'normal', open: true },
  { id: 'escritorio', axis: 'h', x: 36, y: 10, kind: 'normal', open: true },
  { id: 'clara', axis: 'v', x: 42, y: 11, kind: 'clara', open: false },
  { id: 'corredorJantar', axis: 'v', x: 32, y: 11, kind: 'normal', open: true },
  { id: 'corredorHospedes', axis: 'h', x: 38, y: 12, kind: 'normal', open: true },
  { id: 'salaServico', axis: 'v', x: 11, y: 9, kind: 'normal', open: true },
  { id: 'garagemServico', axis: 'v', x: 9, y: 5, kind: 'normal', open: true },
  { id: 'garagemQuintal', axis: 'h', x: 4, y: 14, kind: 'normal', open: false },
  { id: 'servicoCozinha', axis: 'v', x: 11, y: 16, kind: 'normal', open: true },
  { id: 'lateral', axis: 'h', x: 10, y: 18, kind: 'normal', open: false },
  { id: 'salaCozinha', axis: 'h', x: 16, y: 14, kind: 'normal', open: true },
  { id: 'jantarCozinha', axis: 'h', x: 27, y: 18, kind: 'normal', open: true },
  { id: 'hospedesCozinha', axis: 'v', x: 32, y: 19, kind: 'normal', open: true },
  { id: 'cozinhaLavanderia', axis: 'h', x: 15, y: 22, kind: 'normal', open: true },
  { id: 'despensa', axis: 'h', x: 20.5, y: 22, kind: 'normal', open: true },
  { id: 'cozinhaFundos', axis: 'h', x: 23, y: 22, kind: 'normal', open: true },
  { id: 'fundos', axis: 'v', x: 11, y: 24, kind: 'normal', open: false }, // porta dos fundos
  { id: 'fundosJardim', axis: 'v', x: 24, y: 24, kind: 'normal', open: false },
  { id: 'fundosVaranda', axis: 'h', x: 23, y: 26, kind: 'normal', open: false },
  { id: 'hospedesJardim', axis: 'h', x: 37, y: 20, kind: 'normal', open: false },
  { id: 'deposito', axis: 'h', x: 40, y: 22, kind: 'normal', open: true },
];

export const DOOR_WIDTH = 1.5; // metros

// Móveis com colisão. (x, y) = canto superior esquerdo em metros.
// `sprite` é o nome do quadro no atlas props.
export const FURNITURE = [
  // Quarto do Artur
  { id: 'cama', sprite: 'bed', x: 22.4, y: 4.25, room: 'quartoArtur' },
  { id: 'criadoMudo', sprite: 'nightstand', x: 24.0, y: 4.25, room: 'quartoArtur' },
  { id: 'comoda', sprite: 'dresser', x: 26.78, y: 4.25, room: 'quartoArtur' },
  { id: 'armarioQuarto', sprite: 'cabinet', x: 28.0, y: 4.25, room: 'quartoArtur' },
  { id: 'cesto', sprite: 'laundry-basket', x: 24.6, y: 4.6, room: 'quartoArtur' },
  // Suíte e banheiro social
  { id: 'piaSuite', sprite: 'bathroom-sink', x: 30.0, y: 4.25, room: 'suite' },
  { id: 'armarioSuite', sprite: 'cabinet', x: 30.95, y: 4.25, room: 'suite' },
  { id: 'piaSocial', sprite: 'bathroom-sink', x: 35.5, y: 1.25, room: 'banheiroSocial' },
  { id: 'prateleiraSocial', sprite: 'bathroom-shelf', x: 36.8, y: 1.25, room: 'banheiroSocial' },
  { id: 'lixeiraBanheiro', sprite: 'trash-bin', x: 37.35, y: 1.4, room: 'banheiroSocial' },
  // Escritório
  { id: 'arquivo', sprite: 'filing-cabinet', x: 38.4, y: 0.25, room: 'escritorio' },
  { id: 'mesa', sprite: 'desk', x: 42.0, y: 0.4, room: 'escritorio' },
  { id: 'lixeiraEscritorio', sprite: 'trash-bin', x: 43.6, y: 0.5, room: 'escritorio' },
  { id: 'farda', sprite: 'uniform', x: 46.6, y: 0.25, room: 'escritorio' },
  { id: 'caixa1', sprite: 'box', x: 47.0, y: 8.0, room: 'escritorio' },
  { id: 'caixa2', sprite: 'box', x: 46.9, y: 8.6, room: 'escritorio' },
  { id: 'caixa3', sprite: 'box', x: 34.4, y: 6.3, room: 'escritorio' },
  // Corredores
  { id: 'aparadorCorredor', sprite: 'console-table', x: 29.0, y: 2.25, room: 'corredorQuartos' },
  { id: 'mesinhaCorredor', sprite: 'side-table', x: 40.0, y: 10.3, room: 'corredorQuartos' },
  { id: 'mesinhaServico', sprite: 'side-table', x: 9.3, y: 11.5, room: 'corredorServico' },
  // Sala
  { id: 'telefoneFixo', sprite: 'phone-table', x: 11.4, y: 1.3, room: 'sala' },
  { id: 'tv', sprite: 'tv', x: 12.3, y: 1.3, room: 'sala' },
  { id: 'estante', sprite: 'shelf', x: 14.4, y: 1.3, room: 'sala' },
  { id: 'sofa', sprite: 'sofa', x: 12.0, y: 3.6, room: 'sala' },
  { id: 'aparador', sprite: 'sideboard', x: 12.0, y: 12.3, room: 'sala' },
  { id: 'vasoSala', sprite: 'plant-pot', x: 11.4, y: 10.5, room: 'sala' },
  { id: 'mesinhaSala', sprite: 'side-table', x: 20.9, y: 7.0, room: 'sala' },
  // Sala de jantar
  { id: 'mesaJantar', sprite: 'dining-big', x: 25.5, y: 13.0, room: 'salaJantar' },
  { id: 'aparadorJantar', sprite: 'sideboard', x: 23.0, y: 10.3, room: 'salaJantar' },
  // Quarto de hóspedes (caixas da festa)
  { id: 'camaHospedes', sprite: 'bed', x: 32.5, y: 12.25, room: 'hospedes' },
  { id: 'mesinhaHospedes', sprite: 'side-table', x: 34.2, y: 12.3, room: 'hospedes' },
  { id: 'caixaFesta1', sprite: 'box', x: 40.8, y: 12.3, room: 'hospedes' },
  { id: 'caixaFesta2', sprite: 'box', x: 41.0, y: 12.85, room: 'hospedes' },
  { id: 'caixaFesta3', sprite: 'box', x: 40.3, y: 18.9, room: 'hospedes' },
  // Cozinha
  { id: 'geladeira', sprite: 'fridge', x: 12.0, y: 14.3, room: 'cozinha' },
  { id: 'pia', sprite: 'kitchen-counter', x: 17.3, y: 14.3, room: 'cozinha' },
  { id: 'microondas', sprite: 'counter-microwave', x: 18.8, y: 14.3, room: 'cozinha' },
  { id: 'lixeiraCozinha', sprite: 'trash-bin', x: 19.9, y: 14.4, room: 'cozinha' },
  { id: 'mesaCozinha', sprite: 'dining-table', x: 13.5, y: 18.0, room: 'cozinha' },
  // Lavanderia e despensa
  { id: 'maquina', sprite: 'washer', x: 11.4, y: 22.3, room: 'lavanderia' },
  { id: 'tanque', sprite: 'laundry-tank', x: 12.3, y: 22.3, room: 'lavanderia' },
  { id: 'freezer', sprite: 'freezer', x: 13.2, y: 22.3, room: 'lavanderia' },
  { id: 'tabua', sprite: 'ironing-board', x: 16.6, y: 22.35, room: 'lavanderia' },
  { id: 'prateleiraDespensa1', sprite: 'pantry-shelf', x: 19.3, y: 24.9, room: 'despensa' },
  { id: 'prateleiraDespensa2', sprite: 'pantry-shelf', x: 20.6, y: 24.9, room: 'despensa' },
  // Garagem
  { id: 'bancada', sprite: 'workbench', x: 0.4, y: 1.4, room: 'garagem' },
  { id: 'latao', sprite: 'garbage-can', x: 7.9, y: 1.4, room: 'garagem' },
  { id: 'caixaGaragem1', sprite: 'box', x: 0.4, y: 12.9, room: 'garagem' },
  { id: 'caixaGaragem2', sprite: 'box', x: 1.0, y: 12.9, room: 'garagem' },
  // Depósito (no jardim)
  { id: 'prateleiraDeposito', sprite: 'pantry-shelf', x: 37.4, y: 24.9, room: 'deposito' },
  { id: 'caixaDeposito', sprite: 'box', x: 41.9, y: 25.0, room: 'deposito' },
  // Quintal
  { id: 'gerador', sprite: 'generator', x: 1.0, y: 24.5, room: 'quintal' },
  { id: 'varal', sprite: 'clothesline', x: 5.6, y: 19.5, room: 'quintal' },
  // Vasos (jardim, varanda)
  { id: 'vaso1', sprite: 'plant-pot', x: 26.5, y: 23.0, room: 'jardim' },
  { id: 'vaso2', sprite: 'plant-pot', x: 30.5, y: 24.6, room: 'jardim' },
  { id: 'vaso3', sprite: 'plant-pot', x: 34.5, y: 20.6, room: 'jardim' },
  { id: 'vaso4', sprite: 'plant-pot', x: 45.0, y: 18.6, room: 'jardim' },
  { id: 'vaso5', sprite: 'plant-pot', x: 45.5, y: 24.0, room: 'jardim' },
  { id: 'vaso6', sprite: 'plant-pot', x: 15.0, y: 26.4, room: 'varanda' },
  { id: 'vaso7', sprite: 'plant-pot', x: 44.0, y: 27.9, room: 'varanda' },
];

// Ponto de interação com a cama (ao lado dela, no quarto do Artur).
export const BED_POINT = { x: 23.15, y: 6.75 };

// Ponto do gerador para medir distância e segurar F (na frente dele).
export const GENERATOR_POINT = { x: 1.75, y: 26.15 };

// O que pode aparecer em cada cômodo (GDD 4.2, coluna "Pode aparecer").
export const ROOM_ITEMS = {
  corredorQuartos: ['battery', 'key'],
  quartoArtur: ['medicine', 'battery', 'key'],
  suite: ['medicine', 'key'],
  banheiroSocial: ['medicine', 'key'],
  escritorio: ['medicine', 'battery', 'key'],
  sala: ['medicine', 'battery', 'key'],
  salaJantar: ['medicine', 'battery', 'key'],
  hospedes: ['medicine', 'battery', 'key'],
  cozinha: ['medicine', 'battery', 'key'],
  despensa: ['battery', 'key'],
  lavanderia: ['medicine', 'battery', 'key'],
  corredorServico: ['battery', 'key'],
  garagem: ['battery', 'key'],
  deposito: ['battery', 'key'],
};

// Lugares específicos onde remédios, pilhas e a chave podem aparecer: em cima dos móveis.
// (dx, dy) = posição da BASE do item em px dentro do sprite do móvel (o tampo).
// A cada noite o jogo sorteia entre eles; o que cabe em cada lugar vem do cômodo do móvel.
export const ITEM_SPOTS = [
  { on: 'criadoMudo', dx: 13, dy: 9 },
  { on: 'comoda', dx: 8, dy: 6 },
  { on: 'comoda', dx: 31, dy: 6 },
  { on: 'armarioQuarto', dx: 6, dy: 3 },
  { on: 'armarioSuite', dx: 6, dy: 3 },
  { on: 'armarioSuite', dx: 18, dy: 3 },
  { on: 'prateleiraSocial', dx: 11, dy: 10 },
  { on: 'prateleiraSocial', dx: 11, dy: 20 },
  { on: 'arquivo', dx: 8, dy: 4 },
  { on: 'mesa', dx: 12, dy: 14 },
  { on: 'mesa', dx: 38, dy: 14 },
  { on: 'caixa1', dx: 5, dy: 5 },
  { on: 'caixa3', dx: 10, dy: 5 },
  { on: 'aparadorCorredor', dx: 16, dy: 6 },
  { on: 'aparadorCorredor', dx: 26, dy: 6 },
  { on: 'mesinhaCorredor', dx: 8, dy: 7 },
  { on: 'mesinhaServico', dx: 8, dy: 7 },
  { on: 'aparador', dx: 7, dy: 7 },
  { on: 'aparador', dx: 41, dy: 7 },
  { on: 'mesinhaSala', dx: 8, dy: 7 },
  { on: 'mesaJantar', dx: 16, dy: 18 },
  { on: 'mesaJantar', dx: 56, dy: 18 },
  { on: 'aparadorJantar', dx: 7, dy: 7 },
  { on: 'aparadorJantar', dx: 41, dy: 7 },
  { on: 'mesinhaHospedes', dx: 8, dy: 7 },
  { on: 'caixaFesta1', dx: 5, dy: 5 },
  { on: 'caixaFesta3', dx: 10, dy: 5 },
  { on: 'pia', dx: 8, dy: 13 },
  { on: 'mesaCozinha', dx: 12, dy: 12 },
  { on: 'mesaCozinha', dx: 40, dy: 15 },
  { on: 'maquina', dx: 12, dy: 18 },
  { on: 'tabua', dx: 8, dy: 5 },
  { on: 'prateleiraDespensa1', dx: 23, dy: 10 },
  { on: 'prateleiraDespensa1', dx: 9, dy: 19 },
  { on: 'prateleiraDespensa2', dx: 23, dy: 10 },
  { on: 'bancada', dx: 30, dy: 11 },
  { on: 'caixaGaragem1', dx: 5, dy: 5 },
  { on: 'prateleiraDeposito', dx: 23, dy: 10 },
  { on: 'prateleiraDeposito', dx: 9, dy: 19 },
  { on: 'caixaDeposito', dx: 8, dy: 5 },
];

// Onde Artur aparece ao chegar em casa (pela porta da frente).
export const SPAWN = { x: 19, y: 1.3 };

// ---------------------------------------------------------------------------
// Grade
// ---------------------------------------------------------------------------
// Célula (i, j) tem centro em (i·0,5 m, j·0,5 m). Assim as linhas inteiras e meias
// da planta caem no centro de uma célula, que vira parede.

export const GRID_W = Math.round(WORLD.width / CELL_METERS) + 1;
export const GRID_H = Math.round(WORLD.height / CELL_METERS) + 1;

const inside = (r, xm, ym) => xm > r.x && xm < r.x + r.w && ym > r.y && ym < r.y + r.h;

/**
 * Cômodo num ponto (m). Na linha entre dois retângulos do MESMO cômodo (cômodo em L)
 * também devolve o cômodo; numa parede entre cômodos diferentes, null.
 */
export function roomAt(xm, ym) {
  const strict = ROOMS.find((r) => inside(r, xm, ym));
  if (strict) return strict;
  const e = 0.01;
  const around = [
    [xm - e, ym - e],
    [xm + e, ym - e],
    [xm - e, ym + e],
    [xm + e, ym + e],
  ].map(([x, y]) => ROOMS.find((r) => inside(r, x, y)));
  return around.every((r) => r && r.id === around[0].id) ? around[0] : null;
}

/** Os dois cômodos de cada lado de uma passagem (porta ou vão) centrada em (x, y). */
export function roomsAcross(x, y, axis) {
  const n = axis === 'h' ? { x: 0, y: 0.6 } : { x: 0.6, y: 0 };
  return [roomAt(x - n.x, y - n.y), roomAt(x + n.x, y + n.y)];
}

// Zonas de luz: cômodos ligados por vão sem porta acendem juntos (GDD 13.1).
// Ex.: entrada + sala + sala de jantar; quintal + jardim + varanda.
export const LIGHT_ZONE = (() => {
  const zone = new Map(ROOMS.map((r) => [r.id, r.id]));
  const find = (id) => (zone.get(id) === id ? id : find(zone.get(id)));
  for (const o of OPENINGS) {
    const [a, b] =
      o.axis === 'h' ? roomsAcross((o.x0 + o.x1) / 2, o.y, 'h') : roomsAcross(o.x, (o.y0 + o.y1) / 2, 'v');
    if (a && b) zone.set(find(a.id), find(b.id));
  }
  return new Map(ROOMS.map((r) => [r.id, find(r.id)]));
})();

/** Células cobertas por uma porta: [[i, j], ...] */
export function doorCells(door) {
  const ci = Math.round(door.x / CELL_METERS);
  const cj = Math.round(door.y / CELL_METERS);
  const half = Math.floor(DOOR_WIDTH / CELL_METERS / 2);
  const cells = [];
  for (let k = -half; k <= half; k++) {
    cells.push(door.axis === 'h' ? [ci + k, cj] : [ci, cj + k]);
  }
  return cells;
}

function variant(i, j, floor) {
  const [a, b] = FLOORS[floor];
  // Hash simples para variar o piso sem padrão visível
  const h = (i * 73856093) ^ (j * 19349663);
  return (h >>> 0) % 5 === 0 ? b : a;
}

/**
 * Monta a grade de tiles da casa: matriz [linha][coluna] com índices do tileset.
 * Também devolve `kind` por célula: 'floor', 'door', 'wall' ou 'void'.
 */
export function buildGrid() {
  const tiles = [];
  const kind = [];
  const external = [];
  for (let j = 0; j < GRID_H; j++) {
    tiles.push(new Array(GRID_W).fill(T.VOID));
    kind.push(new Array(GRID_W).fill('void'));
    external.push(new Array(GRID_W).fill(false));
  }

  // Pisos: centro da célula estritamente dentro do cômodo
  for (let j = 0; j < GRID_H; j++) {
    for (let i = 0; i < GRID_W; i++) {
      const room = roomAt(i * CELL_METERS, j * CELL_METERS);
      if (!room) continue;
      tiles[j][i] = variant(i, j, room.floor);
      kind[j][i] = 'floor';
      external[j][i] = !!room.external;
    }
  }

  // Passagens abertas
  for (const o of OPENINGS) {
    if (o.axis === 'h') {
      const j = Math.round(o.y / CELL_METERS);
      for (let i = 0; i < GRID_W; i++) {
        const x = i * CELL_METERS;
        if (x > o.x0 && x < o.x1) {
          tiles[j][i] = variant(i, j, o.floor);
          kind[j][i] = 'floor';
        }
      }
    } else {
      const i = Math.round(o.x / CELL_METERS);
      for (let j = 0; j < GRID_H; j++) {
        const y = j * CELL_METERS;
        if (y > o.y0 && y < o.y1) {
          tiles[j][i] = variant(i, j, o.floor);
          kind[j][i] = 'floor';
          const [a, b] = roomsAcross(o.x, y, 'v');
          external[j][i] = !!(a?.external && b?.external);
        }
      }
    }
  }

  // Portas: soleira no chão (a folha da porta é um objeto à parte)
  for (const door of DOORS) {
    for (const [i, j] of doorCells(door)) {
      tiles[j][i] = T.THRESHOLD;
      kind[j][i] = 'door';
    }
  }

  // Paredes: células vazias encostadas (8 vizinhos) em piso ou porta
  const walkable = (i, j) =>
    i >= 0 && j >= 0 && i < GRID_W && j < GRID_H && (kind[j][i] === 'floor' || kind[j][i] === 'door');
  for (let j = 0; j < GRID_H; j++) {
    for (let i = 0; i < GRID_W; i++) {
      if (kind[j][i] !== 'void') continue;
      let near = false;
      for (let dj = -1; dj <= 1 && !near; dj++) {
        for (let di = -1; di <= 1 && !near; di++) near = walkable(i + di, j + dj);
      }
      if (!near) continue;
      kind[j][i] = 'wall';
      // Face da parede: aparece quando há piso logo abaixo (vista na diagonal)
      const below = j + 1 < GRID_H && kind[j + 1][i] === 'floor';
      if (below) tiles[j][i] = external[j + 1][i] ? T.WALL_FACE_OUT : T.WALL_FACE;
      else tiles[j][i] = T.WALL;
    }
  }

  return { tiles, kind };
}
