# Bericht Übung 4 – Spielzustände und Speichern

## Ergebnis
Aus Übung 3 ist ein kleines Spiel geworden. Es beginnt mit dem Titel „Tippen zum Starten“ (darunter der Rekord). Ein Tipp irgendwo startet die Runde. Oben stehen Punkte und Leben, jede überlebte Sekunde gibt einen Punkt. Bei 0 Leben kommt das Ende mit „Punkte: …“, „Rekord: …“ und „Tippen für neue Runde“. Eine neue Runde setzt Leben, Punkte, Gegner und Figur zurück. Der Rekord wird nur ersetzt, wenn die neuen Punkte höher sind. Er bleibt nach dem Neuladen erhalten (Speicher `uebung-4`). Kaputte Speicherdaten, voller Speicher und der private Modus führen nicht zum Absturz, sondern zu Standardwerten. Wird der Tab versteckt, pausiert das Spiel: Es gibt keine Punkte und die Gegner bewegen sich nicht. **Bereit zum Testen.**

Ehrlich vorweg: Kommt man in den Tab zurück, läuft das Spiel sofort weiter, ohne „Weiter“-Tippen. Auch ein Tipp genau im Moment des Todes startet gleich die nächste Runde. Beides ist eine Frage des Spielgefühls (unten).

## Schritte, in die ich die Aufgabe zerlegt habe
1. Übung 3 nach `stufe-4/` kopiert. Prüfung: Alle Rechenregeln aus Übung 3 laufen weiter grün.
2. Speicherstand (`kern/speicher.js`): lesen mit Standardwerten, jedes Feld einzeln geprüft, nie ein Absturz. Prüfung: 15 kaputte Inhalte, privater Modus und voller Speicher ohne Browser getestet.
3. Zustandsautomat (`ablauf/zustaende.js`), also eine kleine Steuerung, die genau einen Zustand zur Zeit kennt (Titel, Spiel, Ende). Prüfung: Reihenfolge Verlassen → Betreten, Wechsel mitten im Bild.
4. Rundenregeln (`ablauf/runde.js`): Zeit, Punkte als ganze Zahl, Rekord nur, wenn höher, Leben nie unter 0. Prüfung: ohne Browser, auch bei 20 Bildern pro Sekunde.
5. Anzeige (`oberflaeche/anzeige.js`): Tafel für Titel und Ende, Leiste für Punkte und Leben. Text wird nur geschrieben, wenn sich eine Zahl ändert. Prüfung: Texte im Browser gelesen, Bildschirmfotos angesehen.
6. `main.js` verbunden: Tippen startet, 0 Leben beendet, Rekord speichern, Pause beim Verstecken. Prüfung: ganzer Ablauf im Browser mit echtem Tippen.
7. Test-Schnittstelle in eine eigene Datei (`js/test-schnittstelle.js`) mit `schaden(n)`. Prüfung: ohne `?test=1` gibt es `spiel.test` nicht.

## Geänderte Dateien (alle in `ausbildung/uebungen/stufe-4/`; Stufe 3 unverändert)
- neu: `js/kern/speicher.js`, `js/ablauf/zustaende.js`, `js/ablauf/runde.js`, `js/oberflaeche/anzeige.js`, `js/test-schnittstelle.js`
- geändert gegenüber Stufe 3: `js/main.js` (Zustände, Speichern, Pause), `js/config/spiel.js` (Speicher, Texte, Punkte pro Sekunde), `js/welt/spieler.js` (Zurücksetzen für neue Runde, Zeichnen auf ganze Punkte), `index.html` (Tafel und Leiste), `stil.css`
- Tests: `test.js` (Port 8840, Ablauf im Browser), `test-browser-speicher.js` (Neuladen, kaputter Speicher, privater Modus, Leistung), `test-hilfen.js`, `test-regeln-ablauf.js` (neue Regeln ohne Browser), `test-regeln.js` (aus Stufe 3)
- `SCHULDEN.md`, dieser Bericht

