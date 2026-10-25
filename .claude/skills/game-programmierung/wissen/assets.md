# Assets: Bilder, Animationen, Sounds, Schriften, 3D-Modelle

Assets sind alle Dateien, die ein Spiel lädt. Ziel: schneller Start, nichts fehlt ohne Ersatz, alles scharf und leise genug für das iPhone.

## Die Kette in Kürze
```
grafik/ (Zeichner) ─┐
assets/quellen/     ├─ Werkzeuge ─→ assets/atlas, bilder, sounds, modelle ─→ manifest.js ─→ assets/assets.json
  atlas.json        │  atlas.js, sounds.js, modell.js                         (Version, Größen, Budget)
  sounds.json       │
  modelle/<name>.js ┘
Spiel: ladeAssets (bausteine/assets.js) → Ladebalken → „Tippen zum Starten“ (weckt Ton, dekodiert Sounds)
       → animation.js zeichnet Rahmen aus dem Atlas, ton.spiele spielt Sound-Puffer
```
Werkzeuge: `node .claude/skills/game-programmierung/werkzeuge/<werkzeug>.js spiele/<name>`, Reihenfolge atlas → sounds → modell → manifest. Nach jeder Änderung an Quellen oder Bildern neu erzeugen und die erzeugten Dateien mit einchecken (GitHub Pages hat keinen Build-Schritt). Vorbild: `ausbildung/uebungen/stufe-9/`.

## Grundsätze
- **Ein Verzeichnis, eine Liste:** Alle Assets stehen in `assets/assets.json` (Manifest). Das Spiel lädt nur, was dort steht. Kein Pfad wird im Code fest eingetragen.
- **Quellen getrennt von Auslieferung:** Quellen (SVG des Zeichners, Sound-Rezepte, Modell-Code) liegen in `assets/quellen/`. Ausgeliefert werden nur die erzeugten Dateien. Erzeugt wird mit einem Werkzeug, nie von Hand.
- **Budget:** Startpaket (alles, was vor dem ersten Bild nötig ist) unter 2 MB. Was erst später gebraucht wird (Level 2, Musik), lädt nach dem Start im Hintergrund.
- **Jedes Asset hat einen Ersatz:** Fehlt eine Datei oder lädt sie nicht innerhalb der Zeitgrenze, läuft das Spiel mit Ersatz (Form, Stille, Systemschrift, Box) weiter. Dazu eine Warnung in der Konsole, kein Fehler, der das Spiel stoppt.

## Manifest (`assets/assets.json`)
Geschrieben von `manifest.js` (nie von Hand), Vorgaben (Ersatzfarben, Lautstärke, Budget, `spaeter`) in `assets/quellen/manifest.json`:
```json
{
  "version": "9e56676ca2",
  "atlanten": [{ "name": "figuren", "bild": "atlas/figuren.png", "daten": "atlas/figuren.json" }],
  "bilder":   [{ "name": "himmel", "datei": "bilder/himmel.webp", "ersatz": "#1b1640" }],
  "sounds":   [{ "name": "sprung", "dateien": ["sounds/sprung.m4a", "sounds/sprung.mp3"], "laut": 0.6 }],
  "schriften":[{ "name": "Titel", "datei": "schriften/titel.woff2" }],
  "modelle":  [{ "name": "boot", "datei": "modelle/boot.glb" }],
  "spaeter":  ["musik"]
}
```
- `version` ist ein Fingerabdruck aller Dateien: Ändert sich ein Asset, ändert sie sich von selbst (Hochzählen kann man so nicht vergessen). Sie hängt als `?v=<version>` an jeder Adresse, damit Safari keine alte Datei aus dem Zwischenspeicher nimmt. `assets.json` selbst wird ohne `?v` und mit `cache: 'no-cache'` geholt: Sie ist der Einstieg und muss immer frisch sein.
- Zu jedem Eintrag schreibt `manifest.js` `bytes` (Bilder auch `breite`, `hoehe`) und oben `budget` (Startpaket, Bildspeicher, Grenzen).
- Einträge unter `spaeter` lädt das Spiel erst nach dem Start (`assets.ladeSpaeter()`).

## Ladebildschirm
- Er erscheint sofort (reines HTML/CSS, ohne Assets) und zeigt einen Balken: geladene Einträge / alle Einträge des Startpakets.
- Jedes Asset hat eine Zeitgrenze. Danach kommt der Ersatz, und der Balken läuft weiter. Ein hängender Server darf das Spiel nie blockieren. Achtung: Manifest und Assets laden nacheinander, die Zeit addiert sich. Soll die Seite spätestens nach 10 s laufen, ist die Zeitgrenze höchstens 4 s (Manifest 4 s + Asset 4 s). Hängende Anfragen werden abgebrochen (`AbortController`), sie laden nicht im Hintergrund weiter.
- `window.spiel.bereit` ist schon während des Ladens wahr (die Seite läuft), der Zustand heißt dann `laden`.
- Bilder vor dem ersten Zeichnen dekodieren (`await bild.decode()`). Sonst ruckelt das erste Bild.
- Ton kann erst nach der ersten Berührung starten. Der Ladebildschirm endet darum mit „Tippen zum Starten“. Dieses Tippen weckt den Ton.

## Bilder
- Format: **PNG** für scharfe Kanten und Transparenz (Figuren, Symbole), **WebP** für große Bilder (Hintergründe, deutlich kleiner). Safari kann WebP ab iOS 14.
- Doppelte Größe gegenüber der Anzeige (Pixel-Ratio 2). Größer bringt nichts und kostet Speicher.
- **Speicher zählt ausgepackt:** Ein Bild belegt Breite × Höhe × 4 Byte, egal wie klein die Datei ist. 2048 × 2048 sind 16 MB. Summe aller Bilder unter etwa 60 MB halten.
- Canvas- und Bildgrenze in Safari: höchstens 4096 × 4096 Pixel pro Bild. Atlanten 2048 × 2048 nicht überschreiten.

## Sprite-Atlas
Viele kleine Bilder in einem großen Bild: eine Datei statt vieler Anfragen, beim Zeichnen nur ein Bild.
```json
{ "bild": "figuren.png", "breite": 1024, "hoehe": 512,
  "rahmen": { "held-lauf-1": { "x": 2, "y": 2, "b": 128, "h": 160, "ankerX": 64, "ankerY": 154 } },
  "animationen": { "held-lauf": { "rahmen": ["held-lauf-1", "held-lauf-2"], "bps": 10, "schleife": true } } }
```
- Zeichnen: `ctx.drawImage(atlas, r.x, r.y, r.b, r.h, x - r.ankerX * s, y - r.ankerY * s, r.b * s, r.h * s)`.
- **Abstand und Randverlängerung:** Zwischen den Rahmen 2 px Abstand, und die Randpixel nach außen kopieren (Extrude). Sonst blitzen beim Skalieren Nachbarbilder an den Kanten durch.
- **Anker** (Fußpunkt) pro Rahmen, damit eine Animation nicht wackelt, wenn die Rahmen unterschiedlich groß zugeschnitten sind.
- Packen: Rahmen nach Höhe sortieren, zeilenweise einsetzen (Shelf-Packing). Für Spiel-Atlanten reicht das.
- `atlas.js` schneidet durchsichtige Ränder ab (der Held des Zeichners: 213 × 256 → 122 × 233 Pixel) und verschiebt den Anker mit. Darum muss jedes Bild einer Animation denselben Ankerpunkt im Originalbild haben (Meldung des Zeichners, `anker` in `assets/quellen/atlas.json`).
- Boden-Kacheln und große Hintergründe kommen nicht in den Atlas (`einzeln`): Man kachelt sie mit `drawImage` in einer Schleife, das geht nur mit einem eigenen Bild.
- Rahmen-Namen sind im Atlas ohne Gruppe (`figuren/held-lauf-1` → `held-lauf-1`), sie müssen darum über alle Gruppen eines Atlas eindeutig sein.

## Animation
- Spritesheet-Animation: Rahmenliste plus Tempo in Bildern pro Sekunde (`bps`). Die aktuelle Zeit kommt aus der Delta-Zeit, nie aus der Zahl gezeichneter Bilder:
  `zeit += dt; index = Math.floor(zeit * bps) % rahmen.length` (bei `schleife: false` beim letzten Rahmen anhalten und „fertig“ melden).
- Mehrere Figuren mit derselben Animation teilen sich die Daten, nur `zeit` ist pro Figur (`erstelleAbspieler`).
- Wechselndes Tempo (Gehen 10, Rennen 14 Bilder/s) mit einem Faktor: `aktualisiereAnimation(abspieler, dt, bpsJetzt / animation.bps)`. Eine andere Animation (Stehen ↔ Laufen) beginnt von vorn, dieselbe läuft weiter.
- Ein einzelnes Bild (`held-steht`) ist eine Animation mit einem Rahmen: `holeAnimation(assets, 'held-steht')`.
- Spiegeln (Blick nach links) um den Fußpunkt: `translate(x, y)`, `scale(-1, 1)`, dann um den Anker zeichnen (`zeichneRahmen(…, blick)`).
- Einmalige Animationen (Explosion): `aktualisiereAnimation` gibt genau einmal `true` zurück, dann den Platz im festen Vorrat freigeben.
- Testen: Rahmenschritte zählen (`(neu − alt) mod Rahmenzahl`), nicht nur Wechsel. Ein langsames Bild im Test-Browser überspringt sonst einen Rahmen, und das Tempo wirkt zu klein.
- Einzelbild plus Bewegung per Code (wippen, quetschen, `spielgefuehl.md`) ist oft genug. Echte Rahmen-Animation nur dort, wo es den Unterschied macht (Laufen, Explosion).

## Sounds
- Formate: **AAC in `.m4a`** zuerst (klein, Safari), **MP3** als Ersatz. Safari spielt kein älteres Ogg. Im Manifest beide angeben, das Spiel nimmt das erste, das `audio.canPlayType` mit „probably“ oder „maybe“ beantwortet.
- Laden: `fetch` → `arrayBuffer` → `audioContext.decodeAudioData(daten)` (Promise-Form geht ab Safari 14.1, `bausteine/assets.js` deckt auch die alte Form mit Rückruf ab). Dekodierte Puffer abspielen über `AudioBufferSourceNode`, sehr schnell und beliebig oft gleichzeitig.
- Reihenfolge im Spiel: Bytes beim Laden holen, nach „Tippen zum Starten“ `ton.wecke()`, dann `dekodiereSounds(assets, ton.audio)` und `ton.setzePuffer(name, puffer, laut)`. Abgespielt wird mit `ton.spiele(name)`: ein Ort für Ton an/aus und Mindestabstand. Fehlt die Datei, ist es still (`ersetzt`); gibt es für denselben Namen einen Klang in `klaenge`, spielt der als Ersatz.
- Fehlt die `.m4a`, nimmt `assets.js` die nächste abspielbare Datei (`.mp3`). Das Test-Chromium von Playwright spielt AAC (`canPlayType` „probably“), dort wird also auch die `.m4a` geprüft.
- Kurze Effekte (unter 2 s) als Puffer, lange Musik als `<audio>`-Element per `createMediaElementSource` (sonst wird zu viel Speicher dekodiert).
- **Stummschalter am iPhone:** WebAudio ist bei eingeschaltetem Stummschalter still. Ab Safari 16.4 lässt sich das mit `navigator.audioSession.type = 'playback'` ändern. Nur nach Rückfrage an Lukas, ob Spiele trotz Stummschalter klingen sollen (Spielgefühl).
- Erzeugen: Sound-Effekte lassen sich per Code als WAV berechnen (Sinus, Rauschen, Hüllkurve) und mit `ffmpeg` zu `.m4a`/`.mp3` umwandeln:
  `ffmpeg -y -i ein.wav -c:a aac -b:a 96k aus.m4a` und `ffmpeg -y -i ein.wav -c:a libmp3lame -b:a 96k aus.mp3`.
- Lautstärke: `sounds.js` normalisiert die Spitze auf −1 dB (Platz für die AAC-Umwandlung, kein Übersteuern). Wie laut ein Effekt im Spiel ist, regelt `laut` im Manifest (0 … 1) und die Gesamtlautstärke in `config/`. (Früher stand hier „−14 dB Spitze“: Das ist sehr leise und meint eigentlich die Lautheit, nicht die Spitze.)
- Rezept (`assets/quellen/sounds.json`): `dauer`, `welle` (sinus, rechteck, saege, dreieck, rauschen), `frequenz` [Anfang, Ende], `rauschen` (Anteil), `tiefpass` [Anfang, Ende], `huelle` { anschlag, halten, kurve }. Explosion: Sinus 140 → 38 Hz mit 75 % Rauschen, Tiefpass 5000 → 250 Hz, 0,7 s. Rauschen hat einen festen Startwert: Gleiches Rezept gibt dieselbe Datei (die Version bleibt gleich).

## Schriften
- Standard ist die Systemschrift (`-apple-system`): kein Laden, gut lesbar.
- Eigene Schrift nur als `woff2` und nur mit den nötigen Zeichen (Deutsch: A–Z, a–z, 0–9, ÄÖÜäöüß, Satzzeichen, „ “).
- Im Canvas: vor dem ersten Zeichnen laden (`new FontFace(name, 'url(...)')`, `await schrift.load()`, `document.fonts.add(schrift)`). Sonst zeichnet der Canvas mit der Ersatzschrift und wechselt nie. `bausteine/assets.js` macht das für jeden Eintrag unter `schriften`; danach `ctx.font = '28px Titel, sans-serif'` (Systemschrift als Ersatz).
- Untermenge erzeugen (einmalig, auf dem Rechner): `pyftsubset schrift.ttf --text="…" --flavor=woff2` (Python-Paket fonttools mit brotli). Das ist ein Werkzeug außerhalb des Spiels, kein Paket im Spiel.

## 3D-Modelle
- Format **glTF binär (`.glb`)**, geladen mit `GLTFLoader` (`three/addons/loaders/GLTFLoader.js`). Kein DRACO (braucht einen Decoder und lädt mehr Code).
- Low-Poly per Code bauen und als `.glb` exportieren (`GLTFExporter`, `binary: true`). So bleiben die Modelle Quellen, die man ändern kann. `modell.js` macht daraus die Datei: Quelle `assets/quellen/modelle/<name>.js` mit `export default function baue(THREE) { …; return gruppe; }` (ohne eigene Importe, das Werkzeug übergibt THREE).
- Laden mit dem Baustein: `ladeAssets(adresse, { arten: ['modelle'], ladeModell: (a) => new GLTFLoader().loadAsync(a) })`; `assets.modelle.boot` ist das glTF-Ergebnis (`.scene`) oder `null` (dann die Box).
- `flatShading` geht beim Export verloren (glTF kennt es nicht): nach dem Laden das Material setzen, wenn kantige Flächen gewollt sind.
- Nach dem Laden: Materialien des Spiels zuweisen, Geometrien teilen. Gleiche Modelle mehrfach: `InstancedMesh` mit der Geometrie aus dem Modell.
- Ersatz, wenn ein Modell fehlt: farbige Box in der Größe aus `config/`.

## Offline und Zwischenspeicher (später, nach Rückfrage)
- Auf GitHub Pages (HTTPS) kann ein Service Worker alle Assets speichern. Dann startet das Spiel ohne Netz, auch vom Home-Bildschirm.
- Name des Speichers mit der Asset-`version`. Bei neuer Version wird der alte Speicher gelöscht.
- Das ist eine Technik-Entscheidung für Lukas, weil falsch gespeicherte Dateien schwer zu löschen sind.

## Prüfen
- Test: Ladebildschirm erscheint, Fortschritt steigt bis 100 %, `window.spiel.assets` meldet geladen, ersetzt und fehlend. Verzögerte Antworten (Option `routen` von `werkzeuge/test-hilfe.js`, `route.continue()` nach einer Wartezeit) machen den Balken im Test sichtbar.
- `fehlend`: Einträge, deren Datei nicht kam (404, Netz, Zeitgrenze, kaputt). `ersetzt`: Namen, für die jetzt ein Ersatz gilt (Bild → Ersatzfarbe, Sound → Stille, Schrift → Systemschrift, Modell → Box, bei Atlanten die einzelnen Rahmen-Namen aus `ersatz()`).
- Gegenprobe: eine Datei löschen (`route.fulfill({ status: 404 })`), eine Datei hängen lassen (`kontext.route(muster, () => {})`: Server antwortet nie), das Manifest löschen und hängen lassen. Das Spiel startet trotzdem, mit Ersatz.
- Budget messen: Summe der Dateigrößen des Startpakets und ausgepackter Bildspeicher (Breite × Höhe × 4).
