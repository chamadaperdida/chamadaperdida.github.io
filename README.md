# Chamada Perdida

Terror psicológico 2D em pixel art, feito com **Phaser 3 + Vite** e publicado no GitHub Pages.

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

## Estrutura

| Caminho | O que é |
|---|---|
| `src/config/balance.js` | Todos os valores de balanceamento (GDD seção 9). Ajuste aqui. |
| `src/systems/` | Fórmulas (GDD 9.2), relógio da noite, medo, gerador, lanterna, iluminação, itens, tarefas (`Tasks.js`) e ursos (`Bears.js`), save e opções (`Save.js`). |
| `src/world/houseMap.js` | Mapa da casa em metros (cômodos, portas, móveis), feito a partir da planta. |
| `src/entities/` | Artur (`Player.js`) e portas (`Door.js`). |
| `src/scenes/` | Cenas do Phaser (carregamento, tela inicial, delegacia, casa, HUD, transições, morte, pausa). |
| `src/ui/` | Caixa de diálogo e menus (botões, opções, confirmação). |
| `src/data/calls.js` | Ligações da delegacia de cada dia e bilhetes do Marcos (GDD 3 e Apêndice A). |
| `src/debug/` | Modo debug. |
| `scripts/sprites/` | Pixel art desenhada por código. `npm run sprites` gera os PNG em `public/assets/sprites`. |
| `scripts/sim-ursos.py` | Simulação de balanceamento dos ursos (GDD 9.5). |
| `.github/workflows/deploy.yml` | Publicação automática no GitHub Pages a cada push na `main`. |

## Modo debug

- **F9** liga/desliga o painel (fica salvo no navegador), ou abra o jogo com `?debug` no fim do link.
- Mostra medo, fase da noite, risco e quedas do gerador, lanterna, itens e as fórmulas da noite.
- **1–7** começa a noite daquele dia · **R** reinicia a noite · **T** acelera o relógio da noite (1×, 10×, 60×)
- **K** derruba o gerador · **+ / −** sobe/desce o medo · **H** sorteia uma alucinação · **J** força cada tipo em sequência · **M** força cada monstro em sequência (apaga a luz) · **I** imortal · **N** termina a noite · **G** mostra as caixas de colisão
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
- [ ] 12. Final
- [ ] 13. Áudio
- [ ] 14. Arte final e polimento
