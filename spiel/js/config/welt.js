// Welt: Himmel, Nebel, Licht und Wasser. Nur Daten.
export const WELT = {
  // Himmel und Nebel (Nebel lässt den Rand der Wasserfläche verschwinden).
  himmelFarbe: 0x6fc3e8,
  nebelNah: 25,           // ab hier beginnt der Nebel (Meter)
  nebelFern: 70,          // ab hier ist alles Nebel (Meter)

  // Licht: genau 2 Lichter (Budget LEISTUNG.lichterMax).
  licht: {
    himmelFarbe: 0xffffff,          // Umgebungslicht von oben
    bodenFarbe: 0x225577,           // Umgebungslicht von unten (Wasser)
    umgebungStaerke: 0.9,
    sonneFarbe: 0xffffff,
    sonneStaerke: 1.6,
    sonnePosition: [20, 40, 10],    // Richtung der Sonne (x, y, z)
  },

  // Wasser: eine Fläche, die mit dem Floß mitwandert (wirkt endlos).
  wasser: {
    groesse: 160,          // Kantenlänge der Fläche in Metern
    segmente: 48,          // Unterteilungen je Kante (49 × 49 = 2.401 Punkte, wenig Polygone)
    farbe: 0x1f8fd6,
    wellenHoehe: 0.25,     // größter Ausschlag nach oben und unten in Metern (Wert für Lukas zum Testen)
    wellenLaenge: 9,       // Meter von Berg zu Berg (Wert für Lukas zum Testen)
    wellenTempo: 1.2,      // wie schnell die Wellen laufen (Wert für Lukas zum Testen)
    // Zweite Welle in z-Richtung: etwas länger und schneller, damit das Muster nicht gleichförmig wirkt.
    zweiteWelleLaenge: 0.8,  // Anteil der Wellenzahl der ersten Welle
    zweiteWelleTempo: 1.3,   // Anteil des Tempos der ersten Welle
  },
};
