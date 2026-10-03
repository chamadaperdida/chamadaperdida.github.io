// Glitch de tela (GDD 4.10 remédio; depois também medo 100% e jumpscares):
// imagem deslocada em faixas, cores separadas e linhas cortadas.
// intensity 0 = imagem normal, 1 = glitch forte.

import Phaser from 'phaser';

const FRAG = `
#define SHADER_NAME GLITCH_FS
precision mediump float;
uniform sampler2D uMainSampler;
uniform float uTime;
uniform float uIntensity;
varying vec2 outTexCoord;

float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 uv = outTexCoord;
  float tick = floor(uTime * 24.0);

  // Faixas horizontais deslocadas
  float band = floor(uv.y * 18.0);
  float r = rand(vec2(band, tick));
  float shift = r > 0.55 ? (r - 0.55) * 0.22 : 0.0;
  uv.x += shift * uIntensity * (rand(vec2(band + 7.0, tick)) > 0.5 ? 1.0 : -1.0);

  // Cores separadas
  float split = 0.012 * uIntensity;
  vec4 base = texture2D(uMainSampler, uv);
  float red = texture2D(uMainSampler, uv + vec2(split, 0.0)).r;
  float blue = texture2D(uMainSampler, uv - vec2(split, 0.0)).b;
  vec3 color = vec3(red, base.g, blue);

  // Linhas cortadas
  float line = step(0.96, rand(vec2(floor(uv.y * 200.0), tick))) * uIntensity;
  color = mix(color, vec3(0.0), line * 0.85);

  gl_FragColor = vec4(color, base.a);
}
`;

export class GlitchPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game) {
    super({ game, name: 'Glitch', fragShader: FRAG });
    this.intensity = 0;
  }

  onPreRender() {
    this.set1f('uTime', this.game.loop.time / 1000);
    this.set1f('uIntensity', this.intensity);
  }
}

/**
 * Faz um glitch rápido na câmera: começa forte e some em `seconds`.
 * Funciona só em WebGL (em Canvas, não faz nada).
 */
export function glitchCamera(scene, camera, seconds, peak = 1) {
  if (!(scene.renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer)) return;
  const pipelines = scene.renderer.pipelines;
  if (!pipelines.postPipelineClasses.has('Glitch')) pipelines.addPostPipeline('Glitch', GlitchPipeline);
  camera.setPostPipeline('Glitch');
  const pipe = camera.getPostPipeline('Glitch');
  const fx = Array.isArray(pipe) ? pipe[pipe.length - 1] : pipe;
  fx.intensity = peak;
  scene.tweens.add({
    targets: fx,
    intensity: 0,
    duration: seconds * 1000,
    ease: 'Quad.easeIn',
    onComplete: () => camera.removePostPipeline('Glitch'),
  });
}
