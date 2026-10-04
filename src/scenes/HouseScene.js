// Casa (GDD 4): mapa, Artur, portas, colisões, câmera, luz, medo, alucinações e sono.

import Phaser from 'phaser';
import { BALANCE, TOTAL_DAYS } from '../config/balance.js';
import { Player } from '../entities/Player.js';
import { Door } from '../entities/Door.js';
import {
  BED_POINT,
  DOORS,
  FURNITURE,
  GENERATOR_POINT,
  GRID_H,
  GRID_W,
  LIGHT_ZONE,
  SPAWN,
  buildGrid,
  roomAt,
} from '../world/houseMap.js';
import { CELL_METERS, PPM, SOLID_TILES, TILE } from '../world/tiles.js';
import { NightClock } from '../systems/NightClock.js';
import { Fear } from '../systems/Fear.js';
import { Generator } from '../systems/Generator.js';
import { Flashlight } from '../systems/Flashlight.js';
import { Lighting } from '../systems/Lighting.js';
import { Items } from '../systems/Items.js';
import { HALLUCINATION_KINDS, HallucinationDirector } from '../systems/HallucinationDirector.js';
import { BEDROOM_DOOR_ID, BEDROOM_LOCKED_FROM_DAY, BEDROOM_ROOMS, LOCKED_DOOR_LINE } from '../systems/BedroomEvent.js';
import { FlickerHallucination } from '../hallucinations/Flicker.js';
import { HelenaFlickerHallucination } from '../hallucinations/HelenaFlicker.js';
import { BalloonHallucination } from '../hallucinations/Balloon.js';
import { BloodPoolHallucination } from '../hallucinations/BloodPool.js';
import { ShadowHallucination } from '../hallucinations/Shadow.js';
import { FakeStepsHallucination } from '../hallucinations/FakeSteps.js';
import { TvHallucination } from '../hallucinations/Tv.js';
import { LandlineHallucination } from '../hallucinations/Landline.js';
import { daysLeftText } from './TransitionScene.js';
import { NavGrid } from '../world/nav.js';
import { MONSTER_KINDS, MonsterDirector } from '../systems/MonsterDirector.js';
import { fearDecayPerSecond, hallucinationGap } from '../systems/formulas.js';
import { glitchCamera } from '../fx/GlitchPipeline.js';
import { sfx } from '../audio/Sfx.js';
import { debug } from '../debug/debug.js';

const CAMERA_ZOOM = 2; // mostra ~15 m × 8,4 m da casa por vez
const DOOR_RANGE = 1.3; // metros
const ITEM_RANGE = 1.0;
const BED_RANGE = 1.4;
const CHEST_OFFSET = 14; // px acima dos pés: de onde sai a luz da lanterna
const NIGHT_SPEEDS = [1, 10, 60]; // debug: acelera só o relógio da noite
const HEARTBEAT_FEAR = 8; // medo que sobe de uma vez a partir disto: som de coração (GDD 5)

const HALLUCINATIONS = {
  flicker: FlickerHallucination,
  flickerHelena: HelenaFlickerHallucination,
  balloon: BalloonHallucination,
  bloodPool: BloodPoolHallucination,
  shadow: ShadowHallucination,
  fakeSteps: FakeStepsHallucination,
  tv: TvHallucination,
  landline: LandlineHallucination,
};

