// Regeln ohne Browser aus Übung 3, unverändert weiter geprüft (wird von test.js aufgerufen): Steuerung, Gitter, Pool, Schwarm, Treffer.
const inspector = require('inspector');

const B = 390, H = 664;   // Beispielfeld in Punkten (nur für die Rechenregeln, kein Gerätemaß im Browser-Test)

async function steuerungsRegeln(t, lade) {
  const { rechneEingabe } = await lade('js/steuerung/joystick.js');
  const { erstelleSpieler, bewegeSpieler, starteSprung, aktualisiereSprung } = await lade('js/welt/spieler.js');
  const e = {}, a = {};
  rechneEingabe(100, 100, 50, 0.12, e, a);
  t.pruefe(Math.abs(Math.hypot(e.x, e.y) - 1) < 1e-9, 'Regel (Übung 2): schräg ziehen ergibt Länge 1, nicht √2');
  const s = erstelleSpieler({ x: 100, y: 100, breite: 60, hoehe: 72, leben: 5 });
  t.pruefe(s.leben === 5 && s.unverwundbar === false && s.schutz === 0, 'Regel: Spieler startet mit 5 Leben, verwundbar');
  bewegeSpieler(s, 1, 1, 220, 1, 1000, 1000, 28);
  t.pruefe(Math.abs(Math.hypot(s.x - 100, s.y - 100) - 220) < 1e-9, 'Regel (Übung 2): Richtung (1|1) bewegt 220 Punkte, nicht 311');
  starteSprung(s); aktualisiereSprung(s, 0.41, 0.4);
  t.pruefe(!s.springt, 'Regel (Übung 2): Sprung endet nach 0,4 s');
}

async function gitterRegeln(t, lade) {
  const { erstelleGitter } = await lade('js/kern/gitter.js');
  const g = erstelleGitter(32, 10);
  g.passeAn(-50, -50, 150, 150);
  const xs = [0, 5, 140, -9999], ys = [0, 5, 140, 9999];
  g.fuelle(xs, ys, xs.length);
  const inZelle = (sx, sy) => { const r = []; for (let j = g.erster(sx, sy); j !== -1; j = g.naechster[j]) r.push(j); return r.sort(); };
  t.pruefe(JSON.stringify(inZelle(g.zelleX(0), g.zelleY(0))) === '[0,1]', 'Gitter: zwei nahe Punkte liegen in derselben Zelle');
  t.pruefe(inZelle(g.zelleX(140), g.zelleY(140)).includes(2), 'Gitter: ferner Punkt in seiner eigenen Zelle');
  t.pruefe(g.zelleX(-9999) === 0 && g.zelleY(9999) === g.zeilen - 1 && inZelle(0, g.zeilen - 1).includes(3),
    'Gitter: Punkt weit außerhalb landet in der Randzelle (kein Absturz)');
  g.fuelle(xs, ys, 1);
  t.pruefe(JSON.stringify(inZelle(g.zelleX(0), g.zelleY(0))) === '[0]', 'Gitter: neues Füllen leert die alten Zellen');
}

