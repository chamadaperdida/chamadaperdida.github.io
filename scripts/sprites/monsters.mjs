// Monstros no jogo (GDD 13.5), para o atlas props. Animados com o "esqueleto" (rig.mjs):
// perfil (virado para a direita; o jogo espelha), frente (vindo para baixo) e costas.
//
// Nomes dos quadros: <monstro>-<side|down|up>-<n>

import { ellipse, frontCycle, limb, poly, runCycle } from './rig.mjs';

const B = '#030304';

// ---- Humanoide de perfil ----------------------------------------------------------

function humanSide(c, ox, oy, pose, o) {
  const hip = [o.hipX, o.hipY + pose.bob];
  const sh = [hip[0] + o.lean, hip[1] - o.torso];
  const add = (p, d, dy = 0) => [p[0] + d[0], p[1] + d[1] + dy];
  const drawLeg = (l, color) => {
    const knee = add(hip, l.k);
    const foot = add(hip, l.f);
    limb(c, ox, oy, hip, knee, o.legW, color);
    limb(c, ox, oy, knee, foot, o.legW, color);
    c.rect(ox + foot[0] - 1, oy + foot[1], 3, 1, color); // pé
  };
  const drawArm = (a, color) => {
    const elbow = add(sh, a.e, Math.round(o.armDrop / 2));
    const hand = add(sh, a.h, o.armDrop);
    limb(c, ox, oy, sh, elbow, o.armW, color);
    limb(c, ox, oy, elbow, hand, o.armW, color);
    if (o.fingers) limb(c, ox, oy, hand, [hand[0] + 1, hand[1] + o.fingers], 1, color);
  };
  drawArm(pose.armFar, o.far);
  drawLeg(pose.far, o.far);
  if (o.cape) o.cape(c, ox, oy, sh, hip, pose);
  limb(c, ox, oy, sh, hip, o.torsoW, o.body);
  if (o.coat) o.coat(c, ox, oy, sh, hip, pose);
  drawLeg(pose.near, o.legs ?? o.body);
  drawArm(pose.armNear, o.armColor ?? o.body);
  o.head(c, ox, oy, [sh[0] + o.headDx, sh[1] - o.headUp], pose);
}

// ---- Invasor: capa de chuva preta encharcada, capuz, anda rígido como manequim ------

const INV = { coat: '#14171c', wet: '#2c3440', legs: '#0e1014', far: '#0b0d10' };

function invaderHood(c, ox, oy, [hx, hy]) {
  ellipse(c, ox, oy, hx, hy, 4, 4, INV.coat);
  c.rect(ox + hx - 4, oy + hy - 2, 2, 6, INV.coat); // capuz caindo atrás
  c.rect(ox + hx + 1, oy + hy - 1, 3, 4, B); // rosto: escuro total, dentro do capuz
  c.px(ox + hx + 4, oy + hy - 2, INV.coat); // borda do capuz por cima do rosto
  c.px(ox + hx - 2, oy + hy - 3, INV.wet);
}

function invaderCoat(c, ox, oy, sh, hip, pose) {
  // Capa até os joelhos, dura (quase não balança)
  const sway = pose.bob;
  poly(c, ox, oy, [
    [sh[0] - 3, sh[1]],
    [sh[0] + 3, sh[1]],
    [hip[0] + 4, hip[1] + 6],
    [hip[0] - 4 - sway, hip[1] + 6],
  ], INV.coat);
  limb(c, ox, oy, [sh[0] - 2, sh[1] + 1], [hip[0] - 3, hip[1] + 5], 1, INV.wet); // brilho de molhado
}

