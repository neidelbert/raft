// Test für Übung 5 (Fehlersuche Pilzsammler): node ausbildung/uebungen/stufe-5/test.js
// Gegen die unveränderte Vorlage (zeigt die Fehler rot): ORDNER=ausbildung/vorlagen/pilzsammler node ausbildung/uebungen/stufe-5/test.js
// Je gemeldetem Fehler ein Block: 1 langsames Gerät, 2 Loslassen, 3 zwei Pilze verschwinden, 4 privater Modus.
const t = require('../../../werkzeuge/test-hilfe.js');

const ORDNER = process.env.ORDNER || 'ausbildung/uebungen/stufe-5';
const PORT = 8850; // Ports 8850–8854, je Browser-Start einer
const TEMPO = 240;  // erwartete Punkte pro Sekunde, wie js/config/spiel.js (SPIELER.tempo); Vorlage: 4 pro Bild bei 60 Bildern/s
const SAMMELABSTAND = 34; // wie PILZE.sammelAbstand
const MAXSCHRITT = 0.1;   // wie ZEIT.maxSchritt
const komma = (z, s = 0) => z.toFixed(s).replace('.', ',');
const warte = (seite, ms) => seite.waitForTimeout(ms);
const lies = (seite) => seite.evaluate(() => ({
  x: window.spiel.spieler.x, y: window.spiel.spieler.y, ex: window.spiel.eingabe.x, ey: window.spiel.eingabe.y,
  pilze: window.spiel.pilze.length, punkte: window.spiel.punkte, rekord: window.spiel.rekord,
  anzeige: document.getElementById('anzeige').textContent, iw: innerWidth, ih: innerHeight,
}));
// Mitte des Joysticks aus dem echten Element (nicht fest eingetragen)
const joystickMitte = (seite) => seite.evaluate(() => {
  const r = document.getElementById('joystick').getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
});
// Beobachtet die Figur über ms Millisekunden: Liste der x-Werte pro Bild
const beobachte = (seite, ms) => seite.evaluate((dauer) => new Promise((fertig) => {
  const werte = []; const start = performance.now();
  (function bild() { werte.push(window.spiel.spieler.x); performance.now() - start < dauer ? requestAnimationFrame(bild) : fertig(werte); })();
}), ms);
// Misst die Geschwindigkeit der Figur (Punkte pro Sekunde) bei vollem Ausschlag nach rechts.
async function messeTempo(seite) {
  const m = await joystickMitte(seite);
  await seite.evaluate(() => window.spiel.test.setzeSpieler(60, innerHeight / 3));
  const cdp = await t.ziehe(seite, m.x, m.y, m.x + 60, m.y, { loslassen: false });
  // Gemessen wird in Bildern (requestAnimationFrame-Zeitstempel). Ein einzelnes Bild zählt höchstens 0,1 s,
  // genau wie im Spiel gewollt: Hängt der Test-Browser einmal (gemessen bis 170 ms), springt die Figur nicht.
  const messung = await seite.evaluate((maxSchritt) => new Promise((fertig) => {
    let x0 = null, vorher = 0, zeit = 0, bilder = 0;
    requestAnimationFrame(function bild(ts) {
      if (x0 === null) { x0 = window.spiel.spieler.x; vorher = ts; return requestAnimationFrame(bild); }
      zeit += Math.min(ts - vorher, maxSchritt * 1000) / 1000; vorher = ts; bilder++;
      if (zeit < 0.8) return requestAnimationFrame(bild);
      fertig({ weg: window.spiel.spieler.x - x0, zeit, bilder });
    });
  }), MAXSCHRITT);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  if (process.env.DEBUG) console.log(messung);
  return { tempo: messung.weg / messung.zeit, bildrate: messung.bilder / messung.zeit };
}
// Startet eine Seite; bei kaputtem Start (Vorlage im privaten Modus) wird nicht ewig gewartet.
async function oeffne(port, initSkript) {
  const lauf = await t.starte({ ordner: ORDNER, port, pfad: 'index.html?test=1', warteAuf: null, initSkript });
  const bereit = await lauf.seite.waitForFunction('window.spiel && window.spiel.bereit', null, { timeout: 3000 }).then(() => true, () => false);
  return { ...lauf, bereit };
}

