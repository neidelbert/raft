// Regeln ohne Browser für Übung 6 (wird von test.js aufgerufen): Wackeln und Aufblitzen, Partikel, Sterne, Ton.
const { angelegterSpeicher } = require('./test-regeln.js');

// Zählt Bilder mit Zeitschritt dt, bis f() true meldet; gibt die vergangene Zeit zurück.
const bilderBis = (f, dt, grenze = 1000) => { let n = 0; while (!f() && n < grenze) n++; return n * dt; };

async function effektRegeln(t, lade) {
  const { erstelleEffekte, loeseTrefferAus, aktualisiereEffekte } = await lade('js/welt/effekte.js');
  const { WACKELN, BLITZ } = await lade('js/config/effekte.js');
  const { erstelleZufall } = await lade('js/kern/zufall.js');
  const zufall = erstelleZufall(42);
  const e = erstelleEffekte();
  t.pruefe(e.wackeln === 0 && e.blitz === 0, 'Effekte: am Anfang kein Wackeln, kein Blitz');
  loeseTrefferAus(e, WACKELN, BLITZ);
  t.pruefe(e.wackeln > 0 && e.blitz === 1, `Effekte: Treffer → Wackeln ${e.wackeln}, Blitz 1`);
  loeseTrefferAus(e, WACKELN, BLITZ); loeseTrefferAus(e, WACKELN, BLITZ);
  t.pruefe(e.wackeln === 1, 'Effekte: drei Treffer schnell hintereinander → Wackeln höchstens 1');
  let groesster = 0, ganz = true;
  const dauer60 = bilderBis(() => {
    aktualisiereEffekte(e, 1 / 60, zufall, WACKELN, BLITZ);
    groesster = Math.max(groesster, Math.abs(e.versatzX), Math.abs(e.versatzY));
    ganz = ganz && Number.isInteger(e.versatzX) && Number.isInteger(e.versatzY);
    return e.wackeln === 0;
  }, 1 / 60);
  t.pruefe(dauer60 < 1 && e.versatzX === 0 && e.versatzY === 0, `Effekte: volles Wackeln ist nach ${komma(dauer60)} s ganz weg (unter 1 s), Versatz 0`);
  t.pruefe(groesster > 0 && groesster <= WACKELN.versatzMax && ganz, `Effekte: Versatz ganze Punkte, höchstens ${WACKELN.versatzMax} (größter ${groesster})`);
  t.pruefe(e.blitz === 0, 'Effekte: Blitz ist dann auch vorbei');
  loeseTrefferAus(e, WACKELN, BLITZ);
  const dauer10 = bilderBis(() => { aktualisiereEffekte(e, 0.1, zufall, WACKELN, BLITZ); return e.wackeln === 0; }, 0.1);
  t.pruefe(dauer10 < 1, `Effekte: auch bei 10 Bildern/s nach ${komma(dauer10)} s weg`);
  loeseTrefferAus(e, WACKELN, BLITZ);
  const blitzDauer = bilderBis(() => { aktualisiereEffekte(e, 1 / 60, zufall, WACKELN, BLITZ); return e.blitz === 0; }, 1 / 60);
  t.pruefe(Math.abs(blitzDauer - BLITZ.dauer) < 0.03, `Effekte: rotes Aufblitzen dauert ${komma(blitzDauer)} s (Einstellung ${komma(BLITZ.dauer)} s)`);
  const aus = erstelleEffekte();
  loeseTrefferAus(aus, { ...WACKELN, trefferStaerke: 0 }, { ...BLITZ, dauer: 0 });
  aktualisiereEffekte(aus, 1 / 60, zufall, WACKELN, { ...BLITZ, dauer: 0 });
  t.pruefe(aus.wackeln === 0 && aus.blitz === 0 && aus.versatzX === 0, 'Effekte: Stärke 0 und Dauer 0 schalten Wackeln und Blitz ab');
}

async function partikelRegeln(t, lade) {
  const { erstellePartikel, streuePartikel, aktualisierePartikel } = await lade('js/welt/partikel.js');
  const { PARTIKEL: P } = await lade('js/config/effekte.js');
  const { erstelleZufall } = await lade('js/kern/zufall.js');
  const zufall = erstelleZufall(42);
  const p = erstellePartikel(P.max);
  t.pruefe(P.dauerMax < 1 && P.max <= 200, `Partikel: längste Lebenszeit ${komma(P.dauerMax)} s (unter 1 s), höchstens ${P.max} (unter 200)`);
  const neu = streuePartikel(p, 100, 100, P.proStern, P, zufall);
  t.pruefe(neu === P.proStern && p.anzahl === P.proStern, `Partikel: ein Stern streut ${neu}`);
  let zuViele = 0;
  for (let i = 0; i < 100; i++) { streuePartikel(p, 50, 50, P.proStern, P, zufall); if (p.anzahl > P.max) zuViele++; }
  t.pruefe(p.anzahl === P.max && zuViele === 0 && streuePartikel(p, 0, 0, 5, P, zufall) === 0, `Partikel: 100 Sterne auf einmal → genau ${P.max}, nie mehr`);
  let ok = true;
  for (let i = 0; i < p.anzahl; i++) if (!(p.dauer[i] >= P.dauerMin && p.dauer[i] <= P.dauerMax)) ok = false;
  t.pruefe(ok, 'Partikel: jede Lebenszeit liegt zwischen dauerMin und dauerMax');
  const tempo0 = Math.hypot(p.vx[0], p.vy[0]);
  aktualisierePartikel(p, 0.1, P.reibung);
  t.pruefe(Math.hypot(p.vx[0], p.vy[0]) < tempo0, 'Partikel: werden langsamer');
  const leer60 = bilderBis(() => { aktualisierePartikel(p, 1 / 60, P.reibung); return p.anzahl === 0; }, 1 / 60) + 0.1;
  t.pruefe(p.anzahl === 0 && leer60 <= P.dauerMax + 0.02, `Partikel: nach ${komma(leer60)} s alle weg (60 Bilder/s)`);
  streuePartikel(p, 0, 0, 500, P, zufall);
  const leer10 = bilderBis(() => { aktualisierePartikel(p, 0.1, P.reibung); return p.anzahl === 0; }, 0.1);
  t.pruefe(leer10 < 1, `Partikel: bei 10 Bildern/s nach ${komma(leer10)} s alle weg`);
  // Kein neuer Speicher: Ausstreuen und Bewegen nur mit den festen Arrays.
  const schritt = () => { if (p.anzahl < P.max - P.proStern) streuePartikel(p, 10, 10, P.proStern, P, zufall); aktualisierePartikel(p, 1 / 60, P.reibung); };
  // Erst lange aufwärmen: streuePartikel läuft nur alle paar Schritte und bleibt in Chrome lange im Interpreter,
  // der für Kommazahlen Speicher anlegt (nach 2000 Schritten gemessen 10 Byte pro Schritt, nach 50.000 Schritten 0).
  for (let i = 0; i < 50000; i++) schritt();
  const bytes = await angelegterSpeicher(schritt, 20000, /welt\/partikel\.js/);
  t.pruefe(bytes / 20000 < 1, `Partikel: 20.000 Schritte, ${komma(bytes / 20000, 1)} Byte neuer Speicher pro Schritt`);
}

async function sternRegeln(t, lade) {
  const { erstelleSterne, legeStern, aktualisiereSterne, sammleBeruehrte, leereSterne } = await lade('js/welt/sterne.js');
  const { STERNE } = await lade('js/config/sterne.js');
  const { erstelleZufall } = await lade('js/kern/zufall.js');
  const B = 390, H = 664, zufall = erstelleZufall(42);
  const spieler = { x: B / 2, y: H / 2 };
  const s = erstelleSterne(STERNE);
  t.pruefe(STERNE.erscheinenAlle === 2, 'Sterne: erscheinen alle 2 s (Auftrag)');
  aktualisiereSterne(s, spieler, 1.99, B, H, zufall);
  const vor2 = s.anzahl;
  aktualisiereSterne(s, spieler, 0.02, B, H, zufall);
  t.pruefe(vor2 === 0 && s.anzahl === 1, 'Sterne: nach 1,99 s keiner, nach 2,01 s einer');
  for (let i = 0; i < 60 * 10; i++) aktualisiereSterne(s, spieler, 1 / 60, B, H, zufall);
  t.pruefe(s.anzahl === 6, `Sterne: nach 12 s (60 Bilder/s) 6 Sterne (${s.anzahl})`);
  leereSterne(s);
  for (let i = 0; i < 121; i++) aktualisiereSterne(s, spieler, 0.1, B, H, zufall);
  t.pruefe(s.anzahl === 6, `Sterne: nach 12,1 s bei 10 Bildern/s ebenso 6 (${s.anzahl})`);
  for (let i = 0; i < 1000; i++) aktualisiereSterne(s, spieler, 0.1, B, H, zufall);
  t.pruefe(s.anzahl === STERNE.max, `Sterne: nach langer Zeit höchstens ${STERNE.max}`);
  leereSterne(s);
  let schlecht = 0;
  for (let i = 0; i < 2000; i++) {
    spieler.x = zufall() * B; spieler.y = zufall() * H;
    if (!legeStern(s, spieler, B, H, zufall)) continue;
    const x = s.x[s.anzahl - 1], y = s.y[s.anzahl - 1];
    if (Math.hypot(x - spieler.x, y - spieler.y) < STERNE.abstandSpielerMin || x < STERNE.rand || x > B - STERNE.rand
      || y < STERNE.randOben || y > H - STERNE.randUnten) schlecht++;
    s.anzahl = 0;
  }
  t.pruefe(schlecht === 0, 'Sterne: 2000 neue Sterne, keiner zu nah an der Figur, keiner unter Leiste oder Knöpfen');
  t.pruefe(!legeStern(s, spieler, 40, 40, zufall) && s.anzahl === 0, 'Sterne: Bildschirm zu klein → kein Stern, kein Absturz');
  // Einsammeln
  spieler.x = 100; spieler.y = 200;
  s.anzahl = 3; s.x.set([100, 120, 300]); s.y.set([210, 190, 300]);
  const orte = [];
  const n = sammleBeruehrte(s, spieler, (x, y) => orte.push(`${x}|${y}`));
  t.pruefe(n === 2 && s.anzahl === 1 && s.x[0] === 300 && orte.sort().join(' ') === '100|210 120|190',
    'Sterne: zwei berührte Sterne → beide gezählt, an ihrer Stelle gemeldet, der ferne bleibt');
  t.pruefe(sammleBeruehrte(s, spieler, () => {}) === 0, 'Sterne: ohne Berührung wird nichts gesammelt');
}

