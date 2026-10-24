// Start-Test für das Spiel-Gerüst: startet spiel/ im emulierten iPhone 13 und prüft,
// dass die Seite ohne Konsolenfehler lädt, Three.js da ist und die Pixel-Ratio höchstens 2 ist.
// Aufruf aus dem Repo: node tests/spiel/start-test.js
// THREE_LOKAL = Pfad zu einer lokalen three.module.js (falls das CDN gesperrt ist).
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { chromium, devices } = require('playwright');

const ORDNER = path.join(__dirname, '..', '..', 'spiel');
const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
const THREE_LOKAL = process.env.THREE_LOKAL ||
  '/tmp/claude-0/-home-user/9d6f8676-2790-57db-a768-9b3b5fbf6351/scratchpad/three/three.module.js';
const PORT = Number(process.env.PORT || 8766);

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
    await seite.waitForFunction(() => window.spiel && window.spiel.bereit, null, { timeout: 10000 });
    await warte(500);

    const info = await seite.evaluate(() => {
      const c = document.querySelector('canvas');
      return {
        canvas: !!c,
        pixelRatio: c ? c.width / c.clientWidth : 0,
        voll: c ? c.clientWidth === window.innerWidth && c.clientHeight === window.innerHeight : false,
        dpr: window.devicePixelRatio,
      };
    });
    pruefe(info.canvas, 'Bildschirm (Canvas) ist da');
    pruefe(info.voll, 'Bildschirm füllt die Seite');
    pruefe(info.pixelRatio <= 2, `Pixel-Ratio höchstens 2 (ist ${info.pixelRatio.toFixed(2)}, Gerät ${info.dpr})`);

    const bild = await seite.screenshot();
    if (process.env.FOTO) fs.writeFileSync(process.env.FOTO, bild);

    pruefe(konsolenFehler.length === 0, `keine Konsolenfehler${konsolenFehler.length ? ': ' + konsolenFehler.join(' | ') : ''}`);
  } finally {
    await browser.close();
    server.kill();
  }
  console.log(fehler ? `\n${fehler} Prüfung(en) fehlgeschlagen.` : '\nAlle Prüfungen bestanden.');
  process.exit(fehler ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
