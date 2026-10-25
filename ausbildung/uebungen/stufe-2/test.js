// Test für Übung 2 (Steuerung mit Touch): node ausbildung/uebungen/stufe-2/test.js
const t = require('../../../werkzeuge/test-hilfe.js');
const path = require('path');
const { pathToFileURL } = require('url');

const ORDNER = 'ausbildung/uebungen/stufe-2';
const PORT = 8820;
const lade = (datei) => import(pathToFileURL(path.join(t.REPO, ORDNER, datei)));

// Reine Regeln ohne Browser.
async function regelTests() {
  const { rechneEingabe } = await lade('js/steuerung/joystick.js');
  const { erstelleSpieler, bewegeSpieler, starteSprung, aktualisiereSprung } = await lade('js/welt/spieler.js');
  const e = {}, a = {};
  rechneEingabe(200, 0, 50, 0.12, e, a);
  t.pruefe(e.x === 1 && e.y === 0 && a.dx === 50, 'Regel: weit nach rechts ziehen = voller Ausschlag, Knopf bleibt am Ring');
  rechneEingabe(100, 100, 50, 0.12, e, a);
  t.pruefe(Math.abs(Math.hypot(e.x, e.y) - 1) < 1e-9, 'Regel: schräg ziehen ergibt Länge 1, nicht √2');
  rechneEingabe(3, -2, 50, 0.12, e, a);
  t.pruefe(e.x === 0 && e.y === 0, 'Regel: kleines Zittern in der Totzone bewegt nichts');
  rechneEingabe(0, -40, 50, 0.12, e, a);
  t.pruefe(e.x === 0 && Math.abs(e.y + 0.8) < 1e-9, 'Regel: nach oben ziehen ergibt negatives y');

  const s = erstelleSpieler({ x: 100, y: 100, breite: 60, hoehe: 72 });
  bewegeSpieler(s, 1, 1, 220, 1, 1000, 1000, 28);
  t.pruefe(Math.abs(Math.hypot(s.x - 100, s.y - 100) - 220) < 1e-9, 'Regel: Richtung (1|1) bewegt 220 Punkte, nicht 311');
  bewegeSpieler(s, -1, -1, 220, 10, 1000, 1000, 28);
  t.pruefe(s.x === 30 && s.y === 36 + 28, 'Regel: Rand links/oben hält die ganze Figur (samt Sprung) im Bild');
  bewegeSpieler(s, 1, 1, 220, 10, 390, 664, 28);
  t.pruefe(s.x === 360 && s.y === 628, 'Regel: Rand rechts/unten hält die ganze Figur im Bild');
  starteSprung(s);
  aktualisiereSprung(s, 0.39, 0.4);
  const mitten = s.springt;
  starteSprung(s);                       // zweiter Druck mitten im Sprung verlängert nicht
  aktualisiereSprung(s, 0.02, 0.4);
  t.pruefe(mitten && !s.springt, 'Regel: Sprung dauert 0,4 s, kein Doppelsprung');
}

// Im Browser: Weg der Figur über eine Zeitspanne messen (Punkte pro Sekunde, Rand, Bilder).
function messeImBrowser(ms) {
  return new Promise((fertig) => {
    const s = window.spiel.spieler;
    let weg = 0, ausserhalb = 0, bilder = 0, lx = s.x, ly = s.y;
    const x0 = s.x, y0 = s.y, start = performance.now();
    (function schritt() {
      weg += Math.hypot(s.x - lx, s.y - ly); lx = s.x; ly = s.y; bilder++;
      if (s.x - s.breite / 2 < -0.01 || s.x + s.breite / 2 > innerWidth + 0.01 || s.y - s.hoehe / 2 < -0.01 || s.y + s.hoehe / 2 > innerHeight + 0.01) ausserhalb++;
      const vergangen = performance.now() - start;
      if (vergangen < ms) requestAnimationFrame(schritt);
      else fertig({ tempo: (weg * 1000) / vergangen, dx: s.x - x0, dy: s.y - y0, ausserhalb, bilder });
    })();
  });
}

