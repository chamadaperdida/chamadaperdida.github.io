// Evento da tranca (GDD 4.9) e o quarto trancado das noites 5–7 (GDD 4.8).
//
// - Só com a luz acesa. Tentativas no tempo da noite: a primeira entre 60 e 400 s, depois
//   a cada 120–300 s; chance 80% → 30% → 10% (balance lockEvent).
// - Uma porta FORA DA VISÃO é trancada (som de tranca, posicional). Em seguida o tilintar
//   de um chaveiro anda pela casa (é o Invasor, mas nada aparece e o medo não sobe). Quando
//   o som para, a chave foi largada num lugar fora da visão.
// - Só uma porta trancada por vez.
// - Noites 5–7 (GDD 4.8): ao ler a lista, o evento acontece na hora com a porta do quarto do
//   Artur (mesmo som e chaveiro); os sorteados só depois de destrancá-lo.
// - A porta escolhida sempre separa algum pedaço da casa (senão trancar não muda nada), e
//   nunca deixa Artur sem caminho até o gerador. A chave nunca cai no pedaço trancado.
// - A chave não muda de lugar depois de largada (nem se a luz cair).

import { BALANCE } from '../config/balance.js';
import { PPM } from '../world/tiles.js';
import { positional } from '../audio/Sfx.js';

const JINGLE_EVERY = 0.5; // s, um chacoalhar por passo
const SOUND_RANGE = 18; // m
const KEY_PATH = { min: 6, max: 30 }; // m de caminho da porta até onde a chave cai
const KEY_FROM_ARTUR = 8; // m: a chave cai longe do Artur
const WAIT_OFFSCREEN_MAX = 20; // s esperando a chave sair da tela antes de largar mesmo assim

const rand = (a, b) => a + Math.random() * (b - a);

export class LockEvent {
  /**
   * @param ctx { clock, nav, doors, items, sfx, feet(), onScreen(px, py), roomAt(x, y),
   *              generatorPoint }
   */
  constructor(ctx) {
    this.ctx = ctx;
    const cfg = BALANCE.lockEvent;
    this.attempts = 0;
    this.nextAt = rand(cfg.firstAttemptMin, cfg.firstAttemptMax);
    this.door = null; // porta trancada agora (no máximo uma)
    this.lockedRooms = []; // cômodos do lado de lá
    this.walker = null; // o chaveiro andando pela casa
  }

  /** Artur destrancou a porta com a chave. */
  onUnlock(door) {
    if (door !== this.door) return;
    this.door = null;
    this.lockedRooms = [];
  }

  /**
   * @param dt      segundos reais (o chaveiro anda em tempo real)
   * @param lightsOn
   */
  update(dt, lightsOn) {
    if (this.walker) {
      this.#walk(dt, lightsOn);
      return;
    }
    if (!this.ctx.clock.started || this.door || this.ctx.clock.t < this.nextAt) return;
    if (!lightsOn) return; // espera a luz voltar (a tentativa não é perdida)
    const cfg = BALANCE.lockEvent;
    const chance = cfg.chances[this.attempts];
    this.attempts += 1;
    this.nextAt = this.ctx.clock.t + rand(cfg.intervalMin, cfg.intervalMax);
    if (chance === undefined) {
      this.nextAt = Infinity; // acabaram as tentativas da noite
      return;
    }
    if (Math.random() < chance) this.trigger();
  }

  /**
   * Tranca uma porta agora. `forced`: esta porta, mesmo na tela (o quarto nas noites 5–7).
   * Devolve false se nenhuma serve.
   */
  trigger(forced = null) {
    if (this.door || this.walker) return false;
    const plan = this.#choose(forced);
    if (!plan) return false;
    const { door, cutRooms, start, key, path } = plan;
    door.lock();
    this.door = door;
    this.lockedRooms = cutRooms;
    const { volume, pan } = positional(this.ctx.feet(), door.center, SOUND_RANGE);
    this.ctx.sfx.lockClick(Math.max(0.15, volume), pan);
    this.walker = {
      pos: { ...start },
      path,
      key,
      jingleIn: 0.6, // um respiro depois do clique
      waiting: 0,
    };
    return true;
  }

  // ---- Escolha da porta e do lugar da chave ----------------------------------

