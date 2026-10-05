// Som do jogo (Web Audio). As gravações reais (public/assets/audio, geradas por
// `npm run audio` a partir de bancos CC0 — ver scripts/audio-manifest.mjs) são tocadas
// com tratamento na hora: velocidade/tom, eco, reverberação, filtros (telefone, abafado),
// som invertido. Sintetizado só o que é sintético de verdade: chiado/estática, bipe de
// aparelho, digitação da caixa de diálogo e o clique dos menus.
//
// Monstros, alucinações, telefone e ambiente da tela inicial ficam aqui; os sons da casa e
// da delegacia (tarefas, portas, passos...) em audio/Foley.js.
//
// O navegador só libera áudio depois de uma tecla ou clique: o contexto liga sozinho no
// primeiro toque do jogador; as gravações são baixadas no carregamento e decodificadas
// assim que o contexto existe.
//
// Volumes (opções, GDD 2.1): geral → { ambiente, efeitos }.
// Pausa (GDD 2.4): o contexto de áudio inteiro congela e volta de onde parou.

import { options } from '../systems/Save.js';

const MASTER_LEVEL = 0.8;
const AUDIO_DIR = 'assets/audio/';

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rnd = (a, b) => a + Math.random() * (b - a);
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
// Risadas da Clara e o volume de cada uma (iguala as gravações)
const LAUGHS = ['laugh-1', 'laugh-2', 'laugh-3', 'laugh-4', 'laugh-5', 'laugh-girl'];
const LAUGH_LEVEL = { 'laugh-2': 0.8, 'laugh-3': 1.1, 'laugh-4': 0.7, 'laugh-girl': 1.15 };

class Sfx {
  constructor() {
    this.ctx = null;
    this.paused = false;
    this.volumes = options.load();
    this.raw = new Map(); // nome → ArrayBuffer (antes de decodificar)
    this.buffers = new Map(); // nome → AudioBuffer
    this.manifest = {};
    this.cache = new Map(); // buffers derivados (invertidos, com silêncio no fim)
    const unlock = () => this.#ensure();
    window.addEventListener('keydown', unlock);
    window.addEventListener('pointerdown', unlock);
  }

