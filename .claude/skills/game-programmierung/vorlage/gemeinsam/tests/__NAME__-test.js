// Test für „__NAME__“ (Gerüst aus neues-spiel.js): node tests/__NAME__-test.js (aus jedem Ordner).
// Prüft: Regeln ohne Browser; Start ohne Konsolenfehler mit und ohne ?test=1; Ladebildschirm → Titel; Ton-Knopf;
//   Tippen → Spiel; Joystick bewegt, Loslassen und Abbruch stoppen; Tab-Wechsel (Pause, kein Sprung, Joystick gelöst);
//   Runde endet → Rekord gespeichert, nach Neuladen noch da; kaputter Speicherstand und privater Modus;
//   Figur läuft per Joystick zu einem Ziel; dt = 0 ändert nichts; 2D: Lauf-/Stand-Animation, Kopf bleibt unter allen
//   Bedienelementen oben (Leiste, Ton-Knopf), Platz für einen dritten Wert in der Leiste; Sound-Datei spielt;
//   fehlende und hängende Assets (Ersatz für jeden Rahmen und jede Animation, auch Sound); Pixel-Ratio ≤ 2;
//   3D: Zeichenaufrufe. Bildschirmfoto bei Pause (t.foto): FOTO=<datei> (Standard tests/fotos/__NAME__.png, nicht für
//   Git: tests/fotos/.gitignore).
// Dauer etwa 40–60 s. Allein laufen lassen, nicht parallel zu anderen Browser-Tests (wissen/testen.md, „Tests unter
//   Last“); Ausgabe in eine Datei umleiten: node tests/__NAME__-test.js > tests/fotos/lauf.txt 2>&1
// Umgebung: PORT=<zahl> (Standard __PORT__), ORDNER=<Kopie> für die Gegenprobe (kaputte Kopie muss rot werden).
// Braucht Node, Playwright mit Chromium, python3; 3D einmal npm (test-hilfe.js holt Three.js in den Temp-Ordner).
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const t = require('./test-hilfe.js');

const ORDNER = process.env.ORDNER ? path.resolve(process.env.ORDNER) : path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT) || __PORT__;
const FOTO = process.env.FOTO || path.join(__dirname, 'fotos', '__NAME__.png');   // im Spielordner: leicht zu finden
fs.mkdirSync(path.dirname(FOTO), { recursive: true });
if (!process.env.FOTO) fs.writeFileSync(path.join(__dirname, 'fotos', '.gitignore'), '*\n');
const IM_TITEL = 'window.spiel && window.spiel.zustand === "titel"';
const lade = (datei) => import(pathToFileURL(path.join(ORDNER, datei)).href);
const warte = (ms) => new Promise((ok) => setTimeout(ok, ms));
const nurLadefehler = (fehler) => fehler.every((f) => /Failed to load resource/.test(f));
// Wert aus der Seite lesen; arg wird an die Funktion weitergegeben: lies(s, (k) => localStorage.getItem(k), schluessel).
const lies = (seite, ausdruck, arg) => seite.evaluate(ausdruck, arg);
// Zählt abgespielte Sound-Dateien (AudioBufferSourceNode.start), unabhängig vom Spielcode; Code-Klänge zählen nicht.
const ZAEHLE_PUFFER = { content: 'window.__puffer = 0; const s = AudioBufferSourceNode.prototype.start; AudioBufferSourceNode.prototype.start = function (...a) { window.__puffer++; return s.apply(this, a); };' };

// Alle Atlanten auf der Platte (assets/atlas/*.json) zusammen: { rahmen, animationen }. Was das Spiel laden soll.
function atlasAufDerPlatte() {
  const ordner = path.join(ORDNER, 'assets', 'atlas'), alle = { rahmen: {}, animationen: {} };
  if (!fs.existsSync(ordner)) return alle;
  for (const d of fs.readdirSync(ordner).filter((x) => x.endsWith('.json'))) {
    const daten = JSON.parse(fs.readFileSync(path.join(ordner, d), 'utf8'));
    Object.assign(alle.rahmen, daten.rahmen);
    Object.assign(alle.animationen, daten.animationen);
  }
  return alle;
}

// n Bilder in der Seite abwarten (requestAnimationFrame).
const bilder = (seite, n) => seite.evaluate((anzahl) => new Promise((fertig) => {
  let rest = anzahl;
  (function weiter() { rest-- > 0 ? requestAnimationFrame(weiter) : fertig(); })();
}), n);

// Tab verstecken oder zeigen wie beim App-Wechsel am iPhone.
const tab = (seite, versteckt) => seite.evaluate((v) => {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => v });
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (v ? 'hidden' : 'visible') });
  document.dispatchEvent(new Event('visibilitychange'));
}, versteckt);

