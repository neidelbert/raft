# Bericht Stufe 9 – Assets

## Ergebnis
Mein Handbuch kann jetzt Spiele **mit fertigen Dateien** bauen: Bilder des Zeichners, Rahmen-Animationen, Sound-Dateien, Schriften und 3D-Modelle. Es gibt dafür vier Werkzeuge, zwei neue Bausteine und eine Übungsseite. **Bereit zum Testen.**

Ehrlich vorweg:
- **`node werkzeuge/pruefe-team.js` und damit `bash tests/alle-tests.sh` sind rot, aber nicht durch meine Arbeit:** `ausbildung/AUSBILDUNG.md` (Stufe 10, Punkt 4) nennt `werkzeuge/paket.js`, das erst in Stufe 10 entsteht. Die Team-Prüfung sucht diese Datei schon jetzt und schlägt fehl; die Prüfung von Stufe 8 meldet deshalb „Team-Prüfung rot“. Die Datei gehört dem Ausbilder, darum habe ich sie nicht geändert. Alles andere in `alle-tests.sh` ist grün (Bausteine, Prüfungen 1–7).
- Ob der Sound am echten iPhone klingt, ist offen (im Test-Browser wird er geladen, dekodiert und abgespielt).

**Was man auf der Übungsseite sieht** (`ausbildung/uebungen/stufe-9/index.html`): erst ein grüner Ladebildschirm mit gelbem Balken, dann „Tippen zum Starten“. Danach eine Wiese, darauf vier sich drehende Münzen und der Held des Zeichners. Daumen links: Der Held läuft nach links oder rechts (Beine bewegen sich, nach links schaut er auch nach links), loslassen: er steht. Tippen rechts: Explosion mit Knall an der Stelle. Oben rechts der Ton-Knopf mit Lautsprecher-Symbol. `modell.html` zeigt ein kleines rotes Segelboot, das sich dreht.

## Schritte, in die ich die Aufgabe zerlegt habe
1. Material lesen: Meldung des Zeichners (Tempo, Fußpunkte), Wissen zu Assets, Bausteine.
2. PNG lesen und schreiben ohne Zusatzpakete (`png.js`), damit der Atlas ohne Installation entsteht.
3. Werkzeuge einzeln bauen und testen: Atlas → Sounds → Modell → Manifest.
4. Baustein `animation.js` (reine Rechnung, ohne Browser getestet).
5. Baustein `assets.js` (Laden, Fortschritt, Zeitgrenze, Ersatz), erst mit nachgebauter Umgebung, dann im Browser; `ton.js` kann jetzt auch Sound-Dateien abspielen.
6. Übungsseite: Gerüst mit Ladebildschirm, dann Held, Münzen, Explosion, Ton-Knopf, Ersatz-Zeichnungen; `modell.html`.
7. Tests der Übung, Gegenproben, Bildschirmfotos angesehen, eigenes Code-Review, Handbuch ergänzt.

## Was gebaut wurde
**Werkzeuge** (`.claude/skills/game-programmierung/werkzeuge/`, Aufruf immer `node <werkzeug> <spielordner>`):

| Werkzeug | was es tut |
|---|---|
| `atlas.js` | packt die 22 Bilder des Zeichners in ein Atlas-Bild (248 × 1584 Pixel) mit Beschreibung: wo jedes Bild liegt, wo der Fußpunkt ist, welche Bilder eine Animation sind. Leere Ränder schneidet es ab, zwischen den Bildern 2 Pixel Abstand mit verlängertem Rand. Die Wiese bleibt ein eigenes Bild (Kachel). |
| `sounds.js` | rechnet den Knall aus einem Rezept (Brummen, das tiefer wird, plus Rauschen, das dumpfer wird) und macht daraus `.m4a` (für Safari) und `.mp3` (Ersatz). |
| `modell.js` | baut das Boot aus seiner Beschreibung (`assets/quellen/modelle/boot.js`) im unsichtbaren Browser und speichert es als `boot.glb` (69 Dreiecke). |
| `manifest.js` | schreibt die Liste aller Assets mit Version und Größen und meldet das Budget: Startpaket 0,27 MB von 2 MB, Bildspeicher 2,6 MB von 60 MB. Ist eine Grenze überschritten, meldet es „ÜBER DEM BUDGET“ und endet mit Fehler. |

Die **Version** ist ein Fingerabdruck aller Dateien: Ändert sich ein Bild oder Sound, ändert sie sich von selbst. Das Handy lädt dann die neue Datei statt einer alten aus dem Zwischenspeicher. Hochzählen vergessen geht nicht mehr.

