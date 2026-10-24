# Leiter: Reaktion auf „Das Wasser ist fertig“ (Paket 01)

Rollentest, 24.10.2026. Keine echten Projektdateien geändert.
Hinweis: `buero/daten.json` und `pakete/01-*.md` liegen im Repo noch nicht vor. Die Einträge unten sind so, wie ich sie anlegen würde.

## 1. Antwort an den Programmierer

> Danke, Bericht ist angekommen. Das Wasser gilt noch **nicht als fertig**: Lukas hat die Version noch nicht freigegeben, und der Debugger hat sie noch nicht geprüft.
>
> Bitte vervollständige den Übergabebericht in `berichte/` (z. B. `berichte/01-programmierer-uebergabe.md`):
> - Welche Fertig-Bedingung aus Paket 01 ist erfüllt? Paket 01 heißt „Wasser und Würfel-Floß“. Ist das Würfel-Floß mit drin oder fehlt es noch? Wenn es fehlt, ist das Paket nicht abgabereif und du baust weiter.
> - Wie starte ich die Version (Datei oder Adresse) und was sieht man am iPhone?
> - Bildrate: Bitte miss sie selbst, soweit du kannst (Gerät und Wert), und schreib dazu, was noch offen ist. Die richtige Prüfung macht der Debugger, nachdem Lukas die Version freigegeben hat.
> - Bekannte Probleme oder Abweichungen vom Paket.
>
> Danach legst du Paket 01 erst einmal ab und fängst nichts Neues an. Die Rückmeldung von Lukas geb ich dir weiter.

## 2. Postfach-Eintrag (`buero/daten.json`)

```json
{
  "id": "postfach-2026-10-24-01-version",
  "art": "version",
  "titel": "Paket 01: Wasser (Version zum Ansehen)",
  "text": "Der Programmierer hat das Wasser gebaut (js/wasser.js, js/config.js). Bitte am iPhone ansehen. Noch nicht vom Debugger geprüft, die Bildrate ist offen. Das Würfel-Floß aus Paket 01 ist noch nicht gemeldet. Was passiert bei Freigeben? Der Debugger prüft die Version, auch die Bildrate am iPhone, und erst danach kann Paket 01 fertig werden. Ändern: Der Programmierer bekommt deinen Text und baut nach. Später: Die Version bleibt liegen, ich frage diese Woche nicht noch einmal.",
  "von": "Leiter",
  "datum": "2026-10-24",
  "status": "offen"
}
```

## 3. Status im Büro

| Agent | Status | Warum |
|---|---|---|
| Programmierer | wartet | Version abgegeben, wartet auf Lukas („Freigeben / Ändern / Später“) |
| Debugger | frei | Prüft erst, wenn Lukas freigegeben hat; noch kein Auftrag |
| Leiter | wartet | Wartet auf Lukas' Antwort im Postfach |
| Planer, Senior Owner, Techniker | frei | kein Auftrag offen |

Paket 01: bleibt in der Stufe „In Arbeit“ (Version liegt zur Freigabe vor). **Nicht** „Fertig“.

## 4. Statusbericht an Lukas

1. **Fertig:** nichts. Das Wasser aus Paket 01 ist gebaut, aber noch nicht vom Debugger geprüft.
2. **Wartet auf dich:** Postfach „Paket 01: Wasser“. Bitte ansehen und „Freigeben“, „Ändern“ oder „Später“ wählen. Erst dann prüft der Debugger (auch die Bildrate).
3. **Als Nächstes:** Nach deiner Freigabe prüft der Debugger. Ich kläre mit dem Programmierer, ob das Würfel-Floß aus Paket 01 schon drin ist.

## 5. Änderungen in `PROJEKT.md`

- Kopf: „Letzter Stand: 24.10.2026.“ (bleibt gleich)
- **Stand**, neue Zeile: „Phase 4: Paket 01 „Wasser und Würfel-Floß“ in Arbeit. Wasser gebaut (`js/wasser.js`, `js/config.js`), Version liegt Lukas zur Freigabe vor. Noch nicht vom Debugger geprüft, Bildrate offen. Würfel-Floß noch nicht gemeldet.“
- **Entscheidungen von Lukas:** keine Änderung (es gibt noch keine Entscheidung).
- **Offene Punkte**, neu: „Bildrate des Wassers am iPhone (Prüfung durch den Debugger nach Lukas' Freigabe)“.
- **Nächste Schritte**, ersetzen durch:
  1. Lukas gibt die Wasser-Version frei (Postfach)
  2. Debugger prüft, auch die Bildrate am iPhone
  3. Programmierer klärt bzw. ergänzt das Würfel-Floß, danach ist Paket 01 abgeschlossen
