// Allgemeine Einstellwerte für Übung 2 (nur Daten, jede Zahl kommentiert).
export const SPIEL = {
  deltaMax: 0.1,           // Sekunden: längster Zeitschritt pro Bild, verhindert Sprünge nach Rucklern
  pixelRatioMax: 2,        // höchste Pixel-Ratio: schärfer bringt auf dem iPhone kaum etwas, kostet aber Leistung
};

export const FARBEN = {
  hintergrund: '#1d2a22',  // dunkles Grün als Boden; Wert für Lukas zum Testen
  schatten: 'rgba(0, 0, 0, 0.35)',       // Schatten unter der Figur
  ersatzFigur: '#ffb43c',  // Ersatzkreis, falls figur.png fehlt
  ersatzUmriss: '#3a2a10', // Umriss des Ersatzkreises
  joystickRing: 'rgba(255, 255, 255, 0.35)',  // äußerer Ring des Joysticks
  joystickKnopf: 'rgba(255, 255, 255, 0.6)',  // Daumen-Knopf des Joysticks
};

// Bild aus grafik/grafik.json
export const BILDER = {
  figur: 'figuren/figur',
};