async function teilSteuerungUndPilze() {
  const lauf = await oeffne(PORT);
  const { seite } = lauf;
  try {
    const start = await lies(seite);
    t.pruefe(lauf.bereit && start.pilze === 8 && start.punkte === 0, `Start: bereit, 8 Pilze, 0 Punkte`);
    const typen = await seite.evaluate(() => [window.spiel.spieler.x, window.spiel.eingabe.x, window.spiel.punkte, window.spiel.rekord,
      window.spiel.test.setzePilze, window.spiel.test.setzeSpieler].map((w) => typeof w).join(' '));
    t.pruefe(typen === 'number number number number function function', `Schnittstelle unverändert (${typen})`);
    await seite.evaluate(() => window.spiel.test.setzePilze([]));

    // Fehler 1: Tempo hängt nicht von der Bildrate ab
    const normal = await messeTempo(seite);
    await seite.evaluate(() => {
      window.__bremse = true;
      (function beschaeftige() { const bis = performance.now() + 40; while (performance.now() < bis); if (window.__bremse) requestAnimationFrame(beschaeftige); })();
    });
    const langsam = await messeTempo(seite);
    await seite.evaluate(() => { window.__bremse = false; });
    t.pruefe(langsam.bildrate < normal.bildrate * 0.6, `Bremse wirkt: ${komma(normal.bildrate)} → ${komma(langsam.bildrate)} Bilder/s`);
    t.pruefe(Math.abs(normal.tempo - TEMPO) < TEMPO * 0.05, `Fehler 1: Tempo bei normaler Bildrate ${komma(normal.tempo)} Punkte/s (Soll ${TEMPO})`);
    t.pruefe(Math.abs(langsam.tempo - normal.tempo) < normal.tempo * 0.1,
      `Fehler 1: altes Gerät gleich schnell: ${komma(langsam.tempo)} statt ${komma(normal.tempo)} Punkte/s`);

    // Fehler 2: Loslassen stoppt immer
    const m = await joystickMitte(seite);
    const pruefeStillstand = async (text) => {
      await warte(seite, 50);
      const z = await lies(seite);
      const xs = await beobachte(seite, 300);
      t.pruefe(z.ex === 0 && z.ey === 0 && xs.every((x) => x === xs[0]), `${text}: Eingabe 0, Figur steht`);
    };
    await seite.evaluate(() => window.spiel.test.setzeSpieler(60, innerHeight / 3));
    await t.ziehe(seite, m.x, m.y, m.x + 40, m.y, { halteMs: 100 });
    await pruefeStillstand('normales Loslassen');

    await seite.evaluate(() => window.spiel.test.setzeSpieler(60, innerHeight / 3));
    const cdp = await t.ziehe(seite, m.x, m.y, m.x + 40, m.y, { loslassen: false });
    const vorAbbruch = await lies(seite);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    t.pruefe(vorAbbruch.ex > 0.5, 'vor dem Abbruch bewegt der Joystick');
    await pruefeStillstand('Fehler 2: Berührung vom System abgebrochen (pointercancel)');

    await seite.evaluate(() => window.spiel.test.setzeSpieler(60, innerHeight / 3));
    await seite.mouse.move(m.x, m.y); await seite.mouse.down();
    await seite.mouse.move(m.x + 120, m.y - 120, { steps: 6 }); await seite.mouse.up();
    await pruefeStillstand('Fehler 2: Maus außerhalb des Feldes losgelassen');

    // Fehler 3: Jeder verschwundene Pilz gibt einen Punkt
    await seite.evaluate(() => { window.spiel.test.setzeSpieler(200, 300); window.spiel.test.setzePilze([[200, 300], [210, 305]]); });
    await warte(seite, 100);
    const doppelt = await lies(seite);
    t.pruefe(doppelt.punkte === 2 && doppelt.pilze === 8, `Fehler 3: zwei Pilze dicht beieinander → ${doppelt.punkte} Punkte (Soll 2), wieder 8 Pilze`);

    // Fehler 3: Neue Pilze entstehen nie unter der Figur (sonst verschwinden sie sofort wieder)
    const runden = await seite.evaluate((abstand) => new Promise((fertig) => {
      let runde = 0, fehler = 0, zuNah = 0, vorher = window.spiel.punkte;
      const naechste = () => {
        const x = 40 + Math.random() * (innerWidth - 80), y = 90 + Math.random() * (innerHeight - 300);
        window.spiel.test.setzeSpieler(x, y); window.spiel.test.setzePilze([[x, y]]);
      };
      naechste();
      (function bild() {
        requestAnimationFrame(() => {
          const s = window.spiel;
          if (s.punkte !== vorher + 1) fehler++;
          for (const p of s.pilze) if (Math.hypot(p.x - s.spieler.x, p.y - s.spieler.y) <= abstand) zuNah++;
          vorher = s.punkte;
          if (++runde < 300) { naechste(); bild(); } else fertig({ fehler, zuNah });
        });
      })();
    }), SAMMELABSTAND);
    t.pruefe(runden.fehler === 0 && runden.zuNah === 0,
      `Fehler 3: 300-mal einen Pilz gesammelt: je genau 1 Punkt (${runden.fehler} Abweichungen), kein neuer Pilz unter der Figur (${runden.zuNah})`);

    // Speichern geht weiter: Rekord nach Neuladen
    const vorLaden = await lies(seite);
    await seite.reload();
    await seite.waitForFunction('window.spiel && window.spiel.bereit');
    await warte(seite, 100);
    const geladen = await lies(seite);
    t.pruefe(geladen.rekord === vorLaden.punkte && geladen.anzeige === `Pilze: 0 · Rekord: ${vorLaden.punkte}`,
      `Rekord ${vorLaden.punkte} nach Neuladen: „${geladen.anzeige}“`);
    await seite.screenshot({ path: process.env.FOTO || '/tmp/stufe-5.png' });
    t.pruefe(lauf.fehler.length === 0, `keine Konsolenfehler ${lauf.fehler.join(' | ')}`);
  } catch (e) { t.pruefe(false, `Ablauf abgebrochen: ${e.message}`); }
  await lauf.ende();
}

// Fehler 4: privater Modus und kaputte Daten. Jede Art einmal: Start, Pilz sammeln, Spiel läuft weiter.
const SPEICHERFAELLE = [
  ['Zugriff auf localStorage gesperrt (Website-Daten blockiert)',
    () => Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Zugriff verweigert', 'SecurityError'); } })],
  ['Schreiben verboten (alter privater Modus von Safari)',
    () => { Storage.prototype.setItem = function () { throw new DOMException('Speicher voll', 'QuotaExceededError'); }; }],
  ['kaputter Rekord im Speicher', () => localStorage.setItem('pilz-rekord', '{kaputt')],
];
async function teilSpeicher(name, initSkript, port) {
  const lauf = await oeffne(port, initSkript);
  const { seite } = lauf;
  try {
    t.pruefe(lauf.bereit, `Fehler 4 (${name}): Spiel startet`);
    if (lauf.bereit) {
      await seite.evaluate(() => { window.spiel.test.setzeSpieler(200, 300); window.spiel.test.setzePilze([[200, 300]]); });
      await warte(seite, 100);
      await seite.evaluate(() => { window.spiel.test.setzeSpieler(100, 300); window.spiel.test.setzePilze([[100, 300]]); });
      await warte(seite, 100);
      const z = await lies(seite);
      t.pruefe(z.punkte === 2 && z.rekord === 2 && z.anzeige === 'Pilze: 2 · Rekord: 2',
        `Fehler 4 (${name}): nach zwei Pilzen läuft das Spiel weiter, „${z.anzeige}“`);
    }
    t.pruefe(lauf.fehler.length === 0, `Fehler 4 (${name}): keine Konsolenfehler ${lauf.fehler.join(' | ')}`);
  } catch (e) { t.pruefe(false, `Ablauf abgebrochen: ${e.message}`); }
  await lauf.ende();
}

(async () => {
  await teilSteuerungUndPilze();
  for (let i = 0; i < SPEICHERFAELLE.length; i++) await teilSpeicher(...SPEICHERFAELLE[i], PORT + 1 + i);
  t.ergebnis();
})();
