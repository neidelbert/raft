# Technische Schulden – Übung 9 (Assets)

| Was | Warum | Aufwand |
|---|---|---|
| Ob die `.m4a` am iPhone wirklich dekodiert und klingt, ist nicht geprüft (im Test-Chromium ja). Ebenso nicht: Stummschalter, Ton nach Anruf oder App-Wechsel. | Nur am echten Gerät prüfbar. | Tester am iPhone, 5 Minuten. |
| Atlas-Packen ist einfach (Regale nach Höhe). Der Atlas ist 248 × 1584 px, etwa 30 % sind leer (2,6 MB statt etwa 1,8 MB ausgepackter Speicher). | Für 22 Rahmen reicht das; ein besserer Packer wäre mehr Code ohne spürbaren Nutzen. | Mittel, erst wenn ein Spiel an die 2048-Grenze kommt. |
| Der Atlas ist PNG ohne Farbreduktion (221 KB). | Kein Paket für verlustbehaftete Kompression (z. B. pngquant) erlaubt ohne Rückfrage. | Klein mit pngquant; Technik-Entscheidung für Lukas. |
| Schriften: Der Baustein und sein Test können sie, die Übungsseite nutzt keine (Systemschrift). | Auftrag verlangt keine Schrift auf der Seite. | – |
| Am Rand läuft der Held mit Lauf-Animation „auf der Stelle“, solange der Daumen weiter drückt. | Verhalten am Rand steht nicht im Auftrag. | Klein: am Rand Steh-Animation. Frage an Lukas. |
| Die Ton-Einstellung (Knopf) wird nicht gespeichert, nach dem Neuladen ist der Ton wieder an. | Kein Speichern im Auftrag. | Klein mit `bausteine/speicher.js`. |
| `modell.html` lädt `boot.glb` über das Manifest und zeigt bei einem Fehler die Box; einen Ladebalken hat sie nicht. | Auftrag: nur das Boot drehend zeigen. | Klein. |
| Die Werkzeuge `sounds.js` und `modell.js` brauchen ffmpeg bzw. Playwright mit Chromium auf dem Rechner, auf dem die Assets erzeugt werden (nicht im Spiel). | So im Auftrag. Fehlt ffmpeg, meldet `sounds.js` das klar. | – |
| Der Test braucht etwa 70 s (vier Fälle mit hängendem oder fehlendem Server, jeder startet einen Browser; zwei warten je 4 s auf die Zeitgrenze). | Jeder Fall braucht frische Netz-Regeln. | Klein: Fälle mit fehlenden Dateien in einem Browser zusammenlegen, wenn es stört. |
