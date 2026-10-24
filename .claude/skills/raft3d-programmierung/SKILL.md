---
name: raft3d-programmierung
description: Regeln und Ablauf für das Programmieren des Raft 3D Handy-Spiels (Three.js, iPhone-Browser, GitHub). Immer verwenden, wenn Code für das Raft-Spiel geschrieben, geändert, erweitert oder umgebaut wird, auch bei kleinen Änderungen, damit der Code sauber, handyfreundlich und ohne Folgefehler bleibt.
---

# Raft 3D – Programmier-Skill

Ziel: Jede Code-Änderung läuft beim ersten Start glatt, bricht nichts Bestehendes und läuft flüssig auf dem iPhone.

## Rolle im Team
Der Programmierer setzt nur um, was der Planer als Aufgabenpaket geschrieben und der Leiter freigegeben hat (Vermerk „Freigegeben:“ in `pakete/NN-….md`). Eigene Ideen werden dem Leiter gemeldet, nicht einfach eingebaut. Nach dem Bauen geht die Version mit Übergabebericht an den Leiter; der legt sie Lukas zur Freigabe vor, danach prüft der Debugger. Erst dessen Okay macht eine Aufgabe fertig.

## Wissen (vor jedem Paket lesen, was zum Paket passt)
- `wissen/lernbuch.md` – **immer zuerst**: Fehler, die schon passiert sind, und die Regeln daraus.
- `wissen/muster.md` – erprobte Code-Muster (Modul, Hauptschleife, Joystick, Spielstand, Pool, Zustandsautomat).
- `wissen/threejs-iphone.md` – Three.js und Safari auf dem iPhone: Laden, Leistung, Touch, Eigenheiten.
- `wissen/spiel-wissen.md` – wie Raft und ARK es machen (Treibgut, Haken, Floß, Hai, Überleben) mit Startwerten.
- `wissen/testen.md` – eigenen automatischen Test schreiben und das Alte prüfen.

## Vor dem Programmieren
1. `PROJEKT.md` lesen (Entscheidungen, Stand, nächste Schritte).
2. `wissen/lernbuch.md` lesen.
3. Aufgabenpaket lesen: Was genau, was nicht, wann fertig?
4. Bestehenden Code ansehen, bevor etwas Neues entsteht. Nichts doppelt bauen.
5. Bei Unklarheit eine kurze Frage an den Leiter, nicht raten.

## Selbstständig entscheiden (ohne Rückfrage)
- Wie etwas umgesetzt wird: Dateiaufteilung innerhalb der Ordnerstruktur, Namen, Muster aus `wissen/muster.md`, Hilfsfunktionen.
- Fehlende Zahlen: Startwert aus `wissen/spiel-wissen.md` in `spiel/js/config/` mit Kommentar „Wert für Lukas zum Testen“, im Übergabebericht auflisten.
- Kleine Fehler, die beim Bauen im eigenen Paket auffallen: beheben und im Bericht nennen.

## Nicht selbst entscheiden (an den Leiter)
- Etwas, das nicht im Paket steht (auch wenn es klein ist und Spaß machen würde).
- Neuer Ordner, neue Bibliothek, andere Three.js-Version, Build-Schritt, Server: Technik-Frage.
- Ein Wert, der das Spielgefühl deutlich verändert und für den es keinen Startwert gibt.
- Bestehende Funktionen umbauen, die das Paket nicht verlangt.

## Technik-Regeln
- Three.js im Browser, ES-Module, kein Build-Zwang am Anfang. Three.js per Import-Map mit fester Version (z. B. `three@0.170.0`), bis der Techniker etwas anderes vorschlägt und Lukas freigibt.
- Zielgerät: iPhone-Safari. Touch zuerst, Maus nur als Zusatz.
- Performance-Budget: wenig Polygone, einfaches Wasser, keine oder minimale Schatten, Pixel-Ratio auf höchstens 2 begrenzen.
- Assets schlank: Low-Poly oder per Code erzeugt statt große Modelldateien.
- Speicher aufräumen: nicht mehr gebrauchte Objekte, Geometrien und Materialien entfernen (dispose).
- Keine Berechnungen pro Bild, die man einmal vorab machen kann. Zeitbasierte Bewegung (Delta-Zeit), nie bildbasiert.

## Code-Struktur
- Eine Datei, eine Aufgabe. Kleine Module statt einer riesigen Datei (z. B. Wasser, Floß, Steuerung, Bau-System, Oberfläche).
- Klare, einheitliche Namen **auf Deutsch** (Entscheidung von Lukas), ohne Umlaute im Code (`floss`, `groesse`). Three.js-Namen bleiben englisch.
- Einstellwerte (Geschwindigkeit, Größen, Farben) zentral in einer Konfigurationsdatei, nicht im Code verstreut.
- Kurze Kommentare nur dort, wo das Warum nicht offensichtlich ist.

## Ordnerstruktur und Performance-Budget
Freigegeben von Lukas am 24.10.2026 (Vorlage `berichte/2026-10-24-technik-ordnerstruktur.md`).

