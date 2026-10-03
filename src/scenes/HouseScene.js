// Casa (GDD 4): mapa, Artur, portas, colisões, câmera, luz e medo.

import Phaser from 'phaser';
import { BALANCE, TOTAL_DAYS } from '../config/balance.js';
import { Player } from '../entities/Player.js';
import { Door } from '../entities/Door.js';
import {
  DOORS,
  FURNITURE,
  GENERATOR_POINT,
  GRID_H,
  GRID_W,
  SPAWN,
  buildGrid,
  roomAt,
} from '../world/houseMap.js';
import { PPM, SOLID_TILES, TILE } from '../world/tiles.js';
import { NightClock } from '../systems/NightClock.js';
import { Fear } from '../systems/Fear.js';
import { Generator } from '../systems/Generator.js';
import { Flashlight } from '../systems/Flashlight.js';
import { Lighting } from '../systems/Lighting.js';
import { Items } from '../systems/Items.js';
import { calmWindow, fearDecayPerSecond, hallucinationRate } from '../systems/formulas.js';
import { glitchCamera } from '../fx/GlitchPipeline.js';
import { debug } from '../debug/debug.js';

const CAMERA_ZOOM = 2; // mostra ~15 m × 8,4 m da casa por vez
const DOOR_RANGE = 1.3; // metros
const ITEM_RANGE = 1.0;
const CHEST_OFFSET = 14; // px acima dos pés: de onde sai a luz da lanterna
const NIGHT_SPEEDS = [1, 10, 60]; // debug: acelera só o relógio da noite

// Falas do Artur (GDD 15), mostradas na caixa de diálogo
const LINES = {
  arrival: { speaker: 'Artur', text: 'Estou exausto... só quero dormir.' },
  clara: { speaker: 'Artur', text: 'Não posso entrar, está trancado.' },
};

export class HouseScene extends Phaser.Scene {
  constructor() {
    super('House');
  }

