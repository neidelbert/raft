# 2D mit Canvas

## Zeichnen
- Ein Canvas aus `bausteine/bildschirm.js` (undurchsichtig, `alpha: false`, zeichnet schneller), gezeichnet wird in CSS-Punkten.
- Jedes Bild: Hintergrund (Kacheln) → Dinge am Boden (Sterne, Schatten) → Objekte nach y sortiert (wer weiter unten steht, wird später gezeichnet) → Effekte (Partikel) → Joystick → Oberfläche.
- Bilder zeichnen: `ctx.drawImage(bild, x - b/2, y - h, b, h)` mit dem Fußpunkt als Bezug (x Mitte, y Füße). So stimmen Schatten und Sortierung. Sortiert man Gegner nach ihrer Mitte, liegt ihr Fuß `hoehe/2` darunter: beim Einordnen der Figur beachten.
- Viele Objekte: Koordinaten auf ganze Punkte runden (`Math.round`), das spart in Chrome Speicher pro Aufruf; bei 1–4 Punkten Weg pro Bild sieht man es nicht.
- Spiegeln statt zwei Bilder: `ctx.save(); ctx.translate(x, y); ctx.scale(-1, 1); ctx.drawImage(…); ctx.restore();`
- `save/restore` kostet. Für viele gleiche Objekte lieber `setTransform` direkt setzen und am Ende zurücksetzen (mit Pixel-Ratio: `ctx.setTransform(pr, 0, 0, pr, …)`).
- Bildschirm-Wackeln: nur die Spielwelt verschieben (`ctx.translate(versatzX, versatzY)` und danach zurück), nicht den Hintergrund und nicht den Joystick unter dem Daumen.
- Text: Schrift einmal setzen, nicht pro Objekt. Oft wechselnde Zahlen (Punkte) in der HTML-Oberfläche statt im Canvas, mit `textContent`.
- `ctx.imageSmoothingEnabled = true` für Cartoon-Bilder, `false` nur für Pixel-Art.

## Kamera
```js
const kamera = { x: 0, y: 0 };
function folge(dt, ziel) {
  const f = 1 - Math.exp(-KAMERA.nachziehen * dt);   // gleich weich bei jeder Bildrate
  kamera.x += (ziel.x - kamera.x) * f; kamera.y += (ziel.y - kamera.y) * f;
}
// beim Zeichnen: ctx.setTransform(pr, 0, 0, pr, pr * (breite/2 - kamera.x), pr * (hoehe/2 - kamera.y));
```
- Nur zeichnen, was im Bild ist (Rand von etwa 64 Punkten dazurechnen). Weltkoordinaten in Metern oder Punkten einmal festlegen und durchhalten.
- Endloser Boden: die Kachel ab `Math.floor(kamera.x / k) * k` wiederholen.

## Bilder
Laden über das Manifest als Atlas (`bausteine/assets.js`), zeichnen um den Fußpunkt mit `zeichneRahmen` (`bausteine/animation.js`), Ersatz mit `ersatzBild` (`bausteine/bilder.js`). Einzelheiten in `assets.md` und `grafik-und-sound.md`.

## Kollision
- **Berührung um die Körpermitte, nicht um den Fuß:** Die Figur steht auf ihrem Fußpunkt, ihr Körper liegt darüber. Ein Kreis um den Fuß lässt eine Münze, die sichtbar hinter dem Körper liegt, liegen. Gerüst: `beruehrt(spieler, x, y, BERUEHRUNG)` in `js/regeln/spieler.js`, Werte `hoehe` (Mitte über dem Fuß) und `radius` in `js/config/welt.js` (Frage an Lukas: großzügig oder knapp?).
- Kreise reichen fast immer: `dx*dx + dy*dy < (r1 + r2) ** 2` (ohne Wurzel, `beruehren` in `bausteine/gitter.js`). Treffer-Kreise eher etwas kleiner als das Bild (fair).
- Rechtecke (Plattformen): erst x bewegen und auflösen, dann y bewegen und auflösen. Sonst bleibt man an Kanten hängen.
- **Viele Objekte (über 50): `bausteine/gitter.js`.** Jedes Bild einmal `fuelle(xs, ys, anzahl)`, dann je Objekt `sucheNachbarn` in die 3 × 3 Zellen um sich. Zellgröße mindestens der größte Suchabstand. Die Fläche deckt auch den Streifen außerhalb ab, in dem Gegner entstehen.
- Beim Einsammeln nur das zählen, was wirklich weg ist: Wer mit `filter` alle in Reichweite entfernt, aber 1 zählt, verliert Dinge (Fehler aus dem Pilzsammler). Neue Dinge nicht unter der Figur entstehen lassen.
- Gegner, die sich nicht überlappen sollen: sanft auseinanderschieben (Trennkraft zu Nachbarn). Im Gedränge reicht das nicht, weil hintere Reihen weiterdrücken und sich die Schübe aufheben: dann das Nachlaufen bremsen (nach der Summe der Überlappungen) und im Test den kleinsten Abstand nach 20 s Simulation prüfen.

## Viele Gegner
- Speicher: `bausteine/pool.js` (Float64Arrays je Feld). Erzeugen am Rand, verteilt nach Seitenlänge; steht der Spieler nah am Entstehungsort, die gegenüberliegende Seite nehmen.
- Grenze aus `config/` (z. B. 240), nie überschreiten. Leistung messen: `schrittMs` (Zeit für einen Spiel-Schritt ohne Zeichnen, gleitend gemittelt).

## Bewegung
- Geschwindigkeit in Einheiten pro Sekunde, mal `dt`.
- Schräg nicht schneller: Richtung normalisieren (`l = Math.sqrt(x*x + y*y); if (l > 1) { x /= l; y /= l; }`). Der Joystick liefert schon Länge ≤ 1.
- Weiche Beschleunigung statt sofortigem Start: `v += (ziel - v) * (1 - Math.exp(-traegheit * dt))`.
- Gegner zum Spieler: Richtung = Spieler − Gegner, normalisieren, mal Tempo. Tempo leicht streuen gegen Klumpen.
- Im Bild halten: nach jeder Bewegung und nach Größenänderung auf das Feld begrenzen. Das Feld folgt aus Fußpunkt und Größe aller Rahmen der Figur (größter Ausschlag) und aus dem gemessenen unteren Rand aller Bedienelemente oben (`data-oben`: Leiste, Ton-Knopf; `setzeFeld` im 2D-Gerüst), nie aus einer festen Zahl.
