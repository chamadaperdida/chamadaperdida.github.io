import Phaser from 'phaser';
import '@fontsource/vt323';
import { BootScene } from './scenes/BootScene.js';
import { HouseScene } from './scenes/HouseScene.js';
import { HudScene } from './scenes/HudScene.js';
import { TransitionScene } from './scenes/TransitionScene.js';
import { DeathScene } from './scenes/DeathScene.js';
import { DelegaciaScene } from './scenes/DelegaciaScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { PauseScene } from './scenes/PauseScene.js';
import { EndingScene } from './scenes/EndingScene.js';
import { options } from './systems/Save.js';
import { settings, applyFps } from './systems/Settings.js';
import { debug } from './debug/debug.js';
import './style.css';

debug.mount();

// Espera a fonte carregar para os textos do Phaser não saírem com a fonte padrão.
document.fonts.load('20px VT323').finally(() => {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    // 960×540 com zoom 2 na casa: pixel art nítido e textos legíveis no HUD
    width: 960,
    height: 540,
    backgroundColor: '#000000',
    pixelArt: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: 0 }, debug: false },
    },
    scene: [BootScene, TitleScene, HouseScene, HudScene, TransitionScene, DeathScene, DelegaciaScene, PauseScene, EndingScene],
  });
  // Tela cheia fica salva nas opções. O navegador só deixa entrar em tela cheia num clique
  // ou tecla, então, se estava ligada, ela volta no primeiro toque do jogador.
  const remember = () => options.save({ ...options.load(), fullscreen: game.scale.isFullscreen });
  game.events.once(Phaser.Core.Events.READY, () => {
    // Limite de FPS (opções de desempenho): na hora e quando mudar
    applyFps(game);
    settings.onChange(() => applyFps(game));
    game.scale.on(Phaser.Scale.Events.ENTER_FULLSCREEN, remember);
    game.scale.on(Phaser.Scale.Events.LEAVE_FULLSCREEN, remember);
  });
  const restoreFullscreen = () => {
    window.removeEventListener('pointerup', restoreFullscreen);
    window.removeEventListener('keyup', restoreFullscreen);
    if (options.load().fullscreen && !game.scale.isFullscreen) game.scale.startFullscreen();
  };
  window.addEventListener('pointerup', restoreFullscreen);
  window.addEventListener('keyup', restoreFullscreen);
  // Só no `npm run dev`: facilita inspecionar o jogo pelo console do navegador.
  if (import.meta.env.DEV) window.game = game;
});
