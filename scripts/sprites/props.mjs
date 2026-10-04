// Portas e móveis da casa (GDD 13.4), vistos de cima na diagonal.
// Tudo vai para um atlas: props.png + props.json (formato JSON Hash do Phaser).

import { PixelCanvas, seeded } from './canvas.mjs';
import { ash, claraFrames, distortedFrames, helena, invaderFrames, shadowRunFrames } from './monsters.mjs';

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

// ---- Móveis da casa nova (GDD 4.2) -----------------------------------------------

function diningBig(c, x, y) {
  // Mesa grande da sala de jantar, cadeiras demais para uma pessoa só, 80×40
  for (const cx of [10, 30, 50, 66]) {
    c.rect(x + cx, y, 8, 5, WOOD_DARK); // cadeiras atrás
    c.rect(x + cx, y + 34, 8, 6, WOOD_DARK); // cadeiras na frente
    c.rect(x + cx + 1, y + 35, 6, 2, WOOD);
  }
  c.rect(x + 2, y + 5, 76, 22, '#5a4a3a');
  c.rect(x + 4, y + 7, 72, 18, '#6e5c48');
  c.rect(x + 2, y + 27, 76, 4, '#3a2c20');
  c.rect(x + 5, y + 31, 3, 4, WOOD_DARK);
  c.rect(x + 72, y + 31, 3, 4, WOOD_DARK);
  c.rect(x + 34, y + 10, 10, 8, '#7a7468'); // fruteira vazia
}

function washer(c, x, y) {
  // Máquina de lavar velha, 24×24
  c.rect(x, y, 24, 24, '#a4a6a0');
  c.rect(x, y, 24, 5, '#8a8c86'); // painel
  c.rect(x + 3, y + 2, 4, 1, '#3a3a36');
  c.rect(x + 16, y + 1, 3, 3, '#5a5c58'); // botão
  c.rect(x + 5, y + 8, 14, 13, '#6e706b'); // tampa
  c.rect(x + 7, y + 10, 10, 9, '#4e5a60');
  c.rect(x + 8, y + 11, 3, 2, '#7a8a90');
  c.rect(x, y + 22, 24, 2, '#5c5e59');
}

function laundryTank(c, x, y) {
  // Tanque de lavar roupa, 24×20
  c.rect(x, y, 24, 20, '#8a8c86');
  c.rect(x + 2, y + 2, 20, 10, '#5c6266');
  c.rect(x + 3, y + 3, 18, 8, '#4a5054');
  c.rect(x + 11, y, 2, 3, '#b0b6b8'); // torneira
  c.rect(x + 2, y + 13, 20, 1, '#6e706b'); // tábua de esfregar
  c.rect(x + 3, y + 14, 4, 6, '#5c5e59');
  c.rect(x + 17, y + 14, 4, 6, '#5c5e59');
}

function ironingBoard(c, x, y) {
  // Tábua de passar com ferro, 32×14
  c.rect(x + 2, y + 2, 28, 7, '#7a8a94');
  c.rect(x + 2, y + 2, 28, 1, '#9aaab4');
  c.rect(x, y + 4, 3, 4, '#7a8a94'); // bico
  c.rect(x + 20, y + 3, 7, 4, '#3a3a3e'); // ferro
  c.rect(x + 21, y + 3, 5, 1, '#5a5a60');
  c.rect(x + 6, y + 9, 2, 5, '#4a4a4e');
  c.rect(x + 24, y + 9, 2, 5, '#4a4a4e');
}

function counterMicrowave(c, x, y) {
  // Bancada com micro-ondas, 32×28
  c.rect(x, y, 32, 28, '#3e3a34');
  c.rect(x, y, 32, 14, '#68635a');
  c.rect(x + 4, y + 1, 24, 11, '#2e2e30');
  c.rect(x + 6, y + 3, 15, 7, '#1a1e20');
  c.rect(x + 7, y + 4, 3, 2, '#2e383c');
  c.rect(x + 23, y + 3, 3, 1, '#7a3a2a'); // visor
  c.rect(x + 23, y + 6, 3, 3, '#55555a');
  c.rect(x, y + 14, 32, 1, '#2c2924');
  c.rect(x + 4, y + 18, 24, 8, '#36322d');
}

