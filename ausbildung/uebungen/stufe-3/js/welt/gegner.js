// Gegner-Schwarm: bis zu GEGNER.max Gegner aus einem festen Vorrat (Pool), Nachbarsuche über ein Gitter.
// Regeln ohne DOM (auch mit node testbar); nur zeichneGegner braucht einen Canvas.
// Der Schwarm ist { x, y, tempo, vx, vy, anzahl, reihenfolge, gefroren, uhr, gitter, einstellung }:
//   Gegner i (0 … anzahl-1) steht bei x[i], y[i] (Mitte in CSS-Punkten), läuft mit tempo[i] (Punkte/s, leicht gestreut)
//   und bewegt sich in diesem Bild mit vx[i], vy[i]. Alles feste Float64Arrays der Länge max: Das ist der Vorrat.
//   Es entstehen nie neue Objekte, und Kommazahlen darin brauchen nie neuen Speicher (in Objekt-Feldern kann
//   V8 sie einpacken, das kostete im Versuch bis zu 7 KB pro Schritt, siehe Lernbuch).
//   Aktive Gegner liegen dicht vorn; anzahl ist die Grenze. reihenfolge = Indizes nach y sortiert (zum Zeichnen);
//   gefroren = true hält alle Gegner an (Test); uhr = Sekunden seit dem letzten neuen Gegner.
import { erstelleGitter } from '../kern/gitter.js';

export function erstelleSchwarm(einstellung) {
  const max = einstellung.max;
  return {
    x: new Float64Array(max), y: new Float64Array(max), tempo: new Float64Array(max),
    vx: new Float64Array(max), vy: new Float64Array(max),
    anzahl: 0, reihenfolge: new Int32Array(max), gefroren: false, uhr: 0, einstellung,
    gitter: erstelleGitter(einstellung.zelle, max),
  };
}

// Breite des Streifens außerhalb des Bildschirms, in dem Gegner entstehen und den das Gitter abdeckt.
function randBreite(e) { return e.randTiefe + e.radius * 2; }

// Bei Start und Größenänderung: Gitter deckt Bildschirm plus Rand-Streifen ab.
export function passeSchwarmAn(schwarm, breite, hoehe) {
  const rand = randBreite(schwarm.einstellung);
  schwarm.gitter.passeAn(-rand, -rand, breite + rand, hoehe + rand);
}

// Alle Gegner zurück in den Vorrat (neue Runde).
export function leereSchwarm(schwarm) { schwarm.anzahl = 0; schwarm.uhr = 0; }

// Einen Gegner am Rand erzeugen. Gibt false zurück, wenn die Grenze erreicht ist (dann passiert nichts).
export function erzeugeGegner(schwarm, spieler, breite, hoehe, zufall) {
  const e = schwarm.einstellung, i = schwarm.anzahl;
  if (i >= e.max) return false;
  const tiefe = e.radius + zufall() * e.randTiefe;          // wie weit außerhalb des Randes
  let entlang = zufall() * 2 * (breite + hoehe);            // Stelle auf dem Umfang, jede Seite nach Länge gewichtet
  let x, y;
  if (entlang < breite) { x = entlang; y = -tiefe; }
  else if ((entlang -= breite) < hoehe) { x = breite + tiefe; y = entlang; }
  else if ((entlang -= hoehe) < breite) { x = entlang; y = hoehe + tiefe; }
  else { x = -tiefe; y = entlang - breite; }
  // Steht der Spieler am Rand, kommt der Gegner von der gegenüberliegenden Seite.
  const ax = x - spieler.x, ay = y - spieler.y;
  if (ax * ax + ay * ay < e.abstandSpielerMin * e.abstandSpielerMin) { x = breite - x; y = hoehe - y; }
  schwarm.x[i] = x;
  schwarm.y[i] = y;
  schwarm.tempo[i] = e.tempo * (1 + (zufall() * 2 - 1) * e.tempoStreuung);
  schwarm.reihenfolge[i] = i;
  schwarm.anzahl = i + 1;
  return true;
}

// Ein Spiel-Schritt: neue Gegner nach Zeitplan, Gitter füllen, zum Spieler laufen, sanft auseinanderschieben.
export function aktualisiereSchwarm(schwarm, spieler, dt, breite, hoehe, zufall) {
  if (schwarm.gefroren) return;
  const e = schwarm.einstellung;
  schwarm.uhr += dt;
  while (schwarm.uhr >= e.erscheinenAlle) {
    schwarm.uhr -= e.erscheinenAlle;
    if (!erzeugeGegner(schwarm, spieler, breite, hoehe, zufall)) { schwarm.uhr = 0; break; }   // voll: Uhr ruht
  }
  schwarm.gitter.fuelle(schwarm.x, schwarm.y, schwarm.anzahl);
  for (let i = 0; i < schwarm.anzahl; i++) richteAus(schwarm, i, spieler);
  // Erst alle Richtungen bestimmen, dann bewegen: so hängt das Ergebnis nicht von der Reihenfolge ab.
  const { x, y, vx, vy } = schwarm;
  for (let i = 0; i < schwarm.anzahl; i++) {
    x[i] += vx[i] * dt;
    y[i] += vy[i] * dt;
  }
}

