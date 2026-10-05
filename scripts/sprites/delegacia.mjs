// Delegacia (GDD 13.3): sala pequena de atendimento noturno, vista de frente.
// Tela base de 320×180 (ampliada 3× no jogo). Peças separadas para o que muda ou é
// clicável: Artur (corpo e braços, parado ou ao telefone), mesa, telefone, bilhete, etc.

import { PixelCanvas, seeded } from './canvas.mjs';

export const DELEGACIA_W = 320;
export const DELEGACIA_H = 180;

const C = {
  ceiling: '#16181c',
  wall: '#2a2e35',
  wallDark: '#24272d',
  wallLine: '#31353d',
  wainscot: '#1f2227',
  wainscotTop: '#2c3036',
  floor: '#17151a',
  floorLine: '#1d1b20',
  metal: '#3a3d42',
  metalDark: '#26282c',
  metalLight: '#5a5e64',
  glassNight: '#0e141c',
  glassDark: '#0a0f15',
  frosted: '#4e5a63',
  frostedLight: '#66727b',
  frostedDark: '#3e4850',
  paper: '#d8d4c4',
  paperShade: '#b8b4a4',
  paperOld: '#c8c0a8',
  red: '#8a2424',
  redBright: '#b3161d',
  cork: '#5e432c',
  corkDark: '#4a3422',
  wood: '#4e3a28',
  woodTop: '#62492f',
  woodTopLight: '#6e5236',
  woodDark: '#3a2a1e',
  woodDarker: '#2c2016',
  hair: '#2a2420',
  hairLight: '#3a322b',
  skin: '#c4a089',
  skinShade: '#a07c66',
  skinDark: '#86644f',
  bags: '#7a5a52',
  stubble: '#8a735f',
  eye: '#141012',
  mouth: '#5a3a30',
  shirt: '#9ea2aa',
  shirtShade: '#868a92',
  shirtDark: '#6e727a',
  collar: '#b8bcc4',
  badge: '#d8d4c8',
  badgeBlue: '#3a5a8a',
  phone: '#1e1e22',
  phoneLight: '#323238',
  phoneDial: '#8a8a84',
  lampShade: '#2e4a3a',
  lampShadeLight: '#3e5e4a',
  lampBulb: '#f0e0a0',
  pot: '#7a4a32',
  potLight: '#8a5a3e',
  leaf: '#3e5a2e',
  leafLight: '#4e7038',
  note: '#d8c060',
  noteShade: '#b8a048',
  noteInk: '#5a4a20',
  tube: '#d8e0d0',
  tubeOff: '#5a6058',
};

// ---- Fundo (parede, janela, calendário, relógio sem ponteiros, quadro, porta, chão) ------

