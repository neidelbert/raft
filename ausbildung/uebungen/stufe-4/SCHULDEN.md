# Technische Schulden – Übung 4

| Was | Warum | Aufwand |
|---|---|---|
| Die Hauptschleife legt in Chrome noch etwa 480–520 Byte pro Bild an, fast alles in Funktionen, die nur einmal pro Bild laufen (Figur bewegen, zeichnen, Treffer prüfen). Gegner und Gitter legen 0 Byte an. | Ursache jetzt gefunden: Solche Funktionen bleiben in Chrome lange im langsamen Interpreter, dort kostet jede Kommazahl-Rechnung 16 Byte. Mit der Zeit sinkt der Wert von selbst (gemessen: 18 KB → 320 Byte pro Bild nach 12 s). Wächst nicht mit der Zahl der Gegner; Safari packt Zahlen nie ein. | Keiner nötig; am iPhone die Speicheranzeige im Blick behalten. |
| Zwei offene Tabs mit dem Spiel: Holt der ältere Tab danach einen eigenen, kleineren neuen Rekord, überschreibt er den größeren aus dem anderen Tab. | Selten (wer spielt in zwei Tabs?), und schon deutlich besser als vorher (siehe unten). | Klein: vor dem Schreiben den gespeicherten Rekord lesen und den größeren nehmen. |
| Pause beim Tab-Wechsel läuft nach der Rückkehr sofort weiter, ohne „Weiter“-Tippen. Ende-Tafel nimmt jedes Tippen sofort an (ein hektischer Tipp im Sterben startet gleich die nächste Runde). | Auftrag sagt nur „Pause, wenn der Tab versteckt wird“; ein Pause-Bildschirm und eine kurze Sperre sind Spielgefühl (Lukas). | Klein: Zustand „pause“ mit Tafel; Sperre 0,5 s in config. |
| Gegner laufen bis auf die Mitte der Figur und verdecken sie im Gedränge (aus Übung 3). | Frage an Lukas noch offen. | Klein: `ankommen` in `config/gegner.js`. |
| Gegner werden auf ganze Punkte gerundet gezeichnet, jetzt auch die Figur (aus Übung 3). | Bei 1–4 Punkten Weg pro Bild nicht sichtbar; auf dem iPhone mit Pixel-Ratio 2 möglicherweise leichtes Ruckeln. | Am iPhone prüfen; sonst auf halbe Punkte runden. |
| `schrittMs` misst mit `performance.now()`; Safari liefert die Zeit nur auf etwa 1 ms genau (aus Übung 3). | Das gleitende Mittel gleicht das aus. | Kein Code-Aufwand. |
| Gegner schauen immer in dieselbe Richtung; Safari-Gesten nur nachgestellt; Figur kann unter den Sprung-Knopf laufen (aus Übung 2 und 3). | Nicht im Auftrag. | Klein, Ideen an den Spiel-Leiter. |

## Abgebaut in Übung 4
- **Leben ohne Anzeige, bei 0 Leben passierte nichts** (Übung 3): Jetzt Leiste mit Punkten und Leben, bei 0 Leben Zustand „ende“.
- **Speicher-Rest der Figur** (Übung 3): Zeichnen auf ganze Punkte gerundet und Ursache des Rests geklärt (siehe erste Zeile; die Annahme aus Übung 3, `drawImage` sei schuld, war nur halb richtig).
- Beim Bauen gefunden und behoben: Das Spiel schrieb beim Verstecken und Schließen den Spielstand immer, auch unverändert. Dabei überschrieb es beim Neuladen alles, was inzwischen in `uebung-4` stand (auch den Rekord eines zweiten Tabs). Jetzt wird nur geschrieben, wenn sich der Rekord geändert hat.