**Bausteine:** `assets.js` (alles aus der Liste laden, Ladebalken, Zeitgrenze, Ersatz, Sounds nach dem ersten Tippen dekodieren, Schriften, Modelle) und `animation.js` (Rahmen nach Zeit, Schleife oder einmal mit „fertig“, Zeichnen um den Fußpunkt, gespiegelt). `ton.js` spielt jetzt auch Sound-Dateien, mit demselben Ton-Knopf und Mindestabstand.

**Ersatz:** Fehlt eine Datei oder antwortet der Server nicht, läuft die Seite trotzdem: Der Held, die Münzen, die Explosion und der Ton-Knopf werden dann einfach per Code gezeichnet, die Wiese wird eine grüne Fläche, der Knall bleibt still, statt des Boots steht eine rote Kiste da.

## Geänderte Dateien
- Neu im Skill: `werkzeuge/` (`atlas.js`, `sounds.js`, `modell.js`, `manifest.js`, `png.js`), `bausteine/assets.js`, `bausteine/animation.js`, Tests `bausteine/tests/assets-test.js`, `animation-test.js`, `werkzeuge-test.js`, Probe `tests/seite/teil-assets.js` mit kleinem Beispiel (`tests/seite/assets/`, Schrift als Untermenge von DejaVu Sans Bold, 11 KB).
- Geändert im Skill: `bausteine/ton.js` (Sound-Dateien), Tests `ton-test.js`, `kopf-test.js` (14 Bausteine), `gegenprobe.js` (auch Werkzeuge), `browser-hilfe.js` (Option `routen`); `SKILL.md` (Werkzeug-Tabelle, zwei Bausteine, Checkliste); Wissen: `assets.md` (Kette, Werkzeuge, Lehren dieser Stufe), `grafik-und-sound.md`, `testen.md`, `lernbuch.md`.
- Übung `ausbildung/uebungen/stufe-9/`: `index.html`, `modell.html`, `stil.css`, `js/` (main, Test-Schnittstelle, config, kern = Kopien der Bausteine, steuerung, welt, oberflaeche, modell.js), `grafik/` (Kopie der Lieferung des Zeichners), `assets/` (Quellen und erzeugte Dateien), `test.js`, `test-ersatz.js`, `test-hilfen.js`, `gegenprobe.js`, `SCHULDEN.md`, dieser Bericht.

## Testergebnis
- `node ausbildung/uebungen/stufe-9/test.js` (Ports 8890–8898): **72 Prüfungen bestanden.** Darin unter anderem:
  - Ladebildschirm steht da, bevor ein Asset geladen ist; Fortschritt 0 → 0,33 → 0,67 → 1, nie zurück; dann „start“, Tippen → „laeuft“ (das Start-Tippen löst keine Explosion aus).
  - Atlas 248 × 1584 (≤ 2048), kleinster Abstand zwischen zwei Rahmen 2 Pixel, Fußpunkte stimmen.
  - Laufen mit vollem Ausschlag: 14,0 Rahmen pro Sekunde (Meldung: Rennen 14), halber Ausschlag: etwa 12 (zwischen Gehen 10 und Rennen 14); im Stand `held-steht`; nach links gespiegelt gezeichnet (unabhängig vom Spielcode gezählt), auch im Stand danach.
  - Explosion: läuft einmal ab (0,4 s) und verschwindet, Sound wird abgespielt (zusätzlich unabhängig im Browser gezählt), höchstens 8 gleichzeitig, mit Ton aus kein Sound.
  - Sounds liegen als `.m4a` (AAC) und `.mp3` vor, werden erst nach dem Tippen dekodiert; alle Asset-Adressen tragen `?v=<version>`; `manifest.js` meldet das Budget, `assets.json` ist aktuell.
  - Atlas und Sound fehlen, Manifest fehlt, Atlas-Server antwortet nie, Manifest-Server antwortet nie: Seite läuft jedes Mal mit Ersatz (Held läuft, Explosion startet), nach höchstens 4 s; nur die Browser-Zeile „Failed to load resource“.
  - `modell.html`: Boot mit 69 Dreiecken; ohne `boot.glb` und bei hängendem Server eine Ersatz-Kiste, kein Absturz.
  - Tab versteckt: Held steht, danach kein Sprung, Daumen gelöst. Keine Konsolenfehler mit und ohne `?test=1`.