// Mehrere Finger per CDP. finger = [{ id, x, y }]. Bei touchStart/touchMove: alle Finger auf dem Glas.
// Bei touchEnd/touchCancel: nur die Finger, die abheben (so arbeitet Chromium, siehe Lernbuch).
async function touch(cdp, typ, finger) {
  await cdp.send('Input.dispatchTouchEvent', { type: typ, touchPoints: finger.map((f) => ({ ...f, radiusX: 5, radiusY: 5, force: 1 })) });
}
async function zurMitte(seite) {
  await seite.evaluate(() => window.spiel.test.setzeSpieler(innerWidth / 2, innerHeight / 2));
}
const zustand = (seite) => seite.evaluate(() => JSON.parse(JSON.stringify({ s: window.spiel.spieler, e: window.spiel.eingabe })));

(async () => {
  await regelTests();
  const { SPIELER } = await lade('js/config/spieler.js');
  const tempo = SPIELER.laufTempo;
  t.pruefe(tempo === 220 && SPIELER.sprungDauer === 0.4, `laufTempo ${tempo}, sprungDauer ${SPIELER.sprungDauer} aus config`);

  const lauf = await t.starte({ ordner: ORDNER, port: PORT, pfad: 'index.html?seed=42&test=1' });
  const { seite } = lauf;
  try {
    const cdp = await seite.context().newCDPSession(seite);   // für Mehrfinger-Abläufe
    let finger = null;                                         // CDP-Sitzung des letzten gehaltenen t.ziehe
    const info = await seite.evaluate(() => {
      const k = document.getElementById('knopf-sprung').getBoundingClientRect();
      return { iw: innerWidth, ih: innerHeight, s: { ...window.spiel.spieler }, e: { ...window.spiel.eingabe }, bild: window.spiel.test.bildGeladen,
        knopf: { l: k.left, t: k.top, b: k.width, h: k.height, r: getComputedStyle(document.getElementById('knopf-sprung')).borderRadius } };
    });
    const { iw: B, ih: H } = info;
    t.pruefe(Math.abs(info.s.x - B / 2) < 1 && Math.abs(info.s.y - H / 2) < 1, `Figur startet in der Mitte (${info.s.x.toFixed(0)}|${info.s.y.toFixed(0)})`);
    t.pruefe(info.bild === true, 'Bild figur.png geladen');
    t.pruefe(info.e.x === 0 && info.e.y === 0 && info.e.aktiv === false && info.s.springt === false, 'Start: keine Eingabe, kein Sprung');
    t.pruefe(info.knopf.b >= 64 && info.knopf.h >= 64 && info.knopf.r === '50%', `Sprung-Knopf rund, ${info.knopf.b}×${info.knopf.h} Punkte`);
    t.pruefe(info.knopf.l > B / 2 && info.knopf.t > H / 2 && info.knopf.l + info.knopf.b <= B && info.knopf.t + info.knopf.h <= H, 'Sprung-Knopf rechts unten im Bild');
    const knopfX = info.knopf.l + info.knopf.b / 2, knopfY = info.knopf.t + info.knopf.h / 2;

    // Ziehen nach rechts, halten, Tempo messen; dann loslassen → sofort Stillstand
    finger = await t.ziehe(seite, 80, 400, 160, 400, { loslassen: false });
    let z = await zustand(seite);
    t.pruefe(z.e.aktiv && z.e.x > 0.9 && Math.abs(z.e.y) < 0.01, `Ziehen nach rechts: eingabe (${z.e.x.toFixed(2)}|${z.e.y.toFixed(2)}), aktiv`);
    await zurMitte(seite);
    const rechts = await seite.evaluate(messeImBrowser, 500);
    t.pruefe(rechts.dx > 50 && Math.abs(rechts.dy) < 0.5, `Figur läuft nach rechts (${rechts.dx.toFixed(0)} Punkte in 0,5 s)`);
    t.pruefe(Math.abs(rechts.tempo - tempo) <= tempo * 0.15, `Tempo gerade ${rechts.tempo.toFixed(0)} Punkte/s (Ziel ${tempo})`);
    await touch(finger, 'touchEnd', []);
    await seite.waitForTimeout(50);
    const nachLos = await seite.evaluate(messeImBrowser, 400);
    z = await zustand(seite);
    t.pruefe(z.e.x === 0 && z.e.y === 0 && !z.e.aktiv, 'Loslassen setzt eingabe x, y und aktiv zurück');
    t.pruefe(nachLos.dx === 0 && nachLos.dy === 0, 'Loslassen stoppt sofort (Figur steht)');

    // Nach oben
    await zurMitte(seite);
    finger = await t.ziehe(seite, 80, 500, 80, 400, { loslassen: false });
    const oben = await seite.evaluate(messeImBrowser, 400);
    t.pruefe(oben.dy < -40 && Math.abs(oben.dx) < 0.5, `Ziehen nach oben: Figur nach oben (${oben.dy.toFixed(0)} Punkte)`);
    await touch(finger, 'touchEnd', []);

    // Schräg nicht schneller als gerade
    await zurMitte(seite);
    finger = await t.ziehe(seite, 80, 500, 160, 420, { loslassen: false });
    const schraeg = await seite.evaluate(messeImBrowser, 500);
    await touch(finger, 'touchEnd', []);
    t.pruefe(schraeg.dx > 0 && schraeg.dy < 0 && Math.abs(schraeg.dx + schraeg.dy) < 2, 'schräg: gleich viel nach rechts wie nach oben');
    t.pruefe(Math.abs(schraeg.tempo - rechts.tempo) <= tempo * 0.1, `schräg ${schraeg.tempo.toFixed(0)} Punkte/s, gerade ${rechts.tempo.toFixed(0)}: nicht schneller`);

    // pointercancel (Systemgeste von Safari) stoppt ebenfalls
    await zurMitte(seite);
    finger = await t.ziehe(seite, 80, 400, 160, 400, { loslassen: false });
    await touch(finger, 'touchCancel', []);
    await seite.waitForTimeout(50);
    const nachAbbruch = await seite.evaluate(messeImBrowser, 300);
    z = await zustand(seite);
    t.pruefe(!z.e.aktiv && z.e.x === 0 && nachAbbruch.dx === 0, 'Abbruch (pointercancel) stoppt die Figur');

    // Zweiter Finger auf dem Sprung-Knopf während des Ziehens
    await zurMitte(seite);
    const f1 = { id: 1, x: 80, y: 400 };
    await touch(cdp, 'touchStart', [f1]);
    for (let i = 1; i <= 8; i++) { f1.x = 80 + i * 10; await touch(cdp, 'touchMove', [f1]); await seite.waitForTimeout(16); }
    const vorSprung = await zustand(seite);
    const f2 = { id: 2, x: knopfX, y: knopfY };
    await touch(cdp, 'touchStart', [f1, f2]);
    const imSprung = await seite.evaluate(() => new Promise((fertig) => requestAnimationFrame(() => fertig(JSON.parse(JSON.stringify(window.spiel))))));
    t.pruefe(imSprung.spieler.springt === true, 'zweiter Finger auf „Sprung“ löst den Sprung aus');
    t.pruefe(imSprung.eingabe.aktiv && imSprung.eingabe.x === vorSprung.e.x && imSprung.eingabe.y === vorSprung.e.y,
      `Laufrichtung bleibt beim Sprung (${imSprung.eingabe.x.toFixed(2)}|${imSprung.eingabe.y.toFixed(2)})`);
    const waehrend = await seite.evaluate(messeImBrowser, 300);
    t.pruefe(waehrend.dx > 40 && Math.abs(waehrend.dy) < 0.5, `Figur läuft während des Sprungs weiter nach rechts, y unverändert (${waehrend.dx.toFixed(0)}|${waehrend.dy.toFixed(1)})`);
    await touch(cdp, 'touchEnd', [f2]);   // nur Finger 2 hebt ab
    await seite.waitForTimeout(250);
    z = await zustand(seite);
    t.pruefe(!z.s.springt, 'Sprung endet nach 0,4 s');
    t.pruefe(z.e.aktiv && z.e.x === vorSprung.e.x, 'Abheben des Sprung-Fingers lässt den Joystick in Ruhe');
    await touch(cdp, 'touchEnd', [f1]);
    await seite.waitForTimeout(50);
    z = await zustand(seite);
    t.pruefe(!z.e.aktiv && z.e.x === 0, 'danach Loslassen des Joystick-Fingers stoppt');

    // Dauer des Sprungs genauer: einzelnes Tippen auf den Knopf
    const dauer = await seite.evaluate(() => new Promise((fertig) => {
      const s = window.spiel.spieler, k = document.getElementById('knopf-sprung');
      k.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 9, pointerType: 'touch' }));
      k.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 9, pointerType: 'touch' }));
      const start = performance.now();
      (function warte() { s.springt ? requestAnimationFrame(warte) : fertig(performance.now() - start); })();
    }));
    t.pruefe(Math.abs(dauer - 400) < 60, `Sprung dauert ${dauer.toFixed(0)} ms (Ziel 400)`);
    await t.tippe(seite, knopfX, knopfY);
    t.pruefe(await seite.evaluate(() => window.spiel.spieler.springt), 'Tippen auf den Knopf (ein Finger) springt');
    await seite.waitForTimeout(500);
    // Langes Drücken (über 0,4 s) löst beim Loslassen keinen zweiten Sprung aus
    finger = await t.ziehe(seite, knopfX, knopfY, knopfX + 2, knopfY, { schritte: 1, halteMs: 500 });
    t.pruefe(await seite.evaluate(() => !window.spiel.spieler.springt), 'langes Drücken: kein zweiter Sprung beim Loslassen');
    await seite.evaluate(() => document.getElementById('knopf-sprung').click());
    t.pruefe(await seite.evaluate(() => window.spiel.spieler.springt), 'Klick ohne Finger (Tastatur) springt');
    await seite.waitForTimeout(500);

    // Tippen und Ziehen in der rechten Hälfte bewegt nichts
    await zurMitte(seite);
    const vorRechts = await zustand(seite);
    await t.tippe(seite, B * 0.75, H * 0.4);
    finger = await t.ziehe(seite, B * 0.6, H * 0.3, B * 0.9, H * 0.2, { halteMs: 300, loslassen: false });
    const rechteHaelfte = await zustand(seite);
    await touch(finger, 'touchEnd', []);
    t.pruefe(!rechteHaelfte.e.aktiv && rechteHaelfte.s.x === vorRechts.s.x && rechteHaelfte.s.y === vorRechts.s.y && !rechteHaelfte.s.springt,
      'Tippen und Ziehen in der rechten Hälfte bewegt nichts');

    // Zweiter Finger in der linken Hälfte übernimmt den Joystick nicht
    await zurMitte(seite);
    const g1 = { id: 1, x: 80, y: 400 };
    await touch(cdp, 'touchStart', [g1]);
    g1.x = 160; await touch(cdp, 'touchMove', [g1]);
    const g2 = { id: 2, x: 100, y: 300 };
    await touch(cdp, 'touchStart', [g1, g2]);
    g2.y = 200; await touch(cdp, 'touchMove', [g1, g2]);
    z = await zustand(seite);
    t.pruefe(z.e.x > 0.9 && Math.abs(z.e.y) < 0.01, 'zweiter Finger links ändert die Richtung nicht');
    await touch(cdp, 'touchEnd', [g2]);
    z = await zustand(seite);
    t.pruefe(z.e.aktiv && z.e.x > 0.9, 'Abheben des zweiten Fingers lässt den Joystick aktiv');
    await touch(cdp, 'touchEnd', [g1]);
    z = await zustand(seite);
    t.pruefe(!z.e.aktiv, 'Abheben des ersten Fingers stoppt');

    // Die Figur bleibt im Bildschirm: lange in alle vier Richtungen laufen
    for (const [name, dx, dy] of [['links', -80, 0], ['rechts', 80, 0], ['oben', 0, -80], ['unten', 0, 80], ['links oben', -60, -60]]) {
      await zurMitte(seite);
      finger = await t.ziehe(seite, 120, 400, 120 + dx, 400 + dy, { schritte: 3, loslassen: false });
      const r = await seite.evaluate(messeImBrowser, 2200);
      await touch(finger, 'touchEnd', []);
      t.pruefe(r.ausserhalb === 0, `Figur bleibt im Bildschirm (${name})`);
    }

    // Langsames Gerät: jedes Bild 40 ms Rechenarbeit (≈ 20 Bilder/s), Tempo bleibt gleich
    await zurMitte(seite);
    await seite.evaluate(() => { window.bremse = true; (function b() { if (!window.bremse) return; const bis = performance.now() + 40; while (performance.now() < bis); requestAnimationFrame(b); })(); });
    finger = await t.ziehe(seite, 80, 400, 160, 400, { loslassen: false });
    await zurMitte(seite);
    const langsam = await seite.evaluate(messeImBrowser, 600);
    await touch(finger, 'touchEnd', []);
    await seite.evaluate(() => { window.bremse = false; });
    t.pruefe(langsam.bilder < rechts.bilder * 0.6, `Bremse wirkt (${langsam.bilder} statt ${rechts.bilder} Bilder)`);
    t.pruefe(Math.abs(langsam.tempo - tempo) <= tempo * 0.15, `Tempo langsames Gerät ${langsam.tempo.toFixed(0)} Punkte/s`);

    // Tab versteckt, während ein Finger liegt: Eingabe wird zurückgesetzt
    finger = await t.ziehe(seite, 80, 400, 160, 400, { loslassen: false });
    z = await seite.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
      delete document.hidden;
      document.dispatchEvent(new Event('visibilitychange'));
      return { ...window.spiel.eingabe };
    });
    await touch(finger, 'touchEnd', []);
    t.pruefe(!z.aktiv && z.x === 0, 'Tab-Wechsel mit liegendem Finger: Eingabe zurückgesetzt');

    // Maus am PC (Zusatz): Ziehen bewegt, Loslassen stoppt
    await zurMitte(seite);
    await seite.mouse.move(80, 400); await seite.mouse.down(); await seite.mouse.move(160, 400, { steps: 5 });
    const maus = await seite.evaluate(messeImBrowser, 200);
    await seite.mouse.up();
    z = await zustand(seite);
    t.pruefe(maus.dx > 20 && !z.e.aktiv, 'Maus: Ziehen bewegt, Loslassen stoppt');

    // Seite scrollt und zoomt nicht
    const seiteInfo = await seite.evaluate(() => ({
      scroll: scrollX + scrollY + document.scrollingElement.scrollTop, zoom: visualViewport.scale,
      meta: document.querySelector('meta[name=viewport]').content,
      touch: ['body', 'canvas', '#feld-joystick', '#knopf-sprung'].map((s) => getComputedStyle(document.querySelector(s)).touchAction),
      ueberlauf: document.documentElement.scrollHeight <= innerHeight && document.documentElement.scrollWidth <= innerWidth,
    }));
    t.pruefe(seiteInfo.scroll === 0 && seiteInfo.zoom === 1, `nach allen Gesten: kein Scrollen, Zoom ${seiteInfo.zoom}`);
    t.pruefe(seiteInfo.touch.every((w) => w === 'none'), `touch-action: none auf allen berührbaren Flächen (${seiteInfo.touch.join(', ')})`);
    t.pruefe(/user-scalable=no/.test(seiteInfo.meta) && /maximum-scale=1/.test(seiteInfo.meta) && seiteInfo.ueberlauf, 'Zoom gesperrt, nichts ragt über den Bildschirm');

    // Bildschirmfoto mit sichtbarem Joystick
    await zurMitte(seite);
    finger = await t.ziehe(seite, 90, 450, 140, 410, { loslassen: false });
    await seite.waitForTimeout(100);
    await seite.screenshot({ path: process.env.FOTO || '/tmp/stufe-2.png' });
    await touch(finger, 'touchEnd', []);

    // Kaputtes Bild: Ersatz wird gezeichnet, Spiel läuft (Warnung erlaubt)
    await lauf.kontext.route('**/figur.png', (r) => r.fulfill({ status: 200, contentType: 'image/png', body: 'kaputt' }));
    await seite.reload();
    await seite.waitForFunction('window.spiel && window.spiel.bereit');
    await t.ziehe(seite, 80, 400, 160, 400, { halteMs: 200 });
    const ersatz = await seite.evaluate(() => ({ bild: window.spiel.test.bildGeladen, x: window.spiel.spieler.x }));
    t.pruefe(ersatz.bild === false && ersatz.x > B / 2 + 20, 'ohne Bild: Ersatz, Spiel startet und Figur läuft');
    await seite.screenshot({ path: '/tmp/stufe-2-ersatz.png' });
    await lauf.kontext.unroute('**/figur.png');

    // ohne ?test=1 gibt es spiel.test nicht
    await seite.goto(`http://127.0.0.1:${PORT}/index.html?seed=42`);
    await seite.waitForFunction('window.spiel && window.spiel.bereit');
    t.pruefe(await seite.evaluate(() => window.spiel.test === undefined), 'ohne ?test=1 kein spiel.test');
    t.pruefe(lauf.fehler.length === 0, `keine Konsolenfehler ${lauf.fehler.join(' | ')}`);
  } catch (e) { t.pruefe(false, `Ablauf abgebrochen: ${e.message}`); }
  await lauf.ende();
  t.ergebnis();
})();
