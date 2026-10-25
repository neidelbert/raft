// Einstellwerte der Figur (nur Daten, jede Zahl kommentiert).
export const SPIELER = {
  laufTempo: 220,          // Punkte pro Sekunde bei vollem Ausschlag (aus dem Auftrag)
  hoehe: 72,               // Punkte: angezeigte Höhe der Figur; Breite folgt aus dem Bild; Wert für Lukas zum Testen
  breiteErsatz: 60,        // Punkte: Breite, falls das Bild fehlt (Seitenverhältnis 213:256 wie figur.png)
  sprungDauer: 0.4,        // Sekunden in der Luft (aus dem Auftrag)
  sprungHoehe: 28,         // Punkte: höchster Punkt des Sprungs (nur optisch); Wert für Lukas zum Testen
  schattenBreite: 0.8,     // Anteil der Figurbreite für den Schatten am Boden
  schattenKleinster: 0.6,  // Schattengröße im höchsten Punkt des Sprungs (Anteil), damit man das Hüpfen sieht
  ersatzLinie: 3,          // Punkte: Umriss des Ersatzkreises, falls figur.png fehlt
};
