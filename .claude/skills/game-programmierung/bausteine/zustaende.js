// Baustein „zustaende“: Zustandsautomat, genau ein Zustand zur Zeit (Titel → Spiel → Ende, Gegner-KI).
// Wofür: Spielablauf (titel, spiel, pause, ende) und Verhalten (kreisen → angreifen → fliehen). Jeder Zustand
//   räumt in verlassen() auf und setzt in betreten() alles, was er braucht, auch die Anzeige (Lernbuch Stufe 4:
//   sonst zeigt sie ein Bild lang alte Werte). Reine Logik, mit node testbar.
// Schnittstelle:
//   erstelleAutomat(zustaende) → automat
//     zustaende = { titel: { betreten(), aktualisiere(dt), verlassen() }, … }; jede Funktion darf fehlen.
//   automat.wechsle(name): verlassen() des alten, dann betreten() des neuen. Unbekannter Name wirft einen Fehler
//     (Tippfehler sofort sehen). Ein Wechsel aus aktualisiere() oder betreten() heraus ist erlaubt (spiel → ende).
//   automat.aktualisiere(dt): aktualisiere(dt) des aktuellen Zustands.
//   automat.name: Name des aktuellen Zustands (null vor dem ersten wechsle).
// Effekte und Partikel nicht nur in „spiel“ rechnen, sondern in jedem nicht pausierten Bild (Lernbuch Stufe 6).
// Beispiel:
//   import { erstelleAutomat } from './ablauf/zustaende.js';
//   const automat = erstelleAutomat({
//     titel: { betreten() { anzeige.zeigeTitel(speicher.stand.rekord); } },
//     spiel: { betreten() { neueRunde(); }, aktualisiere(dt) { schritt(dt); if (istVorbei()) automat.wechsle('ende'); } },
//     ende:  { betreten() { joystick.loese(); merkeRekord(); anzeige.zeigeEnde(); } },
//   });
//   automat.wechsle('titel');
//   // in der Schleife: aktualisiere(dt) { automat.aktualisiere(dt); }

export function erstelleAutomat(zustaende) {
  const automat = { name: null, wechsle, aktualisiere };
  let aktuell = null;

  function wechsle(name) {
    const neu = zustaende[name];
    if (!neu) throw new Error(`Unbekannter Zustand: ${name}`);
    aktuell?.verlassen?.();
    aktuell = neu;
    automat.name = name;
    neu.betreten?.();
  }

  function aktualisiere(dt) { aktuell?.aktualisiere?.(dt); }

  return automat;
}
