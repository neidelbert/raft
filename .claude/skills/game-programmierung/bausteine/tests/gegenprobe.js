// Gegenprobe: Taugen die Tests? Baut jeden Baustein absichtlich kaputt (Kopie im Temp-Ordner) und erwartet, dass
// sein Test rot wird. node .claude/skills/game-programmierung/bausteine/tests/gegenprobe.js
// Bleibt ein Test grün, prüft er den Fehler nicht (Lernbuch: eine Gegenprobe gegen den alten Code muss rot sein).
// Passt ein Suchtext nicht mehr (Baustein geändert), meldet die Gegenprobe das, statt still nichts zu prüfen.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ORIGINAL = path.resolve(__dirname, '..');
// [Baustein-Datei, Test, Suchtext, Ersatz, was der Fehler ist]
const FAELLE = [
  ['schleife.js', 'schleife', 'Math.min(Math.max(jetzt - letzte, 0) / 1000, deltaMax)', 'Math.max(jetzt - letzte, 0) / 1000', 'Delta-Zeit nicht gedeckelt'],
  ['schleife.js', 'schleife', 'letzte = Math.max(letzte, jetzt);', 'letzte = jetzt;', 'verspätetes Bild setzt die Zeit zurück (Sprung)'],
  ['schleife.js', 'schleife', 'if (!schleife.pausiert) aktualisiere(dt);', 'aktualisiere(dt);', 'keine Pause bei verstecktem Tab'],
  ['bildschirm.js', 'bildschirm', 'Math.min(geraeteRatio || 1, maxRatio)', '(geraeteRatio || 1)', 'Pixel-Ratio nicht begrenzt'],
  ['joystick.js', 'joystick', "['pointercancel', losVonFinger], ", '', 'pointercancel nicht abgefangen'],
  ['joystick.js', 'joystick', "['lostpointercapture', losVonFinger]", '', 'verlorener Finger nicht abgefangen'],
  ['joystick.js', 'joystick', 'eingabe.x = 0; eingabe.y = 0; eingabe.aktiv = false;', 'eingabe.x = 0; eingabe.aktiv = false;', 'Loslassen setzt nur x zurück'],
  ['knopf.js', 'knopf', 'if (e.detail === 0) beimDruecken();', 'beimDruecken();', 'Tipp löst doppelt aus'],
  ['zufall.js', 'zufall', 'let s = seed >>> 0;', 'let s = Date.now() >>> 0;', 'Seed wird nicht benutzt'],
  ['speicher.js', 'speicher', 'else if (passt(ist, soll)) stand[feld] = ist;', 'else if (ist !== undefined) stand[feld] = ist;', 'falsche Typen werden übernommen'],
  ['speicher.js', 'speicher', 'if (speicher.ungespeichert && speichereStand(', 'if (speichereStand(', 'schreibt auch ohne Änderung'],
  ['pool.js', 'pool', 'return pool.anzahl < max ? pool.anzahl++ : -1;', 'return pool.anzahl++;', 'Grenze wird überschritten'],
  ['gitter.js', 'gitter', '    kopf.fill(-1, 0, gitter.spalten * gitter.zeilen);\n', '', 'Zellen werden vor dem Füllen nicht geleert'],
  ['partikel.js', 'partikel', 'if (p.alter[i] >= p.dauer[i]) { p.gib(i); continue; }', '', 'Partikel verschwinden nie'],
  ['ton.js', 'ton', 'if (!ton.bereit || !ton.an) return false;', 'if (!ton.bereit) return false;', 'Ton aus wird nicht beachtet'],
  ['ton.js', 'ton', 't - (zuletzt[name] ?? -Infinity) < mindestAbstand', 'false', 'gleicher Klang beliebig oft'],
  ['bilder.js', 'bilder', "bild.onerror = () => { console.warn(`Bild fehlt: ${eintrag.datei}`); fertig(); };", "bild.onerror = () => { throw new Error('Bild fehlt'); };", 'fehlendes Bild hält den Start an'],
  ['bilder.js', 'bilder', "if (!Array.isArray(liste)) throw new Error('keine Liste');", '', 'Liste ohne Array stürzt ab'],
  ['zustaende.js', 'zustaende', 'aktuell?.verlassen?.();', '', 'verlassen() wird nicht aufgerufen'],
  ['zufall.js', 'kopf', '//   zwischen(zufall, min, max)', '//   zwischen(zufall, min, max)\n// window.spiel', 'Baustein liest window.spiel'],
];

const ziel = fs.mkdtempSync(path.join(os.tmpdir(), 'bausteine-gegenprobe-'));
let schlecht = 0;
for (const [datei, test, suche, ersatz, fehler] of FAELLE) {
  fs.rmSync(ziel, { recursive: true, force: true });
  fs.cpSync(ORIGINAL, ziel, { recursive: true });
  const pfad = path.join(ziel, datei), text = fs.readFileSync(pfad, 'utf8');
  if (!text.includes(suche)) { console.log(`VERALTET ${datei}: Suchtext nicht gefunden (${fehler})`); schlecht++; continue; }
  fs.writeFileSync(pfad, text.replace(suche, ersatz));
  const lauf = spawnSync(process.execPath, [path.join(__dirname, `${test}-test.js`)], {
    encoding: 'utf8', env: { ...process.env, BAUSTEINE: ziel }, timeout: 240000,
  });
  const rot = (lauf.stdout || '').split('\n').filter((z) => z.startsWith('FEHLER')).length;
  const gut = lauf.status !== 0;
  if (!gut) schlecht++;
  console.log(`${gut ? 'ROT  ' : 'GRÜN!'} ${test}-test bei „${fehler}“ (${rot} Prüfung(en) rot)`);
}
fs.rmSync(ziel, { recursive: true, force: true });
console.log(schlecht ? `\n${schlecht} Gegenprobe(n) blieben grün oder sind veraltet: Diese Tests prüfen den Fehler nicht.` : `\nAlle ${FAELLE.length} Gegenproben rot: Die Tests finden die Fehler.`);
process.exit(schlecht ? 1 : 0);
