// Browser-Test Übung 4, Teil 2 (wird von test.js aufgerufen): Rekord nach Neuladen, kaputter Speicherstand,
// privater Modus, Leistung mit 240 Gegnern (aus Übung 3), ohne ?test=1, keine Konsolenfehler.

async function neuLaden(seite, adresse) {
  if (adresse) await seite.goto(adresse); else await seite.reload();
  await seite.waitForFunction('window.spiel && window.spiel.bereit');
}

// Eine Runde mit `sekunden` überlebter Zeit spielen und beenden. Gibt den Stand im Ende zurück.
async function spieleRunde(seite, h, sekunden) {
  await seite.touchscreen.tap(300, 300);
  await seite.evaluate((s) => window.spiel.test.setzeZeit(s), sekunden);
  await seite.waitForTimeout(80);
  await seite.evaluate(() => window.spiel.test.schaden(99));
  return h.lies(seite);
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
  const jeStelle = {};
  (function zaehle(knoten) {
    const datei = (knoten.callFrame.url.match(/\/js\/.*$/) || [])[0];
    const stelle = `${knoten.callFrame.functionName || '(oben)'} ${datei}`;
    if (datei && knoten.selfSize) jeStelle[stelle] = (jeStelle[stelle] || 0) + knoten.selfSize;
    knoten.children.forEach(zaehle);
  })(profile.head);
  await cdp.detach();
  const summe = Object.values(jeStelle).reduce((a, b) => a + b, 0);
  return { bytesProBild: summe / bilder, bilder, jeStelle };
}

module.exports = async function speicherTests(t, lauf, port, h) {
  const { seite, kontext } = lauf;
  const adresse = `http://127.0.0.1:${port}/index.html?seed=42&test=1`;

  // Rekord bleibt nach Neuladen
  await neuLaden(seite);
  const geladen = await h.lies(seite);
  t.pruefe(geladen.zustand === 'titel' && geladen.rekord === 57 && geladen.tafel === 'Tippen zum Starten\nRekord: 57', 'nach Neuladen: Titel zeigt „Rekord: 57“');

  // Kaputter Inhalt in uebung-4: kein Absturz, Standardwerte, danach wird ein gültiger Stand geschrieben
  const fehlerVorher = lauf.fehler.length;
  const kaputt = ['kein json{', '{"rekord":', '[]', 'null', '"57"', '{"rekord":"viel"}', '{"rekord":-1}', '{"version":1}'];
  const ergebnisse = [];
  for (const roh of kaputt) {
    await seite.evaluate((r) => localStorage.setItem('uebung-4', r), roh);
    await neuLaden(seite);
    const s = await h.lies(seite);
    ergebnisse.push(`${roh} → ${s.zustand}/${s.rekord}`);
    if (!(s.bereit && s.zustand === 'titel' && s.rekord === 0)) t.pruefe(false, `kaputter Stand ${roh}: ${JSON.stringify(s)}`);
  }
  t.pruefe(ergebnisse.length === kaputt.length && lauf.fehler.length === fehlerVorher,
    `${kaputt.length} kaputte Speicherstände (z. B. „kein json{“) → kein Absturz, Titel mit Rekord 0`);
  await seite.evaluate(() => localStorage.setItem('uebung-4', 'kein json{'));
  await neuLaden(seite);
  const nachKaputt = await spieleRunde(seite, h, 4.2);
  t.pruefe(nachKaputt.rekord === 4 && nachKaputt.gespeichert === '{"version":1,"rekord":4}', `nach kaputtem Stand: Runde spielbar, Rekord 4 gespeichert (${nachKaputt.gespeichert})`);

  // Leistung aus Übung 3: 240 Gegner im Spiel (viele Leben, damit die Runde nicht endet)
  await seite.touchscreen.tap(300, 300);
  await seite.evaluate(() => { const s = window.spiel; s.test.setzeLeben(1e6); s.test.fuelleGegner(1000); });
  await seite.waitForTimeout(4000);
  const voll = await h.lies(seite);
  t.pruefe(voll.zustand === 'spiel' && voll.gegner === 240 && voll.schrittMs < 4, `schrittMs mit ${voll.gegner} Gegnern im Spiel: ${h.komma(voll.schrittMs, 3)} ms (Grenze 4)`);
  // Speicher erst nach dem Aufwärmen messen: Funktionen, die nur einmal pro Bild laufen, bleiben in Chrome lange
  // ungeübt (Interpreter), dort kostet jede Kommazahl-Rechnung 16 Byte. Das ist kein Leck und wächst nicht mit
  // der Zahl der Gegner (Safari packt Zahlen nie ein). Die Gegner-Schleifen selbst dürfen gar nichts anlegen.
  await seite.waitForTimeout(3000);
  const speicher = await speicherImSpiel(seite, 2000);
  const schwarmBytes = Object.entries(speicher.jeStelle).filter(([n]) => /gegner\.js|gitter\.js/.test(n)).reduce((a, [, b]) => a + b, 0);
  const groesste = Object.entries(speicher.jeStelle).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([n, b]) => `${n}: ${b} B`).join('; ');
  t.pruefe(schwarmBytes / speicher.bilder < 1, `Gegner und Gitter: ${h.komma(schwarmBytes / speicher.bilder, 1)} Byte neuer Speicher pro Bild (240 Gegner)`);
  t.pruefe(speicher.bytesProBild < 1024, `ganze Hauptschleife: ${h.komma(speicher.bytesProBild, 1)} Byte pro Bild, unter 4 Byte je Gegner ${groesste ? `(${groesste})` : ''}`);
  await seite.screenshot({ path: '/tmp/stufe-4-gedraenge.png' });

  // Speicher voll (setItem wirft): Rekord gilt bis zum Neuladen, kein Absturz
  await kontext.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException('voll', 'QuotaExceededError'); }; });
  await neuLaden(seite);
  const voller = await spieleRunde(seite, h, 9.5);
  t.pruefe(voller.zustand === 'ende' && voller.rekord === 9 && voller.gespeichert === '{"version":1,"rekord":4}', 'Speicher voll: Rekord 9 angezeigt, alter Stand bleibt, kein Absturz');

  // Privater Modus (schon der Zugriff auf localStorage wirft)
  await kontext.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('gesperrt', 'SecurityError'); } }); });
  await neuLaden(seite);
  const privat = await h.lies(seite);
  const privatEnde = await spieleRunde(seite, h, 3.5);
  t.pruefe(privat.zustand === 'titel' && privat.rekord === 0 && privatEnde.zustand === 'ende' && privatEnde.rekord === 3 && privatEnde.gespeichert === 'gesperrt',
    'privater Modus: Start mit Rekord 0, Runde spielbar, Rekord 3 bis zum Neuladen');

  // Ohne ?test=1 gibt es spiel.test nicht, die Lese-Werte schon
  await neuLaden(seite, adresse.replace('&test=1', ''));
  const ohne = await seite.evaluate(() => ({ test: window.spiel.test, z: window.spiel.zustand, p: typeof window.spiel.punkte, r: typeof window.spiel.rekord, l: typeof window.spiel.spieler.leben }));
  t.pruefe(ohne.test === undefined && ohne.z === 'titel' && ohne.p + ohne.r + ohne.l === 'numbernumbernumber', 'ohne ?test=1: kein spiel.test, zustand/punkte/rekord/leben da');
  t.pruefe(lauf.fehler.length === 0, `keine Konsolenfehler ${lauf.fehler.join(' | ')}`);
};