  #ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
      this.effects = this.ctx.createGain();
      this.effects.connect(this.master);
      this.ambient = this.ctx.createGain();
      this.ambient.connect(this.master);
      this.#applyVolumes();
      // 2 s de ruído branco (chiado, estática, ruído de fundo)
      const len = this.ctx.sampleRate * 2;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      this.#buildReverb();
      this.#decodeAll();
    }
    if (this.ctx.state === 'suspended' && !this.paused) this.ctx.resume();
    return this.ctx;
  }

  get ready() {
    return !!this.#ensure() && this.ctx.state === 'running';
  }

  get now() {
    return this.ctx.currentTime;
  }

  setVolumes(v) {
    this.volumes = { ...this.volumes, ...v };
    if (this.ctx) this.#applyVolumes();
  }

  #applyVolumes() {
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(MASTER_LEVEL * this.volumes.master, t, 0.02);
    this.effects.gain.setTargetAtTime(this.volumes.effects, t, 0.02);
    this.ambient.gain.setTargetAtTime(this.volumes.ambient, t, 0.02);
  }

  pause() {
    this.paused = true;
    if (this.ctx?.state === 'running') this.ctx.suspend();
  }

  resume() {
    this.paused = false;
    if (this.ctx?.state === 'suspended') this.ctx.resume();
  }

  // ---- Gravações ---------------------------------------------------------------------

  /** Baixa todas as gravações (chamado no carregamento do jogo). */
  async loadSamples(version = '') {
    try {
      const res = await fetch(`${AUDIO_DIR}manifest.json${version}`);
      this.manifest = await res.json();
      await Promise.all(
        Object.keys(this.manifest).map(async (name) => {
          const r = await fetch(`${AUDIO_DIR}${name}.mp3${version}`);
          this.raw.set(name, await r.arrayBuffer());
        }),
      );
      if (this.ctx) this.#decodeAll();
    } catch (e) {
      console.warn('Sons não carregaram:', e);
    }
  }

  #decodeAll() {
    for (const [name, data] of this.raw) {
      this.raw.delete(name);
      this.ctx.decodeAudioData(data).then(
        (buf) => this.buffers.set(name, buf),
        () => console.warn('Som inválido:', name),
      );
    }
  }

  /** 'step-wood-*' → um dos step-wood-1, -2… carregados (sorteado). */
  #buffer(name) {
    if (!name.endsWith('*')) return this.buffers.get(name) ?? null;
    const prefix = name.slice(0, -1);
    const options = [...this.buffers.keys()].filter((k) => k.startsWith(prefix));
    return options.length ? this.buffers.get(pick(options)) : null;
  }

  #reversed(buf) {
    if (!this.cache.has(buf)) {
      const out = this.ctx.createBuffer(buf.numberOfChannels, buf.length, buf.sampleRate);
      for (let c = 0; c < buf.numberOfChannels; c++) out.getChannelData(c).set(Float32Array.from(buf.getChannelData(c)).reverse());
      this.cache.set(buf, out);
    }
    return this.cache.get(buf);
  }

  /** O mesmo som seguido de silêncio até `total` s (para repetir em loop com intervalo). */
  #padded(buf, total) {
    const key = `${this.#nameOf(buf)}:${total}`;
    if (!this.cache.has(key)) {
      const len = Math.max(buf.length, Math.round(total * buf.sampleRate));
      const out = this.ctx.createBuffer(1, len, buf.sampleRate);
      out.getChannelData(0).set(buf.getChannelData(0));
      this.cache.set(key, out);
    }
    return this.cache.get(key);
  }

  #nameOf(buf) {
    for (const [k, v] of this.buffers) if (v === buf) return k;
    return 'x';
  }

  /** Reverberação de cômodo/corredor: resposta ao impulso gerada (ruído decaindo). */
  #buildReverb() {
    const sr = this.ctx.sampleRate;
    const len = Math.round(sr * 2.6);
    const ir = this.ctx.createBuffer(2, len, sr);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        lp += (Math.random() * 2 - 1 - lp) * 0.35; // abafa os agudos da cauda
        d[i] = lp * Math.pow(1 - i / len, 3.2);
      }
    }
    this.reverb = {};
    for (const [key, bus] of [
      ['effects', this.effects],
      ['ambient', this.ambient],
    ]) {
      const conv = this.ctx.createConvolver();
      conv.buffer = ir;
      conv.connect(bus);
      this.reverb[key] = conv;
    }
  }

  /**
   * Toca uma gravação. Devolve { setVolume(v, pan), setRate(r), stop(fade, dry), duration }
   * (stop com dry = true corta também a cauda do eco e da reverberação).
   * opts:
   *   volume, pan, bus ('effects' | 'ambient'), when (tempo do áudio; padrão agora)
   *   rate (velocidade e tom juntos), vary (±fração de rate sorteada), detune (cents)
   *   loop, offset, duration, fadeIn
   *   reverse, reverb (0–1, quanto vai para a reverberação), echo { time, feedback, mix }
   *   filter { type, freq, q }, phone (filtro de linha telefônica), distort (0–1)
   *   every (s): repete em loop com esse intervalo (toque de telefone, coração)
   */
  play(name, opts = {}) {
    if (!this.ready) return this.silentHandle();
    let buf = this.#buffer(name);
    if (!buf) return this.silentHandle();
    const ctx = this.ctx;
    const {
      volume = 1,
      pan = 0,
      bus = 'effects',
      when = ctx.currentTime,
      vary = 0,
      detune = 0,
      loop = false,
      offset = 0,
      duration,
      fadeIn = 0,
      reverse = false,
      reverb = 0,
      echo = null,
      filter = null,
      phone = false,
      distort = 0,
      every = 0,
    } = opts;
    if (reverse) buf = this.#reversed(buf);
    if (every) buf = this.#padded(buf, every);
    const rate = (opts.rate ?? 1) * (1 + rnd(-vary, vary));

    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = rate;
    src.detune.value = detune;
    if (loop || every) {
      src.loop = true;
      // Pula o silêncio que o MP3 põe nas pontas (emenda sem estalo)
      if (!every && buf.duration > 0.2) {
        src.loopStart = 0.03;
        src.loopEnd = buf.duration - 0.03;
      }
    }

    // Cadeia: fonte → (distorção) → (filtros) → ganho → pan → saída (+ eco e reverberação)
    let node = src;
    const chain = (n) => {
      node.connect(n);
      node = n;
    };
    if (distort > 0) {
      const ws = ctx.createWaveShaper();
      const k = distort * 40;
      const curve = new Float32Array(512);
      for (let i = 0; i < 512; i++) {
        const x = i / 256 - 1;
        curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
      }
      ws.curve = curve;
      chain(ws);
    }
    if (phone) {
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 320;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 3200;
      chain(hp);
      chain(lp);
    }
    let filterNode = null;
    if (filter) {
      filterNode = ctx.createBiquadFilter();
      filterNode.type = filter.type;
      filterNode.frequency.value = filter.freq;
      filterNode.Q.value = filter.q ?? 0.7;
      chain(filterNode);
    }
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(fadeIn ? 0.0001 : volume, when);
    if (fadeIn) gain.gain.exponentialRampToValueAtTime(Math.max(volume, 0.0002), when + fadeIn);
    chain(gain);
    const panner = ctx.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    chain(panner);
    const dest = bus === 'ambient' ? this.ambient : this.effects;
    panner.connect(dest);
    const tails = []; // eco e reverberação (cortados num stop "seco")
    if (reverb > 0) {
      const send = ctx.createGain();
      tails.push(send);
      send.gain.value = reverb;
      panner.connect(send).connect(this.reverb[bus === 'ambient' ? 'ambient' : 'effects']);
    }
    if (echo) {
      const delay = ctx.createDelay(2);
      delay.delayTime.value = echo.time ?? 0.35;
      const fb = ctx.createGain();
      fb.gain.value = echo.feedback ?? 0.4;
      const wet = ctx.createGain();
      wet.gain.value = echo.mix ?? 0.5;
      tails.push(wet);
      panner.connect(delay);
      delay.connect(fb).connect(delay);
      delay.connect(wet).connect(dest);
    }

    if (duration !== undefined) src.start(when, offset, duration);
    else src.start(when, offset);
    let stopped = false;
    return {
      duration: (duration ?? buf.duration - offset) / rate,
      filter: filterNode,
      setVolume: (v, p = undefined) => {
        if (stopped) return;
        gain.gain.setTargetAtTime(v, ctx.currentTime, 0.05);
        if (p !== undefined) panner.pan.setTargetAtTime(Math.max(-1, Math.min(1, p)), ctx.currentTime, 0.05);
      },
      setRate: (r) => src.playbackRate.setTargetAtTime(r, ctx.currentTime, 0.1),
      stop: (fade = 0.04, dry = false) => {
        if (stopped) return;
        stopped = true;
        const t = ctx.currentTime;
        if (dry) tails.forEach((n) => n.gain.setTargetAtTime(0, t, 0.005));
        gain.gain.cancelScheduledValues(t);
        gain.gain.setTargetAtTime(0, t, Math.max(0.005, fade / 3));
        try {
          src.stop(t + fade + 0.05);
        } catch {
          // já tinha parado
        }
      },
    };
  }

  /** Vários handles como um só (camadas de um mesmo som). */
  group(handles) {
    return {
      duration: Math.max(0, ...handles.map((h) => h.duration ?? 0)),
      setVolume: (v, p) => handles.forEach((h) => h.setVolume(v, p)),
      setRate: (r) => handles.forEach((h) => h.setRate?.(r)),
      stop: (fade, dry) => handles.forEach((h) => h.stop(fade, dry)),
    };
  }

  /** O mesmo handle, com o volume multiplicado por k (gravações mais baixas). */
  scaled(handle, k) {
    return { ...handle, setVolume: (v, p) => handle.setVolume(v * k, p) };
  }

  silentHandle() {
    return { duration: 0, setVolume() {}, setRate() {}, stop() {} };
  }

  // ---- Peças sintéticas (usadas aqui e em Foley.js) ----------------------------------

  /** Saída com volume e lado; bus: 'effects' ou 'ambient'. */
  out(volume = 1, pan = 0, bus = 'effects') {
    const gain = this.ctx.createGain();
    gain.gain.value = volume;
    const panner = this.ctx.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    gain.connect(panner).connect(bus === 'ambient' ? this.ambient : this.effects);
    return { gain, panner };
  }

  noiseSource() {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    src.loopStart = Math.random();
    return src;
  }

  /** Ruído filtrado com envelope curto. */
  burst(at, out, { filter, attack = 0.002, decay = 0.08, level = 1 }) {
    const n = this.noiseSource();
    const f = this.ctx.createBiquadFilter();
    f.type = filter.type;
    f.frequency.value = filter.freq;
    f.Q.value = filter.q ?? 0.7;
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(level, at + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay);
    n.connect(f).connect(env).connect(out);
    n.start(at);
    n.stop(at + attack + decay + 0.02);
  }

  loopHandle(gain, panner, stopNodes) {
    return {
      setVolume: (v, pan = 0) => {
        gain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
        panner.pan.setTargetAtTime(Math.max(-1, Math.min(1, pan)), this.ctx.currentTime, 0.05);
      },
      setRate() {},
      stop: () => {
        gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.03);
        const at = this.ctx.currentTime + 0.2;
        stopNodes.forEach((n) => n.stop(at));
      },
    };
  }

  /** Chiado contínuo (TV, estática da morte, ligações-alucinação). */
  staticLoop(volume = 0.4) {
    if (!this.ready) return this.silentHandle();
    const { gain, panner } = this.out(volume);
    const n = this.noiseSource();
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 3000;
    bp.Q.value = 0.4;
    n.connect(bp).connect(gain);
    n.start();
    return this.loopHandle(gain, panner, [n]);
  }

  /** Bipe eletrônico de aparelho (máquina de lavar terminou). */
  beep(times = 3, volume = 0.25, pan = 0) {
    if (!this.ready) return;
    const at = this.ctx.currentTime + 0.01;
    const { gain } = this.out(volume, pan);
    for (let i = 0; i < times; i++) {
      const osc = this.ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = 1900;
      const env = this.ctx.createGain();
      const t = at + i * 0.32;
      env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(0.25, t + 0.005);
      env.gain.setValueAtTime(0.25, t + 0.16);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      osc.connect(env).connect(gain);
      osc.start(t);
      osc.stop(t + 0.2);
    }
  }

  /** Clique dos menus. */
  uiClick(volume = 0.25) {
    if (!this.ready) return;
    const { gain } = this.out(volume * 2);
    this.burst(this.ctx.currentTime, gain, { filter: { type: 'bandpass', freq: 1800, q: 1 }, decay: 0.03, level: 1 });
  }

  /** Corta todo o som por um instante (início do jumpscare, GDD 13.6). */
  cutFor(seconds) {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(0, t);
    this.master.gain.setValueAtTime(MASTER_LEVEL * this.volumes.master, t + seconds);
  }

  /**
   * Som da digitação da caixa de diálogo: um "blip" com a voz de quem fala (grave para
   * homens, mais agudo para mulheres e crianças); efeitos soam como um tique abafado.
   */
  textBlip(voice, glitch = false, volume = 0.12) {
    if (!this.ready) return;
    const at = this.ctx.currentTime;
    const { gain } = this.out(volume);
    if (voice.kind === 'paper') {
      this.burst(at, gain, { filter: { type: 'bandpass', freq: 3200 + Math.random() * 800, q: 1.5 }, decay: 0.03, level: 3 });
      return;
    }
    if (voice.kind === 'fx') {
      this.burst(at, gain, { filter: { type: 'lowpass', freq: 900, q: 0.7 }, decay: 0.025, level: 2 });
      return;
    }
    const osc = this.ctx.createOscillator();
    osc.type = voice.wave ?? 'square';
    const spread = glitch ? 0.35 : 0.06;
    const f = voice.freq * (1 + (Math.random() * 2 - 1) * spread);
    osc.frequency.setValueAtTime(f, at);
    if (glitch && Math.random() < 0.4) osc.frequency.exponentialRampToValueAtTime(f * 0.6, at + 0.05);
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1800;
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(0.5, at + 0.005);
    env.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);
    osc.connect(lp).connect(env).connect(gain);
    osc.start(at);
    osc.stop(at + 0.06);
  }

  // ---- Ambiente (tela inicial) -------------------------------------------------------

  /** Chuva contínua. */
  rainLoop(volume = 0.5) {
    return this.play('rain', { loop: true, volume, bus: 'ambient', fadeIn: 1.5 });
  }

  /** Trovão (de um lado ou do outro, com o cômodo ecoando). */
  thunder(volume = 0.5) {
    this.play('thunder', { volume: volume * 3.5, bus: 'ambient', pan: rnd(-0.5, 0.5), vary: 0.08, reverb: 0.25 });
  }

  /** Um telefone antigo tocando três vezes, ao longe (abafado, com eco). */
  distantRing(volume = 0.25, pan = 0) {
    if (!this.ready) return this.silentHandle();
    const t = this.ctx.currentTime + 0.05;
    return this.group(
      [0, 4, 8].map((dt) =>
        this.play('ring-house', { when: t + dt, volume, pan, bus: 'ambient', filter: { type: 'lowpass', freq: 1400 }, reverb: 0.7 }),
      ),
    );
  }

  // ---- Telefone ----------------------------------------------------------------------

  /** Telefone tocando em ciclos até stop(): 'house' (fixo da sala) ou 'office' (delegacia). */
  phoneRing(volume = 0.5, kind = 'house') {
    return this.play(kind === 'office' ? 'ring-office' : 'ring-house', { volume, every: 4 });
  }

  /** Tom de linha ocupada por `seconds`. */
  busyTone(seconds = 4, volume = 0.3) {
    const h = this.play('busy', { loop: true, volume, phone: true });
    setTimeout(() => h.stop(0.05), seconds * 1000);
    return h;
  }

  /** Porta rangendo devagar; phone: abafada como se viesse pela linha. */
  doorCreak(volume = 0.5, phone = true) {
    this.play('creak', { volume, phone, rate: 0.85, reverb: phone ? 0.15 : 0.35 });
  }

  // ---- Corpo -------------------------------------------------------------------------

  /** Uma batida do coração (tum-tum). period = tempo até a próxima batida (s). */
  heartBeat(volume = 0.6, period = 0.8) {
    this.play('heart', { volume: volume * 0.5, rate: Math.min(1.5, Math.max(0.9, 0.75 / period)), filter: { type: 'lowpass', freq: 400 } });
  }

  /** Coração batendo forte algumas vezes. */
  heartbeat(beats = 2, volume = 0.9) {
    if (!this.ready) return;
    const t = this.ctx.currentTime + 0.02;
    for (let b = 0; b < beats; b++) this.play('heart', { when: t + b * 0.75, volume: volume * 0.5, filter: { type: 'lowpass', freq: 400 } });
  }

  // ---- Alucinações -------------------------------------------------------------------

  /** Balão estourando (seco, no cômodo). */
  pop(volume = 0.8, pan = 0) {
    this.play('balloon-pop', { volume, pan, reverb: 0.2 });
  }

  /** Gota caindo na poça, com o eco do cômodo vazio. */
  drip(volume = 0.5, pan = 0) {
    if (volume <= 0.01) return;
    this.play('drip-*', { volume, pan, vary: 0.08, reverb: 0.35 });
  }

  /** Caixinha de música (urso coletado): duas notas, a segunda uma terça abaixo. */
  musicBox(volume = 0.35) {
    if (!this.ready) return;
    const t = this.ctx.currentTime + 0.01;
    this.play('music-box', { when: t, volume, reverb: 0.3 });
    this.play('music-box', { when: t + 0.28, volume: volume * 0.8, rate: 2 ** (-3 / 12), reverb: 0.3 });
  }

  /** Passos pesados correndo (passos falsos), passando de um lado ao outro. */
  heavySteps(seconds = 2.6, panFrom = -0.8, panTo = 0.8, volume = 0.9) {
    if (!this.ready) return;
    const t0 = this.ctx.currentTime + 0.05;
    for (let t = 0; t < seconds; t += 0.3 + Math.random() * 0.05) {
      const k = t / seconds;
      this.play('step-heavy-*', {
        when: t0 + t,
        volume: volume * (0.35 + 0.65 * Math.sin(Math.PI * k)),
        pan: panFrom + (panTo - panFrom) * k,
        rate: 0.8,
        vary: 0.05,
        filter: { type: 'lowpass', freq: 1200 },
        reverb: 0.25,
      });
    }
  }

  // ---- Monstros ----------------------------------------------------------------------

  /** Um passo: heavy = Artur distorcido (grave, arrastado, pesado). */
  step(volume = 0.6, pan = 0, heavy = false) {
    if (volume <= 0.01) return;
    if (heavy) {
      this.play('step-heavy-*', { volume: volume * 0.85, pan, rate: 0.68, vary: 0.04, filter: { type: 'lowpass', freq: 900 }, reverb: 0.3 });
    } else this.play('step-wood-*', { volume, pan, vary: 0.05 });
  }

  /** Chaveiro tilintando (Invasor, a cada passo; evento da tranca). */
  keyJingle(volume = 0.5, pan = 0) {
    this.play('keys-*', { volume, pan, vary: 0.06, reverb: 0.15 });
  }

  /**
   * Sussurro do Artur distorcido: voz de homem sussurrando, mais lenta e grave, com eco
   * de corredor e um pouco rasgada; por baixo, outro sussurro invertido.
   */
  whisperLoop() {
    // As gravações de sussurro são bem baixas: ×6
    return this.scaled(this.group([
      this.play('whisper-man', { loop: true, volume: 0, rate: 0.72, distort: 0.25, reverb: 0.5, echo: { time: 0.28, feedback: 0.35, mix: 0.35 } }),
      this.play('whisper-man-2', { loop: true, volume: 0, rate: 0.6, reverse: true, filter: { type: 'lowpass', freq: 1800 }, reverb: 0.6 }),
    ]), 6);
  }

  /** Ossos estalando (Clara correndo de quatro). */
  cracks(volume = 0.5, pan = 0) {
    this.play('crack-*', { volume: volume * 3.6, pan, vary: 0.15, reverb: 0.15 });
  }

  /**
   * Risada da Clara: risadas de verdade de criança, um pouco mais lentas e graves, com eco.
   * Começa alta na hora (é o aviso para parar) e emenda uma risada na outra, sem silêncio
   * no meio, até `seconds` — quando ela acaba, acabou mesmo. Nunca repete a mesma risada
   * em seguida.
   */
  laugh(seconds = 5, volume = 0.6, pan = 0) {
    if (!this.ready) return this.silentHandle();
    const t0 = this.ctx.currentTime + 0.02;
    const parts = [];
    const bag = [];
    let last = null;
    let t = 0;
    while (t < seconds - 0.3) {
      if (!bag.length) bag.push(...shuffle(LAUGHS.filter((n) => n !== last)));
      const name = bag.pop();
      last = name;
      const rate = rnd(0.8, 0.88);
      const left = seconds - t;
      const h = this.play(name, {
        when: t0 + t,
        volume: volume * (LAUGH_LEVEL[name] ?? 1),
        pan,
        rate,
        reverse: t > 1.5 && Math.random() < 0.15,
        reverb: 0.35,
        echo: { time: 0.28, feedback: 0.25, mix: 0.22 },
        duration: left * rate, // (em tempo da gravação)
      });
      parts.push(h);
      t += Math.min(h.duration || 1.5, left) + rnd(0.05, 0.2);
    }
    return this.group(parts);
  }

  /**
   * Choro da Helena: mulher chorando baixinho, um pouco mais lenta e grave, com eco; por
   * baixo, o mesmo choro invertido e mais grave, quase inaudível.
   */
  cryLoop() {
    return this.group([
      this.play('cry', { loop: true, volume: 0, rate: 0.88, reverb: 0.45, echo: { time: 0.4, feedback: 0.3, mix: 0.3 } }),
      this.play('cry', { loop: true, volume: 0, rate: 0.62, reverse: true, filter: { type: 'lowpass', freq: 1400 }, reverb: 0.6, offset: 8 }),
    ]);
  }

  /** Perseguição: respiração ofegante (e, se withHeart, o coração disparado). */
  chaseLoop(volume = 0.8, withHeart = true) {
    const parts = [this.play('breath', { loop: true, volume: volume * 0.7, rate: 1.12 })];
    if (withHeart) parts.push(this.play('heart', { every: 0.5, volume: volume * 0.5, rate: 1.4, filter: { type: 'lowpass', freq: 400 } }));
    return this.group(parts);
  }

  /**
   * Grito de jumpscare. kind: 'woman' (Helena), 'girl' (Clara), 'roar1' (Invasor), 'roar2'
   * (Artur distorcido). phone: abafado como se viesse pelo telefone (3ª ligação final e o
   * trecho escondido nos jumpscares, GDD 13.6).
   */
  scream(volume = 0.9, phone = false, kind = 'woman') {
    if (kind === 'roar1' && !phone) return this.#invaderScream(volume);
    const name = { woman: 'scream-woman', girl: 'scream-girl', roar1: 'roar-1', roar2: 'roar-2' }[kind] ?? 'scream-woman';
    const rate = { roar1: 0.8, roar2: 0.7 }[kind] ?? 1;
    this.play(name, { volume, phone, rate, distort: phone ? 0.3 : 0.15, reverb: phone ? 0.1 : 0.35 });
  }

  /**
   * Grito do Invasor: um berro rasgado e comprido, com dois golpes curtos por cima no
   * começo e um grito grave por baixo, tudo saturado — alto e agressivo.
   */
  #invaderScream(volume) {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    this.play('roar-3', { when: t, volume, rate: 0.85, distort: 0.35, reverb: 0.3 });
    this.play('roar-4', { when: t, volume: volume * 0.9, rate: 0.75, distort: 0.45, reverb: 0.25 });
    this.play('roar-5', { when: t + 0.55, volume: volume * 0.7, rate: 0.8, distort: 0.4, reverb: 0.3 });
    this.play('scream-woman', { when: t + 0.05, volume: volume * 0.45, rate: 0.55, distort: 0.5, filter: { type: 'lowpass', freq: 2600 }, reverb: 0.3 });
  }

  /**
   * Helena aparecendo na luz piscando: um grito de mulher invertido e lento que cresce até
   * o instante em que ela surge, um sopro grave com eco e estalos de lâmpada.
   */
  helenaSting(volume = 0.8) {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    this.play('scream-woman', { when: t, volume: volume * 0.8, reverse: true, rate: 0.55, filter: { type: 'lowpass', freq: 2200 }, reverb: 0.7 });
    this.play('whisper-soft', { when: t + 0.2, volume: volume * 0.7, rate: 0.5, reverb: 0.8, echo: { time: 0.5, feedback: 0.45, mix: 0.5 } });
    this.play('bulb', { when: t, volume: volume * 0.6, vary: 0.1 });
    this.play('bulb', { when: t + 1.35, volume: volume * 0.5, vary: 0.1 });
  }
}

export const sfx = new Sfx();

/** Volume e lado de um som pela posição em relação ao Artur (m). */
export function positional(listener, source, maxDist = 10) {
  const dx = source.x - listener.x;
  const d = Math.hypot(dx, source.y - listener.y);
  return {
    volume: Math.max(0, 1 - d / maxDist),
    pan: Math.max(-1, Math.min(1, dx / 6)),
  };
}
