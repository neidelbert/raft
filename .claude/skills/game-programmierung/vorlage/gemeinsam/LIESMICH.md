# __TITEL__

Gerüst für ein __ART__-Spiel, angelegt mit `neues-spiel.js` aus dem Skill „game-programmierung“. Es startet sofort:
Ladebildschirm → Titel („Tippen zum Starten“) → Spiel (Daumen links lässt die Figur laufen, die Zeit läuft ab, Punkte gibt es für den Weg) → Ende mit Rekord → Tippen für eine neue Runde. Oben rechts ist der Ton-Knopf. Die Spielregel ist nur ein Platzhalter.

## Ausprobieren
```bash
python3 -m http.server 8000      # in diesem Ordner, dann im Browser: http://localhost:8000/
node tests/__NAME__-test.js      # eigener Test (Playwright), muss „Alle Prüfungen bestanden.“ melden
```
Am iPhone: Ordner auf GitHub Pages legen (kein Build-Schritt nötig) und die Adresse in Safari öffnen.

## Was wo liegt
| Ort | Inhalt |
|---|---|
| `index.html`, `stil.css` | Seite, Ladebildschirm, Tafeln, Ton-Knopf, Joystick-Feld |
| `js/main.js` | Datenfluss (Kommentar oben), Zustände `laden → titel → spiel → ende`, Hauptschleife |
| `js/config/` | alle Zahlen mit Kommentar: `spiel.js` (Zeit, Laden, Speicher, Runde), `steuerung.js` (Joystick, Ton, Klänge), `welt.js` (Spieler, Farben, 3D: Kamera, Licht) |
| `js/regeln/` | Spielregeln ohne Browser (`spieler.js`, `runde.js`), im Test mit Node geprüft |
| `js/welt/darstellung.js` | Zeichnen (2D: Canvas, 3D: Three.js); die einzige Datei, die sich zwischen 2D und 3D unterscheidet (dazu `config/welt.js`) |
| `js/oberflaeche/` | HTML-Anzeige (Tafeln, Leiste, Ladebalken) und Joystick-Anzeige |
| `js/kern/` | unveränderte Kopien der geprüften Bausteine des Skills (nicht hier ändern, sondern im Skill samt Test) |
| `js/test-schnittstelle.js` | `window.spiel` nur zum Lesen für Tests, mit `?test=1` dazu `spiel.test` |
| `grafik/` | Bilder des Zeichners (PNG + `grafik.json`); das Beispiel-Bild ist ein Platzhalter |
| `assets/quellen/` | Quellen der Assets: `atlas.json`, `sounds.json`, `manifest.json`, 3D: `modelle/` |
| `assets/` | erzeugte Dateien (nie von Hand ändern) und das Manifest `assets.json` |
| `tests/` | `__NAME__-test.js` und `test-hilfe.js` (Kopie aus dem Skill) |
| `SCHULDEN.md` | technische Schulden (was, warum, Aufwand) |

## Nächste Schritte
1. **Spielidee festhalten:** Was ist das Ziel, was macht der Daumen, wann ist die Runde vorbei? Nur bauen, was im Auftrag steht.
2. **Assets:** Bilder des Zeichners nach `grafik/` (er liefert `grafik.json` mit), in `assets/quellen/atlas.json` eintragen (Gruppen, Anker = Fußpunkt, Animationen), dann die Werkzeuge in dieser Reihenfolge:
   ```bash
   W=__WERKZEUGE__        # Werkzeug-Ordner des Skills, von hier aus gesehen
   node $W/atlas.js .     # Atlas und Einzelbilder aus grafik/
   node $W/sounds.js .    # Sounds aus Rezepten (braucht ffmpeg)
   node $W/modell.js .    # 3D-Modelle (2D: „nichts zu tun“)
   node $W/manifest.js .  # immer zuletzt: assets/assets.json, Version, Budget
   ```
   `sounds.js` braucht ffmpeg und macht aus `assets/quellen/sounds.json` die Datei `assets/sounds/start.m4a` (und `.mp3`); dann spielt das Spiel sie statt des Code-Klangs `KLAENGE.start`. 3D: `modell.js` macht aus `assets/quellen/modelle/spieler.js` die Datei `spieler.glb`; dann steht das Modell statt der Ersatz-Box da. `manifest.js` meldet das Budget (Startpaket unter 2 MB).
3. **Spielregeln:** neue Regeln in `js/regeln/` (ohne Browser, mit Node testbar), Zahlen in `js/config/`, Zeichnen in `js/welt/`. `js/regeln/runde.js` ersetzen.
4. **Test:** `tests/__NAME__-test.js` für jede neue Regel erweitern, dann eine Gegenprobe (absichtlich kaputte Kopie, `ORDNER=<kopie> node tests/__NAME__-test.js` muss rot werden). Bildschirmfoto ansehen.
5. **Bericht:** Was gebaut wurde, Testergebnis, Startwerte zum Ausprobieren, was am echten iPhone zu prüfen ist, offene Fragen. Schulden in `SCHULDEN.md`.

Mehr im Handbuch des Skills (`SKILL.md`, Wissen in `wissen/`): Aufbau, iPhone, Assets, Testen.