Das Spiel liegt in `spiel/` (Adresse `neidelbert.github.io/raft/spiel/`, kein Build):
- `index.html` (Startseite, Import-Map für Three.js), `stil.css` (Knöpfe, Joystick, Anzeige)
- `js/main.js` – Start und Hauptschleife
- `js/config/` – alle Zahlen und Farben (nur Daten); Budget in `js/config/leistung.js`
- `js/kern/` Bildschirm, Kamera, Zeit, Speichern, Sound · `js/steuerung/` Joystick links, Aktionsknöpfe rechts
- `js/welt/` Wasser, Himmel, Tag und Nacht, Wetter, Treibgut · `js/floss/` Raster-Floß und Bauen
- `js/figur/` Spielfigur und Haken · `js/gegner/` Hai (später mehr)
- `js/ueberleben/` Hunger, Durst, Gesundheit, Sauerstoff, Kälte · `js/oberflaeche/` Anzeigen, Hinweise, Menüs
- `medien/sound/` nur Sound-Effekte (Grafik per Code, Low-Poly)
- Außerhalb von `spiel/`: `tests/spiel/` (Prüfungen des Debuggers), `werkzeuge/` (Hilfsskripte, nicht ausgeliefert)

Regeln:
- Namen auf Deutsch, ohne Umlaute, klein, mit Bindestrich (`hai.js`, `tag-nacht.js`).
- Eine Datei, eine Aufgabe. Ein neuer Ordner nur mit Vorlage an Lukas.
- Ordner entstehen mit ihrer ersten Datei (keine leeren Ordner).
- Spielstand im Handy-Speicher unter `raft3d-v1`; neue Felder bekommen Standardwerte.

Performance-Budget (Zielgerät iPhone ab etwa iPhone 11, Safari; Werte in `js/config/leistung.js`):
- Bildrate Ziel 60, nie unter 30 · höchstens 100 Zeichenaufrufe pro Bild (Floßteile zusammenfassen) · höchstens 100.000 sichtbare Dreiecke
- Pixel-Ratio höchstens 2 · höchstens 2 Lichter, keine echten Schatten (nur dunkler Fleck unter Figur und Hai)
- Texturen höchstens 1024 × 1024 je Bild, zusammen unter 20 MB Grafikspeicher
- Gleichzeitig höchstens 3 Haie und 50 Treibgut-Teile (wiederverwenden statt neu erzeugen)
- Spiel ohne Three.js unter 2 MB, Start unter 3 Sekunden über Mobilfunk
- Sound je Effekt unter 100 KB, `.m4a` oder `.mp3` · Arbeitsspeicher unter 150 MB · Spielstand unter 1 MB
- Wird eine Grenze überschritten, meldet der Debugger es; der Techniker schlägt eine Lösung vor, bevor weitergebaut wird.
- Start-Test: `node tests/spiel/start-test.js`

## Arbeitsweise
- Kleine Schritte: eine Änderung, testen, weiter. Nie fünf Dinge gleichzeitig ändern.
- Bestehende Funktionen nicht umbauen, wenn die Aufgabe es nicht verlangt.
- Jede Änderung muss starten, ohne Konsolenfehler.
- Jede Version ist ein Git-Commit mit kurzer deutscher Nachricht, damit der Debugger zur letzten funktionierenden Version zurückkann.
- Vor Abgabe selbst prüfen: startet es, läuft die neue Funktion, funktioniert das Alte noch?

## Fertig-Checkliste (vor Übergabe an den Debugger)
- [ ] Spiel startet ohne Fehler in der Konsole
- [ ] Neue Funktion tut genau, was im Paket steht
- [ ] Bisherige Funktionen laufen weiter
- [ ] Touch-Bedienung geprüft (mindestens in der Handy-Ansicht des Browsers)
- [ ] Pixel-Ratio höchstens 2, Delta-Zeit statt Bildzählung
- [ ] Keine unnötigen Dateien oder toter Code
- [ ] Konfigurationswerte zentral abgelegt
- [ ] Eigener Test unter `tests/spiel/` deckt „Fertig, wenn“ ab (siehe `wissen/testen.md`)
- [ ] `bash tests/alle-tests.sh` meldet „Alle Tests bestanden.“
- [ ] Git-Commit mit deutscher Nachricht

## Übergabe an den Leiter
Kurzer Bericht in drei Teilen (Datei `berichte/JJJJ-MM-TT-paket-NN-uebergabe.md`):
1. Was wurde gebaut?
2. Welche Dateien wurden geändert?
3. Was soll der Debugger besonders prüfen?
4. Startwerte für Lukas zum Testen (Name, Wert, Datei) und was nur am echten iPhone prüfbar ist.

Den Eintrag in `PROJEKT.md` (Stand und nächster Schritt) macht der Leiter, nicht der Programmierer.

## Testaufgabe für diesen Skill
„Baue eine Ebene mit einfachem Wasser und einem Würfel als Floß, der per Joystick auf dem iPhone gesteuert wird." Der Skill gilt als bestanden, wenn das Ergebnis ohne Fehler startet, flüssig läuft und der Code nach den obigen Regeln aufgeteilt ist.
