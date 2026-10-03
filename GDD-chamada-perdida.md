# CHAMADA PERDIDA — Documento de Design (GDD)

> Documento-fonte do projeto. O Claude Code deve seguir este documento ao implementar o jogo.
> Tudo aqui foi decidido com o autor (Nicolas). Valores numéricos da seção 9 são **iniciais** (saíram de simulação) e devem ficar centralizados num arquivo de configuração para ajuste fino.

---

## 0. Visão geral

- **Gênero:** terror psicológico 2D, pixel art, navegador.
- **Duração:** 7 dias. Cada dia = fase **Delegacia** (história) + fase **Casa** (gameplay de sobrevivência).
- **Tom:** perturbador, triste, sem gore explícito. O suicídio do protagonista **nunca é mostrado**.
- **Inspiração de estrutura:** Five Nights at Freddy's (dias, menu com Continuar, morte volta ao menu).

### Stack (tudo gratuito)

| Parte | Escolha |
|---|---|
| Código | Claude Code cria e mantém todo o projeto |
| Motor do jogo | **Phaser 3** (biblioteca JavaScript gratuita para jogos 2D no navegador: sprites, câmera, colisões, sons, animações) |
| Ferramenta de build | **Vite** (gratuita; roda o projeto localmente e gera a versão final) |
| Repositório | GitHub |
| Publicação | **GitHub Pages** (gratuito, link público para jogar no navegador) |
| Sem Lovable | O projeto é só Phaser + Vite, sem React |
| Arte | Pixel art feita pelo Claude Code (sprites gerados por código/scripts, exportados como spritesheets PNG) |
| Sons e efeitos | Gerados por código (Web Audio: ruído branco, chiado, batimento, estática) + bancos gratuitos com licença livre (ex.: Freesound, filtrando por CC0) |
| Falas | **Caixa de diálogo** com nome de quem fala e texto sendo digitado (seção 11.1). Não há voz por IA; áudio de voz só em momentos específicos (a definir) |
| Save | `localStorage` do navegador |

---

## 1. História

### 1.1 Personagens

- **Artur Lemos** — ex-policial de rua, 41 anos. Protagonista.
- **Helena** — esposa de Artur (morta).
- **Clara** — filha de Artur (morta no dia em que fazia 9 anos).
- **Marcos** — amigo e ex-parceiro de viatura de Artur, trabalha no turno anterior ao dele.
- **O Invasor** — homem que invadiu a casa. Nunca identificado; Artur nunca viu o rosto dele.

Cidade: **Vale Sereno** (fictícia). Endereço de Artur: **Rua das Acácias, 47**.

### 1.2 História completa (o que realmente aconteceu)

No dia do aniversário de Clara, Artur tinha prometido estar em casa para a festa. Pegou um plantão mesmo assim. Ele e Helena brigaram por isso; Clara ouviu. Artur saiu com raiva e **colocou o celular no silencioso**.

Naquela noite a luz da casa caiu, o gerador não ligou e um invasor entrou pela porta dos fundos. Helena e Clara se esconderam no quarto da Clara. Helena ligou para Artur **três vezes — às 23:41, 23:44 e 23:47**. Ninguém atendeu. Quando Artur viu as chamadas perdidas e chegou, era tarde: atravessou o corredor escuro com a lanterna até o quarto da Clara.

Um ano depois, Artur foi afastado das ruas e trabalha como **atendente noturno** na delegacia. Toma remédios controlados em excesso. Continua morando na mesma casa. O jogo cobre os 7 dias até o aniversário de Clara — que também é o aniversário da tragédia.

Os monstros e alucinações são **reflexos dos traumas de Artur e do excesso de remédio**.

### 1.3 Como a história é contada

A história **nunca é contada de forma direta**. O jogador recebe peças soltas que só fazem sentido depois da última ligação e da reportagem:

1. **Calendário da delegacia** — dia 7 marcado "Aniversário da Clara".
2. **Bilhetes do Marcos** (dias 1 a 6).
3. **Ligações reais** — ocorrências comuns que ecoam temas (luz caindo, pai que não atende, briga, festa, chave perdida).
4. **Ligações-alucinação** — pedaços das ligações de Helena, com pistas de que não são reais.
5. **Alucinações e monstros em casa.**
6. **Gritos escondidos nos jumpscares** — trechos dos gritos da 3ª ligação final.
7. **Madrugada do dia 7** — as três ligações completas.
8. **Reportagem na TV** — fecha a história.

---

## 2. Fluxo do jogo e telas

### 2.1 Tela inicial

- Fundo: título *Chamada Perdida* em pixel art com glitch ocasional, sobre um telefone numa mesa escura.
- Som: chuva; de tempos em tempos, um telefone tocando três vezes ao longe.
- **Apenas 3 botões:**
  - **Novo jogo** — se houver save, confirma: *"Isso apaga seu progresso. Continuar?"*
  - **Continuar** — mostra o dia salvo; desativado se não houver save ou se o jogo foi zerado.
  - **Opções** — volume geral, volume do ambiente, volume dos efeitos, tela cheia.

### 2.2 Telas de transição

Tela preta, **todo texto em vermelho**.

| Dia | Texto |
|---|---|
| 1 | Faltam 6 dias |
| 2 | Faltam 5 dias |
| 3 | Faltam 4 dias |
| 4 | Faltam 3 dias |
| 5 | Faltam 2 dias |
| 6 | Falta 1 dia |
| 7 | É hoje |

### 2.3 Sequências

| Situação | Sequência |
|---|---|
| Novo jogo | Aviso de fone → "Faltam 6 dias" → "Delegacia" → delegacia |
| Fim das ligações | Jogador interage com a porta da delegacia → "Casa" → casa |
| Dormiu (dias 1–6) | Salva → "Faltam X dias" (dia seguinte) → "Delegacia" → delegacia (sem voltar ao menu) |
| Morreu | Jumpscare → estática → frase do monstro → tela inicial |
| Continuar após morrer | "Faltam X dias" → "Casa" → casa (pula a delegacia) |
| Continuar após dormir e fechar o jogo | "Faltam X dias" → "Delegacia" → delegacia |
| Dormiu no dia 7 | Final (seção 10) |

**Aviso de fone** (só no Novo jogo, antes da primeira transição): ícone de fone em pixel art + *"Para uma melhor experiência, jogue com fones de ouvido."* Some sozinho após alguns segundos.

### 2.4 Pausa (Esc)

- Congela tudo (tempo, medo, chances, monstros, sons de jogo).
- Botões: **Voltar ao jogo**, **Opções**, **Sair para o menu** (avisa que o progresso da noite atual será perdido).

### 2.5 Morte

