// Test für Paket T1: startet den Prototyp im emulierten iPhone und prüft den Joystick.
// Aufruf aus dem Repo: node tests/agenten/prototyp-test.js
// THREE_LOKAL = Pfad zu einer lokalen three.module.js (falls das CDN gesperrt ist).
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { chromium, devices } = require('playwright');

const ORDNER = path.join(__dirname, 'prototyp');
const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
const THREE_LOKAL = process.env.THREE_LOKAL ||
  '/tmp/claude-0/-home-user/9d6f8676-2790-57db-a768-9b3b5fbf6351/scratchpad/three/three.module.js';
const PORT = Number(process.env.PORT || 8765);

const warte = (ms) => new Promise((r) => setTimeout(r, ms));
let fehler = 0;
function pruefe(bedingung, text) {
  console.log(`${bedingung ? 'OK   ' : 'FEHLER'} ${text}`);
  if (!bedingung) fehler++;
}

(async () => {
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
    await seite.goto(`http://127.0.0.1:${PORT}/index.html`);
    await seite.waitForFunction(() => window.spiel && window.spiel.floss, null, { timeout: 10000 });
    await warte(500);

    const pixelRatio = await seite.evaluate(() => {
      const c = document.querySelector('canvas');
      return c.width / c.clientWidth;
    });
    pruefe(pixelRatio <= 2, `Pixel-Ratio höchstens 2 (ist ${pixelRatio.toFixed(2)})`);

    const lies = () => seite.evaluate(() => ({
      x: window.spiel.floss.position.x, z: window.spiel.floss.position.z,
      kx: window.spiel.kamera.position.x, kz: window.spiel.kamera.position.z,
    }));
    const start = await lies();

    // Echte Touch-Ereignisse über CDP: am Joystick aufsetzen, nach oben ziehen, halten.
    const cdp = await kontext.newCDPSession(seite);
    const box = await seite.locator('#joystick').boundingBox();
    const mx = box.x + box.width / 2;
    const my = box.y + box.height / 2;
    const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', {
      type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }],
    });
    await touch('touchStart', mx, my);
    for (let i = 1; i <= 5; i++) { await touch('touchMove', mx, my - i * 12); await warte(30); }
    await warte(1500);
    const gezogen = await lies();
    pruefe(start.z - gezogen.z > 1, `Ziehen nach oben: Floß fährt nach oben/weg (z ${start.z.toFixed(2)} -> ${gezogen.z.toFixed(2)})`);
    pruefe(Math.abs(gezogen.x - start.x) < 0.3, `kaum seitliche Bewegung (x ${gezogen.x.toFixed(2)})`);
    pruefe(start.kz - gezogen.kz > 0.5, `Kamera folgt (Kamera-z ${start.kz.toFixed(2)} -> ${gezogen.kz.toFixed(2)})`);

    await touch('touchEnd');
    await warte(200);
    const losgelassen = await lies();
    await warte(800);
    const spaeter = await lies();
    pruefe(Math.hypot(spaeter.x - losgelassen.x, spaeter.z - losgelassen.z) < 0.01, 'Loslassen stoppt das Floß');

    // Rechts ziehen als Gegenprobe.
    await touch('touchStart', mx, my);
    await touch('touchMove', mx + 60, my);
    await warte(800);
    await touch('touchEnd');
    const rechts = await lies();
    pruefe(rechts.x - spaeter.x > 0.5, `Ziehen nach rechts: Floß fährt nach rechts (x ${spaeter.x.toFixed(2)} -> ${rechts.x.toFixed(2)})`);

    // Bild wird gezeichnet (nicht leer/einfarbig).
    const bild = await seite.screenshot();
    pruefe(bild.length > 5000, `Bildschirmfoto hat Inhalt (${bild.length} Bytes)`);
    if (process.env.FOTO) fs.writeFileSync(process.env.FOTO, bild);

    pruefe(konsolenFehler.length === 0, `keine Konsolenfehler${konsolenFehler.length ? ': ' + konsolenFehler.join(' | ') : ''}`);
  } finally {
    await browser.close();
    server.kill();
  }
  console.log(fehler ? `\n${fehler} Prüfung(en) fehlgeschlagen.` : '\nAlle Prüfungen bestanden.');
  process.exit(fehler ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
