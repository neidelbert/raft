# Prüfung „Pilzsammler“ (25.10.2026, Tester)

Geprüft: `ausbildung/vorlagen/pilzsammler/` (Vorlage unverändert, Prüfung in einer Kopie im Scratchpad).
Auftrag von Lukas: „Irgendwas stimmt nicht, bitte gründlich prüfen.“ Es gibt keinen „Fertig, wenn“-Text und keinen Test von Horst.

## Geprüft
- Code gelesen: `index.html`, `stil.css`, `js/main.js`.
- Eigener Playwright-Test über `werkzeuge/test-hilfe.js` (iPhone 13, 390 × 664, Port 9090–9094), Spiel mit `?test=1`:
  Start, Ziehen und Loslassen am Joystick (innen und außerhalb), `touchCancel` per CDP, mehrere Pilze auf einmal,
  Rekord speichern und Neuladen, Drehen ins Querformat (750 × 340), Tempo bei normaler und gebremster Bildrate
  (40 ms Last pro Bild, etwa 20 Bilder/s), kaputter Speicherwert, gesperrter Speicher (privater Modus).
- Bildschirmfotos angesehen: Hochformat (Text lesbar, Joystick frei, Pilze gut sichtbar), Querformat (siehe Fehler 5).
- `bash tests/alle-tests.sh`: grün.

## Gefunden

### 1. Figur läuft nach Abbruch der Berührung endlos weiter (`pointercancel` fehlt)
- **Was passiert:** Kommt eine Systemgeste dazwischen (Wischen vom Rand, Kontrollzentrum, Anruf), schickt Safari `pointercancel` statt `pointerup`. Die Figur läuft danach allein weiter bis an den Rand, der Knopf bleibt ausgelenkt.
- **Ursache:** `js/main.js` Zeile 32–34: nur `pointerdown`, `pointermove`, `pointerup`. Kein `pointercancel`, kein `setPointerCapture`, keine `pointerId`-Prüfung (zweiter Finger übernimmt den Joystick).
- **Nachweis:** Finger halten, dann CDP `touchCancel`: `eingabe = {x: -1, y: 0}`, Knopf `translate(-50px, 0px)`, Figur läuft in 0,5 s von x 265 auf 145 (bis an den Rand). Normales Loslassen (auch außerhalb des Felds) ist in Ordnung.
- **Vorschlag:** Joystick aus `iphone-browser.md` übernehmen (`pointercancel` → gleiche Funktion wie `pointerup`, `setPointerCapture`, nur erster Finger).

### 2. Mehrere Pilze auf einmal geben nur 1 Punkt
- **Was passiert:** Berührt die Figur in einem Bild zwei oder drei Pilze, verschwinden alle, gezählt wird nur einer.
- **Ursache:** `js/main.js` Zeile 52–53: `if (pilze.length < vorher) { punkte++; …` zählt +1 statt `vorher - pilze.length`.
- **Nachweis:** Zufall fest (`Math.random = () => 0.99`), Figur auf (100, 300), drei Pilze bei (90/100/110, 300): Punkte 0 → 1 statt 3, danach wieder 8 Pilze.
- **Vorschlag:** `punkte += vorher - pilze.length;`

### 3. Tempo hängt von der Bildrate ab
- **Was passiert:** Die Figur bewegt sich pro Bild 4 Punkte, nicht pro Sekunde. Auf einem langsamen oder heißen iPhone ist sie viel langsamer, auf 120-Hz-iPhones (ProMotion) doppelt so schnell.
- **Ursache:** `js/main.js` Zeile 45–46: `spieler.x += eingabe.x * 4` ohne Zeitschritt `dt`; `bild()` (Zeile 70) gibt keinen Zeitstempel weiter.
- **Nachweis:** Joystick voll rechts, 1 s gemessen: normal 202 Punkte/s, gebremst (≈ 20 Bilder/s) 68 Punkte/s.
- **Vorschlag:** `dt` aus dem `requestAnimationFrame`-Zeitstempel (gedeckelt, Regel aus dem Lernbuch), Tempo in Punkten pro Sekunde (z. B. 240).

