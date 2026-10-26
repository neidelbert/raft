// Test für die Asset-Werkzeuge (werkzeuge/png.js, atlas.js, sounds.js, modell.js, manifest.js), ohne Port:
// Jedes Werkzeug läuft auf einem kleinen Beispiel-Spielordner im Temp-Ordner. node werkzeuge-test.js
// WERKZEUGE=<ordner> testet eine Kopie (Gegenprobe, siehe gegenprobe.js).
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const h = require('./hilfe.js');

const WERKZEUGE = process.env.WERKZEUGE ? path.resolve(process.env.WERKZEUGE) : path.resolve(__dirname, '..', '..', 'werkzeuge');
const { lesePng, schreibePng, leeresBild } = require(path.join(WERKZEUGE, 'png.js'));
const { baueAtlanten } = require(path.join(WERKZEUGE, 'atlas.js'));
const { erzeugeSamples, schreibeWav, baueSounds } = require(path.join(WERKZEUGE, 'sounds.js'));
const { baueModelle } = require(path.join(WERKZEUGE, 'modell.js'));
const { schreibeManifest } = require(path.join(WERKZEUGE, 'manifest.js'));

const schreibe = (datei, inhalt) => { fs.mkdirSync(path.dirname(datei), { recursive: true }); fs.writeFileSync(datei, inhalt); };
// Bild breite × hoehe, durchsichtig, mit farbiger Fläche (x, y, b, h).
function bildMitFlaeche(breite, hoehe, f, farbe) {
  const bild = leeresBild(breite, hoehe);
  for (let y = f.y; y < f.y + f.h; y++) for (let x = f.x; x < f.x + f.b; x++) bild.daten.set(farbe, (y * breite + x) * 4);
  return bild;
}
const pixel = (bild, x, y) => Array.from(bild.daten.subarray((y * bild.breite + x) * 4, (y * bild.breite + x) * 4 + 4)).join();

function legeSpielAn(ordner, bilder, atlasQuelle) {
  const liste = [];
  for (const [name, bild] of Object.entries(bilder)) {
    schreibe(path.join(ordner, 'grafik', `${name}.png`), schreibePng(bild));
    liste.push({ name, datei: `grafik/${name}.png`, breite: bild.breite, hoehe: bild.hoehe });
  }
  schreibe(path.join(ordner, 'grafik', 'grafik.json'), JSON.stringify(liste));
  schreibe(path.join(ordner, 'assets', 'quellen', 'atlas.json'), JSON.stringify(atlasQuelle));
}

function pngTests(ordner) {
  const bild = leeresBild(37, 23);
  for (let i = 0; i < bild.daten.length; i++) bild.daten[i] = (i * 7919) % 256;
  const zurueck = lesePng(schreibePng(bild));
  h.pruefe(zurueck.breite === 37 && zurueck.hoehe === 23 && Buffer.from(zurueck.daten).equals(Buffer.from(bild.daten)), 'png: schreiben und wieder lesen ergibt dieselben Pixel');
  const wiese = path.join(h.ORDNER, 'tests', 'seite', 'grafik', 'boden', 'wiese.png');   // Wiese des Zeichners (RGB, ohne Alpha)
  const figur = path.join(h.ORDNER, 'tests', 'seite', 'grafik', 'figuren', 'figur.png');
  const w = lesePng(fs.readFileSync(wiese));
  h.pruefe(w.breite === 512 && w.daten[3] === 255, 'png: RGB-Bild des Zeichners lesbar (ohne Alpha → undurchsichtig)');
  const f = lesePng(fs.readFileSync(figur));
  h.pruefe(f.breite === 213 && f.daten[3] === 0, 'png: RGBA-Bild des Zeichners lesbar (Ecke durchsichtig)');
  let meldung = '';
  try { lesePng(Buffer.from('keine png')); } catch (e) { meldung = e.message; }
  h.pruefe(/keine PNG/.test(meldung), 'png: falsche Datei → klare Meldung');
  fs.rmSync(ordner, { recursive: true, force: true });
}

function atlasTests(ordner) {
  const ROT = [255, 0, 0, 255], GRUEN = [0, 255, 0, 255], BLAU = [0, 0, 255, 255], GELB = [255, 255, 0, 255];
  const bilder = {
    'figuren/held-1': bildMitFlaeche(40, 60, { x: 10, y: 15, b: 20, h: 40 }, ROT),
    'figuren/held-2': bildMitFlaeche(40, 60, { x: 12, y: 13, b: 18, h: 42 }, GRUEN),
    'effekte/boom-10': bildMitFlaeche(30, 30, { x: 0, y: 0, b: 30, h: 30 }, BLAU),
    'effekte/boom-2': bildMitFlaeche(30, 30, { x: 5, y: 5, b: 20, h: 20 }, BLAU),
    'effekte/boom-1': bildMitFlaeche(30, 30, { x: 5, y: 5, b: 10, h: 10 }, BLAU),
    'symbole/ton': bildMitFlaeche(16, 16, { x: 0, y: 0, b: 16, h: 16 }, GELB),
    'boden/kachel': bildMitFlaeche(8, 8, { x: 0, y: 0, b: 8, h: 8 }, GRUEN),
  };
  legeSpielAn(ordner, bilder, {
    grafik: 'grafik/grafik.json', abstand: 2, groesseMax: 2048,
    atlanten: [{ name: 'spiel', gruppen: ['figuren', 'effekte', 'symbole'] }], einzeln: ['boden/kachel'],
    anker: { 'figuren/held-*': [20, 55] }, animationen: { 'held': { bps: 12, schleife: true } },
  });
  const warnungen = [];
  const warn = console.warn;
  console.warn = (t) => warnungen.push(t);
  let ergebnis;
  try { ergebnis = baueAtlanten(ordner, { still: true }); } finally { console.warn = warn; }
  const daten = JSON.parse(fs.readFileSync(path.join(ordner, 'assets', 'atlas', 'spiel.json'), 'utf8'));
  const atlas = lesePng(fs.readFileSync(path.join(ordner, 'assets', 'atlas', 'spiel.png')));
  h.pruefe(ergebnis.atlanten.length === 1 && atlas.breite === daten.breite && atlas.hoehe === daten.hoehe && daten.bild === 'spiel.png', `atlas: ein Atlas, PNG und JSON passen (${atlas.breite} × ${atlas.hoehe})`);
  h.pruefe(Object.keys(daten.rahmen).sort().join() === 'boom-1,boom-10,boom-2,held-1,held-2,ton', 'atlas: alle Rahmen (Name ohne Gruppe), Einzelbild nicht im Atlas');
  const r = daten.rahmen['held-1'];
  h.pruefe(r.b === 20 && r.h === 40, `atlas: durchsichtiger Rand abgeschnitten (held-1: ${r.b} × ${r.h})`);
  h.pruefe(r.ankerX === 10 && r.ankerY === 40 && daten.rahmen['held-2'].ankerX === 8 && daten.rahmen['held-2'].ankerY === 42,
    'atlas: Anker wandert mit dem Zuschnitt (Fußpunkt bleibt gleich, keine wackelnde Animation)');
  h.pruefe(daten.rahmen.ton.ankerX === 8 && daten.rahmen.ton.ankerY === 8, 'atlas: ohne Anker-Eintrag Bildmitte');
  const liste = Object.values(daten.rahmen);
  let kleinsterAbstand = Infinity;
  for (let i = 0; i < liste.length; i++) for (let j = 0; j < i; j++) {
    const a = liste[i], b = liste[j];
    const dx = Math.max(a.x - (b.x + b.b), b.x - (a.x + a.b)), dy = Math.max(a.y - (b.y + b.h), b.y - (a.y + a.h));
    kleinsterAbstand = Math.min(kleinsterAbstand, Math.max(dx, dy));
  }
  h.pruefe(kleinsterAbstand >= 2, `atlas: Rahmen überlappen nicht, mindestens 2 px Abstand (kleinster: ${kleinsterAbstand} px)`);
  h.pruefe(liste.every((q) => q.x >= 1 && q.y >= 1 && q.x + q.b <= atlas.breite - 1 && q.y + q.h <= atlas.hoehe - 1), 'atlas: auch zum Rand des Atlas Platz für die Randverlängerung');
  const inhaltStimmt = pixel(atlas, r.x, r.y) === ROT.join() && pixel(atlas, r.x + r.b - 1, r.y + r.h - 1) === ROT.join();
  const rand = [[r.x - 1, r.y], [r.x + r.b, r.y + r.h - 1], [r.x, r.y - 1], [r.x + r.b - 1, r.y + r.h], [r.x - 1, r.y - 1]].every(([x, y]) => pixel(atlas, x, y) === ROT.join());
  h.pruefe(inhaltStimmt, 'atlas: Pixel des Rahmens richtig kopiert');
  h.pruefe(rand, 'atlas: Randverlängerung: das Pixel neben jeder Kante (und Ecke) hat die Farbe der Kante');
  h.pruefe(JSON.stringify(daten.animationen.held) === '{"rahmen":["held-1","held-2"],"bps":12,"schleife":true}', 'atlas: Animation held aus held-1, held-2 mit bps aus atlas.json');
  h.pruefe(daten.animationen.boom.rahmen.join() === 'boom-1,boom-2,boom-10' && daten.animationen.boom.bps === 10, 'atlas: Rahmen nach Nummer sortiert (1, 2, 10), Standard 10 bps');
  h.pruefe(warnungen.some((w) => w.includes('boom')), 'atlas: Warnung für Animation ohne Eintrag');
  h.pruefe(fs.existsSync(path.join(ordner, 'assets', 'bilder', 'kachel.png')), 'atlas: Einzelbild nach assets/bilder kopiert');

  // Fußpunkt aus grafik.json (render.js des Zeichners schreibt ihn), atlas.json überschreibt nur.
  const dritter = `${ordner}-anker`;
  legeSpielAn(dritter, { 'figuren/a': bildMitFlaeche(40, 60, { x: 10, y: 15, b: 20, h: 40 }, ROT), 'figuren/b': bildMitFlaeche(40, 60, { x: 10, y: 15, b: 20, h: 40 }, ROT) },
    { atlanten: [{ name: 's', gruppen: ['figuren'] }], anker: { 'figuren/b': [20, 50] } });
  const listeA = JSON.parse(fs.readFileSync(path.join(dritter, 'grafik', 'grafik.json'), 'utf8')).map((e) => ({ ...e, anker: [20, 55] }));
  fs.writeFileSync(path.join(dritter, 'grafik', 'grafik.json'), JSON.stringify(listeA));
  baueAtlanten(dritter, { still: true });
  const ra = JSON.parse(fs.readFileSync(path.join(dritter, 'assets', 'atlas', 's.json'), 'utf8')).rahmen;
  h.pruefe(ra.a.ankerX === 10 && ra.a.ankerY === 40, `atlas: Fußpunkt aus grafik.json übernommen (a: ${ra.a.ankerX}, ${ra.a.ankerY})`);
  h.pruefe(ra.b.ankerX === 10 && ra.b.ankerY === 35, `atlas: Eintrag in atlas.json überschreibt grafik.json (b: ${ra.b.ankerX}, ${ra.b.ankerY})`);
  fs.rmSync(dritter, { recursive: true, force: true });

  // Zu groß für eine Seite → mehrere Atlanten, keiner über groesseMax
  const viele = {};
  for (let i = 1; i <= 7; i++) viele[`figuren/kiste-${i}`] = bildMitFlaeche(60, 60, { x: 0, y: 0, b: 60, h: 60 }, GELB);
  const zweiter = `${ordner}-2`;
  legeSpielAn(zweiter, viele, { atlanten: [{ name: 'kisten', gruppen: ['figuren'] }], groesseMax: 128, animationen: { kiste: { bps: 5, schleife: false } } });
  fs.mkdirSync(path.join(zweiter, 'assets', 'atlas'), { recursive: true });
  fs.writeFileSync(path.join(zweiter, 'assets', 'atlas', 'kisten-9.json'), '{}');   // alte Seite eines früheren Laufs
  const geteilt = baueAtlanten(zweiter, { still: true });
  const seiten = geteilt.atlanten;
  const alleRahmen = seiten.flatMap((s) => Object.keys(JSON.parse(fs.readFileSync(path.join(zweiter, 'assets', 'atlas', `${s.name}.json`), 'utf8')).rahmen));
  h.pruefe(seiten.length >= 2 && seiten.every((s) => s.breite <= 128 && s.hoehe <= 128) && seiten[1].name === 'kisten-2',
    `atlas: zu viel für ${128} px → mehrere Atlanten (${seiten.map((s) => `${s.name} ${s.breite} × ${s.hoehe}`).join(', ')})`);
  h.pruefe(alleRahmen.length === 7 && new Set(alleRahmen).size === 7, 'atlas: jeder Rahmen genau einmal über alle Atlanten');
  h.pruefe(!fs.existsSync(path.join(zweiter, 'assets', 'atlas', 'kisten-9.json')), 'atlas: alte Seiten werden entfernt');
  legeSpielAn(zweiter, { 'figuren/riese': leeresBild(300, 10) }, { atlanten: [{ name: 'r', gruppen: ['figuren'] }], groesseMax: 128 });
  fs.writeFileSync(path.join(zweiter, 'grafik', 'figuren', 'riese.png'), schreibePng(bildMitFlaeche(300, 10, { x: 0, y: 0, b: 300, h: 10 }, ROT)));
  let meldung = '';
  try { baueAtlanten(zweiter, { still: true }); } catch (e) { meldung = e.message; }
  h.pruefe(/größer als 128/.test(meldung), `atlas: Bild größer als die Grenze → klare Meldung (${meldung})`);
  const lauf = spawnSync(process.execPath, [path.join(WERKZEUGE, 'atlas.js'), zweiter], { encoding: 'utf8' });
  h.pruefe(lauf.status === 1 && /Fehler:/.test(lauf.stderr), 'atlas: Aufruf auf der Kommandozeile meldet Fehler mit Rückgabewert 1');
  fs.rmSync(zweiter, { recursive: true, force: true });
}

function soundTests(ordner) {
  const sinus = erzeugeSamples({ dauer: 0.5, welle: 'sinus', frequenz: [440, 440], huelle: { anschlag: 0.01, halten: 0.4, kurve: 1 } }, 44100, 'ton');
  let spitze = 0, nulldurchgaenge = 0;
  for (let i = 0; i < sinus.length; i++) { spitze = Math.max(spitze, Math.abs(sinus[i])); if (i && (sinus[i - 1] < 0) !== (sinus[i] < 0)) nulldurchgaenge++; }
  h.pruefe(sinus.length === 22050, 'sounds: Länge = dauer × rate');
  h.pruefe(Math.abs(spitze - 10 ** (-1 / 20)) < 1e-6, `sounds: Spitze auf −1 dB normalisiert (${spitze.toFixed(4)})`);
  h.pruefe(Math.abs(nulldurchgaenge - 440) <= 3, `sounds: Frequenz stimmt (440 Hz → ${nulldurchgaenge / 2 / 0.5} Hz)`);
  h.pruefe(Math.abs(sinus[0]) < 0.01 && Math.abs(sinus[sinus.length - 1]) < 0.01, 'sounds: Hüllkurve beginnt und endet bei 0 (kein Knacken)');
  const gleiten = erzeugeSamples({ dauer: 1, welle: 'rechteck', frequenz: [800, 100] }, 8000, 'g');
  const wechsel = (von, bis) => { let n = 0; for (let i = von + 1; i < bis; i++) if ((gleiten[i - 1] < 0) !== (gleiten[i] < 0)) n++; return n; };
  h.pruefe(wechsel(0, 800) > 3 * wechsel(7200, 8000), 'sounds: Frequenzverlauf (800 → 100 Hz wird tiefer)');
  const r1 = erzeugeSamples({ dauer: 0.2, welle: 'rauschen' }, 8000, 'a'), r2 = erzeugeSamples({ dauer: 0.2, welle: 'rauschen' }, 8000, 'a');
  const r3 = erzeugeSamples({ dauer: 0.2, welle: 'rauschen' }, 8000, 'b');
  h.pruefe(r1.every((x, i) => x === r2[i]) && r1.some((x, i) => x !== r3[i]), 'sounds: Rauschen gleich bei gleichem Namen (gleiche Datei), anders bei anderem');
  const hell = erzeugeSamples({ dauer: 0.3, welle: 'rauschen' }, 8000, 'x'), dumpf = erzeugeSamples({ dauer: 0.3, welle: 'rauschen', tiefpass: [200, 200] }, 8000, 'x');
  const unruhe = (s) => { let u = 0; for (let i = 1; i < s.length; i++) u += Math.abs(s[i] - s[i - 1]); return u; };
  h.pruefe(unruhe(dumpf) < unruhe(hell) / 3, 'sounds: Tiefpass macht das Rauschen dumpfer');
  const wav = schreibeWav(sinus, 44100);
  h.pruefe(wav.toString('latin1', 0, 4) === 'RIFF' && wav.toString('latin1', 8, 12) === 'WAVE' && wav.length === 44 + 2 * sinus.length, 'sounds: WAV-Datei mit richtigem Kopf');
  let meldung = '';
  try { erzeugeSamples({ dauer: 1, welle: 'gibtsnicht' }); } catch (e) { meldung = e.message; }
  h.pruefe(/unbekannte welle/.test(meldung), 'sounds: unbekannte Wellenform → klare Meldung');

  schreibe(path.join(ordner, 'assets', 'quellen', 'sounds.json'), JSON.stringify({ sounds: { bumm: { dauer: 0.4, welle: 'rauschen', tiefpass: [3000, 200] } } }));
  baueSounds(ordner, { still: true });
  const dateien = ['bumm.m4a', 'bumm.mp3'].map((d) => path.join(ordner, 'assets', 'sounds', d));
  const pruefe = (d) => spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=codec_name', '-of', 'json', d], { encoding: 'utf8' });
  const infos = dateien.map((d) => (fs.existsSync(d) ? JSON.parse(pruefe(d).stdout || '{}') : {}));
  h.pruefe(infos[0].streams?.[0]?.codec_name === 'aac' && infos[1].streams?.[0]?.codec_name === 'mp3', 'sounds: .m4a mit AAC und .mp3 erzeugt (ffmpeg)');
  h.pruefe(infos.every((i) => Math.abs(Number(i.format?.duration) - 0.4) < 0.06), `sounds: Dauer stimmt (${infos.map((i) => i.format?.duration).join(', ')} s)`);
  const vorher = dateien.map((d) => fs.readFileSync(d));
  baueSounds(ordner, { still: true });
  h.pruefe(dateien.every((d, i) => fs.readFileSync(d).equals(vorher[i])), 'sounds: gleiches Rezept → gleiche Dateien (Asset-Version bleibt)');
}

async function modellTests(ordner) {
  const ohne = fs.mkdtempSync(path.join(os.tmpdir(), 'modell-ohne-'));   // 2D-Spiel ohne Modell-Quellen
  const leer = await baueModelle(ohne, [], { still: true });
  h.pruefe(Array.isArray(leer) && leer.length === 0 && !fs.existsSync(path.join(ohne, 'assets', 'modelle')), 'modell: ohne Quellen „nichts zu tun“, kein Fehler');
  fs.rmSync(ohne, { recursive: true, force: true });
  schreibe(path.join(ordner, 'assets', 'quellen', 'modelle', 'kiste.js'),
    'export default function baue(THREE) { const g = new THREE.Group(); g.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0xff0000 }))); return g; }\n');
  schreibe(path.join(ordner, 'assets', 'quellen', 'modelle', 'kaputt.js'), 'export default function baue() { return 42; }\n');
  const [kiste] = await baueModelle(ordner, ['kiste'], { still: true });
  const glb = fs.readFileSync(path.join(ordner, 'assets', 'modelle', 'kiste.glb'));
  const json = JSON.parse(glb.toString('utf8', 20, 20 + glb.readUInt32LE(12)));
  h.pruefe(glb.toString('latin1', 0, 4) === 'glTF' && glb.readUInt32LE(4) === 2, 'modell: .glb (glTF 2, binär)');
  h.pruefe(kiste.dreiecke === 12 && json.meshes.length === 1 && json.materials.length === 1, `modell: Kiste mit 12 Dreiecken, ein Mesh, ein Material (${kiste.dreiecke})`);
  let meldung = '';
  try { await baueModelle(ordner, ['kaputt'], { still: true }); } catch (e) { meldung = e.message; }
  h.pruefe(/keine Three\.js-Gruppe/.test(meldung), 'modell: Quelle gibt keine Gruppe zurück → klare Meldung');
}

