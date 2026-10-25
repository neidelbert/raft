# Bericht Übung 1 – Ball mit Abprall

## Ergebnis
Ein orangefarbener Ball fliegt schräg über den ganzen Bildschirm und prallt an allen vier Rändern ab. Er ist gleich schnell, egal ob das Handy schnell oder langsam zeichnet, verlässt nie den Bildschirm und springt nach einem Tab-Wechsel nicht. Bereit zum Testen.

Ein Fehler ist beim Bauen aufgefallen und behoben (siehe unten „Gefundener Fehler“).

## Schritte, in die ich die Aufgabe zerlegt habe
1. Gerüst: Seite, Stil, Hauptschleife, `window.spiel.bereit` – Prüfung: Seite startet ohne Fehler.
2. Scharfer Bildschirm: Canvas so groß wie der Bildschirm, intern mal Pixel-Ratio (höchstens 2) – Prüfung: Größen vergleichen.
3. Ball-Regeln als eigenes Modul ohne Browser (Bewegen, Abprallen, schräger Start) – Prüfung: Rechentests mit `node`.
4. Delta-Zeit (die Zeit seit dem letzten Bild, gedeckelt auf 0,1 s) – Prüfung: Tempo bei normaler und künstlich gebremster Bildrate.
5. Pause bei verstecktem Tab, kein Sprung danach – Prüfung: Tab-Wechsel nachgestellt.
6. Größenänderung (Drehen, Safari-Leiste): Ball wird ins Bild zurückgeholt – Prüfung: Fenster verkleinern.

## Geänderte Dateien (alle neu, in `ausbildung/uebungen/stufe-1/`)
- `index.html`, `stil.css` – Seite und Vollbild
- `js/main.js` – Start, Hauptschleife, Tab-Pause, `window.spiel`
- `js/config/spiel.js` – alle Einstellwerte
- `js/kern/bildschirm.js` – scharfer Canvas, passt sich bei Größenänderung an
- `js/kern/zufall.js` – wiederholbarer Zufall (`?seed=42`)
- `js/welt/ball.js` – Ball erstellen, bewegen, abprallen, zeichnen
- `test.js` (Port 8810), `SCHULDEN.md`, dieser Bericht

## Testergebnis
`node ausbildung/uebungen/stufe-1/test.js`: **25 von 25 Prüfungen bestanden**, dreimal hintereinander.
Geprüft: keine Konsolenfehler; Canvas füllt den Bildschirm; interne Breite = Breite × Pixel-Ratio, Pixel-Ratio 2 bei einem Gerät mit 3; Tempo 294 Punkte/s bei normaler und 300 Punkte/s bei stark gebremster Bildrate (Ziel 300 ± 25 %); Ball bleibt drin (auch gezielt in allen vier Ecken und nach Verkleinern); versteckter Tab hält den Ball an; nach der Rückkehr 0 Punkte Sprung; ohne `?test=1` kein `spiel.test`; Rechenregeln für Abprall und Start ohne Browser.
Bildschirmfoto angesehen: scharfer Ball, dunkler Hintergrund über den ganzen Bildschirm.

Nicht automatisch prüfbar: echter Tab-Wechsel und echte Bildrate auf dem iPhone.

## Gefundener Fehler
Nach dem Zurückkehren in den Tab schickt der Browser noch ein Bild mit einem alten Zeitstempel. Die Schleife hat sich diesen alten Wert gemerkt und beim nächsten Bild die ganze Pause nachgeholt: Der Ball sprang um etwa 30 Punkte. Jetzt darf die gemerkte Zeit nie zurückgehen. Der Test zeigte den Sprung vorher (42 Punkte) und jetzt 0.

## Startwerte für Lukas zum Testen (`js/config/spiel.js`)
| Name | Wert | Bedeutung |
|---|---|---|
| `ballTempo` | 300 | Punkte pro Sekunde (aus dem Auftrag) |
| `ballRadius` | 18 | Größe des Balls in Punkten |
| `startWinkelMin` / `startWinkelMax` | 25 / 65 | Startrichtung in Grad, damit sie immer schräg ist |
| `deltaMax` | 0,1 | längster Zeitschritt pro Bild in Sekunden |
| `pixelRatioMax` | 2 | höchste Schärfe |
| `FARBEN.ball` | `#ffb43c` | Ballfarbe |

## Was der Tester am echten iPhone prüfen soll
- Läuft der Ball flüssig und gleichmäßig, auch im Stromsparmodus?
- App wechseln, 10 s warten, zurück: Ball steht dort, wo er war, und fliegt ohne Sprung weiter.
- Safari-Leiste ein- und ausblenden (scrollen geht nicht, also Handy drehen und zurück): Ball bleibt im Bild, Rand sauber.
- Ist der Ball scharf (keine verwaschenen Kanten)?
