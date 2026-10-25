// Test für bausteine/ton.js: Regeln mit nachgebautem AudioContext ohne Browser, dann echtes WebAudio (Port 8884).
const h = require('./hilfe.js');
const b = require('./browser-hilfe.js');

// Nachgebauter AudioContext: zählt Kontexte, Oszillatoren und resume().
function erstelleAudioNachbau(zaehler, { startZustand = 'running', wirft = false } = {}) {
  const param = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} });
  const knoten = () => ({ connect(z) { return z; }, gain: param() });
  return class {
    constructor() {
      if (wirft) throw new Error('zu viele AudioContexts');
      zaehler.kontexte++;
      this.state = startZustand; this.currentTime = 0; this.destination = {};
    }
    createGain() { return knoten(); }
    createOscillator() { zaehler.oszillatoren++; return { ...knoten(), type: '', frequency: param(), start() {}, stop() {} }; }
    createBufferSource() { zaehler.quellen = (zaehler.quellen || 0) + 1; return { ...knoten(), buffer: null, start() { zaehler.gestartet = this.buffer; } }; }
    resume() { zaehler.resume++; this.state = 'running'; return Promise.resolve(); }
  };
}

const KLAENGE = { piep: { frequenz: 880, dauer: 0.1, art: 'triangle', laut: 0.3, gleiten: 440 }, tief: { frequenz: 180, dauer: 0.2, art: 'square', laut: 0.3, gleiten: -110 } };

async function regeln() {
  const { erstelleTon } = await h.lade('ton.js');
  const z = { kontexte: 0, oszillatoren: 0, resume: 0 };
  const ton = erstelleTon({ lautstaerke: 0.5, mindestAbstand: 0.05 }, KLAENGE, erstelleAudioNachbau(z, { startZustand: 'suspended' }));
  h.pruefe(!ton.bereit && ton.spiele('piep') === false && z.kontexte === 0, 'vor der ersten Berührung: nicht bereit, kein AudioContext, kein Klang');
  ton.wecke();
  h.pruefe(ton.bereit && z.kontexte === 1 && z.resume === 1, 'wecke(): ein AudioContext, angehaltener wird aufgeweckt');
  ton.wecke(); ton.wecke();
  h.pruefe(z.kontexte === 1, 'weitere Berührungen legen keinen zweiten AudioContext an');
  h.pruefe(ton.spiele('piep') === true && z.oszillatoren === 1, 'spiele(piep) → ein Oszillator');
  h.pruefe(ton.spiele('piep') === false && ton.spiele('tief') === true, 'gleicher Klang sofort wieder → nein; anderer Klang → ja');
  ton.an = false;
  h.pruefe(ton.spiele('tief') === false, 'Ton aus → kein Klang');
  ton.an = true;
  h.pruefe(ton.spiele('gibtsnicht') === false, 'unbekannter Klang → nichts, kein Absturz');
  h.pruefe(ton.audio !== null && typeof ton.audio.createGain === 'function', 'ton.audio ist der AudioContext (für dekodiereSounds)');
  const puffer = { dauer: 0.5 };
  ton.setzePuffer('datei', puffer, 0.7);
  ton.setzePuffer('leer', null);
  const oszVorher = z.oszillatoren;
  let gespielt = false;
  try { gespielt = ton.spiele('datei'); } catch (e) { gespielt = `Absturz: ${e.message}`; }   // rot statt Absturz
  h.pruefe(gespielt === true && z.quellen === 1 && z.gestartet === puffer && z.oszillatoren === oszVorher, `Puffer (Sound-Datei): spielt über AudioBufferSourceNode, kein Oszillator (${gespielt})`);
  h.pruefe(ton.spiele('datei') === false && z.quellen === 1, 'Puffer: gleicher Sound sofort wieder → ausgelassen (Abstand gilt auch hier)');
  h.pruefe(ton.spiele('leer') === false, 'setzePuffer ohne Puffer (Dekodieren fehlgeschlagen) → nichts gespeichert, Stille');
  ton.an = false;
  h.pruefe(ton.spiele('datei') === false, 'Puffer: Ton aus → kein Sound');
  ton.an = true;
  const stumm = erstelleTon({}, KLAENGE, erstelleAudioNachbau(z));
  h.pruefe(stumm.audio === null, 'vor wecke(): ton.audio ist null');

  const ohne = erstelleTon({}, KLAENGE, null);
  const vorher = globalThis.AudioContext;
  delete globalThis.AudioContext;
  ohne.wecke();
  h.pruefe(!ohne.bereit && ohne.spiele('piep') === false, 'ohne WebAudio: bleibt stumm, kein Absturz');
  globalThis.AudioContext = vorher;
  const wirft = erstelleTon({}, KLAENGE, erstelleAudioNachbau(z, { wirft: true }));
  wirft.wecke();
  h.pruefe(!wirft.bereit, 'AudioContext lässt sich nicht anlegen → stumm, kein Absturz');

  const ziel = { arten: [], addEventListener(a, f, o) { this.arten.push(`${a}:${o.capture}`); }, removeEventListener(a) { this.arten = this.arten.filter((x) => !x.startsWith(a)); } };
  const trenne = erstelleTon({}, KLAENGE, erstelleAudioNachbau(z)).verbinde(ziel);
  h.pruefe(ziel.arten.join() === 'pointerdown:true,touchend:true,keydown:true', 'verbinde(): pointerdown, touchend, keydown in der Fangphase');
  trenne();
  h.pruefe(ziel.arten.length === 0, 'trenne(): alle wieder weg');
}

