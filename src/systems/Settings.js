// Configurações de desempenho e o tutorial (menu Opções). Ficam salvas com as outras
// opções; aqui elas são lidas da memória (sem ir ao localStorage a cada quadro) e quem
// precisa reagir na hora se inscreve em onChange.
//
//   lighting: 'alta' | 'leve'  — luz leve: menos raios e faixas, recalculada a 30 vezes/s
//   screenFx: true | false     — granulado, vinheta, glitch e filtros de cor da tela
//   fps: 60 | 30               — limite de quadros por segundo
//   tutorial: true | false     — setas douradas indicando o próximo passo

import { options } from './Save.js';

let cache = options.load();
const listeners = new Set();

export const settings = {
  get lightLow() {
    return cache.lighting === 'leve';
  },
  get screenFx() {
    return cache.screenFx !== false;
  },
  get fps30() {
    return cache.fps === 30;
  },
  get tutorial() {
    return !!cache.tutorial;
  },

  /** Muda e salva (mantém as outras opções, como volumes e tela cheia). */
  set(patch) {
    cache = { ...options.load(), ...patch };
    options.save(cache);
    listeners.forEach((fn) => fn(cache));
  },

  onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};

/** Aplica o limite de FPS no laço do jogo (reinicia o laço, sem perder o estado). */
export function applyFps(game) {
  const loop = game.loop;
  const limit = settings.fps30 ? 30 : 0;
  if (loop.fpsLimit === limit) return;
  loop.fpsLimit = limit;
  loop.hasFpsLimit = limit > 0;
  loop._limitRate = limit ? 1000 / limit : 0;
  if (loop.running) {
    loop.sleep();
    loop.wake(true);
  }
}
