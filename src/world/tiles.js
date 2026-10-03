// Índices do tileset da casa (public/assets/sprites/tiles.png).
// Usado pelo jogo e pelo script que desenha o tileset (scripts/sprites).

export const TILE = 16; // px por tile
export const CELL_METERS = 0.5; // cada tile = 0,5 m
export const PPM = TILE / CELL_METERS; // px por metro (32)

export const T = {
  VOID: 0,
  WALL: 1, // topo da parede
  WALL_FACE: 2, // face da parede vista na diagonal (papel de parede)
  WALL_FACE_OUT: 3, // face externa da casa (vista do quintal/varanda)
  TACO_A: 4,
  TACO_B: 5,
  CORRIDOR_A: 6,
  CORRIDOR_B: 7,
  BATHROOM_A: 8,
  BATHROOM_B: 9,
  KITCHEN_A: 10,
  KITCHEN_B: 11,
  MUD_A: 12,
  MUD_B: 13,
  CONCRETE_A: 14,
  CONCRETE_B: 15,
  THRESHOLD: 16, // soleira das portas
};

export const TILE_COUNT = 17;

// Tipo de piso → [variante A, variante B]
export const FLOORS = {
  taco: [T.TACO_A, T.TACO_B],
  corridor: [T.CORRIDOR_A, T.CORRIDOR_B],
  bathroom: [T.BATHROOM_A, T.BATHROOM_B],
  kitchen: [T.KITCHEN_A, T.KITCHEN_B],
  mud: [T.MUD_A, T.MUD_B],
  concrete: [T.CONCRETE_A, T.CONCRETE_B],
};

export const SOLID_TILES = [T.VOID, T.WALL, T.WALL_FACE, T.WALL_FACE_OUT];
