// Figur-Regeln ohne DOM (auch mit node testbar).
// Ein Spieler ist { x, y, springt, sprungZeit, breite, hoehe }:
//   x, y = Mitte der Figur in CSS-Punkten; springt = true während des Sprungs (nur optisch, y ändert sich nicht);
//   sprungZeit = Sekunden seit Sprungbeginn; breite, hoehe = angezeigte Größe in Punkten.

export function erstelleSpieler({ x, y, breite, hoehe }) {
  return { x, y, springt: false, sprungZeit: 0, breite, hoehe };
}

// Bewegt um Richtung (rx, ry) × tempo × dt. Schräg ist nicht schneller: Länge über 1 wird auf 1 gekürzt.
export function bewegeSpieler(spieler, rx, ry, tempo, dt, feldBreite, feldHoehe, sprungHoehe) {
  const laenge = Math.hypot(rx, ry);
  if (laenge > 1) { rx /= laenge; ry /= laenge; }
  spieler.x += rx * tempo * dt;
  spieler.y += ry * tempo * dt;
  haltImBild(spieler, feldBreite, feldHoehe, sprungHoehe);
}

// Figur ganz im Bildschirm halten. Oben zählt die Sprunghöhe mit, damit der Kopf auch im Sprung sichtbar bleibt.
export function haltImBild(spieler, feldBreite, feldHoehe, sprungHoehe) {
  const halbB = spieler.breite / 2, halbH = spieler.hoehe / 2;
  spieler.x = begrenze(spieler.x, halbB, feldBreite - halbB, feldBreite / 2);
  spieler.y = begrenze(spieler.y, halbH + sprungHoehe, feldHoehe - halbH, feldHoehe / 2);
}

// Wert in [min, max]; ist der Bildschirm kleiner als die Figur, in die Mitte.
function begrenze(wert, min, max, mitte) {
  if (max < min) return mitte;
  return Math.min(Math.max(wert, min), max);
}

// Sprung starten. Während eines Sprungs zählt ein weiterer Druck nicht (kein Doppelsprung).
export function starteSprung(spieler) {
  if (spieler.springt) return;
  spieler.springt = true;
  spieler.sprungZeit = 0;
}

export function aktualisiereSprung(spieler, dt, dauer) {
  if (!spieler.springt) return;
  spieler.sprungZeit += dt;
  if (spieler.sprungZeit >= dauer) { spieler.springt = false; spieler.sprungZeit = 0; }
}

// Wie hoch die Figur gerade in der Luft ist, 0 bis 1 (Bogen: hoch und wieder runter).
export function sprungAnteil(spieler, dauer) {
  return spieler.springt ? Math.sin((Math.PI * spieler.sprungZeit) / dauer) : 0;
}

// Figur mit Schatten zeichnen. Fehlt das Bild, ein Kreis mit Umriss als Ersatz.
export function zeichneSpieler(ctx, spieler, bild, einstellung, farben) {
  const anteil = sprungAnteil(spieler, einstellung.sprungDauer);
  const fussY = spieler.y + spieler.hoehe / 2;
  const schatten = (spieler.breite * einstellung.schattenBreite) / 2
    * (1 - (1 - einstellung.schattenKleinster) * anteil);
  ctx.fillStyle = farben.schatten;
  ctx.beginPath();
  ctx.ellipse(spieler.x, fussY, schatten, schatten / 3, 0, 0, Math.PI * 2);
  ctx.fill();

  const oben = fussY - spieler.hoehe - anteil * einstellung.sprungHoehe;
  if (bild) {
    ctx.drawImage(bild, spieler.x - spieler.breite / 2, oben, spieler.breite, spieler.hoehe);
    return;
  }
  const r = Math.min(spieler.breite, spieler.hoehe) / 2;
  ctx.fillStyle = farben.ersatzFigur;
  ctx.strokeStyle = farben.ersatzUmriss;
  ctx.lineWidth = einstellung.ersatzLinie;
  ctx.beginPath();
  ctx.arc(spieler.x, oben + spieler.hoehe / 2, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}