1. Jumpscare do monstro (seção 13.6).
2. Tela preta com **chiado** e **estática vermelha** que vai diminuindo até o preto total.
3. Frase do monstro em vermelho.
4. Volta para a tela inicial.

### 2.6 Save

- Salva ao terminar cada noite (ao dormir), no `localStorage`.
- Guarda: dia atual e se a delegacia desse dia já foi concluída.
- Após zerar o jogo, o save é marcado como concluído e **Continuar fica desativado**.

---

## 3. Delegacia

### 3.1 Funcionamento

- Câmera frontal, 2D. **Artur não anda.**
- O jogador interage com objetos clicando neles.
- O telefone toca; o jogador clica para atender. A ligação aparece na **caixa de diálogo** (seção 11.1), com o nome de quem fala.
- Quando todas as ligações do dia terminam, a **porta** fica interativa. Antes disso, clicar nela não faz nada (sugestão: Artur diz *"Ainda não terminou o turno."*).

### 3.2 Objetos

| Objeto | Função |
|---|---|
| Telefone | Ligações do dia |
| Calendário | Mostra o dia; dia 7 circulado com "Aniversário da Clara" |
| Planta | Decoração |
| Relógio de parede | Mostra a hora; **trava em 23:41, 23:44 ou 23:47 durante ligações-alucinação** |
| Bilhete do Marcos | Aparece na mesa nos dias 1–6 |
| Porta | Leva para casa ao fim das ligações |

### 3.3 Bilhetes do Marcos

| Dia | Bilhete |
|---|---|
| 1 | "Deixei café na garrafa. Qualquer coisa me liga." |
| 2 | "A psicóloga ligou de novo. Você faltou outra vez." |
| 3 | "O pessoal da rua perguntou de você. A gente sente sua falta na viatura." |
| 4 | "Você ainda está tomando os remédios?" |
| 5 | "Você não precisava pegar plantão essa semana. Tira uns dias." |
| 6 | "Essa semana você tá diferente. Tá conseguindo dormir?" |
| 7 | *(sem bilhete)* |

### 3.4 Ligações por dia

| Dia | Reais | Alucinação | Total |
|---|---|---|---|
| 1 | 2 | — | 2 |
| 2 | 3 | 1 | 4 |
| 3 | 2 | 1 | 3 |
| 4 | 3 | 1 | 4 |
| 5 | 2 | 1 | 3 |
| 6 | 3 | 1 | 4 |
| 7 | 3 | — | 3 |

Texto completo de todas as ligações: **Apêndice A**.

### 3.5 Ligações-alucinação: efeitos e pistas

Só nas alucinações (nunca nas reais):

- Voz distorcida (eco, tom oscilando, cortes, trechos invertidos quase imperceptíveis).
- Ruídos da noite da tragédia: gerador falhando, porta rangendo, "parabéns pra você" quase inaudível, chiado de balão.
- **Lâmpada da delegacia pisca** durante a ligação.
- **Relógio trava** em 23:41 / 23:44 / 23:47.
- **Cabo do telefone aparece fora da tomada** enquanto a ligação acontece.
- Quem liga chama Artur pelo nome sem ele ter se apresentado.
- Tela com vinheta escura e granulado leve.

---

## 4. Casa

### 4.1 Câmera e movimento

- Câmera de cima, na diagonal, 2D, seguindo Artur. O jogador vê só uma parte da casa por vez.
- Artur **anda** e **corre**. Correr gasta **estamina**, que recarrega sozinha.
- Passos de Artur têm som (mais leves que os do Artur distorcido, mas parecidos o bastante para confundir).

### 4.2 Mapa

Arquivo de referência: `planta-casa.svg`. Casa térrea (**sem segundo andar**), cerca de 31 m × 20 m.

| Cômodo | Conexões | Objetos fixos | Pode aparecer |
|---|---|---|---|
| Entrada | Porta da frente; corredor de cima | — | — |
| Corredor de cima | Entrada, quarto da Clara, banheiro social, quarto do Artur, corredor da esquerda, hall | Relógio de parede (usado no final) | Pilha, chave |
| Quarto da Clara | Corredor de cima | — | — **(porta sempre fechada)** |
| Banheiro social | Corredor de cima (beco sem saída) | Pia, espelho | Remédio, chave |
| Quarto do Artur | Corredor de cima; banheiro da suíte | **Cama** | Remédio, pilha, chave |
| Banheiro da suíte | Quarto do Artur (beco sem saída) | Espelho, armário | Remédio, chave |
| Hall | Corredor de cima, sala, escritório | — | Pilha |
| Sala | Corredor de cima (em frente à entrada), hall, cozinha | **TV, telefone fixo** | Remédio, pilha, chave |
| Cozinha | Sala, corredor da esquerda, escritório | Geladeira, pia | Remédio, pilha, chave |
| Escritório | Hall, cozinha, varanda externa | Coisas da época de policial | Remédio, pilha, chave |
| Corredor da esquerda | Corredor de cima, cozinha, quintal (porta dos fundos) | — | Pilha, chave |
| Quintal (externo) | Corredor da esquerda, varanda | **Gerador** | — |
| Varanda externa (externo, chuva) | Quintal, escritório | — | — |

- Cada cômodo tem iluminação ligada ao gerador.
- Quarto da Clara: ao interagir, Artur diz *"Não posso entrar, está trancado."*
- Circuitos fechados (sala–cozinha–corredores–escritório) permitem fugir em perseguições.
- O gerador tem duas rotas: pela cozinha/corredor da esquerda ou pela varanda externa.

### 4.3 As duas fases da noite

- **Luz acesa = recuperação.** Só acontecem alucinações (assustam, não matam). É quando o jogador baixa o medo, pega remédio e pilha, acha chaves e tenta dormir.
- **Luz apagada = sobrevivência.** Alucinações param (exceto passos falsos). Monstros caçam. Objetivo: chegar ao gerador e religar.

### 4.4 Gerador

- Fica no quintal. Religar: **segurar F** por alguns segundos com barra de progresso; soltar perde o progresso.
- **Sabotagem:** só acontece quando Artur está **longe** do gerador.
- **Chance de cair:** cresce com o tempo e **zera** quando o gerador cai. A velocidade de crescimento diminui ao longo da noite, e a chance tem um **teto** (nunca vira certeza).
- **Queda garantida:** se o caos da noite terminou e o gerador ainda não caiu nenhuma vez, ele cai assim que Artur estiver longe.
- **Medo chegando a 100%:** o gerador cai **na hora**, mesmo com Artur perto. Se o medo continuar em 100%, o gerador pode ser religado normalmente (ele só cai de novo se o medo baixar e voltar a 100%).
- Enquanto houver uma porta trancada, a chance cresce mais rápido (×1,5).
- Toda queda faz o medo subir um pouco e toca o som característico do gerador falhando.

