// Test-Hilfe für Spieltests (Playwright, iPhone-Ansicht): Server, Browser, Touch, Konsolenfehler, Three.js lokal.
// Kopie von werkzeuge/test-hilfe.js aus dem Team-Repo (neidelbert/raft), damit der Skill ohne das Repo läuft.
// Einziger Unterschied: `ordner` ist ein absoluter Pfad oder relativ zum aktuellen Ordner (nicht zum Repo).
// neues-spiel.js legt diese Datei in jedes Gerüst (<spiel>/tests/test-hilfe.js). Braucht: Node, Playwright mit
// Chromium (require('playwright')), python3 (Testserver), für 3D einmal npm (holt Three.js 0.170.0 in den Temp-Ordner).
// Nutzung:
//   const t = require("./test-hilfe.js");
//   const lauf = await t.starte({ ordner: path.resolve(__dirname, ".."), port: 9000 });
//   t.pruefe(bedingung, "Text");  ...  await lauf.ende();  t.ergebnis();
//   Touch: t.ziehe(seite, x1, y1, x2, y2, { halteMs }), t.tippe(seite, x, y), t.laufeZu(seite, ziel, { position, tempo })
const { chromium, devices } = require("playwright");
const { spawn, execSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const http = require("http");

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
// routen: async (kontext) => { await kontext.route(…) } – Netz-Anfragen umleiten, verzögern oder sperren.
async function starte({ ordner, port, pfad = "index.html", geraet = "iPhone 13", warteAuf = "window.spiel && window.spiel.bereit", initSkript = null, routen = null }) {
  const wurzel = path.resolve(ordner);   // absolut oder relativ zum aktuellen Ordner
  // Ein noch laufender alter Server würde sonst einen fremden Ordner ausliefern (falsches Testergebnis).
  if (await portBelegt(port)) throw new Error(`Port ${port} ist belegt (alter Testserver?). Beenden mit: pkill -f "http.server ${port}"`);
  const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], { cwd: wurzel, stdio: "ignore" });
  let browser = null;
  try {
    await warteAufServer(port);
    browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
    return await oeffne({ browser, server, port, pfad, geraet, warteAuf, initSkript, routen });
  } catch (e) {
    if (browser) await browser.close();
    server.kill();   // auch bei Fehlern aufräumen, sonst bleibt der Port belegt
    throw e;
  }
}

function portBelegt(port) {
  return new Promise((fertig) => {
    http.get(`http://127.0.0.1:${port}/`, (a) => { a.resume(); fertig(true); }).on("error", () => fertig(false));
  });
}

async function oeffne({ browser, server, port, pfad, geraet, warteAuf, initSkript, routen }) {
  const kontext = await browser.newContext({ ...devices[geraet] });
  await kontext.route(CDN, async (route) => {
    const [, , datei] = route.request().url().match(CDN);
    const lokal = path.join(threeOrdner(), datei);
    if (!fs.existsSync(lokal)) return route.fulfill({ status: 404, body: "" });
    route.fulfill({ status: 200, contentType: "application/javascript", body: fs.readFileSync(lokal) });
  });
  if (initSkript) await kontext.addInitScript(initSkript);
  if (routen) await routen(kontext);   // z. B. eine Datei hängen lassen oder verbieten, bevor die Seite lädt
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

// Figur per echtem Joystick-Ziehen zu einem Ziel laufen lassen: Finger aufsetzen, in Zielrichtung ausschlagen,
// in der Seite Bild für Bild warten, bis die Figur da ist (oder vorbei), loslassen, nachmessen, wiederholen
// (höchstens `anlaeufe` Mal). Ziehen nach rechts/unten bewegt nach +x/+y (2D und 3D gleich). Nicht nach Zeit halten:
// Bei langsamer Test-Grafik (3D etwa 9 Bilder/s) stimmt keine vorausberechnete Haltezeit.
//   position: Funktion für seite.evaluate → { x, y } (z. B. () => window.spiel.spieler), ohne Bezug auf Node-Variablen
//   ziel: { x, y }; tempo: Einheiten pro Sekunde bei vollem Ausschlag (aus config): nah am Ziel nur ein Drittel Ausschlag
//   joystick: [x, y] Aufsetzpunkt in Punkten (Standard: links unten, im Joystick-Feld); ausschlag: Ziehweg in Punkten
//   naehe: angekommen, wenn der Abstand höchstens so groß ist; halteMax: ms höchstens je Anlauf
// → { angekommen, abstand, anlaeufe, x, y }. Achtung: Unterwegs kann die Figur mehr berühren als das Ziel; der Test
// prüft dann „mindestens“, nicht „genau“ (wissen/testen.md).
async function laufeZu(seite, ziel, { position, tempo, joystick = null, ausschlag = 60, naehe = 8, anlaeufe = 12, halteMax = 4000 }) {
  const start = joystick || await seite.evaluate(() => [innerWidth * 0.2, innerHeight * 0.75]);
  const quelle = position.toString();
  let p = await seite.evaluate(position), versuche = 0;
  let abstand = Math.sqrt((ziel.x - p.x) ** 2 + (ziel.y - p.y) ** 2);
  while (abstand > naehe && versuche < anlaeufe) {
    versuche++;
    const rx = (ziel.x - p.x) / abstand, ry = (ziel.y - p.y) / abstand;
    const weg = abstand > tempo * 0.3 ? ausschlag : ausschlag / 3;
    const cdp = await ziehe(seite, start[0], start[1], start[0] + rx * weg, start[1] + ry * weg, { schritte: 1, loslassen: false });
    await seite.evaluate(({ quelle, ziel, rx, ry, rest, halteMax }) => new Promise((fertig) => {
      const lies = (0, eval)(`(${quelle})`), bis = performance.now() + halteMax;
      (function schau() {
        const q = lies();
        const vor = (ziel.x - q.x) * rx + (ziel.y - q.y) * ry;   // Rest des Wegs in Zielrichtung
        vor <= rest || performance.now() > bis ? fertig() : requestAnimationFrame(schau);
      })();
    }), { quelle, ziel, rx, ry, rest: naehe / 2, halteMax });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await seite.waitForTimeout(50);   // Loslassen ankommen lassen
    p = await seite.evaluate(position);
    abstand = Math.sqrt((ziel.x - p.x) ** 2 + (ziel.y - p.y) ** 2);
  }
  return { angekommen: abstand <= naehe, abstand, anlaeufe: versuche, x: p.x, y: p.y };
}

// Misst die Bildrate im Browser über eine Zeitspanne (nur als grober Wert, Software-Grafik ist langsamer als ein iPhone).
async function bildrate(seite, ms = 2000) {
  return seite.evaluate((dauer) => new Promise((fertig) => {
    let bilder = 0; const start = performance.now();
    (function zaehle() { bilder++; performance.now() - start < dauer ? requestAnimationFrame(zaehle) : fertig((bilder * 1000) / dauer); })();
  }), ms);
}

module.exports = { pruefe, ergebnis, starte, ziehe, tippe, laufeZu, bildrate };
