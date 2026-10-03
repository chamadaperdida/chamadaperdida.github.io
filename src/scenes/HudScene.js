// Interface da casa (GDD 11): rosto do Artur, barra de medo (vermelha), estamina (azul),
// bateria (amarela), aviso de interação [F], progresso do gerador e caixa de diálogo.

import Phaser from 'phaser';
import { DialogueBox } from '../ui/DialogueBox.js';

const FONT = 'VT323, monospace';

const FACE_X = 16;
const FACE_Y = 12;
const FACE_SCALE = 2; // 24 px → 48 px
const BAR_X = 76;
const FEAR = { y: 16, w: 260, h: 18 };
const STAMINA = { y: 42, w: 170, h: 6 };
const BATTERY = { y: 54, w: 170, h: 6 };

// Rosto por faixa de medo (GDD 11)
function faceFrame(fear) {
  if (fear >= 100) return 5;
  if (fear >= 80) return 4;
  if (fear >= 60) return 3;
  if (fear >= 40) return 2;
  if (fear >= 20) return 1;
  return 0;
}

function bar(scene, y, w, h, bg, border, fill) {
  scene.add.rectangle(BAR_X, y, w, h, bg).setOrigin(0).setStrokeStyle(1, border);
  return scene.add.rectangle(BAR_X, y, w, h, fill).setOrigin(0);
}

export class HudScene extends Phaser.Scene {
  constructor() {
    super('Hud');
  }

  create() {
    this.fearFill = bar(this, FEAR.y, FEAR.w, FEAR.h, 0x1a0606, 0x4a1414, 0xb3161d);
    this.staminaFill = bar(this, STAMINA.y, STAMINA.w, STAMINA.h, 0x0d1420, 0x26324a, 0x3f78c8);
    this.batteryFill = bar(this, BATTERY.y, BATTERY.w, BATTERY.h, 0x1a1606, 0x3a3410, 0xd8b030);

    this.face = this.add
      .image(FACE_X + 24, FACE_Y + 24, 'face', 0)
      .setScale(FACE_SCALE)
      .setOrigin(0.5);
    this.faceIndex = 0;
    this.faceShake = 0;

    this.prompt = this.add
      .text(0, 0, 'F', {
        fontFamily: FONT,
        fontSize: '22px',
        color: '#e8e2cf',
        backgroundColor: '#000000aa',
        padding: { x: 6, y: 0 },
      })
      .setOrigin(0.5, 1)
      .setVisible(false);

    // Barra de "segurar F" do gerador
    this.holdBg = this.add.rectangle(0, 0, 64, 7, 0x000000, 0.8).setStrokeStyle(1, 0x6a6a60).setVisible(false);
    this.holdFill = this.add.rectangle(0, 0, 62, 5, 0xe8e2cf).setOrigin(0, 0.5).setVisible(false);

    this.dialogue = new DialogueBox(this);

    // Escurecer a tela (sequência de sono)
    const { width, height } = this.scale;
    this.fade = this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0).setAlpha(0).setDepth(3000);

    // Perseguição (GDD 7): bordas da tela escurecem e pulsam no ritmo do coração
    if (!this.textures.exists('chase-vignette')) {
      const tex = this.textures.createCanvas('chase-vignette', width, height);
      const ctx = tex.getContext();
      const g = ctx.createRadialGradient(width / 2, height / 2, height * 0.25, width / 2, height / 2, width * 0.62);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(0.6, 'rgba(10,0,0,0.55)');
      g.addColorStop(1, 'rgba(0,0,0,0.97)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);
      tex.refresh();
    }
    this.vignette = this.add.image(0, 0, 'chase-vignette').setOrigin(0).setAlpha(0).setDepth(-10);
    this.chaseLevel = 0;
  }

  /** Liga/desliga o efeito de perseguição (bordas escuras pulsando como o coração). */
  setChase(active) {
    this.chaseTarget = active ? 1 : 0;
  }

  updateChase(time, dt) {
    const target = this.chaseTarget ?? 0;
    this.chaseLevel += Math.max(-dt * 2, Math.min(dt * 3, target - this.chaseLevel));
    // Pulso no ritmo do coração da perseguição (~0,55 s), duas batidas (tum-tum)
    const phase = (time / 1000) % 0.55;
    const beat = Math.exp(-phase * 14) + 0.6 * Math.exp(-Math.max(0, phase - 0.17) * 14) * (phase > 0.17 ? 1 : 0);
    this.vignette.setAlpha(this.chaseLevel * (0.6 + 0.4 * Math.min(1, beat)));
  }

  /** Escurece a tela inteira aos poucos. */
  fadeToBlack(seconds) {
    this.tweens.killTweensOf(this.fade);
    this.tweens.add({ targets: this.fade, alpha: 1, duration: seconds * 1000, ease: 'Sine.easeIn' });
  }

  /** Volta a imagem (0 = na hora). */
  clearFade(seconds) {
    if (!this.fade) return;
    this.tweens.killTweensOf(this.fade);
    if (seconds <= 0) this.fade.setAlpha(0);
    else this.tweens.add({ targets: this.fade, alpha: 0, duration: seconds * 1000 });
  }

  update(time, deltaMs) {
    const dt = deltaMs / 1000;
    this.dialogue.update(dt);
    this.updateFace(time, dt);
    this.updateChase(time, dt);
  }

  /** O HUD já foi montado? (a casa espera por ele antes do primeiro quadro) */
  get ready() {
    return !!this.dialogue;
  }

  // ---- Barras -------------------------------------------------------------

  setFear(value) {
    this.fearValue = value;
    this.fearFill.width = (FEAR.w * value) / 100;
    const frame = faceFrame(value);
    if (frame !== this.faceIndex) {
      // Troca instantânea com um tremor rápido do ícone
      this.faceIndex = frame;
      this.face.setFrame(frame);
      this.faceShake = 0.18;
    }
  }

  setStamina(value, exhausted) {
    this.staminaFill.width = STAMINA.w * value;
    this.staminaFill.fillColor = exhausted ? 0x24406a : 0x3f78c8;
  }

  setBattery(value, low) {
    this.batteryFill.width = BATTERY.w * value;
    this.batteryFill.fillColor = low ? 0x8a6a18 : 0xd8b030;
  }

  updateFace(time, dt) {
    let dx = 0;
    let dy = 0;
    let alpha = 1;
    let tint = 0xffffff;
    let frame = this.faceIndex;

    if (this.faceShake > 0) {
      this.faceShake -= dt;
      dx = Phaser.Math.Between(-3, 3);
      dy = Phaser.Math.Between(-2, 2);
    }
    if (this.faceIndex === 3) {
      dx += Math.sin(time / 30) > 0.6 ? 1 : 0; // tremendo de leve
    } else if (this.faceIndex === 4) {
      dx += Phaser.Math.Between(-1, 1);
      dy += Phaser.Math.Between(-1, 1);
      alpha = Math.sin(time / 70) > 0.85 ? 0.35 : 1; // pisca
    } else if (this.faceIndex === 5) {
      // Glitch rápido: alterna com o rosto em pânico, desloca e tinge de vermelho
      const tick = Math.floor(time / 60);
      if (tick % 5 === 0) frame = 4;
      if (tick % 3 === 0) {
        dx += Phaser.Math.Between(-4, 4);
        tint = 0xff6060;
      }
    }
    this.face.setFrame(frame);
    this.face.setPosition(FACE_X + 24 + dx, FACE_Y + 24 + dy).setAlpha(alpha).setTint(tint);
  }

  // ---- Diálogo ------------------------------------------------------------

  /** Abre a caixa de diálogo. Aceita uma fala ou uma lista de falas. */
  talk(lines) {
    return this.dialogue.show(Array.isArray(lines) ? lines : [lines]);
  }

  get talking() {
    return this.dialogue?.isOpen ?? false;
  }

  // ---- Avisos no mundo ----------------------------------------------------

  /** Aviso [F] sobre um ponto da tela, ou null para esconder. */
  showPrompt(screenPoint) {
    if (!screenPoint || this.talking) {
      this.prompt.setVisible(false);
      return;
    }
    this.prompt.setPosition(Math.round(screenPoint.x), Math.round(screenPoint.y)).setVisible(true);
  }

  /** Progresso de segurar F no gerador (0 a 1) sobre um ponto da tela, ou null. */
  showHold(screenPoint, progress) {
    const visible = !!screenPoint;
    this.holdBg.setVisible(visible);
    this.holdFill.setVisible(visible);
    if (!visible) return;
    const x = Math.round(screenPoint.x);
    const y = Math.round(screenPoint.y);
    this.holdBg.setPosition(x, y);
    this.holdFill.setPosition(x - 31, y);
    this.holdFill.width = 62 * progress;
  }
}
