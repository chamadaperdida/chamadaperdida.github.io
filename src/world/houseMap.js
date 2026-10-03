// Mapa da casa (GDD 4.2 e planta-casa.svg).
//
// Tudo em METROS, com a origem no canto superior esquerdo do quintal.
// Conversão da planta: metro = (svg_px − origem) / 28, origem SVG = (40, 70).
// A casa ocupa x 8–39 m e y 0–20 m (31 m × 20 m). Quintal e varanda são externos.
//
// O mapa vira uma grade de células de 0,5 m (1 tile = 16 px). As paredes ficam
// SOBRE as linhas que dividem os cômodos, com 0,5 m de espessura.

import { CELL_METERS, FLOORS, T } from './tiles.js';

export const WORLD = { width: 39, height: 23 }; // metros

// Cômodos e áreas externas: retângulos em metros.
export const ROOMS = [
  { id: 'quartoClara', name: 'Quarto da Clara', x: 8, y: 0, w: 7, h: 6, floor: 'taco' },
  { id: 'banheiroSocial', name: 'Banheiro social', x: 15, y: 0, w: 4, h: 6, floor: 'bathroom' },
  { id: 'entrada', name: 'Entrada', x: 19, y: 0, w: 8, h: 6, floor: 'taco' },
  { id: 'quartoArtur', name: 'Quarto do Artur', x: 27, y: 0, w: 8, h: 6, floor: 'taco' },
  { id: 'banheiroSuite', name: 'Banheiro da suíte', x: 35, y: 0, w: 4, h: 6, floor: 'bathroom' },
  { id: 'corredorCima', name: 'Corredor de cima', x: 8, y: 6, w: 21, h: 2, floor: 'corridor' },
  { id: 'corredorEsquerda', name: 'Corredor da esquerda', x: 8, y: 8, w: 2, h: 12, floor: 'corridor' },
  { id: 'hall', name: 'Hall', x: 27, y: 8, w: 2, h: 6, floor: 'corridor' },
  { id: 'sala', name: 'Sala', x: 10, y: 8, w: 17, h: 6, floor: 'taco' },
  { id: 'cozinha', name: 'Cozinha', x: 10, y: 14, w: 19, h: 6, floor: 'kitchen' },
  { id: 'escritorio', name: 'Escritório', x: 29, y: 6, w: 10, h: 14, floor: 'taco' },
  { id: 'quintal', name: 'Quintal', x: 0, y: 12, w: 8, h: 11, floor: 'mud', external: true },
  { id: 'varanda', name: 'Varanda externa', x: 8, y: 20, w: 31, h: 3, floor: 'concrete', external: true },
];

// Passagens abertas (sem porta) sobre uma linha de parede.
// axis 'h' = parede horizontal (linha y, de x0 a x1); 'v' = parede vertical (linha x, de y0 a y1).
export const OPENINGS = [
  { axis: 'h', y: 8, x0: 8, x1: 10, floor: 'corridor' }, // corredor de cima ↔ corredor da esquerda
  { axis: 'h', y: 8, x0: 27, x1: 29, floor: 'corridor' }, // corredor de cima ↔ hall
  { axis: 'v', x: 8, y0: 20, y1: 23, floor: 'mud' }, // quintal ↔ varanda
];

