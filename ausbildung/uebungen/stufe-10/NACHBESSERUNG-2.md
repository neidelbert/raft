# Nachbesserung 2 nach der Rückmeldung des zweiten Neuen (Stufe 10)

**Ergebnis:** Alle sechs Aufträge aus der Rückmeldung (`RUECKMELDUNG-NEULING-2.md`) sind an der Ursache behoben, dazu zwei Punkte, die er nebenbei fand (Feldgrenzen nur aus dem Stand-Bild, Wo-wird-die-Animation-entschieden). Jede Änderung hat einen Test, und jede neue Prüfung wurde mit einer absichtlich kaputten Kopie rot gesehen (12 neue oder geänderte Gegenproben, alle rot). Das Paket ist neu gebaut. Ehrlich offen: Am echten iPhone ist nicht geprüft, ob drei Werte in der Leiste mit der iPhone-Schrift in eine Zeile passen (im Test-Chromium 12 Punkte Luft zum Ton-Knopf; wenn nicht, bricht die Leiste sauber um und das Spielfeld rückt nach). Für den Hilfs-Befehl `t.foto` (Foto bei Pause) gibt es keine eigene Gegenprobe.

Gemeinsame Wurzel wie in Runde 1, eine Ebene tiefer: Grenzen und Ersatz rechneten mit **einem** Teil der Daten (nur die Leiste, nur das Stand-Bild, nur die Figur), und die Tests rechneten mit einem unbelasteten Rechner.

## Punkt für Punkt

### 1. Feldgrenzen: alle Bedienelemente oben, Platz für einen dritten Wert
- **Schwäche:** Der Ton-Knopf überdeckte den Kopf der 128-Punkte-Figur; ein dritter Wert in der Leiste stieß an den Knopf.
- **Ursache:** `setzeFeld` maß nur die Leiste (unten bei 40 Punkten), nicht den Ton-Knopf daneben (unten bei 60). Die Leiste hatte keine rechte Grenze und war für zwei Werte bemessen. Dazu (Rückmeldung 3.7): Die Grenze kam nur aus dem Stand-Bild, Lauf-Rahmen mit Hub sind höher.
- **Änderung:** Alle Bedienelemente oben tragen `data-oben` (Leiste, Ton-Knopf; neuer Knopf oben: Attribut dazu). Die 2D-Darstellung misst den unteren Rand aller und rechnet neu, wenn eins wächst (`ResizeObserver`). Feldgrenzen aus allen Rahmen der Figur (`figur`, `figur-lauf-1` …: größter Ausschlag). Leiste: endet 96 Punkte vor dem rechten Rand (vor dem Knopf), 18 px Schrift, 12 Punkte Abstand, bricht bei Bedarf in eine zweite Zeile um. Regel in `assets.md`, `canvas-2d.md`, LIESMICH, Kommentar in `stil.css`.
- **Test (Gerüst-Test):** „Kopf bleibt unter Leiste und Ton-Knopf“ (mit dem größten Rahmen gerechnet; Figur fährt per Finger bis zum Rand, nicht nach Uhr), „alle Bedienelemente oben tragen data-oben“, „Leiste mit drei Werten in einer Zeile, frei vom Ton-Knopf“, „Leiste wächst auf zwei Zeilen statt unter den Ton-Knopf → Spielfeld rückt nach“. Der Gerüst-Test des Skills lässt das 2D-Gerüst zusätzlich mit Assets wie vom Zeichner laufen (Figur 256 px mit vier Lauf-Rahmen und Hub). **Gegenproben:** Ton-Knopf ohne `data-oben` → rot; ohne `ResizeObserver` → rot; Leiste ohne rechte Grenze → rot (erst grün: der Test prüfte nur Überlappen mit drei kurzen Werten; jetzt auch, dass die Leiste vor dem Knopf endet); Feld nur aus dem Stand-Bild → rot (mit Zeichner-Assets); alte feste Grenze → rot.

