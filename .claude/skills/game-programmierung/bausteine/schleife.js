// Baustein „schleife“: Hauptschleife mit gedeckelter Delta-Zeit, Pause und ohne Zeitsprung.
// Wofür: jedes Spiel (2D und 3D). Rechnet mit der echten Zeit seit dem letzten Bild (Delta-Zeit), höchstens deltaMax,
//   damit ein Ruckler oder ein langsames Gerät nichts durch Wände springen lässt. Solange der Tab versteckt ist,
//   rechnet nichts; nach der Rückkehr gibt es keinen Sprung (auch nicht durch ein verspätetes Bild mit altem
//   Zeitstempel, Lernbuch Stufe 1). Das nächste Bild wird zuerst angefordert: Ein Fehler in einem Bild hält die
//   Schleife nicht an (Lernbuch Stufe 5). Kein Zugriff auf den Browser beim Laden (mit node testbar).
// Schnittstelle:
//   erstelleSchleife({ aktualisiere, zeichne, deltaMax = 0.1, beiVersteckt, umgebung }) → schleife
//     aktualisiere(dt): Spielregeln, dt in Sekunden (0 … deltaMax). Läuft nicht, solange pausiert.
//     zeichne(dt): jedes Bild, auch pausiert (Pause-Tafel, ausklingende Effekte zeigt man so weiter).
//     beiVersteckt(): einmal, wenn der Tab versteckt wird (speichern, Joystick lösen).
//     umgebung: nur für Tests ohne Browser: { anfrage(f), abbruch(id), uhr(), dokument }.
//       Standard: requestAnimationFrame, cancelAnimationFrame, performance.now, document.
//   schleife.starte() / schleife.stoppe(): Schleife und das Hören auf visibilitychange an und aus.
//   schleife.setzePause(ja): eigene Pause (Pause-Knopf), zusätzlich zum versteckten Tab.
//   schleife.pausiert: true, wenn eigene Pause oder Tab versteckt (nur lesen).
//   schleife.bild(jetzt): ein Bild mit Zeitstempel in ms. Ruft requestAnimationFrame auf; direkt nur in Tests mit
//     nachgebauter umgebung aufrufen (im Browser liefe sonst eine zweite Schleife).
//   schleife.bilder: Zahl der Bilder seit dem Start (für Messungen und Tests).
// 3D: genauso nutzen, in zeichne() steht renderer.render(szene, kamera). setAnimationLoop ist nicht nötig.
// Beispiel:
//   import { erstelleSchleife } from './kern/schleife.js';
//   const schleife = erstelleSchleife({
//     aktualisiere(dt) { bewegeSpieler(welt, dt); },
//     zeichne() { zeichneWelt(ctx, welt); },
//     deltaMax: SPIEL.deltaMax,                 // 0.1 aus config
//     beiVersteckt() { joystick.loese(); speicher.speichere(); },
//   });
//   schleife.starte();

export function erstelleSchleife({ aktualisiere, zeichne, deltaMax = 0.1, beiVersteckt = null, umgebung = null }) {
  const u = umgebung || {};
  const anfrage = u.anfrage || ((f) => requestAnimationFrame(f));
  const abbruch = u.abbruch || ((id) => cancelAnimationFrame(id));
  const uhr = u.uhr || (() => performance.now());
  const dokument = () => u.dokument || globalThis.document;

  const schleife = { pausiert: false, bilder: 0, starte, stoppe, setzePause, bild };
  let letzte = 0, laeuft = false, anfrageId = 0, eigenePause = false, versteckt = false;

  // Manche Test-Werkzeuge und ältere Browser setzen nur eines der beiden Felder.
  function istVersteckt() {
    const d = dokument();
    return Boolean(d && (d.hidden || d.visibilityState === 'hidden'));
  }

  function bild(jetzt) {
    if (laeuft) anfrageId = anfrage(bild);   // zuerst: ein Fehler weiter unten stoppt die Schleife nicht
    const dt = Math.min(Math.max(jetzt - letzte, 0) / 1000, deltaMax);
    letzte = Math.max(letzte, jetzt);        // nie zurück: verspätete Bilder tragen alte Zeitstempel
    schleife.bilder++;
    if (!schleife.pausiert) aktualisiere(dt);
    if (zeichne) zeichne(dt);
  }

  function beiSichtwechsel() {
    versteckt = istVersteckt();
    schleife.pausiert = eigenePause || versteckt;
    letzte = uhr();                           // die versteckte Zeit zählt nicht
    if (versteckt && beiVersteckt) beiVersteckt();
  }

  function setzePause(ja) {
    eigenePause = Boolean(ja);
    schleife.pausiert = eigenePause || versteckt;
  }

  function starte() {
    if (laeuft) return;
    laeuft = true;
    versteckt = istVersteckt();
    schleife.pausiert = eigenePause || versteckt;
    letzte = uhr();
    dokument()?.addEventListener('visibilitychange', beiSichtwechsel);
    anfrageId = anfrage(bild);
  }

  function stoppe() {
    if (!laeuft) return;
    laeuft = false;
    abbruch(anfrageId);
    dokument()?.removeEventListener('visibilitychange', beiSichtwechsel);
  }

  return schleife;
}
