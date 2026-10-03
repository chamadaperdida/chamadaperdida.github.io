// Modo debug (GDD, seção 9.5 — recomendação).
//
// Tecla oculta: F9 liga/desliga o painel. Também abre com ?debug na URL.
// O estado fica salvo no navegador, então continua ligado ao recarregar.
//
// Qualquer sistema do jogo publica valores no painel com:
//   debug.set('Medo', '42.0%')
//   debug.set('Risco do gerador', risk.toFixed(5))
// e remove com debug.remove('Medo'). Os valores aparecem em grupos:
//   debug.set('Gerador/Risco', ...) → grupo "Gerador", linha "Risco".

const STORAGE_KEY = 'chamada-perdida:debug';
const TOGGLE_KEY = 'F9';

class DebugOverlay {
  constructor() {
    this.values = new Map();
    this.enabled = this.#initialState();
    this.el = null;
    this.dirty = true;

    window.addEventListener('keydown', (e) => {
      if (e.code === TOGGLE_KEY) {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  #initialState() {
    if (new URLSearchParams(window.location.search).has('debug')) return true;
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  }

  mount(parent = document.body) {
    this.el = document.createElement('pre');
    this.el.id = 'debug-overlay';
    parent.appendChild(this.el);
    this.#applyVisibility();
    const tick = () => {
      if (this.enabled && this.dirty) this.#render();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  toggle() {
    this.enabled = !this.enabled;
    try {
      localStorage.setItem(STORAGE_KEY, this.enabled ? '1' : '0');
    } catch {
      // sem localStorage: o debug só não fica salvo
    }
    this.#applyVisibility();
  }

  set(key, value) {
    this.values.set(key, value);
    this.dirty = true;
  }

  remove(key) {
    this.values.delete(key);
    this.dirty = true;
  }

  /** Remove todas as linhas de um grupo (ex.: ao trocar de cena). */
  clearGroup(group) {
    for (const key of this.values.keys()) {
      if (key.startsWith(`${group}/`)) this.values.delete(key);
    }
    this.dirty = true;
  }

  #applyVisibility() {
    if (this.el) this.el.style.display = this.enabled ? 'block' : 'none';
    this.dirty = true;
  }

  #render() {
    const groups = new Map();
    for (const [key, value] of this.values) {
      const slash = key.indexOf('/');
      const group = slash === -1 ? 'Geral' : key.slice(0, slash);
      const label = slash === -1 ? key : key.slice(slash + 1);
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push([label, value]);
    }

    const lines = [`DEBUG  (${TOGGLE_KEY} esconde)`];
    for (const [group, entries] of groups) {
      lines.push('', `— ${group} —`);
      const width = Math.max(...entries.map(([label]) => label.length));
      for (const [label, value] of entries) {
        lines.push(`${label.padEnd(width)}  ${value}`);
      }
    }
    this.el.textContent = lines.join('\n');
    this.dirty = false;
  }
}

export const debug = new DebugOverlay();
