import { defineConfig } from 'vite';

export default defineConfig({
  // Caminhos relativos: o build funciona em https://<usuário>.github.io/<repositório>/
  base: './',
  define: {
    // Muda a cada build: vai no fim do endereço dos sprites para o navegador não usar
    // a versão antiga guardada em cache (o GitHub Pages guarda por 10 min).
    __BUILD_ID__: JSON.stringify(Date.now().toString(36)),
  },
  build: {
    // Phaser sozinho passa do limite padrão de aviso do Vite.
    chunkSizeWarningLimit: 2000,
  },
});
