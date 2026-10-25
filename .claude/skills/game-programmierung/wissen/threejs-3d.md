# 3D mit Three.js (0.170.0)

## Laden
```html
<script type="importmap">{ "imports": {
  "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
  "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"
} }</script>
```
Zusatzmodule: `import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';`
Die Version ist fest. Ein Wechsel ist eine Technik-Entscheidung.

## Renderer
- `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))`. `antialias: true` ist bezahlbar, bei Ruckeln zuerst ausschalten.
- `renderer.setAnimationLoop(bild)`, Delta-Zeit über `THREE.Clock`, gedeckelt auf 0,1 s.
- Keine echten Schatten (`shadowMap` aus). Unter Figuren eine dunkle, halbtransparente Kreisfläche.
- Höchstens 2 Lichter: `HemisphereLight` und `DirectionalLight`. Cartoon: `MeshToonMaterial` oder `MeshLambertMaterial` mit `flatShading: true`.

## Leistung
- Zeichenaufrufe (`renderer.info.render.calls`) unter 100, Dreiecke unter 100.000.
- Viele gleiche Teile: `InstancedMesh` (ein Aufruf). Unbewegliches: `mergeGeometries`.
- In der Schleife keine `new THREE.Vector3()`. Einmal oben anlegen, dann `.set()` und `.copy()`.
- Wellenflächen mit `flatShading: true`: Normalen müssen nicht pro Bild neu berechnet werden.
- Entfernen: `szene.remove(o)`, dann `geometry.dispose()`, `material.dispose()` und `texture.dispose()`.
- Große Flächen (Meer, Boden) wandern mit der Kamera mit und wirken so endlos.

## Kamera (Vogelperspektive)
- `PerspectiveCamera` schräg von oben. Nachziehen: `kamera.position.lerp(ziel, 1 - Math.exp(-tempo * dt))`, dann `lookAt(figur)`.
- Joystick „oben“ bedeutet vom Bildschirm weg (−z). 2D-Eingabe `y` (nach unten positiv) wird zu `z = y`.

## Modelle
- Low-Poly aus Grundformen (Box, Kegel, Zylinder, Kugel mit wenigen Segmenten) per Code, kräftige Farben.
- Vom Zeichner kommen Texturen und Symbole (PNG). Texturen höchstens 1024 × 1024.
