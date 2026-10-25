// Einstellwerte für Wasser und Wellen (nur Daten, jede Zahl kommentiert).
export const WASSER = {
  groesse: 80,             // Meter Kantenlänge; die Fläche wandert mit dem Boot mit und wirkt so endlos
  segmente: 40,            // Unterteilungen je Kante (41 × 41 Punkte = 3.200 Dreiecke)
};

// Wellen = Summe von drei Sinuswellen. hoehe in Metern, laenge in Metern, tempo in Bogenmaß pro Sekunde.
// richtungX/richtungZ: Laufrichtung der Welle (wird nicht normiert, nur das Verhältnis zählt).
export const WELLEN = [
  { hoehe: 0.3, laenge: 9, tempo: 1.1, richtungX: 1, richtungZ: 0.3 },   // lange Grunddünung; Wert für Lukas zum Testen
  { hoehe: 0.16, laenge: 5, tempo: 1.7, richtungX: -0.4, richtungZ: 1 },  // kreuzende Welle
  { hoehe: 0.06, laenge: 2.6, tempo: 2.6, richtungX: 0.7, richtungZ: -1 }, // kleines Kräuseln
];
