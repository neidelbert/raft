// Test für das Gerüst-Werkzeug werkzeuge/neues-spiel.js: legt in einem leeren Temp-Ordner ein 2D- und ein 3D-Gerüst
// an und lässt deren eigenen Test laufen (Port 8888, nacheinander). Prüft dazu: alle Dateien aus dem Auftrag da,
// Bausteine und Test-Hilfe unverändert kopiert, keine Platzhalter übrig, Werkzeug-Pfad in LIESMICH.md stimmt,
// nichts wird überschrieben, falsche Namen werden abgelehnt, Port ohne --port = nächster freier Zehnerblock ab 9000,
// Beispiel-Bild als Platzhalter mit Fußpunkt markiert, Sound-Datei der Vorlage passt zum Rezept. node geruest-test.js
// WERKZEUGE=<ordner> testet eine Kopie (Gegenprobe, siehe gegenprobe.js); GERUEST_ARTEN=2d nur eine Art.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const h = require('./hilfe.js');

const WERKZEUGE = process.env.WERKZEUGE ? path.resolve(process.env.WERKZEUGE) : path.resolve(__dirname, '..', '..', 'werkzeuge');
const ARTEN = (process.env.GERUEST_ARTEN || '2d,3d').split(',');
const PORT = 8888;
const DATEIEN = ['index.html', 'stil.css', 'js/main.js', 'js/config/spiel.js', 'js/config/steuerung.js', 'js/config/welt.js',
  'js/regeln/spieler.js', 'js/regeln/runde.js', 'js/welt/darstellung.js', 'js/oberflaeche/anzeige.js', 'js/oberflaeche/joystick-anzeige.js',
  'js/test-schnittstelle.js', 'assets/assets.json', 'assets/quellen/atlas.json', 'assets/quellen/manifest.json', 'assets/quellen/sounds.json',
  'grafik/grafik.json', 'tests/test-hilfe.js', 'SCHULDEN.md', 'LIESMICH.md', 'assets/sounds/start.m4a', 'assets/sounds/start.mp3'];

const neuesSpiel = (argumente, cwd) => spawnSync(process.execPath, [path.join(WERKZEUGE, 'neues-spiel.js'), ...argumente], { cwd, encoding: 'utf8' });
const alleDateien = (ordner, unter = '') => fs.readdirSync(path.join(ordner, unter), { withFileTypes: true })
  .flatMap((e) => (e.isDirectory() ? alleDateien(ordner, path.join(unter, e.name)) : [path.join(unter, e.name)]));

function pruefeDateien(ziel, name, art) {
  const fehlen = [...DATEIEN, `tests/${name}-test.js`].filter((d) => !fs.existsSync(path.join(ziel, d)));
  h.pruefe(!fehlen.length, `${art}: alle Gerüst-Dateien da${fehlen.length ? ` (fehlen: ${fehlen.join(', ')})` : ''}`);
  const bausteine = fs.readdirSync(h.ORDNER).filter((d) => d.endsWith('.js'));
  const anders = bausteine.filter((d) => !fs.existsSync(path.join(ziel, 'js', 'kern', d)) || !fs.readFileSync(path.join(ziel, 'js', 'kern', d)).equals(fs.readFileSync(path.join(h.ORDNER, d))));
  h.pruefe(bausteine.length === 14 && !anders.length, `${art}: alle ${bausteine.length} Bausteine unverändert in js/kern/${anders.length ? ` (anders: ${anders.join(', ')})` : ''}`);
  h.pruefe(fs.readFileSync(path.join(ziel, 'tests', 'test-hilfe.js')).equals(fs.readFileSync(path.join(WERKZEUGE, 'test-hilfe.js'))), `${art}: Test-Hilfe kopiert`);
  const rest = alleDateien(ziel).filter((d) => /\.(js|html|css|md|json)$/.test(d) && /__[A-Z]+__/.test(fs.readFileSync(path.join(ziel, d), 'utf8')));
  h.pruefe(!rest.length, `${art}: keine Platzhalter übrig ${rest.join(', ')}`);
  const html = fs.readFileSync(path.join(ziel, 'index.html'), 'utf8');
  h.pruefe(art === '3d' ? /three@0\.170\.0/.test(html) : !/three@/.test(html), `${art}: ${art === '3d' ? 'Import-Map mit Three.js 0.170.0' : 'ohne Three.js'}`);
  const w = (fs.readFileSync(path.join(ziel, 'LIESMICH.md'), 'utf8').match(/W=(\S+)/) || [])[1];
  h.pruefe(w && fs.existsSync(path.join(ziel, w, 'atlas.js')), `${art}: Werkzeug-Pfad in LIESMICH.md stimmt (${w})`);
  const manifest = JSON.parse(fs.readFileSync(path.join(ziel, 'assets', 'assets.json'), 'utf8'));
  const bild = art === '3d' ? manifest.bilder.some((b) => b.name === 'kachel') : manifest.atlanten.some((a) => a.name === 'spiel');
  h.pruefe(bild && manifest.version.length >= 8, `${art}: Manifest mit Beispiel-Bild, Version ${manifest.version}`);
  h.pruefe(manifest.sounds.some((x) => x.name === 'start' && x.dateien.length === 2), `${art}: Manifest mit Sound-Datei „start“ (m4a, mp3)`);
  const [platz] = JSON.parse(fs.readFileSync(path.join(ziel, 'grafik', 'grafik.json'), 'utf8'));
  h.pruefe(platz.platzhalter === true && (art === '3d' || (Array.isArray(platz.anker) && platz.anker.length === 2)), `${art}: Beispiel-Bild in grafik.json als Platzhalter${art === '2d' ? ' mit Fußpunkt' : ''} (${JSON.stringify(platz)})`);
  const quelle = JSON.parse(fs.readFileSync(path.join(ziel, 'assets', 'quellen', 'atlas.json'), 'utf8'));
  h.pruefe(!Object.keys(quelle.anker || {}).length, `${art}: atlas.json ohne festen Anker (Fußpunkt kommt aus grafik.json)`);
}

