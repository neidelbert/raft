# Technische Schulden – Übung 7

| Was | Warum | Aufwand |
|---|---|---|
| Die dunkle Fläche unter dem Boot ist flach; auf Wellenbergen verschwindet ihr Rand stellenweise im Wasser (im Bildschirmfoto während der Fahrt zu sehen). | Echte Schatten sind auf dem iPhone zu teuer (Handbuch). Eine flache Scheibe kann sich den Wellen nicht anpassen. | Klein: Scheibe kleiner, etwas höher oder ganz weglassen, wenn Lukas sie stört. |
| Ob es am iPhone flüssig läuft (60 Bilder/s), ist nicht gemessen. Im Test-Browser mit Software-Grafik: etwa 33 Bilder/s, 4 Zeichenaufrufe, 5.572 Dreiecke. | Test-Browser hat keine echte Grafikkarte. | Am iPhone prüfen. Bei Ruckeln zuerst `SPIEL.kantenglaettung` aus, dann `WASSER.segmente` kleiner. |
| Speicher pro Bild in Chrome: Three.js selbst legt etwa 3 KB pro Bild an, mein Code nach 20 s Aufwärmen etwa 300 Byte (Bojen, Kamera). Nicht im Test geprüft. | Teil von Three.js, nicht änderbar; mein Rest ist das Aufwärmen in Chrome (Lernbuch Stufe 4), Safari packt Zahlen nicht ein. | Keiner, solange es am iPhone nicht ruckelt. |
| Die Bojen liegen nur in einem Feld von 44 × 44 m um den Start. Fährt man weit weg, kommt nur noch Wasser. | Auftrag: 30 Bojen verteilt. Eine endlose Welt wäre ein neues Feature. | Mittel: Bojen, die weit hinten liegen, vorne neu setzen. Frage an Lukas. |
| Das Boot fährt durch Bojen hindurch (sie hüpfen nur). | Auftrag sagt nur „hüpfen“. | Klein: Boje beim Berühren wegschieben. Frage an Lukas. |
| Grafik-Absturz (`webglcontextlost`) zeigt nur den Hinweis „Bitte neu laden“, nichts wird gespeichert. | Es gibt noch keinen Spielstand. | Keiner, bis es einen gibt. Nicht automatisch getestet. |
| `test.js` macht Regeln und Browser in einer Datei (220 Zeilen). | Ein Ablauf ist schnell und übersichtlich. | Klein: teilen, wenn er weiter wächst. |
