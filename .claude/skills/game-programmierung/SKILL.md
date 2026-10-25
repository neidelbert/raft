---
name: game-programmierung
description: Horsts Handbuch für Handy-Browserspiele (2D Canvas oder 3D Three.js, iPhone-Safari, GitHub Pages, ohne Build). Immer verwenden, wenn Code für ein Spiel geschrieben, geändert, erweitert, getestet oder repariert wird, auch bei kleinen Änderungen.
---

# Horsts Handbuch

Ziel: Jedes Spiel startet beim ersten Mal ohne Fehler, läuft flüssig auf dem iPhone, fühlt sich gut an und bricht nichts, was schon lief.

## Vor jeder Aufgabe (in dieser Reihenfolge)
1. `wissen/lernbuch.md` (die neuesten Einträge) und `wissen/haltung.md` lesen. Im Lernbuch stehen Fehler, die schon passiert sind; die Regeln daraus stehen auch in den Wissensdateien.
2. `PROJEKT.md` und den Auftrag lesen: Was genau, was nicht, wann fertig?
3. Den vorhandenen Code des Spiels ansehen. Nichts doppelt bauen.
4. Die Bausteine-Tabelle unten ansehen: Was gibt es schon geprüft?
5. Die passenden Wissensdateien lesen (Tabelle unten).
6. Bei echter Unklarheit eine kurze Frage an den Spiel-Leiter. Kleinigkeiten entscheidet Horst selbst (siehe „Selbst entscheiden“).

## Wissen
| Datei | Wann lesen |
|---|---|
| `wissen/lernbuch.md` | immer, zuerst: Verlauf aller Fehler mit Regel (neue Einträge unten) |
| `wissen/haltung.md` | immer: wie Horst denkt und arbeitet (Eigenschaften und Fähigkeiten der besten Entwickler) |
| `wissen/aufbau.md` | jedes neue Spiel, jede neue Datei: Ordner, Bausteine einbauen, Hauptschleife, Zustände, Speichern |
| `wissen/iphone-browser.md` | immer: Touch, Safari-Eigenheiten, Bildschirm, Leistung und Speicher |
| `wissen/canvas-2d.md` | 2D-Spiele: Zeichnen, Kamera, viele Gegner, Kollision, Bewegung |
| `wissen/threejs-3d.md` | 3D-Spiele: Three.js laden, Renderer, Zeichenaufrufe, Kamera, Modelle |
| `wissen/spielgefuehl.md` | alles, was der Spieler sieht und spürt: Rückmeldung, Wackeln, Partikel, Schwierigkeit |
| `wissen/grafik-und-sound.md` | Bilder vom Zeichner einbinden, Ersatzbilder, Ton per Code |
| `wissen/testen.md` | jeder Auftrag: eigener Test mit `werkzeuge/test-hilfe.js`, Gegenprobe, Messen |

## Bausteine (geprüft, wiederverwendbar)
In `bausteine/` liegen zwölf Module aus den Übungen, jedes mit Kopfkommentar (wofür, Schnittstelle, Beispiel) und eigenem Test. **Erst nachsehen, dann bauen:** Was ein Baustein kann, wird nicht neu geschrieben.

| Baustein | Wann nutzen |
|---|---|
| `bausteine/schleife.js` | jedes Spiel (2D und 3D): Hauptschleife, Delta-Zeit gedeckelt, Pause bei verstecktem Tab, kein Zeitsprung |
| `bausteine/bildschirm.js` | jedes 2D-Spiel: scharfer Vollbild-Canvas, Pixel-Ratio ≤ 2, Drehen und Safari-Leiste |
| `bausteine/joystick.js` | Laufen oder Fahren per Daumen (schwebend, ein Finger, Loslassen und Abbruch setzen alles zurück) |
| `bausteine/knopf.js` | jeder Bildschirm-Knopf (Springen, Ton, Pause): löst beim Aufsetzen aus, auch per Tastatur |
| `bausteine/zufall.js` | alles Zufällige; `?seed=42` macht Tests wiederholbar |
| `bausteine/speicher.js` | Rekord, Einstellungen, Fortschritt: Standardwerte, kaputte Daten, privater Modus, nur bei Änderung schreiben |
| `bausteine/pool.js` | viele gleiche Dinge (Gegner, Schüsse): fester Vorrat aus Float64Arrays, keine neuen Objekte |
| `bausteine/gitter.js` | Kollision ab etwa 50 Objekten: Nachbarsuche ohne neue Objekte |
| `bausteine/partikel.js` | Funken bei Einsammeln, Treffer, Explosion (braucht `pool.js`) |
| `bausteine/ton.js` | Klänge per WebAudio ohne Dateien, erst nach der ersten Berührung |
| `bausteine/bilder.js` | Bilder aus `grafik/grafik.json` laden, Ersatz bei fehlendem Bild, rot einfärben |
| `bausteine/zustaende.js` | Spielablauf (Titel → Spiel → Ende) und Verhalten von Gegnern |

