# Bericht Stufe 10 – Eigenständiger Skill

## Ergebnis
Mein Handbuch läuft jetzt **ohne mich und ohne dieses Repo**. Wer nur das Paket bekommt, legt mit einem Befehl ein fertiges Spiel-Gerüst an (2D oder 3D), dessen Test sofort grün ist, und liest in `SKILL.md` ganz oben „Neues Spiel in 5 Schritten“. Es ist kein Spiel entstanden. **Bereit zum Testen** (die Prüfung mit einem neuen Programmierer macht der Ausbilder).

Selbst geprüft wie ein Neuer: Paket in einen leeren Ordner unter `/tmp` entpackt, nur damit ein 2D-Gerüst („Stern-Jagd“) und ein 3D-Gerüst („Insel-Lauf“) angelegt: **beide Tests grün (33 und 35 Prüfungen)**. Danach im selben Ordner die Asset-Werkzeuge aus dem Paket laufen lassen (Sound, 3D-Modell, Manifest): Test wieder grün, jetzt mit Modell statt Ersatz-Kiste. Auch alle Baustein-Tests laufen aus dem entpackten Paket (18 Tests, 413 Prüfungen), und das Zeichner-Werkzeug `render.js` aus `zeichnen.zip` wandelt eine Vorlage um.

Ehrlich vorweg:
- Der Gesamttest des Repos (`tests/alle-tests.sh`) sucht Spieltests nur unter `tests/<name>/`. Das Gerüst legt seinen Test aber, wie im Auftrag verlangt, in den Spielordner (`spiele/<name>/tests/`). Für das erste echte Spiel muss `alle-tests.sh` auch `spiele/*/tests/*-test.js` finden. Die Datei gehört dem Spiel-Leiter, darum nicht geändert (Frage unten).
- Ob alles am echten iPhone so aussieht und klingt, ist offen (wie immer: nur im Test-Browser geprüft).

## Was ein Neuer bekommt (`dist/` im Repo)
| Datei | Inhalt |
|---|---|
| `dist/game-programmierung.zip` | mein Skill: Handbuch, Wissen, 14 Bausteine mit Tests, Werkzeuge, Gerüst-Vorlagen (104 Dateien, 0,27 MB) |
| `dist/zeichnen.zip` | Skill des Zeichners mit seinem Werkzeug `render.js` (8 Dateien) |
| `dist/INSTALLIEREN.md` | Claude Code: Ordner nach `.claude/skills/`; Claude.ai: Einstellungen → Fähigkeiten → Zip hochladen; was die Werkzeuge brauchen |

Neu bauen: `node .claude/skills/game-programmierung/werkzeuge/paket.js` (gleiche Dateien ergeben ein byte-gleiches Zip).

## Was das Gerüst kann (`werkzeuge/neues-spiel.js <ordner> [--3d] [--port 9000] [--titel „…“]`)
Sofort spielbar: Ladebildschirm mit Balken → Titel („Tippen zum Starten“, Rekord) → Spiel: Daumen links lässt eine Figur laufen, die Zeit läuft ab, Punkte gibt es für den Weg (nur ein Platzhalter für die echte Regel) → Ende mit Punkten und Rekord → Tippen für eine neue Runde. Oben rechts der Ton-Knopf, Rekord und Ton bleiben gespeichert. In 2D eine gemalte Beispiel-Figur aus dem Atlas, in 3D ein Boden mit Kachel-Bild, eine Kamera schräg von oben und eine Kiste, die zur Figur wird, sobald man das mitgelieferte Modell erzeugt. Fehlt ein Bild oder hängt der Server, läuft es mit Ersatz weiter.

Dazu legt es an: `index.html`, `stil.css`, `js/main.js` mit Datenfluss oben, `js/config/` (jede Zahl kommentiert), alle Bausteine unverändert in `js/kern/`, Spielregeln ohne Browser in `js/regeln/`, `assets/` mit Quellen, Manifest und Beispiel-Bild, `tests/<name>-test.js` plus Test-Hilfe, `SCHULDEN.md`, `LIESMICH.md` mit den nächsten Schritten. 2D und 3D teilen fast alles; anders sind nur die Zeichen-Datei, die Welt-Einstellungen, die Startseite und die Asset-Quellen.