export function invaderFrames() {
  const frames = {};
  // Caminhada rígida: passada curta, joelhos quase retos, braços colados
  const cycle = runCycle({ stride: 0.55, bend: 0.2, arms: 0.12, bounce: 0 });
  frames.side = cycle.map((pose, n) => (c, x, y) => {
    humanSide(c, x, y, pose, {
      hipX: 10, hipY: 19, lean: 0, torso: 9, torsoW: 5, legW: 2, armW: 2, armDrop: 2,
      headDx: 1, headUp: 4, body: INV.coat, legs: INV.legs, far: INV.far,
      head: invaderHood, coat: invaderCoat,
    });
    c.px(x + 6 + (n % 3), y + 26 + (n % 4), INV.wet); // pingando
  });
  // Frente e costas: passos curtos, capa pingando
  const front = (back) =>
    frontCycle().map((p, n) => (c, x, y) => {
      const b = p.bob;
      c.rect(x + 7, y + 1 + b, 6, 2, INV.coat);
      c.rect(x + 6, y + 3 + b, 8, 8, INV.coat);
      if (!back) c.rect(x + 8, y + 5 + b, 4, 5, B); // rosto: escuro total
      else c.rect(x + 9, y + 3 + b, 2, 7, INV.wet);
      c.rect(x + 4, y + 11 + b, 12, 15, INV.coat);
      c.rect(x + 5, y + 12 + b, 1, 12, INV.wet);
      c.rect(x + 9, y + 12 + b, 1, 13, '#0c0e12'); // fecho / costura
      c.rect(x + 3, y + 12 + b, 1, 11, INV.coat); // braços colados
      c.rect(x + 16, y + 12 + b, 1, 11, INV.coat);
      c.rect(x + 6, y + 26, 3, 5 - p.liftL, INV.legs);
      c.rect(x + 11, y + 26, 3, 5 - p.liftR, INV.legs);
      c.px(x + 4 + ((n * 3) % 12), y + 27 + (n % 3), INV.wet);
    });
  frames.down = front(false);
  frames.up = front(true);
  return frames;
}

// ---- Artur distorcido: preto, alto, curvado, braços longos quase arrastando no chão --
// (sem nenhuma parte brilhante)

const DIS = { body: '#060606', far: '#030303', crack: '#121010' };
const JERK = [
  [0, 0],
  [1, -1],
  [-1, 0],
  [0, 1],
  [2, 0],
  [0, -1],
  [-1, 1],
  [1, 0],
];

function distortedHead(c, ox, oy, [hx, hy], pose) {
  ellipse(c, ox, oy, hx, hy, 3, 3, DIS.body);
  c.px(ox + hx + 1, oy + hy, DIS.crack);
  c.px(ox + hx - 1, oy + hy + 2, DIS.crack);
}

export function distortedFrames() {
  const frames = {};
  const cycle = runCycle({ stride: 1.15, bend: 1, arms: 1.3, bounce: 1 });
  frames.side = cycle.map((pose, n) => (c, x, y) => {
    const [jx, jy] = JERK[n];
    humanSide(c, x, y, pose, {
      hipX: 9, hipY: 22, lean: 5, torso: 10, torsoW: 4, legW: 2, armW: 2, armDrop: 7, fingers: 2,
      headDx: 3 + jx, headUp: 3 + jy, body: DIS.body, far: DIS.far, head: distortedHead,
    });
    c.px(x + 12, y + 16, DIS.crack); // pele rachada
    c.px(x + 10, y + 19, DIS.crack);
  });
  const front = (back) =>
    frontCycle().map((p, n) => (c, x, y) => {
      const [jx] = JERK[n * 2];
      const b = p.bob;
      // Curvado: cabeça baixa e para a frente
      ellipse(c, x, y, 9 + jx, 6 + b, 3, 3, DIS.body);
      c.rect(x + 6, y + 9 + b, 6, 3, DIS.body);
      c.rect(x + 5, y + 12 + b, 8, 11, DIS.body);
      if (back) c.rect(x + 8, y + 12 + b, 2, 9, DIS.far); // espinha
      // Braços longos demais, abertos e dobrados, balançando quase no chão
      limb(c, x, y, [5, 12 + b], [2, 21 + b + p.armL], 2, DIS.body);
      limb(c, x, y, [2, 21 + b + p.armL], [3, 31 + b + p.armL], 2, DIS.body);
      limb(c, x, y, [12, 12 + b], [15, 21 + b + p.armR], 2, DIS.body);
      limb(c, x, y, [15, 21 + b + p.armR], [14, 31 + b + p.armR], 2, DIS.body);
      c.px(x + 2, y + 33 + b + p.armL, DIS.body); // dedos
      c.px(x + 16, y + 33 + b + p.armR, DIS.body);
      c.rect(x + 6, y + 23 + b, 2, 12 - b - p.liftL, DIS.body);
      c.rect(x + 10, y + 23 + b, 2, 12 - b - p.liftR, DIS.body);
      c.px(x + 7, y + 15 + b, DIS.crack);
      c.px(x + 11, y + 19 + b, DIS.crack);
    });
  frames.down = front(false);
  frames.up = front(true);
  return frames;
}

