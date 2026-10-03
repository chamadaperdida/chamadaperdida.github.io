// Portas e móveis da casa (GDD 13.4), vistos de cima na diagonal.
// Tudo vai para um atlas: props.png + props.json (formato JSON Hash do Phaser).

import { PixelCanvas, seeded } from './canvas.mjs';

const WOOD_DARK = '#2a1d14';
const WOOD = '#5a4130';
const WOOD_LIGHT = '#6b4e3a';
const WOOD_INSET = '#4c3628';
const CAP = '#24221f';
const OUTLINE = '#08080a';

// ---- Portas -----------------------------------------------------------------

function doorPanelH(c, x, y, stickers) {
  c.rect(x, y, 48, 16, WOOD_DARK); // batente
  c.rect(x, y, 48, 3, CAP);
  c.rect(x + 3, y + 3, 42, 13, WOOD);
  c.rect(x + 6, y + 5, 16, 9, WOOD_INSET);
  c.rect(x + 26, y + 5, 16, 9, WOOD_INSET);
  c.rect(x + 3, y + 3, 42, 1, WOOD_LIGHT);
  c.rect(x + 38, y + 9, 2, 2, '#a8925e'); // maçaneta
  if (stickers) {
    // Adesivos infantis desbotados
    c.rect(x + 9, y + 7, 3, 3, '#8f7b8a');
    c.px(x + 10, y + 6, '#8f7b8a');
    c.rect(x + 16, y + 10, 2, 2, '#9a6a74');
    c.rect(x + 29, y + 6, 3, 2, '#7d8fa0');
    c.rect(x + 33, y + 11, 2, 2, '#a8936a');
  }
}

function doorOpenH(c, x, y) {
  c.rect(x, y, 3, 16, WOOD_DARK);
  c.rect(x + 45, y, 3, 16, WOOD_DARK);
  c.rect(x, y, 48, 3, CAP);
  // Folha aberta encostada no batente esquerdo
  c.rect(x + 3, y + 3, 3, 13, WOOD);
  c.rect(x + 3, y + 3, 1, 13, WOOD_LIGHT);
}

function doorClosedV(c, x, y) {
  c.rect(x + 5, y, 6, 48, WOOD);
  c.rect(x + 5, y, 1, 48, WOOD_LIGHT);
  c.rect(x + 10, y, 1, 48, WOOD_DARK);
  c.rect(x + 4, y, 8, 3, WOOD_DARK);
  c.rect(x + 4, y + 45, 8, 3, WOOD_DARK);
  c.rect(x + 4, y + 36, 1, 2, '#a8925e');
}

function doorOpenV(c, x, y) {
  c.rect(x + 4, y, 8, 3, WOOD_DARK);
  c.rect(x + 4, y + 45, 8, 3, WOOD_DARK);
  // Folha aberta, girada para dentro do cômodo
  c.rect(x + 8, y + 3, 8, 3, WOOD);
  c.rect(x + 8, y + 3, 8, 1, WOOD_LIGHT);
}

// ---- Móveis -------------------------------------------------------------------

function bed(c, x, y) {
  // Cama desarrumada, 48×64
  c.rect(x, y, 48, 8, WOOD_DARK); // cabeceira
  c.rect(x + 1, y + 1, 46, 2, WOOD);
  c.rect(x + 2, y + 8, 44, 54, '#8e8b84'); // lençol
  c.rect(x + 5, y + 10, 16, 8, '#a19e96'); // travesseiros
  c.rect(x + 27, y + 11, 16, 7, '#97948c');
  c.rect(x + 2, y + 24, 44, 38, '#3a4656'); // cobertor embolado
  c.rect(x + 2, y + 22, 30, 3, '#465466');
  c.rect(x + 8, y + 30, 20, 2, '#2f3a48');
  c.rect(x + 18, y + 40, 22, 2, '#2f3a48');
  c.rect(x + 6, y + 50, 14, 2, '#465466');
  c.rect(x + 34, y + 26, 10, 6, '#8e8b84'); // lençol aparecendo
  c.rect(x, y + 62, 48, 2, WOOD_DARK); // pé da cama
}

