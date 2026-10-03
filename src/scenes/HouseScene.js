// Casa (GDD 4): mapa, Artur, portas, colisões e câmera de cima na diagonal.

import Phaser from 'phaser';
import { Player } from '../entities/Player.js';
import { Door } from '../entities/Door.js';
import { DOORS, FURNITURE, GRID_H, GRID_W, SPAWN, buildGrid, roomAt } from '../world/houseMap.js';
import { PPM, SOLID_TILES, TILE } from '../world/tiles.js';
import { NightBench } from '../debug/NightBench.js';
import { debug } from '../debug/debug.js';

const CAMERA_ZOOM = 2; // mostra ~15 m × 8,4 m da casa por vez
const INTERACT_RANGE = 1.3; // metros

const LINES = {
  arrival: 'Estou exausto... só quero dormir.',
  clara: '...aí não.',
};

export class HouseScene extends Phaser.Scene {
  constructor() {
    super('House');
  }

  create() {
    this.buildMap();
    this.buildFurniture();
    this.doors = DOORS.map((def) => new Door(this, def));

    this.player = new Player(this, SPAWN.x * PPM, SPAWN.y * PPM);
    this.physics.add.collider(this.player, this.wallLayer);
    this.physics.add.collider(this.player, this.furniture);
    this.physics.add.collider(
      this.player,
      this.doors.map((d) => d.blocker),
    );

    const cam = this.cameras.main;
    cam.setZoom(CAMERA_ZOOM);
    cam.setBounds(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height);
    cam.startFollow(this.player, true, 0.15, 0.15, 0, 16);
    cam.setRoundPixels(true);
    cam.setBackgroundColor('#050506');

    this.scene.launch('Hud');
    this.hud = this.scene.get('Hud');

    this.input.keyboard.on('keydown-F', () => this.interact());

    this.bench = new NightBench(this);
    this.setupCollisionDebug();

    this.time.delayedCall(600, () => this.hud.say(LINES.arrival, 3.5));

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.bench.destroy();
      debug.clearGroup('Casa');
    });
  }

  buildMap() {
    const { tiles } = buildGrid();
    const map = this.make.tilemap({ data: tiles, tileWidth: TILE, tileHeight: TILE });
    const tileset = map.addTilesetImage('tiles', 'tiles', TILE, TILE, 0, 0);
    // O centro da célula (i, j) fica em (i·16, j·16): a camada começa meio tile antes.
    this.wallLayer = map.createLayer(0, tileset, -TILE / 2, -TILE / 2);
    this.wallLayer.setCollision(SOLID_TILES);
    this.wallLayer.setDepth(-1000);
    this.bounds = new Phaser.Geom.Rectangle(-TILE / 2, -TILE / 2, GRID_W * TILE, GRID_H * TILE);
    this.physics.world.setBounds(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height);
  }

  buildFurniture() {
    this.furniture = this.physics.add.staticGroup();
    for (const item of FURNITURE) {
      const sprite = this.add.image(item.x * PPM, item.y * PPM, 'props', item.sprite).setOrigin(0);
      const { width: w, height: h } = sprite;
      // Colisão só na parte de baixo: dá para passar "atrás" do topo dos móveis altos
      const top = h > 24 ? Math.round(h * 0.35) : 2;
      const body = this.add.zone(sprite.x + w / 2, sprite.y + top + (h - top) / 2, w - 2, h - top - 1);
      this.furniture.add(body);
      sprite.setDepth(sprite.y + h - 4);
    }
  }

  /** Porta ou objeto mais perto dos pés do Artur, dentro do alcance. */
  nearestInteractable() {
    const feet = this.player.feetMeters;
    let best = null;
    let bestDist = INTERACT_RANGE;
    for (const door of this.doors) {
      if (door.kind === 'front') continue;
      const d = Phaser.Math.Distance.Between(feet.x, feet.y, door.center.x, door.center.y);
      if (d < bestDist) {
        best = door;
        bestDist = d;
      }
    }
    return best;
  }

  interact() {
    const target = this.nearestInteractable();
    if (!target) return;
    if (target.kind === 'clara') {
      this.hud.say(LINES.clara, 2.5);
      return;
    }
    if (target.isOpen && target.isObstructedBy(this.player.body.getBounds({}))) return;
    target.toggle();
  }

  update(_time, deltaMs) {
    const dt = deltaMs / 1000;
    this.player.update(dt);
    this.hud.setStamina(this.player.stamina, this.player.exhausted);

    const target = this.nearestInteractable();
    if (target) {
      // Mundo → tela (o HUD não usa zoom)
      const cam = this.cameras.main;
      this.hud.showPrompt({
        x: (target.rect.centerX - cam.worldView.x) * cam.zoom,
        y: (target.rect.top - cam.worldView.y) * cam.zoom - 4,
      });
    } else {
      this.hud.showPrompt(null);
    }

    this.bench.update(dt);
    if (debug.enabled) this.publishDebug(target);
  }

  publishDebug(target) {
    const feet = this.player.feetMeters;
    const room = roomAt(feet.x, feet.y);
    const speed = this.player.body.velocity.length() / PPM;
    debug.set('Geral/FPS', Math.round(this.game.loop.actualFps));
    debug.set('Geral/Atalhos', 'G mostra colisões');
    debug.set('Casa/Posição', `${feet.x.toFixed(1)} m, ${feet.y.toFixed(1)} m`);
    debug.set('Casa/Cômodo', room ? room.name : '—');
    debug.set('Casa/Velocidade', `${speed.toFixed(2)} m/s${this.player.running ? ' (correndo)' : ''}`);
    debug.set(
      'Casa/Estamina',
      `${Math.round(this.player.stamina * 100)}%${this.player.exhausted ? ' (esgotada)' : ''}`,
    );
    debug.set('Casa/Portas abertas', `${this.doors.filter((d) => d.isOpen).length} de ${this.doors.length}`);
    debug.set('Casa/Interação', target ? `porta ${target.id}` : '—');
  }

  setupCollisionDebug() {
    this.input.keyboard.on('keydown-G', () => {
      if (!debug.enabled) return;
      const world = this.physics.world;
      if (!world.debugGraphic) world.createDebugGraphic().setDepth(100000);
      world.drawDebug = !world.drawDebug;
      world.debugGraphic.setVisible(world.drawDebug);
      world.debugGraphic.clear();
    });
  }
}
