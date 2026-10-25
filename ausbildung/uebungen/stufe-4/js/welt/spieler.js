// Figur-Regeln ohne DOM (auch mit node testbar).
// Ein Spieler ist { x, y, springt, sprungZeit, breite, hoehe, leben, unverwundbar, schutz }:
//   x, y = Mitte der Figur in CSS-Punkten; springt = true während des Sprungs (nur optisch, y ändert sich nicht);
//   sprungZeit = Sekunden seit Sprungbeginn; breite, hoehe = angezeigte Größe in Punkten;
//   leben, unverwundbar, schutz = Treffer-Zustand (Regeln in treffer.js).

export function erstelleSpieler({ x, y, breite, hoehe, leben }) {
  return { x, y, springt: false, sprungZeit: 0, breite, hoehe, leben, unverwundbar: false, schutz: 0 };
}

// Neue Runde: an die Stelle (x, y), volle Leben, kein Sprung, kein Schutz.
export function setzeSpielerZurueck(spieler, x, y, leben) {
  spieler.x = x; spieler.y = y; spieler.leben = leben;
  spieler.springt = false; spieler.sprungZeit = 0; spieler.unverwundbar = false; spieler.schutz = 0;
}

// Bewegt um Richtung (rx, ry) × tempo × dt. Schräg ist nicht schneller: Länge über 1 wird auf 1 gekürzt.
export function bewegeSpieler(spieler, rx, ry, tempo, dt, feldBreite, feldHoehe, sprungHoehe) {
  const laenge = Math.sqrt(rx * rx + ry * ry);   // nicht Math.hypot: legt in V8 bei jedem Aufruf Speicher an
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

// Blinken während der Schutzzeit: abwechselnd halb durchsichtig und voll sichtbar.
function deckkraft(spieler, einstellung) {
  if (!spieler.unverwundbar) return 1;
  const phase = Math.floor(spieler.schutz * einstellung.blinkenProSekunde * 2);
  return phase % 2 === 0 ? einstellung.blinkenDurchsicht : 1;
}

// Figur mit Schatten zeichnen. Fehlt das Bild, ein Kreis mit Umriss als Ersatz.
export function zeichneSpieler(ctx, spieler, bild, einstellung, farben) {
  ctx.globalAlpha = deckkraft(spieler, einstellung);
  zeichneFigur(ctx, spieler, bild, einstellung, farben);
  ctx.globalAlpha = 1;
}

// Alle Maße auf ganze Punkte gerundet: Kommazahlen an Canvas-Befehle packt Chrome pro Aufruf in neuen Speicher
// (Lernbuch Stufe 3, Schuld aus Übung 3). Bei 220 Punkten/s Lauftempo sieht man die Rundung nicht.
function zeichneFigur(ctx, spieler, bild, einstellung, farben) {
  const anteil = sprungAnteil(spieler, einstellung.sprungDauer);
  const x = Math.round(spieler.x), breite = Math.round(spieler.breite), hoehe = Math.round(spieler.hoehe);
  const fussY = Math.round(spieler.y + hoehe / 2);
  const schatten = Math.round((breite * einstellung.schattenBreite) / 2 * (1 - (1 - einstellung.schattenKleinster) * anteil));
  ctx.fillStyle = farben.schatten;
  ctx.beginPath();
  ctx.ellipse(x, fussY, schatten, Math.round(schatten / 3), 0, 0, VOLLKREIS);
  ctx.fill();

  const oben = fussY - hoehe - Math.round(anteil * einstellung.sprungHoehe);
  if (bild) {
    ctx.drawImage(bild, x - Math.round(breite / 2), oben, breite, hoehe);
    return;
  }
  ctx.fillStyle = farben.ersatzFigur;
  ctx.strokeStyle = farben.ersatzUmriss;
  ctx.lineWidth = einstellung.ersatzLinie;
  ctx.beginPath();
  ctx.arc(x, oben + Math.round(hoehe / 2), Math.round(Math.min(breite, hoehe) / 2), 0, VOLLKREIS);
  ctx.fill();
  ctx.stroke();
}

const VOLLKREIS = Math.PI * 2;
