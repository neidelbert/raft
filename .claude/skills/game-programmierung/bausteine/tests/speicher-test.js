// Test für bausteine/speicher.js (ohne Browser, Speicher nachgebaut): node speicher-test.js
const h = require('./hilfe.js');

// Nachgebauter localStorage. sperre: jeder Zugriff wirft (privater Modus); voll: setItem wirft.
function erstelleOrt(inhalt = {}, { sperre = false, voll = false } = {}) {
  const daten = { ...inhalt }, protokoll = [];
  return {
    daten, protokoll,
    getItem(k) { if (sperre) throw new Error('SecurityError'); return k in daten ? daten[k] : null; },
    setItem(k, w) { if (sperre || voll) throw new Error('QuotaExceededError'); protokoll.push(k); daten[k] = String(w); },
  };
}

const STANDARD = { version: 2, rekord: 0, ton: true, name: '', einstellungen: { laut: 0.5, sprache: 'de' }, liste: [] };

(async () => {
  const { holeSpeicherOrt, ladeStand, speichereStand, erstelleSpeicher } = await h.lade('speicher.js');
  const warnungen = [];
  console.warn = (t) => warnungen.push(t);   // Warnungen sind erwünscht, hier nur gezählt

  // Laden
  let s = ladeStand(erstelleOrt(), 'x', STANDARD);
  h.pruefe(JSON.stringify(s) === JSON.stringify(STANDARD) && s !== STANDARD, 'kein Eintrag → Standardwerte (als Kopie)');
  s.einstellungen.laut = 1; s.liste.push(1);
  h.pruefe(STANDARD.einstellungen.laut === 0.5 && STANDARD.liste.length === 0, 'Ändern des Stands ändert den Standard nicht');
  s = ladeStand(erstelleOrt({ x: '{kaputt' }), 'x', STANDARD);
  h.pruefe(s.rekord === 0 && s.ton === true && warnungen.length === 1, 'kein JSON → Standardwerte, eine Warnung');
  for (const roh of ['null', '42', '"text"', '[1,2]', 'true']) {
    s = ladeStand(erstelleOrt({ x: roh }), 'x', STANDARD);
    h.pruefe(s.rekord === 0 && s.version === 2 && s.einstellungen.sprache === 'de', `Inhalt ${roh} (kein Objekt) → Standardwerte`);
  }
  s = ladeStand(erstelleOrt({ x: JSON.stringify({ version: 2, rekord: 'viel', ton: 'ja', name: 5, einstellungen: 3, liste: {} }) }), 'x', STANDARD);
  h.pruefe(s.rekord === 0 && s.ton === true && s.name === '' && s.einstellungen.laut === 0.5 && Array.isArray(s.liste),
    'falscher Typ je Feld → Standardwert für dieses Feld');
  s = ladeStand(erstelleOrt({ x: '{"version":2,"rekord":1e999}' }), 'x', STANDARD);
  h.pruefe(s.rekord === 0, 'Unendlich (1e999) ist keine gültige Zahl → Standardwert');
  s = ladeStand(erstelleOrt({ x: JSON.stringify({ version: 2, rekord: 17, ton: false, einstellungen: { laut: 0.2 }, liste: [3], neu: 'x' }) }), 'x', STANDARD);
  h.pruefe(s.rekord === 17 && s.ton === false && s.einstellungen.laut === 0.2 && s.einstellungen.sprache === 'de' && s.liste[0] === 3,
    'gültige Felder bleiben, fehlende verschachtelte Felder bekommen ihren Standard');
  h.pruefe(s.neu === 'x', 'unbekannte Felder (neuere Version) bleiben erhalten');

  // Versionen
  const umwandeln = (roh, alt) => (alt < 2 ? { ...roh, rekord: roh.punkteRekord ?? 0 } : roh);
  s = ladeStand(erstelleOrt({ x: '{"version":1,"punkteRekord":33}' }), 'x', STANDARD, { umwandeln });
  h.pruefe(s.rekord === 33 && s.version === 2 && s.ton === true, 'Version 1 → umgewandelt, Version 2, neue Felder mit Standard');
  s = ladeStand(erstelleOrt({ x: '{"punkteRekord":5}' }), 'x', STANDARD, { umwandeln });
  h.pruefe(s.rekord === 5, 'ohne version gilt Version 0 → wird umgewandelt');
  s = ladeStand(erstelleOrt({ x: '{"version":2,"punkteRekord":5,"rekord":9}' }), 'x', STANDARD, { umwandeln: () => { throw new Error('nie'); } });
  h.pruefe(s.rekord === 9, 'gleiche Version → umwandeln wird nicht aufgerufen');
  s = ladeStand(erstelleOrt({ x: '{"version":1}' }), 'x', STANDARD, { umwandeln: () => { throw new Error('kaputt'); } });
  h.pruefe(s.rekord === 0 && s.version === 2, 'umwandeln wirft → Standardwerte, kein Absturz');
  s = ladeStand(erstelleOrt({ x: '{"version":5,"rekord":3}' }), 'x', STANDARD);
  h.pruefe(s.version === 5 && s.rekord === 3, 'Stand einer neueren Version behält seine Versionsnummer');
  const pruefe = (st) => { st.rekord = st.rekord >= 0 ? Math.floor(st.rekord) : 0; };
  s = ladeStand(erstelleOrt({ x: '{"version":2,"rekord":-4}' }), 'x', STANDARD, { pruefe });
  h.pruefe(s.rekord === 0, 'pruefe: eigene Grenze (Rekord nicht negativ) greift');

  // Privater Modus und volle Speicher
  s = ladeStand(erstelleOrt({}, { sperre: true }), 'x', STANDARD);
  h.pruefe(s.rekord === 0, 'Speicher gesperrt (privater Modus) → Standardwerte, kein Absturz');
  s = ladeStand(null, 'x', STANDARD);
  h.pruefe(s.rekord === 0, 'kein Speicher (null) → Standardwerte');
  h.pruefe(speichereStand(erstelleOrt({}, { voll: true }), 'x', s) === false && speichereStand(null, 'x', s) === false,
    'Schreiben in vollen oder fehlenden Speicher → false, kein Absturz');
  const ort = erstelleOrt();
  h.pruefe(speichereStand(ort, 'x', { version: 2, rekord: 4 }) && JSON.parse(ort.daten.x).rekord === 4, 'Schreiben klappt → true, Inhalt ist JSON');

  // holeSpeicherOrt
  h.pruefe(holeSpeicherOrt() === (globalThis.localStorage ?? null), 'holeSpeicherOrt ohne Browser → null oder vorhandener Speicher');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('SecurityError'); } });
  h.pruefe(holeSpeicherOrt() === null, 'holeSpeicherOrt: schon der Zugriff wirft → null');
  const nachgebaut = erstelleOrt();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: nachgebaut });
  h.pruefe(holeSpeicherOrt() === nachgebaut, 'holeSpeicherOrt: vorhandener Speicher wird zurückgegeben');
  delete globalThis.localStorage;

  // erstelleSpeicher: nur schreiben, wenn sich etwas geändert hat
  const ort2 = erstelleOrt({ spiel: '{kaputt' });
  const sp = erstelleSpeicher(ort2, 'spiel', STANDARD);
  sp.speichere();
  h.pruefe(ort2.protokoll.length === 0 && ort2.daten.spiel === '{kaputt', 'ohne Änderung wird nichts geschrieben (fremder Inhalt bleibt)');
  sp.stand.rekord = 12; sp.merke();
  h.pruefe(sp.speichere() === true && ort2.protokoll.length === 1 && JSON.parse(ort2.daten.spiel).rekord === 12, 'nach merke() wird einmal geschrieben');
  sp.speichere();
  h.pruefe(ort2.protokoll.length === 1, 'zweites speichere() ohne Änderung schreibt nicht noch einmal');
  const ort3 = erstelleOrt({}, { voll: true });
  const sp3 = erstelleSpeicher(ort3, 'spiel', STANDARD);
  sp3.merke();
  h.pruefe(sp3.speichere() === false && sp3.ungespeichert === true, 'Schreiben schlägt fehl → bleibt gemerkt');
  h.ergebnis();
})();
