# Haus-Stil: Cartoon, bunt, freundlich

## Formen und Proportionen
- Weiche, runde Formen, wenig spitze Ecken (außer bei Gefahr: Zähne, Stacheln).
- Figuren mit großem Kopf (35–45 % der Höhe), großen Augen und kurzen Beinen. Wirken freundlich und sind klein gut erkennbar.
- Gegner: klar andere Silhouette als die Figur, böser Blick (Augenbrauen nach innen unten), Zähne oder Stacheln.
- Gegenstände: eine einfache, große Grundform plus ein Erkennungsmerkmal (Stern auf der Münze, Blatt am Apfel).
- Silhouetten-Test: Würde man das Bild als schwarze Fläche noch erkennen?

## Umriss
- Farbe `#2b1d2e` (dunkles Violett-Braun, weicher als Schwarz).
- Stärke etwa 2,5–3 % der längsten Bildkante (bei viewBox 200 also 5–6). Innenlinien halb so dick.
- `stroke-linejoin="round"`, `stroke-linecap="round"`.

## Licht und Schatten
- Licht immer von oben links.
- Jede Fläche hat einen Verlauf von hell (oben links) nach dunkel (unten rechts). Das wirkt plastisch, ohne viel Aufwand.
- Glanzpunkt: weiße Ellipse, Deckkraft 0,35–0,7, oben links auf runden Flächen.
- Wangen-Röte und kleine Lichtpunkte in den Augen machen Figuren lebendig.
- Den Bodenschatten zeichnet das Spiel, nicht das Bild.

## Farben
Grundpalette (jedes Spiel darf eine eigene haben, dann steht sie in `spiele/<name>/grafik/PALETTE.md`):
| Rolle | Farben |
|---|---|
| Umriss | `#2b1d2e` |
| Held/Spieler | Blau `#4fb3ff` → `#2275c9`, Orange `#e8742a` |
| Gefahr/Gegner | Grün-giftig `#b6f06a` → `#2f8a2a`, Rot `#d63b2f`, Violett `#7a3fa0` |
| Belohnung | Gold `#fff3a8` → `#ffc928` → `#d98a0b` |
| Haut | `#ffd7b0` → `#f0a97a` |
| Holz/Erde | `#c58a4a` → `#7a4a2a` |
| Boden/Gras | `#7cc25a`, `#6fb24f`, `#4e9a3a` |
| Wasser | `#6fd0ff` → `#1f7fc4` |
- Hintergründe ruhiger und dunkler als Vordergrund, damit Figuren hervortreten.
- Belohnungen leuchten (Gold, Weiß), Gefahren haben Warnfarben (Rot, Giftgrün, Violett).

## Größen
| Gruppe | Längste Kante PNG | Anzeige im Spiel |
|---|---|---|
| figuren, gegner | 256 | etwa 64–128 Punkte |
| gegenstaende, symbole, effekte | 128 | etwa 24–64 Punkte |
| boden | 512 (Kachel) | 256 Punkte |
| oberflaeche, Hintergründe | eigene Größe in `groessen.json` | |
Die PNGs sind doppelt so groß wie die Anzeige, damit sie auf dem iPhone scharf sind.
