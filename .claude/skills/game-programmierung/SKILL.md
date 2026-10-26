---
name: game-programmierung
description: Horsts Handbuch für Handy-Browserspiele (2D Canvas oder 3D Three.js, iPhone-Safari, GitHub Pages, ohne Build), mit geprüften Bausteinen, Asset-Werkzeugen (Atlas, Sounds, Modelle, Manifest) und dem Gerüst-Werkzeug neues-spiel.js. Immer verwenden, wenn ein Spiel angelegt oder Code für ein Spiel geschrieben, geändert, erweitert, getestet oder repariert wird, auch bei kleinen Änderungen.
---

# Horsts Handbuch

Ziel: Jedes Spiel startet beim ersten Mal ohne Fehler, läuft flüssig auf dem iPhone, fühlt sich gut an und bricht nichts, was schon lief.
Alles, was dieses Handbuch braucht, liegt in seinem Ordner. Im Folgenden heißt dieser Ordner `<skill>` (in Claude Code meist `.claude/skills/game-programmierung`), das Spiel `<spiel>` (z. B. `spiele/stern-jagd`, der Ordnername ist der Spielname).

## Mindestens lesen (vor dem ersten Code)
| Auftrag | Pflicht | Dazu, wenn es vorkommt |
|---|---|---|
| jeder | dieses Handbuch bis „Bausteine“, `wissen/lernbuch.md` (die letzten 10 Einträge), `wissen/testen.md` | – |
| neues Spiel | dazu `<spiel>/LIESMICH.md` nach dem Gerüst, `wissen/assets.md` (Kette, Bilder, Prüfen) | 3D: `wissen/threejs-3d.md`; viele Gegner, Kollision: `wissen/canvas-2d.md` |
| Regel oder Effekt im Spiel | dazu `wissen/aufbau.md` (Zustände, Speichern) | Rückmeldung, Partikel, Wackeln: `wissen/spielgefuehl.md`; Touch, Safari, Leistung: `wissen/iphone-browser.md` |
| Fehler beheben | dazu den Fehlerbericht und den Abschnitt „Fehleranalyse“ in `wissen/haltung.md` | die Wissensdatei des betroffenen Teils |

`wissen/haltung.md` ganz lesen, sobald Zeit ist (einmal pro Sitzung reicht). Die Wissensdateien sind Nachschlagewerk, keine Pflichtlektüre: Das Gerüst und die Bausteine setzen ihre Regeln schon um.

## Neues Spiel in 5 Schritten
1. **Gerüst:** `node <skill>/werkzeuge/neues-spiel.js <spiel> [--3d] [--port 9000] [--titel "Stern-Jagd"]`, dann `node <spiel>/tests/<name>-test.js` → „Alle Prüfungen bestanden.“ Das Gerüst läuft sofort: Ladebildschirm → Titel → Spiel (Joystick, Punkte, Zeit) → Ende mit Rekord, Ton-Knopf, Speicher, Ersatz für fehlende Assets. `<spiel>/LIESMICH.md` erklärt jede Datei.
   **Port:** je Spiel ein Zehnerblock ab 9000. Ohne `--port` nimmt das Werkzeug den ersten Block, den kein Spiel im selben Ordner schon nutzt (es meldet ihn). Hat das Projekt eine Port-Liste (z. B. `TEAM.md`), dort den Block eintragen; ohne Liste reicht die Meldung. Die Bausteine nutzen 8880–8889.
2. **Assets:** Bilder des Zeichners nach `<spiel>/grafik/` (mit `grafik.json`, darin der Fußpunkt `anker` in PNG-Pixeln, von `render.js` aus dem SVG umgerechnet), eintragen in `assets/quellen/atlas.json` (Gruppen, Animationen; `anker` dort nur zum Überschreiben), Klänge in `sounds.json`, 3D-Modelle in `modelle/`; dann Werkzeuge atlas → sounds → modell → manifest (Kapitel „Assets“ unten). Das Spiel lädt nur, was im Manifest steht.
3. **Spielregeln:** in `js/regeln/` ohne DOM (mit Node testbar), jede Zahl in `js/config/` mit Kommentar, Zeichnen in `js/welt/darstellung.js`. Erst in den Bausteinen nachsehen (Tabelle unten, Kopien in `js/kern/`). Eine Regel nach der anderen, jede mit Test.
4. **Test:** `<spiel>/tests/<name>-test.js` um jede Zeile aus „Fertig, wenn“ erweitern (`wissen/testen.md`), Gegenprobe mit kaputter Kopie (`ORDNER=<kopie>` muss rot werden), Bildschirmfoto ansehen, Fertig-Checkliste abhaken.
5. **Bericht:** Übergabebericht (Aufbau unten), Schulden in `<spiel>/SCHULDEN.md`, Gelerntes ins Lernbuch (in einer Probe ohne eigenes Projekt: in den Bericht, das Lernbuch pflegt der Besitzer des Skills). Melden: „bereit zum Testen“.

