// Ligações da delegacia (GDD 3.4 e Apêndice A) e bilhetes do Marcos (GDD 3.3).
//
// Cada ligação: { kind: 'real' | 'hallucination', time?: '23:41' (relógio trava nas
// alucinações), lines: [...] }. Uma fala é { speaker, text }; um efeito sonoro ou ação
// entre parênteses é { fx: 'texto' } (aparece na caixa de diálogo, em cinza, sem nome).

const fx = (text) => ({ fx: text });
const s = (speaker, text) => ({ speaker, text });

export const NOTES = {
  1: 'Deixei café na garrafa. Qualquer coisa me liga.',
  2: 'A psicóloga ligou de novo. Você faltou outra vez.',
  3: 'O pessoal da rua perguntou de você. A gente sente sua falta na viatura.',
  4: 'Você ainda está tomando os remédios?',
  5: 'Você não precisava pegar plantão essa semana. Tira uns dias.',
  6: 'Essa semana você tá diferente. Tá conseguindo dormir?',
};

export const CALLS = {
  1: [
    {
      kind: 'real',
      lines: [
        s('Senhora', 'Boa noite, moço. Desculpa ligar a essa hora.'),
        s('Artur', 'Pode falar, senhora. Delegacia de Vale Sereno.'),
        s('Senhora', 'Tem um cachorro latindo sem parar na rua de trás. Tá assim desde as nove.'),
        s('Artur', 'A senhora sabe de qual casa é?'),
        s('Senhora', 'Da casa amarela, do seu Jorge. Ele viajou e deixou o bicho sozinho.'),
        s('Artur', 'Vou passar pra viatura da área. Boa noite.'),
      ],
    },
    {
      kind: 'real',
      lines: [
        s('Jovem', 'Oi... é da polícia?'),
        s('Artur', 'É sim. O que aconteceu?'),
        s('Jovem', 'Meu pai saiu depois do jantar e não voltou. Ele não atende o celular.'),
        s('Artur', 'Aconteceu alguma coisa antes dele sair?'),
        s('Jovem', '...A gente brigou. Ele saiu batendo a porta.'),
        s('Artur', '(pausa) Ele deve estar esfriando a cabeça. Se não aparecer até de manhã, liga de novo.'),
      ],
    },
  ],

  2: [
    {
      kind: 'real',
      lines: [
        s('Vizinho', 'Boa noite. Quero reclamar de barulho.'),
        s('Artur', 'Pode falar, senhor.'),
        s('Vizinho', 'O vizinho tá com festa de aniversário desde a tarde. Criança gritando, música alta...'),
        s('Artur', 'Festa de criança, senhor? Já é tarde, logo acaba.'),
        s('Vizinho', '"Logo acaba" foi o que ele me disse três horas atrás.'),
        s('Artur', 'Vou registrar. Se continuar, liga de novo.'),
      ],
    },
    {
      kind: 'real',
      lines: [
        s('Motorista', 'Moço, bateram na traseira do meu carro aqui na avenida.'),
        s('Artur', 'Alguém se machucou?'),
        s('Motorista', 'Não, não. Só o para-choque. Mas o cara tá querendo ir embora.'),
        s('Artur', 'Anota a placa dele e não discute. Já mando alguém aí.'),
      ],
    },
    {
      kind: 'hallucination',
      time: '23:41',
      lines: [
        fx('(chiado)'),
        s('Artur', 'Delegacia de Vale Sereno, boa noite.'),
        fx('(chiado... uma respiração)'),
        s('Artur', 'Alô? Consegue me ouvir?'),
        fx('(a respiração para de repente)'),
        s('Artur', '...Alô?'),
      ],
    },
    {
      kind: 'real',
      lines: [
        s('Senhora', 'Meu filho, que horas abre aí amanhã? Roubaram minha bicicleta.'),
        s('Artur', 'O atendimento ao público abre às oito, senhora.'),
        s('Senhora', 'Tá bom. Obrigada.'),
        s('Senhora', 'Vê se descansa, viu? Sua voz tá tão cansada.'),
        s('Artur', '...Obrigado, senhora.'),
      ],
    },
  ],

  3: [
    {
      kind: 'real',
      lines: [
        s('Idoso', 'Alô? Polícia? Me tranquei pra fora de casa.'),
        s('Artur', 'O senhor está bem? Tá em algum lugar coberto?'),
        s('Idoso', 'Tô na varanda, mas tá chovendo. Perdi a chave, procurei em todo canto.'),
        s('Artur', 'Algum vizinho ou parente tem cópia?'),
        s('Idoso', 'Minha filha... mas faz tempo que a gente não se fala.'),
        s('Artur', 'Liga pra ela, senhor. Às vezes é só ligar.'),
      ],
    },
    {
      kind: 'real',
      lines: [
        s('Motorista', 'Tem um poste caído na estrada velha, perto da ponte.'),
        s('Artur', 'Tá bloqueando a pista?'),
        s('Motorista', 'Metade. E os fios tão soltos no chão, soltando faísca.'),
        s('Artur', 'Não chega perto. Vou acionar a companhia de energia agora.'),
      ],
    },
    {
      kind: 'hallucination',
      time: '23:41',
      lines: [
        fx('(chiado, a lâmpada pisca)'),
        s('Artur', 'Delegacia, boa noite.'),
        s('Voz de mulher', '...Artur?'),
        s('Artur', 'Quem tá falando? Como sabe meu nome?'),
        s('Voz de mulher', '...a luz caiu de novo...'),
        fx('(clique)'),
      ],
    },
  ],

  4: [
    {
      kind: 'real',
      lines: [
        s('Criança', 'É da polícia?'),
        s('Artur', 'É sim. Qual a emergência?'),
        s('Criança', 'Tem um ladrão aqui em casa!'),
        s('Artur', 'Você tá em segurança? Qual o endereço?'),
        s('Criança', '...Hahaha! É mentira! (risadas ao fundo)'),
        s('Artur', '(suspira) Isso não tem graça, garoto.'),
      ],
    },
    {
      kind: 'real',
      lines: [
        s('Homem', 'Tem um carro parado na frente da minha casa há duas horas. Farol apagado, alguém dentro.'),
        s('Artur', 'Consegue ver a placa?'),
        s('Homem', 'Não, tá escuro demais. Mas ele fica olhando pras casas.'),
        s('Artur', 'Não sai de casa. Vou mandar uma viatura passar aí.'),
      ],
    },
    {
      kind: 'hallucination',
      time: '23:44',
      lines: [
        fx('(chiado; voz masculina, calma)'),
        s('Voz', 'Quero denunciar uma invasão.'),
        s('Artur', 'Qual o endereço, senhor?'),
        s('Voz', 'Rua das Acácias, 47.'),
        s('Artur', '(pausa) ...Esse é o meu endereço. Quem tá falando?'),
        s('Voz', 'Tem alguém na porta dos fundos.'),
        fx('(a linha cai)'),
      ],
    },
    {
      kind: 'real',
      lines: [
        s('Homem', 'Ouvi barulho de vidro quebrando aqui do lado. Acho que foi no vizinho.'),
        s('Artur', 'O senhor viu alguém?'),
        s('Homem', 'Não... agora tá tudo quieto. Deve ter sido gato.'),
        s('Artur', 'Mesmo assim, vou pedir pra viatura dar uma olhada.'),
        s('Homem', 'É, melhor prevenir.'),
      ],
    },
  ],

  5: [
    {
      kind: 'real',
      lines: [
        s('Mãe', 'Moço, minha filha não voltou da escola! Ela tem oito anos!'),
        s('Artur', 'Calma, senhora. Que horas ela deveria ter chegado?'),
        s('Mãe', 'Às seis! Já liguei pra todo mundo, ninguém sabe dela!'),
        s('Artur', 'Qual o nome dela? Como ela tava vestida?'),
        s('Mãe', 'Júlia... de casaco vermelho e mochila rosa.'),
        s('Artur', 'Vou passar pras viaturas agora. Fica perto do telefone.'),
      ],
    },
    {
      kind: 'real',
      lines: [
        s('Mãe', 'Moço, sou eu de novo, a mãe da Júlia.'),
        s('Artur', 'Alguma notícia?'),
        s('Mãe', 'Ela tava na casa da amiguinha! A outra mãe esqueceu de me avisar.'),
        s('Artur', '(pausa longa) ...Que bom. Abraça ela, senhora.'),
        s('Mãe', 'Obrigada, moço. Obrigada mesmo.'),
      ],
    },
    {
      kind: 'hallucination',
      time: '23:44',
      lines: [
        fx('(chiado, a luz pisca, ao fundo um gerador tentando ligar)'),
        s('Artur', 'Delegacia, boa noite.'),
        s('Voz de mulher', '...você disse que vinha...'),
        s('Artur', '(pausa) ...Eu conheço essa voz.'),
        s('Voz de mulher', '...você prometeu que ia estar aqui...'),
        fx('(clique)'),
      ],
    },
  ],

  6: [
    {
      kind: 'real',
      lines: [
        s('Senhor', 'Minha esposa caiu na cozinha. Ela não consegue levantar.'),
        s('Artur', 'Ela tá consciente? Tá falando com o senhor?'),
        s('Senhor', 'Tá, tá sim. Mas tá com muita dor na perna.'),
        s('Artur', 'Não tenta levantar ela. A ambulância já tá a caminho.'),
        s('Senhor', 'Fica comigo na linha até eles chegarem? Por favor.'),
        s('Artur', 'Fico sim. Eu tô aqui.'),
      ],
    },
    {
      kind: 'real',
      lines: [
        s('Moradora', 'Tem um alarme de carro tocando há meia hora. Ninguém aguenta mais.'),
        s('Artur', 'Sabe de quem é o carro?'),
        s('Moradora', 'Não faço ideia. Mas tô quase descendo com um martelo.'),
        s('Artur', 'Não faz isso. Vou mandar alguém ver.'),
      ],
    },
    {
      kind: 'hallucination',
      time: '23:47',
      lines: [
        fx('(chiado; ao fundo, um "parabéns pra você" quase inaudível)'),
        s('Artur', 'Delegacia, boa noite.'),
        fx('(silêncio, uma respiração pequena)'),
        s('Artur', 'Tem alguém aí?'),
        s('Criança', '(sussurrando) ...pai?'),
        s('Artur', '...Quem é você?'),
        fx('(a linha cai)'),
      ],
    },
    {
      kind: 'real',
      lines: [
        s('Mulher', 'Alô? Dona Cida?'),
        s('Artur', 'Aqui é da delegacia, senhora.'),
        s('Mulher', 'Ai, desculpa! Liguei errado, era pra ser a padaria.'),
        s('Artur', 'Tudo bem. Boa noite.'),
        s('Mulher', 'Boa noite, moço. Desculpa o incômodo.'),
      ],
    },
  ],

  7: [
    {
      kind: 'real',
      lines: [
        s('Homem', 'Boa noite. O bar da esquina tá com o som no último volume.'),
        s('Artur', 'Já passou do horário permitido. Vou mandar uma viatura.'),
        s('Homem', 'Todo fim de semana é isso...'),
        s('Artur', 'Vou registrar a reclamação também.'),
      ],
    },
    {
      kind: 'real',
      lines: [
        s('Moça', 'Oi, eu achei uma carteira na rua. O que eu faço?'),
        s('Artur', 'Pode trazer aqui na delegacia amanhã.'),
        s('Moça', 'Tem documento e uma foto de família dentro... deve fazer falta pra alguém.'),
        s('Artur', '(pausa) ...Faz sim. Traz amanhã.'),
      ],
    },
    {
      kind: 'real',
      lines: [
        s('Marcos', 'Artur? É o Marcos.'),
        s('Artur', 'Fala, Marcos.'),
        s('Marcos', 'Só liguei pra saber como você tá. Sei que hoje é um dia difícil.'),
        s('Artur', '...Tô bem.'),
        s('Marcos', 'Vai pra casa, descansa. Se precisar, me liga. De verdade.'),
        s('Artur', 'Pode deixar.'),
      ],
    },
  ],
};

// Madrugada do dia 7 (GDD 10): as três ligações da Helena no telefone fixo da sala.
// `after` marca o que acontece depois da última fala de cada parte da 3ª ligação
// (a cena toca o som e mostra o efeito em seguida).
export const FINAL_CALLS = [
  {
    time: '23:41',
    lines: [s('Helena', 'Artur, a luz caiu. O gerador não liga... Me liga de volta.')],
  },
  {
    time: '23:44',
    lines: [s('Helena', 'Tem alguém na porta dos fundos. Por favor, atende... Você prometeu que ia estar aqui.')],
  },
  {
    time: '23:47',
    lines: [s('Helena', '(sussurrando) A gente tá escondida no quarto da Clara. A Clara tá comigo...')],
    // Depois da fala: cada efeito com o seu som
    after: [
      { sound: 'steps', line: fx('(passos no corredor)') },
      { sound: 'creak', line: fx('(uma porta rangendo)') },
      { sound: 'screams', line: fx('(gritos)') },
      { sound: 'busy', line: fx('(a linha cai)') },
    ],
  },
];