// Falas do Artur (GDD 15), mostradas na caixa de diálogo
const say = (text) => ({ speaker: 'Artur', text });
const LINES = {
  arrival: say('Estou exausto... só quero dormir.'),
  clara: say('Não posso entrar, está trancado.'),
  cantSleep: say('Não consigo dormir agora, estou com medo.'),
  sleepDark: say('Está tudo escuro... primeiro o gerador.'),
  lockedDoor: say(LOCKED_DOOR_LINE),
  foundKey: say('Achei.'),
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
    this.director = new HallucinationDirector(
      this.clock,
      this.fear,
      (kind, opts) => new HALLUCINATIONS[kind](this.hallucinationCtx, opts),
      (kind, ctx) => this.hallucinationAvailable(kind, ctx),
    );
    this.sleep = null; // sequência de sono em andamento
    this.dead = false; // a cena é reaproveitada a cada noite: zera o estado
    this.arrived = false; // fala de chegada já fechada
    this.hasKey = false;
    this.frameCtx = { lightsOn: true, blocked: false, playerMoving: false, playerVelocity: new Phaser.Math.Vector2() };

    this.buildMap();
    this.buildFurniture();
    this.doors = DOORS.map((def) => new Door(this, def));
    this.bedroomDoor = this.doors.find((d) => d.id === BEDROOM_DOOR_ID);
    this.items = new Items(this, this.clock.night, this.furnitureById);
    if (this.clock.day >= BEDROOM_LOCKED_FROM_DAY) {
      // Noites 5–7: o quarto já está trancado; a chave está em algum lugar fora dele
      this.bedroomDoor.lock();
      this.items.place('key', 1, BEDROOM_ROOMS);
    }

    this.player = new Player(this, SPAWN.x * PPM, SPAWN.y * PPM);
    this.physics.add.collider(this.player, this.wallLayer);
    this.physics.add.collider(this.player, this.furniture);
    this.physics.add.collider(
      this.player,
      this.doors.map((d) => d.blocker),
    );

    this.lighting = new Lighting(this, { kind: this.grid.kind, bounds: this.bounds, doors: this.doors });
    this.nav = new NavGrid(this.grid.kind, this.furnitureRects, this.lighting.doorByCell);
    this.monsters = new MonsterDirector(this.createMonsterCtx(), this.clock, this.fear);
    this.godMode = false; // debug: monstros não matam
    this.chaseSound = null;
    this.shakeIn = 0;

    const cam = this.cameras.main;
    cam.setZoom(CAMERA_ZOOM);
    // Artur sempre no centro da tela: sem suavização e sem limite nas bordas
    // (perto das bordas aparece o escuro em volta da casa). O deslocamento de 16 px
    // centraliza pelo meio do corpo, já que a origem do sprite fica nos pés.
    cam.startFollow(this.player, true, 1, 1, 0, 16);
    cam.setRoundPixels(true);
    cam.setBackgroundColor('#050506');

    this.hud = this.scene.get('Hud');
    this.hud.dialogue?.clear();
    this.hud.clearFade(0);
    this.scene.setVisible(true, 'Hud');

    this.hallucinationCtx = {
      scene: this,
      fear: this.fear,
      sfx,
      hud: this.hud,
      player: this.player,
      feet: () => this.player.feetMeters,
      onScreen: (px, py, margin = 0) => {
        const v = cam.worldView;
        return px > v.x - margin && px < v.right + margin && py > v.y - margin && py < v.bottom + margin;
      },
      findSpot: (min, max, opts) => this.findSpot(min, max, opts),
      findShadowDoor: () => this.findShadowDoor(),
      // Ponto (m) está iluminado? = na zona de luz do Artur, com o gerador ligado
      isLit: (xm, ym) => {
        const r = roomAt(xm, ym);
        const here = this.lighting.currentRoom;
        return !!(r && here && this.generator.on && LIGHT_ZONE.get(r.id) === LIGHT_ZONE.get(here.id));
      },
      furniture: (id) => this.furnitureById.get(id).sprite,
    };

    this.input.keyboard.on('keydown-F', () => this.interact());
    this.keyF = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    this.input.on('pointerdown', (pointer) => {
      if (pointer.leftButtonDown() && !this.hud.talking && !this.sleep) this.flashlight.toggle(!this.generator.on);
    });

    this.generator.listen('drop', () => cam.shake(180, 0.004));
    this.generator.listen('restore', () => this.flashlight.forceOff());
    this.fear.onIncrease((amount) => {
      if (amount >= HEARTBEAT_FEAR) sfx.heartbeat(2);
    });

    this.setupDebugKeys();

    // Chegada: a fala. Ao fechar, a noite começa (provisório: na etapa 8 a noite começa
    // ao ler a lista na geladeira).
    this.time.delayedCall(600, () =>
      this.hud.talk(LINES.arrival).then(() => {
        this.arrived = true;
        this.startNight();
      }),
    );

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.director.active?.end();
      this.monsters.endAll();
      this.chaseSound?.stop();
      this.hud.setChase?.(false);
      debug.clearGroup('Casa');
      debug.clearGroup('Noite');
      debug.clearGroup('Gerador');
      debug.clearGroup('Monstros');
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
    this.furnitureById = new Map();
    const rects = [];
    for (const item of FURNITURE) {
      const sprite = this.add.image(item.x * PPM, item.y * PPM, 'props', item.sprite).setOrigin(0);
      const { width: w, height: h } = sprite;
      sprite.setDepth(sprite.y + h - 4);
      this.furnitureById.set(item.id, { sprite, def: item });
      if (item.id === 'gerador') this.generatorSprite = sprite;
      if (item.id === 'cama') this.bedSprite = sprite;
      // Colisão no móvel inteiro (menos o contorno de 1 px)
      rects.push(new Phaser.Geom.Rectangle(sprite.x + 1, sprite.y + 1, w - 2, h - 2));
    }
    this.closeGaps(rects);
    this.furnitureRects = rects;
    for (const r of rects) this.furniture.add(this.add.zone(r.centerX, r.centerY, r.width, r.height));
  }

  /**
   * Fecha vãos menores que o Artur entre móveis e paredes (ou entre dois móveis).
   * Sem isso, a física "espreme" o corpo dele por frestas apertando diagonais.
   */
  closeGaps(rects) {
    const MAX_GAP = 14; // px — o corpo do Artur tem 10×6
    const solid = (x, y) => {
      const k = this.grid.kind[Math.round(y / TILE)]?.[Math.round(x / TILE)];
      return k === 'wall' || k === 'void';
    };
    const hitsFurniture = (r, x, y) => rects.some((o) => o !== r && o.contains(x, y));
    const blocked = (r, x, y) => solid(x, y) || hitsFurniture(r, x, y);
    for (const r of rects) {
      const xs = [r.left + 1, r.centerX, r.right - 1];
      const ys = [r.top + 1, r.centerY, r.bottom - 1];
      for (let d = 1; d <= MAX_GAP; d++) {
        if (xs.some((x) => blocked(r, x, r.top - d))) {
          r.y -= d - 1;
          r.height += d - 1;
          break;
        }
      }
      for (let d = 1; d <= MAX_GAP; d++) {
        if (xs.some((x) => blocked(r, x, r.bottom + d))) {
          r.height += d - 1;
          break;
        }
      }
      for (let d = 1; d <= MAX_GAP; d++) {
        if (ys.some((y) => blocked(r, r.left - d, y))) {
          r.x -= d - 1;
          r.width += d - 1;
          break;
        }
      }
      for (let d = 1; d <= MAX_GAP; d++) {
        if (ys.some((y) => blocked(r, r.right + d, y))) {
          r.width += d - 1;
          break;
        }
      }
    }
  }

  get chest() {
    return { x: this.player.x / PPM, y: (this.player.y - CHEST_OFFSET) / PPM };
  }

  // ---- Interação (F) ------------------------------------------------------

  /** O que dá para usar com F agora: alucinação, item, gerador, cama ou porta mais perto. */
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
    // Alucinação ao alcance tem prioridade (estourar o balão perto de uma porta, etc.)
    const h = this.director.active?.interactable;
    if (h && dist(h.point.x, h.point.y) < h.range) return { kind: 'hallucination', use: h.use, anchor: h.anchor };
    for (const item of this.items.list) {
      consider({ kind: 'item', item, anchor: { x: item.sprite.x, y: item.sprite.y - 10 } }, dist(item.x, item.y), ITEM_RANGE);
    }
    if (!this.generator.on) {
      const s = this.generatorSprite;
      consider(
        { kind: 'generator', anchor: { x: s.x + s.width / 2, y: s.y - 2 } },
        dist(GENERATOR_POINT.x, GENERATOR_POINT.y),
        BALANCE.extra.generatorInteractDistance,
      );
    }
    const bed = this.bedSprite;
    consider(
      { kind: 'bed', anchor: { x: bed.x + bed.width / 2, y: bed.y + bed.height - 18 } },
      dist(BED_POINT.x, BED_POINT.y),
      BED_RANGE,
    );
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
    if (this.hud.talking || this.sleep) return;
    const target = this.nearestInteractable();
    if (!target) return;
    if (target.kind === 'hallucination') target.use();
    else if (target.kind === 'item') this.useItem(target.item);
    else if (target.kind === 'door') this.useDoor(target.door);
    else if (target.kind === 'bed') this.tryToSleep();
    // gerador: segurar F, tratado no update
  }

  useDoor(door) {
    if (door.kind === 'clara') {
      this.hud.talk(LINES.clara);
      return;
    }
    if (door.locked) {
      if (this.hasKey) {
        // Destranca com a chave e abre (GDD 4.9)
        this.hasKey = false;
        door.unlock();
        door.setOpen(true);
        sfx.lockClick();
      } else {
        sfx.lockClick(0.5);
        this.hud.talk(LINES.lockedDoor);
      }
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
    } else if (item.type === 'battery') {
      this.flashlight.addBattery(BALANCE.batteryPickup / 100);
    } else if (item.type === 'key') {
      this.hasKey = true;
      this.hud.talk(LINES.foundKey);
    }
  }

  // ---- Começo da noite (GDD 4.6) ----------------------------------------------

  /** A noite começa: relógio, alucinações e sabotagem do gerador. */
  startNight() {
    if (this.clock.started) return;
    this.clock.start();
    this.director.enabled = true;
  }

  // ---- Alucinações --------------------------------------------------------

  /** Pode sortear este tipo agora? (GDD 5) */
  hallucinationAvailable(kind, { lightsOn }) {
    if (!lightsOn) return kind === 'fakeSteps';
    if (kind === 'tv') return this.nearDevice('tv');
    if (kind === 'landline') return this.nearDevice('telefoneFixo');
    if (kind === 'shadow') return !!this.findShadowDoor();
    return true;
  }

  /**
   * Vulto (GDD 5): uma porta aberta, na tela, a uma certa distância do Artur, com outro
   * cômodo do outro lado. Devolve { door, toRoom, normal } ou null. `forced`: usa esta porta.
   */
  findShadowDoor(forced = null) {
    const feet = this.player.feetMeters;
    const here = roomAt(feet.x, feet.y) ?? this.lighting.currentRoom;
    if (!here) return null;
    const zone = LIGHT_ZONE.get(here.id);
    const { min, max } = BALANCE.extra.shadowDoorDistance;
    let best = null;
    let bestDist = Infinity;
    for (const door of forced ? [forced] : this.doors) {
      if (!door.isOpen) continue;
      const d = Math.hypot(feet.x - door.center.x, feet.y - door.center.y);
      if (!forced && (d < min || d > max)) continue;
      if (!forced && !this.hallucinationCtx.onScreen(door.rect.centerX, door.rect.centerY)) continue;
      const n = door.axis === 'h' ? { x: 0, y: 1 } : { x: 1, y: 0 };
      const a = roomAt(door.center.x - n.x * 0.6, door.center.y - n.y * 0.6);
      const b = roomAt(door.center.x + n.x * 0.6, door.center.y + n.y * 0.6);
      let pass = null;
      if (a && b && LIGHT_ZONE.get(a.id) === zone && LIGHT_ZONE.get(b.id) !== zone) pass = { door, toRoom: b, normal: n };
      else if (a && b && LIGHT_ZONE.get(b.id) === zone && LIGHT_ZONE.get(a.id) !== zone) {
        pass = { door, toRoom: a, normal: { x: -n.x, y: -n.y } };
      }
      if (pass && pass.toRoom.id !== 'quartoClara' && d < bestDist) {
        best = pass;
        bestDist = d;
      }
    }
    return best;
  }

  /** Artur está perto (e na mesma zona de luz) da TV / telefone? */
  nearDevice(id) {
    const s = this.furnitureById.get(id);
    const feet = this.player.feetMeters;
    const p = { x: (s.sprite.x + s.sprite.width / 2) / PPM, y: (s.sprite.y + s.sprite.height) / PPM };
    const room = roomAt(feet.x, feet.y);
    const sameZone = room && LIGHT_ZONE.get(room.id) === LIGHT_ZONE.get(s.def.room);
    return sameZone && Math.hypot(feet.x - p.x, feet.y - p.y) < BALANCE.extra.nearDeviceDistance;
  }

  /**
   * Um ponto livre no chão, entre `min` e `max` metros do Artur. Devolve px (base dos pés).
   * opts.onScreen: precisa estar na tela · opts.offScreen: precisa estar FORA da tela (com folga)
   * opts.sameRoom: no mesmo cômodo do Artur.
   */
  findSpot(min, max, { onScreen = true, offScreen = false, sameRoom = false } = {}) {
    const feet = this.player.feetMeters;
    const here = roomAt(feet.x, feet.y) ?? this.lighting.currentRoom;
    const view = this.cameras.main.worldView;
    const free = (x, y) => {
      const k = this.grid.kind[Math.round(y / CELL_METERS)]?.[Math.round(x / CELL_METERS)];
      if (k !== 'floor') return false;
      const room = roomAt(x, y);
      if (!room || room.id === 'quartoClara') return false;
      if (sameRoom && room.id !== here?.id) return false;
      const px = x * PPM;
      const py = y * PPM;
      if (onScreen && !view.contains(px, py - 16)) return false;
      if (offScreen && px > view.x - 48 && px < view.right + 48 && py > view.y - 48 && py < view.bottom + 48) return false;
      return !this.furnitureRects.some((r) => r.contains(px, py) || r.contains(px, py - 20));
    };
    let best = null;
    let bestDist = -1;
    for (let i = 0; i < 150; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = Phaser.Math.FloatBetween(0.5, max);
      const x = feet.x + Math.cos(a) * d;
      const y = feet.y + Math.sin(a) * d;
      if (!free(x, y)) continue;
      if (d >= min) return { x: x * PPM, y: y * PPM };
      if (d > bestDist) {
        best = { x: x * PPM, y: y * PPM };
        bestDist = d;
      }
    }
    // Fora da tela é obrigatório: sem lugar válido, melhor não aparecer
    if (!best && offScreen) return null;
    return best ?? { x: this.player.x + 2 * PPM, y: this.player.y };
  }

  // ---- Dormir (GDD 4.7) ---------------------------------------------------

  tryToSleep() {
    // Só com a luz acesa: no escuro a trava não age, e um remédio zeraria o medo (GDD 4.7)
    if (!this.generator.on) {
      this.hud.talk(LINES.sleepDark);
      return;
    }
    if (this.fear.value > 0) {
      this.hud.talk(LINES.cantSleep);
      return;
    }
    const e = BALANCE.extra;
    // A tela escurece aos poucos; sussurros aumentando (áudio na etapa 11); silêncio; fim.
    // Nenhuma alucinação interrompe. Só o gerador pode cair, com a chance própria do sono,
    // sorteada num momento aleatório da sequência.
    this.sleep = {
      elapsed: 0,
      rollAt: Phaser.Math.FloatBetween(e.sleepGeneratorRollMin, e.sleepGeneratorRollMax),
      rolled: false,
      chance: this.generator.sleepChance,
    };
    this.generator.paused = true;
    this.flashlight.forceOff();
    this.hud.fadeToBlack(BALANCE.timings.sleepSequenceSeconds * 0.85);
  }

  updateSleep(dt) {
    const s = this.sleep;
    s.elapsed += dt;
    if (!s.rolled && s.elapsed >= s.rollAt) {
      s.rolled = true;
      if (this.generator.rollSleep()) {
        this.cancelSleep();
        return;
      }
    }
    if (s.elapsed >= BALANCE.timings.sleepSequenceSeconds) this.endNight();
  }

  cancelSleep() {
    this.sleep = null;
    this.generator.paused = false;
    this.hud.clearFade(0.25);
  }

  /** Noite terminou: próximo dia (a delegacia e o save entram nas etapas 8 e 9). */
  endNight() {
    this.sleep = null;
    const day = this.clock.day;
    const screens = day < 7 ? [daysLeftText(day + 1), 'Casa'] : ['O final entra na etapa 10'];
    const nextDay = day < 7 ? day + 1 : 1;
    this.scene.start('Transition', { screens, next: { scene: 'House', data: { day: nextDay } } });
  }

  // ---- Quadro a quadro ----------------------------------------------------

  update(time, deltaMs) {
    if (!this.hud.ready) return; // o HUD ainda está subindo
    const dt = deltaMs / 1000;
    const nightDt = this.clock.update(dt);
    const cam = this.cameras.main;
    const toScreen = (p) => ({ x: (p.x - cam.worldView.x) * cam.zoom, y: (p.y - cam.worldView.y) * cam.zoom });

    // Artur fica parado com a caixa de diálogo aberta e durante a sequência de sono
    this.player.frozen = this.hud.talking || !!this.sleep;
    if (this.sleep) this.updateSleep(dt);

    // Lanterna mira no mouse; parado, Artur vira para onde aponta
    const pointer = this.input.activePointer.positionToCamera(cam);
    this.flashlight.angle = Math.atan2(pointer.y - (this.player.y - CHEST_OFFSET), pointer.x - this.player.x);
    if (this.flashlight.on && this.player.body.velocity.lengthSq() === 0) {
      this.player.faceAngle(this.flashlight.angle);
    }

    this.player.update(dt);
    const feet = this.player.feetMeters;

    this.generator.update(nightDt, feet);
    const v = this.player.body.velocity;
    this.frameCtx.lightsOn = this.generator.on;
    this.frameCtx.blocked = this.hud.talking || !!this.sleep;
    this.frameCtx.playerMoving = v.lengthSq() > 0;
    this.frameCtx.playerVelocity.set(v.x, v.y);
    this.director.update(dt, nightDt, this.frameCtx);
    this.fear.update(nightDt, this.generator.on);
    this.flashlight.update(dt);
    if (this.generator.on && this.flashlight.on) this.flashlight.forceOff();

    // Monstros (só no escuro) e efeitos de perseguição
    this.monsters.update(dt, nightDt, {
      dark: this.clock.started && !this.generator.on,
      playerMoving: this.frameCtx.playerMoving,
    });
    if (this.dead) return;
    this.updateChaseEffects(dt);

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
      zoneFactor: this.director.lightFactor,
    });

    // HUD
    this.hud.setFear(this.fear.value);
    this.hud.setStamina(this.player.stamina, this.player.exhausted);
    this.hud.setBattery(this.flashlight.battery, this.flashlight.low);
    this.hud.showPrompt(target && !this.sleep ? { ...toScreen(target.anchor), y: toScreen(target.anchor).y - 4 } : null);
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
    debug.set('Geral/Atalhos', '1–7 dia · R reinicia · T tempo · N termina a noite');
    debug.set('Geral/Mais atalhos', 'K gerador · +/− medo · H alucinação · J próxima alucinação · G colisões');

    const clock = this.clock;
    debug.set('Noite/Dia', `${clock.day}`);
    debug.set('Noite/Tempo', clock.started ? `${min}:${sec}  (${clock.speed}×)` : 'parado (a noite não começou)');
    debug.set(
      'Noite/Ursos',
      `${clock.bearsCollected}/${night.bearCount} · trava abaixo de ${night.bearLock}${this.director.locked ? ' (TRAVADO)' : ''}`,
    );
    debug.set('Noite/Medo', `${this.fear.value.toFixed(1)}%  (×${night.fearMultiplier.toFixed(2)})`);
    debug.set('Noite/Queda do medo', g.on ? `${fearDecayPerSecond(night).toFixed(3)} %/s` : 'parado (escuro)');
    const d = this.director;
    debug.set('Noite/Alucinação: intervalo', `${hallucinationGap(night, clock.bears).toFixed(1)} s (±20%)`);
    let now = '—';
    if (d.active) now = d.active.name;
    else if (!d.enabled) now = 'a noite não começou';
    else if (d.nextAt !== null) now = `próxima em ${Math.max(0, d.nextAt - t).toFixed(1)} s`;
    debug.set('Noite/Alucinação: agora', now);
    debug.set('Noite/Alucinações na noite', `${d.count}`);
    debug.set(
      'Noite/Dormir',
      this.sleep
        ? `dormindo ${this.sleep.elapsed.toFixed(1)} s · gerador ${(this.sleep.chance * 100).toFixed(1)}%`
        : `gerador no sono ${(g.sleepChance * 100).toFixed(1)}% (base ${(g.sleepBase * 100).toFixed(0)}%)`,
    );

    debug.set('Gerador/Estado', g.on ? 'ligado' : `DESLIGADO (${g.lastDropReason})`);
    debug.set('Gerador/Artur', `${g.isFar(feet) ? 'longe' : 'perto'} (${g.distanceTo(feet).toFixed(1)} m)`);
    debug.set('Gerador/Risco', `${g.risk.toFixed(5)} /s  (teto ${night.generatorRiskCap})`);
    debug.set('Gerador/Quedas', `${g.drops}${clock.started && clock.guaranteedDropDue && g.drops === 0 ? ' (queda garantida pendente)' : ''}`);

    debug.set('Casa/Cômodo', room ? room.name : '—');
    debug.set('Casa/Posição', `${feet.x.toFixed(1)} m, ${feet.y.toFixed(1)} m`);
    debug.set('Casa/Estamina', `${Math.round(this.player.stamina * 100)}%${this.player.exhausted ? ' (esgotada)' : ''}`);
    debug.set(
      'Casa/Lanterna',
      `${this.flashlight.on ? 'ligada' : 'desligada'} · bateria ${Math.round(this.flashlight.battery * 100)}%`,
    );
    const key = this.hasKey ? ' · chave no bolso' : this.items.remaining('key') ? ' · chave na casa' : '';
    debug.set('Casa/Itens', `remédios ${this.items.remaining('medicine')} · pilhas ${this.items.remaining('battery')}${key}`);
    debug.set('Casa/Interação', target ? target.kind : '—');
    const mons = this.monsters.active.map((e) => e.name).join(', ') || '—';
    debug.set('Monstros/Agora', mons);
    debug.set('Monstros/Taxa no escuro', `${night.monsterEventRate.toFixed(4)} /s`);
    debug.set('Monstros/Eventos na noite', `${this.monsters.count}`);
    debug.set('Monstros/Atalhos', `M força monstro · I imortal (${this.godMode ? 'ligado' : 'desligado'})`);
  }

  // ---- Monstros (GDD 6 e 7) -----------------------------------------------

  createMonsterCtx() {
    const scene = this;
    return {
      scene,
      // nav e hud são criados depois: lidos na hora do uso
      get nav() {
        return scene.nav;
      },
      get hud() {
        return scene.hud;
      },
      get night() {
        return scene.clock.night;
      },
      player: this.player,
      colliders: [this.wallLayer, this.furniture, this.doors.map((d) => d.blocker)],
      fear: this.fear,
      sfx,
      findSpawn: (min, max) => this.findMonsterSpawn(min, max),
      findHelenaSpot: () => this.findHelenaSpot(),
      litByFlashlight: (xm, ym) => this.litByFlashlight(xm, ym),
      die: (kind) => this.die(kind),
    };
  }

  /** Lugar para um monstro surgir: fora da tela, a `min`–`max` m de caminho do Artur. */
  findMonsterSpawn(min, max) {
    const dist = this.nav.distancesFrom(this.player.feetMeters, Math.ceil(max / CELL_METERS));
    const view = this.cameras.main.worldView;
    const options = [];
    for (const [key, steps] of dist) {
      const d = steps * CELL_METERS;
      if (d < min || d > max) continue;
      const i = key % this.nav.w;
      const j = Math.floor(key / this.nav.w);
      const p = this.nav.center(i, j);
      const px = p.x * PPM;
      const py = p.y * PPM;
      if (px > view.x - 24 && px < view.right + 24 && py > view.y - 40 && py < view.bottom + 24) continue;
      const room = roomAt(p.x, p.y);
      if (!room || room.id === 'quartoClara' || this.nav.doorAt(i, j)) continue;
      options.push(p);
    }
    return options.length ? options[Math.floor(Math.random() * options.length)] : null;
  }

  /**
   * Helena: num ponto por perto onde a lanterna alcança. Com a lanterna ligada, às vezes
   * (40%) exatamente na direção para onde ela aponta.
   */
  findHelenaSpot() {
    const chest = this.chest;
    // Precisa dar para iluminá-la: chão livre e nenhuma parede entre ela e o Artur
    const tryAt = (angle, d) => {
      const x = chest.x + Math.cos(angle) * d;
      const y = chest.y + Math.sin(angle) * d + 0.45;
      const [i, j] = this.nav.cellOf(x, y);
      if (!this.nav.passable(i, j) || roomAt(x, y)?.id === 'quartoClara') return null;
      const a = Math.atan2(y - 0.6 - chest.y, x - chest.x);
      const dist = Math.hypot(x - chest.x, y - 0.6 - chest.y);
      return this.lighting.castRay(chest.x, chest.y, a, dist) >= dist - 0.35 ? { x, y } : null;
    };
    if (this.flashlight.on && Math.random() < 0.4) {
      const a = this.flashlight.angle;
      const free = this.lighting.castRay(chest.x, chest.y, a, BALANCE.extra.flashlightRange);
      for (let d = Math.min(5, free - 0.6); d >= 2; d -= 0.5) {
        const spot = tryAt(a, d);
        if (spot) return spot;
      }
    }
    for (let k = 0; k < 40; k++) {
      const spot = tryAt(Math.random() * Math.PI * 2, Phaser.Math.FloatBetween(2.5, 5));
      if (spot) return spot;
    }
    return null;
  }

  /** Um ponto (m) está dentro do cone da lanterna, sem parede no meio? */
  litByFlashlight(xm, ym) {
    const f = this.flashlight;
    if (!f.shining) return false;
    const c = this.chest;
    const d = Math.hypot(xm - c.x, ym - c.y);
    if (d > BALANCE.extra.flashlightRange) return false;
    const angle = Math.atan2(ym - c.y, xm - c.x);
    const diff = Math.abs(Phaser.Math.Angle.Wrap(angle - f.angle));
    if (diff > Phaser.Math.DegToRad(BALANCE.extra.flashlightAngle / 2)) return false;
    return this.lighting.castRay(c.x, c.y, angle, d) >= d - 0.35;
  }

  /** Perseguição (GDD 7): coração forte + respiração, bordas pulsando e leve tremor. */
  updateChaseEffects(dt) {
    const chasing = this.monsters.chasing;
    this.hud.setChase(chasing);
    if (chasing && !this.chaseSound) this.chaseSound = sfx.chaseLoop(0.8);
    if (!chasing && this.chaseSound) {
      this.chaseSound.stop();
      this.chaseSound = null;
    }
    this.shakeIn = (this.shakeIn ?? 0) - dt;
    if (chasing && this.shakeIn <= 0) {
      this.shakeIn = 0.5;
      this.cameras.main.shake(450, 0.0018);
    }
  }

  /** Pego por um monstro: jumpscare e tela de morte (GDD 2.5). */
  die(monster) {
    if (this.dead || this.godMode) return;
    this.dead = true;
    this.chaseSound?.stop();
    this.chaseSound = null;
    this.hud.setChase(false);
    this.hud.dialogue?.clear();
    this.scene.start('Death', { monster, day: this.clock.day });
  }

  setupDebugKeys() {
    let nextKind = 0;
    this.input.keyboard.on('keydown', (event) => {
      if (!debug.enabled) return;
      const k = event.key.toLowerCase();
      const n = Number(event.key);
      if (n >= 1 && n <= TOTAL_DAYS) this.scene.restart({ day: n });
      else if (k === 'r') this.scene.restart({ day: this.clock.day });
      else if (k === 't') {
        const i = NIGHT_SPEEDS.indexOf(this.clock.speed);
        this.clock.speed = NIGHT_SPEEDS[(i + 1) % NIGHT_SPEEDS.length];
      } else if (k === 'k') this.generator.drop('debug');
      else if (k === 'h' || k === 'j') {
        // H: sorteia uma alucinação · J: força os tipos em sequência
        this.startNight();
        if (!this.director.active) {
          if (k === 'h') this.director.start(this.frameCtx);
          else {
            this.director.start(this.frameCtx, HALLUCINATION_KINDS[nextKind]);
            nextKind = (nextKind + 1) % HALLUCINATION_KINDS.length;
          }
        }
      } else if (k === 'n') this.endNight();
      else if (k === '+' || k === '=') this.fear.add(10 / this.clock.night.fearMultiplier);
      else if (k === '-') this.fear.reduce(10);
      else if (k === 'g') this.toggleCollisionDebug();
      else if (k === 'm') {
        // M: força os monstros em sequência (apaga a luz se precisar)
        this.startNight();
        if (this.generator.on) this.generator.drop('debug');
        this.monsterDebugIndex = ((this.monsterDebugIndex ?? -1) + 1) % MONSTER_KINDS.length;
        this.monsters.endAll();
        this.monsters.start(MONSTER_KINDS[this.monsterDebugIndex]);
      } else if (k === 'i') this.godMode = !this.godMode;
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