function nightstand(c, x, y) {
  c.rect(x, y + 4, 16, 12, WOOD_DARK);
  c.rect(x, y + 4, 16, 4, WOOD);
  c.rect(x + 6, y + 11, 4, 1, '#a8925e');
  // Frascos de remédio vazios (opacos, sem rótulo: não confundir com remédio de verdade)
  c.rect(x + 2, y + 1, 3, 5, '#5a4232');
  c.rect(x + 2, y + 1, 3, 1, '#7a7468');
  c.rect(x + 6, y + 5, 4, 2, '#5a4232'); // frasco caído
}

function sofa(c, x, y) {
  // 64×28, de frente para a TV (encosto embaixo)
  c.rect(x, y, 64, 28, '#3d302a');
  c.rect(x + 4, y + 2, 56, 16, '#4a3b34');
  c.rect(x + 4, y + 2, 27, 15, '#54443c');
  c.rect(x + 33, y + 2, 27, 15, '#54443c');
  c.rect(x + 14, y + 6, 6, 4, '#4a3b34'); // afundado
  c.rect(x, y + 18, 64, 10, '#352923'); // encosto
  c.rect(x, y + 18, 64, 1, '#4a3b34');
  c.rect(x, y, 4, 22, '#352923');
  c.rect(x + 60, y, 4, 22, '#352923');
}

function tv(c, x, y) {
  // TV de tubo num rack, 32×28
  c.rect(x, y + 18, 32, 10, WOOD_DARK);
  c.rect(x, y + 18, 32, 2, WOOD);
  c.rect(x + 3, y, 26, 19, '#29292b');
  c.rect(x + 3, y, 26, 2, '#3a3a3d');
  c.rect(x + 6, y + 3, 17, 13, '#151b1e');
  c.rect(x + 7, y + 4, 4, 2, '#2a3439'); // reflexo
  c.rect(x + 25, y + 5, 2, 2, '#55555a');
  c.rect(x + 25, y + 9, 2, 2, '#55555a');
}

function phoneTable(c, x, y) {
  // Mesinha com telefone antigo de disco, bege (bem visível), 16×20
  c.rect(x + 1, y + 10, 14, 10, WOOD_DARK);
  c.rect(x + 1, y + 10, 14, 3, WOOD);
  c.rect(x + 1, y + 10, 14, 1, WOOD_LIGHT);
  // Base do telefone
  c.rect(x + 2, y + 4, 12, 7, '#b8a888');
  c.rect(x + 2, y + 4, 12, 1, '#d8ccb0');
  c.rect(x + 2, y + 10, 12, 1, '#8a7c62');
  // Disco
  c.rect(x + 6, y + 6, 4, 4, '#e8e0cc');
  c.px(x + 7, y + 7, '#5a5040');
  c.px(x + 8, y + 8, '#5a5040');
  // Fone no gancho
  c.rect(x + 1, y + 1, 14, 2, '#a89878');
  c.rect(x + 1, y + 1, 3, 4, '#a89878');
  c.rect(x + 12, y + 1, 3, 4, '#a89878');
  c.rect(x + 1, y + 1, 14, 1, '#d8ccb0');
  // Fio
  c.px(x + 14, y + 11, '#3a3228');
  c.px(x + 15, y + 12, '#3a3228');
}

function ringMarks(c, x, y) {
  // Marcas de "tocando" em volta do telefone, 28×10
  const col = '#e8e2cf';
  for (const [dx, dir] of [[0, 1], [27, -1]]) {
    c.px(x + dx, y + 3, col);
    c.px(x + dx, y + 4, col);
    c.px(x + dx, y + 5, col);
    c.px(x + dx + dir, y + 2, col);
    c.px(x + dx + dir, y + 6, col);
    c.px(x + dx + dir * 3, y + 4, col);
    c.px(x + dx + dir * 3, y + 5, col);
    c.px(x + dx + dir * 4, y + 3, col);
    c.px(x + dx + dir * 4, y + 6, col);
  }
}

