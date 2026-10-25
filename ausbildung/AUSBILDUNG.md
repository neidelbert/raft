# Horsts Ausbildung

Acht Stufen, jede baut auf der vorigen auf. Jede Übung hat:
- einen **Auftrag** (unten), den Horst wie einen echten Auftrag umsetzt: Handbuch lesen, bauen, eigener Test, Bericht, Lernbuch.
- eine **Prüfung** des Ausbilders in `ausbildung/pruefungen/stufe-N.js`. **Horst liest die Prüfungen nicht.** Er kennt nur den Auftrag und die vorgegebene Test-Schnittstelle.

Bestanden ist eine Stufe, wenn die Prüfung grün ist, Horsts eigener Test grün ist und der Bericht die Punkte aus dem Handbuch enthält. Das Ergebnis steht in `ausbildung/ZEUGNIS.md`.

Bilder für die Übungen: `ausbildung/grafik/` (PNGs vom Zeichner plus `grafik.json`). Horst kopiert sie in den Übungsordner nach `grafik/`.

Ablage: `ausbildung/uebungen/stufe-N/` (wie ein Spielordner: `index.html`, `stil.css`, `js/…`). Eigener Test: `ausbildung/uebungen/stufe-N/test.js` mit Port `88N0`. Bericht: `ausbildung/uebungen/stufe-N/BERICHT.md`.

Gemeinsame Regeln für alle Stufen:
- `window.spiel` hat immer `bereit: true`, sobald alles geladen ist.
- `?seed=<zahl>` in der Adresse macht den Zufall wiederholbar.
- `?test=1` schaltet `window.spiel.test` frei (Hilfsfunktionen nur für Tests). Ohne `?test=1` gibt es `window.spiel.test` nicht.
- Hochformat, iPhone 13 (390 × 844 Punkte).

---

## Stufe 1 – Grundgerüst und Hauptschleife
**Lernziel:** Aufbau nach `aufbau.md`, scharfer Canvas, Delta-Zeit, Einstellwerte.
**Auftrag:** Ein Ball (Kreis, Radius aus config) fliegt über den Bildschirm und prallt an den Rändern ab. Startrichtung schräg, Tempo aus `config/spiel.js` (`ballTempo`, Punkte pro Sekunde, Startwert 300).
**Test-Schnittstelle:** `window.spiel = { bereit, pixelRatio, ball: { x, y, r }, breite, hoehe }`. Koordinaten in CSS-Punkten.
**Fertig, wenn:** keine Konsolenfehler; Canvas füllt den Bildschirm; interne Canvas-Breite = Breite × Pixel-Ratio, Pixel-Ratio höchstens 2; der Ball legt in 1 s etwa `ballTempo` zurück (±25 %), egal wie schnell das Gerät zeichnet; der Ball verlässt nie den Bildschirm; nach einem Tab-Wechsel springt er nicht.

## Stufe 2 – Steuerung mit Touch
**Lernziel:** Pointer-Events, schwebender Joystick, mehrere Finger, Loslassen.
**Auftrag:** Eine Figur (Bild `grafik/figuren/figur.png` aus `ausbildung/grafik/`) steht in der Mitte. Ein schwebender Joystick in der linken Bildschirmhälfte: Er erscheint, wo der Daumen aufsetzt, und bewegt die Figur. Rechts unten ein runder Knopf „Sprung“ (mindestens 64 × 64 Punkte), der die Figur 0,4 s hüpfen lässt (nur optisch). Tempo aus config (`laufTempo`, Startwert 220 Punkte/s). Die Figur bleibt im Bildschirm.
**Test-Schnittstelle:** `window.spiel = { bereit, spieler: { x, y, springt }, eingabe: { x, y, aktiv } }`. Der Knopf hat `id="knopf-sprung"`.
**Fertig, wenn:** Ziehen nach rechts bewegt die Figur nach rechts, nach oben nach oben; Loslassen stoppt sofort; ein zweiter Finger auf dem Sprung-Knopf während des Ziehens löst den Sprung aus, ohne die Laufrichtung zu stören; Tippen in der rechten Hälfte bewegt nichts; Schräg ist nicht schneller als gerade; Seite scrollt und zoomt nicht.