function garbageCan(c, x, y) {
  // Latão de lixo da garagem, 16×20
  c.rect(x + 1, y, 14, 4, '#3e4a40');
  c.rect(x + 6, y, 4, 1, '#2a322c'); // alça
  c.rect(x + 2, y + 4, 12, 16, '#334036');
  for (let i = 0; i < 3; i++) c.rect(x + 4 + i * 4, y + 6, 1, 12, '#2a342c');
}

function trashBin(c, x, y) {
  // Lixeira pequena, 8×10
  c.rect(x, y, 8, 2, '#4a4a4e');
  c.rect(x + 1, y + 2, 6, 8, '#3a3a3e');
  c.rect(x + 2, y + 3, 1, 6, '#2a2a2e');
}

function plantPot(c, x, y) {
  // Vaso com planta morrendo, 12×14
  c.rect(x + 2, y + 8, 8, 6, '#7a4a32');
  c.rect(x + 1, y + 8, 10, 2, '#8a5a3e');
  c.rect(x + 5, y + 2, 2, 6, '#4a5a32');
  c.rect(x + 2, y + 3, 3, 2, '#5a6a3a');
  c.rect(x + 7, y + 1, 3, 2, '#6a6a3a');
  c.rect(x + 1, y + 5, 2, 2, '#5a5432'); // folha seca
  c.px(x + 9, y + 5, '#6a5a32');
}

function clothesline(c, x, y) {
  // Varal coberto: telhadinho e varal com prendedores, 64×24
  c.rect(x, y, 64, 5, '#2b2f33');
  c.rect(x, y + 4, 64, 1, '#1b1e21');
  c.rect(x + 2, y + 5, 2, 19, '#3a3e42');
  c.rect(x + 60, y + 5, 2, 19, '#3a3e42');
  c.rect(x + 4, y + 10, 56, 1, '#8a8a84');
  c.rect(x + 4, y + 15, 56, 1, '#8a8a84');
  for (let i = 0; i < 6; i++) c.px(x + 10 + i * 9, y + 9, '#b0a080');
}

function pantryShelf(c, x, y) {
  // Prateleira de despensa/depósito com potes e latas, 32×24. Vãos livres onde os
  // itens podem aparecer: em cima (tampo), prateleira de cima à direita, de baixo à esquerda.
  c.rect(x, y, 32, 24, '#3a2e22');
  c.rect(x, y, 32, 2, '#4a3c2c'); // tampo
  c.rect(x + 2, y + 3, 28, 7, '#1a140e');
  c.rect(x + 2, y + 12, 28, 7, '#1a140e');
  // potes e latas
  c.rect(x + 3, y + 5, 4, 5, '#8a6a3a');
  c.rect(x + 3, y + 4, 4, 1, '#b0a080');
  c.rect(x + 8, y + 6, 3, 4, '#6a7a6a');
  c.rect(x + 12, y + 5, 4, 5, '#a04a3a');
  c.rect(x + 19, y + 14, 4, 5, '#7a7a70');
  c.rect(x + 24, y + 13, 5, 6, '#8a6a3a');
  c.rect(x + 24, y + 13, 5, 1, '#b0a080');
  c.rect(x, y + 10, 32, 2, '#4a3c2c');
  c.rect(x, y + 19, 32, 5, '#2a2018');
}

