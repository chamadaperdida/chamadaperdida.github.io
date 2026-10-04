// Lanterna (GDD 4.10): só no escuro. Clique esquerdo liga/desliga, mira com o mouse.
// Bateria começa cheia toda noite e só gasta ligada (duração por noite: balance perNight).
// Abaixo de 20% a luz falha (pisca sozinha). Vazia: não liga.

import { BALANCE } from '../config/balance.js';

export class Flashlight {
  constructor(batterySeconds) {
    this.batterySeconds = batterySeconds; // uso contínuo com a bateria cheia
    this.battery = 1; // 0 a 1
    this.on = false;
    this.angle = Math.PI / 2; // para baixo
    this.flickerOff = false; // falha momentânea com bateria fraca
    this.flickerTimer = 0;
  }

  get low() {
    return this.battery < BALANCE.timings.flashlightLowBatteryWarning;
  }

  /** A luz está realmente saindo da lanterna neste quadro? */
  get shining() {
    return this.on && !this.flickerOff;
  }

  toggle(allowed) {
    if (this.on) {
      this.on = false;
      return;
    }
    if (allowed && this.battery > 0) this.on = true;
  }

  forceOff() {
    this.on = false;
  }

  addBattery(fraction) {
    this.battery = Math.min(1, this.battery + fraction);
  }

  update(dt) {
    if (!this.on) {
      this.flickerOff = false;
      return;
    }
    this.battery = Math.max(0, this.battery - dt / this.batterySeconds);
    if (this.battery === 0) {
      this.on = false;
      return;
    }
    // Bateria fraca: falhas curtas e irregulares, mais frequentes quanto mais fraca
    if (this.low) {
      this.flickerTimer -= dt;
      if (this.flickerTimer <= 0) {
        this.flickerOff = !this.flickerOff;
        const weakness = 1 - this.battery / BALANCE.timings.flashlightLowBatteryWarning;
        this.flickerTimer = this.flickerOff
          ? 0.04 + Math.random() * 0.12
          : 0.2 + Math.random() * (1.6 - weakness * 1.3);
      }
    } else {
      this.flickerOff = false;
    }
  }
}
