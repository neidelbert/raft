# Technik-Vorlage: Ordnerstruktur für das Spiel

Von: Techniker · An: Leiter (für das Postfach, Art „Technik“) · Datum: 24.10.2026
Stand: **Vorschlag, nicht freigegeben.** Es wurde nichts angelegt.

---

- **Frage:** Wie ordnen wir die Spieldateien im GitHub-Projekt `neidelbert/raft`, damit das Spiel über GitHub Pages auf dem iPhone läuft?
- **Empfehlung:** Ein neuer Ordner `spiel/` neben `buero/`, darin eine Startseite und kleine Code-Ordner nach Bereichen (Welt, Floß, Hai, Überleben …). So läuft das Spiel unter derselben Adresse wie das Büro (`neidelbert.github.io/raft/spiel/`), braucht keinen Zwischenschritt beim Hochladen („kein Build“), und jeder findet sofort, wo etwas hingehört. Ordner werden erst mit ihrer ersten Datei angelegt, damit nichts Leeres herumliegt.
- **Andere Möglichkeit:** Ein eigenes zweites Projekt nur für das Spiel. Nachteil: zwei Projekte pflegen, Pakete, Berichte und Code liegen getrennt, der Debugger kann nicht mit einem Schritt zur letzten guten Version zurück.
- **Was passiert bei Freigeben:** Ich lege `spiel/` mit Startseite, Einstellungsdatei und den Ordnern für das erste Paket an, und der Leiter trägt Struktur und Budget in `PROJEKT.md` und den Skill `raft3d-programmierung` ein.
- **Rückgängig machbar:** ja (Ordner lassen sich jederzeit verschieben oder löschen, Git merkt sich alles).

Antwort: **Freigeben · Ändern · Später**

---

## Vorgeschlagene Struktur

Bestehendes bleibt unverändert (markiert mit „besteht“).

```
raft/
├── .claude/              besteht: Agents und Skills
├── buero/                besteht: Team-Seite fürs Handy
├── pakete/               besteht: Aufgabenpakete
├── berichte/             besteht: Berichte
├── tests/                besteht
│   ├── agenten/          besteht: Rollentests
│   └── spiel/            NEU: Prüflisten und Testskripte des Debuggers
├── werkzeuge/            NEU: Hilfsskripte (z. B. Größen-Prüfung)
├── spiel/                NEU: das Spiel (wird von GitHub Pages ausgeliefert)
│   ├── index.html        Startseite: Bildschirm, Import-Map für Three.js
│   ├── stil.css          Aussehen von Knöpfen, Joystick, Anzeige
│   ├── js/
│   │   ├── main.js       Start und Hauptschleife
│   │   ├── config/       alle Zahlen und Farben (nur Daten)
│   │   ├── kern/         Bildschirm, Kamera, Zeit, Speichern, Sound
│   │   ├── steuerung/    Joystick links, Aktionsknöpfe rechts
│   │   ├── welt/         Wasser, Himmel, Tag und Nacht, Wetter, Treibgut
│   │   ├── floss/        Raster-Floß und Bauen
│   │   ├── figur/        Spielfigur und Haken
│   │   ├── gegner/       Hai (später mehr)
│   │   ├── ueberleben/   Hunger, Durst, Gesundheit, Sauerstoff, Kälte
│   │   └── oberflaeche/  Anzeigen, Hinweise, Menüs
│   └── medien/
│       └── sound/        Effekte (Wellen, Hai, Bauen)
├── PROJEKT.md            besteht
└── TEAM.md               besteht
```

## Begründung je Ordner