function shelf(c, x, y) {
  // Estante, 32×24
  c.rect(x, y, 32, 24, WOOD_DARK);
  c.rect(x + 2, y + 2, 28, 6, '#1a130d');
  c.rect(x + 2, y + 11, 28, 6, '#1a130d');
  const books = ['#5a3a3a', '#3a4a5a', '#4a4a3a', '#5a5040'];
  for (let i = 0; i < 6; i++) c.rect(x + 3 + i * 4, y + 3, 3, 5, books[i % 4]);
  for (let i = 0; i < 4; i++) c.rect(x + 4 + i * 6, y + 12, 4, 5, books[(i + 2) % 4]);
  c.rect(x, y + 20, 32, 4, '#1f1610');
}

function fridge(c, x, y) {
  // Geladeira com desenhos de criança presos, 24×36
  c.rect(x, y, 24, 36, '#9a9c96');
  c.rect(x, y, 24, 5, '#b2b4ae');
  c.rect(x, y + 16, 24, 1, '#6e706b');
  c.rect(x + 20, y + 8, 2, 6, '#6e706b');
  c.rect(x + 20, y + 20, 2, 8, '#6e706b');
  // Desenhos
  c.rect(x + 3, y + 7, 8, 7, '#d8d4c4');
  c.rect(x + 5, y + 9, 2, 2, '#a85050');
  c.rect(x + 7, y + 11, 3, 1, '#5070a0');
  c.rect(x + 9, y + 19, 8, 9, '#d8d4c4');
  c.rect(x + 10, y + 22, 6, 1, '#a89040');
  c.rect(x + 12, y + 24, 2, 3, '#5a8a5a');
  c.rect(x, y + 34, 24, 2, '#5c5e59');
}

function kitchenCounter(c, x, y, rand) {
  // Bancada com pia e louça acumulada, 48×28
  c.rect(x, y, 48, 28, '#3e3a34');
  c.rect(x, y, 48, 14, '#68635a');
  c.rect(x + 14, y + 2, 20, 10, '#7f888a');
  c.rect(x + 16, y + 4, 16, 7, '#4f585b');
  c.rect(x + 23, y, 2, 4, '#9aa3a5'); // torneira
  for (let i = 0; i < 7; i++) {
    c.rect(x + 16 + Math.floor(rand() * 12), y + 4 + Math.floor(rand() * 5), 4, 2, '#c4bfae');
  }
  c.rect(x + 3, y + 3, 7, 3, '#b8b2a0'); // pratos ao lado
  c.rect(x + 38, y + 5, 6, 5, '#7a4a2a'); // panela
  c.rect(x, y + 14, 48, 1, '#2c2924');
  c.rect(x + 4, y + 18, 18, 8, '#36322d');
  c.rect(x + 26, y + 18, 18, 8, '#36322d');
}

function bathroomSink(c, x, y) {
  c.rect(x + 1, y, 14, 4, '#3b4144'); // espelho manchado (na parede)
  c.rect(x + 2, y + 1, 12, 2, '#5d686c');
  c.px(x + 5, y + 1, '#4a5356');
  c.rect(x + 2, y + 5, 12, 9, '#9aa2a4');
  c.rect(x + 4, y + 7, 8, 5, '#6f787b');
  c.rect(x + 7, y + 5, 2, 2, '#c0c6c8');
  c.rect(x + 6, y + 14, 4, 2, '#7d8588');
}