async function regeln() {
  const { erstelleSpieler, setzeSpieler, bewegeSpieler, beruehrt } = await lade('js/regeln/spieler.js');
  const { erstelleRunde, starteRunde, aktualisiereRunde } = await lade('js/regeln/runde.js');
  const { SPIELER } = await lade('js/config/welt.js');
  const { RUNDE, SPIEL } = await lade('js/config/spiel.js');
  const feld = { minX: -1000, minY: -1000, maxX: 1000, maxY: 1000 };
  const s = erstelleSpieler();
  setzeSpieler(s, 0, 0);
  for (let i = 0; i < 10; i++) bewegeSpieler(s, { x: 1, y: 0 }, 0.05, 100, feld);
  t.pruefe(Math.abs(s.x - 50) < 1e-9 && s.y === 0 && Math.abs(s.weg - 50) < 1e-9, `Regel: 0,5 s mit Tempo 100 → 50 weit (x ${s.x})`);
  setzeSpieler(s, 0, 0);
  bewegeSpieler(s, { x: 0, y: -1 }, 0.5, 100, feld);
  t.pruefe(s.y === -50 && s.x === 0, 'Regel: Joystick oben → y wird kleiner');
  setzeSpieler(s, 990, 0);
  bewegeSpieler(s, { x: 1, y: 0 }, 1, 100, feld);
  t.pruefe(s.x === 1000 && Math.abs(s.weg - 10) < 1e-9, 'Regel: Rand hält die Figur, Weg zählt nur bis zum Rand');
  bewegeSpieler(s, { x: 1, y: 0 }, 0.05, 100, feld);
  t.pruefe(!s.laeuft && s.x === 1000, 'Regel: an der Wand läuft die Figur nicht (laeuft false)');
  // dt = 0 (die Schleife liefert es nach einem verspäteten Bild): nichts ändert sich, auch laeuft und blick nicht.
  setzeSpieler(s, 0, 0);
  bewegeSpieler(s, { x: -1, y: 0 }, 0.05, 100, feld);
  const nachLauf = { x: s.x, weg: s.weg, laeuft: s.laeuft, blick: s.blick };
  bewegeSpieler(s, { x: 1, y: 0 }, 0, 100, feld);
  t.pruefe(nachLauf.laeuft && nachLauf.blick === -1 && s.laeuft && s.blick === -1 && s.x === nachLauf.x && s.weg === nachLauf.weg,
    `Regel: dt = 0 ändert nichts (läuft weiter, Blick bleibt links: ${s.laeuft}, ${s.blick})`);
  bewegeSpieler(s, { x: 0, y: 0 }, 0.05, 100, feld);
  t.pruefe(!s.laeuft && s.blick === -1, 'Regel: Daumen weg → steht, Blick bleibt');
  const r = erstelleRunde();
  starteRunde(r, RUNDE.dauer);
  let vorbei = false, schritte = 0;
  while (!vorbei && schritte < 10000) { vorbei = aktualisiereRunde(r, SPIEL.deltaMax, SPIELER.wegProPunkt * 3.5, SPIELER.wegProPunkt); schritte++; }
  t.pruefe(vorbei && Math.abs(schritte * SPIEL.deltaMax - RUNDE.dauer) < SPIEL.deltaMax + 1e-9, `Regel: Runde endet nach ${RUNDE.dauer} s (${schritte} Schritte)`);
  t.pruefe(r.punkte === 3 && r.zeit === 0, `Regel: Punkte = ganze Wegstücke (${r.punkte})`);
  starteRunde(r, null);
  vorbei = false;
  for (let i = 0; i < 1000 && !vorbei; i++) vorbei = aktualisiereRunde(r, SPIEL.deltaMax, 0, SPIELER.wegProPunkt);
  t.pruefe(!vorbei && r.zeit === Infinity, 'Regel: RUNDE.dauer null → keine Zeitgrenze (100 s ohne Ende)');
  // Berührung mit festen Orten (nie mit zufällig verteilten Dingen: ein Nachbar in Reichweite verfälscht den Fall).
  const { BERUEHRUNG } = await lade('js/config/welt.js');
  const b = { hoehe: 30, radius: 40 }, f = erstelleSpieler();
  setzeSpieler(f, 100, 200);
  t.pruefe(beruehrt(f, 100, 170, b) && beruehrt(f, 140, 170, b), 'Regel: Berührung um die Körpermitte (30 über dem Fuß), Rand zählt');
  t.pruefe(!beruehrt(f, 140.5, 170, b) && !beruehrt(f, 100, 240.5, b), 'Regel: knapp außerhalb keine Berührung (auch knapp unter dem Fuß)');
  t.pruefe(beruehrt(f, 100, 131, b) && !beruehrt(f, 100, 129, b), 'Regel: Kreis sitzt über dem Fuß, nicht um ihn');
  t.pruefe(BERUEHRUNG.radius > 0 && BERUEHRUNG.hoehe >= 0, `Einstellwerte BERUEHRUNG da (radius ${BERUEHRUNG.radius}, hoehe ${BERUEHRUNG.hoehe})`);
  return SPIELER;
}

