// Iluminação da casa (GDD 13.1 — opção 2).
//
// Luz acesa: só o cômodo onde Artur está fica iluminado (amarelado e fraco). Os outros
//            ficam quase pretos, com a luz vazando pelas portas abertas.
// Luz apagada: tudo escuro; só o cone da lanterna, que para nas paredes e portas fechadas.
//
// Funciona como um "mapa de luz" do tamanho do mundo, desenhado por cima de tudo com
// mistura MULTIPLY: branco = cor normal, preto = escuridão.

import Phaser from 'phaser';
import { BALANCE } from '../config/balance.js';
import { DOORS, LIGHT_ZONE, ROOMS, doorCells, roomAt, roomsAcross } from '../world/houseMap.js';
import { CELL_METERS, PPM } from '../world/tiles.js';

const COLORS = {
  ambientOn: 0x0b0b10, // outros cômodos com a luz acesa: quase pretos
  ambientOff: 0x020203, // luz apagada
  room: 0xb09a74, // luz amarelada e fraca
  flashlight: 0xfff0d2,
  halo: 0x2a2a34, // um mínimo em volta do Artur no escuro, para ele não sumir
};

const RAY_STEP = 0.1; // metros
const WALL_LIT_DEPTH = 0.3; // metros (a parede tem 0,5 m)
const FADE_SPEED = 5; // quão rápido um cômodo acende/apaga ao entrar/sair (por s)

