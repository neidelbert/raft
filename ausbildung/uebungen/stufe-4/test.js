// Test für Übung 4 (Spielzustände und Speichern): node ausbildung/uebungen/stufe-4/test.js
// Rechenregeln ohne Browser: test-regeln.js (aus Übung 3) und test-regeln-ablauf.js (neu). Hier der Ablauf im Browser,
// Teil 2 (Speicher, Neuladen, privater Modus, Leistung) in test-browser-speicher.js.
const t = require('../../../werkzeuge/test-hilfe.js');
const path = require('path');
const { pathToFileURL } = require('url');
const regelTests = require('./test-regeln.js');
const ablaufRegeln = require('./test-regeln-ablauf.js');
const speicherTests = require('./test-browser-speicher.js');
const h = require('./test-hilfen.js');

const ORDNER = 'ausbildung/uebungen/stufe-4';
const PORT = 8840;
const lade = (datei) => import(pathToFileURL(path.join(t.REPO, ORDNER, datei)));

(async () => {
  await regelTests(t, lade);
  await ablaufRegeln(t, lade);
  const { SPIELER } = await lade('js/config/spieler.js');
  const { GEGNER } = await lade('js/config/gegner.js');

  const lauf = await t.starte({ ordner: ORDNER, port: PORT, pfad: 'index.html?seed=42&test=1' });
  const { seite } = lauf;
  try {
    // Titel
    const start = await h.lies(seite);
    const { iw: B, ih: H } = start;
    t.pruefe(start.bereit && start.zustand === 'titel' && start.punkte === 0 && start.rekord === 0 && start.leben === SPIELER.leben,
      `Start im Titel: bereit, 0 Punkte, Rekord 0, ${start.leben} Leben`);
    t.pruefe(start.typen === 'string number number number function', `Schnittstelle: zustand, punkte, rekord, spieler.leben, test.schaden (${start.typen})`);
    t.pruefe(start.tafel === 'Tippen zum Starten\nRekord: 0' && !start.leisteSichtbar, `Titel zeigt „${start.tafel.replace('\n', ' / ')}“`);
    await seite.screenshot({ path: '/tmp/stufe-4-titel.png' });
    await seite.waitForTimeout(1000);
    const imTitel = await h.lies(seite);
    t.pruefe(imTitel.zustand === 'titel' && imTitel.gegner === 0 && imTitel.punkte === 0, 'im Titel: 1 s lang keine Gegner, keine Punkte');

    // Tippen → Spiel. Der Start-Tipp in der linken Hälfte steuert nicht (er gehört dem Titel).
    const vorTipp = await h.lies(seite);
    await t.tippe(seite, B * 0.2, H * 0.3);
    const nachTipp = await h.lies(seite);
    t.pruefe(nachTipp.zustand === 'spiel' && !nachTipp.tafelSichtbar && nachTipp.leisteSichtbar, 'Tippen im Titel → „spiel“, Tafel weg, Punkte und Leben oben');
    t.pruefe(!nachTipp.joystickAktiv && nachTipp.x === vorTipp.x && nachTipp.y === vorTipp.y, 'Start-Tipp löst den Joystick nicht aus, Figur bleibt stehen');
    const startZeit = Date.now();
    await seite.waitForTimeout(2300);
    const nach2 = await h.lies(seite);
    const sekunden = (Date.now() - startZeit) / 1000;
    t.pruefe(Math.abs(nach2.punkte - Math.floor(sekunden)) <= 1 && Number.isInteger(nach2.punkte) && nach2.gegner > 0,
      `Punkte = überlebte Sekunden: nach ${h.komma(sekunden, 1)} s ${nach2.punkte} Punkte (ganze Zahl), ${nach2.gegner} Gegner`);
    t.pruefe(nach2.leiste === `Punkte ${nach2.punkte} Leben 5` || nach2.leiste === `Punkte ${nach2.punkte - 1} Leben 5`, `Leiste zeigt „${nach2.leiste}“`);
    await t.tippe(seite, B * 0.8, H * 0.3);
    t.pruefe((await h.lies(seite)).zustand === 'spiel', 'Tippen während des Spiels wechselt den Zustand nicht');

    // Steuerung aus Übung 2 geht im Spiel weiter
    await seite.evaluate(() => { window.spiel.test.leereGegner(); window.spiel.test.friere(true); });
    const vorZiehen = await h.lies(seite);
    await t.ziehe(seite, 60, H / 2, 120, H / 2, { halteMs: 300 });
    await seite.waitForTimeout(50);
    const gezogen = await h.lies(seite);
    const stillstand = await seite.evaluate(h.beobachte, 300);
    t.pruefe(gezogen.x > vorZiehen.x + 30 && stillstand.every((v) => v.x === stillstand[0].x), 'Joystick bewegt die Figur, Loslassen stoppt sie');

    // Pause, wenn der Tab versteckt wird
    await seite.evaluate(() => { window.spiel.test.friere(false); window.spiel.test.fuelleGegner(20); localStorage.removeItem('uebung-4'); });
    await h.versteckeTab(seite, true);
    const pause1 = await h.lies(seite);
    await seite.waitForTimeout(1500);
    const pause2 = await h.lies(seite);
    t.pruefe(pause2.pausiert && pause2.zustand === 'spiel' && pause2.zeit === pause1.zeit && pause2.punkte === pause1.punkte && pause2.ersterGegner === pause1.ersterGegner,
      'Tab versteckt: Pause (1,5 s lang keine Zeit, keine Punkte, kein Gegner bewegt sich)');
    t.pruefe(pause2.gespeichert === null, 'Tab versteckt: nichts geändert, also nichts geschrieben');
    await h.versteckeTab(seite, false);
    const zurueck = await seite.evaluate(h.beobachte, 600);
    const ersterSchritt = zurueck[1].zeit - zurueck[0].zeit;
    t.pruefe(!zurueck[0].pausiert && zurueck[zurueck.length - 1].zeit > pause2.zeit + 0.4 && ersterSchritt < 0.05,
      `Tab wieder da: geht weiter, ohne Sprung (erstes Bild ${h.komma(ersterSchritt * 1000, 0)} ms)`);

    // Langsames Gerät: Punkte zählen trotzdem nach echter Zeit
    await h.bremseAn(seite);
    const langsam = await seite.evaluate(h.beobachte, 2000);
    await seite.evaluate(() => { window.bremse = false; });
    const langsamZeit = langsam[langsam.length - 1].zeit - langsam[0].zeit;
    t.pruefe(langsam.length < 60 && Math.abs(langsamZeit - 2) < 0.3, `bei ≈ ${Math.round(langsam.length / 2)} Bildern/s zählen 2 s als ${h.komma(langsamZeit, 2)} s`);

    // Schaden und Ende (Gegner weg, damit kein echter Treffer dazwischenkommt)
    await seite.evaluate(() => window.spiel.test.leereGegner());
    await seite.waitForTimeout(1100);   // Schutzzeit eines früheren Treffers abwarten
    await seite.evaluate(() => window.spiel.test.setzeLeben(5));
    t.pruefe(await seite.evaluate(() => window.spiel.test.schaden(2)) === 3 && (await h.lies(seite)).zustand === 'spiel', 'schaden(2): 3 Leben, Spiel läuft');
    const punkteVorEnde = (await h.lies(seite)).punkte;
    await seite.evaluate(() => window.spiel.test.schaden(3));
    const ende = await h.lies(seite);
    t.pruefe(ende.zustand === 'ende' && ende.leben === 0, 'bei 0 Leben sofort „ende“');
    t.pruefe(ende.rekord === ende.punkte && ende.punkte >= punkteVorEnde && JSON.parse(ende.gespeichert).rekord === ende.punkte,
      `erster Rekord ${ende.rekord} = Punkte, sofort gespeichert (${ende.gespeichert})`);
    t.pruefe(ende.tafel === `Ende\nPunkte: ${ende.punkte}\nRekord: ${ende.rekord}\nTippen für neue Runde` && !ende.leisteSichtbar,
      `Ende zeigt „${ende.tafel.replace(/\n/g, ' / ')}“`);
    await seite.screenshot({ path: process.env.FOTO || '/tmp/stufe-4-ende.png' });
    const endeVerlauf = await seite.evaluate(h.beobachte, 800);
    t.pruefe(endeVerlauf.every((v) => v.zustand === 'ende' && v.punkte === ende.punkte && v.ersterGegner === endeVerlauf[0].ersterGegner),
      'im Ende: Punkte und Gegner stehen still');
    t.pruefe(await seite.evaluate(() => window.spiel.test.schaden(1)) === 0 && (await h.lies(seite)).zustand === 'ende', 'schaden im Ende: bleibt „ende“, Leben nicht unter 0');

    // Neue Runde setzt alles zurück
    await seite.evaluate(() => window.spiel.test.setzeSpieler(40, 600));
    await t.tippe(seite, B * 0.25, H * 0.5);
    const neu = await h.lies(seite);
    t.pruefe(neu.zustand === 'spiel' && neu.leben === SPIELER.leben && neu.punkte === 0 && neu.gegner === 0 && !neu.unverwundbar,
      `neue Runde: ${neu.leben} Leben, ${neu.punkte} Punkte, ${neu.gegner} Gegner, verwundbar`);
    t.pruefe(Math.abs(neu.x - B / 2) < 1 && Math.abs(neu.y - H / 2) < 1 && !neu.joystickAktiv, 'neue Runde: Figur in der Mitte, Joystick los');
    t.pruefe(neu.leiste === `Punkte 0 Leben ${SPIELER.leben}`, `neue Runde: Leiste „${neu.leiste}“`);

    // Rekord nur, wenn höher
    const alterRekord = ende.rekord;
    await seite.waitForTimeout(300);
    await seite.evaluate(() => window.spiel.test.schaden(5));
    const niedriger = await h.lies(seite);
    t.pruefe(niedriger.zustand === 'ende' && niedriger.punkte < alterRekord && niedriger.rekord === alterRekord && JSON.parse(niedriger.gespeichert).rekord === alterRekord,
      `weniger Punkte (${niedriger.punkte}): Rekord bleibt ${niedriger.rekord}`);
    t.pruefe(niedriger.tafel.includes(`Rekord: ${alterRekord}`), 'Ende zeigt den alten Rekord');
    await t.tippe(seite, B / 2, H / 2);
    await seite.evaluate((s) => window.spiel.test.setzeZeit(s), alterRekord);
    await seite.waitForTimeout(100);
    await seite.evaluate(() => window.spiel.test.schaden(5));
    const gleich = await h.lies(seite);
    t.pruefe(gleich.punkte === alterRekord && gleich.rekord === alterRekord, `gleich viele Punkte (${gleich.punkte}): Rekord bleibt`);
    await t.tippe(seite, B / 2, H / 2);
    await seite.evaluate(() => window.spiel.test.setzeZeit(57.4));
    await seite.waitForTimeout(100);
    await seite.evaluate(() => window.spiel.test.schaden(5));
    const hoeher = await h.lies(seite);
    t.pruefe(hoeher.rekord === 57 && JSON.parse(hoeher.gespeichert).rekord === 57, `mehr Punkte (57): neuer Rekord ${hoeher.rekord}, gespeichert`);

    // Echtes Ende durch Gegner (ohne Test-Schaden): 240 Gegner, nach 5 Treffern mit je 1 s Schutz ist Schluss
    await t.tippe(seite, B / 2, H / 2);
    await seite.evaluate(() => window.spiel.test.fuelleGegner(1000));
    const echt = await seite.evaluate(h.beobachte, 7000);
    const echtesEnde = echt.find((v) => v.zustand === 'ende');
    const lebenFolge = [...new Set(echt.map((v) => v.leben))];
    t.pruefe(echtesEnde && echtesEnde.leben === 0 && lebenFolge.join(',') === '5,4,3,2,1,0' && echt.every((v) => v.gegner <= GEGNER.max),
      `Gegner treffen 5-mal (Leben ${lebenFolge.join('→')}), nach ${echtesEnde ? h.komma(echtesEnde.t / 1000, 1) : '–'} s „ende“`);
    t.pruefe((await h.lies(seite)).rekord === 57, 'kurze Runde: Rekord bleibt 57');

    await speicherTests(t, lauf, PORT, h);
  } catch (e) { t.pruefe(false, `Ablauf abgebrochen: ${e.message}`); }
  await lauf.ende();
  t.ergebnis();
})();
