// Remédios, pilhas, chave, celular e fusível (GDD 4.4, 4.10 e 4.11).
// Ficam em cima dos móveis, em lugares específicos (ITEM_SPOTS), sorteados a cada noite.
// O que cabe em cada lugar depende do cômodo do móvel (GDD 4.2). Quantidade fixa por
// noite (9.1), de preferência em cômodos diferentes. Usar é na hora (não acumula).

import { ITEM_SPOTS, ROOM_ITEMS } from '../world/houseMap.js';
import { PPM } from '../world/tiles.js';

// O Artur pega o item de frente para o móvel: o ponto de alcance fica logo à frente dele.
const REACH_IN_FRONT = 0.35; // metros além da borda da frente do móvel

function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export class Items {
  /**
   * @param furniture Map id → { sprite, def } dos móveis já criados
   */
  constructor(scene, night, furniture) {
    this.scene = scene;
    this.furniture = furniture;
    // Lugares possíveis, já com o cômodo e os tipos permitidos
    this.free = ITEM_SPOTS.map((spot) => {
      const f = furniture.get(spot.on);
      return { ...spot, room: f.def.room, types: ROOM_ITEMS[f.def.room] ?? [] };
    });
    this.list = [];
    this.place('medicine', night.medicineCount);
    this.place('battery', night.batteryCount);
  }

  /**
   * Sorteia `count` lugares livres para `type`, evitando repetir cômodo enquanto der.
   * excludeRooms: ex.: a chave nunca cai dentro do cômodo trancado (GDD 4.9).
   * opts.anyRoom: ignora a tabela do que pode aparecer em cada cômodo (celular, fusível).
   * opts.filter(point): só lugares cujo ponto de alcance (m) passe no filtro.
   */
  place(type, count, excludeRooms = [], { anyRoom = false, filter = null } = {}) {
    const options = shuffle(
      this.free.filter(
        (s) =>
          (anyRoom || s.types.includes(type)) &&
          !excludeRooms.includes(s.room) &&
          (!filter || filter(this.#reachPoint(s))),
      ),
    );
    const picked = [];
    const rooms = new Set();
    for (const avoidRepeat of [true, false]) {
      for (const spot of options) {
        if (picked.length >= count) break;
        if (picked.includes(spot) || (avoidRepeat && rooms.has(spot.room))) continue;
        picked.push(spot);
        rooms.add(spot.room);
      }
    }
    this.free = this.free.filter((s) => !picked.includes(s));
    for (const spot of picked) this.list.push(this.#create(type, spot));
    return picked.length;
  }

  /**
   * Lugares livres onde `type` pode aparecer, sem ocupar nenhum (para quem escolhe o lugar
   * antes, como a chave do evento da tranca). Cada um vem com `reach` (m).
   */
  candidates(type, excludeRooms = []) {
    return this.free
      .filter((s) => s.types.includes(type) && !excludeRooms.includes(s.room))
      .map((s) => ({ spot: s, reach: this.#reachPoint(s) }));
  }

  /** Coloca `type` num lugar livre escolhido (de candidates). Devolve o item. */
  placeAt(type, spot) {
    this.free = this.free.filter((s) => s !== spot);
    const item = this.#create(type, spot);
    this.list.push(item);
    return item;
  }

  /** Ponto de alcance (m) de um lugar, sem criar o item. */
  #reachPoint(spot) {
    const { sprite: base } = this.furniture.get(spot.on);
    return { x: (base.x + spot.dx) / PPM, y: (base.y + base.height) / PPM + REACH_IN_FRONT, room: spot.room };
  }

  #create(type, spot) {
    const { sprite: base } = this.furniture.get(spot.on);
    const sprite = this.scene.add.image(base.x + spot.dx, base.y + spot.dy, 'props', type).setOrigin(0.5, 1);
    sprite.setDepth(base.depth + 1); // por cima do tampo do móvel
    return {
      type,
      room: spot.room,
      on: spot.on,
      spot,
      sprite,
      // ponto de alcance (m): na frente do móvel, alinhado com o item
      x: sprite.x / PPM,
      y: (base.y + base.height) / PPM + REACH_IN_FRONT,
    };
  }

  remaining(type) {
    return this.list.filter((i) => i.type === type).length;
  }

  /** Pega o item: some da casa e o lugar volta a ficar livre. */
  take(item) {
    item.sprite.destroy();
    this.list = this.list.filter((i) => i !== item);
    this.free.push({ ...item.spot });
  }
}
