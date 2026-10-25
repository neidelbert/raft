# Skills installieren

Zwei Pakete, jedes ein Zip mit genau einem Ordner darin:
- `game-programmierung.zip`: Handbuch des Programmierers für Handy-Browserspiele (2D Canvas, 3D Three.js, iPhone-Safari), mit geprüften Bausteinen, Asset-Werkzeugen und dem Gerüst-Werkzeug `neues-spiel.js`.
- `zeichnen.zip`: Handbuch des Zeichners (SVG im Haus-Stil → PNG) mit seinem Werkzeug `render.js`.

## Claude Code
1. Im Projektordner entpacken, sodass die Ordner unter `.claude/skills/` liegen:
   ```bash
   mkdir -p .claude/skills
   unzip game-programmierung.zip -d .claude/skills/
   unzip zeichnen.zip -d .claude/skills/
   ```
   Für alle Projekte statt dessen nach `~/.claude/skills/` entpacken.
2. Claude Code neu starten. Die Skills heißen „game-programmierung“ und „zeichnen“ und werden bei passenden Aufgaben geladen.
3. Erstes Spiel: `node .claude/skills/game-programmierung/werkzeuge/neues-spiel.js spiele/mein-spiel` (3D: `--3d`), dann `node spiele/mein-spiel/tests/mein-spiel-test.js`. Weiter mit `SKILL.md` („Neues Spiel in 5 Schritten“).

## Claude.ai
Einstellungen → Fähigkeiten → Fähigkeit hochladen → die Zip-Datei wählen (je Skill einmal). Dort liest Claude das Handbuch; die Werkzeuge und Tests brauchen eine Umgebung mit Node und Chromium (wie Claude Code).

## Was die Werkzeuge brauchen
| Was | Wofür |
|---|---|
| Node 18 oder neuer | alle Werkzeuge und Tests |
| Playwright mit Chromium (`require('playwright')`, z. B. `npm i -D playwright && npx playwright install chromium`) | Tests, `modell.js`, `render.js` |
| python3 | Testserver (`python3 -m http.server`) |
| npm mit Netz (einmal) | 3D-Tests: Three.js 0.170.0 wird in den Temp-Ordner geholt (das CDN ist im Test umgeleitet) |
| ffmpeg mit aac und libmp3lame | nur `sounds.js` |

Die Spiele selbst brauchen nichts davon: reine ES-Module, kein Build, laufen direkt auf GitHub Pages.
