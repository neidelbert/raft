// Einstellwerte für Übung 1 (nur Daten, jede Zahl kommentiert).
export const SPIEL = {
  ballTempo: 300,          // Punkte pro Sekunde (aus dem Auftrag)
  ballRadius: 18,          // Punkte; Wert für Lukas zum Testen
  startWinkelMin: 25,      // Grad zur Waagrechten: kleinster Startwinkel, damit der Ball sichtbar schräg fliegt
  startWinkelMax: 65,      // Grad zur Waagrechten: größter Startwinkel
  deltaMax: 0.1,           // Sekunden: längster Zeitschritt pro Bild, verhindert Sprünge nach Rucklern
  pixelRatioMax: 2,        // höchste Pixel-Ratio: schärfer bringt auf dem iPhone kaum etwas, kostet aber Leistung
};

export const FARBEN = {
  hintergrund: '#14161c',  // dunkler Hintergrund
  ball: '#ffb43c',         // Ballfarbe; Wert für Lukas zum Testen
};