function workbench(c, x, y) {
  // Bancada de ferramentas da garagem, 48×24
  c.rect(x, y, 48, 24, '#3a3028');
  c.rect(x, y, 48, 12, '#5a4a3a');
  c.rect(x, y, 48, 1, '#6a5a48');
  c.rect(x + 3, y + 3, 10, 2, '#7a7a80'); // chave inglesa
  c.rect(x + 3, y + 5, 2, 3, '#7a7a80');
  c.rect(x + 15, y + 2, 3, 7, '#8a4a2a'); // martelo
  c.rect(x + 13, y + 2, 7, 2, '#5a5a60');
  c.rect(x + 40, y + 3, 5, 6, '#4a5a4a'); // lata de tinta
  c.rect(x + 40, y + 3, 5, 1, '#6a7a6a');
  c.rect(x, y + 12, 48, 1, '#2a2018');
  c.rect(x + 4, y + 13, 3, 11, '#2a2018');
  c.rect(x + 41, y + 13, 3, 11, '#2a2018');
}

function freezer(c, x, y) {
  // Freezer horizontal da lavanderia, 32×20
  c.rect(x, y, 32, 20, '#b0b2ac');
  c.rect(x, y, 32, 11, '#c4c6c0'); // tampa
  c.rect(x + 1, y + 10, 30, 1, '#8a8c86');
  c.rect(x + 13, y + 11, 6, 2, '#6e706b'); // puxador
  c.rect(x + 25, y + 15, 3, 2, '#5a8a5a'); // luz de ligado
  c.rect(x, y + 18, 32, 2, '#7a7c76');
}

function counterMicrowaveOn(c, x, y) {
  // Micro-ondas funcionando: janela acesa (âmbar)
  counterMicrowave(c, x, y);
  c.rect(x + 6, y + 3, 15, 7, '#c08a3a');
  c.rect(x + 8, y + 5, 11, 3, '#e0b060');
  c.rect(x + 12, y + 6, 4, 2, '#7a4a2a'); // prato girando
}

function washerOn(c, x, y) {
  // Máquina funcionando: luz do painel acesa e água na tampa
  washer(c, x, y);
  c.rect(x + 16, y + 1, 3, 3, '#7ac87a');
  c.rect(x + 7, y + 10, 10, 9, '#5a7a90');
  c.rect(x + 9, y + 12, 3, 2, '#9ab8d0');
  c.rect(x + 13, y + 15, 2, 2, '#9ab8d0');
}

// ---- Mobília extra (casa menos vazia) --------------------------------------------

function rug(w, h, base, border, pattern) {
  // Tapete gasto (no chão, sem colisão)
  return (c, x, y) => {
    c.rect(x, y, w, h, border);
    c.rect(x + 2, y + 2, w - 4, h - 4, base);
    for (let yy = 4; yy < h - 4; yy += 4) {
      for (let xx = 4 + (yy % 8 === 0 ? 2 : 0); xx < w - 4; xx += 6) c.px(x + xx, y + yy, pattern);
    }
    c.rect(x + 3, y + 3, w - 6, 1, pattern);
    c.rect(x + 3, y + h - 4, w - 6, 1, pattern);
    c.rect(x + Math.floor(w * 0.6), y + 5, 6, 3, border); // mancha
  };
}

function wallFrame(c, x, y, tone) {
  // Quadro na parede, 12×9
  c.rect(x, y, 12, 9, '#4a3624');
  c.rect(x + 1, y + 1, 10, 7, tone);
  c.rect(x + 2, y + 5, 8, 2, '#3a4a3a');
  c.px(x + 8, y + 2, '#b0a070');
}

function armchair(c, x, y) {
  // Poltrona velha, 22×22
  c.rect(x, y, 22, 22, '#3d302a');
  c.rect(x + 2, y, 18, 8, '#4a3b34'); // encosto
  c.rect(x + 4, y + 8, 14, 9, '#54443c'); // assento
  c.rect(x, y + 6, 4, 14, '#352923');
  c.rect(x + 18, y + 6, 4, 14, '#352923');
  c.rect(x + 7, y + 10, 5, 3, '#4a3b34');
  c.rect(x + 2, y + 20, 3, 2, '#1e1814');
  c.rect(x + 17, y + 20, 3, 2, '#1e1814');
}