function cabinet(c, x, y) {
  c.rect(x, y, 24, 20, '#4b4a46');
  c.rect(x, y, 24, 3, '#5d5c57');
  c.rect(x + 11, y + 3, 1, 15, '#34332f');
  c.rect(x + 8, y + 9, 2, 2, '#8a8a80');
  c.rect(x + 13, y + 9, 2, 2, '#8a8a80');
  c.rect(x, y + 18, 24, 2, '#2e2d2a');
}

function desk(c, x, y) {
  // Mesa do escritório com pastas, 48×28
  c.rect(x, y, 48, 28, WOOD_DARK);
  c.rect(x, y, 48, 14, '#4a3626');
  c.rect(x + 4, y + 2, 12, 9, '#7a6a3a'); // pastas
  c.rect(x + 6, y + 3, 12, 9, '#8a7a48');
  c.rect(x + 22, y + 3, 10, 8, '#4a5a6a');
  c.rect(x + 36, y + 2, 8, 5, '#c8c2b0'); // papéis
  c.rect(x + 35, y + 6, 7, 5, '#b8b2a0');
  c.rect(x, y + 14, 48, 1, '#1a130d');
  c.rect(x + 30, y + 17, 14, 9, '#22180f');
  c.rect(x + 36, y + 21, 2, 1, '#a8925e');
}

function uniformRack(c, x, y) {
  // Farda antiga pendurada, 16×32
  c.rect(x + 7, y, 2, 32, WOOD_DARK);
  c.rect(x + 3, y + 30, 10, 2, WOOD_DARK);
  c.rect(x + 3, y + 4, 10, 2, '#5a5a5a');
  c.rect(x + 2, y + 6, 12, 14, '#2e3a4e'); // farda azul-escura
  c.rect(x + 4, y + 8, 2, 2, '#b8a050'); // distintivo
  c.rect(x + 7, y + 6, 1, 14, '#25303f');
  c.rect(x + 3, y + 3, 10, 2, '#1e2836'); // quepe
}

function box(c, x, y, rand) {
  c.rect(x, y, 16, 16, '#5c4830');
  c.rect(x, y, 16, 6, '#6b5435');
  c.rect(x + 7, y, 2, 6, '#8a7a5a'); // fita
  c.rect(x, y + 6, 16, 1, '#4a3a26');
  if (rand() > 0.5) c.rect(x + 3, y + 9, 6, 3, '#c8c2b0'); // etiqueta
}

function generator(c, x, y) {
  // Gerador velho sob um pequeno telhado com lâmpada externa, 48×40
  c.rect(x, y, 48, 6, '#2b2f33'); // telhadinho
  c.rect(x, y + 5, 48, 1, '#1b1e21');
  c.rect(x + 22, y + 6, 4, 3, '#d8c890'); // lâmpada
  c.rect(x + 4, y + 6, 2, 30, '#2b2f33'); // pilares
  c.rect(x + 42, y + 6, 2, 30, '#2b2f33');
  c.rect(x + 8, y + 14, 32, 22, '#454a34'); // corpo
  c.rect(x + 8, y + 14, 32, 6, '#555b40');
  c.rect(x + 11, y + 22, 12, 10, '#2e3224');
  for (let i = 0; i < 4; i++) c.rect(x + 12, y + 23 + i * 2, 10, 1, '#3a3f2d'); // grade
  c.rect(x + 27, y + 23, 9, 5, '#2a2a28'); // painel
  c.rect(x + 28, y + 24, 2, 2, '#8a3030');
  c.rect(x + 32, y + 24, 2, 2, '#3a3a36');
  c.rect(x + 34, y + 10, 3, 5, '#2a2a28'); // escapamento
  c.rect(x + 8, y + 36, 32, 2, '#2a2d20');
}

// ---- Itens (GDD 4.10) ------------------------------------------------------------

function medicine(c, x, y) {
  // Frasco de remédio controlado (cheio), 5×7 — pequeno, fica em cima dos móveis
  c.rect(x, y, 5, 2, '#e4e0d4'); // tampa
  c.rect(x, y + 2, 5, 5, '#c0661e');
  c.px(x, y + 2, '#e08a40'); // brilho
  c.rect(x + 1, y + 3, 3, 2, '#ece6d4'); // rótulo
}

