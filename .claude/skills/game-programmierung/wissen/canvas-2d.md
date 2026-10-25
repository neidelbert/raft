# 2D mit Canvas

## Zeichnen
- Ein Canvas, `const ctx = leinwand.getContext('2d', { alpha: false })`. Ohne Transparenz ist das Zeichnen schneller.
- Jedes Bild: Hintergrund (Kacheln) → Schatten → Objekte nach y sortiert (wer weiter unten steht, wird später gezeichnet) → Effekte → Oberfläche.
- Bilder zeichnen: `ctx.drawImage(bild, x - b/2, y - h, b, h)` mit dem Fußpunkt als Bezug (x Mitte, y Füße). So stimmen Schatten und Sortierung.
- Spiegeln statt zwei Bilder: `ctx.save(); ctx.translate(x, y); ctx.scale(-1, 1); ctx.drawImage(…); ctx.restore();`
- `save/restore` kostet. Für viele gleiche Objekte lieber `setTransform` direkt setzen und am Ende zurücksetzen.
- Text: Schrift einmal setzen, nicht pro Objekt. Oft wechselnde Zahlen (Punkte) in der HTML-Oberfläche statt im Canvas.
- `ctx.imageSmoothingEnabled = true` für Cartoon-Bilder, `false` nur für Pixel-Art.

## Kamera
```js
const kamera = { x: 0, y: 0, wackeln: 0 };
function folge(dt, ziel) {
  const f = 1 - Math.exp(-KAMERA.nachziehen * dt);   // gleich weich bei jeder Bildrate
  kamera.x += (ziel.x - kamera.x) * f; kamera.y += (ziel.y - kamera.y) * f;
}
// beim Zeichnen: ctx.setTransform(pr, 0, 0, pr, pr * (breite/2 - kamera.x), pr * (hoehe/2 - kamera.y));
```
- Nur zeichnen, was im Bild ist (Rand von etwa 64 px dazurechnen). Weltkoordinaten in Metern oder Pixeln einmal festlegen und durchhalten.
- Endloser Boden: die Kachel ab `Math.floor(kamera.x / k) * k` wiederholen.

## Bilder laden
```js
export function ladeBilder(liste) {           // liste aus grafik/grafik.json
  const bilder = {};
  return Promise.all(liste.map((e) => new Promise((fertig) => {
    const b = new Image();
    b.onload = () => { bilder[e.name] = b; fertig(); };
    b.onerror = () => { console.warn(`Bild fehlt: ${e.datei}`); fertig(); };   // kein Absturz, Ersatz wird gezeichnet
    b.src = e.datei;
  }))).then(() => bilder);
}
```
`console.warn` statt `console.error`: Ein fehlendes Bild ist kein Absturz. Den Ersatz zeichnet `grafik-und-sound.md`.

## Kollision
- Kreise reichen fast immer: `dx*dx + dy*dy < (r1 + r2) ** 2` (ohne Wurzel).
- Rechtecke (Plattformen): erst x bewegen und auflösen, dann y bewegen und auflösen. Sonst bleibt man an Kanten hängen.
- **Viele Gegner (über 50): Gitter.** Jedes Bild Zellen leeren und füllen, dann nur Nachbarzellen prüfen:
  ```js
  const ZELLE = 64; const gitter = new Map();
  function schluessel(x, y) { return ((x / ZELLE) | 0) * 73856093 ^ ((y / ZELLE) | 0) * 19349663; }
  function fuelle(liste) { for (const z of gitter.values()) z.length = 0;
    for (const o of liste) { const k = schluessel(o.x, o.y); (gitter.get(k) || gitter.set(k, []).get(k)).push(o); } }
  function nachbarn(x, y, aus) { aus.length = 0;
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const z = gitter.get(schluessel(x + i * ZELLE, y + j * ZELLE)); if (z) aus.push(...z); }
    return aus; }
  ```
  Die Arrays bleiben erhalten (`length = 0`), damit keine neuen Objekte entstehen.
- Gegner, die sich nicht überlappen sollen: sanft auseinanderschieben (Trennkraft zu Nachbarn), nicht hart.

## Bewegung
- Geschwindigkeit in Einheiten pro Sekunde, mal `dt`.
- Schräg nicht schneller: Richtung normalisieren (`l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; }`).
- Weiche Beschleunigung statt sofortigem Start: `v += (ziel - v) * (1 - Math.exp(-traegheit * dt))`.
- Gegner zum Spieler: Richtung = Spieler − Gegner, normalisieren, mal Tempo. Etwas Zufall gegen Klumpen.
