// Test für Übung 9 (Assets), Teil 1: Dateien, Ladebildschirm, Held, Münzen, Explosion mit Sound (Ports 8890–8891).
// Teil 2 (fehlende und hängende Dateien, modell.html): test-ersatz.js. Beide: node ausbildung/uebungen/stufe-9/test.js
// ORDNER=<anderer Ordner> lässt denselben Test gegen eine Kopie laufen (Gegenprobe). FOTO_ORDNER: wohin die Fotos kommen.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const t = require('../../../werkzeuge/test-hilfe.js');
const h = require('./test-hilfen.js');

const ORDNER = process.env.ORDNER || 'ausbildung/uebungen/stufe-9';
const VOLL = path.resolve(t.REPO, ORDNER);
const WERKZEUGE = path.resolve(t.REPO, '.claude/skills/game-programmierung/werkzeuge');

function dateiTests() {
  const manifest = JSON.parse(fs.readFileSync(path.join(VOLL, 'assets', 'assets.json'), 'utf8'));
  t.pruefe(typeof manifest.version === 'string' && manifest.version.length >= 6, `assets.json hat eine Version (${manifest.version})`);
  const atlas = JSON.parse(fs.readFileSync(path.join(VOLL, 'assets', manifest.atlanten[0].daten), 'utf8'));
  t.pruefe(atlas.breite <= 2048 && atlas.hoehe <= 2048 && manifest.atlanten.every((a) => a.breite <= 2048 && a.hoehe <= 2048), `Atlas höchstens 2048 × 2048 (${atlas.breite} × ${atlas.hoehe})`);
  const rahmen = Object.values(atlas.rahmen);
  let kleinster = Infinity;
  for (let i = 0; i < rahmen.length; i++) for (let j = 0; j < i; j++) {
    const a = rahmen[i], b = rahmen[j];
    kleinster = Math.min(kleinster, Math.max(a.x - (b.x + b.b), b.x - (a.x + a.b), a.y - (b.y + b.h), b.y - (a.y + a.h)));
  }
  t.pruefe(kleinster >= 2, `Rahmen mit Abstand (kleinster ${kleinster} px, ${rahmen.length} Rahmen)`);
  const an = atlas.animationen;
  t.pruefe(an['held-lauf']?.rahmen.join() === 'held-lauf-1,held-lauf-2,held-lauf-3,held-lauf-4,held-lauf-5,held-lauf-6' && an['held-lauf'].bps === 10 && an['held-lauf'].schleife,
    'Animation held-lauf: 6 Rahmen der Reihe nach, 10 bps, Schleife (Meldung)');
  t.pruefe(an.explosion?.bps === 15 && an.explosion.schleife === false && an.explosion.rahmen.length === 6 && an.muenze?.bps === 10 && an.muenze.schleife,
    'Animation explosion: 15 bps, einmal; muenze: 10 bps, Schleife (Meldung)');
  const s = atlas.rahmen['held-steht'], l = atlas.rahmen['held-lauf-1'];
  const e = atlas.rahmen['explosion-3'];
  const fussUnten = (q) => q && q.ankerX > 0 && q.ankerX < q.b && q.ankerY > q.h - 15 && q.ankerY <= q.h;
  t.pruefe(fussUnten(s) && fussUnten(l) && Math.abs(e.ankerX - e.b / 2) < 12 && Math.abs(e.ankerY - e.h / 2) < 12,
    `Rahmen mit Anker: Held am Fußpunkt unten (${s.ankerX}, ${s.ankerY} in ${s.b} × ${s.h}), Explosion in der Mitte`);
  const sound = manifest.sounds.find((x) => x.name === 'explosion');
  const endungen = (sound?.dateien || []).map((d) => path.extname(d)).join();
  const codecs = (sound?.dateien || []).map((d) => spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_name', '-of', 'csv=p=0', path.join(VOLL, 'assets', d)], { encoding: 'utf8' }).stdout.trim());
  t.pruefe(endungen === '.m4a,.mp3' && codecs.join() === 'aac,mp3', `Sound „explosion“ als .m4a (AAC) und .mp3 (${codecs.join(', ')})`);

  // manifest.js auf einer Kopie: Budget-Meldung, assets.json ist aktuell (gleiche Version), Grenze → Rückgabewert 1
  const kopie = fs.mkdtempSync(path.join(os.tmpdir(), 'stufe9-manifest-'));
  fs.cpSync(path.join(VOLL, 'assets'), path.join(kopie, 'assets'), { recursive: true });
  const lauf = spawnSync(process.execPath, [path.join(WERKZEUGE, 'manifest.js'), kopie], { encoding: 'utf8' });
  const neu = JSON.parse(fs.readFileSync(path.join(kopie, 'assets', 'assets.json'), 'utf8'));
  t.pruefe(lauf.status === 0 && /Budget Startpaket/.test(lauf.stdout) && /Bildspeicher/.test(lauf.stdout), `manifest.js meldet das Budget: ${lauf.stdout.split('\n').slice(1, 3).join(' / ').replace(/\s+/g, ' ')}`);
  t.pruefe(neu.version === manifest.version, 'assets.json ist aktuell (manifest.js ergibt dieselbe Version)');
  fs.writeFileSync(path.join(kopie, 'assets', 'quellen', 'manifest.json'), JSON.stringify({ budget: { startpaketBytes: 10000 } }));
  t.pruefe(spawnSync(process.execPath, [path.join(WERKZEUGE, 'manifest.js'), kopie]).status === 1, 'manifest.js: Startpaket über der Grenze → Rückgabewert 1');
  fs.rmSync(kopie, { recursive: true, force: true });
  return manifest.version;
}

// Laden verzögert: Ladebildschirm zuerst, Fortschritt steigt nur, erreicht 1, dann „start“, Tippen → „laeuft“.
async function ladeTest() {
  const VERZOEGERUNG = { 'assets.json': 300, 'spiel.json': 400, 'wiese.png': 900, 'spiel.png': 1500, 'explosion.m4a': 2100 };
  const lauf = await t.starte({ ordner: ORDNER, port: 8890, routen: (k) => k.route('**/assets/**', async (r) => {
    const name = new URL(r.request().url()).pathname.split('/').pop();
    await new Promise((fertig) => setTimeout(fertig, VERZOEGERUNG[name] || 0));
    r.continue();
  }) });
  const { seite } = lauf;
  try {
    const frueh = await seite.evaluate(() => ({ zustand: window.spiel.zustand, fortschritt: window.spiel.fortschritt,
      laden: getComputedStyle(document.getElementById('laden')).display !== 'none', start: !document.getElementById('start').hidden, test: 'test' in window.spiel }));
    t.pruefe(frueh.zustand === 'laden' && frueh.laden && !frueh.start && frueh.fortschritt < 1, `Ladebildschirm erscheint, bevor die Assets da sind (bereit, zustand ${frueh.zustand}, ${frueh.fortschritt})`);
    t.pruefe(!frueh.test, 'ohne ?test=1 kein spiel.test');
    await seite.screenshot({ path: h.foto('laden') });
    const verlauf = await seite.evaluate(() => new Promise((fertig) => {
      const werte = [];
      (function schau() {
        werte.push(window.spiel.fortschritt);
        window.spiel.zustand === 'start' || werte.length > 1200 ? fertig(werte) : requestAnimationFrame(schau);
      })();
    }));
    const stufen = [...new Set(verlauf)];
    t.pruefe(verlauf.every((w, i) => i === 0 || w >= verlauf[i - 1]), `Fortschritt steigt nie zurück (${stufen.map((w) => w.toFixed(2)).join(' → ')})`);
    t.pruefe(verlauf.at(-1) === 1 && stufen.length >= 4, 'Fortschritt erreicht 1, in mehreren Schritten');
    const nachher = await seite.evaluate(() => ({ zustand: window.spiel.zustand, laden: !document.getElementById('laden').hidden, start: !document.getElementById('start').hidden }));
    t.pruefe(nachher.zustand === 'start' && !nachher.laden && nachher.start, 'danach „start“: „Tippen zum Starten“ statt Balken');
    await seite.screenshot({ path: h.foto('start') });
    await t.tippe(seite, 200, 500);
    await h.bilder(seite, 2);
    const z = await seite.evaluate(() => ({ zustand: window.spiel.zustand, start: !document.getElementById('start').hidden, explosionen: window.spiel.explosionen }));
    t.pruefe(z.zustand === 'laeuft' && !z.start && z.explosionen === 0, 'Tippen → „laeuft“, Tafel weg, das Start-Tippen löst keine Explosion aus');
    t.pruefe(lauf.fehler.length === 0, `keine Konsolenfehler ohne ?test=1 ${lauf.fehler.join(' | ')}`);
  } catch (e) { t.pruefe(false, `Ladetest abgebrochen: ${e.message}`); }
  await lauf.ende();
}

async function spielTest(version) {
  const anfragen = [];
  const lauf = await t.starte({ ordner: ORDNER, port: 8891, pfad: 'index.html?test=1', initSkript: h.ZAEHLER,
    routen: async (k) => k.on('request', (r) => anfragen.push(r.url())) });
  const { seite } = lauf;
  const lies = () => seite.evaluate(() => JSON.parse(JSON.stringify({ ...window.spiel, z: window.__zaehler })));
  try {
    await seite.waitForFunction(() => window.spiel.zustand === 'start', null, { timeout: 12000 });
    let s = await lies();
    t.pruefe(s.assets.geladen.slice().sort().join() === 'explosion,spiel,wiese' && !s.assets.ersetzt.length && !s.assets.fehlend.length, `alle Assets geladen (${s.assets.geladen.join(', ')}), nichts ersetzt`);
    t.pruefe(s.atlas.breite > 0 && s.atlas.breite <= 2048 && s.atlas.hoehe <= 2048, `spiel.atlas ${s.atlas.breite} × ${s.atlas.hoehe}`);
    const asset = anfragen.filter((u) => /\/assets\/(atlas|bilder|sounds)\//.test(u));
    t.pruefe(asset.length >= 4 && asset.every((u) => u.endsWith(`?v=${version}`)), `alle Asset-Adressen tragen ?v=${version} (${asset.length})`);
    t.pruefe(s.sounds.dekodiert === 0 && s.held.animation === 'held-steht', 'vor dem Tippen: nichts dekodiert (Ton erst nach Berührung), Held steht schon');
    await t.tippe(seite, 200, 500);
    await seite.waitForFunction(() => window.spiel.sounds.dekodiert >= 1, null, { timeout: 5000 });
    s = await lies();
    t.pruefe(s.zustand === 'laeuft' && s.sounds.dekodiert === 1, 'nach dem Tippen: „laeuft“, Sound dekodiert');
    t.pruefe(s.held.animation === 'held-steht' && s.held.rahmen === 0 && s.held.blick === 1, 'im Stand: held-steht, Blick rechts');

    // Rechts laufen, voller Ausschlag → Rennen, 14 Bilder pro Sekunde
    const x0 = s.held.x;
    // 2,5 s messen: ein Rahmenschritt mehr oder weniger ändert das Ergebnis dann nur um 0,4 bps. Am Rand läuft die
    // Animation weiter, solange der Daumen drückt (Verhalten am Rand: Frage an Lukas, SCHULDEN.md).
    let cdp = await t.ziehe(seite, 60, 420, 140, 420, { loslassen: false });
    let spur = await h.zeichneAuf(seite, 2500);
    t.pruefe(spur.slice(3).every((p) => p.animation === 'held-lauf' && p.blick === 1), 'Joystick rechts: Animation held-lauf, Blick rechts');
    t.pruefe(spur.at(-1).x > x0 + 50, `Held läuft nach rechts (${Math.round(x0)} → ${Math.round(spur.at(-1).x)})`);
    let r = h.rahmenTempo(spur.slice(3));
    t.pruefe(r.bps > 12.8 && r.bps < 15.2 && r.verschiedene === 6, `Rahmen wechseln mit 14 bps (Rennen, Meldung): ${r.bps.toFixed(1)} bps, alle 6 Rahmen`);
    t.pruefe(spur.every((p) => p.gespiegelt === spur[0].gespiegelt), 'Blick rechts: nicht gespiegelt');
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    spur = await h.zeichneAuf(seite, 300);
    t.pruefe(spur.slice(2).every((p) => p.animation === 'held-steht' && p.x === spur[2].x), 'Loslassen: sofort held-steht, Held steht still');

    // Halber Ausschlag → Gehen (zwischen 10 und 14 bps)
    cdp = await t.ziehe(seite, 60, 420, 85, 420, { loslassen: false });
    spur = await h.zeichneAuf(seite, 2500);
    r = h.rahmenTempo(spur.slice(3));
    t.pruefe(r.bps > 11 && r.bps < 13, `halber Ausschlag: ${r.bps.toFixed(1)} bps (Gehen 10 … Rennen 14, Mitte 12)`);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });

    // Links laufen: Blick −1, gespiegelt gezeichnet (auch im Stand danach)
    cdp = await t.ziehe(seite, 140, 420, 60, 420, { loslassen: false });
    spur = await h.zeichneAuf(seite, 800);
    const gespiegelt = spur.at(-1).gespiegelt - spur[3].gespiegelt;
    t.pruefe(spur.slice(3).every((p) => p.blick === -1 && p.animation === 'held-lauf') && spur.at(-1).x < spur[3].x, 'Joystick links: Blick −1, läuft nach links');
    t.pruefe(gespiegelt >= spur.length - 5, `Blick links: Held wird gespiegelt gezeichnet (${gespiegelt} von ${spur.length - 3} Bildern)`);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    spur = await h.zeichneAuf(seite, 300);
    t.pruefe(spur.at(-1).blick === -1 && spur.at(-1).gespiegelt > spur[1].gespiegelt && spur.at(-1).animation === 'held-steht', 'nach dem Loslassen: steht, schaut weiter nach links');

    // Explosion rechts: einmal ablaufen, verschwinden, Sound
    s = await lies();
    await t.tippe(seite, 300, 250);
    const ablauf = await h.zeichneAuf(seite, 1000);
    const n = await lies();
    const aktiv = ablauf.filter((p) => p.explosionen === 1);
    const dauer = h.spielzeit(aktiv);
    t.pruefe(ablauf[0].explosionen === 1 && ablauf.at(-1).explosionen === 0 && aktiv.length === ablauf.findIndex((p) => p.explosionen === 0),
      `Explosion läuft einmal ab und verschwindet (${dauer.toFixed(2)} s, Soll 6 Rahmen / 15 bps = 0,4 s)`);
    t.pruefe(Math.abs(dauer - 0.4) < 0.12, 'Explosion dauert etwa 0,4 s');
    t.pruefe(n.sounds.abgespielt === s.sounds.abgespielt + 1 && n.z.puffer === s.z.puffer + 1, `Explosion spielt den Sound (abgespielt ${n.sounds.abgespielt}, Puffer gestartet ${n.z.puffer})`);
    await t.tippe(seite, 80, 600);
    await h.bilder(seite, 2);
    t.pruefe((await lies()).explosionen === 0, 'Tippen links (Joystick-Seite) löst keine Explosion aus');
    const viele = await seite.evaluate(() => { for (let i = 0; i < 12; i++) window.spiel.test.explosion(100 + i * 10, 300); return window.spiel.explosionen; });
    t.pruefe(viele === 8, `spiel.test.explosion: höchstens 8 gleichzeitig (${viele})`);
    await h.bilder(seite, 2);
    await seite.screenshot({ path: h.foto('explosionen') });
    await seite.waitForFunction(() => window.spiel.explosionen === 0, null, { timeout: 3000 });

    // Ton-Knopf: aus → Explosion ohne Sound, an → wieder mit
    const knopf = await seite.locator('#knopf-ton').boundingBox();
    await t.tippe(seite, knopf.x + knopf.width / 2, knopf.y + knopf.height / 2);
    s = await lies();
    await seite.evaluate(() => window.spiel.test.explosion(250, 300));
    let danach = await lies();
    t.pruefe(danach.explosionen === 1 && danach.sounds.abgespielt === s.sounds.abgespielt && danach.z.puffer === s.z.puffer, 'Ton-Knopf aus: Explosion ohne Sound');
    await seite.waitForTimeout(100);
    await t.tippe(seite, knopf.x + knopf.width / 2, knopf.y + knopf.height / 2);
    await seite.evaluate(() => window.spiel.test.explosion(250, 300));
    danach = await lies();
    t.pruefe(danach.sounds.abgespielt === s.sounds.abgespielt + 1, 'Ton-Knopf wieder an: Sound spielt');

    // Tab-Wechsel: Pause, Joystick gelöst, kein Sprung
    cdp = await t.ziehe(seite, 60, 420, 140, 420, { loslassen: false });
    await h.versteckeTab(seite, true);
    const xVersteckt = (await lies()).held.x;
    await seite.waitForTimeout(400);
    t.pruefe((await lies()).held.x === xVersteckt, 'Tab versteckt: Held steht (Pause)');
    await h.versteckeTab(seite, false);
    spur = await h.zeichneAuf(seite, 300);
    t.pruefe(spur.every((p) => p.animation === 'held-steht' && Math.abs(p.x - xVersteckt) < 1), 'nach der Rückkehr: Joystick gelöst, kein Sprung');
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    t.pruefe(lauf.fehler.length === 0, `keine Konsolenfehler mit ?test=1 ${lauf.fehler.join(' | ')}`);
  } catch (e) { t.pruefe(false, `Spieltest abgebrochen: ${e.message}`); }
  await lauf.ende();
}

(async () => {
  const version = dateiTests();
  await ladeTest();
  await spielTest(version);
  if (process.env.NUR_TEIL1) t.ergebnis();
  const teil2 = spawnSync(process.execPath, [path.join(__dirname, 'test-ersatz.js')], { encoding: 'utf8', env: process.env, timeout: 240000 });
  process.stdout.write(teil2.stdout || '');
  t.pruefe(teil2.status === 0, 'Teil 2 (test-ersatz.js) bestanden');
  t.ergebnis();
})();