function battery(c, x, y) {
  // Pilha, 3×7
  c.px(x + 1, y, '#c8c8c0'); // polo
  c.rect(x, y + 1, 3, 3, '#e0b830');
  c.rect(x, y + 4, 3, 3, '#1e1e20');
}

// ---- Móveis onde os itens aparecem ------------------------------------------

function dresser(c, x, y) {
  // Cômoda, 40×26
  c.rect(x, y, 40, 26, WOOD_DARK);
  c.rect(x, y, 40, 7, WOOD);
  c.rect(x, y, 40, 1, WOOD_LIGHT);
  for (let i = 0; i < 2; i++) {
    c.rect(x + 2, y + 9 + i * 8, 36, 6, WOOD_INSET);
    c.rect(x + 18, y + 11 + i * 8, 4, 1, '#a8925e');
  }
}

function diningTable(c, x, y) {
  // Mesa da cozinha com toalha velha, 48×32
  c.rect(x, y, 48, 20, '#5a4a3a');
  c.rect(x + 2, y + 2, 44, 16, '#6e5c48');
  c.rect(x, y + 18, 48, 4, '#3a2c20');
  c.rect(x + 3, y + 22, 3, 10, WOOD_DARK); // pernas
  c.rect(x + 42, y + 22, 3, 10, WOOD_DARK);
  c.rect(x + 30, y + 4, 6, 5, '#b8b2a0'); // prato esquecido
}

function sideboard(c, x, y) {
  // Aparador, 48×24
  c.rect(x, y, 48, 24, WOOD_DARK);
  c.rect(x, y, 48, 8, '#4c3626');
  c.rect(x, y, 48, 1, WOOD);
  c.rect(x + 3, y + 11, 19, 10, WOOD_INSET);
  c.rect(x + 26, y + 11, 19, 10, WOOD_INSET);
  c.rect(x + 20, y + 15, 2, 2, '#a8925e');
  c.rect(x + 26, y + 15, 2, 2, '#a8925e');
  c.rect(x + 20, y + 1, 7, 5, '#5a5a62'); // porta-retrato virado
}

function sideTable(c, x, y) {
  // Mesinha, 16×16
  c.rect(x, y, 16, 8, WOOD);
  c.rect(x, y, 16, 1, WOOD_LIGHT);
  c.rect(x, y + 8, 16, 2, WOOD_DARK);
  c.rect(x + 2, y + 10, 2, 6, WOOD_DARK);
  c.rect(x + 12, y + 10, 2, 6, WOOD_DARK);
}

function consoleTable(c, x, y) {
  // Aparador estreito do corredor, 32×16
  c.rect(x, y, 32, 7, WOOD);
  c.rect(x, y, 32, 1, WOOD_LIGHT);
  c.rect(x, y + 7, 32, 2, WOOD_DARK);
  c.rect(x + 2, y + 9, 2, 7, WOOD_DARK);
  c.rect(x + 28, y + 9, 2, 7, WOOD_DARK);
  c.rect(x + 4, y + 1, 5, 4, '#3a5a3a'); // planta seca
  c.px(x + 6, y, '#5a4a2a');
}

function bathroomShelf(c, x, y) {
  // Prateleira de banheiro, 16×22
  c.rect(x, y, 16, 22, '#3e4446');
  c.rect(x + 1, y + 1, 14, 8, '#2a2e30');
  c.rect(x + 1, y + 11, 14, 8, '#2a2e30');
  c.rect(x, y + 9, 16, 2, '#5d6669');
  c.rect(x, y + 19, 16, 3, '#5d6669');
  c.rect(x + 2, y + 13, 3, 6, '#7a8a90'); // frasco vazio
}

