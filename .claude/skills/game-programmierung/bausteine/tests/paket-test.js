// Test für werkzeuge/paket.js (Port 8887 für das Gerüst aus dem entpackten Paket): baut die Pakete in einen
// Temp-Ordner, liest die Zips mit eigenem Leser (unabhängig vom Packer) und prüft Inhalt, Abfall-Filter, Gleichheit
// bei zweimal Bauen, INSTALLIEREN.md. Dann wie ein Neuer: game-programmierung.zip in einen leeren Ordner entpacken,
// nur mit dem entpackten Skill ein 2D-Gerüst anlegen und dessen Test laufen lassen. node paket-test.js
// WERKZEUGE=<ordner> testet eine Kopie (Gegenprobe, siehe gegenprobe.js).
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const { spawnSync } = require('child_process');
const h = require('./hilfe.js');

const WERKZEUGE = process.env.WERKZEUGE ? path.resolve(process.env.WERKZEUGE) : path.resolve(__dirname, '..', '..', 'werkzeuge');
const ZEICHNER = path.resolve(__dirname, '..', '..', '..', 'zeichnen');   // der echte Zeichner-Skill neben diesem Skill
const { bauePakete, sammleDateien } = require(path.join(WERKZEUGE, 'paket.js'));

// Zip lesen über das zentrale Verzeichnis (Deflate oder ungepackt). → { name: Buffer }. Falsche Prüfsummen (CRC-32,
// zlib.crc32 ab Node 20.15/22.2) landen in crcFehler.
const crcFehler = [];
function leseZip(zip) {
  const ende = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  const anzahl = zip.readUInt16LE(ende + 10);
  let pos = zip.readUInt32LE(ende + 16);
  const dateien = {};
  for (let i = 0; i < anzahl; i++) {
    const art = zip.readUInt16LE(pos + 10), crc = zip.readUInt32LE(pos + 16), gepackt = zip.readUInt32LE(pos + 20), nameLaenge = zip.readUInt16LE(pos + 28);
    const extra = zip.readUInt16LE(pos + 30), kommentar = zip.readUInt16LE(pos + 32), lokal = zip.readUInt32LE(pos + 42);
    const name = zip.toString('utf8', pos + 46, pos + 46 + nameLaenge);
    const start = lokal + 30 + zip.readUInt16LE(lokal + 26) + zip.readUInt16LE(lokal + 28);
    const roh = zip.subarray(start, start + gepackt);
    dateien[name] = art === 8 ? zlib.inflateRawSync(roh) : Buffer.from(roh);
    if (typeof zlib.crc32 === 'function' && zlib.crc32(dateien[name]) !== crc) crcFehler.push(name);
    pos += 46 + nameLaenge + extra + kommentar;
  }
  return dateien;
}

function entpacke(dateien, ziel) {
  for (const [name, daten] of Object.entries(dateien)) {
    fs.mkdirSync(path.join(ziel, path.dirname(name)), { recursive: true });
    fs.writeFileSync(path.join(ziel, name), daten);
  }
}

