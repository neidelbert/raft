// Test für bausteine/gitter.js (ohne Browser): node gitter-test.js
const h = require('./hilfe.js');

(async () => {
  const { erstelleGitter, beruehren } = await h.lade('gitter.js');
  const { erstelleZufall } = await h.lade('zufall.js');

  const g = erstelleGitter(32, 10);
  g.passeAn(-50, -50, 150, 150);
  const xs = [0, 5, 140, -9999], ys = [0, 5, 140, 9999];
  g.fuelle(xs, ys, xs.length);
  // Höchstens 100 Schritte: Ein Fehler im Gitter (Ring in der Liste) wird so eine rote Prüfung statt eines Absturzes.
  const inZelle = (sx, sy) => { const r = []; for (let j = g.erster(sx, sy); j !== -1 && r.length < 100; j = g.naechster[j]) r.push(j); return r.sort(); };
  h.pruefe(JSON.stringify(inZelle(g.zelleX(0), g.zelleY(0))) === '[0,1]', 'zwei nahe Punkte liegen in derselben Zelle');
  h.pruefe(inZelle(g.zelleX(140), g.zelleY(140)).includes(2), 'ferner Punkt in seiner eigenen Zelle');
  h.pruefe(g.zelleX(-9999) === 0 && g.zelleY(9999) === g.zeilen - 1 && inZelle(0, g.zeilen - 1).includes(3),
    'Punkt weit außerhalb landet in der Randzelle (kein Absturz)');
  g.fuelle(xs, ys, 1);
  const geleert = h.pruefe(JSON.stringify(inZelle(g.zelleX(0), g.zelleY(0))) === '[0]' && inZelle(g.zelleX(140), g.zelleY(140)).length === 0,
    'neues Füllen leert die alten Zellen');
  if (!geleert) h.ergebnis();   // mit Ringen in den Listen würde die Suche unten nie enden
  const leer = erstelleGitter(32, 4);
  leer.passeAn(0, 0, 100, 100);
  h.pruefe(leer.sucheNachbarn(10, 10, 30, [], [], new Int32Array(4)) === 0, 'Suche vor dem ersten Füllen findet nichts (kein Absturz)');

  // sucheNachbarn gegen „jeder gegen jeden“ (240 Punkte, Rand mit Punkten außerhalb)
  const N = 240, R = 40, zufall = erstelleZufall(42);
  const px = new Float64Array(N), py = new Float64Array(N);
  for (let i = 0; i < N; i++) { px[i] = -60 + zufall() * 520; py[i] = -60 + zufall() * 780; }
  const gg = erstelleGitter(R, N);
  gg.passeAn(-50, -50, 440, 714);
  gg.fuelle(px, py, N);
  const aus = new Int32Array(N);
  let gleich = true, paare = 0;
  for (let i = 0; i < N; i++) {
    const n = gg.sucheNachbarn(px[i], py[i], R, px, py, aus);
    const gefunden = Array.from(aus.subarray(0, n)).sort((a, b) => a - b);
    const soll = [];
    for (let j = 0; j < N; j++) if ((px[j] - px[i]) ** 2 + (py[j] - py[i]) ** 2 < R * R) soll.push(j);
    if (JSON.stringify(gefunden) !== JSON.stringify(soll)) gleich = false;
    paare += n - 1;
  }
  h.pruefe(gleich && paare > 0, `sucheNachbarn findet bei 240 Punkten genau dieselben Nachbarn wie „jeder gegen jeden“ (${paare / 2} Paare)`);
  const klein = new Int32Array(2);
  gg.fuelle(new Float64Array(5).fill(10), new Float64Array(5).fill(10), 5);
  h.pruefe(gg.sucheNachbarn(10, 10, R, new Float64Array(5).fill(10), new Float64Array(5).fill(10), klein) === 2, 'mehr Treffer als Platz in aus → höchstens aus.length (kein Überlauf)');

  h.pruefe(beruehren(0, 0, 5, 9, 0, 5) && !beruehren(0, 0, 5, 10, 0, 5) && beruehren(0, 0, 5, 6, 6, 5),
    'beruehren: 9 Punkte Abstand bei Radien 5+5 ja, genau 10 nein, schräg ja');

  // Kein neuer Speicher pro Bild (240 Objekte füllen und für jedes suchen)
  const schritt = () => { gg.fuelle(px, py, N); for (let i = 0; i < N; i++) gg.sucheNachbarn(px[i], py[i], R, px, py, aus); };
  const angelegt = await h.angelegterSpeicher(schritt, 3000, /gitter\.js/);
  h.pruefe(angelegt / 3000 < 4, `3.000 Bilder mit 240 Objekten: ${h.komma(angelegt / 3000, 1)} Byte neuer Speicher pro Bild (Ziel 0)`);
  h.ergebnis();
})();
