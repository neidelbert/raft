# Bericht Übung 6 – Spielgefühl, Sound, Ersatzbilder

## Ergebnis
Das Spiel aus Übung 4 fühlt sich jetzt lebendiger an. **Bereit zum Testen.**
- **Treffer:** Die Figur leuchtet 0,2 s rot auf, das Bild wackelt kurz (nach 0,4 s ist es ganz ruhig), dazu ein tiefer, fallender Ton.
- **Sterne:** Alle 2 s erscheint ein Stern an einer freien Stelle (nie unter der Figur, nicht unter Leiste und Knöpfen, höchstens 8 zugleich). Läuft die Figur darüber, sprühen gelbe Funken (Partikel, also kleine Teilchen, die wegfliegen und verblassen) und ein heller, steigender Ton erklingt.
- **Ton:** wird per Code erzeugt (keine Ton-Dateien) und startet erst nach der ersten Berührung, wie es der iPhone-Browser verlangt. Oben rechts gibt es den Knopf „Ton an“/„Ton aus“. Die Wahl bleibt nach dem Neuladen erhalten. Der Knopf startet im Titel keine Runde.
- **Fehlendes Bild:** Fehlt `stern.png`, zeichnet das Spiel selbst einen gelben Stern und läuft normal weiter.

Ehrlich vorweg: Wenn `stern.png` fehlt, aber noch in `grafik.json` steht, zeigt der Browser selbst eine rote Zeile „Failed to load resource … 404“ in der Konsole. Die kommt vom Browser, nicht vom Spiel, und lässt sich im Spiel nicht abschalten (im Versuch geprüft). Das Spiel selbst meldet nur Warnungen. Streicht der Zeichner das Bild auch aus `grafik.json`, bleibt die Konsole ganz ohne Fehler (beides getestet).

## Schritte, in die ich die Aufgabe zerlegt habe
1. Übung 4 nach `stufe-6/` kopiert (Übung 4 unverändert). Prüfung: alle alten Prüfungen grün.
2. Einstellwerte in drei neuen Dateien: `config/effekte.js`, `config/sterne.js`, `config/ton.js`.
3. Wackeln und Aufblitzen (`welt/effekte.js`). Prüfung ohne Browser: springt an, höchstens 1, nach 0,4 s weg, auch bei 10 Bildern/s.
4. Partikel aus festem Vorrat (`welt/partikel.js`). Prüfung: nie über 150, nach höchstens 0,6 s weg, 0 Byte neuer Speicher.
5. Sterne (`welt/sterne.js`) mit Ersatz-Stern per Code. Prüfung: alle 2 s, nie unter der Figur, Einsammeln zählt jeden.
6. Ton (`kern/ton.js`). Prüfung mit nachgebautem WebAudio: erst nach Berührung, an/aus, nicht öfter als 20-mal pro Sekunde.
7. Spielstand Version 2 mit Feld `ton` (Stände aus Übung 4 werden übernommen, Ton dann an). Ton-Knopf.
8. Alles in `main.js` verbunden, Test-Schnittstelle ergänzt, Browser-Test, Bildschirmfotos angesehen.

## Geänderte Dateien (alle in `ausbildung/uebungen/stufe-6/`)
- neu: `js/config/effekte.js`, `js/config/sterne.js`, `js/config/ton.js`, `js/kern/ton.js`, `js/welt/effekte.js`, `js/welt/partikel.js`, `js/welt/sterne.js`
- geändert gegenüber Übung 4: `js/main.js`, `js/test-schnittstelle.js`, `js/config/spiel.js` (Spielstand Version 2, Texte, Ersatzfarben), `js/kern/speicher.js` (Feld `ton`), `js/kern/bilder.js` (`holeBild`, `faerbeEin`), `js/welt/spieler.js` (rotes Aufblitzen), `js/ablauf/runde.js` (Sterne pro Runde), `js/oberflaeche/anzeige.js` (Ton-Knopf), `index.html`, `stil.css`
- Tests: `test.js` (Port 8860), neu `test-regeln-effekte.js` und `test-browser-effekte.js`, angepasst `test-regeln-ablauf.js`, `test-browser-speicher.js`, `test-regeln.js`
- `SCHULDEN.md`, dieser Bericht

