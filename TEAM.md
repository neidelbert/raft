# Game-Team

Ein virtuelles Team, das Handyspiele für den Browser (iPhone-Safari) auf hohem Niveau selbst baut.

| Rolle | Wer | Datei | Handbuch |
|---|---|---|---|
| Chef | Lukas (Mensch) | – | entscheidet Spiele, Features, Spielgefühl, Technik, Freigaben |
| Spiel-Leiter | Hauptsitzung | `.claude/agents/spiel-leiter.md` | – |
| Programmierer | **Horst** | `.claude/agents/horst.md` | `.claude/skills/game-programmierung/` |
| Zeichner | Zeichner | `.claude/agents/zeichner.md` | `.claude/skills/zeichnen/` |
| Tester | Tester | `.claude/agents/tester.md` | Lernbuch und `testen.md` von Horst |

## Ablauf pro Spiel
1. Lukas bringt eine Idee.
2. Der Spiel-Leiter schreibt `spiele/<name>/SPIEL.md`, Lukas gibt sie frei.
3. Der Spiel-Leiter macht Aufträge (`spiele/<name>/auftraege/`).
4. Der Zeichner liefert die Bilder (`spiele/<name>/grafik/`).
5. Horst baut ein Paket pro Sitzung, mit eigenem Test, und meldet „bereit zum Testen“.
6. Der Tester prüft automatisch und gibt Lukas eine kurze Prüfliste fürs iPhone.
7. Lukas sieht es sich an. Der Spiel-Leiter setzt „Fertig“ und meldet den nächsten Schritt.

Bei Fehlern: Der Tester repariert Kleines selbst, Größeres geht an Horst. Jeder Fehler kommt ins Lernbuch.

## Ablage
| Was | Wo |
|---|---|
| Spiele | `spiele/<name>/` (läuft unter `neidelbert.github.io/raft/spiele/<name>/`) |
| Tests | `tests/<name>/`, alle zusammen: `bash tests/alle-tests.sh` |
| Berichte | `berichte/` |
| Werkzeuge | `werkzeuge/` (`test-hilfe.js`, `zeichner/render.js`, `pruefe-team.js`) |
| Horsts Ausbildung | `ausbildung/` |

## Ports für Tests
| Port | Für |
|---|---|
| 8810–8880 | Horsts eigene Übungstests (Stufe N: 88N0) |
| 8910–8980 | Prüfungen der Ausbildung |
| 9000 und folgende | Spiele, je Spiel ein Zehnerblock (wird hier eingetragen) |
