# Bericht Stufe 8 – der eigene Skill

## Ergebnis
Mein Handbuch hat jetzt **zwölf geprüfte Bausteine**: fertige Teile, die jedes neue Spiel einfach übernimmt, statt sie neu zu schreiben (Hauptschleife, Bildschirm, Joystick, Knopf, Zufall, Speichern, Vorrat für viele Gegner, Kollision, Funken, Ton, Bilder, Spielablauf). Jeder Baustein hat oben eine kurze Anleitung (wofür, wie benutzen, Beispiel) und einen eigenen Test. **Kein Spiel gebaut, keine Datei unter `spiele/` angelegt.**

- `node .claude/skills/game-programmierung/bausteine/tests/alle.js`: **13 Tests, 247 Prüfungen, alle bestanden.**
- **Gegenprobe:** Ich habe jeden Baustein absichtlich kaputt gemacht (20 typische Fehler, z. B. „Figur läuft nach dem Loslassen weiter“, „Zeitsprung nach Tab-Wechsel“, „Speichern überschreibt fremde Daten“). Alle 20 wurden von den Tests erkannt. Beim ersten Lauf blieb einer unentdeckt; den Test habe ich verbessert (siehe unten).
- `node werkzeuge/pruefe-team.js` und `bash tests/alle-tests.sh`: grün.

Ehrlich vorweg: Beim Überarbeiten fiel auf, dass das alte Handbuch noch Beispielcode mit genau den Fehlern enthielt, die ich in Stufe 1 und 4 gefunden hatte (Zeitsprung nach Tab-Wechsel, Speichern ohne Änderung). Ein neuer Programmierer hätte sie also wieder eingebaut. Das ist jetzt behoben.

## Was ich jetzt kann
- Ein Spiel-Gerüst, das auf dem iPhone scharf aussieht, bei jeder Bildrate gleich schnell läuft und nach einem Tab-Wechsel nicht springt.
- Steuerung mit dem Daumen, die nie „hängen bleibt“ (Loslassen, Störung durch das System, zweiter Finger).
- Hunderte Gegner ohne Ruckeln, weil kein neuer Speicher pro Bild entsteht, und das auch messen.
- Spielstand, der bei kaputten Daten, im privaten Modus oder bei vollem Speicher nie abstürzt.
- Rückmeldung (Wackeln, Aufblitzen, Funken, Ton), die man ein- und abschalten kann.
- 3D mit Three.js mit wenigen Zeichenaufrufen.
- Tests, die wirklich etwas prüfen: Ich mache für jeden Test eine Gegenprobe mit absichtlichem Fehler.
- Fremden Code nach Fehlern durchsuchen, die Ursache statt des Symptoms beheben und es verständlich erklären.

## Schritte, in die ich die Aufgabe zerlegt habe
1. Lernbuch, Berichte und Schulden aus Stufe 1–7 durchgesehen: Welcher Code hat sich bewährt, welche Regeln kamen dazu?
2. Zwölf Bausteine aus dem Übungscode verallgemeinert (ohne Spiel-Bezug, ohne `window.spiel`, alle auch ohne Browser ladbar).
3. Test je Baustein: Rechenregeln ohne Browser (Uhr, Speicher und Ton dafür nachgebaut), Touch, Bildschirm, Ton und Bilder auf einer kleinen Testseite im Browser (Ports 8880–8886).
4. Gemeinsamer Test für alle: Anleitung oben vorhanden, kein `window.spiel`, unter 300 Zeilen, Handbuch verweist darauf.
5. Gegenprobe-Werkzeug, das jeden Baustein absichtlich kaputt macht und prüft, ob sein Test rot wird.
6. Handbuch und Wissensdateien überarbeitet, Lernbuch-Regeln an die passende Stelle übernommen.
7. Bildschirmfotos angesehen (Joystick, Bild, Ersatzbild, rote Kopie): sehen aus wie gewollt.

## Was sich am Skill geändert hat
**Neu:** `.claude/skills/game-programmierung/bausteine/` mit zwölf Bausteinen und `bausteine/tests/` (ein Test pro Baustein, Testseite, `alle.js`, `gegenprobe.js`).

| Baustein | wofür |
|---|---|
| `schleife.js` | Hauptschleife: gleiches Tempo auf jedem Gerät, Pause bei verstecktem Tab, kein Sprung danach |
| `bildschirm.js` | scharfes Bild, aber nicht schärfer als nötig (spart Akku und Rechenzeit) |
| `joystick.js` | Daumen-Steuerung, die beim Loslassen immer stoppt |
| `knopf.js` | Knopf, der sofort beim Antippen reagiert |
| `zufall.js` | Zufall, der sich für Tests wiederholen lässt |
| `speicher.js` | Rekord und Einstellungen sicher speichern |
| `pool.js` | fester Vorrat für viele gleiche Dinge |
| `gitter.js` | schnelle Kollision vieler Gegner |
| `partikel.js` | Funken |
| `ton.js` | Töne ohne Ton-Dateien, erst nach der ersten Berührung |
| `bilder.js` | Bilder laden, Ersatz zeichnen, wenn eins fehlt |
| `zustaende.js` | Titel → Spiel → Ende |