function filingCabinet(c, x, y) {
  // Arquivo de aço, 16×26
  c.rect(x, y, 16, 26, '#4a4e52');
  c.rect(x, y, 16, 4, '#5e6368');
  for (let i = 0; i < 3; i++) {
    c.rect(x + 1, y + 5 + i * 7, 14, 6, '#3c4044');
    c.rect(x + 6, y + 7 + i * 7, 4, 1, '#9a9a90');
  }
}

// ---- Alucinações -------------------------------------------------------------

function helenaSilhouette(c, x, y) {
  // Helena na luz piscando (GDD 5 e 13.5): cabelo preto longo e molhado cobrindo o rosto,
  // camisola branca suja, dedos longos demais. 16×32, de frente.
  const hair = '#0c0b0d';
  const hairWet = '#1c1a20';
  const gown = '#b8b4a8';
  const gownShade = '#8e8a80';
  const skin = '#7c8084';
  // Camisola
  c.rect(x + 4, y + 12, 8, 17, gown);
  c.rect(x + 3, y + 18, 10, 11, gown);
  c.rect(x + 5, y + 20, 1, 9, gownShade);
  c.rect(x + 9, y + 16, 1, 13, gownShade);
  c.rect(x + 7, y + 24, 2, 2, '#6e6a60'); // mancha
  // Braços caídos e dedos longos
  c.rect(x + 2, y + 13, 1, 10, skin);
  c.rect(x + 13, y + 13, 1, 10, skin);
  c.rect(x + 2, y + 23, 1, 4, skin);
  c.rect(x + 13, y + 23, 1, 4, skin);
  c.px(x + 1, y + 26, skin);
  c.px(x + 14, y + 26, skin);
  // Pés
  c.rect(x + 5, y + 29, 2, 2, skin);
  c.rect(x + 9, y + 29, 2, 2, skin);
  // Cabelo cobrindo o rosto, caindo até o peito
  c.rect(x + 5, y + 2, 6, 2, hair);
  c.rect(x + 4, y + 4, 8, 10, hair);
  c.rect(x + 3, y + 7, 10, 9, hair);
  c.rect(x + 4, y + 16, 2, 3, hair);
  c.rect(x + 10, y + 16, 2, 4, hair);
  c.px(x + 6, y + 6, hairWet);
  c.px(x + 9, y + 9, hairWet);
  c.px(x + 7, y + 12, hairWet);
  c.px(x + 10, y + 21, '#3a4248'); // pingando
}

function balloon(c, x, y) {
  // Balão vermelho de festa com barbante, 9×22
  c.rect(x + 2, y, 5, 1, '#9a1218');
  c.rect(x + 1, y + 1, 7, 1, '#b3161d');
  c.rect(x, y + 2, 9, 7, '#b3161d');
  c.rect(x + 1, y + 9, 7, 2, '#9a1218');
  c.rect(x + 2, y + 11, 5, 1, '#7a0e14');
  c.rect(x + 2, y + 2, 2, 3, '#e05a60'); // brilho
  c.px(x + 4, y + 12, '#7a0e14'); // nó
  // Barbante
  c.px(x + 4, y + 13, '#c8c2b0');
  c.px(x + 5, y + 14, '#c8c2b0');
  c.px(x + 5, y + 15, '#c8c2b0');
  c.px(x + 4, y + 16, '#c8c2b0');
  c.px(x + 4, y + 17, '#c8c2b0');
  c.px(x + 3, y + 18, '#c8c2b0');
  c.px(x + 4, y + 19, '#c8c2b0');
  c.px(x + 4, y + 20, '#c8c2b0');
  c.px(x + 5, y + 21, '#c8c2b0');
}