- `node .claude/skills/game-programmierung/bausteine/tests/alle.js`: **16 Tests, 377 Prüfungen bestanden.**
- **Gegenproben:** `bausteine/tests/gegenprobe.js`: **38 von 38** absichtlich eingebauten Fehlern werden erkannt (18 neue für Assets, Animation, Ton und Werkzeuge, z. B. „Atlas ohne Randverlängerung“, „Version ändert sich nicht“, „keine Zeitgrenze“). `ausbildung/uebungen/stufe-9/gegenprobe.js`: **11 von 11** (z. B. „Blick links nicht gespiegelt“, „Explosion verschwindet nie“, „Fortschritt läuft rückwärts“, „keine Ersatz-Box“).
- Bildschirmfotos angesehen (Laden, Start, Laufen, Explosionen, Ersatz-Zeichnungen, Boot): sehen aus wie gewollt.
- Nicht automatisch prüfbar: Klang und Lautstärke am iPhone, AAC-Dekodieren in Safari, Stummschalter, Bildrate am Gerät.

## Was beim Bauen auffiel
1. Mein erster Tempo-Test zeigte 12,4 statt 14 Rahmen pro Sekunde. Der Fehler lag im Test: Ein langsames Bild im Test-Browser springt zwei Rahmen weiter, ich hatte aber nur Wechsel gezählt. Jetzt werden Schritte gezählt, über 2,5 s (Lernbuch).
2. Manifest und Assets laden nacheinander, ihre Zeitgrenzen addieren sich. Damit die Seite spätestens nach 10 s läuft, ist die Zeitgrenze 4 s statt der 8 s aus dem Wissen (dort korrigiert).
3. Ohne Manifest gab es kein Wiesenbild, das Zeichnen wäre abgestürzt. Vor dem Test beim Lesen des eigenen Codes gefunden; jetzt grüne Fläche, und „Manifest fehlt“ ist ein eigener Testfall.
4. In zwei Gegenproben stürzte der Baustein-Test ab bzw. hing, statt rot zu melden. Beide Tests verbessert (begrenzte Wartezeit, Absturz wird als rote Prüfung gemeldet).
5. Im Wissen stand „Sounds auf −14 dB Spitze“. Das ist sehr leise und meint die Lautheit; das Werkzeug normalisiert auf −1 dB Spitze, die Lautstärke im Spiel regelt `laut` im Manifest (im Wissen erklärt).
6. Beim Holen eines Hilfsprogramms für die Test-Schrift landete eine Paketdatei im Projektordner. Sofort gelöscht; Regel ins Lernbuch.

## Startwerte für Lukas zum Testen
| Name | Wert | Datei | Bedeutung |
|---|---|---|---|
| `HELD.tempo` | 170 | `js/config/held.js` | Punkte pro Sekunde bei vollem Daumen-Ausschlag |
| `HELD.bpsGehen` / `bpsRennen` | 10 / 14 | `js/config/held.js` | Tempo der Beine (aus der Meldung des Zeichners) |
| `HELD.skala` | 0,5 | `js/config/held.js` | Held 128 Punkte hoch |
| `MUENZEN.skala` | 0,4 | `js/config/gegenstaende.js` | Münzen 51 Punkte groß |
| `EXPLOSION.skala` | 0,75 | `js/config/gegenstaende.js` | Explosion 96 Punkte groß |
| `LADEN.zeitgrenze` | 4000 ms | `js/config/spiel.js` | so lange wird auf eine Datei gewartet |
| `laut` (explosion) | 0,8 | `assets/quellen/manifest.json` | Lautstärke des Knalls |
| Explosions-Rezept | 0,7 s, 140 → 38 Hz, 75 % Rauschen | `assets/quellen/sounds.json` | Klang des Knalls |

## Was der Tester am echten iPhone prüfen soll
1. Ladebalken kurz sichtbar, dann „Tippen zum Starten“; nach dem Tippen ist der Knall beim Tippen rechts zu hören (Stummschalter aus!).
2. Ton-Knopf: Symbol wechselt, Knall verstummt und kommt wieder.
3. Held läuft flüssig, Beine im richtigen Tempo, schaut beim Laufen nach links wirklich nach links; kein Ruckeln beim Umschalten Stehen ↔ Laufen.
4. Viele schnelle Tipps rechts: höchstens 8 Explosionen, kein Ruckeln.
5. `modell.html`: Boot dreht sich ruhig, scharf.
6. Bei schlechtem Netz (z. B. im Zug): Ladebalken läuft weiter, spätestens nach 8 s geht es mit Ersatz-Zeichnungen weiter.

## Fragen an Lukas
1. Am Bildschirmrand läuft der Held „auf der Stelle“, solange der Daumen drückt. Soll er dort stehen bleiben?
2. Soll die Ton-Einstellung gespeichert werden?
3. Sollen Spiele trotz Stummschalter am iPhone klingen (`navigator.audioSession`)? Das Wissen sagt: nur nach Rückfrage.
4. Atlas kleiner machen mit verlustbehafteter Kompression (pngquant, etwa halbe Größe)? Das wäre ein neues Werkzeug auf dem Rechner, nicht im Spiel.