### 4.5 Medo

- Começa em **0%** em toda noite. Ao chegar, Artur diz: *"Estou exausto... só quero dormir."*
- **Cai:** com luz acesa e sem alucinação acontecendo; ou com remédio.
- **No escuro:** fica estagnado. Só sobe com eventos e só cai com remédio.
- **Sobe:** alucinações, perseguições, queda do gerador, ações erradas.
- A dificuldade do dia aumenta **quanto** cada evento soma.
- **100%:** gerador cai na hora + perseguição garantida do Invasor furioso + eventos podem acontecer ao mesmo tempo.

### 4.6 Caos e recuperação (curva da noite)

- **A noite começa no evento garantido a caminho do quarto (4.8).** Antes dele não há alucinações, o relógio da noite (caos, curva) fica parado e o gerador não sofre sabotagem. Esse evento é a **primeira alucinação da noite** e dá **+25 de medo** de uma vez, no lugar do valor da tabela 9.3.
- **Fase de caos** (do início até X segundos, X definido por noite): não há janelas de calma; alucinações frequentes. Se o medo estiver **baixo (abaixo de 5%)** nessa fase, uma alucinação é disparada na hora. O jogo nunca trava o medo artificialmente — garante eventos.
- Sempre há um intervalo mínimo de **3 s** entre o fim de uma alucinação e a próxima.
- **Fase de recuperação** (depois de X): após cada alucinação há uma **janela de calma** garantida (nenhuma nova alucinação). As janelas crescem ao longo da noite até um tamanho terminal definido pela noite.
- Ao longo da noite: alucinações ficam menos frequentes (nunca param) e o medo cai mais rápido, aproximando-se de um piso de dificuldade definido por noite.

### 4.7 Dormir

- Artur precisa estar no **quarto** e interagir com a **cama**.
- Se o medo não estiver zerado: *"Não consigo dormir agora, estou com medo."*
- Sequência: tela escurece aos poucos → vários sussurros simultâneos aumentando → **silêncio instantâneo** → noite termina.
- Durante a sequência, **nenhuma alucinação interrompe**. Só o gerador pode cair (chance própria: base sobe com o dia, diminui com o tempo da noite, cai um valor fixo alto toda vez que acontece).

### 4.8 Evento garantido a caminho do quarto

Na primeira vez que Artur se aproxima do quarto na noite (a menos de 3,5 m da porta). **É a primeira alucinação da noite (+25 de medo) e é quando a noite começa** (seção 4.6). Nas noites 5–7 a porta do quarto já começa trancada e a chave está em algum lugar da casa (nunca dentro do quarto):

| Noite | Evento | Fala do Artur |
|---|---|---|
| 1 | Balão | "Ué... quem deixou isso aqui?" |
| 2 | Vulto | "Tem alguém aí?" |
| 3 | Passos | "Que barulho foi esse?" |
| 4 | Luz piscando (sem Helena) | "De novo essa luz..." |
| 5–7 | Porta do quarto trancada | "A porta está trancada... onde eu coloquei a chave?" |

### 4.9 Portas e chave

- Jogador abre e fecha portas. Entidades também.
- **Fechar a porta numa perseguição atrasa o perseguidor por um instante.**
- O jogador **não tranca** portas, só destranca.
- **Evento da tranca** (só com luz acesa): uma porta **fora da visão do jogador** é trancada (som de tranca). Em seguida, o **tilintar de um chaveiro** se move pela casa (é o Invasor, mas **nada aparece na tela** e o evento **não aumenta o medo**). Quando o som para, a chave foi largada num lugar **fora da visão**. Som **posicional** (volume pela distância, lado esquerdo/direito pela direção).
- Chance por noite: 1ª vez alta, 2ª mais rara, 3ª mais ainda (seção 9).
- Regras:
  - Só uma porta trancada por vez.
  - A chave nunca cai dentro do cômodo trancado.
  - A chave não muda de lugar depois de colocada (inclusive se a luz cair).
  - Porta trancada bloqueia os monstros também.
  - Pode trancar qualquer cômodo, inclusive o quarto do Artur.
  - Ao pegar: Artur diz *"Achei."* Ao usar: som de destrancar.

### 4.10 Itens

- **Onde ficam os itens:** remédios, pilhas e a chave são **pequenos** e ficam **em cima dos móveis** (mesas, cômoda, criado-mudo, aparadores, bancada da pia, prateleiras, arquivo, caixas), nunca soltos no chão. Há uma lista de lugares específicos em cada móvel; a cada noite o jogo sorteia entre eles, respeitando o que pode aparecer em cada cômodo (tabela 4.2) e preferindo cômodos diferentes.
- **Remédio:** sorteado entre os lugares possíveis. Quantidade fixa por noite, não acumula. Ao tomar: **glitch rápido na tela** (menos de 1 s: imagem deslocada, cores separadas, linhas cortadas) e o medo cai rápido. Sem custo.
- **Pilha:** sorteada entre os lugares possíveis. Som característico de encaixe. Recarrega a bateria.
- **Lanterna:** só é usada no escuro (liga/desliga com clique esquerdo, mira com mouse). Bateria começa cheia toda noite, gasta só ligada. Abaixo de 20%: a luz falha (aviso). Vazia: não liga. **O cone de luz para nas paredes** (não atravessa paredes nem portas fechadas).

---

## 5. Alucinações (só com luz acesa)

Inevitáveis, sempre aumentam o medo, mais frequentes no começo da noite e diminuindo, **nunca param**. Qualquer alucinação impede dormir naquele momento (porque o medo sobe).

| Alucinação | Como funciona | Reação do jogador |
|---|---|---|
| **Balão vermelho** | Aparece na tela e fica parado ali. Enquanto estiver na tela, o medo sobe aos poucos. | Ir até ele e estourar: voz diz "ops" e o medo para de subir. |
| **Poça de sangue** | Aparece num lugar do mapa **sempre fora do campo de visão** do jogador. Perto: som de goteira e gota caindo do teto. Quando ela entra no campo de visão (na tela e iluminada), o medo sobe **inversamente proporcional à distância** (quanto mais perto, mais rápido), até o valor "errado" da tabela 9.3. | Ficar longe por tempo suficiente: ela some. |
| **Vulto** | Silhueta (forma do Invasor com luz). Ao aparecer na tela, foge de Artur (um pouco mais rápido que ele correndo) até sair da tela. | Fugir para o lado oposto: medo sobe menos. Correr atrás dele: sobe mais. |
| **Luz piscando (comum)** | A luz do cômodo pisca. | Ficar parado: para de piscar mais rápido. |
| **Luz piscando com Helena (rara)** | Pisca → silhueta de Helena → pisca → some. Sons de susto + coração. | Nenhuma (duração fixa). |
| **Passos falsos** | Passos pesados correndo (confunde com o Artur distorcido). **Também acontece no escuro.** | Nenhuma. |
| **TV ligando sozinha** | Só se Artur estiver perto. Chiado; às vezes meia palavra de uma jornalista (prenuncia o final). Medo sobe enquanto ligada. | Interagir com a TV para desligar. |
| **Telefone fixo tocando** | Só se Artur estiver perto. | Deixar tocar até parar: sobe pouco. Atender (interagir): chiado e respiração, sobe muito + coração. |

