# Chamada Perdida

Terror psicológico 2D em pixel art, feito com **Phaser 3 + Vite** e publicado no GitHub Pages.

**Jogar:** https://chamadaperdida.github.io

O documento de design ([GDD-chamada-perdida.md](GDD-chamada-perdida.md)) é a fonte de verdade do projeto.
Planta da casa: [planta-casa-v2.svg](planta-casa-v2.svg).

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
| Mirar a lanterna | Mouse |
| Ligar/desligar lanterna (só no escuro) | Clique esquerdo |
| Abrir/fechar porta, pegar itens e ursos, ler a lista na geladeira, tarefas, dormir na cama | F |
| Tarefas que levam tempo (lavar, regar, fechar janela…) | F (segurar) |
| Religar o gerador (com um fusível novo) | F (segurar 3 s) |
| Soltar o que está carregando | Q |
| Avançar diálogo | Espaço |
| Pausa (casa e delegacia) | Esc |
| Pular os créditos | Espaço, Enter, Esc ou clique no botão |

## Estrutura

| Caminho | O que é |
|---|---|
| `src/config/balance.js` | Todos os valores de balanceamento (GDD seção 9). Ajuste aqui. |
| `src/audio/` | Som: `Sfx.js` (carrega e toca as gravações com eco, filtros etc.; monstros, alucinações, telefone, tela inicial) e `Foley.js` (ambiente da casa e da delegacia, tarefas, portas, passos, itens, gerador, sono). |
| `scripts/audio-manifest.mjs` | De onde vem cada som (gravações CC0) e que trecho usar. `npm run audio` baixa as gravações para `.audio-cache/` e gera `public/assets/audio/*.mp3` (precisa do `ffmpeg-static`, instalado como dependência de desenvolvimento). |
| `src/systems/` | Fórmulas (GDD 9.2), relógio da noite, medo, gerador, lanterna, iluminação, itens, tarefas (`Tasks.js`) e ursos (`Bears.js`), save e opções (`Save.js`), opções de desempenho e tutorial (`Settings.js`), setas do tutorial (`Tutorial.js`), madrugada do final (`Finale.js`). |
| `src/world/houseMap.js` | Mapa da casa em metros (cômodos, portas, móveis), feito a partir da planta. |
| `src/entities/` | Artur (`Player.js`) e portas (`Door.js`). |
| `src/scenes/` | Cenas do Phaser (carregamento, tela inicial, delegacia, casa, HUD, transições, morte, pausa, final com reportagem, créditos e CVV). |
| `src/ui/` | Caixa de diálogo e menus (botões, opções, confirmação). |
| `src/data/calls.js` | Ligações da delegacia de cada dia, bilhetes do Marcos e as três ligações finais da Helena (GDD 3, 10 e Apêndice A). |
| `src/debug/` | Modo debug. |
| `scripts/sprites/` | Pixel art desenhada por código. `npm run sprites` gera os PNG em `public/assets/sprites`. A tela inicial (`title.mjs`) tem luz calculada por pixel; `node scripts/preview-title.mjs saida.png` gera uma prévia dela. A reportagem do final fica em `ending.mjs`. |
| `scripts/sim-ursos.py` | Simulação de balanceamento dos ursos (GDD 9.5). |
| `.github/workflows/deploy.yml` | Publicação automática no GitHub Pages a cada push na `main`. |

## Modo debug

- **F9** liga/desliga o painel (fica salvo no navegador), ou abra o jogo com `?debug` no fim do link.
- Mostra medo, fase da noite, risco e quedas do gerador, lanterna, itens e as fórmulas da noite.
- **1–7** começa a noite daquele dia · **R** reinicia a noite · **T** acelera o relógio da noite (1×, 10×, 60×)
- **K** derruba o gerador · **+ / −** sobe/desce o medo · **H** sorteia uma alucinação · **J** força cada tipo em sequência · **M** força cada monstro em sequência (apaga a luz) · **I** imortal · **N** termina a noite (no dia 7 começa a madrugada do final; na madrugada, pula para a reportagem) · **G** mostra as caixas de colisão
- **B** pega um urso · **O** completa as tarefas · **L** força o evento da tranca (com luz acesa e nenhuma porta trancada)
- Na delegacia: **1–7** delegacia daquele dia · **R** reinicia · **N** pula as ligações · **C** vai direto para a casa

## Progresso (GDD, Apêndice C)

- [x] 1. Base
- [x] 2. Casa jogável
- [x] 3. Luz e medo
- [x] 4. Dormir e curva da noite
- [x] 5. Alucinações
- [x] 6. Monstros
- [x] 7. Revisão das etapas 2–6 (casa nova)
- [x] 8. Sistemas novos (lista e tarefas, ursos, fusível)
- [x] 9. Portas e chave
- [x] 10. Delegacia
- [x] 11. Fluxo completo
- [x] 12. Final
- [x] 13. Áudio (falta decidir quais momentos terão voz, GDD 14.3)
- [ ] 14. Arte final e polimento
