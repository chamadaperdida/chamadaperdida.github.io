# Simulação da noite com ursos (GDD 9.5). Rode: python scripts/sim-ursos.py
#
# Mede, por noite e por quantidade de ursos coletados, quanto tempo de luz acesa o
# jogador leva para zerar o medo (condição para dormir, junto com as tarefas).
# Modelo simples: os ursos já foram coletados; o jogador reage certo a 75% das
# alucinações; toma remédio quando o medo passa de 35; cada alucinação dura ~5 s
# (o medo não cai enquanto ela acontece). Não modela o escuro nem as tarefas.
import random
import statistics
import sys

HALL = [(6, 18), (5, 12), (3, 7), (12, 12), (6, 6), (4, 11), (5, 13), (4, 14)]  # tabela 9.3
SCALE = 2  # hallucinationFearScale
MULT = [1.00, 1.03, 1.07, 1.10, 1.13, 1.17, 1.20]
DECAY = [0.90, 0.84, 0.78, 0.73, 0.67, 0.61, 0.55]
MEDS = [4, 4, 4, 3, 3, 3, 3]
BEARS = [4, 4, 5, 5, 6, 6, 7]
LOCK = [2, 2, 2, 3, 3, 3, 3]
GAP0 = [9, 8.5, 8, 7.5, 7, 6.5, 6]
GAP1 = [50, 47, 44, 41, 38, 35, 32]
EXP = float(sys.argv[1]) if len(sys.argv) > 1 else 3.5  # hallucinationGapExponent
JIT, MIN_GAP, LOW = 0.2, 3, 5
LIMIT = 1800  # s


def night(d, k, rng):
    gap = GAP0[d] + (GAP1[d] - GAP0[d]) * (k / BEARS[d]) ** EXP
    locked = k < LOCK[d]
    fear, t, busy, meds = 25.0, 0.0, 0.0, MEDS[d]
    nxt = gap * rng.uniform(1 - JIT, 1 + JIT)
    since = 99.0
    dt = 0.25
    while t < LIMIT:
        t += dt
        since += dt
        if busy > 0:
            busy -= dt
            if busy <= 0:
                since = 0.0
                nxt = max(MIN_GAP, gap * rng.uniform(1 - JIT, 1 + JIT))
            continue
        fear = max(0.0, fear - DECAY[d] * dt)
        nxt -= dt
        if meds and fear > 35:
            meds -= 1
            fear = max(0.0, fear - 30)
        if (locked and fear < LOW and since >= MIN_GAP) or nxt <= 0:
            r, w = rng.choice(HALL)
            fear = min(100.0, fear + (r if rng.random() < 0.75 else w) * SCALE * MULT[d])
            busy = 5.0
            continue
        if fear <= 0:
            return t
    return None


def main():
    rng = random.Random(7)
    print('Noite | ursos: mediana para zerar o medo (chance em 5 min)')
    for d in range(7):
        cells = []
        for k in range(BEARS[d] + 1):
            ts = [night(d, k, rng) for _ in range(600)]
            ok = sorted(x for x in ts if x is not None)
            p5 = sum(1 for x in ok if x <= 300) / len(ts)
            med = f'{statistics.median(ok) / 60:.1f} min' if len(ok) > len(ts) / 2 else 'nunca'
            cells.append(f'{k}: {med} ({p5 * 100:.0f}%)')
        print(f'N{d + 1} | ' + ' | '.join(cells))


main()
