// Fahrregeln des Boots (reine Rechnung ohne Three.js, auch mit node testbar).
// Ein Boot ist { x, z, richtung }: Lage auf dem Wasser in Metern, richtung = Drehung um die Hochachse
// (Bogenmaß, 0 = Bug zeigt nach −z, also vom Bildschirm weg).
// Joystick: eingabe.x nach rechts → +x, eingabe.y nach unten → +z (Joystick oben = −z).

export function erstelleFahrt() {
  return { x: 0, z: 0, richtung: 0 };
}

// Bewegt um Richtung (rx, ry) × tempo × dt. Schräg ist nicht schneller. Ohne Eingabe steht das Boot sofort.
export function fahre(boot, rx, ry, tempo, drehTempo, dt) {
  const laenge = Math.sqrt(rx * rx + ry * ry);
  if (laenge === 0) return;
  const anteil = laenge > 1 ? 1 / laenge : 1;
  boot.x += rx * anteil * tempo * dt;
  boot.z += ry * anteil * tempo * dt;
  boot.richtung = dreheZu(boot.richtung, Math.atan2(-rx, -ry), 1 - Math.exp(-drehTempo * dt));
}

// Winkel weich zum Ziel drehen, immer den kürzeren Weg. Ergebnis bleibt zwischen −π und π.
export function dreheZu(winkel, ziel, anteil) {
  let unterschied = ziel - winkel;
  unterschied = Math.atan2(Math.sin(unterschied), Math.cos(unterschied));
  const neu = winkel + unterschied * anteil;
  return Math.atan2(Math.sin(neu), Math.cos(neu));
}
