// Test für bausteine/schleife.js: Regeln ohne Browser (nachgebaute Uhr und Seite), dann echt im Browser (Port 8880).
const h = require('./hilfe.js');

// Nachgebaute Umgebung: anfrage merkt sich die Bild-Funktion, die Seite kann „versteckt“ werden.
function erstelleUmgebung() {
  const hoerer = {};
  const u = {
    zeit: 0, anfragen: 0, abgebrochen: 0,
    dokument: {
      hidden: false, visibilityState: 'visible',
      addEventListener(art, f) { hoerer[art] = f; }, removeEventListener(art, f) { if (hoerer[art] === f) delete hoerer[art]; },
    },
    anfrage() { u.anfragen++; return u.anfragen; },
    abbruch() { u.abgebrochen++; },
    uhr: () => u.zeit,
    verstecke(ja) { u.dokument.hidden = ja; u.dokument.visibilityState = ja ? 'hidden' : 'visible'; hoerer.visibilitychange?.(); },
    hoertZu: () => Boolean(hoerer.visibilitychange),
  };
  return u;
}

async function regeln() {
  const { erstelleSchleife } = await h.lade('schleife.js');
  const u = erstelleUmgebung();
  const log = { dts: [], gezeichnet: 0, versteckt: 0 };
  const s = erstelleSchleife({
    aktualisiere: (dt) => log.dts.push(dt), zeichne: () => log.gezeichnet++, deltaMax: 0.1,
    beiVersteckt: () => log.versteckt++, umgebung: u,
  });
  u.zeit = 1000;
  s.starte();
  h.pruefe(u.anfragen === 1 && u.hoertZu(), 'starte(): erstes Bild angefordert, hört auf visibilitychange');
  for (let i = 1; i <= 60; i++) s.bild(1000 + i * (1000 / 60));
  const summe = log.dts.reduce((a, b) => a + b, 0);
  h.pruefe(Math.abs(summe - 1) < 1e-9 && log.gezeichnet === 60, `60 Bilder in 1 s → Spielzeit ${h.komma(summe, 3)} s`);
  log.dts.length = 0;
  for (let i = 1; i <= 5; i++) s.bild(2000 + i * 250);
  h.pruefe(log.dts.every((d) => d === 0.1), 'Bilder mit 250 ms Abstand → dt auf 0,1 s gedeckelt');
  log.dts.length = 0;
  s.bild(3000); s.bild(2990);
  h.pruefe(log.dts[1] === 0, 'Zeitstempel geht zurück → dt 0 (nie negativ)');

  // Tab versteckt: nichts rechnen, weiter zeichnen, einmal melden
  log.dts.length = 0;
  u.zeit = 3016; s.bild(3016);
  u.verstecke(true);
  const gezeichnetVorher = log.gezeichnet;
  s.bild(3032); s.bild(3048);
  h.pruefe(s.pausiert && log.versteckt === 1, 'Tab versteckt → pausiert, beiVersteckt einmal aufgerufen');
  h.pruefe(log.dts.length === 1 && log.gezeichnet === gezeichnetVorher + 2, 'versteckt: aktualisiere läuft nicht, zeichne schon');

  // Rückkehr nach 4 s, dann kommt noch ein Bild mit altem Zeitstempel (Lernbuch Stufe 1)
  log.dts.length = 0;
  u.zeit = 7048;
  u.verstecke(false);
  h.pruefe(!s.pausiert && log.versteckt === 1, 'Tab zurück → läuft weiter (Sichtbar-Werden meldet nichts)');
  s.bild(3064);                 // verspätetes Bild von vor dem Verstecken
  s.bild(7064);
  s.bild(7080);
  h.pruefe(log.dts[0] === 0 && Math.abs(log.dts[1] - 0.016) < 1e-9 && Math.abs(log.dts[2] - 0.016) < 1e-9,
    `kein Zeitsprung nach der Rückkehr, auch nicht durch ein verspätetes Bild (dt: ${log.dts.map((d) => h.komma(d, 3)).join(' | ')})`);

  // Eigene Pause
  log.dts.length = 0;
  s.setzePause(true); s.bild(7096); s.bild(7112);
  h.pruefe(s.pausiert && log.dts.length === 0, 'setzePause(true) → nichts wird gerechnet');
  s.setzePause(false); s.bild(7128);
  h.pruefe(!s.pausiert && Math.abs(log.dts[0] - 0.016) < 1e-9, 'setzePause(false) → läuft ohne Sprung weiter');
  s.setzePause(true); u.verstecke(true); u.verstecke(false);
  h.pruefe(s.pausiert, 'eigene Pause bleibt, auch wenn der Tab zurückkommt');
  s.setzePause(false);

  // Fehler in einem Bild: das nächste ist schon angefordert
  const v = erstelleUmgebung();
  const kaputt = erstelleSchleife({ aktualisiere() { throw new Error('Absicht'); }, zeichne() {}, umgebung: v });
  kaputt.starte();
  const vorher = v.anfragen;
  let geworfen = false;
  try { kaputt.bild(16); } catch { geworfen = true; }
  h.pruefe(geworfen && v.anfragen === vorher + 1, 'Fehler in aktualisiere: nächstes Bild war schon angefordert (Schleife läuft weiter)');

  // Stoppen
  const anfragenVorStopp = u.anfragen;
  s.stoppe();
  s.bild(7200);
  h.pruefe(u.abgebrochen === 1 && !u.hoertZu() && u.anfragen === anfragenVorStopp, 'stoppe(): Bild abgebrochen, kein neues, hört nicht mehr zu');

  // Start bei verstecktem Tab
  const w = erstelleUmgebung();
  w.dokument.hidden = true;
  let gerechnet = 0;
  const s2 = erstelleSchleife({ aktualisiere: () => gerechnet++, zeichne() {}, umgebung: w });
  s2.starte(); s2.bild(16); s2.bild(32);
  h.pruefe(s2.pausiert && gerechnet === 0, 'Start bei verstecktem Tab → pausiert');
  const ohneZeichnen = erstelleSchleife({ aktualisiere: () => gerechnet++, umgebung: erstelleUmgebung() });
  ohneZeichnen.starte(); ohneZeichnen.bild(16);
  h.pruefe(gerechnet === 1, 'zeichne darf fehlen');
}

