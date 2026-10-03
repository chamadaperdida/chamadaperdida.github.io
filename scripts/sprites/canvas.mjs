// Tela de pixels mínima para desenhar sprites por código e salvar como PNG.
// Sem dependências: usa só zlib do Node.

import { deflateSync, crc32 } from 'node:zlib';
import { writeFileSync } from 'node:fs';

function parseColor(color) {
  if (color == null) return [0, 0, 0, 0];
  const hex = color.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const a = hex.length >= 8 ? parseInt(hex.slice(6, 8), 16) : 255;
  return [r, g, b, a];
}

export class PixelCanvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.data = new Uint8Array(width * height * 4);
  }

  px(x, y, color) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const [r, g, b, a] = parseColor(color);
    const i = (y * this.width + x) * 4;
    this.data[i] = r;
    this.data[i + 1] = g;
    this.data[i + 2] = b;
    this.data[i + 3] = a;
  }

  rect(x, y, w, h, color) {
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) this.px(xx, yy, color);
    }
  }

  alphaAt(x, y) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return 0;
    return this.data[(y * this.width + x) * 4 + 3];
  }

  /** Contorno de 1px em volta de tudo que não é transparente, dentro de uma região. */
  outline(x0, y0, w, h, color) {
    const marks = [];
    for (let y = y0; y < y0 + h; y++) {
      for (let x = x0; x < x0 + w; x++) {
        if (this.alphaAt(x, y) !== 0) continue;
        const near =
          (x > x0 && this.alphaAt(x - 1, y)) ||
          (x < x0 + w - 1 && this.alphaAt(x + 1, y)) ||
          (y > y0 && this.alphaAt(x, y - 1)) ||
          (y < y0 + h - 1 && this.alphaAt(x, y + 1));
        if (near) marks.push([x, y]);
      }
    }
    for (const [x, y] of marks) this.px(x, y, color);
  }

  /** Copia uma região espelhada na horizontal. */
  mirrorRegion(sx, sy, w, h, dx, dy) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const si = ((sy + y) * this.width + (sx + x)) * 4;
        const di = ((dy + y) * this.width + (dx + w - 1 - x)) * 4;
        for (let k = 0; k < 4; k++) this.data[di + k] = this.data[si + k];
      }
    }
  }

  save(path) {
    const { width, height, data } = this;
    const raw = Buffer.alloc((width * 4 + 1) * height);
    for (let y = 0; y < height; y++) {
      raw[y * (width * 4 + 1)] = 0;
      Buffer.from(data.buffer, y * width * 4, width * 4).copy(raw, y * (width * 4 + 1) + 1);
    }
    const chunk = (type, body) => {
      const len = Buffer.alloc(4);
      len.writeUInt32BE(body.length);
      const typeAndBody = Buffer.concat([Buffer.from(type, 'ascii'), body]);
      const crc = Buffer.alloc(4);
      crc.writeUInt32BE(crc32(typeAndBody) >>> 0);
      return Buffer.concat([len, typeAndBody, crc]);
    };
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8; // bits por canal
    ihdr[9] = 6; // RGBA
    const png = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', ihdr),
      chunk('IDAT', deflateSync(raw)),
      chunk('IEND', Buffer.alloc(0)),
    ]);
    writeFileSync(path, png);
  }
}

/** Gerador pseudoaleatório com semente (sprites sempre iguais a cada geração). */
export function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