  #choose(forced) {
    const { nav, doors, feet, onScreen, roomAt, generatorPoint } = this.ctx;
    const from = feet();
    const before = nav.distancesFrom(from, 5000);
    const genKey = this.#cellKey(generatorPoint);
    const options = [];
    for (const door of forced ? [forced] : doors) {
      if (door.kind !== 'normal' || door.locked) continue;
      // Fora da visão (com folga)
      const r = door.rect;
      if (!forced && onScreen(r.centerX, r.centerY, 40)) continue;
      // Simula a porta trancada e vê o que fica do outro lado
      const saved = door.isOpen;
      door.isOpen = false;
      door.locked = true;
      const after = nav.distancesFrom(from, 5000);
      door.isOpen = saved;
      door.locked = false;
      if (!after.has(genKey)) continue; // nunca separa Artur do gerador
      // (as células da própria porta não contam: somem do caminho em qualquer porta trancada)
      const cut = [...before.keys()].filter((k) => !after.has(k) && !nav.doorAt(k % nav.w, Math.floor(k / nav.w)));
      if (!cut.length) continue; // trancar não mudaria nada
      const cutRooms = [...new Set(cut.map((k) => roomAt(...this.#keyPoint(k))?.id).filter(Boolean))];
      // Do lado de cá: célula livre mais perto da porta (onde o chaveiro começa)
      const start = this.#nearestCell(after, door.center);
      if (!start) continue;
      options.push({ door, cutRooms, after, start });
    }
    // Sorteia portas até achar uma com lugar para a chave
    while (options.length) {
      const i = Math.floor(Math.random() * options.length);
      const opt = options.splice(i, 1)[0];
      const plan = this.#keyPlan(opt);
      if (plan) return { ...opt, ...plan };
    }
    return null;
  }

  /** Lugar da chave e caminho do chaveiro até lá (com a porta já tratada como trancada). */
  #keyPlan({ door, cutRooms, after, start }) {
    const { nav, items, feet, roomAt } = this.ctx;
    const here = roomAt(feet().x, feet().y)?.id;
    const all = items.candidates('key', cutRooms).filter((c) => after.has(this.#cellKey(c.reach)));
    const far = all.filter((c) => c.spot.room !== here && Math.hypot(c.reach.x - feet().x, c.reach.y - feet().y) >= KEY_FROM_ARTUR);
    for (const pool of [far, all]) {
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      for (const c of shuffled) {
        // Caminho calculado com a porta trancada (nav não atravessa porta trancada)
        const saved = door.isOpen;
        door.isOpen = false;
        door.locked = true;
        const path = nav.findPath(start, c.reach);
        door.isOpen = saved;
        door.locked = false;
        if (!path) continue;
        const len = path.length * 0.5;
        if (pool === far && (len < KEY_PATH.min || len > KEY_PATH.max)) continue;
        return { key: c, path };
      }
    }
    return null;
  }

  #cellKey(p) {
    const { nav } = this.ctx;
    const c = nav.nearestPassable(...nav.cellOf(p.x, p.y));
    return c ? c[1] * nav.w + c[0] : -1;
  }

  #keyPoint(k) {
    const { nav } = this.ctx;
    const p = nav.center(k % nav.w, Math.floor(k / nav.w));
    return [p.x, p.y];
  }

  #nearestCell(set, p) {
    let best = null;
    let bestD = Infinity;
    for (const k of set.keys()) {
      const [x, y] = this.#keyPoint(k);
      const d = Math.hypot(x - p.x, y - p.y);
      if (d < bestD) {
        bestD = d;
        best = { x, y };
      }
    }
    return bestD < 2 ? best : null;
  }

  // ---- O chaveiro andando ---------------------------------------------------

  #walk(dt, lightsOn) {
    const w = this.walker;
    // A luz caiu no meio: a chave fica onde ia cair, em silêncio
    if (!lightsOn) {
      this.#drop();
      return;
    }
    if (w.path.length) {
      const speed = BALANCE.movement.arturWalk; // passo de quem anda sem pressa
      let step = speed * dt;
      while (step > 0 && w.path.length) {
        const t = w.path[0];
        const d = Math.hypot(t.x - w.pos.x, t.y - w.pos.y);
        if (d <= step) {
          w.pos = { x: t.x, y: t.y };
          w.path.shift();
          step -= d;
        } else {
          w.pos.x += ((t.x - w.pos.x) / d) * step;
          w.pos.y += ((t.y - w.pos.y) / d) * step;
          step = 0;
        }
      }
      w.jingleIn -= dt;
      if (w.jingleIn <= 0) {
        w.jingleIn = JINGLE_EVERY;
        const { volume, pan } = positional(this.ctx.feet(), w.pos, SOUND_RANGE);
        this.ctx.sfx.keyJingle(0.8 * volume, pan);
      }
      return;
    }
    // Chegou: o som para. A chave só cai fora da visão
    const { x, y } = w.key.reach;
    w.waiting += dt;
    if (this.ctx.onScreen(x * PPM, y * PPM, 40) && w.waiting < WAIT_OFFSCREEN_MAX) return;
    this.#drop();
  }

  #drop() {
    const w = this.walker;
    this.walker = null;
    this.ctx.items.placeAt('key', w.key.spot);
  }

  /** Para o debug. */
  get debugText() {
    const cfg = BALANCE.lockEvent;
    const parts = [];
    if (this.door) parts.push(`trancada: ${this.door.id} (${this.lockedRooms.join(', ')})`);
    if (this.walker) parts.push(this.walker.path.length ? 'chaveiro andando' : 'chaveiro parado, esperando sair da tela');
    if (!this.door && !this.walker) {
      parts.push(
        this.attempts >= cfg.chances.length
          ? 'sem mais tentativas'
          : `próxima tentativa em ${Math.max(0, this.nextAt - this.ctx.clock.t).toFixed(0)} s (${Math.round(cfg.chances[this.attempts] * 100)}%)`,
      );
    }
    parts.push(`tentativas ${this.attempts}`);
    return parts.join(' · ');
  }
}