async function imBrowser() {
  const b = require('./browser-hilfe.js');
  const lauf = await b.starteProbe('schleife', 8880);
  const { seite } = lauf;
  const lies = () => seite.evaluate(() => ({ ...window.probe, schleife: undefined, pausiert: window.probe.schleife.pausiert }));
  try {
    await seite.waitForTimeout(600);
    let p = await lies();
    h.pruefe(p.aktualisiert > 5 && p.zeit > 0.2 && p.groessterDt <= 0.1, `läuft im Browser: ${p.aktualisiert} Bilder, ${h.komma(p.zeit)} s Spielzeit, größtes dt ${h.komma(p.groessterDt, 3)} s`);
    // Seite 1 s blockieren (langsames Gerät, Ruckler): danach höchstens 0,1 s auf einmal
    // Gemessen in der Seite: Spielzeit vor der Blockade bis nach dem zweiten Bild danach.
    const weiter = await seite.evaluate(() => new Promise((fertig) => {
      const vor = window.probe.zeit, bis = performance.now() + 1000;
      while (performance.now() < bis) { /* blockiert */ }
      requestAnimationFrame(() => requestAnimationFrame(() => fertig(window.probe.zeit - vor)));
    }));
    p = await lies();
    h.pruefe(p.groessterDt <= 0.1 + 1e-9 && weiter < 0.2, `nach 1 s Blockade: Spielzeit in zwei Bildern nur ${h.komma(weiter, 3)} s weiter (gedeckelt)`);
    // Tab-Wechsel nachgestellt (der Test-Browser kann keinen echten)
    await seite.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    const versteckt = await lies();
    await seite.waitForTimeout(400);
    p = await lies();
    h.pruefe(versteckt.pausiert && p.zeit === versteckt.zeit && p.gezeichnet > versteckt.gezeichnet && p.versteckt === 1,
      'versteckter Tab: Spielzeit steht, gezeichnet wird weiter, beiVersteckt einmal');
    await seite.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await b.bilder(seite, 3);
    const zurueck = await lies();
    h.pruefe(!zurueck.pausiert && zurueck.zeit > p.zeit && zurueck.zeit - p.zeit < 0.2, `Tab zurück: läuft weiter ohne Sprung (+${h.komma(zurueck.zeit - p.zeit, 3)} s in 3 Bildern)`);
    h.pruefe(lauf.fehler.length === 0, `keine Konsolenfehler ${lauf.fehler.join(' | ')}`);
  } catch (e) { h.pruefe(false, `Ablauf abgebrochen: ${e.message}`); }
  await lauf.ende();
}

(async () => {
  await regeln();
  await imBrowser();
  h.ergebnis();
})();
