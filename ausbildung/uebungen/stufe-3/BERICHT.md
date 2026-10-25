# Bericht Übung 3 – Viele Gegner

## Ergebnis
Zur Figur aus Übung 2 kommen grüne Gegner (Bild `gegner.png`). Alle 0,25 s erscheint einer außerhalb des Bildschirmrands, von allen vier Seiten, und läuft zur Figur. Es sind höchstens 240 gleichzeitig; mehr entstehen nie, auch nicht über die Test-Hilfe. Im Gedränge schieben sich die Gegner sanft auseinander und bilden einen dichten Haufen, in dem keiner mehr als halb über einem anderen liegt. Berührt ein Gegner die Figur, verliert sie genau 1 Leben (Start 5) und ist 1 s unverwundbar; sie blinkt in dieser Zeit. Ein Spiel-Schritt mit 240 Gegnern dauert in der Test-Umgebung etwa **0,1–0,2 ms** (erlaubt: 4 ms). Bereit zum Testen.

Vorne, weil es ehrlich ist: Bei 0 Leben passiert noch nichts, und die Leben sieht man nicht als Zahl (kommt mit Stufe 4). Im Gedränge verdecken die Gegner die Figur fast ganz (Frage an Lukas unten).

## Schritte, in die ich die Aufgabe zerlegt habe
1. Übung 2 nach `stufe-3/` kopieren, Einstellwerte für Gegner, Leben und Schutz in `js/config/` – Prüfung: Werte aus config gelesen.
2. Gitter für die Nachbarsuche (`kern/gitter.js`): Jeder Gegner prüft nur die 9 Zellen um sich, nicht alle 239 anderen – Prüfung: Rechentests (Zellen, Rand, neu füllen).
3. Vorrat (Pool) für 240 Gegner in festen Zahlen-Listen; Erscheinen am Rand, nicht direkt neben der Figur – Prüfung: 500 Versuche ergeben 240, keine neuen Listen.
4. Laufen zur Figur, sanftes Auseinanderschieben, Bremsen im Gedränge – Prüfung: Tempo, Abstände nach 20 s, deckungsgleiche Gegner werden in mehreren Bildern getrennt.
5. Treffer und Schutzzeit (`welt/treffer.js`) – Prüfung: genau 1 Leben, 1 s Schutz, nie unter 0.
6. Messung `schrittMs` (gleitendes Mittel, also ein ruhiger Durchschnitt über die letzten Bilder) und Test-Hilfen `fuelleGegner`, `friere` – Prüfung im Browser.
7. Speicher prüfen: keine neuen Objekte in der Hauptschleife (Messung mit dem Speicher-Profiler von Chrome) – Prüfung in node und im Browser.

## Geänderte Dateien (alle in `ausbildung/uebungen/stufe-3/`; Stufe 2 unverändert)
- neu: `js/config/gegner.js`, `js/kern/gitter.js`, `js/kern/zufall.js`, `js/welt/gegner.js`, `js/welt/treffer.js`
- geändert gegenüber Stufe 2: `js/main.js` (Gegner, Treffer, Messung, Test-Schnittstelle, Zeichnen nach Tiefe), `js/config/spiel.js`, `js/config/spieler.js` (Leben, Schutz, Blinken), `js/welt/spieler.js` (Leben-Felder, Blinken, `Math.hypot` ersetzt), `index.html` (Titel)
- `test.js` (Port 8830, Browser), `test-regeln.js` (Rechenregeln ohne Browser), `SCHULDEN.md`, dieser Bericht

