// Test für „__NAME__“ (Gerüst aus neues-spiel.js): node tests/__NAME__-test.js (aus jedem Ordner).
// Prüft: Regeln ohne Browser; Start ohne Konsolenfehler mit und ohne ?test=1; Ladebildschirm → Titel; Ton-Knopf;
//   Tippen → Spiel; Joystick bewegt, Loslassen und Abbruch stoppen; Tab-Wechsel (Pause, kein Sprung, Joystick gelöst);
//   Runde endet → Rekord gespeichert, nach Neuladen noch da; kaputter Speicherstand und privater Modus;
//   fehlende und hängende Assets (Ersatz); Pixel-Ratio ≤ 2; 3D: Zeichenaufrufe. Bildschirmfoto: FOTO (Standard Temp).
// Umgebung: PORT=<zahl> (Standard __PORT__), ORDNER=<Kopie> für die Gegenprobe (kaputte Kopie muss rot werden).
// Braucht Node, Playwright mit Chromium, python3; 3D einmal npm (test-hilfe.js holt Three.js in den Temp-Ordner).
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');
const t = require('./test-hilfe.js');

const ORDNER = process.env.ORDNER ? path.resolve(process.env.ORDNER) : path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT) || __PORT__;
const FOTO = process.env.FOTO || path.join(os.tmpdir(), '__NAME__.png');
const IM_TITEL = 'window.spiel && window.spiel.zustand === "titel"';
const lade = (datei) => import(pathToFileURL(path.join(ORDNER, datei)).href);
const warte = (ms) => new Promise((ok) => setTimeout(ok, ms));
const nurLadefehler = (fehler) => fehler.every((f) => /Failed to load resource/.test(f));
const lies = (seite, ausdruck) => seite.evaluate(ausdruck);

// n Bilder in der Seite abwarten (requestAnimationFrame).
const bilder = (seite, n) => seite.evaluate((anzahl) => new Promise((fertig) => {
  let rest = anzahl;
  (function weiter() { rest-- > 0 ? requestAnimationFrame(weiter) : fertig(); })();
}), n);

// Tab verstecken oder zeigen wie beim App-Wechsel am iPhone.
const tab = (seite, versteckt) => seite.evaluate((v) => {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => v });
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (v ? 'hidden' : 'visible') });
  document.dispatchEvent(new Event('visibilitychange'));
}, versteckt);

async function regeln() {
  const { erstelleSpieler, setzeSpieler, bewegeSpieler } = await lade('js/regeln/spieler.js');
  const { erstelleRunde, starteRunde, aktualisiereRunde } = await lade('js/regeln/runde.js');
  const { SPIELER } = await lade('js/config/welt.js');
  const { RUNDE, SPIEL } = await lade('js/config/spiel.js');
  const feld = { minX: -1000, minY: -1000, maxX: 1000, maxY: 1000 };
  const s = erstelleSpieler();
  setzeSpieler(s, 0, 0);
  for (let i = 0; i < 10; i++) bewegeSpieler(s, { x: 1, y: 0 }, 0.05, 100, feld);
  t.pruefe(Math.abs(s.x - 50) < 1e-9 && s.y === 0 && Math.abs(s.weg - 50) < 1e-9, `Regel: 0,5 s mit Tempo 100 → 50 weit (x ${s.x})`);
  setzeSpieler(s, 0, 0);
  bewegeSpieler(s, { x: 0, y: -1 }, 0.5, 100, feld);
  t.pruefe(s.y === -50 && s.x === 0, 'Regel: Joystick oben → y wird kleiner');
  setzeSpieler(s, 990, 0);
  bewegeSpieler(s, { x: 1, y: 0 }, 1, 100, feld);
  t.pruefe(s.x === 1000 && Math.abs(s.weg - 10) < 1e-9, 'Regel: Rand hält die Figur, Weg zählt nur bis zum Rand');
  const r = erstelleRunde();
  starteRunde(r, RUNDE.dauer);
  let vorbei = false, schritte = 0;
  while (!vorbei && schritte < 10000) { vorbei = aktualisiereRunde(r, SPIEL.deltaMax, SPIELER.wegProPunkt * 3.5, SPIELER.wegProPunkt); schritte++; }
  t.pruefe(vorbei && Math.abs(schritte * SPIEL.deltaMax - RUNDE.dauer) < SPIEL.deltaMax + 1e-9, `Regel: Runde endet nach ${RUNDE.dauer} s (${schritte} Schritte)`);
  t.pruefe(r.punkte === 3 && r.zeit === 0, `Regel: Punkte = ganze Wegstücke (${r.punkte})`);
  return SPIELER;
}

