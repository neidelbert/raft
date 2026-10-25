// Test für Übung 3 (Viele Gegner): node ausbildung/uebungen/stufe-3/test.js
// Rechenregeln ohne Browser stehen in test-regeln.js, hier der Ablauf im Browser.
const t = require('../../../werkzeuge/test-hilfe.js');
const path = require('path');
const { pathToFileURL } = require('url');
const regelTests = require('./test-regeln.js');

const ORDNER = 'ausbildung/uebungen/stufe-3';
const PORT = 8830;
const lade = (datei) => import(pathToFileURL(path.join(t.REPO, ORDNER, datei)));
const komma = (zahl, stellen = 2) => zahl.toFixed(stellen).replace('.', ',');

// Im Browser: jedes Bild Werte mitschreiben, ms lang. Gibt eine Liste { t, leben, unverwundbar, gegner, schrittMs } zurück.
function beobachte(ms) {
  return new Promise((fertig) => {
    const s = window.spiel, liste = [], start = performance.now();
    (function bild() {
      const jetzt = performance.now() - start;
      liste.push({ t: jetzt, leben: s.spieler.leben, unverwundbar: s.spieler.unverwundbar, gegner: s.gegnerAktiv, schrittMs: s.messung.schrittMs, x: s.spieler.x });
      if (jetzt < ms) requestAnimationFrame(bild); else fertig(liste);
    })();
  });
}

// Im Browser: Weg von Gegner 0 über ms messen (Punkte pro Sekunde) und gezählte Bilder.
function messeGegnerTempo(ms) {
  return new Promise((fertig) => {
    const t0 = window.spiel.test.gegnerPositionen()[0], start = performance.now();
    let bilder = 0;
    (function bild() {
      bilder++;
      const vergangen = performance.now() - start;
      if (vergangen < ms) return requestAnimationFrame(bild);
      const t1 = window.spiel.test.gegnerPositionen()[0];
      fertig({ tempo: (Math.hypot(t1.x - t0.x, t1.y - t0.y) * 1000) / vergangen, bilder });
    })();
  });
}

function bremseAn(seite) {   // langsames Gerät: jedes Bild 40 ms Rechenarbeit (≈ 20 Bilder/s), siehe Lernbuch Stufe 1
  return seite.evaluate(() => { window.bremse = true; (function b() { if (!window.bremse) return; const bis = performance.now() + 40; while (performance.now() < bis); requestAnimationFrame(b); })(); });
}

function abstaende(liste, radius) {
  let kleinster = Infinity, stark = 0;
  for (let i = 0; i < liste.length; i++) for (let j = i + 1; j < liste.length; j++) {
    const d = Math.hypot(liste[i].x - liste[j].x, liste[i].y - liste[j].y);
    if (d < kleinster) kleinster = d;
    if (d < radius) stark++;
  }
  return { kleinster, stark };
}

// Neuer Speicher, den die Spiel-Dateien (/js/…) während ms Spielzeit anlegen (Heap-Profiler per CDP, Stichproben alle 64 Byte).
async function speicherImSpiel(seite, ms) {
  const cdp = await seite.context().newCDPSession(seite);
  await cdp.send('HeapProfiler.enable');
  await cdp.send('HeapProfiler.startSampling', { samplingInterval: 64, includeObjectsCollectedByMajorGC: true, includeObjectsCollectedByMinorGC: true });
  const bilder = await seite.evaluate((dauer) => new Promise((fertig) => {
    let n = 0; const start = performance.now();
    (function bild() { n++; performance.now() - start < dauer ? requestAnimationFrame(bild) : fertig(n); })();
  }), ms);
  const { profile } = await cdp.send('HeapProfiler.stopSampling');
  const jeDatei = {};
  (function zaehle(knoten) {
    const datei = (knoten.callFrame.url.match(/\/js\/.*$/) || [])[0];
    if (datei && knoten.selfSize) jeDatei[`${knoten.callFrame.functionName || '(oben)'} ${datei}`] = (jeDatei[`${knoten.callFrame.functionName || '(oben)'} ${datei}`] || 0) + knoten.selfSize;
    knoten.children.forEach(zaehle);
  })(profile.head);
  await cdp.detach();
  const summe = Object.values(jeDatei).reduce((a, b) => a + b, 0);
  return { bytesProBild: summe / bilder, bilder, jeDatei };
}

