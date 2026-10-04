// Tarefas obrigatórias da lista da rotina (GDD 4.11).
//
// - Fixas por noite (balance: perNight.tasks). Só podem ser feitas depois de ler a lista.
// - Carregar: com as mãos ocupadas Artur não corre. Se a luz cair, larga o que carrega
//   ali mesmo; dá para pegar de volta quando a luz voltar.
// - No escuro nenhuma tarefa avança: não dá para pegar objetos de tarefa e as interações
//   param. Micro-ondas, máquina e ferro precisam de luz (os timers pausam).
// - Tarefa feita não se desfaz.
// - Artur pode soltar o que carrega quando quiser (Q) e pegar de volta depois.
// - Micro-ondas e máquina mostram que estão funcionando e quanto tempo falta.
// - Progresso: tarefas com vários itens mostram "(x/n)" na lista da geladeira.
// - Próximo passo: legenda pequena e direta enquanto Artur carrega algo (some ao soltar
//   ou ao concluir a ação).
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

// O que Artur carrega → de qual tarefa é
const CARRY_TASK = {
  marmita: 'jantar',
  jantar: 'jantar',
  pratos: 'louca',
  sacos: 'lixo',
  roupaSuja: 'roupa',
  roupaMolhada: 'roupa',
  regador: 'regar',
  uniforme: 'uniforme',
  uniformePassado: 'uniforme',
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
  { on: 'aparador', dx: 32, dy: 7 },
  { on: 'mesa', dx: 27, dy: 14 },
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

// Onde o item fica nas mãos, por direção (px a partir dos pés); 'up' fica atrás do corpo
const HANDS = {
  down: { x: 0, y: -10, behind: false },
  up: { x: 0, y: -12, behind: true },
  left: { x: -5, y: -10, behind: false },
  right: { x: 5, y: -10, behind: false },
};

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.max(0, Math.ceil(s) % 60)).padStart(2, '0')}`;

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
    // Regar: só os vasos da tarefa ficam com sede (murchos); os outros estão vivos
    if (this.has('regar')) for (const pot of POTS) furniture.get(pot).sprite.setFrame('plant-pot-dry');
    // Celular: nunca no quarto do Artur (nem na suíte), senão já estaria ao lado do carregador
    if (this.has('celular')) items.place('phone', 1, ['quartoArtur', 'suite'], { anyRoom: true });

    this.icon = scene.add.image(0, 0, 'props', 'plate').setOrigin(0.5, 1).setVisible(false);

    // Mostradores de tempo dos aparelhos (aparecem enquanto funcionam)
    this.displays = {};
    for (const [key, id] of [
      ['microwave', 'microondas'],
      ['washer', 'maquina'],
    ]) {
      const s = furniture.get(id).sprite;
      const text = scene.add
        .text(s.x + s.width / 2, s.y - 1, '', {
          fontFamily: 'VT323, monospace',
          fontSize: '11px',
          color: '#9ae0a0',
          backgroundColor: '#0a0c0acc',
          padding: { x: 2, y: 0 },
          resolution: 4,
        })
        .setOrigin(0.5, 1)
        .setDepth(s.depth + 2)
        .setVisible(false);
      this.displays[key] = { sprite: s, text, off: s.frame.name, on: `${s.frame.name}-on` };
    }
  }

  has(id) {
    return this.ids.includes(id);
  }

  get allDone() {
    return this.ids.every((id) => this.done.has(id));
  }

  /** Linhas da folha da geladeira: nome (com "(x/n)" nas tarefas de vários itens) e feita?. */
  get lines() {
    return this.ids.map((id) => {
      const c = this.count(id);
      return { text: c ? `${TASK_NAMES[id]} (${c[0]}/${c[1]})` : TASK_NAMES[id], done: this.done.has(id) };
    });
  }

  /** [feitos, total] das tarefas com vários itens; null nas outras. */
  count(id) {
    const s = this.st;
    if (id === 'louca') return [s.louca.washed, s.louca.plates.length];
    if (id === 'lixo') return [s.lixo.deposited, s.lixo.bags.length];
    if (id === 'regar') return [s.regar.watered.size, POTS.length];
    if (id === 'janelas') return [s.janelas.windows.filter((w) => w.closed).length, s.janelas.windows.length];
    return null;
  }

  /** Algo desta tarefa ficou no chão (soltou com Q ou a luz caiu)? */
  #droppedFor(id) {
    return this.dropped.some((d) => CARRY_TASK[d.carry.type] === id);
  }

  /** Instrução direta para o que está nas mãos (legenda do HUD); '' se as mãos estão livres. */
  get hint() {
    const c = this.carrying;
    if (!c) return this.hasPhone ? 'Carregar no criado-mudo do quarto' : '';
    switch (c.type) {
      case 'marmita':
        return 'Esquentar no micro-ondas';
      case 'jantar':
        return 'Comer na mesa de jantar';
      case 'pratos':
        return 'Lavar na pia da cozinha';
      case 'sacos':
        return 'Levar ao latão da garagem';
      case 'roupaSuja':
        return 'Pôr na máquina de lavar';
      case 'roupaMolhada':
        return 'Estender no varal do quintal';
      case 'regador':
        return c.water > 0 ? 'Regar os vasos' : 'Encher no tanque';
      case 'uniforme':
        return 'Passar na tábua da lavanderia';
      case 'uniformePassado':
        return 'Guardar no armário do quarto';
      default:
        return '';
    }
  }

  /** Progresso e próximo passo de uma tarefa, em texto curto (debug). */
  status(id) {
    if (this.done.has(id)) return 'feito';
    if (this.#droppedFor(id) && !this.carrying) return 'pegar de volta o que ficou no chão';
    const c = this.carrying;
    switch (id) {
      case 'jantar': {
        const j = this.st.jantar;
        return {
          pegar: 'pegar a marmita no freezer da lavanderia',
          esquentar: 'esquentar no micro-ondas da cozinha',
          cozinhando: `esquentando no micro-ondas (${fmt(j.timer)})`,
          pronto: 'pegar o prato no micro-ondas',
          comer: 'comer na mesa da sala de jantar',
        }[j.step];
      }
      case 'louca': {
        const l = this.st.louca;
        const left = l.plates.filter((p) => !p.taken).length;
        const more = left ? ` · faltam ${left} pela casa` : '';
        const next = c?.type === 'pratos' ? `lavar na pia da cozinha (${c.count} na mão)${more}` : `achar os pratos pela casa (faltam ${left})`;
        return `${l.washed}/${l.plates.length} lavados · ${next}`;
      }
      case 'lixo': {
        const x = this.st.lixo;
        const left = x.bags.filter((b) => !b.taken).length;
        const more = left ? ` · faltam ${left} nas lixeiras` : '';
        const next = c?.type === 'sacos' ? `levar ao latão da garagem (${c.count} na mão)${more}` : `pegar os sacos das lixeiras: cozinha, banheiro e escritório (faltam ${left})`;
        return `${x.deposited}/${x.bags.length} no latão · ${next}`;
      }
      case 'roupa': {
        const r = this.st.roupa;
        return {
          cesto: 'pegar o cesto no quarto',
          maquina: 'pôr na máquina da lavanderia',
          lavando: `lavando na máquina (${fmt(r.timer)})`,
          pronta: 'tirar a roupa da máquina',
          varal: 'estender no varal do quintal',
        }[r.step];
      }
      case 'regar': {
        const n = this.st.regar.watered.size;
        let next = 'pegar o regador no tanque da lavanderia';
        if (c?.type === 'regador') next = c.water > 0 ? `regar os vasos: sala, jardim e varanda (água para ${c.water})` : 'encher o regador no tanque';
        return `${n}/${POTS.length} vasos · ${next}`;
      }
      case 'janelas': {
        const w = this.st.janelas.windows;
        return `${w.filter((o) => o.closed).length}/${w.length} fechadas`;
      }
      case 'uniforme':
        return {
          pegar: 'pegar o uniforme no armário do quarto',
          passar: 'passar na tábua da lavanderia',
          guardar: 'guardar no armário do quarto',
        }[this.st.uniforme.step];
      case 'celular':
        return this.hasPhone ? 'pôr para carregar no criado-mudo do quarto' : 'achar o celular (está no silencioso)';
      default:
        return '';
    }
  }

  /** Tarefa da coisa que está nas mãos (para avisar depois de pegar de volta). */
  get carryingTask() {
    return this.carrying ? CARRY_TASK[this.carrying.type] : null;
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
        out.push(this.#pick('jantar', this.#front('freezer'), 'marmita', () => {
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
            // Prato limpo empilhado no canto da bancada da pia
            const pia = this.furniture.get('pia').sprite;
            this.scene.add
              .image(pia.x + 7, pia.y + 7 - (l.washed - 1) * 2, 'props', 'plate')
              .setOrigin(0.5, 1)
              .setDepth(pia.depth + 1 + l.washed);
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
          // O cesto vai para as mãos: some do quarto (não fica um no chão e outro na mão)
          const cesto = this.furniture.get('cesto').sprite;
          cesto.setVisible(false);
          if (cesto.body) cesto.body.enable = false;
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
            // A roupa fica estendida no varal
            this.furniture.get('varal').sprite.setFrame('clothesline-full');
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
              this.furniture.get(pot).sprite.setFrame('plant-pot-wet');
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
          // Fica carregando no criado-mudo
          const cm = this.furniture.get('criadoMudo').sprite;
          this.scene.add.image(cm.x + 13, cm.y + 9, 'props', 'phone-charging').setOrigin(0.5, 1).setDepth(cm.depth + 1);
          this.#finish('celular');
        },
      }));
    }

    if (this.listRead) return out;
    // Antes de ler a lista: os objetos respondem só com a fala
    // (sem `complete`: as tarefas de segurar F seriam concluídas direto com um toque)
    return out.map((t) => ({
      ...t,
      hold: undefined,
      complete: undefined,
      use: () => this.hooks.say('Primeiro deixa eu ver a lista.'),
    }));
  }

  // ---- Quadro a quadro -----------------------------------------------------

  update(dt, lightsOn, time) {
    const j = this.st.jantar;
    const r = this.st.roupa;
    if (lightsOn) {
      if (j.step === 'cozinhando' && (j.timer -= dt) <= 0) {
        j.step = 'pronto';
        this.hooks.sfx.beep(3, 0.2);
      }
      if (r.step === 'lavando' && (r.timer -= dt) <= 0) {
        r.step = 'pronta';
        this.hooks.sfx.beep(4, 0.2);
      }
    }
    this.#display('microwave', j.step === 'cozinhando', j.step === 'pronto', j.timer, lightsOn, time);
    this.#display('washer', r.step === 'lavando', r.step === 'pronta', r.timer, lightsOn, time);
  }

  /** Aparelho funcionando: sprite "ligado" + tempo que falta. Pronto: 0:00 piscando. Sem luz: apagado. */
  #display(key, running, ready, timer, lightsOn, time) {
    const d = this.displays[key];
    const on = lightsOn && (running || ready);
    d.sprite.setFrame(lightsOn && running ? d.on : d.off);
    d.text.setVisible(on && (running || Math.floor(time / 400) % 2 === 0));
    if (on) d.text.setText(running ? fmt(timer) : '0:00');
  }

  /** O que Artur carrega fica nas mãos. Chamado depois da física, para não tremer. */
  positionIcon(player) {
    if (!this.carrying) {
      this.icon.setVisible(false);
      return;
    }
    const hand = HANDS[player.facing] ?? HANDS.down;
    this.icon
      .setFrame(CARRY_ICON[this.carrying.type])
      .setVisible(true)
      .setPosition(player.x + hand.x, player.y + hand.y)
      .setDepth(player.depth + (hand.behind ? -1 : 1));
  }

  /** A luz caiu (ou o jogador soltou com Q): Artur larga o que carrega ali mesmo (GDD 4.11). */
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