**Bilder: ein Weg.** Im Spiel kommen Bilder immer über das Manifest: `grafik/` → `atlas.js` → Atlas → `ladeAssets` (`bausteine/assets.js`) → `zeichneRahmen` (`bausteine/animation.js`). `grafik/grafik.json` ist nur die Eingabe für `atlas.js`, das Spiel liest sie nie. Aus `bausteine/bilder.js` braucht ein Spiel nur `ersatzBild` (Ersatz-Zeichnung) und `faerbeEin` (Aufblitzen); `ladeBilder` ist für Versuche ohne Asset-Kette.
**Platzhalter:** Das Beispiel-Bild des Gerüsts (`grafik/figuren/figur.png`, in `grafik.json` mit `"platzhalter": true`) ersetzt der Zeichner. Zeichnet er `quellen/figuren/figur.svg`, wird es überschrieben; heißt seine Figur anders, löscht `render.js` den Platzhalter, und Horst stellt `SPIELER.rahmen` in `js/config/welt.js` um (fehlt der Rahmen, zeichnet das Gerüst die Ersatz-Figur und warnt in der Konsole).
**Größe bestellen:** Im Auftrag an den Zeichner die Größe im Spiel in Punkten nennen (Figur 60 Punkte hoch → Bild 120 px). Standard: 256 px → 128 Punkte bei `SPIELER.skala` 0,5. Ist die Größe nicht vorgegeben: Frage an Lukas (Spielgefühl).

## Vor jeder Aufgabe (in dieser Reihenfolge)
1. Die Pflicht aus „Mindestens lesen“ (oben), zuerst die neuesten Einträge in `wissen/lernbuch.md`. Im Lernbuch stehen Fehler, die schon passiert sind; die Regeln daraus stehen auch in den Wissensdateien.
2. Die Projektdatei (falls das Projekt eine hat) und den Auftrag lesen: Was genau, was nicht, wann fertig?
3. Den vorhandenen Code des Spiels ansehen. Nichts doppelt bauen.
4. Die Bausteine-Tabelle unten ansehen: Was gibt es schon geprüft?
5. Die passenden Wissensdateien nachschlagen (Spalte „Dazu, wenn es vorkommt“ oben, Tabelle unten).
6. Bei echter Unklarheit eine kurze Frage an den Auftraggeber (Spiel-Leiter). Kleinigkeiten entscheidet Horst selbst (siehe „Selbst entscheiden“).

## Wissen
| Datei | Wann lesen |
|---|---|
| `wissen/lernbuch.md` | immer, zuerst: Verlauf aller Fehler mit Regel (neue Einträge unten) |
| `wissen/haltung.md` | einmal pro Sitzung: wie Horst denkt und arbeitet (Eigenschaften und Fähigkeiten der besten Entwickler) |
| `wissen/aufbau.md` | jedes neue Spiel, jede neue Datei: Ordner, Bausteine einbauen, Hauptschleife, Zustände, Speichern |
| `wissen/iphone-browser.md` | bei Touch, Safari-Eigenheiten, Bildschirm, Leistung und Speicher (vor der Abgabe überfliegen) |
| `wissen/canvas-2d.md` | 2D-Spiele: Zeichnen, Kamera, viele Gegner, Kollision, Bewegung |
| `wissen/threejs-3d.md` | 3D-Spiele: Three.js laden, Renderer, Zeichenaufrufe, Kamera, Modelle |
| `wissen/spielgefuehl.md` | alles, was der Spieler sieht und spürt: Rückmeldung, Wackeln, Partikel, Schwierigkeit |
| `wissen/grafik-und-sound.md` | Bilder vom Zeichner einbinden, Ersatzbilder, Ton per Code |
| `wissen/assets.md` | Spiele mit Assets: Atlas, Rahmen-Animation, Sound-Dateien, Schriften, 3D-Modelle, Manifest, Ladebildschirm, Budget |
| `wissen/testen.md` | jeder Auftrag: eigener Test mit der Test-Hilfe (`test-hilfe.js`), Gegenprobe, Messen |

## Werkzeuge
Alle im Ordner `werkzeuge/` dieses Skills, mit Node aufzurufen, die Asset-Werkzeuge mit dem Spielordner. Jedes hat oben einen Kopfkommentar mit Aufruf-Beispiel und lässt sich auch aus Code nutzen (`require`).

