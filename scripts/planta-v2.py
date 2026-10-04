# Gera a proposta de planta nova (rascunho). 1 caractere = 1 m.
GRID = """
................EEEEEE................OOOOOOOOOO
GGGGGGGGG..SSSSSEEEEEE............BBBBOOOOOOOOOO
GGGGGGGGG..SSSSSEEEEEE111111111111BBBBOOOOOOOOOO
GGGGGGGGG22SSSSSEEEEEE111111111111BBBBOOOOOOOOOO
GGGGGGGGG22SSSSSEEEEEEAAAAAAAUUU11BBBBOOOOOOOOOO
GGGGGGGGG22SSSSSEEEEEEAAAAAAAUUU11BBBBOOOOOOOOOO
GGGGGGGGG22SSSSSSSSSSSAAAAAAAUUU11OOOOOOOOOOOOOO
GGGGGGGGG22SSSSSSSSSSSAAAAAAAUUU11OOOOOOOOOOOOOO
GGGGGGGGG22SSSSSSSSSSSAAAAAAAUUU11OOOOOOOOOOOOOO
GGGGGGGGG22SSSSSSSSSSSAAAAAAAUUU11OOOOOOOOOOOOOO
GGGGGGGGG22SSSSSSSSSSSJJJJJJJJJJ1111111111KKKKKK
GGGGGGGGG22SSSSSSSSSSSJJJJJJJJJJ1111111111KKKKKK
GGGGGGGGG22SSSSSSSSSSSJJJJJJJJJJWWWWWWWWWWKKKKKK
GGGGGGGGG22SSSSSSSSSSSJJJJJJJJJJWWWWWWWWWWKKKKKK
QQQQQQQQQ22CCCCCCCCCCCJJJJJJJJJJWWWWWWWWWWKKKKKK
QQQQQQQQQ22CCCCCCCCCCCJJJJJJJJJJWWWWWWWWWWKKKKKK
QQQQQQQQQ22CCCCCCCCCCCJJJJJJJJJJWWWWWWWWWWKKKKKK
QQQQQQQQQ22CCCCCCCCCCCJJJJJJJJJJWWWWWWWWWWKKKKKK
QQQQQQQQQQQCCCCCCCCCCCCCCCCCCCCCWWWWWWWWWWPPPPPP
QQQQQQQQQQQCCCCCCCCCCCCCCCCCCCCCWWWWWWWWWWPPPPPP
QQQQQQQQQQQCCCCCCCCCCCCCCCCCCCCCPPPPPPPPPPPPPPPP
QQQQQQQQQQQCCCCCCCCCCCCCCCCCCCCCPPPPPPPPPPPPPPPP
QQQQQQQQQQQLLLLLLLLDDD33PPPPPPPPPPPPPXXXXXXPPPPP
QQQQQQQQQQQLLLLLLLLDDD33PPPPPPPPPPPPPXXXXXXPPPPP
QQQQQQQQQQQLLLLLLLLDDD33PPPPPPPPPPPPPXXXXXXPPPPP
QQQQQQQQQQQLLLLLLLLDDD33PPPPPPPPPPPPPXXXXXXPPPPP
QQQQQQQQQQQVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
QQQQQQQQQQQVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
QQQQQQQQQQQVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV
""".strip().splitlines()

H = len(GRID)
W = len(GRID[0])
assert all(len(r) == W for r in GRID), [len(r) for r in GRID]

S = 26  # px por metro
OX, OY = 40, 110
EXTERNAL = set('QVP.')

COLORS = {
    'G': '#26282c', 'E': '#1d2a1d', 'S': '#2e261a', 'J': '#33261c', 'C': '#2e1f1a',
    'D': '#2a2218', 'L': '#1f2a30', 'A': '#1a2233', 'U': '#1a2a2e', 'B': '#1a2a2e',
    'K': '#2a1a24', 'O': '#22222a', 'W': '#262230', 'X': '#2a2a22',
    '1': '#3a3c42', '2': '#3a3c42', '3': '#3a3c42',
}