function bloodPool(c, x, y) {
  // Poça de sangue no chão, 26×10
  const dark = '#3e0608';
  const mid = '#5c0a0e';
  const hi = '#7a161a';
  c.rect(x + 5, y, 14, 1, dark);
  c.rect(x + 2, y + 1, 20, 2, mid);
  c.rect(x, y + 3, 26, 4, mid);
  c.rect(x + 3, y + 7, 18, 2, mid);
  c.rect(x + 7, y + 9, 9, 1, dark);
  c.rect(x + 20, y + 2, 4, 1, dark);
  c.rect(x + 6, y + 3, 6, 1, hi); // reflexo
  c.px(x + 15, y + 5, hi);
}

function drip(c, x, y) {
  c.px(x, y, '#7a161a');
  c.px(x, y + 1, '#5c0a0e');
}

/**
 * Vulto correndo, de perfil (virado para a direita), 20×32. 4 quadros de corrida:
 * corpo inclinado para a frente, capa esvoaçando para trás, pernas e braços em passada.
 */
function shadowRun(frame) {
  // [perna da frente: x do pé, perna de trás: x do pé, pé de trás levantado?, braço da frente dx]
  const poses = [
    [15, 3, true, 3],
    [12, 7, false, 1],
    [15, 4, true, -2],
    [11, 8, false, 0],
  ];
  const [front, back, backUp, arm] = poses[frame];
  return (c, x, y) => {
    const B = '#030304';
    const line = (x0, y0, x1, y1) => {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let i = 0; i <= n; i++) {
        const px = Math.round(x0 + ((x1 - x0) * i) / n);
        const py = Math.round(y0 + ((y1 - y0) * i) / n);
        c.rect(x + px, y + py, 2, 1, B);
      }
    };
    // Capuz e cabeça (inclinados para a frente)
    c.rect(x + 10, y + 2, 5, 2, B);
    c.rect(x + 9, y + 4, 7, 6, B);
    c.px(x + 16, y + 6, B);
    // Tronco inclinado
    for (let i = 0; i < 9; i++) c.rect(x + 8 - Math.floor(i / 3), y + 10 + i, 7, 1, B);
    // Capa esvoaçando para trás (muda um pouco a cada quadro)
    const flap = frame % 2;
    c.rect(x + 2, y + 13 + flap, 4, 6, B);
    c.rect(x, y + 15 + flap, 3, 3, B);
    c.px(x, y + 19 + flap, B);
    // Braço da frente
    line(12, 12, 14 + arm, 18);
    // Pernas: quadril em (8, 19)
    line(8, 19, front, 29);
    line(front, 29, front + 2, 30);
    if (backUp) {
      line(7, 19, back + 1, 25);
      line(back + 1, 25, back - 1, 27);
    } else {
      line(7, 19, back, 29);
      line(back, 29, back + 1, 30);
    }
  };
}

function tvStatic(seed) {
  // Chiado na tela da TV, 17×13 (encaixa na tela do sprite 'tv')
  return (c, x, y, rand) => {
    c.rect(x, y, 17, 13, '#5a6266');
    for (let yy = 0; yy < 13; yy++) {
      for (let xx = 0; xx < 17; xx++) {
        const v = rand();
        if (v < 0.33) c.px(x + xx, y + yy, '#c8d0d4');
        else if (v < 0.55) c.px(x + xx, y + yy, '#1e2426');
      }
    }
    c.rect(x, y + ((seed * 5) % 13), 17, 1, '#e8eef0'); // linha de varredura
  };
}

function key(c, x, y) {
  // Chave pequena de latão, 7×4
  c.rect(x, y, 3, 3, '#b8973a');
  c.px(x + 1, y + 1, '#2a2416');
  c.rect(x + 3, y + 1, 4, 1, '#b8973a');
  c.px(x + 5, y + 2, '#b8973a');
  c.px(x + 6, y + 2, '#8a6e28');
}

// ---- Atlas ------------------------------------------------------------------

