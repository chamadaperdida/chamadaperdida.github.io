// =============================================================================
// CHAMADA PERDIDA — Balanceamento (GDD, seção 9)
// =============================================================================
// Este é o ÚNICO lugar onde ficam os números de balanceamento do jogo.
// Para ajustar a dificuldade, mude os valores aqui e recarregue o jogo.
//
// - Unidade de tempo: segundos.
// - Medo: porcentagem de 0 a 100.
// - Chances: 0 a 1 (0.45 = 45%).
// - Listas com 7 valores = um valor por noite, na ordem [D1, D2, D3, D4, D5, D6, D7].
//
// Os valores das seções 9.1–9.3 saíram da simulação Monte Carlo do GDD.
// Os da seção 9.4 são chutes iniciais (não simulados) para ajustar jogando.
// =============================================================================

export const BALANCE = {
  // ---------------------------------------------------------------------------
  // 9.1 Valores por noite  [D1, D2, D3, D4, D5, D6, D7]
  // ---------------------------------------------------------------------------
  perNight: {
    // Ursos de pelúcia na casa (GDD 4.12). Substituem o tempo como o que facilita a noite.
    bearCount: [4, 4, 5, 5, 6, 6, 7],

    // Trava (GDD 4.6): enquanto os ursos coletados forem MENOS que isto, medo abaixo de
    // 5% (luz acesa) dispara uma alucinação na hora.
    bearLock: [2, 2, 2, 3, 3, 3, 3],

    // Intervalo entre alucinações (s), do fim de uma ao começo da próxima:
    // sem nenhum urso e com todos os ursos (fórmula em formulas.js).
    hallucinationGapNoBears: [9, 8.5, 8, 7.5, 7, 6.5, 6],
    hallucinationGapAllBears: [50, 47, 44, 41, 38, 35, 32],

    // Gerador: se ainda não caiu nenhuma vez depois deste tempo (s), cai assim que
    // Artur estiver longe (GDD 4.4).
    generatorGuaranteedDropAt: [90, 110, 130, 150, 170, 190, 210],

    // Multiplicador aplicado a tudo que soma no medo.
    fearMultiplier: [1.00, 1.03, 1.07, 1.10, 1.13, 1.17, 1.20],

    // Queda do medo com luz acesa e sem alucinação (% por segundo). Fixa na noite.
    fearDecay: [0.90, 0.84, 0.78, 0.73, 0.67, 0.61, 0.55],

    // Gerador: quanto o risco de queda cresce por segundo (com Artur longe).
    generatorRiskIncrement: [0.00012, 0.00013, 0.00015, 0.00016, 0.00017, 0.00019, 0.00020],

    // Gerador: teto do risco de queda (por segundo). Nunca vira certeza.
    generatorRiskCap: [0.0060, 0.0067, 0.0073, 0.0080, 0.0087, 0.0093, 0.0100],

    // Gerador na hora de dormir: chance base de cair durante a sequência de sono.
    generatorSleepBaseChance: [0.45, 0.50, 0.55, 0.60, 0.65, 0.70, 0.75],

    // Eventos de monstro no escuro (por segundo). Dobrado no protótipo (GDD: 1/40 … 1/12).
    monsterEventRate: [1 / 20, 1 / 14.5, 1 / 11.25, 1 / 9.25, 1 / 7.8, 1 / 6.8, 1 / 6],

    // Tarefas obrigatórias da lista da rotina (GDD 4.11), fixas por noite.
    tasks: [
      ['jantar', 'louca'],
      ['lixo', 'celular'],
      ['jantar', 'roupa', 'louca'],
      ['regar', 'janelas', 'lixo'],
      ['jantar', 'uniforme', 'louca', 'janelas'],
      ['roupa', 'regar', 'lixo', 'celular'],
      ['jantar', 'roupa', 'uniforme', 'janelas', 'celular'],
    ],

    // Itens espalhados pela casa (quantidade fixa por noite, não acumula).
    medicineCount: [4, 4, 4, 3, 3, 3, 3],

    // Helena: segundos de luz contínua para ela surgir por completo (e matar). Fica mais
    // rápida a cada noite (decidido no protótipo; o GDD começou com 2,5 s fixos).
    helenaRevealSeconds: [2.5, 2.3, 2.1, 1.9, 1.7, 1.5, 1.3],
    batteryCount: [3, 3, 3, 2, 2, 2, 2],
  },

  // ---------------------------------------------------------------------------
  // 9.2 Constantes das fórmulas (usadas em src/systems/formulas.js)
  // ---------------------------------------------------------------------------
  formulas: {
    // Intervalo entre alucinações com k de N ursos:
    // semUrsos + (todosUrsos − semUrsos) · (k/N)^hallucinationGapExponent, com ±20%.
    hallucinationGapExponent: 3.5,
    hallucinationGapJitter: 0.2,

    // Risco do gerador: a cada segundo soma incremento · (1 − generatorRiskBearFactor · k/N).
    generatorRiskBearFactor: 0.7,

    // Gerador ao dormir: base · (1 − generatorSleepBearFactor · k/N).
    generatorSleepBearFactor: 0.6,
    // Cada queda durante o sono tira esse valor da base (35 pontos percentuais, mínimo 0).
    generatorSleepBasePenalty: 0.35,

    // Com uma porta trancada, o risco do gerador cresce mais rápido.
    generatorRiskLockedDoorMultiplier: 1.5,
  },

  // Evento da tranca (seção 9.2 + 4.9)
  lockEvent: {
    firstAttemptMin: 60, // primeira tentativa entre 60 s...
    firstAttemptMax: 400, // ...e 400 s
    chances: [0.80, 0.30, 0.10], // 1ª, 2ª e 3ª vez na noite
    intervalMin: 120, // intervalo entre tentativas
    intervalMax: 300,
  },

  // ---------------------------------------------------------------------------
  // 9.3 Quanto cada alucinação soma no medo (antes do multiplicador da noite)
  //     right = reação certa, wrong = reação errada / demorada
  // ---------------------------------------------------------------------------
  hallucinationFear: {
    balloon: { right: 6, wrong: 18 }, // total enquanto visível
    shadow: { right: 5, wrong: 12 }, // vulto
    flicker: { right: 3, wrong: 7 }, // luz piscando (comum)
    flickerHelena: { right: 12, wrong: 12 }, // luz piscando com Helena
    fakeSteps: { right: 6, wrong: 6 }, // passos falsos
    bloodPool: { right: 4, wrong: 11 }, // poça de sangue
    tv: { right: 5, wrong: 13 },
    landline: { right: 4, wrong: 14 }, // telefone fixo
  },

  // Outros efeitos no medo / bateria
  fearEvents: {
    generatorFailure: 4, // queda do gerador: +4
    chase: 6, // cada perseguição: +6
    medicine: -30, // remédio: −30
  },
  batteryPickup: 40, // pilha: +40% de bateria

  // ---------------------------------------------------------------------------
  // 9.4 Movimento e tempos (iniciais, não simulados — ajustar no protótipo)
  //     Velocidades em metros por segundo. Multiplicadores relativos a Artur correndo.
  // ---------------------------------------------------------------------------
  movement: {
    arturWalk: 2.5, // m/s (GDD começou com 3,5; reduzido no protótipo)
    arturRunMultiplier: 1.6, // correr = 1,6× andar (5,6 m/s)
    staminaRunSeconds: 6, // estamina cheia dura 6 s de corrida
    staminaRechargeSeconds: 10, // recarrega em 10 s (só sem correr)
    // Não está no GDD: depois de esgotar, só volta a correr com 25% de estamina
    // (evita correr aos trancos segurando Shift).
    staminaRecoverThreshold: 0.25,

    // Multiplicadores sobre a velocidade de Artur correndo
    shadow: 2.0, // vulto (GDD começou com 1,1×; aumentado no protótipo)
    intruderChase: 0.80, // Invasor, perseguição normal (GDD começou com 0,92; reduzido no protótipo)
    intruderChaseMaxFear: 0.90, // Invasor com medo em 100% (era 0,98)
    distortedArtur: 1.08, // Artur distorcido
    clara: 1.6, // de quatro, muito rápida (GDD começou com 1,12)
  },

  timings: {
    doorCloseChaseDelay: 1.2, // atraso do perseguidor ao fechar porta
    claraLaughGrace: 1.2, // delay entre o início da risada e a proibição de mexer
    claraLaughMin: 4, // duração da risada: 4 a 6 s
    claraLaughMax: 6,
    helenaRevealSeconds: 2.5, // luz contínua para Helena aparecer por completo
    helenaFadeSpeedMultiplier: 2, // some 2× mais rápido
    distortedArturAshSeconds: 0.6, // luz contínua para virar cinzas
    flashlightBatterySeconds: 90, // bateria cheia = 90 s de uso contínuo
    flashlightLowBatteryWarning: 0.2, // abaixo de 20%: a luz falha
    generatorHoldSeconds: 3, // segurar F para religar
    sleepSequenceSeconds: 8,
  },

  // Tarefas (GDD 4.11 e 9.4)
  tasks: {
    microwaveSeconds: 30, // jantar no micro-ondas (precisa de luz)
    eatSeconds: 5, // comer sentado (segurar F)
    washPlateSeconds: 2, // lavar cada prato (segurar F)
    washerSeconds: 90, // ciclo da máquina de lavar (precisa de luz)
    hangClothesSeconds: 3, // estender a roupa no varal (segurar F)
    canCapacity: 3, // regador: vasos por enchida
    waterPotSeconds: 1.5, // regar cada vaso (segurar F)
    closeWindowSeconds: 1, // fechar cada janela (segurar F)
    ironSeconds: 4, // passar o uniforme (segurar F, precisa de luz)
    reach: 1.0, // distância (m) para interagir com objetos de tarefa
  },

  // Coração (GDD 5 e 7): volume e ritmo pelo medo, medo subindo, alucinação e perseguição
  heart: {
    bpmMin: 62,
    bpmMax: 160,
    volumeMin: 0.15,
    volumeMax: 1.0,
    silentBelow: 0.18, // intensidade abaixo disto: coração não se ouve
    weightFear: 0.45, // medo em 100% sozinho
    weightRising: 0.55, // medo subindo rápido
    weightHallucination: 0.12,
    weightChase: 0.7,
    riseForFull: 4, // pontos de medo por segundo = "subindo no máximo"
    riseSmoothing: 0.8, // s
    jumpFear: 8, // susto de uma vez a partir disto: a próxima batida vem já
  },

  // Ursos (GDD 4.12)
  bears: {
    reach: 0.9, // distância (m) para coletar
    glowAlpha: 0.06, // brilho âmbar bem fraco
    glowScale: 0.75,
    glowRange: 7, // m: só brilha com linha de visão e mais perto que isto
    // Com todos os ursos, o granulado e a vinheta da tela diminuem até esta fração (GDD 13.1)
    calmScreenFactor: 0.3,
  },

  // ---------------------------------------------------------------------------
  // Valores que NÃO estão no GDD (decididos no protótipo — ajustar jogando)
  // ---------------------------------------------------------------------------
  extra: {
    // Gerador: Artur conta como "perto" a menos desta distância (m) — sem sabotagem.
    generatorNearDistance: 8,
    // Distância (m) para segurar F no gerador.
    generatorInteractDistance: 1.6,
    // Lanterna: alcance (m) e abertura do cone (graus, total).
    flashlightRange: 7.5,
    flashlightAngle: 50,
    // Remédio: duração do glitch na tela (s). GDD: menos de 1 s.
    medicineGlitchSeconds: 0.6,
    // Alucinações só começam este tempo (s) depois de fechar a fala de chegada.
    hallucinationStartDelay: 1.5,
    // Multiplica o medo de TODAS as alucinações da tabela 9.3 (decidido no protótipo: 2×).
    hallucinationFearScale: 2,
    // Trava dos ursos (GDD 4.6): dispara alucinação "na hora" com medo abaixo disto (%).
    lowFearTrigger: 5,
    // Intervalo mínimo (s) entre o fim de uma alucinação e a próxima.
    hallucinationMinGap: 3,
    // Luz piscando (comum): duração andando (s) e quantas vezes mais rápido acaba parado.
    flickerSeconds: 5,
    flickerStillSpeed: 2.5,
    // Balão: tempo na tela até o medo chegar no valor "errado" da tabela (s).
    balloonSeconds: 15,
    // TV ligada: tempo até o medo chegar no valor "errado" (s).
    tvSeconds: 12,
    // Telefone fixo: quanto tempo toca se ninguém atender (s).
    landlineRingSeconds: 9,
    // TV e telefone só tocam/ligam com Artur a menos desta distância (m).
    nearDeviceDistance: 7,
    // Vulto: Artur a esta distância (m) de uma porta aberta para a sombra passar do outro lado.
    shadowDoorDistance: { min: 2.5, max: 7 },
    // Fusível: aparece a pelo menos esta distância (m) de Artur, fora do cômodo dele (GDD 4.4).
    fuseMinDistance: 10,
    // Sono: em que momento da sequência (s) o gerador pode cair.
    sleepGeneratorRollMin: 1.5,
    sleepGeneratorRollMax: 6.5,
  },

  // 9.5 Resultado da simulação: ver GDD e scripts/sim-ursos.py (o jogo não usa).
};

export const TOTAL_DAYS = 7;

/**
 * Retorna os valores da seção 9.1 de uma noite específica (dia 1 a 7),
 * já "achatados": nightBalance(3).bearCount === 5.
 */
export function nightBalance(day) {
  const index = Math.min(Math.max(day, 1), TOTAL_DAYS) - 1;
  const night = {};
  for (const [key, values] of Object.entries(BALANCE.perNight)) {
    night[key] = values[index];
  }
  return night;
}
