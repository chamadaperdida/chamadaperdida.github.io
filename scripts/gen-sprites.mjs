// Gera todos os sprites do jogo em public/assets/sprites (rode: npm run sprites).
import { mkdirSync, writeFileSync } from 'node:fs';
import { drawArtur } from './sprites/artur.mjs';
import { drawTiles } from './sprites/tiles.mjs';
import { drawProps } from './sprites/props.mjs';
import { drawFaces } from './sprites/face.mjs';
import { drawJumpscares } from './sprites/jumpscares.mjs';

const OUT = 'public/assets/sprites';
mkdirSync(OUT, { recursive: true });

drawArtur().save(`${OUT}/artur.png`);
drawTiles().save(`${OUT}/tiles.png`);
drawFaces().save(`${OUT}/face.png`);
drawJumpscares().save(`${OUT}/jumpscares.png`);
const props = drawProps();
props.canvas.save(`${OUT}/props.png`);
writeFileSync(`${OUT}/props.json`, JSON.stringify(props.json, null, 2));

console.log('Sprites gerados em', OUT);
