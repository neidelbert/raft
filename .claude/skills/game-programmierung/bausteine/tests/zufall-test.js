// Test für bausteine/zufall.js (ohne Browser): node zufall-test.js
const h = require('./hilfe.js');

(async () => {
  const { erstelleZufall, seedAusAdresse, zwischen } = await h.lade('zufall.js');
  const folge = (seed, n = 20) => { const z = erstelleZufall(seed); return Array.from({ length: n }, z); };

  h.pruefe(JSON.stringify(folge(42)) === JSON.stringify(folge(42)), 'gleicher Seed → gleiche Folge');
  h.pruefe(JSON.stringify(folge(42)) !== JSON.stringify(folge(43)), 'anderer Seed → andere Folge');
  h.pruefe(new Set(folge(0)).size === 20, 'Seed 0 funktioniert (keine feste Zahl)');
  const viele = folge(7, 20000);
  h.pruefe(viele.every((w) => w >= 0 && w < 1), 'alle Werte von 0 bis unter 1');
  const mittel = viele.reduce((a, b) => a + b, 0) / viele.length;
  h.pruefe(Math.abs(mittel - 0.5) < 0.01, `Mittelwert ${h.komma(mittel, 3)} (≈ 0,5)`);
  const faecher = new Array(10).fill(0);
  for (const w of viele) faecher[Math.floor(w * 10)]++;
  h.pruefe(faecher.every((n) => Math.abs(n - 2000) < 200), `gleichmäßig verteilt (10 Fächer: ${faecher.join(', ')})`);
  const ohne1 = erstelleZufall()(), ohne2 = erstelleZufall(Date.now() + 1)();
  h.pruefe(typeof ohne1 === 'number' && ohne1 !== ohne2, 'ohne Seed: Startwert aus der Uhr');

  h.pruefe(seedAusAdresse('?seed=42') === 42, '?seed=42 → 42');
  h.pruefe(seedAusAdresse('?test=1&seed=7') === 7, '?test=1&seed=7 → 7');
  h.pruefe(seedAusAdresse('?seed=abc') === undefined && seedAusAdresse('') === undefined, 'ohne gültigen Seed → undefined');
  h.pruefe(seedAusAdresse() === undefined, 'ohne Browser (kein location) → undefined, kein Absturz');

  const z = erstelleZufall(1);
  let imBereich = true;
  for (let i = 0; i < 1000; i++) { const w = zwischen(z, -3, 5); if (w < -3 || w >= 5) imBereich = false; }
  h.pruefe(imBereich, 'zwischen(z, −3, 5) bleibt im Bereich');
  h.ergebnis();
})();
