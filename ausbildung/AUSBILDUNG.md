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