Toda ação que aumenta muito o medo vem com **som de coração batendo**.

---

## 6. Monstros (só com luz apagada)

| Monstro | Comportamento | Como sobreviver |
|---|---|---|
| **Invasor** | Perseguições periódicas. Com medo em 100%: perseguição garantida, mais agressiva — correr quase não adianta, mas ainda dá para escapar. | Correr, usar portas e os circuitos da casa. |
| **Artur distorcido** | Chance de aparecer no escuro e perseguir. Um pouco mais rápido que Artur correndo. Reconhecido pelos **passos pesados**. Quase invisível no escuro. | Apontar a lanterna: ele **se desfaz em cinzas**. |
| **Clara** | Do nada, risadas de criança diabólicas. A risada é um **aviso**: há um delay para o jogador parar; depois disso, mexer-se faz ela aparecer e correr atrás dele (um pouco mais rápida que Artur correndo) — fuga impossível. A risada sumir é o aviso de que pode voltar a se mexer. | Ficar parado durante as risadas. |
| **Helena** | Ao apontar a lanterna, há chance de ela estar ali. Com a luz nela, vai surgindo como espírito; a cabeça vai se erguendo e o **choro aumenta** conforme fica menos transparente. Visível por completo: mata. | Tirar a lanterna dela antes; ela volta a sumir. |

### Frases da tela de morte (vermelho)

| Monstro | Frase |
|---|---|
| Clara | "Ela só queria brincar de estátua." |
| Helena | "Algumas coisas não devem ser iluminadas." |
| Artur distorcido | "Ele foge da luz. Você foge da verdade." |
| Invasor | "Corra. Você já chegou tarde uma vez." |

---

## 7. Regras de simultaneidade e perseguições

- Com medo abaixo de 100%: perseguição do Invasor **não** coincide com as risadas da Clara nem com o Artur distorcido.
- Com medo em 100%: os eventos podem coincidir.
- Durante qualquer perseguição:
  - medo sobe um pouco;
  - **som:** coração batendo forte + respiração ofegante de Artur;
  - **visual:** bordas da tela escurecem e pulsam no ritmo do coração + leve tremor de câmera.

---

## 8. Dificuldade por dia

A cada dia aumentam:
- frequência dos eventos paranormais e dos monstros;
- quanto cada evento soma no medo;
- chance do gerador cair (durante a noite e na hora de dormir);
- duração do caos obrigatório;
- e diminuem as janelas de calma e a facilidade de baixar o medo.

## 9. Balanceamento (valores iniciais)

Valores obtidos com simulação Monte Carlo (1.500 noites por dia e por perfil de jogador). **Todos devem ficar num arquivo `config/balance` para ajuste no protótipo.** Unidade de tempo: segundos.

### 9.1 Valores por noite

| Parâmetro | D1 | D2 | D3 | D4 | D5 | D6 | D7 |
|---|---|---|---|---|---|---|---|
| Duração do caos (s) | 90 | 110 | 130 | 150 | 170 | 190 | 210 |
| Taxa de alucinação no início (por s) | 0,100 | 0,107 | 0,114 | 0,121 | 0,129 | 0,136 | 0,143 |
| Taxa mínima de alucinação (por s) | 0,025 | 0,028 | 0,031 | 0,033 | 0,036 | 0,039 | 0,042 |
| Janela de calma terminal (s) | 45 | 42,5 | 40 | 37,5 | 35 | 32,5 | 30 |
| Multiplicador de medo | 1,00 | 1,03 | 1,07 | 1,10 | 1,13 | 1,17 | 1,20 |
| Queda do medo no início (%/s) | 0,30 | 0,28 | 0,27 | 0,25 | 0,23 | 0,22 | 0,20 |
| Queda do medo terminal (%/s) | 0,90 | 0,84 | 0,78 | 0,73 | 0,67 | 0,61 | 0,55 |
| Gerador: incremento do risco (por s) | 0,00012 | 0,00013 | 0,00015 | 0,00016 | 0,00017 | 0,00019 | 0,00020 |
| Gerador: teto do risco (por s) | 0,0060 | 0,0067 | 0,0073 | 0,0080 | 0,0087 | 0,0093 | 0,0100 |
| Gerador na hora de dormir: chance base | 45% | 50% | 55% | 60% | 65% | 70% | 75% |
| Eventos de monstro no escuro (por s) | 1/40 | 1/29 | 1/22,5 | 1/18,5 | 1/15,6 | 1/13,6 | 1/12 |
| Remédios na casa | 4 | 4 | 4 | 3 | 3 | 3 | 3 |
| Pilhas na casa | 3 | 3 | 3 | 2 | 2 | 2 | 2 |

### 9.2 Fórmulas

- **Taxa de alucinação** em `t`: `min + (inicio − min) · e^(−t/180)`.
- **Janela de calma** (só depois do caos): `calma_terminal · (1 − e^(−(t − caos)/120))`.
- **Queda do medo** (luz acesa, sem alucinação): `terminal − (terminal − inicio) · e^(−t/150)` por segundo.
- **Risco do gerador** (por segundo, só com Artur longe): a cada segundo soma `incremento · e^(−t/300)`, limitado ao teto. Zera quando o gerador cai.
- **Gerador na hora de dormir:** `base · e^(−t/420)`. Cada vez que cair durante o sono, a base perde **35 pontos percentuais** (mínimo 0).
- **Evento da tranca:** primeira tentativa entre 60 e 400 s; chances 80% → 30% → 10%; intervalo de 120 a 300 s entre tentativas.

### 9.3 Quanto cada alucinação soma no medo (antes do multiplicador)

> **Ajuste do protótipo:** todos os valores desta tabela são multiplicados por **2** (`hallucinationFearScale` no `config/balance`). A primeira alucinação da noite (evento do quarto, 4.8) dá +25 no lugar do valor da tabela.

