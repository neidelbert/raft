---
name: zeichnen
description: Handbuch des Zeichners: Spielgrafiken als SVG im einheitlichen Cartoon-Stil zeichnen, mit render.js (liegt im Skill-Ordner) in PNG umwandeln und am Kontaktbogen prüfen. Immer verwenden, wenn Figuren, Gegner, Gegenstände, Symbole, Boden, Hintergründe oder Oberflächen-Grafiken für ein Spiel entstehen oder geändert werden.
---

# Handbuch des Zeichners

Ziel: Jede Grafik ist im Spiel sofort erkennbar, passt im Stil zu allen anderen und ist auf dem iPhone scharf.

## Ablauf
1. Auftrag lesen: Welche Bilder, wofür, wie groß im Spiel, Blickwinkel?
2. `vorlagen/` ansehen (Figur, Gegner, Gegenstand, Boden). Sie zeigen den Stil. Neue Bilder bauen auf ihnen auf.
3. SVG schreiben nach `stil.md` und `svg-techniken.md`. Ablage: `spiele/<name>/grafik/quellen/<gruppe>/<name>.svg`.
   Gruppen: `figuren`, `gegner`, `gegenstaende`, `symbole`, `boden`, `effekte`, `oberflaeche`.
   **Fußpunkt markieren** (Figuren, Gegner; Gegenstände bei Bedarf): im `<svg>`-Kopf `data-anker="x y"` in viewBox-Einheiten, also dort, wo die Figur den Boden berührt (Mitte zwischen den Sohlen), z. B. `<svg viewBox="0 0 200 240" data-anker="100 230">`. Die Vorlagen haben ihn schon. Nicht von Hand in Pixel umrechnen: Das macht `render.js`.
4. Umwandeln: `node <skill>/render.js spiele/<name>` (`render.js` liegt in diesem Skill-Ordner, in Claude Code also `node .claude/skills/zeichnen/render.js spiele/<name>`; braucht Node und Playwright mit Chromium). Die Größe kommt aus der Gruppe, eigene Größen in `grafik/groessen.json` (`{ "boden/nacht": 1024 }`). Steht im Auftrag eine Größe im Spiel (in Punkten), ist die längste Kante doppelt so groß (60 Punkte hoch → 120 px).
   `render.js` schreibt `grafik/grafik.json` (Name, Datei, Breite, Höhe und `"anker": [x, y]` = Fußpunkt in Pixeln des PNG). Horsts Werkzeuge lesen den Fußpunkt dort. Fehlt `data-anker` bei Figuren oder Gegnern, warnt `render.js`.
   **Platzhalter:** Ein neues Spielgerüst bringt ein per Code gemaltes Bild mit (`grafik/figuren/figur.png`, in `grafik.json` mit `"platzhalter": true`). Gibt es dafür keine SVG, löscht `render.js` es beim nächsten Lauf. Andere PNGs ohne SVG meldet es nur („WARNUNG … keine SVG-Quelle“): löschen oder Quelle anlegen. Bild löschen heißt immer auch: SVG löschen.
5. **Ansehen:** `grafik/kontaktbogen.png` und wichtige PNGs mit dem Read-Werkzeug öffnen. Prüfen und nachbessern:
   - Ist das Motiv auf den ersten Blick klar? Auch verkleinert (stell dir 40 px vor)?
   - Ist nichts am Rand abgeschnitten (viewBox mit Luft für Umriss und Schatten)?
   - Passen Umrissstärke, Farben und Licht zu den anderen Bildern?
6. Meldung an den Spiel-Leiter und Horst: Liste der Bilder mit Name, Größe und Fußpunkt (den Wert aus `grafik.json`, in PNG-Pixeln).

## Stil-Checkliste (vor jeder Abgabe)
- [ ] Umriss `#2b1d2e`, gleiche Stärke relativ zur Bildgröße (siehe `stil.md`)
- [ ] Licht von oben links: Glanz oben links, Schatten unten rechts
- [ ] Farben aus der Palette des Spiels, kräftig, Figur und Gegner klar unterscheidbar
- [ ] Freigestellt (transparenter Hintergrund), außer Boden und Hintergrund
- [ ] Fußpunkt unten in der Mitte (Figuren, Gegner) als `data-anker` im SVG, Gegenstände mittig; rotes Kreuz im Kontaktbogen sitzt an den Füßen
- [ ] Erkennbar in klein, nichts abgeschnitten
- [ ] Bodenkacheln nahtlos (Kontaktbogen zeigt sie, zusätzlich 2 × 2 nebeneinander prüfen)
- [ ] Keine Schrift in Bildern (Texte macht das Spiel, damit sie übersetzbar bleiben)
- [ ] `render.js` ohne Fehler, Kontaktbogen angesehen

## Animationen (Rahmen für Spritesheets)
- Jeder Rahmen eine eigene SVG: `<gruppe>/<name>-<nr>.svg` (`figuren/held-lauf-1.svg` … `-6.svg`), Nummern ab 1, lückenlos.
- **Alle Rahmen einer Animation haben dieselbe viewBox** und denselben Fußpunkt (dasselbe `data-anker` in jeder Datei). Nur so wackelt nichts, wenn Horst sie hintereinander abspielt.
- Zuerst den Mittel-Rahmen gut zeichnen, dann die anderen daraus ableiten. Nur bewegen, was sich bewegt (Beine, Arme, Flammen). Farben, Umriss und Gesicht bleiben gleich.
- Laufzyklus mit 6 Rahmen: Kontakt → Tiefpunkt → Durchgang → Hochpunkt, dann gespiegelt mit dem anderen Bein. Der Körper hebt und senkt sich um etwa 3 % der Höhe.
- Effekte (Explosion, Funken) mit 5–8 Rahmen: schnell groß, dann langsam zerfallen, der letzte Rahmen fast leer.
- Prüfen: alle Rahmen nebeneinander auf dem Kontaktbogen ansehen und einen Streifen bauen (Rahmen nebeneinander, gleiche Grundlinie). Springt etwas, das stillstehen soll?
- In der Meldung an Horst: Animationsname, Zahl der Rahmen, empfohlenes Tempo (Bilder pro Sekunde), Schleife ja/nein.

## Wissen
- `render.js` – das Werkzeug: SVG → PNG, `grafik.json` (mit Fußpunkt) und Kontaktbogen (Kopfkommentar erklärt Quelle, Ziel, `data-anker` und Aufräumen)
- `stil.md` – der Haus-Stil: Formen, Proportionen, Farben, Umriss, Licht
- `svg-techniken.md` – wie man in SVG schöne Cartoon-Grafik baut
- `vorlagen/*.svg` – Muster für Figur, Gegner, Gegenstand, Boden
