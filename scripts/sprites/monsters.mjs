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

// ---- Clara: corre de quatro como uma aranha, rápida e desconjuntada -----------------

const CLA = {
  dress: '#c8b8b0',
  dressShade: '#a89890',
  stain: '#6a3030',
  skin: '#d8d0c4',
  limb: '#bcb2a6',
  limbFar: '#8e867c',
  hat: '#b3161d',
  crack: '#8a8478',
};

// Patas: [ombro/quadril], [joelho no alto], [pé/mão no chão] — duas fases alternando
const CRAWL = [
  { a: 0, b: 1 },
  { a: 1, b: 0.5 },
  { a: 0.5, b: 0 },
  { a: 0, b: 0.5 },
];

function claraHead(c, x, y, hx, hy, view) {
  ellipse(c, x, y, hx, hy, 3, 3, CLA.skin); // porcelana
  if (view !== 'up') {
    c.px(x + hx - 1, y + hy, B); // olhos totalmente pretos
    c.px(x + hx + 1, y + hy, B);
    c.px(x + hx, y + hy - 2, CLA.crack);
    c.px(x + hx + 2, y + hy + 2, CLA.crack);
  } else {
    c.rect(x + hx - 2, y + hy - 2, 5, 3, '#3a2a1e'); // cabelo
  }
  c.rect(x + hx + 1, y + hy - 5, 2, 2, CLA.hat); // chapéu torto
  c.px(x + hx + 3, y + hy - 6, '#e0c34a');
}

export function claraFrames() {
  const frames = {};
  // Perfil (24×16): corpo baixo e horizontal, joelhos acima do corpo
  frames.side = CRAWL.map((ph, n) => (c, x, y) => {
    const step = (t, dir) => Math.round((t - 0.5) * 6 * dir);
    const body = [[7, 8], [17, 8]];
    // patas de trás (quadril em 7,8) e da frente (ombro em 16,8)
    const legs = [
      { root: [7, 8], t: ph.a, far: true },
      { root: [7, 8], t: ph.b, far: false },
      { root: [16, 8], t: ph.b, far: true },
      { root: [16, 8], t: ph.a, far: false },
    ];
    for (const L of legs.filter((l) => l.far)) {
      const knee = [L.root[0] + step(L.t, 1) - 2, 2 + Math.round(L.t * 2)];
      const foot = [L.root[0] + step(L.t, 1) + 1, 15 - Math.round((1 - L.t) * 2)];
      limb(c, x, y, L.root, knee, 1, CLA.limbFar);
      limb(c, x, y, knee, foot, 1, CLA.limbFar);
    }
    limb(c, x, y, body[0], body[1], 4, CLA.dress);
    c.px(x + 10, y + 8, CLA.stain);
    c.px(x + 13, y + 7, CLA.stain);
    c.rect(x + 6, y + 9, 3, 2, CLA.dressShade); // saia do vestido caída
    for (const L of legs.filter((l) => !l.far)) {
      const knee = [L.root[0] + step(L.t, 1) - 1, 1 + Math.round(L.t * 2)];
      const foot = [L.root[0] + step(L.t, 1) + 2, 15 - Math.round((1 - L.t) * 2)];
      limb(c, x, y, L.root, knee, 1, CLA.limb);
      limb(c, x, y, knee, foot, 1, CLA.limb);
    }
    // Cabeça virada num ângulo impossível, à frente e um pouco abaixo
    claraHead(c, x, y, 20, 9 + (n % 2), 'side');
  });
  // De frente/de costas (18×18): patas abertas dos dois lados, como aranha
  const front = (view) =>
    CRAWL.map((ph, n) => (c, x, y) => {
      const lift = (t) => Math.round(t * 3);
      const sides = [
        [ [6, 7], [1, 3 - lift(ph.a)], [2, 15 - lift(ph.a)] ],
        [ [12, 7], [17, 3 - lift(ph.b)], [16, 15 - lift(ph.b)] ],
        [ [6, 11], [1, 8 - lift(ph.b)], [3, 17 - lift(ph.b)] ],
        [ [12, 11], [17, 8 - lift(ph.a)], [15, 17 - lift(ph.a)] ],
      ];
      for (const [root, knee, foot] of sides) {
        limb(c, x, y, root, knee, 1, CLA.limb);
        limb(c, x, y, knee, foot, 1, CLA.limb);
      }
      c.rect(x + 6, y + 6, 7, 7, CLA.dress);
      c.px(x + 8, y + 9, CLA.stain);
      claraHead(c, x, y, 9, view === 'down' ? 14 + (n % 2) : 5, view);
    });
  frames.down = front('down');
  frames.up = front('up');
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