function background(c, ox, oy) {
  const r = seeded(7);
  // Parede e teto
  c.rect(ox, oy, 320, 180, C.wall);
  c.rect(ox, oy, 320, 10, C.ceiling);
  c.rect(ox, oy + 10, 320, 1, C.wallDark);
  // Manchas de umidade na parede
  for (let i = 0; i < 40; i++) {
    const x = Math.floor(r() * 316);
    const y = 12 + Math.floor(r() * 90);
    c.rect(ox + x, oy + y, 2 + Math.floor(r() * 4), 1, r() < 0.5 ? C.wallDark : C.wallLine);
  }
  // Rodapé de madeira pintada (lambri)
  c.rect(ox, oy + 96, 320, 2, C.wainscotTop);
  c.rect(ox, oy + 98, 320, 30, C.wainscot);
  for (let x = 0; x < 320; x += 16) c.rect(ox + x, oy + 98, 1, 30, C.wallDark);
  // Chão
  c.rect(ox, oy + 128, 320, 52, C.floor);
  for (let y = 132; y < 180; y += 8) c.rect(ox, oy + y, 320, 1, C.floorLine);

  // Lâmpada fluorescente (calha); o tubo é desenhado à parte (pisca)
  c.rect(ox + 116, oy + 1, 88, 7, C.metalDark);
  c.rect(ox + 117, oy + 2, 86, 5, C.metal);
  c.rect(ox + 140, oy, 2, 2, C.metalDark);
  c.rect(ox + 178, oy, 2, 2, C.metalDark);

  windowArt(c, ox + 10, oy + 22);

  // Calendário (dia 7 circulado em vermelho)
  calendarSmall(c, ox + 84, oy + 30);

  clockFace(c, ox + 148, oy + 15);

  // Quadro de avisos com cartazes de desaparecidos
  c.rect(ox + 198, oy + 26, 66, 46, C.woodDark);
  c.rect(ox + 200, oy + 28, 62, 42, C.cork);
  for (let i = 0; i < 30; i++) c.px(ox + 200 + Math.floor(r() * 62), oy + 28 + Math.floor(r() * 42), C.corkDark);
  const poster = (x, y, tilt) => {
    c.rect(ox + x, oy + y, 14, 18, C.paperOld);
    c.rect(ox + x, oy + y, 14, 3, C.red); // faixa "DESAPARECIDO"
    c.rect(ox + x + 3, oy + y + 4, 8, 7, '#6a6a66'); // foto
    c.rect(ox + x + 5, oy + y + 5, 4, 3, '#8a8a84');
    c.rect(ox + x + 2, oy + y + 13, 10, 1, '#7a7468');
    c.rect(ox + x + 2, oy + y + 15, 8, 1, '#7a7468');
    c.px(ox + x + 7, oy + y - 1 + tilt, C.redBright); // tachinha
  };
  poster(203, 32, 0);
  poster(220, 30, 1);
  poster(238, 33, 0);
  c.rect(ox + 205, oy + 54, 20, 12, C.paper); // aviso
  for (let y = 0; y < 4; y++) c.rect(ox + 207, oy + 56 + y * 2, 15 - (y % 2) * 4, 1, '#7a7468');
  c.rect(ox + 232, oy + 53, 22, 14, '#a8b0b8'); // escala de plantão
  for (let y = 0; y < 5; y++) c.rect(ox + 234, oy + 55 + y * 2, 18, 1, '#5a6068');

  doorArt(c, ox + 270, oy + 18);

  // Tomada na parede (onde o cabo do telefone fica ligado)
  c.rect(ox + 254, oy + 100, 8, 9, C.paperShade);
  c.rect(ox + 255, oy + 101, 6, 7, C.paper);
  c.rect(ox + 257, oy + 103, 2, 3, '#2a2a2e');
}

function windowArt(c, x, y) {
  // 66×62 a partir do canto do peitoril: janela com chuva (o vidro fica escuro; a chuva
  // anima por cima)
  c.rect(x + 2, y, 62, 58, C.metal);
  c.rect(x + 5, y + 3, 56, 52, C.glassNight);
  c.rect(x + 32, y + 3, 2, 52, C.metal); // divisória
  c.rect(x + 5, y + 28, 56, 2, C.metal);
  c.rect(x + 5, y + 44, 27, 11, C.glassDark); // reflexo escuro
  c.rect(x, y + 58, 66, 3, C.metalLight); // peitoril
  c.rect(x, y + 61, 66, 1, C.metalDark);
  // Luz da rua distante borrada
  c.rect(x + 44, y + 12, 2, 2, '#4a4430');
  c.rect(x + 14, y + 36, 1, 1, '#3a3828');
}

function clockFace(c, x, y) {
  // 25×25: relógio redondo (ponteiros são desenhados pelo jogo)
  const cx = x + 12;
  const cy = y + 12;
  for (let yy = -12; yy <= 12; yy++) {
    for (let xx = -12; xx <= 12; xx++) {
      const d = Math.hypot(xx, yy);
      if (d <= 12) c.px(cx + xx, cy + yy, d > 10.5 ? '#1e1e22' : C.paper);
    }
  }
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    const px = Math.round(cx + Math.sin(a) * 9);
    const py = Math.round(cy - Math.cos(a) * 9);
    c.px(px, py, k % 3 === 0 ? '#2a2a2e' : '#7a7a74');
  }
}