### 2. dt = 0 im Gerüst
- **Schwäche:** Mit einem „hat sich bewegt“-Merker kippte die Figur bei `dt = 0` ein Bild lang auf „steht“, die Lauf-Animation begann von vorn.
- **Ursache:** Die Schleife liefert absichtlich `dt = 0` (Lernbuch Stufe 1), `bewegeSpieler` behandelte es nicht; das Gerüst hatte kein Muster, wo die Animation entschieden wird.
- **Änderung:** `bewegeSpieler` kehrt bei `dt <= 0` sofort zurück. Die Regel führt `spieler.laeuft` (im letzten Bild mit Zeit bewegt; an der Wand nicht) und `spieler.blick`. Die 2D-Darstellung wählt daraus nur die Animation (`SPIELER.rahmen` stehen, neu `SPIELER.lauf` = `figur-lauf`, fehlt sie: Stand-Bild) und spielt sie mit `dt` ab; gespiegelt nach `blick`. Ende-Tafel setzt `laeuft = false`. Regel in `aufbau.md`.
- **Test:** Regel-Teil: „an der Wand läuft die Figur nicht“, „dt = 0 ändert nichts (läuft weiter, Blick bleibt)“, „Daumen weg → steht“. Browser: „Daumen gehalten: läuft genau in den Bildern mit Bewegung, Blick links, Lauf-Animation“ und „Daumen weg: steht, Stand-Animation“. **Gegenprobe:** ohne die `dt`-Abfrage → 2 rot.

### 3. Tests unter Last
- **Schwäche:** Parallel gestartete Gegenproben machten auch richtigen Code rot.
- **Ursache:** Die Tests rechneten mit einem schnellen Rechner: Beobachtung nach Uhr (Figur stand schon an der Wand), Foto bei laufendem Spiel (bis über 30 s, Gegner kriechen weiter), feste 3- und 15-s-Grenzen; im Handbuch stand nichts zu Parallelität, Laufzeiten und Befehls-Zeitgrenzen.
- **Änderung:** Test-Hilfe (Skill und Repo, gleich bis auf die Pfad-Regel): `t.beobachte(seite, lesen, { bilder })` liefert Werte je Bild mit `dt` (nur `dt > 0` werten, Bewegung am Wert ablesen); `t.foto(seite, datei)` macht das Foto bei Pause (Tab kurz versteckt); `t.ZEITGRENZE` (30 s, `TEST_ZEITGRENZE`) für das Warten auf die Seite, als Playwright-Standard und für eigene Wartestellen; Foto bis 60 s. Gerüst-Test nutzt alles (Lauf-Prüfung nach Bildern, Kopf-Prüfung „halten bis am Rand“, Fotos bei Pause, keine festen 3/15 s mehr). `testen.md`: neuer Abschnitt „Tests unter Last und Befehls-Zeitgrenzen“ (nacheinander statt parallel, was unter Last passiert, Laufzeiten 40–60 s / 3 min / viele Minuten, lange Läufe in Datei umleiten und im Hintergrund nur die fertige Datei lesen). Laufzeit und Umleitung auch in SKILL.md, LIESMICH und den Kopfkommentaren; `neues-spiel.js` legt `tests/fotos/.gitignore` gleich an (Ziel für `lauf.txt`). `gegenprobe.js`: `NUR` nimmt mehrere Teile mit `|`, Laufzeit im Kopf.
- **Test:** Gerüst-Test 2D und 3D grün mit den neuen Hilfen. Die Lauf-Prüfung ist so gebaut, dass „steht an der Wand“ unter Last richtig bleibt. Nicht automatisch geprüft: dass das Foto wirklich in der Pause entsteht (keine Gegenprobe für `t.foto`).

### 4. Zeichner-Handbuch
- **Schwäche:** Laufzyklus nur mit 6 Rahmen beschrieben, Effekte erst ab 5 Rahmen, keine Regel zur viewBox über alle Rahmen (Bommel im Hochpunkt abgeschnitten), Fußpunkt für Effekte fehlte, `groessen.json` nur mit einem Beispiel.
- **Änderung (`.claude/skills/zeichnen/SKILL.md`):** Laufzyklus mit 4 Rahmen (Kontakt → Durchgang hoch → Kontakt anderes Bein → Durchgang, etwa 8 Bilder/s) und mit 6 Rahmen; Effekte mit 4–8 Rahmen (4 für kurze unter 0,4 s), einmal statt Schleife; „viewBox nach dem größten Ausschlag aller Rahmen“ mit Luft für Umriss, Vorlage oben erweitern, `data-anker` gleich lassen; Fußpunkt für Effekte und Gegenstände in der Mitte (Horst setzt Effekte an die Körpermitte, auch in `assets.md`); `groessen.json` mit Schlüssel für Bild, Animation ohne Nummer (`"gegner/schleim": 176` gilt für alle Rahmen) oder Gruppe. `render.js` (beide Kopien) kann den Animations-Schlüssel jetzt wirklich (`kanteFuer`).
- **Test:** `tests/zeichner/render-test.js` „groessen.json nach Bild, Animation, Gruppe, sonst Standard“ (beide Kopien), Kopien weiter gleich. `pruefe-team.js` grün.

