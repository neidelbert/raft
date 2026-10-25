// Gemeinsame Hilfen für alle Spieltests (Playwright, iPhone-Ansicht).
// Nutzung:
//   const t = require("../../werkzeuge/test-hilfe.js");
//   const lauf = await t.starte({ ordner: "spiele/sterne", port: 8810 });
//   t.pruefe(bedingung, "Text");  ...  await lauf.ende();  t.ergebnis();
const { chromium, devices } = require("playwright");
const { spawn, execSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const http = require("http");

const REPO = path.resolve(__dirname, "..");
const THREE_VERSION = "0.170.0";
const CDN = /https:\/\/cdn\.jsdelivr\.net\/npm\/three@([\d.]+)\/(.*)$/;

let fehlerZahl = 0;
function pruefe(bedingung, text) {
  console.log(`${bedingung ? "OK   " : "FEHLER"} ${text}`);
  if (!bedingung) fehlerZahl++;
  return Boolean(bedingung);
}
function ergebnis() {
  console.log(fehlerZahl ? `\n${fehlerZahl} Prüfung(en) fehlgeschlagen.` : "\nAlle Prüfungen bestanden.");
  process.exit(fehlerZahl ? 1 : 0);
}

// Three.js lokal bereitstellen (CDN ist in der Cloud gesperrt). Einmal per npm holen, dann zwischengespeichert.
function threeOrdner() {
  if (process.env.THREE_LOKAL_ORDNER) return process.env.THREE_LOKAL_ORDNER;
  const ziel = path.join(os.tmpdir(), `three-${THREE_VERSION}`);
  if (!fs.existsSync(path.join(ziel, "package", "build", "three.module.js"))) {
    fs.mkdirSync(ziel, { recursive: true });
    execSync(`npm pack three@${THREE_VERSION} --silent`, { cwd: ziel, stdio: "ignore" });
    execSync(`tar xzf three-${THREE_VERSION}.tgz`, { cwd: ziel });
  }
  return path.join(ziel, "package");
}

function warteAufServer(port) {
  return new Promise((fertig, abbruch) => {
    const bis = Date.now() + 5000;
    (function versuch() {
      http.get(`http://127.0.0.1:${port}/`, (a) => { a.resume(); fertig(); })
        .on("error", () => (Date.now() > bis ? abbruch(new Error(`Server auf Port ${port} startet nicht`)) : setTimeout(versuch, 100)));
    })();
  });
}

// Startet Server und Browser, öffnet die Seite. Gibt { seite, kontext, fehler, ende } zurück.
// initSkript: Code, der vor dem Spiel läuft (z. B. localStorage sperren wie im privaten Modus).
async function starte({ ordner, port, pfad = "index.html", geraet = "iPhone 13", warteAuf = "window.spiel && window.spiel.bereit", initSkript = null }) {
  const wurzel = path.resolve(REPO, ordner);
  const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], { cwd: wurzel, stdio: "ignore" });
  await warteAufServer(port);
  const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const kontext = await browser.newContext({ ...devices[geraet] });
  await kontext.route(CDN, async (route) => {
    const [, , datei] = route.request().url().match(CDN);
    const lokal = path.join(threeOrdner(), datei);
    if (!fs.existsSync(lokal)) return route.fulfill({ status: 404, body: "" });
    route.fulfill({ status: 200, contentType: "application/javascript", body: fs.readFileSync(lokal) });
  });
  if (initSkript) await kontext.addInitScript(initSkript);
  const seite = await kontext.newPage();
  const fehler = [];
  seite.on("console", (m) => m.type() === "error" && fehler.push(m.text()));
  seite.on("pageerror", (e) => fehler.push(e.message));
  await seite.goto(`http://127.0.0.1:${port}/${pfad}`);
  if (warteAuf) await seite.waitForFunction(warteAuf, null, { timeout: 15000 });
  async function ende() {
    await browser.close();
    server.kill();
  }
  return { seite, kontext, fehler, ende };
}

// Echter Touch: Finger an (x1,y1) aufsetzen, in Schritten nach (x2,y2) ziehen, optional halten, loslassen.
async function ziehe(seite, x1, y1, x2, y2, { schritte = 8, halteMs = 0, loslassen = true } = {}) {
  const cdp = await seite.context().newCDPSession(seite);
  const punkt = (x, y) => [{ x, y, id: 1, radiusX: 5, radiusY: 5, force: 1 }];
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: punkt(x1, y1) });
  for (let i = 1; i <= schritte; i++) {
    const x = x1 + ((x2 - x1) * i) / schritte, y = y1 + ((y2 - y1) * i) / schritte;
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: punkt(x, y) });
    await seite.waitForTimeout(16);
  }
  if (halteMs) await seite.waitForTimeout(halteMs);
  if (loslassen) await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  return cdp;
}

// Kurz tippen an (x,y).
async function tippe(seite, x, y) {
  await seite.touchscreen.tap(x, y);
}

// Misst die Bildrate im Browser über eine Zeitspanne (nur als grober Wert, Software-Grafik ist langsamer als ein iPhone).
async function bildrate(seite, ms = 2000) {
  return seite.evaluate((dauer) => new Promise((fertig) => {
    let bilder = 0; const start = performance.now();
    (function zaehle() { bilder++; performance.now() - start < dauer ? requestAnimationFrame(zaehle) : fertig((bilder * 1000) / dauer); })();
  }), ms);
}

module.exports = { pruefe, ergebnis, starte, ziehe, tippe, bildrate, REPO };
