// Test für Übung 7 (3D mit Three.js): node ausbildung/uebungen/stufe-7/test.js
// ORDNER=<anderer Ordner> lässt denselben Test gegen eine Kopie laufen (Gegenprobe).
const t = require('../../../werkzeuge/test-hilfe.js');
const path = require('path');
const { pathToFileURL } = require('url');

const ORDNER = process.env.ORDNER || 'ausbildung/uebungen/stufe-7';
const PORT = 8870;
const FOTO = process.env.FOTO || '/tmp/uebung-7.png';
const lade = (datei) => import(pathToFileURL(path.resolve(t.REPO, ORDNER, datei)));
const nah = (a, b, toleranz) => Math.abs(a - b) <= toleranz;

// Reine Regeln ohne Browser (Module ohne Three.js).
async function regelTests() {
  const { erstelleFahrt, fahre, dreheZu } = await lade('js/welt/fahrt.js');
  const { bereiteWellenVor, welleHoehe, hoechsteWelle } = await lade('js/welt/wellen.js');
  const { erstelleBojen, pruefeBeruehrung, aktualisiereHuepfen, huepfHoehe } = await lade('js/welt/bojen-regeln.js');
  const { folgeKamera } = await lade('js/welt/kamera-folge.js');
  const { erstelleZufall } = await lade('js/kern/zufall.js');
  const { BOOT } = await lade('js/config/boot.js');
  const { BOJEN } = await lade('js/config/bojen.js');
  const { WELLEN } = await lade('js/config/wasser.js');

  const b = erstelleFahrt();
  fahre(b, 0, -1, 6, 7, 1);
  t.pruefe(b.z === -6 && b.x === 0, 'Regel: Joystick oben (y = −1) fährt nach −z');
  t.pruefe(nah(b.richtung, 0, 1e-9), 'Regel: Bug zeigt bei Fahrt nach −z geradeaus (Richtung 0)');
  fahre(b, 1, 0, 6, 7, 1);
  t.pruefe(b.x === 6 && b.z === -6, 'Regel: Joystick rechts fährt nach +x');
  const s = erstelleFahrt();
  fahre(s, 1, 1, 6, 7, 1);
  t.pruefe(nah(Math.hypot(s.x, s.z), 6, 1e-9), 'Regel: schräg ist nicht schneller als gerade');
  const vorher = { ...s };
  fahre(s, 0, 0, 6, 7, 1);
  t.pruefe(s.x === vorher.x && s.z === vorher.z, 'Regel: ohne Eingabe steht das Boot sofort');
  const l = erstelleFahrt();
  for (let i = 0; i < 100; i++) fahre(l, -1, 0, 6, 7, 0.05);
  t.pruefe(nah(l.richtung, Math.PI / 2, 1e-3), 'Regel: Bug dreht sich zur Fahrtrichtung (links = +90°)');
  t.pruefe(nah(dreheZu(3, -3, 0.5), Math.PI, 0.01), 'Regel: Drehen nimmt den kürzeren Weg über ±180°');
  const halb = erstelleFahrt();
  fahre(halb, 0, -0.5, 6, 7, 1);
  t.pruefe(halb.z === -3, 'Regel: halber Ausschlag = halbes Tempo');

  const w = bereiteWellenVor(WELLEN);
  let hoch = 0, tief = 0;
  for (let x = -40; x <= 40; x += 0.7) for (let z = -40; z <= 40; z += 0.9) {
    const h = welleHoehe(w, x, z, 3.3); hoch = Math.max(hoch, h); tief = Math.min(tief, h);
  }
  t.pruefe(hoch > 0.1 && tief < -0.1 && hoch <= hoechsteWelle(w) && -tief <= hoechsteWelle(w), `Regel: Wellen sichtbar und begrenzt (${tief.toFixed(2)} … ${hoch.toFixed(2)} m)`);
  t.pruefe(welleHoehe(w, 2, 3, 1) !== welleHoehe(w, 2, 3, 1.5), 'Regel: Wellen bewegen sich mit der Zeit');

  const bojen = erstelleBojen(BOJEN, erstelleZufall(42));
  const nochmal = erstelleBojen(BOJEN, erstelleZufall(42));
  t.pruefe(bojen.anzahl === 30 && BOJEN.anzahl === 30, 'Regel: 30 Bojen (config)');
  t.pruefe(bojen.x.every((x, i) => x === nochmal.x[i] && bojen.z[i] === nochmal.z[i]), 'Regel: gleicher Seed, gleiche Bojen');
  let kleinster = Infinity, startAbstand = Infinity, imBereich = true;
  for (let i = 0; i < 30; i++) {
    startAbstand = Math.min(startAbstand, Math.hypot(bojen.x[i], bojen.z[i]));
    if (Math.abs(bojen.x[i]) > BOJEN.bereich || Math.abs(bojen.z[i]) > BOJEN.bereich) imBereich = false;
    for (let j = 0; j < i; j++) kleinster = Math.min(kleinster, Math.hypot(bojen.x[i] - bojen.x[j], bojen.z[i] - bojen.z[j]));
  }
  t.pruefe(imBereich && kleinster >= BOJEN.abstandMin && startAbstand >= BOJEN.startFrei,
    `Regel: Bojen verteilt (kleinster Abstand ${kleinster.toFixed(1)} m, zum Start ${startAbstand.toFixed(1)} m)`);

  pruefeBeruehrung(bojen, bojen.x[3], bojen.z[3], BOOT.radius, BOJEN.radius);
  t.pruefe(bojen.huepfZeit[3] === 0 && bojen.huepfer === 1, 'Regel: Berührung lässt genau diese Boje hüpfen');
  aktualisiereHuepfen(bojen, BOJEN.huepfDauer / 2, BOJEN.huepfDauer);
  t.pruefe(nah(huepfHoehe(bojen, 3, BOJEN.huepfDauer, BOJEN.huepfHoehe), BOJEN.huepfHoehe, 1e-9), 'Regel: in der Mitte des Hüpfers ganz oben');
  pruefeBeruehrung(bojen, bojen.x[3], bojen.z[3], BOOT.radius, BOJEN.radius);
  aktualisiereHuepfen(bojen, BOJEN.huepfDauer, BOJEN.huepfDauer);
  pruefeBeruehrung(bojen, bojen.x[3], bojen.z[3], BOOT.radius, BOJEN.radius);
  t.pruefe(bojen.huepfZeit[3] === -1 && bojen.huepfer === 1 && huepfHoehe(bojen, 3, BOJEN.huepfDauer, BOJEN.huepfHoehe) === 0,
    'Regel: Hüpfer endet nach huepfDauer; Boot bleibt dran → kein Dauerhüpfen');
  pruefeBeruehrung(bojen, 1000, 1000, BOOT.radius, BOJEN.radius);
  pruefeBeruehrung(bojen, bojen.x[3], bojen.z[3], BOOT.radius, BOJEN.radius);
  t.pruefe(bojen.huepfer === 2, 'Regel: wegfahren und wieder ran → hüpft erneut');

  // Kamera: gleicher Weg bei 60 und bei 10 Bildern pro Sekunde (Nachziehen hängt nicht von der Bildrate ab).
  const k60 = { x: 0, y: 0, z: 0 }, k10 = { x: 0, y: 0, z: 0 };
  for (let i = 0; i < 60; i++) folgeKamera(k60, 10, 5, 3, 4, 1 / 60);
  for (let i = 0; i < 10; i++) folgeKamera(k10, 10, 5, 3, 4, 1 / 10);
  t.pruefe(nah(k60.x, k10.x, 1e-9) && nah(k60.z, k10.z, 1e-9) && k60.x > 9.5, 'Regel: Kamera zieht unabhängig von der Bildrate nach');
}