### 5. Ersatz für alle Atlas-Rahmen
- **Schwäche:** Fehlte der Atlas, gab es nur die Ersatz-Figur; Gegner und Explosion wären unsichtbar gewesen, und der Gerüst-Test hätte es nicht gemerkt.
- **Ursache:** Das Spiel wusste ohne Atlas nicht, welche Rahmen es gibt: Die Namen standen nur in der fehlenden Datei. `baueErsatz()` kannte darum nur `SPIELER.rahmen`, der Test prüfte nur die Figur.
- **Änderung:** `manifest.js` schreibt je Atlas alle Rahmen mit Maßen und Fußpunkt und die Animationen ins Manifest. `ladeAssets` (Baustein) ruft `ersatz(bekannt)` mit genau diesen Rahmen auf und übernimmt die Animationen. Das 2D-Gerüst zeichnet für jeden Rahmen eine Form in gleicher Größe mit gleichem Fußpunkt; Form und Farbe je Name oder Namensanfang in `ERSATZ.formen` (`config/welt.js`), sonst `ERSATZ.standard`. Neue Gegner und Effekte brauchen keinen Ersatz-Code. Regel in `assets.md`, `testen.md`, SKILL.md (Assets, Fertig-Checkliste), LIESMICH.
- **Test:** `assets-test.js` (3 neu: `ersatz(bekannt)` kennt alle Rahmen mit Maßen und Fußpunkt, jeder Rahmen ersetzt, Animation aus dem Manifest zeigt auf Ersatz-Rahmen); `werkzeuge-test.js` (Manifest kennt alle Rahmen und Animationen); Gerüst-Test „Atlas fehlt → Ersatz für alle Rahmen und Animationen (gleiche Größe, gleicher Fußpunkt)“, verglichen mit `assets/atlas/*.json` auf der Platte, also für jeden künftigen Rahmen von selbst. Im Gerüst-Test des Skills mit Zeichner-Assets: 11 Rahmen (Figur, 4 Lauf, 2 Gegner, 4 Explosion) und 3 Animationen. **Gegenproben:** Baustein ohne Rahmenliste → 3 rot; Manifest ohne Rahmen-Maße → rot; Gerüst nur Figur-Ersatz → 3 rot.

### 6. Lernbuch-Tipp `pgrep`
- **Schwäche:** `pgrep -fa http.server` meldete „Server übrig“, obwohl keiner lief.
- **Ursache:** `-f` sucht in der ganzen Befehlszeile, und die Shell, die den Befehl ausführt, enthält „http.server“. Ausprobiert: Auch der vorgeschlagene Ausweg `pgrep -f "[h]ttp.server"` findet die Shell, sobald dieselbe Zeile noch einen anderen Befehl mit „http.server“ enthält.
- **Änderung:** `pgrep -af "^python3 -m http.server"` (nur Zeilen, die so anfangen) in Lernbuch und `testen.md`; die Meldung der Test-Hilfe bei belegtem Port schlug `pkill -f "http.server …"` vor, das hätte die eigene Shell beenden können: jetzt `pkill -f "^python3 -m http.server <port>"` (beide Kopien).
- **Test:** von Hand: Der neue Befehl findet genau den laufenden Testserver und nicht die Shell.

## Testergebnis
- Gerüst-Test 2D: 57 Prüfungen (9 neu), 3D: 51; dazu der zweite 2D-Lauf mit Zeichner-Assets (57). `bausteine/tests/geruest-test.js`, `assets-test.js`, `werkzeuge-test.js`, `tests/zeichner/render-test.js` grün.
- Gegenproben (nacheinander): 12 neue oder geänderte Fälle rot (siehe oben); alle 64 Suchtexte passen noch.
- `node werkzeuge/pruefe-team.js` grün, `bash tests/alle-tests.sh` (allein, Ausgabe in eine Datei): „Alle Tests bestanden.“ Paket neu gebaut (`dist/game-programmierung.zip`, `dist/zeichnen.zip`), Paket-Test grün. Kein Testserver übrig.

## Für Lukas offen
- Am iPhone ansehen: Leiste mit drei Werten (eine Zeile?), Abstand Kopf ↔ Ton-Knopf, Lauf-Animation wechselt sauber zwischen Stehen und Laufen.
