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
    // Duração da fase de caos (s): sem janelas de calma, alucinações frequentes.
    chaosDuration: [90, 110, 130, 150, 170, 190, 210],

    // Taxa de alucinação no início da noite (alucinações por segundo).
    hallucinationRateStart: [0.100, 0.107, 0.114, 0.121, 0.129, 0.136, 0.143],

    // Taxa mínima de alucinação (por segundo) — nunca chega a zero.
    hallucinationRateMin: [0.025, 0.028, 0.031, 0.033, 0.036, 0.039, 0.042],

    // Tamanho final da janela de calma após cada alucinação (s).
    calmWindowTerminal: [45, 42.5, 40, 37.5, 35, 32.5, 30],

    // Multiplicador aplicado a tudo que soma no medo.
    fearMultiplier: [1.00, 1.03, 1.07, 1.10, 1.13, 1.17, 1.20],

    // Queda do medo com luz acesa e sem alucinação (% por segundo).
    fearDecayStart: [0.30, 0.28, 0.27, 0.25, 0.23, 0.22, 0.20],
    fearDecayTerminal: [0.90, 0.84, 0.78, 0.73, 0.67, 0.61, 0.55],

    // Gerador: quanto o risco de queda cresce por segundo (com Artur longe).
    generatorRiskIncrement: [0.00012, 0.00013, 0.00015, 0.00016, 0.00017, 0.00019, 0.00020],

    // Gerador: teto do risco de queda (por segundo). Nunca vira certeza.
    generatorRiskCap: [0.0060, 0.0067, 0.0073, 0.0080, 0.0087, 0.0093, 0.0100],

    // Gerador na hora de dormir: chance base de cair durante a sequência de sono.
    generatorSleepBaseChance: [0.45, 0.50, 0.55, 0.60, 0.65, 0.70, 0.75],

    // Eventos de monstro no escuro (por segundo).
    monsterEventRate: [1 / 40, 1 / 29, 1 / 22.5, 1 / 18.5, 1 / 15.6, 1 / 13.6, 1 / 12],

    // Itens espalhados pela casa (quantidade fixa por noite, não acumula).
    medicineCount: [4, 4, 4, 3, 3, 3, 3],
    batteryCount: [3, 3, 3, 2, 2, 2, 2],
  },

  // ---------------------------------------------------------------------------
  // 9.2 Constantes das fórmulas (usadas em src/systems/formulas.js)
  // ---------------------------------------------------------------------------
  formulas: {
    // Taxa de alucinação: min + (inicio − min) · e^(−t / hallucinationDecayTau)
    hallucinationDecayTau: 180,

    // Janela de calma (só depois do caos): terminal · (1 − e^(−(t − caos) / calmWindowTau))
    calmWindowTau: 120,

    // Queda do medo: terminal − (terminal − inicio) · e^(−t / fearDecayTau)
    fearDecayTau: 150,

    // Risco do gerador: a cada segundo soma incremento · e^(−t / generatorRiskTau), até o teto.
    generatorRiskTau: 300,

    // Gerador ao dormir: base · e^(−t / generatorSleepTau)
    generatorSleepTau: 420,
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
    shadow: 1.10, // vulto
    intruderChase: 0.92, // Invasor, perseguição normal
    intruderChaseMaxFear: 0.98, // Invasor com medo em 100%
    distortedArtur: 1.08, // Artur distorcido
    clara: 1.12,
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
    // Luz piscando (comum): duração andando (s) e quantas vezes mais rápido acaba parado.
    flickerSeconds: 5,
    flickerStillSpeed: 2.5,
    // Sono: em que momento da sequência (s) o gerador pode cair.
    sleepGeneratorRollMin: 1.5,
    sleepGeneratorRollMax: 6.5,
  },

  // ---------------------------------------------------------------------------
  // 9.5 Resultado da simulação (só referência — o jogo não usa estes números)
  //     Chance de vencer a noite por perfil de jogador.
  // ---------------------------------------------------------------------------
  simulationReference: {
    winChanceGood: [0.99, 0.97, 0.95, 0.95, 0.91, 0.88, 0.85],
    winChanceAverage: [0.93, 0.89, 0.85, 0.79, 0.71, 0.56, 0.33],
    winChanceBad: [0.82, 0.71, 0.58, 0.39, 0.20, 0.07, 0.01],
    averageDurationGoodMinutes: [4.4, 5.1, 5.7, 6.6, 7.6, 8.7, 10.1],
  },
};

export const TOTAL_DAYS = 7;

/**
 * Retorna os valores da seção 9.1 de uma noite específica (dia 1 a 7),
 * já "achatados": nightBalance(3).chaosDuration === 130.
 */
export function nightBalance(day) {
  const index = Math.min(Math.max(day, 1), TOTAL_DAYS) - 1;
  const night = {};
  for (const [key, values] of Object.entries(BALANCE.perNight)) {
    night[key] = values[index];
  }
  return night;
}
