# Nachbesserung nach der Rückmeldung des Neuen (Stufe 10)

**Ergebnis:** Alle acht Schwächen aus `RUECKMELDUNG-NEULING.md` sind an der Ursache behoben, dazu die zwei Kleinigkeiten (Foto-Ort, Figurgröße). Jede Änderung hat einen Test, und jede neue Prüfung wurde mit einer absichtlich kaputten Kopie rot gesehen (Gegenprobe). Das Paket ist neu gebaut. Offen bleibt nur, was am echten iPhone zu prüfen ist (Klang, wie sich der Berührungs-Radius anfühlt) und die drei Fragen an Lukas unten.

Gemeinsame Wurzel: Das Gerüst passte nur zu seinem eigenen Platzhalter-Bild, und an den Übergaben (Zeichner → Horst, Gerüst → Test) fehlten Einheiten und klare Regeln.

## Punkt für Punkt

### 1. Fußpunkt ohne Einheit (3a, 2)
- **Ursache:** Der Zeichner meldete den Fußpunkt als Text, ohne zu sagen ob in viewBox oder in PNG-Pixeln. Horst musste von Hand umrechnen und in `atlas.json` eintragen.
- **Änderung:** Der Zeichner markiert den Fußpunkt im SVG: `<svg viewBox="0 0 200 240" data-anker="100 230">`. `render.js` (beide Kopien, gleich bis auf den Kopfkommentar) rechnet ihn um (auch mit verschobener viewBox) und schreibt `"anker": [107, 245]` in `grafik.json`, warnt bei Figuren und Gegnern ohne Fußpunkt und zeigt ihn als rotes Kreuz im Kontaktbogen. `atlas.js` nimmt: `atlas.json` (nur zum Überschreiben) → `grafik.json` → Bildmitte. Die Zeichner-Vorlagen haben `data-anker`, das Zeichner-Handbuch und die Agenten-Datei erklären es. Die Vorlage des Gerüsts hat keinen festen Anker mehr in `atlas.json` (der hätte später das neue Bild falsch überschrieben).
- **Test:** neu `tests/zeichner/render-test.js` (34 Prüfungen: Umrechnung, Versatz, falsche Angaben, ganzer Lauf, Fußpunkt sitzt wirklich an den Füßen, danach `atlas.js` übernimmt ihn; Kopien gleich). `werkzeuge-test.js`: Fußpunkt aus `grafik.json`, `atlas.json` überschreibt. Vorher rot: 3 Prüfungen (Atlas nahm die Bildmitte). Gegenproben: Versatz nicht abgezogen, kein `anker` geschrieben, `atlas.js` ignoriert `grafik.json` → jeweils rot.

### 2. Zwei Bild-Wege (3b)
- **Ursache:** `bilder.js` (lädt aus `grafik.json`) und Atlas über das Manifest standen gleichrangig nebeneinander.
- **Änderung:** Ein Weg als Standard, überall gleich beschrieben (SKILL.md, `assets.md`, `grafik-und-sound.md`, `canvas-2d.md`, `haltung.md`, Kopf von `bilder.js`): Spiele laden Bilder nur über das Manifest als Atlas. `grafik.json` ist nur die Eingabe für `atlas.js`. Aus `bilder.js` braucht ein Spiel nur `ersatzBild` und `faerbeEin`; `ladeBilder` ist für Versuche ohne Asset-Kette.
- **Test:** Das Gerüst lädt nur über das Manifest (Gerüst-Test „Assets geladen“, „2D: Figur aus dem Atlas“). `pruefe-team.js` und `kopf-test.js` grün.

### 3. Gerüst-Fehler: Kopf unter der Leiste (3c)
- **Ursache:** `feld.minY = SPIELER.rand * 2` – eine feste Zahl, die nur zur 64-Punkte-Ersatzfigur passte.
- **Änderung:** `setzeFeld` in der 2D-Darstellung rechnet alle vier Grenzen aus Fußpunkt und Größe des Rahmens (mal `skala`) und aus dem gemessenen unteren Rand der Leiste (die Leiste ist versteckt nur unsichtbar, nicht weg, damit man sie messen kann). Neu berechnet beim Start, bei Größenänderung und wenn die Bilder da sind. Dazu: Fehlt der Rahmen `SPIELER.rahmen` im Atlas (Bild umbenannt), zeichnet das Gerüst die Ersatz-Figur und warnt, statt einen unsichtbaren Spieler zu haben.
- **Test:** Gerüst-Test „2D: Kopf der Figur bleibt unter der Leiste“, „2D: Rahmen fehlt im Atlas → Ersatz-Figur“, „2D: Atlas fehlt → Ersatz-Figur“. Von Hand zusätzlich mit der Zeichner-Figur (256 px über `render.js`) im Gerüst: grün, Bildschirmfoto angesehen (Kopf unter „Punkte/Zeit“). Gegenproben: alte feste Grenze → rot; Ersatz bei fehlendem Rahmen entfernt → rot.

