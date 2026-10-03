# Chamada Perdida

Terror psicológico 2D em pixel art, feito com **Phaser 3 + Vite** e publicado no GitHub Pages.

O documento de design ([GDD-chamada-perdida.md](GDD-chamada-perdida.md)) é a fonte de verdade do projeto.
Planta da casa: [planta-casa.svg](planta-casa.svg).

## Rodar localmente

```bash
npm install
npm run dev
```

## Estrutura

| Caminho | O que é |
|---|---|
| `src/config/balance.js` | Todos os valores de balanceamento (GDD seção 9). Ajuste aqui. |
| `src/systems/formulas.js` | Fórmulas da curva da noite (GDD 9.2). |
| `src/debug/debug.js` | Modo debug. |
| `src/scenes/` | Cenas do Phaser. |
| `.github/workflows/deploy.yml` | Publicação automática no GitHub Pages a cada push na `main`. |

## Modo debug

- **F9** liga/desliga o painel (fica salvo no navegador), ou abra o jogo com `?debug` no fim do link.
- Na cena provisória: **1–7** escolhe o dia, **R** reinicia a noite, **T** acelera o tempo (1×, 10×, 60×).
