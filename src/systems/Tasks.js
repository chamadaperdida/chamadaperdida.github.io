// Tarefas obrigatórias da lista da rotina (GDD 4.11).
//
// - Fixas por noite (balance: perNight.tasks). Só podem ser feitas depois de ler a lista.
// - Carregar: com as mãos ocupadas Artur não corre. Se a luz cair, larga o que carrega
//   ali mesmo; dá para pegar de volta quando a luz voltar.
// - No escuro nenhuma tarefa avança: não dá para pegar objetos de tarefa e as interações
//   param. Micro-ondas, máquina e ferro precisam de luz (os timers pausam).
// - Tarefa feita não se desfaz.
//
// Este módulo só guarda o estado e diz o que dá para fazer agora (targets). A cena cuida
// de mostrar o [F], segurar F e chamar use()/complete().

import { BALANCE } from '../config/balance.js';
import { PPM } from '../world/tiles.js';

export const TASK_NAMES = {
  jantar: 'Jantar',
  louca: 'Lavar a louça',
  lixo: 'Tirar o lixo',
  roupa: 'Lavar a roupa',
  regar: 'Regar as plantas',
  janelas: 'Fechar as janelas',
  uniforme: 'Passar o uniforme',
  celular: 'Carregar o celular',
};

// O que Artur carrega → ícone (quadro do atlas props)
const CARRY_ICON = {
  marmita: 'lunchbox',
  jantar: 'dinner',
  pratos: 'plate',
  sacos: 'trash-bag',
  roupaSuja: 'laundry-basket',
  roupaMolhada: 'wet-clothes',
  regador: 'watering-can',
  uniforme: 'uniform-folded',
  uniformePassado: 'uniform-pressed',
};

// Pratos sujos espalhados (móvel, posição x em px no tampo e y do tampo)
const PLATES = [
  { on: 'aparador', dx: 24, dy: 6 },
  { on: 'mesa', dx: 27, dy: 12 },
  { on: 'comoda', dx: 20, dy: 6 },
  { on: 'mesaJantar', dx: 68, dy: 16 },
];
const BINS = ['lixeiraCozinha', 'lixeiraBanheiro', 'lixeiraEscritorio'];
const POTS = ['vasoSala', 'vaso1', 'vaso3', 'vaso5', 'vaso6'];

// Janelas (GDD 4.2): centro na linha da parede (m) e ponto de onde Artur alcança.
export const WINDOWS = [
  { id: 'sala', x: 15.2, y: 1, reach: { x: 15.5, y: 2.5 } },
  { id: 'banheiroSocial', x: 34.8, y: 1, reach: { x: 34.8, y: 2.0 } },
  { id: 'escritorio', x: 40.5, y: 0, reach: { x: 40.5, y: 1.0 } },
  { id: 'cozinha', x: 28, y: 22, reach: { x: 28, y: 21.3 } },
  { id: 'hospedes', x: 34.5, y: 20, reach: { x: 34.5, y: 19.3 } },
  { id: 'lavanderia', x: 14, y: 26, reach: { x: 14, y: 25.3 } },
];

const REACH_IN_FRONT = 0.35; // metros além da borda da frente do móvel

