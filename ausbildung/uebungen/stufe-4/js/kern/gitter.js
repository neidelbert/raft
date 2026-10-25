// Gitter für schnelle Nachbarsuche (Kollision vieler Objekte), ohne neue Objekte pro Bild.
// erstelleGitter(zelle, maxObjekte) gibt { passeAn, fuelle, zelleX, zelleY, erster, naechster, spalten, zeilen } zurück:
//   passeAn(minX, minY, maxX, maxY): Fläche festlegen (nur beim Start und bei Größenänderung, legt Arrays an).
//   fuelle(xs, ys, anzahl): Punkte 0 … anzahl-1 (xs[i], ys[i]) in die Zellen einsortieren, jedes Bild einmal.
//   zelleX(x), zelleY(y): Zellennummer; Punkte außerhalb der Fläche landen in der Randzelle.
//   erster(sx, sy): Index des ersten Objekts der Zelle oder -1; naechster[i]: nächstes Objekt derselben Zelle oder -1.
// Jede Zelle ist eine verkettete Liste in zwei Int32Arrays: Füllen kostet nur Zahlen schreiben.
// Ein Objekt in Zelle (sx, sy) findet alle Nachbarn bis zum Abstand `zelle` in den 3 × 3 Zellen um sich herum.
export function erstelleGitter(zelle, maxObjekte) {
  const naechster = new Int32Array(maxObjekte);
  let kopf = new Int32Array(0);
  const gitter = { spalten: 0, zeilen: 0, minX: 0, minY: 0, naechster, passeAn, fuelle, zelleX, zelleY, erster };

  function passeAn(minX, minY, maxX, maxY) {
    gitter.minX = minX;
    gitter.minY = minY;
    gitter.spalten = Math.max(1, Math.ceil((maxX - minX) / zelle));
    gitter.zeilen = Math.max(1, Math.ceil((maxY - minY) / zelle));
    const noetig = gitter.spalten * gitter.zeilen;
    if (kopf.length < noetig) kopf = new Int32Array(noetig);
  }

  function zelleX(x) { return klemme(Math.floor((x - gitter.minX) / zelle), gitter.spalten); }
  function zelleY(y) { return klemme(Math.floor((y - gitter.minY) / zelle), gitter.zeilen); }

  function fuelle(xs, ys, anzahl) {
    kopf.fill(-1, 0, gitter.spalten * gitter.zeilen);
    for (let i = 0; i < anzahl; i++) {
      const k = zelleY(ys[i]) * gitter.spalten + zelleX(xs[i]);
      naechster[i] = kopf[k];
      kopf[k] = i;
    }
  }

  function erster(sx, sy) { return kopf[sy * gitter.spalten + sx]; }

  return gitter;
}

function klemme(n, anzahl) { return n < 0 ? 0 : n >= anzahl ? anzahl - 1 : n; }
