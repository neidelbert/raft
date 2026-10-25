// Test für bausteine/zustaende.js (ohne Browser): node zustaende-test.js
const h = require('./hilfe.js');

(async () => {
  const { erstelleAutomat } = await h.lade('zustaende.js');
  const protokoll = [];
  const leben = { wert: 1 };
  const a = erstelleAutomat({
    titel: { betreten: () => protokoll.push('titel+'), verlassen: () => protokoll.push('titel-'), aktualisiere: () => protokoll.push('titel~') },
    spiel: {
      betreten: () => protokoll.push('spiel+'), verlassen: () => protokoll.push('spiel-'),
      aktualisiere(dt) { protokoll.push(`spiel~${dt}`); if (leben.wert <= 0) a.wechsle('ende'); },
    },
    ende: { betreten: () => protokoll.push(`ende+(${a.name})`) },
    leer: {},
  });
  h.pruefe(a.name === null, 'vor dem ersten Wechsel: kein Zustand');
  a.aktualisiere(0.1);
  h.pruefe(protokoll.length === 0, 'aktualisiere ohne Zustand tut nichts (kein Absturz)');
  a.wechsle('titel');
  h.pruefe(a.name === 'titel' && protokoll.join() === 'titel+', 'wechsle(titel): betreten, Name gesetzt');
  a.aktualisiere(0.1);
  a.wechsle('spiel');
  h.pruefe(protokoll.join() === 'titel+,titel~,titel-,spiel+', 'Reihenfolge: verlassen des alten vor betreten des neuen');
  a.aktualisiere(0.02);
  h.pruefe(protokoll.at(-1) === 'spiel~0.02', 'nur der aktuelle Zustand wird aktualisiert, mit dt');
  leben.wert = 0;
  a.aktualisiere(0.02);
  h.pruefe(a.name === 'ende' && protokoll.slice(-2).join() === 'spiel-,ende+(ende)', 'Wechsel aus aktualisiere heraus (spiel → ende); in betreten ist name schon neu');
  a.wechsle('leer'); a.aktualisiere(0.1); a.wechsle('titel');
  h.pruefe(a.name === 'titel', 'Zustand ohne Funktionen geht (alles darf fehlen)');
  let fehler = '';
  try { a.wechsle('tilte'); } catch (e) { fehler = e.message; }
  h.pruefe(/Unbekannter Zustand: tilte/.test(fehler) && a.name === 'titel', 'Tippfehler im Namen → klarer Fehler, alter Zustand bleibt');
  const zaehler = { n: 0 };
  const b = erstelleAutomat({ spiel: { betreten: () => zaehler.n++, verlassen: () => zaehler.n-- } });
  b.wechsle('spiel'); b.wechsle('spiel');
  h.pruefe(zaehler.n === 1, 'Wechsel in denselben Zustand: verlassen und neu betreten (neue Runde)');
  h.ergebnis();
})();