export class Tasks {
  /**
   * @param ids       tarefas da noite (ex.: ['jantar', 'louca'])
   * @param furniture Map id → { sprite, def }
   * @param items     sistema de itens (o celular é um item pequeno)
   * @param hooks     { say(text), sfx }
   */
  constructor(scene, ids, furniture, items, hooks) {
    this.scene = scene;
    this.ids = ids;
    this.furniture = furniture;
    this.hooks = hooks;
    this.done = new Set();
    this.listRead = false;
    this.carrying = null; // { type, count?, water? }
    this.dropped = []; // [{ carry, x, y, sprite }]
    this.hasPhone = false;
    const t = BALANCE.tasks;
    this.cfg = t;

    this.st = {
      jantar: { step: 'pegar', timer: 0 },
      louca: { plates: [], washed: 0 },
      lixo: { bags: [], deposited: 0 },
      roupa: { step: 'cesto', timer: 0 },
      regar: { watered: new Set() },
      janelas: { windows: [] },
      uniforme: { step: 'pegar' },
    };

    // A folha da lista na geladeira (sempre lá)
    const fridge = furniture.get('geladeira').sprite;
    scene.add.image(fridge.x + 4, fridge.y + 18, 'props', 'routine-list').setOrigin(0).setDepth(fridge.depth + 1);

    // Janelas: abertas só se "Fechar as janelas" é tarefa da noite
    const open = this.has('janelas');
    for (const w of WINDOWS) {
      const sprite = scene.add
        .image(w.x * PPM, w.y * PPM, 'props', open ? 'window-open' : 'window-closed')
        .setDepth(w.y * PPM + 2);
      this.st.janelas.windows.push({ ...w, sprite, closed: !open });
    }

    if (this.has('louca')) {
      for (const p of PLATES) {
        const base = furniture.get(p.on).sprite;
        const sprite = scene.add.image(base.x + p.dx, base.y + p.dy, 'props', 'plate').setOrigin(0.5, 1);
        sprite.setDepth(base.depth + 1);
        this.st.louca.plates.push({ ...p, sprite, taken: false });
      }
    }
    if (this.has('lixo')) {
      for (const on of BINS) {
        const base = furniture.get(on).sprite;
        const sprite = scene.add.image(base.x + base.width / 2, base.y + 4, 'props', 'trash-bag').setOrigin(0.5, 1);
        sprite.setDepth(base.depth + 1);
        this.st.lixo.bags.push({ on, sprite, taken: false });
      }
    }
    if (this.has('celular')) items.place('phone', 1, [], { anyRoom: true });

    this.icon = scene.add.image(0, 0, 'props', 'plate').setOrigin(0.5, 1).setVisible(false);
  }

  has(id) {
    return this.ids.includes(id);
  }

  get allDone() {
    return this.ids.every((id) => this.done.has(id));
  }

  /** Linhas da folha da geladeira. */
  get lines() {
    return this.ids.map((id) => ({ text: TASK_NAMES[id], done: this.done.has(id) }));
  }

  get handsFree() {
    return !this.carrying;
  }

  // ---- Pontos de interação --------------------------------------------------

