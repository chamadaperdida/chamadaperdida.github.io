// Gera os sons do jogo a partir das gravações (scripts/audio-manifest.mjs).
// Rode: npm run audio
//
// 1. Baixa para .audio-cache/ as gravações que ainda não estiverem lá.
// 2. Para cada trecho: acha o começo do golpe (hit), corta, emenda loops com cruzamento,
//    suaviza começo e fim, normaliza o pico em −1 dB.
// 3. Comprime em MP3 mono (public/assets/audio/<nome>.mp3) e escreve manifest.json.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { SOURCES, CLIPS } from './audio-manifest.mjs';

const require = createRequire(import.meta.url);
const ffmpeg = require('ffmpeg-static');
const SR = 44100;
const CACHE = '.audio-cache';
const OUT = 'public/assets/audio';
mkdirSync(CACHE, { recursive: true });
mkdirSync(OUT, { recursive: true });

// ---- Gravações -------------------------------------------------------------------------

const extOf = (url) => url.split('?')[0].split('.').pop();

function cached(key) {
  const file = `${CACHE}/${key}.${extOf(SOURCES[key])}`;
  if (!existsSync(file)) {
    console.log(`baixando ${key}…`);
    execFileSync('curl', ['-sfL', '-A', 'chamada-perdida-game/1.0', SOURCES[key], '-o', file]);
  }
  return file;
}

const decoded = new Map();
function decode(key) {
  if (!decoded.has(key)) {
    const buf = execFileSync(ffmpeg, ['-v', 'error', '-i', cached(key), '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], {
      maxBuffer: 1 << 30,
    });
    decoded.set(key, new Float32Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length)));
  }
  return decoded.get(key);
}

// ---- Processamento ----------------------------------------------------------------------

const rms = (x, a, b) => {
  let s = 0;
  for (let i = a; i < b; i++) s += x[i] * x[i];
  return Math.sqrt(s / Math.max(1, b - a));
};

/** Começo do golpe perto de `at`: primeira janela de 5 ms a menos de 20 dB do mais alto. */
function findOnset(x, at) {
  const w = Math.round(SR * 0.005);
  const a = Math.max(0, Math.round((at - 0.3) * SR));
  const b = Math.min(x.length - w, Math.round((at + 0.6) * SR));
  let peak = 0;
  for (let i = a; i < b; i += w) peak = Math.max(peak, rms(x, i, i + w));
  const thr = peak * 0.1;
  for (let i = a; i < b; i += w) if (rms(x, i, i + w) >= thr) return Math.max(0, i / SR - 0.008);
  return at;
}

function cut({ src, at, len, hit, loop }) {
  const x = decode(src);
  const start = hit ? findOnset(x, at) : at;
  const s = Math.round(start * SR);
  const n = Math.round(len * SR);
  if (loop) {
    // Emenda: os últimos `loop` s (depois do trecho) entram por cima do começo
    const f = Math.round(loop * SR);
    const y = x.slice(s, s + n);
    for (let i = 0; i < f && s + n + i < x.length; i++) {
      const k = i / f;
      y[i] = y[i] * Math.sin((k * Math.PI) / 2) + x[s + n + i] * Math.cos((k * Math.PI) / 2);
    }
    return y;
  }
  const y = x.slice(s, Math.min(x.length, s + n));
  const fin = Math.round(SR * 0.003);
  const fout = Math.round(Math.min(0.08, (y.length / SR) * 0.2) * SR);
  for (let i = 0; i < fin; i++) y[i] *= i / fin;
  for (let i = 0; i < fout; i++) y[y.length - 1 - i] *= i / fout;
  return y;
}

function normalize(y, gainDb = 0) {
  let peak = 0;
  for (const v of y) peak = Math.max(peak, Math.abs(v));
  const g = (10 ** (-1 / 20) / Math.max(peak, 1e-6)) * 10 ** (gainDb / 20);
  for (let i = 0; i < y.length; i++) y[i] *= g;
  return y;
}

function wav(y) {
  const b = Buffer.alloc(44 + y.length * 2);
  b.write('RIFF', 0);
  b.writeUInt32LE(36 + y.length * 2, 4);
  b.write('WAVEfmt ', 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(SR, 24);
  b.writeUInt32LE(SR * 2, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write('data', 36);
  b.writeUInt32LE(y.length * 2, 40);
  for (let i = 0; i < y.length; i++) b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(y[i] * 32767))), 44 + i * 2);
  return b;
}

// ---- Saída ------------------------------------------------------------------------------

for (const f of readdirSync(OUT)) rmSync(`${OUT}/${f}`);
const manifest = {};
let total = 0;
for (const clip of CLIPS) {
  const y = normalize(cut(clip), clip.gain ?? 0);
  const tmp = `${CACHE}/_tmp.wav`;
  writeFileSync(tmp, wav(y));
  const file = `${OUT}/${clip.out}.mp3`;
  execFileSync(ffmpeg, ['-v', 'error', '-y', '-i', tmp, '-ac', '1', '-codec:a', 'libmp3lame', '-b:a', clip.loop ? '64k' : '96k', file]);
  manifest[clip.out] = { duration: +(y.length / SR).toFixed(3), loop: !!clip.loop };
  total += execFileSync('node', ['-e', `console.log(require('fs').statSync('${file}').size)`]).toString() * 1;
}
rmSync(`${CACHE}/_tmp.wav`, { force: true });
writeFileSync(`${OUT}/manifest.json`, JSON.stringify(manifest, null, 1));
console.log(`${CLIPS.length} sons em ${OUT} (${(total / 1024 / 1024).toFixed(2)} MB)`);
