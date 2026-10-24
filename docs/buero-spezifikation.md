# Büro der Agents: Spezifikation (Phase 3)

> Stand 24.10.2026: Lukas hat entschieden, dass das „Büro“ das Agent-Team im Code ist, ohne Raum mit Figuren. Umgesetzt als schlichte Team-Seite in `buero/` (siehe `PROJEKT.md`).

Status: Entwurf. Lukas hat bisher nur gesagt: "Game Oberfläche bauen, das Büro der Agents". Alles hier ist ein **Vorschlag** und wird mit Lukas abgestimmt, bevor es als entschieden gilt.

## Zweck
Das Büro zeigt Lukas auf einen Blick, was das Team gerade tut, und ist der Ort für seine Freigaben. Es soll sich wie das Spiel anfühlen: cartoonig, bunt, Vogelperspektive.

## Muss enthalten
1. **Büro-Ansicht:** Ein Raum von oben mit einem Schreibtisch pro Agent (Senior Owner, Leiter, Planer, Programmierer, Debugger, Techniker) und Lukas' Platz. Jede Figur zeigt ihren Status: frei, arbeitet, wartet auf Lukas, Problem.
2. **Agent-Karte:** Antippen einer Figur zeigt Rolle, aktuelle Aufgabe und die letzten Ergebnisse.
3. **Postfach "Wartet auf Lukas":** Alle Freigaben an einem Ort (neues Feature, Spielgefühl, Technik-Entscheidung, Version vor dem Debugger-Test), jeweils mit Freigeben, Ändern, Später.
4. **Aufgabenpakete:** Liste oder Tafel mit den Stufen Idee, Geplant, In Arbeit, Beim Debugger, Fertig.
5. **Projektdatei-Ansicht:** Stand, Entscheidungen und nächste Schritte aus `PROJEKT.md`.

## Technik (Vorschlag)
- Eine HTML-Seite im GitHub-Projekt (Ordner `buero/`), läuft im iPhone-Safari, kein Server nötig.
- Daten kommen aus einer Datei `daten.json` (Agents, Aufgaben, Freigaben), damit die Agents sie pflegen können.
- Handy zuerst: große Tippflächen, kein Hover, kein kleines Bedienen.
- Deutsch, Namen im Code auf Deutsch.

## Offene Fragen (Lukas mit Vorschlag vorlegen)
- Wie kommen Lukas' Freigaben vom Büro zurück zu den Agents? Optionen: Büro schreibt in `daten.json` im GitHub-Projekt, oder Lukas kopiert einen fertigen Entscheidungstext in den Chat.
- Sollen die Agents im Büro nur Status anzeigen, oder soll man ihnen dort auch Aufträge geben?
- Wie "lebendig" soll das Büro sein (feste Figuren, kleine Animationen)? Mit Rücksicht auf die 5 Stunden pro Woche zuerst einfach halten.

## Fertig, wenn
- Die Seite läuft ohne Fehler im iPhone-Safari.
- Büro-Ansicht, Agent-Karte, Postfach, Aufgabenpakete und Projektdatei-Ansicht sind mit Beispieldaten sichtbar.
- Ein Eintrag in `daten.json` ändern führt zu einer sichtbaren Änderung im Büro.
- Lukas hat das Ergebnis freigegeben.

## Testaufgabe
"Lege eine neue Freigabe im Postfach an und markiere den Programmierer als wartend." Bestanden, wenn beides nach dem Neuladen sichtbar ist.
