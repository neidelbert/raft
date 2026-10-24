# Paket 04: Baumaterial-Vorrat
Ziel: Jedes neue Feld kostet Material aus einem Vorrat; ohne genug Material kann nicht gebaut werden.
Gehört dazu:
- Vorrat mit den Materialien, die ein Feld kostet (vorläufig Holz und Plastik), als Zahlen gespeichert
- Anzeige des Vorrats am Bildschirmrand, solange der Bau-Modus offen ist
- Feld setzen zieht die Kosten ab; reicht der Vorrat nicht, sind die Vorschau-Felder grau und Tippen setzt nichts
- Hinweis, wenn Material fehlt (z. B. „Zu wenig Holz“)
- Einstellwerte:
  - Kosten pro Feld (vorläufig 2 Holz und 2 Plastik) – Wert für Lukas zum Testen
  - Start-Vorrat (vorläufig 4 Holz und 4 Plastik, reicht für 2 Felder) – Wert für Lukas zum Testen
- Schnittstelle „Material hinzufügen“, die später das Treibgut-Paket (Haken) benutzt; zum Testen ein Testschalter in der Konfigurationsdatei, der den Vorrat auffüllt
Gehört nicht dazu:
- Treibgut, Haken, Einsammeln (eigener Plan)
- Inventar mit Plätzen, Werkbank, Rezepte
- Material zurück beim Abreißen
Abhängig von: 03
Technik-Frage: keine
Fertig, wenn:
- Beim Start zeigt die Anzeige den Start-Vorrat aus der Konfigurationsdatei
- Nach einem gebauten Feld sinkt der Vorrat genau um die Kosten pro Feld
- Mit Start-Vorrat lassen sich genau 2 Felder bauen, danach sind alle Vorschau-Felder grau und Tippen ändert nichts
- Der Hinweis „Zu wenig …“ nennt das fehlende Material
- Der Vorrat wird nie negativ (20 schnelle Tipps hintereinander)
- Mit eingeschaltetem Testschalter ist wieder Bauen möglich
Testaufgabe: Auf dem iPhone Bau-Modus öffnen, 2 Felder bauen, Vorrat ablesen (0 Holz, 0 Plastik), drittes Feld antippen: nichts passiert, Hinweis erscheint.
Freigegeben:
