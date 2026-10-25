# Technische Schulden – Übung 6

| Was | Warum | Aufwand |
|---|---|---|
| Fehlt `stern.png`, steht aber noch in `grafik.json`, meldet der **Browser selbst** eine Fehlerzeile („Failed to load resource … 404“). Das Spiel meldet nur Warnungen und läuft weiter. | Jede fehlgeschlagene Anfrage meldet Chrome so, das lässt sich im Spielcode nicht abstellen (im Versuch geprüft: Bild, `fetch` und abgebrochene Anfrage melden alle). Streicht der Zeichner das Bild auch aus `grafik.json`, gibt es gar keine Fehlerzeile (getestet). | Keiner im Spiel. Regel für den Zeichner: Bild löschen heißt auch Eintrag in `grafik.json` streichen. |
| Hauptschleife legt in Chrome jetzt etwa 750–860 Byte pro Bild an (Übung 4: 480–520), Grenze im Test 1024. | Mehr Funktionen, die einmal pro Bild laufen (Effekte, Sterne, Partikel), bleiben anfangs im Interpreter (Lernbuch Stufe 4). Im Test treffen 240 Gegner dauernd, daher rechnet auch das Wackeln dauernd. Partikel, Gegner, Gitter: 0 Byte. | Am iPhone die Speicheranzeige im Blick behalten; die Testgrenze rückt näher, ggf. nach längerem Aufwärmen messen. |
| Die Zahl der eingesammelten Sterne wird nirgends angezeigt. | Nicht im Auftrag (nur `window.spiel.sterne`). Frage an Lukas. | Klein: Feld in der Leiste. |
| Nach Drehen des iPhones können liegende Sterne außerhalb des Bildes liegen. | Nicht im Auftrag; neue Sterne kommen weiter richtig. | Klein: bei `resize` Sterne ins Bild schieben. |
| Ton-Einstellung und Rekord liegen im selben Speicher `uebung-4` wie Übung 4 (auf GitHub Pages dieselbe Adresse): Beide Übungen teilen den Rekord. | „Alles aus Stufe 4 bleibt“, der Schlüssel stammt aus dem Auftrag von Übung 4. Übung 4 liest den neuen Stand ohne Fehler (unbekanntes Feld `ton` bleibt erhalten). | Klein: eigener Schlüssel, falls Lukas das will. |
| Ob der Ton am echten iPhone nach dem ersten Tipp angeht, ist nur nachgestellt (Chrome spielt auch ohne Tipp). Der Stummschalter am iPhone schaltet WebAudio stumm. | Im Test-Browser nicht prüfbar. | Am iPhone prüfen. |
| Aus Übung 4 übernommen: Zwei Tabs können sich den Rekord überschreiben; Pause ohne „Weiter“-Tafel; Ende-Tafel ohne kurze Sperre; Gegner laufen bis auf die Figurmitte; Gegner schauen immer in dieselbe Richtung. | Fragen an Lukas noch offen. | Klein, je Punkt. |

## Abgebaut in Übung 6
- Bilder ohne Hinweis: Fehlte ein Bild, merkte man das nur an der Ersatzform. Jetzt warnt `holeBild` einmal mit dem Namen (auch wenn das Bild gar nicht in `grafik.json` steht).
