// Zustandsautomat: genau ein Zustand zur Zeit. Regeln ohne DOM (mit node testbar).
// erstelleAutomat(zustaende) gibt { wechsle(name), aktualisiere(dt), name } zurück:
//   zustaende = { titel: { betreten(), aktualisiere(dt), verlassen() }, … } (jede Funktion darf fehlen).
//   wechsle ruft verlassen() des alten und betreten() des neuen Zustands auf; name ist danach der neue Name.
//   Ein Wechsel aus betreten()/aktualisiere() heraus ist erlaubt (z. B. spiel → ende bei 0 Leben).
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