function doorArt(c, x, y) {
  // 44×112: porta de vidro fosco ("SAÍDA" escrito pelo jogo)
  c.rect(x, y, 44, 112, C.metalDark);
  c.rect(x + 2, y + 2, 40, 108, C.metal);
  c.rect(x + 6, y + 8, 32, 70, C.frosted);
  for (let yy = 0; yy < 70; yy += 2) c.rect(x + 6, y + 8 + yy, 32, 1, yy < 20 ? C.frostedLight : C.frosted);
  c.rect(x + 6, y + 8, 1, 70, C.frostedDark);
  c.rect(x + 6, y + 84, 32, 22, C.metalDark); // parte de baixo
  c.rect(x + 8, y + 86, 28, 18, C.metal);
  c.rect(x + 32, y + 52, 4, 10, C.metalLight); // maçaneta
  c.rect(x + 30, y + 56, 2, 2, C.metalLight);
}

function calendarSmall(c, x, y) {
  // 28×36: folha com o mês, dias riscados até hoje (o jogo risca), dia 7 circulado
  c.rect(x, y, 28, 36, C.paper);
  c.rect(x, y, 28, 7, C.red);
  c.rect(x + 3, y + 2, 22, 2, '#c8a0a0');
  c.rect(x + 13, y - 2, 2, 3, '#2a2a2e'); // prego
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 7; col++) {
      c.rect(x + 2 + col * 3 + Math.floor(col / 2), y + 10 + row * 5, 2, 2, '#8a867a');
    }
  }
  // Dia do aniversário circulado
  const bx = x + 18;
  const by = y + 24;
  c.rect(bx - 1, by - 2, 6, 1, C.redBright);
  c.rect(bx - 1, by + 3, 6, 1, C.redBright);
  c.rect(bx - 2, by - 1, 1, 4, C.redBright);
  c.rect(bx + 5, by - 1, 1, 4, C.redBright);
  c.rect(x + 3, y + 31, 22, 1, C.redBright); // anotação embaixo
}

// ---- Artur sentado (frente) ---------------------------------------------------

function arturHead(c, x, y, talking = false) {
  // Cabeça 14×16 a partir de (x, y)
  c.rect(x + 1, y + 1, 12, 14, C.skin);
  c.rect(x + 2, y + 15, 10, 1, C.skin);
  c.rect(x, y + 5, 1, 4, C.skinShade); // orelhas
  c.rect(x + 13, y + 5, 1, 4, C.skinShade);
  // Cabelo bagunçado
  c.rect(x, y - 1, 14, 4, C.hair);
  c.rect(x, y + 3, 2, 3, C.hair);
  c.rect(x + 12, y + 3, 2, 3, C.hair);
  c.rect(x + 3, y - 2, 4, 1, C.hair);
  c.rect(x + 8, y - 2, 3, 1, C.hairLight);
  c.px(x + 5, y + 3, C.hair);
  // Sobrancelhas e olhos cansados, olheiras
  c.rect(x + 3, y + 5, 3, 1, C.hair);
  c.rect(x + 8, y + 5, 3, 1, C.hair);
  c.rect(x + 3, y + 7, 3, 1, C.eye);
  c.rect(x + 8, y + 7, 3, 1, C.eye);
  c.rect(x + 3, y + 8, 3, 1, C.bags);
  c.rect(x + 8, y + 8, 3, 1, C.bags);
  c.px(x + 7, y + 9, C.skinShade); // nariz
  c.px(x + 7, y + 10, C.skinShade);
  // Barba por fazer e boca
  c.rect(x + 2, y + 11, 10, 4, C.stubble);
  c.rect(x + 3, y + 15, 8, 1, C.stubble);
  if (talking) {
    // Boca aberta (falando)
    c.rect(x + 5, y + 12, 4, 2, '#2a1410');
    c.rect(x + 5, y + 12, 4, 1, C.mouth);
  } else {
    c.rect(x + 5, y + 12, 4, 1, C.mouth);
  }
}

