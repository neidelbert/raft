// Regeln ohne Browser für Übung 4 (wird von test.js aufgerufen): Speicherstand, Zustandsautomat, Runde.

// Ersatz für localStorage: Map mit getItem/setItem; sperren = wirft wie Safari im privaten Modus oder bei vollem Speicher.
function ersatzSpeicher(inhalt = {}, sperren = false) {
  const daten = new Map(Object.entries(inhalt));
  return {
    daten,
    getItem(k) { if (sperren) throw new Error('SecurityError'); return daten.has(k) ? daten.get(k) : null; },
    setItem(k, v) { if (sperren) throw new Error('QuotaExceededError'); daten.set(k, String(v)); },
  };
}

async function speicherRegeln(t, lade) {
  const { ladeStand, speichereStand } = await lade('js/kern/speicher.js');
  const { SPEICHER } = await lade('js/config/spiel.js');
  const { schluessel: K, standard: S } = SPEICHER;
  t.pruefe(K === 'uebung-4' && S.rekord === 0 && S.version === 1, 'Speicher: Schlüssel „uebung-4“, Standard rekord 0, version 1');
  const warnen = console.warn;
  const warnungen = [];
  console.warn = (text) => warnungen.push(text);   // unlesbare Stände warnen nur, das ist hier erwartet
  try {
    const leer = ladeStand(ersatzSpeicher(), K, S);
    t.pruefe(leer.rekord === 0 && leer.version === 1, 'Speicher: nichts gespeichert → Standardwerte');
    t.pruefe(ladeStand(ersatzSpeicher({ [K]: '{"version":1,"rekord":42}' }), K, S).rekord === 42, 'Speicher: gültiger Stand → Rekord 42');
    t.pruefe(ladeStand(ersatzSpeicher({ [K]: '{"rekord":7}' }), K, S).rekord === 7, 'Speicher: alter Stand ohne version wird übernommen');
    const kaputt = ['kein json{', '', '{"rekord":', 'undefined', 'null', '[]', '[5]', '"text"', '17', 'true',
      '{"rekord":"viel"}', '{"rekord":-3}', '{"rekord":null}', '{"rekord":1e999}', '{"rekord":{}}'];
    const ergebnisse = kaputt.map((roh) => {
      try { return ladeStand(ersatzSpeicher({ [K]: roh }), K, S); } catch (e) { return { absturz: e.message }; }
    });
    t.pruefe(ergebnisse.every((s) => s.rekord === 0 && s.version === 1),
      `Speicher: ${kaputt.length} kaputte Inhalte (kein JSON, falsche Typen, negativ, unendlich) → kein Absturz, Rekord 0`);
    t.pruefe(warnungen.length >= 4, `Speicher: unlesbares JSON gibt eine Warnung (${warnungen.length})`);
    t.pruefe(ladeStand(ersatzSpeicher({ [K]: '{"rekord":12.7}' }), K, S).rekord === 12, 'Speicher: Kommazahl wird zu ganzer Zahl (12,7 → 12)');
    const mitMehr = ladeStand(ersatzSpeicher({ [K]: '{"rekord":3,"ton":false}' }), K, S);
    t.pruefe(mitMehr.ton === false && mitMehr.rekord === 3, 'Speicher: unbekannte Felder bleiben erhalten (nichts geht verloren)');
    t.pruefe(ladeStand(null, K, S).rekord === 0, 'Speicher: kein localStorage vorhanden → Standardwerte');
    t.pruefe(ladeStand(ersatzSpeicher({}, true), K, S).rekord === 0, 'Speicher: localStorage wirft (privater Modus) → Standardwerte');

    const ort = ersatzSpeicher();
    t.pruefe(speichereStand(ort, K, { version: 1, rekord: 9 }) === true && JSON.parse(ort.daten.get(K)).rekord === 9, 'Speicher: Speichern schreibt JSON');
    t.pruefe(ladeStand(ort, K, S).rekord === 9, 'Speicher: Gespeichertes wird wieder gelesen');
    t.pruefe(speichereStand(ersatzSpeicher({}, true), K, { rekord: 1 }) === false, 'Speicher: Speichern im privaten Modus → false, kein Absturz');
    t.pruefe(speichereStand(null, K, { rekord: 1 }) === false, 'Speicher: Speichern ohne localStorage → false, kein Absturz');
    const vorlage = ladeStand(ersatzSpeicher(), K, S);
    vorlage.rekord = 99;
    t.pruefe(S.rekord === 0, 'Speicher: Ändern des geladenen Stands ändert die Standardwerte nicht');
  } finally {
    console.warn = warnen;
  }
}