function floorLamp(c, x, y) {
  // Abajur de pé (apagado), 10×30
  c.rect(x + 1, y, 8, 7, '#8a7a5a');
  c.rect(x, y + 6, 10, 2, '#6a5a40');
  c.rect(x + 4, y + 8, 2, 19, '#2a2622');
  c.rect(x + 2, y + 27, 6, 3, '#2a2622');
}

function chair(c, x, y) {
  // Cadeira de madeira, 12×16
  c.rect(x + 1, y, 10, 6, WOOD_DARK); // encosto
  c.rect(x + 2, y + 1, 8, 1, WOOD);
  c.rect(x, y + 6, 12, 5, WOOD);
  c.rect(x, y + 6, 12, 1, WOOD_LIGHT);
  c.rect(x + 1, y + 11, 2, 5, WOOD_DARK);
  c.rect(x + 9, y + 11, 2, 5, WOOD_DARK);
}

function coffeeTable(c, x, y) {
  // Mesa de centro, 32×14
  c.rect(x, y, 32, 8, WOOD);
  c.rect(x, y, 32, 1, WOOD_LIGHT);
  c.rect(x, y + 8, 32, 2, WOOD_DARK);
  c.rect(x + 2, y + 10, 2, 4, WOOD_DARK);
  c.rect(x + 28, y + 10, 2, 4, WOOD_DARK);
  c.rect(x + 5, y + 2, 7, 4, '#a8a090'); // jornal velho
  c.rect(x + 20, y + 2, 4, 4, '#6a6a70'); // caneca
}

function coatRack(c, x, y) {
  // Cabideiro com casaco, 12×30
  c.rect(x + 5, y + 2, 2, 26, WOOD_DARK);
  c.rect(x + 2, y + 2, 8, 2, WOOD_DARK);
  c.rect(x + 2, y + 4, 6, 12, '#3a3a44'); // casaco
  c.rect(x + 3, y + 28, 6, 2, WOOD_DARK);
}

function shoeBench(c, x, y) {
  // Banco da entrada com sapatos, 32×14
  c.rect(x, y, 32, 6, WOOD);
  c.rect(x, y, 32, 1, WOOD_LIGHT);
  c.rect(x, y + 6, 32, 8, '#1a130d');
  c.rect(x + 3, y + 9, 6, 3, '#2a2420');
  c.rect(x + 11, y + 10, 6, 3, '#4a3a2a');
  c.rect(x + 21, y + 9, 7, 3, '#2a2420');
}

function toilet(c, x, y) {
  // Vaso sanitário, 14×18
  c.rect(x + 1, y, 12, 6, '#c8ccc8'); // caixa
  c.rect(x + 1, y, 12, 1, '#e0e4e0');
  c.rect(x + 2, y + 6, 10, 10, '#c8ccc8');
  c.rect(x + 4, y + 8, 6, 6, '#8a9294');
  c.rect(x + 3, y + 16, 8, 2, '#9aa2a4');
}

function shower(c, x, y) {
  // Box com chuveiro, 26×26
  c.rect(x, y, 26, 26, '#6a7a80');
  c.rect(x + 2, y + 2, 22, 22, '#8a9aa0');
  c.rect(x + 11, y + 11, 4, 4, '#4a5458'); // ralo
  c.rect(x + 11, y + 2, 4, 3, '#b0b8bc'); // chuveiro
  c.rect(x + 24, y, 2, 26, '#a0b0b8'); // vidro
  c.px(x + 6, y + 18, '#5a6a70');
}

function stove(c, x, y) {
  // Fogão velho, 28×28
  c.rect(x, y, 28, 28, '#9a9c96');
  c.rect(x, y, 28, 14, '#b2b4ae');
  for (const [dx, dy] of [[4, 2], [16, 2], [4, 8], [16, 8]]) {
    c.rect(x + dx, y + dy, 8, 4, '#2a2a28');
    c.rect(x + dx + 2, y + dy + 1, 4, 2, '#4a4a46');
  }
  c.rect(x + 3, y + 17, 22, 9, '#5c5e59'); // forno
  c.rect(x + 6, y + 19, 16, 3, '#2a2c2a');
}