  /** Ponto (m) na frente de um móvel e o lugar do [F] (px). dx em px dentro do sprite. */
  #front(id, dx = null) {
    const s = this.furniture.get(id).sprite;
    const x = s.x + (dx ?? s.width / 2);
    return { point: { x: x / PPM, y: (s.y + s.height) / PPM + REACH_IN_FRONT }, anchor: { x, y: s.y - 2 } };
  }

  /** Ponto da folha da lista (lado esquerdo da geladeira). */
  get listTarget() {
    return this.#front('geladeira', 6);
  }

  #target(id, where, extra) {
    return { kind: 'task', task: id, range: this.cfg.reach, ...where, ...extra };
  }

  /** Pegar algo: se as mãos estiverem ocupadas, Artur avisa. */
  #pick(id, where, carryType, take) {
    return this.#target(id, where, {
      use: () => {
        // Mesma coisa (mais um prato, mais um saco, encher o regador) pode
        if (this.carrying && this.carrying.type !== carryType) {
          this.hooks.say('Estou com as mãos ocupadas.');
          return;
        }
        take();
      },
    });
  }

  #carry(type, extra = {}) {
    this.carrying = { type, ...extra };
  }

  #finish(id) {
    this.done.add(id);
  }

  #carryingType(type) {
    return this.carrying?.type === type;
  }

  /**
   * Tudo o que dá para fazer agora. Antes de ler a lista, os objetos de tarefa só
   * respondem com a fala; no escuro, nada.
   * Alvo: { kind: 'task', point, anchor, range, use() } ou { ..., hold: s, complete() }.
   */
  targets(lightsOn) {
    if (!lightsOn) return [];
    const out = [];
    const cfg = this.cfg;

    // Objetos largados quando a luz caiu
    for (const d of this.dropped) {
      out.push({
        kind: 'task',
        task: 'pegar',
        range: cfg.reach,
        point: { x: d.x, y: d.y },
        anchor: { x: d.sprite.x, y: d.sprite.y - 10 },
        use: () => {
          if (this.carrying) {
            this.hooks.say('Estou com as mãos ocupadas.');
            return;
          }
          this.carrying = d.carry;
          d.sprite.destroy();
          this.dropped = this.dropped.filter((o) => o !== d);
        },
      });
    }

    // Jantar
    if (this.has('jantar') && !this.done.has('jantar')) {
      const j = this.st.jantar;
      if (j.step === 'pegar') {
        out.push(this.#pick('jantar', this.#front('geladeira', 18), 'marmita', () => {
          this.#carry('marmita');
          j.step = 'esquentar';
        }));
      } else if (j.step === 'esquentar' && this.#carryingType('marmita')) {
        out.push(this.#target('jantar', this.#front('microondas'), {
          use: () => {
            this.carrying = null;
            j.step = 'cozinhando';
            j.timer = cfg.microwaveSeconds;
          },
        }));
      } else if (j.step === 'pronto') {
        out.push(this.#pick('jantar', this.#front('microondas'), 'jantar', () => {
          this.#carry('jantar');
          j.step = 'comer';
        }));
      } else if (j.step === 'comer' && this.#carryingType('jantar')) {
        out.push(this.#target('jantar', this.#front('mesaJantar'), {
          hold: cfg.eatSeconds,
          complete: () => {
            this.carrying = null;
            this.#finish('jantar');
          },
        }));
      }
    }

    // Louça
    if (this.has('louca') && !this.done.has('louca')) {
      const l = this.st.louca;
      for (const p of l.plates) {
        if (p.taken) continue;
        out.push(this.#pick('louca', this.#front(p.on, p.dx), 'pratos', () => {
          p.taken = true;
          p.sprite.destroy();
          if (this.#carryingType('pratos')) this.carrying.count += 1;
          else this.#carry('pratos', { count: 1 });
        }));
      }
      if (this.#carryingType('pratos')) {
        out.push(this.#target('louca', this.#front('pia'), {
          hold: cfg.washPlateSeconds,
          complete: () => {
            this.carrying.count -= 1;
            l.washed += 1;
            if (this.carrying.count <= 0) this.carrying = null;
            if (l.washed >= l.plates.length) this.#finish('louca');
          },
        }));
      }
    }

    // Lixo
    if (this.has('lixo') && !this.done.has('lixo')) {
      const x = this.st.lixo;
      for (const b of x.bags) {
        if (b.taken) continue;
        out.push(this.#pick('lixo', this.#front(b.on), 'sacos', () => {
          b.taken = true;
          b.sprite.destroy();
          if (this.#carryingType('sacos')) this.carrying.count += 1;
          else this.#carry('sacos', { count: 1 });
        }));
      }
      if (this.#carryingType('sacos')) {
        out.push(this.#target('lixo', this.#front('latao'), {
          use: () => {
            x.deposited += this.carrying.count;
            this.carrying = null;
            if (x.deposited >= x.bags.length) this.#finish('lixo');
          },
        }));
      }
    }

    // Roupa
    if (this.has('roupa') && !this.done.has('roupa')) {
      const r = this.st.roupa;
      if (r.step === 'cesto') {
        out.push(this.#pick('roupa', this.#front('cesto'), 'roupaSuja', () => {
          this.#carry('roupaSuja');
          r.step = 'maquina';
        }));
      } else if (r.step === 'maquina' && this.#carryingType('roupaSuja')) {
        out.push(this.#target('roupa', this.#front('maquina'), {
          use: () => {
            this.carrying = null;
            r.step = 'lavando';
            r.timer = cfg.washerSeconds;
          },
        }));
      } else if (r.step === 'pronta') {
        out.push(this.#pick('roupa', this.#front('maquina'), 'roupaMolhada', () => {
          this.#carry('roupaMolhada');
          r.step = 'varal';
        }));
      } else if (r.step === 'varal' && this.#carryingType('roupaMolhada')) {
        out.push(this.#target('roupa', this.#front('varal'), {
          hold: cfg.hangClothesSeconds,
          complete: () => {
            this.carrying = null;
            this.#finish('roupa');
          },
        }));
      }
    }

    // Regar
    if (this.has('regar') && !this.done.has('regar')) {
      const g = this.st.regar;
      const can = this.#carryingType('regador') ? this.carrying : null;
      if (!can || can.water < cfg.canCapacity) {
        out.push(this.#pick('regar', this.#front('tanque'), 'regador', () => {
          if (can) can.water = cfg.canCapacity;
          else this.#carry('regador', { water: cfg.canCapacity });
        }));
      }
      if (can && can.water > 0) {
        for (const pot of POTS) {
          if (g.watered.has(pot)) continue;
          out.push(this.#target('regar', this.#front(pot), {
            hold: cfg.waterPotSeconds,
            complete: () => {
              g.watered.add(pot);
              can.water -= 1;
              if (g.watered.size >= POTS.length) {
                this.carrying = null;
                this.#finish('regar');
              }
            },
          }));
        }
      }
    }

    // Janelas
    if (this.has('janelas') && !this.done.has('janelas')) {
      const all = this.st.janelas.windows;
      for (const w of all) {
        if (w.closed) continue;
        out.push(this.#target('janelas', { point: w.reach, anchor: { x: w.x * PPM, y: w.y * PPM - 8 } }, {
          hold: cfg.closeWindowSeconds,
          complete: () => {
            w.closed = true;
            w.sprite.setFrame('window-closed');
            if (all.every((o) => o.closed)) this.#finish('janelas');
          },
        }));
      }
    }

    // Uniforme
    if (this.has('uniforme') && !this.done.has('uniforme')) {
      const u = this.st.uniforme;
      if (u.step === 'pegar') {
        out.push(this.#pick('uniforme', this.#front('armarioQuarto'), 'uniforme', () => {
          this.#carry('uniforme');
          u.step = 'passar';
        }));
      } else if (u.step === 'passar' && this.#carryingType('uniforme')) {
        out.push(this.#target('uniforme', this.#front('tabua'), {
          hold: cfg.ironSeconds,
          complete: () => {
            this.#carry('uniformePassado');
            u.step = 'guardar';
          },
        }));
      } else if (u.step === 'guardar' && this.#carryingType('uniformePassado')) {
        out.push(this.#target('uniforme', this.#front('armarioQuarto'), {
          use: () => {
            this.carrying = null;
            this.#finish('uniforme');
          },
        }));
      }
    }

    // Celular (pegar o celular é um item; aqui só o carregador)
    if (this.has('celular') && !this.done.has('celular') && this.hasPhone) {
      out.push(this.#target('celular', this.#front('criadoMudo'), {
        use: () => {
          this.hasPhone = false;
          this.#finish('celular');
        },
      }));
    }

    if (this.listRead) return out;
    // Antes de ler a lista: os objetos respondem só com a fala
    return out.map((t) => ({ ...t, hold: undefined, use: () => this.hooks.say('Primeiro deixa eu ver a lista.') }));
  }

  // ---- Quadro a quadro -----------------------------------------------------

  update(dt, lightsOn, player) {
    if (lightsOn) {
      const j = this.st.jantar;
      if (j.step === 'cozinhando' && (j.timer -= dt) <= 0) {
        j.step = 'pronto';
        this.hooks.sfx.beep(3, 0.2);
      }
      const r = this.st.roupa;
      if (r.step === 'lavando' && (r.timer -= dt) <= 0) {
        r.step = 'pronta';
        this.hooks.sfx.beep(4, 0.2);
      }
    }
    // Ícone do que Artur carrega, nas mãos
    if (this.carrying) {
      this.icon.setFrame(CARRY_ICON[this.carrying.type]).setVisible(true);
      this.icon.setPosition(player.x + (player.facing === 'left' ? -3 : 3), player.y - 9).setDepth(player.depth + 1);
    } else this.icon.setVisible(false);
  }

  /** A luz caiu: Artur larga o que carrega ali mesmo (GDD 4.11). */
  dropCarried(feet) {
    if (!this.carrying) return;
    const sprite = this.scene.add
      .image(feet.x * PPM, feet.y * PPM + 3, 'props', CARRY_ICON[this.carrying.type])
      .setOrigin(0.5, 1)
      .setDepth(feet.y * PPM);
    this.dropped.push({ carry: this.carrying, x: feet.x, y: feet.y, sprite });
    this.carrying = null;
  }

  /** Debug: marca todas as tarefas como feitas. */
  completeAll() {
    this.carrying = null;
    for (const id of this.ids) this.done.add(id);
  }

  /** Resumo para o debug. */
  get debugText() {
    const left = this.ids.filter((id) => !this.done.has(id));
    const j = this.st.jantar;
    const r = this.st.roupa;
    const timers = [
      j.step === 'cozinhando' ? `micro-ondas ${j.timer.toFixed(0)} s` : '',
      r.step === 'lavando' ? `máquina ${r.timer.toFixed(0)} s` : '',
    ].filter(Boolean);
    const carry = this.carrying ? ` · mãos: ${this.carrying.type}` : '';
    return `${left.length ? `faltam ${left.join(', ')}` : 'todas feitas'}${carry}${timers.length ? ` · ${timers.join(', ')}` : ''}`;
  }
}
