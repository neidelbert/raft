# Auftrag an Claude Cowork: Raft 3D, Team und Büro fertigstellen

## Worum es geht
Lukas baut **Raft 3D**, ein cartoonig-buntes Überlebensspiel für das Handy (Three.js, iPhone-Browser). Zuerst entsteht ein Team aus KI-Agents, das danach das Spiel baut. Dieses Paket enthält alle bisherigen Entscheidungen. Dein Auftrag ist **Phase 2 und Phase 3**. Mit dem Spiel selbst (Phase 4) wird erst nach Lukas' Freigabe begonnen.

## Zuerst lesen (in dieser Reihenfolge)
1. `PROJEKT.md` (Entscheidungen, Stand, Ablauf)
2. `agents/` (sieben Rollenbeschreibungen)
3. `skills/raft3d-programmierung/SKILL.md` (Entwurf des Programmier-Skills)
4. `buero/BUERO-SPEZIFIKATION.md`

## Aufgabe A: Phase 2, Agents fertigstellen
- Prüfe jede Datei in `agents/` auf Lücken und Widersprüche. Ergänze, was fehlt, ändere aber keine Entscheidungen von Lukas.
- Mache aus jeder Rolle einen nutzbaren Agent bzw. Skill in dem Format, das du unterstützt (zum Beispiel Skill-Ordner mit `SKILL.md`).
- Schreibe pro Agent eine Testaufgabe und prüfe, ob der Agent sie löst.
- Prüfe, ob die Übergabe zwischen den Agents (Ablauf in `PROJEKT.md`) lückenlos funktioniert.
- Hinweis: Der Owner ist Lukas selbst, es gibt also sechs KI-Agents plus Lukas. Wenn Lukas den Owner auch als Agent will, frage ihn.

## Aufgabe B: Phase 3, Büro der Agents bauen
Baue das Büro nach `buero/BUERO-SPEZIFIKATION.md`. Offene Fragen aus der Spezifikation legst du Lukas mit einem Vorschlag vor, bevor du sie entscheidest.

## Aufgabe C: Projektdatei pflegen
Halte `PROJEKT.md` aktuell (Entscheidungen, Stand, nächste Schritte), damit jede neue Session nahtlos weitermacht.

## Regeln
- Sprache: Deutsch, auch für Namen im Code.
- Lukas hat nur etwa 5 Stunden pro Woche. Arbeite in klaren Paketen, ein fertiges Paket pro Sitzung.
- Lukas entscheidet selbst bei neuen Features, Änderungen am Spielgefühl, Technik-Entscheidungen und jeder fertigen Version vor dem Debugger-Test.
- Was in `PROJEKT.md` als **Vorschlag** steht, ist noch nicht entschieden.
- Geht etwas kaputt, repariert der Debugger zuerst. Zurück zur letzten funktionierenden Version geht es nur, wenn die Reparatur nicht klappt.
- Alles muss auf dem iPhone (Safari) funktionieren.

## Fertig, wenn
- Alle Agents haben eine geprüfte Beschreibung und eine bestandene Testaufgabe.
- Das Büro läuft auf dem iPhone und erfüllt die Fertig-Kriterien der Spezifikation.
- `PROJEKT.md` ist aktuell und nennt den nächsten Schritt.
