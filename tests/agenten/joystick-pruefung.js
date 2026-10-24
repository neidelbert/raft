// Joystick-Prüfung des Debuggers (aus dem Rollentest, Paket T1), läuft gegen prototyp/.
// Aufruf aus dem Repo: node tests/agenten/joystick-pruefung.js
// THREE_LOKAL = Pfad zu einer lokalen three.module.js (falls das CDN gesperrt ist).
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { chromium, devices } = require('playwright');

const ORDNER = path.join(__dirname, 'prototyp');
const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
const THREE_LOKAL = process.env.THREE_LOKAL ||
  '/tmp/claude-0/-home-user/9d6f8676-2790-57db-a768-9b3b5fbf6351/scratchpad/three/three.module.js';
const PORT = Number(process.env.PORT || 8767);

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

    // Zusatz 1: Eingabewerte nach Loslassen beide 0 (diagonal ziehen).
    await touch('touchStart', mx, my);
    await touch('touchMove', mx + 40, my - 40);
    await warte(300);
    const diagEingabe = await seite.evaluate(() => ({ ...window.spiel.eingabe }));
    pruefe(diagEingabe.x > 0.3 && diagEingabe.y > 0.3, `diagonal: Eingabe x ${diagEingabe.x.toFixed(2)}, y ${diagEingabe.y.toFixed(2)}`);
    await touch('touchEnd');
    await warte(100);
    const nachDiag = await seite.evaluate(() => ({ ...window.spiel.eingabe }));
    pruefe(nachDiag.x === 0 && nachDiag.y === 0, `Loslassen setzt x und y auf 0 (x ${nachDiag.x}, y ${nachDiag.y})`);
    const knopfNach = await seite.evaluate(() => document.getElementById('joystick-knopf').style.transform);
    pruefe(/translate\(0px, 0px\)/.test(knopfNach), `Knopf springt zur Mitte zurück (${knopfNach})`);

    // Zusatz 2: Totzone (kleiner Weg) gibt keine Bewegung.
    await touch('touchStart', mx, my);
    await touch('touchMove', mx + 3, my - 3);
    await warte(200);
    const tot = await seite.evaluate(() => ({ ...window.spiel.eingabe }));
    pruefe(tot.x === 0 && tot.y === 0, 'Totzone: kleiner Weg ergibt keine Eingabe');
    await touch('touchEnd');

    // Zusatz 3: zweiter Finger wird ignoriert, Loslassen des zweiten stoppt nicht.
    await touch('touchStart', mx, my);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: mx, y: my - 50, id: 1 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: mx, y: my - 50, id: 1 }, { x: mx + 20, y: my + 20, id: 2 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: mx, y: my - 50, id: 1 }, { x: mx + 50, y: my + 50, id: 2 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: mx, y: my - 50, id: 1 }] }); // Finger 2 hebt ab (fehlt in der Liste)
    await warte(100);
    const zwei = await seite.evaluate(() => ({ ...window.spiel.eingabe }));
    pruefe(zwei.y > 0.8 && Math.abs(zwei.x) < 0.1, `zweiter Finger ignoriert (x ${zwei.x.toFixed(2)}, y ${zwei.y.toFixed(2)})`);
    await touch('touchEnd');
    await warte(100);
    const zweiLos = await seite.evaluate(() => ({ ...window.spiel.eingabe }));
    pruefe(zweiLos.x === 0 && zweiLos.y === 0, 'danach Loslassen stoppt');

    // Zusatz 4: Maus (Pointer) als Zusatz: nach unten ziehen, Floß fährt zum Betrachter (+z), Loslassen stoppt.
    const vorMaus = await lies();
    await seite.mouse.move(mx, my);
    await seite.mouse.down();
    await seite.mouse.move(mx, my + 60, { steps: 4 });
    await warte(600);
    await seite.mouse.up();
    await warte(200);
    const nachMaus = await lies();
    await warte(500);
    const nachMaus2 = await lies();
    pruefe(nachMaus.z - vorMaus.z > 0.5, `Maus nach unten: Floß fährt nach unten (z ${vorMaus.z.toFixed(2)} -> ${nachMaus.z.toFixed(2)})`);
    pruefe(Math.hypot(nachMaus2.x - nachMaus.x, nachMaus2.z - nachMaus.z) < 0.01, 'Maus loslassen stoppt');

    // Zusatz 5: Seite scrollt/zoomt nicht.
    const scroll = await seite.evaluate(() => [window.scrollX, window.scrollY, window.visualViewport ? window.visualViewport.scale : 1]);
    pruefe(scroll[0] === 0 && scroll[1] === 0 && scroll[2] === 1, `kein Scrollen/Zoomen (${scroll.join(', ')})`);

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
