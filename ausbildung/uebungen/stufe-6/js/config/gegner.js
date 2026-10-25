// Einstellwerte der Gegner (nur Daten, jede Zahl kommentiert).
export const GEGNER = {
  max: 240,                // höchstens so viele Gegner gleichzeitig (aus dem Auftrag, Grenze für den Pool)
  tempo: 70,               // Punkte pro Sekunde zum Spieler; Wert für Lukas zum Testen
  tempoStreuung: 0.25,     // ± Anteil: jeder Gegner ist etwas schneller oder langsamer, damit sie nicht im Gleichschritt klumpen
  radius: 12,              // Punkte: Kreis für Kollision und Abstand; Wert für Lukas zum Testen
  hoehe: 30,               // Punkte: angezeigte Höhe des Bildes (Breite folgt aus dem Bild)
  breiteErsatz: 33,        // Punkte: Breite, falls gegner.png fehlt (Seitenverhältnis 256:230 wie das Bild)
  erscheinenAlle: 0.25,    // Sekunden zwischen zwei neuen Gegnern (240 nach einer Minute); Wert für Lukas zum Testen
  randTiefe: 60,           // Punkte: neue Gegner erscheinen in diesem Streifen außerhalb des Bildschirmrands
  abstandSpielerMin: 120,  // Punkte: so nah am Spieler erscheint kein neuer Gegner (Spieler steht am Rand)
  ankommen: 4,             // Punkte: näher am Spieler läuft ein Gegner nicht weiter (kein Zittern auf der Stelle)
  trennAbstand: 2,         // Vielfaches des Radius: unter diesem Abstand schieben sich zwei Gegner auseinander
  trennTempo: 360,         // Punkte pro Sekunde Ausweichen bei voller Überlappung (sanft, nicht hart)
  gedraengeBremse: 3,      // so stark bremst Enge das Nachlaufen: ab einer Überlappungssumme von 1/3 läuft ein Gegner nicht weiter
  trennMax: 1.5,           // höchste Summe der Schübe pro Gegner (Anteil von trennTempo), gegen Hochschießen im Gedränge
  zelle: 32,               // Punkte: Kantenlänge einer Gitterzelle, mindestens radius × trennAbstand
};