function wardrobe(c, x, y) {
  // Guarda-roupa, 32×34
  c.rect(x, y, 32, 34, WOOD_DARK);
  c.rect(x, y, 32, 4, WOOD);
  c.rect(x + 2, y + 5, 13, 27, WOOD_INSET);
  c.rect(x + 17, y + 5, 13, 27, WOOD_INSET);
  c.rect(x + 13, y + 17, 1, 3, '#a8925e');
  c.rect(x + 18, y + 17, 1, 3, '#a8925e');
}

function chinaCabinet(c, x, y) {
  // Cristaleira com louça de festa guardada, 32×30
  c.rect(x, y, 32, 30, WOOD_DARK);
  c.rect(x, y, 32, 3, WOOD);
  c.rect(x + 2, y + 4, 28, 14, '#2a3238'); // vidro
  for (let i = 0; i < 5; i++) c.rect(x + 4 + i * 5, y + 8, 4, 3, '#c4bfae');
  c.rect(x + 2, y + 11, 28, 1, WOOD);
  c.rect(x + 5, y + 13, 6, 4, '#c84a5a'); // copinhos de festa
  c.rect(x + 2, y + 20, 28, 8, WOOD_INSET);
}

function carTarp(c, x, y) {
  // Carro coberto por lona, visto de cima, 60×120
  c.rect(x + 4, y + 2, 52, 116, '#3a4038');
  c.rect(x + 2, y + 10, 56, 100, '#3a4038');
  c.rect(x + 8, y + 24, 44, 36, '#454c42'); // teto
  for (let i = 0; i < 6; i++) c.rect(x + 6 + i * 9, y + 64 + (i % 2) * 6, 2, 30, '#2e342c'); // dobras
  c.rect(x + 2, y + 18, 3, 10, '#1a1c1a'); // rodas aparecendo
  c.rect(x + 55, y + 18, 3, 10, '#1a1c1a');
  c.rect(x + 2, y + 92, 3, 10, '#1a1c1a');
  c.rect(x + 55, y + 92, 3, 10, '#1a1c1a');
}

function gardenBench(c, x, y) {
  // Banco de jardim molhado, 40×16
  c.rect(x, y, 40, 4, '#4a3a2a');
  c.rect(x, y + 5, 40, 5, '#5a4a36');
  c.rect(x, y + 5, 40, 1, '#6a5a44');
  c.rect(x + 3, y + 10, 3, 6, '#2a2420');
  c.rect(x + 34, y + 10, 3, 6, '#2a2420');
}

function swing(c, x, y) {
  // Balanço de criança no jardim, parado, 28×30
  c.rect(x, y, 28, 3, '#3a3028'); // trave
  c.rect(x, y, 3, 30, '#3a3028');
  c.rect(x + 25, y, 3, 30, '#3a3028');
  c.rect(x + 10, y + 3, 1, 18, '#7a7a70'); // cordas
  c.rect(x + 17, y + 3, 1, 18, '#7a7a70');
  c.rect(x + 8, y + 21, 12, 3, '#6a4a3a'); // assento
}

function towel(c, x, y) {
  // Toalha pendurada, 10×12
  c.rect(x, y, 10, 2, '#7a7a80');
  c.rect(x + 1, y + 2, 8, 10, '#5a6a7a');
  c.rect(x + 1, y + 9, 8, 1, '#4a5a6a');
}

// ---- Tarefas, ursos e fusível (GDD 4.4, 4.11 e 4.12) ----------------------------

function laundryBasket(c, x, y) {
  // Cesto de roupa suja, 14×10
  c.rect(x + 1, y + 2, 12, 8, '#8a7448');
  c.rect(x, y + 2, 14, 2, '#9a8458');
  for (let i = 0; i < 4; i++) c.rect(x + 2 + i * 3, y + 5, 1, 4, '#6a5838');
  c.rect(x + 2, y, 5, 3, '#5a6a7a'); // roupa saindo
  c.rect(x + 7, y, 4, 2, '#7a5a5a');
}

