// Gemeinsame Hilfen für die Baustein-Tests (ohne Browser).
//   const h = require('./hilfe.js');
//   const { erstellePool } = await h.lade('pool.js');   h.pruefe(bedingung, 'Text');   h.ergebnis();
// BAUSTEINE=<ordner> testet eine Kopie (Gegenprobe mit absichtlichen Fehlern, siehe gegenprobe.js).
const path = require('path');
const inspector = require('inspector');
const { pathToFileURL } = require('url');

const ORDNER = process.env.BAUSTEINE ? path.resolve(process.env.BAUSTEINE) : path.resolve(__dirname, '..');

let fehlerZahl = 0;
function pruefe(bedingung, text) {
  console.log(`${bedingung ? 'OK   ' : 'FEHLER'} ${text}`);
  if (!bedingung) fehlerZahl++;
  return Boolean(bedingung);
}
function ergebnis() {
  console.log(fehlerZahl ? `\n${fehlerZahl} Prüfung(en) fehlgeschlagen.` : '\nAlle Prüfungen bestanden.');
  process.exit(fehlerZahl ? 1 : 0);
}

const lade = (datei) => import(pathToFileURL(path.join(ORDNER, datei)).href);

const komma = (z, stellen = 2) => z.toFixed(stellen).replace('.', ',');

// Bytes, die f in `mal` Aufrufen neu anlegt, nur in Dateien, die zu `dateien` passen (Heap-Profiler mit Stichproben
// alle 64 Byte, auch für sofort wieder weggeräumte Objekte). Vorher aufwärmen: Selten gerufene Funktionen bleiben in V8
// lange im Interpreter und legen dort für jede Kommazahl Speicher an (Lernbuch Stufe 4), das ist kein Leck.
async function angelegterSpeicher(f, mal, dateien, aufwaermen = 2000) {
  for (let i = 0; i < aufwaermen; i++) f();
  const sitzung = new inspector.Session();
  sitzung.connect();
  const sende = (befehl, werte) => new Promise((ok, fehler) => sitzung.post(befehl, werte, (e, r) => (e ? fehler(e) : ok(r))));
  await sende('HeapProfiler.startSampling', { samplingInterval: 64, includeObjectsCollectedByMajorGC: true, includeObjectsCollectedByMinorGC: true });
  for (let i = 0; i < mal; i++) f();
  const { profile } = await sende('HeapProfiler.stopSampling');
  sitzung.disconnect();
  let summe = 0;
  (function zaehle(knoten) {
    if (dateien.test(knoten.callFrame.url)) summe += knoten.selfSize;
    knoten.children.forEach(zaehle);
  })(profile.head);
  return summe;
}

module.exports = { ORDNER, pruefe, ergebnis, lade, komma, angelegterSpeicher };