async function automatRegeln(t, lade) {
  const { erstelleAutomat } = await lade('js/ablauf/zustaende.js');
  const protokoll = [];
  const eintrag = (name) => ({
    betreten() { protokoll.push(`+${name}`); }, verlassen() { protokoll.push(`-${name}`); },
    aktualisiere(dt) { protokoll.push(`${name}:${dt}`); if (name === 'spiel' && dt > 1) automat.wechsle('ende'); },
  });
  const automat = erstelleAutomat({ titel: eintrag('titel'), spiel: eintrag('spiel'), ende: { betreten() { protokoll.push('+ende'); } } });
  t.pruefe(automat.name === null, 'Automat: vor dem ersten Wechsel kein Zustand');
  automat.aktualisiere(0.1);
  automat.wechsle('titel');
  automat.aktualisiere(0.5);
  automat.wechsle('spiel');
  automat.aktualisiere(2);
  automat.aktualisiere(0.1);   // ende hat kein aktualisiere: nichts passiert
  t.pruefe(protokoll.join(' ') === '+titel titel:0.5 -titel +spiel spiel:2 -spiel +ende' && automat.name === 'ende',
    `Automat: verlassen vor betreten, Wechsel aus aktualisiere heraus (${protokoll.join(' ')})`);
  let fehler = '';
  try { automat.wechsle('pause'); } catch (e) { fehler = e.message; }
  t.pruefe(fehler.includes('pause') && automat.name === 'ende', 'Automat: unbekannter Zustand meldet einen Fehler und bleibt im alten');
}

async function rundenRegeln(t, lade) {
  const { erstelleRunde, setzeRundeZurueck, zaehleZeit, besterWert, nimmLeben, istVorbei } = await lade('js/ablauf/runde.js');
  const { erstelleSpieler, setzeSpielerZurueck } = await lade('js/welt/spieler.js');
  const { SPIEL } = await lade('js/config/spiel.js');
  const r = erstelleRunde();
  for (let i = 0; i < 59; i++) zaehleZeit(r, 1 / 60, SPIEL.punkteProSekunde);
  t.pruefe(r.punkte === 0, `Runde: nach 59 Bildern (0,98 s) noch 0 Punkte`);
  for (let i = 0; i < 2; i++) zaehleZeit(r, 1 / 60, SPIEL.punkteProSekunde);
  t.pruefe(r.punkte === 1 && Number.isInteger(r.punkte), 'Runde: nach 1 s genau 1 Punkt (ganze Zahl)');
  for (let i = 0; i < 20 * 37; i++) zaehleZeit(r, 1 / 20, SPIEL.punkteProSekunde);
  t.pruefe(r.punkte === 38, `Runde: bei 20 Bildern/s nach 38 s 38 Punkte (${r.punkte})`);
  setzeRundeZurueck(r);
  t.pruefe(r.punkte === 0 && r.zeit === 0, 'Runde: Zurücksetzen → 0 Punkte, 0 s');
  t.pruefe(besterWert(10, 12) === 12 && besterWert(10, 9) === 10 && besterWert(10, 10) === 10 && besterWert(0, 0) === 0,
    'Rekord: nur wenn höher (12 > 10 → 12; 9 → bleibt 10; gleich → bleibt)');
  const sp = erstelleSpieler({ x: 1, y: 2, breite: 60, hoehe: 72, leben: 5 });
  nimmLeben(sp, 2);
  t.pruefe(sp.leben === 3 && !istVorbei(sp), 'Schaden 2: 3 Leben, noch nicht vorbei');
  nimmLeben(sp, 10);
  t.pruefe(sp.leben === 0 && istVorbei(sp), 'Schaden 10: Leben 0 (nie negativ), vorbei');
  Object.assign(sp, { springt: true, sprungZeit: 0.2, unverwundbar: true, schutz: 0.5 });
  setzeSpielerZurueck(sp, 195, 332, 5);
  t.pruefe(sp.leben === 5 && sp.x === 195 && sp.y === 332 && !sp.springt && sp.sprungZeit === 0 && !sp.unverwundbar && sp.schutz === 0,
    'neue Runde: Spieler in der Mitte, 5 Leben, kein Sprung, kein Schutz');
}

module.exports = async function ablaufRegeln(t, lade) {
  await speicherRegeln(t, lade);
  await automatRegeln(t, lade);
  await rundenRegeln(t, lade);
};