| Werkzeug | macht | aus |
|---|---|---|
| `neues-spiel.js` | startfähiges Gerüst (2D oder mit `--3d` Three.js) samt Bausteinen, Test, Test-Hilfe, Beispiel-Bild (Platzhalter), Start-Sound, Manifest; wählt den Port; überschreibt nichts | `vorlage/` und `bausteine/` dieses Skills |
| `atlas.js` | Atlas-PNG + JSON (Rahmen mit Anker aus `grafik.json`, Animationen aus `<name>-<nr>`, 2 px Abstand mit Randverlängerung, ≤ 2048 px) und Einzelbilder | `grafik/` des Zeichners + `assets/quellen/atlas.json` |
| `sounds.js` | `.m4a` (AAC) und `.mp3` per ffmpeg | Rezepten in `assets/quellen/sounds.json` |
| `modell.js` | `.glb` (GLTFExporter im kopflosen Chromium); ohne Quellen „nichts zu tun“ | `assets/quellen/modelle/<name>.js` |
| `manifest.js` | `assets/assets.json` mit Version (Fingerabdruck) und Größen; meldet das Budget, Rückgabewert 1 bei Überschreitung | allem in `assets/` |
| `png.js` | PNG lesen und schreiben ohne Pakete (Hilfe für `atlas.js` und `neues-spiel.js`) | – |
| `test-hilfe.js` | Server + Chromium in iPhone-Ansicht, Touch (`ziehe`, `tippe`, `laufeZu`: Figur per Joystick zum Ziel), Konsolenfehler, Three.js lokal; jedes Gerüst hat eine Kopie in `tests/` | – |
| `paket.js` | `dist/game-programmierung.zip`, `dist/zeichnen.zip` (Zeichner-Skill daneben) und `dist/INSTALLIEREN.md` zum Weitergeben | diesem Skill-Ordner |

**Gerüst verbessern:** in `vorlage/` (`gemeinsam/` für beide Arten, `2d/`, `3d/`; Platzhalter `__NAME__`, `__TITEL__`, `__PORT__`), dann `node <skill>/bausteine/tests/geruest-test.js` grün. Einmal auch mit einem echten Bild des Zeichners (256 px, `render.js`) ausprobieren: Grenzen dürfen nicht nur zum Platzhalter passen (Lernbuch Stufe 10). Spiele, die schon angelegt sind, ändern sich dadurch nicht.

Brauchen: Node 18+, Playwright mit Chromium (`require('playwright')`), python3 (Testserver); ffmpeg nur für `sounds.js`; für 3D-Tests einmal npm mit Netz (holt Three.js 0.170.0 in den Temp-Ordner, weil das CDN im Test umgeleitet wird).

## Assets (Bilder, Animationen, Sounds, Schriften, Modelle)
Einzelheiten und Gründe: `wissen/assets.md`. Kurz:
- **Kette:** `grafik/` (Zeichner) und `assets/quellen/` → Werkzeuge → `assets/atlas|bilder|sounds|modelle` → `manifest.js` → `assets/assets.json`. Ausgeliefert wird nur Erzeugtes, nie von Hand ändern. Nach jeder Änderung an Quellen neu erzeugen und mit einchecken (GitHub Pages hat keinen Build-Schritt).
  ```bash
  W=<skill>/werkzeuge
  node $W/atlas.js <spiel> && node $W/sounds.js <spiel> && node $W/modell.js <spiel> && node $W/manifest.js <spiel>
  ```
  `sounds.js` braucht ffmpeg (ohne Sound-Rezepte weglassen), `modell.js` meldet in 2D „nichts zu tun“.
- **Laden:** `ladeAssets` (`bausteine/assets.js`) mit Ladebalken, Zeitgrenze je Asset (Gerüst 4 s: Manifest + Asset höchstens 8 s), Ersatz für alles (Bild → Farbe, Atlas → Code-Zeichnung über `ersatz()`, Sound → Code-Klang gleichen Namens, Schrift → Systemschrift, Modell → Box). Ton und Sounds erst nach „Tippen zum Starten“.
- **Bilder:** doppelt aufgelöst (Skala 0,5), PNG für Figuren, WebP für große Flächen, Atlas ≤ 2048 px, Bildspeicher (Breite × Höhe × 4) unter 60 MB, Startpaket unter 2 MB. Rahmen-Animation mit `bausteine/animation.js` nach Zeit, um den Fußpunkt.
- **Prüfen:** Test mit fehlender Datei (404), hängender Datei und hängendem Manifest: Seite läuft mit Ersatz. Der Gerüst-Test zeigt, wie.