async function ohneTestModus() {
  const lauf = await t.starte({ ordner: ORDNER, port: PORT, warteAuf: IM_TITEL });
  try {
    const s = lauf.seite;
    t.pruefe(lauf.fehler.length === 0, `ohne ?test=1: keine Konsolenfehler ${lauf.fehler.join(' | ')}`);
    t.pruefe(await lies(s, () => window.spiel.test === undefined), 'ohne ?test=1: kein spiel.test');
    t.pruefe(await lies(s, () => window.spiel.pixelRatio) <= 2, `Pixel-Ratio höchstens 2 (Gerät hat 3): ${await lies(s, () => window.spiel.pixelRatio)}`);
  } catch (e) { t.pruefe(false, `Ablauf ohne Test-Modus abgebrochen: ${e.message}`); }
  await lauf.ende();
}

async function ablauf(SPIELER) {
  const atlas = atlasAufDerPlatte();   // Stand- und Lauf-Rahmen der Figur: Name gleich SPIELER.rahmen oder fängt so an
  const figurRahmen = () => Object.entries(atlas.rahmen).filter(([n]) => n === SPIELER.rahmen || n.startsWith(`${SPIELER.rahmen}-`)).map(([, r]) => r);
  // Manifest kurz verzögern, damit der Ladebildschirm sicher zu sehen ist.
  const lauf = await t.starte({
    ordner: ORDNER, port: PORT, pfad: 'index.html?test=1&seed=42', initSkript: ZAEHLE_PUFFER,
    routen: (k) => k.route('**/assets/assets.json', async (route) => { await warte(400); route.continue(); }),
  });
  const s = lauf.seite;
  try {
    const anfang = await lies(s, () => ({ zustand: window.spiel.zustand, laden: !document.getElementById('laden').hidden }));
    t.pruefe(anfang.zustand === 'laden' && anfang.laden, `Ladebildschirm zuerst (${anfang.zustand})`);
    const verlauf = await s.evaluate(() => new Promise((fertig) => {   // Fortschritt in jedem Bild mitschreiben
      const werte = [];
      (function schau() { werte.push(window.spiel.fortschritt); window.spiel.zustand === 'titel' ? fertig(werte) : requestAnimationFrame(schau); })();
    }));
    t.pruefe(verlauf.every((w, i) => i === 0 || w >= verlauf[i - 1]) && verlauf[verlauf.length - 1] === 1, `Fortschritt steigt bis 1, nie zurück (${verlauf.length} Bilder)`);
    const a = await lies(s, () => window.spiel.assets);
    t.pruefe(a.geladen.length > 0 && a.fehlend.length === 0 && a.ersetzt.length === 0, `Assets geladen: ${a.geladen.join(', ')}`);
    const art = await lies(s, () => window.spiel.darstellung);
    if (art === '2d') t.pruefe(await lies(s, () => window.spiel.figur) === 'atlas', `2D: Figur aus dem Atlas (${await lies(s, () => window.spiel.figur)})`);
    if (art === '3d') t.pruefe(['glb', 'ersatz'].includes(await lies(s, () => window.spiel.modell)), `3D: Spieler-Modell oder Ersatz-Box (${await lies(s, () => window.spiel.modell)})`);

    // Ton-Knopf im Titel: schaltet, startet das Spiel nicht, wird gespeichert.
    const knopf = await s.locator('#knopf-ton').boundingBox();
    const mitte = (b) => [b.x + b.width / 2, b.y + b.height / 2];
    await t.tippe(s, ...mitte(knopf));
    const nachKnopf = await lies(s, () => ({ an: window.spiel.ton.an, zustand: window.spiel.zustand, text: document.getElementById('knopf-ton').textContent }));
    t.pruefe(!nachKnopf.an && nachKnopf.zustand === 'titel' && nachKnopf.text === 'Ton aus', `Ton-Knopf: aus, Titel bleibt (${nachKnopf.zustand}, „${nachKnopf.text}“)`);
    await t.tippe(s, ...mitte(knopf));
    t.pruefe(await lies(s, () => window.spiel.ton.an), 'Ton-Knopf: wieder an');

    // Tippen → Spiel (weckt den Ton, spielt den Start-Klang).
    const g = await lies(s, () => ({ b: innerWidth, h: innerHeight }));
    await t.tippe(s, g.b * 0.75, g.h * 0.5);
    await bilder(s, 3);
    const start = await lies(s, () => ({ zustand: window.spiel.zustand, x: window.spiel.spieler.x, y: window.spiel.spieler.y, ton: window.spiel.ton.bereit, klaenge: window.spiel.ton.klaenge, joy: window.spiel.joystickAktiv }));
    t.pruefe(start.zustand === 'spiel' && !start.joy, `Tippen → Spiel, das Start-Tippen bewegt den Joystick nicht (${start.zustand})`);
    t.pruefe(start.ton && start.klaenge >= 1, `Ton nach dem Tippen bereit, Start-Klang gespielt (${start.klaenge})`);
    await s.evaluate(() => window.spiel.test.setzeZeit(600));   // Zeit genug für alle Prüfungen, auch bei langsamer Grafik

    // Laufen und Stehen Bild für Bild (t.beobachte): Nur Bilder mit dt > 0 zählen, „läuft“ heißt „hat sich bewegt“.
    // So bleibt der Test unter Last richtig (dann steht die Figur womöglich schon an der Wand, und dort ist Stehen richtig).
    const lesen = () => ({ x: window.spiel.spieler.x, laeuft: window.spiel.spieler.laeuft, blick: window.spiel.spieler.blick, animation: window.spiel.animation });
    const finger = await t.ziehe(s, g.b * 0.2, g.h * 0.6, g.b * 0.2 - 60, g.h * 0.6, { loslassen: false });
    const gehalten = await t.beobachte(s, lesen, { bilder: 12 });
    await finger.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    const danach = await t.beobachte(s, lesen, { bilder: 6 });
    const mitZeit = (liste) => liste.flatMap((b, i) => (i > 0 && b.dt > 0 ? [{ ...b.wert, bewegt: b.wert.x !== liste[i - 1].wert.x }] : []));
    const g1 = mitZeit(gehalten), bewegt = g1.filter((b) => b.bewegt);
    t.pruefe(bewegt.length >= 1 && g1.every((b) => b.laeuft === b.bewegt) && bewegt.every((b) => b.blick === -1 && (art !== '2d' || b.animation === 'lauf')),
      `Daumen gehalten: „läuft“ genau in den Bildern mit Bewegung, Blick links${art === '2d' ? ', Lauf-Animation' : ''} (${bewegt.length} von ${g1.length} Bildern bewegt)`);
    const d1 = mitZeit(danach).slice(1);   // erstes Bild nach dem Loslassen darf noch den letzten Schritt zeigen
    t.pruefe(d1.length >= 1 && d1.every((b) => !b.laeuft && !b.bewegt && b.blick === -1 && (art !== '2d' || b.animation === 'stand')),
      `Daumen weg: steht${art === '2d' ? ', Stand-Animation' : ''}, Blick bleibt (${d1.length} Bilder)`);

    // Joystick: rechts ziehen → x wächst, Loslassen → Stillstand.
    const vorRechts = await lies(s, () => window.spiel.spieler.x);
    await t.ziehe(s, g.b * 0.2, g.h * 0.6, g.b * 0.2 + 60, g.h * 0.6, { halteMs: 500 });
    const nachRechts = await lies(s, () => window.spiel.spieler.x);
    t.pruefe(nachRechts > vorRechts, `Joystick rechts → Figur nach rechts (${vorRechts.toFixed(2)} → ${nachRechts.toFixed(2)})`);
    await bilder(s, 2);
    const los1 = await lies(s, () => window.spiel.spieler.x);
    await bilder(s, 15);
    t.pruefe(await lies(s, () => window.spiel.spieler.x) === los1 && !(await lies(s, () => window.spiel.joystickAktiv)), 'Loslassen → Stillstand, Joystick gelöst');
    // Oben ziehen → y wird kleiner (3D: vom Bildschirm weg).
    const y0 = await lies(s, () => window.spiel.spieler.y);
    await t.ziehe(s, g.b * 0.2, g.h * 0.6, g.b * 0.2, g.h * 0.6 - 60, { halteMs: 300 });
    t.pruefe(await lies(s, () => window.spiel.spieler.y) < y0, 'Joystick oben → Figur nach oben');
    // Abbruch durch Safari (touchCancel) → Stillstand.
    const cdp = await t.ziehe(s, g.b * 0.2, g.h * 0.6, g.b * 0.2 + 60, g.h * 0.6, { loslassen: false });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    await bilder(s, 2);
    const abbruch = await lies(s, () => window.spiel.spieler.x);
    await bilder(s, 10);
    t.pruefe(await lies(s, () => window.spiel.spieler.x) === abbruch && !(await lies(s, () => window.spiel.joystickAktiv)), 'Abbruch (touchCancel) → Stillstand');
    // Zum Ziel laufen (Muster aus wissen/testen.md): Richtung ziehen, halten, nachmessen, wiederholen.
    const feld = await lies(s, () => window.spiel.feld);
    const ziel = { x: feld.minX + (feld.maxX - feld.minX) * 0.3, y: feld.minY + (feld.maxY - feld.minY) * 0.4 };
    const gelaufen = await t.laufeZu(s, ziel, { position: () => ({ x: window.spiel.spieler.x, y: window.spiel.spieler.y }), tempo: SPIELER.tempo, naehe: SPIELER.tempo * 0.1 });   // 0,1 s Weg: 2D 22 Punkte, 3D 0,5 m
    t.pruefe(gelaufen.angekommen, `Figur läuft per Joystick zum Ziel (${gelaufen.anlaeufe} Anläufe, Abstand ${gelaufen.abstand.toFixed(2)})`);
    if (art === '2d') {
      // Ganz nach oben laufen (Finger halten, bis die Figur am oberen Rand steht; nicht nach Zeit, unter Last ist das
      // Spiel langsamer): Der Kopf bleibt unter ALLEN Bedienelementen oben (Leiste und Ton-Knopf), auch im Lauf-Rahmen.
      const hoch = await t.ziehe(s, g.b * 0.2, g.h * 0.75, g.b * 0.2, g.h * 0.75 - 60, { loslassen: false });
      await s.waitForFunction(() => window.spiel.spieler.y <= window.spiel.feld.minY + 0.5, null, { timeout: t.ZEITGRENZE });
      await hoch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      const kopfHoehe = Math.max(...figurRahmen().map((r) => r.ankerY)) * SPIELER.skala;   // größter Ausschlag aller Rahmen
      const oben = await lies(s, (kopf) => {
        const unten = (id) => document.getElementById(id).getBoundingClientRect().bottom;
        return { kopf: window.spiel.spieler.y - kopf, leiste: unten('leiste'), knopf: unten('knopf-ton'), feldOben: window.spiel.feldOben };
      }, kopfHoehe);
      t.pruefe(oben.leiste > 0 && oben.knopf > 0 && oben.kopf >= oben.leiste && oben.kopf >= oben.knopf,
        `2D: Kopf der Figur (${oben.kopf.toFixed(1)}) bleibt unter Leiste (${oben.leiste.toFixed(1)}) und Ton-Knopf (${oben.knopf.toFixed(1)})`);
      // Jedes sichtbare Bedienelement im oberen Viertel muss data-oben haben, sonst rechnet das Spielfeld es nicht mit.
      const ohneMarke = await lies(s, () => [...document.querySelectorAll('#oberflaeche > *')].filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.bottom < innerHeight / 4 && getComputedStyle(e).display !== 'none' && !e.hasAttribute('data-oben');
      }).map((e) => e.id || e.tagName));
      t.pruefe(!ohneMarke.length, `2D: alle Bedienelemente oben tragen data-oben ${ohneMarke.join(', ')}`);
      // Platz für einen dritten Wert in der Leiste (z. B. Leben): eine Zeile, kein Überlappen mit dem Ton-Knopf.
      // Wächst die Leiste (zu viel Text → zweite Zeile), rückt das Spielfeld nach.
      const leiste = await lies(s, () => {
        const l = document.getElementById('leiste'), k = document.getElementById('knopf-ton').getBoundingClientRect();
        const neu = document.createElement('span');
        neu.textContent = 'Leben 3';
        l.append(neu);
        document.getElementById('leiste-punkte').textContent = 'Punkte 999';   // dreistellige Werte: ehrlicher Platzbedarf
        document.getElementById('leiste-zeit').textContent = 'Zeit 120';
        const teile = [...l.children].map((e) => e.getBoundingClientRect());
        const ueberlappt = teile.some((r) => r.right > k.left && r.left < k.right && r.bottom > k.top && r.top < k.bottom);
        return { ueberlappt, zeilen: new Set(teile.map((r) => Math.round(r.top))).size, tops: teile.map((r) => `${Math.round(r.left)}/${Math.round(r.top)}`).join(' '), rechts: Math.max(...teile.map((r) => r.right)), knopfLinks: k.left };
      });
      t.pruefe(!leiste.ueberlappt && leiste.zeilen === 1, `2D: Leiste mit drei Werten in einer Zeile, frei vom Ton-Knopf (${leiste.tops}; rechts ${leiste.rechts.toFixed(0)}, Knopf ab ${leiste.knopfLinks.toFixed(0)})`);
      const vorher = await lies(s, () => window.spiel.feld.minY);
      await s.evaluate(() => { const neu = document.createElement('span'); neu.id = 'test-lang'; neu.textContent = 'Münzen 999'; document.getElementById('leiste').append(neu); });
      await s.waitForFunction((alt) => window.spiel.feld.minY > alt, vorher, { timeout: t.ZEITGRENZE }).catch(() => {});
      const gewachsen = await lies(s, () => {
        const l = document.getElementById('leiste').getBoundingClientRect();
        return { minY: window.spiel.feld.minY, leiste: l.bottom, rechts: l.right, knopfLinks: document.getElementById('knopf-ton').getBoundingClientRect().left, feldOben: window.spiel.feldOben };
      });
      t.pruefe(gewachsen.minY > vorher && gewachsen.feldOben >= gewachsen.leiste - 0.5 && gewachsen.rechts <= gewachsen.knopfLinks,
        `2D: Leiste wächst auf zwei Zeilen statt unter den Ton-Knopf (endet bei ${gewachsen.rechts.toFixed(0)}, Knopf ab ${gewachsen.knopfLinks.toFixed(0)}) → Spielfeld rückt nach (oben ${vorher.toFixed(1)} → ${gewachsen.minY.toFixed(1)})`);
      await s.evaluate(() => { const l = document.getElementById('leiste'); while (l.children.length > 2) l.lastChild.remove(); });
    }
    const p = await lies(s, () => ({ punkte: window.spiel.punkte, weg: window.spiel.spieler.weg }));
    t.pruefe(p.weg > 0 && p.punkte === Math.floor(p.weg / SPIELER.wegProPunkt), `Punkte aus dem Weg (${p.punkte} für ${p.weg.toFixed(1)})`);

    // Tab-Wechsel mit gehaltenem Finger: Pause, Joystick gelöst, danach kein Zeitsprung.
    const halt = await t.ziehe(s, g.b * 0.2, g.h * 0.6, g.b * 0.2 + 60, g.h * 0.6, { loslassen: false });
    await tab(s, true);
    const zeitVersteckt = await lies(s, () => window.spiel.zeit);
    await warte(600);
    const versteckt = await lies(s, () => ({ zeit: window.spiel.zeit, pausiert: window.spiel.pausiert, joy: window.spiel.joystickAktiv }));
    t.pruefe(versteckt.pausiert && versteckt.zeit === zeitVersteckt && !versteckt.joy, 'Tab versteckt: Pause, Zeit steht, Joystick gelöst');
    await tab(s, false);
    await bilder(s, 3);
    const zurueck = await lies(s, () => window.spiel.zeit);
    t.pruefe(!(await lies(s, () => window.spiel.pausiert)) && zeitVersteckt - zurueck < 0.35, `Nach der Rückkehr kein Sprung (${(zeitVersteckt - zurueck).toFixed(3)} s in 3 Bildern)`);
    await halt.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

    // 3D: Zeichenaufrufe in jedem Bild mitschreiben, das Höchste prüfen (renderer.info zeigt nur das letzte Bild).
    if (art === '3d') {
      const { DREI } = await lade('js/config/welt.js');
      const hoechstens = await s.evaluate(() => new Promise((fertig) => {
        let max = 0, n = 0;
        (function zaehle() { max = Math.max(max, window.spiel.zeichenaufrufe); n++ < 30 ? requestAnimationFrame(zaehle) : fertig(max); })();
      }));
      t.pruefe(hoechstens > 0 && hoechstens <= DREI.zeichenaufrufeMax, `3D: höchstens ${hoechstens} Zeichenaufrufe pro Bild (Grenze ${DREI.zeichenaufrufeMax})`);
    }
    await t.foto(s, FOTO);   // bei Pause: Ein langsames Foto lässt die Zeit nicht weiterlaufen
    console.log(`       Bildschirmfoto: ${FOTO}`);

    // Runde endet auf dem normalen Weg → Ende, Rekord gespeichert; Tippen → neue Runde.
    const punkte = await lies(s, () => window.spiel.punkte);
    await s.evaluate(() => window.spiel.test.setzeZeit(0.05));
    await s.waitForFunction(() => window.spiel.zustand === 'ende', null, { timeout: t.ZEITGRENZE });
    const ende = await lies(s, () => ({ rekord: window.spiel.rekord, tafel: !document.getElementById('ende').hidden, text: document.getElementById('ende-punkte').textContent }));
    t.pruefe(punkte > 0 && ende.tafel && ende.text === `Punkte: ${punkte}` && ende.rekord === punkte, `Ende-Tafel mit Punkten, Rekord ${ende.rekord}`);
    const { SPEICHER } = await lade('js/config/spiel.js');
    const gespeichert = await lies(s, (k) => JSON.parse(localStorage.getItem(k) || '{}'), SPEICHER.schluessel);
    t.pruefe(gespeichert.rekord === punkte && gespeichert.ton === true, `Rekord und Ton gespeichert (${JSON.stringify(gespeichert)})`);
    await t.tippe(s, g.b * 0.75, g.h * 0.5);
    await bilder(s, 2);
    const neu = await lies(s, () => ({ zustand: window.spiel.zustand, punkte: window.spiel.punkte, weg: window.spiel.spieler.weg }));
    t.pruefe(neu.zustand === 'spiel' && neu.punkte === 0 && neu.weg === 0, 'Tippen auf dem Ende → neue Runde, alles zurückgesetzt');
    // Beim ersten Tippen wird die Sound-Datei erst dekodiert (Code-Klang als Ersatz); jetzt spielt die Datei.
    t.pruefe(await lies(s, () => window.__puffer) >= 1, `Start-Klang aus der Sound-Datei gespielt (${await lies(s, () => window.__puffer)} Mal)`);

    await s.reload();
    await s.waitForFunction(IM_TITEL, null, { timeout: t.ZEITGRENZE });
    t.pruefe(await lies(s, () => window.spiel.rekord) === punkte, 'Nach dem Neuladen ist der Rekord noch da');
    t.pruefe(await lies(s, () => document.getElementById('titel-rekord').textContent) === `Rekord: ${punkte}`, 'Titel zeigt den Rekord');
    t.pruefe(lauf.fehler.length === 0, `mit ?test=1: keine Konsolenfehler ${lauf.fehler.join(' | ')}`);
  } catch (e) { t.pruefe(false, `Ablauf abgebrochen: ${e.message}`); }
  await lauf.ende();
}

