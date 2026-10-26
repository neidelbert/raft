// Werkzeug „manifest“: schreibt assets/assets.json (Liste aller Assets mit Version und Größen) und meldet das Budget.
// Wofür: Das Spiel lädt nur, was im Manifest steht (bausteine/assets.js). Die Version ist ein Fingerabdruck aller
//   Dateien: Ändert sich ein Asset, ändert sie sich von selbst. Sie hängt als ?v=<version> an jeder Adresse, damit
//   Safari keine alte Datei aus dem Zwischenspeicher nimmt. Man kann das Hochzählen also nicht vergessen.
//   Budget: Bytes des Startpakets (alles außer „spaeter“) und ausgepackter Bildspeicher (Breite × Höhe × 4 aller
//   Bilder und Atlanten). Grenze überschritten → Meldung „ÜBER DEM BUDGET“ und Rückgabewert 1 (assets.json wird
//   trotzdem geschrieben, damit man weiterarbeiten kann).
// Aufruf:   node <skill>/werkzeuge/manifest.js <spielordner>
//   Reihenfolge: atlas.js → sounds.js → modell.js → manifest.js.
// Liest:    <spielordner>/assets/ (atlas/*.json + .png, bilder/*, sounds/*, schriften/*.woff2, modelle/*.glb) und die
//   Vorgaben <spielordner>/assets/quellen/manifest.json (alles freiwillig):
//   { "budget": { "startpaketBytes": 2000000, "bildspeicherBytes": 60000000 },
//     "bilder": { "wiese": { "ersatz": "#6bbf4a" } },        Ersatzfarbe, wenn das Bild fehlt (Standard grau)
//     "sounds": { "explosion": { "laut": 0.8 } },            Lautstärke 0 … 1 (Standard 1)
//     "schriften": { "titel": { "name": "Titel" } },          Name für CSS/Canvas (Standard: Dateiname)
//     "spaeter": ["musik"] }                                  erst nach dem Start laden (zählt nicht zum Startpaket)
// Schreibt: <spielordner>/assets/assets.json (Format wie in wissen/assets.md, dazu bytes, breite, hoehe, budget).
// Aus Code: const { schreibeManifest } = require('./manifest.js'); const { manifest, ueber } = schreibeManifest(ordner);
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const STANDARD_BUDGET = { startpaketBytes: 2000000, bildspeicherBytes: 60000000 };   // wissen/assets.md
const SOUND_REIHENFOLGE = ['.m4a', '.mp3'];   // AAC zuerst (Safari, klein), MP3 als Ersatz

// Breite und Höhe aus dem Dateikopf (PNG, WebP, JPEG), ohne das Bild auszupacken.
function bildMasse(buffer) {
  if (buffer.toString('latin1', 1, 4) === 'PNG') return { breite: buffer.readUInt32BE(16), hoehe: buffer.readUInt32BE(20) };
  if (buffer.toString('latin1', 0, 4) === 'RIFF' && buffer.toString('latin1', 8, 12) === 'WEBP') {
    const art = buffer.toString('latin1', 12, 16);
    if (art === 'VP8X') return { breite: 1 + buffer.readUIntLE(24, 3), hoehe: 1 + buffer.readUIntLE(27, 3) };
    if (art === 'VP8L') { const b = buffer.readUInt32LE(21); return { breite: 1 + (b & 0x3fff), hoehe: 1 + ((b >> 14) & 0x3fff) }; }
    return { breite: buffer.readUInt16LE(26) & 0x3fff, hoehe: buffer.readUInt16LE(28) & 0x3fff };
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    for (let i = 2; i < buffer.length - 9;) {
      const marke = buffer[i + 1], laenge = buffer.readUInt16BE(i + 2);
      if (marke >= 0xc0 && marke <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marke)) return { breite: buffer.readUInt16BE(i + 7), hoehe: buffer.readUInt16BE(i + 5) };
      i += 2 + laenge;
    }
  }
  throw new Error('Bildformat unbekannt (PNG, WebP oder JPEG erwartet)');
}

const dateienIn = (ordner, endungen) => (fs.existsSync(ordner)
  ? fs.readdirSync(ordner).filter((d) => endungen.includes(path.extname(d).toLowerCase())).sort() : []);
const ohneEndung = (d) => path.basename(d, path.extname(d));

