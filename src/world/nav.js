// Navegação dos monstros pela casa: grade de 0,5 m (a mesma do mapa), A* em 4 direções.
// Paredes e móveis bloqueiam. Portas normais fechadas são atravessáveis (o monstro abre,
// com atraso); portas trancadas, a do quarto da Clara e a da frente, não.

import { CELL_METERS, PPM } from './tiles.js';

const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];
const CLOSED_DOOR_COST = 4; // prefere caminhos com portas abertas
// Meia caixa do corpo dos monstros (px, com folga): uma célula só é livre se essa caixa,
// centrada nela, não encosta em nenhum móvel (o ponto sozinho deixava passar células
// meio cobertas, e o monstro empacava no canto do móvel)
const BODY_HALF_W = 7;
const BODY_HALF_H = 5;

export class NavGrid {
  /**
   * @param kind           grade de tipos do mapa ('floor', 'door', 'wall', 'void')
   * @param furnitureRects retângulos de colisão dos móveis (px)
   * @param doorByCell     Map "i,j" → Door
   */
  constructor(kind, furnitureRects, doorByCell) {
    this.h = kind.length;
    this.w = kind[0].length;
    this.doorByCell = doorByCell;
    this.walkable = kind.map((row, j) =>
      row.map((k, i) => {
        if (k !== 'floor' && k !== 'door') return false;
        const px = i * CELL_METERS * PPM;
        const py = j * CELL_METERS * PPM;
        return !furnitureRects.some(
          (r) =>
            px + BODY_HALF_W > r.x && px - BODY_HALF_W < r.right && py + BODY_HALF_H > r.y && py - BODY_HALF_H < r.bottom,
        );
      }),
    );
  }

  cellOf(xm, ym) {
    return [Math.round(xm / CELL_METERS), Math.round(ym / CELL_METERS)];
  }

  center(i, j) {
    return { x: i * CELL_METERS, y: j * CELL_METERS };
  }

  doorAt(i, j) {
    return this.doorByCell.get(`${i},${j}`) ?? null;
  }

  passable(i, j) {
    if (i < 0 || j < 0 || i >= this.w || j >= this.h || !this.walkable[j][i]) return false;
    const door = this.doorAt(i, j);
    if (door && (door.kind !== 'normal' || door.locked) && !door.isOpen) return false;
    return true;
  }

  #cost(i, j) {
    const door = this.doorAt(i, j);
    return door && !door.isOpen ? CLOSED_DOOR_COST : 1;
  }

  /** Célula atravessável mais perto (para quando o ponto cai em cima de um móvel). */
  nearestPassable(i, j) {
    if (this.passable(i, j)) return [i, j];
    for (let r = 1; r < 4; r++) {
      for (let dj = -r; dj <= r; dj++) {
        for (let di = -r; di <= r; di++) {
          if (this.passable(i + di, j + dj)) return [i + di, j + dj];
        }
      }
    }
    return null;
  }

  /** Caminho de `from` até `to` (metros). Devolve lista de pontos (m) ou null. */
  findPath(from, to) {
    const start = this.nearestPassable(...this.cellOf(from.x, from.y));
    const goal = this.nearestPassable(...this.cellOf(to.x, to.y));
    if (!start || !goal) return null;
    const key = (i, j) => j * this.w + i;
    const goalKey = key(...goal);
    const g = new Map([[key(...start), 0]]);
    const came = new Map();
    const heap = new MinHeap();
    const hdist = (i, j) => Math.abs(i - goal[0]) + Math.abs(j - goal[1]);
    heap.push(hdist(...start), start);
    const closed = new Set();
    while (heap.size) {
      const [ci, cj] = heap.pop();
      const ck = key(ci, cj);
      if (ck === goalKey) break;
      if (closed.has(ck)) continue;
      closed.add(ck);
      for (const [di, dj] of DIRS) {
        const ni = ci + di;
        const nj = cj + dj;
        if (!this.passable(ni, nj)) continue;
        const nk = key(ni, nj);
        const cost = g.get(ck) + this.#cost(ni, nj);
        if (cost < (g.get(nk) ?? Infinity)) {
          g.set(nk, cost);
          came.set(nk, ck);
          heap.push(cost + hdist(ni, nj), [ni, nj]);
        }
      }
    }
    if (!g.has(goalKey)) return null;
    const path = [];
    let k = goalKey;
    while (k !== undefined) {
      path.push(this.center(k % this.w, Math.floor(k / this.w)));
      k = came.get(k);
    }
    return path.reverse();
  }

  /** Distância em passos (células) de `from` até todas as células alcançáveis. */
  distancesFrom(from, maxSteps = 80) {
    const start = this.nearestPassable(...this.cellOf(from.x, from.y));
    const dist = new Map();
    if (!start) return dist;
    const key = (i, j) => j * this.w + i;
    const queue = [start];
    dist.set(key(...start), 0);
    while (queue.length) {
      const [ci, cj] = queue.shift();
      const d = dist.get(key(ci, cj));
      if (d >= maxSteps) continue;
      for (const [di, dj] of DIRS) {
        const ni = ci + di;
        const nj = cj + dj;
        const nk = key(ni, nj);
        if (dist.has(nk) || !this.passable(ni, nj)) continue;
        dist.set(nk, d + 1);
        queue.push([ni, nj]);
      }
    }
    return dist;
  }
}

class MinHeap {
  constructor() {
    this.items = [];
  }

  get size() {
    return this.items.length;
  }

  push(priority, value) {
    const a = this.items;
    a.push([priority, value]);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p][0] <= a[i][0]) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }

  pop() {
    const a = this.items;
    const top = a[0];
    const last = a.pop();
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && a[l][0] < a[m][0]) m = l;
        if (r < a.length && a[r][0] < a[m][0]) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return top[1];
  }
}
