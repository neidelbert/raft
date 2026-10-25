// Baustein „speicher“: Spielstand in localStorage lesen und schreiben, ohne dass das Spiel je daran abstürzt.
// Wofür: Rekord, Einstellungen (Ton), Fortschritt. Fehlt der Eintrag, ist er kein JSON, kein Objekt oder hat ein Feld
//   den falschen Typ, gilt dafür der Standardwert. Wirft der Speicher selbst (privater Modus, gesperrte Website-Daten,
//   voll), läuft das Spiel mit Standardwerten weiter. Unbekannte Felder bleiben erhalten (Stand einer neueren
//   Version). Geschrieben wird nur, wenn sich etwas geändert hat (Lernbuch Stufe 4: sonst überschreibt ein Tab
//   beim Schließen, was ein anderer gespeichert hat). Reine Logik, mit node testbar (ort ist austauschbar).
// Schnittstelle:
//   holeSpeicherOrt() → localStorage oder null (schon der Zugriff kann werfen).
//   ladeStand(ort, schluessel, standard, { umwandeln, pruefe }) → immer ein gültiger Stand.
//     standard: { version: 1, … } mit allen Feldern und ihren Standardwerten (verschachtelte Objekte erlaubt).
//     umwandeln(roh, alteVersion) → roh: alten Stand ins neue Format bringen (nur bei kleinerer Version).
//     pruefe(stand, standard): eigene Grenzen nachschärfen (z. B. Rekord ganze Zahl ab 0); schreibt in stand.
//   speichereStand(ort, schluessel, stand) → true, wenn es geklappt hat, sonst false.
//   erstelleSpeicher(ort, schluessel, standard, optionen) → { stand, merke(), speichere(), ungespeichert }
//     merke(): Stand hat sich geändert. speichere(): schreibt nur dann; klappt es nicht, bleibt es gemerkt
//     (nächster Versuch beim nächsten Aufruf). Aufrufen bei Änderung, bei visibilitychange (versteckt) und pagehide.
//   bereinige(roh, standard) → Stand: die Regel für Felder und Typen (exportiert für Tests).
// Neue Felder: einfach in standard eintragen (alte Stände bekommen den Standardwert). Format geändert: version
//   hochzählen und umwandeln schreiben. Den Schlüssel nie ändern (sonst ist der alte Rekord weg).
// Beispiel:
//   import { holeSpeicherOrt, erstelleSpeicher } from './kern/speicher.js';
//   const speicher = erstelleSpeicher(holeSpeicherOrt(), 'mein-spiel', { version: 1, rekord: 0, ton: true });
//   if (punkte > speicher.stand.rekord) { speicher.stand.rekord = punkte; speicher.merke(); speicher.speichere(); }
//   window.addEventListener('pagehide', speicher.speichere);

export function holeSpeicherOrt() {
  try { return globalThis.localStorage ?? null; } catch { return null; }
}

export function ladeStand(ort, schluessel, standard, { umwandeln = null, pruefe = null } = {}) {
  let roh = null;
  try {
    roh = ort ? JSON.parse(ort.getItem(schluessel)) : null;   // getItem gibt null, wenn nichts da ist
  } catch {
    console.warn(`Speicherstand „${schluessel}“ unlesbar, Standardwerte`);
  }
  if (!istObjekt(roh)) roh = null;
  const alteVersion = roh && typeof roh.version === 'number' ? roh.version : 0;
  if (roh && umwandeln && alteVersion < standard.version) {
    try { roh = umwandeln(roh, alteVersion); } catch { console.warn(`Speicherstand „${schluessel}“ nicht umwandelbar`); roh = null; }
  }
  const stand = bereinige(roh, standard);
  stand.version = Math.max(standard.version, alteVersion);   // ein neuerer Stand bleibt als neuer erkennbar
  if (pruefe) pruefe(stand, standard);
  return stand;
}

export function speichereStand(ort, schluessel, stand) {
  if (!ort) return false;
  try {
    ort.setItem(schluessel, JSON.stringify(stand));
    return true;
  } catch {
    return false;   // privater Modus oder Speicher voll: gilt dann nur bis zum Neuladen
  }
}

export function erstelleSpeicher(ort, schluessel, standard, optionen) {
  const speicher = {
    stand: ladeStand(ort, schluessel, standard, optionen),
    ungespeichert: false,
    merke() { speicher.ungespeichert = true; },
    speichere() {
      if (speicher.ungespeichert && speichereStand(ort, schluessel, speicher.stand)) speicher.ungespeichert = false;
      return !speicher.ungespeichert;
    },
  };
  return speicher;
}

// Jedes Feld aus standard: passender Typ → übernehmen, sonst Standardwert. Objekte werden Feld für Feld geprüft.
export function bereinige(roh, standard) {
  const quelle = istObjekt(roh) ? roh : {};
  const stand = { ...quelle };
  for (const feld of Object.keys(standard)) {
    const soll = standard[feld], ist = quelle[feld];
    if (istObjekt(soll)) stand[feld] = bereinige(ist, soll);
    else if (passt(ist, soll)) stand[feld] = ist;
    else stand[feld] = soll === null || typeof soll !== 'object' ? soll : structuredClone(soll);
  }
  return stand;
}

function passt(ist, soll) {
  if (soll === null) return ist !== undefined;
  if (Array.isArray(soll)) return Array.isArray(ist);
  if (typeof soll === 'number') return typeof ist === 'number' && Number.isFinite(ist);
  return typeof ist === typeof soll && ist !== null;
}

function istObjekt(w) { return w !== null && typeof w === 'object' && !Array.isArray(w); }
