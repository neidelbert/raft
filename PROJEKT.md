# Projektdatei: Raft 3D

Geführt vom Leiter. Letzter Stand: 24.10.2026.
Repository: `neidelbert/raft` · Team-Seite: `buero/` (GitHub Pages: `https://neidelbert.github.io/raft/buero/`)

## Stand
- Phase 0/1: Interview abgeschlossen (etwa 90 %), Spielbeschreibung geschrieben, Programmier-Skill fertig (`.claude/skills/raft3d-programmierung/`).
- Phase 2 (Agents): **gebaut und getestet**, wartet auf Abnahme durch Lukas. Sechs Agents in `.claude/agents/`, Abläufe und Übergaben in `TEAM.md`, alle Testaufgaben bestanden (`tests/agenten/TESTS.md`).
- Phase 3 (Büro): **gebaut und getestet**, wartet auf Abnahme durch Lukas. Schlichte Team-Seite in `buero/` (Team, Agent-Karte, Postfach, Aufgaben, Projektdatei), Daten in `buero/daten.json`. Getestet in iPhone-Ansicht (Chromium), noch **nicht auf dem echten iPhone**.
- Phase 4 (Spielentwicklung): noch nicht gestartet. Pakete 02–06 (Raster-Floß) liegen als Entwurf in `pakete/` (aus dem Planer-Test, noch nicht freigegeben).

## Phasen
1. Skills entwickeln
2. Agents bauen, die Bereiche leiten (Junior-Agents erst, wenn ein Bereich zu groß wird)
3. Oberfläche bauen: das Büro der Agents
4. Spiel entwickeln

Grundsatz: Die Basis soll zuerst stimmen, das Spiel ist das Ziel.

## Entscheidungen von Lukas
- Singleplayer, Multiplayer später
- Raft-Grundidee plus eigene Ideen, dazu Überlebenssystem im ARK-Stil
- Erst Browser (iPhone), später App
- Welt: Ozean, später Inseln und Unterwasserwelt mit Tauchanzug
- Kamera: Vogelperspektive, fokussiert auf die Figur
- Ziel: einfach überleben, kein festes Ende
- Bauen: Raster-Bau wie in Raft
- Überlebenswerte: Hunger, Durst, Gesundheit, Sauerstoff beim Tauchen, Wetter, Tag und Nacht, Kälte und Wärme
- Gegner: zuerst nur Hai, später mehr
- Fortschritt: Werkzeug-Stufen und freischaltbare Bau-Rezepte
- Schwierigkeit: hart wie Raft oder ARK
- Einstieg: Hinweise beim Spielen, kein eigenes Tutorial
- Grafik: cartoonig und bunt; Sound: nur Effekte (Wellen, Hai, Bauen)
- Steuerung: Joystick links, Aktionsknöpfe rechts
- Speichern: automatisch auf dem Handy, ein Spielstand
- Spielfigur: fest, Anpassen später
- Version 1 muss enthalten: Treibgut mit Haken, Raster-Floß, Essen und Trinken beschaffen, Hai greift Floß und Figur an. Sie soll gut spielbar sein und dem vollen Spielerlebnis nahekommen.
- Ideen von Lukas gewählt: Netze und Wasserfilter, Flaschenpost mit Hinweisen. Stürme und zähmbare Tiere: nicht jetzt.
- Technik: Three.js, GitHub-Projekt, Namen im Code auf Deutsch
- Zielgruppe zuerst: Lukas und Freunde
- Zeit: bis zu 5 Stunden pro Woche
- Team: Owner (Lukas), Senior Owner, Leiter, Planer, Programmierer, Debugger, Techniker; jede Rolle ein Agent
- Owner ist Lukas selbst (kein KI-Agent): sechs KI-Agents plus Lukas
- Zusammenarbeit: Team arbeitet selbstständig, Lukas entscheidet Großes; ein Auftrag, ein fertiges Paket pro Sitzung
- Lukas entscheidet vor dem Weiterbauen: neue Features, Spielgefühl, Technik, jede fertige Version vor dem Debugger-Test
- Senior Owner bringt Vorschläge vor jedem neuen Feature
- Debugger entscheidet je nach Aufgabe, wie streng er prüft
- Geht etwas kaputt: Debugger repariert zuerst, Zurücksetzen nur wenn es nicht klappt
- Repository: `neidelbert/raft` (24.10.2026)
- Büro (24.10.2026): Das „Büro“ ist das Agent-Team im Code, kein Raum mit Figuren. Dazu eine schlichte Team-Seite fürs Handy.
- Büro: Lukas' Antworten im Postfach schreibt die Seite direkt in GitHub (`buero/daten.json`).
- Büro: Aufträge an Agents gibt Lukas auf der Agent-Karte als Kopiertext für den Chat.