- **Einbauen:** Datei unverändert ins Spiel kopieren (`spiele/<name>/js/kern/…`, Ordner siehe `wissen/aufbau.md`). Ein Spiel auf GitHub Pages kann nicht aus `.claude/` laden. Den Kopfkommentar behalten.
- **Ändern:** Braucht ein Spiel mehr, wird der Baustein hier verbessert, sein Test erweitert und `node bausteine/tests/alle.js` grün, dann neu kopiert. Keine stillen Abweichungen in der Kopie.
- **Tests:** `node .claude/skills/game-programmierung/bausteine/tests/alle.js` (alle, mit Browser-Tests auf den Ports 8880–8889). `node .claude/skills/game-programmierung/bausteine/tests/gegenprobe.js` baut jeden Baustein absichtlich kaputt und zeigt, dass sein Test rot wird.

## Grundregeln
- **Technik:** reine ES-Module, kein Build, keine npm-Pakete im Spiel. 2D mit Canvas 2D, 3D mit Three.js `0.170.0` per Import-Map. Andere Bibliotheken sind eine Technik-Entscheidung für Lukas.
- **Ort:** jedes Spiel in `spiele/<name>/`, Tests in `tests/<name>/`. Läuft über GitHub Pages unter `neidelbert.github.io/raft/spiele/<name>/`.
- **Namen:** Deutsch, ohne Umlaute im Code (`groesse`, `gegner`). Dateien klein mit Bindestrich. Konstanten-Objekte GROSS.
- **Zahlen** gehören nach `js/config/`, nie verstreut in die Logik. Jede Zahl bekommt einen Kommentar.
- **Eine Datei, eine Aufgabe.** Dateien über etwa 300 Zeilen werden aufgeteilt. Regeln (Rechnen) und Zeichnen in getrennten Funktionen, Regeln ohne DOM, damit `node` sie testen kann.
- **Zeit:** Jede Bewegung rechnet mit Delta-Zeit, gedeckelt auf 0,1 s (`bausteine/schleife.js`). Nie pro Bild zählen. Weiches Nachziehen mit `1 - Math.exp(-tempo * dt)`.
- **Touch zuerst.** Maus und Tastatur nur als Zusatz, damit man am PC testen kann. Loslassen, Abbruch und Tab-Wechsel setzen jede Eingabe zurück.
- **Speicherstand** nie kaputt machen: neue Felder bekommen Standardwerte, `version` hochzählen, alte Stände umwandeln, Schlüssel nie ändern.
- **Hauptschleife ohne neuen Speicher:** keine neuen Objekte, Arrays, Strings oder `Math.hypot` pro Objekt und Bild; viele gleiche Dinge in Float64Arrays (`bausteine/pool.js`).
- **Test-Schnittstelle:** `window.spiel = { bereit, … }` nur zum Lesen für Tests, in einer eigenen Datei. Der Spielcode liest sie nie. Hilfen zum Testen (`window.spiel.test`) nur mit `?test=1`.

## Selbst entscheiden (ohne Rückfrage)
- Wie etwas gebaut wird: Aufteilung in Dateien, Namen, Muster aus `wissen/aufbau.md`, welche Bausteine.
- Fehlende Zahlen: sinnvoller Startwert in `js/config/` mit Kommentar „Wert für Lukas zum Testen“, im Bericht auflisten.
- Fehler im eigenen Code, die beim Bauen auffallen, behebt Horst und nennt sie im Bericht.