// ---- Clara: criança possuída de quatro — quadril alto, braços com o cotovelo dobrado ao
// contrário, a cabeça virada para trás num ângulo impossível olhando para o Artur, o
// cabelo escuro caindo pelo rosto; passada mancando, com trancos (não é aranha: só quatro
// membros por baixo do corpo, nada de joelhos para cima nem patas abertas) -------------

const CLA = {
  dress: '#c8b8b0',
  dressShade: '#9c8c84',
  stain: '#6a3030',
  skin: '#e2dace',
  skinShade: '#b4aca0',
  limb: '#c4baae',
  limbFar: '#857d74',
  hair: '#24180f',
  shoe: '#2a1a1a',
  hat: '#b3161d',
  crack: '#8a8478',
};

// Passada de 6 quadros: [avanço do pé/mão, quanto ergue]. Cada membro começa numa fase
// diferente; a perna de trás mais perto arrasta (não ergue) — ela "manca".
const GAIT = [
  [3, 0],
  [1, 0],
  [-1, 0],
  [-3, 0],
  [-1, 2],
  [2, 1],
];
const PHASE = { farHind: 0, farFront: 2, nearHind: 3, nearFront: 5 };
// Corpo descendo/subindo e trancos da cabeça (fora do ritmo dos passos)
const BOB = [0, 1, 0, 0, 1, 1];
const TWITCH = [
  [0, 0],
  [0, 0],
  [1, -1],
  [0, 0],
  [-1, 1],
  [0, 0],
];
// Inclinação da cabeça por quadro (olhos em alturas diferentes); no quadro 4 ela tomba
const TILT = [1, 1, 0, 1, -1, 1];

const gait = (n, phase, drag = false) => {
  const [dx, lift] = GAIT[(n + phase) % 6];
  return drag ? [Math.round(dx / 2), 0] : [dx, lift];
};

/** Rosto de porcelana virado para quem olha, inclinado; cabelo caindo dos lados. */
function claraFace(c, x, y, hx, hy, tilt, { hairLen = 6, back = false } = {}) {
  // cabelo atrás da cabeça, escorrendo dos dois lados
  c.rect(x + hx - 4, y + hy - 2, 2, hairLen + 1, CLA.hair);
  c.rect(x + hx + 3, y + hy - 2, 2, hairLen + 1 - (tilt > 0 ? 1 : 0), CLA.hair);
  c.px(x + hx - 4, y + hy + hairLen, CLA.hair);
  ellipse(c, x, y, hx, hy, 3, 3, back ? CLA.hair : CLA.skin);
  c.rect(x + hx - 3, y + hy - 3, 7, 2, CLA.hair); // franja
  if (!back) {
    // olhos todos pretos, um mais alto que o outro (cabeça tombada)
    c.rect(x + hx - 2, y + hy - (tilt < 0 ? 1 : 0), 1, 2, B);
    c.rect(x + hx + 1, y + hy - (tilt > 0 ? 1 : 0), 1, 2, B);
    // boca aberta demais, torta
    c.rect(x + hx - 1, y + hy + 2, 2, 1, B);
    c.px(x + hx + (tilt > 0 ? 1 : -2), y + hy + (tilt > 0 ? 1 : 3), B);
    // porcelana rachada
    c.px(x + hx + 2, y + hy - 2, CLA.crack);
    c.px(x + hx + 3, y + hy - 1, CLA.crack);
    c.px(x + hx - 3, y + hy + 1, CLA.skinShade);
  }
  // chapéu de aniversário torto
  const hs = tilt >= 0 ? 1 : -1;
  c.rect(x + hx + hs, y + hy - 5, 2, 2, CLA.hat);
  c.px(x + hx + hs * 2, y + hy - 6, CLA.hat);
  c.px(x + hx + hs * 3, y + hy - 7, '#e0c34a');
}

