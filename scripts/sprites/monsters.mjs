// Monstros no jogo (GDD 13.5), para o atlas props. Todos vistos de frente/diagonal.

const B = '#030304';

/** Invasor: capa de chuva preta encharcada, capuz, rosto em escuro total. Anda rígido. 16×32 */
export function invader(frame) {
  return (c, x, y) => {
    const coat = '#14171c';
    const wet = '#2c3440';
    const bob = frame; // passo rígido: sobe/desce 1 px
    // Capuz
    c.rect(x + 5, y + 1 + bob, 6, 2, coat);
    c.rect(x + 4, y + 3 + bob, 8, 8, coat);
    c.rect(x + 6, y + 5 + bob, 4, 5, B); // rosto: escuro total
    c.px(x + 5, y + 2 + bob, wet);
    // Capa até os joelhos, ombros retos (manequim)
    c.rect(x + 2, y + 11 + bob, 12, 15, coat);
    c.rect(x + 3, y + 11 + bob, 1, 14, wet); // brilho de molhado
    c.rect(x + 11, y + 13 + bob, 1, 10, wet);
    c.rect(x + 7, y + 12 + bob, 1, 13, '#0c0e12'); // fecho
    // Braços colados ao corpo
    c.rect(x + 1, y + 12 + bob, 1, 11, coat);
    c.rect(x + 14, y + 12 + bob, 1, 11, coat);
    // Pernas rígidas, alternando
    const l = frame ? 1 : 0;
    c.rect(x + 4, y + 26, 3, 5 - l, '#0e1014');
    c.rect(x + 9, y + 26, 3, 4 + l, '#0e1014');
    // Pingando
    c.px(x + 2, y + 27 + frame * 2, wet);
    c.px(x + 13, y + 29 - frame, wet);
  };
}

/**
 * Artur distorcido: quase todo preto, alto, curvado, braços longos quase arrastando no
 * chão, pele rachada de carvão. Os olhos e o distintivo são desenhados à parte. 18×36
 */
export function distorted(frame) {
  return (c, x, y) => {
    const crack = '#16120f';
    const jerk = frame ? 1 : -1; // cabeça dá trancos para os lados
    // Cabeça curvada para a frente
    c.rect(x + 7 + jerk, y + 1, 5, 6, B);
    c.px(x + 8 + jerk, y + 3, crack);
    // Pescoço e tronco curvado
    c.rect(x + 6, y + 6, 6, 3, B);
    c.rect(x + 4, y + 9, 10, 13, B);
    c.px(x + 6, y + 12, crack);
    c.px(x + 10, y + 16, crack);
    c.px(x + 7, y + 19, crack);
    // Braços longos demais
    const sw = frame ? 1 : 0;
    c.rect(x + 2, y + 10, 2, 20 + sw, B);
    c.rect(x + 14, y + 10, 2, 21 - sw, B);
    c.rect(x + 1, y + 29 + sw, 2, 3, B); // dedos
    c.rect(x + 15, y + 30 - sw, 2, 3, B);
    // Pernas
    c.rect(x + 5, y + 22, 3, 13 - sw, B);
    c.rect(x + 10, y + 22, 3, 12 + sw, B);
  };
}

/** Olhos pálidos + distintivo do Artur distorcido (aparecem no escuro). 18×36 */
export function distortedEyes(c, x, y) {
  c.px(x + 8, y + 3, '#d8d4c4');
  c.px(x + 10, y + 3, '#d8d4c4');
}

/** Distintivo no peito (só reflete com a lanterna). 18×36 */
export function distortedBadge(c, x, y) {
  c.rect(x + 9, y + 11, 2, 2, '#c8a848');
  c.px(x + 9, y + 11, '#f0e0a0');
}

/**
 * Clara correndo de quatro, como uma aranha: vestido de festa manchado, chapéu torto,
 * cabeça de porcelana virada num ângulo impossível. 22×16
 */
export function claraCrawl(frame) {
  return (c, x, y) => {
    const dress = '#c8b8b0';
    const stain = '#6a3030';
    const skin = '#d8d0c4';
    const limb = '#bcb2a6';
    // Corpo baixo
    c.rect(x + 6, y + 6, 10, 5, dress);
    c.px(x + 9, y + 8, stain);
    c.px(x + 13, y + 7, stain);
    // Cabeça de porcelana virada de lado, olhos pretos
    c.rect(x + 15, y + 3, 6, 5, skin);
    c.px(x + 17, y + 5, B);
    c.px(x + 19, y + 5, B);
    c.px(x + 16, y + 4, '#8a8478'); // rachadura
    c.px(x + 18, y + 7, '#8a8478');
    // Chapéu de aniversário torto
    c.rect(x + 16, y + 1, 2, 2, '#b3161d');
    c.px(x + 15, y, '#e0c34a');
    // Braços e pernas finos, dobrados para cima (aranha), alternando
    const a = frame ? 1 : 0;
    // frente
    c.rect(x + 14, y + 9, 1, 3, limb);
    c.rect(x + 15 + a, y + 12, 1, 3, limb);
    c.rect(x + 11, y + 10, 1, 2, limb);
    c.rect(x + 12 - a, y + 12, 1, 3, limb);
    // trás (joelhos acima do corpo)
    c.rect(x + 4, y + 4, 2, 1, limb);
    c.rect(x + 3, y + 5, 1, 9, limb);
    c.rect(x + 2 + a, y + 14, 2, 1, limb);
    c.rect(x + 7, y + 4, 1, 2, limb);
    c.rect(x + 6 - a, y + 11, 1, 4, limb);
  };
}

/**
 * Helena surgindo (GDD 13.5): cabelo preto, longo e encharcado cobrindo o rosto, camisola
 * branca suja, dedos longos pingando. `head`: 0 = cabeça baixa … 2 = olhando direto. 16×32
 */
export function helena(head) {
  return (c, x, y) => {
    const hair = '#0c0b0d';
    const gown = '#b8b4a8';
    const shade = '#8e8a80';
    const skin = '#7c8084';
    const hy = 4 - head * 2; // a cabeça vai se erguendo
    c.rect(x + 4, y + 12, 8, 17, gown);
    c.rect(x + 3, y + 18, 10, 11, gown);
    c.rect(x + 5, y + 20, 1, 9, shade);
    c.rect(x + 9, y + 16, 1, 13, shade);
    c.rect(x + 2, y + 13, 1, 10, skin);
    c.rect(x + 13, y + 13, 1, 10, skin);
    c.rect(x + 2, y + 23, 1, 5, skin); // dedos longos demais
    c.rect(x + 13, y + 23, 1, 5, skin);
    c.px(x + 2, y + 28, '#3a4248'); // pingando
    c.rect(x + 5, y + 29, 2, 2, skin);
    c.rect(x + 9, y + 29, 2, 2, skin);
    // Cabeça e cabelo caindo
    c.rect(x + 5, y + hy, 6, 2, hair);
    c.rect(x + 4, y + hy + 2, 8, 9, hair);
    c.rect(x + 3, y + hy + 5, 10, 10 - head, hair);
    if (head === 2) {
      // Olhando direto: uma fresta de pele cinza e um olho sem íris entre o cabelo
      c.rect(x + 7, y + hy + 4, 2, 4, '#8a8e90');
      c.px(x + 7, y + hy + 5, '#e8e8e0');
    }
  };
}

/** Partícula de cinza. 2×2 */
export function ash(c, x, y) {
  c.rect(x, y, 2, 2, '#4a4642');
  c.px(x, y, '#6a645e');
}