## Stufe 3 – Viele Gegner
**Lernziel:** Pool, Gitter-Kollision, keine neuen Objekte in der Schleife, Leistung messen.
**Auftrag:** Wie Stufe 2 (Code übernehmen), dazu Gegner (Bild `grafik/gegner/gegner.png`), die vom Rand kommen und zum Spieler laufen. Bis zu 240 gleichzeitig, sie überlappen sich nicht stark (sanftes Auseinanderschieben). Berührt ein Gegner den Spieler, verliert er 1 Leben (Start 5) und ist 1 s unverwundbar. Zahlen in config.
**Test-Schnittstelle:** `window.spiel = { bereit, spieler: { x, y, leben, unverwundbar }, gegnerAktiv, messung: { schrittMs } }`, wobei `schrittMs` die gleitend gemittelte Zeit für einen Spiel-Schritt ohne Zeichnen ist. Mit `?test=1`: `spiel.test.fuelleGegner(n)` erzeugt sofort n Gegner, `spiel.test.friere(bool)` hält die Gegner an.
**Fertig, wenn:** 240 Gegner gleichzeitig ohne Fehler; `schrittMs` mit 240 Gegnern unter 4 ms in der Test-Umgebung; Kollision kostet genau 1 Leben, dann 1 s Schutz; die Zahl der Gegner überschreitet nie die Grenze aus config.

## Stufe 4 – Spielzustände und Speichern
**Lernziel:** Zustandsautomat, Speicherstand mit Standardwerten, Robustheit.
**Auftrag:** Stufe 3 wird ein Spiel: Titel („Tippen zum Starten“) → Spiel → Ende („Rekord: …“, Tippen für neue Runde). Punkte = überlebte Sekunden (ganze Zahl). Rekord bleibt nach Neuladen erhalten (localStorage `uebung-4`). Pause, wenn der Tab versteckt wird.
**Test-Schnittstelle:** `window.spiel = { bereit, zustand ('titel'|'spiel'|'ende'), punkte, rekord, spieler: { leben } }`. Mit `?test=1`: `spiel.test.schaden(n)`.
**Fertig, wenn:** Zustände wechseln wie beschrieben; bei 0 Leben „ende“; Rekord nur, wenn höher; Rekord nach Neuladen da; kaputter Inhalt in `uebung-4` (kein JSON) führt nicht zum Absturz, sondern zu Standardwerten; neue Runde setzt Leben, Punkte und Gegner zurück.

## Stufe 5 – Fehlersuche und Code-Review
**Lernziel:** Ursache statt Symptom, Regressionstest, Review.
**Auftrag:** In `ausbildung/vorlagen/pilzsammler/` liegt ein fremdes Spiel „Pilzsammler“ mit mehreren versteckten Fehlern. Kopiere es nach `ausbildung/uebungen/stufe-5/` und arbeite dort. Lukas meldet: „Auf meinem alten iPhone läuft die Figur langsamer“, „Manchmal läuft sie nach dem Loslassen weiter“, „Manchmal verschwinden zwei Pilze, obwohl ich nur einen eingesammelt habe“, „Im privaten Modus startet das Spiel gar nicht“. Finde und behebe die Ursachen, schreibe für jeden Fehler eine Prüfung in deinem Test und schreibe ein Code-Review (höchstens fünf Punkte) in `REVIEW.md`. Erkläre jeden Fehler in `BERICHT.md` so, dass Lukas ihn versteht.
**Test-Schnittstelle:** steht im Code des Spiels (`window.spiel`), nicht verändern.
**Fertig, wenn:** alle gemeldeten Fehler an der Ursache behoben; keine neuen Funktionen; Review und Bericht vorhanden.

