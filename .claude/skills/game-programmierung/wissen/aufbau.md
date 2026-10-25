# Aufbau eines Spiels

## Ordner (jedes Spiel gleich)
```
spiele/<name>/
├── index.html          Startseite: Canvas, Knöpfe, (3D: Import-Map)
├── stil.css            Vollbild, Touch-Einstellungen, Oberfläche
├── grafik/             vom Zeichner: PNGs + grafik.json (Horst ändert hier nichts)
└── js/
    ├── main.js         Start, Hauptschleife, window.spiel
    ├── config/         nur Daten: spiel.js, spieler.js, gegner.js … (jede Zahl kommentiert)
    ├── kern/           bildschirm.js, zeit.js, speicher.js, bilder.js, sound.js, zufall.js
    ├── steuerung/      joystick.js, knoepfe.js
    ├── welt/ figur/ gegner/ …   Spielinhalt nach Bereichen
    └── oberflaeche/    Anzeige (Punkte, Leben), Menüs, Hinweise
tests/<name>/<name>-test.js
```
Ordner entstehen mit ihrer ersten Datei. Kleine Spiele brauchen nicht alle.

## index.html (2D)
```html
<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <title>Spielname</title>
  <link rel="stylesheet" href="stil.css">
</head>
<body>
  <canvas id="leinwand"></canvas>
  <div id="oberflaeche"></div>
  <script type="module" src="js/main.js"></script>
</body>
</html>
```

## stil.css (Grundlage)
```css
html, body { margin: 0; height: 100%; overflow: hidden; background: #111; }
body { touch-action: none; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none;
       -webkit-tap-highlight-color: transparent; font-family: -apple-system, system-ui, sans-serif; }
canvas { position: fixed; inset: 0; width: 100vw; height: 100dvh; display: block; }
#oberflaeche { position: fixed; inset: 0; pointer-events: none; }
#oberflaeche button { pointer-events: auto; min-width: 48px; min-height: 48px; }
```

## Hauptschleife (`js/main.js`)
```js
import { SPIEL } from './config/spiel.js';
const teile = [];                 // alles mit aktualisiere(dt) in fester Reihenfolge
let letzte = performance.now();
let pausiert = false;

function bild(jetzt) {
  const dt = Math.min((jetzt - letzte) / 1000, SPIEL.deltaMax);   // Sekunden, gedeckelt
  letzte = jetzt;
  if (!pausiert) for (const teil of teile) teil.aktualisiere(dt);
  zeichne();
  requestAnimationFrame(bild);
}
requestAnimationFrame((t) => { letzte = t; requestAnimationFrame(bild); });

document.addEventListener('visibilitychange', () => {
  pausiert = document.hidden;
  letzte = performance.now();                  // keinen Zeitsprung nach der Rückkehr
  if (document.hidden) speichern();
});
window.addEventListener('pagehide', speichern);
```
- Reihenfolge in `teile`: Eingabe → Spieler → Gegner → Kollision → Effekte → Kamera → Oberfläche.
- Physik, die exakt sein muss (z. B. Springen auf Plattformen): fester Zeitschritt mit Sammler:
  ```js
  sammler += dt; while (sammler >= SCHRITT) { physik(SCHRITT); sammler -= SCHRITT; }
  ```

## Spielzustände
Titel → Spiel → Pause → Ende. Ein Zustand zur Zeit, als kleines Objekt:
```js
const ZUSTAENDE = {
  titel: { betreten() { zeigeTitel(); }, aktualisiere(dt) {}, verlassen() { versteckeTitel(); } },
  spiel: { betreten() { neueRunde(); }, aktualisiere(dt) { /* Spiel */ }, verlassen() {} },
  ende:  { betreten() { zeigeErgebnis(); speichereRekord(); }, aktualisiere(dt) {}, verlassen() {} },
};
let zustand = null;
export function wechsle(name) { zustand?.verlassen(); zustand = ZUSTAENDE[name]; zustand.betreten(); window.spiel.zustand = name; }
```
Gegner, Hai und KI arbeiten mit demselben Muster (Zustandsautomat): `kreisen → angreifen → fliehen`.

## Module
- Fabrik-Funktionen statt Klassen-Hierarchien: `export function erstelleGegner(…) { … return { aktualisiere, zeichne }; }`
- Gemeinsamer Zustand liegt in einem Objekt (`const welt = { spieler, gegner: [], punkte: 0 }`), das an die Module übergeben wird. Keine versteckten globalen Variablen.
- Zufall über `kern/zufall.js` mit Startwert (Seed), damit Tests gleich ablaufen:
  ```js
  export function erstelleZufall(seed = Date.now()) {
    let s = seed >>> 0;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);   // 0 bis <1
  }
  ```
  Im Test: `?seed=42` in der Adresse, `main.js` liest `new URLSearchParams(location.search).get('seed')`.

## Speichern
```js
const STANDARD = { version: 1, rekord: 0, einstellungen: { ton: true } };
export function lade(name) {
  try {
    const roh = JSON.parse(localStorage.getItem(name) || 'null');
    return roh ? { ...structuredClone(STANDARD), ...roh } : structuredClone(STANDARD);
  } catch { return structuredClone(STANDARD); }
}
export function speichere(name, stand) {
  try { localStorage.setItem(name, JSON.stringify(stand)); } catch { /* privat oder voll: Spiel läuft weiter */ }
}
```
Verschachtelte Felder einzeln zusammenführen, wenn sie neu dazukommen (`einstellungen: { ...STANDARD.einstellungen, ...roh.einstellungen }`).

## Objekt-Pool (viele Gegner, Schüsse, Partikel)
```js
export function erstellePool(erzeuge, anzahl) {
  const alle = Array.from({ length: anzahl }, erzeuge);
  for (const o of alle) o.aktiv = false;
  return {
    alle,
    hole() { const o = alle.find((x) => !x.aktiv); if (o) o.aktiv = true; return o ?? null; },
    gib(o) { o.aktiv = false; },
  };
}
```
In der Schleife nur über aktive Objekte laufen. Grenze erreicht heißt: nichts Neues, kein Absturz.
