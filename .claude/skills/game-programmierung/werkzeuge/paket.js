// Werkzeug „paket“: packt die Skills zum Weitergeben. Schreibt in <dist>:
//   game-programmierung.zip  dieser Skill-Ordner (Handbuch, Wissen, Bausteine mit Tests, Werkzeuge, Vorlagen)
//   zeichnen.zip             der Zeichner-Skill daneben (../zeichnen, mit seinem Werkzeug render.js), wenn es ihn gibt
//   INSTALLIEREN.md          wie man die Zips in Claude Code und Claude.ai einspielt
// Wofür: Ein neuer Programmierer bekommt nur das Paket und kann damit Spiele bauen (neues-spiel.js, SKILL.md).
//   Jedes Zip enthält oben genau einen Ordner mit SKILL.md (so erwarten es Claude Code und Claude.ai).
//   Weggelassen wird Abfall: node_modules, .git, Systemdateien (.DS_Store), Logs, Temp- und Sicherungsdateien,
//   Archive und Bildschirmfotos von Testseiten (baustein-*.png, *foto*.png, *screenshot*.png).
//   Ohne Pakete (zlib aus Node), immer gleich: feste Reihenfolge und festes Datum, gleiche Dateien → gleiches Zip.
// Aufruf:   node <skill>/werkzeuge/paket.js [dist-ordner]
//   Standard: <repo>/dist, wenn der Skill in <repo>/.claude/skills/ liegt, sonst ./dist.
// Aus Code: const { baueZip, sammleDateien, bauePakete } = require('./paket.js'); bauePakete(dist, { zeichner: ordner });
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SKILL = path.resolve(__dirname, '..');
const ZEICHNER = path.resolve(SKILL, '..', 'zeichnen');
const ABFALL_ORDNER = new Set(['node_modules', '.git', '__pycache__', '.cache']);
const ABFALL_DATEI = /(^\.DS_Store$|^Thumbs\.db$|\.log$|\.tmp$|~$|\.swp$|\.tgz$|\.zip$)/;
const BILDSCHIRMFOTO = /^(baustein-.*|.*foto.*|.*screenshot.*)\.png$/i;

