// Regeln für den Spieler: Bewegung in der Ebene, im Spielfeld gehalten, gelaufener Weg.
// Ohne Browser (mit node testbar, tests/__NAME__-test.js). Einheiten: 2D Punkte, 3D Meter (y ist dort z).
// spieler = { x, y, weg, laeuft, blick }   y wächst nach unten (2D) bzw. zum Betrachter hin (3D); weg: Summe seit
//   Rundenbeginn; laeuft: hat sich im letzten Bild mit Zeit bewegt (an der Wand: nein); blick: 1 rechts, −1 links.
//   Die Regel entscheidet laeuft und blick, die Darstellung wählt daraus nur die Animation (Stand oder Lauf).
// feld = { minX, minY, maxX, maxY }: erlaubter Bereich (die Darstellung setzt ihn, 2D bei jeder Größenänderung)
// eingabe = { x, y }: Richtung −1 … 1, Länge höchstens 1 (bausteine/joystick.js)

export function erstelleSpieler() { return { x: 0, y: 0, weg: 0, laeuft: false, blick: 1 }; }

export function setzeSpieler(spieler, x, y) {
  spieler.x = x;
  spieler.y = y;
  spieler.weg = 0;
  spieler.laeuft = false;
}

export function halteImFeld(spieler, feld) {
  spieler.x = Math.min(Math.max(spieler.x, feld.minX), feld.maxX);
  spieler.y = Math.min(Math.max(spieler.y, feld.minY), feld.maxY);
}

// tempo: Einheiten pro Sekunde bei vollem Ausschlag. Mit Delta-Zeit: gleich schnell auf jedem Gerät.
// dt = 0 kommt vor (die Schleife liefert nach einem verspäteten Bild absichtlich 0, Lernbuch Stufe 1): Dann ändert sich
// nichts, auch laeuft nicht (sonst kippt die Figur ein Bild lang auf „steht“ und die Lauf-Animation beginnt von vorn).
export function bewegeSpieler(spieler, eingabe, dt, tempo, feld) {
  if (!(dt > 0)) return;
  if (eingabe.x !== 0) spieler.blick = eingabe.x < 0 ? -1 : 1;   // Blick bleibt beim Hoch- und Runterlaufen
  const altX = spieler.x, altY = spieler.y;
  spieler.x += eingabe.x * tempo * dt;
  spieler.y += eingabe.y * tempo * dt;
  halteImFeld(spieler, feld);
  const wx = spieler.x - altX, wy = spieler.y - altY;
  const schritt = Math.sqrt(wx * wx + wy * wy);   // nicht Math.hypot: legt in V8 Speicher an (Lernbuch Stufe 3)
  spieler.weg += schritt;
  spieler.laeuft = schritt > 0;
}

// Berührt die Figur etwas an (x, y)? Kreis um die Körpermitte: beruehrung = { hoehe, radius } aus config/welt.js
// (2D: hoehe Punkte über dem Fuß, y wächst nach unten; 3D: hoehe 0). Grenze zählt als Berührung. Ohne Wurzel.
export function beruehrt(spieler, x, y, beruehrung) {
  const dx = x - spieler.x, dy = y - (spieler.y - beruehrung.hoehe);
  return dx * dx + dy * dy <= beruehrung.radius * beruehrung.radius;
}