export function claraFrames() {
  const frames = {};
  const N = GAIT.length;
  const FLOOR = 17;

  // Perfil (26×18), andando para a direita; o rosto vira para quem olha
  frames.side = Array.from({ length: N }, (_, n) => (c, x, y) => {
    const b = BOB[n];
    const [tx, ty] = TWITCH[n];
    const hip = [5, 3 + b];
    const sh = [15, 8 + b];
    const leg = ([dx, lift], color, off) => {
      const root = [hip[0] + off, hip[1]];
      const foot = [root[0] + dx, FLOOR - lift];
      const knee = [Math.round((root[0] + foot[0]) / 2) + 1, Math.round((root[1] + foot[1]) / 2)];
      limb(c, x, y, root, knee, 1, color);
      limb(c, x, y, knee, foot, 1, color);
      c.rect(x + foot[0], y + foot[1], 2, 1, CLA.shoe);
    };
    // braço: o cotovelo dobra para a frente (ao contrário)
    const arm = ([dx, lift], color) => {
      const hand = [sh[0] + dx, FLOOR - lift];
      const elbow = [Math.round((sh[0] + hand[0]) / 2) + 2, Math.round((sh[1] + hand[1]) / 2)];
      limb(c, x, y, sh, elbow, 1, color);
      limb(c, x, y, elbow, hand, 1, color);
      c.px(x + hand[0] + 1, y + hand[1], color); // dedos compridos no chão
    };
    leg(gait(n, PHASE.farHind), CLA.limbFar, -2);
    arm(gait(n, PHASE.farFront), CLA.limbFar);
    // vestido de festa: tronco e a saia caindo em volta das coxas
    limb(c, x, y, hip, sh, 3, CLA.dress);
    poly(c, x, y, [[hip[0] - 1, hip[1] - 1], [hip[0] + 3, hip[1]], [hip[0] + 3, hip[1] + 5], [hip[0] - 3, hip[1] + 4]], CLA.dress);
    c.rect(x + hip[0] - 3, y + hip[1] + 5, 6, 1, CLA.dressShade); // barra
    c.px(x + 10, y + 7 + b, CLA.stain);
    c.px(x + 4, y + 8 + b, CLA.stain);
    c.px(x + 13, y + 8 + b, CLA.stain);
    leg(gait(n, PHASE.nearHind, true), CLA.limb, 1);
    arm(gait(n, PHASE.nearFront), CLA.limb);
    // cabeça erguida e virada para trás, olhando para o Artur
    claraFace(c, x, y, 19 + tx, 5 + b + ty, TILT[n], { hairLen: 6 });
  });

  // De frente (vindo para baixo), 18×18: o rosto encara o jogador, o quadril alto atrás,
  // os braços descem retos (cotovelos virados para dentro), não abertos para os lados
  frames.down = Array.from({ length: N }, (_, n) => (c, x, y) => {
    const b = BOB[n];
    const [tx, ty] = TWITCH[n];
    c.rect(x + 6, y + 1 + b, 6, 3, CLA.dressShade); // quadril, lá atrás
    poly(c, x, y, [[5, 3 + b], [12, 3 + b], [13, 10 + b], [4, 10 + b]], CLA.dress);
    c.px(x + 11, y + 7 + b, CLA.stain);
    for (const [sx, ex, ph] of [[4, 6, PHASE.farFront], [13, 11, PHASE.nearFront]]) {
      const [dx, lift] = gait(n, ph);
      const hy = FLOOR - lift - (dx > 0 ? 0 : 1);
      limb(c, x, y, [sx, 9 + b], [ex, 13 + b], 1, CLA.limb);
      limb(c, x, y, [ex, 13 + b], [sx - (sx < 9 ? 1 : -1), hy], 1, CLA.limb);
    }
    claraFace(c, x, y, 9 + tx, 9 + b + ty, TILT[n], { hairLen: 5 });
  });

  // De costas (indo para cima), 18×18: quadril e pernas mais perto (embaixo), a nuca e o
  // cabelo lá em cima, braços dos lados
  frames.up = Array.from({ length: N }, (_, n) => (c, x, y) => {
    const b = BOB[n];
    const [tx] = TWITCH[n];
    for (const [sx, ex, ph] of [[5, 3, PHASE.farFront], [12, 14, PHASE.nearFront]]) {
      const [, lift] = gait(n, ph);
      limb(c, x, y, [sx, 5 + b], [ex, 7 + b], 1, CLA.limbFar);
      limb(c, x, y, [ex, 7 + b], [sx - (sx < 9 ? 1 : -1), 10 - lift], 1, CLA.limbFar);
    }
    claraFace(c, x, y, 9 + tx, 4 + b, TILT[n], { hairLen: 4, back: true });
    c.rect(x + 6, y + 6 + b, 6, 2, CLA.dress); // costas
    poly(c, x, y, [[5, 7 + b], [12, 7 + b], [13, 12 + b], [4, 12 + b]], CLA.dress); // saia
    c.rect(x + 4, y + 12 + b, 10, 1, CLA.dressShade);
    c.px(x + 10, y + 9 + b, CLA.stain);
    for (const [hx0, fx, ph, drag] of [[7, 6, PHASE.farHind, false], [10, 11, PHASE.nearHind, true]]) {
      const [, lift] = gait(n, ph, drag);
      const fy = FLOOR - lift;
      limb(c, x, y, [hx0, 12 + b], [fx, fy], 1, CLA.limb);
      c.px(x + fx, y + fy, CLA.shoe);
    }
  });
  return frames;
}