## Testergebnis
`node ausbildung/uebungen/stufe-3/test.js`: **59 von 59 Prüfungen bestanden**, zweimal hintereinander. `bash tests/alle-tests.sh`: „Alle Tests bestanden.“
- **schrittMs mit 240 Gegnern: 0,093 ms und 0,170 ms** (zwei Läufe; höchstes Mittel in 2 s 0,196 ms), während die Figur durchs Gedränge läuft 0,09 ms. Grenze 4 ms.
- 240 Gegner ohne Fehler; `fuelleGegner(1000)` ergibt 240; 3 s lang jedes Bild gezählt: nie mehr als 240.
- Treffer: Leben 5 → 4 sofort, unverwundbar; ein liegen gebliebener Gegner kostet das nächste Leben erst nach 1017 ms; Leben sinkt immer um genau 1, nie unter 0.
- Gegner-Tempo bei normaler und gebremster Bildrate (≈ 20 Bilder/s) gleich (63 / 59 Punkte/s, jeder Gegner ist ±25 % gestreut).
- 240 Gegner im Gedränge: kleinster Abstand 19,6 Punkte (Berührung bei 24), keiner mehr als halb überlappt.
- Speicher: Gegner, Gitter und Treffer legen 0 Byte pro Bild an; die ganze Hauptschleife etwa 170–190 Byte pro Bild (nur die Figur, siehe Schulden).
- Steuerung aus Übung 2 geht weiter (Loslassen stoppt), kaputtes `gegner.png` → lila Ersatzkreise, keine Konsolenfehler; ohne `?test=1` kein `spiel.test`.
- Bildschirmfotos angesehen: dichter, gleichmäßiger Haufen um die Figur, Figur richtig zwischen vorderen und hinteren Gegnern; Ersatzkreise sichtbar.

## Was beim Bauen auffiel
1. **Gegner überlappten trotz Trennschub stark** (86 Paare mehr als halb übereinander). Ursache: Die hinteren Reihen drücken weiter zur Figur, die Schübe heben sich in der Mitte auf. Lösung: Wer schon eng steht, läuft nicht weiter nach (`gedraengeBremse`). Danach 0 Paare.
2. **Neuer Speicher in jedem Schritt**, obwohl der Code keine Objekte anlegt: `Math.hypot` legt in Chrome bei jedem Aufruf Speicher an; Kommazahlen in Objekt-Feldern (`gegner.x`) und an `drawImage` werden je nach Lage eingepackt (bis 6 KB pro Bild). Lösung: `Math.sqrt`, Positionen in festen Zahlen-Listen (`Float64Array`), Zeichnen auf ganze Punkte gerundet. Gefunden mit dem Speicher-Profiler, nicht durch Raten.
3. Zwei Fehler lagen in meinem eigenen Test (Gitter-Beispiel über eine Zellgrenze gelegt; inaktive Vorrats-Gegner mitgezählt). Test korrigiert, Spiel war richtig.

## Startwerte für Lukas zum Testen
| Name | Wert | Datei | Bedeutung |
|---|---|---|---|
| `max` | 240 | `js/config/gegner.js` | höchstens so viele Gegner (Auftrag) |
| `tempo` | 70 | `js/config/gegner.js` | Punkte pro Sekunde (Figur: 220) |
| `tempoStreuung` | 0,25 | `js/config/gegner.js` | jeder Gegner ±25 % schneller/langsamer |
| `erscheinenAlle` | 0,25 | `js/config/gegner.js` | Sekunden zwischen zwei neuen Gegnern |
| `radius` / `hoehe` | 12 / 30 | `js/config/gegner.js` | Größe für Berührung / Bild in Punkten |
| `trennTempo` | 360 | `js/config/gegner.js` | wie kräftig sie sich auseinanderschieben |
| `gedraengeBremse` | 3 | `js/config/gegner.js` | wie früh sie im Gedränge stehen bleiben |
| `ankommen` | 4 | `js/config/gegner.js` | ab welchem Abstand zur Figurmitte sie stehen bleiben |
| `leben` | 5 | `js/config/spieler.js` | Leben zu Beginn (Auftrag) |
| `schutzZeit` | 1 | `js/config/spieler.js` | Sekunden unverwundbar (Auftrag) |
| `trefferRadius` | 22 | `js/config/spieler.js` | wie nah ein Gegner kommen muss |
| `blinkenProSekunde` | 8 | `js/config/spieler.js` | Blinken während des Schutzes |

## Frage an Lukas
Die Gegner laufen bis zur Mitte der Figur und verdecken sie im Gedränge. Sollen sie am Rand der Figur stehen bleiben? (Ein Wert: `ankommen` auf etwa 34.)

## Was der Tester am echten iPhone prüfen soll
- 240 Gegner (etwa eine Minute warten): Läuft es flüssig, auch beim Laufen durch den Haufen?
- Bewegen sich die Gegner ruhig, oder ruckeln sie wegen der Rundung auf ganze Punkte?
- Fühlen sich Tempo, Größe und das Auseinanderschieben gut an? Sieht man das Blinken nach einem Treffer?
- Steuerung wie in Übung 2: laufen und gleichzeitig springen, Loslassen stoppt.