**Handbuch (`SKILL.md`):** Bausteine-Tabelle (wann welcher), Regel „erst nachsehen, dann bauen“, wie Bausteine ins Spiel kommen und wie man sie verbessert, Gegenprobe in Arbeitsweise und Fertig-Checkliste, Tab-Wechsel in der Checkliste, Fragen an Lukas im Bericht.

**Wissensdateien:**
- `aufbau.md`: veraltete Hauptschleife, Speichern und Vorrat ersetzt durch die Bausteine; Regeln zu Zuständen („Tippen zum Starten“, Anzeige sofort setzen, Effekte laufen weiter), Datenfluss, Test-Schnittstelle in eigener Datei.
- `iphone-browser.md`: alter Joystick-Code (ohne Abbruch-Schutz) ersetzt; Zoom-Gesten, Ton-Erlaubnis bei `touchend`, Speicher-Zugriff, der schon beim Lesen abstürzen kann; Speicher richtig messen.
- `canvas-2d.md`: Gitter-Code, der pro Bild Speicher anlegte, ersetzt; Gedränge, Einsammeln, gerundetes Zeichnen.
- `threejs-3d.md`: Zeichenaufrufe richtig messen, bewegte Instanzen, Modelle verschmelzen, Kamera und Drehung.
- `spielgefuehl.md`, `grafik-und-sound.md`: Bausteine, gemeinsame Rückmelde-Funktion, eigener Zufall für Effekte, fehlende Bilder.
- `testen.md`: alle Test-Regeln aus der Ausbildung (Gegenprobe, mehrere Finger, Tab-Wechsel, Tempo, Speicher, Ton, 3D). Widerspruch behoben: Spiel-Ports stehen jetzt wie in `TEAM.md` ab 9000.
- `haltung.md`: „Bausteine zuerst“ und Gegenprobe.
- `lernbuch.md`: bleibt als Verlauf, mit Hinweis, dass die Regeln jetzt auch in den Wissensdateien stehen, und zwei neue Einträge aus Stufe 8.

## Was beim Bauen auffiel
1. Das alte Handbuch lehrte noch alte Fehler (siehe oben). Regel ins Lernbuch: Gelerntes sofort auch im Beispielcode ändern.
2. Die Gegenprobe „Joystick ohne Abbruch-Schutz“ blieb zuerst grün: Zwei Sicherungen überdeckten sich gegenseitig. Jetzt wird jede einzeln geprüft.
3. Die Funken legten in der Messung anfangs etwas Speicher an. Ursache: Der Browser übersetzt selten gerufenen Code erst spät. Nach längerem Aufwärmen 0; kein Fehler im Baustein.

## Lücken (noch offen)
- **Echtes iPhone:** Alles ist im Test-Browser (Chromium) geprüft, nicht in Safari. Offen bleiben: echte Bildrate, Zoom-Gesten, ob der Ton nach dem ersten Tippen angeht, Stummschalter, Systemgesten.
- **3D hat keinen eigenen Baustein:** Renderer, Kamera-Folge und Modell-Verschmelzen stehen nur als Regeln in `threejs-3d.md`. Ein Baustein bräuchte Three.js im Test; das wäre der nächste sinnvolle Schritt.
- **Fehlende Bausteine für spätere Spiele:** Kamera in 2D, Explosionsgeräusch (Rauschen), Pause-Tafel, Hinweise beim ersten Mal, Schwierigkeit über die Zeit. Ich würde sie erst bauen, wenn ein Spiel sie braucht.
- **Speichern in zwei Tabs:** Holt ein älterer Tab einen kleineren Rekord, kann er einen größeren aus dem anderen Tab überschreiben (selten, aus Stufe 4).
- Die Baustein-Tests laufen nicht in `bash tests/alle-tests.sh` mit, sondern einzeln über `alle.js`. Vorschlag an den Spiel-Leiter: eine Zeile in `tests/alle-tests.sh` ergänzen (habe ich nicht selbst geändert, weil es nicht im Auftrag stand).
- Die Speicher-Messung funktioniert nur in Chrome/Node; für Safari gibt es keine automatische Prüfung.

## Was der Tester am echten iPhone prüfen soll (beim ersten Spiel mit den Bausteinen)
- Joystick: nach Wischen vom Rand oder Kontrollzentrum bleibt die Figur stehen.
- Zwei Finger: Zoomt die Seite? (sollte nicht)
- Ton geht nach dem ersten Tippen an; nach einem Anruf wieder.
- Nach Tab-Wechsel oder Sperrbildschirm: Pause, kein Sprung, Rekord gespeichert.
