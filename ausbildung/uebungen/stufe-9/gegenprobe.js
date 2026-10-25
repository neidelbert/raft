// Gegenprobe für die Tests der Übung 9: baut absichtlich Fehler in eine Kopie (Temp-Ordner) und erwartet rote Tests.
// node ausbildung/uebungen/stufe-9/gegenprobe.js   (dauert einige Minuten: jeder Fall startet den Browser neu)
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

// [Datei, Suchtext, Ersatz, Fehler, Test ('test.js' = Teil 1, 'test-ersatz.js' = Teil 2)]
const FAELLE = [
  ['js/kern/assets.js', 'return Promise.race([arbeit(steuerung.signal), grenze])', 'return arbeit(steuerung.signal)', 'keine Zeitgrenze (hängender Server blockiert)', 'test-ersatz.js'],
  ['js/main.js', '  ersatz: baueErsatz,\n', '', 'kein Ersatz für fehlenden Atlas', 'test-ersatz.js'],
  ['js/modell.js', 'if (!boot) {', 'if (false) {', 'keine Ersatz-Box ohne boot.glb', 'test-ersatz.js'],
  ['js/welt/zeichnen.js', 'HELD.skala, held.blick);', 'HELD.skala, 1);', 'Blick links nicht gespiegelt', 'test.js'],
  ['js/welt/held.js', 'aktualisiereAnimation(held.abspieler, dt, laufBps(held.anteil, cfg) / lauf.bps);', 'aktualisiereAnimation(held.abspieler, dt);', 'Lauftempo immer 10 bps (kein Rennen)', 'test.js'],
  ['js/welt/held.js', 'if (held.laeuft && lauf) {', 'if (lauf) {', 'im Stand kein held-steht', 'test.js'],
  ['js/welt/gegenstaende.js', 'if (e.aktiv && aktualisiereAnimation(e.abspieler, dt)) { e.aktiv = false; explosionen.aktiv--; }', 'if (e.aktiv) aktualisiereAnimation(e.abspieler, dt);', 'Explosion verschwindet nie', 'test.js'],
  ['js/main.js', '    for (const [name, s] of Object.entries(welt.assets.sounds)) ton.setzePuffer(name, s.puffer, s.laut);\n', '', 'Sound wird nie abgespielt', 'test.js'],
  ['js/main.js', 'beiFortschritt(anteil) { lade.fortschritt = anteil;', 'beiFortschritt(anteil) { lade.fortschritt = anteil < 1 ? 1 - anteil : 1;', 'Fortschritt läuft rückwärts', 'test.js'],
  ['js/main.js', "automat.wechsle('laden');", "automat.wechsle('laden'); anzeige.zeigeSpiel();", 'Ladebildschirm fehlt', 'test.js'],
  ['js/kern/assets.js', 'const voll = (datei) => `${basis}${datei}?v=${encodeURIComponent(assets.version)}`;', 'const voll = (datei) => `${basis}${datei}`;', 'Adressen ohne ?v=<version>', 'test.js'],
];

const quelle = __dirname;
const ziel = fs.mkdtempSync(path.join(os.tmpdir(), 'stufe9-gegenprobe-'));
let schlecht = 0;
for (const [datei, suche, ersatz, fehler, test] of FAELLE) {
  fs.rmSync(ziel, { recursive: true, force: true });
  fs.cpSync(quelle, ziel, { recursive: true });
  const pfad = path.join(ziel, datei), text = fs.readFileSync(pfad, 'utf8');
  if (!text.includes(suche)) { console.log(`VERALTET ${datei}: Suchtext nicht gefunden (${fehler})`); schlecht++; continue; }
  fs.writeFileSync(pfad, text.replace(suche, ersatz));
  const lauf = spawnSync(process.execPath, [path.join(quelle, test)], { encoding: 'utf8', timeout: 300000,
    env: { ...process.env, ORDNER: ziel, NUR_TEIL1: '1', FOTO_ORDNER: os.tmpdir() } });
  const rot = (lauf.stdout || '').split('\n').filter((z) => z.startsWith('FEHLER'));
  if (lauf.status === 0) schlecht++;
  console.log(`${lauf.status !== 0 ? 'ROT  ' : 'GRÜN!'} ${test} bei „${fehler}“ (${rot.length} rot${rot[0] ? `, z. B. ${rot[0].slice(7, 90)}` : ''})`);
}
fs.rmSync(ziel, { recursive: true, force: true });
console.log(schlecht ? `\n${schlecht} Gegenprobe(n) grün oder veraltet.` : `\nAlle ${FAELLE.length} Gegenproben rot: Die Tests finden die Fehler.`);
process.exit(schlecht ? 1 : 0);
