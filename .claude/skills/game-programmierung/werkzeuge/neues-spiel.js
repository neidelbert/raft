// Werkzeug „neues-spiel“: legt ein startfähiges Spiel-Gerüst an (2D mit Canvas oder 3D mit Three.js 0.170.0).
// Wofür: Jedes neue Spiel beginnt gleich und läuft vom ersten Moment: Ladebildschirm mit Assets aus dem Manifest,
//   Zustände Titel → Spiel → Ende, Joystick, Speicher (Rekord, Ton), Ton-Knopf, Test mit Gegenprobe-Schalter.
//   Die Bausteine werden unverändert nach js/kern/ kopiert, die Test-Hilfe nach tests/. Ein Beispiel-Bild (per Code
//   gemalt, Platzhalter für den Zeichner) läuft durch die Asset-Kette: atlas.js → manifest.js (beides läuft hier mit).
//   Nichts wird überschrieben: Der Zielordner muss neu oder leer sein.
// Aufruf:   node <skill>/werkzeuge/neues-spiel.js <zielordner> [--3d] [--port 9000] [--titel "Mein Spiel"]
//   Der Ordnername ist der Name des Spiels (klein, ohne Umlaute, Bindestrich erlaubt), z. B. spiele/stern-jagd.
//   --port: Port für den eigenen Test. Ohne --port: der erste freie Zehnerblock ab 9000, den kein Spiel daneben (gleicher
//   Elternordner, Zahl hinter „process.env.PORT) ||“ in tests/*-test.js) schon nutzt. Hat das Projekt eine Port-Liste
//   (z. B. TEAM.md), den Port dort eintragen. --titel: Name auf dem Titel.
// Danach:   node <zielordner>/tests/<name>-test.js  → „Alle Prüfungen bestanden.“  Nächste Schritte: <zielordner>/LIESMICH.md
// Vorlagen: <skill>/vorlage/gemeinsam (beide Arten), vorlage/2d, vorlage/3d. Platzhalter: __NAME__, __TITEL__, __PORT__,
//   __ART__, __WERKZEUGE__ (Werkzeug-Ordner relativ zum Spiel). Was gleich bleibt, steht nur in „gemeinsam“.
//   Das Beispiel-Bild steht in grafik/grafik.json mit "platzhalter": true und Fußpunkt ("anker"); render.js des
//   Zeichners löscht es, sobald er eigene Bilder rendert und es keine SVG dafür gibt.
// Aus Code: const { legeSpielAn, naechsterPort } = require('./neues-spiel.js'); legeSpielAn(ordner, { drei: true, port: 9010 });
const fs = require('fs');
const path = require('path');
const { schreibePng, leeresBild } = require('./png.js');
const { baueAtlanten } = require('./atlas.js');
const { schreibeManifest } = require('./manifest.js');

const SKILL = path.resolve(__dirname, '..');
const VORLAGE = path.join(SKILL, 'vorlage');
const TEXT = new Set(['.js', '.html', '.css', '.md', '.json']);
const NAME_MUSTER = /^[a-z][a-z0-9-]*$/;
const PORT_START = 9000, PORT_BLOCK = 10;   // je Spiel ein Zehnerblock ab 9000
const PORT_MUSTER = /process\.env\.PORT\)\s*\|\|\s*(\d+)/g;

// Pixel mit 4 × 4 Unterabtastung: weiche Kanten ohne Malprogramm. form(x, y) → [r, g, b, a] oder null.
function male(breite, hoehe, form) {
  const bild = leeresBild(breite, hoehe), n = 4;
  for (let y = 0; y < hoehe; y++) for (let x = 0; x < breite; x++) {
    const summe = [0, 0, 0, 0];
    for (let sy = 0; sy < n; sy++) for (let sx = 0; sx < n; sx++) {
      const farbe = form(x + (sx + 0.5) / n, y + (sy + 0.5) / n);
      if (!farbe) continue;
      for (let k = 0; k < 3; k++) summe[k] += farbe[k] * farbe[3];
      summe[3] += farbe[3];
    }
    const i = (y * breite + x) * 4;
    if (summe[3] > 0) for (let k = 0; k < 3; k++) bild.daten[i + k] = Math.round(summe[k] / summe[3]);
    bild.daten[i + 3] = Math.round((summe[3] / (n * n)) * 255);
  }
  return bild;
}