// Zählt im Browser echte AudioContexts und Oszillatoren (vor dem Laden der Seite eingesetzt).
const ZAEHLER = `
  window.__ton = { kontexte: 0, oszillatoren: 0 };
  const Echt = window.AudioContext;
  window.AudioContext = class extends Echt {
    constructor(...a) { super(...a); window.__ton.kontexte++; }
    createOscillator() { window.__ton.oszillatoren++; return super.createOscillator(); }
  };`;

async function imBrowser() {
  const lauf = await b.starteProbe('ton', 8884, { initSkript: ZAEHLER });
  const { seite } = lauf;
  const lies = () => seite.evaluate(() => ({ bereit: window.probe.ton.bereit, ...window.__ton }));
  try {
    let gespielt = await seite.evaluate(() => window.probe.spiele());
    let z = await lies();
    h.pruefe(!z.bereit && z.kontexte === 0 && !gespielt && z.oszillatoren === 0, 'vor der ersten Berührung: kein AudioContext, kein Klang');
    await seite.touchscreen.tap(200, 300);
    z = await lies();
    h.pruefe(z.bereit && z.kontexte === 1, 'erste Berührung → ton.bereit, ein AudioContext');
    gespielt = await seite.evaluate(() => [window.probe.spiele(), window.probe.spiele()]);
    z = await lies();
    h.pruefe(gespielt[0] && !gespielt[1] && z.oszillatoren === 1, 'Klang spielt, sofortige Wiederholung wird ausgelassen');
    await seite.waitForTimeout(120);
    h.pruefe(await seite.evaluate(() => window.probe.spiele()), 'nach 0,12 s spielt derselbe Klang wieder');
    await seite.evaluate(() => { window.probe.ton.an = false; });
    await seite.waitForTimeout(120);
    h.pruefe(!(await seite.evaluate(() => window.probe.spiele())), 'Ton aus → kein Klang');
    await seite.touchscreen.tap(250, 300);
    h.pruefe((await lies()).kontexte === 1, 'zweite Berührung → kein zweiter AudioContext');

    const zweite = await lauf.kontext.newPage();
    await zweite.goto(seite.url());
    await zweite.waitForFunction('window.probe && window.probe.bereit');
    await zweite.keyboard.press('Space');
    h.pruefe(await zweite.evaluate(() => window.probe.ton.bereit), 'Tastatur (keydown) weckt den Ton auch');
    h.pruefe(lauf.fehler.length === 0, `keine Konsolenfehler ${lauf.fehler.join(' | ')}`);
  } catch (e) { h.pruefe(false, `Ablauf abgebrochen: ${e.message}`); }
  await lauf.ende();
}

(async () => {
  await regeln();
  await imBrowser();
  h.ergebnis();
})();