const basis = fs.mkdtempSync(path.join(os.tmpdir(), 'paket-test-'));
try {
  // Abfall-Filter an einem nachgebauten Ordner.
  const probe = path.join(basis, 'probe');
  for (const d of ['SKILL.md', 'grafik/figur.png', 'node_modules/x/index.js', '.git/HEAD', '.DS_Store', 'tests/baustein-joystick.png', 'tests/bildschirmfoto.png', 'a.log', 'alt.js~', 'p.zip', 'werkzeuge/neu.js'])
    { fs.mkdirSync(path.dirname(path.join(probe, d)), { recursive: true }); fs.writeFileSync(path.join(probe, d), 'x'); }
  h.pruefe(JSON.stringify(sammleDateien(probe)) === JSON.stringify(['SKILL.md', 'grafik/figur.png', 'werkzeuge/neu.js']), `Abfall und Bildschirmfotos bleiben draußen: ${sammleDateien(probe).join(', ')}`);

  const dist = path.join(basis, 'dist'), dist2 = path.join(basis, 'dist2');
  bauePakete(dist, { still: true, zeichner: ZEICHNER });
  bauePakete(dist2, { still: true, zeichner: ZEICHNER });
  const skillZip = fs.readFileSync(path.join(dist, 'game-programmierung.zip'));
  h.pruefe(skillZip.equals(fs.readFileSync(path.join(dist2, 'game-programmierung.zip'))), 'zweimal gebaut → byte-gleiches Zip');
  const skill = leseZip(skillZip), namen = Object.keys(skill);
  h.pruefe(namen.length > 50 && namen.every((n) => n.startsWith('game-programmierung/')), `game-programmierung.zip: ein Ordner oben (${namen.length} Dateien)`);
  const pflicht = ['SKILL.md', 'wissen/assets.md', 'wissen/lernbuch.md', 'bausteine/assets.js', 'bausteine/tests/alle.js', 'werkzeuge/neues-spiel.js',
    'werkzeuge/test-hilfe.js', 'werkzeuge/atlas.js', 'werkzeuge/manifest.js', 'werkzeuge/paket.js', 'vorlage/gemeinsam/js/main.js', 'vorlage/3d/js/welt/darstellung.js'];
  const fehlen = pflicht.filter((d) => !skill[`game-programmierung/${d}`]);
  h.pruefe(!fehlen.length, `Paket enthält Handbuch, Wissen, Bausteine, Werkzeuge, Vorlagen ${fehlen.join(', ')}`);
  const original = path.resolve(WERKZEUGE, '..', 'SKILL.md');
  h.pruefe(skill['game-programmierung/SKILL.md'].equals(fs.readFileSync(original)), 'Inhalt unverändert (SKILL.md wie im Ordner)');
  h.pruefe(typeof zlib.crc32 !== 'function' || !crcFehler.length, `Prüfsummen stimmen ${crcFehler.slice(0, 3).join(', ')}`);
  h.pruefe(!namen.some((n) => /node_modules|\.DS_Store|baustein-.*\.png$|\.log$/.test(n)), 'kein Abfall im Paket');

  const zeichnerZip = path.join(dist, 'zeichnen.zip');
  if (fs.existsSync(path.join(ZEICHNER, 'SKILL.md'))) {
    const zeichner = fs.existsSync(zeichnerZip) ? leseZip(fs.readFileSync(zeichnerZip)) : {};
    h.pruefe(['zeichnen/SKILL.md', 'zeichnen/render.js', 'zeichnen/stil.md', 'zeichnen/vorlagen/figur.svg'].every((d) => zeichner[d]), `zeichnen.zip mit Handbuch, render.js und Vorlagen (${Object.keys(zeichner).length} Dateien)`);
    const zHandbuch = zeichner['zeichnen/SKILL.md'] ? zeichner['zeichnen/SKILL.md'].toString('utf8') : '';
    h.pruefe(/render\.js/.test(zHandbuch) && !/werkzeuge\/zeichner\/render\.js/.test(zHandbuch), 'Zeichner-Handbuch verweist auf render.js im eigenen Ordner');
  } else {   // nur dieser Skill installiert: zeichnen.zip muss fehlen, nicht kaputt oder leer da sein
    h.pruefe(!fs.existsSync(zeichnerZip), 'ohne Zeichner-Skill daneben: kein zeichnen.zip');
  }
  const anleitung = fs.existsSync(path.join(dist, 'INSTALLIEREN.md')) ? fs.readFileSync(path.join(dist, 'INSTALLIEREN.md'), 'utf8') : '';
  h.pruefe(/\.claude\/skills\//.test(anleitung) && /Einstellungen → Fähigkeiten/.test(anleitung) && /neues-spiel\.js/.test(anleitung), 'INSTALLIEREN.md: Claude Code, Claude.ai, erster Schritt');
  const unzip = spawnSync('unzip', ['-tq', path.join(dist, 'game-programmierung.zip')], { encoding: 'utf8' });
  if (!unzip.error) h.pruefe(unzip.status === 0, `unzip prüft das Zip ohne Fehler ${unzip.stdout.trim()}`);

  // Wie ein Neuer: nur das entpackte Paket, leerer Ordner, 2D-Gerüst, Test.
  const neu = path.join(basis, 'neuer'), skills = path.join(neu, '.claude', 'skills');
  entpacke(skill, skills);
  const anlegen = spawnSync(process.execPath, [path.join(skills, 'game-programmierung', 'werkzeuge', 'neues-spiel.js'), 'spiele/aus-paket', '--port', '8887'], { cwd: neu, encoding: 'utf8' });
  if (h.pruefe(anlegen.status === 0, `aus dem entpackten Paket: Gerüst angelegt ${anlegen.stderr.trim()}`)) {
    const lauf = spawnSync(process.execPath, ['spiele/aus-paket/tests/aus-paket-test.js'], { cwd: neu, encoding: 'utf8', timeout: 200000, env: { ...process.env, FOTO: path.join(os.tmpdir(), 'baustein-paket-geruest.png') } });
    const zeilen = `${lauf.stdout || ''}${lauf.stderr || ''}`.split('\n');
    for (const z of zeilen.filter((z) => z.startsWith('FEHLER')).slice(0, 5)) console.log(`       ${z}`);
    h.pruefe(lauf.status === 0 && zeilen.includes('Alle Prüfungen bestanden.'), `aus dem entpackten Paket: Test des Gerüsts grün (${zeilen.filter((z) => z.startsWith('OK')).length} Prüfungen)`);
  }
} catch (e) { h.pruefe(false, `Ablauf abgebrochen: ${e.message}`); }
fs.rmSync(basis, { recursive: true, force: true });
h.ergebnis();