function arturTorso(c, x, y) {
  // Tronco 30×22 (a mesa cobre de y+22 para baixo): pescoço, ombros caídos, camisa
  c.rect(x + 12, y, 6, 3, C.skinShade);
  c.rect(x + 3, y + 3, 24, 19, C.shirt);
  c.rect(x + 1, y + 6, 3, 16, C.shirt); // ombros caídos
  c.rect(x + 26, y + 6, 3, 16, C.shirt);
  c.rect(x + 1, y + 6, 1, 16, C.shirtShade);
  c.rect(x + 28, y + 6, 1, 16, C.shirtShade);
  // Gola aberta e amassados
  c.rect(x + 11, y + 3, 3, 3, C.collar);
  c.rect(x + 16, y + 3, 3, 3, C.collar);
  c.rect(x + 14, y + 3, 2, 4, C.skinShade);
  c.rect(x + 15, y + 7, 1, 15, C.shirtShade); // botões
  c.rect(x + 7, y + 12, 3, 1, C.shirtShade);
  c.rect(x + 20, y + 15, 4, 1, C.shirtShade);
  c.rect(x + 5, y + 18, 2, 1, C.shirtDark);
  // Crachá de atendente
  c.rect(x + 19, y + 9, 6, 8, C.badge);
  c.rect(x + 19, y + 9, 6, 2, C.badgeBlue);
  c.rect(x + 20, y + 12, 2, 2, '#8a8a84');
  c.rect(x + 20, y + 15, 4, 1, '#8a8a84');
  c.rect(x + 21, y + 7, 1, 2, '#2a2a2e');
}

function arturBodyIdle(c, x, y, talking = false) {
  // 34×40: cabeça um pouco baixa (cansado) + tronco
  arturTorso(c, x + 2, y + 18);
  arturHead(c, x + 10, y + 3, talking);
}

function arturBodyPhone(c, x, y, talking = false) {
  // 34×40: fone no ouvido esquerdo (da tela, à direita), braço levantado
  arturTorso(c, x + 2, y + 18);
  arturHead(c, x + 9, y + 3, talking);
  // Braço direito dele (à esquerda da tela) dobrado segurando o fone na orelha
  c.rect(x + 24, y + 20, 6, 4, C.shirt);
  c.rect(x + 26, y + 13, 4, 8, C.shirt);
  c.rect(x + 26, y + 13, 1, 8, C.shirtShade);
  // Fone (monofone) colado no rosto
  c.rect(x + 22, y + 5, 3, 12, C.phone);
  c.rect(x + 21, y + 4, 4, 3, C.phoneLight);
  c.rect(x + 21, y + 15, 4, 3, C.phoneLight);
  c.rect(x + 24, y + 9, 3, 4, C.skin); // mão
  c.rect(x + 24, y + 12, 3, 1, C.skinShade);
}

function arturArmsIdle(c, x, y) {
  // 40×10: antebraços e mãos apoiados na mesa
  c.rect(x + 1, y, 13, 6, C.shirt);
  c.rect(x + 26, y, 13, 6, C.shirt);
  c.rect(x + 1, y + 5, 13, 1, C.shirtShade);
  c.rect(x + 26, y + 5, 13, 1, C.shirtShade);
  c.rect(x + 13, y + 1, 6, 5, C.skin); // mãos juntas
  c.rect(x + 21, y + 1, 6, 5, C.skin);
  c.rect(x + 13, y + 5, 14, 1, C.skinShade);
  c.rect(x + 18, y + 2, 4, 3, C.skinShade);
}

function arturArmsPhone(c, x, y) {
  // 40×10: só o outro braço na mesa, mão perto do telefone
  c.rect(x + 1, y, 13, 6, C.shirt);
  c.rect(x + 1, y + 5, 13, 1, C.shirtShade);
  c.rect(x + 13, y + 1, 6, 5, C.skin);
  c.rect(x + 13, y + 5, 6, 1, C.skinShade);
}

// ---- Mesa e o que fica em cima dela ------------------------------------------

