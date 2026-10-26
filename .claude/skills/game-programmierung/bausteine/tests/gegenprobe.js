// Gegenprobe: Taugen die Tests? Baut jeden Baustein absichtlich kaputt (Kopie im Temp-Ordner) und erwartet, dass
// sein Test rot wird. node <skill>/bausteine/tests/gegenprobe.js
// Bleibt ein Test grün, prüft er den Fehler nicht (Lernbuch: eine Gegenprobe gegen den alten Code muss rot sein).
// Passt ein Suchtext nicht mehr (Baustein geändert), meldet die Gegenprobe das, statt still nichts zu prüfen.
// Fälle mit „../werkzeuge/…“ oder „../vorlage/…“ machen ein Werkzeug oder die Gerüst-Vorlage kaputt (der ganze Skill
// wird kopiert, Tests bekommen BAUSTEINE=… und WERKZEUGE=…). Sechstes Feld: zusätzliche Umgebung (z. B. nur 2D).
// NUR=<Text> prüft nur die Fälle, deren Beschreibung den Text enthält (z. B. NUR=Gerüst).
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
  ['ton.js', 'ton', 'if (p) return spielePuffer(p, t);', '', 'Sound-Datei wird nicht abgespielt'],
  ['assets.js', 'assets', 'return Promise.race([arbeit(steuerung.signal), grenze])', 'return arbeit(steuerung.signal)', 'keine Zeitgrenze (hängender Server blockiert)'],
  ['assets.js', 'assets', '    if (anteil <= assets.fortschritt) return;   // nie zurück\n', '', 'Fortschritt meldet doppelt oder rückwärts'],
  ['assets.js', 'assets', 'const voll = (datei) => `${basis}${datei}?v=${encodeURIComponent(assets.version)}`;', 'const voll = (datei) => `${basis}${datei}`;', 'Adressen ohne ?v=<version>'],
  ['assets.js', 'assets', "        else ERSATZ[art](e);\n", '', 'kein Ersatz für fehlende Bilder, Sounds, Schriften, Modelle'],
  ['assets.js', 'assets', '        catch (f) { letzterFehler = f; if (signal.aborted) break; }', '        catch (f) { throw f; }', 'm4a fehlt: kein Versuch mit mp3'],
  ['assets.js', 'assets', '    s.bytes = null;   // decodeAudioData', '    // decodeAudioData', 'Sound wird doppelt dekodiert'],
  ['animation.js', 'animation', '    abspieler.fertig = true;\n    return true;', '    abspieler.fertig = true;\n    return false;', 'einmalige Animation meldet nie „fertig“'],
  ['animation.js', 'animation', "  return animation.schleife ? schritt % anzahl : Math.min(schritt, anzahl - 1);", '  return schritt % anzahl;', 'einmalige Animation springt zurück auf den ersten Rahmen'],
  ['animation.js', 'animation', 'abspieler.zeit += dt * tempo;', 'abspieler.zeit += (1 / 60) * tempo;', 'Rahmen nach Bildern statt nach Zeit'],
  ['animation.js', 'animation', '    ctx.scale(-1, 1);', '    ctx.scale(1, 1);', 'Blick links nicht gespiegelt'],
  ['../werkzeuge/atlas.js', 'werkzeuge', '      for (let k = 0; k < 4; k++) ziel.daten[z + k] = bild.daten[q + k];', '      if (x >= 0 && y >= 0 && x < quelle.b && y < quelle.h) for (let k = 0; k < 4; k++) ziel.daten[z + k] = bild.daten[q + k];', 'Atlas ohne Randverlängerung'],
  ['../werkzeuge/atlas.js', 'werkzeuge', '  const rand = Math.floor(abstand / 2), luecke = abstand - 2 * rand;', '  const rand = 0, luecke = 0;', 'Atlas ohne Abstand'],
  ['../werkzeuge/atlas.js', 'werkzeuge', "ankerX: r.ax - r.teil.x, ankerY: r.ay - r.teil.y", 'ankerX: r.ax, ankerY: r.ay', 'Anker wandert beim Zuschnitt nicht mit'],
  ['../werkzeuge/atlas.js', 'werkzeuge', 'if (y + z.h > hoeheMax) continue;', 'if (false) continue;', 'Atlas wird größer als die Grenze'],
  ['../werkzeuge/sounds.js', 'werkzeuge', "      wandle(wav, dateien[1], 'libmp3lame', kbps);\n", '', 'kein mp3 erzeugt'],
  ['../werkzeuge/manifest.js', 'werkzeuge', "    process.exit(ueber.length ? 1 : 0);", '    process.exit(0);', 'Budget überschritten, aber Rückgabewert 0'],
  ['../werkzeuge/manifest.js', 'werkzeuge', "const merke = (teil) => { fingerabdruck.update(teil); fingerabdruck.update(fs.readFileSync(path.join(assets, teil))); };", 'const merke = (teil) => { fingerabdruck.update(teil); };', 'Version ändert sich nicht, wenn sich eine Datei ändert'],
  ['../vorlage/gemeinsam/js/regeln/spieler.js', 'geruest', 'spieler.x += eingabe.x * tempo * dt;', 'spieler.x += eingabe.x * tempo / 60;', 'Gerüst: Bewegung pro Bild statt nach Zeit', { GERUEST_ARTEN: '2d' }],
  ['../vorlage/gemeinsam/js/main.js', 'geruest', '  beiVersteckt() { joystick.loese(); speicher.speichere(); },', '  beiVersteckt() { speicher.speichere(); },', 'Gerüst: Tab-Wechsel löst den Joystick nicht', { GERUEST_ARTEN: '2d' }],
  ['../vorlage/gemeinsam/js/main.js', 'geruest', '  speicher.stand.rekord = welt.runde.punkte;\n  speicher.merke();', '  speicher.stand.rekord = welt.runde.punkte;', 'Gerüst: Rekord wird nicht gespeichert', { GERUEST_ARTEN: '2d' }],
  ['../vorlage/2d/js/welt/darstellung.js', 'geruest', '    ladeOptionen: { ersatz: baueErsatz },', '    ladeOptionen: {},', 'Gerüst 2D: keine Ersatz-Figur, wenn der Atlas fehlt', { GERUEST_ARTEN: '2d' }],
  ['../vorlage/3d/js/welt/darstellung.js', 'geruest', 'renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, SPIEL.pixelRatioMax));', 'renderer.setPixelRatio(window.devicePixelRatio || 1);', 'Gerüst 3D: Pixel-Ratio nicht begrenzt', { GERUEST_ARTEN: '3d' }],
  ['../werkzeuge/neues-spiel.js', 'geruest', "  schreibe(path.join(ziel, 'tests', 'test-hilfe.js'), fs.readFileSync(path.join(__dirname, 'test-hilfe.js')));\n", '', 'Gerüst ohne Test-Hilfe', { GERUEST_ARTEN: '2d' }],
  ['../werkzeuge/atlas.js', 'werkzeuge', '  if (Array.isArray(eintrag.anker) && eintrag.anker.length === 2) return eintrag.anker;\n', '', 'Fußpunkt aus grafik.json wird nicht übernommen'],
  ['../vorlage/2d/js/welt/darstellung.js', 'geruest', '    f.minY = oben + a.oben + luft;', '    f.minY = luft * 10;', 'Gerüst 2D: oberer Rand fest statt aus Figurgröße und Leiste', { GERUEST_ARTEN: '2d' }],
  ['../vorlage/2d/js/welt/darstellung.js', 'geruest', '        rahmen = baueErsatz().rahmen[SPIELER.rahmen];\n', '', 'Gerüst 2D: fehlender Rahmen → unsichtbare Figur', { GERUEST_ARTEN: '2d' }],
  ['../vorlage/gemeinsam/tests/__NAME__-test.js', 'geruest', 'const lies = (seite, ausdruck, arg) => seite.evaluate(ausdruck, arg);', 'const lies = (seite, ausdruck) => seite.evaluate(ausdruck);', 'Gerüst-Test: lies gibt das Argument nicht weiter', { GERUEST_ARTEN: '2d' }],
  ['../vorlage/gemeinsam/js/main.js', 'geruest', '    for (const [name, s] of Object.entries(welt.assets.sounds)) if (s.puffer) ton.setzePuffer(name, s.puffer, s.laut);', '', 'Gerüst: Sound-Datei wird nie gespielt (nur Code-Klang)', { GERUEST_ARTEN: '2d' }],
  ['../vorlage/gemeinsam/js/config/steuerung.js', 'geruest', "  start: { frequenz: 440,", "  ohne: { frequenz: 440,", 'Gerüst: kein Code-Klang als Ersatz für fehlenden Sound', { GERUEST_ARTEN: '2d' }],
  ['../vorlage/gemeinsam/js/regeln/spieler.js', 'geruest', 'return dx * dx + dy * dy <= beruehrung.radius * beruehrung.radius;', 'return dx * dx + (y - spieler.y) ** 2 < beruehrung.radius * beruehrung.radius;', 'Gerüst: Berührung um den Fuß, Rand zählt nicht', { GERUEST_ARTEN: '2d' }],
  ['../vorlage/gemeinsam/js/regeln/runde.js', 'geruest', 'runde.zeit = dauer == null ? Infinity : dauer;', 'runde.zeit = dauer;', 'Gerüst: RUNDE.dauer null beendet die Runde sofort', { GERUEST_ARTEN: '2d' }],
  ['../werkzeuge/neues-spiel.js', 'geruest', '  if (port == null) port = naechsterPort(ziel);', '  if (port == null) port = 9000;', 'Gerüst: zweites Spiel bekommt denselben Port', { GERUEST_ARTEN: '2d' }],
  ['../werkzeuge/test-hilfe.js', 'geruest', '        vor <= rest || performance.now() > bis ? fertig() : requestAnimationFrame(schau);', '        fertig();', 'laufeZu lässt sofort los (Figur kommt nie an)', { GERUEST_ARTEN: '2d' }],
  ['../werkzeuge/paket.js', 'paket', '    if (!e.isFile() || ABFALL_DATEI.test(e.name) || BILDSCHIRMFOTO.test(e.name)) continue;', '    if (!e.isFile() || ABFALL_DATEI.test(e.name)) continue;', 'Bildschirmfotos landen im Paket'],
  ['../werkzeuge/paket.js', 'paket', 'gepackt = zlib.deflateRawSync(daten, { level: 9 }), crc = crc32(daten);', 'gepackt = zlib.deflateRawSync(daten, { level: 9 }), crc = 0;', 'Zip mit falscher Prüfsumme'],
];

const basis = fs.mkdtempSync(path.join(os.tmpdir(), 'bausteine-gegenprobe-'));
const kopie = path.join(basis, 'game-programmierung');   // ganzer Skill: Gerüst und Paket brauchen Vorlagen und Handbuch
const ziel = path.join(kopie, 'bausteine'), zielWerkzeuge = path.join(kopie, 'werkzeuge');
let schlecht = 0;
const auswahl = FAELLE.filter((f) => !process.env.NUR || f[4].includes(process.env.NUR));
for (const [datei, test, suche, ersatz, fehler, umgebung = {}] of auswahl) {
  fs.rmSync(kopie, { recursive: true, force: true });
  fs.cpSync(path.dirname(ORIGINAL), kopie, { recursive: true });
  const pfad = path.join(ziel, datei), text = fs.readFileSync(pfad, 'utf8');
  if (!text.includes(suche)) { console.log(`VERALTET ${datei}: Suchtext nicht gefunden (${fehler})`); schlecht++; continue; }
  fs.writeFileSync(pfad, text.replace(suche, ersatz));
  const lauf = spawnSync(process.execPath, [path.join(__dirname, `${test}-test.js`)], {
    encoding: 'utf8', env: { ...process.env, ...umgebung, BAUSTEINE: ziel, WERKZEUGE: zielWerkzeuge }, timeout: 240000,
  });
  const rot = (lauf.stdout || '').split('\n').filter((z) => z.startsWith('FEHLER')).length;
  const gut = lauf.status !== 0;
  if (!gut) schlecht++;
  console.log(`${gut ? 'ROT  ' : 'GRÜN!'} ${test}-test bei „${fehler}“ (${rot} Prüfung(en) rot)`);
}
fs.rmSync(basis, { recursive: true, force: true });
console.log(schlecht ? `\n${schlecht} Gegenprobe(n) blieben grün oder sind veraltet: Diese Tests prüfen den Fehler nicht.` : `\nAlle ${auswahl.length} Gegenproben rot: Die Tests finden die Fehler.`);
process.exit(schlecht ? 1 : 0);