async function tonRegeln(t, lade) {
  // Ersatz für WebAudio: zählt gestartete Klänge.
  const protokoll = { kontexte: 0, klaenge: [], resume: 0 };
  class ErsatzAudio {
    constructor() { protokoll.kontexte++; protokoll.letzter = this; this.state = 'suspended'; this.currentTime = 0; this.destination = {}; }
    resume() { protokoll.resume++; this.state = 'running'; return Promise.resolve(); }
    createGain() { return { gain: { value: 1, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect: (z) => z }; }
    createOscillator() {
      return { type: '', frequency: { setValueAtTime(f) { this.f = f; }, exponentialRampToValueAtTime() {} },
        connect: (z) => z, start() {}, stop() { protokoll.klaenge.push(this.frequency.f); } };
    }
  }
  const altesWindow = globalThis.window;
  globalThis.window = {};
  try {
    const { erstelleTon } = await lade('js/kern/ton.js');
    const { TON, KLAENGE } = await lade('js/config/ton.js');
    const ohne = erstelleTon(TON, KLAENGE);
    ohne.wecke(); ohne.spiele('stern');
    t.pruefe(!ohne.bereit, 'Ton: Browser ohne WebAudio → bereit bleibt false, kein Absturz');
    globalThis.window = { AudioContext: ErsatzAudio };
    const ton = erstelleTon(TON, KLAENGE);
    ton.spiele('stern');
    t.pruefe(!ton.bereit && protokoll.kontexte === 0 && protokoll.klaenge.length === 0, 'Ton: vor der ersten Berührung kein AudioContext, kein Klang');
    ton.wecke();
    t.pruefe(ton.bereit && protokoll.kontexte === 1 && protokoll.resume === 1, 'Ton: erste Berührung → AudioContext, aufgeweckt, bereit');
    ton.wecke(); ton.wecke();
    t.pruefe(protokoll.kontexte === 1 && protokoll.resume === 1, 'Ton: weitere Berührungen legen keinen zweiten AudioContext an');
    ton.spiele('stern');
    t.pruefe(protokoll.klaenge.length === 1 && protokoll.klaenge[0] === KLAENGE.stern.frequenz, 'Ton: Stern-Klang spielt');
    ton.spiele('stern');
    t.pruefe(protokoll.klaenge.length === 1, 'Ton: derselbe Klang im selben Moment nur einmal (höchstens 20-mal pro Sekunde)');
    ton.spiele('treffer');
    t.pruefe(protokoll.klaenge.length === 2, 'Ton: ein anderer Klang darf gleichzeitig');
    protokoll.letzter.currentTime = TON.mindestAbstand + 0.001;
    ton.spiele('stern');
    t.pruefe(protokoll.klaenge.length === 3, 'Ton: nach dem Mindestabstand spielt der Stern-Klang wieder');
    ton.an = false;
    protokoll.letzter.currentTime = 1;
    protokoll.klaenge.length = 0;
    ton.spiele('treffer');
    t.pruefe(protokoll.klaenge.length === 0, 'Ton: aus → kein Klang');
    ton.spiele('gibtesnicht');
    t.pruefe(protokoll.klaenge.length === 0, 'Ton: unbekannter Klang → nichts, kein Absturz');
  } finally {
    globalThis.window = altesWindow;
  }
}

function komma(zahl, stellen = 2) { return zahl.toFixed(stellen).replace('.', ','); }

module.exports = async function effektRegelTests(t, lade) {
  await effektRegeln(t, lade);
  await partikelRegeln(t, lade);
  await sternRegeln(t, lade);
  await tonRegeln(t, lade);
};