function manifestTests(ordner) {
  // ordner hat schon Atlas (atlasTests), Sounds (soundTests) und Modelle (modellTests)
  fs.copyFileSync(path.join(__dirname, 'seite', 'assets', 'schriften', 'probe.woff2'), path.join(ordner, 'assets', 'schriften-probe.woff2'));
  fs.mkdirSync(path.join(ordner, 'assets', 'schriften'), { recursive: true });
  fs.renameSync(path.join(ordner, 'assets', 'schriften-probe.woff2'), path.join(ordner, 'assets', 'schriften', 'titel.woff2'));
  schreibe(path.join(ordner, 'assets', 'quellen', 'manifest.json'), JSON.stringify({
    bilder: { kachel: { ersatz: '#00ff00' } }, sounds: { bumm: { laut: 0.6 } }, schriften: { titel: { name: 'Titel' } }, spaeter: ['kiste'] }));
  const { manifest: m, ueber } = schreibeManifest(ordner, { still: true });
  const gelesen = JSON.parse(fs.readFileSync(path.join(ordner, 'assets', 'assets.json'), 'utf8'));
  h.pruefe(/^[0-9a-f]{10}$/.test(gelesen.version) && gelesen.version === m.version, `manifest: assets.json mit Version (${m.version})`);
  h.pruefe(m.atlanten[0].bild === 'atlas/spiel.png' && m.atlanten[0].daten === 'atlas/spiel.json' && m.atlanten[0].breite > 0, 'manifest: Atlas mit Bild, Daten und Größe');
  h.pruefe(m.bilder[0].name === 'kachel' && m.bilder[0].ersatz === '#00ff00' && m.bilder[0].breite === 8, 'manifest: Bild mit Ersatzfarbe und Maßen');
  h.pruefe(m.sounds[0].dateien.join() === 'sounds/bumm.m4a,sounds/bumm.mp3' && m.sounds[0].laut === 0.6, 'manifest: Sound, m4a vor mp3, Lautstärke');
  h.pruefe(m.schriften[0].name === 'Titel' && m.modelle.map((x) => x.name).join() === 'kiste', 'manifest: Schrift mit Namen, Modell');
  const summe = [...m.atlanten, ...m.bilder, ...m.sounds, ...m.schriften, ...m.modelle].filter((e) => e.name !== 'kiste').reduce((s, e) => s + e.bytes, 0);
  const bildspeicher = m.atlanten[0].breite * m.atlanten[0].hoehe * 4 + 8 * 8 * 4;
  h.pruefe(m.budget.startpaketBytes === summe && m.budget.bildspeicherBytes === bildspeicher && !ueber.length,
    `manifest: Budget Startpaket ${m.budget.startpaketBytes} Bytes (ohne „spaeter“), Bildspeicher ${bildspeicher} Bytes = Breite × Höhe × 4`);
  h.pruefe(schreibeManifest(ordner, { still: true }).manifest.version === m.version, 'manifest: gleiche Dateien → gleiche Version');
  fs.appendFileSync(path.join(ordner, 'assets', 'sounds', 'bumm.mp3'), Buffer.from([0]));
  h.pruefe(schreibeManifest(ordner, { still: true }).manifest.version !== m.version, 'manifest: Datei geändert → neue Version (nie vergessenes Hochzählen)');
  const ok = spawnSync(process.execPath, [path.join(WERKZEUGE, 'manifest.js'), ordner], { encoding: 'utf8' });
  h.pruefe(ok.status === 0 && /Budget Startpaket/.test(ok.stdout) && /Bildspeicher/.test(ok.stdout), 'manifest: Aufruf meldet das Budget, Rückgabewert 0');
  schreibe(path.join(ordner, 'assets', 'quellen', 'manifest.json'), JSON.stringify({ budget: { startpaketBytes: 1000 } }));
  const zuViel = spawnSync(process.execPath, [path.join(WERKZEUGE, 'manifest.js'), ordner], { encoding: 'utf8' });
  h.pruefe(zuViel.status === 1 && /ÜBER DEM BUDGET/.test(zuViel.stdout), 'manifest: Startpaket über der Grenze → Meldung und Rückgabewert 1');
  schreibe(path.join(ordner, 'assets', 'quellen', 'manifest.json'), JSON.stringify({ budget: { bildspeicherBytes: 100 } }));
  h.pruefe(spawnSync(process.execPath, [path.join(WERKZEUGE, 'manifest.js'), ordner]).status === 1, 'manifest: Bildspeicher über der Grenze → Rückgabewert 1');
}

(async () => {
  const basis = fs.mkdtempSync(path.join(os.tmpdir(), 'werkzeuge-test-'));
  const spiel = path.join(basis, 'spiel');
  try {
    pngTests(path.join(basis, 'png'));
    atlasTests(spiel);
    soundTests(spiel);
    await modellTests(spiel);
    manifestTests(spiel);
    const kopf = ['png', 'atlas', 'sounds', 'modell', 'manifest'].filter((w) => {
      const text = fs.readFileSync(path.join(WERKZEUGE, `${w}.js`), 'utf8');
      const kommentar = text.slice(0, text.search(/^(const|import|function)/m));
      return !(/Aufruf(-Beispiel)?:/.test(kommentar) && /node |require\(/.test(kommentar));
    });
    h.pruefe(kopf.length === 0, `alle Werkzeuge mit Kopfkommentar und Aufruf-Beispiel ${kopf.join(', ')}`);
  } catch (e) { h.pruefe(false, `Ablauf abgebrochen: ${e.stack}`); }
  fs.rmSync(basis, { recursive: true, force: true });
  h.ergebnis();
})();