### 4. Falle `lies` im Gerüst-Test (3d)
- **Ursache:** `lies = (seite, ausdruck) => seite.evaluate(ausdruck)` gab kein Argument weiter.
- **Änderung:** `lies = (seite, ausdruck, arg) => seite.evaluate(ausdruck, arg)` mit Kommentar; der Test nutzt es selbst mit Argument. In `testen.md` erklärt, samt der kryptischen Meldung.
- **Test:** Gegenprobe mit der alten Fassung → Gerüst-Test rot.

### 5. Fehlende Testfälle: Sound fehlt oder hängt (3g)
- **Ursache:** Das Gerüst hatte gar keine Sound-Datei (nur das Rezept, weil `sounds.js` ffmpeg braucht). Darum gab es nichts, was fehlen konnte.
- **Änderung:** Die Vorlage bringt `start.m4a`/`start.mp3` mit (aus dem Rezept mit `sounds.js` erzeugt). Der Gerüst-Test zählt abgespielte Sound-Dateien unabhängig vom Spielcode (`AudioBufferSourceNode.start`) und prüft: Datei spielt; Sound fehlt (404) und Sound hängt → Titel nach höchstens der Zeitgrenze, „start“ ersetzt, Tippen spielt den Code-Klang statt der Datei, nur Ladefehler des Browsers.
- **Test:** 5 neue Prüfungen; `geruest-test.js` prüft, dass die Vorlage den Sound im Manifest hat und die Dateien zum Rezept passen (Dauer). Gegenproben: Puffer nie gesetzt → rot; kein Code-Klang als Ersatz → rot.

### 6. `testen.md`-Muster (3e, 3f)
- **Ursache:** Kein Muster für „zum Ziel laufen“, keine Regel zu festen Orten und „mindestens“.
- **Änderung:** Neue Hilfe `t.laufeZu(seite, ziel, { position, tempo })` in beiden Test-Hilfen: Finger aufsetzen, in Zielrichtung ausschlagen, in der Seite Bild für Bild warten bis zum Ziel, loslassen, nachmessen, Anläufe begrenzt. Abschnitt „Muster: Figur zum Ziel laufen lassen“ in `testen.md` mit Beispiel, „mindestens statt genau“ und „feste Orte statt Zufall“ (Verteilung eigener Fall mit Seed).
- **Test:** Gerüst-Test „Figur läuft per Joystick zum Ziel“ in 2D und 3D (je 1 Anlauf). Die erste Fassung hielt nach Zeit und schwang in 3D 12-mal ums Ziel (Lernbuch). Gegenprobe: `laufeZu` lässt sofort los → rot. Feste Orte zeigt der Regel-Teil (Berührung, Punkt 8).

### 7. Platzhalter-Bild (2)
- **Ursache:** Niemand wusste, ob das Beispiel-Bild gelöscht werden soll; `render.js` schreibt `grafik.json` neu, lässt alte PNGs aber liegen.
- **Änderung:** `neues-spiel.js` markiert das Beispiel-Bild in `grafik.json` mit `"platzhalter": true`. `render.js` löscht markierte Platzhalter ohne SVG und meldet andere PNGs ohne Quelle nur. Regel in SKILL.md, `assets.md`, LIESMICH und Zeichner-Handbuch (gleicher Name überschreibt; anderer Name → `SPIELER.rahmen` umstellen).
- **Test:** render-Test „Platzhalter entfernt“, „fremdes PNG bleibt mit Warnung“; Gerüst-Test „Platzhalter mit Fußpunkt“. Gegenprobe: kein Löschen → rot.

### 8. Port für neue Spiele (2) und Lesestoff (3h)
- **Ursache Port:** Standard war immer 9000; die Regel verwies auf eine Port-Liste, die es nicht überall gibt.
- **Änderung:** Ohne `--port` nimmt `neues-spiel.js` den ersten Zehnerblock ab 9000, den kein Spiel im selben Ordner nutzt, und meldet ihn („in die Port-Liste des Projekts eintragen, falls es eine gibt“). Regel in SKILL.md, `testen.md`, LIESMICH.
- **Test:** `geruest-test.js` „ohne --port: 9000, dann 9010“. Gegenprobe (immer 9000) → rot.
- **Ursache Lesestoff:** Die Liste „Vor jeder Aufgabe“ nannte fast alles „immer“.
- **Änderung:** Oben in SKILL.md die Tabelle „Mindestens lesen“ je Auftragsart (Pflicht und „dazu, wenn es vorkommt“); `haltung.md` einmal pro Sitzung, `iphone-browser.md` nicht mehr „immer“.
- **Test:** `pruefe-team.js` (alle Verweise gültig), Paket-Test.

### Rundenende und Berührungs-Radius (2, als Einstellwerte)
- **Ursache:** Das Gerüst entschied still (20 s) bzw. hatte gar keine Berührung; der Neue musste raten.
- **Änderung:** `RUNDE.dauer` (`null` = ohne Zeitgrenze, Runde endet durch die Regel) und `BERUEHRUNG { hoehe, radius }` in 2D und 3D, jeweils mit Kommentar „Frage an Lukas“; Regel `beruehrt()` in `js/regeln/spieler.js`: Kreis um die Körpermitte, nicht um den Fuß. In LIESMICH und SCHULDEN des Gerüsts als offene Fragen.
- **Test:** Regel-Teil mit festen Orten (Rand zählt, knapp außerhalb nicht, Kreis über dem Fuß), `dauer: null` → 100 s ohne Ende. Gegenproben: Kreis um den Fuß mit `<` → rot; `null` beendet sofort → rot.

### Kleinigkeiten (3i, 3j)
- Bildschirmfoto jetzt standardmäßig in `<spiel>/tests/fotos/` (mit `.gitignore`), nicht im Temp-Ordner.
- Figurgröße: `SPIELER.skala` mit Erklärung (256 px → 128 Punkte, kleiner geht, größer wird unscharf) und „Frage an Lukas“; Regel „Größe im Spiel in Punkten im Auftrag an den Zeichner nennen“.

## Geänderte Dateien
- Skill game-programmierung: `SKILL.md`; `wissen/` `testen.md`, `assets.md`, `grafik-und-sound.md`, `canvas-2d.md`, `haltung.md`, `lernbuch.md`; `bausteine/bilder.js` (nur Kopfkommentar); `bausteine/tests/` `geruest-test.js`, `werkzeuge-test.js`, `gegenprobe.js` (10 neue Fälle, Filter `NUR=`); `werkzeuge/` `neues-spiel.js`, `atlas.js`, `test-hilfe.js`; Vorlage: `2d/js/welt/darstellung.js`, `2d/js/config/welt.js`, `2d/assets/quellen/atlas.json`, `3d/js/config/welt.js`, `gemeinsam/` `stil.css`, `LIESMICH.md`, `SCHULDEN.md`, `js/config/spiel.js`, `js/regeln/spieler.js`, `js/regeln/runde.js`, `js/oberflaeche/anzeige.js`, `js/test-schnittstelle.js`, `tests/__NAME__-test.js`, neu `assets/sounds/start.m4a|.mp3`.
- Zeichner: `werkzeuge/zeichner/render.js` und `.claude/skills/zeichnen/render.js` (gleich), `.claude/skills/zeichnen/SKILL.md`, Vorlagen `figur.svg`, `gegner.svg`, `gegenstand.svg`, `.claude/agents/zeichner.md`.
- Repo: `werkzeuge/test-hilfe.js` (`laufeZu`), neu `tests/zeichner/render-test.js`; `dist/` neu gebaut.

## Testergebnis
- `bash tests/alle-tests.sh`: „Alle Tests bestanden.“ (Team-Prüfung, alle Baustein-Tests, neuer render-Test, Ausbildungsprüfungen). `node werkzeuge/pruefe-team.js`: grün.
- Baustein-Tests `alle.js`: 18 Tests, 423 Prüfungen (vorher 413). Werkzeug-Test 52 Prüfungen. Gerüst-Test eines neuen Spiels: 2D 48, 3D 46 Prüfungen (vorher 28 bzw. etwa 30).
- `tests/zeichner/render-test.js`: 34 Prüfungen, beide Kopien von `render.js`.
- Gegenproben: 16 neue Fälle in `gegenprobe.js` (`NUR=Gerüst`, `NUR=Fußpunkt`, `NUR=laufeZu`) und 3 von Hand für `render.js` (`RENDER=<kopie>`): alle rot. Die alten Gerüst-Gegenproben laufen weiter rot.
- Nicht automatisch prüfbar: Klang am iPhone, Gefühl der Reichweite, sichere Zone oben bei Geräten mit Notch.

## Fragen an Lukas
1. Rundenende: nach Zeit, durch das Ziel (z. B. alles eingesammelt) oder beides? (`RUNDE.dauer`)
2. Berührung: großzügig oder knapp? (`BERUEHRUNG.radius`, Startwert 40 Punkte um die Körpermitte)
3. Figurgröße: 128 Punkte (etwa 1/5 des Bildschirms) oder kleiner? (`SPIELER.skala`)

## Am echten iPhone prüfen
Klang der Sound-Datei und des Ersatz-Klangs, Gefühl der Sammel-Reichweite, Leiste und Figur mit Notch (sichere Zone oben).
