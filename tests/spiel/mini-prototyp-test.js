// Test zu Paket 01 (Mini-Prototyp): Wasser, Würfel-Floß, Joystick, Kamera im Spiel-Gerüst spiel/.
// Läuft im emulierten iPhone 13 mit echten Touch-Ereignissen (CDP) und dauert gut 60 Sekunden.
// Aufruf aus dem Repo: node tests/spiel/mini-prototyp-test.js
// THREE_LOKAL = Pfad zu einer lokalen three.module.js (falls das CDN gesperrt ist), FOTO = Bildschirmfoto speichern.
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { chromium, devices } = require('playwright');

const ORDNER = path.join(__dirname, '..', '..', 'spiel');
const CONFIG = path.join(ORDNER, 'js', 'config');
const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
const THREE_LOKAL = process.env.THREE_LOKAL ||
  '/tmp/claude-0/-home-user/9d6f8676-2790-57db-a768-9b3b5fbf6351/scratchpad/three/three.module.js';
const PORT = Number(process.env.PORT || 8800);
const LAUFZEIT_MS = 60000;

const warte = (ms) => new Promise((r) => setTimeout(r, ms));
let fehler = 0;
function pruefe(bedingung, text) {
  console.log(`${bedingung ? 'OK   ' : 'FEHLER'} ${text}`);
  if (!bedingung) fehler++;
}

// Zahl aus einer Config-Datei lesen (Test nutzt dieselben Werte wie das Spiel).
function configWert(datei, name) {
  const text = fs.readFileSync(path.join(CONFIG, datei), 'utf8');
  const treffer = text.match(new RegExp(`\\b${name}:\\s*([0-9.]+)`));
  return treffer ? Number(treffer[1]) : NaN;
}

