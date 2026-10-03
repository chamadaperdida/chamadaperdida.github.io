// Evento garantido a caminho do quarto (GDD 4.8). É a PRIMEIRA alucinação da noite
// (+25 de medo) e é quando a noite começa de verdade (relógio, caos, alucinações).
//
// Dispara na primeira vez que Artur chega perto da porta do quarto dele.
// Noites 5–7: a porta do quarto já está trancada e a chave está em algum lugar da casa.

export const BEDROOM_EVENTS = {
  1: { kind: 'balloon', line: 'Ué... quem deixou isso aqui?' },
  2: { kind: 'shadow', line: 'Tem alguém aí?' },
  3: { kind: 'fakeSteps', line: 'Que barulho foi esse?' },
  4: { kind: 'flicker', line: 'De novo essa luz...' },
  5: { kind: 'lockedDoor', line: 'A porta está trancada... onde eu coloquei a chave?' },
  6: { kind: 'lockedDoor', line: 'A porta está trancada... onde eu coloquei a chave?' },
  7: { kind: 'lockedDoor', line: 'A porta está trancada... onde eu coloquei a chave?' },
};

export const BEDROOM_DOOR_ID = 'quartoArtur';
