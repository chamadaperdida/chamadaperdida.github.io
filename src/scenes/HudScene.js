// Interface da casa (GDD 11): rosto do Artur, barra de medo (vermelha), estamina (azul),
// bateria (amarela), aviso de interação [F], progresso de segurar F, caixa de diálogo,
// lista da rotina e aviso rápido de progresso das tarefas (GDD 4.11).

import Phaser from 'phaser';
import { DialogueBox } from '../ui/DialogueBox.js';
import { BALANCE } from '../config/balance.js';

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
    this.buildList();

    // Legenda do próximo passo (o que fazer com o que está nas mãos): pequena, no canto
    // inferior direito; fica até soltar ou concluir a ação
    this.hintText = this.add
      .text(this.scale.width - 16, this.scale.height - 14, '', {
        fontFamily: FONT,
        fontSize: '18px',
        color: '#cfc9b6',
        backgroundColor: '#00000088',
        padding: { x: 6, y: 1 },
      })
      .setOrigin(1, 1)
      .setDepth(900)
      .setVisible(false);

    // Escurecer a tela (sequência de sono)
    const { width, height } = this.scale;
    this.fade = this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0).setAlpha(0).setDepth(3000);

    // Granulado e vinheta leves em toda a tela (GDD 13.1); diminuem com os ursos
    if (!this.textures.exists('ambient-vignette')) {
      const tex = this.textures.createCanvas('ambient-vignette', width, height);
      const ctx = tex.getContext();
      const g = ctx.createRadialGradient(width / 2, height / 2, height * 0.35, width / 2, height / 2, width * 0.7);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.85)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);
      tex.refresh();
    }
    this.ambientVignette = this.add.image(0, 0, 'ambient-vignette').setOrigin(0).setDepth(-30);
    this.grainW = Math.ceil(width / 3);
    this.grainH = Math.ceil(height / 3);
    if (!this.textures.exists('grain')) this.textures.createCanvas('grain', this.grainW, this.grainH);
    this.grainTex = this.textures.get('grain');
    this.grain = this.add.image(0, 0, 'grain').setOrigin(0).setScale(3).setDepth(-25);
    this.grainIn = 0;
    this.calm = 0;

    // Medo subindo / perseguição (GDD 5 e 7): bordas da tela escurecem e pulsam com o coração
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
    this.dread = 0;
    this.dreadTarget = 0;
    this.pulse = 0;
  }

  // ---- Lista da rotina (GDD 4.11) -----------------------------------------

  buildList() {
    this.listOpen = false;
    this.list = this.add.container(0, 0).setDepth(1100).setVisible(false);
    this.listResolve = null;
    const close = () => {
      // Ignora a mesma tecla que abriu a lista
      if (!this.listOpen || this.game.loop.frame <= this.listOpenedFrame) return;
      this.listOpen = false;
      this.listClosedFrame = this.game.loop.frame;
      this.list.setVisible(false);
      this.listResolve?.();
      this.listResolve = null;
    };
    this.input.keyboard.on('keydown-SPACE', close);
    this.input.keyboard.on('keydown-F', close);
  }

  /** Legenda do próximo passo ('' esconde). Não aparece com a lista aberta. */
  setHint(text) {
    if (this.hintText.text !== text) this.hintText.setText(text);
    this.hintText.setVisible(!!text && !this.talking);
  }

  /** Fecha a lista sem avisar ninguém (cena reiniciada, morte). */
  hideList() {
    this.listOpen = false;
    this.listResolve = null;
    this.list?.setVisible(false);
  }

  /** Mostra a folha da geladeira. lines: [{ text, done }]. Fecha com Espaço ou F. */
  showList(title, lines) {
    this.list.removeAll(true);
    const { width, height } = this.scale;
    const w = 620;
    const h = 96 + lines.reduce((sum, l) => sum + (l.status ? 58 : 34), 0);
    const x = (width - w) / 2;
    const y = (height - h) / 2;
    const paper = this.add.graphics();
    paper.fillStyle(0xd8d4c4, 1).fillRect(x, y, w, h);
    paper.lineStyle(2, 0x8a8678, 1).strokeRect(x, y, w, h);
    paper.fillStyle(0xc84a5a, 1).fillRect(x + w / 2 - 10, y - 8, 20, 14); // ímã
    this.list.add(paper);
    this.list.add(
      this.add.text(x + 26, y + 18, title, { fontFamily: FONT, fontSize: '32px', color: '#2a2a30' }),
    );
    let ty = y + 66;
    lines.forEach((line) => {
      const t = this.add.text(x + 40, ty, `- ${line.text}`, {
        fontFamily: FONT,
        fontSize: '28px',
        color: line.done ? '#8a8678' : '#2a2a30',
      });
      this.list.add(t);
      if (line.done) {
        const strike = this.add.graphics();
        strike.lineStyle(2, 0x3a3a40, 1).lineBetween(x + 34, ty + 16, x + 46 + t.width, ty + 14);
        this.list.add(strike);
      }
      if (line.status) {
        // Progresso e próximo passo, menor, embaixo do nome
        this.list.add(
          this.add.text(x + 62, ty + 27, line.status, { fontFamily: FONT, fontSize: '22px', color: '#6a5a4a' }),
        );
      }
      ty += line.status ? 58 : 34;
    });
    this.list.add(
      this.add
        .text(x + w - 12, y + h - 8, '[Espaço]', { fontFamily: FONT, fontSize: '20px', color: '#6a665a' })
        .setOrigin(1, 1),
    );
    this.list.setVisible(true);
    this.hintText.setVisible(false);
    this.listOpen = true;
    this.listOpenedFrame = this.game.loop.frame;
    return new Promise((resolve) => {
      this.listResolve = resolve;
    });
  }

  /**
   * Uma batida do coração (Heart.js). dread 0–1: quanto as bordas escurecem (medo subindo,
   * perseguição). rising: o medo está subindo → a barra de medo pisca junto.
   */
  heartPulse(dread, rising) {
    this.dreadTarget = dread;
    this.pulse = 1;
    if (rising) this.barFlash = 1;
  }

  /** Sem pulso (cena reiniciada, morte). */
  resetDread() {
    this.dread = 0;
    this.dreadTarget = 0;
    this.pulse = 0;
    this.vignette?.setAlpha(0);
  }

  /** Ursos coletados (0 a 1): a tela fica mais limpa (menos granulado e vinheta). */
  setCalm(fraction) {
    this.calm = fraction;
  }

  updateDread(dt) {
    this.dread += (this.dreadTarget - this.dread) * (1 - Math.exp(-dt * 4));
    this.pulse = Math.max(0, this.pulse - dt * 3.2);
    this.vignette.setAlpha(Math.min(1, this.dread * (0.35 + 0.65 * this.pulse)));
    // Barra de medo pisca mais clara a cada batida enquanto o medo sobe
    this.barFlash = Math.max(0, (this.barFlash ?? 0) - dt * 3);
    this.fearFill.fillColor = this.barFlash > 0.3 ? 0xe0383f : 0xb3161d;
  }

  updateGrain(dt) {
    const k = 1 - (1 - BALANCE.bears.calmScreenFactor) * this.calm;
    this.ambientVignette.setAlpha(0.55 * k);
    this.grain.setAlpha(0.025 * k);
    this.grainIn -= dt;
    if (this.grainIn > 0) return;
    this.grainIn = 0.25;
    const ctx = this.grainTex.getContext();
    const img = ctx.createImageData(this.grainW, this.grainH);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() < 0.5 ? 170 : 40; // tons médios, sem preto e branco puros
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = Math.random() < 0.2 ? 255 : 0;
    }
    ctx.putImageData(img, 0, 0);
    this.grainTex.refresh();
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
    this.updateDread(dt);
    this.updateGrain(dt);
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

  /** Caixa de diálogo ou lista abertas: Artur fica parado. */
  get talking() {
    return (this.dialogue?.isOpen ?? false) || !!this.listOpen;
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