async function schwarmRegeln(t, lade) {
  const { GEGNER } = await lade('js/config/gegner.js');
  const { erstelleSchwarm, passeSchwarmAn, erzeugeGegner, aktualisiereSchwarm, leereSchwarm, sortiereNachY } = await lade('js/welt/gegner.js');
  const { erstelleZufall } = await lade('js/kern/zufall.js');
  t.pruefe(GEGNER.max === 240, `Grenze aus config: ${GEGNER.max}`);
  t.pruefe(GEGNER.zelle >= GEGNER.radius * GEGNER.trennAbstand, 'Gitterzelle groß genug für den Trennabstand');
  const zufall = erstelleZufall(42), spieler = { x: B / 2, y: H / 2 };
  const s = erstelleSchwarm(GEGNER);
  passeSchwarmAn(s, B, H);
  const vorrat = [s.x, s.y, s.tempo, s.vx, s.vy];

  // Pool: nie über die Grenze, keine neuen Objekte
  let erzeugt = 0;
  for (let i = 0; i < 500; i++) if (erzeugeGegner(s, spieler, B, H, zufall)) erzeugt++;
  t.pruefe(erzeugt === GEGNER.max && s.anzahl === GEGNER.max, `Pool: 500 Versuche → ${s.anzahl} Gegner, Rest abgelehnt`);
  t.pruefe([s.x, s.y, s.tempo, s.vx, s.vy].every((a, i) => a === vorrat[i] && a.length === GEGNER.max), 'Pool: dieselben festen Arrays, nichts Neues angelegt');

  // Erscheinen am Rand: außerhalb des Bildschirms, aber im Rand-Streifen
  const liste = gegnerListe(s);
  const aussen = liste.every((g) => g.x < 0 || g.x > B || g.y < 0 || g.y > H);
  const rand = GEGNER.randTiefe + GEGNER.radius;
  const nah = liste.every((g) => g.x >= -rand - 1e-9 && g.x <= B + rand + 1e-9 && g.y >= -rand - 1e-9 && g.y <= H + rand + 1e-9);
  t.pruefe(aussen && nah, 'Gegner erscheinen außerhalb des Randes im Rand-Streifen');
  const seiten = [liste.some((g) => g.y < 0), liste.some((g) => g.y > H), liste.some((g) => g.x < 0), liste.some((g) => g.x > B)];
  t.pruefe(seiten.every(Boolean), 'Gegner kommen von allen vier Seiten');

  // Spieler am Rand: kein neuer Gegner direkt neben ihm
  const amRand = { x: 30, y: 30 }, s2 = erstelleSchwarm(GEGNER);
  for (let i = 0; i < 200; i++) erzeugeGegner(s2, amRand, B, H, zufall);
  const naechster = Math.min(...gegnerListe(s2).map((g) => Math.hypot(g.x - amRand.x, g.y - amRand.y)));
  t.pruefe(naechster >= GEGNER.abstandSpielerMin - 1e-9, `Spieler in der Ecke: nächster neuer Gegner ${naechster.toFixed(0)} Punkte entfernt`);

  // Ein einzelner Gegner läuft mit seinem Tempo zum Spieler
  leereSchwarm(s);
  t.pruefe(s.anzahl === 0, 'leereSchwarm: alle Gegner zurück in den Vorrat');
  erzeugeGegner(s, spieler, B, H, zufall);
  s.x[0] = 0; s.y[0] = spieler.y;
  s.uhr = -1e9;                        // kein weiterer Gegner während der Messung
  aktualisiereSchwarm(s, spieler, 0.1, B, H, zufall);
  const streu = GEGNER.tempo * GEGNER.tempoStreuung;
  t.pruefe(Math.abs(s.y[0] - spieler.y) < 1e-9 && s.x[0] >= (GEGNER.tempo - streu) * 0.1 - 1e-9 && s.x[0] <= (GEGNER.tempo + streu) * 0.1 + 1e-9,
    `Gegner läuft zum Spieler (${(s.x[0] * 10).toFixed(0)} Punkte/s, Ziel ${GEGNER.tempo} ± ${GEGNER.tempoStreuung * 100} %)`);

  // Erscheinen nach Zeitplan
  leereSchwarm(s);
  for (let i = 0; i < 60; i++) aktualisiereSchwarm(s, spieler, 1 / 60, B, H, zufall);
  const erwartet = Math.floor(1 / GEGNER.erscheinenAlle);
  t.pruefe(Math.abs(s.anzahl - erwartet) <= 1, `in 1 s erscheinen ${s.anzahl} Gegner (alle ${String(GEGNER.erscheinenAlle).replace(".", ",")} s)`);

  // Gefroren: niemand bewegt sich, niemand erscheint
  const vorher = JSON.stringify(gegnerListe(s)), anzahlVorher = s.anzahl;
  s.gefroren = true;
  for (let i = 0; i < 60; i++) aktualisiereSchwarm(s, spieler, 1 / 60, B, H, zufall);
  t.pruefe(s.anzahl === anzahlVorher && JSON.stringify(gegnerListe(s)) === vorher, 'gefroren: keine Bewegung, keine neuen Gegner');
  s.gefroren = false;

  // Zwei Gegner genau aufeinander werden sanft getrennt (kein Sprung)
  leereSchwarm(s);
  erzeugeGegner(s, spieler, B, H, zufall); erzeugeGegner(s, spieler, B, H, zufall);
  s.x[0] = s.x[1] = 100; s.y[0] = s.y[1] = 100;
  const sp2 = { x: 100, y: 1e6 };      // Spieler weit weg: beide laufen gleich, nur der Trennschub ändert den Abstand
  s.uhr = -1e9;
  aktualisiereSchwarm(s, sp2, 1 / 60, B, H, zufall);
  const schritt1 = Math.hypot(s.x[0] - s.x[1], s.y[0] - s.y[1]);
  for (let i = 0; i < 120; i++) aktualisiereSchwarm(s, sp2, 1 / 60, B, H, zufall);
  const danach = Math.hypot(s.x[0] - s.x[1], s.y[0] - s.y[1]);
  const mindest = GEGNER.radius * GEGNER.trennAbstand;
  t.pruefe(schritt1 > 0 && schritt1 < mindest * 0.6, `deckungsgleiche Gegner: im ersten Bild ${schritt1.toFixed(1)} von ${mindest} Punkten auseinander (sanft, nicht hart)`);
  t.pruefe(danach >= GEGNER.radius * GEGNER.trennAbstand * 0.9, `nach 2 s ${danach.toFixed(1)} Punkte Abstand (Ziel ${GEGNER.radius * GEGNER.trennAbstand})`);

  // 240 Gegner im Gedränge um den Spieler: nicht stark überlappt
  leereSchwarm(s);
  for (let i = 0; i < GEGNER.max; i++) erzeugeGegner(s, spieler, B, H, zufall);
  for (let i = 0; i < 60 * 20; i++) aktualisiereSchwarm(s, spieler, 1 / 60, B, H, zufall);
  const { kleinster, stark } = abstaende(s, GEGNER.radius);
  t.pruefe(stark === 0 && kleinster >= GEGNER.radius * 1.5,
    `240 Gegner nach 20 s: kleinster Abstand ${kleinster.toFixed(1)} Punkte (Berührung bei ${2 * GEGNER.radius}), 0 Paare über halb überlappt`);
  const amSpieler = gegnerListe(s).some((g) => Math.hypot(g.x - spieler.x, g.y - spieler.y) < GEGNER.radius * 2);
  t.pruefe(amSpieler, 'im Gedränge erreichen Gegner trotzdem den Spieler');

  // Sortierung zum Zeichnen
  sortiereNachY(s);
  let sortiert = true;
  for (let i = 1; i < s.anzahl; i++) if (s.y[s.reihenfolge[i - 1]] > s.y[s.reihenfolge[i]]) sortiert = false;
  const alle = new Set(s.reihenfolge.slice(0, s.anzahl));
  t.pruefe(sortiert && alle.size === s.anzahl, 'Zeichenreihenfolge nach y sortiert, jeder Gegner genau einmal');

  // Keine neuen Objekte in der Schleife: Speicher-Stichproben (V8-Heap-Profiler) während 20.000 Schritten.
  const schritt = () => aktualisiereSchwarm(s, spieler, 1 / 60, B, H, zufall);
  const angelegt = await angelegterSpeicher(schritt, 20000, /welt\/gegner\.js|kern\/gitter\.js/);
  t.pruefe(angelegt / 20000 < 4, `20.000 Schritte mit 240 Gegnern: ${(angelegt / 20000).toFixed(1).replace(".", ",")} Byte neuer Speicher pro Schritt (Ziel: fast 0)`);
  const gegenprobe = await angelegterSpeicher(() => { schritt(); gegnerListe(s); }, 2000, /stufe-4\/test-regeln\.js|welt\/gegner\.js/);
  t.pruefe(gegenprobe / 2000 > 1000, `Gegenprobe: Code mit neuen Objekten zeigt ${(gegenprobe / 2000).toFixed(0)} Byte pro Schritt (die Messung wirkt)`);
}

