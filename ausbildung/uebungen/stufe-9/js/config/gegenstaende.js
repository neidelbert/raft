// Münzen und Explosionen (Bilder vom Zeichner: gegenstaende/muenze-1 … 6, effekte/explosion-1 … 6).
export const MUENZEN = {
  orteX: [0.14, 0.38, 0.62, 0.86],   // Anteile der Bildschirmbreite (vier Münzen in einer Reihe)
  hoeheAnteil: 0.4,     // Mitte der Münzen bei 40 % der Bildschirmhöhe
  skala: 0.4,           // 128 px → 51 Punkte
  versatz: 0.15,        // s Zeitversatz von Münze zu Münze, damit sie sich nicht im Gleichtakt drehen
  schweben: 6,          // Punkte auf und ab
  schwebTempo: 2.2,     // Schweben: Bogenmaß pro Sekunde
  schattenAbstand: 34,  // Punkte von der Münzmitte nach unten bis zum Schatten
  schattenBreite: 14,   // halbe Breite des Schattens in Punkten
  schattenHoehe: 4,     // halbe Höhe des Schattens in Punkten
};

export const EXPLOSION = {
  max: 8,               // höchstens so viele gleichzeitig (fester Vorrat, keine neuen Objekte)
  skala: 0.75,          // 128 px → 96 Punkte
  sound: 'explosion',   // Name im Manifest
};