## Schritte, in die ich die Aufgabe zerlegt habe
1. Alles suchen, was aus dem Skill nach draußen zeigt (Test-Hilfe, Übung 9 als Vorbild, ein Bild aus `ausbildung/`, `TEAM.md`, `PROJEKT.md`, `tests/alle-tests.sh`).
2. Test-Hilfe in den Skill kopieren (mit Hinweis, woher), Baustein-Tests darauf umstellen.
3. Gerüst-Vorlagen schreiben (gemeinsam, 2D, 3D), dann das Werkzeug `neues-spiel.js`; 2D-Gerüst angelegt und getestet, dann 3D.
4. Test für das Werkzeug (`geruest-test.js`): legt beide Gerüste in einem leeren Temp-Ordner an und lässt ihre Tests laufen.
5. Paket-Werkzeug `paket.js` mit eigenem Zip-Schreiber (ohne Zusatzpakete) und Test (`paket-test.js`), der das Zip unabhängig liest, entpackt und daraus ein Gerüst baut.
6. `render.js` in den Zeichner-Skill kopiert, sein Handbuch angepasst.
7. `SKILL.md` neu geordnet, Wissen angepasst, Gegenproben ergänzt, Bildschirmfotos angesehen, eigenes Code-Review, Prüfung wie ein Neuer.

## Geänderte Dateien
- **Neu im Skill** (`.claude/skills/game-programmierung/`): `werkzeuge/neues-spiel.js`, `werkzeuge/paket.js`, `werkzeuge/test-hilfe.js` (Kopie), `vorlage/` (gemeinsam, 2d, 3d), `bausteine/tests/geruest-test.js`, `bausteine/tests/paket-test.js`, `bausteine/tests/seite/grafik/boden/wiese.png` (Bild des Zeichners, vorher aus `ausbildung/` gelesen).
- **Geändert im Skill:** `SKILL.md` (5 Schritte oben, Werkzeug-Tabelle, Assets-Kapitel, keine Verweise nach draußen), `wissen/aufbau.md`, `testen.md`, `assets.md`, `threejs-3d.md`, `lernbuch.md`; `werkzeuge/modell.js` (ohne Modell-Quellen „nichts zu tun“ statt Absturz); Tests `browser-hilfe.js`, `werkzeuge-test.js`, `pool-test.js`, `gegenprobe.js`; Aufruf-Kommentare der Werkzeuge (`<skill>/…`).
- **Zeichner-Skill:** `.claude/skills/zeichnen/render.js` (Kopie mit Hinweis), `SKILL.md` (Verweis auf die Kopie).
- **Repo:** `dist/` (neu), dieser Bericht. Nicht geändert: `werkzeuge/test-hilfe.js`, `werkzeuge/zeichner/render.js`, `pruefe-team.js`, `alle-tests.sh`, `PROJEKT.md`.

## Testergebnis
- `node .claude/skills/game-programmierung/bausteine/tests/alle.js`: **18 Tests, 413 Prüfungen bestanden** (neu: Gerüst 20, Paket 13, Werkzeuge 50). Der Gerüst-Test selbst prüft u. a.: Regeln ohne Browser; Start ohne Konsolenfehler mit und ohne `?test=1`; Ladebildschirm zuerst, Fortschritt nur aufwärts; Ton-Knopf startet das Spiel nicht; Joystick bewegt, Loslassen und Abbruch durch Safari stoppen; Tab-Wechsel: Pause, Joystick gelöst, kein Sprung; Runde endet, Rekord gespeichert und nach Neuladen da; kaputter Speicherstand und privater Modus; fehlende Bilder (Ersatz) und hängendes Manifest (nach 4,3 s läuft es); Pixel-Ratio höchstens 2; 3D höchstens 3 Zeichenaufrufe pro Bild.
- **Gegenprobe** (`gegenprobe.js`): **46 von 46** absichtlichen Fehlern werden erkannt, davon 8 neue: Bewegung pro Bild statt nach Zeit, Tab-Wechsel löst den Joystick nicht, Rekord wird nicht gespeichert, keine Ersatz-Figur, 3D-Pixel-Ratio nicht begrenzt, Gerüst ohne Test-Hilfe, Bildschirmfotos im Paket, Zip mit falscher Prüfsumme.
- `node werkzeuge/pruefe-team.js` und `bash tests/alle-tests.sh`: **grün** („Alle Tests bestanden.“, inklusive der Prüfungen 1–9).
- Bildschirmfotos angesehen: 2D (Figur auf grünem Raster, Leiste, Ton-Knopf), 2D mit Ersatz-Figur hinter der Titel-Tafel, 3D mit Kiste und mit Modell auf der Kachel-Wiese. Sehen aus wie gewollt.
- Nicht automatisch prüfbar: Ton und Bildrate am iPhone, Safari-Gesten, ob ein Neuer `SKILL.md` versteht (macht der Ausbilder).

