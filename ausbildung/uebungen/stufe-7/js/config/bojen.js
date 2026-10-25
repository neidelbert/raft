// Einstellwerte der Bojen (nur Daten, jede Zahl kommentiert).
export const BOJEN = {
  anzahl: 30,              // aus dem Auftrag
  bereich: 22,             // Meter: Bojen liegen zwischen −bereich und +bereich (x und z)
  abstandMin: 3.5,           // Meter: so weit liegen Bojen mindestens auseinander
  startFrei: 5,            // Meter um den Start des Boots ohne Boje
  versucheMax: 60,         // Versuche je Boje, einen freien Platz zu finden (danach liegt sie, wo der letzte Versuch war)
  radius: 0.45,            // Meter: Berührungskreis einer Boje
  huepfHoehe: 1.2,         // Meter: höchster Punkt des Hüpfers; Wert für Lukas zum Testen
  huepfDauer: 0.6,         // Sekunden in der Luft; Wert für Lukas zum Testen
  farben: {
    koerper: 0xf03c2e,     // Rot
    streifen: 0xffffff,    // weißer Ring
    spitze: 0xffd23c,      // gelbe Spitze
  },
};