# Portas: (tipo, x, y, eixo, largura). 'h' = na linha horizontal y, de x a x+largura.
# 'v' = na linha vertical x, de y a y+largura. tipo: n normal, c Clara, f frente/portão, o passagem aberta
DOORS = [
    ('f', 18, 0, 'h', 2),   # porta da frente
    ('o', 16, 6, 'h', 6),   # entrada -> sala (aberta)
    ('n', 22, 2, 'v', 2),   # entrada -> corredor dos quartos
    ('n', 25, 4, 'h', 2),   # corredor -> quarto do Artur
    ('n', 29, 6, 'v', 2),   # quarto -> suíte
    ('n', 34, 4, 'v', 2),   # corredor -> banheiro social
    ('n', 35, 10, 'h', 2),  # corredor -> escritório
    ('c', 42, 10, 'v', 2),  # corredor -> quarto da Clara
    ('n', 32, 10, 'v', 2),  # corredor -> sala de jantar
    ('n', 37, 12, 'h', 2),  # corredor -> quarto de hóspedes
    ('o', 22, 11, 'v', 3),  # sala -> sala de jantar (aberta)
    ('n', 11, 8, 'v', 2),   # sala -> corredor de serviço
    ('n', 9, 4, 'v', 2),    # garagem -> corredor de serviço
    ('f', 2, 1, 'h', 5),    # portão da garagem (fechado)
    ('n', 3, 14, 'h', 2),   # garagem -> quintal
    ('n', 11, 15, 'v', 2),  # corredor de serviço -> cozinha
    ('n', 9, 18, 'h', 2),   # corredor de serviço -> quintal (porta lateral)
    ('n', 15, 14, 'h', 2),  # sala -> cozinha
    ('n', 26, 18, 'h', 2),  # sala de jantar -> cozinha
    ('n', 32, 18, 'v', 2),  # hóspedes -> cozinha
    ('n', 14, 22, 'h', 2),  # cozinha -> lavanderia
    ('n', 20, 22, 'h', 2),  # cozinha -> despensa
    ('n', 22, 22, 'h', 2),  # cozinha -> corredor dos fundos
    ('n', 11, 23, 'v', 2),  # lavanderia -> quintal (porta dos fundos)
    ('n', 24, 23, 'v', 2),  # corredor dos fundos -> jardim
    ('n', 22, 26, 'h', 2),  # corredor dos fundos -> varanda
    ('n', 36, 20, 'h', 2),  # hóspedes -> jardim
    ('n', 39, 22, 'h', 2),  # jardim -> depósito
]

LABELS = {
    'G': (4.5, 7.5, 'GARAGEM', 'lixo, ferramentas'),
    'E': (19, 2.6, 'ENTRADA', 'porta da frente'),
    'S': (16.5, 9.2, 'SALA', 'TV, telefone, sofá'),
    'J': (27, 14, 'SALA DE', 'JANTAR'),
    'C': (16.5, 18.3, 'COZINHA', 'geladeira (lista)'),
    'L': (15, 23.8, 'LAVANDERIA', 'máquina, tanque'),
    'D': (20.5, 23.6, 'DESP.', ''),
    'A': (25.5, 6.8, 'QUARTO DO', 'ARTUR'),
    'U': (30.5, 7, 'SUÍTE', ''),
    'B': (36, 2.8, 'BANH.', ''),
    'K': (45, 13.5, 'QUARTO DA', 'CLARA'),
    'O': (42.5, 4.8, 'ESCRITÓRIO', 'coisas da polícia'),
    'W': (37, 15.8, 'HÓSPEDES', 'caixas da festa'),
    'X': (40, 24, 'DEPÓSITO', ''),
    'Q': (4.5, 21, 'QUINTAL', 'varal coberto'),
    'V': (32, 28, 'VARANDA (chuva)', ''),
    'P': (30, 23.8, 'JARDIM', 'vasos'),
}


def cell(x, y):
    if 0 <= x < W and 0 <= y < H:
        return GRID[y][x]
    return '.'


def is_door(axis, x, y):
    for kind, dx, dy, ax, w in DOORS:
        if ax == axis and axis == 'h' and dy == y and dx <= x < dx + w:
            return kind
        if ax == axis and axis == 'v' and dx == x and dy <= y < dy + w:
            return kind
    return None


def needs_wall(a, b):
    if a == b:
        return False
    if a in EXTERNAL and b in EXTERNAL:
        return False
    return True


out = []
pw, ph = W * S + 80, H * S + 150
out.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {pw} {ph}" width="{pw}" height="{ph}" font-family="\'Courier New\', monospace">')
out.append('<defs><pattern id="rain" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(20)"><rect width="10" height="10" fill="#131a22"/><line x1="0" y1="0" x2="0" y2="6" stroke="#2c3a4a" stroke-width="1.5"/></pattern>'
           '<pattern id="mud" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(20)"><rect width="10" height="10" fill="#17140f"/><line x1="0" y1="0" x2="0" y2="6" stroke="#2c3a4a" stroke-width="1.5"/></pattern></defs>')
out.append(f'<rect width="{pw}" height="{ph}" fill="#0e0f12"/>')
out.append(f'<text x="{OX}" y="44" fill="#e6e6e6" font-size="22" font-weight="bold">CHAMADA PERDIDA — Planta nova (rascunho v2)</text>')
out.append(f'<text x="{OX}" y="70" fill="#a8a8a8" font-size="13">48 × 29 m · 1 quadrado = 1 m · amarelo = porta · vermelho = Clara (sempre fechada) · tracejado = passagem aberta</text>')
out.append(f'<text x="{OX + 19*S}" y="{OY - 10}" fill="#6a7280" font-size="12" text-anchor="middle">RUA</text>')

for y in range(H):
    for x in range(W):
        c = GRID[y][x]
        if c == '.':
            continue
        fill = 'url(#mud)' if c == 'Q' else 'url(#rain)' if c in 'VP' else COLORS[c]
        out.append(f'<rect x="{OX + x*S}" y="{OY + y*S}" width="{S+0.5}" height="{S+0.5}" fill="{fill}"/>')

# grade leve
for y in range(H):
    for x in range(W):
        if GRID[y][x] != '.':
            out.append(f'<rect x="{OX + x*S}" y="{OY + y*S}" width="{S}" height="{S}" fill="none" stroke="#ffffff" stroke-opacity="0.03"/>')

# paredes
for y in range(H + 1):
    for x in range(W):
        a, b = cell(x, y - 1), cell(x, y)
        if needs_wall(a, b):
            k = is_door('h', x, y)
            x1, yy = OX + x*S, OY + y*S
            if k is None:
                out.append(f'<line x1="{x1}" y1="{yy}" x2="{x1+S}" y2="{yy}" stroke="#c9c9c9" stroke-width="4" stroke-linecap="square"/>')
for x in range(W + 1):
    for y in range(H):
        a, b = cell(x - 1, y), cell(x, y)
        if needs_wall(a, b):
            k = is_door('v', x, y)
            xx, y1 = OX + x*S, OY + y*S
            if k is None:
                out.append(f'<line x1="{xx}" y1="{y1}" x2="{xx}" y2="{y1+S}" stroke="#c9c9c9" stroke-width="4" stroke-linecap="square"/>')

# portas
for kind, dx, dy, ax, w in DOORS:
    color = {'n': '#e0c34a', 'c': '#d65a5a', 'f': '#8a7a3a', 'o': '#c9c9c9'}[kind]
    if ax == 'h':
        x, y, ww, hh = OX + dx*S + 3, OY + dy*S - 5, w*S - 6, 10
    else:
        x, y, ww, hh = OX + dx*S - 5, OY + dy*S + 3, 10, w*S - 6
    if kind == 'o':
        if ax == 'h':
            out.append(f'<line x1="{OX+dx*S}" y1="{OY+dy*S}" x2="{OX+(dx+w)*S}" y2="{OY+dy*S}" stroke="#c9c9c9" stroke-width="2" stroke-dasharray="6 6"/>')
        else:
            out.append(f'<line x1="{OX+dx*S}" y1="{OY+dy*S}" x2="{OX+dx*S}" y2="{OY+(dy+w)*S}" stroke="#c9c9c9" stroke-width="2" stroke-dasharray="6 6"/>')
    else:
        out.append(f'<rect x="{x}" y="{y}" width="{ww}" height="{hh}" fill="{color}"/>')

# objetos-chave
def obj(x, y, w, h, label, color='#e0c34a'):
    out.append(f'<rect x="{OX+x*S}" y="{OY+y*S}" width="{w*S}" height="{h*S}" fill="#33300f" stroke="{color}" stroke-width="2"/>')
    out.append(f'<text x="{OX+(x+w/2)*S}" y="{OY+(y+h/2)*S+4}" fill="{color}" font-size="11" font-weight="bold" text-anchor="middle">{label}</text>')

obj(1, 24, 3, 2, 'GERADOR')
obj(3, 18, 5, 1, 'varal', '#a8a8a8')
obj(12, 14.2, 2, 1, 'lista', '#d65a5a')

for k, (lx, ly, t1, t2) in LABELS.items():
    big = 15 if len(t1) <= 10 else 13
    out.append(f'<text x="{OX+lx*S}" y="{OY+ly*S}" fill="#f0f0f0" font-size="{big}" font-weight="bold" text-anchor="middle">{t1}</text>')
    if t2:
        out.append(f'<text x="{OX+lx*S}" y="{OY+ly*S+17}" fill="#a8a8a8" font-size="12" text-anchor="middle">{t2}</text>')

# corredores
for lx, ly, t in [(28, 3.2, 'corredor dos quartos'), (37, 11.3, 'corredor'), (10, 11, 'serv.')]:
    out.append(f'<text x="{OX+lx*S}" y="{OY+ly*S}" fill="#c9c9c9" font-size="11" text-anchor="middle">{t}</text>')

out.append('</svg>')
import sys
open(sys.argv[1], 'w', encoding='utf-8').write('\n'.join(out))
print('ok', W, H)
