// Alle Einstellwerte des Prototyps an einer Stelle.
export const KONFIGURATION = {
  grafik: {
    maxPixelRatio: 2,
    himmelFarbe: 0x6fc3e8,
    nebelNah: 25,
    nebelFern: 70,
  },
  licht: {
    umgebungStaerke: 0.9,
    sonneStaerke: 1.6,
    sonnePosition: [20, 40, 10],
  },
  wasser: {
    groesse: 160,          // Kantenlänge der Fläche in Metern
    segmente: 48,          // Unterteilungen je Kante (wenig Polygone)
    farbe: 0x1f8fd6,
    wellenHoehe: 0.25,
    wellenLaenge: 9,
    wellenTempo: 1.2,
  },
  floss: {
    groesse: 1.6,
    hoehe: 1.6,          // gleich groß wie die Kante: Würfel laut Paket
    farbe: 0xc8924f,
    tempo: 4,              // Meter pro Sekunde bei vollem Joystick
    drehTempo: 6,          // wie schnell sich das Floß zur Fahrtrichtung dreht
    schaukelStaerke: 0.06,
  },
  kamera: {
    sichtfeld: 50,
    hoehe: 18,
    abstand: 10,           // nach hinten (zum Spieler hin) versetzt
    nachziehen: 5,         // je größer, desto direkter folgt die Kamera
  },
  joystick: {
    radius: 50,            // maximaler Weg des Knopfs in Pixeln
    totzone: 0.12,
  },
};
