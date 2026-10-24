# Projektdatei: Raft 3D

Geführt vom Leiter. Letzter Stand: 24.10.2026.
Repository: `neidelbert/raft` · Team-Seite: `buero/` (GitHub Pages: `https://neidelbert.github.io/raft/buero/`)

## Stand
- Phase 0/1: Interview abgeschlossen (etwa 90 %), Spielbeschreibung geschrieben, Programmier-Skill fertig (`.claude/skills/raft3d-programmierung/`).
- Phase 2 (Agents): **fertig**, von Lukas abgenommen. Sechs Agents in `.claude/agents/`, Abläufe und Übergaben in `TEAM.md`, alle Testaufgaben bestanden (`tests/agenten/TESTS.md`).
- Phase 3 (Büro): **fertig**, von Lukas abgenommen und auf dem iPhone in Gebrauch (5 Freigaben über die Seite gespeichert). Schlichte Team-Seite in `buero/` (Team, Agent-Karte, Postfach, Aufgaben, Projektdatei), Daten in `buero/daten.json`.
- Phase 4 (Spielentwicklung): läuft. Paket 01 (Mini-Prototyp) vom Team **selbstständig** geplant, freigegeben und gebaut (31/31 Prüfungen, alle Tests grün). Wartet auf Lukas (Postfach f-006), danach Debugger.
- Team-Wissen: Programmierer hat Wissen in `.claude/skills/raft3d-programmierung/wissen/` (Lernbuch, Muster, Three.js/iPhone, Spielinhalt, Testen). Prüfungen: `bash tests/alle-tests.sh`, `node werkzeuge/pruefe-team.js`. Pakete 02–06 (Raster-Floß) liegen als Entwurf in `pakete/` (aus dem Planer-Test, noch nicht freigegeben).

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
- Phase 2 und 3 abgenommen (24.10.2026, f-001)
- Ordnerstruktur fürs Spiel: `spiel/` neben `buero/`, Code nach Bereichen, Zahlen in `spiel/js/config/`, Performance-Budget laut `berichte/2026-10-24-technik-ordnerstruktur.md` (24.10.2026, f-002)
- Hai-Verhalten: alle 4 Vorschläge (Rand-Bauteile abbeißen, Flossen-Warnung, abwehren und verscheuchen, Jagd auf Schwimmer), Reihenfolge laut Empfehlung: 1 + 2 zuerst, dann 3, dann 4 (24.10.2026, f-003)
- Version 1: Flaschenpost nur als Treibgut mit Hinweisen (volle Wirkung erst mit Inseln), Netze und Wasserfilter schon in Version 1 (24.10.2026, f-004)
- Reine Fehlerreparaturen des Debuggers brauchen keine neue Freigabe; ändert eine Reparatur das Spielgefühl, kommt sie ins Postfach (24.10.2026, f-005)
- Der Techniker legt Technik-Entscheidungen Lukas vor (bestätigt mit der Abnahme des Teams)

## Vorschläge (noch nicht entschieden)
- Raster-Floß in 5 Paketen (02–06, `pakete/UEBERSICHT-raster-floss.md`), Technik-Fragen in 02, 03, 05, 06 – Leiter gibt erst nach Paket 01 frei
- Three.js per Import-Map mit fester Version (`three@0.170.0`), Namen im Code ohne Umlaute (`floss`, `groesse`) – im Programmier-Skill so eingetragen

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

## Nächste Schritte
1. Lukas: Paket 01 am iPhone ansehen (`neidelbert.github.io/raft/spiel/`), Postfach f-006 beantworten.
2. Nach Freigabe: Debugger prüft Paket 01, trägt Erkenntnisse ins Lernbuch, Leiter setzt „Fertig“.
3. Danach selbstständig weiter: Senior Owner zu „Treibgut mit Haken“ → Postfach; Planer überarbeitet Raster-Floß 02–06 gegen `spiel/` (Zieldateien nennen).

## Änderungsprotokoll
- 24.10.2026: Phase 2 und 3 umgesetzt. Agents in `.claude/agents/` (Claude-Code-Format), Programmier-Skill in `.claude/skills/`, `TEAM.md` mit Übergaben, Team-Seite `buero/`, Rollentests `tests/agenten/`, Seitentest `tests/buero-test.js`.
  Behobene Widersprüche: Programmierer gab Version laut Rolle an Lukas, laut Skill an den Leiter → jetzt über den Leiter. Skill erlaubte Englisch im Code → Deutsch (Entscheidung von Lukas). Programmierer schrieb laut Skill in die Projektdatei → das macht nur der Leiter. Senior Owner gab an ein „Planer-Team“ → über den Leiter an den Planer. Techniker hatte keinen Platz im Ablauf → Schritt 4b in `TEAM.md`. Ablauf bei Fehlern und bei „Ändern“/„Später“ ergänzt.
- 24.10.2026: Lukas hat f-001 bis f-005 über die Team-Seite freigegeben, eingetragen unter „Entscheidungen“. Techniker hat das Gerüst `spiel/` angelegt (Rollentest Teil 2).
- 24.10.2026: Ziel von Lukas „Team fehlerfrei, teilweise selbstständig, Programmierer mit komplettem Wissen“: Wissensordner und Lernbuch im Skill, Regeln „Selbstständig entscheiden“, selbstständiger Ablauf in `TEAM.md`, Prüfwerkzeug `werkzeuge/pruefe-team.js`, Gesamttest `tests/alle-tests.sh`. Probe: Paket 01 lief Planer → Leiter → Programmierer ohne Rückfrage, alle Tests grün.
