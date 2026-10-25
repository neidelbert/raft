// Test für Übung 1 (Ball): node ausbildung/uebungen/stufe-1/test.js
const t = require('../../../werkzeuge/test-hilfe.js');
const path = require('path');
const { pathToFileURL } = require('url');

const ORDNER = 'ausbildung/uebungen/stufe-1';

// Im Browser: Ballpositionen pro Bild für eine Zeitspanne sammeln (Weg aufsummiert, Ränder geprüft).
function messeImBrowser(ms) {
  return new Promise((fertig) => {
    const s = window.spiel, b = s.ball;
    let weg = 0, ausserhalb = 0, bilder = 0, groessterSchritt = 0;
    let lx = b.x, ly = b.y;
    const start = performance.now();
    (function schritt() {
      const d = Math.hypot(b.x - lx, b.y - ly);
      weg += d; groessterSchritt = Math.max(groessterSchritt, d);
      lx = b.x; ly = b.y; bilder++;
      const e = 0.01;
      if (b.x - b.r < -e || b.y - b.r < -e || b.x + b.r > s.breite + e || b.y + b.r > s.hoehe + e) ausserhalb++;
      const vergangen = performance.now() - start;
      if (vergangen < ms) requestAnimationFrame(schritt);
      else fertig({ wegProSekunde: (weg * 1000) / vergangen, ausserhalb, bilder, groessterSchritt });
    })();
  });
}

// Reine Regeln ohne Browser.
async function regelTests() {
  const { erstelleBall, bewegeBall } = await import(pathToFileURL(path.join(t.REPO, ORDNER, 'js/welt/ball.js')));
  const ball = { x: 390 - 18 - 5, y: 400, r: 18, vx: 300, vy: 0 };
  bewegeBall(ball, 0.1, 390, 844);               // 30 Punkte nach rechts, 5 bis zum Rand → 25 zurück
  t.pruefe(Math.abs(ball.x - (390 - 18 - 25)) < 1e-9 && ball.vx === -300, 'Regel: Abprall rechts spiegelt Weg und Richtung');
  const ecke = { x: 20, y: 20, r: 18, vx: -300, vy: -300 };
  bewegeBall(ecke, 0.1, 390, 844);
  t.pruefe(ecke.x === 46 && ecke.y === 46 && ecke.vx > 0 && ecke.vy > 0, 'Regel: Abprall in der Ecke dreht beide Richtungen');
  const zufall = () => 0.5;
  const neu = erstelleBall({ breite: 390, hoehe: 844, radius: 18, tempo: 300, winkelMin: 25, winkelMax: 65, zufall });
  t.pruefe(Math.abs(Math.hypot(neu.vx, neu.vy) - 300) < 1e-9 && neu.vx !== 0 && neu.vy !== 0, 'Regel: Start schräg mit Tempo 300');
}

