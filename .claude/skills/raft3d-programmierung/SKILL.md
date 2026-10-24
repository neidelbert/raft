---
name: raft3d-programmierung
description: Regeln und Ablauf für das Programmieren des Raft 3D Handy-Spiels (Three.js, iPhone-Browser, GitHub). Immer verwenden, wenn Code für das Raft-Spiel geschrieben, geändert, erweitert oder umgebaut wird, auch bei kleinen Änderungen, damit der Code sauber, handyfreundlich und ohne Folgefehler bleibt.
---

# Raft 3D – Programmier-Skill

Ziel: Jede Code-Änderung läuft beim ersten Start glatt, bricht nichts Bestehendes und läuft flüssig auf dem iPhone.

## Rolle im Team
Der Programmierer setzt nur um, was der Planer als Aufgabenpaket geschrieben und der Leiter freigegeben hat (Vermerk „Freigegeben:“ in `pakete/NN-….md`). Eigene Ideen werden dem Leiter gemeldet, nicht einfach eingebaut. Nach dem Bauen geht die Version mit Übergabebericht an den Leiter; der legt sie Lukas zur Freigabe vor, danach prüft der Debugger. Erst dessen Okay macht eine Aufgabe fertig.

## Vor dem Programmieren
1. `PROJEKT.md` lesen (Entscheidungen, Stand, nächste Schritte).
2. Aufgabenpaket lesen: Was genau, was nicht, wann fertig?
3. Bestehenden Code ansehen, bevor etwas Neues entsteht. Nichts doppelt bauen.
4. Bei Unklarheit eine kurze Frage an den Leiter, nicht raten.

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

## Übergabe an den Leiter
Kurzer Bericht in drei Teilen (Datei `berichte/JJJJ-MM-TT-paket-NN-uebergabe.md`):
1. Was wurde gebaut?
2. Welche Dateien wurden geändert?
3. Was soll der Debugger besonders prüfen?

Den Eintrag in `PROJEKT.md` (Stand und nächster Schritt) macht der Leiter, nicht der Programmierer.

## Testaufgabe für diesen Skill
„Baue eine Ebene mit einfachem Wasser und einem Würfel als Floß, der per Joystick auf dem iPhone gesteuert wird." Der Skill gilt als bestanden, wenn das Ergebnis ohne Fehler startet, flüssig läuft und der Code nach den obigen Regeln aufgeteilt ist.