| Alucinação | Reação certa | Reação errada / demorada |
|---|---|---|
| Balão (total enquanto visível) | 6 | 18 |
| Vulto | 5 | 12 |
| Luz piscando (comum) | 3 | 7 |
| Luz piscando com Helena | 12 | 12 |
| Passos falsos | 6 | 6 |
| Poça de sangue | 4 | 11 |
| TV | 5 | 13 |
| Telefone fixo | 4 | 14 |

Outros: queda do gerador **+4**; cada perseguição **+6**; remédio **−30**; pilha **+40% de bateria**.

### 9.4 Valores de movimento e tempos (iniciais, não simulados — ajustar no protótipo)

| Item | Valor |
|---|---|
| Artur andando | 2,5 m/s (era 3,5; reduzido no protótipo) |
| Artur correndo | 4,0 m/s (1,6× andar) |
| Estamina | 6 s de corrida; recarrega em 10 s (só sem correr) |
| Vulto | 1,1× Artur correndo |
| Invasor (perseguição normal) | 0,92× Artur correndo |
| Invasor (medo 100%) | 0,98× Artur correndo |
| Artur distorcido | 1,08× Artur correndo |
| Clara | 1,12× Artur correndo |
| Atraso ao fechar porta numa perseguição | 1,2 s |
| Clara: delay entre o início da risada e a proibição de mexer | 1,2 s |
| Clara: duração da risada | 4 a 6 s |
| Helena: luz contínua para aparecer por completo | 2,5 s (some 2× mais rápido) |
| Artur distorcido: luz contínua para virar cinzas | 0,6 s |
| Lanterna: bateria cheia | 90 s de uso contínuo |
| Gerador: segurar F | 3 s |
| Sequência de sono | 8 s |

### 9.5 Resultado da simulação (chance de vencer a noite)

| Noite | Jogador bom | Jogador médio | Jogador ruim | Duração média (bom) |
|---|---|---|---|---|
| 1 | 99% | 93% | 82% | 4,4 min |
| 2 | 97% | 89% | 71% | 5,1 min |
| 3 | 95% | 85% | 58% | 5,7 min |
| 4 | 95% | 79% | 39% | 6,6 min |
| 5 | 91% | 71% | 20% | 7,6 min |
| 6 | 88% | 56% | 7% | 8,7 min |
| 7 | 85% | 33% | 1% | 10,1 min |

Quedas de gerador por noite: ~1,5 (D1) a ~2,5 (D7). Nenhuma noite trava sem possibilidade de dormir.

**Recomendação:** incluir um **modo debug** (tecla oculta) que mostra medo, risco do gerador, janela de calma e timers na tela, para ajustar jogando.

---

## 10. Final (dia 7)

1. A gameplay do dia 7 corre normalmente até Artur dormir.
2. Artur acorda na madrugada com o **telefone fixo da sala** tocando. As três ligações acontecem às **23:41, 23:44 e 23:47**. O relógio do corredor, no caminho entre a cama e o telefone, mostra o mesmo horário. **Fica ambíguo** se as ligações são reais.
   - **1ª:** Helena — "Artur, a luz caiu. O gerador não liga... Me liga de volta."
   - **2ª:** Helena, com medo — "Tem alguém na porta dos fundos. Por favor, atende... Você prometeu que ia estar aqui."
   - **3ª:** Helena, sussurrando — "A gente tá escondida no quarto da Clara. A Clara tá comigo..." → passos no corredor → porta rangendo → **gritos** → a linha cai.
3. A tela escurece. **Nada é mostrado.**
4. Uma TV liga com a reportagem:

> "Um ex-policial de 41 anos foi encontrado morto em sua casa, em Vale Sereno. Segundo a perícia, a morte está relacionada ao uso excessivo de medicamentos controlados. Artur Lemos havia sido afastado das ruas há um ano, após a morte da esposa, Helena, e da filha, Clara, durante uma invasão à residência da família no dia do aniversário da filha. O criminoso nunca foi identificado."

5. Créditos rolando com chuva ao fundo.
6. Tela: *"Se você estiver passando por um momento difícil, ligue 188."* (CVV)
7. Volta para a tela inicial (Continuar desativado).

---

## 11. Interface (HUD) — casa

- **Barra de medo:** grande, vermelha, canto superior esquerdo.
- **Rosto do Artur** ao lado da barra de medo, em pixel art. A troca é instantânea com um tremor rápido do ícone.

| Medo | Rosto |
|---|---|
| 0–19% | Cansado, olheiras, olhar vazio |
| 20–39% | Sobrancelhas tensas, olhando de lado |
| 40–59% | Suando, olhos mais abertos, boca entreaberta |
| 60–79% | Olhos arregalados, pupilas pequenas, tremendo de leve |
| 80–99% | Pânico, boca aberta, ícone treme e pisca |
| 100% | Distorcido, quase o rosto do Artur distorcido, glitch rápido |

- **Barra de estamina:** fina, menor, **azul**, abaixo do medo.
- **Barra de bateria:** fina, menor, **amarela**, abaixo da estamina.

### 11.1 Caixa de diálogo

Todas as falas do jogo (Artur em casa, ligações da delegacia, bilhetes lidos etc.) aparecem numa caixa de diálogo. Ela **substitui as vozes por IA**.

- Caixa escura na parte de baixo da tela, com uma **etiqueta com o nome de quem fala** (ex.: "Artur", "Marcos", "Senhora").
- O texto aparece **sendo digitado**, letra por letra, com pequenas pausas na pontuação (vírgula, ponto, reticências).
- A caixa **fica na tela até o jogador apertar Espaço**:
  - Espaço com o texto ainda sendo digitado → mostra o texto inteiro na hora.
  - Espaço com o texto completo → passa para a próxima fala ou fecha a caixa.
- Um indicador piscando (▼) avisa que o texto terminou e dá para avançar.
- Em casa, Artur fica parado enquanto a caixa está aberta.
- Na delegacia, clicar também avança (seção 12).

---

## 12. Controles

### Casa

| Ação | Tecla |
|---|---|
| Andar | W A S D |
| Correr | Shift (segurar) |
| Mirar a lanterna | Mouse |
| Ligar/desligar lanterna | Clique esquerdo |
| Interagir (cama, TV, telefone, portas, remédio, pilha, chave) | F |
| Religar o gerador | F (segurar) |
| Avançar diálogo | Espaço |
| Pausa | Esc |

### Delegacia

| Ação | Controle |
|---|---|
| Interagir com objetos | Clique |
| Avançar diálogo | Espaço ou clique |
| Pausa | Esc |

---

## 13. Visual

### 13.1 Estilo geral