(async () => {
  await regelTests();
  const lauf = await t.starte({ ordner: ORDNER, port: 8810, pfad: 'index.html?seed=42&test=1' });
  const { seite } = lauf;
  try {
    const { SPIEL } = await import(pathToFileURL(path.join(t.REPO, ORDNER, 'js/config/spiel.js')));
    const tempo = SPIEL.ballTempo;
    t.pruefe(tempo === 300, `ballTempo aus config = ${tempo}`);

    const info = await seite.evaluate(() => {
      const c = document.getElementById('leinwand'), r = c.getBoundingClientRect(), s = window.spiel;
      return { cb: c.width, ch: c.height, rb: r.width, rh: r.height, iw: innerWidth, ih: innerHeight, dpr: devicePixelRatio,
        pr: s.pixelRatio, breite: s.breite, hoehe: s.hoehe, ball: { ...s.ball } };
    });
    t.pruefe(info.rb === info.iw && info.rh === info.ih, `Canvas füllt den Bildschirm (${info.rb}×${info.rh} von ${info.iw}×${info.ih})`);
    t.pruefe(info.breite === info.iw && info.hoehe === info.ih, 'spiel.breite/hoehe = Bildschirm in CSS-Punkten');
    t.pruefe(info.pr <= 2 && info.pr === Math.min(info.dpr, 2), `Pixel-Ratio ${info.pr} (Gerät ${info.dpr}), höchstens 2`);
    t.pruefe(info.cb === Math.round(info.breite * info.pr) && info.ch === Math.round(info.hoehe * info.pr),
      `interne Canvas-Größe ${info.cb}×${info.ch} = Breite × Pixel-Ratio`);
    t.pruefe(info.ball.r === SPIEL.ballRadius, `Ballradius aus config (${info.ball.r})`);

    // Tempo bei normaler Bildrate
    const normal = await seite.evaluate(messeImBrowser, 2000);
    t.pruefe(Math.abs(normal.wegProSekunde - tempo) <= tempo * 0.25,
      `Tempo normal: ${normal.wegProSekunde.toFixed(0)} Punkte/s bei ${normal.bilder} Bildern`);
    t.pruefe(normal.ausserhalb === 0, 'Ball bleibt im Bildschirm (normal)');

    // Langsames Gerät: jedes Bild 40 ms Rechenarbeit (≈ 20 Bilder/s)
    await seite.evaluate(() => { (function bremse() { const bis = performance.now() + 40; while (performance.now() < bis); requestAnimationFrame(bremse); })(); });
    const langsam = await seite.evaluate(messeImBrowser, 2000);
    t.pruefe(Math.abs(langsam.wegProSekunde - tempo) <= tempo * 0.25,
      `Tempo langsames Gerät: ${langsam.wegProSekunde.toFixed(0)} Punkte/s bei ${langsam.bilder} Bildern`);
    t.pruefe(langsam.bilder < normal.bilder / 2, 'Bremse wirkt wirklich (deutlich weniger Bilder)');
    t.pruefe(langsam.ausserhalb === 0, 'Ball bleibt im Bildschirm (langsam)');
    await seite.reload();
    await seite.waitForFunction('window.spiel && window.spiel.bereit');

    // Ränder gezielt: Ball knapp vor jede Ecke setzen, schnell drauf zu
    // Je Achse tempo/√2, damit der Ball schräg genau mit ballTempo fliegt.
    const { breite: B, hoehe: H } = await seite.evaluate(() => window.spiel);
    const v = tempo / Math.SQRT2;
    for (const [x, y, vx, vy] of [[20, 20, -v, -v], [B - 20, 20, v, -v], [20, H - 20, -v, v], [B - 20, H - 20, v, v]]) {
      await seite.evaluate(([x, y, vx, vy]) => window.spiel.test.setzeBall(x, y, vx, vy), [x, y, vx, vy]);
      const r = await seite.evaluate(messeImBrowser, 300);
      t.pruefe(r.ausserhalb === 0, `Ecke (${x.toFixed(0)}|${y.toFixed(0)}): Ball prallt ab und bleibt drin`);
    }

    // Kleinerer Bildschirm (Safari-Leiste, Drehen): Ball wird ins Bild geholt
    await seite.evaluate((v) => { const s = window.spiel; s.test.setzeBall(s.breite - 20, s.hoehe - 20, v, v); }, v);
    await seite.setViewportSize({ width: 300, height: 500 });
    await seite.waitForTimeout(100);
    const klein = await seite.evaluate(messeImBrowser, 500);
    const kleinInfo = await seite.evaluate(() => ({ b: window.spiel.breite, h: window.spiel.hoehe, cb: document.getElementById('leinwand').width }));
    t.pruefe(kleinInfo.b === 300 && kleinInfo.h === 500 && kleinInfo.cb === 600, 'Größenänderung passt Canvas an');
    t.pruefe(klein.ausserhalb === 0, 'nach Größenänderung bleibt der Ball im Bildschirm');
    await seite.setViewportSize({ width: 390, height: 664 });
    await seite.waitForTimeout(100);

    // Tab-Wechsel: versteckt → Ball steht; zurück → kein Sprung
    const vorher = await seite.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
      return { x: window.spiel.ball.x, y: window.spiel.ball.y };
    });
    await seite.waitForTimeout(1000);
    const versteckt = await seite.evaluate(() => ({ x: window.spiel.ball.x, y: window.spiel.ball.y }));
    t.pruefe(Math.hypot(versteckt.x - vorher.x, versteckt.y - vorher.y) < 0.5, 'Tab versteckt: Ball steht still');
    // Rückkehr nach einer langen Pause ohne Bilder (wie bei echtem Tab-Wechsel): Seite 1 s blockieren, dann sichtbar
    const sprung = await seite.evaluate(() => new Promise((fertig) => {
      const b = window.spiel.ball;
      const bis = performance.now() + 1000; while (performance.now() < bis);
      delete document.hidden; delete document.visibilityState;
      document.dispatchEvent(new Event('visibilitychange'));
      const x0 = b.x, y0 = b.y;
      requestAnimationFrame(() => requestAnimationFrame(() => fertig(Math.hypot(b.x - x0, b.y - y0))));
    }));
    t.pruefe(sprung < tempo * 0.06, `nach Tab-Wechsel kein Sprung (${sprung.toFixed(1)} Punkte im ersten Bild)`);
    const danach = await seite.evaluate(messeImBrowser, 1000);
    t.pruefe(Math.abs(danach.wegProSekunde - tempo) <= tempo * 0.25 && danach.ausserhalb === 0,
      `nach Tab-Wechsel läuft der Ball normal weiter (${danach.wegProSekunde.toFixed(0)} Punkte/s, ${danach.bilder} Bilder, größter Schritt ${danach.groessterSchritt.toFixed(1)})`);

    // ohne ?test=1 gibt es spiel.test nicht
    await seite.goto('http://127.0.0.1:8810/index.html?seed=42');
    await seite.waitForFunction('window.spiel && window.spiel.bereit');
    t.pruefe(await seite.evaluate(() => window.spiel.test === undefined), 'ohne ?test=1 kein spiel.test');

    await seite.waitForTimeout(700);
    await seite.screenshot({ path: process.env.FOTO || '/tmp/stufe-1.png' });
    t.pruefe(lauf.fehler.length === 0, `keine Konsolenfehler ${lauf.fehler.join(' | ')}`);
  } catch (e) { t.pruefe(false, `Ablauf abgebrochen: ${e.message}`); }
  await lauf.ende();
  t.ergebnis();
})();
