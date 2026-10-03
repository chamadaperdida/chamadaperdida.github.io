import { defineConfig } from 'vite';

export default defineConfig({
  // Caminhos relativos: o build funciona em https://<usuário>.github.io/<repositório>/
  base: './',
  build: {
    // Phaser sozinho passa do limite padrão de aviso do Vite.
    chunkSizeWarningLimit: 2000,
  },
});
