# Team Raft 3D: Rollen, Übergaben, Abläufe

Das „Büro“ ist das Agent-Team im Code. Sechs KI-Agents plus Lukas (Owner).
Die Agents liegen in `.claude/agents/` (Claude Code lädt sie automatisch).
Die Hauptsitzung arbeitet als **Leiter** und ruft die anderen Agents auf (Unter-Agents können keine weiteren Agents starten).
Die Handy-Seite `buero/` zeigt Stand, Postfach und Aufgaben aus `buero/daten.json`.

## Rollen
| Rolle | Datei | Kurz |
|---|---|---|
| Owner: Lukas | – (Mensch) | Ideen, letzte Entscheidung |
| Senior Owner | `.claude/agents/senior-owner.md` | Vorschläge aus anderen Spielen vor jedem neuen Feature |
| Leiter | `.claude/agents/leiter.md` | Verteilt, gibt Pakete frei, führt `PROJEKT.md` und `buero/daten.json`, meldet Stand |
| Planer | `.claude/agents/planer.md` | Macht Aufgabenpakete in `pakete/` |
| Programmierer | `.claude/agents/programmierer.md` | Baut ein freigegebenes Paket pro Sitzung |
| Debugger | `.claude/agents/debugger.md` | Prüft und repariert, Prüfbericht |
| Techniker | `.claude/agents/techniker.md` | Projektaufbau, Performance, GitHub, Werkzeuge; Technik-Empfehlungen an Lukas |

## Owner: Lukas (kein KI-Agent)
- Hat die Ideen und die letzte Entscheidung. Nichts wird ohne sein Okay festgelegt.
- Entscheidet selbst bei: neuen Features, Änderungen am Spielgefühl, Technik-Entscheidungen, jeder fertigen Version, bevor der Debugger sie testet.
- Das Team arbeitet selbstständig und legt Lukas nur Großes vor. Pro Sitzung ein fertiges Paket (etwa 5 Stunden pro Woche).
- Vorlagen an Lukas sind kurz und handytauglich, mit klarer Auswahl: **Freigeben, Ändern, Später**.
- Lukas antwortet im Büro (Postfach, schreibt direkt in `buero/daten.json` auf GitHub) oder im Chat.

## Wer schreibt wo
| Datei | Schreibt | Lesen |
|---|---|---|
| `PROJEKT.md` | nur Leiter | alle, zuerst bei jeder Sitzung |
| `buero/daten.json` | Leiter (Status, Postfach, Pakete); Lukas über das Büro (Antworten im Postfach) | alle |
| `pakete/NN-name.md` | Planer (Inhalt), Leiter (Freigabe-Vermerk) | Programmierer, Debugger |
| `.claude/skills/raft3d-programmierung/wissen/` | Debugger (Lernbuch), Techniker (Technik), Leiter (Ablauf) | Programmierer vor jedem Paket |
| `berichte/` | Programmierer (Übergabebericht), Debugger (Prüfbericht), Senior Owner (Vorschläge), Techniker (Empfehlungen) | Leiter |
| Spiel-Code | Programmierer; Debugger nur für Reparaturen; Techniker nur Aufbau/Werkzeuge | – |

## Ablauf pro Idee (aus `PROJEKT.md`, mit Übergaben)
| Schritt | Wer | Bekommt | Gibt weiter | an |
|---|---|---|---|---|
| 1 | Lukas | – | Idee/Auftrag (Chat oder Büro-Auftrag) | Leiter |
| 2 | Senior Owner | Feature vom Leiter | 2–4 Vorschläge (`berichte/`) | Leiter → Postfach (Art „Feature“) |
| 3 | Lukas | Postfach-Eintrag | Freigeben / Ändern / Später je Vorschlag | Leiter (trägt in `PROJEKT.md` ein) |
| 4a | Planer | entschiedene Vorschläge | Pakete in `pakete/` | Leiter |
| 4b | Techniker (nur wenn ein Paket eine Technik-Frage hat) | Frage vom Leiter | Empfehlung | Leiter → Postfach (Art „Technik“) |
| 4c | Leiter | Pakete (+ Technik-Freigabe) | Freigabe-Vermerk im Paket, Stufe „Geplant“ | Programmierer |
| 5 | Programmierer | freigegebenes Paket | Version + Übergabebericht | Leiter → Postfach (Art „Version“) |
| 6 | Lukas | Postfach-Eintrag „Version“ | Freigeben / Ändern / Später | Leiter |
| 7a | Debugger | von Lukas freigegebene Version | Prüfbericht | Leiter |
| 7b | Leiter | Prüfbericht ohne offene Fehler | Stufe „Fertig“, `PROJEKT.md`, Statusbericht | Lukas |