## Testergebnis
`node ausbildung/uebungen/stufe-6/test.js`: **165 von 165 Prüfungen bestanden**, in mehreren Läufen. `bash tests/alle-tests.sh`: „Alle Tests bestanden.“
- **Wackeln:** springt beim Treffer sofort an (0,7), nach 0,28 s Spielzeit wieder 0, nimmt nur ab. Auch auf der Ende-Tafel klingt es aus. Echter Treffer durch einen Gegner wirkt genauso.
- **Partikel:** 60 Sterne auf einmal ergeben höchstens 150 Partikel (`partikelMax`), in keinem Bild mehr; nach 0,6 s sind alle weg.
- **Ton:** `ton.bereit` ist ohne Berührung false (auch nach dem Warten), nach dem ersten Tipp true. Treffer und Stern spielen je einen Ton, bei „Ton aus“ keinen (im Browser mitgezählt).
- **Ton-Knopf:** schaltet per Tippen, Klick und Tastatur genau einmal, wird sofort gespeichert und bleibt nach dem Neuladen. Im Titel startet er keine Runde, im Spiel bewegt er die Figur nicht.
- **Ohne `stern.png`** (Kopie des Spiels ohne die Datei): Ersatz-Stern, das Spiel läuft, Sterne lassen sich sammeln, kein Fehler aus dem Spielcode. Gegenprobe (`GEGENPROBE=1`, ohne Ersatz-Stern): der Test wird rot, er taugt also.
- **Aus Übung 3 und 4 weiter grün:** Zustände, Rekord, kaputter Speicher, privater Modus, Pause, 240 Gegner in 0,08 ms pro Schritt.
- Bildschirmfotos angesehen: Sterne, rote Figur mit Funken, Ersatz-Stern, Titel mit Ton-Knopf.
- Nicht automatisch prüfbar: ob man den Ton am iPhone hört, wie stark sich Wackeln und Blitz anfühlen.

## Was beim Bauen auffiel
1. Ein fehlendes Bild erzeugt im Browser immer eine Fehlerzeile, egal wie man lädt (siehe oben). Darum gibt es jetzt den Weg „aus `grafik.json` streichen“ ganz ohne Fehler.
2. Die Speichermessung der Partikel zeigte erst 12 Byte pro Schritt. Ursache: Chrome hatte die selten laufende Funktion noch nicht übersetzt (wie in Übung 4). Nach längerem Aufwärmen 0 Byte.
3. Sterne lagen anfangs knapp unter dem Ton-Knopf, wenn man die Notch mitrechnet. Rand oben und unten auf 150 Punkte vergrößert.

## Startwerte für Lukas zum Testen
| Name | Wert | Datei | Bedeutung |
|---|---|---|---|
| `WACKELN.trefferStaerke` | 0,7 | `js/config/effekte.js` | wie stark ein Treffer wackelt (0 = aus) |
| `WACKELN.versatzMax` | 9 Punkte | `js/config/effekte.js` | größter Ausschlag |
| `WACKELN.abklingen` | 2,5 pro s | `js/config/effekte.js` | Wackeln vorbei nach höchstens 0,4 s |
| `BLITZ.dauer` / `deckkraft` | 0,2 s / 0,75 | `js/config/effekte.js` | rotes Aufblitzen der Figur |
| `PARTIKEL.max` / `proStern` | 150 / 18 | `js/config/effekte.js` | Funken gesamt / pro Stern |
| `PARTIKEL.dauerMin` – `dauerMax` | 0,35–0,6 s | `js/config/effekte.js` | Lebenszeit der Funken |
| `STERNE.erscheinenAlle` | 2 s | `js/config/sterne.js` | aus dem Auftrag |
| `STERNE.max` | 8 | `js/config/sterne.js` | höchstens so viele liegen zugleich |
| `STERNE.groesse` / `sammelRadius` | 34 / 30 Punkte | `js/config/sterne.js` | Größe, wie nah man ran muss |
| `TON.lautstaerke` | 0,5 | `js/config/ton.js` | Gesamtlautstärke |
| `KLAENGE.treffer` / `stern` | 180 Hz fallend / 880 Hz steigend | `js/config/ton.js` | Klang der Töne |

## Fragen an Lukas (Spielgefühl)
- Soll die Zahl der Sterne oben in der Leiste stehen? Zählen Sterne zu den Punkten?
- Sind 8 Sterne zugleich zu viele oder zu wenige?
- Offen aus Übung 4: Pause-Tafel nach Tab-Wechsel, kurze Sperre der Ende-Tafel, Gegner am Rand der Figur stoppen.

## Was der Tester am echten iPhone prüfen soll
- Ton: Nach dem ersten Tippen hört man beim Treffer einen tiefen und beim Stern einen hellen Ton? Vorher kein Ton? (Stummschalter am iPhone aus, sonst bleibt WebAudio stumm.)
- Nach App-Wechsel oder Anruf zurück: Kommt der Ton nach dem nächsten Tippen wieder?
- „Ton aus“ tippen, Safari ganz schließen, wieder öffnen: Steht der Knopf noch auf „Ton aus“, und ist es still?
- Ist der Ton-Knopf gut erreichbar und nicht von der Notch verdeckt (auch quer)?
- Fühlt sich Wackeln und rotes Aufblitzen gut an, zu stark oder zu schwach? Läuft es mit 240 Gegnern und Funken flüssig?
- Steuerung wie in Übung 4: laufen, springen, Loslassen stoppt.
