// window.spiel: nur zum Lesen für Tests (der Spielcode liest es nie). Mit ?test=1 zusätzlich spiel.test.
// Felder: bereit, zustand ('laden'|'titel'|'spiel'|'ende'), fortschritt (0 … 1), assets { geladen, ersetzt, fehlend },
//   spieler { x, y, weg, laeuft, blick }, feld { minX, minY, maxX, maxY } (Kopie), punkte, zeit (s übrig), rekord,
//   ton { an, bereit, klaenge (gespielte Klänge) }, pausiert, joystickAktiv, darstellung ('2d'|'3d'), pixelRatio,
//   zeichenaufrufe (letztes Bild), modell ('glb'|'ersatz'|''), figur (2D: 'atlas'|'ersatz', 3D: ''),
//   animation (2D: 'stand'|'lauf'), feldOben (2D: unterer Rand der Bedienelemente oben, Punkte),
//   rahmen { name: { b, h, ankerX, ankerY, ersatz } } (Kopie aller geladenen oder ersetzten Rahmen), animationen [Namen]
// spiel.test (nur ?test=1): setzeZeit(s) – Restzeit der Runde setzen (die Runde endet dann auf dem normalen Weg).
const LEER = { geladen: [], ersetzt: [], fehlend: [] };

export function erstelleTestSchnittstelle({ automat, lade, welt, ton, zaehler, schleife, joystick, darstellung, speicher, mitTest }) {
  const spiel = {
    bereit: false,
    get zustand() { return automat.name; },
    get fortschritt() { return lade.fortschritt; },
    get assets() { return welt.assets ? welt.assets.status : LEER; },
    spieler: {
      get x() { return welt.spieler.x; },
      get y() { return welt.spieler.y; },
      get weg() { return welt.spieler.weg; },
      get laeuft() { return welt.spieler.laeuft; },
      get blick() { return welt.spieler.blick; },
    },
    get feld() { return { ...welt.feld }; },   // nur für Tests (neues Objekt je Abfrage, nie im Spiel lesen)
    get punkte() { return welt.runde.punkte; },
    get zeit() { return welt.runde.zeit; },
    get rekord() { return speicher.stand.rekord; },
    ton: {
      get an() { return ton.an; },
      get bereit() { return ton.bereit; },
      get klaenge() { return zaehler.klaenge; },
    },
    get pausiert() { return schleife.pausiert; },
    get joystickAktiv() { return joystick.eingabe.aktiv; },
    get darstellung() { return darstellung.art; },
    get pixelRatio() { return darstellung.pixelRatio; },
    get zeichenaufrufe() { return darstellung.zeichenaufrufe; },
    get modell() { return darstellung.modell; },
    get figur() { return darstellung.figur || ''; },
    get animation() { return darstellung.animation || ''; },
    get feldOben() { return darstellung.feldOben || 0; },
    get rahmen() {   // nur für Tests (neue Objekte je Abfrage)
      const liste = {};
      for (const [name, r] of Object.entries(welt.assets ? welt.assets.rahmen : {})) liste[name] = { b: r.b, h: r.h, ankerX: r.ankerX, ankerY: r.ankerY, ersatz: Boolean(r.ersatz) };
      return liste;
    },
    get animationen() { return welt.assets ? Object.keys(welt.assets.animationen) : []; },
  };
  if (mitTest) spiel.test = { setzeZeit(s) { welt.runde.zeit = s; } };
  return spiel;
}