### 4. Spiel startet nicht bei kaputtem oder gesperrtem Speicher
- **Was passiert:** Schwarzer/grüner leerer Bildschirm, nichts reagiert. Betrifft einen kaputten Wert unter `pilz-rekord` und Safari mit gesperrtem Speicher.
- **Ursache:** `js/main.js` Zeile 23: `JSON.parse(localStorage.getItem('pilz-rekord'))` ohne `try/catch`; ebenso `localStorage.setItem` in Zeile 55.
- **Nachweis:** Wert `kaputt{` vorab gesetzt: Fehler „Unexpected token 'k' … is not valid JSON“, `window.spiel` wird nie angelegt. `localStorage` wirft beim Zugriff: Fehler „SecurityError“, kein Start.
- **Vorschlag:** Lesen und Schreiben in `try/catch`, Wert mit `Number(…)` prüfen, sonst 0.

### 5. Nach dem Drehen liegen Pilze außerhalb des Bildes
- **Was passiert:** Hochformat → Querformat: Pilze behalten ihre alten Stellen (y bis über 460), das Bild ist nur 340 hoch. Sie sind unsichtbar und unerreichbar (Figur wird auf das neue Feld begrenzt). Es bleiben also weniger als 8 Pilze spielbar, im schlimmsten Fall keiner.
- **Ursache:** `js/main.js` Zeile 12–17: `groesse()` passt bei `resize` nur die Leinwand an, nicht Pilze und Figur. Auch `neuerPilz()` (Zeile 26) rechnet bei kleiner Höhe (`innerHeight - 280`, ab Höhe < 280 negativ) Pilze über den Rand.
- **Nachweis:** Pilze bei (100, 600) und (300, 500), Größe auf 750 × 340: beide bleiben dort; Bildschirmfoto `quer.png` zeigt keinen einzigen Pilz.
- **Vorschlag:** Bei `resize` Pilze und Figur ins neue Feld schieben (oder außerhalb liegende neu setzen).

### Kleinere Befunde
- Pilze können direkt unter der Figur entstehen (beim Start und beim Nachfüllen), dann gibt es einen Punkt ohne Bewegung. Im ersten Bildschirmfoto stand schon beim Start „Pilze: 1“. Ursache `neuerPilz()` Zeile 25–27 ohne Abstand zur Figur.
- `viewport-fit=cover`, aber kein `env(safe-area-inset-*)` in `stil.css`: Joystick (left 24 px) kann im Querformat unter der Notch liegen, Anzeige oben im Vollbild unter der Dynamic Island.
- Test-Schnittstelle: `window.spiel.rekord` wird nie aktualisiert, `window.spiel.pilze` erst im nächsten Bild nach `setzePilze`.

## Behoben
Nichts (Vorlage ist Übungsmaterial). Vorschläge stehen bei den Fehlern.

## Offen / nicht prüfbar
- Echtes iPhone: echtes `pointercancel` bei Systemgesten, Safe-Area, Gefühl des Joysticks, Bildrate bei 120 Hz.
- Sound: hat das Spiel nicht.
- Kein „Fertig, wenn“ vorhanden, darum gegen allgemeine Regeln (`iphone-browser.md`, `testen.md`) geprüft.

## Prüfliste für Lukas (iPhone)
1. Joystick halten und dabei vom unteren Rand nach oben wischen (oder Kontrollzentrum öffnen) und zurückkehren: Steht die Figur still?
2. Zwei Pilze nah beieinander gleichzeitig einsammeln: Steigt der Zähler um 2?
3. Handy ins Querformat drehen: Sind noch 8 Pilze zu sehen und erreichbar? Liegt der Joystick frei von der Notch?
4. Im privaten Safari-Tab öffnen: Startet das Spiel?
5. Einmal quer über das Bild laufen und die Zeit schätzen (ca. 1,5 s im Hochformat): Fühlt sich das Tempo richtig an?
