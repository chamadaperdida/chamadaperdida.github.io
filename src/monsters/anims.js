// Nomes dos quadros animados de cada monstro no atlas (gerados em scripts/sprites/monsters.mjs).

const seq = (prefix, n) => Array.from({ length: n }, (_, i) => prefix + '-' + i);

export const MONSTER_ANIMS = {
  invader: { side: seq('invader-side', 8), down: seq('invader-down', 4), up: seq('invader-up', 4) },
  distorted: { side: seq('distorted-side', 8), down: seq('distorted-down', 4), up: seq('distorted-up', 4) },
  clara: { side: seq('clara-side', 6), down: seq('clara-down', 6), up: seq('clara-up', 6) },
};
