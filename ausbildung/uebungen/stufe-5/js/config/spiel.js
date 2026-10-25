// Einstellwerte des Pilzsammlers. Alle Längen in CSS-Punkten, Zeiten in Sekunden.
// Die Werte entsprechen dem alten Spiel (dort pro Bild bei 60 Bildern/s), damit es sich auf 60-Hz-Geräten gleich anfühlt.

export const SPIELER = {
  tempo: 240,        // Punkte pro Sekunde bei vollem Joystick (früher 4 Punkte pro Bild × 60 Bilder/s)
  radius: 18,        // Größe der blauen Figur
  randAbstand: 20,   // so nah darf die Figur an den Bildschirmrand
};

export const PILZE = {
  anzahl: 8,             // so viele Pilze liegen immer auf der Wiese
  sammelAbstand: 34,     // Abstand Figur–Pilz, ab dem ein Pilz eingesammelt ist
  neuAbstand: 80,        // ein neuer Pilz entsteht mindestens so weit von der Figur weg (sonst wäre er sofort wieder weg)
  neuVersuche: 20,       // so oft wird eine Stelle gewürfelt, bevor die letzte genommen wird (sehr kleiner Bildschirm)
  randX: 30,             // Abstand zum linken und rechten Rand
  randOben: 80,          // Abstand nach oben (Platz für die Anzeige)
  randUnten: 200,        // Abstand nach unten (Platz für den Joystick)
  hutRadius: 12,         // Größe des roten Huts
  stielBreite: 8,        // Stiel
  stielHoehe: 10,
};

export const JOYSTICK = {
  weg: 50,           // so weit lässt sich der Knopf aus der Mitte ziehen (voller Ausschlag)
};

export const ZEIT = {
  maxSchritt: 0.1,   // längster Zeitschritt pro Bild (nach Ruckler oder Tab-Wechsel springt die Figur nicht)
};

export const SPEICHER = {
  schluessel: 'pilz-rekord', // Name im localStorage, wie im alten Spiel (alte Rekorde bleiben erhalten)
};
