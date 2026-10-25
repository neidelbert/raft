// Browser-Test Übung 6 (wird von test.js aufgerufen): Wackeln, rotes Aufblitzen, Sterne, Partikel, Ton, Ton-Knopf,
// fehlendes stern.png. Eigene Läufe auf demselben Port nacheinander (der Lauf aus Übung 4 endet im privaten Modus).
const fs = require('fs');
const os = require('os');
const path = require('path');

// Zählt im Browser jeden gespielten Klang (createOscillator), damit „Ton an/aus“ prüfbar ist. Läuft vor dem Spiel.
const ZAEHLE_KLAENGE = () => {
  window.__klaenge = 0;
  const Klasse = window.AudioContext || window.webkitAudioContext;
  if (!Klasse) return;
  const original = Klasse.prototype.createOscillator;
  Klasse.prototype.createOscillator = function () { window.__klaenge++; return original.call(this); };
};

// Ab jetzt jedes Bild (rAF-Zeitstempel) mitschreiben, ms lang. vorher() läuft im ersten Bild, vor dem Mitschreiben.
// Jedes Bild zählt wie im Spiel höchstens 0,1 s (spielzeit), damit Hänger des Test-Browsers nicht täuschen.
function verlauf(seite, ms, vorher) {
  return seite.evaluate(({ dauer, vorherText }) => new Promise((fertig) => {
    const s = window.spiel, liste = [];
    requestAnimationFrame((start) => {
      const sofort = vorherText ? (0, eval)(`(${vorherText})`)() : null;
      let letzte = start, spielzeit = 0;
      (function bild(ts) {
        spielzeit += Math.min((ts - letzte) / 1000, 0.1);
        letzte = ts;
        liste.push({ t: ts - start, spielzeit, wackeln: s.effekte.wackeln, blitz: s.effekte.blitz, partikel: s.effekte.partikelAktiv, zustand: s.zustand });
        if (ts - start < dauer) requestAnimationFrame(bild); else fertig({ sofort, liste });
      })(start);
    });
  }), { dauer: ms, vorherText: vorher ? vorher.toString() : null });
}

function liesEffekte(seite) {
  return seite.evaluate(() => {
    const s = window.spiel, k = document.getElementById('knopf-ton');
    return {
      zustand: s.zustand, wackeln: s.effekte.wackeln, blitz: s.effekte.blitz, partikel: s.effekte.partikelAktiv, partikelMax: s.effekte.partikelMax,
      tonBereit: s.ton.bereit, tonAn: s.ton.an, sterne: s.sterne, klaenge: window.__klaenge, leben: s.spieler.leben,
      x: s.spieler.x, y: s.spieler.y, joystickAktiv: s.eingabe.aktiv,
      liegend: s.test ? s.test.sternPositionen() : [], knopf: k.textContent, knopfGedrueckt: k.getAttribute('aria-pressed'),
      gespeichert: (() => { try { return localStorage.getItem('uebung-4'); } catch { return 'gesperrt'; } })(),
      typen: [typeof s.effekte.wackeln, typeof s.effekte.partikelAktiv, typeof s.effekte.partikelMax, typeof s.ton.bereit,
        typeof s.ton.an, typeof s.sterne, typeof s.test?.sammleStern, typeof s.test?.schaden, typeof s.zustand].join(' '),
    };
  });
}

const neuLaden = async (seite) => { await seite.reload(); await seite.waitForFunction('window.spiel && window.spiel.bereit'); };
const komma = (z, st = 2) => z.toFixed(st).replace('.', ',');

async function effektLauf(t, starte) {
  const lauf = await starte({ pfad: 'index.html?seed=42&test=1', initSkript: ZAEHLE_KLAENGE });
  const { seite } = lauf;
  try {
    await seite.evaluate(() => localStorage.removeItem('uebung-4'));
    await neuLaden(seite);
    // Schnittstelle und Ton vor der ersten Berührung
    const start = await liesEffekte(seite);
    t.pruefe(start.typen === 'number number number boolean boolean number function function string',
      `Schnittstelle: effekte.wackeln/partikelAktiv/partikelMax, ton.bereit/an, sterne, test.sammleStern, test.schaden, zustand (${start.typen})`);
    t.pruefe(start.wackeln === 0 && start.partikel === 0 && start.partikelMax > 0 && start.sterne === 0 && start.tonAn && start.knopf === 'Ton an',
      `Start: Wackeln 0, 0 Partikel (höchstens ${start.partikelMax}), 0 Sterne, Ton an, Knopf „${start.knopf}“`);
    await seite.waitForTimeout(800);
    t.pruefe(!(await liesEffekte(seite)).tonBereit && start.zustand === 'titel', 'ton.bereit bleibt ohne Berührung false (0,8 s gewartet)');
    const { iw: B, ih: H } = await seite.evaluate(() => ({ iw: innerWidth, ih: innerHeight }));
    await seite.touchscreen.tap(B * 0.7, H * 0.5);
    const nachTipp = await liesEffekte(seite);
    t.pruefe(nachTipp.tonBereit && nachTipp.zustand === 'spiel', 'erste Berührung (Tippen zum Starten) → ton.bereit = true, Spiel läuft');

    // Ruhe für die Messungen: keine Gegner, nichts bewegt sich von selbst
    await seite.evaluate(() => { window.spiel.test.leereGegner(); window.spiel.test.friere(true); });
    await seite.waitForTimeout(1100);

    // Wackeln und Aufblitzen bei Treffer (Test-Hilfe schaden)
    const klaengeVor = (await liesEffekte(seite)).klaenge;
    const w = await verlauf(seite, 1300, () => {
      window.spiel.test.schaden(1);
      return { wackeln: window.spiel.effekte.wackeln, blitz: window.spiel.effekte.blitz, klaenge: window.__klaenge };
    });
    const ersteNull = w.liste.find((v) => v.wackeln === 0);
    const groessterAbstand = Math.max(...w.liste.slice(1).map((v, i) => v.t - w.liste[i].t));
    t.pruefe(w.sofort.wackeln > 0 && w.sofort.blitz === 1, `Treffer → Wackeln springt sofort an (${komma(w.sofort.wackeln)}), Figur blitzt rot (1)`);
    t.pruefe(ersteNull && ersteNull.t < 1000 && w.liste.filter((v) => v.t >= 1000).every((v) => v.wackeln === 0),
      `Wackeln klingt ab: 0 nach ${ersteNull ? komma(ersteNull.t / 1000) : '–'} s (Spielzeit ${ersteNull ? komma(ersteNull.spielzeit) : '–'} s, längster Bildabstand ${Math.round(groessterAbstand)} ms), danach bleibt 0`);
    t.pruefe(w.liste.every((v, i) => i === 0 || v.wackeln <= w.liste[i - 1].wackeln), 'Wackeln nimmt nur ab, nie wieder zu');
    const blitzWeg = w.liste.find((v) => v.blitz === 0);
    t.pruefe(blitzWeg && blitzWeg.t < 400, `rotes Aufblitzen vorbei nach ${blitzWeg ? komma(blitzWeg.t / 1000) : '–'} s`);
    t.pruefe(w.sofort.klaenge === klaengeVor + 1, `Treffer spielt einen Ton (${w.sofort.klaenge - klaengeVor})`);

    // Echter Treffer durch einen Gegner
    await seite.evaluate(() => { const s = window.spiel; s.test.fuelleGegner(1); s.test.setzeGegner(0, s.spieler.x, s.spieler.y); });
    await seite.waitForTimeout(100);
    const echt = await liesEffekte(seite);
    await seite.evaluate(() => window.spiel.test.leereGegner());
    t.pruefe(echt.leben === nachTipp.leben - 2 && echt.wackeln > 0, `echter Treffer durch einen Gegner: Leben ${echt.leben}, Wackeln ${komma(echt.wackeln)}`);
    await seite.screenshot({ path: '/tmp/stufe-6-treffer.png' });
    await seite.waitForTimeout(1100);

    // Partikel beim Einsammeln: nie über partikelMax, nach 1 s wieder 0
    const p1 = await seite.evaluate(() => { const vorher = window.__klaenge; const n = window.spiel.test.sammleStern(); return { n, p: window.spiel.effekte.partikelAktiv, k: window.__klaenge - vorher }; });
    t.pruefe(p1.n === 1 && p1.p > 0 && p1.k === 1, `sammleStern(): sterne 1, ${p1.p} Partikel, 1 Ton`);
    await seite.waitForTimeout(1100);
    const viele = await verlauf(seite, 1300, () => {
      let hoechste = 0;
      for (let i = 0; i < 60; i++) { window.spiel.test.sammleStern(); hoechste = Math.max(hoechste, window.spiel.effekte.partikelAktiv); }
      return { hoechste, sterne: window.spiel.sterne };
    });
    const max = start.partikelMax, hoechsteBild = Math.max(...viele.liste.map((v) => v.partikel));
    const nachEinerSekunde = viele.liste.filter((v) => v.t >= 1000);
    t.pruefe(viele.sofort.hoechste === max && hoechsteBild <= max, `60 Sterne auf einmal: höchstens ${viele.sofort.hoechste} Partikel (partikelMax ${max}), in keinem Bild mehr`);
    t.pruefe(nachEinerSekunde.length > 0 && nachEinerSekunde.every((v) => v.partikel === 0),
      `nach 1 s wieder 0 Partikel (erstes leeres Bild nach ${komma((viele.liste.find((v) => v.partikel === 0) || { t: NaN }).t / 1000)} s)`);
    t.pruefe(viele.sofort.sterne === 61, `sterne zählt jedes Einsammeln (${viele.sofort.sterne})`);

    // Sterne erscheinen alle 2 s, nicht unter der Figur, und lassen sich echt einsammeln
    const sterneVor = (await liesEffekte(seite)).liegend.length;
    const uhrVor = await seite.evaluate(() => window.spiel.test.sternUhr());
    await seite.waitForTimeout(4200);
    const s2 = await liesEffekte(seite);
    const erwartet = Math.floor((uhrVor + 4.2) / 2);
    t.pruefe(Math.abs(s2.liegend.length - sterneVor - erwartet) <= 1 && s2.liegend.length > sterneVor,
      `Sterne erscheinen alle 2 s: in 4,2 s ${s2.liegend.length - sterneVor} neue (erwartet ${erwartet})`);
    t.pruefe(s2.liegend.every((p) => Math.hypot(p.x - s2.x, p.y - s2.y) > 60), 'kein neuer Stern liegt unter der Figur');
    await seite.screenshot({ path: '/tmp/stufe-6-sterne.png' });
    const ziel = s2.liegend[0];
    await seite.evaluate((p) => window.spiel.test.setzeSpieler(p.x, p.y), ziel);
    await seite.waitForTimeout(100);
    const gesammelt = await liesEffekte(seite);
    t.pruefe(gesammelt.sterne === s2.sterne + 1 && gesammelt.liegend.length === s2.liegend.length - 1 && gesammelt.partikel > 0,
      `Figur läuft auf einen Stern: eingesammelt (sterne ${gesammelt.sterne}), Partikel ${gesammelt.partikel}`);

    // Ton-Knopf im Spiel: schaltet aus, startet und steuert nichts, wird gespeichert
    await seite.evaluate(() => window.spiel.test.friere(false));
    const vorKnopf = await liesEffekte(seite);
    await seite.tap('#knopf-ton');
    const aus = await liesEffekte(seite);
    t.pruefe(!aus.tonAn && aus.knopf === 'Ton aus' && aus.knopfGedrueckt === 'false' && aus.zustand === 'spiel' && !aus.joystickAktiv && aus.x === vorKnopf.x,
      `Ton-Knopf (Tippen) im Spiel: Ton aus, Knopf „${aus.knopf}“, Spiel läuft weiter, Figur bleibt`);
    t.pruefe(JSON.parse(aus.gespeichert).ton === false, `Ton-Einstellung sofort gespeichert (${aus.gespeichert})`);
    const stumm = await seite.evaluate(() => { const v = window.__klaenge; window.spiel.test.sammleStern(); window.spiel.test.schaden(1); return window.__klaenge - v; });
    t.pruefe(stumm === 0, 'Ton aus: Stern und Treffer spielen keinen Ton');
    await seite.evaluate(() => window.spiel.test.leereGegner());

    // Nach Neuladen: Ton bleibt aus; bereit wieder erst nach Berührung
    await neuLaden(seite);
    const geladen = await liesEffekte(seite);
    t.pruefe(!geladen.tonAn && geladen.knopf === 'Ton aus' && !geladen.tonBereit && geladen.zustand === 'titel',
      'nach Neuladen: Ton bleibt aus, Knopf „Ton aus“, ton.bereit wieder false');
    // Ton-Knopf im Titel: schaltet an, startet keine Runde; zählt als erste Berührung
    await seite.click('#knopf-ton');
    const an = await liesEffekte(seite);
    t.pruefe(an.tonAn && an.knopf === 'Ton an' && an.zustand === 'titel' && an.tonBereit,
      'Ton-Knopf (Klick) im Titel: Ton an, bleibt im Titel, ton.bereit = true');
    await seite.screenshot({ path: '/tmp/stufe-6-titel.png' });
    await neuLaden(seite);
    t.pruefe((await liesEffekte(seite)).tonAn, 'nach Neuladen: Ton bleibt an');
    // Tastatur (Enter auf dem Knopf) schaltet genau einmal
    await seite.focus('#knopf-ton');
    await seite.keyboard.press('Enter');
    t.pruefe(!(await liesEffekte(seite)).tonAn, 'Ton-Knopf mit der Tastatur: schaltet genau einmal');
    await seite.keyboard.press('Enter');

    // Wackeln klingt auch auf der Ende-Tafel ab
    await seite.touchscreen.tap(B * 0.7, H * 0.5);
    await seite.evaluate(() => window.spiel.test.leereGegner());
    const e = await verlauf(seite, 1200, () => { window.spiel.test.schaden(99); return window.spiel.effekte.wackeln; });
    t.pruefe(e.sofort > 0 && e.liste.at(-1).zustand === 'ende' && e.liste.filter((v) => v.t >= 1000).every((v) => v.wackeln === 0),
      'letzter Treffer → Ende: Wackeln springt an und klingt auf der Ende-Tafel in unter 1 s ab');
    t.pruefe(lauf.fehler.length === 0, `keine Konsolenfehler ${lauf.fehler.join(' | ')}`);
  } catch (e) { t.pruefe(false, `Effekt-Ablauf abgebrochen: ${e.message}`); }
  await lauf.ende();
}

// Kopie des Spiels ohne stern.png (wie gelöscht). Mit GEGENPROBE=1 ohne Ersatz-Stern: dann muss der Test rot sein.
function kopieOhneStern(quelle) {
  const ziel = fs.mkdtempSync(path.join(os.tmpdir(), 'stufe-6-ohne-stern-'));
  for (const teil of ['index.html', 'stil.css', 'js', 'grafik']) fs.cpSync(path.join(quelle, teil), path.join(ziel, teil), { recursive: true });
  fs.rmSync(path.join(ziel, 'grafik/gegenstaende/stern.png'));
  if (process.env.GEGENPROBE) {
    const main = path.join(ziel, 'js/main.js');
    fs.writeFileSync(main, fs.readFileSync(main, 'utf8').replace(/ \|\| zeichneErsatzStern\([^)]*\)/, ''));
  }
  return ziel;
}

async function ohneSternLauf(t, starte, quelle) {
  const ordner = kopieOhneStern(quelle);
  const lauf = await starte({ ordner, pfad: 'index.html?seed=42&test=1' });
  const { seite } = lauf;
  try {
    const warnungen = [], seitenFehler = [];
    seite.on('console', (m) => m.type() === 'warning' && warnungen.push(m.text()));
    seite.on('pageerror', (e) => seitenFehler.push(e.message));
    lauf.fehler.length = 0;
    await neuLaden(seite);
    const geladen = await seite.evaluate(() => ({ stern: window.spiel.test.sternBildGeladen, figur: window.spiel.test.bildGeladen }));
    await seite.touchscreen.tap(300, 300);
    await seite.evaluate(() => { const s = window.spiel; s.test.leereGegner(); s.test.friere(true); for (let i = 0; i < 4; i++) s.test.legeStern(); });
    const zeit1 = await seite.evaluate(() => window.spiel.test.zeit());
    await seite.waitForTimeout(600);
    const lauft = await seite.evaluate(() => ({ zeit: window.spiel.test.zeit(), sterne: window.spiel.test.sternPositionen().length, n: window.spiel.test.sammleStern(), zustand: window.spiel.zustand }));
    await seite.waitForTimeout(200);
    await seite.screenshot({ path: '/tmp/stufe-6-ohne-stern.png' });
    const nurNetz = lauf.fehler.every((f) => /Failed to load resource/.test(f));
    t.pruefe(!geladen.stern && geladen.figur && warnungen.some((w) => /stern/.test(w)), `ohne stern.png: Ersatz-Stern, nur Warnungen („${warnungen.join('“, „')}“)`);
    t.pruefe(seitenFehler.length === 0 && lauf.fehler.length <= 1 && nurNetz,
      `ohne stern.png: kein Fehler im Spielcode; einzige Fehlermeldung ist die des Browsers zur fehlenden Datei (${lauf.fehler.length}: ${lauf.fehler.join(' | ')})`);
    t.pruefe(lauft.zustand === 'spiel' && lauft.zeit > zeit1 + 0.4 && lauft.sterne === 4 && lauft.n === 1, `ohne stern.png: Spiel läuft (Zeit ${komma(zeit1)} → ${komma(lauft.zeit)} s), Sterne liegen und lassen sich sammeln`);

    // Hat der Zeichner das Bild auch aus grafik.json gestrichen, fragt das Spiel gar nicht danach: dann gar keine Fehlermeldung.
    const liste = path.join(ordner, 'grafik/grafik.json');
    fs.writeFileSync(liste, JSON.stringify(JSON.parse(fs.readFileSync(liste, 'utf8')).filter((b) => b.name !== 'gegenstaende/stern'), null, 2));
    lauf.fehler.length = 0; warnungen.length = 0;
    await neuLaden(seite);
    await seite.touchscreen.tap(300, 300);
    await seite.evaluate(() => window.spiel.test.legeStern());
    await seite.waitForTimeout(300);
    t.pruefe(lauf.fehler.length === 0 && seitenFehler.length === 0 && warnungen.some((w) => /stern/.test(w)) && (await seite.evaluate(() => window.spiel.zustand)) === 'spiel',
      `stern.png auch aus grafik.json gestrichen: keine Konsolenfehler, eine Warnung, Spiel läuft ${lauf.fehler.join(' | ')}`);
  } catch (e) { t.pruefe(false, `Ablauf ohne stern.png abgebrochen: ${e.message}`); }
  await lauf.ende();
  fs.rmSync(ordner, { recursive: true, force: true });
}

module.exports = async function effektTests(t, ORDNER, PORT) {
  const starte = (werte) => t.starte({ ordner: ORDNER, port: PORT, ...werte });
  await effektLauf(t, starte);
  await ohneSternLauf(t, starte, path.resolve(t.REPO, ORDNER));
};