| Ordner | Warum |
|---|---|
| `spiel/` | Getrennt vom Büro, aber im selben Projekt. GitHub Pages liefert ihn direkt aus, Adresse `…/raft/spiel/`. Später kann daraus eine App werden, ohne den Rest umzuräumen. |
| `spiel/index.html`, `stil.css` | Eine Startseite reicht. Three.js kommt über eine Import-Map mit fester Version (wie im Skill), also kein Zwischenschritt beim Hochladen. |
| `js/config/` | Regel aus dem Skill: Zahlen zentral. Hai-Stärke, Hunger-Tempo usw. kann man ändern, ohne den Code anzufassen. |
| `js/kern/` | Technik, die alle brauchen. Speichern liegt hier, damit es nur einen Weg zum Spielstand gibt. |
| `js/steuerung/` | Touch zuerst. Getrennt, damit später Maus oder Controller dazukommen können. |
| `js/welt/` | Alles, was ohne Spieler da ist. Später kommen Inseln und Unterwasserwelt hier hinzu. |
| `js/floss/` | Das Herzstück (Raster-Bau). Eigener Ordner, weil es wachsen wird (Rezepte, Netze, Wasserfilter). |
| `js/figur/` | Spielfigur und Haken. Getrennt von der Steuerung, damit später ein zweiter Spieler (Multiplayer) dieselbe Figur nutzen kann. |
| `js/gegner/` | Zuerst nur der Hai, später weitere Tiere ohne Umbau. |
| `js/ueberleben/` | Die Überlebenswerte im ARK-Stil an einem Ort, leicht auszubalancieren. |
| `js/oberflaeche/` | Anzeigen und Hinweise (kein Tutorial, Hinweise beim Spielen). Getrennt von der 3D-Welt. |
| `medien/sound/` | Nur Sound-Effekte. Grafik wird per Code erzeugt (Low-Poly), daher vorerst kein Grafik-Ordner. |
| `tests/spiel/` | Prüfungen des Debuggers liegen bei den bestehenden Tests, nicht im ausgelieferten Spiel. |
| `werkzeuge/` | Hilfsskripte gehören nicht ins Spiel und werden nicht ausgeliefert. |

Regeln dazu (für den Skill nach Freigabe):
- Namen auf Deutsch, ohne Umlaute, klein, mit Bindestrich (`hai.js`, `tag-nacht.js`).
- Eine Datei, eine Aufgabe. Ein neuer Ordner nur mit Vorlage an Lukas.
- Ordner entstehen mit ihrer ersten Datei (Git speichert keine leeren Ordner).
- Spielstand im Handy-Speicher unter dem Namen `raft3d-v1`; neue Felder bekommen Standardwerte.

## Performance-Budget (Vorschlag)

Zielgerät: iPhone ab etwa iPhone 11, Safari. Gemessen vom Debugger, Grenzen stehen dann in `js/config/`.

| Bereich | Grenze | Bedeutung |
|---|---|---|
| Bildrate | Ziel 60, nie unter 30 Bilder pro Sekunde | flüssig |
| Zeichenaufrufe | höchstens 100 pro Bild | so oft „malt“ das Handy pro Bild; Floßteile werden zusammengefasst |
| Dreiecke | höchstens 100.000 sichtbar | Low-Poly-Grenze für alles auf dem Bildschirm |
| Pixel-Ratio | höchstens 2 | wie im Skill |
| Licht | höchstens 2 Lichter, keine echten Schatten | nur ein dunkler Fleck unter Figur und Hai |
| Texturen | höchstens 1024 × 1024 Pixel je Bild, zusammen unter 20 MB Grafikspeicher | vieles per Code und Farbe statt Bild |
| Gleichzeitig | höchstens 3 Haie, 50 Treibgut-Teile | Teile werden wiederverwendet statt neu erzeugt |
| Ladegröße | Spiel ohne Three.js unter 2 MB, Start unter 3 Sekunden über Mobilfunk | schneller Einstieg |
| Sound | je Effekt unter 100 KB, Format `.m4a` oder `.mp3` | läuft sicher in Safari |
| Arbeitsspeicher | unter 150 MB | Safari schließt sonst die Seite |
| Spielstand | unter 1 MB | Handy-Speicher ist begrenzt |

Wird eine Grenze überschritten, meldet der Debugger es, und der Techniker schlägt eine Lösung vor, bevor weitergebaut wird.
