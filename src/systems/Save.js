// Save e opções no localStorage do navegador (GDD 2.6 e 2.1).
//
// Save: { day, delegaciaDone, completed }
//   - day: dia atual (1–7)
//   - delegaciaDone: a delegacia desse dia já foi concluída (Continuar vai direto para a casa)
//   - completed: o jogo foi zerado (Continuar fica desativado)
// Opções: { master, ambient, effects (0–1), fullscreen }
//
// Sem localStorage (navegação privada, bloqueado etc.), o jogo funciona, só não guarda nada.

const SAVE_KEY = 'chamada-perdida:save';
const OPTIONS_KEY = 'chamada-perdida:opcoes';

export const DEFAULT_OPTIONS = { master: 1, ambient: 1, effects: 1, fullscreen: false };

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // sem localStorage: segue sem salvar
  }
}

export const save = {
  /** O save atual, ou null se não houver. */
  load() {
    const s = read(SAVE_KEY);
    if (!s || !Number.isInteger(s.day) || s.day < 1 || s.day > 7) return null;
    return { day: s.day, delegaciaDone: !!s.delegaciaDone, completed: !!s.completed };
  },

  /** Dá para continuar: existe save e o jogo não foi zerado. */
  canContinue() {
    const s = this.load();
    return !!s && !s.completed;
  },

  newGame() {
    write(SAVE_KEY, { day: 1, delegaciaDone: false, completed: false });
  },

  /** Saiu da delegacia: se morrer nessa noite, o Continuar pula a delegacia. */
  delegaciaDone(day) {
    write(SAVE_KEY, { day, delegaciaDone: true, completed: false });
  },

  /** Dormiu: o próximo dia começa pela delegacia. */
  nightDone(day) {
    write(SAVE_KEY, { day: day + 1, delegaciaDone: false, completed: false });
  },

  /** Zerou o jogo. */
  completed() {
    write(SAVE_KEY, { day: 7, delegaciaDone: true, completed: true });
  },
};

export const options = {
  load() {
    return { ...DEFAULT_OPTIONS, ...(read(OPTIONS_KEY) ?? {}) };
  },

  save(value) {
    write(OPTIONS_KEY, value);
  },
};