async function ohneTestModus() {
  const lauf = await t.starte({ ordner: ORDNER, port: PORT, warteAuf: IM_TITEL });
  try {
    const s = lauf.seite;
    t.pruefe(lauf.fehler.length === 0, `ohne ?test=1: keine Konsolenfehler ${lauf.fehler.join(' | ')}`);
    t.pruefe(await lies(s, () => window.spiel.test === undefined), 'ohne ?test=1: kein spiel.test');
    t.pruefe(await lies(s, () => window.spiel.pixelRatio) <= 2, `Pixel-Ratio höchstens 2 (Gerät hat 3): ${await lies(s, () => window.spiel.pixelRatio)}`);
  } catch (e) { t.pruefe(false, `Ablauf ohne Test-Modus abgebrochen: ${e.message}`); }
  await lauf.ende();
}

async function ablauf(SPIELER) {
  // Manifest kurz verzögern, damit der Ladebildschirm sicher zu sehen ist.
  const lauf = await t.starte({
    ordner: ORDNER, port: PORT, pfad: 'index.html?test=1&seed=42',
    routen: (k) => k.route('**/assets/assets.json', async (route) => { await warte(400); route.continue(); }),
  });
  const s = lauf.seite;
  try {
    const anfang = await lies(s, () => ({ zustand: window.spiel.zustand, laden: !document.getElementById('laden').hidden }));
    t.pruefe(anfang.zustand === 'laden' && anfang.laden, `Ladebildschirm zuerst (${anfang.zustand})`);
    const verlauf = await s.evaluate(() => new Promise((fertig) => {   // Fortschritt in jedem Bild mitschreiben
      const werte = [];
      (function schau() { werte.push(window.spiel.fortschritt); window.spiel.zustand === 'titel' ? fertig(werte) : requestAnimationFrame(schau); })();
    }));
    t.pruefe(verlauf.every((w, i) => i === 0 || w >= verlauf[i - 1]) && verlauf[verlauf.length - 1] === 1, `Fortschritt steigt bis 1, nie zurück (${verlauf.length} Bilder)`);
    const a = await lies(s, () => window.spiel.assets);
    t.pruefe(a.geladen.length > 0 && a.fehlend.length === 0 && a.ersetzt.length === 0, `Assets geladen: ${a.geladen.join(', ')}`);
    const art = await lies(s, () => window.spiel.darstellung);
    if (art === '3d') t.pruefe(['glb', 'ersatz'].includes(await lies(s, () => window.spiel.modell)), `3D: Spieler-Modell oder Ersatz-Box (${await lies(s, () => window.spiel.modell)})`);

    // Ton-Knopf im Titel: schaltet, startet das Spiel nicht, wird gespeichert.
    const knopf = await s.locator('#knopf-ton').boundingBox();
    const mitte = (b) => [b.x + b.width / 2, b.y + b.height / 2];
    await t.tippe(s, ...mitte(knopf));
    const nachKnopf = await lies(s, () => ({ an: window.spiel.ton.an, zustand: window.spiel.zustand, text: document.getElementById('knopf-ton').textContent }));
    t.pruefe(!nachKnopf.an && nachKnopf.zustand === 'titel' && nachKnopf.text === 'Ton aus', `Ton-Knopf: aus, Titel bleibt (${nachKnopf.zustand}, „${nachKnopf.text}“)`);
    await t.tippe(s, ...mitte(knopf));
    t.pruefe(await lies(s, () => window.spiel.ton.an), 'Ton-Knopf: wieder an');

    // Tippen → Spiel (weckt den Ton, spielt den Start-Klang).
    const g = await lies(s, () => ({ b: innerWidth, h: innerHeight }));
    await t.tippe(s, g.b * 0.75, g.h * 0.5);
    await bilder(s, 3);
    const start = await lies(s, () => ({ zustand: window.spiel.zustand, x: window.spiel.spieler.x, y: window.spiel.spieler.y, ton: window.spiel.ton.bereit, klaenge: window.spiel.ton.klaenge, joy: window.spiel.joystickAktiv }));
    t.pruefe(start.zustand === 'spiel' && !start.joy, `Tippen → Spiel, das Start-Tippen bewegt den Joystick nicht (${start.zustand})`);
    t.pruefe(start.ton && start.klaenge >= 1, `Ton nach dem Tippen bereit, Start-Klang gespielt (${start.klaenge})`);
    await s.evaluate(() => window.spiel.test.setzeZeit(600));   // Zeit genug für alle Prüfungen, auch bei langsamer Grafik

    // Joystick: rechts ziehen → x wächst, Loslassen → Stillstand.
    await t.ziehe(s, g.b * 0.2, g.h * 0.6, g.b * 0.2 + 60, g.h * 0.6, { halteMs: 500 });
    const nachRechts = await lies(s, () => window.spiel.spieler.x);
    t.pruefe(nachRechts > start.x, `Joystick rechts → Figur nach rechts (${start.x.toFixed(2)} → ${nachRechts.toFixed(2)})`);
    await bilder(s, 2);
    const los1 = await lies(s, () => window.spiel.spieler.x);
    await bilder(s, 15);
    t.pruefe(await lies(s, () => window.spiel.spieler.x) === los1 && !(await lies(s, () => window.spiel.joystickAktiv)), 'Loslassen → Stillstand, Joystick gelöst');
    // Oben ziehen → y wird kleiner (3D: vom Bildschirm weg).
    const y0 = await lies(s, () => window.spiel.spieler.y);
    await t.ziehe(s, g.b * 0.2, g.h * 0.6, g.b * 0.2, g.h * 0.6 - 60, { halteMs: 300 });
    t.pruefe(await lies(s, () => window.spiel.spieler.y) < y0, 'Joystick oben → Figur nach oben');
    // Abbruch durch Safari (touchCancel) → Stillstand.
    const cdp = await t.ziehe(s, g.b * 0.2, g.h * 0.6, g.b * 0.2 + 60, g.h * 0.6, { loslassen: false });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    await bilder(s, 2);
    const abbruch = await lies(s, () => window.spiel.spieler.x);
    await bilder(s, 10);
    t.pruefe(await lies(s, () => window.spiel.spieler.x) === abbruch && !(await lies(s, () => window.spiel.joystickAktiv)), 'Abbruch (touchCancel) → Stillstand');
    const p = await lies(s, () => ({ punkte: window.spiel.punkte, weg: window.spiel.spieler.weg }));
    t.pruefe(p.weg > 0 && p.punkte === Math.floor(p.weg / SPIELER.wegProPunkt), `Punkte aus dem Weg (${p.punkte} für ${p.weg.toFixed(1)})`);

    // Tab-Wechsel mit gehaltenem Finger: Pause, Joystick gelöst, danach kein Zeitsprung.
    const halt = await t.ziehe(s, g.b * 0.2, g.h * 0.6, g.b * 0.2 + 60, g.h * 0.6, { loslassen: false });
    await tab(s, true);
    const zeitVersteckt = await lies(s, () => window.spiel.zeit);
    await warte(600);
    const versteckt = await lies(s, () => ({ zeit: window.spiel.zeit, pausiert: window.spiel.pausiert, joy: window.spiel.joystickAktiv }));
    t.pruefe(versteckt.pausiert && versteckt.zeit === zeitVersteckt && !versteckt.joy, 'Tab versteckt: Pause, Zeit steht, Joystick gelöst');
    await tab(s, false);
    await bilder(s, 3);
    const zurueck = await lies(s, () => window.spiel.zeit);
    t.pruefe(!(await lies(s, () => window.spiel.pausiert)) && zeitVersteckt - zurueck < 0.35, `Nach der Rückkehr kein Sprung (${(zeitVersteckt - zurueck).toFixed(3)} s in 3 Bildern)`);
    await halt.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

    // 3D: Zeichenaufrufe in jedem Bild mitschreiben, das Höchste prüfen (renderer.info zeigt nur das letzte Bild).
    if (art === '3d') {
      const { DREI } = await lade('js/config/welt.js');
      const hoechstens = await s.evaluate(() => new Promise((fertig) => {
        let max = 0, n = 0;
        (function zaehle() { max = Math.max(max, window.spiel.zeichenaufrufe); n++ < 30 ? requestAnimationFrame(zaehle) : fertig(max); })();
      }));
      t.pruefe(hoechstens > 0 && hoechstens <= DREI.zeichenaufrufeMax, `3D: höchstens ${hoechstens} Zeichenaufrufe pro Bild (Grenze ${DREI.zeichenaufrufeMax})`);
    }
    await s.screenshot({ path: FOTO });
    console.log(`       Bildschirmfoto: ${FOTO}`);

    // Runde endet auf dem normalen Weg → Ende, Rekord gespeichert; Tippen → neue Runde.
    const punkte = await lies(s, () => window.spiel.punkte);
    await s.evaluate(() => window.spiel.test.setzeZeit(0.05));
    await s.waitForFunction(() => window.spiel.zustand === 'ende', null, { timeout: 3000 });
    const ende = await lies(s, () => ({ rekord: window.spiel.rekord, tafel: !document.getElementById('ende').hidden, text: document.getElementById('ende-punkte').textContent }));
    t.pruefe(punkte > 0 && ende.tafel && ende.text === `Punkte: ${punkte}` && ende.rekord === punkte, `Ende-Tafel mit Punkten, Rekord ${ende.rekord}`);
    const { SPEICHER } = await lade('js/config/spiel.js');
    const gespeichert = await s.evaluate((k) => JSON.parse(localStorage.getItem(k) || '{}'), SPEICHER.schluessel);
    t.pruefe(gespeichert.rekord === punkte && gespeichert.ton === true, `Rekord und Ton gespeichert (${JSON.stringify(gespeichert)})`);
    await t.tippe(s, g.b * 0.75, g.h * 0.5);
    await bilder(s, 2);
    const neu = await lies(s, () => ({ zustand: window.spiel.zustand, punkte: window.spiel.punkte, weg: window.spiel.spieler.weg }));
    t.pruefe(neu.zustand === 'spiel' && neu.punkte === 0 && neu.weg === 0, 'Tippen auf dem Ende → neue Runde, alles zurückgesetzt');

    await s.reload();
    await s.waitForFunction(IM_TITEL, null, { timeout: 15000 });
    t.pruefe(await lies(s, () => window.spiel.rekord) === punkte, 'Nach dem Neuladen ist der Rekord noch da');
    t.pruefe(await lies(s, () => document.getElementById('titel-rekord').textContent) === `Rekord: ${punkte}`, 'Titel zeigt den Rekord');
    t.pruefe(lauf.fehler.length === 0, `mit ?test=1: keine Konsolenfehler ${lauf.fehler.join(' | ')}`);
  } catch (e) { t.pruefe(false, `Ablauf abgebrochen: ${e.message}`); }
  await lauf.ende();
}