Rücksprünge:
- Lukas sagt „Ändern“ (Schritt 3/6): Leiter gibt den Text an den Agenten des Schritts zurück (Senior Owner bzw. Programmierer).
- Lukas sagt „Später“: Paket bleibt in der Stufe, Eintrag bleibt im Postfach unter „Später“, Leiter fragt nicht erneut in derselben Woche.
- Kein neues Feature (z. B. reiner Fehler, Aufräumen): Schritte 2–3 entfallen, Leiter geht direkt zu 4a.

## Selbstständig arbeiten (Ziel von Lukas, 24.10.2026: Team kann teilweise allein programmieren)
Das Team läuft ohne Rückfrage, solange nichts ansteht, was Lukas entscheidet:
1. Leiter liest Postfach und `PROJEKT.md`, wählt das nächste **entschiedene** Paket (oder lässt es vom Planer schreiben).
2. Leiter gibt frei, wenn alle Felder da sind und keine offene Technik-Frage drin ist.
3. Programmierer baut allein: Wissen lesen, bauen, eigener Test, `bash tests/alle-tests.sh`, Commit, Übergabebericht.
4. Leiter prüft: `node werkzeuge/pruefe-team.js`, `bash tests/alle-tests.sh`, Bericht vollständig. Dann Postfach „Version“ an Lukas, Programmierer „frei“, Lukas „hat Post“.
5. Nach Lukas' Freigabe: Debugger prüft und repariert allein (Reparaturen ohne neue Freigabe, entschieden), schreibt ins Lernbuch, Leiter setzt „Fertig“.

Anhalten und Lukas fragen (Postfach) nur bei: neuem Feature, Spielgefühl, Technik-Entscheidung, fertiger Version vor dem Debugger-Test.

## Wissen und Lernen
- Das Wissen des Programmierers liegt in `.claude/skills/raft3d-programmierung/wissen/` (Lernbuch, Muster, Three.js/iPhone, Spielinhalt, Testen).
- Nach jedem Paket wächst es: Debugger trägt Fehler ins Lernbuch ein, Techniker ergänzt Technik-Wissen nach Freigaben, Leiter trägt Ablauf-Fehler ein.
- `node werkzeuge/pruefe-team.js` prüft, dass Agents, Skill, Wissen, Büro-Daten, Pakete und Verweise zusammenpassen.

## Ablauf bei Fehlern
1. Debugger grenzt den Fehler ein und repariert (entschieden).
2. Klappt die Reparatur nicht: Rückkehr zur letzten funktionierenden Version (Git), Meldung an den Leiter (entschieden).
3. Leiter setzt den Agenten auf „Problem“ im Büro und meldet Lukas den Stand.
4. Reine Fehlerreparaturen des Debuggers brauchen keine neue Freigabe von Lukas. Ändert die Reparatur das Spielgefühl, geht sie als „Version“ ins Postfach (entschieden 24.10.2026).

## Übergabe-Prüfung (Phase 2)
Geprüft am 24.10.2026, jede Übergabe hat Absender, Empfänger, Inhalt und Ablage:
- Idee → Senior Owner → Postfach → Entscheidung → `PROJEKT.md`: lückenlos.
- Entscheidung → Planer → `pakete/` → Leiter-Freigabe → Programmierer: lückenlos.
- Programmierer → Leiter → Postfach „Version“ → Lukas → Debugger: lückenlos (vorher widersprüchlich, siehe `PROJEKT.md`, Änderungsprotokoll).
- Debugger → Leiter → Fertig → Statusbericht: lückenlos.
- Technik-Fragen: vorher ohne Platz im Ablauf, jetzt Schritt 4b.
- Fehler nach „Fertig“: über „Ablauf bei Fehlern“.