## Bausteine (geprüft, wiederverwendbar)
In `bausteine/` liegen vierzehn Module aus den Übungen, jedes mit Kopfkommentar (wofür, Schnittstelle, Beispiel) und eigenem Test. **Erst nachsehen, dann bauen:** Was ein Baustein kann, wird nicht neu geschrieben.

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
| `bausteine/bilder.js` | Ersatz-Zeichnung (`ersatzBild`) und rot einfärben (`faerbeEin`); `ladeBilder` nur für Versuche ohne Manifest (Spiele laden über den Atlas) |
| `bausteine/zustaende.js` | Spielablauf (Titel → Spiel → Ende) und Verhalten von Gegnern |
| `bausteine/assets.js` | alles aus `assets/assets.json` laden: Fortschritt für den Ladebalken, Zeitgrenze je Asset, Ersatz, Atlanten, Sounds dekodieren (nach der ersten Berührung), Schriften, Modelle |
| `bausteine/animation.js` | Rahmen-Animation aus dem Atlas mit Delta-Zeit (Schleife oder einmal mit „fertig“), Zeichnen um den Fußpunkt, gespiegelt |

- **Einbauen:** `neues-spiel.js` kopiert alle Bausteine unverändert nach `<spiel>/js/kern/`. Später dazukommende genauso kopieren (ein Spiel auf GitHub Pages kann nicht aus `.claude/` laden), Kopfkommentar behalten.
- **Ändern:** Braucht ein Spiel mehr, wird der Baustein hier verbessert, sein Test erweitert und `node <skill>/bausteine/tests/alle.js` grün, dann neu kopiert. Keine stillen Abweichungen in der Kopie.
- **Tests:** `node <skill>/bausteine/tests/alle.js` (alle Bausteine mit Browser-Tests auf den Ports 8880–8889, dazu die Werkzeuge, das Gerüst 2D und 3D und das Paket). `node <skill>/bausteine/tests/gegenprobe.js` baut Bausteine, Werkzeuge und Vorlagen absichtlich kaputt und zeigt, dass ihr Test rot wird.

## Grundregeln
- **Technik:** reine ES-Module, kein Build, keine npm-Pakete im Spiel. 2D mit Canvas 2D, 3D mit Three.js `0.170.0` per Import-Map. Andere Bibliotheken sind eine Technik-Entscheidung für Lukas.
- **Ort:** jedes Spiel in einem eigenen Ordner (`spiele/<name>/`), sein Test in `spiele/<name>/tests/`. Läuft über GitHub Pages unter `<benutzer>.github.io/<repo>/spiele/<name>/`.
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
2. Gerüst zuerst (`neues-spiel.js`): Seite startet ohne Fehler, `window.spiel.bereit` ist gesetzt, der Gerüst-Test ist grün.
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
- [ ] Assets nur über das Manifest; `manifest.js` ohne Budget-Überschreitung; Test mit fehlender und mit hängender Datei, je für Bild, Sound (und 3D Modell) (Seite läuft mit Ersatz)
- [ ] Bildschirmfoto angesehen: sieht es aus wie gewollt?
- [ ] Gegenprobe gemacht: Test wird gegen absichtlich kaputten Code rot
- [ ] Alle Tests des Projekts grün (das Alte läuft weiter; gibt es einen Gesamttest, den)
- [ ] Eigenes Code-Review gemacht (Fehler → Leistung → Wartbarkeit → Stil, siehe `wissen/haltung.md`)
- [ ] Technische Schulden in `<spiel>/SCHULDEN.md` eingetragen
- [ ] Gelerntes ins Lernbuch eingetragen und die Regel in die passende Wissensdatei übernommen
- [ ] Git-Commit mit deutscher Nachricht (wenn der Auftrag es verlangt)

## Übergabebericht
Als Datei dort, wo das Projekt Berichte ablegt (sonst `<spiel>/BERICHT.md`), Name mit Datum, Spiel und Auftrag. Für Lukas geschrieben: erst das Ergebnis, ohne Fachwörter. Was nicht geklappt hat, steht ehrlich vorne.
1. Was wurde gebaut? (dazu die Schritte, in die Horst die Aufgabe zerlegt hat)
2. Welche Dateien wurden geändert?
3. Testergebnis (Zahl der Prüfungen, Gegenprobe, was nicht automatisch prüfbar ist)
4. Startwerte für Lukas zum Testen (Name, Wert, Datei)
5. Was der Tester am echten iPhone besonders prüfen soll
6. Fragen an Lukas (alles, was nicht im Auftrag stand)
