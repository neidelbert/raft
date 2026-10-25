// Test für bausteine/assets.js: Regeln mit nachgebauter Umgebung (ohne Browser), dann echtes Laden im Browser
// (Port 8887): Atlas, Sound dekodieren, Schrift, hängende und fehlende Dateien. node assets-test.js
const h = require('./hilfe.js');
const b = require('./browser-hilfe.js');

const MANIFEST = {
  version: 'v7',
  atlanten: [{ name: 'figuren', bild: 'atlas/figuren.png', daten: 'atlas/figuren.json' }],
  bilder: [{ name: 'wiese', datei: 'bilder/wiese.png', ersatz: '#00ff00' }],
  sounds: [{ name: 'bumm', dateien: ['sounds/bumm.m4a', 'sounds/bumm.mp3'], laut: 0.8 }],
  schriften: [{ name: 'Titel', datei: 'schriften/titel.woff2' }],
  modelle: [{ name: 'boot', datei: 'modelle/boot.glb' }],
  spaeter: ['musik'],
};
MANIFEST.sounds.push({ name: 'musik', dateien: ['sounds/musik.mp3'] });
const ATLAS = { breite: 64, hoehe: 64, rahmen: { 'held-1': { x: 1, y: 1, b: 10, h: 20, ankerX: 5, ankerY: 19 }, 'held-2': { x: 13, y: 1, b: 10, h: 20, ankerX: 5, ankerY: 19 }, steht: { x: 25, y: 1, b: 10, h: 20, ankerX: 5, ankerY: 19 } },
  animationen: { held: { rahmen: ['held-1', 'held-2'], bps: 8, schleife: true } } };

// Nachgebaute Umgebung: dateien = { pfad: { inhalt, ms, status, haengt } }. Schreibt jede Anfrage mit.
function erstelleUmgebung(dateien, { formate = ['m4a', 'mp3'] } = {}) {
  const anfragen = [], abgebrochen = [];
  function hole(adresse, signal) {
    anfragen.push(adresse);
    const pfad = adresse.replace(/\?.*$/, '').replace(/^.*?assets\//, '');
    const d = dateien[pfad] || { status: 404 };
    return new Promise((ja, nein) => {
      signal?.addEventListener('abort', () => { abgebrochen.push(pfad); nein(new Error('abgebrochen')); });
      if (d.haengt) return;
      setTimeout(() => (d.status && d.status !== 200 ? nein(new Error(`Status ${d.status}`)) : ja(d)), d.ms || 1);
    });
  }
  return {
    anfragen, abgebrochen,
    umgebung: {
      fetch: (adresse, { signal, cache } = {}) => hole(adresse, signal).then((d) => ({ ok: true, status: 200, cache,
        json: async () => d.inhalt, arrayBuffer: async () => ({ bytes: adresse }) }), (f) => {
        if (/Status 404/.test(f.message)) return { ok: false, status: 404 };
        throw f;
      }),
      ladeBild: (adresse, signal) => hole(adresse, signal).then(() => ({ bild: adresse })),
      kannAbspielen: (datei) => formate.includes(datei.split('.').pop()),
      ladeSchrift: (name, adresse) => hole(adresse, null).then(() => undefined),
      erstelleLeinwand: (farbe) => ({ ersatzFarbe: farbe }),
      warte: (ms, f) => { const id = setTimeout(f, ms); return () => clearTimeout(id); },
    },
  };
}
const ALLES = () => ({
  'assets.json': { inhalt: MANIFEST }, 'atlas/figuren.json': { inhalt: ATLAS, ms: 5 }, 'atlas/figuren.png': { ms: 10 },
  'bilder/wiese.png': { ms: 15 }, 'sounds/bumm.m4a': { ms: 20 }, 'sounds/bumm.mp3': { ms: 1 }, 'schriften/titel.woff2': { ms: 25 },
  'modelle/boot.glb': { ms: 30 }, 'sounds/musik.mp3': { ms: 1 },
});
const ERSATZ = () => ({ rahmen: { 'held-1': { bild: 'ersatz', b: 8, h: 8, ankerX: 4, ankerY: 8 }, steht: { bild: 'ersatz' } }, animationen: { held: { rahmen: ['held-1'], bps: 1, schleife: true } } });
const sortiert = (liste) => [...liste].sort().join();
// Wartet höchstens ms auf ein Versprechen; danach null (ein kaputter Baustein soll rot melden, nicht hängen).
const hoechstens = (versprechen, ms = 3000) => Promise.race([versprechen, new Promise((fertig) => setTimeout(() => fertig(null), ms))]);

async function regeln() {
  const { ladeAssets, dekodiereSounds, holeAnimation } = await h.lade('assets.js');
  const warnungen = [], fehler = [];
  const echt = { warn: console.warn, error: console.error };
  console.warn = (t) => warnungen.push(t);
  console.error = (t) => fehler.push(t);
  try {
    // Alles da
    let n = erstelleUmgebung(ALLES());
    const verlauf = [];
    let ersatzAufrufe = 0;
    const modelle = [];
    let a = await ladeAssets('spiel/assets/assets.json', { zeitgrenze: 500, umgebung: n.umgebung, beiFortschritt: (x) => verlauf.push(x),
      ladeModell: async (adr) => { modelle.push(adr); return { szene: adr }; }, ersatz: () => { ersatzAufrufe++; return ERSATZ(); } });
    h.pruefe(sortiert(a.status.geladen) === 'Titel,boot,bumm,figuren,wiese' && !a.status.fehlend.length && !a.status.ersetzt.length,
      `alles da: geladen ${a.status.geladen.join(', ')}; nichts fehlt, nichts ersetzt`);
    h.pruefe(verlauf.length === 5 && verlauf.every((x, i) => i === 0 || x > verlauf[i - 1]) && verlauf.at(-1) === 1 && a.fortschritt === 1,
      `Fortschritt steigt in 5 Schritten bis 1 (${verlauf.map((x) => h.komma(x)).join(' → ')})`);
    h.pruefe(n.anfragen[0] === 'spiel/assets/assets.json' && n.anfragen.slice(1).every((x) => x.startsWith('spiel/assets/') && x.endsWith('?v=v7')),
      'Manifest ohne ?v, jede Asset-Adresse relativ zum Manifest mit ?v=<version>');
    h.pruefe(a.rahmen['held-1'].bild.bild.includes('atlas/figuren.png') && a.rahmen['held-1'].ankerY === 19 && a.animationen.held.bps === 8,
      'Atlas: Rahmen mit Bild und Anker, Animationen aus dem Atlas-JSON');
    h.pruefe(a.atlanten.figuren.breite === 64 && a.atlanten.figuren.hoehe === 64, 'Atlas: Größe abrufbar (atlanten.figuren)');
    h.pruefe(n.anfragen.some((x) => x.includes('bumm.m4a')) && !n.anfragen.some((x) => x.includes('bumm.mp3')) && a.sounds.bumm.laut === 0.8,
      'Sound: erstes abspielbares Format (m4a), mp3 nicht zusätzlich geladen, Lautstärke aus dem Manifest');
    h.pruefe(modelle.length === 1 && a.modelle.boot.szene === 'spiel/assets/modelle/boot.glb?v=v7' && a.schriften.Titel === true, 'Modell über die übergebene Lade-Funktion, Schrift geladen');
    h.pruefe(ersatzAufrufe === 0, 'alles da: ersatz() wird nicht aufgerufen (keine unnötigen Ersatz-Zeichnungen)');
    h.pruefe(!n.anfragen.some((x) => x.includes('musik')) && !a.sounds.musik, '„spaeter“: Musik wird beim Start nicht geladen');
    await a.ladeSpaeter();
    h.pruefe(a.sounds.musik && a.status.geladen.includes('musik') && a.fortschritt === 1, 'ladeSpaeter(): Musik nachgeladen, Fortschritt bleibt 1');
    h.pruefe(holeAnimation(a, 'held') === a.animationen.held && holeAnimation(a, 'steht').rahmen.join() === 'steht' && holeAnimation(a, 'gibtsnicht') === null,
      'holeAnimation: Animation; Einzelrahmen als Animation mit einem Rahmen; Unbekanntes → null');
    h.pruefe(holeAnimation(a, 'steht') === holeAnimation(a, 'steht'), 'holeAnimation: Einzelrahmen-Animation nur einmal angelegt (kein neues Objekt pro Bild)');

    // Ohne ladeModell: Modelle werden übersprungen (2D-Seite)
    n = erstelleUmgebung(ALLES());
    a = await ladeAssets('assets/assets.json', { zeitgrenze: 500, umgebung: n.umgebung });
    h.pruefe(!n.anfragen.some((x) => x.includes('boot.glb')) && !a.status.geladen.includes('boot') && a.fortschritt === 1, 'ohne ladeModell: Modelle nicht geladen und nicht mitgezählt');

    n = erstelleUmgebung(ALLES());
    a = await ladeAssets('assets/assets.json', { zeitgrenze: 500, umgebung: n.umgebung, arten: ['modelle'], ladeModell: async () => ({}) });
    h.pruefe(a.status.geladen.join() === 'boot' && n.anfragen.length === 1 && a.fortschritt === 1, `arten: [modelle] lädt nur das Modell (3D-Seite ohne Atlas) (${n.anfragen.join(' ')})`);

    // Dateien fehlen
    let d = ALLES();
    delete d['atlas/figuren.png']; delete d['bilder/wiese.png']; delete d['sounds/bumm.m4a']; delete d['schriften/titel.woff2'];
    n = erstelleUmgebung(d);
    ersatzAufrufe = 0;
    a = await ladeAssets('assets/assets.json', { zeitgrenze: 500, umgebung: n.umgebung, ladeModell: async () => { throw new Error('kaputt'); },
      ersatz: () => { ersatzAufrufe++; return ERSATZ(); } });
    h.pruefe(sortiert(a.status.fehlend) === 'Titel,boot,figuren,wiese', `fehlende Dateien → fehlend: ${a.status.fehlend.join(', ')}`);
    h.pruefe(sortiert(a.status.ersetzt) === 'Titel,boot,held-1,steht,wiese', `Ersatz → ersetzt: ${a.status.ersetzt.join(', ')}`);
    h.pruefe(a.status.geladen.includes('bumm') && n.anfragen.some((x) => x.includes('bumm.mp3')), 'Sound: m4a fehlt → mp3 als Ersatz geladen');
    h.pruefe(ersatzAufrufe === 1 && a.rahmen['held-1'].bild === 'ersatz' && a.animationen.held.rahmen.join() === 'held-1', 'Atlas fehlt: ersatz() einmal, Ersatz-Rahmen und -Animation');
    h.pruefe(a.bilder.wiese.ersatzFarbe === '#00ff00' && a.schriften.Titel === false && a.modelle.boot === null, 'Bild → Ersatzfarbe aus dem Manifest, Schrift → Systemschrift, Modell → null');
    h.pruefe(a.fortschritt === 1, 'Fortschritt erreicht trotzdem 1');

    // Datei hängt (Server antwortet nie)
    d = ALLES();
    d['atlas/figuren.png'] = { haengt: true };
    d['sounds/bumm.m4a'] = { haengt: true };
    n = erstelleUmgebung(d);
    let start = Date.now();
    a = await hoechstens(ladeAssets('assets/assets.json', { zeitgrenze: 200, umgebung: n.umgebung, ersatz: ERSATZ }));
    let dauer = Date.now() - start;
    if (!h.pruefe(a, 'hängende Dateien: ladeAssets wird fertig (nicht nach 3 s noch offen)')) return;
    h.pruefe(dauer >= 190 && dauer < 600 && sortiert(a.status.fehlend) === 'bumm,figuren', `hängende Dateien: nach der Zeitgrenze (200 ms) Ersatz, fertig nach ${dauer} ms`);
    h.pruefe(n.abgebrochen.includes('atlas/figuren.png') && n.abgebrochen.includes('sounds/bumm.m4a'), 'hängende Anfragen werden abgebrochen (kein Weiterladen im Hintergrund)');
    h.pruefe(a.status.ersetzt.includes('bumm') && a.sounds.bumm.bytes === null, 'Sound hängt → Stille (ersetzt), kein zweiter Versuch nach Ablauf der Zeit');

    // Manifest fehlt oder hängt
    n = erstelleUmgebung({});
    ersatzAufrufe = 0;
    a = await ladeAssets('assets/assets.json', { zeitgrenze: 200, umgebung: n.umgebung, ersatz: () => { ersatzAufrufe++; return ERSATZ(); } });
    h.pruefe(a.fortschritt === 1 && a.status.fehlend.join() === 'assets/assets.json' && ersatzAufrufe === 1 && a.rahmen.steht, 'Manifest fehlt: Fortschritt 1, gemeldet, Ersatz-Rahmen');
    n = erstelleUmgebung({ 'assets.json': { haengt: true } });
    start = Date.now();
    a = await hoechstens(ladeAssets('assets/assets.json', { zeitgrenze: 200, umgebung: n.umgebung }));
    dauer = Date.now() - start;
    if (!h.pruefe(a, 'Manifest hängt: ladeAssets wird fertig')) return;
    h.pruefe(dauer < 600 && a.fortschritt === 1 && a.status.fehlend.length === 1, `Manifest hängt: nach der Zeitgrenze weiter (${dauer} ms)`);
    const kaputt = erstelleUmgebung({ 'assets.json': { inhalt: { version: 3, atlanten: 'kaputt' } } });
    a = await ladeAssets('assets/assets.json', { zeitgrenze: 200, umgebung: kaputt.umgebung });
    h.pruefe(a.fortschritt === 1 && a.status.fehlend.length === 0, 'Manifest mit falschem Typ (atlanten kein Array): wird übergangen, kein Absturz');

    // Kein abspielbares Format
    n = erstelleUmgebung(ALLES(), { formate: ['ogg'] });
    a = await ladeAssets('assets/assets.json', { zeitgrenze: 300, umgebung: n.umgebung });
    h.pruefe(a.status.fehlend.includes('bumm') && !n.anfragen.some((x) => x.includes('bumm')), 'kein abspielbares Format: nichts geladen, fehlend');

    // Dekodieren
    n = erstelleUmgebung(ALLES());
    a = await ladeAssets('assets/assets.json', { zeitgrenze: 500, umgebung: n.umgebung });
    let dekodierAufrufe = 0;
    const audio = { decodeAudioData: (bytes) => { dekodierAufrufe++; return Promise.resolve({ duration: 0.7, aus: bytes }); } };
    h.pruefe(await dekodiereSounds(a, null) === 0, 'dekodiereSounds ohne AudioContext (vor der Berührung): nichts, kein Absturz');
    const [eins, zwei] = await Promise.all([dekodiereSounds(a, audio), dekodiereSounds(a, audio)]);
    h.pruefe(eins === 1 && zwei === 1 && dekodierAufrufe === 1 && a.sounds.bumm.puffer.duration === 0.7 && a.sounds.bumm.bytes === null,
      'dekodiereSounds: einmal dekodiert, auch bei doppeltem Aufruf; Bytes freigegeben');
    n = erstelleUmgebung(ALLES());
    a = await ladeAssets('assets/assets.json', { zeitgrenze: 500, umgebung: n.umgebung });
    const alt = { decodeAudioData: (bytes, ja) => { setTimeout(() => ja({ duration: 0.5 }), 1); } };   // altes Safari: nur Rückruf
    h.pruefe(await dekodiereSounds(a, alt) === 1 && a.sounds.bumm.puffer.duration === 0.5, 'dekodiereSounds: alte Form mit Rückruf (Safari vor 14.1)');
    n = erstelleUmgebung(ALLES());
    a = await ladeAssets('assets/assets.json', { zeitgrenze: 500, umgebung: n.umgebung });
    await dekodiereSounds(a, { decodeAudioData: () => Promise.reject(new Error('kaputt')) });
    h.pruefe(a.dekodiert === 0 && a.status.fehlend.includes('bumm') && a.status.ersetzt.includes('bumm'), 'kaputter Sound: fehlend und ersetzt (Stille), kein Absturz');
  } finally {
    console.warn = echt.warn;
    console.error = echt.error;
  }
  h.pruefe(warnungen.length > 0 && fehler.length === 0, `Fehlschläge nur als Warnung (${warnungen.length}), nie console.error`);
}

async function imBrowser() {
  const anfragen = [];
  let lauf = await b.starteProbe('assets', 8887, { routen: async (k) => k.on('request', (r) => anfragen.push(r.url())) });
  let { seite } = lauf;
  try {
    let p = await seite.evaluate(() => window.probe);
    h.pruefe(sortiert(p.status.geladen) === 'Probe,piep,probe' && !p.status.fehlend.length, `Browser: Atlas, Sound und Schrift geladen (${p.status.geladen.join(', ')})`);
    h.pruefe(p.rahmen && !p.rahmen.ersatz && p.rahmen.b > 0 && p.animation === 'figur', 'Browser: Rahmen „figur“ aus dem Atlas, als Animation mit einem Rahmen');
    h.pruefe(p.figurPixel[3] === 255 && p.figurPixel.slice(0, 3).join() !== '32,48,64', `Browser: Figur am Fußpunkt gezeichnet (Pixel ${p.figurPixel})`);
    h.pruefe(p.dekodiert === 1 && p.nochmal === 1 && Math.abs(p.pufferDauer - 0.1) < 0.03, `Browser: Sound dekodiert (${h.komma(p.pufferDauer, 3)} s)`);
    h.pruefe(p.schrift, 'Browser: Schrift „Probe“ geladen und im Canvas nutzbar');
    const assetAnfragen = anfragen.filter((u) => /\/assets\/(atlas|sounds|schriften)\//.test(u));
    h.pruefe(assetAnfragen.length === 4 && assetAnfragen.every((u) => u.endsWith(`?v=${p.version}`)), `Browser: alle Asset-Adressen mit ?v=${p.version}`);
    h.pruefe(assetAnfragen.some((u) => /piep\.m4a/.test(u)), 'Browser: Chromium nimmt das m4a (erstes abspielbares Format)');
    h.pruefe(lauf.fehler.length === 0, `Browser: keine Konsolenfehler ${lauf.fehler.join(' | ')}`);
    await seite.screenshot({ path: b.foto('assets') });
    await lauf.ende();

    // Atlas-Bild hängt, m4a fehlt: Ersatz nach der Zeitgrenze, mp3 statt m4a
    lauf = await b.starteProbe('assets', 8887, { zusatz: '&zeitgrenze=1500', routen: async (k) => {
      await k.route('**/atlas/probe.png*', () => {});                       // antwortet nie
      await k.route('**/sounds/piep.m4a*', (r) => r.fulfill({ status: 404, body: '' }));
    } });
    seite = lauf.seite;
    p = await seite.evaluate(() => window.probe);
    h.pruefe(p.status.fehlend.join() === 'probe' && p.status.ersetzt.join() === 'figur' && p.rahmen.ersatz, `Browser: Atlas hängt → Ersatz-Rahmen (fehlend: ${p.status.fehlend}, ersetzt: ${p.status.ersetzt})`);
    h.pruefe(p.dauer >= 1400 && p.dauer < 4000, `Browser: Seite läuft nach der Zeitgrenze weiter (${Math.round(p.dauer)} ms, Grenze 1500)`);
    h.pruefe(p.status.geladen.includes('piep') && p.dekodiert === 1, 'Browser: m4a fehlt → mp3 geladen und dekodiert');
    h.pruefe(b.nurLadefehler(lauf.fehler), `Browser: nur die Ladezeile des Browsers, kein Fehler des Codes ${lauf.fehler.join(' | ')}`);
    await seite.screenshot({ path: b.foto('assets-ersatz') });
  } catch (e) { h.pruefe(false, `Ablauf abgebrochen: ${e.message}`); }
  await lauf.ende();
}

(async () => {
  await regeln();
  await imBrowser();
  h.ergebnis();
})();
