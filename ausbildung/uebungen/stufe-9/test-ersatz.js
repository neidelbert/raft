// Test für Übung 9, Teil 2: fehlende und hängende Dateien, modell.html (Ports 8892–8898). Läuft auch allein:
// node ausbildung/uebungen/stufe-9/test-ersatz.js (ORDNER=<Kopie> für die Gegenprobe).
const t = require('../../../werkzeuge/test-hilfe.js');
const h = require('./test-hilfen.js');

const ORDNER = process.env.ORDNER || 'ausbildung/uebungen/stufe-9';
const fehlt = (muster) => (k) => k.route(muster, (r) => r.fulfill({ status: 404, body: '' }));
const haengt = (muster) => (k) => k.route(muster, () => {});   // Server antwortet nie

// Seite öffnen, bis „start“ warten (höchstens 10 s), starten, kurz laufen und explodieren lassen.
async function pruefeMitErsatz(port, routen, name, { erwartetFehlend, erwartetErsetzt, mindestMs = 0 }) {
  const lauf = await t.starte({ ordner: ORDNER, port, pfad: 'index.html?test=1', routen, initSkript: h.ZAEHLER });
  const { seite } = lauf;
  try {
    const beginn = Date.now();
    await seite.waitForFunction(() => window.spiel.zustand === 'start', null, { timeout: 10000 });
    const dauer = Date.now() - beginn;
    const s = await seite.evaluate(() => JSON.parse(JSON.stringify(window.spiel)));
    t.pruefe(dauer >= mindestMs, `${name}: Seite erreicht „start“ nach ${(dauer / 1000).toFixed(1)} s (höchstens 10 s${mindestMs ? `, erst nach der Zeitgrenze` : ''})`);
    t.pruefe(erwartetFehlend.every((n) => s.assets.fehlend.includes(n)) && erwartetErsetzt.every((n) => s.assets.ersetzt.includes(n)),
      `${name}: fehlend [${s.assets.fehlend.join(', ')}], ersetzt [${s.assets.ersetzt.slice(0, 4).join(', ')}${s.assets.ersetzt.length > 4 ? ' …' : ''}]`);
    t.pruefe(s.fortschritt === 1, `${name}: Fortschritt erreicht trotzdem 1`);
    await t.tippe(seite, 200, 500);
    const cdp = await t.ziehe(seite, 60, 420, 140, 420, { loslassen: false });
    const spur = await h.zeichneAuf(seite, 700);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    const r = h.rahmenTempo(spur.slice(3));
    t.pruefe(spur.at(-1).x > spur[0].x + 20 && spur.at(-1).animation === 'held-lauf' && r.verschiedene >= 4, `${name}: Held läuft mit Ersatz-Rahmen (${r.verschiedene} Rahmen)`);
    await seite.evaluate(() => window.spiel.test.explosion(250, 300));
    t.pruefe(await seite.evaluate(() => window.spiel.explosionen) === 1, `${name}: Explosion mit Ersatz-Rahmen startet`);
    await seite.waitForFunction(() => window.spiel.explosionen === 0, null, { timeout: 3000 });
    await seite.screenshot({ path: h.foto(`ersatz-${port}`) });
    t.pruefe(h.nurLadefehler(lauf.fehler), `${name}: Seite läuft, nur die Ladezeile des Browsers (${lauf.fehler.length}) ${lauf.fehler.filter((f) => !/Failed to load/.test(f)).join(' | ')}`);
  } catch (e) { t.pruefe(false, `${name}: abgebrochen: ${e.message}`); }
  await lauf.ende();
}

async function modellTest(port, routen, name, pruefung) {
  const lauf = await t.starte({ ordner: ORDNER, port, pfad: 'modell.html', routen, warteAuf: 'window.modell && window.modell.bereit' });
  try {
    const m = await lauf.seite.evaluate(() => ({ ...window.modell }));
    await lauf.seite.screenshot({ path: h.foto(`modell-${port}`) });
    pruefung(m, lauf.fehler);
  } catch (e) { t.pruefe(false, `${name}: abgebrochen: ${e.message}`); }
  await lauf.ende();
}

(async () => {
  const VIER_S = 3800;   // LADEN.zeitgrenze ist 4 s; etwas Spielraum für die Uhr des Test-Browsers
  await pruefeMitErsatz(8892, async (k) => { await fehlt('**/atlas/spiel.png*')(k); await fehlt('**/sounds/explosion.*')(k); }, 'Atlas und Sound fehlen',
    { erwartetFehlend: ['spiel', 'explosion'], erwartetErsetzt: ['held-lauf-1', 'held-steht', 'explosion-1', 'ton-an', 'explosion'] });
  await pruefeMitErsatz(8893, fehlt('**/assets/assets.json*'), 'Manifest fehlt',
    { erwartetFehlend: ['assets/assets.json'], erwartetErsetzt: ['held-lauf-1', 'muenze-1'] });
  await pruefeMitErsatz(8894, haengt('**/atlas/spiel.png*'), 'Atlas-Server antwortet nie',
    { erwartetFehlend: ['spiel'], erwartetErsetzt: ['held-lauf-1'], mindestMs: VIER_S });
  await pruefeMitErsatz(8895, haengt('**/assets/assets.json*'), 'Manifest-Server antwortet nie',
    { erwartetFehlend: ['assets/assets.json'], erwartetErsetzt: ['held-lauf-1'], mindestMs: VIER_S });

  await modellTest(8896, null, 'modell.html', (m, fehler) => {
    t.pruefe(m.bereit && !m.ersatz && m.dreiecke > 12, `modell.html zeigt das Boot (${m.dreiecke} Dreiecke, kein Ersatz)`);
    t.pruefe(fehler.length === 0, `modell.html: keine Konsolenfehler ${fehler.join(' | ')}`);
  });
  await modellTest(8897, fehlt('**/boot.glb*'), 'ohne boot.glb', (m, fehler) => {
    t.pruefe(m.bereit && m.ersatz && m.dreiecke === 12, `ohne boot.glb: Ersatz-Box (${m.dreiecke} Dreiecke)`);
    t.pruefe(h.nurLadefehler(fehler), `ohne boot.glb: kein Absturz, nur die Ladezeile ${fehler.join(' | ')}`);
  });
  await modellTest(8898, haengt('**/boot.glb*'), 'boot.glb hängt', (m, fehler) => {
    t.pruefe(m.bereit && m.ersatz && fehler.length === 0, 'boot.glb hängt: nach der Zeitgrenze Ersatz-Box, keine Fehler');
  });
  t.ergebnis();
})();