## Was beim Bauen auffiel
1. Die Test-Hilfe suchte den Spielordner immer vom Repo aus. Als Kopie im Skill oder im Spiel hätte sie den falschen Ordner ausgeliefert. Die Kopie nimmt jetzt den Pfad vom Aufrufer; die Tests übergeben ihn fest.
2. Ein Werkzeug-Test las ein Bild aus `ausbildung/` und **übersprang die Prüfung still**, wenn es fehlte. Im Paket wäre sie einfach weggefallen. Das Bild liegt jetzt im Skill, die Prüfung läuft immer.
3. `modell.js` stürzte in einem 2D-Spiel ohne Modell-Quellen ab, mitten in der Werkzeug-Kette aus `LIESMICH.md`. Jetzt meldet es „nichts zu tun“.
4. Die Team-Prüfung liest Pfade im Handbuch vom Repo aus; ein Pfad wie `werkzeuge/neues-spiel.js` wäre dort rot gewesen. Im Handbuch steht darum `<skill>/werkzeuge/…`.
5. In einer alten Gegenprobe („Pool über der Grenze“) hing der Test 4 Minuten statt rot zu melden. Schleife im Test begrenzt (Pfadfinder-Regel). Bei „keine Zeitgrenze“ im Assets-Test ist das noch so (Schuld unten).

## Startwerte für Lukas zum Testen (im Gerüst, `js/config/`)
| Name | Wert | Datei | Bedeutung |
|---|---|---|---|
| `RUNDE.dauer` | 20 s | `spiel.js` | Länge einer Runde (Platzhalter-Regel) |
| `LADEN.zeitgrenze` | 4000 ms | `spiel.js` | so lange wird auf eine Datei gewartet, dann Ersatz |
| `SPIELER.tempo` | 2D 220 Punkte/s, 3D 5 m/s | `welt.js` | Tempo bei vollem Daumen |
| `SPIELER.wegProPunkt` | 2D 60 Punkte, 3D 1,5 m | `welt.js` | Weg für einen Punkt |
| `KAMERA.hoehe` / `abstand` | 11 m / 9 m | `welt.js` (3D) | Blick schräg von oben |
| `JOYSTICK.radius` | 50 Punkte | `steuerung.js` | Daumenweg bis zum vollen Ausschlag |
| `KLAENGE.start` / `ende` | 440 Hz steigend / 330 Hz fallend | `steuerung.js` | Klänge per Code, bis es Sound-Dateien gibt |

## Was der Tester am echten iPhone prüfen soll
1. Gerüst 2D und 3D über GitHub Pages öffnen: Ladebalken, „Tippen zum Starten“, Figur läuft mit dem Daumen, bleibt beim Loslassen stehen.
2. Start- und Ende-Klang hörbar (Stummschalter aus), Ton-Knopf schaltet sie ab, nach Neuladen bleibt es so.
3. App wechseln und zurück: Spiel steht still, Figur läuft nicht von allein weiter.
4. 3D: flüssig, Boden scharf, kein Flimmern am Schatten.

## Fragen an Lukas
1. Soll `tests/alle-tests.sh` auch die Tests im Spielordner finden (`spiele/*/tests/*-test.js`)? Sonst läuft der Test eines neuen Spiels im Gesamttest nicht mit.
2. Gleiche Frage wie in Stufe 9, jetzt im Gerüst: Ende-Tafel eine halbe Sekunde kein Tippen annehmen (sonst startet ein Finger, der gerade noch lief, sofort die nächste Runde)?
3. Das Gerüst legt die Test-Hilfe in den Spielordner, sie wird damit auf GitHub Pages mit ausgeliefert (harmlos, nur eine Datei). In Ordnung, oder lieber unter `tests/<name>/` im Repo?

## Schulden
- Assets-Test: Die Gegenprobe „keine Zeitgrenze“ wird rot, weil der Test nach 4 Minuten abgebrochen wird, nicht durch eine rote Prüfung. Aufwand klein (Wartezeit im Test begrenzen).
- `zeichnen/render.js` und `werkzeuge/zeichner/render.js` sind zwei Kopien. `paket.js` warnt, wenn sie auseinanderlaufen. Aufwand klein (eine Kopie streichen, wenn der Zeichner nur noch den Skill nutzt).