(async () => {
  await regelTests(t, lade);
  const { GEGNER } = await lade('js/config/gegner.js');
  const { SPIELER } = await lade('js/config/spieler.js');

  const lauf = await t.starte({ ordner: ORDNER, port: PORT, pfad: 'index.html?seed=42&test=1' });
  const { seite } = lauf;
  const zurMitte = () => seite.evaluate(() => window.spiel.test.setzeSpieler(innerWidth / 2, innerHeight / 2));
  try {
    // Start und Test-Schnittstelle
    const start = await seite.evaluate(() => ({ ...JSON.parse(JSON.stringify(window.spiel)), test: undefined,
      typ: typeof window.spiel.gegnerAktiv, bild: window.spiel.test.gegnerBildGeladen, fn: typeof window.spiel.test.fuelleGegner + typeof window.spiel.test.friere,
      iw: innerWidth, ih: innerHeight }));
    const { iw: B, ih: H } = start;
    t.pruefe(start.bereit && start.spieler.leben === SPIELER.leben && start.spieler.unverwundbar === false, `Start: bereit, ${start.spieler.leben} Leben, verwundbar`);
    t.pruefe(start.typ === 'number' && typeof start.messung.schrittMs === 'number' && start.fn === 'functionfunction', 'Schnittstelle: gegnerAktiv, messung.schrittMs, test.fuelleGegner, test.friere');
    t.pruefe(start.bild === true, 'Bild gegner.png geladen');

    // Gegner erscheinen mit der Zeit am Rand und laufen zum Spieler
    await seite.waitForTimeout(1300);
    const frueh = await seite.evaluate(() => ({ n: window.spiel.gegnerAktiv, p: window.spiel.test.gegnerPositionen(), s: { ...window.spiel.spieler } }));
    t.pruefe(frueh.n >= 3 && frueh.n <= 7, `nach 1,3 s sind ${frueh.n} Gegner da (alle ${komma(GEGNER.erscheinenAlle)} s einer)`);
    const nahAmRand = frueh.p.every((g) => Math.min(g.x, B - g.x, g.y, H - g.y) < GEGNER.tempo * 1.25 * 1.3 + 1);
    t.pruefe(nahAmRand, 'neue Gegner kommen vom Rand');
    await seite.waitForTimeout(500);
    const spaeter = await seite.evaluate(() => window.spiel.test.gegnerPositionen());
    const naeher = frueh.p.every((g, i) => Math.hypot(spaeter[i].x - frueh.s.x, spaeter[i].y - frueh.s.y) < Math.hypot(g.x - frueh.s.x, g.y - frueh.s.y));
    t.pruefe(naeher, 'alle Gegner kommen dem Spieler näher');

    // Kollision: genau 1 Leben, dann 1 s Schutz (ein eingefrorener Gegner bleibt auf dem Spieler liegen)
    await seite.evaluate(() => { const s = window.spiel; s.test.leereGegner(); s.test.friere(true); s.test.fuelleGegner(1); s.test.setzeGegner(0, -100, -100); });
    await zurMitte();
    await seite.waitForTimeout(100);
    t.pruefe(await seite.evaluate(() => window.spiel.spieler.leben === 5 && !window.spiel.spieler.unverwundbar), 'Gegner weit weg: kein Treffer');
    await seite.evaluate(() => window.spiel.test.setzeGegner(0, window.spiel.spieler.x + 10, window.spiel.spieler.y));
    const verlauf = await seite.evaluate(beobachte, 1500);
    const ersterTreffer = verlauf.find((v) => v.leben < 5), zweiterTreffer = verlauf.find((v) => v.leben < 4);
    const spruenge = verlauf.slice(1).map((v, i) => verlauf[i].leben - v.leben).filter((d) => d !== 0);
    t.pruefe(ersterTreffer && ersterTreffer.t < 50 && ersterTreffer.leben === 4 && ersterTreffer.unverwundbar, 'Berührung kostet 1 Leben, Spieler ist dann unverwundbar');
    t.pruefe(spruenge.every((d) => d === 1), `Leben sinkt immer um genau 1 (${spruenge.join(', ')})`);
    const schutz = zweiterTreffer ? zweiterTreffer.t - ersterTreffer.t : Infinity;
    t.pruefe(Math.abs(schutz - SPIELER.schutzZeit * 1000) < 60, `Schutz dauert ${schutz.toFixed(0)} ms (Ziel ${SPIELER.schutzZeit * 1000}), Gegner liegt die ganze Zeit auf dem Spieler`);
    t.pruefe(verlauf.filter((v) => v.t > ersterTreffer.t && v.t < zweiterTreffer.t).every((v) => v.leben === 4 && v.unverwundbar), 'während des Schutzes: kein weiterer Verlust');
    await seite.evaluate(() => window.spiel.test.setzeGegner(0, -100, -100));
    await seite.waitForTimeout(1100);
    const nachSchutz = await seite.evaluate(() => ({ ...window.spiel.spieler }));
    t.pruefe(nachSchutz.leben === 3 && !nachSchutz.unverwundbar, `Gegner weg: nach dem Schutz wieder verwundbar, ${nachSchutz.leben} Leben`);

    // Ein laufender Gegner trifft den Spieler (ohne Einfrieren)
    await seite.evaluate(() => { const s = window.spiel; s.test.setzeGegner(0, s.spieler.x - 120, s.spieler.y); s.test.friere(false); });
    const anlauf = await seite.evaluate(beobachte, 2500);
    const treffer3 = anlauf.find((v) => v.leben < 3);
    t.pruefe(treffer3 && treffer3.leben === 2 && treffer3.unverwundbar, `laufender Gegner trifft nach ${treffer3 ? komma(treffer3.t / 1000, 1) : '–'} s: 1 Leben weniger`);

    // Gegner-Tempo mit Delta-Zeit: normal und auf langsamem Gerät gleich
    await seite.evaluate(() => { const s = window.spiel; s.test.leereGegner(); s.test.fuelleGegner(1); s.test.setzeGegner(0, -20, 40); });
    const normal = await seite.evaluate(messeGegnerTempo, 600);
    await seite.evaluate(() => { const s = window.spiel; s.test.leereGegner(); s.test.fuelleGegner(1); s.test.setzeGegner(0, -20, 40); });
    await bremseAn(seite);
    const langsam = await seite.evaluate(messeGegnerTempo, 600);
    await seite.evaluate(() => { window.bremse = false; });
    t.pruefe(langsam.bilder < normal.bilder * 0.6, `Bremse wirkt (${langsam.bilder} statt ${normal.bilder} Bilder)`);
    const spanne = [GEGNER.tempo * (1 - GEGNER.tempoStreuung) * 0.9, GEGNER.tempo * (1 + GEGNER.tempoStreuung) * 1.1];
    t.pruefe([normal.tempo, langsam.tempo].every((v) => v >= spanne[0] && v <= spanne[1]),
      `Gegner-Tempo normal ${normal.tempo.toFixed(0)}, langsames Gerät ${langsam.tempo.toFixed(0)} Punkte/s (erlaubt ${spanne[0].toFixed(0)}–${spanne[1].toFixed(0)})`);

    // Grenze: fuelleGegner(1000) erzeugt nur bis GEGNER.max, auch mit weiterem Erscheinen nie mehr
    const nachFuellen = await seite.evaluate(() => window.spiel.test.fuelleGegner(1000));
    t.pruefe(nachFuellen === GEGNER.max, `fuelleGegner(1000) → ${nachFuellen} Gegner (Grenze ${GEGNER.max})`);
    await zurMitte();
    const voll = await seite.evaluate(beobachte, 3000);
    const hoechste = Math.max(...voll.map((v) => v.gegner));
    t.pruefe(hoechste === GEGNER.max && (await seite.evaluate(() => window.spiel.test.fuelleGegner(5))) === GEGNER.max,
      `3 s lang jedes Bild gezählt: höchstens ${hoechste} Gegner, Nachfüllen bleibt bei ${GEGNER.max}`);
    t.pruefe(voll.every((v) => v.leben >= 0), 'Leben nie unter 0');

    // Leistung: schrittMs mit 240 Gegnern im Gedränge, dann während der Spieler läuft
    await seite.waitForTimeout(3000);
    const ruhig = await seite.evaluate(beobachte, 2000);
    const ms240 = ruhig[ruhig.length - 1].schrittMs, msMax = Math.max(...ruhig.map((v) => v.schrittMs));
    t.pruefe(ruhig.every((v) => v.gegner === GEGNER.max) && ms240 < 4,
      `schrittMs mit ${GEGNER.max} Gegnern: ${komma(ms240, 3)} ms (höchstes Mittel in 2 s: ${komma(msMax, 3)} ms, Grenze 4)`);
    const finger = await t.ziehe(seite, 60, H / 2, 120, H / 2 - 30, { loslassen: false });
    const laufend = await seite.evaluate(beobachte, 1500);
    const msLauf = laufend[laufend.length - 1].schrittMs;
    t.pruefe(laufend[laufend.length - 1].x > laufend[0].x && msLauf < 4, `Spieler läuft durchs Gedränge: schrittMs ${komma(msLauf, 3)} ms`);
    await finger.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await seite.waitForTimeout(50);
    const stillstand = await seite.evaluate(beobachte, 300);
    t.pruefe(stillstand.every((v) => v.x === stillstand[0].x), 'Loslassen stoppt die Figur (Steuerung aus Übung 2)');

    // Überlappung im Gedränge
    await zurMitte();
    await seite.waitForTimeout(5000);
    const positionen = await seite.evaluate(() => window.spiel.test.gegnerPositionen());
    const { kleinster, stark } = abstaende(positionen, GEGNER.radius);
    t.pruefe(positionen.length === GEGNER.max && stark === 0 && kleinster >= GEGNER.radius * 1.5,
      `${positionen.length} Gegner im Gedränge: kleinster Abstand ${komma(kleinster, 1)} Punkte (Berührung bei ${2 * GEGNER.radius}), keiner mehr als halb überlappt`);
    await seite.screenshot({ path: process.env.FOTO || '/tmp/stufe-3.png' });

    // Keine neuen Objekte in der Hauptschleife (Schritt und Zeichnen mit 240 Gegnern)
    // Gegner-Dateien: nichts. Insgesamt nur ein fester kleiner Rest von der einen Figur (Kommazahlen an ihre
    // Zeichenbefehle packt Chrome ein, das wächst nicht mit der Zahl der Gegner; Safari packt Zahlen nie ein).
    const speicher = await speicherImSpiel(seite, 2000);
    const schwarmBytes = Object.entries(speicher.jeDatei).filter(([n]) => /gegner\.js|gitter\.js|treffer\.js/.test(n)).reduce((a, [, b]) => a + b, 0);
    const groesste = Object.entries(speicher.jeDatei).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([n, b]) => `${n}: ${b} B`).join('; ');
    t.pruefe(schwarmBytes / speicher.bilder < 1, `Gegner, Gitter, Treffer: ${komma(schwarmBytes / speicher.bilder, 1)} Byte neuer Speicher pro Bild (${speicher.bilder} Bilder, 240 Gegner)`);
    t.pruefe(speicher.bytesProBild < 256, `ganze Hauptschleife: ${komma(speicher.bytesProBild, 1)} Byte pro Bild ${groesste ? `(${groesste})` : ''}`);
    t.pruefe(await seite.evaluate(() => window.spiel.spieler.leben) === 0, 'im Gedränge: Leben bei 0 angekommen, nicht darunter');

    // Kaputtes Gegnerbild: Ersatz wird gezeichnet, Spiel läuft (Warnung erlaubt)
    await lauf.kontext.route('**/gegner.png', (r) => r.fulfill({ status: 200, contentType: 'image/png', body: 'kaputt' }));
    await seite.reload();
    await seite.waitForFunction('window.spiel && window.spiel.bereit');
    const ersatz = await seite.evaluate(() => { window.spiel.test.fuelleGegner(240); return window.spiel.test.gegnerBildGeladen; });
    await seite.waitForTimeout(1500);
    const ersatzAnzahl = await seite.evaluate(() => window.spiel.gegnerAktiv);
    t.pruefe(ersatz === false && ersatzAnzahl === GEGNER.max, 'ohne gegner.png: Ersatzkreise, Spiel läuft mit 240 Gegnern');
    await seite.screenshot({ path: '/tmp/stufe-3-ersatz.png' });
    await lauf.kontext.unroute('**/gegner.png');

    // Ohne ?test=1 gibt es spiel.test nicht, die Lese-Werte schon
    await seite.goto(`http://127.0.0.1:${PORT}/index.html?seed=42`);
    await seite.waitForFunction('window.spiel && window.spiel.bereit');
    const ohne = await seite.evaluate(() => ({ test: window.spiel.test, n: typeof window.spiel.gegnerAktiv, ms: typeof window.spiel.messung.schrittMs }));
    t.pruefe(ohne.test === undefined && ohne.n === 'number' && ohne.ms === 'number', 'ohne ?test=1 kein spiel.test, gegnerAktiv und messung da');
    t.pruefe(lauf.fehler.length === 0, `keine Konsolenfehler ${lauf.fehler.join(' | ')}`);
    console.log(`\nGemessen: schrittMs mit ${GEGNER.max} Gegnern = ${komma(ms240, 3)} ms`);
  } catch (e) { t.pruefe(false, `Ablauf abgebrochen: ${e.message}`); }
  await lauf.ende();
  t.ergebnis();
})();
