# Aufbau eines Spiels

## Ordner (jedes Spiel gleich)
```
spiele/<name>/
├── index.html          Startseite: Canvas, Knöpfe, (3D: Import-Map)
├── stil.css            Vollbild, Touch-Einstellungen, Oberfläche
├── grafik/             vom Zeichner: PNGs + grafik.json (Horst ändert hier nichts)
├── assets/             quellen/ (atlas.json, sounds.json, manifest.json, modelle/) → erzeugte Dateien + assets.json
├── SCHULDEN.md         technische Schulden (was, warum, Aufwand)
├── LIESMICH.md         was wo liegt, nächste Schritte
├── js/
│   ├── main.js         Start, Datenfluss (Kommentar oben), Zustände, Hauptschleife
│   ├── test-schnittstelle.js   window.spiel (nur lesen) und mit ?test=1 window.spiel.test
│   ├── config/         nur Daten: spiel.js, steuerung.js, welt.js, später gegner.js, effekte.js … (jede Zahl kommentiert)
│   ├── kern/           unveränderte Kopien aller Bausteine (schleife, bildschirm, joystick, knopf, zustaende, speicher, assets …)
│   ├── regeln/         Spielregeln ohne DOM: spieler.js, runde.js, später gegner.js, treffer.js … (mit Node testbar)
│   ├── welt/           Zeichnen: darstellung.js (2D Canvas oder 3D Three.js), später Effekte, Ersatz-Zeichnungen
│   └── oberflaeche/    HTML-Anzeige: Tafeln, Leiste, Ladebalken, Joystick-Anzeige
└── tests/              <name>-test.js (Regeln ohne Browser + Browser-Test), test-hilfe.js (Kopie aus dem Skill)
```
So legt es `neues-spiel.js` an (2D und 3D unterscheiden sich nur in `index.html`, `js/welt/darstellung.js`, `js/config/welt.js` und den Asset-Quellen). Weitere Ordner entstehen mit ihrer ersten Datei. Bausteine kommen aus `../bausteine/` (siehe `SKILL.md`) und werden unverändert kopiert; `partikel.js` braucht `pool.js` im selben Ordner.

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
  <div id="oberflaeche">
    <div id="feld-joystick"></div>
    <button id="knopf-sprung" type="button">Sprung</button>
  </div>
  <script type="module" src="js/main.js"></script>
</body>
</html>
```

## stil.css (Grundlage)
```css
html, body { margin: 0; height: 100%; overflow: hidden; background: #111; overscroll-behavior: none; }
body { touch-action: none; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none;
       -webkit-tap-highlight-color: transparent; font-family: -apple-system, system-ui, sans-serif; }
canvas { position: fixed; inset: 0; width: 100vw; height: 100dvh; display: block; touch-action: none; }
#oberflaeche { position: fixed; inset: 0; pointer-events: none; }
#feld-joystick { position: absolute; left: 0; top: 0; width: 50%; height: 100%; pointer-events: auto; touch-action: none; }
#oberflaeche button { pointer-events: auto; touch-action: none; min-width: 48px; min-height: 48px; }
```
Knöpfe mit Abstand zum Rand plus Safe-Area: `right: calc(24px + env(safe-area-inset-right))`.

## main.js: Datenfluss und Hauptschleife
Oben steht als Kommentar der Datenfluss, z. B. „Finger → joystick.eingabe → welt.spieler → Gegner → Treffer (leben, effekte, ton) → runde → bei 0 Leben ‚ende‘ → speicher“. Danach:
```js
import { SPIEL } from './config/spiel.js';
import { erstelleSchleife } from './kern/schleife.js';
import { erstelleZufall, seedAusAdresse } from './kern/zufall.js';
import { holeSpeicherOrt, erstelleSpeicher } from './kern/speicher.js';
// …
const seed = seedAusAdresse();
const zufall = erstelleZufall(seed);
const effektZufall = erstelleZufall(seed === undefined ? undefined : seed + 1);   // Effekte verschieben das Spiel nicht
const speicher = erstelleSpeicher(holeSpeicherOrt(), SPEICHER.schluessel, SPEICHER.standard);

// Safari zoomt trotz user-scalable=no mit zwei Fingern: Gesten abfangen.
for (const art of ['gesturestart', 'gesturechange']) document.addEventListener(art, (e) => e.preventDefault());

const schleife = erstelleSchleife({
  aktualisiere(dt) { automat.aktualisiere(dt); aktualisiereRueckmeldung(dt); },   // Effekte in jedem Zustand
  zeichne,
  deltaMax: SPIEL.deltaMax,
  beiVersteckt() { joystick.loese(); speicher.speichere(); },   // ein Finger, der beim Wechsel lag, kommt nie hoch
});
window.addEventListener('pagehide', speicher.speichere);      // beforeunload kommt auf dem iPhone oft nicht
automat.wechsle('titel');
window.spiel = erstelleTestSchnittstelle({ … });
schleife.starte();
requestAnimationFrame(() => { window.spiel.bereit = true; });  // erst nach dem ersten Bild
```
- Reihenfolge in `aktualisiere`: Eingabe → Spieler → Gegner → Kollision → Effekte → Kamera → Oberfläche.
- Warum der Baustein so ist (nicht selbst nachbauen): `dt = min(max(0, jetzt − letzte), deltaMax)` und `letzte = max(letzte, jetzt)`, weil nach einem Tab-Wechsel noch ein Bild mit altem Zeitstempel kommt; das nächste Bild wird zuerst angefordert, damit ein Fehler die Schleife nicht stoppt.
- Was werfen kann (Speichern), wird abgefangen: Ein Fehler in einem Bild darf das Spiel nicht anhalten.
- Physik, die exakt sein muss (z. B. Springen auf Plattformen): fester Zeitschritt mit Sammler:
  ```js
  sammler += dt; while (sammler >= SCHRITT) { physik(SCHRITT); sammler -= SCHRITT; }
  ```

## Spielzustände (`bausteine/zustaende.js`)
Titel → Spiel → (Pause) → Ende. Ein Zustand zur Zeit:
```js
const automat = erstelleAutomat({
  titel: { betreten() { anzeige.zeigeLeiste(false); anzeige.zeigeTitel(speicher.stand.rekord); } },
  spiel: {
    betreten() { neueRunde(); anzeige.aktualisiereLeiste(runde.punkte, spieler.leben); anzeige.versteckeTafel(); },
    aktualisiere(dt) { schritt(dt); anzeige.aktualisiereLeiste(runde.punkte, spieler.leben); if (spieler.leben <= 0) automat.wechsle('ende'); },
  },
  ende: { betreten() { joystick.loese(); merkeRekord(); anzeige.zeigeEnde(runde.punkte, speicher.stand.rekord); } },
});
```
- `betreten()` setzt jede Anzeige des neuen Zustands sofort, sonst zeigt sie ein Bild lang alte Werte.
- `neueRunde()` setzt alles zurück: Leben, Punkte, Gegner, Sterne, Joystick (`joystick.loese()`).
- „Tippen zum Starten“: `pointerdown` am `window` in der Fangphase abfangen (`{ capture: true }`, `preventDefault`, `stopPropagation`), die Tafel selbst hat `pointer-events: none`. Dann löst derselbe Finger weder Joystick noch Knopf aus, und jeder Klick-Weg (Touch, Maus, Playwright) geht. Knöpfe über der Tafel ausnehmen: `if (e.target.closest('#knopf-ton')) return;`.
- Effekte und Partikel laufen in jedem nicht pausierten Bild weiter, nicht nur in „spiel“ (sonst frieren sie auf der Ende-Tafel ein).
- Gegner, Hai und KI arbeiten mit demselben Muster: `kreisen → angreifen → fliehen`.

## Module
- Fabrik-Funktionen statt Klassen-Hierarchien: `export function erstelleGegner(…) { … return { … }; }`. Oben in jeder Datei: was sie tut und welche Felder ihre Objekte haben.
- Gemeinsamer Zustand liegt in einem Objekt (`const welt = { spieler, schwarm, runde, partikel, effekte }`), das an die Module übergeben wird. Keine versteckten globalen Variablen.
- Regeln ohne DOM (Bewegung, Treffer, Punkte, Runde): eigene Funktionen, die nur Zahlen und Objekte bekommen. So testet `node` sie schnell und genau.
- Rückmeldungen über eine gemeinsame Funktion (`beiTreffer()`, `beimSammeln(x, y)`), die das Spiel und die Test-Hilfe (`spiel.test.schaden(n)`) aufrufen. Dann löst der Test dasselbe aus wie das echte Spiel.
- Test-Schnittstelle in `js/test-schnittstelle.js`: `window.spiel` zeigt auf echte Werte (nur lesen). `window.spiel.test` gibt es nur mit `?test=1`.

## Speichern (`bausteine/speicher.js`)
```js
const SPEICHER = { schluessel: 'mein-spiel', standard: { version: 1, rekord: 0, ton: true } };   // in config/spiel.js
const speicher = erstelleSpeicher(holeSpeicherOrt(), SPEICHER.schluessel, SPEICHER.standard);
function merkeRekord() {
  if (runde.punkte > speicher.stand.rekord) { speicher.stand.rekord = runde.punkte; speicher.merke(); speicher.speichere(); }
}
```
- Fehlt der Eintrag, ist er kaputt oder hat ein Feld den falschen Typ: Standardwert. Privater Modus: Standardwerte, Spiel läuft.
- **Nur schreiben, wenn sich etwas geändert hat** (`merke()`). Sonst überschreibt ein Tab beim Schließen, was ein anderer Tab oder ein Test gespeichert hat.
- Neues Feld: in `standard` eintragen. Format geändert: `version` hochzählen und `umwandeln(roh, alteVersion)` schreiben. Den Schlüssel nie ändern.

## Viele gleiche Dinge (`bausteine/pool.js`)
Gegner, Schüsse und Partikel liegen in festen Float64Arrays (ein Array pro Feld), nicht als Objekte. Aktive liegen dicht vorn, die Schleife läuft nur über `0 … anzahl−1`. Grenze erreicht heißt: nichts Neues, kein Absturz. Was keine Zahl ist (Art, Bild), wird als Zahl gespeichert und in `config/` nachgeschlagen.
