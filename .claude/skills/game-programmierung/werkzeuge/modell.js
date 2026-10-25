// Werkzeug „modell“: macht aus Low-Poly-Modellen, die als JS-Modul beschrieben sind, .glb-Dateien (glTF binär).
// Wofür: Modelle bleiben änderbarer Code (Quelle), ausgeliefert wird eine fertige Datei, die das Spiel mit dem
//   GLTFLoader lädt. Gebaut und exportiert wird im kopflosen Chromium (Playwright) mit Three.js 0.170.0 und dem
//   GLTFExporter, genau wie im Browser. Liegt eine lokale Three.js-Kopie vor (THREE_LOKAL_ORDNER oder
//   <Temp>/three-0.170.0/package, wie bei werkzeuge/test-hilfe.js), wird das CDN dorthin umgeleitet; sonst lädt
//   Chromium Three.js vom CDN.
// Quelle:   <spielordner>/assets/quellen/modelle/<name>.js, ohne eigene Importe:
//   export default function baue(THREE) { const gruppe = new THREE.Group(); …; return gruppe; }
//   Farben als MeshStandardMaterial({ color, flatShading: true }); Maße in Metern. Ohne Texturen (keine Bilddateien).
// Aufruf:   node .claude/skills/game-programmierung/werkzeuge/modell.js <spielordner> [name …]
//   Ohne Namen: alle Modelle im Quellordner. Schreibt <spielordner>/assets/modelle/<name>.glb und meldet die Dreiecke.
//   Danach manifest.js aufrufen.
// Aus Code: const { baueModelle } = require('./modell.js'); await baueModelle(ordner, ['boot']);
const fs = require('fs');
const os = require('os');
const path = require('path');
const { chromium } = require('playwright');

const THREE_VERSION = '0.170.0';
const CDN = `https://cdn.jsdelivr.net/npm/three@${THREE_VERSION}/`;
const ADRESSE = 'http://modell.lokal/';   // nur im Werkzeug-Browser: liefert Dateien aus dem Spielordner

const SEITE = `<!doctype html><html><head><script type="importmap">{ "imports": {
  "three": "${CDN}build/three.module.js", "three/addons/": "${CDN}examples/jsm/" } }</script></head><body></body></html>`;

function lokaleKopie() {
  const ordner = process.env.THREE_LOKAL_ORDNER || path.join(os.tmpdir(), `three-${THREE_VERSION}`, 'package');
  return fs.existsSync(path.join(ordner, 'build', 'three.module.js')) ? ordner : null;
}

const ARTEN = { '.js': 'application/javascript', '.html': 'text/html' };
function liefere(route, datei) {
  if (!fs.existsSync(datei)) return route.fulfill({ status: 404, body: '' });
  return route.fulfill({ status: 200, contentType: ARTEN[path.extname(datei)] || 'application/octet-stream',
    headers: { 'Access-Control-Allow-Origin': '*' }, body: fs.readFileSync(datei) });
}

// Läuft im Browser: Modell bauen, Dreiecke zählen, als .glb exportieren (Base64, damit es zurück zu Node kommt).
async function exportiereImBrowser(name) {
  const THREE = await import('three');
  const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js');
  const baue = (await import(`/assets/quellen/modelle/${name}.js`)).default;
  if (typeof baue !== 'function') throw new Error(`${name}.js exportiert keine Funktion (export default function baue(THREE))`);
  const gruppe = baue(THREE);
  if (!gruppe || !gruppe.isObject3D) throw new Error(`${name}.js gibt keine Three.js-Gruppe zurück`);
  gruppe.updateMatrixWorld(true);
  let dreiecke = 0;
  gruppe.traverse((o) => {
    if (!o.isMesh) return;
    const g = o.geometry;
    dreiecke += (g.index ? g.index.count : g.attributes.position.count) / 3;
  });
  const daten = new Uint8Array(await new GLTFExporter().parseAsync(gruppe, { binary: true }));
  let text = '';
  for (let i = 0; i < daten.length; i += 8192) text += String.fromCharCode(...daten.subarray(i, i + 8192));
  return { base64: btoa(text), dreiecke };
}

async function baueModelle(spielordner, namen = null, { still = false } = {}) {
  const quellen = path.join(spielordner, 'assets', 'quellen', 'modelle');
  const liste = namen && namen.length ? namen : fs.readdirSync(quellen).filter((d) => d.endsWith('.js')).map((d) => d.slice(0, -3));
  const ziel = path.join(spielordner, 'assets', 'modelle');
  fs.mkdirSync(ziel, { recursive: true });
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ergebnis = [];
  try {
    const seite = await browser.newPage();
    const kopie = lokaleKopie();
    if (kopie) await seite.route(`${CDN}**`, (r) => liefere(r, path.join(kopie, r.request().url().slice(CDN.length))));
    await seite.route(`${ADRESSE}**`, (r) => {
      const teil = decodeURIComponent(new URL(r.request().url()).pathname);
      if (teil === '/') return r.fulfill({ status: 200, contentType: 'text/html', body: SEITE });
      return liefere(r, path.join(spielordner, path.normalize(teil)));
    });
    const fehler = [];
    seite.on('pageerror', (e) => fehler.push(e.message));
    await seite.goto(ADRESSE);
    for (const name of liste) {
      if (!fs.existsSync(path.join(quellen, `${name}.js`))) throw new Error(`Quelle fehlt: assets/quellen/modelle/${name}.js`);
      const { base64, dreiecke } = await seite.evaluate(exportiereImBrowser, name);
      const glb = Buffer.from(base64, 'base64');
      if (glb.toString('latin1', 0, 4) !== 'glTF') throw new Error(`${name}: Export ist keine glb-Datei`);
      const datei = path.join(ziel, `${name}.glb`);
      fs.writeFileSync(datei, glb);
      ergebnis.push({ name, datei, dreiecke, bytes: glb.length });
      if (!still) console.log(`Modell ${name}: ${dreiecke} Dreiecke → ${path.relative(spielordner, datei)} (${glb.length} Bytes)`);
    }
    if (fehler.length) throw new Error(fehler.join(' | '));
  } finally {
    await browser.close();
  }
  return ergebnis;
}

if (require.main === module) {
  const [ordner, ...namen] = process.argv.slice(2);
  if (!ordner) { console.error('Aufruf: node modell.js <spielordner> [name …]'); process.exit(1); }
  baueModelle(path.resolve(ordner), namen).catch((e) => { console.error(`Fehler: ${e.message}`); process.exit(1); });
}

module.exports = { baueModelle };