// Logik-Dateien dürfen keine Einstellzahlen enthalten (erlaubt: 0, 1, 2, 0.5 und PI-Rechnungen).
function zahlenInLogik() {
  const dateien = ['main.js', 'kern/bildschirm.js', 'kern/kamera.js', 'steuerung/joystick.js',
    'welt/wasser.js', 'floss/floss.js'];
  const funde = [];
  for (const d of dateien) {
    const text = fs.readFileSync(path.join(ORDNER, 'js', d), 'utf8')
      .replace(/\/\/.*$/gm, '').replace(/`[^`]*`/g, '``').replace(/'[^']*'/g, "''");
    for (const z of text.match(/(?<![\w.])\d+(\.\d+)?(?![\w])/g) || []) {
      if (!['0', '1', '2', '0.5'].includes(z)) funde.push(`${d}: ${z}`);
    }
  }
  return funde;
}

(async () => {
  const tempo = configWert('floss.js', 'tempo');
  const zahlen = zahlenInLogik();
  pruefe(zahlen.length === 0, `keine Einstellzahlen in Logik-Dateien${zahlen.length ? ': ' + zahlen.join(', ') : ''}`);

  const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ORDNER, stdio: 'ignore' });
  await warte(800);
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const kontext = await browser.newContext({ ...devices['iPhone 13'], hasTouch: true });
    const seite = await kontext.newPage();
    const konsolenFehler = [];
    seite.on('console', (m) => { if (m.type() === 'error') konsolenFehler.push(m.text()); });
    seite.on('pageerror', (e) => konsolenFehler.push(String(e)));
    if (fs.existsSync(THREE_LOKAL)) {
      await seite.route(THREE_URL, (route) => route.fulfill({
        status: 200, contentType: 'application/javascript', body: fs.readFileSync(THREE_LOKAL, 'utf8'),
      }));
    }
    const startZeit = Date.now();
    await seite.goto(`http://127.0.0.1:${PORT}/index.html`);
    await seite.waitForFunction(() => window.spiel && window.spiel.bereit && window.spiel.floss, null, { timeout: 10000 });
    await warte(800);

    const lies = () => seite.evaluate(() => {
      const s = window.spiel;
      const g = s.floss.gruppe;
      const bild = g.position.clone().project(s.kamera);
      return {
        x: g.position.x, y: g.position.y, z: g.position.z, dreh: g.rotation.y,
        kx: s.kamera.position.x, ky: s.kamera.position.y, kz: s.kamera.position.z,
        bildX: bild.x, zeit: s.zeit, ex: s.eingabe.x, ey: s.eingabe.y,
      };
    });

    // Start, Leistung, Bild.
    const info = await seite.evaluate(() => {
      const s = window.spiel;
      const c = s.renderer.domElement;
      let lichter = 0;
      let schatten = false;
      s.szene.traverse((o) => { if (o.isLight) { lichter++; if (o.castShadow) schatten = true; } });
      return {
        pixelRatio: c.width / c.clientWidth, dpr: window.devicePixelRatio,
        calls: s.renderer.info.render.calls, dreiecke: s.renderer.info.render.triangles,
        lichter, schatten: schatten || s.renderer.shadowMap.enabled,
      };
    });
    pruefe(info.pixelRatio <= 2, `Pixel-Ratio höchstens 2 (ist ${info.pixelRatio.toFixed(2)}, Gerät ${info.dpr})`);
    pruefe(info.calls > 0 && info.calls <= 100, `Zeichenaufrufe pro Bild höchstens 100 (ist ${info.calls})`);
    pruefe(info.dreiecke > 0 && info.dreiecke <= 100000, `Dreiecke pro Bild höchstens 100.000 (ist ${info.dreiecke})`);
    pruefe(info.lichter <= 2, `höchstens 2 Lichter (ist ${info.lichter})`);
    pruefe(!info.schatten, 'keine echten Schatten');

    const bild = await seite.screenshot();
    if (process.env.FOTO) fs.writeFileSync(process.env.FOTO, bild);
    pruefe(bild.length > 5000, `Bildschirmfoto hat Inhalt (${bild.length} Bytes)`);
    const farben = await seite.evaluate(() => {
      // Mitte (Floß) und Rand oben (Wasser) im Bild auslesen.
      const s = window.spiel;
      s.renderer.render(s.szene, s.kamera);
      const gl = s.renderer.getContext();
      const w = gl.drawingBufferWidth;
      const h = gl.drawingBufferHeight;
      const px = (x, y) => { const p = new Uint8Array(4); gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, p); return [...p]; };
      return { mitte: px(w >> 1, h >> 1), wasser: px(w >> 1, Math.round(h * 0.75)) };
    });
    const istWasser = (p) => p[2] > p[0] + 40;
    const istHolz = (p) => p[0] > p[2] + 30;
    pruefe(istHolz(farben.mitte), `Würfel in der Bildmitte sichtbar (Farbe ${farben.mitte.slice(0, 3).join(',')})`);
    pruefe(istWasser(farben.wasser), `Wasserfläche sichtbar (Farbe ${farben.wasser.slice(0, 3).join(',')})`);

    const start = await lies();
    pruefe(Math.abs(start.bildX) * 0.5 <= 0.1, `Würfel beim Start in der Bildmitte (Abweichung ${(Math.abs(start.bildX) * 50).toFixed(1)} % der Breite)`);
    const startAbstand = Math.hypot(start.kx - start.x, start.kz - start.z);
    pruefe(start.ky > start.y, 'Kamera über dem Floß');

    // Joystick-Lage.
    const box = await seite.locator('#joystick').boundingBox();
    const breite = await seite.evaluate(() => window.innerWidth);
    const hoehe = await seite.evaluate(() => window.innerHeight);
    pruefe(box.x + box.width <= breite / 2 && box.y >= hoehe / 2,
      `Joystick links unten (x ${Math.round(box.x)}–${Math.round(box.x + box.width)} von ${breite}, y ab ${Math.round(box.y)} von ${hoehe})`);
    pruefe(box.width >= 48 && box.height >= 48, `Joystick mindestens 48 × 48 Punkte (${box.width} × ${box.height})`);

    // Wippen im Stillstand über 2 Sekunden.
    const hoehen = [];
    for (let i = 0; i < 10; i++) { hoehen.push((await lies()).y); await warte(200); }
    const ausschlag = Math.max(...hoehen) - Math.min(...hoehen);
    pruefe(ausschlag > 0.02, `Floß wippt im Stillstand (Höhe schwankt um ${ausschlag.toFixed(3)} m)`);

    // Touch per CDP.
    const cdp = await kontext.newCDPSession(seite);
    const mx = box.x + box.width / 2;
    const my = box.y + box.height / 2;
    const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', {
      type, touchPoints: (type === 'touchEnd' || type === 'touchCancel') ? [] : [{ x, y, id: 1 }],
    });

    // 1 Sekunde voll nach oben.
    const vorOben = await lies();
    await touch('touchStart', mx, my);
    await touch('touchMove', mx, my - 30);
    await touch('touchMove', mx, my - 80);
    const t0 = Date.now();
    await warte(1000);
    await touch('touchEnd');
    const echteZeit = (Date.now() - t0) / 1000;
    const nachOben = await lies();
    const strecke = vorOben.z - nachOben.z;
    const soll = tempo * echteZeit;
    pruefe(nachOben.z < vorOben.z, `nach oben: Floß fährt vom Bildschirm weg (z ${vorOben.z.toFixed(2)} -> ${nachOben.z.toFixed(2)})`);
    pruefe(Math.abs(strecke - soll) <= soll * 0.25,
      `Strecke ${strecke.toFixed(2)} m in ${echteZeit.toFixed(2)} s (Soll ${soll.toFixed(2)} m ±25 %, Tempo ${tempo} m/s)`);
    pruefe(Math.abs(nachOben.x - vorOben.x) < 0.3, `kaum seitliche Bewegung (x ${nachOben.x.toFixed(2)})`);
    const nachObenEingabe = await lies();
    pruefe(nachObenEingabe.ex === 0 && nachObenEingabe.ey === 0, `Loslassen: eingabe x ${nachObenEingabe.ex}, y ${nachObenEingabe.ey}`);
    await warte(100);
    const stillA = await lies();
    await warte(1000);
    const stillB = await lies();
    pruefe(Math.hypot(stillB.x - stillA.x, stillB.z - stillA.z) <= 0.05,
      `nach Loslassen 1 s Stillstand (${Math.hypot(stillB.x - stillA.x, stillB.z - stillA.z).toFixed(3)} m)`);

    // Kamera folgt: innerhalb von 2 Sekunden wieder gleicher waagerechter Abstand.
    await warte(1000);
    const kam = await lies();
    const abstand = Math.hypot(kam.kx - kam.x, kam.kz - kam.z);
    pruefe(Math.abs(abstand - startAbstand) <= 0.5,
      `Kamera folgt (Abstand ${abstand.toFixed(2)} m, Start ${startAbstand.toFixed(2)} m)`);
    pruefe(kam.ky > kam.y + 1, `Kamera bleibt oberhalb (Kamera-y ${kam.ky.toFixed(2)}, Floß-y ${kam.y.toFixed(2)})`);
    pruefe(kam.kz < start.kz - 1, `Kamera ist mitgefahren (Kamera-z ${start.kz.toFixed(2)} -> ${kam.kz.toFixed(2)})`);

    // Nach rechts, dann pointercancel (touchCancel).
    const vorRechts = await lies();
    await touch('touchStart', mx, my);
    await touch('touchMove', mx + 30, my);
    await touch('touchMove', mx + 80, my);
    await warte(800);
    const rechts = await lies();
    pruefe(rechts.x > vorRechts.x + 0.5, `nach rechts: Floß fährt nach rechts (x ${vorRechts.x.toFixed(2)} -> ${rechts.x.toFixed(2)})`);
    pruefe(rechts.dreh < -1, `Floß dreht sich zur Fahrtrichtung (Drehung ${rechts.dreh.toFixed(2)}, Soll etwa −1,57)`);
    await touch('touchCancel');
    await warte(100);
    const abbruch = await lies();
    pruefe(abbruch.ex === 0 && abbruch.ey === 0, `pointercancel: eingabe x ${abbruch.ex}, y ${abbruch.ey}`);
    const knopf = await seite.evaluate(() => document.getElementById('joystick-knopf').style.transform);
    pruefe(/translate\(0px, 0px\)/.test(knopf), `Knopf zurück in der Mitte (${knopf})`);
    await warte(1000);
    const nachAbbruch = await lies();
    pruefe(Math.hypot(nachAbbruch.x - abbruch.x, nachAbbruch.z - abbruch.z) <= 0.05,
      `nach pointercancel 1 s Stillstand (${Math.hypot(nachAbbruch.x - abbruch.x, nachAbbruch.z - abbruch.z).toFixed(3)} m)`);

    // Maus als Zusatz: nach unten ziehen.
    const vorMaus = await lies();
    await seite.mouse.move(mx, my);
    await seite.mouse.down();
    await seite.mouse.move(mx, my + 60, { steps: 4 });
    await warte(500);
    await seite.mouse.up();
    await warte(100);
    const nachMaus = await lies();
    pruefe(nachMaus.z > vorMaus.z + 0.5 && nachMaus.ex === 0 && nachMaus.ey === 0,
      `Maus nach unten fährt zum Betrachter und stoppt (z ${vorMaus.z.toFixed(2)} -> ${nachMaus.z.toFixed(2)})`);

    const scroll = await seite.evaluate(() => [window.scrollX, window.scrollY, window.visualViewport ? window.visualViewport.scale : 1]);
    pruefe(scroll[0] === 0 && scroll[1] === 0 && scroll[2] === 1, `kein Scrollen/Zoomen (${scroll.join(', ')})`);

    // 60 Sekunden Laufzeit abwarten, dann Leistung und Fehler noch einmal.
    const rest = LAUFZEIT_MS - (Date.now() - startZeit);
    if (rest > 0) await warte(rest);
    const spaet = await seite.evaluate(() => ({
      calls: window.spiel.renderer.info.render.calls,
      geometrien: window.spiel.renderer.info.memory.geometries,
    }));
    pruefe(spaet.calls <= 100, `nach 60 s: Zeichenaufrufe ${spaet.calls}, Geometrien im Speicher ${spaet.geometrien}`);
    pruefe(konsolenFehler.length === 0,
      `keine Konsolenfehler nach ${Math.round((Date.now() - startZeit) / 1000)} s${konsolenFehler.length ? ': ' + konsolenFehler.join(' | ') : ''}`);
  } finally {
    await browser.close();
    server.kill();
  }
  console.log(fehler ? `\n${fehler} Prüfung(en) fehlgeschlagen.` : '\nAlle Prüfungen bestanden.');
  process.exit(fehler ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
