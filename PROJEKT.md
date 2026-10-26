# Projektdatei: Game-Team

Geführt vom Spiel-Leiter. Letzter Stand: 25.10.2026.

## Ziel (Lukas, 25.10.2026)
Ein virtuelles Team, das Handyspiele auf hohem Niveau selbst programmiert. Kern ist **Horst**, der Programmierer, dazu ein **Zeichner**, der alle Grafiken erstellt.

## Stand
- Raft 3D ist abgebrochen und gelöscht (25.10.2026). Das Repo `neidelbert/raft` wird für das Game-Team weiterverwendet.
- Team angelegt: Spiel-Leiter (Hauptsitzung), Horst (Programmierer), Zeichner, Tester (`TEAM.md`).
- Horsts Handbuch mit Wissen (Haltung, Aufbau, iPhone, 2D, 3D, Spielgefühl, Grafik/Sound, Testen, Lernbuch).
- Zeichner-Handbuch mit Stil, SVG-Techniken, Vorlagen und Werkzeug `werkzeuge/zeichner/render.js` (SVG → PNG und Kontaktbogen).
- Horsts Ausbildung: **abgeschlossen**, alle 8 Stufen bestanden (`ausbildung/ZEUGNIS.md`). Ergebnis ist sein Skill mit 12 geprüften Bausteinen (`.claude/skills/game-programmierung/bausteine/`) und überarbeitetem Handbuch.
- Zeichner und Tester haben ihre Testaufgaben bestanden.
- Aufbaukurs (Ziel: Skill, der Spiele mit Assets bauen kann): Stufe 9 (Assets) und 10 (eigenständiger Skill) bestanden. Zwei Praxistests mit frischen Programmierern, die nur das Paket hatten: beide erfolgreich, gefundene Schwächen behoben.
- **Installierbare Pakete:** `dist/game-programmierung.zip` (Horsts Skill) und `dist/zeichnen.zip` (Zeichner), Anleitung `dist/INSTALLIEREN.md`.

## Entscheidungen von Lukas
- Team baut Handy-Browserspiele (2D und 3D, iPhone-Safari).
- Schlankes Team: Spiel-Leiter, Game-Programmierer, Zeichner, Tester. Lukas ist Chef.
- Der Programmierer heißt Horst. Er soll zum besten Programmierer ausgebildet werden, mit den Eigenschaften und Fähigkeiten der besten Entwickler (`.claude/skills/game-programmierung/wissen/haltung.md`).
- Der Zeichner erstellt Grafiken per Code als Bilddatei (SVG → PNG).
- Ablage im Repo `neidelbert/raft`.
- Horst programmiert jetzt kein Spiel, sondern lernt und entwickelt seinen Skill (25.10.2026).

## Offene Fragen an Lukas (aus der Ausbildung, keine Eile)
- Pause nach Rückkehr in den Tab: erst „Tippen zum Weiterspielen“ oder sofort weiter?
- Ende-Tafel: eine halbe Sekunde kein Tippen annehmen?
- Gegner am Rand der Figur stehen lassen statt sie zu verdecken?
- Boot/Figur nach dem Loslassen kurz nachgleiten lassen?

## Nächste Schritte
1. Lukas: Pakete ansehen oder installieren (`dist/INSTALLIEREN.md`), Fragen zum Spielgefühl beantworten.
2. Offen: alles nur in Chrome geprüft, Safari am echten iPhone noch nie.
3. Erst wenn Lukas es sagt: erstes echtes Spiel mit dem Skill.

## Änderungsprotokoll
- 25.10.2026: Raft 3D gelöscht, Game-Team mit Horst, Zeichner, Tester und Spiel-Leiter aufgebaut, Ausbildung begonnen.
- 25.10.2026: Horsts Ausbildung abgeschlossen (Stufe 1–8), Zeichner- und Tester-Test bestanden. Baustein-Tests laufen in `tests/alle-tests.sh` mit. Testhilfe räumt verwaiste Server auf.
- 26.10.2026: Aufbaukurs Assets (Stufe 9) und eigenständiger Skill (Stufe 10) bestanden, zwei Praxistests mit frischen Programmierern, zwei Nachbesserungsrunden. Pakete in `dist/`.