- Pixel art, paleta escura e dessaturada (azuis-acinzentados, marrons, preto), com **vermelho** como cor de destaque (textos, balão, sangue, barra de medo).
- Iluminação dinâmica: com luz acesa, cômodos com luz amarelada e fraca; no escuro, só o cone da lanterna (com bordas suaves e poeira no feixe, parando nas paredes).
- **Só o cômodo onde Artur está fica iluminado.** Os outros cômodos que aparecem na tela ficam bem mais escuros (quase pretos), com a luz vazando pelas portas abertas. O cômodo vizinho só se revela quando Artur entra nele.
- A transição de luz só acontece em **portas**. Áreas ligadas por vão sem porta acendem juntas: os três corredores (de cima, da esquerda e hall) são uma área só, e o quintal com a varanda externa também.
- Chuva visível nas áreas externas e nas janelas; relâmpagos raros iluminam a casa por um instante.
- Leve granulado e vinheta em toda a tela.

### 13.2 Artur

- Homem de 41 anos, magro, ombros caídos, barba por fazer, olheiras fundas.
- Camisa social amarrotada e calça escura (roupa do turno); na delegacia, crachá de atendente.
- Anima com passos arrastados ao andar; ao correr, corpo inclinado e respiração visível.

### 13.3 Delegacia (câmera frontal)

- Sala pequena de atendimento noturno, vista de frente: mesa de madeira gasta com o **telefone** antigo (de fio) no centro, uma luminária de mesa e papéis espalhados.
- Na parede ao fundo: **calendário** à esquerda, **relógio** redondo no alto, um quadro de avisos com cartazes de desaparecidos.
- **Planta** num vaso no canto da mesa.
- **Bilhete do Marcos** (papel amarelo) preso na luminária.
- **Porta** de vidro fosco à direita, com a palavra "SAÍDA".
- Lâmpada fluorescente no teto (é ela que pisca nas alucinações).
- Janela com chuva escorrendo.

### 13.4 Casa (câmera de cima, diagonal)

- Casa antiga e grande, com piso de taco, papel de parede desbotado e móveis cobertos de poeira — Artur parou de cuidar dela.
- **Sala:** sofá velho, TV de tubo, estante, telefone fixo numa mesinha.
- **Cozinha:** louça acumulada na pia, geladeira com desenhos de criança presos.
- **Quarto do Artur:** cama desarrumada, frascos de remédio vazios no criado-mudo.
- **Quarto da Clara:** porta fechada com adesivos infantis desbotados.
- **Escritório:** mesa com pastas, farda antiga pendurada, caixas.
- **Banheiros:** azulejos encardidos, espelho manchado.
- **Quintal:** lama, chuva, gerador velho sob um pequeno telhado com lâmpada externa.
- **Varanda externa:** piso molhado, chuva caindo ao lado, janelas da casa.

### 13.5 Monstros

**Invasor**
- No jogo: capa de chuva preta encharcada, capuz; rosto em escuro total. A capa pinga sem parar; anda rígido, como um manequim.
- Jumpscare: o escuro do capuz racha e se abre num **sorriso enorme e distorcido** — cantos da boca quase nas orelhas, dentes demais e desalinhados, gengiva exposta (o rosto que a mente de Artur inventou para ele). Cabeça tremendo de forma irregular.

**Artur distorcido**
- No jogo: sprite quase todo **preto**, difícil de ver no escuro. Só o **distintivo** no peito reflete a lanterna, e há dois pontos pálidos no lugar dos olhos. Alto, curvado, braços longos que quase arrastam no chão. **Boca costurada** com linha grossa. Pele rachada como carvão. Cabeça dá trancos para os lados. **Sem rastro de cinzas.** Ao ser iluminado, **se desfaz em cinzas**.
- Jumpscare: os pontos da costura **arrebentam um por um**, a boca se abre rasgando num grito; olhos brancos; glitch alternando com o rosto normal do Artur. **Sem nuvem de cinzas.**

**Helena** (na linha da Samara)
- No jogo: cabelo preto, longo e encharcado cobrindo o rosto; camisola branca suja; movimentos travados, como imagem pulando frames; dedos longos demais pingando água. Conforme aparece, a **cabeça se ergue devagar** até olhar direto para o jogador.
- Jumpscare: o cabelo se abre — pele cinza, olhos sem íris, **marcas de lágrimas pretas e secas** do olho ao queixo, de quem chorou muito. Maxilar desloca além do normal. Grito misturado com **tom de linha ocupada**.

**Clara**
- No jogo: menina pequena, vestido de festa manchado, chapéu de aniversário torto, rosto de **boneca de porcelana rachada**, olhos totalmente pretos, cabeça num ângulo impossível, segura o barbante de um **balão estourado**. Na perseguição, **corre de quatro como uma aranha**, rápido e desconjuntado, com estalos.
- Jumpscare: aparece de costas; a cabeça gira para trás com estalo seco; a porcelana racha mais; a boca abre larga demais; a risada distorce até virar grito.

### 13.6 Estrutura dos jumpscares (~1,2 s)

1. Todo o som corta por 0,2 s.
2. Monstro toma a tela com animação de 3–4 frames, tremor e glitch. Sprites de jumpscare são **maiores e mais detalhados** que os do jogo.
3. Grito do monstro + trecho escondido dos gritos da 3ª ligação final.
4. Corta para a sequência de morte (seção 2.5).

### 13.7 Cena da reportagem

- Tela cheia de uma TV de tubo, imagem com linhas de varredura e chiado leve.
- Jornalista em pixel art, fundo de estúdio simples com a faixa "PLANTÃO — VALE SERENO".
- Durante a fala, aparece uma foto antiga (borrada) da casa da Rua das Acácias.

---

## 14. Áudio

### 14.1 Ambiente

- Em casa: **chuva de fundo + ruído branco**, o tempo todo.
- Delegacia: chuva na janela, zumbido da lâmpada fluorescente.

### 14.2 Efeitos (lista para produzir)

Passos do Artur (andar/correr), passos pesados do distorcido, respiração ofegante, coração batendo, gerador falhando, gerador ligando, porta abrindo/fechando, tranca, destrancar, chaveiro tilintando (posicional), goteira, gota caindo, estouro de balão + "ops", TV ligando com chiado, telefone fixo tocando, telefone da delegacia tocando, encaixe de pilha, glitch do remédio, clique da lanterna, lanterna falhando, risadas da Clara, estalos da Clara, choro da Helena, sussurros (sequência de sono), gritos (jumpscares e 3ª ligação), tom de linha ocupada, estática/chiado da morte, trovão.

### 14.3 Vozes

> **Decisão atualizada:** não há mais voz por IA. As falas e ligações aparecem na **caixa de diálogo** (seção 11.1). Áudio de voz fica só para **momentos específicos**, ainda a definir (candidatos: as três ligações finais da Helena, gritos, risadas da Clara, choro da Helena, "ops" do balão). A lista abaixo fica como referência dos personagens que falam (nomes na etiqueta da caixa de diálogo).

- Personagens que falam:

| Tipo | Personagens |
|---|---|
| Únicas | Artur, Marcos, Helena, Clara, jornalista, voz masculina da alucinação do dia 4 |
| Homem adulto (2) | Vizinho, motoristas, homem do carro parado, homem do vidro, homem do bar |
| Homem idoso (1) | Idoso trancado para fora, senhor da esposa que caiu |
| Mulher adulta (2) | Mãe da Júlia, moradora do alarme, mulher do engano, moça da carteira |
| Mulher idosa (1) | Senhora do cachorro, senhora da bicicleta |
| Jovem (1) | Rapaz do pai que não volta |
| Criança (1) | Criança do trote |

### 14.4 Efeitos de voz (só para os momentos com áudio de voz)

Aplicados nos poucos trechos que tiverem voz:
1. Filtro de telefone (passa-faixa ~300–3400 Hz).
2. Chiado de linha com pequenas falhas e estalos.
3. Compressão e leve distorção.
4. Som do ambiente de quem liga (chuva, TV, eco de cômodo, gerador na casa de Helena).
5. Respirações curtas e pausas.

Extras nas alucinações: tom oscilando, eco distante, palavras sumindo, trechos invertidos quase imperceptíveis.

---

## 15. Falas soltas do Artur

| Momento | Fala |
|---|---|
| Chegando em casa | "Estou exausto... só quero dormir." |
| Tentando dormir com medo | "Não consigo dormir agora, estou com medo." |
| Porta da delegacia antes da hora (sugestão) | "Ainda não terminou o turno." |
| Quarto da Clara | "Não posso entrar, está trancado." |
| Porta do quarto trancada | "A porta está trancada... onde eu coloquei a chave?" |
| Achou a chave | "Achei." |
| Eventos garantidos (noites 1–4) | Ver seção 4.8 |

---

## Apêndice A — Ligações completas

Formato: falas na caixa de diálogo (seção 11.1), com o nome de quem fala. *(Itálico)* = efeito sonoro ou ação. Ligações-alucinação usam os efeitos da seção 3.5 e travam o relógio no horário indicado.

### Dia 1

**1. Cachorro latindo (real)**
- **Senhora:** Boa noite, moço. Desculpa ligar a essa hora.
- **Artur:** Pode falar, senhora. Delegacia de Vale Sereno.
- **Senhora:** Tem um cachorro latindo sem parar na rua de trás. Tá assim desde as nove.
- **Artur:** A senhora sabe de qual casa é?
- **Senhora:** Da casa amarela, do seu Jorge. Ele viajou e deixou o bicho sozinho.
- **Artur:** Vou passar pra viatura da área. Boa noite.

**2. Pai que não volta (real)**
- **Jovem:** Oi... é da polícia?
- **Artur:** É sim. O que aconteceu?
- **Jovem:** Meu pai saiu depois do jantar e não voltou. Ele não atende o celular.
- **Artur:** Aconteceu alguma coisa antes dele sair?
- **Jovem:** ...A gente brigou. Ele saiu batendo a porta.
- **Artur:** *(pausa)* Ele deve estar esfriando a cabeça. Se não aparecer até de manhã, liga de novo.

### Dia 2

**1. Festa de aniversário (real)**
- **Vizinho:** Boa noite. Quero reclamar de barulho.
- **Artur:** Pode falar, senhor.
- **Vizinho:** O vizinho tá com festa de aniversário desde a tarde. Criança gritando, música alta...
- **Artur:** Festa de criança, senhor? Já é tarde, logo acaba.
- **Vizinho:** "Logo acaba" foi o que ele me disse três horas atrás.
- **Artur:** Vou registrar. Se continuar, liga de novo.

**2. Batida de carro (real)**
- **Motorista:** Moço, bateram na traseira do meu carro aqui na avenida.
- **Artur:** Alguém se machucou?
- **Motorista:** Não, não. Só o para-choque. Mas o cara tá querendo ir embora.
- **Artur:** Anota a placa dele e não discute. Já mando alguém aí.

**3. Silêncio (alucinação — 23:41)**
- *(chiado)*
- **Artur:** Delegacia de Vale Sereno, boa noite.
- *(chiado... uma respiração)*
- **Artur:** Alô? Consegue me ouvir?
- *(a respiração para de repente)*
- **Artur:** ...Alô?

**4. Bicicleta roubada (real)**
- **Senhora:** Meu filho, que horas abre aí amanhã? Roubaram minha bicicleta.
- **Artur:** O atendimento ao público abre às oito, senhora.
- **Senhora:** Tá bom. Obrigada.
- **Senhora:** Vê se descansa, viu? Sua voz tá tão cansada.
- **Artur:** ...Obrigado, senhora.

### Dia 3

**1. Trancado para fora (real)**
- **Idoso:** Alô? Polícia? Me tranquei pra fora de casa.
- **Artur:** O senhor está bem? Tá em algum lugar coberto?
- **Idoso:** Tô na varanda, mas tá chovendo. Perdi a chave, procurei em todo canto.
- **Artur:** Algum vizinho ou parente tem cópia?
- **Idoso:** Minha filha... mas faz tempo que a gente não se fala.
- **Artur:** Liga pra ela, senhor. Às vezes é só ligar.

**2. Poste caído (real)**
- **Motorista:** Tem um poste caído na estrada velha, perto da ponte.
- **Artur:** Tá bloqueando a pista?
- **Motorista:** Metade. E os fios tão soltos no chão, soltando faísca.
- **Artur:** Não chega perto. Vou acionar a companhia de energia agora.

**3. A voz (alucinação — 23:41)**
- *(chiado, a lâmpada pisca)*
- **Artur:** Delegacia, boa noite.
- **Voz de mulher:** ...Artur?
- **Artur:** Quem tá falando? Como sabe meu nome?
- **Voz de mulher:** ...a luz caiu de novo...
- *(clique)*

### Dia 4

**1. Trote (real)**
- **Criança:** É da polícia?
- **Artur:** É sim. Qual a emergência?
- **Criança:** Tem um ladrão aqui em casa!
- **Artur:** Você tá em segurança? Qual o endereço?
- **Criança:** ...Hahaha! É mentira! *(risadas ao fundo)*
- **Artur:** *(suspira)* Isso não tem graça, garoto.

**2. Carro parado (real)**
- **Homem:** Tem um carro parado na frente da minha casa há duas horas. Farol apagado, alguém dentro.
- **Artur:** Consegue ver a placa?
- **Homem:** Não, tá escuro demais. Mas ele fica olhando pras casas.
- **Artur:** Não sai de casa. Vou mandar uma viatura passar aí.

**3. Rua das Acácias (alucinação — 23:44)**
- *(chiado; voz masculina, calma)*
- **Voz:** Quero denunciar uma invasão.
- **Artur:** Qual o endereço, senhor?
- **Voz:** Rua das Acácias, 47.
- **Artur:** *(pausa)* ...Esse é o meu endereço. Quem tá falando?
- **Voz:** Tem alguém na porta dos fundos.
- *(a linha cai)*

**4. Vidro quebrando (real)**
- **Homem:** Ouvi barulho de vidro quebrando aqui do lado. Acho que foi no vizinho.
- **Artur:** O senhor viu alguém?
- **Homem:** Não... agora tá tudo quieto. Deve ter sido gato.
- **Artur:** Mesmo assim, vou pedir pra viatura dar uma olhada.
- **Homem:** É, melhor prevenir.

### Dia 5

**1. Menina desaparecida (real)**
- **Mãe:** Moço, minha filha não voltou da escola! Ela tem oito anos!
- **Artur:** Calma, senhora. Que horas ela deveria ter chegado?
- **Mãe:** Às seis! Já liguei pra todo mundo, ninguém sabe dela!
- **Artur:** Qual o nome dela? Como ela tava vestida?
- **Mãe:** Júlia... de casaco vermelho e mochila rosa.
- **Artur:** Vou passar pras viaturas agora. Fica perto do telefone.

**2. A mãe de novo (real)**
- **Mãe:** Moço, sou eu de novo, a mãe da Júlia.
- **Artur:** Alguma notícia?
- **Mãe:** Ela tava na casa da amiguinha! A outra mãe esqueceu de me avisar.
- **Artur:** *(pausa longa)* ...Que bom. Abraça ela, senhora.
- **Mãe:** Obrigada, moço. Obrigada mesmo.

**3. A promessa (alucinação — 23:44)**
- *(chiado, a luz pisca, ao fundo um gerador tentando ligar)*
- **Artur:** Delegacia, boa noite.
- **Voz de mulher:** ...você disse que vinha...
- **Artur:** *(pausa)* ...Eu conheço essa voz.
- **Voz de mulher:** ...você prometeu que ia estar aqui...
- *(clique)*

### Dia 6

**1. Queda na cozinha (real)**
- **Senhor:** Minha esposa caiu na cozinha. Ela não consegue levantar.
- **Artur:** Ela tá consciente? Tá falando com o senhor?
- **Senhor:** Tá, tá sim. Mas tá com muita dor na perna.
- **Artur:** Não tenta levantar ela. A ambulância já tá a caminho.
- **Senhor:** Fica comigo na linha até eles chegarem? Por favor.
- **Artur:** Fico sim. Eu tô aqui.

**2. Alarme de carro (real)**
- **Moradora:** Tem um alarme de carro tocando há meia hora. Ninguém aguenta mais.
- **Artur:** Sabe de quem é o carro?
- **Moradora:** Não faço ideia. Mas tô quase descendo com um martelo.
- **Artur:** Não faz isso. Vou mandar alguém ver.

**3. Pai? (alucinação — 23:47)**
- *(chiado; ao fundo, um "parabéns pra você" quase inaudível)*
- **Artur:** Delegacia, boa noite.
- *(silêncio, uma respiração pequena)*
- **Artur:** Tem alguém aí?
- **Criança, sussurrando:** ...pai?
- **Artur:** ...Quem é você?
- *(a linha cai)*

**4. Engano (real)**
- **Mulher:** Alô? Dona Cida?
- **Artur:** Aqui é da delegacia, senhora.
- **Mulher:** Ai, desculpa! Liguei errado, era pra ser a padaria.
- **Artur:** Tudo bem. Boa noite.
- **Mulher:** Boa noite, moço. Desculpa o incômodo.

### Dia 7

**1. Som alto (real)**
- **Homem:** Boa noite. O bar da esquina tá com o som no último volume.
- **Artur:** Já passou do horário permitido. Vou mandar uma viatura.
- **Homem:** Todo fim de semana é isso...
- **Artur:** Vou registrar a reclamação também.

**2. Carteira achada (real)**
- **Moça:** Oi, eu achei uma carteira na rua. O que eu faço?
- **Artur:** Pode trazer aqui na delegacia amanhã.
- **Moça:** Tem documento e uma foto de família dentro... deve fazer falta pra alguém.
- **Artur:** *(pausa)* ...Faz sim. Traz amanhã.

**3. Marcos (real)**
- **Marcos:** Artur? É o Marcos.
- **Artur:** Fala, Marcos.
- **Marcos:** Só liguei pra saber como você tá. Sei que hoje é um dia difícil.
- **Artur:** ...Tô bem.
- **Marcos:** Vai pra casa, descansa. Se precisar, me liga. De verdade.
- **Artur:** Pode deixar.

---

## Apêndice B — Pendências

- Como as pistas das ligações-alucinação (voz distorcida, cortes) aparecem na caixa de diálogo sem áudio de voz (ex.: letras tremendo, trechos apagando).
- Quais momentos específicos terão áudio de voz (seção 14.3).
- Ajuste fino de todos os valores da seção 9 jogando o protótipo.

---

## Apêndice C — Etapas de construção

Cada etapa termina com o jogo rodando e publicado no GitHub Pages para teste.

1. **Base:** projeto Phaser + Vite, repositório no GitHub, publicação no GitHub Pages, arquivo `config/balance` com os valores da seção 9, modo debug.
2. **Casa jogável:** mapa (seção 4.2), Artur andando e correndo, estamina, câmera, portas, colisões.
3. **Luz e medo:** gerador (queda, segurar F), luz acesa/apagada, lanterna com mira e bateria, medo, HUD com o rosto do Artur, remédios e pilhas.
4. **Dormir e curva da noite:** cama, sequência de sono, caos, janelas de calma, gerador no sono.
5. **Alucinações:** todas da seção 5, com reações do jogador.
6. **Monstros:** Invasor, Artur distorcido, Clara, Helena, perseguições, simultaneidade, jumpscares e sequência de morte.
7. **Portas e chave:** evento da tranca com som posicional, eventos garantidos a caminho do quarto.
8. **Delegacia:** cena, objetos, bilhetes, ligações com legenda, pistas das alucinações.
9. **Fluxo completo:** tela inicial, transições, save, pausa, dificuldade por dia.
10. **Final:** madrugada do dia 7, reportagem, créditos, tela do CVV.
11. **Áudio:** ambiente, efeitos e as vozes dos momentos específicos (seção 14.3).
12. **Arte final e polimento:** sprites definitivos, jumpscares detalhados, ajuste de balanceamento.
