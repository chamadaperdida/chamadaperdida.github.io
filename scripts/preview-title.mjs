// Prévia da tela inicial (céu + quarto + raios) em 960×540, para conferir a arte sem o jogo.
// node scripts/preview-title.mjs <saída.png>
import { drawTitle, TITLE_SPOTS, TITLE_W, TITLE_H } from './sprites/title.mjs';
import { PixelCanvas } from './sprites/canvas.mjs';

const { canvas: atlas, json } = drawTitle();
const out = new PixelCanvas(TITLE_W, TITLE_H);
const at = (f, x, y) => {
  const i = ((f.y + y) * atlas.width + (f.x + x)) * 4;
  return atlas.data.slice(i, i + 4);
};
const put = (x, y, p, add = false) => {
  if (x < 0 || y < 0 || x >= TITLE_W || y >= TITLE_H) return;
  const i = (y * TITLE_W + x) * 4;
  const a = p[3] / 255;
  for (let k = 0; k < 3; k++) {
    out.data[i + k] = add ? Math.min(255, out.data[i + k] + p[k] * a) : out.data[i + k] * (1 - a) + p[k] * a;
  }
  out.data[i + 3] = 255;
};
const draw = (name, ox, oy, add) => {
  const f = json.frames[name].frame;
  for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) put(ox + x, oy + y, at(f, x, y), add);
};
draw('sky', ...TITLE_SPOTS.sky);
draw('room', 0, 0);
draw('rays', 0, 0, true);
if (process.argv[3] === 'figure') draw('figure', ...TITLE_SPOTS.figure);
const big = new PixelCanvas(TITLE_W * 2, TITLE_H * 2);
for (let y = 0; y < TITLE_H * 2; y++) {
  for (let x = 0; x < TITLE_W * 2; x++) {
    const i = ((y >> 1) * TITLE_W + (x >> 1)) * 4;
    const j = (y * TITLE_W * 2 + x) * 4;
    for (let k = 0; k < 4; k++) big.data[j + k] = out.data[i + k];
  }
}
big.save(process.argv[2] ?? 'title-preview.png');
