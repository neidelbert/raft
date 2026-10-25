// Sterne zum Einsammeln: erscheinen alle STERNE.erscheinenAlle Sekunden an einer zufälligen freien Stelle.
// Regeln ohne DOM (mit node testbar); zeichneSterne und zeichneErsatzStern brauchen einen Canvas.
// Sterne sind { x, y, anzahl, uhr, einstellung }: Stern i (0 … anzahl-1) liegt mit seiner Mitte bei x[i], y[i]
//   (Punkte). Feste Float64Arrays der Länge einstellung.max; uhr = Sekunden seit dem letzten neuen Stern.

export function erstelleSterne(einstellung) {
  return { x: new Float64Array(einstellung.max), y: new Float64Array(einstellung.max), anzahl: 0, uhr: 0, einstellung };
}

export function leereSterne(sterne) { sterne.anzahl = 0; sterne.uhr = 0; }

// Einen Stern an eine freie Stelle legen: im Bild, nicht unter Leiste und Knöpfen, nicht zu nah an der Figur
// (sonst wäre er sofort eingesammelt). Gibt false zurück, wenn alles voll ist oder keine Stelle frei war.
export function legeStern(sterne, spieler, breite, hoehe, zufall) {
  const e = sterne.einstellung;
  if (sterne.anzahl >= e.max) return false;
  const minX = e.rand, maxX = breite - e.rand, minY = e.randOben, maxY = hoehe - e.randUnten;
  if (maxX <= minX || maxY <= minY) return false;   // Bildschirm zu klein
  const mindest2 = e.abstandSpielerMin * e.abstandSpielerMin;
  for (let v = 0; v < e.versuche; v++) {
    const x = minX + zufall() * (maxX - minX), y = minY + zufall() * (maxY - minY);
    const dx = x - spieler.x, dy = y - spieler.y;
    if (dx * dx + dy * dy < mindest2) continue;
    sterne.x[sterne.anzahl] = x;
    sterne.y[sterne.anzahl] = y;
    sterne.anzahl++;
    return true;
  }
  return false;
}

// Uhr weiterzählen und nach Zeitplan neue Sterne legen. Liegen schon max Sterne, wartet die Uhr nicht weiter.
export function aktualisiereSterne(sterne, spieler, dt, breite, hoehe, zufall) {
  const e = sterne.einstellung;
  sterne.uhr += dt;
  while (sterne.uhr >= e.erscheinenAlle) {
    sterne.uhr -= e.erscheinenAlle;
    legeStern(sterne, spieler, breite, hoehe, zufall);
  }
}

// Stern i entfernen (der letzte rückt an seine Stelle).
export function entferneStern(sterne, i) {
  const letzter = --sterne.anzahl;
  sterne.x[i] = sterne.x[letzter];
  sterne.y[i] = sterne.y[letzter];
}

// Alle Sterne, die die Figur berührt, einsammeln. Für jeden wird beimSammeln(x, y) aufgerufen.
// Gibt die Zahl der eingesammelten Sterne zurück (mehrere auf einmal zählen alle).
export function sammleBeruehrte(sterne, spieler, beimSammeln) {
  const r = sterne.einstellung.sammelRadius, r2 = r * r;
  let gesammelt = 0, i = 0;
  while (i < sterne.anzahl) {
    const x = sterne.x[i], y = sterne.y[i], dx = x - spieler.x, dy = y - spieler.y;
    if (dx * dx + dy * dy < r2) {
      entferneStern(sterne, i);   // i nicht erhöhen: hier liegt jetzt der letzte Stern
      gesammelt++;
      beimSammeln(x, y);
    } else i++;
  }
  return gesammelt;
}

// Bild in Größe einstellung.groesse um die Mitte, auf ganze Punkte gerundet.
export function zeichneSterne(ctx, sterne, bild) {
  const g = Math.round(sterne.einstellung.groesse), halb = g >> 1;
  for (let i = 0; i < sterne.anzahl; i++) ctx.drawImage(bild, Math.round(sterne.x[i]) - halb, Math.round(sterne.y[i]) - halb, g, g);
}

// Ersatz, falls stern.png fehlt: fünfzackiger Stern per Code, einmal beim Start in einen Canvas gezeichnet
// (doppelte Größe, damit er auf dem iPhone scharf ist). Danach wird er wie ein Bild gezeichnet.
export function zeichneErsatzStern(groesse, farbe, umriss) {
  const pixel = Math.round(groesse * 2), leinwand = document.createElement('canvas');
  leinwand.width = pixel; leinwand.height = pixel;
  const ctx = leinwand.getContext('2d'), mitte = pixel / 2, aussen = pixel * 0.46, innen = aussen * 0.45;
  ctx.beginPath();
  for (let k = 0; k < 10; k++) {
    const winkel = -Math.PI / 2 + (k * Math.PI) / 5, r = k % 2 === 0 ? aussen : innen;
    ctx.lineTo(mitte + Math.cos(winkel) * r, mitte + Math.sin(winkel) * r);
  }
  ctx.closePath();
  ctx.fillStyle = farbe;
  ctx.fill();
  ctx.lineWidth = Math.max(2, pixel * 0.05);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = umriss;
  ctx.stroke();
  return leinwand;
}
