# Paket 03: Bau-Modus – Feld anbauen
Ziel: Der Spieler kann im Bau-Modus an freie Nachbarfelder des Floßes neue Felder setzen.
Gehört dazu:
- Bau-Knopf rechts (bei den Aktionsknöpfen) schaltet den Bau-Modus ein und aus
- Im Bau-Modus werden alle freien Felder, die an ein belegtes Feld grenzen (oben, unten, links, rechts, nicht schräg), als durchscheinende Vorschau angezeigt
- Tippen auf eine Vorschau setzt dort ein neues Feld; die Vorschau rundherum wird sofort neu berechnet
- Neue Felder wippen mit dem Floß mit und sind begehbar (wie Paket 02)
- Kurzer Bau-Sound (Effekt), Hinweis beim ersten Öffnen des Bau-Modus (z. B. „Tippe auf ein helles Feld, um anzubauen“)
- Einstellwert: größte Floßgröße in Feldern (vorläufig 400) – Wert für Lukas zum Testen
Gehört nicht dazu:
- Materialverbrauch (Paket 04)
- Felder abreißen oder verschieben
- Andere Bauteile (Wände, Böden in höheren Stockwerken)
- Bau-Rezepte freischalten
Abhängig von: 02
Technik-Frage: Wie wird das angetippte Feld bestimmt (Strahl von der Kamera ins Raster) und wie werden Tippen zum Bauen und Joystick-Berührung sauber getrennt?
Fertig, wenn:
- Bau-Knopf antippen: bei einem 2 × 2-Floß erscheinen genau 8 Vorschau-Felder; erneut antippen: alle verschwinden
- Tippen auf ein Vorschau-Feld setzt genau dort ein Feld; die Zahl der Platten steigt um 1
- Schräge Felder und Felder ohne Nachbarn sind nie als Vorschau sichtbar
- Ein Feld kann nicht doppelt gesetzt werden (zweimal tippen = nur 1 neue Platte)
- Joystick bewegen im Bau-Modus setzt kein Feld
- Bei erreichter Höchstgröße erscheinen keine Vorschau-Felder mehr
- Der Hinweis erscheint nur beim ersten Öffnen des Bau-Modus
- Figur kann jedes neu gebaute Feld betreten
Testaufgabe: Auf dem iPhone Bau-Modus öffnen, eine Reihe von 3 Feldern nach rechts anbauen, Bau-Modus schließen, mit der Figur bis zum letzten neuen Feld laufen.
Freigegeben:
