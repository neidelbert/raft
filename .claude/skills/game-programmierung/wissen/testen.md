# Testen

Jeder Auftrag bringt einen Test mit: `tests/<spiel>/<spiel>-test.js`. `bash tests/alle-tests.sh` findet ihn automatisch.

## Vorlage
```js
// Test für <Spiel>: node tests/<spiel>/<spiel>-test.js
const t = require('../../werkzeuge/test-hilfe.js');
(async () => {
  const lauf = await t.starte({ ordner: 'spiele/<spiel>', port: 8810, pfad: 'index.html?seed=42' });
  const { seite } = lauf;
  try {
    t.pruefe(await seite.evaluate(() => window.spiel.zustand) === 'titel', 'startet im Titel');
    // … Prüfungen aus „Fertig, wenn“
    await seite.screenshot({ path: process.env.FOTO || '/tmp/<spiel>.png' });
    t.pruefe(lauf.fehler.length === 0, `keine Konsolenfehler ${lauf.fehler.join(' | ')}`);
  } catch (e) { t.pruefe(false, `Ablauf abgebrochen: ${e.message}`); }
  await lauf.ende();
  t.ergebnis();
})();
```
- `werkzeuge/test-hilfe.js` startet Server und Chromium in iPhone-Ansicht, leitet Three.js vom CDN auf eine lokale Kopie um (das CDN ist in der Cloud gesperrt), sammelt Konsolenfehler und bietet `ziehe`, `tippe` und `bildrate`.
- **Eigener Port je Spiel:** ab 8810 in Zehnerschritten, notiert in `TEAM.md` unter „Ports“.
- `?seed=42` macht den Zufall gleich, damit der Test immer gleich abläuft.

## Was jeder Test prüft
1. Start ohne Konsolenfehler, `window.spiel.bereit`.
2. Jede Zeile aus „Fertig, wenn“, über Werte aus `window.spiel` (nicht über Pixel).
3. Touch: `t.ziehe(seite, x1, y1, x2, y2, { halteMs })` bewegt, nach dem Loslassen herrscht Stillstand.
4. Zustandswechsel (Titel → Spiel → Ende) und Speichern (Seite neu laden, Rekord ist noch da).
5. Bildschirmfoto: Horst sieht es sich mit dem Read-Werkzeug an. Stimmt das Bild?

## Reine Rechenregeln ohne Browser
Was keine Grafik braucht (Schaden, Punkte, Kollision, Zufall), steht in eigenen Modulen ohne DOM und wird zusätzlich mit `node --input-type=module -e "import(...)"` oder einer kleinen `tests/<spiel>/regeln-test.mjs` geprüft. Das geht schnell und findet Logikfehler genau.

## Grenzen
Der Test läuft in Chromium mit Software-Grafik. Nicht prüfbar sind die echte Bildrate auf dem iPhone, Safari-Eigenheiten, Sound und das Gefühl. Das kommt in den Bericht unter „Was der Tester am echten iPhone prüfen soll“.