// ---- Vulto: sombra preta correndo (alucinação), perfil, 8 quadros --------------------

export function shadowRunFrames() {
  const cycle = runCycle({ stride: 1.2, bend: 1, arms: 1.2, bounce: 1 });
  return cycle.map((pose, n) => (c, x, y) => {
    humanSide(c, x, y, pose, {
      hipX: 10, hipY: 19, lean: 3, torso: 9, torsoW: 5, legW: 2, armW: 2, armDrop: 0,
      headDx: 2, headUp: 4, body: B, far: B,
      head: (cc, ox, oy, [hx, hy]) => {
        ellipse(cc, ox, oy, hx, hy, 3, 4, B); // capuz
        cc.rect(ox + hx - 4, oy + hy - 1, 2, 5, B);
      },
      // Capa esvoaçando para trás, mudando a cada quadro
      cape: (cc, ox, oy, sh, hip) => {
        const flap = [0, 1, 2, 1, 0, 1, 2, 1][n];
        poly(cc, ox, oy, [
          [sh[0] - 1, sh[1]],
          [sh[0] - 6 - flap, sh[1] + 5],
          [hip[0] - 8 - flap, hip[1] + 2 + flap],
          [hip[0], hip[1] + 1],
        ], B);
      },
    });
  });
}

// ---- Helena (parada; surge com a lanterna) ---------------------------------------

/**
 * Helena surgindo (GDD 13.5): cabelo preto, longo e encharcado cobrindo o rosto, camisola
 * branca suja, dedos longos pingando. `head`: 0 = cabeça baixa … 2 = olhando direto.
 * `sway`: cabelo e corpo "pulando quadros" (movimento travado). 16×32
 */
export function helena(head, sway = 0) {
  return (c, x, y) => {
    const hair = '#0c0b0d';
    const gown = '#b8b4a8';
    const shade = '#8e8a80';
    const skin = '#7c8084';
    const hy = 4 - head * 2;
    const s = sway;
    c.rect(x + 4, y + 12, 8, 17, gown);
    c.rect(x + 3, y + 18, 10, 11, gown);
    c.rect(x + 5, y + 20, 1, 9, shade);
    c.rect(x + 9, y + 16, 1, 13, shade);
    c.rect(x + 2, y + 13 + s, 1, 10, skin);
    c.rect(x + 13, y + 13, 1, 10 + s, skin);
    c.rect(x + 2, y + 23 + s, 1, 5, skin); // dedos longos demais
    c.rect(x + 13, y + 23 + s, 1, 5, skin);
    c.px(x + 2, y + 28 + s * 2, '#3a4248'); // pingando
    c.rect(x + 5, y + 29, 2, 2, skin);
    c.rect(x + 9, y + 29, 2, 2, skin);
    c.rect(x + 5 + s, y + hy, 6, 2, hair);
    c.rect(x + 4 + s, y + hy + 2, 8, 9, hair);
    c.rect(x + 3, y + hy + 5, 10, 10 - head, hair);
    c.rect(x + 3 + (s ? 9 : 0), y + hy + 14 - head, 1, 3, hair); // mecha pingando
    if (head === 2) {
      c.rect(x + 7 + s, y + hy + 4, 2, 4, '#8a8e90');
      c.px(x + 7 + s, y + hy + 5, '#e8e8e0');
    }
  };
}

/** Partícula de cinza. 2×2 */
export function ash(c, x, y) {
  c.rect(x, y, 2, 2, '#4a4642');
  c.px(x, y, '#6a645e');
}
