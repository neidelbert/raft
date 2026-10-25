// Einstellwerte der Sterne zum Einsammeln (nur Daten, jede Zahl kommentiert).
export const STERNE = {
  erscheinenAlle: 2,       // Sekunden zwischen zwei neuen Sternen (aus dem Auftrag)
  max: 8,                  // höchstens so viele Sterne gleichzeitig liegen; Wert für Lukas zum Testen
  groesse: 34,             // Punkte: angezeigte Kantenlänge (das Bild ist 128 × 128); Wert für Lukas zum Testen
  sammelRadius: 30,        // Punkte: so nah müssen sich Figur und Stern (Mitten) kommen; Wert für Lukas zum Testen
  rand: 30,                // Punkte: Abstand neuer Sterne zum Bildschirmrand
  randOben: 150,           // Punkte: oben frei für Notch (bis 59), Leiste und Ton-Knopf (endet bei etwa 140)
  randUnten: 150,          // Punkte: unten frei für den Sprung-Knopf (mit Home-Balken bis etwa 140 vom Rand)
  abstandSpielerMin: 90,   // Punkte: so nah an der Figur erscheint kein Stern (sonst wäre er sofort eingesammelt)
  versuche: 8,             // so oft wird eine freie Stelle gesucht; klappt es nie, fällt dieser Stern aus
};