function plate(c, x, y) {
  // Prato sujo, 8×4
  c.rect(x + 1, y, 6, 1, '#d8d2c0');
  c.rect(x, y + 1, 8, 2, '#c4bfae');
  c.rect(x + 1, y + 3, 6, 1, '#9a9688');
  c.px(x + 3, y + 1, '#7a5a3a');
  c.px(x + 5, y + 2, '#6a4a2a');
}

function trashBag(c, x, y) {
  // Saco de lixo, 8×9
  c.rect(x + 3, y, 2, 2, '#2a2a2e'); // nó
  c.rect(x + 1, y + 2, 6, 7, '#1e1e22');
  c.rect(x, y + 4, 8, 4, '#1e1e22');
  c.rect(x + 2, y + 3, 1, 3, '#3a3a40');
}

function wetClothes(c, x, y) {
  // Roupa molhada dobrada no braço, 12×6
  c.rect(x, y, 12, 6, '#4a5a6a');
  c.rect(x, y, 12, 2, '#5a6a7a');
  c.rect(x + 4, y + 2, 4, 3, '#6a4a4a');
  c.px(x + 2, y + 5, '#7a8a9a'); // pingando
}

function wateringCan(c, x, y) {
  // Regador, 12×8
  c.rect(x + 2, y + 2, 7, 6, '#4a6a5a');
  c.rect(x + 2, y + 2, 7, 1, '#5a7a6a');
  c.rect(x + 9, y + 2, 3, 1, '#4a6a5a'); // bico
  c.rect(x + 11, y + 1, 1, 1, '#4a6a5a');
  c.rect(x + 3, y, 5, 1, '#3a5a4a'); // alça
  c.px(x + 3, y + 1, '#3a5a4a');
  c.px(x + 7, y + 1, '#3a5a4a');
}

function foldedUniform(c, x, y, pressed) {
  // Uniforme dobrado (amarrotado ou passado), 10×6
  c.rect(x, y, 10, 6, '#2e3a4e');
  c.rect(x, y, 10, 1, '#3e4a5e');
  c.rect(x + 2, y + 2, 2, 2, '#b8a050'); // distintivo
  if (!pressed) {
    c.px(x + 6, y + 2, '#25303f');
    c.px(x + 8, y + 4, '#25303f');
    c.px(x + 5, y + 4, '#3e4a5e');
  }
}

function lunchbox(c, x, y, hot) {
  // Marmita (fria) ou prato de comida quente, 9×5
  if (hot) {
    c.rect(x, y + 1, 9, 4, '#c4bfae');
    c.rect(x + 2, y + 1, 5, 2, '#a86a3a');
    c.px(x + 3, y, '#d8d8d8'); // vapor
    c.px(x + 6, y, '#d8d8d8');
  } else {
    c.rect(x, y, 9, 5, '#9aa2a4');
    c.rect(x, y, 9, 1, '#b8c0c2');
    c.rect(x + 3, y + 2, 3, 1, '#6a7274');
  }
}

function cellphone(c, x, y) {
  // Celular no silencioso (tela apagada), 4×6
  c.rect(x, y, 4, 6, '#1a1a1e');
  c.rect(x + 1, y + 1, 2, 3, '#26303a');
}

function fuse(c, x, y) {
  // Fusível de cartucho, 6×3
  c.rect(x, y, 1, 3, '#a8a8a0');
  c.rect(x + 5, y, 1, 3, '#a8a8a0');
  c.rect(x + 1, y, 4, 3, '#d8d0b8');
  c.rect(x + 2, y + 1, 2, 1, '#8a7a5a');
}

function routineList(c, x, y) {
  // Folha da lista presa na geladeira com um ímã feito pela Clara, 8×10
  c.rect(x, y + 1, 8, 9, '#e0dccc');
  for (let i = 0; i < 4; i++) c.rect(x + 1, y + 3 + i * 2, 5 - (i % 2), 1, '#7a7a80');
  c.rect(x + 3, y, 3, 2, '#c84a5a'); // ímã (coração de massinha)
  c.px(x + 4, y + 2, '#c84a5a');
}

