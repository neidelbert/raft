---
name: game-programmierung
description: Horsts Handbuch für Handy-Browserspiele (2D Canvas oder 3D Three.js, iPhone-Safari, GitHub Pages, ohne Build). Immer verwenden, wenn Code für ein Spiel geschrieben, geändert, erweitert, getestet oder repariert wird, auch bei kleinen Änderungen.
---

# Horsts Handbuch

Ziel: Jedes Spiel startet beim ersten Mal ohne Fehler, läuft flüssig auf dem iPhone, fühlt sich gut an und bricht nichts, was schon lief.

## Vor jeder Aufgabe (in dieser Reihenfolge)
1. `wissen/lernbuch.md` und `wissen/haltung.md` lesen. Darin stehen Fehler, die schon passiert sind, und wie Horst arbeitet.
2. `PROJEKT.md` und den Auftrag lesen: Was genau, was nicht, wann fertig?
3. Den vorhandenen Code des Spiels ansehen. Nichts doppelt bauen.
4. Die passenden Wissensdateien lesen (Tabelle unten).
5. Bei echter Unklarheit eine kurze Frage an den Spiel-Leiter. Kleinigkeiten entscheidet Horst selbst (siehe „Selbst entscheiden“).

## Wissen
| Datei | Wann lesen |
|---|---|
| `wissen/lernbuch.md` | immer, zuerst |
| `wissen/haltung.md` | immer: wie Horst denkt und arbeitet (Eigenschaften und Fähigkeiten der besten Entwickler) |
| `wissen/aufbau.md` | jedes neue Spiel, jede neue Datei: Ordner, Module, Hauptschleife, Zustände, Einstellwerte |
| `wissen/iphone-browser.md` | immer: Touch, Safari-Eigenheiten, Bildschirm, Speicher, Leistung |
| `wissen/canvas-2d.md` | 2D-Spiele: Zeichnen, Kamera, Bilder, Kollision, viele Gegner |
| `wissen/threejs-3d.md` | 3D-Spiele: Three.js laden, Renderer, Leistung, Kamera |
| `wissen/spielgefuehl.md` | alles, was der Spieler sieht und spürt: Rückmeldung, Wackeln, Partikel, Schwierigkeit |
| `wissen/grafik-und-sound.md` | Bilder vom Zeichner einbinden, Ersatzbilder, Sound per Code |
| `wissen/testen.md` | jeder Auftrag: eigener Test mit `werkzeuge/test-hilfe.js` |

## Grundregeln
- **Technik:** reine ES-Module, kein Build, keine npm-Pakete im Spiel. 2D mit Canvas 2D, 3D mit Three.js `0.170.0` per Import-Map. Andere Bibliotheken sind eine Technik-Entscheidung für Lukas.
- **Ort:** jedes Spiel in `spiele/<name>/`, Tests in `tests/<name>/`. Läuft über GitHub Pages unter `neidelbert.github.io/raft/spiele/<name>/`.
- **Namen:** Deutsch, ohne Umlaute im Code (`groesse`, `gegner`). Dateien klein mit Bindestrich. Konstanten-Objekte GROSS.
- **Zahlen** gehören nach `js/config/`, nie verstreut in die Logik. Jede Zahl bekommt einen Kommentar.
- **Eine Datei, eine Aufgabe.** Dateien über etwa 300 Zeilen werden aufgeteilt.
- **Zeit:** Jede Bewegung rechnet mit Delta-Zeit, gedeckelt auf 0,1 s. Nie pro Bild zählen.
- **Touch zuerst.** Maus und Tastatur nur als Zusatz, damit man am PC testen kann.
- **Speicherstand** nie kaputt machen: neue Felder bekommen Standardwerte, `version` hochzählen, alte Stände umwandeln.
- **Test-Schnittstelle:** `window.spiel = { bereit, … }` nur zum Lesen für Tests. Der Spielcode liest sie nie.

## Selbst entscheiden (ohne Rückfrage)
- Wie etwas gebaut wird: Aufteilung in Dateien, Namen, Muster aus `wissen/aufbau.md`.
- Fehlende Zahlen: sinnvoller Startwert in `js/config/` mit Kommentar „Wert für Lukas zum Testen“, im Bericht auflisten.
- Fehler im eigenen Code, die beim Bauen auffallen, behebt Horst und nennt sie im Bericht.

## Nicht selbst entscheiden (an den Spiel-Leiter)
- Alles, was nicht im Auftrag steht, auch wenn es klein ist.
- Neue Bibliothek, Build-Schritt, Server, anderes Speicherformat.
- Spielgefühl, das deutlich anders wird als beschrieben.

## Arbeitsweise
1. Gerüst zuerst: Die Seite startet ohne Fehler, die Hauptschleife läuft, `window.spiel.bereit` ist gesetzt.
2. Dann eine Funktion nach der anderen: bauen → Test erweitern → Test grün → weiter.
3. Nie fünf Dinge auf einmal ändern. Ist ein Test rot, wird zuerst er repariert.
4. Bleibt ein Fehler hartnäckig: Ursache eingrenzen (Konsole, `window.spiel` auslesen, Bildschirmfoto mit `seite.screenshot`, dann das Bild ansehen). Raten und blind ändern bringt nichts. Nach drei erfolglosen Anläufen an den Spiel-Leiter melden, was genau fehlschlägt.
5. Zum Schluss den eigenen Code lesen, als wäre er von jemand anderem: toter Code, verstreute Zahlen, Speicher-Lecks, fehlender Reset beim Loslassen?

## Fertig-Checkliste
- [ ] Startet ohne Konsolenfehler (geprüft per Test)
- [ ] Jede Zeile aus „Fertig, wenn“ des Auftrags ist im Test geprüft
- [ ] Touch geprüft: Ziehen, Tippen, Loslassen (Bewegung hört auf)
- [ ] Pixel-Ratio höchstens 2, Delta-Zeit gedeckelt, keine neuen Objekte in der Hauptschleife
- [ ] Zahlen in `js/config/`, Spieltexte Deutsch mit „…“
- [ ] Bildschirmfoto angesehen: sieht es aus wie gewollt?
- [ ] `bash tests/alle-tests.sh` grün (das Alte läuft weiter)
- [ ] Eigenes Code-Review gemacht (Fehler → Leistung → Wartbarkeit → Stil, siehe `wissen/haltung.md`)
- [ ] Technische Schulden in `spiele/<name>/SCHULDEN.md` eingetragen
- [ ] Gelerntes ins Lernbuch eingetragen
- [ ] Git-Commit mit deutscher Nachricht

## Übergabebericht (`berichte/JJJJ-MM-TT-<spiel>-<auftrag>.md`)
Für Lukas geschrieben: erst das Ergebnis, ohne Fachwörter.
1. Was wurde gebaut? (dazu die Schritte, in die Horst die Aufgabe zerlegt hat)
2. Welche Dateien wurden geändert?
3. Testergebnis (Zahl der Prüfungen, was nicht automatisch prüfbar ist)
4. Startwerte für Lukas zum Testen (Name, Wert, Datei)
5. Was der Tester am echten iPhone besonders prüfen soll
