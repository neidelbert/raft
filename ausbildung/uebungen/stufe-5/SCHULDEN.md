# Technische Schulden – Übung 5 (Pilzsammler)

| Was | Warum | Aufwand |
|---|---|---|
| Nach Drehen des iPhones (Größenänderung) können Pilze außerhalb des sichtbaren Bereichs liegen. | Nicht gemeldet, keine neuen Funktionen im Auftrag. Frage an den Spiel-Leiter. | Klein: bei `resize` Pilze in den Bereich schieben. |
| Kein Neustart, keine Pause beim Tab-Wechsel. Die Delta-Zeit-Deckelung verhindert aber einen Sprung nach der Rückkehr. | Nicht im Auftrag. | Klein. |
| Auf sehr kleinen Bildschirmen (unter etwa 300 Punkte hoch) liegen alle Pilze in einer Reihe, und nach 20 Versuchen darf ein neuer Pilz doch nahe der Figur entstehen. | Kommt auf dem iPhone nicht vor. | Klein. |
| `main.js` macht noch Bildschirm, Joystick, Regeln und Zeichnen in einer Datei (125 Zeilen). | Klein genug; Aufteilen wäre Umbau ohne Auftrag. | Mittel, beim nächsten Auftrag in diesem Spiel. |
