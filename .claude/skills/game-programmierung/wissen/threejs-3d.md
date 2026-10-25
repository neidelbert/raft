# 3D mit Three.js (0.170.0)

## Laden
```html
<script type="importmap">{ "imports": {
  "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
  "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"
} }</script>
```
Zusatzmodule: `import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';`
Die Version ist fest. Ein Wechsel ist eine Technik-Entscheidung. Im Test leitet die Test-Hilfe (`test-hilfe.js`) das CDN auf eine lokale Kopie um; im Spiel bleibt die CDN-Adresse.

## Renderer und Schleife
- `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))` und bei `resize` `renderer.setSize(innerWidth, innerHeight)`, `kamera.aspect` neu, `updateProjectionMatrix()`.
- Hauptschleife mit `bausteine/schleife.js` wie in 2D; in `zeichne()` steht `renderer.render(szene, kamera)`. (Mit `renderer.setAnimationLoop` gilt dieselbe Regel: `dt = min(max(0, jetzt − letzte), 0,1 s)`, `letzte = max(letzte, jetzt)`, Pause bei verstecktem Tab.)
- `antialias: true` ist bezahlbar, bei Ruckeln zuerst ausschalten (als Wert in `config/`).
- Keine echten Schatten (`shadowMap` aus). Unter Figuren eine dunkle, halbtransparente Kreisfläche (auf Wellen verschwindet ihr Rand stellenweise).
- Höchstens 2 Lichter: `HemisphereLight` und `DirectionalLight`. Cartoon: `MeshLambertMaterial` oder `MeshToonMaterial` mit `flatShading: true`. Nebel in Himmelsfarbe verdeckt den Rand großer Flächen.
- `webglcontextlost` abfangen (`preventDefault`), Hinweis „Bitte neu laden“ zeigen.

## Leistung
- Zeichenaufrufe (`renderer.info.render.calls`) unter 100 (Auftrag oft strenger), Dreiecke unter 100.000. `renderer.info` zeigt nur das letzte Bild: im Test in jedem Bild mitschreiben und das Höchste prüfen.
- Viele gleiche Teile: `InstancedMesh` (ein Aufruf). Bewegen sich die Instanzen, `frustumCulled = false` setzen (die Hülle fürs Wegschneiden wird nur einmal berechnet, sonst verschwinden Teile).
- Ein Modell = ein Zeichenaufruf: Grundformen mit Eckfarben (Attribut `color`, `vertexColors: true`) per `mergeGeometries` verschmelzen. Alle Teile brauchen dieselben Attribute und dürfen keinen Index haben (`toNonIndexed()` nur aufrufen, wenn `form.index` da ist, sonst Warnung; `uv` löschen, wenn es nicht gebraucht wird). Die Einzelformen danach freigeben (`dispose`).
- In der Schleife keine `new THREE.Vector3()`. Einmal oben anlegen, dann `.set()` und `.copy()`. Three.js selbst legt in Chrome etwa 3 KB pro Bild an; das ist nicht änderbar. Eigene Matrizen von Hand statt `Object3D` brachten anfangs sogar mehr: erst messen, dann optimieren.
- Wellenflächen mit `flatShading: true`: Normalen müssen nicht pro Bild neu berechnet werden. Wellen als reine Rechnung (`welleHoehe(x, z, zeit)`), die Wasser, Boot und Bojen gemeinsam nutzen.
- Große Flächen (Meer, Boden) wandern mit der Kamera mit und wirken so endlos; ihre Hülle einmal groß genug setzen.
- Entfernen: `szene.remove(o)`, dann `geometry.dispose()`, `material.dispose()` und `texture.dispose()`.

## Kamera (Vogelperspektive)
- `PerspectiveCamera` schräg von oben. Nachziehen unabhängig von der Bildrate: `anteil = 1 - Math.exp(-tempo * dt)`, Position um `(ziel − position) * anteil` verschieben, dann `lookAt(figur)`. Beim Start gleich ans Ziel setzen (kein Anflug).
- Joystick „oben“ bedeutet vom Bildschirm weg (−z): `x = eingabe.x`, `z = eingabe.y`. Die Joystick-Anzeige ist in 3D HTML (zwei Kreise), der Baustein liefert `anzeige`.
- Richtung weich drehen: kürzesten Winkel nehmen (`atan2`, Differenz in −π … π bringen), dann mit `exp` nachziehen.

## Modelle
- Low-Poly aus Grundformen (Box, Kegel, Zylinder, Kugel mit wenigen Segmenten) per Code, kräftige Farben, Maße in `config/`.
- Vom Zeichner kommen Texturen und Symbole (PNG). Texturen höchstens 1024 × 1024.