## Vorschläge (noch nicht entschieden)
Alle liegen im Postfach der Team-Seite.
- Flaschenpost in Version 1 nur als Treibgut mit Hinweisen (volle Wirkung erst mit Inseln) – Postfach f-004
- Netze und Wasserfilter in Version 1 – Postfach f-004
- Der Techniker legt Technik-Entscheidungen Lukas vor (so in `.claude/agents/techniker.md` beschrieben)
- Reine Fehlerreparaturen des Debuggers brauchen keine neue Freigabe; ändert eine Reparatur das Spielgefühl, kommt sie ins Postfach – Postfach f-005
- Ordnerstruktur fürs Spiel: `spiel/` neben `buero/`, Code nach Bereichen, Performance-Budget (`berichte/2026-10-24-technik-ordnerstruktur.md`) – Postfach f-002
- Hai-Verhalten: 4 Vorschläge, Empfehlung 1 + 2 zuerst (`berichte/2026-10-24-vorschlaege-hai-verhalten.md`) – Postfach f-003
- Three.js per Import-Map mit fester Version (`three@0.170.0`), Namen im Code ohne Umlaute (`floss`, `groesse`) – im Programmier-Skill so eingetragen
- Raster-Floß in 5 Paketen (02–06, `pakete/UEBERSICHT-raster-floss.md`), Technik-Fragen in 02, 03, 05, 06

## Ablauf pro Idee
1. Lukas bringt Idee oder Auftrag
2. Senior Owner ergänzt Vorschläge aus anderen Spielen
3. Lukas entscheidet über das neue Feature
4. Planer macht Aufgabenpakete, Leiter gibt frei
5. Programmierer baut ein fertiges Paket pro Sitzung
6. Lukas gibt die fertige Version frei, bevor der Debugger sie testet
7. Debugger prüft, danach meldet der Leiter den Stand

Wer was an wen übergibt, wo es abgelegt wird und was bei „Ändern“/„Später“ passiert: `TEAM.md`.

## Offene Punkte
- Eigene Spielideen von Lukas, die es in Raft nicht gibt
- Name des Spiels und Aussehen der Figur
- Genaue Zahlen für Überlebenswerte, Hai-Verhalten, Werkzeug-Stufen
- Wie der Code auf späteren Multiplayer vorbereitet wird
- GitHub Pages: Das Repo ist privat. Pages für private Repos braucht GitHub Pro; sonst Repo öffentlich machen (Lukas entscheidet).
- Team-Seite auf dem echten iPhone prüfen (Lukas)

## Nächste Schritte
1. Lukas: GitHub Pages einrichten (Settings → Pages → Branch `main`, Ordner `/ (root)`), Team-Seite auf dem iPhone öffnen, Token unter ⚙ einrichten (`README.md`).
2. Lukas: Postfach abarbeiten, zuerst f-001 (Team und Büro abnehmen) und f-002 (Ordnerstruktur).
3. Danach Start Phase 4: Paket 01 Mini-Prototyp (Wasser, Würfel-Floß, Joystick) nach Vorlage Testpaket T1.

## Änderungsprotokoll
- 24.10.2026: Phase 2 und 3 umgesetzt. Agents in `.claude/agents/` (Claude-Code-Format), Programmier-Skill in `.claude/skills/`, `TEAM.md` mit Übergaben, Team-Seite `buero/`, Rollentests `tests/agenten/`, Seitentest `tests/buero-test.js`.
  Behobene Widersprüche: Programmierer gab Version laut Rolle an Lukas, laut Skill an den Leiter → jetzt über den Leiter. Skill erlaubte Englisch im Code → Deutsch (Entscheidung von Lukas). Programmierer schrieb laut Skill in die Projektdatei → das macht nur der Leiter. Senior Owner gab an ein „Planer-Team“ → über den Leiter an den Planer. Techniker hatte keinen Platz im Ablauf → Schritt 4b in `TEAM.md`. Ablauf bei Fehlern und bei „Ändern“/„Später“ ergänzt.
