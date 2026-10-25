---
name: zeichnen
description: Handbuch des Zeichners: Spielgrafiken als SVG im einheitlichen Cartoon-Stil zeichnen, mit werkzeuge/zeichner/render.js in PNG umwandeln und am Kontaktbogen prüfen. Immer verwenden, wenn Figuren, Gegner, Gegenstände, Symbole, Boden, Hintergründe oder Oberflächen-Grafiken für ein Spiel entstehen oder geändert werden.
---

# Handbuch des Zeichners

Ziel: Jede Grafik ist im Spiel sofort erkennbar, passt im Stil zu allen anderen und ist auf dem iPhone scharf.

## Ablauf
1. Auftrag lesen: Welche Bilder, wofür, wie groß im Spiel, Blickwinkel?
2. `vorlagen/` ansehen (Figur, Gegner, Gegenstand, Boden). Sie zeigen den Stil. Neue Bilder bauen auf ihnen auf.
3. SVG schreiben nach `stil.md` und `svg-techniken.md`. Ablage: `spiele/<name>/grafik/quellen/<gruppe>/<name>.svg`.
   Gruppen: `figuren`, `gegner`, `gegenstaende`, `symbole`, `boden`, `effekte`, `oberflaeche`.
4. Umwandeln: `node werkzeuge/zeichner/render.js spiele/<name>`. Die Größe kommt aus der Gruppe, eigene Größen in `grafik/groessen.json` (`{ "boden/nacht": 1024 }`).
5. **Ansehen:** `grafik/kontaktbogen.png` und wichtige PNGs mit dem Read-Werkzeug öffnen. Prüfen und nachbessern:
   - Ist das Motiv auf den ersten Blick klar? Auch verkleinert (stell dir 40 px vor)?
   - Ist nichts am Rand abgeschnitten (viewBox mit Luft für Umriss und Schatten)?
   - Passen Umrissstärke, Farben und Licht zu den anderen Bildern?
6. Meldung an den Spiel-Leiter und Horst: Liste der Bilder mit Name, Größe und Fußpunkt.

## Stil-Checkliste (vor jeder Abgabe)
- [ ] Umriss `#2b1d2e`, gleiche Stärke relativ zur Bildgröße (siehe `stil.md`)
- [ ] Licht von oben links: Glanz oben links, Schatten unten rechts
- [ ] Farben aus der Palette des Spiels, kräftig, Figur und Gegner klar unterscheidbar
- [ ] Freigestellt (transparenter Hintergrund), außer Boden und Hintergrund
- [ ] Fußpunkt unten in der Mitte (Figuren, Gegner), Gegenstände mittig
- [ ] Erkennbar in klein, nichts abgeschnitten
- [ ] Bodenkacheln nahtlos (Kontaktbogen zeigt sie, zusätzlich 2 × 2 nebeneinander prüfen)
- [ ] Keine Schrift in Bildern (Texte macht das Spiel, damit sie übersetzbar bleiben)
- [ ] `render.js` ohne Fehler, Kontaktbogen angesehen

## Animationen (Rahmen für Spritesheets)
- Jeder Rahmen eine eigene SVG: `<gruppe>/<name>-<nr>.svg` (`figuren/held-lauf-1.svg` … `-6.svg`), Nummern ab 1, lückenlos.
- **Alle Rahmen einer Animation haben dieselbe viewBox** und denselben Fußpunkt. Nur so wackelt nichts, wenn Horst sie hintereinander abspielt.
- Zuerst den Mittel-Rahmen gut zeichnen, dann die anderen daraus ableiten. Nur bewegen, was sich bewegt (Beine, Arme, Flammen). Farben, Umriss und Gesicht bleiben gleich.
- Laufzyklus mit 6 Rahmen: Kontakt → Tiefpunkt → Durchgang → Hochpunkt, dann gespiegelt mit dem anderen Bein. Der Körper hebt und senkt sich um etwa 3 % der Höhe.
- Effekte (Explosion, Funken) mit 5–8 Rahmen: schnell groß, dann langsam zerfallen, der letzte Rahmen fast leer.
- Prüfen: alle Rahmen nebeneinander auf dem Kontaktbogen ansehen und einen Streifen bauen (Rahmen nebeneinander, gleiche Grundlinie). Springt etwas, das stillstehen soll?
- In der Meldung an Horst: Animationsname, Zahl der Rahmen, empfohlenes Tempo (Bilder pro Sekunde), Schleife ja/nein.

## Wissen
- `stil.md` – der Haus-Stil: Formen, Proportionen, Farben, Umriss, Licht
- `svg-techniken.md` – wie man in SVG schöne Cartoon-Grafik baut
- `vorlagen/*.svg` – Muster für Figur, Gegner, Gegenstand, Boden
