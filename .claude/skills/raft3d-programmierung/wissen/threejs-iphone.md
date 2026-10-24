# Wissen: Three.js auf dem iPhone (Safari)

Gilt für Three.js 0.170.0 und iPhone ab etwa iPhone 11 (Safari 16.4+). Lies das vor jedem Paket mit Grafik oder Bedienung.

## Laden
- Import-Map in `spiel/index.html`. Zusatzmodule (Addons) brauchen einen zweiten Eintrag:
  ```html
  <script type="importmap">{ "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"
  } }</script>
  ```
  Dann `import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';`
- Import-Maps gibt es in Safari erst ab 16.4. Ältere iPhones zeigen sonst nur einen leeren Bildschirm.
- Die Version steht fest im Code (`@0.170.0`). Ein Wechsel ist eine Technik-Entscheidung für Lukas.

## Renderer
- `renderer.setPixelRatio(Math.min(devicePixelRatio, LEISTUNG.pixelRatioMax))`. iPhones haben 3, das kostet etwa doppelt so viel Rechenzeit wie 2.
- `antialias: true` ist bei Pixel-Ratio 2 bezahlbar. Ruckelt es, schalte es zuerst ab.
- Keine echten Schatten (`shadowMap.enabled = false`). Unter Figur und Hai liegt stattdessen eine dunkle, halbtransparente Kreisfläche.
- Höchstens 2 Lichter: `HemisphereLight` (Himmel/Wasser) und ein `DirectionalLight`. Für den Cartoon-Stil reichen `MeshLambertMaterial` oder `MeshToonMaterial`. `MeshStandardMaterial` kostet mehr.
- `renderer.setAnimationLoop(fn)` statt eigenem `requestAnimationFrame`.
- Größe: Lies `window.innerWidth/innerHeight` beim Ereignis `resize`. Höhe in CSS mit `100dvh` statt `100vh`, sonst verdeckt Safaris Leiste den unteren Rand.

## Leistung
- Delta-Zeit: `const dt = Math.min(uhr.getDelta(), LEISTUNG.deltaMax)`. Jede Bewegung wird mit `dt` gerechnet.
- In der Hauptschleife nichts neu erzeugen (`new THREE.Vector3()` nur einmal oben in der Datei, dann `.set()` und `.copy()`). Sonst ruckelt das Spiel, weil Safari regelmäßig aufräumt.
- Viele gleiche Teile (Floßplatten, Treibgut) als `InstancedMesh` mit einem Zeichenaufruf. Unbewegliche Teile mit `mergeGeometries` zusammenfassen.
- Zu viele Zeichenaufrufe kosten mehr als zu viele Dreiecke. Grenze: 100 pro Bild (`renderer.info.render.calls`).
- Wasser: Eine große Fläche, die mit der Kamera mitwandert (sieht aus wie ein endloses Meer). Wellen werden auf dem Prozessor bei etwa 2.500 Punkten berechnet, was in Ordnung ist. Bei mehr Punkten im Shader rechnen (`onBeforeCompile`), das ist eine Technik-Frage.
- Wellenfläche mit `flatShading: true` im Material: Normalen müssen dann nicht pro Bild neu berechnet werden (Paket 01, spart Rechenzeit).
- Objekte wiederverwenden (Pool): Treibgut, das hinten verschwindet, kommt vorne wieder hinein, statt neu erzeugt zu werden.
- Entfernen heißt: `szene.remove(obj)`, dann `geometry.dispose()`, `material.dispose()` und `texture.dispose()`. Gemeinsam genutzte Geometrien und Materialien nur einmal entfernen.

## Touch und Bedienung
- Pointer-Events (`pointerdown/move/up/cancel`) decken Touch und Maus ab. Merke dir die `pointerId` jedes Fingers.
- `element.setPointerCapture(id)` beim Herunterdrücken, damit das Ziehen auch außerhalb des Knopfs weiterläuft.
- **Beim Loslassen und bei `pointercancel` immer alle Werte zurücksetzen** (x und y). Das war der Joystick-Fehler im Rollentest, siehe `lernbuch.md`.
- CSS: `touch-action: none` auf Spielfläche und Knöpfen, `user-select: none`, `-webkit-user-select: none`, `-webkit-touch-callout: none`. Sonst scrollt, zoomt oder markiert Safari.
- Viewport-Meta: `width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover`. Abstände zum Rand mit `env(safe-area-inset-*)` (Notch, Home-Balken).
- Tippflächen mindestens 48 × 48 Punkte. Joystick links unten, Aktionsknöpfe rechts unten (entschieden).
- Mehrere Finger gleichzeitig: Der Joystick nimmt nur seinen ersten Finger, die Aktionsknöpfe arbeiten unabhängig davon.
- Kein Hover, keine Doppeltipps und kein langes Drücken als einzige Bedienung.

## Safari-Eigenheiten
- **Sound** spielt erst nach der ersten Berührung. Beim ersten `pointerdown` einen `AudioContext` anlegen bzw. mit `resume()` wecken.
- **Tab-Wechsel**: Bei `visibilitychange` (`document.hidden`) die Spielzeit anhalten und den Spielstand speichern. Danach `uhr.getDelta()` einmal verwerfen.
- **WebGL-Verlust**: Safari kann den Grafikkontext wegnehmen (`webglcontextlost`). Speichere dann und zeige den Hinweis „Bitte neu laden“.
- **Speicher**: `localStorage` immer in `try/catch` verwenden (privater Modus, voller Speicher). Höchstens etwa 5 MB, unser Budget ist 1 MB.
- Speichere beim Ereignis `pagehide`, nicht bei `beforeunload`. Safari löst `beforeunload` auf dem iPhone oft nicht aus.
- Arbeitsspeicher über etwa 150 MB: Safari lädt die Seite ohne Warnung neu. Deshalb Texturen klein halten und vieles per Code statt aus Dateien erzeugen.
- `navigator.vibrate` gibt es auf dem iPhone nicht. Nicht verwenden.

## Kamera (Vogelperspektive, entschieden)
- `PerspectiveCamera` schräg von oben, Abstand und Höhe aus der Konfiguration. Folgt der Figur weich: `kamera.position.lerp(ziel, 1 - Math.exp(-tempo * dt))`. Das hängt nicht von der Bildrate ab.
- Joystick-Richtung „oben“ bedeutet vom Bildschirm weg (−z), passend zur Kamera.