// [nome, largura, altura, desenho, contorno?]
const PROPS = [
  ['door-h-closed', 48, 16, (c, x, y) => doorPanelH(c, x, y, false)],
  ['door-h-clara', 48, 16, (c, x, y) => doorPanelH(c, x, y, true)],
  ['door-h-open', 48, 16, doorOpenH],
  ['door-v-closed', 16, 48, doorClosedV],
  ['door-v-open', 16, 48, doorOpenV],
  ['bed', 48, 64, bed, true],
  ['nightstand', 16, 16, nightstand, true],
  ['sofa', 64, 28, sofa, true],
  ['tv', 32, 28, tv, true],
  ['phone-table', 16, 20, phoneTable, true],
  ['ring-marks', 28, 10, ringMarks],
  ['shelf', 32, 24, shelf, true],
  ['fridge', 24, 36, fridge, true],
  ['kitchen-counter', 48, 28, kitchenCounter, true],
  ['bathroom-sink', 16, 16, bathroomSink, true],
  ['cabinet', 24, 20, cabinet, true],
  ['desk', 48, 28, desk, true],
  ['uniform', 16, 32, uniformRack, true],
  ['box', 16, 16, box, true],
  ['generator', 48, 40, generator, true],
  ['medicine', 5, 7, medicine, true],
  ['battery', 3, 7, battery, true],
  ['dresser', 40, 26, dresser, true],
  ['dining-table', 48, 32, diningTable, true],
  ['sideboard', 48, 24, sideboard, true],
  ['side-table', 16, 16, sideTable, true],
  ['console-table', 32, 16, consoleTable, true],
  ['bathroom-shelf', 16, 22, bathroomShelf, true],
  ['filing-cabinet', 16, 26, filingCabinet, true],
  ['helena-silhouette', 16, 32, helenaSilhouette, true],
  ['balloon', 9, 22, balloon, true],
  ['blood-pool', 26, 10, bloodPool],
  ['drip', 1, 2, drip],
  ['shadow-run-0', 20, 32, shadowRun(0)],
  ['shadow-run-1', 20, 32, shadowRun(1)],
  ['shadow-run-2', 20, 32, shadowRun(2)],
  ['shadow-run-3', 20, 32, shadowRun(3)],
  ['tv-static-0', 17, 13, tvStatic(0)],
  ['tv-static-1', 17, 13, tvStatic(1)],
  ['tv-static-2', 17, 13, tvStatic(2)],
  ['key', 7, 4, key, true],
];

export function drawProps() {
  // Empacota em prateleiras de 256 px de largura, com 1 px de folga para o contorno.
  const ATLAS_WIDTH = 256;
  const PAD = 1;
  const placed = [];
  let x = 0;
  let y = 0;
  let rowHeight = 0;
  for (const [name, w, h, draw, outline] of PROPS) {
    const cw = w + PAD * 2;
    const ch = h + PAD * 2;
    if (x + cw > ATLAS_WIDTH) {
      x = 0;
      y += rowHeight;
      rowHeight = 0;
    }
    placed.push({ name, x: x + PAD, y: y + PAD, w, h, draw, outline });
    x += cw;
    rowHeight = Math.max(rowHeight, ch);
  }
  const height = y + rowHeight;
  const c = new PixelCanvas(ATLAS_WIDTH, height);
  const frames = {};
  placed.forEach((p, i) => {
    p.draw(c, p.x, p.y, seeded(100 + i));
    if (p.outline) {
      // contorno só por fora: desenha na borda de 1px reservada
      c.outline(p.x - PAD, p.y - PAD, p.w + PAD * 2, p.h + PAD * 2, OUTLINE);
      frames[p.name] = { frame: { x: p.x - PAD, y: p.y - PAD, w: p.w + PAD * 2, h: p.h + PAD * 2 } };
    } else {
      frames[p.name] = { frame: { x: p.x, y: p.y, w: p.w, h: p.h } };
    }
  });
  const json = {
    frames,
    meta: { image: 'props.png', size: { w: ATLAS_WIDTH, h: height }, scale: '1' },
  };
  return { canvas: c, json };
}
