// Würfel-Floß (Paket 01). Wird in Paket 02 durch das Raster-Floß ersetzt. Nur Daten.
export const FLOSS = {
  groesse: 1.6,          // Kantenlänge in Metern
  hoehe: 1.6,            // gleich der Kante: ein Würfel
  farbe: 0xc8924f,       // Holzbraun
  tempo: 4,              // Meter pro Sekunde bei vollem Joystick (Wert für Lukas zum Testen)
  drehTempo: 6,          // wie schnell es sich zur Fahrtrichtung dreht (Wert für Lukas zum Testen)
  // Schaukeln auf den Wellen: Neigung im Bogenmaß und Takt je Achse (verschieden, damit es natürlich wirkt).
  schaukelStaerke: 0.06,
  schaukelTaktX: 1.7,
  schaukelTaktZ: 1.3,
};
