# Muster: So sieht Code in Raft 3D aus

Diese Muster sind erprobt. Nutze sie, statt neue Wege zu erfinden. Weichst du ab, schreib den Grund in den Übergabebericht.

## 1. Modul mit Konfiguration
```js
// spiel/js/config/floss.js – nur Daten, jede Zahl kommentiert
export const FLOSS = {
  feldGroesse: 1.5,      // Meter je Feld (Wert für Lukas zum Testen)
  startSpalten: 2,       // Startfloß 2 × 2
  startZeilen: 2,
};
```
```js
// spiel/js/floss/floss.js – eine Datei, eine Aufgabe
import * as THREE from 'three';
import { FLOSS } from '../config/floss.js';

export function erstelleFloss(szene) {
  const gruppe = new THREE.Group();
  szene.add(gruppe);
  function aktualisiere(dt, zeit) { /* nur mit dt rechnen */ }
  return { gruppe, aktualisiere };
}
```
- Exportiere Fabrik-Funktionen (`erstelleX`), die ein Objekt mit `aktualisiere(dt, zeit)` zurückgeben. Keine Klassen-Hierarchien.
- Namen: Konstanten-Objekte GROSS (`FLOSS`), Funktionen und Variablen klein auf Deutsch, Dateien klein mit Bindestrich, keine Umlauten im Code (`groesse`, `floss`).

## 2. Hauptschleife (`spiel/js/main.js`)
```js
const uhr = new THREE.Clock();
let zeit = 0;
let pausiert = false;
renderer.setAnimationLoop(() => {
  const dt = Math.min(uhr.getDelta(), LEISTUNG.deltaMax);
  if (pausiert) return renderer.render(szene, kamera);
  zeit += dt;
  for (const teil of teile) teil.aktualisiere(dt, zeit); // Reihenfolge: Eingabe, Welt, Floß, Figur, Gegner, Kamera
  renderer.render(szene, kamera);
});
document.addEventListener('visibilitychange', () => {
  pausiert = document.hidden;
  uhr.getDelta(); // Sprung nach Rückkehr verwerfen
});
```

## 3. Test-Schnittstelle `window.spiel`
- `main.js` hängt nur zum Lesen an: `window.spiel = { bereit: true, renderer, szene, kamera, ...teile }`.
- Tests lesen daraus Zustände (z. B. `window.spiel.floss.gruppe.position.z`) statt Pixel zu vergleichen.
- Neue Teile kommen dort dazu. Spielcode selbst liest `window.spiel` nie.

## 4. Joystick (erprobt, Rollentest T1)
- Vorlage: `tests/agenten/prototyp/js/steuerung.js`. Übernimm sie nach `spiel/js/steuerung/joystick.js`, Werte in `config/steuerung.js`.
- Gibt `{ eingabe: { x, y } }` mit Werten von −1 bis 1 zurück. `y` = vom Bildschirm weg.
- Beim Loslassen und bei `pointercancel` werden x **und** y auf 0 gesetzt.

## 5. Spielstand mit Standardwerten
```js
const STANDARD = { version: 1, floss: [[0,0],[1,0],[0,1],[1,1]], vorrat: {}, hinweiseGesehen: [] };
export function ladeSpielstand() {
  try {
    const roh = JSON.parse(localStorage.getItem(LEISTUNG.speicherName) || 'null');
    return roh ? { ...structuredClone(STANDARD), ...roh } : structuredClone(STANDARD);
  } catch { return structuredClone(STANDARD); }
}
export function speichereSpielstand(stand) {
  try { localStorage.setItem(LEISTUNG.speicherName, JSON.stringify(stand)); } catch { /* voll oder privat: Spiel läuft weiter */ }
}
```
- Neue Felder nur in `STANDARD` ergänzen. Nie ein Feld umbenennen oder umdeuten, ohne `version` zu erhöhen und alte Stände umzuwandeln.

## 6. Pool statt neu erzeugen
```js
export function erstellePool(erzeuge, anzahl) {
  const frei = Array.from({ length: anzahl }, erzeuge);
  return {
    hole: () => frei.pop() ?? null,          // null = Grenze erreicht, dann nichts Neues
    gib: (teil) => { teil.visible = false; frei.push(teil); },
  };
}
```

## 7. Zustandsautomat (Hai u. a.)
```js
const ZUSTAENDE = {
  kreisen:     (h, dt) => { /* … */ if (h.zeitBisAngriff <= 0) return 'anschwimmen'; },
  anschwimmen: (h, dt) => { /* … */ if (h.amZiel) return 'beissen'; },
};
function aktualisiereHai(h, dt) {
  const neu = ZUSTAENDE[h.zustand](h, dt);
  if (neu) { h.zustand = neu; h.zustandZeit = 0; } else h.zustandZeit += dt;
}
```

## 8. Wiederverwendbare Vektoren
```js
const _richtung = new THREE.Vector3(); // einmal oben, in der Schleife nur .set()/.copy()
```