## Nicht selbst entscheiden (an den Spiel-Leiter)
- Alles, was nicht im Auftrag steht, auch wenn es klein ist (Pause-Tafel, Anzeige, Verhalten am Rand). Als Frage in den Bericht und in `SCHULDEN.md`.
- Neue Bibliothek, Build-Schritt, Server, anderes Speicherformat.
- Spielgefühl, das deutlich anders wird als beschrieben.

## Arbeitsweise
1. Datenfluss aufschreiben (oben in `main.js`): Eingabe → Zustand → Regeln → Zeichnen → Speichern.
2. Gerüst zuerst: Seite mit Bausteinen (Schleife, Bildschirm, Steuerung) startet ohne Fehler, `window.spiel.bereit` ist gesetzt.
3. Dann eine Funktion nach der anderen: bauen → Test erweitern → Test grün → weiter.
4. Nie fünf Dinge auf einmal ändern. Ist ein Test rot, erst fragen: Ist der Test richtig? Dann reparieren.
5. Bleibt ein Fehler hartnäckig: Ursache eingrenzen (Konsole, `window.spiel` auslesen, Bildschirmfoto mit `seite.screenshot`, dann das Bild ansehen). Raten und blind ändern bringt nichts. Eine Meldung kann mehrere Ursachen haben: nach dem ersten Fund weitersuchen. Nach drei erfolglosen Anläufen an den Spiel-Leiter melden, was genau fehlschlägt.
6. Gegenprobe: den Test einmal gegen absichtlich kaputten Code laufen lassen. Bleibt er grün, taugt er nichts.
7. Zum Schluss den eigenen Code lesen, als wäre er von jemand anderem: toter Code, verstreute Zahlen, Speicher-Lecks, fehlender Reset beim Loslassen und beim Zustandswechsel?

## Fertig-Checkliste
- [ ] Startet ohne Konsolenfehler (geprüft per Test, mit und ohne `?test=1`)
- [ ] Jede Zeile aus „Fertig, wenn“ des Auftrags ist im Test geprüft
- [ ] Touch geprüft: Ziehen, Tippen, Loslassen und Abbruch (Bewegung hört auf), zweiter Finger stört nicht
- [ ] Tab-Wechsel: Pause, kein Sprung danach, Eingabe gelöst, gespeichert
- [ ] Pixel-Ratio höchstens 2, Delta-Zeit gedeckelt, keine neuen Objekte in der Hauptschleife
- [ ] Zahlen in `js/config/`, Spieltexte Deutsch mit „…“
- [ ] Bildschirmfoto angesehen: sieht es aus wie gewollt?
- [ ] Gegenprobe gemacht: Test wird gegen absichtlich kaputten Code rot
- [ ] `bash tests/alle-tests.sh` grün (das Alte läuft weiter)
- [ ] Eigenes Code-Review gemacht (Fehler → Leistung → Wartbarkeit → Stil, siehe `wissen/haltung.md`)
- [ ] Technische Schulden in `spiele/<name>/SCHULDEN.md` eingetragen
- [ ] Gelerntes ins Lernbuch eingetragen und die Regel in die passende Wissensdatei übernommen
- [ ] Git-Commit mit deutscher Nachricht

## Übergabebericht (`berichte/JJJJ-MM-TT-<spiel>-<auftrag>.md`)
Für Lukas geschrieben: erst das Ergebnis, ohne Fachwörter. Was nicht geklappt hat, steht ehrlich vorne.
1. Was wurde gebaut? (dazu die Schritte, in die Horst die Aufgabe zerlegt hat)
2. Welche Dateien wurden geändert?
3. Testergebnis (Zahl der Prüfungen, Gegenprobe, was nicht automatisch prüfbar ist)
4. Startwerte für Lukas zum Testen (Name, Wert, Datei)
5. Was der Tester am echten iPhone besonders prüfen soll
6. Fragen an Lukas (alles, was nicht im Auftrag stand)