## Testergebnis
`node ausbildung/uebungen/stufe-4/test.js`: **96 von 96 Prüfungen bestanden**, in zwei Läufen hintereinander. `bash tests/alle-tests.sh`: „Alle Tests bestanden.“
- **Zustände:** Start im Titel (1 s lang keine Gegner, keine Punkte). Tippen → „spiel“, der Start-Tipp bewegt die Figur nicht. Tippen im Spiel ändert nichts. `schaden(2)` → 3 Leben, Spiel läuft weiter. `schaden(3)` → sofort „ende“. Im Ende steht alles still. Tippen → neue Runde.
- **Punkte:** nach 2,3 s 2 Punkte; bei gebremster Bildrate (≈ 25 Bilder pro Sekunde) zählen 2 s als 2,0 s.
- **Echtes Ende:** 240 Gegner treffen die Figur 5-mal (5→4→3→2→1→0), nach etwa 6 s kommt „ende“.
- **Rekord:** Der erste Rekord ist gleich den Punkten und wird sofort gespeichert. Weniger oder gleich viele Punkte ändern ihn nicht, mehr Punkte (57) ersetzen ihn. Nach dem Neuladen zeigt der Titel „Rekord: 57“.
- **Neue Runde:** 5 Leben, 0 Punkte, 0 Gegner, Figur in der Mitte, Joystick los, Leiste sofort „Punkte 0 Leben 5“.
- **Kaputter Speicher:** 8 kaputte Inhalte im Browser (darunter „kein json{“, `[]`, `{"rekord":"viel"}`, `{"rekord":-1}`) und 15 ohne Browser führen zu Titel und Rekord 0, ohne Konsolenfehler. Danach wird wieder ein gültiger Stand geschrieben.
- **Voller Speicher / privater Modus:** Das Spiel läuft, der Rekord gilt bis zum Neuladen, kein Absturz.
- **Pause:** Bei verstecktem Tab gibt es 1,5 s lang keine Zeit, keine Punkte und keine Bewegung. Zurück im Tab läuft es ohne Sprung weiter (erstes Bild 10 ms).
- **Aus Übung 3 weiter grün:** Joystick und Loslassen, `schrittMs` mit 240 Gegnern **0,08–0,10 ms** (Grenze 4 ms). Gegner und Gitter legen 0 Byte neuen Speicher an.
- Bildschirmfotos angesehen (Titel, Spiel, Ende, Gedränge): Texte gut lesbar, Leiste oben frei von der Notch.
- Nicht automatisch prüfbar: echtes Verstecken des Tabs in Safari (im Test nachgestellt), echter privater Modus, das Gefühl beim Neustart.

## Was beim Bauen auffiel
1. **Gespeichert wurde zu oft.** Beim Verstecken und Schließen schrieb das Spiel immer den Stand, auch unverändert. Der Test fand das: Kaputte Daten, die vor dem Neuladen hineingeschrieben wurden, waren danach wieder überschrieben. Im echten Leben hätte ein zweiter Tab so einen neueren Rekord löschen können. Jetzt schreibt das Spiel nur, wenn sich etwas geändert hat.
2. **Die Leiste zeigte kurz die alten Werte** der vorigen Runde (bis zum nächsten Bild). Jetzt wird sie schon beim Start der Runde neu gesetzt.
3. Zwei Fehler lagen im eigenen Test (ein Gegner traf vor `schaden(2)`; ein Wert fehlte beim Übergeben an den Browser). Test korrigiert, Spiel war richtig.
4. Der Speicher-Rest aus Übung 3 hat eine andere Ursache als gedacht (siehe `SCHULDEN.md`): Chrome rechnet Funktionen, die selten laufen, anfangs langsam und legt dabei Speicher an. Das ist kein Fehler im Spiel.

## Startwerte für Lukas zum Testen
| Name | Wert | Datei | Bedeutung |
|---|---|---|---|
| `punkteProSekunde` | 1 | `js/config/spiel.js` | Punkte pro überlebter Sekunde (Auftrag) |
| `SPEICHER.schluessel` | `uebung-4` | `js/config/spiel.js` | Name des Speicherstands (Auftrag) |
| `TEXTE` | „Tippen zum Starten“ … | `js/config/spiel.js` | alle Texte von Titel, Ende und Leiste |
| `leben` | 5 | `js/config/spieler.js` | Leben zu Beginn (aus Übung 3) |
| Gegner-Werte | wie Übung 3 | `js/config/gegner.js` | Tempo, Erscheinen alle 0,25 s, höchstens 240 |

## Fragen an Lukas (Spielgefühl)
- Soll nach der Rückkehr in den Tab erst ein „Pause – Tippen zum Weiterspielen“ kommen, statt sofort weiterzulaufen?
- Soll die Ende-Tafel eine halbe Sekunde lang kein Tippen annehmen, damit ein hektischer Tipp nicht gleich die nächste Runde startet?
- Offen aus Übung 3: Sollen die Gegner am Rand der Figur stehen bleiben (`ankommen` auf etwa 34)?

## Was der Tester am echten iPhone prüfen soll
- Titel → Tippen → Spiel → sterben → Ende → Tippen → neue Runde: Fühlt sich der Ablauf gut an? Ist die Schrift gut lesbar?
- Rekord holen, Safari ganz schließen, wieder öffnen: Ist der Rekord noch da?
- Während des Spiels zum Home-Bildschirm wechseln, nach 10 s zurück: Sind die Punkte in dieser Zeit stehen geblieben?
- Im privaten Modus spielen: Startet das Spiel, und bleibt der Rekord bis zum Neuladen?
- Sitzt die Leiste oben gut neben der Notch, auch quer gehalten?
- Steuerung wie in Übung 2 und 3: laufen, springen, Loslassen stoppt, 240 Gegner flüssig.