## Stufe 6 – Spielgefühl, Sound, Ersatzbilder
**Lernziel:** Rückmeldung, Partikel aus Pool, WebAudio, robustes Laden.
**Auftrag:** Stufe 4 bekommt: Treffer am Spieler → rot aufblitzen und Bildschirm wackeln; Einsammeln von Sternen (neu, `grafik/gegenstaende/stern.png`, erscheinen alle 2 s zufällig) → Partikel und Ton; Ton per WebAudio, erst nach der ersten Berührung; Ton aus/an-Knopf (`id="knopf-ton"`, im Spielstand). Fehlt ein Bild, wird ein Ersatz gezeichnet und das Spiel läuft weiter.
**Test-Schnittstelle:** zusätzlich `window.spiel.effekte = { wackeln, partikelAktiv, partikelMax }`, `window.spiel.ton = { bereit, an }`, `window.spiel.sterne` (Anzahl eingesammelt). Alles aus Stufe 4 bleibt (auch `zustand`, `spiel.test.schaden(n)`). Mit `?test=1` zusätzlich: `spiel.test.sammleStern()`.
**Fertig, wenn:** Wackeln springt bei Treffer an und klingt in unter 1 s ab; Partikel nie über `partikelMax`, nach 1 s wieder 0; `ton.bereit` erst nach erster Berührung; Ton-Einstellung bleibt nach Neuladen; mit gelöschtem `stern.png` keine Konsolenfehler (Warnung erlaubt) und das Spiel läuft.

## Stufe 7 – 3D mit Three.js
**Lernziel:** Three.js-Aufbau, Import-Map, Leistung, Kamera.
**Auftrag:** Ein Boot (Low-Poly per Code) auf einer Wasserfläche mit Wellen, gesteuert vom schwebenden Joystick aus Stufe 2, Kamera schräg von oben folgt weich. 30 Bojen (eine Geometrie, `InstancedMesh`) liegen verteilt, Berührung mit einer Boje lässt sie hüpfen.
**Test-Schnittstelle:** `window.spiel = { bereit, boot: { x, z }, kamera: { x, y, z }, renderer, szene }` (`renderer.info` lesbar).
**Fertig, wenn:** keine Konsolenfehler; Joystick oben → Boot fährt nach −z, Loslassen stoppt; Kamera folgt (Abstand bleibt ungefähr gleich); höchstens 20 Zeichenaufrufe; Pixel-Ratio höchstens 2.

## Stufe 8 – Abschluss: der eigene Skill
**Lernziel:** Wissen festhalten und weitergeben. Horst programmiert kein Spiel, sondern macht aus allem, was er in Stufe 1 bis 7 gelernt hat, seinen Skill besser.
**Auftrag:**
1. **Bausteine:** Die bewährten Teile aus den Übungen werden wiederverwendbare, geprüfte Module in `.claude/skills/game-programmierung/bausteine/`: `schleife.js` (Hauptschleife mit gedeckelter Delta-Zeit, Pause, kein Zeitsprung), `bildschirm.js` (scharfer Canvas, Pixel-Ratio ≤ 2, Größenänderung), `joystick.js` (schwebend, Loslassen und Abbruch), `knopf.js`, `zufall.js` (mit Seed), `speicher.js` (Standardwerte, kaputte Daten, privater Modus), `pool.js`, `gitter.js` (Kollision), `partikel.js`, `ton.js` (WebAudio, erst nach Berührung), `bilder.js` (Laden mit Ersatz), `zustaende.js`. Jeder Baustein hat oben einen Kommentar: wofür, Schnittstelle, Beispiel.
2. **Baustein-Tests:** `.claude/skills/game-programmierung/bausteine/tests/` mit einem Test pro Baustein (Logik mit `node`, Touch und Canvas mit `werkzeuge/test-hilfe.js` über eine kleine Testseite). `node .claude/skills/game-programmierung/bausteine/tests/alle.js` meldet „Alle Prüfungen bestanden.“
3. **Handbuch:** `SKILL.md` und die Wissensdateien so überarbeiten, dass ein neuer Programmierer ohne die Übungen genauso gut arbeitet: Bausteine-Tabelle (wann welcher), Regeln aus dem Lernbuch an die passende Stelle übernehmen, Widersprüche und Veraltetes entfernen. Das Lernbuch bleibt als Verlauf erhalten.
4. **Bericht:** `ausbildung/uebungen/stufe-8/BERICHT.md` für Lukas: Was kann Horst jetzt, was hat sich am Skill geändert, wo sind noch Lücken?
**Fertig, wenn:** alle Bausteine vorhanden, mit Kommentar und grünem Test; Handbuch verweist auf jeden Baustein; `node werkzeuge/pruefe-team.js` und `bash tests/alle-tests.sh` grün; keine Spiel-Dateien angelegt.

---

# Aufbaukurs: Assets und eigenständiger Skill (Ziel von Lukas, 25.10.2026)
Ziel ist ein Programmierer-Skill, der Spiele **mit Assets** (Bilder, Animationen, Sounds, Schriften, 3D-Modelle) bauen kann, und zwar so, dass auch ein neuer Programmierer ohne Horsts Vorgeschichte damit arbeiten kann. Es entsteht weiterhin kein Spiel.

## Stufe 9 – Assets
**Lernziel:** vollständige Asset-Pipeline: Quellen → Werkzeuge → Manifest → Laden mit Fortschritt und Ersatz → Animation und Sound im Spiel. Wissen: `wissen/assets.md`.
**Material:** Der Zeichner liefert in `ausbildung/grafik-stufe-9/` Rahmen-Animationen (Held läuft, Explosion, Münze dreht sich), Symbole und eine Bodenkachel, mit `MELDUNG.md` (Tempo, Fußpunkte).
**Auftrag:**
1. **Werkzeuge** im Skill (`.claude/skills/game-programmierung/werkzeuge/`), jedes mit Kopfkommentar und Aufruf-Beispiel:
   - `atlas.js` – packt die PNGs einer Grafik-Ausgabe zu einem Atlas (PNG + JSON nach `wissen/assets.md`: Rahmen mit Anker, Animationen aus `<name>-<nr>`, 2 px Abstand mit Randverlängerung, höchstens 2048 × 2048, sonst mehrere Atlanten).
   - `sounds.js` – erzeugt Sound-Effekte aus Rezepten (`assets/quellen/sounds.json`: Wellenform, Frequenzverlauf, Rauschen, Hüllkurve, Dauer) als WAV und wandelt sie mit `ffmpeg` in `.m4a` und `.mp3` um.
   - `modell.js` – macht aus einem Low-Poly-Modell, das als JS-Modul beschrieben ist (`assets/quellen/modelle/<name>.js`, exportiert eine Funktion, die mit Three.js eine Gruppe baut), eine `.glb`-Datei (GLTFExporter im kopflosen Chromium).
   - `manifest.js` – schreibt `assets/assets.json` (Version, alle Einträge, Größen) und meldet das Budget: Bytes des Startpakets, ausgepackter Bildspeicher. Grenze überschritten → Rückgabewert 1.
2. **Bausteine** `bausteine/assets.js` (Manifest laden, Fortschritt melden, Zeitgrenze je Asset, Ersatz, Atlanten, Sounds dekodieren und abspielen, Schriften, Modelle über eine übergebene Lade-Funktion) und `bausteine/animation.js` (Spritesheet-Animation mit Delta-Zeit, Schleife oder einmal, „fertig“-Meldung, Rahmen zeichnen mit Anker), mit Tests in `bausteine/tests/` und Gegenprobe.
3. **Übungsseite** `ausbildung/uebungen/stufe-9/` (Port 8890–8899), kein Spiel:
   - `index.html`: Ladebildschirm mit Balken → „Tippen zum Starten“ → Wiese als Boden, der Held läuft per schwebendem Joystick nach links/rechts (Lauf-Animation, im Stand `held-steht`, Blickrichtung gespiegelt), Münzen drehen sich, Tippen in der rechten Hälfte löst dort eine Explosion (Animation einmal) mit Sound aus, Ton-Knopf mit Symbol.
   - `modell.html`: zeigt das Modell `boot.glb` (aus `assets/quellen/modelle/boot.js` erzeugt) drehend in Three.js.