function windowFrame(c, x, y, open) {
  // Janela na parede, 32×10: aberta (vidro afastado, chuva entrando) ou fechada
  c.rect(x, y, 32, 10, '#2a2420');
  c.rect(x + 2, y + 2, 28, 6, open ? '#0e141c' : '#3a4a5a');
  if (open) {
    c.rect(x + 2, y + 2, 9, 6, '#4a5a6a'); // folha recolhida
    for (let i = 0; i < 5; i++) c.px(x + 14 + i * 3, y + 3 + (i % 3), '#5a6a7a'); // chuva
  } else {
    c.rect(x + 15, y + 2, 2, 6, '#2a2420');
    c.rect(x + 4, y + 3, 4, 1, '#5a6a7a'); // reflexo
    c.rect(x + 19, y + 3, 4, 1, '#5a6a7a');
  }
}

function bear(c, x, y) {
  // Ursinho de pelúcia da Clara, sentado, 10×11
  const fur = '#8a6440';
  const furDark = '#6a4a2e';
  c.rect(x + 1, y, 3, 3, fur); // orelhas
  c.rect(x + 6, y, 3, 3, fur);
  c.px(x + 2, y + 1, furDark);
  c.px(x + 7, y + 1, furDark);
  c.rect(x + 2, y + 1, 6, 5, fur); // cabeça
  c.rect(x + 4, y + 4, 2, 1, '#b89a70'); // focinho
  c.px(x + 3, y + 3, '#1a1410'); // olhos
  c.px(x + 6, y + 3, '#1a1410');
  c.rect(x + 2, y + 6, 6, 4, fur); // corpo
  c.rect(x + 4, y + 7, 2, 2, '#b89a70'); // barriga
  c.rect(x, y + 6, 2, 3, furDark); // braços
  c.rect(x + 8, y + 6, 2, 3, furDark);
  c.rect(x + 1, y + 9, 3, 2, furDark); // pés
  c.rect(x + 6, y + 9, 3, 2, furDark);
}

