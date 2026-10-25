// Speicherstand lesen und schreiben, ohne dass das Spiel je daran abstürzt (Regeln ohne DOM, mit node testbar).
// ladeStand(ort, schluessel, standard) gibt immer einen gültigen Stand zurück: { version, rekord, … }.
//   ort = localStorage (oder im Test ein Ersatz mit getItem/setItem). Fehlt der Eintrag, ist er kein JSON,
//   kein Objekt oder hat ein Feld einen falschen Wert, gilt dafür der Standardwert. Wirft der Speicher selbst
//   (privater Modus, gesperrt), gibt es nur Standardwerte.
// speichereStand(ort, schluessel, stand) gibt true zurück, wenn es geklappt hat; sonst false (Spiel läuft weiter).

export function ladeStand(ort, schluessel, standard) {
  let roh = null;
  try {
    roh = JSON.parse(ort.getItem(schluessel));   // getItem gibt null zurück, wenn nichts da ist → JSON.parse(null) = null
  } catch {
    console.warn(`Speicherstand „${schluessel}“ unlesbar, Standardwerte`);
  }
  return bereinige(roh, standard);
}

export function speichereStand(ort, schluessel, stand) {
  try {
    ort.setItem(schluessel, JSON.stringify(stand));
    return true;
  } catch {
    return false;   // privater Modus oder Speicher voll: der Rekord gilt dann nur bis zum Neuladen
  }
}

// Gelesenen Inhalt in einen gültigen Stand verwandeln. Unbekannte Felder bleiben erhalten (Stände neuerer Versionen).
function bereinige(roh, standard) {
  const istObjekt = roh !== null && typeof roh === 'object' && !Array.isArray(roh);
  const stand = { ...standard, ...(istObjekt ? roh : {}) };
  stand.version = standard.version;   // Version 1: ältere Stände ohne version haben dasselbe Format
  stand.rekord = ganzeZahlAbNull(stand.rekord, standard.rekord);
  return stand;
}

function ganzeZahlAbNull(wert, ersatz) {
  return typeof wert === 'number' && Number.isFinite(wert) && wert >= 0 ? Math.floor(wert) : ersatz;
}