async function speicherFaelle() {
  const { SPEICHER } = await lade('js/config/spiel.js');
  const kaputt = await t.starte({
    ordner: ORDNER, port: PORT, warteAuf: IM_TITEL,
    initSkript: { content: `localStorage.setItem(${JSON.stringify(SPEICHER.schluessel)}, '{kaputt');` },
  });
  try {
    t.pruefe(await lies(kaputt.seite, () => window.spiel.rekord) === 0 && kaputt.fehler.length === 0, `kaputter Speicherstand → Standardwerte, keine Fehler ${kaputt.fehler.join(' | ')}`);
  } catch (e) { t.pruefe(false, `kaputter Speicher: ${e.message}`); }
  await kaputt.ende();
  const privat = await t.starte({
    ordner: ORDNER, port: PORT, warteAuf: IM_TITEL,
    initSkript: { content: "Object.defineProperty(window, 'localStorage', { get() { throw new Error('gesperrt'); } });" },
  });
  try {
    const s = privat.seite;
    await t.tippe(s, 300, 300);
    await bilder(s, 2);
    t.pruefe(await lies(s, () => window.spiel.zustand) === 'spiel' && privat.fehler.length === 0, `privater Modus (localStorage gesperrt) → Spiel läuft ${privat.fehler.join(' | ')}`);
  } catch (e) { t.pruefe(false, `privater Modus: ${e.message}`); }
  await privat.ende();
}

