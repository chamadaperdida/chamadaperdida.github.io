// Menus da tela inicial e da pausa (GDD 2.1 e 2.4): lista vertical de opções em texto.
// Mouse: passar por cima destaca, clicar escolhe. Teclado: ↑/↓ (ou W/S) mudam o destaque,
// Enter/Espaço escolhem, ←/→ (ou A/D) mexem nos volumes, Esc volta (onBack).
//
//   new Menu(scene, { x, y, items: [{ label: 'Novo jogo', select: () => … }], onBack })
//
// Item: { label: string | () => string, select?, enabled?: () => boolean,
//         slider?: { get: () => 0..1, set: (v) => void } }

import Phaser from 'phaser';
import { sfx } from '../audio/Sfx.js';
import { options } from '../systems/Save.js';

const FONT = 'VT323, monospace';
export const MENU_COLORS = { idle: '#8a8478', focus: '#ece4d0', disabled: '#3c3a34' };
const SLIDER_STEPS = 10;
const CELL = 14; // px de cada degrau da barra de volume
const CELL_GAP = 4;

export class Menu {
  constructor(scene, { x, y, items, spacing = 50, fontSize = 38, depth = 0, focus = 0, onBack = null }) {
    this.scene = scene;
    this.items = items;
    this.onBack = onBack;
    this.active = true;
    this.objects = [];
    this.rows = items.map((item, i) => this.#buildRow(item, x, y + i * spacing, fontSize, depth));
    this.focus = -1;
    this.#setFocus(this.#enabled(focus) ? focus : this.#nextEnabled(focus, 1));
    this.onKey = (event) => this.#key(event);
    scene.input.keyboard.on('keydown', this.onKey);
    this.refresh();
  }

  #enabled(i) {
    const item = this.items[i];
    return !!item && (item.enabled ? item.enabled() : true);
  }

  #nextEnabled(from, dir) {
    const n = this.items.length;
    for (let k = 1; k <= n; k++) {
      const i = (((from + dir * k) % n) + n) % n;
      if (this.#enabled(i)) return i;
    }
    return -1;
  }

  #label(item) {
    return typeof item.label === 'function' ? item.label() : item.label;
  }

  #buildRow(item, x, y, fontSize, depth) {
    const style = { fontFamily: FONT, fontSize: `${fontSize}px`, color: MENU_COLORS.idle };
    const row = { item };
    const index = this.items.indexOf(item);
    if (!item.slider) {
      row.text = this.scene.add.text(x, y, '', style).setOrigin(0.5).setDepth(depth);
      row.text.setInteractive({ useHandCursor: true });
      row.text.on('pointerover', () => this.active && this.#enabled(index) && this.#setFocus(index));
      row.text.on('pointerdown', () => this.active && this.#enabled(index) && this.#choose(index));
      this.objects.push(row.text);
      return row;
    }
    // Volume: "Rótulo   <  ▮▮▮▮▮▯▯▯▯▯  >"
    const barW = SLIDER_STEPS * (CELL + CELL_GAP) - CELL_GAP;
    row.text = this.scene.add.text(x - 30, y, '', style).setOrigin(1, 0.5).setDepth(depth);
    const left = this.scene.add.text(x, y, '<', style).setOrigin(0, 0.5).setDepth(depth);
    const barX = x + 30;
    row.bar = this.scene.add.graphics().setDepth(depth);
    row.barX = barX;
    row.barY = y;
    const right = this.scene.add.text(barX + barW + 12, y, '>', style).setOrigin(0, 0.5).setDepth(depth);
    const hit = this.scene.add
      .zone(barX - 4, y - CELL, barW + 8, CELL * 2)
      .setOrigin(0)
      .setDepth(depth)
      .setInteractive({ useHandCursor: true });
    row.arrows = [left, right];
    for (const o of [row.text, left, right, hit]) {
      o.setInteractive({ useHandCursor: true });
      o.on('pointerover', () => this.active && this.#setFocus(index));
    }
    left.on('pointerdown', () => this.active && this.#step(index, -1));
    right.on('pointerdown', () => this.active && this.#step(index, 1));
    hit.on('pointerdown', (pointer) => {
      if (!this.active) return;
      this.#setFocus(index);
      const k = Math.ceil((pointer.x - barX) / (CELL + CELL_GAP));
      this.#setSlider(index, Math.max(0, Math.min(SLIDER_STEPS, k)) / SLIDER_STEPS);
    });
    this.objects.push(row.text, left, right, row.bar, hit);
    return row;
  }

  #setFocus(i) {
    this.focus = i;
    this.refresh();
  }

  #choose(i) {
    const item = this.items[i];
    if (item.slider) return;
    sfx.lockClick(0.25);
    item.select?.();
  }

  #step(i, dir) {
    const { slider } = this.items[i];
    this.#setSlider(i, slider.get() + dir / SLIDER_STEPS);
  }

  #setSlider(i, v) {
    const { slider } = this.items[i];
    slider.set(Math.round(Math.max(0, Math.min(1, v)) * SLIDER_STEPS) / SLIDER_STEPS);
    sfx.textBlip({ kind: 'fx' }, false, 0.3);
    this.refresh();
  }

  #key(event) {
    if (!this.active) return;
    const k = event.key;
    if (k === 'ArrowUp' || k === 'w' || k === 'W') this.#setFocus(this.#nextEnabled(this.focus, -1));
    else if (k === 'ArrowDown' || k === 's' || k === 'S') this.#setFocus(this.#nextEnabled(this.focus, 1));
    else if (k === 'Enter' || k === ' ') this.focus >= 0 && this.#choose(this.focus);
    else if (k === 'ArrowLeft' || k === 'a' || k === 'A') this.items[this.focus]?.slider && this.#step(this.focus, -1);
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') this.items[this.focus]?.slider && this.#step(this.focus, 1);
    else if (k === 'Escape') this.onBack?.();
  }

  /** Redesenha textos (rótulos dinâmicos, destaque, itens desativados). */
  refresh() {
    this.rows.forEach((row, i) => {
      const enabled = this.#enabled(i);
      const color = !enabled ? MENU_COLORS.disabled : i === this.focus ? MENU_COLORS.focus : MENU_COLORS.idle;
      row.text.setText(this.#label(row.item)).setColor(color);
      if (!row.item.slider) {
        if (enabled) row.text.setInteractive({ useHandCursor: true });
        else row.text.disableInteractive();
        return;
      }
      row.arrows.forEach((a) => a.setColor(color));
      const filled = Math.round(row.item.slider.get() * SLIDER_STEPS);
      const g = row.bar.clear();
      for (let s = 0; s < SLIDER_STEPS; s++) {
        const on = s < filled;
        g.fillStyle(on ? Phaser.Display.Color.HexStringToColor(color).color : 0x2a2824, 1);
        g.fillRect(row.barX + s * (CELL + CELL_GAP), row.barY - CELL / 2, CELL, CELL);
      }
    });
  }

  setActive(active) {
    this.active = active;
  }

  setVisible(visible) {
    this.objects.forEach((o) => o.setVisible(visible));
  }

  destroy() {
    this.scene.input.keyboard.off('keydown', this.onKey);
    this.objects.forEach((o) => o.destroy());
    this.objects = [];
    this.active = false;
  }
}