export class Lighting {
  constructor(scene, { kind, bounds, doors }) {
    this.scene = scene;
    this.kind = kind;
    this.bounds = bounds;
    this.doorByCell = new Map();
    doors.forEach((door, index) => {
      for (const [i, j] of doorCells(DOORS[index])) this.doorByCell.set(`${i},${j}`, door);
    });

    // Passagens por onde a luz vaza para outra zona: só portas (quando abertas).
    // Vãos sem porta ligam cômodos da mesma zona, que já acendem juntos.
    this.portals = doors.map((door) => ({ x: door.def.x, y: door.def.y, axis: door.axis, door }));

    this.brightness = new Map(ROOMS.map((r) => [r.id, 0]));
    this.currentRoom = null;
    this.powerOn = true;

    this.rt = scene.add
      .renderTexture(bounds.x, bounds.y, bounds.width, bounds.height)
      .setOrigin(0)
      .setDepth(1_000_000)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);
    this.g = scene.make.graphics({}, false);
  }

  /** Célula bloqueia luz? Paredes, vazio e portas fechadas. */
  solidAt(xm, ym) {
    const i = Math.round(xm / CELL_METERS);
    const j = Math.round(ym / CELL_METERS);
    const row = this.kind[j];
    if (!row || row[i] === undefined) return true;
    const k = row[i];
    if (k === 'wall' || k === 'void') return true;
    if (k === 'door') return !this.doorByCell.get(`${i},${j}`)?.isOpen;
    return false;
  }

  castRay(ox, oy, angle, maxDist) {
    const dx = Math.cos(angle) * RAY_STEP;
    const dy = Math.sin(angle) * RAY_STEP;
    let x = ox;
    let y = oy;
    for (let d = 0; d < maxDist; d += RAY_STEP) {
      x += dx;
      y += dy;
      // Entra um pouco na parede, para a face onde a luz bate ficar iluminada
      if (this.solidAt(x, y)) return Math.min(maxDist, d + WALL_LIT_DEPTH);
    }
    return maxDist;
  }

  /**
   * Cone de luz com sombra nas paredes, em faixas (luz "em degraus", combina com pixel art).
   * origem/alcance em metros, ângulos em radianos.
   */
  drawCone(origin, angle, halfAngle, range, color, bands, alpha) {
    const rays = Math.max(12, Math.ceil((halfAngle * 2 * 180) / Math.PI / 1.5));
    const dists = [];
    for (let r = 0; r <= rays; r++) {
      const a = angle - halfAngle + (2 * halfAngle * r) / rays;
      dists.push([a, this.castRay(origin.x, origin.y, a, range)]);
    }
    const ox = origin.x * PPM;
    const oy = origin.y * PPM;
    for (let b = 1; b <= bands; b++) {
      const limit = (range * b) / bands;
      const points = [{ x: ox, y: oy }];
      for (const [a, d] of dists) {
        const len = Math.min(d, limit) * PPM;
        points.push({ x: ox + Math.cos(a) * len, y: oy + Math.sin(a) * len });
      }
      this.g.fillStyle(color, alpha);
      this.g.fillPoints(points, true);
    }
  }

  drawCircle(center, radius, color, bands, alpha) {
    for (let b = 1; b <= bands; b++) {
      this.g.fillStyle(color, alpha);
      this.g.fillCircle(center.x * PPM, center.y * PPM, (radius * b * PPM) / bands);
    }
  }

  /**
   * @param feet  posição dos pés do Artur (m) — define o cômodo atual
   * @param chest origem da lanterna (m)
   * @param flashlight sistema da lanterna
   * @param zoneFactor brilho da zona atual (alucinação de luz piscando), 1 = normal
   */
  update(dt, { powerOn, feet, chest, flashlight, zoneFactor = 1 }) {
    this.zoneFactor = zoneFactor;
    this.powerOn = powerOn;
    const room = roomAt(feet.x, feet.y);
    if (room) this.currentRoom = room; // no vão de uma porta, mantém o cômodo anterior

    // Brilho de cada cômodo vai suavemente até o alvo: acende a zona inteira do cômodo atual
    const currentZone = this.currentRoom && LIGHT_ZONE.get(this.currentRoom.id);
    for (const r of ROOMS) {
      const target = powerOn && LIGHT_ZONE.get(r.id) === currentZone ? 1 : 0;
      const b = this.brightness.get(r.id);
      this.brightness.set(r.id, b + Phaser.Math.Clamp(target - b, -FADE_SPEED * dt, FADE_SPEED * dt));
    }

    const g = this.g;
    g.clear();

    for (const r of ROOMS) {
      const b = this.brightness.get(r.id) * (LIGHT_ZONE.get(r.id) === currentZone ? zoneFactor : 1);
      if (b <= 0.01) continue;
      g.fillStyle(COLORS.room, b);
      // Inclui meia parede em volta, para as paredes do cômodo também acenderem
      g.fillRect((r.x - 0.25) * PPM, (r.y - 0.25) * PPM, (r.w + 0.5) * PPM, (r.h + 0.5) * PPM);
    }

    if (powerOn) this.drawLeaks();

    if (!powerOn) this.drawCircle(chest, 1.1, COLORS.halo, 3, 0.35);

    if (flashlight.shining) {
      const e = BALANCE.extra;
      const half = Phaser.Math.DegToRad(e.flashlightAngle / 2);
      this.drawCone(chest, flashlight.angle, half, e.flashlightRange, COLORS.flashlight, 6, 0.2);
      this.drawCone(chest, flashlight.angle, half * 0.45, e.flashlightRange * 0.85, COLORS.flashlight, 4, 0.12);
    }

    this.rt.clear();
    this.rt.fill(powerOn ? COLORS.ambientOn : COLORS.ambientOff, 1);
    this.rt.draw(g, -this.bounds.x, -this.bounds.y);
  }

  /** Luz da zona atual vazando pelas portas abertas para as outras zonas. */
  drawLeaks() {
    const current = this.currentRoom;
    if (!current) return;
    const zone = LIGHT_ZONE.get(current.id);
    const b = this.brightness.get(current.id) * this.zoneFactor;
    for (const p of this.portals) {
      if (!p.door.isOpen) continue;
      const n = p.axis === 'h' ? { x: 0, y: 1 } : { x: 1, y: 0 };
      const [a, c] = roomsAcross(p.x, p.y, p.axis);
      if (!a || !c) continue;
      const za = LIGHT_ZONE.get(a.id);
      const zc = LIGHT_ZONE.get(c.id);
      let dir;
      if (za === zone && zc !== zone) dir = n;
      else if (zc === zone && za !== zone) dir = { x: -n.x, y: -n.y };
      else continue;
      const origin = { x: p.x - dir.x * 0.3, y: p.y - dir.y * 0.3 };
      this.drawCone(origin, Math.atan2(dir.y, dir.x), Phaser.Math.DegToRad(65), 3.2, COLORS.room, 4, 0.16 * b);
    }
  }
}
