# Technische Schulden – Übung 2

| Was | Warum | Aufwand |
|---|---|---|
| Echte Safari-Gesten (Zoomen mit zwei Fingern, Wischen vom Rand, Kontrollzentrum) sind nur nachgestellt bzw. gar nicht geprüft. | Der Test-Browser ist Chromium; `gesturestart` gibt es nur in Safari. | Kein Code-Aufwand, am iPhone prüfen. |
| Die Figur kann unter den Sprung-Knopf laufen und ist dort halb verdeckt. | Auftrag sagt nur „bleibt im Bildschirm“. | Klein (Sperrbereich in config), wenn Lukas es will. |
| `test.js` hat 274 Zeilen und deckt alles in einem Ablauf ab. | Ein Ablauf im selben Browser ist schnell. | Klein: in Steuerungs- und Seiten-Test teilen, wenn er weiter wächst. |
| Aus Stufe 1: keine Sammeldatei für die Übungstests; `bash tests/alle-tests.sh` meldet außerdem einen fremden Fehler in `werkzeuge/pruefe-team.js` (Verweis auf `stufe-8/BERICHT.md`, den es noch nicht gibt). | Nicht mein Bereich, nicht im Auftrag. | Klein, an den Spiel-Leiter gemeldet. |