/** Painel escuro centralizado, por cima de tudo (fundo para opções e confirmações). */
function panel(scene, w, h, depth) {
  const { width, height } = scene.scale;
  const shade = scene.add.rectangle(0, 0, width, height, 0x000000, 0.6).setOrigin(0).setDepth(depth).setInteractive();
  const box = scene.add
    .rectangle(width / 2, height / 2, w, h, 0x0e0d0c, 0.96)
    .setStrokeStyle(2, 0x3c3a34)
    .setDepth(depth);
  return [shade, box];
}

/**
 * Opções (GDD 2.1): volume geral, do ambiente e dos efeitos, tela cheia. Tudo é aplicado na
 * hora e fica salvo entre sessões.
 */
export class OptionsPanel {
  constructor(scene, { depth = 2000, onClose }) {
    this.scene = scene;
    this.onClose = onClose;
    const { width, height } = scene.scale;
    this.objects = panel(scene, 620, 400, depth);
    this.objects.push(
      scene.add
        .text(width / 2, height / 2 - 150, 'OPÇÕES', { fontFamily: FONT, fontSize: '44px', color: '#b3161d' })
        .setOrigin(0.5)
        .setDepth(depth),
    );
    this.values = options.load();
    const volume = (key) => ({
      get: () => this.values[key],
      set: (v) => {
        this.values[key] = v;
        sfx.setVolumes({ [key]: v });
        options.save(this.values);
      },
    });
    this.menu = new Menu(scene, {
      x: width / 2 + 10,
      y: height / 2 - 80,
      spacing: 52,
      fontSize: 34,
      depth: depth + 1,
      onBack: () => this.close(),
      items: [
        { label: 'Volume geral', slider: volume('master') },
        { label: 'Ambiente', slider: volume('ambient') },
        { label: 'Efeitos', slider: volume('effects') },
        {
          label: () => `Tela cheia: ${scene.scale.isFullscreen ? 'sim' : 'não'}`,
          select: () => (scene.scale.isFullscreen ? scene.scale.stopFullscreen() : scene.scale.startFullscreen()),
        },
        { label: 'Voltar', select: () => this.close() },
      ],
    });
    this.onScale = () => this.menu.refresh();
    scene.scale.on(Phaser.Scale.Events.ENTER_FULLSCREEN, this.onScale);
    scene.scale.on(Phaser.Scale.Events.LEAVE_FULLSCREEN, this.onScale);
  }

  close() {
    this.scene.scale.off(Phaser.Scale.Events.ENTER_FULLSCREEN, this.onScale);
    this.scene.scale.off(Phaser.Scale.Events.LEAVE_FULLSCREEN, this.onScale);
    this.menu.destroy();
    this.objects.forEach((o) => o.destroy());
    // Fecha no próximo quadro: a mesma tecla/clique não chega ao menu de baixo
    this.scene.time.delayedCall(0, () => this.onClose?.());
  }
}

/** Pergunta de sim/não (ex.: "Isso apaga seu progresso. Continuar?"). Foco começa no "Não". */
export class ConfirmBox {
  constructor(scene, { text, yes, no, depth = 2000 }) {
    this.scene = scene;
    const { width, height } = scene.scale;
    this.objects = panel(scene, 640, 260, depth);
    this.objects.push(
      scene.add
        .text(width / 2, height / 2 - 60, text, {
          fontFamily: FONT,
          fontSize: '32px',
          color: '#cfc9b6',
          align: 'center',
          wordWrap: { width: 580 },
        })
        .setOrigin(0.5)
        .setDepth(depth),
    );
    const done = (fn) => () => {
      this.menu.destroy();
      this.objects.forEach((o) => o.destroy());
      scene.time.delayedCall(0, () => fn?.());
    };
    this.menu = new Menu(scene, {
      x: width / 2,
      y: height / 2 + 30,
      spacing: 46,
      fontSize: 34,
      depth: depth + 1,
      focus: 1,
      onBack: done(no),
      items: [
        { label: 'Sim', select: done(yes) },
        { label: 'Não', select: done(no) },
      ],
    });
  }
}