  create(data) {
    this.clock = new NightClock(data?.day ?? 1);
    this.fear = new Fear(this.clock);
    this.generator = new Generator(this.clock, this.fear, GENERATOR_POINT);
    this.flashlight = new Flashlight();

    this.buildMap();
    this.buildFurniture();
    this.doors = DOORS.map((def) => new Door(this, def));
    this.items = new Items(this, this.clock.night);

    this.player = new Player(this, SPAWN.x * PPM, SPAWN.y * PPM);
    this.physics.add.collider(this.player, this.wallLayer);
    this.physics.add.collider(this.player, this.furniture);
    this.physics.add.collider(
      this.player,
      this.doors.map((d) => d.blocker),
    );

    this.lighting = new Lighting(this, { kind: this.grid.kind, bounds: this.bounds, doors: this.doors });

    const cam = this.cameras.main;
    cam.setZoom(CAMERA_ZOOM);
    // Artur sempre no centro da tela: sem suavização e sem limite nas bordas
    // (perto das bordas aparece o escuro em volta da casa). O deslocamento de 16 px
    // centraliza pelo meio do corpo, já que a origem do sprite fica nos pés.
    cam.startFollow(this.player, true, 1, 1, 0, 16);
    cam.setRoundPixels(true);
    cam.setBackgroundColor('#050506');

    this.hud = this.scene.get('Hud');
    this.hud.dialogue.clear();

    this.input.keyboard.on('keydown-F', () => this.interact());
    this.keyF = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    this.input.on('pointerdown', (pointer) => {
      if (pointer.leftButtonDown() && !this.hud.talking) this.flashlight.toggle(!this.generator.on);
    });

    this.generator.listen('drop', () => cam.shake(180, 0.004));
    this.generator.listen('restore', () => this.flashlight.forceOff());

    this.setupDebugKeys();

    this.time.delayedCall(600, () => this.hud.talk(LINES.arrival));

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      debug.clearGroup('Casa');
      debug.clearGroup('Noite');
      debug.clearGroup('Gerador');
    });
  }

  buildMap() {
    this.grid = buildGrid();
    const map = this.make.tilemap({ data: this.grid.tiles, tileWidth: TILE, tileHeight: TILE });
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
      if (item.id === 'gerador') this.generatorSprite = sprite;
    }
  }

  get chest() {
    return { x: this.player.x / PPM, y: (this.player.y - CHEST_OFFSET) / PPM };
  }

  /** O que dá para usar com F agora: item, gerador (desligado) ou porta mais perto. */
  nearestInteractable() {
    const feet = this.player.feetMeters;
    const dist = (x, y) => Phaser.Math.Distance.Between(feet.x, feet.y, x, y);
    let best = null;
    let bestDist = Infinity;
    const consider = (target, d, range) => {
      if (d < range && d < bestDist) {
        best = target;
        bestDist = d;
      }
    };
    for (const item of this.items.list) {
      consider({ kind: 'item', item, anchor: { x: item.sprite.x, y: item.sprite.y - 14 } }, dist(item.x, item.y), ITEM_RANGE);
    }
    if (!this.generator.on) {
      const s = this.generatorSprite;
      consider(
        { kind: 'generator', anchor: { x: s.x + s.width / 2, y: s.y - 2 } },
        dist(GENERATOR_POINT.x, GENERATOR_POINT.y),
        BALANCE.extra.generatorInteractDistance,
      );
    }
    for (const door of this.doors) {
      if (door.kind === 'front') continue;
      consider(
        { kind: 'door', door, anchor: { x: door.rect.centerX, y: door.rect.top - 2 } },
        dist(door.center.x, door.center.y),
        DOOR_RANGE,
      );
    }
    return best;
  }

  interact() {
    if (this.hud.talking) return;
    const target = this.nearestInteractable();
    if (!target) return;
    if (target.kind === 'item') this.useItem(target.item);
    else if (target.kind === 'door') this.useDoor(target.door);
    // gerador: segurar F, tratado no update
  }

  useDoor(door) {
    if (door.kind === 'clara') {
      this.hud.talk(LINES.clara);
      return;
    }
    if (door.isOpen && door.isObstructedBy(this.player.body.getBounds({}))) return;
    door.toggle();
  }

  useItem(item) {
    this.items.take(item);
    if (item.type === 'medicine') {
      // Remédio: medo cai rápido + glitch rápido na tela
      this.fear.reduce(-BALANCE.fearEvents.medicine);
      glitchCamera(this, this.cameras.main, BALANCE.extra.medicineGlitchSeconds);
    } else {
      this.flashlight.addBattery(BALANCE.batteryPickup / 100);
    }
  }

  update(time, deltaMs) {
    const dt = deltaMs / 1000;
    const nightDt = this.clock.update(dt);
    const cam = this.cameras.main;
    const toScreen = (p) => ({ x: (p.x - cam.worldView.x) * cam.zoom, y: (p.y - cam.worldView.y) * cam.zoom });

    // Artur fica parado enquanto a caixa de diálogo está aberta
    this.player.frozen = this.hud.talking;

    // Lanterna mira no mouse; parado, Artur vira para onde aponta
    const pointer = this.input.activePointer.positionToCamera(cam);
    this.flashlight.angle = Math.atan2(pointer.y - (this.player.y - CHEST_OFFSET), pointer.x - this.player.x);
    if (this.flashlight.on && this.player.body.velocity.lengthSq() === 0) {
      this.player.faceAngle(this.flashlight.angle);
    }

    this.player.update(dt);
    const feet = this.player.feetMeters;

    this.generator.update(nightDt, feet);
    this.fear.update(nightDt, this.generator.on);
    this.flashlight.update(dt);
    if (this.generator.on && this.flashlight.on) this.flashlight.forceOff();

    // Segurar F no gerador
    const target = this.nearestInteractable();
    const atGenerator = target?.kind === 'generator';
    if (atGenerator && this.keyF.isDown && !this.hud.talking) this.generator.hold(dt);
    else this.generator.release();

    this.lighting.update(dt, {
      powerOn: this.generator.on,
      feet,
      chest: this.chest,
      flashlight: this.flashlight,
    });

    // HUD
    this.hud.setFear(this.fear.value);
    this.hud.setStamina(this.player.stamina, this.player.exhausted);
    this.hud.setBattery(this.flashlight.battery, this.flashlight.low);
    this.hud.showPrompt(target ? { ...toScreen(target.anchor), y: toScreen(target.anchor).y - 4 } : null);
    this.hud.showHold(
      atGenerator && this.generator.holdProgress > 0 ? { ...toScreen(target.anchor), y: toScreen(target.anchor).y - 40 } : null,
      this.generator.holdProgress,
    );

    if (debug.enabled) this.publishDebug(target);
  }

  // ---- Debug --------------------------------------------------------------

  publishDebug(target) {
    const feet = this.player.feetMeters;
    const room = roomAt(feet.x, feet.y);
    const { night, t } = this.clock;
    const g = this.generator;
    const min = Math.floor(t / 60);
    const sec = Math.floor(t % 60).toString().padStart(2, '0');

    debug.set('Geral/FPS', Math.round(this.game.loop.actualFps));
    debug.set('Geral/Atalhos', '1–7 dia · R reinicia · T tempo');
    debug.set('Geral/Mais atalhos', 'K derruba gerador · +/− medo · G colisões');

    debug.set('Noite/Dia', `${this.clock.day}`);
    debug.set('Noite/Tempo', `${min}:${sec}  (${this.clock.speed}×)`);
    debug.set(
      'Noite/Fase',
      this.clock.chaos ? `CAOS (faltam ${(night.chaosDuration - t).toFixed(0)} s)` : 'recuperação',
    );
    debug.set('Noite/Medo', `${this.fear.value.toFixed(1)}%  (×${night.fearMultiplier.toFixed(2)})`);
    debug.set(
      'Noite/Queda do medo',
      g.on ? `${fearDecayPerSecond(night, t).toFixed(3)} %/s` : 'parado (escuro)',
    );
    debug.set('Noite/Alucinação', `${hallucinationRate(night, t).toFixed(4)} /s  (etapa 5)`);
    debug.set('Noite/Janela de calma', `${calmWindow(night, t).toFixed(1)} s`);

    debug.set('Gerador/Estado', g.on ? 'ligado' : `DESLIGADO (${g.lastDropReason})`);
    debug.set('Gerador/Artur', `${g.isFar(feet) ? 'longe' : 'perto'} (${g.distanceTo(feet).toFixed(1)} m)`);
    debug.set('Gerador/Risco', `${g.risk.toFixed(5)} /s  (teto ${night.generatorRiskCap})`);
    debug.set('Gerador/Quedas', `${g.drops}${!this.clock.chaos && g.drops === 0 ? ' (queda garantida pendente)' : ''}`);

    debug.set('Casa/Cômodo', room ? room.name : '—');
    debug.set('Casa/Posição', `${feet.x.toFixed(1)} m, ${feet.y.toFixed(1)} m`);
    debug.set('Casa/Estamina', `${Math.round(this.player.stamina * 100)}%${this.player.exhausted ? ' (esgotada)' : ''}`);
    debug.set(
      'Casa/Lanterna',
      `${this.flashlight.on ? 'ligada' : 'desligada'} · bateria ${Math.round(this.flashlight.battery * 100)}%`,
    );
    debug.set('Casa/Itens', `remédios ${this.items.remaining('medicine')} · pilhas ${this.items.remaining('battery')}`);
    debug.set('Casa/Interação', target ? target.kind : '—');
  }

  setupDebugKeys() {
    this.input.keyboard.on('keydown', (event) => {
      if (!debug.enabled) return;
      const n = Number(event.key);
      if (n >= 1 && n <= TOTAL_DAYS) this.scene.restart({ day: n });
      else if (event.key === 'r' || event.key === 'R') this.scene.restart({ day: this.clock.day });
      else if (event.key === 't' || event.key === 'T') {
        const i = NIGHT_SPEEDS.indexOf(this.clock.speed);
        this.clock.speed = NIGHT_SPEEDS[(i + 1) % NIGHT_SPEEDS.length];
      } else if (event.key === 'k' || event.key === 'K') this.generator.drop('debug');
      else if (event.key === '+' || event.key === '=') this.fear.add(10 / this.clock.night.fearMultiplier);
      else if (event.key === '-') this.fear.reduce(10);
      else if (event.key === 'g' || event.key === 'G') this.toggleCollisionDebug();
    });
  }

  toggleCollisionDebug() {
    const world = this.physics.world;
    if (!world.debugGraphic) world.createDebugGraphic().setDepth(2_000_000);
    world.drawDebug = !world.drawDebug;
    world.debugGraphic.setVisible(world.drawDebug);
    world.debugGraphic.clear();
  }
}
