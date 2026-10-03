# Chamada Perdida

Terror psicológico 2D em pixel art, feito com **Phaser 3 + Vite** e publicado no GitHub Pages.

O documento de design ([GDD-chamada-perdida.md](GDD-chamada-perdida.md)) é a fonte de verdade do projeto.
Planta da casa: [planta-casa.svg](planta-casa.svg).

## Rodar localmente

```bash
npm install
npm run dev
```

## Controles (casa)

| Ação | Tecla |
|---|---|
| Andar | W A S D |
| Correr | Shift (segurar) |
| Abrir/fechar porta | F |
| Avançar diálogo | Espaço |

## Estrutura

| Caminho | O que é |
|---|---|
| `src/config/balance.js` | Todos os valores de balanceamento (GDD seção 9). Ajuste aqui. |
| `src/systems/formulas.js` | Fórmulas da curva da noite (GDD 9.2). |
| `src/world/houseMap.js` | Mapa da casa em metros (cômodos, portas, móveis), feito a partir da planta. |
| `src/entities/` | Artur (`Player.js`) e portas (`Door.js`). |
| `src/scenes/` | Cenas do Phaser (carregamento, casa, HUD). |
| `src/debug/` | Modo debug. |
| `scripts/sprites/` | Pixel art desenhada por código. `npm run sprites` gera os PNG em `public/assets/sprites`. |
| `.github/workflows/deploy.yml` | Publicação automática no GitHub Pages a cada push na `main`. |

## Modo debug

- **F9** liga/desliga o painel (fica salvo no navegador), ou abra o jogo com `?debug` no fim do link.
- Mostra posição, cômodo, velocidade, estamina e portas, além de uma noite simulada com os valores das fórmulas.
- **G** mostra as caixas de colisão.
- Noite simulada: **1–7** escolhe o dia, **R** reinicia, **T** acelera o tempo (1×, 10×, 60×).

## Progresso (GDD, Apêndice C)

- [x] 1. Base
- [x] 2. Casa jogável
- [ ] 3. Luz e medo
- [ ] 4. Dormir e curva da noite
- [ ] 5. Alucinações
- [ ] 6. Monstros
- [ ] 7. Portas e chave
- [ ] 8. Delegacia
- [ ] 9. Fluxo completo
- [ ] 10. Final
- [ ] 11. Áudio e vozes
- [ ] 12. Arte final e polimento
