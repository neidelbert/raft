# Assets: Bilder, Animationen, Sounds, Schriften, 3D-Modelle

Assets sind alle Dateien, die ein Spiel lädt. Ziel: schneller Start, nichts fehlt ohne Ersatz, alles scharf und leise genug für das iPhone.

## Grundsätze
- **Ein Verzeichnis, eine Liste:** Alle Assets stehen in `assets/assets.json` (Manifest). Das Spiel lädt nur, was dort steht. Kein Pfad wird im Code fest eingetragen.
- **Quellen getrennt von Auslieferung:** Quellen (SVG des Zeichners, Sound-Rezepte, Modell-Code) liegen in `assets/quellen/`. Ausgeliefert werden nur die erzeugten Dateien. Erzeugt wird mit einem Werkzeug, nie von Hand.
- **Budget:** Startpaket (alles, was vor dem ersten Bild nötig ist) unter 2 MB. Was erst später gebraucht wird (Level 2, Musik), lädt nach dem Start im Hintergrund.
- **Jedes Asset hat einen Ersatz:** Fehlt eine Datei oder lädt sie nicht innerhalb der Zeitgrenze, läuft das Spiel mit Ersatz (Form, Stille, Systemschrift, Box) weiter. Dazu eine Warnung in der Konsole, kein Fehler, der das Spiel stoppt.

## Manifest (`assets/assets.json`)
```json
{
  "version": "3",
  "atlanten": [{ "name": "figuren", "bild": "atlas/figuren.png", "daten": "atlas/figuren.json" }],
  "bilder":   [{ "name": "himmel", "datei": "bilder/himmel.webp", "ersatz": "#1b1640" }],
  "sounds":   [{ "name": "sprung", "dateien": ["sounds/sprung.m4a", "sounds/sprung.mp3"], "laut": 0.6 }],
  "schriften":[{ "name": "Titel", "datei": "schriften/titel.woff2" }],
  "modelle":  [{ "name": "boot", "datei": "modelle/boot.glb" }],
  "spaeter":  ["musik"]
}
```
- `version` hochzählen, wenn sich Assets ändern. Sie hängt als `?v=3` an jeder Adresse, damit Safari keine alte Datei aus dem Zwischenspeicher nimmt.
- Einträge unter `spaeter` lädt das Spiel erst nach dem Start.

## Ladebildschirm
- Er erscheint sofort (reines HTML/CSS, ohne Assets) und zeigt einen Balken: geladene Einträge / alle Einträge des Startpakets.
- Jedes Asset hat eine Zeitgrenze (z. B. 8 s). Danach kommt der Ersatz, und der Balken läuft weiter. Ein hängender Server darf das Spiel nie blockieren.
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

## Animation
- Spritesheet-Animation: Rahmenliste plus Tempo in Bildern pro Sekunde (`bps`). Die aktuelle Zeit kommt aus der Delta-Zeit, nie aus der Zahl gezeichneter Bilder:
  `zeit += dt; index = Math.floor(zeit * bps) % rahmen.length` (bei `schleife: false` beim letzten Rahmen anhalten und „fertig“ melden).
- Mehrere Figuren mit derselben Animation teilen sich die Daten, nur `zeit` ist pro Figur.
- Einzelbild plus Bewegung per Code (wippen, quetschen, `spielgefuehl.md`) ist oft genug. Echte Rahmen-Animation nur dort, wo es den Unterschied macht (Laufen, Explosion).

## Sounds
- Formate: **AAC in `.m4a`** zuerst (klein, Safari), **MP3** als Ersatz. Safari spielt kein älteres Ogg. Im Manifest beide angeben, das Spiel nimmt das erste, das `audio.canPlayType` mit „probably“ oder „maybe“ beantwortet.
- Laden: `fetch` → `arrayBuffer` → `audioContext.decodeAudioData(daten)` (Promise-Form geht ab Safari 14.1). Dekodierte Puffer abspielen über `AudioBufferSourceNode`, sehr schnell und beliebig oft gleichzeitig.
- Kurze Effekte (unter 2 s) als Puffer, lange Musik als `<audio>`-Element per `createMediaElementSource` (sonst wird zu viel Speicher dekodiert).
- **Stummschalter am iPhone:** WebAudio ist bei eingeschaltetem Stummschalter still. Ab Safari 16.4 lässt sich das mit `navigator.audioSession.type = 'playback'` ändern. Nur nach Rückfrage an Lukas, ob Spiele trotz Stummschalter klingen sollen (Spielgefühl).
- Erzeugen: Sound-Effekte lassen sich per Code als WAV berechnen (Sinus, Rauschen, Hüllkurve) und mit `ffmpeg` zu `.m4a`/`.mp3` umwandeln:
  `ffmpeg -y -i ein.wav -c:a aac -b:a 96k aus.m4a` und `ffmpeg -y -i ein.wav -c:a libmp3lame -b:a 96k aus.mp3`.
- Lautstärke: Effekte auf etwa −14 dB Spitze normalisieren, damit sie gleich laut sind.

## Schriften
- Standard ist die Systemschrift (`-apple-system`): kein Laden, gut lesbar.
- Eigene Schrift nur als `woff2` und nur mit den nötigen Zeichen (Deutsch: A–Z, a–z, 0–9, ÄÖÜäöüß, Satzzeichen, „ “).
- Im Canvas: vor dem ersten Zeichnen laden (`new FontFace(name, 'url(...)')`, `await schrift.load()`, `document.fonts.add(schrift)`). Sonst zeichnet der Canvas mit der Ersatzschrift und wechselt nie.

## 3D-Modelle
- Format **glTF binär (`.glb`)**, geladen mit `GLTFLoader` (`three/addons/loaders/GLTFLoader.js`). Kein DRACO (braucht einen Decoder und lädt mehr Code).
- Low-Poly per Code bauen und als `.glb` exportieren (`GLTFExporter`, `binary: true`). So bleiben die Modelle Quellen, die man ändern kann. Ein Werkzeug macht daraus die Datei.
- Nach dem Laden: Materialien des Spiels zuweisen, Geometrien teilen. Gleiche Modelle mehrfach: `InstancedMesh` mit der Geometrie aus dem Modell.
- Ersatz, wenn ein Modell fehlt: farbige Box in der Größe aus `config/`.

## Offline und Zwischenspeicher (später, nach Rückfrage)
- Auf GitHub Pages (HTTPS) kann ein Service Worker alle Assets speichern. Dann startet das Spiel ohne Netz, auch vom Home-Bildschirm.
- Name des Speichers mit der Asset-`version`. Bei neuer Version wird der alte Speicher gelöscht.
- Das ist eine Technik-Entscheidung für Lukas, weil falsch gespeicherte Dateien schwer zu löschen sind.

## Prüfen
- Test: Ladebildschirm erscheint, Fortschritt steigt bis 100 %, `window.spiel.assets` meldet geladen, ersetzt und fehlend.
- Gegenprobe: eine Datei löschen, eine Datei hängen lassen (Server antwortet nie). Das Spiel startet trotzdem, mit Ersatz.
- Budget messen: Summe der Dateigrößen des Startpakets und ausgepackter Bildspeicher (Breite × Höhe × 4).
