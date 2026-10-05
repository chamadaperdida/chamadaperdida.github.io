// Delegacia (GDD 3, 11.1, 12 e 13.3): câmera frontal, Artur não anda. O jogador clica nos
// objetos. O telefone toca; clicar atende e a ligação aparece na caixa de diálogo.
// Quando todas as ligações do dia terminam, a porta leva para casa.
//
// Ligações-alucinação (GDD 3.5): a sala escurece e a lâmpada pisca, o relógio trava em
// 23:41/23:44/23:47, a tela ganha vinheta e granulado, e a voz de quem liga sai
// "distorcida" na caixa de diálogo (texto tremendo, letras falhando).
//
// Passando o mouse num objeto clicável, ele ganha um contorno claro.

import Phaser from 'phaser';
import { DialogueBox } from '../ui/DialogueBox.js';
import { CALLS, NOTES } from '../data/calls.js';
import { sfx } from '../audio/Sfx.js';
import { debug } from '../debug/debug.js';
import { daysLeftText } from './TransitionScene.js';
import { openPause } from './PauseScene.js';
import { save } from '../systems/Save.js';

const FONT = 'VT323, monospace';
const S = 3; // a arte é 320×180, ampliada 3×

// Onde fica cada peça (coordenadas da arte, 320×180)
const AT = {
  tube: [118, 3],
  window: { x: 15, y: 25, w: 56, h: 52 }, // vidro (onde chove)
  windowFrame: { x: 10, y: 22, w: 66, h: 62 },
  clock: [160, 27],
  calendar: { x: 84, y: 30, w: 28, h: 36 },
  board: { x: 198, y: 26, w: 66, h: 46 },
  door: { x: 270, y: 18, w: 44, h: 112 },
  desk: [30, 86], // canto de cima do quadro da mesa (luminária incluída); tampo em y 118
  body: [129, 78], // Artur centrado na mesa; o tronco some atrás do tampo
  arms: [126, 117],
  phone: [172, 110],
  note: [58, 92],
  socket: [258, 104],
  plant: { x: 226, y: 92, w: 20, h: 32 },
  mug: [106, 114],
  lampGlow: [56, 96],
};

// Calendário (GDD 3.2): grade de 7 colunas; o aniversário (dia 7 do jogo) é o dia 27 (a casa
// circulada no desenho do calendário da parede)
const BIRTHDAY_DATE = 27;
const dateOfDay = (day) => BIRTHDAY_DATE - (7 - day);

// Relógio do turno: começa às 22:58 e anda 1 min a cada 4 s, mas nunca dispara: para
// enquanto o telefone toca, cada ligação dura no máximo 6 min e, acabado o turno, ele para
// 2 min depois (o jogador pode demorar à vontade sem o turno virar madrugada)
const SHIFT_START = 22 * 60 + 58;
const SECONDS_PER_MINUTE = 4;
const MINUTES_PER_CALL = 6;
const MINUTES_AFTER_SHIFT = 2;

const FIRST_RING = 3; // s depois de entrar
const BETWEEN_CALLS = [5, 9]; // s
// Alucinação: a sala fica mais escura (e mais ainda quando a lâmpada falha)
const HALLUCINATION_DARK = 0.32;
const FLICKER_DARK = 0.62;

// Contorno de destaque de cada objeto: quadro e canto (1 px antes do objeto)
const HIGHLIGHTS = {
  phone: ['hl-phone', 171, 109],
  calendar: ['hl-calendar', 83, 27],
  door: ['hl-door', 269, 17],
  note: ['hl-note', 57, 91],
  clock: ['hl-clock', 147, 14],
  plant: ['hl-plant', 227, 92],
  window: ['hl-window', 9, 21],
  mug: ['hl-mug', 105, 113],
};
const MOUTH_EVERY = 0.09; // s entre abrir e fechar a boca falando

const say = (text) => [{ speaker: 'Artur', text }];