// Im Browser: Abstand Kamera–Boot und Zeichenaufrufe in jedem Bild mitschreiben, bis stoppeMessung().
function starteMessung() {
  const m = { min: Infinity, max: 0, aufrufeMax: 0, bilder: 0, laeuft: true };
  window.messung = m;
  (function schritt() {
    if (!m.laeuft) return;
    const k = window.spiel.kamera, b = window.spiel.boot;
    const d = Math.hypot(k.x - b.x, k.y, k.z - b.z);
    m.min = Math.min(m.min, d); m.max = Math.max(m.max, d);
    m.aufrufeMax = Math.max(m.aufrufeMax, window.spiel.renderer.info.render.calls);
    m.bilder++;
    requestAnimationFrame(schritt);
  })();
}
const stoppeMessung = (seite) => seite.evaluate(() => { window.messung.laeuft = false; return { ...window.messung }; });
const lage = (seite) => seite.evaluate(() => {
  const k = window.spiel.kamera, b = window.spiel.boot;
  return { bx: b.x, bz: b.z, kx: k.x, ky: k.y, kz: k.z, abstand: Math.hypot(k.x - b.x, k.y, k.z - b.z), eingabe: { ...window.spiel.test.eingabe } };
});

(async () => {
  await regelTests();
  const { KAMERA } = await lade('js/config/kamera.js');
  const sollAbstand = Math.hypot(KAMERA.versatzY, KAMERA.versatzZ);

  const lauf = await t.starte({ ordner: ORDNER, port: PORT, pfad: 'index.html?seed=42&test=1' });
  const { seite } = lauf;
  try {
    // Seite und Renderer
    const info = await seite.evaluate(() => {
      const r = window.spiel.renderer, c = r.domElement;
      const instanzen = [];
      window.spiel.szene.traverse((o) => { if (o.isInstancedMesh) instanzen.push({ anzahl: o.count, geometrie: o.geometry.uuid }); });
      return {
        dpr: devicePixelRatio, pr: r.getPixelRatio(), cb: c.width, ch: c.height, iw: innerWidth, ih: innerHeight,
        rect: c.getBoundingClientRect().toJSON(), instanzen, test: Boolean(window.spiel.test),
        kamera: window.spiel.kamera.isVector3, schattenAn: r.shadowMap.enabled,
      };
    });
    t.pruefe(info.pr <= 2 && info.pr === Math.min(info.dpr, 2), `Pixel-Ratio ${info.pr} (Gerät ${info.dpr}), höchstens 2`);
    t.pruefe(info.cb === Math.round(info.iw * info.pr) && info.ch === Math.round(info.ih * info.pr), `Bildfläche ${info.cb} × ${info.ch} = Bildschirm × Pixel-Ratio`);
    t.pruefe(info.rect.width === info.iw && info.rect.height === info.ih, 'Bild füllt den Bildschirm');
    t.pruefe(info.instanzen.length === 1 && info.instanzen[0].anzahl === 30, `30 Bojen als ein InstancedMesh (eine Geometrie): ${JSON.stringify(info.instanzen.map((i) => i.anzahl))}`);
    t.pruefe(!info.schattenAn, 'keine echten Schatten (shadowMap aus)');

    const start = await lage(seite);
    t.pruefe(start.bx === 0 && start.bz === 0 && nah(start.abstand, sollAbstand, 0.01), `Start: Boot in der Mitte, Kamera ${start.abstand.toFixed(2)} m entfernt`);
    t.pruefe(start.ky > 0 && start.kz > start.bz, 'Kamera schräg von oben (über und hinter dem Boot)');

    // Joystick oben → Boot fährt nach −z; Kamera folgt; Zeichenaufrufe in jedem Bild ≤ 20.
    await seite.evaluate(starteMessung);
    const finger = await t.ziehe(seite, 100, 520, 100, 420, { halteMs: 1500, loslassen: false });
    const waehrend = await lage(seite);
    t.pruefe(waehrend.eingabe.aktiv && waehrend.eingabe.y < -0.9, `Joystick gehalten: eingabe.y ${waehrend.eingabe.y.toFixed(2)}`);
    const sichtbar = await seite.evaluate(() => !document.getElementById('joystick-ring').hidden && !document.getElementById('joystick-daumen').hidden);
    t.pruefe(sichtbar, 'Joystick ist sichtbar, solange der Daumen liegt');
    await seite.screenshot({ path: FOTO.replace('.png', '-fahrt.png') });
    t.pruefe(waehrend.bz < -1 && Math.abs(waehrend.bx) < 0.05, `Joystick oben: Boot fährt nach −z (z = ${waehrend.bz.toFixed(2)}, x = ${waehrend.bx.toFixed(3)})`);
    t.pruefe(waehrend.kz < start.kz - 1 && Math.abs(waehrend.kx) < 0.05, `Kamera fährt mit (z ${start.kz.toFixed(1)} → ${waehrend.kz.toFixed(1)})`);
    await finger.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await seite.waitForTimeout(100);
    const los = await lage(seite);
    t.pruefe(!los.eingabe.aktiv && los.eingabe.x === 0 && los.eingabe.y === 0, 'Loslassen setzt die Eingabe zurück');
    await seite.waitForTimeout(600);
    const steht = await lage(seite);
    t.pruefe(steht.bx === los.bx && steht.bz === los.bz, `Loslassen stoppt: Boot steht (z ${los.bz.toFixed(3)} → ${steht.bz.toFixed(3)})`);
    const nichtSichtbar = await seite.evaluate(() => document.getElementById('joystick-ring').hidden);
    t.pruefe(nichtSichtbar, 'Joystick verschwindet nach dem Loslassen');
    await seite.waitForTimeout(1200);
    const messung = await stoppeMessung(seite);
    const ruhe = await lage(seite);
    t.pruefe(messung.bilder > 30, `Messung über ${messung.bilder} Bilder`);
    t.pruefe(messung.min >= sollAbstand * 0.85 && messung.max <= sollAbstand * 1.15,
      `Kamera folgt mit fast gleichem Abstand: ${messung.min.toFixed(2)} … ${messung.max.toFixed(2)} m (Soll ${sollAbstand.toFixed(2)} ± 15 %)`);
    t.pruefe(nah(ruhe.abstand, sollAbstand, sollAbstand * 0.03), `Nach dem Halt kommt die Kamera wieder auf ${ruhe.abstand.toFixed(2)} m`);
    t.pruefe(messung.aufrufeMax <= 20, `höchstens 20 Zeichenaufrufe pro Bild (gemessen höchstens ${messung.aufrufeMax})`);
    const dreiecke = await seite.evaluate(() => window.spiel.renderer.info.render.triangles);
    t.pruefe(dreiecke < 100000, `Dreiecke pro Bild: ${dreiecke}`);

    // Andere Richtungen: rechts → +x; Tippen und Ziehen in der rechten Hälfte bewegt nichts.
    const vorRechts = await lage(seite);
    await t.ziehe(seite, 100, 420, 200, 420, { halteMs: 400 });
    const nachRechts = await lage(seite);
    t.pruefe(nachRechts.bx > vorRechts.bx + 1 && nah(nachRechts.bz, vorRechts.bz, 0.05), `Joystick rechts: Boot fährt nach +x (${vorRechts.bx.toFixed(2)} → ${nachRechts.bx.toFixed(2)})`);
    await t.tippe(seite, 300, 400);
    await t.ziehe(seite, 300, 500, 300, 380, { halteMs: 300 });
    await seite.waitForTimeout(200);
    const rechtsHaelfte = await lage(seite);
    t.pruefe(rechtsHaelfte.bx === nachRechts.bx && rechtsHaelfte.bz === nachRechts.bz && !rechtsHaelfte.eingabe.aktiv, 'Tippen und Ziehen in der rechten Hälfte bewegt nichts');

    // Abbruch durch das System (pointercancel) stoppt ebenfalls.
    const abbruch = await t.ziehe(seite, 100, 500, 100, 400, { halteMs: 200, loslassen: false });
    await abbruch.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    await seite.waitForTimeout(100);
    const nachAbbruch = await lage(seite);
    await seite.waitForTimeout(400);
    const danach = await lage(seite);
    t.pruefe(!danach.eingabe.aktiv && danach.bz === nachAbbruch.bz, 'Abbruch (touchCancel) stoppt das Boot');

    // Boje berühren → sie hüpft (Höhe im InstancedMesh steigt), danach liegt sie wieder.
    const bojeHoehe = (i) => seite.evaluate((n) => {
      let mesh = null;
      window.spiel.szene.traverse((o) => { if (o.isInstancedMesh) mesh = o; });
      return mesh.instanceMatrix.array[n * 16 + 13];
    }, i);
    const ruhig = await bojeHoehe(5);
    const boje = await seite.evaluate(() => ({ x: window.spiel.test.bojen.x[5], z: window.spiel.test.bojen.z[5], huepfer: window.spiel.test.bojen.huepfer }));
    await seite.evaluate(({ x, z }) => window.spiel.test.setzeBoot(x, z), boje);
    await seite.waitForTimeout(250);
    const imSprung = await bojeHoehe(5);
    const zustand = await seite.evaluate(() => ({ zeit: window.spiel.test.bojen.huepfZeit[5], huepfer: window.spiel.test.bojen.huepfer }));
    t.pruefe(zustand.huepfer === boje.huepfer + 1 && zustand.zeit >= 0, 'Boot auf der Boje: genau diese Boje hüpft');
    t.pruefe(imSprung > ruhig + 0.5, `Boje springt sichtbar hoch (${ruhig.toFixed(2)} → ${imSprung.toFixed(2)} m)`);
    await seite.screenshot({ path: FOTO.replace('.png', '-boje.png') });
    await seite.evaluate(() => window.spiel.test.setzeBoot(0, 0));
    await seite.waitForTimeout(1000);
    const wieder = await bojeHoehe(5);
    t.pruefe(Math.abs(wieder - ruhig) < 0.8 && wieder < imSprung - 0.5, `Nach dem Hüpfer schwimmt sie wieder (${wieder.toFixed(2)} m)`);

    const bildrate = await t.bildrate(seite, 1500);
    console.log(`       (Bildrate im Test-Browser mit Software-Grafik: ${bildrate.toFixed(0)} Bilder/s)`);
    await seite.screenshot({ path: FOTO });
    t.pruefe(lauf.fehler.length === 0, `keine Konsolenfehler ${lauf.fehler.join(' | ')}`);
  } catch (e) { t.pruefe(false, `Ablauf abgebrochen: ${e.message}`); }
  await lauf.ende();

  // Ohne ?test=1 gibt es keine Test-Hilfen.
  const ohne = await t.starte({ ordner: ORDNER, port: PORT, pfad: 'index.html?seed=42' });
  try {
    const da = await ohne.seite.evaluate(() => ({ test: 'test' in window.spiel, felder: ['bereit', 'boot', 'kamera', 'renderer', 'szene'].every((f) => window.spiel[f]) }));
    t.pruefe(!da.test && da.felder, 'ohne ?test=1: Schnittstelle vollständig, kein spiel.test');
    t.pruefe(ohne.fehler.length === 0, `keine Konsolenfehler ohne ?test=1 ${ohne.fehler.join(' | ')}`);
  } catch (e) { t.pruefe(false, `Ablauf ohne test abgebrochen: ${e.message}`); }
  await ohne.ende();
  t.ergebnis();
})();