function desk(c, x, y) {
  // 232×68 a partir de (x, y) (+22 px acima para a luminária e a planta): tampo (visto um
  // pouco de cima) e frente, com luminária,
  // papéis, canecas e a planta no canto
  const r = seeded(31);
  c.rect(x, y + 10, 232, 10, C.woodTop);
  c.rect(x, y + 10, 232, 1, C.woodTopLight);
  for (let i = 0; i < 18; i++) c.rect(x + Math.floor(r() * 220), y + 12 + Math.floor(r() * 7), 4 + Math.floor(r() * 8), 1, C.wood);
  c.rect(x, y + 20, 232, 2, C.woodDark);
  c.rect(x + 4, y + 22, 224, 46, C.wood); // frente
  c.rect(x + 4, y + 22, 224, 2, C.woodDark);
  for (let i = 0; i < 4; i++) c.rect(x + 12 + i * 56, y + 28, 44, 32, C.woodDark); // painéis
  for (let i = 0; i < 4; i++) c.rect(x + 13 + i * 56, y + 29, 42, 30, '#433122');
  c.rect(x + 4, y + 66, 224, 2, C.woodDarker);

  // Papéis espalhados
  c.rect(x + 54, y + 12, 12, 7, C.paperShade);
  c.rect(x + 56, y + 11, 12, 7, C.paper);
  c.rect(x + 58, y + 13, 7, 1, '#7a7468');
  c.rect(x + 58, y + 15, 5, 1, '#7a7468');
  c.rect(x + 92, y + 14, 14, 5, C.paperOld);
  c.rect(x + 148, y + 13, 10, 6, C.paper);
  c.rect(x + 150, y + 15, 6, 1, '#7a7468');
  mug(c, x + 76, y + 6);

  // Luminária de mesa (o bilhete é peça separada)
  c.rect(x + 18, y + 14, 14, 4, C.metalDark); // base
  c.rect(x + 24, y - 14, 2, 28, C.metalDark); // haste
  c.rect(x + 18, y - 22, 16, 8, C.lampShade); // cúpula
  c.rect(x + 18, y - 22, 16, 2, C.lampShadeLight);
  c.rect(x + 21, y - 14, 10, 2, C.lampBulb);

  // Planta no canto da mesa
  deskPlant(c, x + 198, y - 15);
}

function mug(c, x, y) {
  // 8×8: caneca de café
  c.rect(x, y, 6, 8, '#6a3a32');
  c.rect(x, y, 6, 1, '#2a1a12');
  c.rect(x + 6, y + 2, 2, 4, '#6a3a32');
}

function deskPlant(c, x, y) {
  // 16×31: vaso com planta, no canto da mesa
  c.rect(x + 2, y + 19, 12, 12, C.pot);
  c.rect(x + 1, y + 19, 14, 3, C.potLight);
  c.rect(x + 7, y + 5, 2, 14, C.leaf);
  c.rect(x + 1, y + 7, 5, 3, C.leafLight);
  c.rect(x + 10, y + 3, 5, 3, C.leafLight);
  c.rect(x, y + 13, 5, 3, C.leaf);
  c.rect(x + 11, y + 11, 5, 3, C.leaf);
  c.rect(x + 4, y, 4, 3, C.leafLight);
}

function phoneBase(c, x, y, withHandset) {
  // 26×14: telefone antigo de disco, com ou sem o fone no gancho
  c.rect(x + 2, y + 5, 22, 9, C.phone);
  c.rect(x + 2, y + 5, 22, 1, C.phoneLight);
  c.rect(x + 9, y + 7, 8, 6, C.phoneDial); // disco
  c.rect(x + 11, y + 8, 4, 4, C.phone);
  c.px(x + 12, y + 9, C.phoneDial);
  if (withHandset) {
    c.rect(x, y + 1, 26, 4, C.phone);
    c.rect(x, y, 6, 3, C.phoneLight);
    c.rect(x + 20, y, 6, 3, C.phoneLight);
    c.rect(x + 1, y + 1, 24, 1, C.phoneLight);
  } else {
    c.rect(x + 4, y + 3, 3, 2, C.phoneLight); // gancho vazio
    c.rect(x + 19, y + 3, 3, 2, C.phoneLight);
  }
}

function note(c, x, y) {
  // 10×10: bilhete amarelo preso na luminária, com rabiscos
  c.rect(x, y, 10, 10, C.note);
  c.rect(x, y + 9, 10, 1, C.noteShade);
  c.rect(x + 9, y, 1, 10, C.noteShade);
  c.rect(x + 2, y + 2, 6, 1, C.noteInk);
  c.rect(x + 2, y + 4, 5, 1, C.noteInk);
  c.rect(x + 2, y + 6, 6, 1, C.noteInk);
  c.rect(x + 4, y - 1, 2, 2, '#9a9a94'); // clipe
}