// Portas: 1,5 m de largura (3 células), centradas em (x, y) sobre a linha da parede.
//   kind: 'normal' abre/fecha · 'clara' sempre fechada · 'front' porta da frente (não abre)
export const DOORS = [
  { id: 'clara', axis: 'h', x: 11.5, y: 6, kind: 'clara', open: false },
  { id: 'banheiroSocial', axis: 'h', x: 17, y: 6, kind: 'normal', open: true },
  { id: 'entrada', axis: 'h', x: 23, y: 6, kind: 'normal', open: true },
  { id: 'frente', axis: 'h', x: 23, y: 0, kind: 'front', open: false },
  { id: 'quartoArtur', axis: 'h', x: 28, y: 6, kind: 'normal', open: true },
  { id: 'suite', axis: 'v', x: 35, y: 3, kind: 'normal', open: true },
  { id: 'corredorSala', axis: 'h', x: 23, y: 8, kind: 'normal', open: true },
  { id: 'salaHall', axis: 'v', x: 27, y: 11, kind: 'normal', open: true },
  { id: 'hallEscritorio', axis: 'v', x: 29, y: 11, kind: 'normal', open: true },
  { id: 'salaCozinha', axis: 'h', x: 18, y: 14, kind: 'normal', open: true },
  { id: 'corredorCozinha', axis: 'v', x: 10, y: 17, kind: 'normal', open: true },
  { id: 'cozinhaEscritorio', axis: 'v', x: 29, y: 17, kind: 'normal', open: true },
  { id: 'fundos', axis: 'v', x: 8, y: 18, kind: 'normal', open: false },
  { id: 'escritorioVaranda', axis: 'h', x: 34, y: 20, kind: 'normal', open: false },
];

export const DOOR_WIDTH = 1.5; // metros

// Móveis com colisão. (x, y) = canto superior esquerdo em metros.
// `sprite` é o nome do quadro no atlas props.
export const FURNITURE = [
  // Quarto do Artur
  { id: 'cama', sprite: 'bed', x: 30.5, y: 0.25, room: 'quartoArtur' },
  { id: 'criadoMudo', sprite: 'nightstand', x: 32.1, y: 0.25, room: 'quartoArtur' },
  // Sala
  { id: 'telefoneFixo', sprite: 'phone-table', x: 11.2, y: 8.25, room: 'sala' },
  { id: 'tv', sprite: 'tv', x: 13, y: 8.25, room: 'sala' },
  { id: 'estante', sprite: 'shelf', x: 16, y: 8.25, room: 'sala' },
  { id: 'sofa', sprite: 'sofa', x: 12.5, y: 10.6, room: 'sala' },
  // Cozinha
  { id: 'geladeira', sprite: 'fridge', x: 11, y: 14.25, room: 'cozinha' },
  { id: 'pia', sprite: 'kitchen-counter', x: 20, y: 14.25, room: 'cozinha' },
  // Escritório
  { id: 'mesa', sprite: 'desk', x: 34.5, y: 6.5, room: 'escritorio' },
  { id: 'farda', sprite: 'uniform', x: 37, y: 6.25, room: 'escritorio' },
  { id: 'caixa1', sprite: 'box', x: 38, y: 8, room: 'escritorio' },
  { id: 'caixa2', sprite: 'box', x: 37.9, y: 8.6, room: 'escritorio' },
  { id: 'caixa3', sprite: 'box', x: 30, y: 18.9, room: 'escritorio' },
  // Banheiros
  { id: 'piaSocial', sprite: 'bathroom-sink', x: 16.75, y: 0.25, room: 'banheiroSocial' },
  { id: 'piaSuite', sprite: 'bathroom-sink', x: 36.5, y: 0.25, room: 'banheiroSuite' },
  { id: 'armarioSuite', sprite: 'cabinet', x: 37.5, y: 0.25, room: 'banheiroSuite' },
  // Quintal
  { id: 'gerador', sprite: 'generator', x: 3.25, y: 15, room: 'quintal' },
];

// Onde Artur aparece ao chegar em casa (pela porta da frente).
export const SPAWN = { x: 23, y: 1.5 };

// ---------------------------------------------------------------------------
// Grade
// ---------------------------------------------------------------------------
// Célula (i, j) tem centro em (i·0,5 m, j·0,5 m). Assim as linhas inteiras e meias
// da planta caem no centro de uma célula, que vira parede.

export const GRID_W = Math.round(WORLD.width / CELL_METERS) + 1;
export const GRID_H = Math.round(WORLD.height / CELL_METERS) + 1;

export function roomAt(xm, ym) {
  return ROOMS.find((r) => xm > r.x && xm < r.x + r.w && ym > r.y && ym < r.y + r.h) ?? null;
}

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
          external[j][i] = true;
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