function erstelleManifest(spielordner) {
  const assets = path.join(spielordner, 'assets');
  const vorgabeDatei = path.join(assets, 'quellen', 'manifest.json');
  const vorgabe = fs.existsSync(vorgabeDatei) ? JSON.parse(fs.readFileSync(vorgabeDatei, 'utf8')) : {};
  const groesse = (teil) => fs.statSync(path.join(assets, teil)).size;
  const fingerabdruck = crypto.createHash('sha256');
  const merke = (teil) => { fingerabdruck.update(teil); fingerabdruck.update(fs.readFileSync(path.join(assets, teil))); };

  const atlanten = dateienIn(path.join(assets, 'atlas'), ['.json']).map((d) => {
    const daten = JSON.parse(fs.readFileSync(path.join(assets, 'atlas', d), 'utf8'));
    const bild = `atlas/${daten.bild}`, json = `atlas/${d}`;
    merke(json); merke(bild);
    // Maße und Fußpunkt jedes Rahmens und die Animationen stehen auch hier: Fehlt der Atlas im Spiel, zeichnet es für
    // jeden Rahmen einen Ersatz in derselben Größe (bausteine/assets.js → ersatz(bekannt)), auch für Gegner und Effekte.
    const rahmen = {};
    for (const [n, r] of Object.entries(daten.rahmen || {})) rahmen[n] = { b: r.b, h: r.h, ankerX: r.ankerX, ankerY: r.ankerY };
    return { name: ohneEndung(d), bild, daten: json, bytes: groesse(bild) + groesse(json), breite: daten.breite, hoehe: daten.hoehe,
      rahmen, animationen: daten.animationen || {} };
  });
  const bilder = dateienIn(path.join(assets, 'bilder'), ['.png', '.webp', '.jpg', '.jpeg']).map((d) => {
    const datei = `bilder/${d}`, name = ohneEndung(d);
    merke(datei);
    return { name, datei, ersatz: vorgabe.bilder?.[name]?.ersatz || '#808080', bytes: groesse(datei), ...bildMasse(fs.readFileSync(path.join(assets, datei))) };
  });
  const soundGruppen = {};
  for (const d of dateienIn(path.join(assets, 'sounds'), SOUND_REIHENFOLGE)) (soundGruppen[ohneEndung(d)] ||= []).push(`sounds/${d}`);
  const sounds = Object.entries(soundGruppen).map(([name, dateien]) => {
    dateien.sort((a, b) => SOUND_REIHENFOLGE.indexOf(path.extname(a)) - SOUND_REIHENFOLGE.indexOf(path.extname(b)));
    dateien.forEach(merke);
    // Geladen wird nur ein Format; für das Budget zählt das größere (sicher für beide Browser).
    return { name, dateien, laut: vorgabe.sounds?.[name]?.laut ?? 1, bytes: Math.max(...dateien.map(groesse)) };
  });
  const schriften = dateienIn(path.join(assets, 'schriften'), ['.woff2', '.woff', '.ttf']).map((d) => {
    const datei = `schriften/${d}`;
    merke(datei);
    return { name: vorgabe.schriften?.[ohneEndung(d)]?.name || ohneEndung(d), datei, bytes: groesse(datei) };
  });
  const modelle = dateienIn(path.join(assets, 'modelle'), ['.glb']).map((d) => {
    const datei = `modelle/${d}`;
    merke(datei);
    return { name: ohneEndung(d), datei, bytes: groesse(datei) };
  });
  const spaeter = vorgabe.spaeter || [];
  fingerabdruck.update(JSON.stringify({ bilder: vorgabe.bilder, sounds: vorgabe.sounds, schriften: vorgabe.schriften, spaeter }));

  const alle = [...atlanten, ...bilder, ...sounds, ...schriften, ...modelle];
  const startpaketBytes = alle.filter((e) => !spaeter.includes(e.name)).reduce((s, e) => s + e.bytes, 0);
  const bildspeicherBytes = [...atlanten, ...bilder].reduce((s, e) => s + e.breite * e.hoehe * 4, 0);
  return {
    version: fingerabdruck.digest('hex').slice(0, 10),
    atlanten, bilder, sounds, schriften, modelle, spaeter,
    budget: { startpaketBytes, bildspeicherBytes, grenzen: { ...STANDARD_BUDGET, ...vorgabe.budget } },
  };
}

const mb = (bytes) => `${(bytes / 1e6).toFixed(2).replace('.', ',')} MB`;

function schreibeManifest(spielordner, { still = false } = {}) {
  const manifest = erstelleManifest(spielordner);
  fs.writeFileSync(path.join(spielordner, 'assets', 'assets.json'), `${JSON.stringify(manifest, null, 1)}\n`);
  const { startpaketBytes, bildspeicherBytes, grenzen } = manifest.budget;
  const ueber = [];
  if (startpaketBytes > grenzen.startpaketBytes) ueber.push('Startpaket');
  if (bildspeicherBytes > grenzen.bildspeicherBytes) ueber.push('Bildspeicher');
  if (!still) {
    const anzahl = ['atlanten', 'bilder', 'sounds', 'schriften', 'modelle'].map((a) => `${manifest[a].length} ${a}`).join(', ');
    console.log(`assets/assets.json geschrieben: Version ${manifest.version}, ${anzahl}`);
    console.log(`Budget Startpaket:  ${mb(startpaketBytes)} von ${mb(grenzen.startpaketBytes)}${ueber.includes('Startpaket') ? '  ÜBER DEM BUDGET' : ''}`);
    console.log(`Budget Bildspeicher (ausgepackt): ${mb(bildspeicherBytes)} von ${mb(grenzen.bildspeicherBytes)}${ueber.includes('Bildspeicher') ? '  ÜBER DEM BUDGET' : ''}`);
  }
  return { manifest, ueber };
}

if (require.main === module) {
  const ordner = process.argv[2];
  if (!ordner) { console.error('Aufruf: node manifest.js <spielordner>'); process.exit(1); }
  try {
    const { ueber } = schreibeManifest(path.resolve(ordner));
    process.exit(ueber.length ? 1 : 0);
  } catch (e) { console.error(`Fehler: ${e.message}`); process.exit(1); }
}

module.exports = { schreibeManifest, erstelleManifest, bildMasse };