async function ersatzFaelle() {
  // Bilder und Atlanten fehlen (404): Spiel läuft mit Ersatz, nur die Browser-Zeile „Failed to load resource“.
  const fehlt = await t.starte({
    ordner: ORDNER, port: PORT, warteAuf: IM_TITEL,
    routen: (k) => k.route(/\/assets\/(atlas|bilder|modelle)\//, (route) => route.fulfill({ status: 404, body: '' })),
  });
  try {
    const a = await lies(fehlt.seite, () => window.spiel.assets);
    t.pruefe(a.fehlend.length > 0 && a.ersetzt.length > 0, `Bild fehlt → Ersatz (${a.ersetzt.join(', ')})`);
    t.pruefe(nurLadefehler(fehlt.fehler), `Bild fehlt: nur Ladefehler des Browsers ${fehlt.fehler.join(' | ')}`);
    if (await lies(fehlt.seite, () => window.spiel.darstellung) === '2d') {
      t.pruefe(await lies(fehlt.seite, () => window.spiel.figur) === 'ersatz', '2D: Atlas fehlt → Ersatz-Figur');
      // Jeder Rahmen des Atlas (Figur, Gegner, Effekte) und jede Animation hat einen Ersatz in derselben Größe mit
      // demselben Fußpunkt, sonst ist bei fehlendem Atlas etwas unsichtbar. Neue Rahmen brauchen nichts Neues im Test.
      const soll = atlasAufDerPlatte(), ist = await lies(fehlt.seite, () => ({ rahmen: window.spiel.rahmen, animationen: window.spiel.animationen }));
      const ohne = Object.entries(soll.rahmen).filter(([n, r]) => !ist.rahmen[n] || !ist.rahmen[n].ersatz
        || ['b', 'h', 'ankerX', 'ankerY'].some((k) => Math.abs(ist.rahmen[n][k] - r[k]) > 1)).map(([n]) => n);
      const ohneAnimation = Object.keys(soll.animationen).filter((n) => !ist.animationen.includes(n));
      t.pruefe(Object.keys(soll.rahmen).length > 0 && !ohne.length && !ohneAnimation.length,
        `2D: Atlas fehlt → Ersatz für alle ${Object.keys(soll.rahmen).length} Rahmen und ${Object.keys(soll.animationen).length} Animationen (gleiche Größe, gleicher Fußpunkt)${ohne.length || ohneAnimation.length ? ` – fehlt: ${[...ohne, ...ohneAnimation].join(', ')}` : ''}`);
    }
    await t.foto(fehlt.seite, FOTO.replace(/\.png$/, '-ersatz.png'));
  } catch (e) { t.pruefe(false, `Bild fehlt: ${e.message}`); }
  await fehlt.ende();
  const { LADEN } = await lade('js/config/spiel.js');
  // 2D: Atlas da, aber ohne den Rahmen der Figur (Bild umbenannt) → Ersatz-Figur statt unsichtbarer Figur.
  const { SPIELER, ERSATZ } = await lade('js/config/welt.js');
  if (ERSATZ) {
    const umbenannt = await t.starte({
      ordner: ORDNER, port: PORT, warteAuf: IM_TITEL,
      routen: (k) => k.route(/\/assets\/atlas\/[^/]+\.json/, async (route) => {
        const antwort = await route.fetch(), daten = await antwort.json();
        if (daten.rahmen[SPIELER.rahmen]) { daten.rahmen.anders = daten.rahmen[SPIELER.rahmen]; delete daten.rahmen[SPIELER.rahmen]; }
        route.fulfill({ response: antwort, json: daten });
      }),
    });
    try {
      const s = umbenannt.seite;
      await t.tippe(s, 300, 300);
      await bilder(s, 2);
      const u = await lies(s, () => ({ figur: window.spiel.figur, zustand: window.spiel.zustand }));
      t.pruefe(u.figur === 'ersatz' && u.zustand === 'spiel' && umbenannt.fehler.length === 0, `2D: Rahmen „${SPIELER.rahmen}“ fehlt im Atlas → Ersatz-Figur, Spiel läuft (${u.figur}) ${umbenannt.fehler.join(' | ')}`);
    } catch (e) { t.pruefe(false, `Rahmen fehlt: ${e.message}`); }
    await umbenannt.ende();
  }
  // Sound-Datei fehlt (404) oder hängt (Server antwortet nie): Titel kommt, Tippen spielt den Code-Klang als Ersatz.
  for (const [fall, route] of [['fehlt', (r) => r.fulfill({ status: 404, body: '' })], ['hängt', () => {}]]) {
    const beginn = Date.now();
    const lauf = await t.starte({
      ordner: ORDNER, port: PORT, warteAuf: null, initSkript: ZAEHLE_PUFFER,
      routen: (k) => k.route(/\/assets\/sounds\//, route),
    });
    try {
      const s = lauf.seite;
      await s.waitForFunction(IM_TITEL, null, { timeout: LADEN.zeitgrenze * 2 + t.ZEITGRENZE / 2 });
      const dauer = (Date.now() - beginn) / 1000;
      const a = await lies(s, () => window.spiel.assets);
      t.pruefe(a.ersetzt.includes('start'), `Sound ${fall} → nach ${dauer.toFixed(1)} s Titel, „start“ ersetzt (${a.ersetzt.join(', ')})`);
      await t.tippe(s, 300, 300);
      await bilder(s, 3);
      const k = await lies(s, () => ({ zustand: window.spiel.zustand, klaenge: window.spiel.ton.klaenge, puffer: window.__puffer }));
      t.pruefe(k.zustand === 'spiel' && k.klaenge >= 1 && k.puffer === 0 && nurLadefehler(lauf.fehler), `Sound ${fall} → Spiel startet, Code-Klang statt Datei (${k.klaenge} Klang, ${k.puffer} Datei) ${lauf.fehler.join(' | ')}`);
    } catch (e) { t.pruefe(false, `Sound ${fall}: ${e.message}`); }
    await lauf.ende();
  }
  // Manifest hängt (Server antwortet nie): nach der Zeitgrenze läuft das Spiel trotzdem.
  const beginn = Date.now();
  const haengt = await t.starte({
    ordner: ORDNER, port: PORT, warteAuf: null,
    routen: (k) => k.route('**/assets/assets.json', () => {}),
  });
  try {
    const s = haengt.seite;
    await s.waitForFunction(IM_TITEL, null, { timeout: LADEN.zeitgrenze * 2 + t.ZEITGRENZE / 2 });
    const dauer = Date.now() - beginn;
    await t.tippe(s, 300, 300);
    await bilder(s, 2);
    t.pruefe(await lies(s, () => window.spiel.zustand) === 'spiel' && nurLadefehler(haengt.fehler), `Manifest hängt → nach ${(dauer / 1000).toFixed(1)} s Titel, Spiel startet ${haengt.fehler.join(' | ')}`);
  } catch (e) { t.pruefe(false, `Manifest hängt: ${e.message}`); }
  await haengt.ende();
}

(async () => {
  try {
    const SPIELER = await regeln();
    await ohneTestModus();
    await ablauf(SPIELER);
    await speicherFaelle();
    await ersatzFaelle();
  } catch (e) { t.pruefe(false, `Test abgebrochen: ${e.message}`); }
  t.ergebnis();
})();