function laufeGeruestTest(ziel, name, art) {
  const lauf = spawnSync(process.execPath, [path.join(ziel, 'tests', `${name}-test.js`)], {
    cwd: os.tmpdir(), encoding: 'utf8', timeout: 200000, env: { ...process.env, PORT: String(PORT), FOTO: path.join(os.tmpdir(), `baustein-geruest-${art}.png`) },
  });
  const zeilen = `${lauf.stdout || ''}${lauf.stderr || ''}`.split('\n');
  const ok = zeilen.filter((z) => z.startsWith('OK')).length, rot = zeilen.filter((z) => z.startsWith('FEHLER') || /Error|abgebrochen/.test(z));
  for (const z of rot.slice(0, 6)) console.log(`       ${art}: ${z}`);
  h.pruefe(lauf.status === 0 && zeilen.includes('Alle Prüfungen bestanden.') && ok >= 44, `${art}: eigener Test des Gerüsts grün (${ok} Prüfungen)`);
}

const basis = fs.mkdtempSync(path.join(os.tmpdir(), 'geruest-test-'));
try {
  for (const art of ARTEN) {
    const name = `probe-${art}`, ziel = path.join(basis, name);
    const anlegen = neuesSpiel([name, ...(art === '3d' ? ['--3d'] : []), '--port', String(PORT)], basis);   // relativ zum aktuellen Ordner
    if (!h.pruefe(anlegen.status === 0, `${art}: neues-spiel.js legt das Gerüst an ${anlegen.stderr.trim()}`)) continue;
    pruefeDateien(ziel, name, art);
    laufeGeruestTest(ziel, name, art);
  }
  const vorher = fs.readFileSync(path.join(basis, `probe-${ARTEN[0]}`, 'js', 'main.js'), 'utf8');
  const nochmal = neuesSpiel([`probe-${ARTEN[0]}`], basis);
  h.pruefe(nochmal.status !== 0 && /nicht leer/.test(nochmal.stderr) && fs.readFileSync(path.join(basis, `probe-${ARTEN[0]}`, 'js', 'main.js'), 'utf8') === vorher, 'nicht leerer Ordner: Abbruch, nichts überschrieben');
  // Ohne --port: erster Zehnerblock ab 9000, den kein Spiel daneben nutzt (8888 der Proben liegt darunter).
  const portVon = (name) => Number((fs.readFileSync(path.join(basis, name, 'tests', `${name}-test.js`), 'utf8').match(/process\.env\.PORT\) \|\| (\d+)/) || [])[1]);
  const p1 = neuesSpiel(['port-eins'], basis), p2 = neuesSpiel(['port-zwei'], basis);
  h.pruefe(p1.status === 0 && p2.status === 0 && portVon('port-eins') === 9000 && portVon('port-zwei') === 9010 && /Port 9010/.test(p2.stdout),
    `ohne --port: nächster freier Zehnerblock (${portVon('port-eins')}, ${portVon('port-zwei')})`);
  // Sound-Dateien der Vorlage passen zum Rezept (Dauer), sonst klingt das Gerüst anders als sounds.json sagt.
  const rezept = JSON.parse(fs.readFileSync(path.join(WERKZEUGE, '..', 'vorlage', 'gemeinsam', 'assets', 'quellen', 'sounds.json'), 'utf8')).sounds.start;
  const dauern = ['m4a', 'mp3'].map((e) => Number(spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path.join(WERKZEUGE, '..', 'vorlage', 'gemeinsam', 'assets', 'sounds', `start.${e}`)], { encoding: 'utf8' }).stdout));
  h.pruefe(dauern.every((d) => Math.abs(d - rezept.dauer) < 0.06), `Vorlage: start.m4a/.mp3 passen zum Rezept (${dauern.join(', ')} s, Rezept ${rezept.dauer} s; neu: sounds.js auf ein Gerüst, dann zurückkopieren)`);
  const falsch = neuesSpiel(['Mein Spiel'], basis);
  h.pruefe(falsch.status !== 0 && /klein, ohne Umlaute/.test(falsch.stderr) && !fs.existsSync(path.join(basis, 'Mein Spiel')), 'Name mit Großbuchstaben und Leerzeichen wird abgelehnt');
} catch (e) { h.pruefe(false, `Ablauf abgebrochen: ${e.message}`); }
fs.rmSync(basis, { recursive: true, force: true });
h.ergebnis();
