# iPhone und Safari

## Bildschirm (`bausteine/bildschirm.js`)
- Canvas scharf: interne Größe = CSS-Größe × Pixel-Ratio, **höchstens 2** (iPhones haben 3, × 3 kostet viel und sieht kaum besser aus). Danach in CSS-Punkten zeichnen. Der Baustein liest die Größe vom Canvas selbst (`getBoundingClientRect`) und passt bei `resize` an (Drehen, Safari-Leiste).
- Höhe `100dvh` statt `100vh`. Ränder mit `env(safe-area-inset-top/bottom/left/right)` (Notch, Home-Balken).
- Hochformat oder Querformat: im Auftrag festgelegt. Ist das Handy falsch herum, Hinweis „Bitte drehen“ statt kaputtem Bild.
- Nach einer Größenänderung Figuren ins Bild zurückholen (`beiGroesse`), sonst stehen sie nach dem Drehen draußen.

## Touch
- Pointer-Events (`pointerdown/move/up/cancel`) für Touch und Maus. Jeder Finger hat eine `pointerId`.
- `element.setPointerCapture(e.pointerId)` beim Aufsetzen (in `try`), damit Ziehen außerhalb weiterläuft.
- **Loslassen, `pointercancel` und `lostpointercapture` setzen alle Werte zurück** (x und y, aktiv = false). Safari schickt `pointercancel`, wenn eine Systemgeste dazwischenkommt. Zusätzlich lösen: beim Verstecken des Tabs und beim Wechsel in „ende“ (`joystick.loese()`), denn ein liegender Finger kommt dann nie hoch.
- `touch-action: none` auf allem, was man berührt, sonst scrollt oder zoomt Safari. `e.preventDefault()` in `pointerdown`.
- Safari zoomt trotz `user-scalable=no` mit zwei Fingern: `gesturestart` und `gesturechange` mit `preventDefault` abfangen.
- Tippflächen mindestens 48 × 48 Punkte, Abstand zum Rand mindestens 16 Punkte plus Safe-Area.
- Mehrere Finger: Der Joystick nimmt nur seinen ersten Finger. Knöpfe arbeiten unabhängig davon (eigene `pointerId`).
- Kein Hover, kein Rechtsklick, kein Doppeltipp als einzige Bedienung. Langes Drücken nur mit sichtbarer Anzeige.

## Joystick und Knöpfe (`bausteine/joystick.js`, `bausteine/knopf.js`)
- Schwebender Joystick: erscheint, wo der Daumen im Feld (meist linke Hälfte) aufsetzt. `eingabe = { x, y, aktiv }`, Länge höchstens 1 (schräg nicht schneller), Totzone gegen Zittern. y ist nach unten positiv; in 3D ist „oben“ −z.
- Knöpfe lösen bei `pointerdown` aus (nicht bei `click`, das käme erst beim Loslassen). Für Tastatur und `element.click()` zusätzlich `click` mit `e.detail === 0` auswerten, so gibt es keinen Doppelauslöser.

## Safari-Eigenheiten
- **Ton** erst nach der ersten Berührung (`bausteine/ton.js`): AudioContext bei `pointerdown`, `touchend` oder `keydown` anlegen; je nach iOS-Version zählt erst `touchend`. Nach Anruf oder App-Wechsel hält Safari ihn an: bei jeder Berührung `resume()`. Der Stummschalter am iPhone schaltet WebAudio stumm.
- **Speichern** bei `visibilitychange` (versteckt) und `pagehide`. `beforeunload` kommt auf dem iPhone oft nicht.
- **localStorage:** schon der Zugriff auf `window.localStorage` kann werfen (gesperrte Website-Daten), `getItem`, `setItem` und `JSON.parse` sowieso (privater Modus, voll). Alles in `try/catch` (`bausteine/speicher.js`), auch nie ungeschützt ganz oben in einem Modul: Sonst startet gar nichts. Grenze etwa 5 MB, eigenes Budget unter 1 MB.
- **Arbeitsspeicher** über etwa 150 MB: Safari lädt die Seite ohne Warnung neu. Bilder klein halten, keine riesigen Arrays.
- **Import-Maps** erst ab Safari 16.4. `structuredClone` ab 15.4. `navigator.vibrate` gibt es nicht.
- **Vollbild-API** gibt es auf dem iPhone nicht. „Zum Home-Bildschirm“ plus `apple-mobile-web-app-capable` ergibt fast Vollbild.
- **WebGL-Verlust** (3D): `webglcontextlost` abfangen (`preventDefault`), speichern, „Bitte neu laden“ zeigen.
- **Schriften:** Systemschrift (`-apple-system`). Eigene Schriften kosten Ladezeit.
- `performance.now()` ist in Safari nur auf etwa 1 ms genau: Zeiten pro Schritt gleitend mitteln.

## Leistung (Zielgerät iPhone ab etwa iPhone 11)
- 60 Bilder pro Sekunde anstreben, nie unter 30.
- In der Hauptschleife keine neuen Objekte, Arrays oder Strings bauen (`map`, `filter`, Spread `...`, Template-Strings pro Gegner pro Bild vermeiden). Wiederverwenden.
- `Math.sqrt(x*x + y*y)` statt `Math.hypot` in heißen Schleifen (`hypot` legt in Chrome bei jedem Aufruf Speicher an).
- Viele gleiche Dinge als feste Float64Arrays (`bausteine/pool.js`): Kommazahlen in Objekt-Feldern packt V8 je nach Lage ein (bis 7 KB pro Schritt bei 240 Gegnern gemessen), in Float64Arrays nie.
- Zeichen-Koordinaten vieler Objekte auf ganze Punkte runden (`Math.round`): Kommazahlen an Canvas-Befehle kosten in Chrome Speicher.
- Bis etwa 240 Gegner gleichzeitig: Gitter für die Kollision (`bausteine/gitter.js`), Pool, nur Sichtbares zeichnen.
- Schwere Arbeit einmal vorab erledigen: Bilder vorbereiten (Ersatz, eingefärbte Kopie), Formen vorrechnen, Text-Breiten zwischenspeichern.
- **Speicher richtig messen:** erst nach einigen Sekunden Aufwärmen. Funktionen, die nur einmal pro Bild laufen, bleiben in Chrome lange im Interpreter und legen dort für jede Kommazahl 16 Byte an; das verschwindet von selbst und ist kein Leck (Safari packt Zahlen nie ein). Gegen 0 prüfen nur die Teile, die mit der Zahl der Objekte wachsen. Erst messen, dann optimieren.
