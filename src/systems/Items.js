// Remédios e pilhas (GDD 4.10). Quantidade fixa por noite (9.1), sorteados entre os
// lugares possíveis, de preferência em cômodos diferentes. Não acumulam: usar é na hora.

import { ITEM_SPOTS } from '../world/houseMap.js';
import { PPM } from '../world/tiles.js';

function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Escolhe `count` lugares para `type`, evitando repetir cômodo enquanto der. */
function pickSpots(type, count, taken) {
  const options = shuffle(ITEM_SPOTS.filter((s) => s.types.includes(type) && !taken.has(s)));
  const picked = [];
  const rooms = new Set();
  for (const pass of [true, false]) {
    for (const spot of options) {
      if (picked.length >= count) break;
      if (picked.includes(spot) || (pass && rooms.has(spot.room))) continue;
      picked.push(spot);
      rooms.add(spot.room);
    }
  }
  picked.forEach((s) => taken.add(s));
  return picked;
}

export class Items {
  constructor(scene, night) {
    const taken = new Set();
    const spots = [
      ...pickSpots('medicine', night.medicineCount, taken).map((s) => ({ ...s, type: 'medicine' })),
      ...pickSpots('battery', night.batteryCount, taken).map((s) => ({ ...s, type: 'battery' })),
    ];
    this.list = spots.map((s) => {
      const sprite = scene.add.image(s.x * PPM, s.y * PPM, 'props', s.type).setOrigin(0.5, 1);
      sprite.setDepth(sprite.y);
      return { type: s.type, x: s.x, y: s.y, room: s.room, sprite };
    });
  }

  remaining(type) {
    return this.list.filter((i) => i.type === type).length;
  }

  take(item) {
    item.sprite.destroy();
    this.list = this.list.filter((i) => i !== item);
  }
}
