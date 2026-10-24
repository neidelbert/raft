# Paket 02: Floß aus Rasterfeldern
Ziel: Das Würfel-Floß aus Paket 01 wird durch ein Floß aus gleich großen Rasterfeldern ersetzt, auf dem die Figur läuft.
Gehört dazu:
- Floß als Raster gespeichert (Liste belegter Felder mit Spalte/Zeile), nicht als ein Würfel
- Jedes belegte Feld wird als eigene Bodenplatte angezeigt
- Startfloß mit vorläufig 2 × 2 Feldern
- Das ganze Floß wippt als Einheit auf den Wellen (wie der Würfel in Paket 01)
- Figur läuft mit dem Joystick über alle Felder; am Rand eines Feldes ohne Nachbarn bleibt sie stehen
- Einstellwerte in der Konfigurationsdatei des Floßes:
  - Feldgröße (vorläufig 1,5 Einheiten) – Wert für Lukas zum Testen
  - Startgröße (vorläufig 2 × 2) – Wert für Lukas zum Testen
Gehört nicht dazu:
- Bauen neuer Felder (Paket 03), Material (Paket 04), Speichern (Paket 05)
- Ins Wasser springen oder schwimmen
- Schaden am Floß durch den Hai
- Wände, Treppen, andere Bauteile
Abhängig von: 01
Technik-Frage: Wie wird das Raster im Code abgelegt (z. B. Tabelle „Spalte,Zeile“ → Feld), damit Bauen, Speichern und später Hai-Schaden darauf aufbauen können? Und wo liegt die Konfigurationsdatei?
Fertig, wenn:
- Beim Start sind genau 4 Bodenplatten in einem 2 × 2-Quadrat sichtbar, kein Würfel mehr
- Wird die Startgröße in der Konfigurationsdatei auf 3 × 3 gesetzt, erscheinen nach Neuladen 9 Platten
- Wird die Feldgröße geändert, ändern sich alle Platten gleich und ohne Lücken oder Überlappung
- Alle Platten bewegen sich gemeinsam mit den Wellen, zwischen den Platten entsteht keine sichtbare Lücke
- Die Figur kann jedes der 4 Felder betreten und verlässt das Floß an keinem Rand (10 Versuche je Seite)
- Keine Fehlermeldung in der Konsole beim Start und nach 5 Minuten Laufen
Testaufgabe: Spiel auf dem iPhone in Safari öffnen, Platten zählen (4), mit dem Joystick jede Platte betreten, dann an allen vier Rändern gegen die Kante laufen: Figur bleibt auf dem Floß.
Freigegeben:
