# SVG-Techniken für Cartoon-Grafik

## Grundgerüst
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240">
  <defs> … Verläufe … </defs>
  … Formen von hinten nach vorn …
</svg>
```
- **viewBox ist Pflicht** (render.js liest daraus das Seitenverhältnis). Kein `width`/`height` nötig.
- Luft lassen: Formen mindestens halbe Umrissstärke plus 2 vom Rand entfernt.
- Reihenfolge = Ebenen: Hinteres zuerst (Beine, hinterer Arm), Vorderes zuletzt (Kopf, Gesicht).
- Ids von Verläufen pro Datei eindeutig. Mehrere Bilder werden einzeln gerendert, daher gibt es keine Konflikte.

## Verläufe
```svg
<linearGradient id="hemd" x1="0" y1="0" x2="1" y2="1">      <!-- oben links hell → unten rechts dunkel -->
  <stop offset="0" stop-color="#4fb3ff"/><stop offset="1" stop-color="#2275c9"/>
</linearGradient>
<radialGradient id="kugel" cx=".35" cy=".3" r=".8">           <!-- Lichtpunkt oben links -->
  <stop offset="0" stop-color="#fff3a8"/><stop offset=".5" stop-color="#ffc928"/><stop offset="1" stop-color="#d98a0b"/>
</radialGradient>
```

## Formen
- Kreise und Ellipsen für Köpfe, Augen, Körper. `rect` mit `rx` für weiche Kästen.
- `path` mit Bézier-Kurven (`Q` für einfache Bögen, `C` für S-Kurven) für organische Formen. Beispiel Schleim-Körper: siehe `vorlagen/gegner.svg`.
- Gliedmaßen als dicke Linie mit Umriss: erst dieselbe Linie dicker in Umrissfarbe, darüber dünner in der Füllfarbe (siehe Arme in `vorlagen/figur.svg`).
- Stern: 10 Punkte abwechselnd außen/innen auf zwei Kreisen. Innenradius etwa 0,45 × Außenradius.
- Gemeinsamer Umriss für eine Gruppe: `<g stroke="#2b1d2e" stroke-width="6" stroke-linejoin="round">` um alle Teile.

## Gesichter
- Augen: dunkle Ellipse, dazu ein weißer Lichtpunkt oben links.
- Böse: Augenweiß als Dreieck mit Kante nach innen unten, Pupille darin.
- Mund: einfacher Bogen (`Q`) mit runder Linie. Lachen nach oben, böse mit Zähnen (weiße Dreiecke).
- Wangen: rosa Ellipse, Deckkraft 0,5.

## Nahtlose Bodenkachel
Alles, was über einen Rand ragt, wird auf der Gegenseite wiederholt (um ±Kachelbreite verschoben), siehe `vorlagen/boden.svg`. Kontrast gering halten, keine auffälligen Einzelmotive (sonst sieht man das Muster).

## Varianten
- Farbvarianten (z. B. Gegner-Stufen): Datei kopieren und nur die Verlaufsfarben ändern. Name `gegner/schleim-rot.svg`.
- Treffer-Aufblitzen, Wackeln und Umkippen macht das Spiel per Code. Dafür sind keine eigenen Bilder nötig.

## Häufige Fehler
- Abgeschnittener Umriss am Rand: viewBox größer machen.
- Zu dünne Linien verschwinden in klein: mindestens 2,5 % der Kante.
- Zu viele Details: Was unter 3 % der Bildgröße liegt, sieht man im Spiel nicht.
- Text im Bild: weglassen.