async function speicherFaelle() {
  const { SPEICHER } = await lade('js/config/spiel.js');
  const kaputt = await t.starte({
    ordner: ORDNER, port: PORT, warteAuf: IM_TITEL,
    initSkript: { content: `localStorage.setItem(${JSON.stringify(SPEICHER.schluessel)}, '{kaputt');` },
  });
  try {
    t.pruefe(await lies(kaputt.seite, () => window.spiel.rekord) === 0 && kaputt.fehler.length === 0, `kaputter Speicherstand → Standardwerte, keine Fehler ${kaputt.fehler.join(' | ')}`);
  } catch (e) { t.pruefe(false, `kaputter Speicher: ${e.message}`); }
  await kaputt.ende();
  const privat = await t.starte({
    ordner: ORDNER, port: PORT, warteAuf: IM_TITEL,
    initSkript: { content: "Object.defineProperty(window, 'localStorage', { get() { throw new Error('gesperrt'); } });" },
  });
  try {
    const s = privat.seite;
    await t.tippe(s, 300, 300);
    await bilder(s, 2);
    t.pruefe(await lies(s, () => window.spiel.zustand) === 'spiel' && privat.fehler.length === 0, `privater Modus (localStorage gesperrt) → Spiel läuft ${privat.fehler.join(' | ')}`);
  } catch (e) { t.pruefe(false, `privater Modus: ${e.message}`); }
  await privat.ende();
}