**Test-Schnittstelle:**
- `index.html`: `window.spiel = { bereit, zustand ('laden'|'start'|'laeuft'), fortschritt (0 bis 1), assets: { geladen: [], ersetzt: [], fehlend: [] }, held: { x, animation, rahmen, blick (1|-1) }, explosionen (Anzahl aktiv), sounds: { abgespielt (Zähler), dekodiert (Anzahl) }, atlas: { breite, hoehe } }`. `bereit` ist wahr, sobald die Seite läuft (auch während `laden`). Mit `?test=1`: `spiel.test.explosion(x, y)`.
- `modell.html`: `window.modell = { bereit, ersatz (bool), dreiecke }`.
**Fertig, wenn:**
- Ladebildschirm erscheint, bevor Assets geladen sind; Fortschritt steigt nie zurück und erreicht 1; danach „start“, Tippen → „laeuft“.
- Atlas höchstens 2048 × 2048; Rahmen mit Abstand; Animation „held-lauf“ wechselt beim Laufen die Rahmen mit dem Tempo aus der Meldung, im Stand `held-steht`; Blick nach links gespiegelt.
- Explosion läuft einmal ab und verschwindet; dabei wird ein Sound abgespielt; Sounds liegen als `.m4a` und `.mp3` vor und werden dekodiert.
- Fehlt eine Asset-Datei → Eintrag unter `ersetzt`/`fehlend`, Seite läuft. Antwortet der Server für eine Datei nie → nach der Zeitgrenze Ersatz, Seite läuft (höchstens 10 s).
- `assets.json` hat eine Version, Adressen tragen `?v=<version>`; `manifest.js` meldet das Budget.
- `modell.html` zeigt das Boot (`dreiecke` > 0); ohne `boot.glb` eine Ersatz-Box (`ersatz: true`), keine Abstürze.
- Keine Konsolenfehler (außer der Browser-Zeile für absichtlich fehlende Dateien).

## Stufe 10 – Eigenständiger Skill
**Lernziel:** Der Skill funktioniert ohne Horst: ein neuer Programmierer bekommt nur den Skill und baut damit.
**Auftrag:**
1. **In sich geschlossen:** Alles, was der Skill braucht, liegt im Skill-Ordner: `werkzeuge/test-hilfe.js` (Kopie mit Hinweis, woher), die Asset-Werkzeuge, Bausteine, Wissen. Keine Verweise mehr auf Dateien außerhalb des Skills, außer auf das Spiel selbst.
2. **Gerüst-Werkzeug** `werkzeuge/neues-spiel.js <zielordner> [--3d]`: legt ein startfähiges Spiel-Gerüst an: `index.html`, `stil.css`, `js/main.js` (Schleife, Bildschirm, Assets mit Ladebildschirm, Zustände Titel → Spiel → Ende, Joystick, Speicher, Ton-Knopf), `js/config/`, Kopien der Bausteine in `js/kern/`, `assets/` mit Manifest und einem Beispiel-Bild, `tests/<name>-test.js` (prüft das Gerüst), `SCHULDEN.md`, `LIESMICH.md` (nächste Schritte). Mit `--3d` statt Canvas eine Three.js-Szene. Das Gerüst startet ohne Konsolenfehler und sein eigener Test ist grün.
3. **Handbuch:** `SKILL.md` so, dass ein Neuer in 5 Minuten weiß, wo er anfängt: „Neues Spiel in 5 Schritten“ (Gerüst → Assets → Spielregeln → Test → Bericht) ganz oben, Assets-Kapitel, Werkzeug-Tabelle.
4. **Paket** `werkzeuge/paket.js`: baut `dist/game-programmierung.zip` (der Skill-Ordner, ohne Testseiten-Bildschirmfotos und Abfall) und `dist/zeichnen.zip` (Zeichner-Skill plus `render.js`), dazu `dist/INSTALLIEREN.md` (Claude Code: Ordner nach `.claude/skills/`; Claude.ai: Zip unter Einstellungen → Fähigkeiten hochladen).
5. **Bericht** `ausbildung/uebungen/stufe-10/BERICHT.md` für Lukas.
**Fertig, wenn:** Ein frischer Programmierer, der nur das entpackte Paket bekommt, legt in einem leeren Ordner mit `neues-spiel.js` ein Gerüst an, dessen Test grün ist, und versteht aus `SKILL.md` die nächsten Schritte (Prüfung durch den Ausbilder mit einem neuen Agenten); `node werkzeuge/pruefe-team.js` und `bash tests/alle-tests.sh` grün.
