// Der Held (Bilder vom Zeichner: figuren/held-steht, held-lauf-1 … 6, Meldung Stufe 9).
export const HELD = {
  tempo: 170,           // Punkte pro Sekunde bei vollem Joystick-Ausschlag (Wert für Lukas zum Testen)
  bpsGehen: 10,         // Bilder pro Sekunde der Lauf-Animation bei kleinem Ausschlag (Meldung: 10 Gehen)
  bpsRennen: 14,        // … bei vollem Ausschlag (Meldung: bis 14 Rennen)
  skala: 0.5,           // Atlas-Pixel → Punkte (Bilder doppelt aufgelöst): 256 px hoch → 128 Punkte
  bodenAnteil: 0.66,    // Fußpunkt bei 66 % der Bildschirmhöhe
  rand: 36,             // Punkte Abstand zum Bildschirmrand, weiter läuft er nicht
  schattenBreite: 34,   // halbe Breite des Bodenschattens in Punkten
  schattenHoehe: 8,     // halbe Höhe des Bodenschattens in Punkten
};

export const ANIMATIONEN = {
  laufen: 'held-lauf',  // Namen im Atlas (aus den Bildnamen des Zeichners)
  stehen: 'held-steht',
  muenze: 'muenze',
  explosion: 'explosion',
};