// Ports, die Spiele neben ziel schon nutzen (Standard-Port in ihren Tests), → erster freier Zehnerblock ab 9000.
function naechsterPort(ziel) {
  const eltern = path.dirname(path.resolve(ziel)), belegt = [];
  if (fs.existsSync(eltern)) for (const e of fs.readdirSync(eltern, { withFileTypes: true })) {
    const tests = path.join(eltern, e.name, 'tests');
    if (!e.isDirectory() || path.join(eltern, e.name) === path.resolve(ziel) || !fs.existsSync(tests)) continue;
    for (const d of fs.readdirSync(tests).filter((d) => d.endsWith('-test.js')))
      for (const [, zahl] of fs.readFileSync(path.join(tests, d), 'utf8').matchAll(PORT_MUSTER)) belegt.push(Number(zahl));
  }
  let port = PORT_START;
  while (belegt.some((b) => b >= port && b < port + PORT_BLOCK)) port += PORT_BLOCK;
  return port;
}

// 2D-Beispiel: Figur 96 × 128 px (doppelt aufgelöst: 48 × 64 Punkte), Fußpunkt unten Mitte (48, 124).
function maleFigur() {
  const UMRISS = [43, 29, 46, 1], KOERPER = [242, 165, 65, 1], GLANZ = [255, 226, 160, 1], WEISS = [255, 255, 255, 1];
  const inEllipse = (x, y, mx, my, rx, ry) => ((x - mx) / rx) ** 2 + ((y - my) / ry) ** 2 <= 1;
  return male(96, 128, (x, y) => {
    if (inEllipse(x, y, 37, 64, 4.5, 6) || inEllipse(x, y, 59, 64, 4.5, 6)) return UMRISS;   // Augen
    if (inEllipse(x, y, 38.5, 62, 1.6, 1.6) || inEllipse(x, y, 60.5, 62, 1.6, 1.6)) return WEISS;
    if (inEllipse(x, y, 30, 52, 9, 6)) return GLANZ;                                              // Licht von oben links
    if (inEllipse(x, y, 48, 78, 32, 42)) return KOERPER;
    if (inEllipse(x, y, 48, 78, 36, 46)) return UMRISS;                                           // Umriss 4 px
    return null;
  });
}

// 3D-Beispiel: Boden-Kachel 128 × 128 px, nahtlos (nur periodische Muster), undurchsichtig.
function maleKachel() {
  const g = 128, welle = (w, k) => Math.sin((2 * Math.PI * k * w) / g);
  return male(g, g, (x, y) => {
    const hell = 0.08 * welle(x, 3) * welle(y, 2) + 0.06 * welle(x + y, 5) + 0.05 * welle(x - y, 7);
    const halm = ((Math.floor(x) * 7 + Math.floor(y) * 13) % 17 === 0) ? -0.12 : 0;   // dunkle Halme, wiederholt sich je Kachel
    const f = 1 + hell + halm;
    return [Math.min(255, 79 * f), Math.min(255, 143 * f), Math.min(255, 69 * f), 1];
  });
}

function schreibe(datei, inhalt) {
  fs.mkdirSync(path.dirname(datei), { recursive: true });
  fs.writeFileSync(datei, inhalt);
}

function kopiereVorlage(von, nach, ersetzungen, dateien) {
  for (const eintrag of fs.readdirSync(von, { withFileTypes: true })) {
    const quelle = path.join(von, eintrag.name), ziel = path.join(nach, eintrag.name.replace(/__NAME__/g, ersetzungen.__NAME__));
    if (eintrag.isDirectory()) { kopiereVorlage(quelle, ziel, ersetzungen, dateien); continue; }
    let inhalt = fs.readFileSync(quelle);
    if (TEXT.has(path.extname(eintrag.name))) {
      let text = inhalt.toString('utf8');
      for (const [platz, wert] of Object.entries(ersetzungen)) text = text.split(platz).join(wert);
      inhalt = text;
    }
    schreibe(ziel, inhalt);
    dateien.add(ziel);
  }
}

