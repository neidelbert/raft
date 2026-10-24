# Paket 05: Floß und Vorrat automatisch speichern
Ziel: Form des Floßes und Material-Vorrat bleiben nach Schließen und erneutem Öffnen der Seite erhalten.
Gehört dazu:
- Automatisches Speichern nach jedem gebauten Feld und beim Verlassen oder Verstecken der Seite
- Beim Start: vorhandenen Spielstand laden, sonst Startfloß und Start-Vorrat aus der Konfigurationsdatei
- Ein Spielstand, mit Versionsnummer, damit spätere Pakete neue Felder mit Standardwerten ergänzen können
- Defekter oder fremder Spielstand: Spiel startet mit Startfloß statt abzustürzen
- Zum Testen: Schalter in der Konfigurationsdatei, der den Spielstand löscht
Gehört nicht dazu:
- Speichern von Figur-Position, Überlebenswerten, Hai, Treibgut
- Mehrere Spielstände, Cloud
Abhängig von: 04
Technik-Frage: Wo und wie wird gespeichert (z. B. localStorage im Browser) und wie heißt der Speicher-Schlüssel? Löscht Safari auf dem iPhone den Speicher nach einiger Zeit, und braucht es dagegen etwas?
Fertig, wenn:
- Floß auf 6 Felder in L-Form bauen, Seite neu laden: dieselben 6 Felder an denselben Stellen
- Vorrat nach dem Neuladen gleich wie vorher
- Safari ganz schließen und neu öffnen: Floß und Vorrat unverändert
- Spielstand von Hand durch ungültigen Text ersetzen: Spiel startet mit 2 × 2-Startfloß, keine Fehlermeldung, die das Spiel stoppt
- Löschen-Schalter an: nächster Start mit Startfloß und Start-Vorrat
Testaufgabe: Auf dem iPhone 3 Felder anbauen, Safari über den App-Umschalter schließen, Spiel wieder öffnen: Floß hat dieselbe Form, Vorrat stimmt.
Freigegeben:
