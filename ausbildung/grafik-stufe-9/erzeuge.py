#!/usr/bin/env python3
# Erzeugt die SVG-Quellen für Ausbildungsstufe 9 (Animationen, Symbole, Boden).
import math, os, random

ZIEL = "/home/user/raft/ausbildung/grafik-stufe-9/grafik/quellen"
U = "#2b1d2e"

def schreibe(rel, inhalt):
    p = os.path.join(ZIEL, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w") as f:
        f.write(inhalt)

def f(x):
    return f"{x:.1f}".rstrip("0").rstrip(".")

# ---------------------------------------------------------------- Held (Seitenansicht, schaut nach rechts)
OBERSCHENKEL, UNTERSCHENKEL = 27, 27
HUEFTE_X, HUEFTE_Y = 100, 172
KNOECHEL_Y = 222  # Boden: Schuhsohle bei 230 (+ halber Umriss) -> Fußpunkt (100, 230)

def knie(h, fuss):
    """Zwei-Glied-Kinematik: Knie zeigt nach vorn (+x)."""
    hx, hy = h; fx, fy = fuss
    dx, dy = fx - hx, fy - hy
    d = min(math.hypot(dx, dy), OBERSCHENKEL + UNTERSCHENKEL - 0.01)
    a = math.acos((OBERSCHENKEL**2 + d**2 - UNTERSCHENKEL**2) / (2 * OBERSCHENKEL * d))
    basis = math.atan2(dy, dx)
    w = basis - a  # Knie nach vorn (bei Blick nach rechts, y nach unten)
    return hx + OBERSCHENKEL * math.cos(w), hy + OBERSCHENKEL * math.sin(w)

def schuh(x, y, dreh):
    # Knöchel bei (x, y), Spitze nach rechts, Sohle bei y+8
    p = (f"M{f(x-8)} {f(y-6)} L{f(x-8)} {f(y+5)} Q{f(x-8)} {f(y+8)} {f(x-5)} {f(y+8)} "
         f"L{f(x+12)} {f(y+8)} Q{f(x+19)} {f(y+8)} {f(x+17)} {f(y+1)} Q{f(x+14)} {f(y-6)} {f(x+3)} {f(y-6)} Z")
    return f'<path d="{p}" fill="#7a4a2a" transform="rotate({f(dreh)} {f(x)} {f(y)})"/>'

def bein(fuss, hy, hose, dreh):
    h = (HUEFTE_X, hy)
    k = knie(h, fuss)
    d = f"M{f(h[0])} {f(h[1])} L{f(k[0])} {f(k[1])} L{f(fuss[0])} {f(fuss[1])}"
    return (f'<path d="{d}" fill="none" stroke-width="22"/>'
            f'<path d="{d}" fill="none" stroke="{hose}" stroke-width="12"/>'
            + schuh(fuss[0], fuss[1], dreh))

def arm(winkel, sy, hemd, haut):
    sx = 100
    a = math.radians(winkel)
    ex, ey = sx + 22 * math.sin(a), sy + 22 * math.cos(a)
    b = a + math.radians(25)  # Unterarm leicht nach vorn angewinkelt
    hx, hy = ex + 20 * math.sin(b), ey + 20 * math.cos(b)
    d = f"M{f(sx)} {f(sy)} L{f(ex)} {f(ey)} L{f(hx)} {f(hy)}"
    return (f'<path d="{d}" fill="none" stroke-width="20"/>'
            f'<path d="{d}" fill="none" stroke="{hemd}" stroke-width="10"/>'
            f'<circle cx="{f(hx)}" cy="{f(hy)}" r="9" fill="{haut}"/>')

def held(fuss_nah, fuss_fern, dreh_nah, dreh_fern, dy, arm_nah, titel):
    hy = HUEFTE_Y + dy
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240">
  <!-- {titel}. Held von der Seite, schaut nach rechts. Fußpunkt (100, 230) = unten Mitte, in allen Rahmen gleich. -->
  <defs>
    <linearGradient id="haut" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd7b0"/><stop offset="1" stop-color="#f0a97a"/></linearGradient>
    <linearGradient id="hemd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4fb3ff"/><stop offset="1" stop-color="#2275c9"/></linearGradient>
    <linearGradient id="hose" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b5a8e"/><stop offset="1" stop-color="#463a63"/></linearGradient>
  </defs>
  <g stroke="{U}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">
    <!-- hinterer Arm und hinteres Bein (etwas dunkler) -->
    {arm(-arm_nah, 130 + dy, "#2a6fb8", "#e9a37a")}
    {bein(fuss_fern, hy, "#3f3458", dreh_fern)}
    <!-- vorderes Bein -->
    {bein(fuss_nah, hy, "url(#hose)", dreh_nah)}
    <g transform="translate(0 {f(dy)})">
      <!-- Körper -->
      <path d="M80 122 Q102 110 124 122 L126 184 Q102 192 78 184 Z" fill="url(#hemd)"/>
      <!-- Nase (vom Kopf halb verdeckt) -->
      <circle cx="152" cy="84" r="8" fill="url(#haut)"/>
      <!-- Kopf -->
      <ellipse cx="104" cy="72" rx="50" ry="48" fill="url(#haut)"/>
      <!-- Ohr -->
      <ellipse cx="86" cy="80" rx="8" ry="11" fill="url(#haut)" stroke-width="4"/>
      <path d="M85 75 Q90 80 85 86" fill="none" stroke-width="3"/>
      <!-- Haare (hinten und oben) -->
      <path d="M56 92 Q40 40 90 22 Q144 10 156 58 Q140 42 118 46 Q104 38 92 50 Q84 60 84 70 Q74 66 70 76 Q66 86 56 92 Z" fill="#e8742a"/>
    </g>
    <!-- vorderer Arm -->
    {arm(arm_nah, 130 + dy, "url(#hemd)", "url(#haut)")}
  </g>
  <g transform="translate(0 {f(dy)})">
    <!-- Glanz und Gesicht (ohne Umriss) -->
    <ellipse cx="82" cy="36" rx="14" ry="7" fill="#fff" opacity=".35" transform="rotate(-20 82 36)"/>
    <ellipse cx="128" cy="76" rx="6.5" ry="9" fill="{U}"/>
    <circle cx="130" cy="73" r="2.5" fill="#fff"/>
    <ellipse cx="122" cy="96" rx="8" ry="5" fill="#ff8a8a" opacity=".55"/>
    <path d="M130 102 Q139 108 147 101" fill="none" stroke="{U}" stroke-width="4" stroke-linecap="round"/>
    <path d="M86 128 Q104 121 120 127" fill="none" stroke="#fff" stroke-width="5" opacity=".3" stroke-linecap="round"/>
  </g>
</svg>
'''

def figuren():
    # Stehen: Füße nebeneinander, Arme hängen.
    schreibe("figuren/held-steht.svg",
             held((103, KNOECHEL_Y), (96, KNOECHEL_Y), 0, 0, 0, 4, "Stehen"))
    # Laufzyklus: Fuß-Positionen des vorderen Beins über 6 Rahmen (x, y, Schuhdrehung)
    #  1 Kontakt, 2 Tiefpunkt, 3 Durchgang/Hochpunkt, 4-6 dasselbe mit dem anderen Bein.
    G = KNOECHEL_Y
    bahn = [(124, G, -8), (108, G, 0), (92, G, 0), (76, G - 3, 18), (88, G - 14, 10), (110, G - 12, -6)]
    hub = [0, 5, -3, 0, 5, -3]          # Körper hebt/senkt sich (8 px = 3,3 % der Höhe)
    for i in range(6):
        nah = bahn[i]; fern = bahn[(i + 3) % 6]
        armw = -(nah[0] - 100) * 1.4        # vorderer Arm schwingt gegen das vordere Bein
        schreibe(f"figuren/held-lauf-{i+1}.svg",
                 held(nah[:2], fern[:2], nah[2], fern[2], hub[i], armw, f"Laufzyklus Rahmen {i+1} von 6"))

# ---------------------------------------------------------------- Explosion
def wolke(kreise, fuellung, rand=5, extra=""):
    """Vereinigung von Kreisen mit gemeinsamem Umriss: erst alle Kreise dicker in Umrissfarbe, dann die Füllung."""
    aussen = "".join(f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(r + rand/2)}"/>' for x, y, r in kreise)
    innen = "".join(f'<circle cx="{f(x)}" cy="{f(y)}" r="{f(r - rand/2)}"/>' for x, y, r in kreise)
    return f'<g fill="{U}"{extra}>{aussen}</g><g fill="{fuellung}"{extra}>{innen}</g>'

def stern_pfad(cx, cy, ra, ri, n, dreh=0):
    pkt = []
    for i in range(2 * n):
        r = ra if i % 2 == 0 else ri
        w = math.radians(dreh + i * 180 / n - 90)
        pkt.append(f"{f(cx + r*math.cos(w))} {f(cy + r*math.sin(w))}")
    return "M" + " L".join(pkt) + " Z"

def ring(cx, cy, r, n, kr, phase=0, ry=None):
    ry = ry or r
    return [(cx + r*math.cos(math.radians(phase + i*360/n)), cy + ry*math.sin(math.radians(phase + i*360/n)), kr) for i in range(n)]

def explosion():
    cx, cy = 60, 62
    defs = f'''<defs>
    <radialGradient id="feuer" cx=".4" cy=".4" r=".7"><stop offset="0" stop-color="#fff6c4"/><stop offset=".35" stop-color="#ffc928"/><stop offset=".75" stop-color="#ff8a2a"/><stop offset="1" stop-color="#d63b2f"/></radialGradient>
    <radialGradient id="kern" cx=".4" cy=".4" r=".7"><stop offset="0" stop-color="#fff"/><stop offset=".6" stop-color="#fff3a8"/><stop offset="1" stop-color="#ffc928"/></radialGradient>
    <radialGradient id="rauch" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#b9adbf"/><stop offset=".6" stop-color="#8a7e93"/><stop offset="1" stop-color="#5e5468"/></radialGradient>
    <radialGradient id="rauchhell" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#d6ccd9"/><stop offset="1" stop-color="#9b90a3"/></radialGradient>
  </defs>'''
    rahmen = []
    # 1 Blitz: weißer Stern mit gelbem Rand, kleine Funken
    funken = "".join(f'<circle cx="{f(cx + 40*math.cos(math.radians(a)))}" cy="{f(cy + 40*math.sin(math.radians(a)))}" r="3.5" fill="#fff3a8" stroke="{U}" stroke-width="2.5"/>' for a in (20, 110, 200, 290))
    rahmen.append(f'''<path d="{stern_pfad(cx, cy, 36, 14, 8, 11)}" fill="#ffc928" stroke="{U}" stroke-width="5" stroke-linejoin="round"/>
  <path d="{stern_pfad(cx, cy, 22, 9, 8, 11)}" fill="#fff" stroke="none"/>{funken}''')
    # 2 Feuerball wächst: gezackter Rand, heller Kern
    rahmen.append(f'''<path d="{stern_pfad(cx, cy, 50, 34, 10, 0)}" fill="#d63b2f" stroke="{U}" stroke-width="5" stroke-linejoin="round"/>
  {wolke(ring(cx, cy, 20, 7, 18) + [(cx, cy, 22)], "url(#feuer)", 0)}
  <circle cx="{cx-3}" cy="{cy-3}" r="16" fill="url(#kern)"/>
  <ellipse cx="{cx-14}" cy="{cy-16}" rx="8" ry="4" fill="#fff" opacity=".6" transform="rotate(-35 {cx-14} {cy-16})"/>''')
    # 3 Feuerball voll: runde Puffs, erster Rauch oben
    k3 = ring(cx, cy, 30, 9, 19, 10) + [(cx, cy, 30)]
    rahmen.append(f'''{wolke(k3, "url(#feuer)")}
  {wolke([(cx-2, cy-2, 20), (cx+8, cy+6, 14)], "#ffe36b", 0)}
  <circle cx="{cx-6}" cy="{cy-6}" r="10" fill="#fff6c4"/>
  <ellipse cx="{cx-22}" cy="{cy-26}" rx="10" ry="5" fill="#fff" opacity=".55" transform="rotate(-35 {cx-22} {cy-26})"/>''')
    # 4 Rauchwolke mit Glut innen, steigt leicht
    k4 = ring(cx, cy-6, 28, 8, 18, 0) + [(cx, cy-6, 28)]
    rahmen.append(f'''{wolke(k4, "url(#rauch)")}
  {wolke([(cx-8, cy+6, 11), (cx+6, cy+8, 12), (cx+16, cy+2, 7)], "#ff8a2a", 0)}
  {wolke([(cx-4, cy+7, 6), (cx+7, cy+8, 6)], "#ffc928", 0)}
  <ellipse cx="{cx-20}" cy="{cy-34}" rx="10" ry="5" fill="#fff" opacity=".45" transform="rotate(-35 {cx-20} {cy-34})"/>''')
    # 5 Rauch zerfällt in einzelne Puffs, steigt weiter
    def puff(x, y, r):
        return [(x - r*.55, y + r*.2, r*.7), (x + r*.55, y + r*.2, r*.7), (x, y - r*.2, r*.85)]
    puffs5 = [(cx-27, cy-12, 15), (cx+25, cy-16, 16), (cx, cy-42, 12), (cx+24, cy+10, 11), (cx-24, cy+12, 11)]
    rahmen.append("".join(wolke(puff(*p), "url(#rauchhell)", 4) for p in puffs5) +
                  "".join(f'<ellipse cx="{f(x-r*.3)}" cy="{f(y-r*.5)}" rx="{f(r*.32)}" ry="{f(r*.16)}" fill="#fff" opacity=".5" transform="rotate(-30 {f(x-r*.3)} {f(y-r*.5)})"/>' for x, y, r in puffs5))
    puffs6 = [(cx-26, cy-32, 10), (cx+24, cy-38, 11), (cx-2, cy-50, 8)]
    rahmen.append('<g opacity=".6">' + "".join(wolke(puff(*p), "#e2dae5", 3.5) for p in puffs6) + "</g>")
    namen = ["Blitz", "Feuerball wächst", "Feuerball", "Rauchwolke mit Glut", "Rauch zerfällt", "fast leer"]
    for i, r in enumerate(rahmen):
        schreibe(f"effekte/explosion-{i+1}.svg", f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <!-- Explosion Rahmen {i+1} von 6: {namen[i]}. Mitte (60, 62), gleiche viewBox in allen Rahmen. -->
  {defs}
  {r}
</svg>
''')

# ---------------------------------------------------------------- Münze (dreht sich um die senkrechte Achse)
def muenze():
    cx, cy, R, T = 60, 60, 47, 14   # T = Dicke des Rands
    for i in range(6):
        th = math.radians(i * 30)
        s = math.cos(th)
        seite = 1 if s >= 0 else -1           # Vorder- oder Rückseite sichtbar
        s = abs(s)
        versatz = T / 2 * math.sin(th)
        fx = cx + versatz * seite              # sichtbare Fläche
        bx = cx - versatz * seite              # Rand dahinter
        rx = max(R * s, 0.01)
        teile = []
        # Rand (Dicke) als Band zwischen den beiden Flächen
        lx, rx2 = min(fx, bx), max(fx, bx)
        if i == 3:
            teile.append(f'<rect x="{cx-T/2-1}" y="{cy-R}" width="{T+2}" height="{2*R}" rx="5" fill="url(#rand)" stroke="{U}" stroke-width="6"/>')
        else:
            teile.append(f'<ellipse cx="{f(bx)}" cy="{cy}" rx="{f(rx)}" ry="{R}" fill="url(#rand)" stroke="{U}" stroke-width="6"/>')
            teile.append(f'<rect x="{f(lx)}" y="{cy-R}" width="{f(rx2-lx)}" height="{2*R}" fill="url(#rand)"/>')
            teile.append(f'<path d="M{f(lx)} {cy-R} L{f(rx2)} {cy-R} M{f(lx)} {cy+R} L{f(rx2)} {cy+R}" stroke="{U}" stroke-width="6" stroke-linecap="round"/>')
        if i == 3:
            # Kante von vorn: Rillen andeuten
            teile.append("".join(f'<path d="M{cx-6} {y} L{cx+6} {y}" stroke="#b86e06" stroke-width="2.5" stroke-linecap="round"/>' for y in range(26, 98, 12)))
            teile.append(f'<path d="M{cx-2} {cy-38} L{cx-2} {cy-20}" stroke="#fff" stroke-width="3" opacity=".7" stroke-linecap="round"/>')
        else:
            teile.append(f'<ellipse cx="{f(fx)}" cy="{cy}" rx="{f(rx)}" ry="{R}" fill="url(#gold)" stroke="{U}" stroke-width="6"/>')
            teile.append(f'<ellipse cx="{f(fx)}" cy="{cy}" rx="{f(32*s)}" ry="32" fill="none" stroke="#d98a0b" stroke-width="5"/>')
            stern = [(60, 38), (66, 54), (83, 54), (69, 64), (74, 81), (60, 71), (46, 81), (51, 64), (37, 54), (54, 54)]
            d = "M" + " L".join(f"{f(fx + (x-60)*s)} {y}" for x, y in stern) + " Z"
            teile.append(f'<path d="{d}" fill="#fff6c4" stroke="#b86e06" stroke-width="3" stroke-linejoin="round"/>')
            gx = fx - 20 * s
            teile.append(f'<ellipse cx="{f(gx)}" cy="34" rx="{f(max(12*s, 3))}" ry="6" fill="#fff" opacity=".7" transform="rotate({f(-35*s - 60*(1-s))} {f(gx)} 34)"/>')
        schreibe(f"gegenstaende/muenze-{i+1}.svg", f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <!-- Münze Rahmen {i+1} von 6: um {i*30} Grad um die senkrechte Achse gedreht. Mitte (60, 60). -->
  <defs>
    <radialGradient id="gold" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff3a8"/><stop offset=".5" stop-color="#ffc928"/><stop offset="1" stop-color="#d98a0b"/></radialGradient>
    <linearGradient id="rand" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffc928"/><stop offset="1" stop-color="#b86e06"/></linearGradient>
  </defs>
  {"".join(teile)}
</svg>
''')

# ---------------------------------------------------------------- Symbole (runde Knöpfe)
def knopf(inhalt, titel, farbe=("#4fb3ff", "#2275c9")):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <!-- Knopf-Symbol: {titel}. Mitte (60, 60). Keine Schrift. -->
  <defs>
    <radialGradient id="knopf" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="{farbe[0]}"/><stop offset="1" stop-color="{farbe[1]}"/></radialGradient>
  </defs>
  <circle cx="60" cy="60" r="50" fill="url(#knopf)" stroke="{U}" stroke-width="6"/>
  <path d="M28 44 Q40 18 70 14" fill="none" stroke="#fff" stroke-width="7" opacity=".4" stroke-linecap="round"/>
  {inhalt}
</svg>
'''

LAUTSPRECHER = f'<path d="M24 48 L38 48 L56 32 L56 88 L38 72 L24 72 Z" fill="#fff" stroke="{U}" stroke-width="5" stroke-linejoin="round"/>'

def linie(d, breite=7):
    return (f'<path d="{d}" fill="none" stroke="{U}" stroke-width="{breite+6}" stroke-linecap="round" stroke-linejoin="round"/>'
            f'<path d="{d}" fill="none" stroke="#fff" stroke-width="{breite}" stroke-linecap="round" stroke-linejoin="round"/>')

def symbole():
    wellen = linie("M68 48 Q76 60 68 72") + linie("M80 38 Q94 60 80 82")
    schreibe("symbole/ton-an.svg", knopf(LAUTSPRECHER + wellen, "Ton an (Lautsprecher mit Schallwellen)"))
    kreuz = linie("M70 48 L94 72") + linie("M94 48 L70 72")
    schreibe("symbole/ton-aus.svg", knopf(LAUTSPRECHER + kreuz, "Ton aus (Lautsprecher mit Kreuz)"))
    balken = (f'<rect x="38" y="34" width="16" height="52" rx="5" fill="#fff" stroke="{U}" stroke-width="5"/>'
              f'<rect x="66" y="34" width="16" height="52" rx="5" fill="#fff" stroke="{U}" stroke-width="5"/>')
    schreibe("symbole/pause.svg", knopf(balken, "Pause (zwei Balken)"))

# ---------------------------------------------------------------- Boden: Wiese (nahtlos)
def boden():
    rnd = random.Random(9)
    K = 256
    teile = []
    def kacheln(x, y, r, mach):
        # Element und seine Kopien auf der Gegenseite, wenn es über den Rand ragt
        for dx in (-K, 0, K):
            for dy in (-K, 0, K):
                X, Y = x + dx, y + dy
                if X + r > 0 and X - r < K and Y + r > 0 and Y - r < K:
                    teile.append(mach(X, Y))
    # dunklere Flecken (Gras-Schatten)
    for x, y, r in [(30, 40, 30), (150, 110, 40), (230, 230, 28), (90, 200, 24), (210, 30, 20), (20, 150, 18)]:
        kacheln(x, y, r, lambda X, Y, r=r: f'<ellipse cx="{f(X)}" cy="{f(Y)}" rx="{r}" ry="{f(r*.8)}" fill="#6fb24f"/>')
    # hellere Flecken (Sonne)
    for x, y, r in [(110, 40, 22), (60, 110, 18), (200, 170, 20), (250, 100, 14)]:
        kacheln(x, y, r, lambda X, Y, r=r: f'<ellipse cx="{f(X)}" cy="{f(Y)}" rx="{r}" ry="{f(r*.7)}" fill="#86cb62"/>')
    # Grasbüschel
    buesch = [(40, 90), (128, 18), (180, 70), (240, 150), (100, 140), (20, 230), (150, 210), (70, 250), (210, 255), (250, 10)]
    for x, y in buesch:
        kacheln(x, y, 14, lambda X, Y: f'<path d="M{f(X-8)} {f(Y)} l3 -11 M{f(X)} {f(Y+1)} l0 -13 M{f(X+8)} {f(Y)} l-3 -11"/>')
    # kleine Blumen (weiß und rosa) und Steinchen
    blumen = [(76, 30, "#fff"), (196, 120, "#ffb3c8"), (120, 236, "#fff"), (14, 180, "#ffb3c8"), (232, 200, "#fff3a8")]
    for x, y, c in blumen:
        kacheln(x, y, 8, lambda X, Y, c=c: (
            "".join(f'<circle cx="{f(X + 3.5*math.cos(a*math.pi/2.5))}" cy="{f(Y + 3.5*math.sin(a*math.pi/2.5))}" r="2.6" fill="{c}"/>' for a in range(5))
            + f'<circle cx="{f(X)}" cy="{f(Y)}" r="2" fill="#ffc928"/>'))
    for x, y in [(160, 160), (44, 196)]:
        kacheln(x, y, 8, lambda X, Y: f'<ellipse cx="{f(X)}" cy="{f(Y)}" rx="6" ry="4" fill="#a9a19a"/><ellipse cx="{f(X-2)}" cy="{f(Y-1.5)}" rx="2.5" ry="1.2" fill="#fff" opacity=".5"/>')
    flaechen = [t for t in teile if "ellipse" in t and "#6fb24f" in t or "#86cb62" in t]
    halme = [t for t in teile if t.startswith("<path")]
    rest = [t for t in teile if t not in flaechen and t not in halme]
    schreibe("boden/wiese.svg", f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <!-- Bodenkachel Wiese: nahtlos (alles über den Rand kommt auf der Gegenseite wieder), ruhig, wenig Kontrast. -->
  <rect width="256" height="256" fill="#7cc25a"/>
  {"".join(flaechen)}
  <g stroke="#4e9a3a" stroke-width="4" stroke-linecap="round" fill="none">{"".join(halme)}</g>
  {"".join(rest)}
</svg>
''')

figuren(); explosion(); muenze(); symbole(); boden()
print("fertig")