async function ersatzFaelle() {
  // Bilder und Atlanten fehlen (404): Spiel läuft mit Ersatz, nur die Browser-Zeile „Failed to load resource“.
  const fehlt = await t.starte({
    ordner: ORDNER, port: PORT, warteAuf: IM_TITEL,
    routen: (k) => k.route(/\/assets\/(atlas|bilder|modelle)\//, (route) => route.fulfill({ status: 404, body: '' })),
  });
  try {
    const a = await lies(fehlt.seite, () => window.spiel.assets);
    t.pruefe(a.fehlend.length > 0 && a.ersetzt.length > 0, `Bild fehlt → Ersatz (${a.ersetzt.join(', ')})`);
    t.pruefe(nurLadefehler(fehlt.fehler), `Bild fehlt: nur Ladefehler des Browsers ${fehlt.fehler.join(' | ')}`);
    await fehlt.seite.screenshot({ path: FOTO.replace(/\.png$/, '-ersatz.png') });
  } catch (e) { t.pruefe(false, `Bild fehlt: ${e.message}`); }
  await fehlt.ende();
  // Manifest hängt (Server antwortet nie): nach der Zeitgrenze läuft das Spiel trotzdem.
  const { LADEN } = await lade('js/config/spiel.js');
  const beginn = Date.now();
  const haengt = await t.starte({
    ordner: ORDNER, port: PORT, warteAuf: null,
    routen: (k) => k.route('**/assets/assets.json', () => {}),
  });
  try {
    const s = haengt.seite;
    await s.waitForFunction(IM_TITEL, null, { timeout: LADEN.zeitgrenze + 6000 });
    const dauer = Date.now() - beginn;
    await t.tippe(s, 300, 300);
    await bilder(s, 2);
    t.pruefe(await lies(s, () => window.spiel.zustand) === 'spiel' && nurLadefehler(haengt.fehler), `Manifest hängt → nach ${(dauer / 1000).toFixed(1)} s Titel, Spiel startet ${haengt.fehler.join(' | ')}`);
  } catch (e) { t.pruefe(false, `Manifest hängt: ${e.message}`); }
  await haengt.ende();
}

(async () => {
  try {
    const SPIELER = await regeln();
    await ohneTestModus();
    await ablauf(SPIELER);
    await speicherFaelle();
    await ersatzFaelle();
  } catch (e) { t.pruefe(false, `Test abgebrochen: ${e.message}`); }
  t.ergebnis();
})();