function softGlow(size, color) {
  // Brilho redondo e suave (desenhado em degraus), size×size
  return (c, x, y) => {
    const r = size / 2;
    for (let yy = 0; yy < size; yy++) {
      for (let xx = 0; xx < size; xx++) {
        const d = Math.hypot(xx + 0.5 - r, yy + 0.5 - r) / r;
        if (d < 1 && (d < 0.45 || (xx + yy) % 2 === 0 || d < 0.7)) c.px(x + xx, y + yy, color);
      }
    }
  };
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

// Lista de quadros [nome-n, w, h, desenho] para uma animação
function animated(name, draws, w, h, outline = false) {
  return draws.map((draw, n) => [`${name}-${n}`, w, h, draw, outline]);
}

// Quadros de cada visão (side/down/up) de um monstro: <nome>-<visão>-<n>
function views(name, frames, sizes, outline = false) {
  return Object.entries(frames).flatMap(([view, draws]) =>
    animated(`${name}-${view}`, draws, sizes[view][0], sizes[view][1], outline),
  );
}

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
  ['dining-big', 80, 40, diningBig, true],
  ['washer', 24, 24, washer, true],
  ['laundry-tank', 24, 20, laundryTank, true],
  ['ironing-board', 32, 14, ironingBoard, true],
  ['counter-microwave', 32, 28, counterMicrowave, true],
  ['garbage-can', 16, 20, garbageCan, true],
  ['trash-bin', 8, 10, trashBin, true],
  ['plant-pot', 12, 14, plantPot, true],
  ['clothesline', 64, 24, clothesline, true],
  ['rug-red', 96, 64, rug(96, 64, '#5a2a26', '#3a1a18', '#7a4a3a')],
  ['rug-blue', 64, 40, rug(64, 40, '#2a3a4a', '#1a2430', '#4a5a6a')],
  ['rug-brown', 80, 48, rug(80, 48, '#4a3a2a', '#2e241a', '#6a5a40')],
  ['runner', 96, 20, rug(96, 20, '#4a2a2a', '#2e1a1a', '#6a4a3a')],
  ['frame-a', 12, 9, (c, x, y) => wallFrame(c, x, y, '#5a6a7a')],
  ['frame-b', 12, 9, (c, x, y) => wallFrame(c, x, y, '#7a6a5a')],
  ['armchair', 22, 22, armchair, true],
  ['floor-lamp', 10, 30, floorLamp, true],
  ['chair', 12, 16, chair, true],
  ['coffee-table', 32, 14, coffeeTable, true],
  ['coat-rack', 12, 30, coatRack, true],
  ['shoe-bench', 32, 14, shoeBench, true],
  ['toilet', 14, 18, toilet, true],
  ['shower', 26, 26, shower, true],
  ['stove', 28, 28, stove, true],
  ['wardrobe', 32, 34, wardrobe, true],
  ['china-cabinet', 32, 30, chinaCabinet, true],
  ['car-tarp', 60, 120, carTarp, true],
  ['garden-bench', 40, 16, gardenBench, true],
  ['swing', 28, 30, swing, true],
  ['towel', 10, 12, towel],
  ['pantry-shelf', 32, 24, pantryShelf, true],
  ['workbench', 48, 24, workbench, true],
  ['freezer', 32, 20, freezer, true],
  ['counter-microwave-on', 32, 28, counterMicrowaveOn, true],
  ['washer-on', 24, 24, washerOn, true],
  ['laundry-basket', 14, 10, laundryBasket, true],
  ['plate', 8, 4, plate, true],
  ['trash-bag', 8, 9, trashBag, true],
  ['wet-clothes', 12, 6, wetClothes, true],
  ['watering-can', 12, 8, wateringCan, true],
  ['uniform-folded', 10, 6, (c, x, y) => foldedUniform(c, x, y, false), true],
  ['uniform-pressed', 10, 6, (c, x, y) => foldedUniform(c, x, y, true), true],
  ['lunchbox', 9, 5, (c, x, y) => lunchbox(c, x, y, false), true],
  ['dinner', 9, 5, (c, x, y) => lunchbox(c, x, y, true), true],
  ['phone', 4, 6, cellphone, true],
  ['fuse', 6, 3, fuse, true],
  ['routine-list', 8, 10, routineList],
  ['window-open', 32, 10, (c, x, y) => windowFrame(c, x, y, true)],
  ['window-closed', 32, 10, (c, x, y) => windowFrame(c, x, y, false)],
  ['bear', 10, 11, bear, true],
  ['glow', 24, 24, softGlow(24, '#ffb860')],
  ['spark', 2, 2, (c, x, y) => c.rect(x, y, 2, 2, '#ffd08a')],
  ['helena-silhouette', 16, 32, helenaSilhouette, true],
  ['balloon', 9, 22, balloon, true],
  ['blood-pool', 26, 10, bloodPool],
  ['drip', 1, 2, drip],
  ['tv-static-0', 17, 13, tvStatic(0)],
  ['tv-static-1', 17, 13, tvStatic(1)],
  ['tv-static-2', 17, 13, tvStatic(2)],
  ['key', 7, 4, key, true],
  ['ash', 2, 2, ash],
  ...animated('shadow-run', shadowRunFrames(), 22, 32),
  ...views('invader', invaderFrames(), { side: [20, 32], down: [20, 32], up: [20, 32] }),
  ...views('distorted', distortedFrames(), { side: [22, 36], down: [18, 36], up: [18, 36] }),
  ...views('clara', claraFrames(), { side: [24, 16], down: [18, 18], up: [18, 18] }, true),
  ...[0, 1, 2].flatMap((head) => [0, 1].map((sway) => [`helena-${head}-${sway}`, 16, 32, helena(head, sway)])),
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
