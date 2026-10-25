# Technische Schulden – Übung 3

| Was | Warum | Aufwand |
|---|---|---|
| Die Figur legt pro Bild noch etwa 170–190 Byte neuen Speicher an (Chrome packt Kommazahlen an ihre Zeichenbefehle und in `spieler.x/y` ein). Die Gegner legen nichts an. | Fester kleiner Rest, wächst nicht mit der Zahl der Gegner; Safari auf dem iPhone packt Zahlen nie ein. | Klein: Figur-Koordinaten beim Zeichnen runden, Position in ein Float64Array. |
| Leben sieht man nur am Blinken nach einem Treffer, es gibt keine Anzeige. Bei 0 Leben passiert nichts (Spiel läuft weiter). | Nicht im Auftrag; Ende und Anzeige kommen mit Stufe 4. | Klein (Stufe 4). |
| Gegner laufen bis auf die Mitte der Figur und verdecken sie im Gedränge fast ganz (siehe Bildschirmfoto). | Auftrag sagt „zum Spieler laufen“; ob sie am Rand der Figur stehen bleiben sollen, ist Spielgefühl (Lukas). | Klein: `ankommen` in `config/gegner.js` auf Berührungsabstand setzen. |
| Gegner werden beim Zeichnen auf ganze Punkte gerundet (gegen den Speicher-Rest). | Bei etwa 1 Punkt Weg pro Bild nicht sichtbar; auf dem iPhone mit Pixel-Ratio 2 möglicherweise ein leichtes Ruckeln. | Am iPhone prüfen; sonst auf halbe Punkte runden. |
| `schrittMs` misst mit `performance.now()`; Safari liefert die Zeit nur auf etwa 1 ms genau. | Das gleitende Mittel gleicht das aus, einzelne Werte sind aber grob. | Kein Code-Aufwand, beim Ablesen am iPhone beachten. |
| Gegner schauen immer in dieselbe Richtung (kein Spiegeln beim Laufen nach links). | Nicht im Auftrag. | Klein, Idee an den Spiel-Leiter. |
| Aus Stufe 2: Safari-Gesten nur nachgestellt; Figur kann unter den Sprung-Knopf laufen. | Unverändert übernommen. | wie in Stufe 2 |

Abgebaut aus Stufe 2: `test.js` war mit 274 Zeilen zu lang. Jetzt geteilt in `test-regeln.js` (Rechenregeln ohne Browser) und `test.js` (Ablauf im Browser), beide unter 210 Zeilen.
Dabei gefunden: `Math.hypot` in `bewegeSpieler` legt in Chrome bei jedem Aufruf Speicher an; in Stufe 3 ersetzt, in Stufe 2 (nicht ändern) steht es noch.