// Alle Dateien eines Ordners, sortiert, ohne Abfall. Gibt relative Pfade mit „/“ zurück.
function sammleDateien(ordner, unter = '') {
  const liste = [];
  for (const e of fs.readdirSync(path.join(ordner, unter), { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
    const rel = unter ? `${unter}/${e.name}` : e.name;
    if (e.isDirectory()) { if (!ABFALL_ORDNER.has(e.name)) liste.push(...sammleDateien(ordner, rel)); continue; }
    if (!e.isFile() || ABFALL_DATEI.test(e.name) || BILDSCHIRMFOTO.test(e.name)) continue;
    liste.push(rel);
  }
  return liste;
}

const CRC_TABELLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(daten) {
  let c = 0xffffffff;
  for (let i = 0; i < daten.length; i++) c = CRC_TABELLE[(c ^ daten[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// Zip (Deflate) aus [{ name, daten }]. Datum fest 1.1.1980, damit gleiche Dateien ein gleiches Zip ergeben.
function baueZip(eintraege) {
  const teile = [], verzeichnis = [];
  let pos = 0;
  for (const { name, daten } of eintraege) {
    const n = Buffer.from(name, 'utf8'), gepackt = zlib.deflateRawSync(daten, { level: 9 }), crc = crc32(daten);
    const kopf = Buffer.alloc(30);
    kopf.writeUInt32LE(0x04034b50, 0); kopf.writeUInt16LE(20, 4); kopf.writeUInt16LE(0x0800, 6);   // UTF-8-Namen
    kopf.writeUInt16LE(8, 8); kopf.writeUInt16LE(0, 10); kopf.writeUInt16LE(0x21, 12);           // Deflate, 1.1.1980
    kopf.writeUInt32LE(crc, 14); kopf.writeUInt32LE(gepackt.length, 18); kopf.writeUInt32LE(daten.length, 22);
    kopf.writeUInt16LE(n.length, 26); kopf.writeUInt16LE(0, 28);
    const zentral = Buffer.alloc(46);
    zentral.writeUInt32LE(0x02014b50, 0); zentral.writeUInt16LE(0x0314, 4); zentral.writeUInt16LE(20, 6);
    zentral.writeUInt16LE(0x0800, 8); zentral.writeUInt16LE(8, 10); zentral.writeUInt16LE(0, 12); zentral.writeUInt16LE(0x21, 14);
    zentral.writeUInt32LE(crc, 16); zentral.writeUInt32LE(gepackt.length, 20); zentral.writeUInt32LE(daten.length, 24);
    zentral.writeUInt16LE(n.length, 28); zentral.writeUInt32LE((0o100644 << 16) >>> 0, 38); zentral.writeUInt32LE(pos, 42);
    teile.push(kopf, n, gepackt);
    verzeichnis.push(zentral, n);
    pos += kopf.length + n.length + gepackt.length;
  }
  const groesse = verzeichnis.reduce((s, b) => s + b.length, 0), ende = Buffer.alloc(22);
  ende.writeUInt32LE(0x06054b50, 0); ende.writeUInt16LE(eintraege.length, 8); ende.writeUInt16LE(eintraege.length, 10);
  ende.writeUInt32LE(groesse, 12); ende.writeUInt32LE(pos, 16);
  return Buffer.concat([...teile, ...verzeichnis, ende]);
}

function packeOrdner(ordner, wurzelName) {
  const dateien = sammleDateien(ordner);
  if (!dateien.includes('SKILL.md')) throw new Error(`${ordner}: SKILL.md fehlt`);
  return { zip: baueZip(dateien.map((d) => ({ name: `${wurzelName}/${d}`, daten: fs.readFileSync(path.join(ordner, d)) }))), dateien };
}

function standardDist() {
  const skills = path.dirname(SKILL), claude = path.dirname(skills);
  const imRepo = path.basename(skills) === 'skills' && path.basename(claude) === '.claude';
  return path.join(imRepo ? path.dirname(claude) : process.cwd(), 'dist');
}

const INSTALLIEREN = `# Skills installieren

Zwei Pakete, jedes ein Zip mit genau einem Ordner darin:
- \`game-programmierung.zip\`: Handbuch des Programmierers für Handy-Browserspiele (2D Canvas, 3D Three.js, iPhone-Safari), mit geprüften Bausteinen, Asset-Werkzeugen und dem Gerüst-Werkzeug \`neues-spiel.js\`.
- \`zeichnen.zip\`: Handbuch des Zeichners (SVG im Haus-Stil → PNG) mit seinem Werkzeug \`render.js\`.

## Claude Code
1. Im Projektordner entpacken, sodass die Ordner unter \`.claude/skills/\` liegen:
   \`\`\`bash
   mkdir -p .claude/skills
   unzip game-programmierung.zip -d .claude/skills/
   unzip zeichnen.zip -d .claude/skills/
   \`\`\`
   Für alle Projekte statt dessen nach \`~/.claude/skills/\` entpacken.
2. Claude Code neu starten. Die Skills heißen „game-programmierung“ und „zeichnen“ und werden bei passenden Aufgaben geladen.
3. Erstes Spiel: \`node .claude/skills/game-programmierung/werkzeuge/neues-spiel.js spiele/mein-spiel\` (3D: \`--3d\`), dann \`node spiele/mein-spiel/tests/mein-spiel-test.js\`. Weiter mit \`SKILL.md\` („Neues Spiel in 5 Schritten“).

## Claude.ai
Einstellungen → Fähigkeiten → Fähigkeit hochladen → die Zip-Datei wählen (je Skill einmal). Dort liest Claude das Handbuch; die Werkzeuge und Tests brauchen eine Umgebung mit Node und Chromium (wie Claude Code).

## Was die Werkzeuge brauchen
| Was | Wofür |
|---|---|
| Node 18 oder neuer | alle Werkzeuge und Tests |
| Playwright mit Chromium (\`require('playwright')\`, z. B. \`npm i -D playwright && npx playwright install chromium\`) | Tests, \`modell.js\`, \`render.js\` |
| python3 | Testserver (\`python3 -m http.server\`) |
| npm mit Netz (einmal) | 3D-Tests: Three.js 0.170.0 wird in den Temp-Ordner geholt (das CDN ist im Test umgeleitet) |
| ffmpeg mit aac und libmp3lame | nur \`sounds.js\` |

Die Spiele selbst brauchen nichts davon: reine ES-Module, kein Build, laufen direkt auf GitHub Pages.
`;

function bauePakete(dist = standardDist(), { still = false, zeichner = ZEICHNER } = {}) {
  fs.mkdirSync(dist, { recursive: true });
  const melde = (text) => { if (!still) console.log(text); };
  const ergebnis = {};
  const skill = packeOrdner(SKILL, path.basename(SKILL));
  fs.writeFileSync(path.join(dist, 'game-programmierung.zip'), skill.zip);
  ergebnis.skill = { datei: path.join(dist, 'game-programmierung.zip'), dateien: skill.dateien, bytes: skill.zip.length };
  melde(`game-programmierung.zip: ${skill.dateien.length} Dateien, ${(skill.zip.length / 1e6).toFixed(2).replace('.', ',')} MB`);
  if (fs.existsSync(path.join(zeichner, 'SKILL.md'))) {
    if (!fs.existsSync(path.join(zeichner, 'render.js'))) throw new Error('Zeichner-Skill ohne render.js');
    const original = path.resolve(SKILL, '..', '..', '..', 'werkzeuge', 'zeichner', 'render.js');   // nur im Team-Repo
    const code = (datei) => fs.readFileSync(datei, 'utf8').replace(/^(\/\/.*\n)+/, '');   // ohne Kopfkommentar
    if (fs.existsSync(original) && code(original) !== code(path.join(zeichner, 'render.js')))
      console.warn('Warnung: render.js im Zeichner-Skill weicht von werkzeuge/zeichner/render.js ab (Kopie erneuern)');
    const paket = packeOrdner(zeichner, 'zeichnen');
    fs.writeFileSync(path.join(dist, 'zeichnen.zip'), paket.zip);
    ergebnis.zeichner = { datei: path.join(dist, 'zeichnen.zip'), dateien: paket.dateien, bytes: paket.zip.length };
    melde(`zeichnen.zip: ${paket.dateien.length} Dateien, ${(paket.zip.length / 1e6).toFixed(2).replace('.', ',')} MB`);
  } else melde('Zeichner-Skill nicht gefunden (../zeichnen), zeichnen.zip ausgelassen');
  fs.writeFileSync(path.join(dist, 'INSTALLIEREN.md'), INSTALLIEREN);
  melde(`INSTALLIEREN.md → ${dist}`);
  return ergebnis;
}

if (require.main === module) {
  try { bauePakete(process.argv[2] ? path.resolve(process.argv[2]) : undefined); } catch (e) { console.error(`Fehler: ${e.message}`); process.exit(1); }
}

module.exports = { baueZip, sammleDateien, bauePakete, crc32 };
