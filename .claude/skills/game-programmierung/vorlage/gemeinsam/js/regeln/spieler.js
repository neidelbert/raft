// Regeln für den Spieler: Bewegung in der Ebene, im Spielfeld gehalten, gelaufener Weg.
// Ohne Browser (mit node testbar, tests/__NAME__-test.js). Einheiten: 2D Punkte, 3D Meter (y ist dort z).
// spieler = { x, y, weg }   y wächst nach unten (2D) bzw. zum Betrachter hin (3D); weg: Summe seit Rundenbeginn
// feld = { minX, minY, maxX, maxY }: erlaubter Bereich (die Darstellung setzt ihn, 2D bei jeder Größenänderung)
// eingabe = { x, y }: Richtung −1 … 1, Länge höchstens 1 (bausteine/joystick.js)

export function erstelleSpieler() { return { x: 0, y: 0, weg: 0 }; }

export function setzeSpieler(spieler, x, y) {
  spieler.x = x;
  spieler.y = y;
  spieler.weg = 0;
}

export function halteImFeld(spieler, feld) {
  spieler.x = Math.min(Math.max(spieler.x, feld.minX), feld.maxX);
  spieler.y = Math.min(Math.max(spieler.y, feld.minY), feld.maxY);
}

// tempo: Einheiten pro Sekunde bei vollem Ausschlag. Mit Delta-Zeit: gleich schnell auf jedem Gerät.
export function bewegeSpieler(spieler, eingabe, dt, tempo, feld) {
  const altX = spieler.x, altY = spieler.y;
  spieler.x += eingabe.x * tempo * dt;
  spieler.y += eingabe.y * tempo * dt;
  halteImFeld(spieler, feld);
  const wx = spieler.x - altX, wy = spieler.y - altY;
  spieler.weg += Math.sqrt(wx * wx + wy * wy);   // nicht Math.hypot: legt in V8 Speicher an (Lernbuch Stufe 3)
}

// Berührt die Figur etwas an (x, y)? Kreis um die Körpermitte: beruehrung = { hoehe, radius } aus config/welt.js
// (2D: hoehe Punkte über dem Fuß, y wächst nach unten; 3D: hoehe 0). Grenze zählt als Berührung. Ohne Wurzel.
export function beruehrt(spieler, x, y, beruehrung) {
  const dx = x - spieler.x, dy = y - (spieler.y - beruehrung.hoehe);
  return dx * dx + dy * dy <= beruehrung.radius * beruehrung.radius;
}