function tube(c, x, y, on) {
  // 84×3: tubo da lâmpada fluorescente
  c.rect(x, y, 84, 3, on ? C.tube : C.tubeOff);
  if (on) c.rect(x, y + 2, 84, 1, '#b8c0b0');
}


// ---- Contornos de destaque (mouse em cima) -------------------------------------

const HIGHLIGHT = '#f0e6c8';

/**
 * Contorno de 1 px em volta da forma de um objeto (para destacar ao passar o mouse).
 * O quadro tem 1 px a mais de cada lado; o jogo o põe 1 px antes do objeto.
 */
function outlineOf(w, h, draw) {
  return (c, x, y) => {
    const tmp = new PixelCanvas(w + 2, h + 2);
    draw(tmp, 1, 1);
    for (let yy = 0; yy < h + 2; yy++) {
      for (let xx = 0; xx < w + 2; xx++) {
        if (tmp.alphaAt(xx, yy)) continue;
        const near = tmp.alphaAt(xx - 1, yy) || tmp.alphaAt(xx + 1, yy) || tmp.alphaAt(xx, yy - 1) || tmp.alphaAt(xx, yy + 1);
        if (near) c.px(x + xx, y + yy, HIGHLIGHT);
      }
    }
  };
}

// ---- Atlas ------------------------------------------------------------------

const PIECES = [
  ['bg', 320, 180, background],
  // A luminária e a planta sobem 22 px acima do tampo: o quadro da mesa começa 22 px antes
  ['desk', 232, 90, (c, x, y) => desk(c, x, y + 22)],
  ['artur-body-idle', 34, 40, arturBodyIdle],
  ['artur-body-phone', 34, 40, arturBodyPhone],
  ['artur-body-idle-talk', 34, 40, (c, x, y) => arturBodyIdle(c, x, y, true)],
  ['artur-body-phone-talk', 34, 40, (c, x, y) => arturBodyPhone(c, x, y, true)],
  ['artur-arms-idle', 40, 10, arturArmsIdle],
  ['artur-arms-phone', 40, 10, arturArmsPhone],
  ['phone', 26, 14, (c, x, y) => phoneBase(c, x, y, true)],
  ['phone-empty', 26, 14, (c, x, y) => phoneBase(c, x, y, false)],
  ['note', 10, 11, (c, x, y) => note(c, x, y + 1)],
  ['tube-on', 84, 3, (c, x, y) => tube(c, x, y, true)],
  ['tube-off', 84, 3, (c, x, y) => tube(c, x, y, false)],
  // Contornos (w+2 × h+2)
  ['hl-window', 68, 64, outlineOf(66, 62, windowArt)],
  ['hl-clock', 27, 27, outlineOf(25, 25, clockFace)],
  ['hl-door', 46, 114, outlineOf(44, 112, doorArt)],
  ['hl-calendar', 30, 40, outlineOf(28, 38, (c, x, y) => calendarSmall(c, x, y + 2))],
  ['hl-plant', 18, 33, outlineOf(16, 31, deskPlant)],
  ['hl-phone', 28, 16, outlineOf(26, 14, (c, x, y) => phoneBase(c, x, y, true))],
  ['hl-mug', 10, 10, outlineOf(8, 8, mug)],
  ['hl-note', 12, 13, outlineOf(10, 11, (c, x, y) => note(c, x, y + 1))],
];

export function drawDelegacia() {
  const W = 512;
  const PAD = 1;
  let x = 0;
  let y = 0;
  let rowH = 0;
  const placed = [];
  for (const [name, w, h, fn] of PIECES) {
    if (x + w + PAD * 2 > W) {
      x = 0;
      y += rowH;
      rowH = 0;
    }
    placed.push({ name, x: x + PAD, y: y + PAD, w, h, fn });
    x += w + PAD * 2;
    rowH = Math.max(rowH, h + PAD * 2);
  }
  const c = new PixelCanvas(W, y + rowH);
  const frames = {};
  for (const p of placed) {
    p.fn(c, p.x, p.y);
    frames[p.name] = { frame: { x: p.x, y: p.y, w: p.w, h: p.h } };
  }
  return { canvas: c, json: { frames, meta: { image: 'delegacia.png', size: { w: W, h: y + rowH }, scale: '1' } } };
}