function pruefeEingaben(ziel, name, titel, port) {
  if (fs.existsSync(ziel) && fs.readdirSync(ziel).length) throw new Error(`${ziel} ist nicht leer (nichts wird überschrieben)`);
  if (!NAME_MUSTER.test(name)) throw new Error(`Ordnername „${name}“: klein, ohne Umlaute und Leerzeichen, Bindestrich erlaubt (z. B. stern-jagd)`);
  if (/[<>&"`\n]/.test(titel)) throw new Error('Titel ohne < > & " ` und Zeilenumbruch');
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error(`Port ${port}: ganze Zahl von 1024 bis 65535`);
}

const FUSSPUNKT_FIGUR = [48, 124];   // Pixel im Beispiel-Bild (wie render.js ihn aus data-anker schreibt)

function legeSpielAn(zielordner, { drei = false, port = null, titel = null, still = false } = {}) {
  const ziel = path.resolve(zielordner), name = path.basename(ziel);
  if (port == null) port = naechsterPort(ziel);
  const titelText = titel || name.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
  pruefeEingaben(ziel, name, titelText, port);
  const ersetzungen = {
    __NAME__: name, __TITEL__: titelText, __PORT__: String(port), __ART__: drei ? '3D (Three.js)' : '2D (Canvas)',
    __WERKZEUGE__: path.relative(ziel, __dirname).split(path.sep).join('/') || '.',
  };
  const dateien = new Set();
  kopiereVorlage(path.join(VORLAGE, 'gemeinsam'), ziel, ersetzungen, dateien);
  kopiereVorlage(path.join(VORLAGE, drei ? '3d' : '2d'), ziel, ersetzungen, dateien);

  // Bausteine unverändert (mit Kopfkommentar) nach js/kern/, Test-Hilfe nach tests/.
  for (const d of fs.readdirSync(path.join(SKILL, 'bausteine')).filter((d) => d.endsWith('.js'))) {
    schreibe(path.join(ziel, 'js', 'kern', d), fs.readFileSync(path.join(SKILL, 'bausteine', d)));
    dateien.add(path.join(ziel, 'js', 'kern', d));
  }
  schreibe(path.join(ziel, 'tests', 'test-hilfe.js'), fs.readFileSync(path.join(__dirname, 'test-hilfe.js')));

  // Beispiel-Bild wie vom Zeichner: PNG + grafik.json, dann durch die Asset-Kette.
  const [gruppeName, bild] = drei ? ['boden/kachel', maleKachel()] : ['figuren/figur', maleFigur()];
  schreibe(path.join(ziel, 'grafik', `${gruppeName}.png`), schreibePng(bild));
  const eintrag = { name: gruppeName, datei: `grafik/${gruppeName}.png`, breite: bild.breite, hoehe: bild.hoehe, ...(drei ? {} : { anker: FUSSPUNKT_FIGUR }), platzhalter: true };
  schreibe(path.join(ziel, 'grafik', 'grafik.json'), `${JSON.stringify([eintrag], null, 1)}\n`);
  baueAtlanten(ziel, { still: true });
  const { manifest, ueber } = schreibeManifest(ziel, { still: true });
  if (ueber.length) throw new Error(`Gerüst über dem Budget: ${ueber.join(', ')}`);

  const rest = [...dateien].filter((d) => TEXT.has(path.extname(d)) && /__[A-Z]+__/.test(fs.readFileSync(d, 'utf8')));
  if (rest.length) throw new Error(`Platzhalter nicht ersetzt in: ${rest.map((d) => path.relative(ziel, d)).join(', ')}`);

  if (!still) {
    console.log(`Gerüst „${name}“ (${ersetzungen.__ART__}) angelegt in ${ziel}`);
    console.log(`  Assets: Version ${manifest.version}, Startpaket ${manifest.budget.startpaketBytes} Bytes`);
    console.log(`  Test:   node ${path.relative(process.cwd(), path.join(ziel, 'tests', `${name}-test.js`)) || '.'}   (Port ${port}, Block ${port}–${port + PORT_BLOCK - 1}: in die Port-Liste des Projekts eintragen, falls es eine gibt)`);
    console.log(`  Weiter: ${path.relative(process.cwd(), path.join(ziel, 'LIESMICH.md'))}`);
  }
  return { name, ziel, manifest, port };
}

function leseArgumente(argv) {
  const werte = { drei: false, port: null, titel: null, ordner: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--3d') werte.drei = true;
    else if (a === '--port') werte.port = Number(argv[++i]);
    else if (a === '--titel') werte.titel = argv[++i] || '';
    else if (a.startsWith('--')) throw new Error(`unbekannte Option ${a}`);
    else if (!werte.ordner) werte.ordner = a;
    else throw new Error(`zu viele Ordner: ${a}`);
  }
  if (!werte.ordner) throw new Error('Aufruf: node neues-spiel.js <zielordner> [--3d] [--port 9000] [--titel "Mein Spiel"]');
  return werte;
}

if (require.main === module) {
  try {
    const { ordner, ...optionen } = leseArgumente(process.argv.slice(2));
    legeSpielAn(ordner, optionen);
  } catch (e) { console.error(`Fehler: ${e.message}`); process.exit(1); }
}

module.exports = { legeSpielAn, naechsterPort, maleFigur, maleKachel };
