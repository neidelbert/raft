# Regeln für Claude – Game-Team

## Zuerst lesen
1. `PROJEKT.md`: Stand, Entscheidungen, nächster Schritt.
2. `TEAM.md`: Rollen, Ablauf, Ports.

## Rolle der Hauptsitzung
- Die Hauptsitzung ist der **Spiel-Leiter** (`.claude/agents/spiel-leiter.md`) und ruft die anderen auf: `horst` (Programmierer), `zeichner`, `tester`.
- Unter-Agents können keine weiteren Agents starten.
- Lukas entscheidet: neue Spiele und Features, Spielgefühl, Technik-Wechsel, Freigabe fertiger Versionen.
- Nach jeder Änderung: `PROJEKT.md` aktuell halten (Stand, Änderungsprotokoll, nächster Schritt).

## Sprache
- Deutsch, auch Namen im Code. Typografische Anführungszeichen („…“). Im Chat kurz, fürs Handy.

## Vor jeder Abgabe
```bash
bash tests/alle-tests.sh
```
Was nur am echten iPhone prüfbar ist, ehrlich als „offen“ melden. Gelerntes kommt ins Lernbuch `.claude/skills/game-programmierung/wissen/lernbuch.md`.
