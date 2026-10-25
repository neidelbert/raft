// Test für bausteine/bilder.js: Laden, fehlende Bilder und Listen, Ersatz, Einfärben im Browser (Port 8885).
const h = require('./hilfe.js');
const b = require('./browser-hilfe.js');

(async () => {
  const lauf = await b.starteProbe('bilder', 8885);
  const { seite } = lauf;
  const warnungen = [];
  seite.on('console', (m) => m.type() === 'warning' && warnungen.push(m.text()));
  // Seite mit anderer Bilderliste neu öffnen; gibt Probe, neue Warnungen und neue Fehler zurück.
  async function oeffne(liste) {
    warnungen.length = 0;
    lauf.fehler.length = 0;
    await seite.goto(seite.url().replace(/&liste=.*$/, '') + `&liste=${liste}`);
    await seite.waitForFunction('window.probe && window.probe.bereit', null, { timeout: 8000 });
    return { p: await seite.evaluate(() => window.probe), w: [...warnungen], f: [...lauf.fehler] };
  }
  try {
    let { p, w, f } = await oeffne('grafik/grafik.json');
    h.pruefe(p.geladen.join() === 'figuren/figur' && !p.ersatz && p.masse.breite === 213 && p.masse.hoehe === 256,
      'vollständige Liste: Bild geladen (213 × 256), kein Ersatz');
    h.pruefe(w.length === 0 && f.length === 0, `keine Warnung, kein Fehler ${[...w, ...f].join(' | ')}`);
    h.pruefe(p.rotMitte.join() === '255,0,0,255' && p.rotEcke[3] === 0, `faerbeEin: Figur ganz rot (${p.rotMitte}), durchsichtige Ecke bleibt durchsichtig`);
    await seite.screenshot({ path: b.foto('bilder') });

    ({ p, w, f } = await oeffne('grafik/fehlt-datei.json'));
    h.pruefe(p.ersatz && p.masse.breite === 120 && p.masse.hoehe === 144, 'Datei fehlt: Seite startet trotzdem, Ersatz doppelt aufgelöst (120 × 144 für 60 × 72 Punkte)');
    h.pruefe(w.some((x) => x.includes('Bild fehlt: grafik/figuren/gibt-es-nicht.png')) && w.some((x) => x.includes('„figuren/figur“ fehlt')),
      'Datei fehlt: Warnung mit Dateiname und Bildname');
    h.pruefe(f.length > 0 && b.nurLadefehler(f), `Datei fehlt: nur die Ladezeile des Browsers, kein Fehler des Codes (${f.length})`);
    h.pruefe(p.rotMitte.join() === '255,0,0,255', 'faerbeEin klappt auch mit dem Ersatzbild');
    await seite.screenshot({ path: b.foto('bilder-ersatz') });

    ({ p, w, f } = await oeffne('grafik/fehlt-eintrag.json'));
    h.pruefe(p.ersatz && f.length === 0 && w.length === 1, 'Eintrag fehlt in der Liste: Ersatz, eine Warnung, gar kein Fehler');
    ({ p, w, f } = await oeffne('grafik/gibt-es-nicht.json'));
    h.pruefe(p.ersatz && w.some((x) => x.includes('Bilderliste fehlt')) && b.nurLadefehler(f), 'Liste fehlt: Ersatz, Warnung, nur die Ladezeile des Browsers');
    ({ p, w, f } = await oeffne('grafik/keine-liste.json'));
    h.pruefe(p.ersatz && w.some((x) => x.includes('Bilderliste')) && f.length === 0, 'Liste ist kein Array: Ersatz, Warnung, kein Fehler');
  } catch (e) { h.pruefe(false, `Ablauf abgebrochen: ${e.message}`); }
  await lauf.ende();
  h.ergebnis();
})();