export class DelegaciaScene extends Phaser.Scene {
  constructor() {
    super('Delegacia');
  }

  create({ day = 1 } = {}) {
    this.day = day;
    this.calls = CALLS[day] ?? [];
    this.callIndex = 0;
    this.state = 'waiting'; // waiting → ringing → talking → (waiting…) → done
    this.timer = FIRST_RING;
    this.minutes = SHIFT_START;
    this.frozenTime = null;
    this.hallucination = false;
    this.leaving = false;
    this.clockLimit = Infinity; // o relógio não passa daqui (minutos)
    this.mouthIn = 0;
    this.mouthOpen = false;

    this.scene.setVisible(false, 'Hud');
    this.cameras.main.setBackgroundColor('#000000');
    const img = (x, y, frame) => this.add.image(x * S, y * S, 'delegacia', frame).setOrigin(0).setScale(S);

    // Fundo, lâmpada, chuva, relógio, calendário
    img(0, 0, 'bg');
    this.tube = img(...AT.tube, 'tube-on');
    this.rain = this.add.graphics();
    this.drops = Array.from({ length: 26 }, () => this.#newDrop(true));
    this.clockHands = this.add.graphics();
    this.calendarMarks = this.add.graphics();
    this.#drawCalendarMarks();
    this.add
      .text((AT.door.x + 22) * S, 34 * S, 'SAÍDA', { fontFamily: FONT, fontSize: '30px', color: '#2a3036' })
      .setOrigin(0.5);

    // Artur atrás da mesa; braços e objetos por cima do tampo. O cabo ligado passa por trás
    // da mesa (some atrás do tampo e da planta); solto, fica jogado em cima da mesa.
    this.body = img(...AT.body, 'artur-body-idle');
    this.cableBack = this.add.graphics();
    img(...AT.desk, 'desk');
    this.#buildLampGlow();
    this.arms = img(...AT.arms, 'artur-arms-idle');
    this.phone = img(...AT.phone, 'phone');
    this.note = NOTES[day] ? img(...AT.note, 'note') : null;
    this.#drawCable();

    // Lâmpada piscando (escurece a sala) e efeitos das alucinações
    this.dark = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000).setOrigin(0).setAlpha(0);
    this.#buildHallucinationOverlay();

    // Legenda do objeto sob o mouse (canto inferior direito)
    this.hoverText = this.add
      .text(this.scale.width - 16, this.scale.height - 14, '', {
        fontFamily: FONT,
        fontSize: '18px',
        color: '#cfc9b6',
        backgroundColor: '#00000088',
        padding: { x: 6, y: 1 },
      })
      .setOrigin(1, 1)
      .setDepth(900);

    this.dialogue = new DialogueBox(this);
    this.#buildCalendarPopup();
    this.#buildHotspots();

    this.input.on('pointerdown', (pointer, over) => {
      // Clique também avança o diálogo e fecha o calendário (GDD 12)
      if (this.calendarOpen) {
        this.#closeCalendar();
        return;
      }
      if (this.dialogue.isOpen) {
        this.dialogue.advance();
        return;
      }
      over[0]?.emit('use');
    });
    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.calendarOpen) this.#closeCalendar();
    });
    this.input.keyboard.on('keydown-ESC', () => openPause(this));

    this.#setupDebugKeys();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.ring?.stop();
      this.static?.stop();
      debug.clearGroup('Delegacia');
    });
    for (const g of ['Casa', 'Noite', 'Gerador', 'Monstros']) debug.clearGroup(g);
    debug.remove('Geral/Mais atalhos');
    debug.remove('Geral/Atalhos novos');
  }

  // ---- Objetos clicáveis -------------------------------------------------------

  #buildHotspots() {
    const zone = (x, y, w, h, label, key, use) => {
      const [frame, hx, hy] = HIGHLIGHTS[key];
      const outline = this.add
        .image(hx * S, hy * S, 'delegacia', frame)
        .setOrigin(0)
        .setScale(S)
        .setDepth(700)
        .setVisible(false);
      const z = this.add.zone(x * S, y * S, w * S, h * S).setOrigin(0).setInteractive({ useHandCursor: true });
      z.name = key;
      z.on('pointerover', () => {
        this.hoverText.setText(label);
        outline.setVisible(true);
      });
      z.on('pointerout', () => {
        this.hoverText.setText('');
        outline.setVisible(false);
      });
      z.on('use', use);
      return z;
    };
    const w = AT.windowFrame;
    zone(w.x, w.y, w.w, w.h, 'Janela', 'window', () => this.#lookAt('Não para de chover.'));
    zone(AT.phone[0] - 2, AT.phone[1] - 4, 30, 20, 'Telefone', 'phone', () => this.#answer());
    zone(AT.calendar.x, AT.calendar.y - 2, AT.calendar.w, AT.calendar.h + 2, 'Calendário', 'calendar', () => this.#openCalendar());
    zone(AT.door.x, AT.door.y, AT.door.w, AT.door.h, 'Porta', 'door', () => this.#door());
    if (this.note) zone(AT.note[0] - 2, AT.note[1] - 2, 14, 14, 'Bilhete do Marcos', 'note', () => this.#readNote());
    zone(AT.clock[0] - 12, AT.clock[1] - 12, 25, 25, 'Relógio', 'clock', () => this.#lookAt(`Já são ${this.clockText}.`));
    zone(AT.plant.x, AT.plant.y, AT.plant.w, AT.plant.h, 'Planta', 'plant', () => this.#lookAt('Uma planta muito bonita.'));
    zone(AT.mug[0] - 2, AT.mug[1] - 2, 12, 12, 'Café', 'mug', () => this.#lookAt('O café está frio.'));
  }

  /** Artur comenta o que está olhando (não durante uma ligação). */
  #lookAt(text) {
    if (this.state === 'talking') return;
    this.dialogue.show(say(text));
  }

  #readNote() {
    if (this.state === 'talking') return;
    sfx.textBlip({ kind: 'paper' }, false, 0.2);
    this.dialogue.show([{ speaker: 'Bilhete do Marcos', text: NOTES[this.day] }]);
  }

  #door() {
    if (this.state === 'talking' || this.leaving) return;
    if (this.state !== 'done') {
      this.dialogue.show(say('Ainda não terminou o turno.'));
      return;
    }
    this.leaving = true;
    save.delegaciaDone(this.day); // se morrer nessa noite, o Continuar volta direto para a casa
    sfx.lockClick(0.4);
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () =>
      this.scene.start('Transition', { screens: ['Casa'], next: { scene: 'House', data: { day: this.day } } }),
    );
  }

  // ---- Ligações -----------------------------------------------------------------

  /** O telefone toca até alguém atender; enquanto isso, o relógio fica parado. */
  #ringNow() {
    this.state = 'ringing';
    this.clockLimit = this.minutes;
    this.ring = sfx.phoneRing(0.5);
    this.ringShake = this.tweens.add({
      targets: this.phone,
      x: { from: this.phone.x - 2, to: this.phone.x + 2 },
      duration: 50,
      yoyo: true,
      repeat: -1,
    });
  }

  /** Para o toque e o tremor do aparelho. */
  #stopRinging() {
    this.ring?.stop();
    this.ring = null;
    this.ringShake?.stop();
    this.phone.x = AT.phone[0] * S;
  }

  #answer() {
    if (this.state !== 'ringing') return;
    this.#stopRinging();
    sfx.lockClick(0.5);
    this.state = 'talking';
    this.clockLimit = this.minutes + MINUTES_PER_CALL; // a ligação dura no máximo isso
    this.body.setFrame('artur-body-phone');
    this.arms.setFrame('artur-arms-phone');
    this.phone.setFrame('phone-empty');
    const call = this.calls[this.callIndex];
    const isHallucination = call.kind === 'hallucination';
    if (isHallucination) this.#startHallucination(call.time);
    // Na alucinação, a voz de quem liga sai distorcida (Artur fala normal)
    const lines = call.lines.map((l) => (isHallucination && !l.fx && l.speaker !== 'Artur' ? { ...l, glitch: true } : l));
    this.dialogue.show(lines).then(() => this.#hangUp());
  }

  #hangUp() {
    sfx.lockClick(0.35);
    this.#stopHallucination();
    this.body.setFrame('artur-body-idle');
    this.arms.setFrame('artur-arms-idle');
    this.phone.setFrame('phone');
    this.#nextCall();
  }

  /** Próxima ligação do dia (ou fim do turno). */
  #nextCall() {
    this.callIndex += 1;
    this.minutes = this.clockLimit; // cada ligação gasta os mesmos minutos
    this.clockLimit = Infinity;
    if (this.callIndex >= this.calls.length) {
      this.state = 'done';
      this.clockLimit = this.minutes + MINUTES_AFTER_SHIFT;
      // Aviso de fim do turno
      this.time.delayedCall(700, () => this.dialogue.show(say('Acabou o turno. Hora de ir pra casa.')));
      // A porta "acorda": um brilho fraco no vidro fosco
      this.doorGlow = this.add
        .rectangle((AT.door.x + 6) * S, (AT.door.y + 8) * S, 32 * S, 70 * S, 0xd8e0e8, 0)
        .setOrigin(0)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: this.doorGlow, alpha: 0.08, duration: 1200, yoyo: true, repeat: -1 });
      return;
    }
    this.state = 'waiting';
    this.timer = Phaser.Math.FloatBetween(...BETWEEN_CALLS);
  }

  // ---- Efeitos das ligações-alucinação (GDD 3.5) ------------------------------------

  #buildHallucinationOverlay() {
    const { width, height } = this.scale;
    if (!this.textures.exists('delegacia-vignette')) {
      const tex = this.textures.createCanvas('delegacia-vignette', width, height);
      const ctx = tex.getContext();
      const g = ctx.createRadialGradient(width / 2, height / 2, height * 0.3, width / 2, height / 2, width * 0.66);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.92)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);
      tex.refresh();
    }
    this.vignette = this.add.image(0, 0, 'delegacia-vignette').setOrigin(0).setAlpha(0).setDepth(800);
    this.grainW = Math.ceil(width / 3);
    this.grainH = Math.ceil(height / 3);
    if (!this.textures.exists('delegacia-grain')) this.textures.createCanvas('delegacia-grain', this.grainW, this.grainH);
    this.grainTex = this.textures.get('delegacia-grain');
    this.grain = this.add.image(0, 0, 'delegacia-grain').setOrigin(0).setScale(3).setAlpha(0).setDepth(801);
    this.grainIn = 0;
  }

  #startHallucination(time) {
    this.hallucination = true;
    this.frozenTime = time;
    this.flickerIn = 0;
    this.static = sfx.staticLoop(0.06);
    this.tweens.add({ targets: this.dark, alpha: HALLUCINATION_DARK, duration: 600 });
    this.tweens.add({ targets: this.vignette, alpha: 1, duration: 500 });
    this.tweens.add({ targets: this.grain, alpha: 0.05, duration: 500 });
  }

  #stopHallucination() {
    if (!this.hallucination) return;
    this.hallucination = false;
    this.frozenTime = null;
    this.static?.stop();
    this.static = null;
    this.tube.setFrame('tube-on');
    this.tweens.killTweensOf(this.dark);
    this.tweens.add({ targets: [this.vignette, this.grain, this.dark], alpha: 0, duration: 500 });
  }

  /** Lâmpada piscando: fica acesa e apaga em piscadas curtas e irregulares. */
  #updateFlicker(dt) {
    this.flickerIn -= dt;
    if (this.flickerIn > 0) return;
    const off = this.tube.frame.name === 'tube-on' && Math.random() < 0.6;
    this.tube.setFrame(off ? 'tube-off' : 'tube-on');
    if (this.tweens.isTweening(this.dark)) return; // ainda escurecendo
    this.dark.setAlpha(off ? FLICKER_DARK : HALLUCINATION_DARK);
    this.flickerIn = off ? 0.04 + Math.random() * 0.12 : 0.15 + Math.random() * 0.9;
  }

  #updateGrain(dt) {
    this.grainIn -= dt;
    if (this.grainIn > 0) return;
    this.grainIn = 0.25;
    const ctx = this.grainTex.getContext();
    const data = ctx.createImageData(this.grainW, this.grainH);
    for (let i = 0; i < data.data.length; i += 4) {
      const v = Math.random() < 0.5 ? 170 : 40;
      data.data[i] = v;
      data.data[i + 1] = v;
      data.data[i + 2] = v;
      data.data[i + 3] = Math.random() < 0.2 ? 255 : 0;
    }
    ctx.putImageData(data, 0, 0);
    this.grainTex.refresh();
  }

  // ---- Cabo do telefone ---------------------------------------------------------

  /** Cabo do telefone: sai de trás do telefone, por trás da mesa, e sobe até a tomada. */
  #drawCable() {
    const g = this.cableBack.clear();
    const from = [AT.phone[0] + 24, AT.phone[1] + 8];
    const to = [AT.socket[0], AT.socket[1] + 1];
    g.fillStyle(0x141418, 1);
    for (let t = 0; t <= 1.0001; t += 0.02) {
      const x = from[0] + (to[0] - from[0]) * t;
      const y = from[1] + (to[1] - from[1]) * t + Math.sin(Math.PI * t) * 6;
      g.fillRect(Math.round(x) * S, Math.round(y) * S, S, S);
    }
  }

  /** Luz quente e suave da luminária (gradiente, sem borda). */
  #buildLampGlow() {
    if (!this.textures.exists('lamp-glow')) {
      const size = 160;
      const tex = this.textures.createCanvas('lamp-glow', size, size);
      const ctx = tex.getContext();
      const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      g.addColorStop(0, 'rgba(240,216,144,0.22)');
      g.addColorStop(1, 'rgba(240,216,144,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
      tex.refresh();
    }
    this.add
      .image(AT.lampGlow[0] * S, (AT.lampGlow[1] + 14) * S, 'lamp-glow')
      .setScale(1.8)
      .setBlendMode(Phaser.BlendModes.ADD);
  }

  // ---- Relógio e calendário ------------------------------------------------------

  #drawClock() {
    let h;
    let m;
    if (this.frozenTime) [h, m] = this.frozenTime.split(':').map(Number);
    else {
      const total = Math.floor(this.minutes) % (24 * 60);
      h = Math.floor(total / 60);
      m = total % 60;
    }
    const [cx, cy] = AT.clock;
    const g = this.clockHands.clear();
    const hand = (angle, len, color) => {
      g.fillStyle(color, 1);
      for (let r = 0; r <= len; r += 0.5) {
        const x = Math.round(cx + Math.sin(angle) * r);
        const y = Math.round(cy - Math.cos(angle) * r);
        g.fillRect(x * S, y * S, S, S);
      }
    };
    hand(((h % 12) + m / 60) * (Math.PI / 6), 5, 0x1e1e22);
    hand(m * (Math.PI / 30), 8, 0x3a3a40);
    this.clockText = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  /** Todos os dias do mês que já passaram riscados no calendário da parede. */
  #drawCalendarMarks() {
    const g = this.calendarMarks.clear();
    const { x, y } = AT.calendar;
    g.fillStyle(0x6a1a1a, 1);
    for (let date = 1; date < dateOfDay(this.day); date++) {
      const cell = date - 1;
      const col = cell % 7;
      const row = Math.floor(cell / 7);
      const cxp = x + 2 + col * 3 + Math.floor(col / 2);
      const cyp = y + 10 + row * 5;
      g.fillRect(cxp * S, cyp * S, S, S);
      g.fillRect((cxp + 1) * S, (cyp + 1) * S, S, S);
    }
  }

  #buildCalendarPopup() {
    const { width, height } = this.scale;
    const c = this.add.container(0, 0).setDepth(1100).setVisible(false);
    const w = 460;
    const h = 380;
    const x = (width - w) / 2;
    const y = (height - h) / 2 - 20;
    const g = this.add.graphics();
    g.fillStyle(0xd8d4c4, 1).fillRect(x, y, w, h);
    g.fillStyle(0x8a2424, 1).fillRect(x, y, w, 56);
    g.lineStyle(2, 0x8a8678, 1).strokeRect(x, y, w, h);
    c.add(g);
    c.add(this.add.text(x + w / 2, y + 28, 'CALENDÁRIO', { fontFamily: FONT, fontSize: '34px', color: '#e8d8d8' }).setOrigin(0.5));
    const names = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    const cw = (w - 40) / 7;
    names.forEach((n, i) =>
      c.add(this.add.text(x + 20 + cw * i + cw / 2, y + 74, n, { fontFamily: FONT, fontSize: '24px', color: '#6a665a' }).setOrigin(0.5)),
    );
    const marks = this.add.graphics();
    c.add(marks);
    const today = dateOfDay(this.day);
    for (let date = 1; date <= 31; date++) {
      const cell = date - 1;
      const cx = x + 20 + cw * (cell % 7) + cw / 2;
      const cy = y + 112 + Math.floor(cell / 7) * 48;
      c.add(
        this.add
          .text(cx, cy, String(date), { fontFamily: FONT, fontSize: '28px', color: date === today ? '#1a1a1e' : '#4a4a46' })
          .setOrigin(0.5),
      );
      if (date < today) {
        marks.lineStyle(3, 0x6a1a1a, 0.9);
        marks.lineBetween(cx - 14, cy - 14, cx + 14, cy + 14);
        marks.lineBetween(cx + 14, cy - 14, cx - 14, cy + 14);
      }
      if (date === BIRTHDAY_DATE) {
        marks.lineStyle(3, 0xb3161d, 1).strokeEllipse(cx, cy, 46, 38);
        c.add(
          this.add
            .text(cx, cy + 34, 'Aniversário da Clara', { fontFamily: FONT, fontSize: '20px', color: '#b3161d' })
            .setOrigin(0.5, 0),
        );
      }
    }
    c.add(
      this.add.text(x + w - 12, y + h - 8, '[clique]', { fontFamily: FONT, fontSize: '18px', color: '#6a665a' }).setOrigin(1, 1),
    );
    this.calendarPopup = c;
    this.calendarOpen = false;
  }

  #openCalendar() {
    if (this.state === 'talking') return;
    this.calendarPopup.setVisible(true);
    this.calendarOpen = true;
  }

  #closeCalendar() {
    this.calendarPopup.setVisible(false);
    this.calendarOpen = false;
  }

  // ---- Chuva na janela -------------------------------------------------------------

  #newDrop(anywhere = false) {
    const { x, y, w, h } = AT.window;
    return {
      x: x + Math.random() * w,
      y: anywhere ? y + Math.random() * h : y - Math.random() * 10,
      len: 2 + Math.floor(Math.random() * 3),
      speed: 50 + Math.random() * 40,
    };
  }

  #updateRain(dt) {
    const { x, y, w, h } = AT.window;
    const g = this.rain.clear();
    g.fillStyle(0x5a6878, 0.55);
    for (const d of this.drops) {
      d.y += d.speed * dt;
      if (d.y > y + h) Object.assign(d, this.#newDrop());
      const top = Math.max(y, Math.round(d.y));
      const bottom = Math.min(y + h, Math.round(d.y) + d.len);
      if (bottom > top) g.fillRect(Math.round(d.x) * S, top * S, S, (bottom - top) * S);
    }
    // a divisória da janela fica por cima (não chove "dentro" do metal)
    g.fillStyle(0x3a3d42, 1);
    g.fillRect((x + 27) * S, y * S, 2 * S, h * S);
    g.fillRect(x * S, (y + 25) * S, w * S, 2 * S);
  }

  // ---- Quadro a quadro --------------------------------------------------------------

  update(time, delta) {
    const dt = Math.min(delta / 1000, 0.1);
    this.dialogue.update(dt);
    this.#updateRain(dt);
    if (!this.frozenTime) this.minutes = Math.min(this.minutes + dt / SECONDS_PER_MINUTE, this.clockLimit);
    this.#drawClock();
    if (this.hallucination) {
      this.#updateFlicker(dt);
      this.#updateGrain(dt);
    }
    if (this.state === 'waiting' && this.calls.length) {
      this.timer -= dt;
      if (this.timer <= 0) this.#ringNow();
    } else if (this.state === 'waiting' && !this.calls.length) {
      this.state = 'done';
      this.clockLimit = this.minutes + MINUTES_AFTER_SHIFT;
    }
    this.#updateMouth(dt);
    this.#updateDebug();
  }

  /** Artur mexe a boca enquanto a fala dele numa ligação é digitada. */
  #updateMouth(dt) {
    const talking = this.state === 'talking' && this.dialogue.isTyping && this.dialogue.speaker === 'Artur';
    if (talking) {
      this.mouthIn -= dt;
      if (this.mouthIn <= 0) {
        this.mouthIn = MOUTH_EVERY * (0.7 + Math.random() * 0.6);
        this.mouthOpen = !this.mouthOpen;
      }
    } else {
      this.mouthOpen = false;
    }
    const pose = this.state === 'talking' ? 'artur-body-phone' : 'artur-body-idle';
    const frame = this.mouthOpen ? `${pose}-talk` : pose;
    if (this.body.frame.name !== frame) this.body.setFrame(frame);
  }

  #updateDebug() {
    debug.set('Geral/FPS', Math.round(this.game.loop.actualFps));
    debug.set('Geral/Atalhos', '1–7 delegacia do dia · R reinicia · N pula as ligações · C vai para a casa');
    debug.set('Delegacia/Dia', `${this.day}`);
    debug.set(
      'Delegacia/Ligação',
      `${Math.min(this.callIndex + 1, this.calls.length)}/${this.calls.length} · ${this.state}${
        this.state === 'waiting' ? ` (toca em ${this.timer.toFixed(1)} s)` : ''
      }`,
    );
    debug.set(
      'Delegacia/Relógio',
      `${this.clockText}${this.frozenTime ? ' (travado)' : this.minutes >= this.clockLimit ? ' (parado)' : ''}`,
    );
  }

  #setupDebugKeys() {
    this.input.keyboard.on('keydown', (event) => {
      if (!debug.enabled) return;
      const k = event.key.toLowerCase();
      const n = Number(event.key);
      if (n >= 1 && n <= 7) this.scene.restart({ day: n });
      else if (k === 'r') this.scene.restart({ day: this.day });
      else if (k === 'c') this.scene.start('House', { day: this.day });
      else if (k === 'n' && this.state !== 'talking') {
        this.#stopRinging();
        this.callIndex = this.calls.length - 1;
        this.state = 'talking';
        this.#hangUp();
      }
    });
  }
}

/** Telas que levam à delegacia de um dia (GDD 2.3). */
export function toDelegacia(day) {
  return { screens: [daysLeftText(day), 'Delegacia'], next: { scene: 'Delegacia', data: { day } } };
}