// Geschwindigkeit eines Gegners: zum Spieler plus Schub weg von zu nahen Nachbarn (3 × 3 Gitterzellen).
function richteAus(schwarm, i, spieler) {
  const e = schwarm.einstellung, { x, y, gitter } = schwarm;
  const mindest = e.radius * e.trennAbstand, mindest2 = mindest * mindest;
  const gx = x[i], gy = y[i];
  let schubX = 0, schubY = 0, druck = 0;   // druck = Summe aller Überlappungen, egal aus welcher Richtung
  const sx = gitter.zelleX(gx), sy = gitter.zelleY(gy);
  for (let zy = Math.max(sy - 1, 0); zy <= Math.min(sy + 1, gitter.zeilen - 1); zy++) {
    for (let zx = Math.max(sx - 1, 0); zx <= Math.min(sx + 1, gitter.spalten - 1); zx++) {
      for (let j = gitter.erster(zx, zy); j !== -1; j = gitter.naechster[j]) {
        if (j === i) continue;
        const dx = gx - x[j], dy = gy - y[j], abstand2 = dx * dx + dy * dy;
        if (abstand2 >= mindest2) continue;
        if (abstand2 === 0) {   // genau aufeinander: entgegengesetzte Richtungen, fest je Paar (kein Zufall nötig)
          const winkel = Math.min(i, j), seite = i < j ? 1 : -1;
          schubX += Math.cos(winkel) * seite; schubY += Math.sin(winkel) * seite; druck += 1;
          continue;
        }
        const abstand = Math.sqrt(abstand2), staerke = (mindest - abstand) / mindest;  // 0 (berühren) bis 1 (deckungsgleich)
        schubX += (dx / abstand) * staerke;
        schubY += (dy / abstand) * staerke;
        druck += staerke;
      }
    }
  }
  const schub = Math.sqrt(schubX * schubX + schubY * schubY);   // nicht Math.hypot: das legt in V8 bei jedem Aufruf Speicher an
  if (schub > e.trennMax) { schubX *= e.trennMax / schub; schubY *= e.trennMax / schub; }
  // Im Gedränge bremsen: Wer schon eng an Nachbarn steht, drängt nicht weiter nach. Sonst drücken die hinteren
  // Reihen die vorderen zusammen (die Schübe heben sich in der Mitte auf) und die Gegner überlappen trotzdem.
  const bremse = Math.max(0, 1 - druck * e.gedraengeBremse);
  const zielX = spieler.x - gx, zielY = spieler.y - gy, ziel = Math.sqrt(zielX * zielX + zielY * zielY);
  const lauf = ziel > e.ankommen ? (schwarm.tempo[i] / ziel) * bremse : 0;
  schwarm.vx[i] = zielX * lauf + schubX * e.trennTempo;
  schwarm.vy[i] = zielY * lauf + schubY * e.trennTempo;
}

// Reihenfolge nach y sortieren. Einfügesortierung: Von Bild zu Bild ändert sich die Reihenfolge kaum, das ist fast linear.
export function sortiereNachY(schwarm) {
  const r = schwarm.reihenfolge, y = schwarm.y;
  for (let i = 1; i < schwarm.anzahl; i++) {
    const index = r[i], wert = y[index];
    let j = i - 1;
    while (j >= 0 && y[r[j]] > wert) { r[j + 1] = r[j]; j--; }
    r[j + 1] = index;
  }
}

// Gegner ab Position `von` der Reihenfolge zeichnen, bis einer bei y ≥ bisY steht. Gibt die nächste Position zurück,
// damit die Figur zwischen den Gegnern einsortiert gezeichnet werden kann.
// Alle Maße auf ganze Punkte gerundet: Kommazahlen an drawImage/arc packt Chrome pro Aufruf in neuen Speicher
// (im Test 6 KB pro Bild bei 240 Gegnern), ganze Zahlen nicht. Bei rund 1 Punkt Weg pro Bild sieht man das nicht.
export function zeichneGegner(ctx, schwarm, von, bisY, bild, bildBreite, farben) {
  const { x, y, reihenfolge, einstellung: e } = schwarm;
  const b = Math.round(bildBreite), h = Math.round(e.hoehe), halbB = Math.round(b / 2), halbH = Math.round(h / 2);
  if (!bild) ctx.fillStyle = farben.ersatzGegner;
  let i = von;
  for (; i < schwarm.anzahl; i++) {
    const k = reihenfolge[i];
    if (y[k] >= bisY) break;
    const gx = Math.round(x[k]), gy = Math.round(y[k]);
    if (bild) ctx.drawImage(bild, gx - halbB, gy - halbH, b, h);
    else { ctx.beginPath(); ctx.arc(gx, gy, e.radius, 0, VOLLKREIS); ctx.fill(); }
  }
  return i;
}

const VOLLKREIS = Math.PI * 2;
