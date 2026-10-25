// Test für bausteine/pool.js (ohne Browser): node pool-test.js
const h = require('./hilfe.js');

(async () => {
  const { erstellePool } = await h.lade('pool.js');
  const p = erstellePool(240, ['x', 'y', 'tempo']);
  const arrays = [p.x, p.y, p.tempo];
  h.pruefe(p.x instanceof Float64Array && p.x.length === 240 && p.anzahl === 0 && p.max === 240, 'Felder sind feste Float64Arrays der Länge max, leer am Anfang');

  let geholt = 0;
  for (let n = 0; n < 500; n++) { const i = p.hole(); if (i !== -1) { geholt++; p.x[i] = i; p.y[i] = -i; p.tempo[i] = i * 2; } }
  h.pruefe(geholt === 240 && p.anzahl === 240, `500 Versuche → ${geholt} geholt, nie über die Grenze`);
  h.pruefe(p.hole() === -1 && p.anzahl === 240, 'voll → −1, anzahl bleibt');

  p.gib(10);
  h.pruefe(p.anzahl === 239 && p.x[10] === 239 && p.y[10] === -239 && p.tempo[10] === 478, 'gib(10): der letzte rückt mit allen Feldern auf Platz 10');
  p.gib(p.anzahl - 1);
  h.pruefe(p.anzahl === 238, 'gib(letzter) verkleinert nur');
  p.gib(-1); p.gib(500); p.gib(238);
  h.pruefe(p.anzahl === 238, 'gib mit ungültigem Index ändert nichts');
  h.pruefe(p.hole() === 238, 'hole nach gib vergibt den nächsten freien Platz');

  // Entfernen in der Schleife: jeder zweite weg, keiner wird übersprungen
  p.leere();
  for (let n = 0; n < 100; n++) { const i = p.hole(); p.x[i] = n; }
  let j = 0;
  while (j < p.anzahl) { if (p.x[j] % 2 === 1) { p.gib(j); continue; } j++; }
  const rest = Array.from(p.x.subarray(0, p.anzahl)).sort((a, b) => a - b);
  h.pruefe(p.anzahl === 50 && rest.every((w, k) => w === k * 2), 'Entfernen in der Schleife (i nicht erhöhen) erwischt alle ungeraden, behält alle geraden');
  p.leere();
  h.pruefe(p.anzahl === 0 && [p.x, p.y, p.tempo].every((a, k) => a === arrays[k]), 'leere(): anzahl 0, dieselben Arrays (nichts Neues)');

  let fehler = '';
  try { erstellePool(4, ['x', 'anzahl']); } catch (e) { fehler = e.message; }
  h.pruefe(/reserviert/.test(fehler), 'Feldname „anzahl“ ist verboten (würde den Zähler überschreiben)');

  // Kein neuer Speicher beim Holen und Zurückgeben
  const q = erstellePool(240, ['x', 'y', 'vx', 'vy']);
  const schritt = () => {
    for (let n = 0; n < q.max && q.hole() !== -1; n++) { /* auffüllen; begrenzt, damit ein kaputter Pool rot meldet statt hängt */ }
    for (let k = 0; k < 120; k++) q.gib(k);
  };
  const angelegt = await h.angelegterSpeicher(schritt, 20000, /pool\.js/);
  h.pruefe(angelegt / 20000 < 4, `20.000 Schritte (je 120 holen und zurückgeben): ${h.komma(angelegt / 20000, 1)} Byte neuer Speicher pro Schritt (Ziel 0)`);
  const gegenprobe = await h.angelegterSpeicher(() => Array.from({ length: 50 }, (_, k) => ({ x: k })), 2000, /pool-test\.js/);
  h.pruefe(gegenprobe / 2000 > 500, `Gegenprobe: Code mit neuen Objekten zeigt ${h.komma(gegenprobe / 2000, 0)} Byte pro Schritt (die Messung wirkt)`);
  h.ergebnis();
})();
