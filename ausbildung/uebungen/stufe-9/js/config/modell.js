// Modell-Seite (modell.html): Boot aus assets/modelle/boot.glb drehend zeigen.
export const MODELL = {
  name: 'boot',               // Name im Manifest
  drehTempo: 0.6,             // Bogenmaß pro Sekunde
  ersatzGroesse: [1.2, 0.8, 3],   // Box in Metern (Breite, Höhe, Länge des Boots), falls das Modell fehlt
  ersatzFarbe: 0xd8452e,      // wie der Rumpf
  kamera: { sicht: 45, x: 5.5, y: 4, z: 7, blickY: 1.1 },   // Blickwinkel in Grad, Position und Blickhöhe in Metern
  himmel: 0x9fd4f0,           // Hintergrund
  licht: { himmel: 0xffffff, boden: 0x557744, staerke: 1.2, sonne: 1.6, sonneX: 3, sonneY: 6, sonneZ: 4 },
  antialias: true,            // bei Ruckeln zuerst ausschalten
};