// Aktive Gegner als Liste { x, y } (nur im Test, legt bewusst neue Objekte an).
function gegnerListe(s) { return Array.from({ length: s.anzahl }, (_, i) => ({ x: s.x[i], y: s.y[i] })); }

function abstaende(s, radius) {
  let kleinster = Infinity, stark = 0;
  for (let i = 0; i < s.anzahl; i++) for (let j = i + 1; j < s.anzahl; j++) {
    const d = Math.hypot(s.x[i] - s.x[j], s.y[i] - s.y[j]);
    if (d < kleinster) kleinster = d;
    if (d < radius) stark++;
  }
  return { kleinster, stark };
}

// Bytes, die f in `mal` Aufrufen neu anlegt (nur Dateien, die zu `dateien` passen). Heap-Profiler mit Stichproben
// alle 64 Byte, auch für Objekte, die gleich wieder weggeräumt werden. Vorher aufwärmen, damit Übersetzen nicht zählt.
async function angelegterSpeicher(f, mal, dateien) {
  for (let i = 0; i < 2000; i++) f();
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

async function trefferRegeln(t, lade) {
  const { GEGNER } = await lade('js/config/gegner.js');
  const { SPIELER } = await lade('js/config/spieler.js');
  const { erstelleSchwarm, erzeugeGegner } = await lade('js/welt/gegner.js');
  const { aktualisiereSchutz, pruefeTreffer } = await lade('js/welt/treffer.js');
  const { erstelleSpieler } = await lade('js/welt/spieler.js');
  const { erstelleZufall } = await lade('js/kern/zufall.js');
  t.pruefe(SPIELER.leben === 5 && SPIELER.schutzZeit === 1, 'Leben 5 und Schutz 1 s aus config');
  const sp = erstelleSpieler({ x: 200, y: 300, breite: 60, hoehe: 72, leben: SPIELER.leben });
  const s = erstelleSchwarm(GEGNER);
  erzeugeGegner(s, sp, B, H, erstelleZufall(1));
  erzeugeGegner(s, sp, B, H, erstelleZufall(2));
  const beruehrung = SPIELER.trefferRadius + GEGNER.radius;
  s.x[0] = sp.x + beruehrung + 1; s.y[0] = sp.y;
  s.x[1] = sp.x; s.y[1] = sp.y + beruehrung + 1;
  t.pruefe(!pruefeTreffer(sp, s, SPIELER.trefferRadius, SPIELER.schutzZeit) && sp.leben === 5, 'knapp daneben: kein Treffer');
  s.x[0] = sp.x + beruehrung - 1;
  s.y[1] = sp.y + beruehrung - 1;   // zwei Gegner berühren gleichzeitig
  const treffer = pruefeTreffer(sp, s, SPIELER.trefferRadius, SPIELER.schutzZeit);
  t.pruefe(treffer && sp.leben === 4 && sp.unverwundbar && sp.schutz === 1, 'zwei Gegner gleichzeitig: genau 1 Leben weniger, 1 s Schutz');
  // Gegner bleiben dran: während der Schutzzeit nichts, danach der nächste Treffer
  let zeit = 0;
  const dt = 1 / 60;
  while (sp.leben === 4 && zeit < 3) { zeit += dt; aktualisiereSchutz(sp, dt); pruefeTreffer(sp, s, SPIELER.trefferRadius, SPIELER.schutzZeit); }
  t.pruefe(sp.leben === 3 && Math.abs(zeit - 1) < dt * 1.5, `nächster Treffer erst nach ${zeit.toFixed(2)} s Schutz`);
  for (let i = 0; i < 60 * 10; i++) { aktualisiereSchutz(sp, dt); pruefeTreffer(sp, s, SPIELER.trefferRadius, SPIELER.schutzZeit); }
  t.pruefe(sp.leben === 0, `nach 10 s im Gedränge: Leben ${sp.leben}, nie unter 0`);
}

module.exports = async function regelTests(t, lade) {
  await steuerungsRegeln(t, lade);
  await gitterRegeln(t, lade);
  await schwarmRegeln(t, lade);
  await trefferRegeln(t, lade);
};
